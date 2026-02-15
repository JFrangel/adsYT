# 🤝 Guía de Contribuciones - Free Fire Portal

¡Gracias por considerar contribuir a **Free Fire Portal**! Este documento te guiará a través del proceso de contribución y los estándares que seguimos.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Comenzar a Desarrollar](#comenzar-a-desarrollar)
3. [Estándares de Código](#estándares-de-código)
4. [Proceso de Pull Request](#proceso-de-pull-request)
5. [Reporte de Bugs](#reporte-de-bugs)
6. [Sugerencias de Mejoras](#sugerencias-de-mejoras)
7. [Estructura del Código](#estructura-del-código)

---

## 💬 Código de Conducta

### Nuestro Compromiso

Nos comprometemos a proporcionar un ambiente acogedor y sin acoso para todos, independientemente de:
- Edad
- Tamaño corporal
- Discapacidad
- Etnia
- Identidad de género
- Nivel de experiencia
- Nacionalidad
- Apariencia personal
- Raza
- Religión
- Identidad u orientación sexual

### Nuestros Estándares

#### Comportamientos Esperados

✅ **HACER:**
- Ser respetuoso y considerado
- Aceptar crítica constructiva
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía con otros miembros
- Ayudar a otros a aprender y crecer

❌ **NO HACER:**
- Lenguaje o conducta sexualizada
- Ataques personales o insultos
- Acoso público o privado
- Publicar información privada sin consentimiento
- Otra conducta inapropiada

---

## 🚀 Comenzar a Desarrollar

### Ambiente Local de Desarrollo

#### 1. Fork del Repositorio

```bash
# Ve a: https://github.com/JFrangel/adsYT
# Click: "Fork" en la esquina superior derecha
```

#### 2. Clonar tu Fork

```bash
git clone https://github.com/TU_USERNAME/adsYT.git
cd "volver al peak"
```

#### 3. Añadir Repositorio Upstream

```bash
git remote add upstream https://github.com/JFrangel/adsYT.git
git remote -v
# Deberías ver:
# origin    https://github.com/TU_USERNAME/adsYT.git (fetch/push)
# upstream  https://github.com/JFrangel/adsYT.git (fetch)
```

#### 4. Crear Rama para tu Feature

```bash
git checkout -b feature/tu-feature-name
# Ejemplo:
# git checkout -b feature/add-dark-mode
# git checkout -b feature/fix-download-api
# git checkout -b feature/add-user-analytics
```

#### 5. Instalar Dependencias

```bash
npm install
```

#### 6. Configurar Variables de Entorno

```bash
cp .env.example .env.local

# Edita .env.local con valores de desarrollo
# Para desarrollo local, puedes usar valores dummy:
ENCRYPTION_KEY=dummy_key_for_local_development_32bytes_
GITHUB_TOKEN_ENCRYPTED=dummy:encrypted
GITHUB_OWNER=JFrangel
GITHUB_REPO=adsYT
GITHUB_BRANCH=main
ADMIN_USER=dev_admin
ADMIN_PASS=dev_password_123
JWT_SECRET=dev_jwt_secret_key_local_only
NODE_ENV=development
```

#### 7. Ejecutar en Desarrollo

```bash
npm run dev

# Abre: http://localhost:3000
```

### Ambiente de Pruebas

#### Ejecutar Tests

```bash
# Tests unitarios (si existen)
npm test

# Tests e2e (si existen)
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

#### Build para Producción

```bash
npm run build
npm start

# Abre: http://localhost:3000
```

---

## 📐 Estándares de Código

### TypeScript

#### ✅ Hacer

```typescript
// Usar tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): User | null {
  // implementación
}

// Usar generics cuando sea apropiado
function processArray<T>(items: T[]): T[] {
  return items.filter(item => item !== null);
}

// Usar interfaces para props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);
```

#### ❌ No Hacer

```typescript
// Evitar 'any'
function processData(data: any) {
  return data.map(x => x.value);
}

// Evitar tipos implícitos
const user = { name: 'John', age: 30 }; // type: any

// Evitar omitir tipos en props
export const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);
```

### React

#### ✅ Hacer

```typescript
// Usar functional components
export const MyComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  
  return <div>{count}</div>;
};

// Usar hooks correctamente
function useCustomHook() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // lado efectos
  }, [dependencies]);
  
  return data;
}

// Memoizar cuando sea necesario
const MemoizedComponent = React.memo(MyComponent);

// Usar destructuring
const { id, name, email } = props;
```

#### ❌ No Hacer

```typescript
// Evitar class components (excepto Error Boundaries)
class MyComponent extends React.Component { }

// Evitar mutación de estado
setState(state => {
  state.items.push(newItem);
  return state;
});

// Evitar efectos sin dependencias
useEffect(() => {
  // Esto se ejecuta en cada render
});

// Evitar lógica compleja en JSX
<div>
  {users.map(u => u.active && u.role === 'admin' && u.verified === true ? <User /> : null)}
</div>
```

### Estilos CSS

#### ✅ Hacer

```css
/* Usar Tailwind CSS */
<div className="flex justify-center items-center p-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
  Content
</div>

/* Usar custom CSS con scoping */
<style>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .component {
    animation: fadeIn 0.3s ease-in-out;
  }
`}</style>

/* Usar variables CSS */
:root {
  --primary: #FF6B35;
  --secondary: #004E89;
}

.element {
  color: var(--primary);
}
```

#### ❌ No Hacer

```css
/* Evitar inline styles complejos */
<div style={{backgroundColor: 'red', padding: '20px', margin: '10px', ...}}>

/* Evitar !important */
.element {
  color: red !important;
}

/* Evitar selectores muy específicos */
body > div:nth-child(2) > section > article.main > div.content > p:first-child {
  color: blue;
}
```

### Naming Conventions

#### Archivos y Carpetas

```
├── components/
│   ├── TimerButton.tsx        # PascalCase para componentes
│   ├── Icons.tsx
│   └── index.ts               # Barrels para exports
│
├── pages/
│   ├── index.tsx              # PascalCase pero lowercase para rutas
│   ├── admin/
│   │   └── index.tsx
│   └── api/
│       └── download.ts        # kebab-case para APIs
│
├── lib/
│   ├── encryption.ts          # snake_case para utils
│   ├── timers.ts
│   └── types.ts
│
└── styles/
    └── globals.css            # kebab-case para estilos
```

#### Variables y Funciones

```typescript
// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const API_BASE_URL = 'https://api.example.com';

// Variables: camelCase
const userName = 'John';
let isLoading = false;

// Funciones: camelCase
function calculateTotal(items: number[]): number {
  return items.reduce((a, b) => a + b, 0);
}

// Componentes: PascalCase
const MyComponent: React.FC = () => {};

// Interfaces/Types: PascalCase
interface UserData {
  id: string;
  name: string;
}

type Status = 'pending' | 'success' | 'error';

// Enums: PascalCase
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST',
}

// Props interfaces: ComponentNameProps
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Event handlers: onEventName
<button onClick={handleClick} />
<input onChange={handleInputChange} />
```

### Formato de Código

Usamos **Prettier** para formateo automático. El proyecto incluye `.prettierrc.json`:

```bash
# Formatear automáticamente
npm run format

# Verificar sin cambiar
npm run format:check
```

---

## ✅ Proceso de Pull Request

### Antes de Comenzar

1. **Sincroniza tu fork**

```bash
git fetch upstream
git rebase upstream/main
```

2. **Crea rama feature**

```bash
git checkout -b feature/description
```

3. **Desarrolla tu cambio**

```bash
# Haz commits frecuentes y descriptivos
git add .
git commit -m "feat: Descripción clara del cambio"
```

### Commit Messages

Seguimos **Conventional Commits**:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - Nueva feature
- `fix:` - Bug fix
- `docs:` - Cambios de documentación
- `style:` - Cambios de formato (sin cambios funcionales)
- `refactor:` - Refactorización sin cambios funcionales
- `perf:` - Mejoras de rendimiento
- `test:` - Añadir/actualizar tests
- `chore:` - Cambios de build, dependencies, etc.

**Ejemplos:**

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(download): resolve 404 error in file endpoint"
git commit -m "docs(readme): add encryption setup guide"
git commit -m "refactor(timer): simplify timer logic with custom hook"
```

### Enviar Pull Request

1. **Push a tu fork**

```bash
git push origin feature/description
```

2. **Crear PR en GitHub**
   - Ve a: https://github.com/TU_USERNAME/adsYT
   - Click: "Compare & pull request"
   - Llena la plantilla de PR

3. **Template de PR**

```markdown
## Descripción

Describe brevemente qué cambios haces y por qué.

## Tipo de Cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha testeado?

Describe los pasos para reproducir tu test:

1. ...
2. ...
3. ...

## Checklist

- [ ] Mi código sigue los estándares del proyecto
- [ ] He hecho self-review de mi código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] He añadido tests
- [ ] Tests pasan localmente
```

4. **Espera Review**
   - Los mantenedores revisarán tu PR
   - Se puede solicitar cambios
   - Una vez aprobado: merge a `main`

---

## 🐛 Reporte de Bugs

### Antes de Reportar

- **Verifica si ya existe** en [Issues](https://github.com/JFrangel/adsYT/issues)
- **Usa search** para bugs similares
- **Lee la documentación** para clarificar dudas

### Cómo Reportar

1. Ve a [Issues](https://github.com/JFrangel/adsYT/issues)
2. Click: "New issue"
3. Completa la plantilla:

```markdown
## Descripción del Bug

Descripción clara y concisa del problema.

## Pasos para Reproducir

1. ...
2. ...
3. ...

## Comportamiento Esperado

Qué debería suceder normalmente.

## Comportamiento Actual

Qué sucede realmente.

## Capturas/Logs

[Si aplica, adjunta evidencia]

## Información del Sistema

- OS: [Windows/Mac/Linux]
- Node.js versión: [12.0.0]
- npm versión: [6.0.0]
- Browser: [Chrome/Firefox]
```

---

## 💡 Sugerencias de Mejoras

### Cómo Sugerir

1. Ve a [Discussions](https://github.com/JFrangel/adsYT/discussions)
2. Click: "New discussion"
3. Completa:

```markdown
## Sugerencia

Descripción clara de tu idea.

## Problema que Resuelve

Por qué crees que esto es necesario.

## Alternativas Consideradas

Otros enfoques que pensaste.

## Contexto Adicional

[Información extra útil]
```

### Ejemplos de Mejoras Bienvenidas

✅ **Bien Recibidas:**
- Nuevas features que no rompen nada existente
- Mejoras de seguridad
- Optimizaciones de rendimiento
- Mejoras de documentación
- Nuevos tests
- Soporte para nuevos idiomas

❌ **No Aceptadas:**
- Cambios que rompen APIs existentes sin migration path
- Features que violan privacidad del usuario
- Cambios de estilo opinativos sin discusión previa
- Características no solicitadas importantes

---

## 🏗️ Estructura del Código

### Organización General

```
proyecto/
├── components/        # React components reutilizables
│   ├── TimerButton.tsx
│   └── Icons.tsx
│
├── pages/            # Rutas de Next.js (automático routing)
│   ├── index.tsx     # GET /
│   ├── entry2.tsx    # GET /entry2
│   ├── api/
│   │   ├── files.ts  # GET /api/files
│   │   └── download.ts
│   └── admin/
│       └── login.tsx # GET /admin/login
│
├── lib/              # Lógica reutilizable
│   ├── auth.ts
│   ├── encryption.ts
│   ├── types.ts      # TypeScript types compartidos
│   └── utils.ts
│
├── styles/           # CSS global
│   └── globals.css
│
└── public/           # Assets estáticos
    ├── favicon.ico
    └── images/
```

### Cómo Agregar Nueva Feature

#### 1. Página Nueva

```typescript
// pages/mi-pagina.tsx
import React from 'react';
import type { NextPage } from 'next';

const MiPagina: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>Mi Nueva Página</h1>
    </div>
  );
};

export default MiPagina;
```

Ahora disponible en: `/mi-pagina`

#### 2. Componente Nuevo

```typescript
// components/MiComponente.tsx
import React from 'react';

interface MiComponenteProps {
  title: string;
  onClick?: () => void;
}

export const MiComponente: React.FC<MiComponenteProps> = ({ title, onClick }) => {
  return (
    <div onClick={onClick} className="p-4 rounded-lg bg-blue-500 text-white">
      {title}
    </div>
  );
};
```

Uso:

```typescript
import { MiComponente } from '@/components/MiComponente';

<MiComponente title="Hello" onClick={() => console.log('clicked')} />
```

#### 3. API Endpoint Nuevo

```typescript
// pages/api/mi-endpoint.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
  status: number;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Success', status: 200 });
  } else if (req.method === 'POST') {
    const { data } = req.body;
    // Procesar data
    res.status(201).json({ message: 'Created', status: 201 });
  } else {
    res.status(405).json({ message: 'Method not allowed', status: 405 });
  }
}
```

Acceso: `GET /api/mi-endpoint` o `POST /api/mi-endpoint`

---

## 📚 Recursos Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org)

---

## ❓ Preguntas?

- Abre una [Discussion](https://github.com/JFrangel/adsYT/discussions)
- Revisa [Issues Cerrados](https://github.com/JFrangel/adsYT/issues?q=is%3Aissue+is%3Aclosed) para preguntas similares
- Contacta a [JFrangel](https://github.com/JFrangel)

---

## 🎉 ¡Gracias por Contribuir!

Tu trabajo es valioso para mejorar Free Fire Portal.

**¡Happy coding!** 🚀
