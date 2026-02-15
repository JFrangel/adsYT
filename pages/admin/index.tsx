import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

interface FileItem {
  id: string;
  name: string;
  filename: string;
  size: number;
  uploadedAt: string;
  downloads: number;
  visible: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/admin/check');
      if (response.data.authenticated) {
        setAuthenticated(true);
        fetchFiles();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/admin/files');
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await axios.post('/api/admin/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Archivo subido correctamente');
      fetchFiles();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      alert('Error al subir archivo: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`¿Eliminar ${filename}?`)) return;

    try {
      await axios.delete(`/api/admin/files?file=${fileId}`);
      alert('Archivo eliminado');
      fetchFiles();
    } catch (error: any) {
      alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/logout');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!mounted || !authenticated) {
    return (
      <>
        <Head>
          <title>Admin Panel</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
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
        <title>Admin Panel</title>
      </Head>
      
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="card mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2">
                <span className="gradient-text">🛠️ Panel Admin</span>
              </h1>
              <p className="text-purple-200 text-base sm:text-lg">Gestión de archivos y contenido</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary w-full sm:w-auto text-base sm:text-lg">
              🚪 Cerrar Sesión
            </button>
          </div>

          {/* Upload Form */}
          <div className="card mb-6 sm:mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text">📤 Subir Nuevo Archivo</h2>
            <form onSubmit={handleUpload} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-purple-200 mb-2 sm:mb-3">
                    Nombre para mostrar
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-xl 
                              text-white placeholder-purple-300/50 text-sm sm:text-base
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                              transition-all backdrop-blur-sm"
                    placeholder="Ej: Recursos Free Fire v1.0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-purple-200 mb-2 sm:mb-3">
                    Archivo
                  </label>
                  <input
                    type="file"
                    name="file"
                    required
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-xl 
                              text-white text-sm sm:text-base file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:bg-purple-500 file:text-white
                              hover:file:bg-purple-600 file:cursor-pointer
                              transition-all backdrop-blur-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-base sm:text-lg w-full sm:w-auto"
              >
                {uploading ? '⏳ Subiendo...' : '📤 Subir Archivo'}
              </button>
            </form>
          </div>

          {/* Files List */}
          <div className="card animate-fade-in" style={{animationDelay: '0.4s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text">📁 Archivos Actuales</h2>
            
            {loading ? (
              <div className="text-center py-12 sm:py-16">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 sm:py-16 glass-card">
                <p className="text-lg sm:text-xl text-purple-200">No hay archivos subidos</p>
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
                        <h3 className="font-bold text-lg sm:text-xl text-white mb-2">📦 {file.name}</h3>
                        <p className="text-xs sm:text-sm text-purple-300">
                          {file.filename} • {(file.size / (1024 * 1024)).toFixed(2)} MB • ⬇️ {file.downloads} descargas
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(file.id, file.filename)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl 
                                  hover:from-red-600 hover:to-pink-700 transition-all duration-300
                                  shadow-xl hover:shadow-2xl hover:scale-105 transform text-sm sm:text-base"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
