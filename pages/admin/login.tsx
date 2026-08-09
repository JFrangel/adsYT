import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { LockIcon } from '@/components/Icons';

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
      const response = await axios.post('/api/admin/auth', { username, password });
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
        <title>Admin — Iniciar sesión</title>
      </Head>

      <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
        <div className="card w-full max-w-sm fade-in">
          <header className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-zinc-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Panel Admin</h1>
            <p className="text-sm text-zinc-500">Acceso restringido</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                autoComplete="username"
                placeholder="Usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
                placeholder="Contraseña"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 fade-in">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Verificando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
