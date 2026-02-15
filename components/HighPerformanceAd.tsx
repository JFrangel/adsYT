import { useEffect, useRef } from 'react';

interface AdProps {
  className?: string;
}

export default function HighPerformanceAd({ className = '' }: AdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoaded.current) return;
    
    scriptLoaded.current = true;

    // Create the config script
    const configScript = document.createElement('script');
    configScript.innerHTML = `
      atOptions = {
        'key' : '31c0c92d4caf313cccc48dfa4c10e085',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    
    // Create the invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/31c0c92d4caf313cccc48dfa4c10e085/invoke.js';
    invokeScript.async = true;

    // Append scripts to container
    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(invokeScript);

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`min-h-[250px] flex items-center justify-center ${className}`}
    />
  );
}
