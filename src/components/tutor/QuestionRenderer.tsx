// QuestionRenderer — renders an HSK question's full-Hanzi surface.
//
// Requirement 2 (full-Hanzi question presentation) is the defining product
// constraint: the body, the reading text (when present), and every A–D answer
// choice must be rendered in Hanzi characters only. Selection already excludes
// non-Hanzi/invalid records, but this component applies the Hanzi guard again as
// defense in depth: if the question surface fails `assertQuestionSurfaceHanzi`,
// the component refuses to render any surface text and shows a safe notice instead.

import { motion } from 'framer-motion';
import type { Question } from '../../tutor/types';
import { assertQuestionSurfaceHanzi, isHanziOnly } from '../../tutor/validation';

export interface QuestionRendererProps {
  question: Question;
  /** Optional handler invoked with the chosen A–D label. Wired by TutorView (task 11.4). */
  onAnswer?: (label: 'A' | 'B' | 'C' | 'D') => void;
}

/** Brand color literals reused across the app for a consistent "juicy" style. */
const BRAND_BLUE = '#1CB0F6';

/**
 * Renders the question body, optional reading text, and A–D answer choices.
 * Refuses to display any surface text that fails the Hanzi-only guard.
 */
export function QuestionRenderer({ question, onAnswer }: QuestionRendererProps) {
  // Defense in depth (Requirement 2): never render a non-Hanzi question surface.
  if (!assertQuestionSurfaceHanzi(question)) {
    return (
      <div
        role="alert"
        className="rounded-2xl border-2 border-[#FF4B4B] bg-[#FFF0F0] p-4 text-[#EA2B2B]"
      >
        <p className="font-bold">Soal tidak dapat ditampilkan.</p>
        <p className="text-sm">
          Teks soal tidak memenuhi syarat tampilan Hanzi sepenuhnya.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Soal HSK"
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6"
    >
      {/* Reading text (Hanzi only), shown above the prompt when present. */}
      {question.readingText !== undefined && question.readingText.length > 0 && (
        <p
          lang="zh-Hans"
          className="rounded-xl bg-gray-50 p-3 text-lg leading-relaxed text-gray-800 sm:text-xl"
        >
          {question.readingText}
        </p>
      )}

      {/* Question body (Hanzi only). */}
      <h2
        lang="zh-Hans"
        className="text-2xl font-bold leading-snug text-[#111111] sm:text-3xl"
      >
        {question.body}
      </h2>

      {/* A–D answer choices as semantic buttons. */}
      <ul className="flex list-none flex-col gap-3" role="list">
        {question.choices.map((choice) => {
          // Per-string guard as additional defense in depth.
          if (!isHanziOnly(choice.hanzi)) return null;
          return (
            <li key={choice.label}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                onClick={() => onAnswer?.(choice.label)}
                aria-label={`Pilihan ${choice.label}: ${choice.hanzi}`}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-[#1CB0F6] hover:bg-[#F0FAFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CB0F6] active:translate-y-[2px]"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 font-bold text-white"
                  style={{ backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE }}
                >
                  {choice.label}
                </span>
                <span
                  lang="zh-Hans"
                  className="text-xl font-medium text-[#111111] sm:text-2xl"
                >
                  {choice.hanzi}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
