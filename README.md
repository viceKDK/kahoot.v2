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
- **Sistema de Puntos**:
  - **Base**: 1000 puntos por respuesta correcta
  - **Velocidad**: Bonus por rapidez (50% del tiempo restante)
  - **Rachas**: Puntos extra después de 3 respuestas correctas seguidas
- **Rankings en Vivo**: Top 5 después de cada pregunta
- **Podio Animado**: Top 3 con animaciones y efectos visuales
- **Estadísticas Completas**: Precisión, historial de preguntas y distribución de votos
- **Avatares Aleatorios**: Cada jugador recibe un emoji y color únicos

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

### Flujo del Juego

1. **Crear Sala**:
   - El host accede a `/create`
   - Selecciona un quiz
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
│   │   ├── create/          # Crear sala
│   │   ├── join/[code]/     # Unirse a sala
│   │   ├── host/[code]/     # Lobby del host
│   │   ├── game/[code]/     # Juego en vivo
│   │   └── final/[code]/    # Resultados finales
│   ├── components/          # Componentes reutilizables
│   │   ├── Avatar.tsx
│   │   ├── Timer.tsx
│   │   ├── OptionButton.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── RankingList.tsx
│   │   └── Podium.tsx
│   ├── hooks/               # Custom hooks
│   │   └── useSocket.ts
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

## 🎯 Roadmap Futuro

- [ ] Modo oscuro/claro
- [ ] Editor de quizzes en frontend
- [ ] Categorías y tags para quizzes
- [ ] Salas privadas con contraseña
- [ ] Modo equipo (Team Battle)
- [ ] Integración con Twitch/YouTube Chat
- [ ] PWA para instalación en móvil
- [ ] Soporte multiidioma

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
