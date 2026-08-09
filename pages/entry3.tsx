import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { FileIcon, DownloadIcon, AnnouncementIcon, CheckIcon, FolderIcon, ArrowIcon } from '@/components/Icons';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { AlertDialog } from '@/components/Dialog';
import { useDialog } from '@/hooks/useDialog';

interface FileItem {
  id: string;
  name: string;
  filename: string;
  size: number;
  uploadedAt: string;
  downloads: number;
  downloadUrl?: string;
}

export default function Entry3() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [downloadCounter, setDownloadCounter] = useState(0);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  
  const { alertState, showAlert, closeAlert } = useDialog();

  useEffect(() => {
    setMounted(true);
    fetchFiles();
  }, [router]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      
      // If the API tells us we are not authorized, boot the user back to step 1
      if (!response.data.success && response.data.error === 'Unauthorized') {
         router.push('/');
         return;
      }
      
      setFiles(response.data.files || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      if (error.response?.status === 401) {
         router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      console.log('🎯 Download started for:', file.name);
      
      // Registrar descarga en el servidor
      console.log('📊 Registering download on server...');
      axios.post(`/api/download?file=${file.id}`).catch(err => {
        console.warn('⚠️ Registration failed:', err?.message || err);
      });

      // Usar descarga nativa del navegador mediante <a> (Evita corrupción de RAM por Blob() en archivos pesados)
      const downloadUrl = `/api/download?file=${file.id}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.filename || 'archivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Native download triggered');

      // Start the 8 second visual countdown before redirecting to the ad
      setDownloadingFileId(file.id);
      let counter = 8;
      setDownloadCounter(counter);
      
      const interval = setInterval(() => {
        counter--;
        setDownloadCounter(counter);
        if (counter <= 0) {
          clearInterval(interval);
          // "una vez se descargue el archivo espere [8] segundos redireccione al ad como antes"
          axios.get('/api/get-redirect-link').then(adResponse => {
            const adUrl = adResponse.data.url;
            window.location.href = adUrl;
          }).catch(err => {
            window.location.href = '/ad-visit'; // fallback
          });
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error handling download logic:', error);
      showAlert(
        'Error',
        'Ocurrió un error inesperado al iniciar la descarga.',
        'error'
      );
      setDownloadingFileId(null);
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Free Fire - Descargas</title>
        </Head>
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Free Fire - Descargas</title>
      </Head>
      
      <div className="min-h-[100dvh] flex flex-col items-center py-10 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Symmetric ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
        </div>
        
        <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center">
          <div className="card w-full mb-6 sm:mb-8 text-center animate-fade-in flex flex-col items-center">
            <div className="inline-block">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 flex items-center justify-center gap-3 gradient-text">
                <CheckIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" animate />
                ¡Descargas Desbloqueadas!
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 font-medium">
              Selecciona el archivo que deseas descargar
            </p>
          </div>

          {/* Ad Container */}
          <div className="w-full pt-2 mb-6 sm:mb-8">
            <div className="ad-container bg-dark-900 border-white/5 mx-auto max-w-2xl animate-fade-in" style={{animationDelay: '0.2s'}}>
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-bold">Patrocinado</p>
              <div className="w-full relative shadow-inner">
                <HighPerformanceAd />
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="card w-full animate-fade-in" style={{animationDelay: '0.4s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white flex items-center justify-center gap-3">
              <FolderIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              Archivos Disponibles
            </h2>
            
            <div className="w-full max-w-3xl mx-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="skeleton h-6 w-3/4 mb-3"></div>
                        <div className="skeleton h-4 w-1/2 mb-2"></div>
                        <div className="skeleton h-3 w-1/3 mt-2"></div>
                      </div>
                      <div className="skeleton h-12 w-full sm:w-40 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 sm:py-16 glass-card">
                  <p className="text-xl sm:text-2xl text-gray-300 mb-2 font-bold">No hay archivos disponibles</p>
                  <p className="text-sm sm:text-base text-gray-500">Vuelve pronto para nuevos recursos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div 
                      key={file.id} 
                      className="glass-card flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-all duration-300 group animate-fade-in"
                      style={{animationDelay: `${0.1 * index}s`}}
                    >
                      <div className="flex-1 text-center sm:text-left w-full">
                        <h3 className="font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-primary transition-colors flex items-center justify-center sm:justify-start gap-2">
                          <FileIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-primary transition-colors" />
                          {file.name}
                        </h3>
                        <div className="flex items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-gray-400 mb-1">
                          <span className="bg-dark-900 px-2 py-1 rounded-md border border-white/5">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="bg-dark-900 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1">
                            <DownloadIcon className="w-3 h-3" />
                            {file.downloads}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Subido: {new Date(file.uploadedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto flex justify-center">
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingFileId === file.id}
                          className={`btn-primary w-full sm:w-48 text-base shadow-[0_0_15px_rgba(255,107,53,0.3)] ${
                            downloadingFileId === file.id ? 'opacity-80 cursor-wait' : ''
                          }`}
                        >
                          {downloadingFileId === file.id ? (
                            <div className="flex justify-center items-center gap-2">
                               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               Abriendo ({downloadCounter}s)
                            </div>
                          ) : (
                            <div className="flex justify-center items-center gap-2">
                               <DownloadIcon className="w-5 h-5" />
                               Descargar
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center flex justify-center w-full">
            <div className="inline-flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-2">
              <CheckIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold text-sm">Paso 3 de 3 - Completado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog */}
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
