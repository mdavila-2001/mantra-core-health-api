import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { LocalAudioStorageAdapter } from './local-audio-storage.adapter';
import { AUDIO_ERROR } from '../domain/audio.errors';
import type { AudioTtsConfig } from '../config/audio-tts.env';

const MP3 = Buffer.concat([
  Buffer.from([0xff, 0xfb, 0x90, 0x64]),
  Buffer.alloc(64, 7),
]);

let baseDir: string;
let adapter: LocalAudioStorageAdapter;

beforeEach(async () => {
  baseDir = await mkdtemp(join(tmpdir(), 'audio-store-'));
  adapter = new LocalAudioStorageAdapter({
    localStoragePath: baseDir,
  } as AudioTtsConfig);
});

afterEach(async () => {
  await rm(baseDir, { recursive: true, force: true });
});

function input(assetId: string = randomUUID()) {
  return {
    assetId,
    buffer: MP3,
    mimeType: 'audio/mpeg',
    outputFormat: 'mp3_44100_128',
  };
}

describe('LocalAudioStorageAdapter', () => {
  it('almacena los bytes y describe lo que quedó en disco', async () => {
    const stored = await adapter.store(input('a1b2c3d4'));

    expect(stored.storageUri.startsWith('file://')).toBe(true);
    expect(stored.sizeBytes).toBe(MP3.length);
    // El checksum se calcula releyendo el fichero, no sobre el buffer entrante:
    // es lo único que detecta una escritura truncada.
    expect(stored.checksumSha256).toBe(
      createHash('sha256').update(MP3).digest('hex'),
    );
    await expect(adapter.read(stored.storageUri)).resolves.toEqual(MP3);
    await expect(adapter.exists(stored.storageUri)).resolves.toBe(true);
  });

  it('reparte los ficheros en subdirectorios por prefijo del identificador', async () => {
    const stored = await adapter.store(input('ab000000'));
    expect(stored.storageUri).toContain('/ab/');
    expect(stored.storageUri.endsWith('.mp3')).toBe(true);
  });

  it('no deja ficheros temporales tras una escritura correcta', async () => {
    const stored = await adapter.store(input('cd000000'));
    await expect(readFile(`${stored.storageUri}.tmp`)).rejects.toThrow();
  });

  it('es idempotente: un segundo almacenamiento describe lo existente', async () => {
    const first = await adapter.store(input('ef000000'));
    const second = await adapter.store(input('ef000000'));
    expect(second).toEqual(first);
  });

  it('el disco local no firma URLs: devuelve la referencia tal cual', async () => {
    const stored = await adapter.store(input('11000000'));
    await expect(adapter.publicUrl(stored.storageUri)).resolves.toBe(
      stored.storageUri,
    );
  });

  it('borra el fichero y lo declara ausente', async () => {
    const stored = await adapter.store(input('22000000'));
    await adapter.remove(stored.storageUri);
    await expect(adapter.exists(stored.storageUri)).resolves.toBe(false);
  });

  it('borrar algo que ya no existe no es un error', async () => {
    const stored = await adapter.store(input('33000000'));
    await adapter.remove(stored.storageUri);
    await expect(adapter.remove(stored.storageUri)).resolves.toBeUndefined();
  });

  it('rechaza un URI que apunta fuera del directorio permitido', async () => {
    // El URI viene de la base, pero eso no lo hace de confianza: es el único punto
    // donde un valor manipulado se convierte en una ruta del sistema de ficheros.
    const escape = pathToFileURL(join(baseDir, '..', 'etc-passwd')).href;
    await expect(adapter.read(escape)).rejects.toMatchObject({
      audioCode: AUDIO_ERROR.storagePathEscape,
    });
    await expect(adapter.remove(escape)).rejects.toMatchObject({
      audioCode: AUDIO_ERROR.storagePathEscape,
    });
  });

  it('rechaza un URI que no es una referencia de fichero', async () => {
    await expect(adapter.read('s3://bucket/clave')).rejects.toMatchObject({
      audioCode: AUDIO_ERROR.storageUriInvalid,
    });
  });

  it('declara ausente un URI inválido en vez de propagar el fallo', async () => {
    await expect(adapter.exists('no-es-un-uri')).resolves.toBe(false);
  });
});
