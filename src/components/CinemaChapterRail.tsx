import { CHAPTER_META } from '../app/store';
import type { ChapterId } from '../safety/types';

interface CinemaChapterRailProps {
  currentChapter: ChapterId;
  onSelectChapter: (chapter: ChapterId) => void;
}

/**
 * Quiet desktop-only right-edge cinema reel index showing continuous position across Acts 0–V.
 * Hidden below 2xl/xl overlap thresholds so content never gets obscured.
 */
export function CinemaChapterRail({ currentChapter, onSelectChapter }: CinemaChapterRailProps) {
  return (
    <aside
      aria-label="影片章节进度标尺"
      className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-2.5 2xl:flex"
    >
      {CHAPTER_META.map((item) => {
        const active = item.id === currentChapter;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectChapter(item.id)}
            aria-label={`滚动至 ${item.actCode} ${item.zhTitle}`}
            aria-current={active ? 'location' : undefined}
            className="group flex items-center gap-2 py-0.5 text-right"
          >
            <span
              className={`font-mono-tabular text-[10px] transition-opacity duration-200 ${
                active
                  ? 'text-[#D99A45] opacity-100'
                  : 'text-[#84909B] opacity-0 group-hover:opacity-100'
              }`}
            >
              {item.actCode}
            </span>
            <span
              aria-hidden="true"
              className={`block h-[2px] transition-all duration-200 ${
                active
                  ? 'w-7 bg-[#D99A45]'
                  : 'w-3 bg-[#B8C1C8]/30 group-hover:w-5 group-hover:bg-[#B8C1C8]/70'
              }`}
            />
          </button>
        );
      })}
    </aside>
  );
}
