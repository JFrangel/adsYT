import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { AdminIcon, LogoutIcon, UploadIcon, FolderIcon, FileIcon, DeleteIcon, LoadingSpinner } from '@/components/Icons';
import { AlertDialog, ConfirmDialog, PromptDialog } from '@/components/Dialog';
import { useDialog } from '@/hooks/useDialog';

interface FileItem {
  id: string;
  name: string;
  filename: string;
  size: number;
  uploadedAt: string;
  downloads: number;
  visible: boolean;
}

interface LinkConfig {
  id: string;
  name: string;
  url: string;
  clicks: number;
  enabled: boolean;
  active: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [links, setLinks] = useState<LinkConfig[]>([]);
  const [linksMode, setLinksMode] = useState<'single' | 'alternate'>('single');
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);
  const [refreshingClicks, setRefreshingClicks] = useState(false);
  
  // Dialog hooks
  const {
    alertState,
    showAlert,
    closeAlert,
    confirmState,
    showConfirm,
    closeConfirm,
    promptState,
    showPrompt,
    closePrompt,
  } = useDialog();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/admin/check');
      if (response.data.authenticated) {
        setAuthenticated(true);
        // Fetch both in parallel
        await Promise.all([fetchLinks(), fetchFiles()]);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
      router.push('/admin/login');
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await axios.get('/api/admin/links-config');
      setLinks(response.data.links || []);
      setLinksMode(response.data.mode || 'single');
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const refreshClicks = async () => {
    setRefreshingClicks(true);
    try {
      await fetchLinks();
      showAlert('Clicks Actualizados', 'Los conteos de clicks se han actualizado correctamente', 'success');
    } catch (error) {
      showAlert('Error', 'No se pudieron actualizar los clicks', 'error');
      console.error('Error refreshing clicks:', error);
    } finally {
      setRefreshingClicks(false);
    }
  };

  const updateLinkMode = async (newMode: 'single' | 'alternate') => {
    try {
      const response = await axios.put('/api/admin/links-config', { mode: newMode });
      setLinksMode(newMode);
      setLinks(response.data.config.links);
    } catch (error) {
      console.error('Error updating link mode:', error);
    }
  };

  const setActiveLink = async (linkId: string) => {
    try {
      const response = await axios.put('/api/admin/links-config', { activeLink: linkId });
      setLinks(response.data.config.links);
    } catch (error) {
      console.error('Error setting active link:', error);
    }
  };

  const toggleLink = async (linkId: string) => {
    try {
      const updatedLinks = links.map(l => 
        l.id === linkId ? { ...l, enabled: !l.enabled } : l
      );
      const response = await axios.put('/api/admin/links-config', { links: updatedLinks });
      setLinks(response.data.config.links);
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  const addNewLink = () => {
    showPrompt(
      'Agregar Nuevo Link',
      'Nombre del link (ej: Monetag, AdSterra):',
      (name) => {
        // Segundo prompt para URL
        showPrompt(
          'URL del Link',
          `URL para ${name}:`,
          async (url) => {
            try {
              const response = await axios.put('/api/admin/links-config', { 
                addLink: { name, url } 
              });
              setLinks(response.data.config.links);
              showAlert('Link Agregado', 'Link agregado correctamente', 'success');
            } catch (error) {
              console.error('Error adding link:', error);
              showAlert('Error', 'Error al agregar link', 'error');
            }
          },
          {
            placeholder: 'https://ejemplo.com/link',
            inputType: 'url'
          }
        );
      },
      {
        placeholder: 'Nombre del servicio'
      }
    );
  };

  const editLink = (linkId: string, currentName: string, currentUrl: string) => {
    showPrompt(
      'Editar Link',
      'Nuevo nombre del link:',
      (name) => {
        showPrompt(
          'Editar URL',
          `Nuevo URL para ${name}:`,
          async (url) => {
            try {
              const response = await axios.put('/api/admin/links-config', { 
                editLink: { id: linkId, name, url } 
              });
              setLinks(response.data.config.links);
              showAlert('Link Actualizado', 'Link actualizado correctamente', 'success');
            } catch (error) {
              console.error('Error editing link:', error);
              showAlert('Error', 'Error al editar link', 'error');
            }
          },
          {
            placeholder: 'https://ejemplo.com/link',
            defaultValue: currentUrl,
            inputType: 'url'
          }
        );
      },
      {
        placeholder: 'Nombre del servicio',
        defaultValue: currentName
      }
    );
  };

  const deleteLink = (linkId: string, linkName: string) => {
    showConfirm(
      'Eliminar Link',
      `¿Eliminar el link "${linkName}"?\n\nEsta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await axios.put('/api/admin/links-config', { 
            deleteLink: linkId 
          });
          setLinks(response.data.config.links);
          showAlert('Link Eliminado', 'Link eliminado correctamente', 'success');
        } catch (error) {
          console.error('Error deleting link:', error);
          showAlert('Error', 'Error al eliminar link', 'error');
        }
      },
      {
        type: 'error',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );
  };

  const saveCheckpoint = () => {
    showConfirm(
      'Guardar Checkpoint',
      '¿Guardar checkpoint de clicks actual a GitHub?\n\nSe guardará un commit con el estado actual.',
      async () => {
        setSavingCheckpoint(true);
        try {
          const response = await axios.post('/api/admin/save-checkpoint');
          showAlert(
            'Checkpoint Guardado',
            `Monetag: ${response.data.clicks.monetag} clicks\nAdSterra: ${response.data.clicks.adsterra} clicks`,
            'success'
          );
          await fetchLinks();
        } catch (error: any) {
          const errorMsg = error.response?.data?.error || error.message;
          showAlert(
            'Error al Guardar',
            `Error: ${errorMsg}\n\nVerifica que GITHUB_TOKEN esté configurado en las variables de entorno.`,
            'error'
          );
          console.error('Error saving checkpoint:', error);
        } finally {
          setSavingCheckpoint(false);
        }
      },
      {
        type: 'info',
        confirmText: 'Guardar',
        cancelText: 'Cancelar'
      }
    );
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

      showAlert('Archivo Subido', 'Archivo subido correctamente', 'success');
      fetchFiles();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      showAlert('Error', 'Error al subir archivo: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string, filename: string) => {
    showConfirm(
      'Eliminar Archivo',
      `¿Eliminar ${filename}?\n\nEsta acción no se puede deshacer.`,
      async () => {
        try {
          await axios.delete(`/api/admin/files?file=${fileId}`);
          showAlert('Archivo Eliminado', 'Archivo eliminado correctamente', 'success');
          fetchFiles();
        } catch (error: any) {
          showAlert('Error', 'Error al eliminar: ' + (error.response?.data?.error || error.message), 'error');
        }
      },
      {
        type: 'error',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );
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
        <title>Admin Panel</title>
      </Head>
      
      <div className="min-h-[100dvh] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="card mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 flex items-center gap-2">
                <AdminIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" animate />
                <span className="gradient-text">Panel Admin</span>
              </h1>
              <p className="text-purple-200 text-base sm:text-lg">Gestión de archivos y contenido</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary w-full sm:w-auto text-base sm:text-lg flex items-center justify-center gap-2">
              <LogoutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              Cerrar Sesión
            </button>
          </div>

          {/* Upload Form */}
          <div className="card mb-6 sm:mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text flex items-center gap-2">
              <UploadIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              Subir Nuevo Archivo
            </h2>
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
                className="btn-primary text-base sm:text-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <UploadIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </form>
          </div>

          {/* Files List */}
          <div className="card animate-fade-in" style={{animationDelay: '0.4s'}}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text flex items-center gap-2">
              <FolderIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              Archivos Actuales
            </h2>
            
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
                        <h3 className="font-bold text-lg sm:text-xl text-white mb-2 flex items-center gap-2">
                          <FileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          {file.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-300">
                          {file.filename} • {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.downloads} descargas
                        </p>
                        <p className="text-xs text-purple-400/80 mt-1">
                          Subido: {new Date(file.uploadedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(file.id, file.filename)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl 
                                  hover:from-red-600 hover:to-pink-700 transition-all duration-300
                                  shadow-xl hover:shadow-2xl hover:scale-105 transform text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <DeleteIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Links Section */}
          <div className="card mt-8 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Links de Monetización
            </h2>

            {/* Mode Selection */}
            <div className="mb-6 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-bold text-white mb-1">Modo de Operación</p>
                  <p className="text-xs text-purple-300">
                    {linksMode === 'single' 
                      ? 'Solo un link estará en uso' 
                      : 'Sistema de rotación A/B activo'}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  linksMode === 'alternate' 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-300'
                    : 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                }`}>
                  {linksMode === 'alternate' ? 'ROTACIÓN ACTIVA' : 'MODO ÚNICO'}
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => updateLinkMode('single')}
                  className={`flex-1 min-w-[140px] px-5 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${
                    linksMode === 'single'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/5 text-purple-200 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Modo Único
                  </div>
                </button>
                <button
                  onClick={() => updateLinkMode('alternate')}
                  className={`flex-1 min-w-[140px] px-5 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${
                    linksMode === 'alternate'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-white/5 text-purple-200 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rotación A/B
                  </div>
                </button>
              </div>
              <div className="mt-4 p-3 bg-black/20 rounded-lg border border-purple-500/20">
                <p className="text-xs text-purple-200 leading-relaxed">
                  {linksMode === 'single' 
                    ? 'El link marcado como "Activo" será el único usado en el Paso 2. Los links deshabilitados no se mostrarán.' 
                    : 'Todos los links habilitados se alternarán automáticamente en cada visita al Paso 2. El usuario verá el sistema como un solo link.'}
                </p>
              </div>
            </div>

            {/* Add New Link Button */}
            <div className="mb-6 flex gap-3 flex-wrap">
              <button
                onClick={addNewLink}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Nuevo Link
              </button>
              
              <button
                onClick={refreshClicks}
                disabled={refreshingClicks}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-5 h-5 ${refreshingClicks ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshingClicks ? 'Actualizando...' : 'Actualizar Clicks'}
              </button>
              
              <button
                onClick={saveCheckpoint}
                disabled={savingCheckpoint}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {savingCheckpoint ? 'Guardando...' : 'Guardar Checkpoint'}
              </button>
            </div>

            {/* Links List */}
            <div className="space-y-4">
              {links.length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <svg className="w-16 h-16 mx-auto mb-4 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="text-lg text-purple-300 font-semibold">No hay links configurados</p>
                  <p className="text-xs text-purple-400 mt-2">Agrega un link para comenzar con la monetización</p>
                </div>
              ) : (
                links.map((link, index) => {
                  const isInRotation = linksMode === 'alternate' && link.enabled;
                  const isActiveInSingle = linksMode === 'single' && link.active;
                  
                  return (
                    <div key={link.id} className="bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-xl p-5 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-white">{link.name}</h3>
                                {/* Status Badges */}
                                <div className="flex gap-2 flex-wrap">
                                  {isInRotation && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-300 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      EN ROTACIÓN
                                    </span>
                                  )}
                                  {isActiveInSingle && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-purple-300 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      ACTIVO
                                    </span>
                                  )}
                                  {!link.enabled && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/20 border border-gray-500/50 text-gray-400 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      PAUSADO
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-purple-300/80 break-all font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-purple-500/10">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 flex-wrap mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="text-yellow-300 font-semibold">{link.clicks}</span>
                              <span className="text-purple-300/70">clicks</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                          {linksMode === 'single' && (
                            <button
                              onClick={() => setActiveLink(link.id)}
                              disabled={link.active}
                              className={`px-4 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                link.active
                                  ? 'bg-purple-600 text-white cursor-default shadow-lg shadow-purple-500/30'
                                  : 'bg-white/5 text-purple-300 hover:bg-purple-600/20 border border-white/10'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {link.active ? 'Activo' : 'Activar'}
                            </button>
                          )}
                          <button
                            onClick={() => toggleLink(link.id)}
                            className={`px-4 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                              link.enabled
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                : 'bg-white/5 text-blue-300 hover:bg-blue-600/20 border border-white/10'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {link.enabled ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              )}
                            </svg>
                            {link.enabled ? 'Habilitar' : 'Pausar'}
                          </button>
                          <button
                            onClick={() => editLink(link.id, link.name, link.url)}
                            className="px-4 py-2.5 rounded-lg font-bold text-xs bg-white/5 text-purple-300 hover:bg-purple-600/20 border border-white/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => deleteLink(link.id, link.name)}
                            className="px-4 py-2.5 rounded-lg font-bold text-xs bg-white/5 text-red-300 hover:bg-red-600/20 border border-white/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stats Summary */}
            {links.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-sm font-semibold text-yellow-200">Total Clicks</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-300">
                    {links.reduce((sum, link) => sum + link.clicks, 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-semibold text-green-200">Links Activos</p>
                  </div>
                  <p className="text-3xl font-bold text-green-300">
                    {links.filter(l => l.enabled).length} / {links.length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-5 shadow-lg sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-semibold text-purple-200">Sistema</p>
                  </div>
                  <p className="text-lg font-bold text-purple-300">
                    {linksMode === 'alternate' ? 'Rotación A/B' : 'Modo Único'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm || (() => {})}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />

      <PromptDialog
        isOpen={promptState.isOpen}
        onClose={closePrompt}
        onSubmit={promptState.onSubmit || (() => {})}
        title={promptState.title}
        message={promptState.message}
        placeholder={promptState.placeholder}
        defaultValue={promptState.defaultValue}
        type={promptState.inputType}
      />
    </>
  );
}
