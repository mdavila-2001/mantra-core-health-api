import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import { OpsErrorReason } from '../../../practice/practice-ops.error-reasons';
import { OutboxService } from '../../../messaging/services/outbox.service';
import { FUNCTIONS } from '../../../practice/infrastructure-catalog';
import { PRAC } from '../../../practice/practice.concepts';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import type { SpaceOpsRow } from '../../../practice/services/ops-rows';
import { OpsStateService } from '../../../practice/services/ops-state';
import {
  AGENDA_SPACE_FUNCTIONS,
  findSpaceBandClash,
  type WeekBand,
} from '../../domain/catalog/care-space-agenda';
import { SchedulingErrorReason } from '../../scheduling.error-reasons';
import { TEMPLATE_CARE_SPACE_SET_EVENT } from '../../domain/catalog/agenda-events';
import type { SchedulableResources } from '../../entities';
import { SchedulingCatalogRepository } from '../repositories';
import type {
  CareSpaceTemplateGuardPort,
  TemplateCareSpaceSetEvent,
  TemplateSpaceProposal,
} from '../../application/ports/care-space-template-guard.port';

/**
 * Reglas de una plantilla que declara su horario en un espacio (F5d):
 *
 * - el recurso es de la organización del contexto (404 uniforme si no);
 * - el espacio también (404 uniforme: el inexistente y el ajeno no se distinguen);
 * - quién lo ata: administrador de la organización o de la sucursal, o quien coordina
 *   agendas del tenant (`SCHEDULING_ADMIN`); un profesional no reserva consultorios para sí;
 * - la función admite horario propio (422 `TEMPLATE_CARE_SPACE_INVALID_FUNCTION`) y el espacio
 *   está activo (422 `SPACE_NOT_ACTIVE`);
 * - es de la misma práctica que el recurso y, si el recurso ya está atado a una sala
 *   (ROOM o equipo), es esa misma sala (422 `TEMPLATE_CARE_SPACE_SITE_MISMATCH`);
 * - ninguna otra plantilla publicada ocupa el mismo espacio a la misma hora (422
 *   `TEMPLATE_RULE_OVERLAP_CARE_SPACE`). La base no puede expresar este solape (las franjas no
 *   llevan espacio ni vigencia), así que la API lo serializa con un candado por espacio: dos
 *   publicaciones simultáneas sobre el mismo consultorio no pasan las dos.
 *
 * La doble reserva real de una cita la impide, además, el `EXCLUDE` de `clinical.appointments`.
 */
@Injectable()
export class PracticeCareSpaceTemplateGuardAdapter implements CareSpaceTemplateGuardPort {
  /**
   * @param state - Lectura del estado y la fila de un espacio (tenant del contexto).
   * @param infra - Evaluador de la política de infraestructura.
   * @param catalogRepo - Repositorio del catálogo de agenda.
   * @param outbox - Outbox transaccional.
   */
  constructor(
    private readonly state: OpsStateService,
    private readonly infra: InfrastructureAccessService,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * El recurso es del tenant del contexto. Sin tenant en el contexto (un operador de plataforma
   * que no indicó `X-Tenant-Id`) no hay contra qué comparar y no se exige.
   *
   * @throws ResourceNotFoundException (404 `SCHEDULING_RESOURCE_NOT_AVAILABLE`).
   */
  assertResourceInActiveTenant(resource: { tenantId: string }): void {
    const active = getCurrentTenantId();
    if (active !== undefined && resource.tenantId !== active) {
      throw new ResourceNotFoundException(
        'Recurso no encontrado',
        undefined,
        SchedulingErrorReason.RESOURCE_NOT_AVAILABLE,
      );
    }
  }

  /**
   * Quién puede tocar el horario de un espacio: el recurso es del tenant del contexto (404
   * uniforme), el espacio también (404 uniforme: el inexistente y el ajeno no se distinguen) y
   * el actor es `SCHEDULING_ADMIN` de ese tenant o tiene `infra.agenda.assign` sobre el espacio
   * (administrador de la organización o de la sucursal; 403 si ve el espacio y no puede).
   *
   * Es la MISMA autorización para atar, cambiar, soltar o editar el horario de una plantilla
   * que ya ocupa un espacio: quien edita franjas, vigencia o estado de un horario en un
   * consultorio ajeno lo mueve o lo recorta igual que quien lo ata.
   *
   * @param alreadyBound - El horario YA está en ese espacio (el actor lo conoce: su propio
   *   horario lo nombra). Sin alcance sobre él la respuesta es 403 y no el 404 de la política,
   *   que sólo protege a quien nombra un id que no es suyo.
   * @returns La fila del espacio.
   */
  async assertMayManageSpace(
    tx: EntityManager,
    resource: Pick<SchedulableResources, 'tenantId'>,
    careSpaceId: string,
    actor: AuthenticatedUser,
    alreadyBound = false,
  ): Promise<SpaceOpsRow> {
    const tenantId = requireTenantId();
    this.assertResourceInActiveTenant(resource);
    const space = await this.state.loadSpace(tx, tenantId, careSpaceId);
    if (!roleAuthorizesInTenant(actor, 'SCHEDULING_ADMIN', tenantId)) {
      try {
        await this.infra.assertCan(
          actor,
          'infra.agenda.assign',
          { careSpaceId },
          tx,
        );
      } catch (error) {
        if (alreadyBound && error instanceof ResourceNotFoundException) {
          throw new InsufficientRoleException(
            'El horario ocupa un espacio que usted no administra',
            { action: 'infra.agenda.assign' },
            OpsErrorReason.INFRA_ACTION_NOT_ALLOWED,
          );
        }
        throw error;
      }
    }
    return space;
  }

  /**
   * Exige {@link assertMayManageSpace} sobre cada espacio que el horario tiene o va a tener
   * (el actual y el nuevo, sin repetir). Los ausentes no cuentan. Va antes de escribir nada y
   * antes de comprobar el solape.
   */
  async assertMayManageBound(
    tx: EntityManager,
    resource: Pick<SchedulableResources, 'tenantId'>,
    careSpaceIds: readonly (string | null | undefined)[],
    actor: AuthenticatedUser,
  ): Promise<void> {
    const distinct = [
      ...new Set(careSpaceIds.filter((id): id is string => !!id)),
    ];
    for (const careSpaceId of distinct) {
      await this.assertMayManageSpace(tx, resource, careSpaceId, actor, true);
    }
  }

  /**
   * Valida y autoriza atar la plantilla de `resource` al espacio `careSpaceId`.
   *
   * @returns La fila del espacio, ya validada.
   */
  async attach(
    tx: EntityManager,
    resource: SchedulableResources,
    careSpaceId: string,
    actor: AuthenticatedUser,
  ): Promise<SpaceOpsRow> {
    const tenantId = requireTenantId();
    const space = await this.assertMayManageSpace(
      tx,
      resource,
      careSpaceId,
      actor,
    );

    const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId)?.code;
    if (!fn || !AGENDA_SPACE_FUNCTIONS.includes(fn)) {
      throw new PreconditionFailedException(
        'La función del espacio no admite horario propio',
        { careSpaceId, function: fn ?? null },
        SchedulingErrorReason.TEMPLATE_CARE_SPACE_INVALID_FUNCTION,
      );
    }
    if (space.statusConceptId !== PRAC.SPACE_ACTIVE) {
      throw new PreconditionFailedException(
        'Sólo un espacio activo puede tener horario',
        { careSpaceId },
        SchedulingErrorReason.SPACE_NOT_ACTIVE,
      );
    }
    await this.assertSameSite(tx, tenantId, resource, space);
    return space;
  }

  /**
   * Ninguna otra plantilla publicada ocupa el espacio a la misma hora.
   *
   * @throws PreconditionFailedException (422 `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
   */
  async assertNoOverlap(
    tx: EntityManager,
    proposal: TemplateSpaceProposal,
    now: Date = new Date(),
  ): Promise<void> {
    const tenantId = requireTenantId();
    // Serializa las publicaciones sobre el mismo espacio hasta el fin de la transacción.
    await tx.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `care-space-agenda:${proposal.careSpaceId}`,
    ]);
    const others = await this.catalogRepo.findPublishedTemplatesOfCareSpace(
      tx,
      tenantId,
      proposal.careSpaceId,
      CONCEPTS.TEMPLATE_PUBLISHED,
      proposal.templateId,
    );
    const mine = {
      validFrom: proposal.validFrom,
      validTo: proposal.validTo,
      timeZone: proposal.resource.timeZone ?? 'UTC',
      bands: proposal.bands,
    };
    for (const other of others) {
      const clash = findSpaceBandClash(
        mine,
        {
          validFrom: other.template.validFrom,
          validTo: other.template.validTo,
          timeZone: other.resource?.timeZone ?? 'UTC',
          bands: other.rules,
        },
        now,
      );
      if (clash) {
        throw new PreconditionFailedException(
          `El consultorio ya está ocupado ese horario por «${other.resource?.name ?? 'otra agenda'}» ` +
            `(${clash.other}), que se cruza con ${clash.mine}. Elija otro horario u otro consultorio.`,
          {
            careSpaceId: proposal.careSpaceId,
            existingTemplateId: other.template.id,
            nueva: clash.mine,
            existente: clash.other,
          },
          SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
        );
      }
    }
  }

  /**
   * Una plantilla retirada vuelve a publicarse: si declara un espacio, éste sigue activo y
   * nadie lo ocupó mientras tanto. No exige el permiso de atar (no reserva nada nuevo: el
   * horario ya era suyo), pero sí vuelve a comprobar el solape.
   *
   * @throws PreconditionFailedException (`SPACE_NOT_ACTIVE`, `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
   */
  async assertReactivable(
    tx: EntityManager,
    resource: SchedulableResources,
    template: {
      id: string;
      careSpaceId?: string | null;
      validFrom?: Date | null;
      validTo?: Date | null;
    },
    bands: readonly WeekBand[],
  ): Promise<void> {
    this.assertResourceInActiveTenant(resource);
    if (!template.careSpaceId) return;
    const tenantId = requireTenantId();
    const space = await this.state.loadSpace(
      tx,
      tenantId,
      template.careSpaceId,
    );
    if (space.statusConceptId !== PRAC.SPACE_ACTIVE) {
      throw new PreconditionFailedException(
        'El espacio de este horario ya no está activo',
        { careSpaceId: space.id },
        SchedulingErrorReason.SPACE_NOT_ACTIVE,
      );
    }
    await this.assertNoOverlap(tx, {
      resource,
      careSpaceId: space.id,
      templateId: template.id,
      validFrom: template.validFrom,
      validTo: template.validTo,
      bands,
    });
  }

  /**
   * Publica `scheduling.template.care_space_set` (el espacio se ató, cambió o se soltó).
   */
  async announce(
    tx: EntityManager,
    event: TemplateCareSpaceSetEvent,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: TEMPLATE_CARE_SPACE_SET_EVENT,
      aggregateType: 'schedule_template',
      aggregateId: event.templateId,
      payloadJson: {
        templateId: event.templateId,
        resourceId: event.resourceId,
        careSpaceId: event.careSpaceId,
        previousCareSpaceId: event.previousCareSpaceId,
        siteId: event.siteId,
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        // La clave de idempotencia del outbox se deriva del contenido: sin la hora, atar, soltar
        // y volver a atar el mismo espacio daría un hecho «duplicado» y el tercero no se publicaría.
        occurredAt: new Date().toISOString(),
      },
      actorUserId: event.actorUserId,
    });
  }

  /** Misma práctica que el recurso y, si el recurso ya está atado a una sala, la misma sala. */
  private async assertSameSite(
    tx: EntityManager,
    tenantId: string,
    resource: SchedulableResources,
    space: SpaceOpsRow,
  ): Promise<void> {
    const mismatch = (reason: string): never => {
      throw new PreconditionFailedException(
        'El espacio no corresponde al lugar de esta agenda',
        { careSpaceId: space.id, reason },
        SchedulingErrorReason.TEMPLATE_CARE_SPACE_SITE_MISMATCH,
      );
    };
    if (resource.careSpaceId && resource.careSpaceId !== space.id) {
      mismatch('RESOURCE_BOUND_TO_OTHER_SPACE');
    }
    if (resource.resourceRefType === 'diagnostic_equipment') {
      const rows = await tx.execute<{ care_space_id: string | null }[]>(
        `select e.care_space_id
           from diagnostic_units.diagnostic_equipment e
           join diagnostic_units.diagnostic_unit_sites s on s.id = e.diagnostic_unit_site_id
           join diagnostic_units.diagnostic_units u on u.id = s.diagnostic_unit_id
          where e.id = ? and u.tenant_id = ?`,
        [resource.resourceRefId, tenantId],
      );
      if (rows[0]?.care_space_id !== space.id) {
        mismatch('EQUIPMENT_IN_OTHER_SPACE');
      }
    }
    if (resource.practiceId) {
      const sites = await tx.execute<{ practice_id: string }[]>(
        `select practice_id from practice.practice_sites where id = ? and tenant_id = ?`,
        [space.practiceSiteId, tenantId],
      );
      if (sites[0]?.practice_id !== resource.practiceId) {
        mismatch('PRACTICE_MISMATCH');
      }
    }
  }
}
