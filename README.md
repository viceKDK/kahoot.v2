# 🎮 QuizArena - Kahoot-like Quiz Game

Una aplicación de quizzes en tiempo real inspirada en Kahoot, construida con **Next.js**, **Socket.IO**, **PostgreSQL** y **TypeScript**.

![QuizArena](https://img.shields.io/badge/Status-Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Crear Sala**: El host crea una sala y obtiene un código de 6 dígitos + QR
- **Unirse en Tiempo Real**: Los jugadores se unen escaneando QR o ingresando código
- **Lobby Pre-Juego**: Vista de jugadores conectados antes de iniciar
- **Preguntas Cronometradas**: Timer circular visual con límite de tiempo
- **4 Opciones Siempre**: Botones grandes y coloridos estilo Kahoot
- **Sistema de Puntos Optimizado**:
  - **Velocidad**: 1000 puntos base que disminuyen linealmente con el tiempo
    - Respuesta inmediata: 1000 puntos
    - Respuesta tardía: mínimo 200 puntos garantizados
    - Penalización proporcional: cada segundo resta puntos según el tiempo límite
  - **Rachas Progresivas**: Multiplicador que aumenta con cada respuesta correcta consecutiva
    - Racha 1: ×1.1 (+10% puntos)
    - Racha 2: ×1.2 (+20% puntos)
    - Racha 3: ×1.3 (+30% puntos)
    - Racha 10+: ×2.0 (máximo, el doble de puntos)
  - **Ejemplos** (pregunta 20s):
    - Responder en 5s sin racha: 800 pts
    - Responder en 5s con racha 3: 1,040 pts
    - Responder instantáneo con racha 10: 2,000 pts
- **Rankings en Vivo**: Top 5 después de cada pregunta
- **Podio Animado**: Top 3 con animaciones y efectos visuales
- **Estadísticas Completas**: Precisión, historial de preguntas y distribución de votos
- **Avatares Aleatorios**: Cada jugador recibe un emoji y color únicos

### 📝 Gestión de Quizzes

- **Crear Quizzes Personalizados**: Editor visual para crear tus propios quizzes
  - Título y descripción
  - Público/privado
  - Agregar/editar/eliminar preguntas
  - 4 opciones por pregunta (obligatorio)
  - Marcar 1 respuesta correcta
  - Tiempo límite personalizable (10-60 segundos)
  - Soporte para imágenes (URL)
- **Mis Quizzes**: Gestiona todos tus quizzes creados
  - Ver lista de quizzes
  - Editar quizzes existentes
  - Eliminar quizzes
  - Duplicar quizzes
  - Crear sala directamente desde un quiz
- **Editor Visual de Preguntas**:
  - Texto de pregunta (máx 500 caracteres)
  - 4 opciones con colores (rojo, azul, amarillo, verde)
  - Selección visual de respuesta correcta
  - Preview de imágenes en tiempo real
  - Validaciones automáticas

### 🏗️ Arquitectura

#### Backend
- **Node.js + Express**: Servidor REST API
- **Socket.IO**: WebSockets para comunicación en tiempo real
- **PostgreSQL**: Base de datos para quizzes (jugadores no persisten)
- **TypeScript**: Tipado estático
- **Patrones**: SOLID, GRASP, Repository Pattern, Singleton

#### Frontend
- **Next.js 15**: React framework con App Router
- **TailwindCSS**: Estilos utility-first
- **Zustand**: Gestión de estado global
- **Framer Motion**: Animaciones fluidas
- **Socket.IO Client**: Comunicación WebSocket

## 🚀 Instalación y Configuración

### Prerequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd kahoot.v2
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Editar `.env`** con tus credenciales de PostgreSQL:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=quizarena
DB_USER=postgres
DB_PASSWORD=tu_password

CORS_ORIGIN=http://localhost:3000
```

**Crear la base de datos y ejecutar migraciones:**

```bash
# Crear base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE quizarena;"

# Ejecutar migraciones (crea tablas y datos de ejemplo)
npm run db:migrate
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Editar `.env`:**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 4. Iniciar la Aplicación

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

El servidor estará corriendo en `http://localhost:3001`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📖 Uso

### Flujo de Creación de Quizzes

1. **Acceder al Editor**:
   - Desde la home, click en "Crear Quiz"
   - O visita `/quizzes/create`

2. **Crear el Quiz**:
   - Ingresa título y descripción
   - Marca si es público o privado
   - Click en "Agregar Pregunta"

3. **Agregar Preguntas**:
   - Escribe el texto de la pregunta
   - (Opcional) Agrega URL de imagen
   - Ajusta el tiempo límite con el slider
   - Ingresa las 4 opciones
   - Marca la respuesta correcta
   - Click en "Guardar"

4. **Gestionar Quizzes**:
   - Ve a "Mis Quizzes" desde la home
   - Edita, duplica o elimina tus quizzes
   - Crea una sala directamente desde un quiz

### Flujo del Juego

1. **Crear Sala**:
   - El host accede a `/create`
   - Selecciona un quiz (público o propio)
   - Obtiene código de 6 dígitos y QR

2. **Unirse**:
   - Los jugadores escanean QR o ingresan código en `/`
   - Eligen su nombre
   - Aparecen en el lobby

3. **Iniciar Juego**:
   - El host inicia el juego desde el lobby
   - Comienza la primera pregunta

4. **Responder**:
   - Los jugadores ven la pregunta con timer
   - Seleccionan una de las 4 opciones
   - Reciben feedback inmediato

5. **Ver Resultados**:
   - Distribución de votos por opción
   - Respuesta correcta resaltada
   - Puntos ganados

6. **Ranking**:
   - Top 5 jugadores después de cada pregunta
   - Actualización en tiempo real

7. **Final**:
   - Podio del Top 3 con animaciones
   - Ranking completo con precisión
   - Historial de preguntas

## 🎯 Sistema de Puntuación Detallado

QuizArena utiliza un sistema de puntuación optimizado que recompensa tanto la velocidad como la consistencia.

### 🚀 Puntos por Velocidad

El sistema asigna **1000 puntos base** que disminuyen linealmente con el tiempo transcurrido:

```
Puntos = 1000 - (segundos_transcurridos × penalización_por_segundo)
Mínimo garantizado: 200 puntos
```

**Penalización por segundo** se calcula según el tiempo límite de cada pregunta:
- `penalización_por_segundo = (1000 - 200) / tiempo_límite_en_segundos`

#### Ejemplos por Tiempo de Pregunta:

**Pregunta de 10 segundos** (80 pts/seg):
- 0s → 1000 pts | 2s → 840 pts | 5s → 600 pts | 10s → 200 pts

**Pregunta de 20 segundos** (40 pts/seg):
- 0s → 1000 pts | 5s → 800 pts | 10s → 600 pts | 20s → 200 pts

**Pregunta de 60 segundos** (13.33 pts/seg):
- 0s → 1000 pts | 15s → 800 pts | 30s → 600 pts | 60s → 200 pts

### 🔥 Sistema de Rachas

Las rachas multiplican los puntos obtenidos, incentivando respuestas correctas consecutivas:

```
Multiplicador = 1 + (racha × 0.10)
Máximo: ×2.0 (racha 10 o más)
```

| Racha | Multiplicador | Ejemplo (600 pts base) |
|-------|---------------|------------------------|
| 0 | ×1.0 | 600 pts |
| 1 | ×1.1 | 660 pts (+10%) |
| 2 | ×1.2 | 720 pts (+20%) |
| 3 | ×1.3 | 780 pts (+30%) |
| 5 | ×1.5 | 900 pts (+50%) |
| 10+ | ×2.0 | 1,200 pts (+100%) |

### 💎 Puntos Máximos Posibles

| Escenario | Puntos |
|-----------|--------|
| Respuesta inmediata (0s), sin racha | 1,000 |
| Respuesta inmediata (0s), racha 1 | 1,100 |
| Respuesta inmediata (0s), racha 3 | 1,300 |
| Respuesta inmediata (0s), racha 5 | 1,500 |
| **Respuesta inmediata (0s), racha 10+** | **2,000** 🏆 |

### ✨ Características del Sistema

✅ **Justo y proporcional**: Responder a mitad del tiempo siempre da 600 pts (sin racha), independiente del tiempo límite
✅ **Recompensa velocidad**: Cuanto más rápido respondas, más puntos obtienes
✅ **Incentiva rachas**: Cada respuesta correcta consecutiva aumenta el multiplicador en 10%
✅ **Sin penalización excesiva**: Mínimo 200 puntos garantizados por respuesta correcta
✅ **Tope balanceado**: Máximo ×2.0 en rachas para mantener el juego competitivo

## 🗂️ Estructura del Proyecto

```
kahoot.v2/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (DB, migrations)
│   │   ├── models/          # Repositories (QuizRepository, GameSessionRepository)
│   │   ├── services/        # Lógica de negocio (GameService, ScoringService)
│   │   ├── controllers/     # REST API controllers
│   │   ├── sockets/         # Socket.IO handlers
│   │   ├── utils/           # Utilidades (code generator)
│   │   └── server.ts        # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── page.tsx         # Home
│   │   ├── create/          # Crear sala de juego
│   │   ├── join/[code]/     # Unirse a sala
│   │   ├── host/[code]/     # Lobby del host
│   │   ├── game/[code]/     # Juego en vivo
│   │   ├── final/[code]/    # Resultados finales
│   │   └── quizzes/         # Gestión de quizzes
│   │       ├── create/      # Crear nuevo quiz
│   │       ├── edit/[id]/   # Editar quiz
│   │       └── my-quizzes/  # Mis quizzes
│   ├── components/          # Componentes reutilizables
│   │   ├── Avatar.tsx
│   │   ├── Timer.tsx
│   │   ├── OptionButton.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── RankingList.tsx
│   │   ├── Podium.tsx
│   │   └── QuestionEditor.tsx  # Editor de preguntas
│   ├── hooks/               # Custom hooks
│   │   └── useSocket.ts
│   ├── lib/                 # Utilidades
│   │   └── userStorage.ts   # Gestión de usuario local
│   ├── store/               # Zustand store
│   │   └── gameStore.ts
│   ├── styles/              # Estilos globales
│   │   └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── shared/
    └── types/               # Tipos compartidos
        └── index.ts
```

## 🎨 Diseño y UX

- **Colores**: Inspirados en Kahoot (violeta, colores vivos)
- **Animaciones**: Framer Motion para transiciones suaves
- **Responsive**: Funciona en desktop, tablet y móvil
- **Accesibilidad**: Botones grandes, alto contraste

## 🔒 Seguridad

- **Rate Limiting**: Prevención de spam (próximamente)
- **Validación de Datos**: TypeScript + validaciones en backend
- **Rooms Aislados**: Socket.IO rooms por juego
- **Sin Persistencia de Jugadores**: Solo el host guarda quizzes

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📦 Deployment

### Backend (Render, Fly.io, Railway)

1. Crear base de datos PostgreSQL
2. Configurar variables de entorno
3. Ejecutar migraciones
4. Deploy del servidor Node.js

### Frontend (Vercel, Netlify)

1. Configurar `NEXT_PUBLIC_BACKEND_URL`
2. Deploy de Next.js

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Zustand, Framer Motion |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Base de Datos** | PostgreSQL |
| **Real-time** | WebSockets (Socket.IO) |
| **Patrones** | SOLID, GRASP, Repository, Singleton |

## 🎯 Roadmap

### ✅ Completado

- [x] **Editor de quizzes en frontend** - Sistema completo de creación y gestión de quizzes
- [x] **Soporte para imágenes** - URLs de imágenes en preguntas
- [x] **Duplicar quizzes** - Funcionalidad de duplicar tus propios quizzes
- [x] **Gestión completa de quizzes** - Crear, editar, eliminar, duplicar
- [x] **Sistema de puntuación optimizado** - Velocidad con penalización lineal y rachas progresivas

### 🔮 Futuro

- [ ] Categorías y tags para quizzes
- [ ] Búsqueda de quizzes públicos
- [ ] Modo equipo (Team Battle)
- [ ] PWA para instalación en móvil
- [ ] Soporte multiidioma
- [ ] Upload de imágenes (actualmente solo URL)
- [ ] Exportar/importar quizzes (JSON)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 👥 Autores

Creado con ❤️ para jugar con amigos

---

**¿Preguntas?** Abre un issue en GitHub
