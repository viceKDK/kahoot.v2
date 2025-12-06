# 🧪 INSTRUCCIONES DE PRUEBA - Sistema de Instancias + UI NEO-ARCADE

## 🚀 Inicio Rápido

### 1. Instalar dependencias (si no lo has hecho)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Iniciar servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Acceder a la aplicación

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## ✅ CHECKLIST DE PRUEBAS

### Prueba 1: Modo FAST (Avance Individual)

1. **Crear Juego**
   - [ ] Ir a http://localhost:3000
   - [ ] Crear un nuevo juego
   - [ ] Seleccionar modo: **FAST**
   - [ ] Verificar que aparece QR y código

2. **Unir Jugadores**
   - [ ] Abrir 2-3 pestañas en modo incógnito
   - [ ] Unir jugadores con nombres diferentes
   - [ ] Verificar que aparecen en el lobby del host

3. **Iniciar Juego**
   - [ ] Host: Click en "Iniciar Juego"
   - [ ] Todos ven la primera pregunta

4. **Responder a Diferente Velocidad**
   - [ ] **Jugador 1**: Responder inmediatamente
     - [ ] ✅ Ver explosión de partículas (si es correcto)
     - [ ] ✅ Ver texto neón "¡CORRECTO!" o "¡FALLASTE!"
     - [ ] ✅ Ver puntos ganados con animación pulsante
     - [ ] ✅ Ver scanlines animadas
   - [ ] **Jugador 2**: Esperar 5 segundos, luego responder
   - [ ] **Jugador 3**: Esperar 10 segundos, luego responder

5. **Verificar Avance Independiente**
   - [ ] Jugador 1 debería ver el RANKING antes que los demás
   - [ ] Jugador 1 avanza a pregunta 2 mientras otros están en pregunta 1
   - [ ] Cada jugador ve su propia posición destacada en el ranking

6. **Pantalla de Ranking**
   - [ ] ✅ Ver título "RANKINGS" con efecto neón magenta
   - [ ] ✅ Ver trofeo animado (rotación sutil)
   - [ ] ✅ Ver "Posición: #X" con borde cyan brillante
   - [ ] ✅ Ver scanlines en el cuadro de posición
   - [ ] ✅ Ver orbe de luz pulsante en el fondo

7. **Finalizar**
   - [ ] Todos completan todas las preguntas
   - [ ] Redirección a pantalla final con podio

---

### Prueba 2: Modo WAIT_ALL (Avance Sincronizado)

1. **Crear Juego**
   - [ ] Crear nuevo juego
   - [ ] Seleccionar modo: **WAIT_ALL**

2. **Unir Jugadores**
   - [ ] Unir 2-3 jugadores

3. **Iniciar y Responder**
   - [ ] Host inicia el juego
   - [ ] **Jugador 1** responde primero
     - [ ] Ve feedback inmediato
     - [ ] Ve "Esperando a los demás..." (NO avanza aún)
   - [ ] **Jugador 2** responde
   - [ ] **Jugador 3** responde

4. **Verificar Avance Sincronizado**
   - [ ] Cuando TODOS responden, TODOS ven ranking al mismo tiempo
   - [ ] TODOS avanzan a la siguiente pregunta juntos
   - [ ] Nadie puede estar en pregunta diferente

---

### Prueba 3: Efectos Visuales NEO-ARCADE

#### Fondo Animado
- [ ] Ver grid retro-futurista moviéndose verticalmente
- [ ] Ver orbes de luz cyan y magenta flotando
- [ ] Ver scanlines sutiles
- [ ] Ver viñeta en los bordes

#### Pantalla de Feedback
- [ ] **Respuesta Correcta:**
  - [ ] Explosión de 30 partículas coloridas
  - [ ] Icono ⚡ con animación de rotación
  - [ ] Texto "¡CORRECTO!" en neón verde brillante
  - [ ] Cuadro de puntos con borde verde neón
  - [ ] Número de puntos pulsando (scale animation)
  - [ ] Scanlines moviéndose de abajo hacia arriba

- [ ] **Respuesta Incorrecta:**
  - [ ] Icono 💥 con animación
  - [ ] Texto "¡FALLASTE!" en neón rojo con efecto flicker
  - [ ] Sin partículas (solo icono)

#### Pantalla de Ranking
- [ ] Título "RANKINGS" con efecto neón magenta
- [ ] Trofeo 🏆 con rotación sutil
- [ ] Cuadro de posición con borde cyan brillante
- [ ] Scanlines en el cuadro
- [ ] Orbe pulsante en el fondo

#### Tipografías
- [ ] Textos neón usando Orbitron (display)
- [ ] Textos normales usando Rajdhani (body)
- [ ] Texto bold usando Bebas Neue

---

### Prueba 4: Host Dashboard

1. **Durante el Juego**
   - [ ] Host ve tabla de estadísticas en tiempo real
   - [ ] Tabla muestra: Jugador, Score, Aciertos, Fallos, Precisión
   - [ ] Estadísticas se actualizan en tiempo real

2. **Verificar Unicast**
   - [ ] Host NO ve las preguntas (solo tabla)
   - [ ] Jugadores NO ven la tabla del host
   - [ ] Cada jugador solo ve SUS propias transiciones

---

### Prueba 5: Desconexiones

1. **Desconectar Jugador**
   - [ ] Cerrar pestaña de un jugador mientras juega
   - [ ] Verificar en consola del backend: "Player {id} disconnected"
   - [ ] Otros jugadores continúan normalmente

2. **Reconectar** (Opcional - NO implementado)
   - Sistema actual NO soporta reconexión
   - Jugador desconectado debe volver a unirse

---

## 🐛 PROBLEMAS COMUNES

### "Socket not found" en consola
- **Causa**: Jugador desconectado pero el server intenta enviarle eventos
- **Solución**: Normal, el sistema lo maneja con warning en consola
- **No afecta** a otros jugadores

### Fuentes no cargan
- **Causa**: Google Fonts bloqueado
- **Solución**: Verificar conexión a internet
- **Fallback**: Se usa Rajdhani o sans-serif

### Animaciones lentas
- **Causa**: Dispositivo con bajo rendimiento
- **Solución**: Reducir número de partículas en `ParticleExplosion.tsx`
- **Línea 35**: Cambiar `30` a `15` partículas

### Ranking no muestra posición
- **Causa**: `currentPlayerRank` es null
- **Verificar**: Evento `player:show_ranking` está siendo recibido
- **Debug**: Abrir DevTools → Network → WS → Ver mensajes

---

## 📊 MÉTRICAS DE ÉXITO

### Funcionalidad
- ✅ Modo FAST: Jugadores avanzan independientemente
- ✅ Modo WAIT_ALL: Jugadores avanzan juntos
- ✅ Feedback instantáneo al responder
- ✅ Ranking actualizado en tiempo real
- ✅ Sin bugs de sincronización

### Experiencia Visual
- ✅ Animaciones suaves (60 FPS)
- ✅ Efectos neón visibles y brillantes
- ✅ Partículas fluidas
- ✅ Fondo animado sin lag
- ✅ Tipografías correctas

### Performance
- ✅ Tiempo de respuesta < 100ms
- ✅ Sin warnings en consola (excepto socket disconnected)
- ✅ Sin memory leaks
- ✅ Transiciones < 500ms

---

## 🎮 FLUJO IDEAL DE UNA PARTIDA

1. **LOBBY** (5-10s)
   - Host crea juego
   - Jugadores se unen
   - Host inicia

2. **PREGUNTA 1** (30s)
   - Todos ven pregunta
   - Timer cuenta regresiva
   - Jugadores responden

3. **FEEDBACK** (2s)
   - ⚡ Explosión de partículas
   - 🎨 Texto neón "¡CORRECTO!"
   - 💯 Puntos con animación

4. **RANKING** (3s)
   - 🏆 Posiciones actualizadas
   - 📊 Top 5 jugadores
   - 🎯 Tu posición destacada

5. **PREGUNTA 2** (30s)
   - Siguiente pregunta...
   - Repetir ciclo

6. **FINAL**
   - Podio con top 3
   - Estadísticas finales
   - Historial de preguntas

**Tiempo total**: ~5 minutos para 5 preguntas

---

## 🔧 DEBUG AVANZADO

### Ver eventos Socket.IO en tiempo real

```javascript
// En DevTools Console (F12)
// Pegar este código:

const socket = window.globalSocket || io();
socket.onAny((event, ...args) => {
  console.log(`📡 ${event}:`, args);
});
```

### Ver estado del store

```javascript
// En cualquier componente
const state = useGameStore.getState();
console.log('Store:', state);
```

### Verificar mapeo socket-player (Backend)

```typescript
// En gameSocket.ts, agregar log temporal:
console.log('Player sockets:', Array.from(this.playerSockets.entries()));
```

---

## 🎉 ¡LISTO!

Si todas las pruebas pasan, el sistema está **100% funcional** con:
- ✅ Instancias independientes por jugador
- ✅ Comunicación unicast eficiente
- ✅ Modos FAST y WAIT_ALL
- ✅ UI NEO-ARCADE impresionante
- ✅ Animaciones suaves y fluidas

**¡A JUGAR!** 🚀🎮⚡
