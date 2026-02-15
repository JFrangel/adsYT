# Plan por fases — Acortador/Portal con retención por anuncios

Este documento describe el plan detallado por fases para construir la aplicación Next.js que solicitaste: tres entradas públicas que retienen usuarios mediante temporizadores y anuncios, y un panel admin oculto para subir/gestionar archivos que se almacenarán en GitHub.

---

## Fase 0 — Preparación (entregable inmediato)
Documento ampliado y estructurado con requisitos funcionales, no-funcionales, APIs, tracking, anti-fraude, admin, GitHub, límites, pruebas y checklist.
  - Confirmar repo remoto (owner/repo/branch) para subir archivos.
  - Generar `GITHUB_TOKEN` con permisos `repo`.
 Objetivo: Crear una web tipo acortador/portal con 3 entradas que retienen usuarios mediante temporizadores y anuncios, y un panel admin oculto para subir/gestionar archivos que se almacenarán en GitHub. Usuarios normales no requieren iniciar sesión; sólo el admin.
 Tech stack propuesto: `Next.js` + `TypeScript` + `Tailwind CSS` + Netlify para despliegue. GitHub Contents API para almacenar archivos.
- Resultado esperado:

---
    - `pages/api/` — `admin/auth.ts`, `admin/files.ts`, `ad/heartbeat.ts`.
    - `lib/` — `github.ts`, `auth.ts`, `timers.ts`.
    - `public/` — assets.
- Entrada 2 (`/entry2`):
  - El sistema debe medir que el usuario permaneció 7s en la visita al anuncio antes de desbloquear `Continuar`.
- Entrada 3 (`/entry3`):
  - Temporizadores funcionan en cliente y estado se persiste en sesión/localStorage.

---
  - Alternativa más simple: guardar progreso en `localStorage` y validar con un token firmado por server para evitar manipulación trivial.
  - Si el usuario cambia de pestaña o minimiza, el tiempo no cuenta.
  - El servidor puede responder cuántos segundos faltan.
  - Emisión de JWT guardado en cookie httpOnly con rol `admin` y expiración razonable.
- Funcionalidades del panel `/admin`:
  - Ver lista de archivos (consultar `manifest.json` o GitHub contents).
---
## Fase 5 — Integración con GitHub para subida/gestión de archivos
- Objetivo: Permitir que el admin suba y elimine archivos en el repo automáticamente.
  - Validaciones de tamaño/tipo de archivo en server.
  - Archivo subido por admin aparece en `files/` del repo y en `manifest.json`.
  - Eliminación remueve archivo y actualiza manifest.
## Fase 6 — Descargas y UX final
- Tareas:
  - Consumir `manifest.json` desde la API pública para listar archivos en `/entry3`.
## Fase 7 — Pruebas y validación
- Pruebas manuales:
  - Flujos: Entry1 (8s) → Entry2 (7s) → Entry3 (descarga).


## Fase 8 — CI/CD y Deploy a Netlify
- Criterios de aceptación:

---
  - Variables de entorno necesarias.
  - Cómo obtener `GITHUB_TOKEN` y configurar permisos.
Si quieres, empiezo ahora con el scaffolding y los componentes base (creo proyecto, `TimerButton`, y páginas `index`, `entry2`, `entry3`). Dime si prefieres que genere también los endpoints stubs para GitHub en este primer paso.

---

## Recomendaciones y notas técnicas
- Medir tiempo en anuncios es más fiable si controlamos la página de visita (`/ad-visit`) en lugar de confiar en sitios externos.
- Para evitar manipulación del cliente, combinar `localStorage` + validación server-side con firma de tokens o sessions.
- Evitar exponer `GITHUB_TOKEN` al cliente; todas las operaciones de escritura deben pasar por APIs serverless autenticadas.
- Considerar límites y tamaño de archivos en GitHub (100 MB por archivo en Contents API). Para archivos grandes usar Releases o almacenamiento externo.

---

## Siguientes pasos (acción inmediata que puedo hacer ahora)
1. Scaffolding del proyecto (crear Next.js + TypeScript + Tailwind) y añadir componentes base.
2. Implementar `TimerButton` y páginas `index`, `entry2`, `entry3` con lógica de temporizador.

Si quieres que empiece ahora con el scaffolding y los componentes básicos, dime y lo inicio.
