import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckIcon, AnnouncementIcon, LockIcon } from '@/components/Icons';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import Head from 'next/head';

export default function Entry2() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll the heartbeat API instead of sessionStorage
  useEffect(() => {
    if (!mounted) return;

    let errorCount = 0;
    const check = async () => {
      try {
        const response = await fetch('/api/ad/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !document.hidden })
        });
        
        const data = await response.json();
        if (data.completed) {
          setCanContinue(true);
        }
      } catch (error) {
        console.error('Heartbeat check failed:', error);
        errorCount++;
        // If we fail > 5 times, there might be adblockers blocking the fetch, so we might need a fallback,
        // but since this is anti-cheat, we'll keep strict.
      }
    };

    check(); // check immediately on mount
    const interval = setInterval(check, 1000); // 1s sync
    return () => clearInterval(interval);
  }, [mounted]);

  const handleVisitAd = () => {
    // Navigate to the verification/redirect page
    router.push('/ad-visit');
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push('/entry3');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 2 - Ver Anuncio | Free Fire Portal</title>
      </Head>

      <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Symmetric ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
        </div>

        <div className="card w-full max-w-2xl text-center space-y-6 animate-fade-in relative z-10 flex flex-col items-center">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 w-full mb-2">
            <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              <CheckIcon className="w-4 h-4" />
            </span>
            <span className="w-10 h-0.5 bg-gradient-to-r from-green-500 to-primary"></span>
            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(255,107,53,0.3)]">2</span>
            <span className="w-10 h-0.5 bg-gray-700"></span>
            <span className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-xs font-bold">3</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black gradient-text flex items-center justify-center gap-3">
            <AnnouncementIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            Paso 2: Ver Anuncio
          </h1>

          <p className="text-gray-400 text-sm sm:text-lg max-w-md mx-auto">
            Para continuar, debes ver un anuncio durante <strong className="text-primary glow:text-white transition cursor-default">10 segundos</strong>.
            Haz clic en el botón de abajo para comenzar.
          </p>

          {/* Ad before status */}
          <div className="pt-4 w-full">
            <div className="ad-container bg-dark-900 border-white/5 mx-auto max-w-xl">
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-bold">Patrocinado</p>
              <div className="w-full relative shadow-inner">
                <HighPerformanceAd />
              </div>
            </div>
          </div>

          {/* Status message */}
          {canContinue ? (
            <div className="w-full flex justify-center mt-2">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 w-full max-w-md animate-fade-in flex items-center gap-4">
                <CheckIcon className="w-8 h-8 text-green-400 flex-shrink-0" animate />
                <div className="text-left">
                  <p className="text-green-400 font-semibold text-lg">¡Anuncio completado!</p>
                  <p className="text-green-300/80 text-sm">Ya puedes continuar al siguiente paso.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center mt-2">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 w-full max-w-md">
                <p className="text-primary/90 text-sm flex items-center justify-center gap-2">
                  <LockIcon className="w-4 h-4" />
                  Visualiza el anuncio para desbloquear el siguiente paso.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center w-full gap-4 mt-4">
            {!canContinue && (
              <button
                onClick={handleVisitAd}
                className="btn-primary w-full max-w-md"
              >
                Ver Anuncio
              </button>
            )}

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full max-w-md group py-3 sm:py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                !canContinue 
                  ? 'bg-dark-800 text-white border border-white/10 opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-95'
              }`}
            >
              {canContinue ? (
                <>
                  Continuar a Paso 3
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              ) : (
                <>
                  <LockIcon className="w-5 h-5" />
                  Botón Bloqueado
                </>
              )}
            </button>
          </div>

          {/* Back link */}
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-white text-sm transition-colors mt-6 font-medium"
          >
            ← Volver al Paso 1
          </button>
        </div>
      </main>
    </>
  );
}
