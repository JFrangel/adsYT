import { useState, useEffect, useRef } from 'react';

interface TimerButtonProps {
  duration: number;
  onComplete: () => void;
  label?: string;
  completedLabel?: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerButton({
  duration,
  onComplete,
  label = 'Desbloquear',
  completedLabel = 'Desbloqueado',
}: TimerButtonProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsCompleted(true);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = (duration - timeLeft) / duration;

  if (!isRunning && !isCompleted) {
    return (
      <button onClick={() => setIsRunning(true)} className="btn-primary text-lg px-10 py-4 w-full sm:w-auto">
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 fade-in">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6"
            className="stroke-white/10"
          />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6" strokeLinecap="round"
            className={isCompleted ? 'stroke-green-500' : 'stroke-primary'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 150ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isCompleted ? (
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-3xl font-semibold tabular-nums text-white">{timeLeft}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-500">
        {isCompleted ? completedLabel : 'Desbloqueando…'}
      </p>
    </div>
  );
}
