import { useState, useEffect, useCallback, useRef } from 'react';
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

// Debe coincidir con AD_REDIRECT_MS del servidor (lib/timers.ts).
// El servidor es la autoridad; esto solo controla el cierre automático.
const AD_SECONDS = 7;

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('locked');
  const [checking, setChecking] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [adHint, setAdHint] = useState<string | null>(null);
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [adLinkId, setAdLinkId] = useState<string | null>(null);
  // Si el admin no tiene ningún link de anuncio, el paso se salta en vez de
  // dejar al usuario atascado esperando un anuncio que nunca llegará.
  const [adRequired, setAdRequired] = useState(true);
  const statusSeq = useRef(0);
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    // Descarta respuestas obsoletas: pageshow y focus pueden disparar dos
    // consultas casi a la vez y la última en resolver no es la más reciente.
    const seq = ++statusSeq.current;

    try {
      const response = await axios.get('/api/session/status');
      if (seq !== statusSeq.current) return;

      const { entry1Completed, adCompleted, remainingMs, adRequired } = response.data;
      setAdRequired(adRequired !== false);

      // Al volver del anuncio la página puede restaurarse desde bfcache con el
      // estado React anterior: hay que soltar los flags de "en curso".
      setLeaving(false);
      setAdCountdown(null);

      if (adCompleted) {
        setStage('ready');
        setAdHint(null);
      } else if (entry1Completed) {
        setStage('ad');
        setAdHint(
          remainingMs > 0
            ? 'Debes permanecer unos segundos más en el anuncio. Inténtalo de nuevo.'
            : null
        );
      } else {
        setStage('locked');
        setAdHint(null);
      }
    } catch {
      // Sin red no bloqueamos la UI: se queda en la etapa actual
    } finally {
      // Se limpia SIEMPRE, aunque la respuesta sea obsoleta: si se condiciona
      // al guard de secuencia y llega otra consulta antes (pageshow y focus
      // disparan casi a la vez), la página se queda cargando para siempre.
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
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [refreshStatus]);

  // Precargar el link del anuncio en cuanto el paso queda disponible. Así el
  // clic puede abrir la pestaña YA con la URL final: sin pestaña en blanco
  // intermedia (que el bloqueador de popups y los scripts de anuncios tratan
  // de forma errática) y sin esperar a la red con el gesto ya consumido.
  useEffect(() => {
    if (stage !== 'ad' || adUrl || !adRequired) return;
    let cancelled = false;

    // preview=1: solo consulta la URL, no cuenta la vista. El conteo se hace
    // al salir de verdad hacia el anuncio (/api/session/ad-visit).
    axios
      .get('/api/get-redirect-link?preview=1')
      .then((response) => {
        if (cancelled) return;
        if (response.data?.url) {
          setAdUrl(response.data.url);
          setAdLinkId(response.data.linkId || null);
        } else {
          // No hay anuncio configurado: no tiene sentido retener al usuario
          setAdRequired(false);
          setStage('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setAdHint('No se pudo cargar el anuncio. Recarga la página.');
      });

    return () => {
      cancelled = true;
    };
  }, [stage, adUrl, adRequired]);

  const handleTimerComplete = async () => {
    try {
      const response = await fetch('/api/session/start', { method: 'POST' });
      // fetch NO lanza en 4xx/5xx: sin este chequeo la UI avanzaría a 'ad'
      // sin cookie de sesión y el usuario quedaría atrapado en 401.
      if (!response.ok) throw new Error(`start devolvió ${response.status}`);
      setStage(adRequired ? 'ad' : 'ready');
    } catch (error) {
      console.error('No se pudo iniciar la sesión', error);
      setAdHint('No se pudo iniciar la sesión. Recarga la página e inténtalo de nuevo.');
    }
  };

  const handleVisitAd = () => {
    if (leaving) return;

    if (!adUrl) {
      setAdHint('El anuncio aún se está cargando. Espera un momento.');
      return;
    }

    // Se abre SINCRÓNICAMENTE dentro del clic y YA con la URL final: sin await
    // previo (el gesto del usuario se pierde) y sin pestaña en blanco que luego
    // se navega (eso es lo que hacía que la pestaña se comportara de forma
    // errática con el script de anuncios).
    const adWindow = window.open(adUrl, '_blank');

    setLeaving(true);
    setAdHint(null);

    // Sellar la salida y contar la vista. keepalive permite que la petición
    // sobreviva aunque la pestaña navegue en el camino alternativo.
    const stamped = fetch('/api/session/ad-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: adLinkId }),
      keepalive: true,
    });

    // Ir en esta misma pestaña: siempre funciona. El usuario vuelve con el
    // botón atrás y pageshow/focus revalidan el estado.
    const irEnEstaPestana = () => {
      if (adTimerRef.current) {
        clearInterval(adTimerRef.current);
        adTimerRef.current = null;
      }
      setAdCountdown(null);
      stamped.catch(() => {}).finally(() => {
        window.location.href = adUrl;
      });
    };

    // Un bloqueador puede devolver null, o devolver una ventana y cerrarla
    // acto seguido. Sin comprobar 'closed' el countdown corría con la pestaña
    // del anuncio nunca abierta: el usuario esperaba para nada.
    if (!adWindow || adWindow.closed) {
      irEnEstaPestana();
      return;
    }

    // Segunda comprobación diferida para los bloqueadores que la cierran un
    // instante después de abrirla.
    setTimeout(() => {
      if (adWindow.closed) irEnEstaPestana();
    }, 500);

    // Cierre automático a los 7s. Deadline real en vez de restar por tick:
    // esta pestaña queda en segundo plano y ahí los navegadores ralentizan
    // los timers, lo que desfasaría la cuenta.
    const deadline = Date.now() + AD_SECONDS * 1000;
    setAdCountdown(AD_SECONDS);

    if (adTimerRef.current) clearInterval(adTimerRef.current);
    adTimerRef.current = setInterval(() => {
      const msLeft = deadline - Date.now();

      if (msLeft > 0) {
        setAdCountdown(Math.ceil(msLeft / 1000));
        return;
      }

      if (adTimerRef.current) clearInterval(adTimerRef.current);
      adTimerRef.current = null;
      try {
        adWindow.close();
      } catch {
        // Si el navegador no permite cerrarla (algunos móviles), el usuario
        // vuelve con atrás y pageshow/focus revalidan el estado.
      }
      setAdCountdown(null);
      setLeaving(false);
      // El link se consume: al repetir el paso se pedirá uno nuevo (y cuenta
      // como otra vista).
      setAdUrl(null);
      refreshStatus();
    }, 250);
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
                {adCountdown !== null ? (
                  <div className="flex flex-col items-center gap-3 w-full fade-in">
                    <div className="w-16 h-16 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                      <span className="text-2xl font-semibold tabular-nums text-primary">{adCountdown}</span>
                    </div>
                    <p className="text-sm text-zinc-500 text-center">
                      Viendo el anuncio… te regresaremos automáticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleVisitAd}
                      disabled={leaving || !adUrl}
                      className="btn-primary w-full text-base sm:text-lg"
                    >
                      <AnnouncementIcon className="w-5 h-5 shrink-0" />
                      {leaving ? 'Abriendo anuncio…' : !adUrl ? 'Cargando anuncio…' : 'Ver anuncio'}
                    </button>
                    <p className="text-sm text-zinc-500">
                      Se abrirá un anuncio durante{' '}
                      <span className="text-zinc-300 font-medium">7 segundos</span> y volverás
                      automáticamente para continuar.
                    </p>
                  </>
                )}
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

            <div className="ad-frame">
              <HighPerformanceAd />
            </div>

            <button
              onClick={() => router.push('/descargas')}
              disabled={stage !== 'ready'}
              className={`w-full text-base sm:text-lg ${
                stage === 'ready' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {stage === 'ready' ? (
                <>
                  Continuar a descargas
                  <ArrowIcon className="w-5 h-5 shrink-0" />
                </>
              ) : (
                <>
                  <LockIcon className="w-4 h-4 shrink-0" />
                  {stage === 'ad' ? 'Visita el anuncio' : 'Completa el timer'}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
