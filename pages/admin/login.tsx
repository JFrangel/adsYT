import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { AdminIcon, LockIcon } from '@/components/Icons';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/auth', {
        username,
        password,
      });

      if (response.data.success) {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-indigo-500/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-purple-500/30 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <div className="card max-w-md w-full relative z-10 animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block animate-float">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 flex items-center justify-center gap-2 sm:gap-3">
                <LockIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                <span className="gradient-text">Admin</span>
              </h1>
            </div>
            <p className="text-purple-200 text-sm sm:text-base">Acceso restringido</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-purple-200 mb-2 sm:mb-3">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-xl 
                          text-white placeholder-purple-300/50 text-sm sm:text-base
                          focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                          transition-all backdrop-blur-sm"
                required
                autoComplete="username"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-purple-200 mb-2 sm:mb-3">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 rounded-xl 
                          text-white placeholder-purple-300/50 text-sm sm:text-base
                          focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                          transition-all backdrop-blur-sm"
                required
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 text-red-200 px-4 sm:px-5 py-3 sm:py-4 rounded-xl backdrop-blur-sm animate-fade-in">
                <p className="font-semibold text-sm sm:text-base">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg sm:text-xl"
            >
              {loading ? '🔄 Verificando...' : '🚀 Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <a href="/" className="text-purple-300 hover:text-purple-100 transition-colors font-medium text-sm sm:text-base">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
