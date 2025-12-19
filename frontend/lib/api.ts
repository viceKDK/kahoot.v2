// ============================================================================
// API UTILITIES
// Funciones auxiliares para llamadas al backend
// ============================================================================

/**
 * Obtiene la URL del backend dinámicamente basándose en el hostname actual
 * Esto permite que la app funcione tanto en localhost como en red local
 */
export const getBackendURL = (): string => {
  // Si estamos en el servidor (SSR), usar la variable de entorno
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  // En el cliente, construir la URL basándose en el hostname actual
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:3001`;
};

/**
 * Helper para hacer fetch al backend con la URL correcta
 */
export const fetchBackend = (path: string, options?: RequestInit) => {
  const url = `${getBackendURL()}${path}`;
  return fetch(url, options);
};
