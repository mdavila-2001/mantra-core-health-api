import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import type {
  InsuranceCarriers,
  PractitionerInsurerRequests,
} from '../../entities';
import { PractitionerInsurerRequestsRepository } from '../../infrastructure/repositories';
import type {
  PractitionerInsurerRequestDto,
  PractitionerInsurerRequestPageDto,
  PractitionerInsurerRequestStatus,
  ReceivedPractitionerInsurerRequestDto,
  ReceivedPractitionerInsurerRequestPageDto,
} from '../../presentation/dto/practitioner-insurer-request.dto';
import { InsurerContextService } from './insurer-context.service';

/** El concepto de cada estado, y su clave para el cliente. */
const STATUS_BY_CONCEPT: ReadonlyMap<string, PractitionerInsurerRequestStatus> =
  new Map([
    [INS.PRACTITIONER_REQUEST_PENDING, 'PENDING'],
    [INS.PRACTITIONER_REQUEST_APPROVED, 'APPROVED'],
    [INS.PRACTITIONER_REQUEST_REJECTED, 'REJECTED'],
    [INS.PRACTITIONER_REQUEST_WITHDRAWN, 'WITHDRAWN'],
  ]);

/** Estados en los que el pedido sigue vivo: pedirlo otra vez no agrega nada. */
const LIVE_STATES: readonly string[] = [
  INS.PRACTITIONER_REQUEST_PENDING,
  INS.PRACTITIONER_REQUEST_APPROVED,
];

/** Lo que muestra la bandeja de la aseguradora: lo pendiente y lo ya decidido. */
const INBOX_STATES: readonly string[] = [
  INS.PRACTITIONER_REQUEST_PENDING,
  INS.PRACTITIONER_REQUEST_APPROVED,
  INS.PRACTITIONER_REQUEST_REJECTED,
];

const ACCESS_DENIED =
  'Sólo la aseguradora activa puede ver y decidir las solicitudes de profesionales';

/** El resultado de pedir varias aseguradoras de una vez. */
export interface InsurerRequestBatchResult {
  /** Las solicitudes creadas o reabiertas por este pedido. */
  readonly requested: readonly PractitionerInsurerRequests[];
  /** Las que ya estaban pendientes o aprobadas y no se tocaron. */
  readonly alreadyLive: readonly PractitionerInsurerRequests[];
}

/**
 * El médico pide trabajar con una aseguradora; la aseguradora lo confirma o lo
 * rechaza (v4.2.64).
 *
 * ## Quién puede qué
 *
 * - El **médico** pide, lee las suyas y retira una pendiente. El sujeto sale
 *   siempre de la sesión: ninguna ruta recibe un id de profesional.
 * - La **aseguradora** lee las que recibió y decide. La compañía sale del
 *   tenant activo (`InsurerContextService`), con la misma barrera que su
 *   bandeja de reclamos: membresía administrativa o rol de aseguradora.
 *
 * ## Por qué la decisión no crea una membresía de red
 *
 * Aprobar dice «sí, trabaja con nosotros»: es el sello que el médico ve. Sumarlo
 * a una red concreta (`network_provider_memberships`) exige elegir la red y el
 * nivel de participación, que es otra decisión y la toma otra persona; mezclar
 * las dos haría que aprobar un pedido publique al médico en una cartilla.
 */
@Injectable()
export class PractitionerInsurerRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param requests - Acceso a las solicitudes.
   * @param insurerContext - Resuelve la aseguradora de la sesión.
   * @param logger - Logger estructurado; nunca lleva nombres, sólo ids.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requests: PractitionerInsurerRequestsRepository,
    private readonly insurerContext: InsurerContextService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerInsurerRequestsService.name);
  }

  /**
   * Pide varias aseguradoras dentro de una transacción ya abierta.
   *
   * Lo usan el alta del profesional —en su misma transacción— y
   * `POST /practitioners/me/insurer-requests`. Es idempotente por par: lo
   * pendiente o aprobado no se toca, lo rechazado o retirado se reabre.
   *
   * @param tx - Transacción en curso.
   * @param input - Quién pide, a quiénes y quién escribe la fila.
   * @returns Lo creado o reabierto, y lo que ya estaba vivo.
   * @throws PreconditionFailedException si alguna aseguradora no existe o no está activa.
   */
  async requestWithin(
    tx: EntityManager,
    input: {
      practitionerProfileId: string;
      carrierIds: readonly string[];
      actorUserId: string;
    },
  ): Promise<InsurerRequestBatchResult> {
    const carrierIds = [...new Set(input.carrierIds)];
    if (carrierIds.length === 0) return { requested: [], alreadyLive: [] };

    const carriers = await this.requests.findCarriers(tx, carrierIds);
    const active = new Set(
      carriers
        .filter((c) => c.statusConceptId === INS.CARRIER_ACTIVE)
        .map((c) => c.id),
    );
    const unknown = carrierIds.filter((id) => !active.has(id));
    if (unknown.length > 0) {
      throw new PreconditionFailedException(
        'Alguna de las aseguradoras indicadas no existe o no está activa',
        { carrierIds: unknown },
      );
    }

    const requested: PractitionerInsurerRequests[] = [];
    const alreadyLive: PractitionerInsurerRequests[] = [];
    for (const carrierId of carrierIds) {
      const existing = await this.requests.findPair(
        tx,
        input.practitionerProfileId,
        carrierId,
      );
      if (existing && LIVE_STATES.includes(existing.statusConceptId)) {
        alreadyLive.push(existing);
        continue;
      }
      if (existing) {
        // Reabrir y no crear otra: el índice único es por par, y una segunda
        // fila borraría la historia de por qué la primera se rechazó.
        existing.statusConceptId = INS.PRACTITIONER_REQUEST_PENDING;
        existing.decisionReasonText = undefined;
        existing.decidedAt = undefined;
        existing.decidedByUserId = undefined;
        existing.createdAt = new Date();
        touch(existing, input.actorUserId);
        requested.push(existing);
        continue;
      }
      requested.push(
        this.requests.create(tx, {
          practitionerProfileId: input.practitionerProfileId,
          insuranceCarrierId: carrierId,
          statusConceptId: INS.PRACTITIONER_REQUEST_PENDING,
          actorUserId: input.actorUserId,
        }),
      );
    }
    await tx.flush();
    this.logger.info(
      {
        operation: 'insurance.practitioner-request.create',
        practitionerProfileId: input.practitionerProfileId,
        requested: requested.length,
        alreadyLive: alreadyLive.length,
      },
      'Practitioner insurer requests recorded',
    );
    return { requested, alreadyLive };
  }

  /**
   * `POST /practitioners/me/insurer-requests`: el médico pide desde su cuenta.
   *
   * @param carrierIds - Las aseguradoras.
   * @param actor - El médico.
   * @returns Todas sus solicitudes, ya con las nuevas.
   * @throws ConflictException si todas las pedidas ya estaban vivas: el envío no cambió nada.
   */
  async requestOwn(
    carrierIds: readonly string[],
    actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestPageDto> {
    const profileId = this.requirePractitioner(actor);
    const result = await this.em.transactional((tx) =>
      this.requestWithin(tx, {
        practitionerProfileId: profileId,
        carrierIds,
        actorUserId: actor.id,
      }),
    );
    if (result.requested.length === 0) {
      throw new ConflictException('Ya pidió trabajar con esas aseguradoras', {
        carrierIds: result.alreadyLive.map((r) => r.insuranceCarrierId),
      });
    }
    return this.listOwn(actor);
  }

  /**
   * Las solicitudes del médico de la sesión.
   *
   * @param actor - El médico.
   * @returns De la más reciente a la más vieja.
   */
  async listOwn(
    actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestPageDto> {
    const profileId = this.requirePractitioner(actor);
    const em = this.em.fork();
    const rows = await this.requests.listByPractitioner(em, profileId);
    const carriers = await this.carrierMap(
      em,
      rows.map((r) => r.insuranceCarrierId),
    );
    const items = rows.map((row) => this.toOwn(row, carriers));
    return { items, count: items.length };
  }

  /**
   * Retira una solicitud propia que sigue pendiente.
   *
   * Una aprobada no se «retira»: dejar de trabajar con una aseguradora es otra
   * cosa y la decide la relación con ella, no un botón.
   *
   * @param id - La solicitud.
   * @param actor - El médico.
   * @returns La solicitud ya retirada.
   */
  async withdrawOwn(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerInsurerRequestDto> {
    const profileId = this.requirePractitioner(actor);
    return this.em.transactional(async (tx) => {
      const row = await this.requests.findOwn(tx, id, profileId);
      if (!row) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }
      if (row.statusConceptId !== INS.PRACTITIONER_REQUEST_PENDING) {
        throw new PreconditionFailedException(
          'Sólo se puede retirar una solicitud pendiente',
          { id },
        );
      }
      row.statusConceptId = INS.PRACTITIONER_REQUEST_WITHDRAWN;
      touch(row, actor.id);
      await tx.flush();
      const carriers = await this.carrierMap(tx, [row.insuranceCarrierId]);
      return this.toOwn(row, carriers);
    });
  }

  /**
   * La bandeja de la aseguradora activa.
   *
   * @param actor - Quien la mira; tiene que poder administrar la aseguradora.
   * @returns Pendientes primero, por orden de llegada; después las decididas.
   */
  async listReceived(
    actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestPageDto> {
    const em = this.em.fork();
    const { carrierId } = await this.insurerContext.resolve(
      em,
      actor,
      ACCESS_DENIED,
    );
    const rows = await this.requests.listByCarrier(em, carrierId, INBOX_STATES);
    const cards = await this.requests.findPractitionerCards(em, [
      ...new Set(rows.map((r) => r.practitionerProfileId)),
    ]);
    const pending = rows.filter(
      (r) => r.statusConceptId === INS.PRACTITIONER_REQUEST_PENDING,
    );
    const decided = rows
      .filter((r) => r.statusConceptId !== INS.PRACTITIONER_REQUEST_PENDING)
      .sort(
        (a, b) => (b.decidedAt?.getTime() ?? 0) - (a.decidedAt?.getTime() ?? 0),
      );
    const items = [...pending, ...decided].map((row) =>
      this.toReceived(row, cards),
    );
    return { items, count: items.length };
  }

  /**
   * La aseguradora confirma que el médico trabaja con ella.
   *
   * @param id - La solicitud.
   * @param actor - Quien decide.
   * @returns La solicitud ya decidida.
   */
  approve(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestDto> {
    return this.decide(id, actor, INS.PRACTITIONER_REQUEST_APPROVED, undefined);
  }

  /**
   * La aseguradora dice que no, con motivo opcional que lee el médico.
   *
   * @param id - La solicitud.
   * @param reason - Por qué, si lo dice.
   * @param actor - Quien decide.
   * @returns La solicitud ya decidida.
   */
  reject(
    id: string,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<ReceivedPractitionerInsurerRequestDto> {
    const motivo = reason?.trim();
    return this.decide(
      id,
      actor,
      INS.PRACTITIONER_REQUEST_REJECTED,
      motivo === '' ? undefined : motivo,
    );
  }

  private async decide(
    id: string,
    actor: AuthenticatedUser,
    statusConceptId: string,
    reason: string | undefined,
  ): Promise<ReceivedPractitionerInsurerRequestDto> {
    return this.em.transactional(async (tx) => {
      const { carrierId } = await this.insurerContext.resolve(
        tx,
        actor,
        ACCESS_DENIED,
      );
      // Acotada por la compañía en la consulta: el id de la solicitud de otra
      // aseguradora responde 404, igual que uno inexistente.
      const row = await this.requests.findForCarrier(tx, id, carrierId);
      if (!row) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }
      if (row.statusConceptId !== INS.PRACTITIONER_REQUEST_PENDING) {
        throw new PreconditionFailedException(
          'La solicitud ya fue decidida o retirada',
          { id },
        );
      }
      const now = new Date();
      row.statusConceptId = statusConceptId;
      row.decisionReasonText = reason;
      row.decidedAt = now;
      row.decidedByUserId = actor.id;
      touch(row, actor.id, now);
      await tx.flush();
      this.logger.info(
        {
          operation: 'insurance.practitioner-request.decide',
          requestId: row.id,
          carrierId,
          status: STATUS_BY_CONCEPT.get(statusConceptId),
        },
        'Practitioner insurer request decided',
      );
      const cards = await this.requests.findPractitionerCards(tx, [
        row.practitionerProfileId,
      ]);
      return this.toReceived(row, cards);
    });
  }

  private requirePractitioner(actor: AuthenticatedUser): string {
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    return actor.practitionerProfileId;
  }

  private async carrierMap(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, InsuranceCarriers>> {
    const carriers = await this.requests.findCarriers(em, [...new Set(ids)]);
    return new Map(carriers.map((c) => [c.id, c]));
  }

  private toOwn(
    row: PractitionerInsurerRequests,
    carriers: Map<string, InsuranceCarriers>,
  ): PractitionerInsurerRequestDto {
    const carrier = carriers.get(row.insuranceCarrierId);
    return {
      id: row.id,
      carrierId: row.insuranceCarrierId,
      carrierName: carrier?.sigla?.trim() || carrier?.legalName || '',
      status: STATUS_BY_CONCEPT.get(row.statusConceptId) ?? 'PENDING',
      decisionReasonText: row.decisionReasonText ?? null,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt ?? null,
    };
  }

  private toReceived(
    row: PractitionerInsurerRequests,
    cards: Map<
      string,
      { displayName: string | null; professionalTitle: string | null }
    >,
  ): ReceivedPractitionerInsurerRequestDto {
    const card = cards.get(row.practitionerProfileId);
    return {
      id: row.id,
      practitionerProfileId: row.practitionerProfileId,
      practitionerName: card?.displayName ?? null,
      professionalTitle: card?.professionalTitle ?? null,
      status: STATUS_BY_CONCEPT.get(row.statusConceptId) ?? 'PENDING',
      decisionReasonText: row.decisionReasonText ?? null,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt ?? null,
    };
  }
}
