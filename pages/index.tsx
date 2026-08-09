import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TimerButton from '@/components/TimerButton';
import { FireIcon, LockIcon, AnnouncementIcon, ArrowIcon } from '@/components/Icons';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [canContinue, setCanContinue] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Always start with button disabled - user must complete timer each time
    setIsChecking(false);
  }, []);

  const handleTimerComplete = async () => {
    try {
      await fetch('/api/session/start', { method: 'POST' });
      setCanContinue(true);
    } catch (error) {
      console.error('Failed to start secure session', error);
      // Fallback in case of network issue - still allow them so UI doesn't break
      setCanContinue(true);
    }
  };

  const handleContinue = () => {
    router.push('/entry2');
  };

  return (
    <>
      <Head>
        <title>Free Fire - archivos</title>
      </Head>
      
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Symmetric ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
        </div>
        
        <div className="card max-w-2xl w-full relative z-10 animate-fade-in flex flex-col items-center">
          <div className="text-center mb-8 sm:mb-10 w-full">
            <div className="inline-block animate-float">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 sm:mb-4">
                <span className="gradient-text flex items-center justify-center gap-2 sm:gap-3">
                  <FireIcon className="w-10 h-10 sm:w-14 sm:h-14 text-orange-500" animate />
                  Free Fire
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-xl text-gray-400 font-medium px-4 mt-2">
              Desbloquea archivos exclusivos en 3 pasos
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-gray-400"></div>
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-gray-400"></div>
            </div>
          </div>

          <div className="mb-8">
            <TimerButton
              duration={8}
              onComplete={handleTimerComplete}
              label="Desbloquear"
              completedLabel="Desbloqueado"
              showIcons
            />
          </div>

          {/* Ad Container */}
          <div className="ad-container mb-6 sm:mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="text-purple-200 flex items-start gap-3">
               
              <div className="w-full">
                <p className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Anuncio</p>
                <div className="mt-4 sm:mt-6">
                  <HighPerformanceAd className="bg-gradient-to-r from-gray-800/50 to-purple-900/50 rounded-xl border border-gray-700/50" />
                </div>
              </div>
            </div>
          </div>

          {!isChecking && (
            <div className="text-center animate-fade-in">
              <button 
                onClick={handleContinue} 
                disabled={!canContinue}
                className={`text-lg sm:text-xl lg:text-2xl font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl transition-all duration-300 transform group w-full sm:w-auto flex items-center justify-center gap-2 ${
                  !canContinue 
                    ? 'bg-white/5 text-purple-200 border border-white/10 opacity-50 cursor-not-allowed hover:scale-100' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105'
                }`}
              >
                {canContinue ? (
                  <>
                    Continuar a Paso 2
                    <ArrowIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
                  </>
                ) : (
                  <>
                    <LockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Completa el timer para continuar
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 sm:mt-8 text-center">
            <div className="inline-flex items-center gap-2 glass-card px-4 sm:px-6 py-2 sm:py-3">
              <span className="text-purple-400 font-bold text-sm sm:text-base">Paso 1</span>
              <span className="text-purple-300 text-sm sm:text-base">de 3</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
