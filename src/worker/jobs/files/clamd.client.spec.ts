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
interface Emulador {
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
async function emular(responder: string | 'cortar'): Promise<Emulador> {
  const partes: Buffer[] = [];
  const server = createServer((socket: Socket) => {
    socket.on('data', (parte) => {
      partes.push(parte);
      const texto = parte.toString('latin1');
      const finDeFlujo =
        parte.length >= 4 && parte.readUInt32BE(parte.length - 4) === 0;
      if (texto.startsWith('zPING') || finDeFlujo) {
        if (responder === 'cortar') socket.end();
        else socket.end(`${responder}\0`);
      }
    });
  });
  await new Promise<void>((listo) => server.listen(0, '127.0.0.1', listo));
  const address = server.address();
  const puerto = typeof address === 'object' && address ? address.port : 0;
  return { server, puerto, recibido: () => Buffer.concat(partes) };
}

describe('ClamdClient', () => {
  let emulador: Emulador | undefined;

  afterEach(async () => {
    if (emulador) {
      await new Promise<void>((listo) => emulador!.server.close(() => listo()));
      emulador = undefined;
    }
  });

  /** Cliente apuntando al emulador levantado. */
  function cliente(puerto: number): ClamdClient {
    return new ClamdClient({
      host: '127.0.0.1',
      port: puerto,
      timeoutMs: 2_000,
    });
  }

  it('responde limpio cuando clamd dice OK', async () => {
    emulador = await emular('stream: OK');

    const veredicto = await cliente(emulador.puerto).scan(Buffer.from('hola'));

    expect(veredicto.clean).toBe(true);
  });

  it('devuelve la firma cuando clamd encuentra algo', async () => {
    emulador = await emular('stream: Win.Test.EICAR_HDB-1 FOUND');

    const veredicto = await cliente(emulador.puerto).scan(Buffer.from('x'));

    expect(veredicto.clean).toBe(false);
    expect(veredicto.signature).toBe('Win.Test.EICAR_HDB-1');
  });

  it('enmarca el contenido como exige el protocolo INSTREAM', async () => {
    emulador = await emular('stream: OK');
    const contenido = Buffer.from('doce  bytes!');

    await cliente(emulador.puerto).scan(contenido);

    const enviado = emulador.recibido();
    // `zINSTREAM\0`, longitud en big-endian, contenido, y cuatro ceros de cierre.
    expect(enviado.subarray(0, 10).toString('latin1')).toBe('zINSTREAM\0');
    expect(enviado.readUInt32BE(10)).toBe(contenido.length);
    expect(enviado.subarray(14, 14 + contenido.length)).toEqual(contenido);
    expect(enviado.readUInt32BE(enviado.length - 4)).toBe(0);
  });

  it('parte el contenido en trozos y los enmarca todos', async () => {
    // Sin el troceo, un archivo grande supera el `StreamMaxLength` de clamd y
    // el demonio corta la conexión a mitad de camino.
    emulador = await emular('stream: OK');
    const cliente8 = new ClamdClient({
      host: '127.0.0.1',
      port: emulador.puerto,
      timeoutMs: 2_000,
      chunkBytes: 8,
    });

    await cliente8.scan(Buffer.alloc(20, 0x41));

    const enviado = emulador.recibido();
    const longitudes: number[] = [];
    let cursor = 10;
    while (cursor + 4 <= enviado.length) {
      const longitud = enviado.readUInt32BE(cursor);
      longitudes.push(longitud);
      if (longitud === 0) break;
      cursor += 4 + longitud;
    }
    expect(longitudes).toEqual([8, 8, 4, 0]);
  });

  it('no inventa veredicto cuando la respuesta no se entiende', async () => {
    // Es la diferencia entre «lo miré y está bien» y «no lo pude mirar». Un
    // `clean: true` por defecto acá sería el modo permisivo que el carril
    // prohíbe.
    emulador = await emular('ERROR: fuera de memoria');

    await expect(
      cliente(emulador.puerto).scan(Buffer.from('x')),
    ).rejects.toThrow(/no es un veredicto/);
  });

  it('falla cuando el demonio corta sin contestar', async () => {
    emulador = await emular('cortar');

    await expect(
      cliente(emulador.puerto).scan(Buffer.from('x')),
    ).rejects.toThrow(/no es un veredicto/);
  });

  it('falla cuando no hay nadie escuchando', async () => {
    // Un puerto cerrado: el error tiene que propagarse, no volverse un limpio.
    const sinNadie = new ClamdClient({
      host: '127.0.0.1',
      port: 1,
      timeoutMs: 1_000,
    });

    await expect(sinNadie.scan(Buffer.from('x'))).rejects.toBeDefined();
  });

  it('confirma que el demonio está vivo con PING', async () => {
    emulador = await emular('PONG');

    await expect(cliente(emulador.puerto).ping()).resolves.toBe(true);
  });
});
