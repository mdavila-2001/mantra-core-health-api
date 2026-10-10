import { createServer, type Server, type Socket } from 'node:net';
import { ClamdClient } from './clamd.client';

/**
 * Las pruebas hablan con un **servidor TCP de verdad** que responde como clamd,
 * no con un doble del socket.
 *
 * Lo que hay que comprobar acá es el protocolo —el marco de longitud en
 * big-endian, el trozo de cierre, el fin de la respuesta— y un doble de `net`
 * comprobaría que se llamó a `write`, no que lo escrito sea lo que clamd espera.
 * El servidor devuelve además lo que recibió, así que el marco se verifica
 * contra bytes reales.
 */
interface Emulator {
  server: Server;
  puerto: number;
  /** Lo que el último cliente envió, ya concatenado. */
  recibido: () => Buffer;
}

/**
 * Levanta un clamd de mentira que responde lo que se le indique.
 *
 * @param responder - Qué contesta al cerrarse el flujo, o `'cortar'` para
 *   simular un demonio que corta sin decir nada.
 * @returns El emulador con su puerto efímero.
 */
async function emulate(responder: string | 'cortar'): Promise<Emulator> {
  const parts: Buffer[] = [];
  const server = createServer((socket: Socket) => {
    socket.on('data', (part) => {
      parts.push(part);
      const text = part.toString('latin1');
      const flowEnd =
        part.length >= 4 && part.readUInt32BE(part.length - 4) === 0;
      if (text.startsWith('zPING') || flowEnd) {
        if (responder === 'cortar') socket.end();
        else socket.end(`${responder}\0`);
      }
    });
  });
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, puerto: port, recibido: () => Buffer.concat(parts) };
}

describe('ClamdClient', () => {
  let emulator: Emulator | undefined;

  afterEach(async () => {
    if (emulator) {
      await new Promise<void>((ready) => emulator!.server.close(() => ready()));
      emulator = undefined;
    }
  });

  /** Cliente apuntando al emulador levantado. */
  function client(port: number): ClamdClient {
    return new ClamdClient({
      host: '127.0.0.1',
      port: port,
      timeoutMs: 2_000,
    });
  }

  it('responde limpio cuando clamd dice OK', async () => {
    emulator = await emulate('stream: OK');

    const verdict = await client(emulator.puerto).scan(Buffer.from('hola'));

    expect(verdict.clean).toBe(true);
  });

  it('devuelve la firma cuando clamd encuentra algo', async () => {
    emulator = await emulate('stream: Win.Test.EICAR_HDB-1 FOUND');

    const verdict = await client(emulator.puerto).scan(Buffer.from('x'));

    expect(verdict.clean).toBe(false);
    expect(verdict.signature).toBe('Win.Test.EICAR_HDB-1');
  });

  it('enmarca el contenido como exige el protocolo INSTREAM', async () => {
    emulator = await emulate('stream: OK');
    const content = Buffer.from('doce  bytes!');

    await client(emulator.puerto).scan(content);

    const sent = emulator.recibido();
    // `zINSTREAM\0`, longitud en big-endian, contenido, y cuatro ceros de cierre.
    expect(sent.subarray(0, 10).toString('latin1')).toBe('zINSTREAM\0');
    expect(sent.readUInt32BE(10)).toBe(content.length);
    expect(sent.subarray(14, 14 + content.length)).toEqual(content);
    expect(sent.readUInt32BE(sent.length - 4)).toBe(0);
  });

  it('parte el contenido en trozos y los enmarca todos', async () => {
    // Sin el troceo, un archivo grande supera el `StreamMaxLength` de clamd y
    // el demonio corta la conexión a mitad de camino.
    emulator = await emulate('stream: OK');
    const client8 = new ClamdClient({
      host: '127.0.0.1',
      port: emulator.puerto,
      timeoutMs: 2_000,
      chunkBytes: 8,
    });

    await client8.scan(Buffer.alloc(20, 0x41));

    const sent = emulator.recibido();
    const longitudes: number[] = [];
    let cursor = 10;
    while (cursor + 4 <= sent.length) {
      const longitude = sent.readUInt32BE(cursor);
      longitudes.push(longitude);
      if (longitude === 0) break;
      cursor += 4 + longitude;
    }
    expect(longitudes).toEqual([8, 8, 4, 0]);
  });

  it('no inventa veredicto cuando la respuesta no se entiende', async () => {
    // Es la diferencia entre «lo miré y está bien» y «no lo pude mirar». Un
    // `clean: true` por defecto acá sería el modo permisivo que el carril
    // prohíbe.
    emulator = await emulate('ERROR: fuera de memoria');

    await expect(
      client(emulator.puerto).scan(Buffer.from('x')),
    ).rejects.toThrow(/no es un veredicto/);
  });

  it('falla cuando el demonio corta sin contestar', async () => {
    emulator = await emulate('cortar');

    await expect(
      client(emulator.puerto).scan(Buffer.from('x')),
    ).rejects.toThrow(/no es un veredicto/);
  });

  it('falla cuando no hay nadie escuchando', async () => {
    // Un puerto cerrado: el error tiene que propagarse, no volverse un limpio.
    const withoutNobody = new ClamdClient({
      host: '127.0.0.1',
      port: 1,
      timeoutMs: 1_000,
    });

    await expect(withoutNobody.scan(Buffer.from('x'))).rejects.toBeDefined();
  });

  it('confirma que el demonio está vivo con PING', async () => {
    emulator = await emulate('PONG');

    await expect(client(emulator.puerto).ping()).resolves.toBe(true);
  });
});
