import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Si el usuario recarga la página (F5) o entra directo por URL, la app se montará "en fresco".
    // Evaluamos si no está en la raíz ni en el admin. Si es así, lo devolvemos al inicio.
    // Navegaciones asíncronas con next/router NO disparan este useEffect.
    const allowedInitialPaths = ['/', '/admin'];
    
    // Solo expulsar si la ruta de montaje inicial no es permitida
    if (!allowedInitialPaths.includes(router.pathname)) {
      router.replace('/');
    }
  }, []); // Array vacío = se ejecuta solo al montarse (full page load/reload)

  return <Component {...pageProps} />
}
