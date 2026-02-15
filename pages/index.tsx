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

  const handleTimerComplete = () => {
    localStorage.setItem('entry1_completed', 'true');
    setCanContinue(true);
  };

  const handleContinue = () => {
    router.push('/entry2');
  };

  return (
    <>
      <Head>
        <title>Free Fire - archivos</title>
      </Head>
      
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-56 sm:w-96 h-56 sm:h-96 bg-pink-500/30 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-48 sm:w-80 h-48 sm:h-80 bg-orange-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="card max-w-3xl w-full relative z-10 animate-fade-in">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block animate-float">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 sm:mb-4">
                <span className="gradient-text flex items-center justify-center gap-2 sm:gap-3">
                  <FireIcon className="w-10 h-10 sm:w-14 sm:h-14 text-orange-500" animate />
                  Free Fire
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-xl text-purple-200 font-medium px-4">
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
                className={`btn-secondary text-lg sm:text-xl lg:text-2xl group w-full sm:w-auto flex items-center justify-center gap-2 ${
                  !canContinue ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
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
