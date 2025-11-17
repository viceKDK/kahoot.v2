// ============================================================================
// CODE GENERATOR UTILITY
// GRASP: Pure Fabrication - Genera códigos únicos para salas
// ============================================================================

import { customAlphabet } from 'nanoid';

// Alfabeto sin caracteres ambiguos (0, O, 1, I, l)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const nanoid = customAlphabet(ALPHABET, 6);

/**
 * Genera un código aleatorio de 6 caracteres
 * @returns Código único (ej: "A3K9P2")
 */
export function generateGameCode(): string {
  return nanoid();
}

/**
 * Valida que un código tenga el formato correcto
 * @param code - Código a validar
 * @returns true si es válido
 */
export function isValidGameCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false;
  }

  // Verificar que solo contenga caracteres del alfabeto
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code);
}
