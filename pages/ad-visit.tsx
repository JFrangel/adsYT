import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { AnnouncementIcon, LightBulbIcon, EyeIcon, HourglassIcon, CelebrationIcon, CheckIcon } from '@/components/Icons';
import { AlertDialog } from '@/components/Dialog';
import { useDialog } from '@/hooks/useDialog';

const REQUIRED_SECONDS = 10;

type PageState = 'ready' | 'watching' | 'success';

export default function AdVisit() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pageState, setPageState] = useState<PageState>('ready');
  const [secondsLeft, setSecondsLeft] = useState(REQUIRED_SECONDS);
  const [adUrl, setAdUrl] = useState<string>('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  
  const adWindowRef = useRef<Window | null>(null);
  const { alertState, showAlert, closeAlert } = useDialog();

  useEffect(() => {
    setMounted(true);
    sessionStorage.removeItem('entry2_completed');
  }, []);

  const handleStartAd = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    setLoadingUrl(true);
    try {
      const response = await axios.get('/api/get-redirect-link');
      const redirectUrl = response.data.url;
      
      // Abrir el link en nueva pestaña SIN noopener para poder monitorear si se cierra
      adWindowRef.current = window.open(redirectUrl, '_blank');
      
      setSecondsLeft(REQUIRED_SECONDS);
      setPageState('watching');
      setAdUrl(redirectUrl);
    } catch (error) {
      console.error('Error getting redirect link:', error);
      showAlert('Error de Conexión', 'Error al obtener el enlace. Intenta de nuevo.', 'error');
    } finally {
      setLoadingUrl(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (pageState !== 'watching') return;

    const checkAndTick = async () => {
      // Validar si el usuario cerró la pestaña del anuncio
      if (adWindowRef.current && adWindowRef.current.closed) {
        setPageState('ready');
        setSecondsLeft(REQUIRED_SECONDS);
        showAlert('Anuncio Cerrado', 'Cerraste el anuncio antes de los 10 segundos obligatorios. Por favor, ábrelo y permanece hasta que termine el contador.', 'error');
        return;
      }

      if (secondsLeft <= 0) {
        sessionStorage.setItem('entry2_completed', 'true');
        setPageState('success');
        return;
      }

      // Enviar latido al servidor para acumular segundos reales validados
      try {
        await axios.post('/api/ad/heartbeat', { isActive: true });
        setSecondsLeft(prev => prev - 1);
      } catch (err) {
        console.warn('Network error on heartbeat');
        // Retrocedemos el reloj localmente si está offline temporalmente, pero el backend manda en realidad
      }
    };

    const timer = setInterval(checkAndTick, 1000);
    return () => clearInterval(timer);
  }, [pageState, secondsLeft, showAlert]);

  const handleGoToEntry2 = useCallback(() => {
    router.push('/entry2');
  }, [router]);

  const progress = pageState === 'watching'
    ? ((REQUIRED_SECONDS - secondsLeft) / REQUIRED_SECONDS) * 100
    : pageState === 'success' ? 100 : 0;

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
        <title>Verificación de Anuncio | Free Fire Portal</title>
      </Head>

      <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Symmetric ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
        </div>

        <div className="card w-full max-w-md text-center space-y-6 relative z-10">

          {/* ─── READY STATE ─── */}
          {pageState === 'ready' && (
            <>
              <div className="flex justify-center">
                <AnnouncementIcon className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Verificación de Anuncio
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Se abrirá el anuncio en una <strong className="text-primary glow:text-white transition cursor-default">nueva pestaña</strong>.
                No cierres esta página. Debes permanecer en el anuncio durante{' '}
                <strong className="text-primary glow:text-white transition cursor-default">{REQUIRED_SECONDS} segundos</strong>.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <LightBulbIcon className="w-5 h-5 text-accent" />
                  <p className="text-gray-300 text-sm font-semibold">
                    El contador aparecerá aquí para que sepas cuánto tiempo falta
                  </p>
                </div>
              </div>

              {/* Ad before button */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-bold text-center">Patrocinado</p>
                <div className="w-full bg-dark-900 rounded-xl p-3 border border-white/5 shadow-inner">
                  <HighPerformanceAd />
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-full mt-4">
                <a
                  href="#"
                  onClick={handleStartAd}
                  className="btn-primary w-full max-w-md"
                  style={{ pointerEvents: loadingUrl ? 'none' : 'auto', opacity: loadingUrl ? 0.7 : 1 }}
                >
                  {loadingUrl ? (
                    <>
                      <HourglassIcon className="w-5 h-5" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <EyeIcon className="w-5 h-5" />
                      Abrir Anuncio y Empezar Contador
                    </>
                  )}
                </a>
                <button
                  onClick={handleGoToEntry2}
                  className="text-gray-500 hover:text-white font-medium text-sm transition-colors mt-2"
                >
                  ← Volver al Paso 2
                </button>
              </div>
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
                    stroke="rgba(255, 255, 255, 0.05)"
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
                      <stop offset="0%" stopColor="#FFB800" />
                      <stop offset="100%" stopColor="#FF6B35" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-accent drop-shadow-[0_0_10px_rgba(255,184,0,0.5)]">
                    {secondsLeft}
                  </span>
                  <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">segundos</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <HourglassIcon className="w-6 h-6 text-accent animate-pulse-subtle" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Permanece en el anuncio
                </h2>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                El anuncio se abrió en otra pestaña.
                <br />
                <strong className="text-primary glow:text-white transition cursor-default">Revisa tus pestañas si no lo ves.</strong>
                <br />
                No cierres esta página hasta que el contador llegue a 0.
              </p>

              {/* Linear progress bar */}
              <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,107,53,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                {Math.round(progress)}% completado
              </p>

              {/* Ad during waiting */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-bold text-center">Patrocinado</p>
                <div className="w-full bg-dark-900 rounded-xl p-3 border border-white/5 shadow-inner">
                  <HighPerformanceAd />
                </div>
              </div>
            </>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {pageState === 'success' && (
            <>
              <div className="flex justify-center">
                <CelebrationIcon className="w-20 h-20 sm:w-24 sm:h-24 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" animate />
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckIcon className="w-6 h-6 text-green-400" />
                <h2 className="text-xl sm:text-2xl font-black text-green-400 tracking-tight">
                  ¡Anuncio Completado!
                </h2>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                Has permanecido el tiempo necesario. Ya puedes continuar al siguiente paso de forma segura.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <p className="text-green-300/80 font-medium text-sm">Verificación exitosa — {REQUIRED_SECONDS} segundos validados</p>
                </div>
              </div>

              {/* Additional ad section */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-bold text-center">Patrocinado</p>
                
                {/* Ad container - responsive */}
                <div className="w-full bg-dark-900 rounded-xl p-3 border border-white/5 shadow-inner">
                  <HighPerformanceAd />
                </div>
              </div>

              <div className="flex justify-center w-full mt-4">
                <button
                  onClick={handleGoToEntry2}
                  className="w-full max-w-md group py-3 sm:py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-95"
                >
                  Continuar
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </>
          )}

        </div>
      </main>

      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </>
  );
}
