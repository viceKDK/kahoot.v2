# 🚀 QuizArena - Inicio Rápido

Guía rápida para poner en marcha QuizArena en 5 minutos.

## 📋 Prerequisitos

Asegúrate de tener instalado:
- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **PostgreSQL** 14+ ([Descargar](https://www.postgresql.org/download/))

## ⚡ Inicio Rápido

### 1. Configurar PostgreSQL

```bash
# Iniciar PostgreSQL (depende de tu OS)
# macOS con Homebrew:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE quizarena;"
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar configuración de ejemplo
cp .env.example .env

# Editar .env con tu password de PostgreSQL
# Cambia la línea: DB_PASSWORD=your_password_here
nano .env  # o usa tu editor favorito

# Ejecutar migraciones (crea tablas y quiz de ejemplo)
npm run db:migrate
```

### 3. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar configuración (no necesita edición)
cp .env.example .env
```

### 4. Iniciar la Aplicación

**Opción A: Con tmux (recomendado)**

```bash
cd ..
./start.sh
```

**Opción B: Dos terminales separadas**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 5. Abrir en el Navegador

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## 🎮 Probar la Aplicación

1. Abre el frontend en tu navegador
2. Click en **"Crear Nueva Sala"**
3. Ingresa tu nombre
4. Selecciona el quiz de ejemplo
5. Comparte el código con amigos (o abre en otra pestaña en modo incógnito)
6. ¡Juega!

## 🐛 Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `backend/.env`
- Asegúrate de que la base de datos `quizarena` exista

### Error: "Port 3000 already in use"
- Cierra otras aplicaciones que usen el puerto 3000
- O cambia el puerto en `frontend/package.json` (script dev)

### Error: "Module not found"
- Ejecuta `npm install` en ambas carpetas (backend y frontend)

## 📚 Siguiente Paso

Lee el [README.md](README.md) completo para entender la arquitectura y funcionalidades avanzadas.

## 💡 Crear tu Primer Quiz

Puedes crear quizzes usando la API REST:

```bash
curl -X POST http://localhost:3001/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Quiz",
    "description": "Quiz personalizado",
    "createdBy": "tu_nombre",
    "isPublic": true,
    "questions": [
      {
        "text": "¿Cuál es la capital de España?",
        "timeLimit": 15000,
        "options": [
          {"text": "Madrid", "isCorrect": true},
          {"text": "Barcelona", "isCorrect": false},
          {"text": "Valencia", "isCorrect": false},
          {"text": "Sevilla", "isCorrect": false}
        ]
      }
    ]
  }'
```

¡Listo! Ahora puedes crear tu propia sala y jugar con tus amigos 🎉
