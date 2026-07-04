import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2 } from 'lucide-react';
import { playPinyinTone, type PinyinTone } from '../utils/soundSynth';
import { useHaptic } from '../hooks/useHaptic';

// Initials (konsonan) grouped into "periodic" families with their own color.
const INITIAL_GROUPS: { name: string; color: string; initials: string[] }[] = [
  { name: 'Bibir', color: '#FF7B7B', initials: ['b', 'p', 'm', 'f'] },
  { name: 'Lidah', color: '#FFB23E', initials: ['d', 't', 'n', 'l'] },
  { name: 'Tenggorok', color: '#FFD100', initials: ['g', 'k', 'h'] },
  { name: 'Langit', color: '#58CC02', initials: ['j', 'q', 'x'] },
  { name: 'Retrofleks', color: '#1CB0F6', initials: ['zh', 'ch', 'sh', 'r'] },
  { name: 'Desis', color: '#A56EFF', initials: ['z', 'c', 's'] },
  { name: 'Semi-vokal', color: '#FF61C3', initials: ['y', 'w'] },
];

const FINALS = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
  'ie', 'er', 'an', 'en', 'in',
  'ang', 'eng', 'ing', 'ong',
];

// Diacritic tables for placing tone marks on the correct vowel.
const TONE_MARKS: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// Apply a tone mark (1-4) to a pinyin syllable following standard placement rules.
function applyTone(syllable: string, tone: PinyinTone): string {
  if (tone === 0) return syllable;

  let target = '';
  if (syllable.includes('a')) target = 'a';
  else if (syllable.includes('e')) target = 'e';
  else if (syllable.includes('ou')) target = 'o';
  else {
    // last vowel in the syllable
    for (let i = syllable.length - 1; i >= 0; i--) {
      if ('aoeiuü'.includes(syllable[i])) {
        target = syllable[i];
        break;
      }
    }
  }
  if (!target) return syllable;
  return syllable.replace(target, TONE_MARKS[target][tone]);
}

interface PinyinChartProps {
  open: boolean;
  onClose: () => void;
}

export function PinyinChart({ open, onClose }: PinyinChartProps) {
  const triggerHaptic = useHaptic();
  const [selected, setSelected] = useState<{ initial: string; final: string } | null>(null);

  const syllable = selected ? `${selected.initial}${selected.final}` : '';

  const handleCell = (initial: string, final: string) => {
    setSelected({ initial, final });
    triggerHaptic('light');
    playPinyinTone(1);
  };

  const playTone = (tone: PinyinTone) => {
    triggerHaptic('medium');
    playPinyinTone(tone);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-3xl sm:rounded-3xl sm:my-6 flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden border-2 border-black/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100 bg-[#FFD100]">
              <div>
                <h2 className="text-xl font-black text-[#111111] leading-none">Tabel Pinyin</h2>
                <p className="text-[11px] font-bold text-[#111111]/60 mt-1">
                  Ketuk sel untuk dengar nada. Baris = konsonan, kolom = vokal.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup tabel pinyin"
                className="bg-white/70 hover:bg-white text-black rounded-full p-2 border-2 border-black/10 active:translate-y-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100">
              {INITIAL_GROUPS.map((g) => (
                <span
                  key={g.name}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-600"
                >
                  <span
                    className="w-3 h-3 rounded-sm border border-black/10"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                </span>
              ))}
            </div>

            {/* Scrollable periodic grid */}
            <div className="flex-1 overflow-auto p-4">
              <table className="border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white" />
                    {FINALS.map((f) => (
                      <th
                        key={f}
                        className="text-[11px] font-black text-gray-500 px-1 pb-1 min-w-[44px]"
                      >
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_GROUPS.flatMap((group) =>
                    group.initials.map((initial) => (
                      <tr key={initial}>
                        <th
                          className="sticky left-0 z-10 text-sm font-black text-white rounded-lg px-2"
                          style={{ backgroundColor: group.color }}
                        >
                          {initial}
                        </th>
                        {FINALS.map((final) => {
                          const isSel =
                            selected?.initial === initial && selected?.final === final;
                          return (
                            <td key={final} className="p-0">
                              <button
                                onClick={() => handleCell(initial, final)}
                                className={`w-full min-w-[44px] h-9 rounded-lg text-[12px] font-bold transition-all border ${
                                  isSel
                                    ? 'ring-2 ring-black scale-105 text-black'
                                    : 'border-black/5 text-gray-700 hover:brightness-95 active:translate-y-0.5'
                                }`}
                                style={{
                                  backgroundColor: isSel
                                    ? group.color
                                    : `${group.color}22`,
                                }}
                              >
                                {initial}
                                {final}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail / tone player */}
            <div className="border-t-2 border-gray-100 p-4 bg-gray-50">
              {selected ? (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#111111] tabular-nums">
                      {syllable}
                    </span>
                    <span className="text-sm font-bold text-gray-400">
                      ketuk nada untuk dengar
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4] as PinyinTone[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => playTone(tone)}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#FFD100] active:translate-y-0.5 shadow-sm"
                      >
                        <span className="text-lg font-black text-[#111111] leading-none">
                          {applyTone(syllable, tone)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                          Nada {tone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-sm py-2">
                  <Volume2 className="w-5 h-5" />
                  Pilih kombinasi pinyin di atas untuk memainkan nadanya.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
