import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import TimerButton from '@/components/TimerButton';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { FireIcon, ArrowIcon, LockIcon, AnnouncementIcon, CheckIcon } from '@/components/Icons';

// Etapas del paso 1:
// 'locked'  → falta completar el timer
// 'ad'      → timer listo; debe visitar el anuncio (7s fuera) para desbloquear
// 'ready'   → visita al anuncio validada; puede continuar a descargas
type Stage = 'locked' | 'ad' | 'ready';

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('locked');
  const [checking, setChecking] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [adHint, setAdHint] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/session/status');
      const { entry1Completed, adCompleted, remainingMs } = response.data;

      if (adCompleted) {
        setStage('ready');
        setAdHint(null);
      } else if (entry1Completed) {
        setStage('ad');
        if (remainingMs > 0) {
          setAdHint('Debes permanecer unos segundos más en el anuncio. Inténtalo de nuevo.');
        }
      } else {
        setStage('locked');
      }
    } catch {
      // Sin red no bloqueamos la UI: se queda en la etapa actual
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    // Al volver del anuncio (botón atrás) la página puede restaurarse desde
    // bfcache sin recargar: re-validar en pageshow y al recuperar el foco.
    const onPageShow = () => refreshStatus();
    const onFocus = () => refreshStatus();
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshStatus]);

  const handleTimerComplete = async () => {
    try {
      await fetch('/api/session/start', { method: 'POST' });
    } catch (error) {
      console.error('No se pudo iniciar la sesión', error);
    }
    setStage('ad');
  };

  const handleVisitAd = async () => {
    if (leaving) return;
    setLeaving(true);
    setAdHint(null);
    try {
      // 1) Sellar la salida en la cookie (server-side)
      await axios.post('/api/session/ad-visit');
      // 2) Obtener el link del anuncio y salir en esta misma pestaña
      const response = await axios.get('/api/get-redirect-link');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('No se pudo abrir el anuncio', error);
      setAdHint('No se pudo abrir el anuncio. Inténtalo de nuevo.');
      setLeaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Free Fire — Archivos</title>
      </Head>

      <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg fade-in">
          <div className="card flex flex-col items-center text-center gap-8">
            <header className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Free Fire — Archivos
              </h1>
              <p className="text-zinc-500 text-base">
                {stage === 'ready'
                  ? 'Todo listo. Continúa para ver los archivos.'
                  : stage === 'ad'
                  ? 'Visita el anuncio unos segundos y vuelve para continuar.'
                  : 'Desbloquea el acceso y descarga los archivos disponibles.'}
              </p>
            </header>

            {!checking && stage === 'locked' && (
              <TimerButton
                duration={8}
                onComplete={handleTimerComplete}
                label="Desbloquear"
                completedLabel="Acceso desbloqueado"
              />
            )}

            {!checking && stage === 'ad' && (
              <div className="flex flex-col items-center gap-4 w-full fade-in">
                <button onClick={handleVisitAd} disabled={leaving} className="btn-primary w-full text-lg">
                  <AnnouncementIcon className="w-5 h-5" />
                  {leaving ? 'Abriendo anuncio…' : 'Ver anuncio'}
                </button>
                <p className="text-sm text-zinc-500">
                  Permanece unos <span className="text-zinc-300 font-medium">7 segundos</span> en el
                  anuncio y regresa con el botón atrás.
                </p>
                {adHint && (
                  <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 fade-in">
                    {adHint}
                  </p>
                )}
              </div>
            )}

            {!checking && stage === 'ready' && (
              <div className="flex flex-col items-center gap-2 fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm text-zinc-500">Anuncio verificado</p>
              </div>
            )}

            <div className="ad-frame w-full">
              <HighPerformanceAd />
            </div>

            <button
              onClick={() => router.push('/descargas')}
              disabled={stage !== 'ready'}
              className={stage === 'ready' ? 'btn-primary w-full text-lg' : 'btn-secondary w-full text-lg'}
            >
              {stage === 'ready' ? (
                <>
                  Continuar a descargas
                  <ArrowIcon className="w-5 h-5" />
                </>
              ) : (
                <>
                  <LockIcon className="w-4 h-4" />
                  {stage === 'ad' ? 'Visita el anuncio para continuar' : 'Completa el timer para continuar'}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
