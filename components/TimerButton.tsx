import { useState, useEffect } from 'react';
import { UnlockIcon, CheckIcon, TimerIcon } from './Icons';

interface TimerButtonProps {
  duration: number;
  onComplete: () => void;
  label?: string;
  completedLabel?: string;
  showIcons?: boolean;
}

export default function TimerButton({ 
  duration, 
  onComplete, 
  label = 'Desbloquear',
  completedLabel = 'Continuar',
  showIcons = false
}: TimerButtonProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const handleClick = () => {
    if (!isRunning && !isCompleted) {
      setIsRunning(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      <button
        onClick={handleClick}
        disabled={isRunning || isCompleted}
        className={`btn-primary text-lg sm:text-xl lg:text-2xl min-w-[240px] sm:min-w-[280px] w-full sm:w-auto relative overflow-hidden group flex items-center justify-center gap-2 sm:gap-3 ${
          isCompleted ? '!bg-gradient-to-r !from-green-500 !to-emerald-600 glow' : ''
        }`}
      >
        {showIcons && (
          isCompleted ? (
            <CheckIcon className="w-6 h-6 sm:w-7 sm:h-7" animate />
          ) : isRunning ? (
            <TimerIcon className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
          ) : (
            <UnlockIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          )
        )}
        <span className="relative z-10">
          {isCompleted ? completedLabel : isRunning ? `${timeLeft}s` : label}
        </span>
        {!isCompleted && !isRunning && (
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        )}
      </button>
      
      {isRunning && (
        <div className="glass-card px-4 sm:px-6 py-2 sm:py-3 animate-fade-in w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-4 border-purple-500 border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
            </div>
            <span className="text-purple-200 font-semibold text-sm sm:text-base">Desbloqueando en {timeLeft} segundos...</span>
          </div>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
