import { OperationTimeoutError } from './resilience.errors';

/**
 * Plazo duro sobre una operación asíncrona, **con cancelación real**.
 *
 * La versión ingenua de esto es `Promise.race([fn(), sleep(t).then(throw)])`, y
 * es una trampa: la promesa perdedora sigue viva. El socket sigue abierto, la
 * transacción sigue abierta, el búfer sigue creciendo, y lo único que se logró
 * es que quien llamaba deje de esperar. Repetido cada tick, eso es exactamente
 * el modo de fallo "conexiones huérfanas / degradación progresiva": el proceso
 * parece sano porque responde, y por debajo acumula trabajo que nadie va a
 * recoger.
 *
 * Por eso `fn` recibe un `AbortSignal` y el contrato es que lo propague a lo
 * que de verdad bloquea (axios lo acepta como `signal`, igual que `fetch` y
 * `pg`). El plazo entonces **aborta** en vez de sólo dejar de mirar.
 *
 * El temporizador se limpia siempre en `finally`, incluido el camino feliz: un
 * `setTimeout` de 30 s que sobrevive a una operación de 5 ms mantiene vivo el
 * event loop y retrasa el apagado del proceso multiplicado por cada llamada.
 */
export async function withTimeout<T>(
  operation: string,
  timeoutMs: number,
  fn: (signal: AbortSignal) => Promise<T>,
  parentSignal?: AbortSignal,
): Promise<T> {
  // Un plazo no positivo significa "sin plazo". Se acepta explícitamente para
  // que la configuración pueda desactivarlo con un 0 en vez de obligar a
  // duplicar el camino de llamada.
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fn(parentSignal ?? new AbortController().signal);
  }

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new OperationTimeoutError(operation, timeoutMs));
  }, timeoutMs);
  // El temporizador no debe ser motivo para que el proceso siga vivo: si el
  // resto del programa terminó, un plazo pendiente no tiene a quién avisar.
  timer.unref?.();

  // Composición con la señal del llamador (p. ej. el plazo del tick que
  // engloba a esta llamada). Se hace a mano y no con `AbortSignal.any` para no
  // depender de Node >= 20 en una pieza que usan los 21 procesos.
  const onParentAbort = () => controller.abort(parentSignal?.reason);
  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timer);
      throw parentSignal.reason instanceof Error
        ? parentSignal.reason
        : new OperationTimeoutError(operation, timeoutMs);
    }
    parentSignal.addEventListener('abort', onParentAbort, { once: true });
  }

  try {
    return await fn(controller.signal);
  } catch (error) {
    // Quien recibe la señal suele traducirla a su propio error de cancelación
    // (axios lanza `CanceledError`). Se normaliza al error de plazo para que el
    // llamador vea siempre la causa real —se agotó el tiempo— y no el síntoma.
    if (timedOut) {
      throw new OperationTimeoutError(operation, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Espera cancelable. Sustituye a `new Promise(r => setTimeout(r, ms))`, que no
 * se puede interrumpir y por tanto retrasa el apagado tanto como dure la espera
 * —el backoff de un reintento puede ser de minutos—.
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(toAbortError(signal.reason));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    timer.unref?.();

    function onAbort(): void {
      clearTimeout(timer);
      reject(toAbortError(signal?.reason));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Normaliza el motivo de un `abort` a `Error`; `reason` es `any` por contrato. */
function toAbortError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error('operación cancelada');
}
