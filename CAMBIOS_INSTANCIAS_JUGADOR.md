# Documentación de Cambios - Sistema de Instancias por Jugador

## Fecha: 2025-12-05

## Contexto

El sistema ya tiene implementado un **sistema de instancias individuales por jugador** en el backend (`PlayerGameState`), pero existen problemas de sincronización y comunicación que impiden que funcione correctamente.

---

## Problemas Identificados

### 1. **Eventos Broadcast en lugar de Unicast**

**Problema**: Los eventos individuales de jugador se envían a TODA la sala usando `this.io.to(code).emit()`, lo que significa que todos los jugadores reciben todos los eventos.

**Ubicación**: `backend/src/sockets/gameSocket.ts:263-269`

```typescript
// ACTUAL (INCORRECTO)
this.io.to(code).emit(SocketEvents.PLAYER_QUESTION_START, {
  question: currentQuestion,
  questionNumber: playerState.currentQuestionIndex + 1,
  totalQuestions: game.quiz.questions.length,
  startTime: playerState.questionStartTime!,
  playerState,
});
```

**Impacto**:
- Todos los jugadores reciben eventos de otros jugadores
- Necesita filtrado en el cliente (ineficiente y propenso a errores)
- Puede causar desincronización si el filtro falla

---

### 2. **Sin Mapeo Socket-Player**

**Problema**: No existe un mapeo de `socketId` → `playerId`, por lo que no es posible enviar eventos unicast a jugadores específicos.

**Ubicación**: `backend/src/sockets/gameSocket.ts`

**Necesario**:
```typescript
private playerSockets: Map<string, string> = new Map(); // playerId -> socketId
```

**Impacto**:
- Imposible enviar eventos solo al jugador específico
- No se puede rastrear desconexiones de jugadores

---

### 3. **Filtros Ineficientes en el Cliente**

**Problema**: El frontend filtra eventos después de recibirlos, en lugar de recibir solo sus propios eventos.

**Ubicación**: `frontend/hooks/useSocket.ts:137-148`

```typescript
// ACTUAL (INEFICIENTE)
socket.on(SocketEvents.PLAYER_QUESTION_START, (payload: any) => {
  const { currentPlayer: player } = useGameStore.getState();
  if (!player || payload.playerState?.playerId !== player.id) {
    return; // Descarta eventos de otros jugadores
  }
  // ... procesar evento
});
```

**Impacto**:
- Código duplicado y complejo
- Posibles errores de sincronización
- Mayor uso de ancho de banda

---

### 4. **Falta de Transiciones Visuales**

**Problema**: No hay animaciones adecuadas entre los diferentes estados del juego (QUESTION → RESULTS → RANKING → NEXT_QUESTION).

**Ubicación**: Componentes del frontend

**Impacto**:
- Experiencia de usuario pobre
- Cambios abruptos entre pantallas
- Difícil seguir el flujo del juego

---

## Soluciones Implementadas

### ✅ Solución 1: Mapeo Socket-Player

**Archivo**: `backend/src/sockets/gameSocket.ts`

**Cambios**:
1. Agregar propiedad privada para mapear jugadores a sockets:
   ```typescript
   private playerSockets: Map<string, string> = new Map();
   ```

2. Registrar socket cuando jugador se une:
   ```typescript
   socket.on(SocketEvents.PLAYER_JOIN_GAME, (payload) => {
     // ... código existente ...
     this.playerSockets.set(player.id, socket.id);
   });
   ```

3. Limpiar mapeo en desconexión:
   ```typescript
   socket.on('disconnect', () => {
     // Encontrar y eliminar jugador del mapeo
     for (const [playerId, socketId] of this.playerSockets.entries()) {
       if (socketId === socket.id) {
         this.playerSockets.delete(playerId);
         // Opcional: remover jugador del juego
       }
     }
   });
   ```

---

### ✅ Solución 2: Eventos Unicast

**Archivo**: `backend/src/sockets/gameSocket.ts`

**Cambios**:

1. Crear método auxiliar para enviar eventos a jugador específico:
   ```typescript
   private emitToPlayer(playerId: string, event: string, payload: any): void {
     const socketId = this.playerSockets.get(playerId);
     if (socketId) {
       this.io.to(socketId).emit(event, payload);
     }
   }
   ```

2. Actualizar `startQuestionForPlayer()` para usar unicast:
   ```typescript
   private startQuestionForPlayer(code: string, playerId: string): void {
     // ... código existente ...

     // ANTES: this.io.to(code).emit(...)
     // AHORA: enviar solo al jugador específico
     this.emitToPlayer(playerId, SocketEvents.PLAYER_QUESTION_START, {
       question: currentQuestion,
       questionNumber: playerState.currentQuestionIndex + 1,
       totalQuestions: game.quiz.questions.length,
       startTime: playerState.questionStartTime!,
       playerState,
     });
   }
   ```

3. Actualizar `showPlayerFinalScreen()` para usar unicast:
   ```typescript
   private showPlayerFinalScreen(code: string, playerId: string): void {
     // ... código existente ...

     this.emitToPlayer(playerId, SocketEvents.PLAYER_GAME_FINISHED, {
       finalRanking: ranking,
       playerRank: playerRankEntry.rank,
       playerScore: player.score,
       podium: ranking.slice(0, 3),
       questionHistory: /* ... */,
     });
   }
   ```

---

### ✅ Solución 3: Simplificar Frontend

**Archivo**: `frontend/hooks/useSocket.ts`

**Cambios**:

1. Eliminar filtros innecesarios (el backend ya envía solo al jugador correcto):
   ```typescript
   // ANTES
   socket.on(SocketEvents.PLAYER_QUESTION_START, (payload: any) => {
     const { currentPlayer: player } = useGameStore.getState();
     if (!player || payload.playerState?.playerId !== player.id) {
       return;
     }
     // ... procesar
   });

   // AHORA
   socket.on(SocketEvents.PLAYER_QUESTION_START, (payload: any) => {
     // Procesar directamente, sabemos que es para nosotros
     setPlayerState(payload.playerState);
     setCurrentQuestion(payload.question, payload.startTime);
     updateGameStatus('QUESTION' as any);
   });
   ```

---

### ✅ Solución 4: Mejorar Transiciones y Animaciones

**Archivos**: Componentes de juego del frontend

**Cambios**:

1. Agregar estados intermedios en el store:
   ```typescript
   interface GameState {
     // ... existente ...
     transitionState: 'idle' | 'showing_results' | 'showing_ranking' | 'loading_next';
   }
   ```

2. Agregar eventos de transición en el backend:
   ```typescript
   // Después de responder, enviar evento de "mostrar resultados"
   this.emitToPlayer(playerId, 'player:show_answer_feedback', {
     isCorrect: answer.isCorrect,
     pointsEarned: answer.pointsEarned,
     correctOptionId: currentQuestion.options.find(o => o.isCorrect).id,
   });

   // Luego de 2 segundos, mostrar ranking
   setTimeout(() => {
     const { ranking } = GameService.getRanking(code);
     const playerRank = ranking.find(e => e.player.id === playerId);

     this.emitToPlayer(playerId, 'player:show_ranking', {
       ranking,
       currentPlayerRank: playerRank?.rank || 0,
     });

     // Luego de 3 segundos, siguiente pregunta
     setTimeout(() => {
       // ... iniciar siguiente pregunta
     }, 3000);
   }, 2000);
   ```

3. Implementar componentes de transición con Framer Motion:
   ```typescript
   <AnimatePresence mode="wait">
     {transitionState === 'showing_results' && (
       <motion.div
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.8 }}
       >
         <ResultsFeedback />
       </motion.div>
     )}
   </AnimatePresence>
   ```

---

## Diferencias entre Modo FAST y Modo WAIT_ALL

### Modo FAST (Rápido)
- **Comportamiento**: Cada jugador avanza a su propio ritmo
- **Lógica**: Inmediatamente después de responder → Resultados (2s) → Ranking (3s) → Siguiente pregunta
- **Ventaja**: Ritmo dinámico, no hay esperas
- **Código**: `handleFastModeAdvance()` en gameSocket.ts:356-385

### Modo WAIT_ALL (Esperar a Todos)
- **Comportamiento**: Todos los jugadores en la misma pregunta avanzan juntos
- **Lógica**: Espera hasta que TODOS en esa pregunta respondan → Avanzan juntos
- **Ventaja**: Experiencia sincronizada, competencia justa
- **Código**: `handleWaitAllModeAdvance()` en gameSocket.ts:392-440

**Implementación correcta**:
```typescript
// En handleWaitAllModeAdvance()
const playersInThisQuestion = game.players.filter((player) => {
  const state = game.playerStates[player.id];
  return state && state.currentQuestionIndex === questionIndex;
});

const allAnswered = playersInThisQuestion.every((player) => {
  const state = game.playerStates[player.id];
  return state && state.hasAnsweredCurrent;
});

if (allAnswered) {
  // Avanzar a TODOS los jugadores en esta pregunta
  playersInThisQuestion.forEach((player) => {
    // Mostrar resultados → ranking → siguiente pregunta
  });
}
```

---

## Testing Checklist

### Modo FAST
- [ ] Jugador A responde, avanza inmediatamente
- [ ] Jugador B responde después, avanza independientemente
- [ ] Jugadores pueden estar en preguntas diferentes
- [ ] Al terminar, cada jugador ve su pantalla final
- [ ] Cuando todos terminan, se muestra ranking final global

### Modo WAIT_ALL
- [ ] Jugador A responde, espera a Jugador B
- [ ] Cuando Jugador B responde, ambos avanzan juntos
- [ ] Todos los jugadores ven la misma pregunta al mismo tiempo
- [ ] Transiciones son sincronizadas
- [ ] Al terminar, todos ven el ranking final simultáneamente

### Animaciones
- [ ] Transición suave al mostrar pregunta
- [ ] Feedback visual al responder (correcto/incorrecto)
- [ ] Animación al mostrar puntos ganados
- [ ] Transición al mostrar ranking
- [ ] Animación de cambio de posición en ranking
- [ ] Transición suave a siguiente pregunta

### Desconexiones
- [ ] Si un jugador se desconecta, se elimina del juego
- [ ] Otros jugadores continúan normalmente
- [ ] El mapeo socket-player se limpia correctamente
- [ ] El host puede ver qué jugadores están activos

---

## Archivos Modificados

1. **backend/src/sockets/gameSocket.ts**
   - Agregar mapeo socket-player
   - Cambiar eventos broadcast a unicast
   - Mejorar flujo de transiciones

2. **frontend/hooks/useSocket.ts**
   - Eliminar filtros de eventos
   - Simplificar listeners
   - Agregar manejo de estados de transición

3. **frontend/store/gameStore.ts**
   - Agregar estado de transición
   - Agregar acciones para manejar feedback

4. **frontend/components/** (varios)
   - Agregar animaciones con Framer Motion
   - Implementar componentes de feedback
   - Mejorar visualización de rankings

---

## Notas Adicionales

- El sistema de `PlayerGameState` en el backend YA ESTÁ IMPLEMENTADO correctamente
- Los métodos `startPlayerQuestion()`, `submitPlayerAnswer()`, y `advancePlayerToNextQuestion()` funcionan bien
- El problema principal era la comunicación (broadcast vs unicast)
- Las animaciones son opcionales pero mejoran mucho la UX

---

## Referencias

- GRASP: Controller pattern (GameSocketHandler coordina flujo)
- SOLID: Single Responsibility (cada método tiene una responsabilidad clara)
- WebSocket best practices: Unicast para eventos individuales, broadcast para eventos globales
