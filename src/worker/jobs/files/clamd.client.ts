import { connect, type Socket } from 'node:net';

/** Veredicto de clamd sobre un contenido. */
export interface ClamdVerdict {
  /** `true` si el motor no encontró nada. */
  clean: boolean;
  /** Firma que disparó la detección, cuando la hubo. */
  signature?: string;
}

/** Dónde escucha el demonio y cuánto se le espera. */
export interface ClamdOptions {
  host: string;
  port: number;
  /** Plazo de toda la conversación, en milisegundos. */
  timeoutMs: number;
  /**
   * Tamaño de cada trozo del `INSTREAM`.
   *
   * clamd rechaza trozos por encima de `StreamMaxLength` y corta la conexión;
   * 64 KiB es el tamaño que usan los clientes de referencia y entra holgado en
   * cualquier configuración por defecto.
   */
  chunkBytes?: number;
}

const CHUNK_BYTES = 64 * 1024;

/**
 * Cliente del demonio de ClamAV, hablando su protocolo de flujo.
 *
 * ## Por qué a mano y no con una librería
 *
 * El protocolo que hace falta es una sola conversación: se abre el socket, se
 * manda `zINSTREAM\\0`, los bytes en trozos con su longitud por delante en
 * big-endian, un trozo de longitud cero para cerrar, y clamd contesta una línea.
 * Son treinta líneas de código sin dependencias, contra una dependencia nueva
 * en la ruta por la que pasa **todo** archivo que sube un usuario.
 *
 * ## Qué se considera limpio
 *
 * Sólo la respuesta `stream: OK`. Cualquier otra cosa —`FOUND`, `ERROR`, una
 * línea que no se entiende— **no** es un veredicto limpio: se propaga como
 * error y la versión se queda pendiente, que es el estado honesto. Marcar
 * `CLEAN` porque el escáner falló sería exactamente el modo permisivo que el
 * contrato del carril prohíbe.
 */
export class ClamdClient {
  /**
   * Inicializa el cliente con la dirección del demonio.
   *
   * @param options - Host, puerto y plazo de la conversación.
   */
  constructor(private readonly options: ClamdOptions) {}

  /**
   * Comprueba que el demonio responde.
   *
   * @returns `true` si contestó `PONG`.
   */
  async ping(): Promise<boolean> {
    const response = await this.converse((socket) => {
      socket.write('zPING\0');
    });
    return response.startsWith('PONG');
  }

  /**
   * Escanea un contenido en memoria.
   *
   * @param content - Los bytes tal como se guardaron.
   * @returns El veredicto del motor.
   * @throws Error si el demonio no responde, corta, o contesta algo que no es
   *   un veredicto: no hay veredicto por defecto.
   */
  async scan(content: Buffer): Promise<ClamdVerdict> {
    const chunk = this.options.chunkBytes ?? CHUNK_BYTES;
    const response = await this.converse((socket) => {
      socket.write('zINSTREAM\0');
      for (let start = 0; start < content.length; start += chunk) {
        const part = content.subarray(start, start + chunk);
        const longitud = Buffer.alloc(4);
        longitud.writeUInt32BE(part.length, 0);
        socket.write(longitud);
        socket.write(part);
      }
      // Longitud cero: fin del flujo. Sin esto clamd espera para siempre.
      socket.write(Buffer.alloc(4));
    });

    if (/\bOK$/.test(response)) return { clean: true };

    const found = /^stream:\s+(.*)\s+FOUND$/.exec(response);
    if (found) return { clean: false, signature: found[1] };

    throw new Error(`clamd respondió algo que no es un veredicto: ${response}`);
  }

  /**
   * Abre el socket, deja escribir y devuelve la línea de respuesta.
   *
   * El plazo cubre la conversación entera y no cada escritura: lo que interesa
   * es que un demonio colgado no retenga el tick del worker.
   */
  private converse(write: (socket: Socket) => void): Promise<string> {
    return new Promise<string>((resolver, reject) => {
      const socket = connect({
        host: this.options.host,
        port: this.options.port,
      });
      const parts: Buffer[] = [];
      let resolved = false;

      const finish = (error?: Error, response?: string): void => {
        if (resolved) return;
        resolved = true;
        socket.destroy();
        if (error) reject(error);
        else resolver((response ?? '').replace(/\0$/, '').trim());
      };

      socket.setTimeout(this.options.timeoutMs, () =>
        finish(new Error(`clamd no respondió en ${this.options.timeoutMs} ms`)),
      );
      socket.on('error', (error) => finish(error));
      socket.on('data', (part) => parts.push(part));
      socket.on('end', () =>
        finish(undefined, Buffer.concat(parts).toString('utf8')),
      );
      socket.on('connect', () => {
        try {
          write(socket);
        } catch (error) {
          finish(error as Error);
        }
      });
    });
  }
}
