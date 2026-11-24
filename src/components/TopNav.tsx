import { useState } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';
import { CHAPTER_META } from '../app/store';
import type { ChapterId } from '../safety/types';

interface TopNavProps {
  currentChapter: ChapterId;
  scrollProgress?: number;
  onSelectChapter: (chapter: ChapterId) => void;
  onOpenEvidence: () => void;
}

/**
 * Strict 3-zone Top Bar Contract:
 * [Brand wordmark] — [Single-line chapter links] — [1 primary action]
 */
export function TopNav({
  currentChapter,
  scrollProgress = 0,
  onSelectChapter,
  onOpenEvidence,
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (chapter: ChapterId) => {
    setMobileMenuOpen(false);
    onSelectChapter(chapter);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#B8C1C8]/14 bg-[#0A0E13]/96">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('act-0')}
          className="font-display-track shrink-0 whitespace-nowrap text-sm font-semibold text-[#F2EFE7] transition-colors hover:text-[#D99A45]"
          aria-label="返回 ACT 0 觉醒封面"
        >
          BEYOND GRAVITY
        </button>

        {/* Zone 2: Clean single-line chapter navigation */}
        <nav aria-label="六幕章节导航" className="hidden items-center gap-6 md:flex">
          {CHAPTER_META.map((item) => {
            const active = currentChapter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative shrink-0 whitespace-nowrap py-1 text-sm transition-colors duration-200 ${
                  active
                    ? 'font-medium text-[#F2EFE7]'
                    : 'text-[#84909B] hover:text-[#B8C1C8]'
                }`}
              >
                <span className="font-mono-tabular mr-1.5 text-xs text-[#84909B]">{item.actCode}</span>
                {' '}
                <span>{item.shortLabel}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-[2px] bg-[#D99A45]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action (+ compact mobile menu button on <md) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenEvidence}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-[#B8C1C8]/25 bg-[#11161E] px-3.5 py-1.5 text-xs font-medium text-[#F2EFE7] transition-colors duration-200 hover:border-[#D99A45] hover:text-[#D99A45]"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>证据与来源</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? '关闭章节菜单' : '打开章节菜单'}
            className="inline-flex h-9 w-9 items-center justify-center border border-[#B8C1C8]/20 text-[#B8C1C8] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile collapsible chapter rail (keeps mobile sticky header compact) */}
      {mobileMenuOpen && (
        <nav
          aria-label="移动端章节导航"
          className="border-t border-[#B8C1C8]/14 bg-[#0D1219] px-4 py-3 md:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {CHAPTER_META.map((item) => {
              const active = currentChapter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between border px-3 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'border-[#D99A45] bg-[#171E28] font-medium text-[#F2EFE7]'
                      : 'border-[#B8C1C8]/12 bg-[#11161E] text-[#B8C1C8]'
                  }`}
                >
                  <span className="font-mono-tabular text-[11px] text-[#84909B]">{item.actCode}</span>
                  <span>{item.zhTitle}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
      {/* Continuous film-reel scroll progress hairline (compositor-only transform, zero added height) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[#B8C1C8]/10"
      >
        <div
          className="h-full origin-left bg-[#D99A45]/85 transition-transform duration-75"
          style={{ transform: `scaleX(${Math.max(0, Math.min(1, scrollProgress))})` }}
        />
      </div>
    </header>
  );
}
