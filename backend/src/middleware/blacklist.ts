import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sistema de blacklist para IPs maliciosas
 * Soporta blacklist estática y dinámica
 */
class IPBlacklist {
  private static instance: IPBlacklist;
  private blacklistedIPs: Set<string>;
  private blacklistPath: string;
  private autoBlockThreshold: number;
  private violationCounts: Map<string, { count: number; timestamp: number }>;

  private constructor() {
    this.blacklistedIPs = new Set();
    this.blacklistPath = path.join(__dirname, '../../config/blacklist.json');
    this.autoBlockThreshold = parseInt(process.env.AUTO_BLOCK_THRESHOLD || '10');
    this.violationCounts = new Map();
    this.loadBlacklist();

    // Limpiar contadores de violaciones cada hora
    setInterval(() => this.cleanupViolations(), 60 * 60 * 1000);
  }

  public static getInstance(): IPBlacklist {
    if (!IPBlacklist.instance) {
      IPBlacklist.instance = new IPBlacklist();
    }
    return IPBlacklist.instance;
  }

  /**
   * Carga la blacklist desde archivo
   */
  private loadBlacklist(): void {
    try {
      if (fs.existsSync(this.blacklistPath)) {
        const data = fs.readFileSync(this.blacklistPath, 'utf-8');
        const { ips } = JSON.parse(data);
        this.blacklistedIPs = new Set(ips);
        console.log(`✓ Blacklist cargada: ${this.blacklistedIPs.size} IPs bloqueadas`);
      } else {
        // Crear archivo de blacklist vacío
        this.saveBlacklist();
        console.log('✓ Archivo de blacklist creado');
      }
    } catch (error) {
      console.error('Error cargando blacklist:', error);
    }
  }

  /**
   * Guarda la blacklist en archivo
   */
  private saveBlacklist(): void {
    try {
      const dir = path.dirname(this.blacklistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        ips: Array.from(this.blacklistedIPs),
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.blacklistPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error guardando blacklist:', error);
    }
  }

  /**
   * Agrega una IP a la blacklist
   */
  public addIP(ip: string): void {
    this.blacklistedIPs.add(ip);
    this.saveBlacklist();
    console.log(`🚫 IP bloqueada: ${ip}`);
  }

  /**
   * Remueve una IP de la blacklist
   */
  public removeIP(ip: string): void {
    this.blacklistedIPs.delete(ip);
    this.saveBlacklist();
    console.log(`✓ IP desbloqueada: ${ip}`);
  }

  /**
   * Verifica si una IP está en la blacklist
   */
  public isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  /**
   * Registra una violación para una IP
   * Si alcanza el threshold, la bloquea automáticamente
   */
  public recordViolation(ip: string): void {
    const now = Date.now();
    const existing = this.violationCounts.get(ip);

    if (existing) {
      // Si la última violación fue hace más de 1 hora, resetear contador
      if (now - existing.timestamp > 60 * 60 * 1000) {
        this.violationCounts.set(ip, { count: 1, timestamp: now });
      } else {
        existing.count++;
        existing.timestamp = now;

        // Auto-bloquear si alcanza el threshold
        if (existing.count >= this.autoBlockThreshold) {
          this.addIP(ip);
          this.violationCounts.delete(ip);
          console.warn(`⚠️ Auto-bloqueado IP por violaciones: ${ip} (${existing.count} violaciones)`);
        }
      }
    } else {
      this.violationCounts.set(ip, { count: 1, timestamp: now });
    }
  }

  /**
   * Limpia violaciones antiguas (más de 1 hora)
   */
  private cleanupViolations(): void {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    for (const [ip, data] of this.violationCounts.entries()) {
      if (data.timestamp < hourAgo) {
        this.violationCounts.delete(ip);
      }
    }
  }

  /**
   * Obtiene estadísticas de la blacklist
   */
  public getStats(): {
    totalBlocked: number;
    activeViolations: number;
    blacklistedIPs: string[];
  } {
    return {
      totalBlocked: this.blacklistedIPs.size,
      activeViolations: this.violationCounts.size,
      blacklistedIPs: Array.from(this.blacklistedIPs)
    };
  }
}

/**
 * Extrae la IP real del request (considera proxies)
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs separadas por coma
    const ips = forwarded.toString().split(',');
    return ips[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Middleware para verificar blacklist
 */
export function blacklistMiddleware(req: Request, res: Response, next: NextFunction): void {
  const blacklist = IPBlacklist.getInstance();
  const clientIP = getClientIP(req);

  if (blacklist.isBlacklisted(clientIP)) {
    console.warn(`🚫 Solicitud bloqueada de IP en blacklist: ${clientIP}`);
    res.status(403).json({
      error: 'Acceso denegado. Tu IP ha sido bloqueada por actividad sospechosa.',
      code: 'IP_BLACKLISTED'
    });
    return;
  }

  next();
}

/**
 * Middleware para registrar violaciones
 */
export function recordViolation(req: Request): void {
  const blacklist = IPBlacklist.getInstance();
  const clientIP = getClientIP(req);
  blacklist.recordViolation(clientIP);
}

/**
 * Funciones de administración de blacklist
 */
export const blacklistAdmin = {
  addIP: (ip: string) => IPBlacklist.getInstance().addIP(ip),
  removeIP: (ip: string) => IPBlacklist.getInstance().removeIP(ip),
  isBlacklisted: (ip: string) => IPBlacklist.getInstance().isBlacklisted(ip),
  getStats: () => IPBlacklist.getInstance().getStats(),
  recordViolation: (ip: string) => IPBlacklist.getInstance().recordViolation(ip)
};
