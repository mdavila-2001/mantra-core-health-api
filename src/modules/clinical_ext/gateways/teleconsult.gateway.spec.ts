import { jest } from '@jest/globals';
import type { AddressInfo } from 'node:net';
import { ForbiddenException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { PinoLogger } from 'nestjs-pino';
import { io, type Socket as ClientSocket } from 'socket.io-client';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  WsJwtGuard,
} from '../../../common';
import { VirtualEncountersService } from '../services/virtual-encounters.service';
import {
  MAX_SDP_LENGTH,
  TELECONSULT_NAMESPACE,
  TeleconsultGateway,
  type TeleconsultAck,
} from './teleconsult.gateway';

/**
 * Pruebas del gateway con socket.io **real** en proceso: Nest + `IoAdapter`
 * escuchando en un puerto efímero y clientes `socket.io-client`. Lo doblado
 * es sólo lo que no es del gateway: la verificación del token (un mapa
 * token → usuario) y la regla de participación del servicio (un mapa
 * sesión → usuarios autorizados). Las salas, el relay y el middleware de
 * autenticación son los de socket.io de verdad.
 */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const VE = '11111111-1111-4111-8111-111111111111';
const VE_CERRADA = '22222222-2222-4222-8222-222222222222';
const VE_INEXISTENTE = '33333333-3333-4333-8333-333333333333';

const usuarios: Record<string, { id: string; roles: string[] }> = {
  'tok-medico': { id: 'u-medico', roles: ['PRACTITIONER'] },
  'tok-paciente': { id: 'u-paciente', roles: ['PATIENT'] },
  'tok-medico-2': { id: 'u-medico-2', roles: ['PRACTITIONER'] },
  'tok-ajeno': { id: 'u-ajeno', roles: ['PATIENT'] },
};

/** Quién participa de cada sesión (doble de `assertSignalingParticipant`). */
const participantes: Record<
  string,
  Record<string, 'PATIENT' | 'PRACTITIONER'>
> = {
  [VE]: {
    'u-medico': 'PRACTITIONER',
    'u-paciente': 'PATIENT',
    // Un participante activo más del encuentro: autorizado, pero la sala es 1:1.
    'u-medico-2': 'PRACTITIONER',
  },
};

describe('TeleconsultGateway (socket.io real, /teleconsult)', () => {
  let app: INestApplication;
  let url: string;
  const abiertos: ClientSocket[] = [];
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
  };

  beforeAll(async () => {
    const wsAuth = {
      authenticate: mockFn(async (client: any) => {
        const token = client.handshake.auth?.token;
        const user = usuarios[token];
        if (!user) throw new Error('token inválido');
        return user;
      }),
    };
    const virtualEncounters = {
      assertSignalingParticipant: mockFn(async (id: string, actor: any) => {
        if (id === VE_INEXISTENTE)
          throw new ResourceNotFoundException('Sesión virtual no encontrada');
        if (id === VE_CERRADA)
          throw new PreconditionFailedException('La sesión ya terminó');
        const role = participantes[id]?.[actor.id];
        if (!role)
          throw new ForbiddenException('No participa de este encuentro.');
        return { virtualEncounterId: id, encounterId: 'enc-1', role };
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeleconsultGateway,
        { provide: WsJwtGuard, useValue: wsAuth },
        { provide: VirtualEncountersService, useValue: virtualEncounters },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${port}${TELECONSULT_NAMESPACE}`;
  });

  afterEach(async () => {
    for (const s of abiertos.splice(0)) s.disconnect();
    // La desconexión llega al servidor de forma asíncrona: se espera a que la
    // sala quede vacía para que la prueba siguiente no herede ocupación.
    const nsp = (app.get(TeleconsultGateway) as any).server;
    for (let i = 0; i < 100; i++) {
      if (!nsp.adapter.rooms.get(`teleconsult:${VE}`)) return;
      await new Promise((r) => setTimeout(r, 10));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  /** Conecta un cliente; resuelve con el socket o rechaza con el `connect_error`. */
  function conectar(token?: string): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const s = io(url, {
        auth: token ? { token } : {},
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
      });
      abiertos.push(s);
      s.once('connect', () => resolve(s));
      s.once('connect_error', (err) => reject(err));
    });
  }

  function emitir(
    s: ClientSocket,
    evento: string,
    body: unknown,
  ): Promise<TeleconsultAck> {
    return s.timeout(3000).emitWithAck(evento, body);
  }

  function esperar<T = any>(s: ClientSocket, evento: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`no llegó ${evento}`)), 3000);
      s.once(evento, (payload: T) => {
        clearTimeout(t);
        resolve(payload);
      });
    });
  }

  /** Afirma que `evento` NO llega a `s` en una ventana corta. */
  function noLlega(s: ClientSocket, evento: string, ms = 300): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = () => reject(new Error(`llegó ${evento} y no debía`));
      s.once(evento, handler);
      setTimeout(() => {
        s.off(evento, handler);
        resolve();
      }, ms);
    });
  }

  describe('correcto: participantes autorizados', () => {
    it('médico y paciente se unen y la oferta, la respuesta y el candidato llegan sólo al otro', async () => {
      const medico = await conectar('tok-medico');
      const paciente = await conectar('tok-paciente');

      const ackMedico = await emitir(medico, 'join', {
        virtualEncounterId: VE,
      });
      expect(ackMedico).toEqual({
        ok: true,
        virtualEncounterId: VE,
        role: 'PRACTITIONER',
        peers: 0,
      });

      const llegaPeer = esperar(medico, 'peer-joined');
      const ackPaciente = await emitir(paciente, 'join', {
        virtualEncounterId: VE,
      });
      expect(ackPaciente).toMatchObject({
        ok: true,
        role: 'PATIENT',
        peers: 1,
      });
      expect(await llegaPeer).toEqual({
        virtualEncounterId: VE,
        peerId: paciente.id,
        role: 'PATIENT',
      });

      const sdp = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n';
      const ofertaEnPaciente = esperar(paciente, 'offer');
      const ecoEnMedico = noLlega(medico, 'offer');
      expect(
        await emitir(medico, 'offer', { virtualEncounterId: VE, sdp }),
      ).toEqual({ ok: true, virtualEncounterId: VE });
      expect(await ofertaEnPaciente).toEqual({
        virtualEncounterId: VE,
        from: medico.id,
        sdp,
      });
      await ecoEnMedico;

      const respuestaEnMedico = esperar(medico, 'answer');
      await emitir(paciente, 'answer', { virtualEncounterId: VE, sdp });
      expect(await respuestaEnMedico).toMatchObject({ from: paciente.id, sdp });

      const candidato = {
        candidate: 'candidate:1 1 udp 2122260223 192.0.2.10 54321 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };
      const candidatoEnPaciente = esperar(paciente, 'ice-candidate');
      await emitir(medico, 'ice-candidate', {
        virtualEncounterId: VE,
        candidate: candidato,
      });
      expect(await candidatoEnPaciente).toEqual({
        virtualEncounterId: VE,
        from: medico.id,
        candidate: { ...candidato, usernameFragment: null },
      });
    });

    it('leave y la desconexión avisan peer-left al que queda', async () => {
      const medico = await conectar('tok-medico');
      const paciente = await conectar('tok-paciente');
      await emitir(medico, 'join', { virtualEncounterId: VE });
      await emitir(paciente, 'join', { virtualEncounterId: VE });

      const salida = esperar(medico, 'peer-left');
      expect(
        await emitir(paciente, 'leave', { virtualEncounterId: VE }),
      ).toEqual({ ok: true, virtualEncounterId: VE });
      expect(await salida).toEqual({
        virtualEncounterId: VE,
        peerId: paciente.id,
      });

      // Tras salir, ya no puede señalizar.
      expect(
        await emitir(paciente, 'offer', { virtualEncounterId: VE, sdp: 'v=0' }),
      ).toMatchObject({ ok: false, code: 'NOT_IN_ROOM' });

      await emitir(paciente, 'join', { virtualEncounterId: VE });
      const corte = esperar(medico, 'peer-left');
      const idPaciente = paciente.id;
      paciente.disconnect();
      expect(await corte).toEqual({
        virtualEncounterId: VE,
        peerId: idPaciente,
      });
    });
  });

  describe('límite: sala 1:1', () => {
    it('un tercer participante autorizado recibe ROOM_FULL; al liberarse un lugar, entra', async () => {
      const medico = await conectar('tok-medico');
      const paciente = await conectar('tok-paciente');
      const tercero = await conectar('tok-medico-2');
      await emitir(medico, 'join', { virtualEncounterId: VE });
      await emitir(paciente, 'join', { virtualEncounterId: VE });

      const errorEvento = esperar(tercero, 'error');
      expect(await emitir(tercero, 'join', { virtualEncounterId: VE })).toEqual(
        { ok: false, code: 'ROOM_FULL' },
      );
      expect(await errorEvento).toEqual({ code: 'ROOM_FULL', event: 'join' });

      // Rechazado no quedó en la sala: su oferta no llega a nadie.
      expect(
        await emitir(tercero, 'offer', { virtualEncounterId: VE, sdp: 'v=0' }),
      ).toMatchObject({ ok: false, code: 'NOT_IN_ROOM' });

      await emitir(paciente, 'leave', { virtualEncounterId: VE });
      expect(
        await emitir(tercero, 'join', { virtualEncounterId: VE }),
      ).toMatchObject({ ok: true, peers: 1 });
    });

    it('repetir join desde el mismo socket es idempotente y no ocupa otro lugar', async () => {
      const medico = await conectar('tok-medico');
      await emitir(medico, 'join', { virtualEncounterId: VE });
      expect(await emitir(medico, 'join', { virtualEncounterId: VE })).toEqual({
        ok: true,
        virtualEncounterId: VE,
        role: 'PRACTITIONER',
        peers: 0,
      });
      const paciente = await conectar('tok-paciente');
      expect(
        await emitir(paciente, 'join', { virtualEncounterId: VE }),
      ).toMatchObject({ ok: true, peers: 1 });
    });

    it('un SDP en el tope pasa; uno más largo se rechaza', async () => {
      const medico = await conectar('tok-medico');
      const paciente = await conectar('tok-paciente');
      await emitir(medico, 'join', { virtualEncounterId: VE });
      await emitir(paciente, 'join', { virtualEncounterId: VE });

      const justo = 'a'.repeat(MAX_SDP_LENGTH);
      expect(
        await emitir(medico, 'offer', { virtualEncounterId: VE, sdp: justo }),
      ).toMatchObject({ ok: true });
      expect(
        await emitir(medico, 'offer', {
          virtualEncounterId: VE,
          sdp: justo + 'a',
        }),
      ).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
    });
  });

  describe('inválido: no autorizado', () => {
    it('sin token o con token inválido no llega a conectar', async () => {
      await expect(conectar()).rejects.toThrow('Token inválido o expirado');
      await expect(conectar('tok-falso')).rejects.toThrow(
        'Token inválido o expirado',
      );
    });

    it('un usuario que no participa del encuentro recibe NOT_A_PARTICIPANT y no escucha la sala', async () => {
      const medico = await conectar('tok-medico');
      const ajeno = await conectar('tok-ajeno');
      await emitir(medico, 'join', { virtualEncounterId: VE });

      expect(await emitir(ajeno, 'join', { virtualEncounterId: VE })).toEqual({
        ok: false,
        code: 'NOT_A_PARTICIPANT',
      });
      const nadaAlAjeno = noLlega(ajeno, 'offer');
      await emitir(medico, 'offer', { virtualEncounterId: VE, sdp: 'v=0' });
      await nadaAlAjeno;
    });

    it('relay sin haberse unido no se reenvía', async () => {
      const medico = await conectar('tok-medico');
      const paciente = await conectar('tok-paciente');
      await emitir(medico, 'join', { virtualEncounterId: VE });

      const nada = noLlega(medico, 'ice-candidate');
      expect(
        await emitir(paciente, 'ice-candidate', {
          virtualEncounterId: VE,
          candidate: { candidate: 'candidate:1 1 udp 1 192.0.2.1 1 typ host' },
        }),
      ).toEqual({ ok: false, code: 'NOT_IN_ROOM' });
      await nada;
    });

    it('sesión cerrada, inexistente o id que no es uuid', async () => {
      const medico = await conectar('tok-medico');
      expect(
        await emitir(medico, 'join', { virtualEncounterId: VE_CERRADA }),
      ).toMatchObject({ ok: false, code: 'SESSION_CLOSED' });
      expect(
        await emitir(medico, 'join', { virtualEncounterId: VE_INEXISTENTE }),
      ).toMatchObject({ ok: false, code: 'NOT_FOUND' });
      expect(
        await emitir(medico, 'join', { virtualEncounterId: 'no-es-uuid' }),
      ).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
    });

    it('candidato con forma inválida se rechaza', async () => {
      const medico = await conectar('tok-medico');
      await emitir(medico, 'join', { virtualEncounterId: VE });
      for (const candidate of [
        'candidate:1',
        { candidate: 42 },
        { candidate: 'x'.repeat(2049) },
        { candidate: 'c', sdpMLineIndex: -1 },
        { candidate: 'c', sdpMid: 7 },
      ]) {
        expect(
          await emitir(medico, 'ice-candidate', {
            virtualEncounterId: VE,
            candidate,
          }),
        ).toMatchObject({ ok: false, code: 'INVALID_PAYLOAD' });
      }
    });
  });

  it('los logs llevan ids y códigos, nunca SDP ni candidatos', () => {
    const volcado = JSON.stringify([
      logger.info.mock.calls,
      logger.warn.mock.calls,
    ]);
    expect(volcado).not.toContain('v=0');
    expect(volcado).not.toContain('192.0.2.');
    expect(volcado).toContain('u-medico');
  });
});
