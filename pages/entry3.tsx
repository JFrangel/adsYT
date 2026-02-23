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
}

export default function Entry3() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const { alertState, showAlert, closeAlert } = useDialog();

  useEffect(() => {
    setMounted(true);
    
    // Check if previous entries were completed (BEFORE cleaning)
    const entry1 = localStorage.getItem('entry1_completed');
    const entry2 = sessionStorage.getItem('entry2_completed');
    
    if (entry1 !== 'true' || entry2 !== 'true') {
      router.push('/');
      return;
    }
    
    // Only clean up AFTER validation passed
    // This way user can actually enter Paso 3
    sessionStorage.removeItem('entry2_completed');
    fetchFiles();
  }, [router]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      console.log('🎯 Download started for:', file.name);
      
      // Abrir ventana del anuncio INMEDIATAMENTE
      const adWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
      
      // Método simple: usar <a> con href directo
      const link = document.createElement('a');
      link.href = `/api/download?file=${file.id}`;
      link.setAttribute('download', file.filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download triggered');
      
      // Track download (POST request)
      console.log('📊 Tracking download...');
      try {
        await axios.post(`/api/download?file=${file.id}`);
        console.log('✅ Download tracked');
      } catch (trackError) {
        console.error('⚠️ Failed to track download:', trackError);
        // No mostrar error al usuario - esto no es crítico
      }
      
      // Obtener y abrir URL de anuncio con delay
      try {
        console.log('🔄 Getting ad link...');
        const adResponse = await axios.get('/api/get-redirect-link');
        const adUrl = adResponse.data.url;
        
        console.log('✅ Ad link obtained:', adResponse.data.linkName);
        
        // Esperar 2 segundos para que la descarga se inicie
        setTimeout(() => {
          if (adWindow && !adWindow.closed) {
            adWindow.location.href = adUrl;
            console.log('🚀 Ad window redirected');
          } else {
            console.warn('⚠️ Ad window was blocked');
            window.open(adUrl, '_blank');
          }
        }, 2000);
        
      } catch (adError) {
        console.error('❌ Error getting ad link:', adError);
        
        if (adWindow && !adWindow.closed) {
          adWindow.close();
        }
      }
      
    } catch (error: any) {
      console.error('❌ Download error:', error);
      showAlert(
        'Error de Descarga', 
        'Hubo un error al descargar el archivo. Intenta de nuevo.',
        'error'
      );
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
      
      <div className="min-h-[100dvh] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-green-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-emerald-500/30 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="card mb-6 sm:mb-8 text-center animate-fade-in">
            <div className="inline-block animate-float">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 flex items-center justify-center gap-3 sm:gap-4">
                <span>¡Descargas!</span>
                <CheckIcon className="w-10 h-10 sm:w-14 sm:h-14 text-green-400" animate />
              </h1>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl text-green-200 font-medium">
              Selecciona el archivo que deseas descargar
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>

          {/* Ad Container */}
          <div className="ad-container mb-6 sm:mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="text-green-200 flex items-start gap-3">
              
              <div className="w-full">
                <p className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Anuncio</p>
                <div className="mt-4 sm:mt-6">
                  <HighPerformanceAd className="bg-gradient-to-r from-gray-800/50 to-green-900/50 rounded-xl border border-gray-700/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="card animate-fade-in" style={{animationDelay: '0.4s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text flex items-center gap-2">
              <FolderIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              Archivos Disponibles
            </h2>
            
            {loading ? (
              <div className="text-center py-12 sm:py-16">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                </div>
                <p className="mt-4 sm:mt-6 text-purple-200 text-base sm:text-lg">Cargando archivos...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 sm:py-16 glass-card">
                <p className="text-xl sm:text-2xl text-purple-200 mb-2">No hay archivos disponibles</p>
                <p className="text-sm sm:text-base text-purple-300/70">Vuelve pronto para nuevos recursos</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {files.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="glass-card hover:bg-white/10 transition-all duration-300 group animate-fade-in"
                    style={{animationDelay: `${0.1 * index}s`}}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                          <FileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          {file.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-300/80">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • 
                          <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5 inline ml-1 mr-1" />
                          {file.downloads} descargas
                        </p>
                        <p className="text-xs text-purple-400/70 mt-1">
                          Subido: {new Date(file.uploadedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        className="btn-primary group-hover:scale-105 w-full sm:w-auto text-base sm:text-lg flex items-center justify-center gap-2"
                      >
                        <DownloadIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <div className="inline-flex items-center gap-2 glass-card px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
              <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <span className="text-green-400 font-bold text-sm sm:text-base lg:text-lg">Paso 3 de 3</span>
              <span className="text-green-300 text-sm sm:text-base">- Completado</span>
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
