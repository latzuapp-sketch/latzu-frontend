// SM-2 spaced repetition algorithm (frontend mirror of the backend)

export type ReviewQuality = 1 | 2 | 3 | 4; // Again / Hard / Good / Easy

const Q_MAP: Record<ReviewQuality, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };

export function sm2(
  easeFactor: number,
  reps: number,
  interval: number,
  quality: ReviewQuality
): { easeFactor: number; reps: number; interval: number; dueDate: string } {
  const q = Q_MAP[quality];

  let newInterval: number;
  let newReps: number;
  let newEf: number;

  if (q >= 3) {
    if (reps === 0) newInterval = 1;
    else if (reps === 1) newInterval = 6;
    else newInterval = Math.round(interval * easeFactor);
    newReps = reps + 1;
    newEf = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    newInterval = 1;
    newReps = 0;
    newEf = easeFactor - 0.2;
  }

  newEf = Math.max(1.3, newEf);

  const due = new Date();
  due.setDate(due.getDate() + newInterval);

  return {
    easeFactor: newEf,
    reps: newReps,
    interval: newInterval,
    dueDate: due.toISOString(),
  };
}

export function isDue(dueDate: string): boolean {
  return new Date(dueDate) <= new Date();
}

export function daysUntilDue(dueDate: string): number {
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function qualityLabel(q: ReviewQuality): string {
  return { 1: "Otra vez", 2: "Difícil", 3: "Bien", 4: "Fácil" }[q];
}

export function qualityColor(q: ReviewQuality): string {
  return {
    1: "text-red-400 border-red-500/30 bg-red-500/10",
    2: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    3: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    4: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  }[q];
}
