import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const AD_URL = 'https://omg10.com/4/9722913';
const REQUIRED_SECONDS = 7;

type PageState = 'ready' | 'watching' | 'success';

export default function AdVisit() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pageState, setPageState] = useState<PageState>('ready');
  const [secondsLeft, setSecondsLeft] = useState(REQUIRED_SECONDS);

  useEffect(() => {
    setMounted(true);
    // Reset the verification state when entering this page
    // This ensures the button in entry2 is locked until the process is completed again
    sessionStorage.removeItem('entry2_completed');
  }, []);

  // When state is 'ready', open ad and start timer
  const handleStartAd = useCallback(() => {
    // Start watching timer first
    setSecondsLeft(REQUIRED_SECONDS);
    setPageState('watching');
  }, []);

  // Countdown timer while user watches the ad in the other tab
  useEffect(() => {
    if (pageState !== 'watching') return;

    if (secondsLeft <= 0) {
      // Timer completed!
      sessionStorage.setItem('entry2_completed', 'true');
      setPageState('success');
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pageState, secondsLeft]);

  const handleGoToEntry2 = useCallback(() => {
    router.push('/entry2');
  }, [router]);

  // Calculate progress percentage
  const progress = pageState === 'watching'
    ? ((REQUIRED_SECONDS - secondsLeft) / REQUIRED_SECONDS) * 100
    : pageState === 'success' ? 100 : 0;

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
        <title>Verificación de Anuncio | Free Fire Portal</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-md p-6 sm:p-8 text-center space-y-6">

          {/* ─── READY STATE ─── */}
          {pageState === 'ready' && (
            <>
              <div className="text-5xl sm:text-6xl">📢</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Verificación de Anuncio
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Se abrirá el anuncio en una <strong className="text-yellow-400">nueva pestaña</strong>.
                No cierres esta página. Debes permanecer en el anuncio durante{' '}
                <strong className="text-yellow-400">{REQUIRED_SECONDS} segundos</strong>.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  💡 El contador aparecerá aquí para que sepas cuánto tiempo falta.
                </p>
              </div>
              <a
                href={AD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleStartAd}
                className="block w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg
                  bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                  text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                  transform hover:scale-[1.02] active:scale-95
                  transition-all duration-300 text-center no-underline"
              >
                👁️ Abrir Anuncio y Empezar Contador
              </a>
              <button
                onClick={handleGoToEntry2}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                ← Volver al Paso 2
              </button>
            </>
          )}

          {/* ─── WATCHING STATE ─── */}
          {pageState === 'watching' && (
            <>
              {/* Circular countdown */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto">
                {/* SVG circle progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.4)"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-yellow-400">
                    {secondsLeft}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">segundos</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ⏳ Permanece en el anuncio
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                El anuncio se abrió en otra pestaña.
                <br />
                <strong className="text-yellow-400">Revisa tus pestañas si no lo ves.</strong>
                <br />
                No cierres esta página hasta que el contador llegue a 0.
              </p>

              {/* Linear progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs">
                {Math.round(progress)}% completado
              </p>
            </>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {pageState === 'success' && (
            <>
              <div className="text-6xl sm:text-7xl animate-bounce">�</div>
              <h2 className="text-xl sm:text-2xl font-bold text-green-400">
                ¡Anuncio Completado!
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Has permanecido el tiempo necesario. Ya puedes cerrar la pestaña del anuncio
                y continuar al siguiente paso.
              </p>
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                <p className="text-green-300 text-sm">✅ Verificación exitosa — {REQUIRED_SECONDS} segundos completados</p>
              </div>

              {/* Additional ad section */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider">Anuncio Adicional</p>
                
                {/* Ad container - responsive */}
                <div className="w-full bg-gradient-to-r from-gray-800/50 to-purple-900/50 rounded-xl p-4 border border-gray-700/50 min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
                  {/* Placeholder for actual ad */}
                  <div className="text-center">
                    <div className="text-3xl mb-3">📰</div>
                    <p className="text-gray-400 text-sm">Espacio publicitario</p>
                    <p className="text-gray-500 text-xs mt-2">
                      (Google AdSense, banner o anuncio personalizado)
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGoToEntry2}
                className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg
                  bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900
                  shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40
                  transform hover:scale-[1.02] active:scale-95
                  transition-all duration-300"
              >
                Continuar →
              </button>
            </>
          )}

        </div>
      </main>
    </>
  );
}
