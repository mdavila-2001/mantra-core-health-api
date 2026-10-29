import type { AuthenticatedUser } from '../../../../common';
import type { WeekBand } from '../../domain/catalog/care-space-agenda';
import type { SchedulableResources } from '../../entities';
import type { UnitOfWork } from './unit-of-work';

/** Lo que de un espacio hace falta para escribir un horario en él. */
export interface AgendaCareSpace {
  readonly id: string;
  readonly practiceSiteId: string;
}

/** Lo que de una plantilla nueva o editada hace falta para saber si pisa a otra. */
export interface TemplateSpaceProposal {
  readonly resource: Pick<SchedulableResources, 'timeZone' | 'id'>;
  readonly careSpaceId: string;
  /** Plantilla que se edita (no se compara consigo misma). */
  readonly templateId?: string;
  readonly validFrom?: Date | null;
  readonly validTo?: Date | null;
  readonly bands: readonly WeekBand[];
}

/** El hecho de que el espacio de una plantilla se ató, cambió o se soltó. */
export interface TemplateCareSpaceSetEvent {
  tenantId: string;
  templateId: string;
  resourceId: string;
  careSpaceId: string | null;
  previousCareSpaceId: string | null;
  siteId: string | null;
  actorUserId: string;
}

/**
 * Reglas de una plantilla que declara su horario en un espacio (F5d):
 *
 * - el recurso es de la organización del contexto (404 uniforme si no);
 * - el espacio también (404 uniforme: el inexistente y el ajeno no se distinguen);
 * - quién lo ata: administrador de la organización o de la sucursal, o quien coordina
 *   agendas del tenant (`SCHEDULING_ADMIN`); un profesional no reserva consultorios para sí;
 * - la función admite horario propio y el espacio está activo (422);
 * - es de la misma práctica que el recurso y, si el recurso ya está atado a una sala, es esa
 *   misma sala (422 `TEMPLATE_CARE_SPACE_SITE_MISMATCH`);
 * - ninguna otra plantilla publicada ocupa el mismo espacio a la misma hora (422
 *   `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
 *
 * Todo caso de uso que escribe plantillas, franjas, excepciones o turnos pasa por este puerto
 * antes de escribir (`care-space-guard.architecture.spec.ts` lo hace cumplir).
 */
export interface CareSpaceTemplateGuardPort {
  /**
   * El recurso es del tenant del contexto. Sin tenant en el contexto no hay contra qué
   * comparar y no se exige.
   *
   * @throws ResourceNotFoundException (404 `SCHEDULING_RESOURCE_NOT_AVAILABLE`).
   */
  assertResourceInActiveTenant(resource: { tenantId: string }): void;

  /**
   * Quién puede tocar el horario de un espacio (`SCHEDULING_ADMIN` del tenant o
   * `infra.agenda.assign` sobre el espacio).
   *
   * @param alreadyBound - El horario YA está en ese espacio: sin alcance la respuesta es 403
   *   y no el 404 de la política.
   */
  assertMayManageSpace(
    tx: UnitOfWork,
    resource: Pick<SchedulableResources, 'tenantId'>,
    careSpaceId: string,
    actor: AuthenticatedUser,
    alreadyBound?: boolean,
  ): Promise<AgendaCareSpace>;

  /**
   * Exige {@link CareSpaceTemplateGuardPort.assertMayManageSpace} sobre cada espacio que el
   * horario tiene o va a tener (el actual y el nuevo, sin repetir). Los ausentes no cuentan.
   * Va antes de escribir nada y antes de comprobar el solape.
   */
  assertMayManageBound(
    tx: UnitOfWork,
    resource: Pick<SchedulableResources, 'tenantId'>,
    careSpaceIds: readonly (string | null | undefined)[],
    actor: AuthenticatedUser,
  ): Promise<void>;

  /** Valida y autoriza atar la plantilla de `resource` al espacio `careSpaceId`. */
  attach(
    tx: UnitOfWork,
    resource: SchedulableResources,
    careSpaceId: string,
    actor: AuthenticatedUser,
  ): Promise<AgendaCareSpace>;

  /**
   * Ninguna otra plantilla publicada ocupa el espacio a la misma hora.
   *
   * @throws PreconditionFailedException (422 `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
   */
  assertNoOverlap(
    tx: UnitOfWork,
    proposal: TemplateSpaceProposal,
    now?: Date,
  ): Promise<void>;

  /**
   * Una plantilla retirada vuelve a publicarse: si declara un espacio, éste sigue activo y
   * nadie lo ocupó mientras tanto.
   *
   * @throws PreconditionFailedException (`SPACE_NOT_ACTIVE`, `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
   */
  assertReactivable(
    tx: UnitOfWork,
    resource: SchedulableResources,
    template: {
      id: string;
      careSpaceId?: string | null;
      validFrom?: Date | null;
      validTo?: Date | null;
    },
    bands: readonly WeekBand[],
  ): Promise<void>;

  /** Publica `scheduling.template.care_space_set` en la misma transacción. */
  announce(tx: UnitOfWork, event: TemplateCareSpaceSetEvent): Promise<void>;
}

/** Token de inyección de la guardia de espacio de las plantillas. */
export const CARE_SPACE_TEMPLATE_GUARD_PORT = Symbol(
  'CARE_SPACE_TEMPLATE_GUARD_PORT',
);
