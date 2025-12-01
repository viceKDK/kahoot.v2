// ============================================================================
// DATABASE CONFIGURATION
// GRASP: Information Expert - gestiona la conexión a PostgreSQL
// ============================================================================

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'quizarena',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Singleton Pattern para el pool de conexiones
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    // Log de la configuración básica (sin mostrar la contraseña)
    console.log('Database pool config:', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      max: poolConfig.max,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    });

    this.pool = new Pool(poolConfig);

    this.pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client:', {
        message: (err as any).message,
        code: (err as any).code,
        severity: (err as any).severity,
        detail: (err as any).detail,
      });
      process.exit(-1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', {
        message: (error as any).message,
        code: (error as any).code,
        severity: (error as any).severity,
        detail: (error as any).detail,
      });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection pool closed');
  }
}

export default Database.getInstance();

