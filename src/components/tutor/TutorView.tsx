// TutorView — the presentation shell for the HSK Master AI tutor.
//
// This is the single React surface that wires the pure tutor engine (via the
// Zustand `useTutorStore`) to the screen. It:
//   - kicks off the conversation once on mount (dispatches `start`),
//   - renders the ordered `responseBlocks` array in array order so the
//     User Progress Card — always appended last by the engine — naturally
//     renders at the end of every response (Requirement 8.1),
//   - renders the right interactive input UI for the current `state.phase`
//     (name capture, level selection, answer buttons), and
//   - dispatches learner events back through the store.
//
// Requirements covered: 8.1 (progress card always last), 9.1 (present a
// question after onboarding), 9.2 (wait for the answer), 9.3 (result →
// explanation → vocab → progress order is preserved by rendering in order),
// 9.4 (offer continue / change level / stop).
//
// Per project convention, only transient view state (the in-progress name
// input) lives as local `useState`; all durable state is owned by the store.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { useTutorStore } from '../../store/useTutorStore';
import { useHaptic } from '../../hooks/useHaptic';
import { playSound } from '../../utils/soundSynth';
import type { HskLevel, Phase, ResponseBlock } from '../../tutor/types';
import { QuestionRenderer } from './QuestionRenderer';
import { VocabularyTable } from './VocabularyTable';
import { ProgressCard } from './ProgressCard';

/** Brand color literals reused across the app for a consistent "juicy" style. */
const BRAND_YELLOW = '#FFD100';
const BRAND_GREEN = '#58CC02';
const BRAND_BLUE = '#1CB0F6';
const BRAND_RED = '#FF4B4B';

const HSK_LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6];

export function TutorView() {
  const { state, responseBlocks, dispatch } = useTutorStore();
  const triggerHaptic = useHaptic();

  // Kick off the conversation exactly once when the session hasn't started yet
  // (fresh `greeting` phase with no blocks rendered). A ref guards against the
  // double-invocation of effects under React 19 StrictMode in development.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    if (state.phase === 'greeting' && responseBlocks.length === 0) {
      startedRef.current = true;
      dispatch({ kind: 'start' });
    }
  }, [state.phase, responseBlocks.length, dispatch]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-8">
      <header className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
          🐼 HSK Master
        </h1>
        <p className="text-sm text-gray-500">Tutor AI Bahasa Mandarin</p>
      </header>

      {/* Conversation transcript: render every block in array order so the
          progress card (appended last by the engine) renders at the end. */}
      <main className="flex flex-col gap-4" aria-live="polite">
        {responseBlocks.map((block, index) => (
          <BlockView
            key={index}
            block={block}
            onAnswer={(label) => {
              playSound('click');
              triggerHaptic('light');
              dispatch({ kind: 'submitAnswer', answer: label });
            }}
            onContinue={() => {
              playSound('whoosh');
              triggerHaptic('medium');
              dispatch({ kind: 'continue' });
            }}
            onChangeLevel={() => {
              playSound('click');
              triggerHaptic('light');
              dispatch({ kind: 'changeLevel' });
            }}
            onStop={() => {
              playSound('click');
              triggerHaptic('medium');
              dispatch({ kind: 'stop' });
            }}
          />
        ))}
      </main>

      {/* Phase-driven input UI. */}
      <PhaseInput
        phase={state.phase}
        onSubmitName={(name) => dispatch({ kind: 'submitName', name })}
        onSubmitLevel={(level) => dispatch({ kind: 'submitLevel', level })}
        onRestart={() => dispatch({ kind: 'start' })}
      />
    </div>
  );
}

interface BlockViewProps {
  block: ResponseBlock;
  onAnswer: (label: 'A' | 'B' | 'C' | 'D') => void;
  onContinue: () => void;
  onChangeLevel: () => void;
  onStop: () => void;
}

/** Renders a single response block according to its `kind`. */
function BlockView({
  block,
  onAnswer,
  onContinue,
  onChangeLevel,
  onStop,
}: BlockViewProps) {
  switch (block.kind) {
    case 'message':
      return (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p lang="zh-Hans" className="text-lg font-semibold text-[#111111]">
            {block.mandarin}
          </p>
          <p className="mt-1 text-sm text-gray-600">{block.indonesian}</p>
        </div>
      );

    case 'question':
      return <QuestionRenderer question={block.question} onAnswer={onAnswer} />;

    case 'result':
      return block.correct ? (
        <div
          role="status"
          className="rounded-2xl border-2 border-[#58CC02] bg-[#E8FFD7] p-4 font-bold text-[#3C8500]"
          style={{ borderColor: BRAND_GREEN }}
        >
          ✅ Benar! Kerja bagus.
        </div>
      ) : (
        <div
          role="status"
          className="rounded-2xl border-2 bg-[#FFF0F0] p-4 font-bold text-[#EA2B2B]"
          style={{ borderColor: BRAND_RED }}
        >
          ❌ Belum tepat.
          {block.correctAnswer !== undefined && (
            <span className="ml-1 font-normal text-[#111111]">
              Jawaban yang benar: <strong>{block.correctAnswer}</strong>
            </span>
          )}
        </div>
      );

    case 'explanation':
      return (
        <div className="rounded-2xl bg-[#F0FAFF] p-4 text-[#111111]">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-[#1CB0F6]">
            Penjelasan
          </p>
          <p className="leading-relaxed text-gray-800">{block.text}</p>
        </div>
      );

    case 'vocabTable':
      return (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Kosakata
          </p>
          <VocabularyTable entries={block.entries} />
        </div>
      );

    case 'progressCard':
      return <ProgressCard progress={block.progress} accuracy={block.accuracy} />;

    case 'offer':
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          {block.options.includes('continue') && (
            <OfferButton
              label="Lanjut"
              color={BRAND_GREEN}
              onClick={onContinue}
            />
          )}
          {block.options.includes('changeLevel') && (
            <OfferButton
              label="Ganti Level"
              color={BRAND_BLUE}
              onClick={onChangeLevel}
            />
          )}
          {block.options.includes('stop') && (
            <OfferButton label="Berhenti" color={BRAND_RED} onClick={onStop} />
          )}
        </div>
      );

    case 'error':
      return (
        <div
          role="alert"
          className="rounded-2xl border-2 bg-[#FFF0F0] p-4 font-semibold text-[#EA2B2B]"
          style={{ borderColor: BRAND_RED }}
        >
          {block.text}
        </div>
      );
  }
}

interface OfferButtonProps {
  label: string;
  color: string;
  onClick: () => void;
}

function OfferButton({ label, color, onClick }: OfferButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 600, damping: 25 }}
      onClick={onClick}
      className="flex-1 rounded-2xl px-4 py-3 text-base font-extrabold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-[2px]"
      style={{ backgroundColor: color, outlineColor: color }}
    >
      {label}
    </motion.button>
  );
}

interface PhaseInputProps {
  phase: Phase;
  onSubmitName: (name: string) => void;
  onSubmitLevel: (level: number) => void;
  onRestart: () => void;
}

/** Renders the interactive input affordance appropriate to the current phase. */
function PhaseInput({
  phase,
  onSubmitName,
  onSubmitLevel,
  onRestart,
}: PhaseInputProps) {
  const [name, setName] = useState('');
  const triggerHaptic = useHaptic();

  switch (phase) {
    case 'askName':
      return (
        <form
          className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            playSound('click');
            triggerHaptic('light');
            onSubmitName(name);
            setName('');
          }}
        >
          <label htmlFor="tutor-name" className="sr-only">
            Nama Anda
          </label>
          <input
            id="tutor-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama Anda…"
            autoComplete="given-name"
            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-base text-[#111111] focus-visible:border-[#1CB0F6] focus-visible:outline-none"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            className="rounded-xl px-5 py-3 text-base font-extrabold text-white shadow-md active:translate-y-[2px]"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            Kirim
          </motion.button>
        </form>
      );

    case 'askLevel':
      return (
        <fieldset className="rounded-2xl bg-white p-4 shadow-sm">
          <legend className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-gray-500">
            Pilih Level HSK
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {HSK_LEVELS.map((level) => (
              <motion.button
                key={level}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                onClick={() => {
                  playSound('click');
                  triggerHaptic('light');
                  onSubmitLevel(level);
                }}
                aria-label={`HSK level ${level}`}
                className="rounded-xl border-b-4 border-[#C29D00] py-3 text-lg font-extrabold text-[#111111] shadow-sm active:translate-y-[2px]"
                style={{ backgroundColor: BRAND_YELLOW }}
              >
                {level}
              </motion.button>
            ))}
          </div>
        </fieldset>
      );

    case 'closed':
      return (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playSound('whoosh');
            triggerHaptic('medium');
            onRestart();
          }}
          className="rounded-2xl px-4 py-3 text-base font-extrabold text-white shadow-md active:translate-y-[2px]"
          style={{ backgroundColor: BRAND_BLUE }}
        >
          Mulai lagi
        </motion.button>
      );

    // awaitingAnswer relies on the rendered question's choice buttons; the
    // remaining phases are transient and need no extra input UI.
    default:
      return null;
  }
}
