import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../../../common';
import { CLIN } from '../../../../clinical/clinical.concepts';
import {
  FUNCTIONS,
  FUNCTION_PROFILES,
  type FunctionCode,
} from '../../../../practice/infrastructure-catalog';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../../../practice/services/care-space-ops.port';
import { InfrastructureAccessService } from '../../../../practice/services/infrastructure-access.service';
import { OpsStateService } from '../../../../practice/services/ops-state';
import {
  bandContaining,
  type TemplateBand,
} from '../../../domain/catalog/care-space-agenda';
import {
  AGENDA_OPERATOR_ROLES,
  operatesAnyAgenda,
} from '../../../domain/booking/agenda-actors';
import { EQUIPMENT_REF_TYPE } from '../../../domain/catalog/catalog-concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import type { SchedulableResources } from '../../../entities';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Roles que coordinan las agendas de todo el tenant: no necesitan alcance por espacio. */
const COORDINATOR_ROLES: readonly string[] = ['SCHEDULING_ADMIN', 'SUPERADMIN'];

/** Qué se sabe del turno cuando hay que decidir en qué espacio ocurre. */
export interface AppointmentSpaceRequest {
  /** El recurso del cupo (su tenant ya se comprobó contra el contexto). */
  readonly resource: SchedulableResources;
  /** La plantilla de la que nació el cupo, si nació de una. */
  readonly scheduleTemplateId?: string | null;
  /** El consultorio que pidió quien agenda (cita puntual o mostrador). */
  readonly requestedCareSpaceId?: string | null;
  readonly startAt: Date;
  readonly endAt: Date;
  /**
   * El tenant que declaró quien reserva, cuando el cuerpo lo trae. Tiene que ser el del
   * recurso: una cita no apunta al consultorio de otra organización (404 uniforme).
   */
  readonly bookingTenantId?: string;
  /** La cita que se mueve o se acepta: no se compara consigo misma. */
  readonly exceptAppointmentId?: string | null;
  /**
   * `true` cuando la cita queda comprometida (reservada o aceptada) y por tanto ocupa el
   * espacio; una solicitud pendiente todavía no lo ocupa y no se compara con las demás.
   */
  readonly commits: boolean;
  /** Cita sin plantilla: el espacio sale de la franja publicada que contiene el inicio. */
  readonly inferFromBands?: boolean;
  readonly actor: AuthenticatedUser;
}

/**
 * Decide en qué espacio ocurre una cita y comprueba que se pueda reservar ahí (F5d):
 *
 * 1. **De dónde sale el espacio**, en este orden: el que ya tiene el recurso (una sala), el del
 *    equipo (un estudio de imagen ocurre en la sala del equipo), el de la plantilla del cupo, o
 *    —en una cita puntual, que no tiene plantilla— el de la franja publicada que contiene el
 *    inicio. Quien agenda puede nombrar el consultorio; si la agenda ya lo fija y es otro, 422
 *    `APPOINTMENT_CARE_SPACE_MISMATCH`. Nombrar un consultorio que la agenda no fija es cosa de
 *    quien opera agendas ajenas, no de un profesional sobre la suya.
 * 2. **Las salas que admiten solapes** (espera, gimnasio) no reciben espacio: la API no lo
 *    escribe y el `EXCLUDE` no cambia las reglas de los recursos con capacidad > 1.
 * 3. **El espacio es del tenant del recurso** (404 uniforme) y admite agenda (422).
 * 4. **Se bloquea la fila del espacio `FOR SHARE`** durante la reserva: un bloqueo de F2 (que
 *    toma `FOR UPDATE`) se serializa con las reservas en curso, así que o la reserva ve el
 *    bloqueo, o el bloqueo ve la reserva en su lista de compromisos.
 * 5. **`assertBookable` de F2**: ciclo de vida, bloqueos y mantenimiento (422
 *    `SPACE_NOT_BOOKABLE`).
 * 6. **Solape**: otra cita reservada o en curso en el mismo espacio y rato → 409
 *    `CARE_SPACE_DOUBLE_BOOKED` con el primer momento libre. La base lo vuelve a impedir con
 *    `ex_appointments_care_space_time` si dos reservas llegan a la vez.
 *
 * @returns El espacio a escribir en `appointments.care_space_id`, o `null` si la cita no lo lleva.
 */
@Injectable()
export class CareSpaceAppointmentResolver {
  /**
   * @param state - Lectura de la fila de un espacio.
   * @param ops - Puerto de F2: ¿se puede reservar el espacio en la ventana?
   * @param catalogRepo - Repositorio del catálogo de agenda.
   * @param infra - Evaluador de la política de infraestructura (alcance sobre el espacio).
   */
  constructor(
    private readonly state: OpsStateService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly infra: InfrastructureAccessService,
  ) {}

  /** @see {@link CareSpaceAppointmentResolver} */
  async resolve(
    tx: EntityManager,
    request: AppointmentSpaceRequest,
  ): Promise<string | null> {
    const derived = await this.derive(tx, request);
    const requested = request.requestedCareSpaceId ?? null;
    let spaceId = derived;
    if (requested) {
      if (derived && derived !== requested) {
        throw new PreconditionFailedException(
          'La agenda se atiende en otro consultorio',
          { reason: 'AGENDA_BOUND_TO_OTHER_SPACE' },
          SchedulingErrorReason.APPOINTMENT_CARE_SPACE_MISMATCH,
        );
      }
      if (!derived) {
        await this.assertMayChooseSpace(tx, request, requested);
        spaceId = requested;
      }
    }
    if (!spaceId) return null;

    const tenantId = request.resource.tenantId;
    if (
      request.bookingTenantId !== undefined &&
      request.bookingTenantId !== tenantId
    ) {
      throw new ResourceNotFoundException(
        'Recurso no encontrado',
        undefined,
        SchedulingErrorReason.RESOURCE_NOT_AVAILABLE,
      );
    }
    // 404 uniforme: el espacio inexistente y el de otra organización no se distinguen.
    const space = await this.state.loadSpace(tx, tenantId, spaceId);
    const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId)?.code as
      FunctionCode | undefined;
    const profile = fn ? FUNCTION_PROFILES[fn] : undefined;
    if (profile?.allowOverlap) return null;
    if (!profile?.schedulable) {
      throw new PreconditionFailedException(
        'El espacio no admite agenda',
        { careSpaceId: spaceId },
        SchedulingErrorReason.SPACE_NOT_SCHEDULABLE,
      );
    }

    await tx.execute(
      `select 1 from practice.care_spaces where id = ? and tenant_id = ? for share`,
      [spaceId, tenantId],
    );
    await this.ops.assertBookable(tx, spaceId, {
      start: request.startAt,
      end: request.endAt,
    });
    if (request.commits) await this.assertFree(tx, tenantId, spaceId, request);
    return spaceId;
  }

  /**
   * Quién puede nombrar el consultorio de una cita cuando la agenda no lo fija.
   *
   * - un rol de agenda (`SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `SUPERADMIN`) **del tenant del
   *   recurso**: quien lo tiene sólo en otra organización responde 404 uniforme (no se confirma
   *   nada de lo que no es suyo) y quien no tiene ninguno, 403;
   * - el espacio es del tenant del recurso (404 uniforme si no);
   * - quien **coordina** agendas del tenant (`SCHEDULING_ADMIN`, `SUPERADMIN`) las ve todas, igual
   *   que al atar un horario; quien atiende el mostrador (`SCHEDULING_AGENT`) necesita además
   *   alcance sobre ese espacio (`infra.agenda.book`: ADMISSION de la sede o del espacio, o
   *   administración): sin alcance es el 404 de la política y, si lo ve pero su rol no alcanza,
   *   403.
   */
  private async assertMayChooseSpace(
    tx: EntityManager,
    request: AppointmentSpaceRequest,
    careSpaceId: string,
  ): Promise<void> {
    const tenantId = request.resource.tenantId;
    const { actor } = request;
    const operatesHere = AGENDA_OPERATOR_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (!operatesHere) {
      if (operatesAnyAgenda(actor)) {
        throw new ResourceNotFoundException(
          'Recurso no encontrado',
          undefined,
          SchedulingErrorReason.RESOURCE_NOT_AVAILABLE,
        );
      }
      throw new ForbiddenException(
        'Sólo quien administra agendas elige el consultorio de una cita puntual.',
      );
    }
    // El espacio ajeno o inexistente es 404 antes de evaluar el alcance.
    await this.state.loadSpace(tx, tenantId, careSpaceId);
    const coordinates = COORDINATOR_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (!coordinates) {
      await this.infra.assertCan(
        actor,
        'infra.agenda.book',
        { careSpaceId },
        tx,
      );
    }
  }

  /**
   * ¿Se puede retener este cupo? Lo mismo que al reservar, sin comprometer el espacio: el
   * espacio del cupo tiene que estar activo y sin bloqueo en su horario. Un cupo que no es de
   * ningún espacio no cambia.
   *
   * @throws PreconditionFailedException (422 `SPACE_NOT_BOOKABLE`).
   */
  async assertSlotHoldable(
    tx: EntityManager,
    slot: {
      resourceId: string;
      scheduleTemplateId?: string | null;
      startAt: Date;
      endAt?: Date | null;
    },
    actor: AuthenticatedUser,
  ): Promise<void> {
    const resource = await this.catalogRepo.findResourceById(
      tx,
      slot.resourceId,
    );
    if (!resource) return;
    await this.resolve(tx, {
      resource,
      scheduleTemplateId: slot.scheduleTemplateId,
      startAt: slot.startAt,
      endAt: slot.endAt ?? slot.startAt,
      commits: false,
      actor,
    });
  }

  /** El espacio que fija la agenda, sin pedirle nada a quien agenda. */
  private async derive(
    tx: EntityManager,
    request: AppointmentSpaceRequest,
  ): Promise<string | null> {
    const { resource } = request;
    if (resource.careSpaceId) return resource.careSpaceId;
    if (resource.resourceRefType === EQUIPMENT_REF_TYPE) {
      const rows = await tx.execute<{ care_space_id: string | null }[]>(
        `select care_space_id from diagnostic_units.diagnostic_equipment where id = ?`,
        [resource.resourceRefId],
      );
      if (rows[0]?.care_space_id) return rows[0].care_space_id;
    }
    if (request.scheduleTemplateId) {
      const template = await this.catalogRepo.findTemplateById(
        tx,
        request.scheduleTemplateId,
      );
      if (template?.careSpaceId) return template.careSpaceId;
      return null;
    }
    if (request.inferFromBands) {
      const templates = (
        await this.catalogRepo.findTemplatesByResource(tx, resource.id)
      ).filter(
        (template) =>
          template.statusConceptId === CONCEPTS.TEMPLATE_PUBLISHED &&
          template.careSpaceId,
      );
      if (templates.length === 0) return null;
      const byId = new Map(
        templates.map((template) => [template.id, template]),
      );
      const rules = await this.catalogRepo.findRulesByTemplates(tx, [
        ...byId.keys(),
      ]);
      const bands: TemplateBand[] = rules.flatMap((rule) => {
        const template = byId.get(rule.scheduleTemplateId);
        if (!template) return [];
        return [
          {
            templateId: template.id,
            careSpaceId: template.careSpaceId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            validFrom: template.validFrom ?? null,
            validTo: template.validTo ?? null,
          },
        ];
      });
      return (
        bandContaining(request.startAt, bands, resource.timeZone ?? 'UTC')
          ?.careSpaceId ?? null
      );
    }
    return null;
  }

  /** Otra cita comprometida en el mismo espacio y rato → 409 con el primer momento libre. */
  private async assertFree(
    tx: EntityManager,
    tenantId: string,
    spaceId: string,
    request: AppointmentSpaceRequest,
  ): Promise<void> {
    const rows = await tx.execute<{ end_at: Date }[]>(
      `select a.end_at from clinical.appointments a
        where a.tenant_id = ? and a.care_space_id = ? and a.end_at is not null
          and a.status_concept_id in (?, ?)
          and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(?, ?, '[)')
          and (?::uuid is null or a.id <> ?::uuid)
        order by a.end_at desc limit 1`,
      [
        tenantId,
        spaceId,
        CLIN.APPOINTMENT_BOOKED,
        CLIN.APPOINTMENT_CHECKED_IN,
        request.startAt,
        request.endAt,
        request.exceptAppointmentId ?? null,
        request.exceptAppointmentId ?? null,
      ],
    );
    if (rows.length === 0) return;
    throw new ConflictException(
      'El consultorio ya tiene una cita en ese horario',
      {
        careSpaceId: spaceId,
        nextAvailableAt: new Date(rows[0].end_at).toISOString(),
      },
      SchedulingErrorReason.CARE_SPACE_DOUBLE_BOOKED,
    );
  }
}
