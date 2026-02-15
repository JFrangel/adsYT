import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Entry2() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset on revisit - check if entry2_completed was cleared (means returning)
  useEffect(() => {
    if (!mounted) return;
    setCanContinue(false);
  }, [mounted]);

  // Poll sessionStorage every 500ms to check if ad visit was completed
  useEffect(() => {
    if (!mounted) return;

    const check = () => {
      const completed = sessionStorage.getItem('entry2_completed');
      if (completed === 'true') {
        setCanContinue(true);
      }
    };

    check(); // check immediately on mount
    const interval = setInterval(check, 500);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 2 - Ver Anuncio | Free Fire Portal</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-lg p-6 sm:p-8 text-center space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
            <span className="w-8 h-0.5 bg-yellow-400"></span>
            <span className="w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-bold">2</span>
            <span className="w-8 h-0.5 bg-gray-600"></span>
            <span className="w-7 h-7 rounded-full bg-gray-600 text-gray-400 flex items-center justify-center text-xs font-bold">3</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            📢 Paso 2: Ver Anuncio
          </h1>

          <p className="text-gray-300 text-sm sm:text-base">
            Para continuar, debes ver un anuncio durante <strong className="text-yellow-400">7 segundos</strong>.
            Haz clic en el botón de abajo para comenzar.
          </p>

          {/* Status message */}
          {canContinue ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 animate-fadeIn">
              <p className="text-green-400 font-semibold text-lg">✅ ¡Anuncio completado!</p>
              <p className="text-green-300 text-sm mt-1">Ya puedes continuar al siguiente paso.</p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ Debes ver el anuncio completo para desbloquear el botón de continuar.
              </p>
            </div>
          )}

          {/* Ver Anuncio button - hidden when completed */}
          {!canContinue && (
            <button
              onClick={handleVisitAd}
              className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg
                bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                transform hover:scale-[1.02] active:scale-95
                transition-all duration-300"
            >
              👁️ Ver Anuncio
            </button>
          )}

          {/* Continue button - always visible but locked until completed */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300
              ${canContinue
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transform hover:scale-[1.02] active:scale-95 cursor-pointer'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
              }`}
          >
            {canContinue ? 'Continuar a Paso 3 →' : '🔒 Completa el anuncio para continuar'}
          </button>

          {/* Back link */}
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Volver al Paso 1
          </button>
        </div>
      </main>
    </>
  );
}
