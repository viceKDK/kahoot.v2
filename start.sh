#!/bin/bash

# ============================================================================
# QuizArena - Script de Inicio Rápido
# ============================================================================

echo "🎮 Iniciando QuizArena..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si existen los node_modules
if [ ! -d "backend/node_modules" ]; then
    echo "${YELLOW}📦 Instalando dependencias del backend...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    cd frontend && npm install && cd ..
fi

# Verificar si existen los archivos .env
if [ ! -f "backend/.env" ]; then
    echo "${YELLOW}⚠️  No se encontró backend/.env${NC}"
    echo "Copiando backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "${YELLOW}⚠️  Por favor edita backend/.env con tus credenciales de PostgreSQL${NC}"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "${YELLOW}⚠️  No se encontró frontend/.env${NC}"
    echo "Copiando frontend/.env.example..."
    cp frontend/.env.example frontend/.env
fi

# Iniciar backend y frontend en paralelo usando tmux o screen (si está disponible)
if command -v tmux &> /dev/null; then
    echo "${GREEN}🚀 Iniciando con tmux...${NC}"

    # Crear sesión tmux
    tmux new-session -d -s quizarena

    # Backend en panel 1
    tmux send-keys -t quizarena "cd backend && npm run dev" C-m

    # Split horizontal y frontend en panel 2
    tmux split-window -h -t quizarena
    tmux send-keys -t quizarena "cd frontend && npm run dev" C-m

    # Attach a la sesión
    echo ""
    echo "${GREEN}✅ QuizArena iniciado en tmux!${NC}"
    echo ""
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost:3000"
    echo ""
    echo "Para cerrar: Ctrl+B, luego escribe ':kill-session' y Enter"
    echo ""
    tmux attach-session -t quizarena
else
    echo "${YELLOW}⚠️  tmux no está instalado. Iniciando en terminales separadas...${NC}"
    echo ""
    echo "${GREEN}Por favor abre dos terminales y ejecuta:${NC}"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend && npm run dev"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend && npm run dev"
    echo ""
fi
