# 🛡️ QuizArena - Documentación de Seguridad

Este documento describe las medidas de seguridad implementadas en QuizArena para proteger contra abuso, ataques y uso malicioso.

## 📋 Tabla de Contenidos

- [Resumen de Protecciones](#resumen-de-protecciones)
- [WAF (Web Application Firewall)](#waf-web-application-firewall)
- [Rate Limiting](#rate-limiting)
- [Sistema de Blacklist](#sistema-de-blacklist)
- [Validación y Sanitización](#validación-y-sanitización)
- [Protección Socket.IO](#protección-socketio)
- [Headers de Seguridad](#headers-de-seguridad)
- [Configuración](#configuración)
- [Monitoreo y Logs](#monitoreo-y-logs)

---

## 🎯 Resumen de Protecciones

QuizArena implementa múltiples capas de seguridad:

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Headers de Seguridad | Helmet.js | WAF básico, prevención XSS, clickjacking |
| Rate Limiting | express-rate-limit | Prevención DDoS, brute force |
| Blacklist | Sistema custom | Bloqueo de IPs maliciosas |
| Validación | express-validator | Validación robusta de inputs |
| Sanitización | express-mongo-sanitize, custom | Prevención XSS, NoSQL injection |
| Socket Protection | Sistema custom | Rate limiting WebSocket, límites de conexión |
| HPP Protection | hpp | Prevención HTTP Parameter Pollution |

---

## 🔥 WAF (Web Application Firewall)

### Helmet.js - Headers de Seguridad

Configurado en: `backend/src/middleware/security.ts`

**Headers implementados:**

```javascript
// Content Security Policy
defaultSrc: ["'self'"]
styleSrc: ["'self'", "'unsafe-inline'"]
scriptSrc: ["'self'"]
imgSrc: ["'self'", 'data:', 'https:']
connectSrc: ["'self'", CORS_ORIGIN]

// Otros headers
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Protege contra:**
- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME sniffing (X-Content-Type-Options)
- ✅ XSS básico (X-XSS-Protection)
- ✅ Ataques de downgrade SSL (HSTS)
- ✅ Inyección de scripts externos (CSP)

---

## ⏱️ Rate Limiting

Configurado en: `backend/src/middleware/rateLimiter.ts`

### Límites por Endpoint

#### 1. General Limiter (Todas las rutas)
```
Ventana: 15 minutos
Límite: 100 requests
Aplica a: Todas las rutas HTTP
```

#### 2. Quiz Creation Limiter
```
Ventana: 1 hora
Límite: 10 quizzes
Aplica a: POST /api/quizzes
```

#### 3. Auth Limiter (Acciones sensibles)
```
Ventana: 5 minutos
Límite: 5 intentos
Aplica a: DELETE /api/quizzes/:id
Skip: Requests exitosos (solo cuenta fallos)
```

#### 4. List Limiter
```
Ventana: 1 minuto
Límite: 30 requests
Aplica a: GET /api/quizzes/public, GET /api/quizzes/creator/:id
```

### Socket.IO Rate Limiting

```javascript
Max eventos por segundo: 10
Max eventos por minuto: 100
Max conexiones por IP por minuto: 20
```

**Eventos protegidos:**
- `host:create_game`
- `player:join_game`
- `host:start_game`
- `player:submit_answer`
- `host:next_question`
- `host:end_game`

### Respuesta al exceder límites

**HTTP:**
```json
{
  "error": "Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.",
  "retryAfter": "15 minutos"
}
```
Status: `429 Too Many Requests`

**Socket.IO:**
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados eventos enviados. Por favor espera un momento.",
  "event": "nombre_del_evento"
}
```

---

## 🚫 Sistema de Blacklist

Configurado en: `backend/src/middleware/blacklist.ts`

### Características

#### Auto-Bloqueo Inteligente
- Sistema de conteo de violaciones por IP
- Bloqueo automático después de `AUTO_BLOCK_THRESHOLD` violaciones (default: 10)
- Ventana de 1 hora para violaciones

#### Blacklist Persistente
- Almacenamiento en archivo JSON: `backend/config/blacklist.json`
- Carga automática al iniciar servidor
- Sincronización en tiempo real

#### Gestión Manual
```javascript
import { blacklistAdmin } from './middleware/blacklist';

// Agregar IP manualmente
blacklistAdmin.addIP('192.168.1.100');

// Remover IP
blacklistAdmin.removeIP('192.168.1.100');

// Verificar si está bloqueada
blacklistAdmin.isBlacklisted('192.168.1.100');

// Obtener estadísticas
const stats = blacklistAdmin.getStats();
// {
//   totalBlocked: 5,
//   activeViolations: 3,
//   blacklistedIPs: ['192.168.1.100', ...]
// }
```

#### Respuesta al bloqueo

```json
{
  "error": "Acceso denegado. Tu IP ha sido bloqueada por actividad sospechosa.",
  "code": "IP_BLACKLISTED"
}
```
Status: `403 Forbidden`

---

## ✅ Validación y Sanitización

### Validaciones HTTP (express-validator)

Configurado en: `backend/src/middleware/validators.ts`

#### POST /api/quizzes (Crear Quiz)

**Validaciones:**
- `title`: 3-200 caracteres, solo alfanuméricos y puntuación básica
- `description`: max 1000 caracteres (opcional)
- `creatorId`: UUID válido
- `isPublic`: booleano (opcional)
- `questions`: array 1-50 elementos
  - Cada pregunta:
    - `text`: max 1000 caracteres
    - `options`: exactamente 4 opciones
      - `text`: max 500 caracteres cada una
      - `isCorrect`: booleano
    - Exactamente 1 opción correcta
    - `timeLimit`: 5000-120000 ms (opcional)
    - `points`: 100-10000 (opcional)

**Ejemplo de error:**
```json
{
  "error": "Validación fallida",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "El título debe tener entre 3 y 200 caracteres"
    }
  ]
}
```

### Validaciones Socket.IO

**Validadores disponibles:**

```javascript
// Código de juego: 6 caracteres alfanuméricos
validateGameCode(code)

// Nombre de jugador: 2-50 caracteres
validatePlayerName(name)

// UUID de quiz
validateQuizId(quizId)

// Índice de opción: 0-5
validateOptionIndex(index)

// Socket ID
validateSocketId(socketId)
```

### Sanitización de Datos

#### 1. NoSQL Injection Protection
```javascript
// Reemplaza $ y . en user input
// express-mongo-sanitize
{ "$where": "1==1" } → { "_where": "1==1" }
```

#### 2. XSS Protection
```javascript
// Sanitización custom de strings
// Remueve tags HTML y scripts
"<script>alert(1)</script>" → ""
"<b>Hello</b>" → "Hello"
```

#### 3. HTTP Parameter Pollution
```javascript
// hpp - Previene arrays duplicados en query params
?id=1&id=2&id=3 → ?id=1 (toma el primero)
```

### Límites de Tamaño

Configurado en: `backend/src/middleware/security.ts`

```javascript
MAX_TITLE_LENGTH = 200
MAX_TEXT_LENGTH = 1000
MAX_QUESTIONS = 50
MAX_OPTIONS = 6
MAX_PLAYER_NAME = 50
```

**Body size limit:** 10MB (configurado en server.ts)

---

## 🔌 Protección Socket.IO

Configurado en: `backend/src/middleware/socketProtection.ts`

### Límites de Conexión

```javascript
// Máximo de conexiones simultáneas por IP
MAX_SOCKET_CONNECTIONS_PER_IP = 10

// Timeout de inactividad
SOCKET_INACTIVITY_TIMEOUT = 300000 // 5 minutos

// Máximo de jugadores por juego
MAX_PLAYERS_PER_GAME = 100

// Tamaño máximo de mensajes
maxHttpBufferSize = 1MB

// Timeouts ping/pong
pingTimeout = 20000ms
pingInterval = 25000ms
```

### Middleware de Autenticación

```javascript
io.use(socketAuthMiddleware);
```

**Verifica:**
- ✅ Rate limit de conexiones por IP
- ✅ Blacklist de IPs
- ✅ Límites de conexiones simultáneas

### Tracking de Conexiones

```javascript
// Rastreo automático al conectar
const cleanup = trackConnection(socket);

// Cleanup automático al desconectar
socket.on('disconnect', cleanup);
```

### Rate Limiting por Evento

Todos los eventos Socket.IO están envueltos con `createRateLimitedEventHandler`:

```javascript
socket.on(
  SocketEvents.PLAYER_JOIN_GAME,
  createRateLimitedEventHandler(
    SocketEvents.PLAYER_JOIN_GAME,
    handler
  )
);
```

**Límites:**
- 10 eventos/segundo por socket
- 100 eventos/minuto por socket por tipo de evento

---

## 🔒 Headers de Seguridad

### Headers configurados automáticamente

```http
# Prevención de Clickjacking
X-Frame-Options: DENY

# Prevención MIME Sniffing
X-Content-Type-Options: nosniff

# Forzar HTTPS (producción)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# XSS Protection
X-XSS-Protection: 1; mode=block

# Ocultar tecnología del servidor
X-Powered-By: (removido)

# Política de Referrer
Referrer-Policy: strict-origin-when-cross-origin

# DNS Prefetch Control
X-DNS-Prefetch-Control: off

# IE Download Option
X-Download-Options: noopen

# Content Security Policy
Content-Security-Policy: (ver configuración en security.ts)
```

### CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST']
}
```

---

## ⚙️ Configuración

### Variables de Entorno

Archivo: `backend/.env`

```bash
# Security Settings
AUTO_BLOCK_THRESHOLD=10
MAX_SOCKET_CONNECTIONS_PER_IP=10
SOCKET_INACTIVITY_TIMEOUT=300000

# Rate Limiting
ENABLE_RATE_LIMITING=true

# Logging
LOG_SUSPICIOUS_ACTIVITY=true

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Deshabilitar Protecciones (Solo desarrollo)

**⚠️ NO usar en producción**

```bash
# Deshabilitar rate limiting
ENABLE_RATE_LIMITING=false

# Deshabilitar logging de actividad sospechosa
LOG_SUSPICIOUS_ACTIVITY=false
```

---

## 📊 Monitoreo y Logs

### Logs de Seguridad

#### 1. Actividad Sospechosa

```javascript
⚠️ Actividad sospechosa detectada: {
  ip: '192.168.1.100',
  method: 'POST',
  path: '/api/quizzes',
  data: { body: { title: '<script>...' } },
  userAgent: '...',
  timestamp: '2025-01-18T...'
}
```

**Patrones detectados:**
- SQL injection: `' OR 1=1 --`, `%27`, `--`
- XSS: `<script>`, `javascript:`, `on*=`
- NoSQL injection: `$where`, `{$...}`

#### 2. Rate Limiting

```javascript
⚠️ Rate limit excedido (por segundo) - Socket: abc123, Evento: player:join_game
⚠️ Rate limit excedido (por minuto) - Socket: abc123, Evento: player:join_game
⚠️ Rate limit de conexiones excedido - IP: 192.168.1.100
```

#### 3. Blacklist

```javascript
🚫 IP bloqueada: 192.168.1.100
🚫 Solicitud bloqueada de IP en blacklist: 192.168.1.100
⚠️ Auto-bloqueado IP por violaciones: 192.168.1.100 (10 violaciones)
✓ IP desbloqueada: 192.168.1.100
```

#### 4. Sanitización

```javascript
⚠️ Sanitizado intento de NoSQL injection en key: filter
```

#### 5. Conexiones Socket.IO

```javascript
🔌 Client connected: abc123 from IP: 192.168.1.100
🔌 Client disconnected: abc123, reason: transport close
```

### Estadísticas en Tiempo Real

#### Blacklist Stats
```javascript
const stats = blacklistAdmin.getStats();
// {
//   totalBlocked: 5,
//   activeViolations: 3,
//   blacklistedIPs: ['192.168.1.100', ...]
// }
```

#### Socket Rate Limiter Stats
```javascript
const stats = socketRateLimiter.getStats();
// {
//   activeSocketsTracked: 42,
//   activeIPsTracked: 15
// }
```

#### Connection Tracker Stats
```javascript
const stats = connectionTracker.getStats();
// {
//   totalUniqueIPs: 20,
//   totalConnections: 35
// }
```

---

## 🔐 Mejores Prácticas

### Para Desarrolladores

1. **NUNCA deshabilitar protecciones en producción**
   ```bash
   # ❌ MAL
   NODE_ENV=production ENABLE_RATE_LIMITING=false npm start

   # ✅ BIEN
   NODE_ENV=production npm start
   ```

2. **Revisar logs regularmente**
   - Monitorear patrones de actividad sospechosa
   - Revisar IPs bloqueadas automáticamente
   - Ajustar thresholds según sea necesario

3. **Mantener dependencias actualizadas**
   ```bash
   npm audit
   npm update
   ```

4. **Configurar CORS correctamente**
   - Nunca usar `origin: '*'` en producción
   - Especificar dominios exactos en `CORS_ORIGIN`

5. **Usar HTTPS en producción**
   - Helmet configurará HSTS automáticamente
   - Redirect HTTP → HTTPS en proxy/load balancer

### Para Administradores

1. **Monitorear blacklist**
   - Revisar archivo `backend/config/blacklist.json`
   - Desbloquear IPs legítimas si necesario
   - Ajustar `AUTO_BLOCK_THRESHOLD` según tráfico

2. **Ajustar rate limits**
   - Modificar límites en `backend/src/middleware/rateLimiter.ts`
   - Considerar tráfico legítimo vs. abuso

3. **Backup de configuración**
   - Incluir `backend/config/blacklist.json` en backups
   - Documentar cambios en límites

---

## 🚨 Respuesta a Incidentes

### Si detectas un ataque

1. **Identificar la IP atacante**
   ```javascript
   // En logs buscar:
   ⚠️ Actividad sospechosa detectada: { ip: '...' }
   ```

2. **Bloquear manualmente si necesario**
   ```javascript
   const { blacklistAdmin } = require('./middleware/blacklist');
   blacklistAdmin.addIP('IP_ATACANTE');
   ```

3. **Revisar logs completos**
   - ¿Qué endpoints fueron atacados?
   - ¿Qué tipo de ataque?
   - ¿Cuántos requests?

4. **Ajustar protecciones**
   - Reducir rate limits si necesario
   - Agregar validaciones específicas
   - Actualizar patrones de detección

### Si un usuario legítimo es bloqueado

1. **Verificar en blacklist**
   ```javascript
   blacklistAdmin.getStats()
   ```

2. **Desbloquear**
   ```javascript
   blacklistAdmin.removeIP('IP_USUARIO')
   ```

3. **Investigar causa**
   - ¿Comportamiento anormal?
   - ¿Red compartida con atacante?
   - ¿Bot/scraper accidental?

---

## 📚 Referencias

### Dependencias de Seguridad

- [helmet](https://helmetjs.github.io/) - Headers de seguridad
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) - Rate limiting
- [express-validator](https://express-validator.github.io/) - Validación
- [express-mongo-sanitize](https://github.com/fiznool/express-mongo-sanitize) - Sanitización NoSQL
- [hpp](https://github.com/analog-nico/hpp) - HTTP Parameter Pollution

### Estándares y Guías

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)

---

## 📝 Changelog

### v1.0.0 - 2025-01-18

**Implementado:**
- ✅ WAF básico con Helmet.js
- ✅ Rate limiting multinivel (HTTP + Socket.IO)
- ✅ Sistema de blacklist con auto-bloqueo
- ✅ Validación robusta de inputs
- ✅ Sanitización XSS y NoSQL injection
- ✅ Protección Socket.IO con rate limiting
- ✅ Headers de seguridad completos
- ✅ Logging de actividad sospechosa
- ✅ Límites de conexión por IP
- ✅ Protección HPP

---

## 🤝 Soporte

Para reportar vulnerabilidades de seguridad:
- NO crear issues públicos
- Contactar al equipo de desarrollo directamente
- Incluir detalles del problema y pasos para reproducir

---

**Última actualización:** 2025-01-18
**Versión:** 1.0.0
**Mantenido por:** QuizArena Security Team
