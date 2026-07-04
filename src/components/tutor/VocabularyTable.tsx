import type { VocabEntry } from '../../tutor/types';

interface VocabularyTableProps {
  entries: VocabEntry[];
}

/**
 * Renders the Hanzi Vocabulary Table shown after a question is answered.
 *
 * Columns are rendered in this exact, fixed order (Requirements 5.2, 5.4):
 *   Hanzi, Pinyin, Meaning (Indonesian), HSK Level
 *
 * Every entry populates all four columns.
 */
export function VocabularyTable({ entries }: VocabularyTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm sm:text-base">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">
              Hanzi
            </th>
            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">
              Pinyin
            </th>
            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">
              Meaning (Indonesian)
            </th>
            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">
              HSK Level
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr
              key={`${entry.hanzi}-${index}`}
              className="border-b border-slate-100 last:border-b-0"
            >
              <td className="px-3 py-2 text-lg font-medium text-slate-900">
                {entry.hanzi}
              </td>
              <td className="px-3 py-2 text-slate-700">{entry.pinyin}</td>
              <td className="px-3 py-2 text-slate-700">{entry.meaningId}</td>
              <td className="px-3 py-2 text-slate-700">{entry.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
