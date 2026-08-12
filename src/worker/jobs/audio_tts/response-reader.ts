import { TtsProviderError } from '../../../modules/audio_tts/domain';

/**
 * Lee el cuerpo de la respuesta por trozos y aborta al superar el techo.
 *
 * `response.arrayBuffer()` cargaría en memoria lo que el proveedor decidiese
 * enviar, sin límite. Con dos generaciones concurrentes y una respuesta anómala,
 * eso es el proceso muerto por OOM — y el worker corre con un límite de memoria
 * declarado en `docker-compose.yml`, así que el techo no es hipotético.
 *
 * Se comprueban las dos cosas, y no solo una: `content-length` permite rechazar
 * antes de leer un solo byte, pero es una **declaración** del servidor. El
 * acumulado durante la lectura es lo que de verdad acota el consumo.
 */
export async function readCappedBody(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length') ?? Number.NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw tooLarge(declared, maxBytes);
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) throw tooLarge(total, maxBytes);
      chunks.push(Buffer.from(value));
    }
  } finally {
    // Se cancela siempre: al salir por el techo queda un flujo a medio leer, y
    // dejarlo abierto retiene el socket hasta que el servidor se cansa.
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks, total);
}

/**
 * Una respuesta demasiado grande **no** es reintentable: el proveedor devolvería
 * lo mismo, y cada intento vuelve a descargar hasta el techo.
 */
function tooLarge(size: number, maxBytes: number): TtsProviderError {
  return new TtsProviderError(
    `La respuesta de audio (${size} bytes) supera el máximo de ${maxBytes}`,
    'ELEVENLABS_RESPONSE_TOO_LARGE',
    false,
  );
}
