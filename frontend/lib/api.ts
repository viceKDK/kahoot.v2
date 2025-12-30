// ============================================================================
// API UTILITIES
// Funciones auxiliares para llamadas al backend con soporte de Auth
// ============================================================================

import { supabase } from './supabase';

/**
 * Obtiene la URL del backend dinámicamente o desde variables de entorno
 */
export const getBackendURL = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

/**
 * Helper para hacer fetch al backend inyectando el Token de Supabase
 */
export const fetchBackend = async (path: string, options: RequestInit = {}) => {
  const url = `${getBackendURL()}${path}`;
  
  // Obtener sesión actual de Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Preparar headers
  const headers = new Headers(options.headers || {});
  
  // Si hay token, lo agregamos
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Asegurar Content-Type JSON si enviamos body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
};