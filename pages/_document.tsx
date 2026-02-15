import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Monetag Verification Meta Tag */}
        <meta name="monetag" content="5938b5d794217ab098df239a6b9f0708" />
        
        {/* Register Service Worker for Monetag */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Monetag Service Worker registration successful');
                    },
                    function(err) {
                      console.log('Monetag Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />

        {/* Monetag Advertisement Script - Displays ads across all pages */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(s){
                s.dataset.zone='10611686',
                s.src='https://gizokraijaw.net/vignette.min.js'
              })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
