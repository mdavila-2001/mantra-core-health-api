/**
 * Espera la latencia simulada configurada. Un proveedor real nunca responde
 * en 0ms; simularlo ayuda a que quien prueba contra este emulador note un
 * timeout mal configurado en vez de descubrirlo la primera vez contra un
 * proveedor de verdad.
 */
export function simulatedDelay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `true` con probabilidad `rate` (0-1). */
export function rollFailure(rate: number): boolean {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return Math.random() < rate;
}
