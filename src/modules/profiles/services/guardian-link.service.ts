import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
} from '../../../common';
import { ContactPointsRepository } from '../../common/repositories';
import { OutboxService } from '../../messaging/services';
import {
  GUARDIAN_LINK_AGGREGATE_TYPE,
  GUARDIAN_LINK_REQUESTED_EVENT,
  GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
  GUARDIAN_LINK_TTL_HOURS,
  type GuardianLinkIssueResponse,
  type GuardianLinkRequestedPayload,
} from '../guardian-link.contract';
import type {
  ConfirmGuardianLinkResponseDto,
  GuardianLinkDeliveryDto,
  GuardianLinkDeliveryResponseDto,
  IssueGuardianLinkDto,
} from '../dto';
import { toE164 } from '../phone-e164';
import { PROF } from '../profiles.concepts';
import {
  GuardianLinkInvitationsRepository,
  RelatedPersonsRepository,
} from '../repositories';

/** Lo que el alta de mostrador aporta para pedir el aviso. */
export interface RequestGuardianLinkInput {
  /** Organización del alta (la de la reserva). */
  readonly tenantId?: string;
  /** Perfil del paciente. */
  readonly patientProfileId: string;
  /** La fila de persona relacionada recién creada. */
  readonly relatedPersonId: string;
  /** La persona del tutor. */
  readonly guardianPersonId: string;
  /** Quién atiende el mostrador. */
  readonly actorUserId: string;
}

/**
 * Ruta del front que recibe el enlace. La pantalla todavía no existe en el
 * front (ver el REPORTE de `docs/trabajo/2026-09-26-aviso-tutor`): el contrato
 * de la API queda listo para que la construya.
 */
export const GUARDIAN_LINK_FRONT_PATH = '/vincular-tutor';

/**
 * Base pública del front para armar el enlace absoluto. Misma variable y mismo
 * default que `scheduling/notices/agenda-notices.env.ts`: un SMS lo abre un
 * cliente que no conoce el dominio de la app.
 *
 * @returns La base sin barra final.
 */
export function guardianLinkBaseUrl(): string {
  const raw = process.env.WEB_APP_BASE_URL ?? 'http://localhost:4200';
  return raw.replace(/\/+$/, '');
}

/**
 * Texto del aviso. Sin el nombre del paciente ni el del centro: el SMS pasa
 * por un proveedor externo y puede leerse en la pantalla bloqueada de un
 * teléfono que no sabemos de quién es hasta que lo confirme.
 *
 * @param url - Enlace absoluto con el token.
 * @returns El cuerpo del mensaje.
 */
export function guardianLinkMessageBody(url: string): string {
  return (
    `Alovida: te registraron como contacto de un paciente. ` +
    `Confirmá que este es tu número: ${url} ` +
    `(vence en ${GUARDIAN_LINK_TTL_HOURS} h). Si no te corresponde, ignorá este mensaje.`
  );
}

/** SHA-256 hex del token: es lo único del token que se guarda. */
export function hashGuardianLinkToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * El aviso al tutor del paciente de mostrador, de punta a punta en la API.
 *
 * ## Tres momentos, tres transacciones
 *
 * 1. **Pedir** (`requestInTransaction`): dentro del alta. Sólo escribe el hecho
 *    en el outbox; no toca el teléfono ni llama a nadie. Si el alta se deshace,
 *    el hecho se deshace con ella.
 * 2. **Emitir** (`issue`) y **asentar** (`recordDelivery`): los llama el worker
 *    que consume la cola, fuera de cualquier transacción de negocio. Emitir crea
 *    la invitación (una por evento), resuelve y normaliza el teléfono y genera
 *    el token; asentar guarda lo que dijo el proveedor.
 * 3. **Confirmar** (`confirm`): el tutor, sin sesión, con el token del enlace.
 *
 * ## Por qué un token sin sesión (desvío acotado de P-15-2)
 *
 * P-15-2 prohíbe tokens de acción clínica sin sesión. El tutor no tiene cuenta,
 * así que no hay sesión que pueda decidir; y confirmar no es una acción
 * clínica: prueba que el teléfono es de quien lo atendió. No cambia
 * `is_legal_guardian`, no devuelve datos del paciente, se usa una sola vez y
 * vence a las {@link GUARDIAN_LINK_TTL_HOURS} horas.
 */
@Injectable()
export class GuardianLinkService {
  /**
   * @param em - Contexto de persistencia.
   * @param outbox - Publicación transaccional del hecho.
   * @param invitations - Invitaciones al tutor.
   * @param relatedPersons - Para comprobar que el vínculo del evento existe.
   * @param contactPoints - Teléfono del tutor.
   * @param logger - Logger estructurado (sólo ids).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly outbox: OutboxService,
    private readonly invitations: GuardianLinkInvitationsRepository,
    private readonly relatedPersons: RelatedPersonsRepository,
    private readonly contactPoints: ContactPointsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GuardianLinkService.name);
  }

  /**
   * Publica `GuardianLinkRequested` en la transacción del alta.
   *
   * @param tx - Transacción abierta por quien da el alta.
   * @param input - Ids del vínculo y actor.
   * @returns El evento publicado.
   */
  async requestInTransaction(
    tx: EntityManager,
    input: RequestGuardianLinkInput,
  ): Promise<{ domainEventId: string }> {
    const payload: GuardianLinkRequestedPayload = {
      patientProfileId: input.patientProfileId,
      relatedPersonId: input.relatedPersonId,
      guardianPersonId: input.guardianPersonId,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    };
    const published = await this.outbox.publishDomainEvent(tx, {
      tenantId: input.tenantId,
      eventType: GUARDIAN_LINK_REQUESTED_EVENT,
      eventVersion: GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
      aggregateType: GUARDIAN_LINK_AGGREGATE_TYPE,
      aggregateId: input.relatedPersonId,
      payloadJson: payload,
      actorUserId: input.actorUserId,
    });
    this.logger.info(
      {
        operation: 'profiles.guardian-link.request',
        relatedPersonId: input.relatedPersonId,
        domainEventId: published.domainEventId,
      },
      'Guardian link requested through the outbox',
    );
    return { domainEventId: published.domainEventId };
  }

  /**
   * Emite (o reemite) la invitación de un evento.
   *
   * Idempotente por evento: la cola entrega al menos una vez, así que el mismo
   * job puede llegar dos veces. Si ya salió o ya se confirmó, `SKIP`. Si el
   * intento anterior falló, se **rota** el token: el viejo nunca llegó a nadie
   * que pueda usarlo, y sólo el último enviado debe valer.
   *
   * @param dto - El evento tal como lo recibió el worker.
   * @param actorUserId - La cuenta del worker.
   * @returns Qué tiene que hacer el worker.
   * @throws ResourceNotFoundException si el vínculo del evento no existe o no
   *   coincide con el paciente y la persona declarados.
   */
  async issue(
    dto: IssueGuardianLinkDto,
    actorUserId?: string,
  ): Promise<GuardianLinkIssueResponse> {
    return this.em.transactional(async (tx) => {
      let invitation = await this.invitations.findByDomainEventForUpdate(
        tx,
        dto.domainEventId,
      );

      if (!invitation) {
        const related = await this.relatedPersons.findById(
          tx,
          dto.relatedPersonId,
        );
        if (
          !related ||
          related.patientProfileId !== dto.patientProfileId ||
          related.personId !== dto.guardianPersonId
        ) {
          throw new ResourceNotFoundException(
            'La persona relacionada del evento no existe o no coincide',
          );
        }
        invitation = this.invitations.create(tx, {
          tenantId: dto.tenantId,
          patientProfileId: dto.patientProfileId,
          relatedPersonId: dto.relatedPersonId,
          guardianPersonId: dto.guardianPersonId,
          domainEventId: dto.domainEventId,
          statusConceptId: PROF.GUARDIAN_LINK_PENDING,
          actorUserId,
        });
      }

      if (invitation.statusConceptId === PROF.GUARDIAN_LINK_CONFIRMED)
        return {
          action: 'SKIP',
          invitationId: invitation.id,
          reason: 'CONFIRMED',
        };
      if (invitation.statusConceptId === PROF.GUARDIAN_LINK_SENT)
        return {
          action: 'SKIP',
          invitationId: invitation.id,
          reason: 'ALREADY_SENT',
        };
      if (invitation.statusConceptId === PROF.GUARDIAN_LINK_INVALID_PHONE)
        return { action: 'INVALID_PHONE', invitationId: invitation.id };

      const phone = await this.contactPoints.findVigenteByOwnerAndSystem(
        tx,
        invitation.guardianPersonId,
        CONCEPTS.CONTACT_PHONE,
      );
      const toE164Value = toE164(phone?.value);
      if (!toE164Value) {
        invitation.statusConceptId = PROF.GUARDIAN_LINK_INVALID_PHONE;
        invitation.tokenHash = null;
        touch(invitation, actorUserId);
        this.logger.warn(
          {
            operation: 'profiles.guardian-link.issue',
            invitationId: invitation.id,
            hasPhone: Boolean(phone),
          },
          'Guardian phone cannot be normalized to E.164: invitation not sent',
        );
        return { action: 'INVALID_PHONE', invitationId: invitation.id };
      }

      const token = randomBytes(32).toString('base64url');
      invitation.tokenHash = hashGuardianLinkToken(token);
      invitation.expiresAt = new Date(
        Date.now() + GUARDIAN_LINK_TTL_HOURS * 3_600_000,
      );
      touch(invitation, actorUserId);

      const url = `${guardianLinkBaseUrl()}${GUARDIAN_LINK_FRONT_PATH}?token=${token}`;
      return {
        action: 'SEND',
        invitationId: invitation.id,
        toE164: toE164Value,
        body: guardianLinkMessageBody(url),
      };
    });
  }

  /**
   * Asienta el resultado del envío que reporta el worker.
   *
   * @param invitationId - La invitación.
   * @param dto - Resultado del canal.
   * @param actorUserId - La cuenta del worker.
   * @returns El estado resultante.
   * @throws ResourceNotFoundException si la invitación no existe.
   */
  async recordDelivery(
    invitationId: string,
    dto: GuardianLinkDeliveryDto,
    actorUserId?: string,
  ): Promise<GuardianLinkDeliveryResponseDto> {
    return this.em.transactional(async (tx) => {
      const invitation = await this.invitations.findByIdForUpdate(
        tx,
        invitationId,
      );
      if (!invitation)
        throw new ResourceNotFoundException('La invitación no existe');

      // Un acuse tardío no deshace una confirmación ya hecha.
      if (invitation.statusConceptId === PROF.GUARDIAN_LINK_CONFIRMED)
        return {
          invitationId: invitation.id,
          statusConceptId: invitation.statusConceptId,
        };

      invitation.attemptCount += 1;
      invitation.channelCode = dto.channel;
      if (dto.outcome === 'SENT') {
        invitation.statusConceptId = PROF.GUARDIAN_LINK_SENT;
        invitation.sentAt = new Date();
        invitation.providerMessageRef = dto.providerMessageRef;
        invitation.lastErrorCode = undefined;
      } else {
        invitation.statusConceptId = PROF.GUARDIAN_LINK_FAILED;
        invitation.lastErrorCode = dto.errorCode ?? 'UNKNOWN';
        this.logger.warn(
          {
            operation: 'profiles.guardian-link.delivery',
            invitationId: invitation.id,
            channel: dto.channel,
            errorCode: invitation.lastErrorCode,
          },
          'Guardian link delivery failed',
        );
      }
      touch(invitation, actorUserId);

      return {
        invitationId: invitation.id,
        statusConceptId: invitation.statusConceptId,
      };
    });
  }

  /**
   * El tutor confirma con el token del enlace. Una sola vez.
   *
   * @param token - El token recibido (ya validado en forma por el DTO).
   * @returns `CONFIRMED`, sin datos del paciente.
   * @throws ResourceNotFoundException si el token no corresponde a ninguna
   *   invitación vigente (desconocido o ya usado): los dos casos responden
   *   igual para no revelar cuál es.
   * @throws PreconditionFailedException si el enlace venció.
   */
  async confirm(token: string): Promise<ConfirmGuardianLinkResponseDto> {
    const tokenHash = hashGuardianLinkToken(token);
    return this.em.transactional(async (tx) => {
      const invitation = await this.invitations.findByTokenHashForUpdate(
        tx,
        tokenHash,
      );
      if (!invitation)
        throw new ResourceNotFoundException(
          'El enlace no es válido o ya fue usado',
        );
      if (!invitation.expiresAt || invitation.expiresAt.getTime() <= Date.now())
        throw new PreconditionFailedException(
          'El enlace venció. Pedí en el centro que te lo reenvíen.',
        );

      invitation.statusConceptId = PROF.GUARDIAN_LINK_CONFIRMED;
      invitation.confirmedAt = new Date();
      // De un solo uso: sin hash, el mismo enlace ya no encuentra la fila.
      invitation.tokenHash = null;
      touch(invitation);

      this.logger.info(
        {
          operation: 'profiles.guardian-link.confirm',
          invitationId: invitation.id,
        },
        'Guardian link confirmed',
      );
      return { status: 'CONFIRMED' };
    });
  }
}
