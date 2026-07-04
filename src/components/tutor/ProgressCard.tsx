import type { Progress } from '../../tutor/types';

interface ProgressCardProps {
  progress: Progress;
  /** Accuracy as a 0–100 number; rendered as a percentage (Requirement 8.4). */
  accuracy: number;
}

interface StatRowProps {
  label: string;
  value: string | number;
  accent: string;
}

/**
 * Renders the User Progress Card (Requirements 8.2, 8.3, 8.4).
 *
 * Shows the labels Name, Current Level, Correct, Wrong, Accuracy, and Streak
 * (Requirement 8.3) with the corresponding values from {@link Progress}
 * (Requirement 8.2). Accuracy is displayed as a percentage (Requirement 8.4).
 */
export function ProgressCard({ progress, accuracy }: ProgressCardProps) {
  const accuracyPercent = `${Math.round(accuracy)}%`;

  return (
    <section
      aria-label="Kartu Progres"
      className="rounded-3xl border-b-[6px] border-[#C29D00] bg-[#FFD100] p-4 text-[#111111] shadow-md sm:p-5"
    >
      <h3 className="mb-3 text-lg font-extrabold tracking-tight sm:text-xl">
        📊 Progres
      </h3>

      <dl className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatRow label="Name" value={progress.name} accent="bg-white" />
        <StatRow label="Current Level" value={`HSK ${progress.level}`} accent="bg-[#1CB0F6] text-white" />
        <StatRow label="Correct" value={progress.correct} accent="bg-[#58CC02] text-white" />
        <StatRow label="Wrong" value={progress.wrong} accent="bg-[#FF4B4B] text-white" />
        <StatRow label="Accuracy" value={accuracyPercent} accent="bg-white" />
        <StatRow label="Streak" value={`🔥 ${progress.streak}`} accent="bg-white" />
      </dl>
    </section>
  );
}

function StatRow({ label, value, accent }: StatRowProps) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-2xl px-3 py-2 ${accent}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </dt>
      <dd className="truncate text-base font-extrabold sm:text-lg">{value}</dd>
    </div>
  );
}
