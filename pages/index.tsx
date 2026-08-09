import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TimerButton from '@/components/TimerButton';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { FireIcon, ArrowIcon, LockIcon } from '@/components/Icons';

export default function Home() {
  const router = useRouter();
  const [canContinue, setCanContinue] = useState(false);

  const handleTimerComplete = async () => {
    try {
      await fetch('/api/session/start', { method: 'POST' });
    } catch (error) {
      console.error('No se pudo iniciar la sesión', error);
      // Aun con error de red dejamos continuar; la página de descargas re-valida.
    }
    setCanContinue(true);
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
                Desbloquea el acceso y descarga los archivos disponibles.
              </p>
            </header>

            <TimerButton
              duration={8}
              onComplete={handleTimerComplete}
              label="Desbloquear"
              completedLabel="Acceso desbloqueado"
            />

            <div className="ad-frame w-full">
              <HighPerformanceAd />
            </div>

            <button
              onClick={() => router.push('/descargas')}
              disabled={!canContinue}
              className={canContinue ? 'btn-primary w-full text-lg' : 'btn-secondary w-full text-lg'}
            >
              {canContinue ? (
                <>
                  Ver archivos
                  <ArrowIcon className="w-5 h-5" />
                </>
              ) : (
                <>
                  <LockIcon className="w-4 h-4" />
                  Completa el timer para continuar
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
