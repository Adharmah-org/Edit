import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Highlighter,
  Languages,
  Moon,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { ProtectedReadingSurface } from '../components/ProtectedReadingSurface';
import { ScrollProgressHairline } from '../components/ScrollProgressHairline';
import { useTranslation } from '../context/TranslationContext';
import { MIDNIGHT_EXCERPTS } from '../data/midnightExcerpts';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import type { MidnightExcerpt } from '../types/literary';

type SourceFilter = 'all' | MidnightExcerpt['sourceType'];

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All Highlights' },
  { key: 'poem', label: 'Poetry' },
  { key: 'book', label: 'Books' },
  { key: 'theatre', label: 'Theatre' },
  { key: 'journal', label: 'Journal' },
];

function renderHighlightedQuote(
  quote: string,
  highlightLine: string | undefined,
  enabled: boolean
): ReactNode {
  if (!enabled || !highlightLine) {
    return quote;
  }

  const idx = quote.indexOf(highlightLine);
  if (idx === -1) {
    return quote;
  }

  const before = quote.slice(0, idx);
  const match = quote.slice(idx, idx + highlightLine.length);
  const after = quote.slice(idx + highlightLine.length);

  return (
    <>
      {before}
      <mark className="inline rounded-sm bg-[#C9A45C]/18 px-1.5 py-0.5 text-[#FFF8EA] shadow-[inset_0_-1px_0_rgba(222,192,124,0.65)]">
        {match}
      </mark>
      {after}
    </>
  );
}

export function MidnightPage() {
  useDocumentMeta(
    'The Midnight Page — Featured Published Excerpts',
    'A quiet nocturnal sanctuary featuring rotating verbatim excerpts and literary highlights from the novels, plays, reflections, and poems of Tejas Purvesh Phirake.'
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const excerptId = searchParams.get('excerpt');
  const shouldReduceMotion = useReducedMotion();
  const spotlightRef = useRef<HTMLDivElement>(null);

  const initialIndex = useMemo(() => {
    if (excerptId) {
      const idx = MIDNIGHT_EXCERPTS.findIndex((e) => e.id === excerptId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [excerptId]);

  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!excerptId) return;
    const idx = MIDNIGHT_EXCERPTS.findIndex((e) => e.id === excerptId);
    if (idx >= 0) {
      setIndex(idx);
    }
  }, [excerptId]);
  const { langMode: translationMode, setLangMode: setTranslationMode } = useTranslation();
  const [showHighlights, setShowHighlights] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const current = MIDNIGHT_EXCERPTS[index] || MIDNIGHT_EXCERPTS[0];

  const activeQuote = useMemo(() => {
    if (translationMode === 'hi') return current.translations.hi;
    if (translationMode === 'en') return current.translations.en;
    return current.quote;
  }, [current, translationMode]);

  const activeHighlightLine = useMemo(() => {
    if (translationMode === 'hi') return current.translations.highlightLineHi;
    if (translationMode === 'en') return current.translations.highlightLineEn;
    return current.highlightLine;
  }, [current, translationMode]);

  const activeLanguageLabel = useMemo(() => {
    if (translationMode === 'hi') return 'हिंदी Translation';
    if (translationMode === 'en') return 'English Translation';
    return current.language;
  }, [current.language, translationMode]);

  const goTo = (nextIdx: number, scrollToSpotlight = false) => {
    const wrapped = (nextIdx + MIDNIGHT_EXCERPTS.length) % MIDNIGHT_EXCERPTS.length;
    setIndex(wrapped);
    const next = new URLSearchParams(searchParams);
    next.set('excerpt', MIDNIGHT_EXCERPTS[wrapped].id);
    setSearchParams(next);

    if (scrollToSpotlight && spotlightRef.current) {
      spotlightRef.current.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const pickRandom = () => {
    if (MIDNIGHT_EXCERPTS.length <= 1) return;
    let nextIdx = index;
    while (nextIdx === index) {
      nextIdx = Math.floor(Math.random() * MIDNIGHT_EXCERPTS.length);
    }
    goTo(nextIdx);
  };

  const toggleViceVersaTranslate = () => {
    if (translationMode === 'original') {
      // If original is already English, translate to Hindi first; otherwise translate to English first
      setTranslationMode(current.language === 'English' ? 'hi' : 'en');
      return;
    }
    // Toggle cleanly between Hindi <-> English
    setTranslationMode(translationMode === 'en' ? 'hi' : 'en');
  };

  const viceVersaLabel = useMemo(() => {
    if (translationMode === 'hi') return 'Switch to English';
    if (translationMode === 'en') return 'हिंदी में बदलें';
    return current.language === 'English'
      ? 'Translate → हिंदी'
      : 'Translate → English';
  }, [current.language, translationMode]);

  const filteredHighlights = useMemo(() => {
    return MIDNIGHT_EXCERPTS.map((item, originalIdx) => ({ item, originalIdx })).filter(
      ({ item }) => sourceFilter === 'all' || item.sourceType === sourceFilter
    );
  }, [sourceFilter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <ScrollProgressHairline />

      <header className="border-b border-[#2A223D] pb-8 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.26em] text-[#C9A45C]">
          <Moon className="h-3.5 w-3.5" />
          <span>Section 07 · Nocturnal Readings</span>
        </div>
        <h1 className="mt-3 font-literary text-4xl font-medium text-[#F3EFE6] headline-balance sm:text-5xl">
          The Midnight Page
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#C8C1D4]">
          Curated nocturnal highlights preserved verbatim from published novels, theatre
          scenes, author reflections, and poetry manuscripts—with instant Hindi &amp;
          English translation.
        </p>
      </header>

      {/* Main Protected Spotlight Card with Nocturnal Gold Aura */}
      <div ref={spotlightRef} className="relative mt-10 scroll-mt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-4 -inset-y-3 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(201,164,92,0.14),transparent_68%)] blur-xl"
        />

        <ProtectedReadingSurface showWatermark enableFocusVeil className="relative">
          <section className="relative overflow-hidden rounded-2xl border border-[#382C50] bg-[#120F1C]/95 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] sm:p-11">
            {/* Subtle top gold hairline highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A45C]/70 to-transparent"
            />

            {/* Meta + Highlight Tag Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A223D]/80 pb-4 text-xs">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {current.highlightTag && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#C9A45C]/40 bg-[#C9A45C]/12 px-2.5 py-1 text-[11px] font-medium text-[#DEC07C]">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{current.highlightTag}</span>
                  </span>
                )}
                <span className="uppercase tracking-[0.16em] text-[#C9A45C]">
                  {current.sourceType} · {activeLanguageLabel}
                  {current.pageLabel ? ` · ${current.pageLabel}` : ''}
                </span>
              </div>
              <span className="shrink-0 tabular-nums text-[#988FA8]">
                Highlight {index + 1} of {MIDNIGHT_EXCERPTS.length}
              </span>
            </div>

            {/* Translate & Highlight Controls Bar */}
            <div
              data-no-translate="true"
              className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#2A223D]/80 bg-[#0B0912]/80 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleViceVersaTranslate}
                  data-testid="midnight-translate-toggle"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#C9A45C]/55 bg-[#1B152A] px-3 text-xs font-medium text-[#DEC07C] transition-colors hover:border-[#DEC07C] hover:bg-[#231B36]"
                >
                  <Languages className="h-3.5 w-3.5 shrink-0" />
                  <span>{viceVersaLabel}</span>
                </button>

                <div
                  role="group"
                  aria-label="Passage language selector"
                  className="inline-flex items-center rounded-lg border border-[#2A223D] bg-[#09080E] p-0.5 text-[11px]"
                >
                  <button
                    type="button"
                    onClick={() => setTranslationMode('original')}
                    aria-pressed={translationMode === 'original'}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      translationMode === 'original'
                        ? 'bg-[#C9A45C] font-semibold text-[#09080E]'
                        : 'text-[#C8C1D4] hover:text-[#F3EFE6]'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranslationMode('hi')}
                    aria-pressed={translationMode === 'hi'}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      translationMode === 'hi'
                        ? 'bg-[#C9A45C] font-semibold text-[#09080E]'
                        : 'text-[#C8C1D4] hover:text-[#F3EFE6]'
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranslationMode('en')}
                    aria-pressed={translationMode === 'en'}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      translationMode === 'en'
                        ? 'bg-[#C9A45C] font-semibold text-[#09080E]'
                        : 'text-[#C8C1D4] hover:text-[#F3EFE6]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHighlights((v) => !v)}
                aria-pressed={showHighlights}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] transition-colors ${
                  showHighlights
                    ? 'border-[#C9A45C]/50 bg-[#C9A45C]/12 text-[#DEC07C]'
                    : 'border-[#2A223D] bg-[#09080E] text-[#988FA8] hover:text-[#C8C1D4]'
                }`}
              >
                <Highlighter className="h-3.5 w-3.5 shrink-0" />
                <span>{showHighlights ? 'Key Line Highlighted' : 'Highlight Key Line'}</span>
              </button>
            </div>

            {translationMode !== 'original' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#988FA8]">
                <span>
                  Showing {translationMode === 'hi' ? 'हिंदी' : 'English'} translation of
                  original ({current.language}) text
                </span>
                <button
                  type="button"
                  onClick={() => setTranslationMode('original')}
                  className="text-[#DEC07C] underline-offset-4 hover:underline"
                >
                  Back to Original
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={`${current.id}-${translationMode}`}
                data-no-translate="true"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: 'easeOut' }}
                className={`my-7 border-l-2 pl-4 sm:my-9 sm:pl-6 ${
                  showHighlights ? 'border-[#C9A45C]/75' : 'border-[#2A223D]'
                }`}
              >
                <pre className="devanagari-verse max-w-full whitespace-pre-wrap break-words font-literary text-xl leading-[1.9] text-[#F3EFE6] sm:text-2xl">
                  {renderHighlightedQuote(activeQuote, activeHighlightLine, showHighlights)}
                </pre>
              </motion.blockquote>
            </AnimatePresence>

            <div className="border-t border-[#2A223D]/80 pt-5">
              <p className="devanagari-verse text-sm font-medium text-[#DEC07C]">
                {current.sourceTitle}
              </p>
              <p className="mt-1 text-xs text-[#988FA8]">
                Tejas Purvesh Phirake · BENIYAAZ ROOH
              </p>
            </div>

            {/* Navigation Actions */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2A223D] bg-[#09080E] px-3.5 text-xs text-[#C8C1D4] hover:border-[#C9A45C]/60 hover:text-[#F3EFE6]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2A223D] bg-[#09080E] px-3.5 text-xs text-[#C8C1D4] hover:border-[#C9A45C]/60 hover:text-[#F3EFE6]"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={pickRandom}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2A223D] bg-[#09080E] px-3.5 text-xs text-[#DEC07C] hover:border-[#C9A45C]"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Another Page</span>
                </button>
              </div>

              <Link
                to={current.targetUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#C9A45C] px-4 text-xs font-semibold text-[#09080E] hover:bg-[#DEC07C]"
              >
                <span>Read in Context</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </ProtectedReadingSurface>
      </div>

      {/* Curated Midnight Highlights Grid */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2A223D] pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#C9A45C]">
              Preserved Spotlight Lines
            </p>
            <h2 className="mt-1.5 font-literary text-2xl font-medium text-[#F3EFE6] sm:text-3xl">
              Midnight Highlights Archive ({filteredHighlights.length})
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter midnight highlights by category"
            className="flex flex-wrap gap-1.5"
          >
            {SOURCE_FILTERS.map((filter) => {
              const isSelected = sourceFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSourceFilter(filter.key)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? 'border-[#C9A45C] bg-[#C9A45C]/16 font-medium text-[#DEC07C]'
                      : 'border-[#2A223D] bg-[#120F1C]/60 text-[#988FA8] hover:border-[#3A2E54] hover:text-[#F3EFE6]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredHighlights.map(({ item, originalIdx }) => {
            const isActive = originalIdx === index;
            const previewLine =
              translationMode === 'hi'
                ? item.translations.highlightLineHi || item.translations.hi
                : translationMode === 'en'
                  ? item.translations.highlightLineEn || item.translations.en
                  : item.highlightLine || item.quote;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(originalIdx, true)}
                className={`group relative flex min-w-0 flex-col justify-between rounded-xl border p-5 text-left transition-all ${
                  isActive
                    ? 'border-[#C9A45C]/80 bg-[#1A1527] shadow-[0_0_28px_rgba(201,164,92,0.12)]'
                    : 'border-[#2A223D] bg-[#120F1C]/65 hover:border-[#C9A45C]/45 hover:bg-[#161224]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#C9A45C]">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span>{item.highlightTag || item.sourceType}</span>
                    </span>
                    <span className="tabular-nums text-[#988FA8]">
                      #{originalIdx + 1} · {item.language}
                    </span>
                  </div>

                  <p
                    data-no-translate="true"
                    className="devanagari-verse mt-3 border-l-2 border-[#C9A45C]/55 pl-3 font-literary text-base leading-relaxed text-[#F3EFE6] sm:text-lg"
                  >
                    “{previewLine}”
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#2A223D]/70 pt-3">
                  <div className="min-w-0">
                    <p
                      className={`devanagari-verse truncate text-xs font-medium ${
                        isActive ? 'text-[#DEC07C]' : 'text-[#C8C1D4]'
                      }`}
                    >
                      {item.sourceTitle}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.12em] text-[#988FA8]">
                      {item.sourceType}
                      {item.pageLabel ? ` · ${item.pageLabel}` : ''}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#988FA8] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#DEC07C]" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
