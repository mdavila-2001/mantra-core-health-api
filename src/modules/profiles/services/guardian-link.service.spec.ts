import { jest } from '@jest/globals';

import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  GUARDIAN_LINK_AGGREGATE_TYPE,
  GUARDIAN_LINK_REQUESTED_EVENT,
  GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
} from '../guardian-link.contract';
import { PROF } from '../profiles.concepts';
import { GUARDIAN_LINK_TOKEN_PATTERN } from '../dto';
import {
  GuardianLinkService,
  hashGuardianLinkToken,
} from './guardian-link.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const EVENTO = {
  domainEventId: '11111111-1111-4111-8111-111111111111',
  tenantId: '22222222-2222-4222-8222-222222222222',
  patientProfileId: '33333333-3333-4333-8333-333333333333',
  relatedPersonId: '44444444-4444-4444-8444-444444444444',
  guardianPersonId: '55555555-5555-4555-8555-555555555555',
};

/** Sistema bajo prueba con repositorios dobles y una transacción de mentira. */
function build(opts: { phone?: string | null; related?: any } = {}) {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({
      domainEventId: 'event-1',
      outboxMessageId: 'outbox-1',
      idempotencyKey: 'k',
      duplicate: false,
    }),
  };
  let fila: any = null;
  const invitations = {
    findByDomainEventForUpdate: mockFn(async () => fila),
    findByIdForUpdate: mockFn(async () => fila),
    findByTokenHashForUpdate: mockFn(async (_tx: any, hash: string) =>
      fila && fila.tokenHash === hash ? fila : null,
    ),
    create: mockFn((_tx: any, data: any) => {
      fila = { id: 'inv-1', attemptCount: 0, ...data };
      return fila;
    }),
  };
  const relatedPersons = {
    findById: mockFn().mockResolvedValue(
      opts.related === undefined
        ? {
            id: EVENTO.relatedPersonId,
            patientProfileId: EVENTO.patientProfileId,
            personId: EVENTO.guardianPersonId,
          }
        : opts.related,
    ),
  };
  const contactPoints = {
    findVigenteByOwnerAndSystem: mockFn().mockResolvedValue(
      opts.phone === null
        ? null
        : { value: opts.phone === undefined ? '7123 4567' : opts.phone },
    ),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new GuardianLinkService(
    em,
    outbox as any,
    invitations as any,
    relatedPersons as any,
    contactPoints as any,
    logger as any,
  );
  return {
    service,
    tx,
    outbox,
    invitations,
    contactPoints,
    logger,
    fila: () => fila,
    setFila: (value: any) => {
      fila = value;
    },
  };
}

/** Saca el token del enlace del texto del SMS. */
function tokenDe(body: string): string {
  const match = /token=([A-Za-z0-9_-]+)/.exec(body);
  if (!match) throw new Error('sin token en el cuerpo');
  return match[1];
}

describe('GuardianLinkService.requestInTransaction', () => {
  it('publica GuardianLinkRequested en el tx recibido, sólo con ids', async () => {
    const { service, tx, outbox } = build();

    const resultado = await service.requestInTransaction(tx as any, {
      tenantId: EVENTO.tenantId,
      patientProfileId: EVENTO.patientProfileId,
      relatedPersonId: EVENTO.relatedPersonId,
      guardianPersonId: EVENTO.guardianPersonId,
      actorUserId: 'actor-1',
    });

    expect(resultado).toEqual({ domainEventId: 'event-1' });
    expect(outbox.publishDomainEvent).toHaveBeenCalledWith(tx, {
      tenantId: EVENTO.tenantId,
      eventType: GUARDIAN_LINK_REQUESTED_EVENT,
      eventVersion: GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
      aggregateType: GUARDIAN_LINK_AGGREGATE_TYPE,
      aggregateId: EVENTO.relatedPersonId,
      payloadJson: {
        patientProfileId: EVENTO.patientProfileId,
        relatedPersonId: EVENTO.relatedPersonId,
        guardianPersonId: EVENTO.guardianPersonId,
        tenantId: EVENTO.tenantId,
      },
      actorUserId: 'actor-1',
    });
  });

  it('sin tenant no escribe la clave en el payload', async () => {
    const { service, tx, outbox } = build();
    await service.requestInTransaction(tx as any, {
      patientProfileId: EVENTO.patientProfileId,
      relatedPersonId: EVENTO.relatedPersonId,
      guardianPersonId: EVENTO.guardianPersonId,
      actorUserId: 'actor-1',
    });
    const input = outbox.publishDomainEvent.mock.calls[0][1];
    expect(input.payloadJson).not.toHaveProperty('tenantId');
  });
});

describe('GuardianLinkService.issue', () => {
  describe('correcto', () => {
    it('crea la invitación, normaliza a E.164 y guarda sólo el hash del token', async () => {
      const { service, invitations, contactPoints, fila } = build();

      const r = await service.issue(EVENTO, 'worker-1');

      expect(r.action).toBe('SEND');
      if (r.action !== 'SEND') throw new Error('esperaba SEND');
      expect(r.toE164).toBe('+59171234567');
      expect(invitations.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          domainEventId: EVENTO.domainEventId,
          statusConceptId: PROF.GUARDIAN_LINK_PENDING,
          actorUserId: 'worker-1',
        }),
      );
      expect(contactPoints.findVigenteByOwnerAndSystem).toHaveBeenCalledWith(
        expect.anything(),
        EVENTO.guardianPersonId,
        CONCEPTS.CONTACT_PHONE,
      );

      const token = tokenDe(r.body);
      expect(token).toMatch(GUARDIAN_LINK_TOKEN_PATTERN);
      expect(fila().tokenHash).toBe(hashGuardianLinkToken(token));
      expect(fila().tokenHash).not.toContain(token);
      expect(fila().expiresAt.getTime()).toBeGreaterThan(
        Date.now() + 71 * 3_600_000,
      );
    });

    it('el texto no lleva el nombre del paciente ni el teléfono', async () => {
      const { service } = build();
      const r = await service.issue(EVENTO);
      if (r.action !== 'SEND') throw new Error('esperaba SEND');
      expect(r.body).not.toContain('71234567');
      expect(r.body).toContain('/vincular-tutor?token=');
    });
  });

  describe('límite', () => {
    it('la segunda entrega del mismo evento ya enviado no reenvía (SKIP)', async () => {
      const { service, setFila, invitations } = build();
      setFila({
        id: 'inv-1',
        statusConceptId: PROF.GUARDIAN_LINK_SENT,
        guardianPersonId: EVENTO.guardianPersonId,
      });

      const r = await service.issue(EVENTO);

      expect(r).toEqual({
        action: 'SKIP',
        invitationId: 'inv-1',
        reason: 'ALREADY_SENT',
      });
      expect(invitations.create).not.toHaveBeenCalled();
    });

    it('ya confirmada: SKIP con motivo CONFIRMED', async () => {
      const { service, setFila } = build();
      setFila({ id: 'inv-1', statusConceptId: PROF.GUARDIAN_LINK_CONFIRMED });
      const r = await service.issue(EVENTO);
      expect(r).toMatchObject({ action: 'SKIP', reason: 'CONFIRMED' });
    });

    it('tras un envío fallido reemite ROTANDO el token', async () => {
      const { service, setFila, fila } = build();
      setFila({
        id: 'inv-1',
        statusConceptId: PROF.GUARDIAN_LINK_FAILED,
        guardianPersonId: EVENTO.guardianPersonId,
        tokenHash: 'a'.repeat(64),
      });

      const r = await service.issue(EVENTO);

      expect(r.action).toBe('SEND');
      expect(fila().tokenHash).not.toBe('a'.repeat(64));
    });
  });

  describe('inválido', () => {
    it('teléfono no normalizable: INVALID_PHONE terminal, sin token y sin el número en el log', async () => {
      const { service, fila, logger } = build({ phone: '123' });

      const r = await service.issue(EVENTO);

      expect(r).toEqual({ action: 'INVALID_PHONE', invitationId: 'inv-1' });
      expect(fila().statusConceptId).toBe(PROF.GUARDIAN_LINK_INVALID_PHONE);
      expect(fila().tokenHash).toBeNull();
      expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('123"');
    });

    it('sin teléfono vigente también es INVALID_PHONE', async () => {
      const { service } = build({ phone: null });
      const r = await service.issue(EVENTO);
      expect(r.action).toBe('INVALID_PHONE');
    });

    it('ya marcada INVALID_PHONE no vuelve a consultar el teléfono', async () => {
      const { service, setFila, contactPoints } = build();
      setFila({
        id: 'inv-1',
        statusConceptId: PROF.GUARDIAN_LINK_INVALID_PHONE,
      });
      const r = await service.issue(EVENTO);
      expect(r.action).toBe('INVALID_PHONE');
      expect(contactPoints.findVigenteByOwnerAndSystem).not.toHaveBeenCalled();
    });

    it('vínculo inexistente → 404 sin crear la invitación', async () => {
      const { service, invitations } = build({ related: null });
      await expect(service.issue(EVENTO)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(invitations.create).not.toHaveBeenCalled();
    });

    it('vínculo de OTRO paciente → 404', async () => {
      const { service } = build({
        related: {
          id: EVENTO.relatedPersonId,
          patientProfileId: 'otro-paciente',
          personId: EVENTO.guardianPersonId,
        },
      });
      await expect(service.issue(EVENTO)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});

describe('GuardianLinkService.recordDelivery', () => {
  it('SENT: estado, canal, referencia y un intento más', async () => {
    const { service, setFila, fila } = build();
    setFila({
      id: 'inv-1',
      attemptCount: 0,
      statusConceptId: PROF.GUARDIAN_LINK_PENDING,
    });

    const r = await service.recordDelivery('inv-1', {
      outcome: 'SENT',
      channel: 'SMS',
      providerMessageRef: 'mock:abc',
    });

    expect(r).toEqual({
      invitationId: 'inv-1',
      statusConceptId: PROF.GUARDIAN_LINK_SENT,
    });
    expect(fila()).toMatchObject({
      attemptCount: 1,
      channelCode: 'SMS',
      providerMessageRef: 'mock:abc',
    });
    expect(fila().sentAt).toBeInstanceOf(Date);
  });

  it('FAILED: guarda el código y lo avisa en el log con ids', async () => {
    const { service, setFila, fila, logger } = build();
    setFila({
      id: 'inv-1',
      attemptCount: 1,
      statusConceptId: PROF.GUARDIAN_LINK_PENDING,
    });

    await service.recordDelivery('inv-1', {
      outcome: 'FAILED',
      channel: 'WHATSAPP',
      errorCode: 'TWILIO_HTTP_400_21211',
    });

    expect(fila()).toMatchObject({
      attemptCount: 2,
      statusConceptId: PROF.GUARDIAN_LINK_FAILED,
      lastErrorCode: 'TWILIO_HTTP_400_21211',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ invitationId: 'inv-1' }),
      expect.any(String),
    );
  });

  it('un acuse tardío no deshace una confirmación', async () => {
    const { service, setFila, fila } = build();
    setFila({
      id: 'inv-1',
      attemptCount: 1,
      statusConceptId: PROF.GUARDIAN_LINK_CONFIRMED,
    });
    const r = await service.recordDelivery('inv-1', {
      outcome: 'FAILED',
      channel: 'SMS',
    });
    expect(r.statusConceptId).toBe(PROF.GUARDIAN_LINK_CONFIRMED);
    expect(fila().attemptCount).toBe(1);
  });

  it('invitación inexistente → 404', async () => {
    const { service } = build();
    await expect(
      service.recordDelivery('nada', { outcome: 'SENT', channel: 'SMS' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('GuardianLinkService.confirm', () => {
  async function emitida() {
    const ctx = build();
    const r = await ctx.service.issue(EVENTO);
    if (r.action !== 'SEND') throw new Error('esperaba SEND');
    return { ...ctx, token: tokenDe(r.body) };
  }

  it('correcto: confirma y el token deja de servir (un solo uso)', async () => {
    const { service, token, fila } = await emitida();

    await expect(service.confirm(token)).resolves.toEqual({
      status: 'CONFIRMED',
    });
    expect(fila().statusConceptId).toBe(PROF.GUARDIAN_LINK_CONFIRMED);
    expect(fila().tokenHash).toBeNull();
    expect(fila().confirmedAt).toBeInstanceOf(Date);

    await expect(service.confirm(token)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('límite: vencido justo ahora → 422, sin confirmar', async () => {
    const { service, token, fila } = await emitida();
    fila().expiresAt = new Date(Date.now() - 1);

    await expect(service.confirm(token)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(fila().statusConceptId).not.toBe(PROF.GUARDIAN_LINK_CONFIRMED);
  });

  it('inválido: un token que no es de nadie → 404', async () => {
    const { service } = await emitida();
    await expect(service.confirm('x'.repeat(43))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});
