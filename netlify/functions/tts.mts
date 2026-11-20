import { GoogleGenAI } from '@google/genai';
import { BASE_POEMS_CATALOG } from '../../src/data/poemsIndex.ts';

declare const Netlify:
  | {
      env: {
        get(key: string): string | undefined;
      };
    }
  | undefined;

function readEnv(key: string): string | undefined {
  const fromNetlify =
    typeof Netlify !== 'undefined' ? Netlify.env.get(key) : undefined;
  const cleaned = (fromNetlify ?? process.env[key])
    ?.trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  return cleaned || undefined;
}

export const config = {
  path: '/api/tts',
  method: ['POST'],
};

export default async (req: Request) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      poemId?: string;
      voiceGender?: string;
    };
    const poemId = String(body.poemId || '').trim();
    const voiceGender = body.voiceGender === 'female' ? 'female' : 'male';
    const voiceName = voiceGender === 'female' ? 'Kore' : 'Charon';

    if (!poemId) {
      return Response.json(
        { error: 'Poem identifier is required.' },
        { status: 400 }
      );
    }

    const poem = BASE_POEMS_CATALOG.find(
      (p) => p.published && (p.id === poemId || p.slug === poemId)
    );
    if (!poem) {
      return Response.json(
        { error: 'Published poem not found.' },
        { status: 404 }
      );
    }

    const customGoogleKey = readEnv('GOOGLE_API_KEY');
    const geminiKey = readEnv('GEMINI_API_KEY');
    const apiKey = customGoogleKey || geminiKey;

    if (!apiKey) {
      return Response.json(
        {
          error:
            'Audio narration is not configured on Netlify yet. Add your GEMINI_API_KEY in Netlify Environment variables (Functions scope) and redeploy.',
        },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        ...(customGoogleKey
          ? { baseUrl: 'https://generativelanguage.googleapis.com' }
          : {}),
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBody = poem.body.trim();
    const styleDirection =
      poem.language === 'English'
        ? 'Warm, calm, intimate nocturnal poetry reading with gentle cadence and thoughtful stanza pauses.'
        : 'Warm, calm, intimate nocturnal Indian poetry recitation with natural Marathi and Hindi pronunciation, expressive emotional depth, and soft pauses between stanzas.';

    const scriptText = `${poem.title}.\n\n${cleanBody}`;

    const invokeTts = async (modelName: string) =>
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: scriptText,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                speechMetadata: { style: styleDirection } as any,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

    let response;
    try {
      response = await invokeTts('gemini-3.8-flash-lite-tts');
    } catch (primaryErr: unknown) {
      const msg =
        primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      if (msg.includes('NOT_FOUND') || msg.includes('404')) {
        response = await invokeTts('gemini-3.8-flash-tts');
      } else {
        throw primaryErr;
      }
    }

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Voice synthesis returned empty audio payload.');
    }

    return Response.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      voiceGender,
      voiceName,
      cached: false,
    });
  } catch (err: unknown) {
    const raw =
      err instanceof Error ? err.message : 'Unable to generate voice recitation.';
    if (raw.includes('unable to find suitable provider')) {
      return Response.json(
        {
          error:
            'Netlify AI Gateway does not support Gemini TTS voice models yet. To enable Audio Corner on Netlify, add your own GEMINI_API_KEY (from Google AI Studio) in Netlify Project configuration → Environment variables (Functions scope) and redeploy.',
        },
        { status: 503 }
      );
    }
    return Response.json({ error: raw }, { status: 502 });
  }
};
