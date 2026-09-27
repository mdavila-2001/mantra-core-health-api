import { jest } from '@jest/globals';
import { createHmac } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import {
  TELECONSULT_ENV,
  TeleconsultIceService,
} from './teleconsult-ice.service';
import {
  DEFAULT_TELECONSULT_STUN_URLS,
  parseTeleconsultIceEnv,
  teleconsultEnvSchema,
} from '../teleconsult.env';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function logger() {
  return { setContext: mockFn(), info: mockFn(), warn: mockFn() };
}

const AHORA = new Date('2026-09-26T12:00:00Z');

describe('parseTeleconsultIceEnv', () => {
  describe('correcto', () => {
    it('sin variables: sólo el STUN público por defecto, sin TURN', () => {
      expect(parseTeleconsultIceEnv({})).toEqual({
        stunUrls: DEFAULT_TELECONSULT_STUN_URLS,
      });
    });

    it('TURN estático completo', () => {
      const config = parseTeleconsultIceEnv({
        TELECONSULT_STUN_URLS: 'stun:stun.ejemplo.bo:3478',
        TELECONSULT_TURN_URLS:
          'turn:turn.ejemplo.bo:3478?transport=udp, turns:turn.ejemplo.bo:5349',
        TELECONSULT_TURN_USERNAME: 'alovida',
        TELECONSULT_TURN_CREDENTIAL: 'clave',
      });
      expect(config).toEqual({
        stunUrls: ['stun:stun.ejemplo.bo:3478'],
        turn: {
          mode: 'static',
          urls: [
            'turn:turn.ejemplo.bo:3478?transport=udp',
            'turns:turn.ejemplo.bo:5349',
          ],
          username: 'alovida',
          credential: 'clave',
        },
      });
    });

    it('TURN efímero con secreto y TTL por defecto', () => {
      const config = parseTeleconsultIceEnv({
        TELECONSULT_TURN_URLS: 'turn:turn.ejemplo.bo:3478',
        TELECONSULT_TURN_SECRET: 's3cr3t',
      });
      expect(config.turn).toEqual({
        mode: 'ephemeral',
        urls: ['turn:turn.ejemplo.bo:3478'],
        secret: 's3cr3t',
        ttlSeconds: 3600,
      });
    });
  });

  describe('límite', () => {
    it('variables vacías o sólo espacios cuentan como ausentes', () => {
      expect(
        parseTeleconsultIceEnv({
          TELECONSULT_STUN_URLS: ' , ',
          TELECONSULT_TURN_URLS: '',
          TELECONSULT_TURN_USERNAME: '  ',
          TELECONSULT_TURN_SECRET: '',
        }),
      ).toEqual({ stunUrls: DEFAULT_TELECONSULT_STUN_URLS });
    });

    it('TTL en los extremos 60 y 86400 se acepta', () => {
      for (const ttl of ['60', '86400']) {
        const config = parseTeleconsultIceEnv({
          TELECONSULT_TURN_URLS: 'turn:t:3478',
          TELECONSULT_TURN_SECRET: 's',
          TELECONSULT_TURN_TTL_SECONDS: ttl,
        });
        expect(config.turn).toMatchObject({ ttlSeconds: Number(ttl) });
      }
    });
  });

  describe('inválido: configuración parcial tumba el arranque', () => {
    it.each([
      [
        'URLs TURN sin credencial',
        { TELECONSULT_TURN_URLS: 'turn:t:3478' },
        'sin credencial completa',
      ],
      [
        'usuario sin clave',
        {
          TELECONSULT_TURN_URLS: 'turn:t:3478',
          TELECONSULT_TURN_USERNAME: 'u',
        },
        'sin credencial completa',
      ],
      [
        'credencial sin URLs',
        {
          TELECONSULT_TURN_USERNAME: 'u',
          TELECONSULT_TURN_CREDENTIAL: 'c',
        },
        'configuración parcial',
      ],
      [
        'secreto sin URLs',
        { TELECONSULT_TURN_SECRET: 's' },
        'configuración parcial',
      ],
      [
        'las dos formas a la vez',
        {
          TELECONSULT_TURN_URLS: 'turn:t:3478',
          TELECONSULT_TURN_USERNAME: 'u',
          TELECONSULT_TURN_CREDENTIAL: 'c',
          TELECONSULT_TURN_SECRET: 's',
        },
        'no ambos',
      ],
      [
        'URL TURN con esquema equivocado',
        {
          TELECONSULT_TURN_URLS: 'https://turn.ejemplo.bo',
          TELECONSULT_TURN_SECRET: 's',
        },
        'turn: o turns:',
      ],
      [
        'URL STUN con esquema equivocado',
        { TELECONSULT_STUN_URLS: 'turn:t:3478' },
        'stun: o stuns:',
      ],
      [
        'TTL fuera de rango',
        {
          TELECONSULT_TURN_URLS: 'turn:t:3478',
          TELECONSULT_TURN_SECRET: 's',
          TELECONSULT_TURN_TTL_SECONDS: '59',
        },
        'entre 60 y 86400',
      ],
    ])('%s', (_caso, env, mensaje) => {
      expect(() => parseTeleconsultIceEnv(env)).toThrow(mensaje);
    });

    it('el mensaje de error nunca incluye el secreto', () => {
      try {
        parseTeleconsultIceEnv({
          TELECONSULT_TURN_URLS: 'turn:t:3478',
          TELECONSULT_TURN_USERNAME: 'u',
          TELECONSULT_TURN_CREDENTIAL: 'clave-secreta',
          TELECONSULT_TURN_SECRET: 'otro-secreto',
        });
        throw new Error('debía lanzar');
      } catch (error) {
        expect(String(error)).not.toContain('clave-secreta');
        expect(String(error)).not.toContain('otro-secreto');
      }
    });

    it('el esquema Joi rechaza un TTL no numérico', () => {
      const { error } = teleconsultEnvSchema.validate({
        TELECONSULT_TURN_TTL_SECONDS: 'una hora',
      });
      expect(error).toBeDefined();
    });
  });
});

describe('TeleconsultIceService', () => {
  it('sin TURN: sólo STUN, turnConfigured false y el arranque lo avisa', () => {
    const log = logger();
    const service = new TeleconsultIceService(log as any, {});
    service.onModuleInit();

    expect(service.iceServersFor('u-1', AHORA)).toEqual({
      iceServers: [{ urls: DEFAULT_TELECONSULT_STUN_URLS }],
      turnConfigured: false,
    });
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ turnConfigured: false }),
      expect.stringContaining(
        'sin TURN configurado: solo STUN (doble/por defecto)',
      ),
    );
  });

  it('TURN estático: entrega la credencial configurada', () => {
    const log = logger();
    const service = new TeleconsultIceService(log as any, {
      TELECONSULT_TURN_URLS: 'turn:t:3478',
      TELECONSULT_TURN_USERNAME: 'alovida',
      TELECONSULT_TURN_CREDENTIAL: 'clave',
    });
    service.onModuleInit();

    const respuesta = service.iceServersFor('u-1', AHORA);
    expect(respuesta.turnConfigured).toBe(true);
    expect(respuesta.iceServers[1]).toEqual({
      urls: ['turn:t:3478'],
      username: 'alovida',
      credential: 'clave',
    });
    expect(respuesta.expiresAt).toBeUndefined();
    // El log de arranque no filtra la credencial.
    expect(JSON.stringify(log.info.mock.calls)).not.toContain('clave');
  });

  it('TURN efímero: usuario <expira>:<userId> y HMAC-SHA1 del secreto (coturn)', () => {
    const service = new TeleconsultIceService(logger() as any, {
      TELECONSULT_TURN_URLS: 'turn:t:3478',
      TELECONSULT_TURN_SECRET: 's3cr3t',
      TELECONSULT_TURN_TTL_SECONDS: '600',
    });

    const respuesta = service.iceServersFor('u-1', AHORA);
    const expira = Math.floor(AHORA.getTime() / 1000) + 600;
    const username = `${expira}:u-1`;
    expect(respuesta.iceServers[1]).toEqual({
      urls: ['turn:t:3478'],
      username,
      credential: createHmac('sha1', 's3cr3t')
        .update(username)
        .digest('base64'),
    });
    expect(respuesta.expiresAt).toBe('2026-09-26T12:10:00.000Z');
    expect(JSON.stringify(respuesta)).not.toContain('s3cr3t');
  });

  it('configuración parcial: el constructor lanza (el módulo no arranca)', () => {
    expect(
      () =>
        new TeleconsultIceService(logger() as any, {
          TELECONSULT_TURN_URLS: 'turn:t:3478',
        }),
    ).toThrow('sin credencial completa');
  });

  it('Nest lo resuelve con el token de entorno opcional (inyección real)', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TeleconsultIceService,
        { provide: PinoLogger, useValue: logger() },
        {
          provide: TELECONSULT_ENV,
          useValue: {
            TELECONSULT_TURN_URLS: 'turn:t:3478',
            TELECONSULT_TURN_SECRET: 's',
          },
        },
      ],
    }).compile();
    expect(moduleRef.get(TeleconsultIceService).turnConfigured).toBe(true);
  });
});
