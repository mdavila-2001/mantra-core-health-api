import { jest } from '@jest/globals';
import { CommunitySupportReplyEmailService } from './community-support-reply-email.service';
import { CONCEPTS } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  ADMINISTRATIVE_FOOTER,
  TEAM_REPLY_LEGEND,
} from '../domain/support-reply-email';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const INPUT = {
  messageId: 'msg-1',
  conversationId: 'conv-1',
  tenantId: 'tenant-hospital',
  doctorPublicProfileId: 'pp-perez',
  doctorName: 'Dr. Andrés Pérez',
  authoredByUserId: 'user-ana',
  delegateAssignmentId: 'del-1',
  bodyText: 'Le confirmamos el jueves a las 15:30.',
  disclosureShown: true,
};

function build(
  opts: {
    patient?: { userId?: string; displayName?: string };
    email?: string | null;
    request?: any;
    createFails?: boolean;
    failure?: Error;
  } = {},
) {
  const em = { fork: mockFn().mockReturnValue({}) };
  const repo = {
    patientAccountOf: mockFn().mockResolvedValue(
      opts.patient ?? { userId: 'user-paciente', displayName: 'María' },
    ),
    emailOfUser: mockFn().mockResolvedValue(
      opts.email === undefined ? 'maria@example.com' : opts.email,
    ),
    tenantNames: mockFn().mockResolvedValue(
      new Map([['tenant-hospital', 'Hospital Piloto Mantra']]),
    ),
  };
  const notifications = {
    createRequest: opts.createFails
      ? mockFn().mockRejectedValue(
          opts.failure ?? new Error('mensajería caída'),
        )
      : mockFn().mockResolvedValue(
          opts.request ?? { id: 'req-1', suppressed: false, debounced: false },
        ),
  };
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const service = new CommunitySupportReplyEmailService(
    em as any,
    repo as any,
    notifications as any,
    logger as any,
  );
  return { service, repo, notifications, logger };
}

describe('CommunitySupportReplyEmailService', () => {
  it('crea la solicitud contra el canal de correo, atada a la organización del doctor y al mensaje', async () => {
    const d = build();
    const res = await d.service.enqueue(INPUT);
    expect(res).toEqual({ queued: true, requestId: 'req-1' });
    const [dto, actor] = d.notifications.createRequest.mock.calls[0];
    expect(dto).toMatchObject({
      channelId: MESSAGING_SEED.emailChannelId,
      recipientUserId: 'user-paciente',
      recipientAddress: 'maria@example.com',
      tenantId: 'tenant-hospital',
      categoryConceptId: CONCEPTS.NOTIF_CATEGORY_MESSAGES,
      relatedResourceType: 'community.direct_messages',
      relatedResourceId: 'msg-1',
      debounceKey: 'support-reply:msg-1:email',
    });
    // La autora real firma la solicitud: ella autorizó el envío.
    expect(actor.id).toBe('user-ana');
  });

  it('el remitente visible es el doctor y la leyenda sigue la divulgación del doctor', async () => {
    const shown = build();
    await shown.service.enqueue(INPUT);
    const payload =
      shown.notifications.createRequest.mock.calls[0][0].payloadJson;
    expect(payload.fromName).toBe('Dr. Andrés Pérez');
    expect(payload.subject).toBe('Mensaje de Dr. Andrés Pérez');
    expect(payload.bodyText).toContain(TEAM_REPLY_LEGEND);
    expect(payload.bodyText).toContain(ADMINISTRATIVE_FOOTER);
    expect(payload.bodyText).toContain('Hospital Piloto Mantra');

    const hidden = build();
    await hidden.service.enqueue({ ...INPUT, disclosureShown: false });
    const hiddenPayload =
      hidden.notifications.createRequest.mock.calls[0][0].payloadJson;
    expect(hiddenPayload.bodyText).not.toContain(TEAM_REPLY_LEGEND);
    expect(hiddenPayload.bodyHtml).not.toContain(TEAM_REPLY_LEGEND);
  });

  it('deja registro de la autora real en la solicitud pero no en el texto del correo', async () => {
    const d = build();
    await d.service.enqueue(INPUT);
    const payload = d.notifications.createRequest.mock.calls[0][0].payloadJson;
    expect(payload).toMatchObject({
      kind: 'SUPPORT_REPLY_ON_BEHALF',
      authoredByUserId: 'user-ana',
      onBehalfOfPublicProfileId: 'pp-perez',
      delegateAssignmentId: 'del-1',
      conversationId: 'conv-1',
    });
    // `onBehalfOfProfileId` es la columna `on_behalf_of_profile_id`: guarda el
    // perfil PROFESIONAL. El payload lleva el perfil público y no se llama igual.
    expect(payload).not.toHaveProperty('onBehalfOfProfileId');
    for (const visible of [
      payload.subject,
      payload.bodyText,
      payload.bodyHtml,
      payload.fromName,
    ]) {
      expect(visible).not.toContain('user-ana');
    }
  });

  it('sin cuenta del paciente o sin correo declarado no sale y lo dice', async () => {
    const noAccount = build({ patient: {} });
    expect(await noAccount.service.enqueue(INPUT)).toEqual({
      queued: false,
      skippedReason: 'El paciente no tiene cuenta',
    });
    expect(noAccount.notifications.createRequest).not.toHaveBeenCalled();

    const noEmail = build({ email: null });
    expect((await noEmail.service.enqueue(INPUT)).skippedReason).toMatch(
      /correo/,
    );
    expect(noEmail.notifications.createRequest).not.toHaveBeenCalled();
  });

  it('N11: sin una dirección verificada con credencial activa no encola, lo explica y lo registra sin la dirección', async () => {
    const d = build({ email: null });
    const res = await d.service.enqueue(INPUT);
    expect(res).toEqual({
      queued: false,
      skippedReason:
        'La cuenta del paciente no tiene un correo verificado con credencial activa',
    });
    expect(d.notifications.createRequest).not.toHaveBeenCalled();
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'community.support_reply.email_skipped',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        reason: 'NO_VERIFIED_EMAIL',
      }),
      expect.any(String),
    );
    expect(JSON.stringify(d.logger.info.mock.calls)).not.toContain('@');
  });

  it('respeta las preferencias del paciente: suprimida queda registrada y no sale', async () => {
    const d = build({
      request: {
        id: 'req-2',
        suppressed: true,
        suppressionReason: 'El destinatario no aceptó este canal',
      },
    });
    expect(await d.service.enqueue(INPUT)).toEqual({
      queued: false,
      requestId: 'req-2',
      skippedReason: 'El destinatario no aceptó este canal',
    });
  });

  it('un reenvío del mismo mensaje no duplica el correo', async () => {
    const d = build({
      request: { id: 'req-1', debounced: true, suppressed: false },
    });
    const res = await d.service.enqueue(INPUT);
    expect(res.queued).toBe(false);
    expect(res.skippedReason).toMatch(/Ya había/);
  });

  it('nunca lanza: si mensajería falla informa y deja el aviso en el log sin contenido', async () => {
    const d = build({ createFails: true });
    expect(await d.service.enqueue(INPUT)).toEqual({
      queued: false,
      skippedReason: 'No se pudo encolar el correo',
    });
    const logged = JSON.stringify(d.logger.warn.mock.calls);
    expect(logged).not.toContain('Le confirmamos');
    expect(logged).not.toContain('maria@example.com');
  });

  it('B-f: el log de un fallo lleva solo tipo, código y un mensaje saneado, no el error completo del driver', async () => {
    const failure = Object.assign(
      new Error(
        "insert into notification_requests failed: Key (recipient_address)=(maria@example.com) values ('Le confirmamos el jueves a las 15:30.')",
      ),
      {
        code: '23505',
        detail: 'Key (recipient_address)=(maria@example.com) already exists.',
        parameters: [
          'maria@example.com',
          'Le confirmamos el jueves a las 15:30.',
        ],
      },
    );
    const d = build({ createFails: true, failure });
    await d.service.enqueue(INPUT);
    const [fields] = d.logger.warn.mock.calls[0];
    expect(fields.err).toEqual({
      type: 'Error',
      code: '23505',
      message: expect.any(String),
    });
    const logged = JSON.stringify(d.logger.warn.mock.calls);
    expect(logged).not.toContain('maria@example.com');
    expect(logged).not.toContain('Le confirmamos');
    expect(logged).not.toContain('already exists');
  });
});
