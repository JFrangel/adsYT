import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { FolderIcon, DownloadIcon, FileIcon } from '@/components/Icons';

interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  downloads: number;
  createdAt: string;
}

const REDIRECT_SECONDS = 8;

export default function Descargas() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectingId, setRedirectingId] = useState<string | null>(null);
  const [counter, setCounter] = useState(REDIRECT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('/api/files');
        setFiles(response.data.files || []);
      } catch (error: any) {
        if (error.response?.status === 401) {
          router.replace('/');
          return;
        }
        console.error('Error cargando archivos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [router]);

  useEffect(() => {
    // Al volver del anuncio con el botón atrás, la página se restaura desde
    // bfcache con el estado anterior: sin esto, redirectingId se queda fijo y
    // TODOS los botones de descarga permanecen deshabilitados para siempre.
    const resetPending = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRedirectingId(null);
      setCounter(REDIRECT_SECONDS);
    };

    window.addEventListener('pageshow', resetPending);
    return () => {
      window.removeEventListener('pageshow', resetPending);
      // El interval vive fuera de este efecto: si no se limpia al desmontar,
      // dispara el redirect al anuncio desde cualquier otra página.
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // El botón es un <a target="_blank"> real: la navegación la hace el propio
  // clic del usuario, así que el bloqueador de ventanas emergentes no la toca
  // (window.open sí la bloqueaba y dejaba el flujo sin salida ni anuncio).
  const handleDownload = (file: FileItem) => {
    if (redirectingId) return;

    // 1) Registrar la descarga (best-effort, no bloquea la navegación)
    axios.post(`/api/download?file=${file.id}`).catch(() => {});

    // 2) Countdown en esta pestaña y redirect al ad. Deadline real en lugar de
    //    restar por tick: esta pestaña puede quedar en segundo plano y los
    //    navegadores ralentizan los timers ahí.
    setRedirectingId(file.id);
    const deadline = Date.now() + REDIRECT_SECONDS * 1000;
    setCounter(REDIRECT_SECONDS);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const msLeft = deadline - Date.now();

      if (msLeft > 0) {
        setCounter(Math.ceil(msLeft / 1000));
        return;
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;

      axios
        .get('/api/get-redirect-link')
        .then((response) => {
          if (response.data?.url) {
            window.location.href = response.data.url;
          } else {
            // Sin anuncio configurado no hay a dónde ir: liberar la página en
            // vez de dejar el botón bloqueado.
            setRedirectingId(null);
            setCounter(REDIRECT_SECONDS);
          }
        })
        .catch(() => {
          // Si el link de ads falla, no navegar a una URL rota
          setRedirectingId(null);
          setCounter(REDIRECT_SECONDS);
        });
    }, 250);
  };

  return (
    <>
      <Head>
        <title>Descargas — Free Fire</title>
      </Head>

      <main className="min-h-[100dvh] flex flex-col items-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-6 fade-in">
          <header className="card flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Archivos disponibles
            </h1>
            <p className="text-zinc-500">Elige un archivo para descargarlo desde MediaFire.</p>
          </header>

          <div className="ad-frame">
            <HighPerformanceAd />
          </div>

          <section className="card">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-zinc-300">No hay archivos disponibles</p>
                <p className="text-sm text-zinc-600 mt-1">Vuelve pronto.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {files.map((file) => (
                  <li key={file.id} className="row-item flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {file.size ? `${file.size} · ` : ''}
                        {file.downloads} descargas
                      </p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownload(file)}
                      aria-disabled={redirectingId !== null}
                      className={`btn-primary sm:w-auto w-full shrink-0 ${
                        redirectingId !== null ? 'pointer-events-none opacity-40' : ''
                      }`}
                    >
                      {redirectingId === file.id ? (
                        <span className="tabular-nums">Continuando en {counter}s…</span>
                      ) : (
                        <>
                          <DownloadIcon className="w-5 h-5" />
                          Descargar
                        </>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {redirectingId && (
              <p className="mt-4 text-center text-sm text-zinc-500 fade-in">
                Tu descarga se abrió en otra pestaña. Esta página continuará en unos segundos…
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
