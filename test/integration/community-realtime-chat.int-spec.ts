import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';

/**
 * El gateway WS de mensajería (`CommunityMessagingGateway`), de punta a punta:
 * conexión real por socket.io contra la app real, no un doble del gateway.
 *
 * ## Por qué hace falta un puerto real
 *
 * `supertest` alcanza con el `http.Server` sin escuchar; un cliente
 * `socket.io-client` no — necesita un puerto de verdad para el handshake. Por
 * eso esta suite pide `bootstrapTestApp({ realtime: true })`, la única que lo
 * hace: es aditivo y no afecta a las demás.
 *
 * ## Lo que fija
 *
 * 1. Sin token, el socket no queda conectado.
 * 2. Declarar un `profileId` ajeno no une a nada (`NOT_OWN_PROFILE`).
 * 3. Unirse a una conversación de la que no se participa tampoco
 *    (`NOT_A_PARTICIPANT`), y no llega nada de esa conversación.
 * 4. El camino feliz: enviar por REST llega por WS al otro lado sin recargar
 *    nada, y marcar leído por REST llega como `conversation:read`.
 */
describe('Mensajería en tiempo real — gateway WS (integración)', () => {
  let ctx: TestContext;
  /** Los campos que el alta de paciente exige; salen del arnés. */
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  let doctorToken: string;
  let doctorTenantId: string;
  let doctorProfileId: string;
  let pacienteToken: string;
  let pacienteProfileId: string;
  let conversationId: string;

  /** Los claims del token; acá interesa el contenido, no la firma. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  function socketUrl(): string {
    return `http://127.0.0.1:${ctx.httpPort}`;
  }

  /** Conecta un socket con el token dado (o sin ninguno). */
  function connect(token?: string): Socket {
    return io(socketUrl(), {
      autoConnect: true,
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      auth: token ? { token } : {},
    });
  }

  /** Espera un evento puntual, o `null` si no llega dentro del plazo. */
  function waitFor<T = unknown>(
    socket: Socket,
    event: string,
    timeoutMs = 4000,
  ): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      socket.once(event, (payload: T) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp({ realtime: true });
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const sufijo = randomUUID().slice(0, 8);

    // --- El médico y su vitrina pública -----------------------------------
    const emailDoctor = `chat-doc-${sufijo}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: emailDoctor,
        password: 'S3cret-passw0rd',
        name: 'Renata',
        lastName: 'Chávez',
        licenseNumber: `LIC-CHAT-${sufijo}`,
        credentialNumber: `CRED-CHAT-${sufijo}`,
      })
      .expect(201);
    const loginDoctor = await http()
      .post('/iam/auth/login')
      .send({ email: emailDoctor, password: 'S3cret-passw0rd' })
      .expect(200);
    doctorToken = loginDoctor.body.accessToken;
    doctorTenantId = (claims(doctorToken)['tenants'] as string[])[0];

    const perfilDoctor = await http()
      .put('/community/profiles/me')
      .set(bearer(doctorToken))
      .send({
        tenantId: doctorTenantId,
        slug: `chat-doc-${sufijo}`,
        displayName: 'Dra. Renata Chávez',
      })
      .expect(200);
    doctorProfileId = perfilDoctor.body.id;

    // --- El paciente y su vitrina pública -----------------------------------
    const nationalId = `CI-CHAT-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: 'S3cret-passw0rd',
        name: 'Iván',
        lastName: 'Mamani',
        email: `chat-pac-${sufijo}@example.test`,
      })
      .expect(201);
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: 'S3cret-passw0rd' })
      .expect(200);
    pacienteToken = loginPaciente.body.accessToken;

    const perfilPaciente = await http()
      .put('/community/profiles/me')
      .set(bearer(pacienteToken))
      // Misma organización que el médico: es la única forma que tiene HOY el
      // paciente de declarar `tenantId` en este `PUT` — no hay una noción de
      // "tenant del paciente" separada.
      .send({
        tenantId: doctorTenantId,
        slug: `chat-pac-${sufijo}`,
        displayName: 'Iván Mamani',
      })
      .expect(200);
    pacienteProfileId = perfilPaciente.body.id;

    // --- La conversación entre los dos --------------------------------------
    const conversacion = await http()
      .post('/community/conversations')
      .set(bearer(doctorToken))
      .send({ participantProfileIds: [doctorProfileId, pacienteProfileId] })
      .expect(201);
    conversationId = conversacion.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('sin token, el socket no queda conectado', async () => {
    const socket = connect(undefined);
    try {
      const desconectado = await waitFor(socket, 'disconnect');
      const conectoError = await new Promise<boolean>((resolve) => {
        socket.once('connect_error', () => resolve(true));
        setTimeout(() => resolve(false), 100);
      });
      expect(socket.connected).toBe(false);
      expect(desconectado !== null || conectoError).toBe(true);
    } finally {
      socket.disconnect();
    }
  });

  it('declarar un profileId ajeno no une a nada (NOT_OWN_PROFILE)', async () => {
    const socket = connect(pacienteToken);
    try {
      await waitFor(socket, 'connect');
      const errorPromise = waitFor<{ code: string }>(socket, 'error');
      // El paciente intenta abrir la bandeja del médico.
      socket.emit('join:inbox', { profileId: doctorProfileId });
      const error = await errorPromise;
      expect(error?.code).toBe('NOT_OWN_PROFILE');
    } finally {
      socket.disconnect();
    }
  });

  it('unirse a una conversación ajena no une a nada (NOT_A_PARTICIPANT), y no llega nada de ella', async () => {
    // Una tercera conversación de la que el paciente NO participa.
    const otraPersona = await http()
      .put('/community/profiles/me')
      .set(bearer(doctorToken))
      .send({
        tenantId: doctorTenantId,
        slug: `chat-tercero-${randomUUID().slice(0, 8)}`,
        displayName: 'Otra persona',
      })
      .expect(200);
    // El médico ya tiene su propia vitrina; se abre una conversación entre esa
    // vitrina y una tercera cualquiera creada arriba (reusa el token del
    // médico porque `createConversation` no exige titularidad de los
    // participantes — es el mismo comportamiento que ya tiene en producción).
    const conversacionAjena = await http()
      .post('/community/conversations')
      .set(bearer(doctorToken))
      .send({
        participantProfileIds: [doctorProfileId, otraPersona.body.id],
        conversationType: 'GROUP',
      })
      .expect(201);

    const socket = connect(pacienteToken);
    try {
      await waitFor(socket, 'connect');
      const errorPromise = waitFor<{ code: string }>(socket, 'error');
      socket.emit('join:conversation', {
        conversationId: conversacionAjena.body.id,
        profileId: pacienteProfileId,
      });
      const error = await errorPromise;
      expect(error?.code).toBe('NOT_A_PARTICIPANT');

      // Y aunque insista, no le llega nada de esa conversación.
      const mensajePromise = waitFor(socket, 'conversation:message', 1500);
      await http()
        .post(`/community/conversations/${conversacionAjena.body.id}/messages`)
        .set(bearer(doctorToken))
        .send({ senderProfileId: doctorProfileId, bodyText: 'no es para vos' })
        .expect(201);
      expect(await mensajePromise).toBeNull();
    } finally {
      socket.disconnect();
    }
  });

  it('camino feliz: enviar por REST llega por WS al otro lado, y leer también', async () => {
    const socketDoctor = connect(doctorToken);
    const socketPaciente = connect(pacienteToken);
    try {
      await Promise.all([
        waitFor(socketDoctor, 'connect'),
        waitFor(socketPaciente, 'connect'),
      ]);

      socketDoctor.emit('join:conversation', {
        conversationId,
        profileId: doctorProfileId,
      });
      socketPaciente.emit('join:conversation', {
        conversationId,
        profileId: pacienteProfileId,
      });
      // Sin esto la unión podría no haber terminado cuando se manda el REST.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const textoEnviado = `Hola, ¿cómo estás? ${randomUUID().slice(0, 6)}`;
      const mensajeEsperado = waitFor<{ bodyText: string }>(
        socketPaciente,
        'conversation:message',
      );
      await http()
        .post(`/community/conversations/${conversationId}/messages`)
        .set(bearer(doctorToken))
        .send({ senderProfileId: doctorProfileId, bodyText: textoEnviado })
        .expect(201);

      const recibido = await mensajeEsperado;
      expect(recibido?.bodyText).toBe(textoEnviado);

      // Marcar leído por REST avisa por WS a quien tiene la conversación abierta.
      const leidoEsperado = waitFor<{ profileId: string }>(
        socketDoctor,
        'conversation:read',
      );
      await http()
        .post(`/community/conversations/${conversationId}/read`)
        .set(bearer(pacienteToken))
        .send({ recipientProfileId: pacienteProfileId })
        .expect(200);

      const leido = await leidoEsperado;
      expect(leido?.profileId).toBe(pacienteProfileId);
    } finally {
      socketDoctor.disconnect();
      socketPaciente.disconnect();
    }
  });
});
