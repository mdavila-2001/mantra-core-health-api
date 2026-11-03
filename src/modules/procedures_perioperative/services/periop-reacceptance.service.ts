import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch, type AuthenticatedUser } from '../../../common';
import { OutboxService } from '../../messaging/services';
import type { ProcedureCases } from '../entities';
import { PeriopCasesRepository } from '../repositories';

/**
 * Los cambios que obligan al equipo a volver a aceptar (DOC-MOD-005,
 * DOC-DOC-010, API#840). Es el vocabulario de `changedFields` del evento
 * `periop.case.reacceptance_required` y del motivo en la historia de estados.
 *
 * Los tres primeros son los de siempre (`PATCH /procedure-cases/:id`). Los demás
 * entran por los otros endpoints del módulo:
 *
 * - `teamComposition`: se asigna otro integrante al equipo.
 * - `teamRole`: un profesional que ya estaba toma otro rol en el mismo caso.
 * - `identifiedRisks`: se registra la valoración preoperatoria, que es donde el
 *   módulo guarda los riesgos identificados (ASA y puntuaciones de riesgo).
 *
 * El procedimiento, la ubicación (quirófano o sede) y la documentación que
 * altera responsabilidades no tienen hoy un endpoint que los modifique después
 * de programar el caso: cuando lo tengan, su cambio llama a este mismo servicio.
 */
export type RelevantChange =
  | 'scheduledStartAt'
  | 'scheduledEndAt'
  | 'patientProfileId'
  | 'teamComposition'
  | 'teamRole'
  | 'identifiedRisks';

/** Estados del caso anteriores a su ejecución: aún se puede aceptar de nuevo. */
const PRE_EXECUTION_STATES: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
];

/**
 * Invalida las aceptaciones del equipo cuando la intervención cambia en algo
 * relevante.
 *
 * ## Qué hace
 *
 * Una aceptación vale para **lo que se aceptó**: nadie aceptó operar otro día,
 * con otro equipo ni con riesgos que todavía no se habían identificado. Ante un
 * cambio relevante, cada integrante que había aceptado vuelve a `TEAM_ASSIGNED`
 * y pierde su `accepted_at`; el caso listo para operar vuelve a
 * `CASE_SCHEDULED` —el modelo no tiene un estado propio de «pendiente de
 * aceptación del equipo»— con el motivo en la historia, y el equipo recibe el
 * aviso por el outbox, que se confirma con la misma transacción que hizo el
 * cambio.
 *
 * ## Qué no hace
 *
 * No guarda **qué versión** aceptó cada integrante: la invalidación borra la
 * aceptación en vez de compararla con una versión del caso. Esa trazabilidad
 * (`accepted_version_number`, `procedure_cases.version_number`) es trabajo de
 * modelo (`mantra-core-health-model#57`) y las columnas no existen en el DDL de
 * esta API.
 */
@Injectable()
export class PeriopReacceptanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param casesRepo - Equipo e historia de estados del caso.
   * @param outbox - Aviso transaccional al equipo.
   */
  constructor(
    private readonly casesRepo: PeriopCasesRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Aplica la invalidación sin condiciones sobre el estado del caso.
   *
   * Es lo que hace `PATCH /procedure-cases/:id` desde antes de este servicio:
   * el aviso sale aunque nadie hubiera aceptado todavía.
   *
   * @param tx - Transacción activa, que ya tiene el caso bloqueado.
   * @param surgicalCase - Caso modificado.
   * @param changedFields - Qué cambió.
   * @param actor - Quien modificó.
   * @returns Cuántas aceptaciones quedaron sin efecto.
   */
  async invalidate(
    tx: EntityManager,
    surgicalCase: ProcedureCases,
    changedFields: readonly RelevantChange[],
    actor: AuthenticatedUser,
  ): Promise<number> {
    const team = await this.casesRepo.findTeamByCase(tx, surgicalCase.id);
    let acceptancesInvalidated = 0;
    for (const member of team) {
      if (member.statusConceptId !== CONCEPTS.TEAM_ACCEPTED) continue;
      member.statusConceptId = CONCEPTS.TEAM_ASSIGNED;
      // La aceptación deja de constar: `accepted_at` respalda el estado, y
      // conservarla afirmaría que el integrante aceptó esta versión.
      member.acceptedAt = undefined;
      touch(member, actor.id);
      acceptancesInvalidated += 1;
    }

    // El caso vuelve a «pendiente de aceptación del equipo»: su equivalente es
    // `CASE_SCHEDULED`, el estado previo a la confirmación.
    if (surgicalCase.statusConceptId === CONCEPTS.CASE_READY_FOR_SURGERY) {
      this.casesRepo.createStatusHistory(tx, {
        procedureCaseId: surgicalCase.id,
        fromStatusConceptId: surgicalCase.statusConceptId,
        toStatusConceptId: CONCEPTS.CASE_SCHEDULED,
        changedByUserId: actor.id,
        reasonText: `Modificación relevante (${changedFields.join(', ')}): el equipo debe volver a aceptar`,
      });
      surgicalCase.statusConceptId = CONCEPTS.CASE_SCHEDULED;
    }

    // La modificación relevante se comunica al equipo. Va por el outbox y no
    // por una llamada directa para que el aviso se confirme con la misma
    // transacción que hizo el cambio.
    await this.outbox.publishDomainEvent(tx, {
      tenantId: surgicalCase.custodianTenantId,
      eventType: 'periop.case.reacceptance_required',
      aggregateType: 'procedure_case',
      aggregateId: surgicalCase.id,
      payloadJson: {
        changedFields,
        acceptancesInvalidated,
        responsibleProfileId: surgicalCase.primarySurgeonProfileId,
      },
      actorUserId: actor.id,
    });
    return acceptancesInvalidated;
  }

  /**
   * Invalida las aceptaciones por un cambio que entró por otro endpoint del
   * módulo (equipo, valoración preoperatoria).
   *
   * Se acota para no ser ruido ni reescribir la historia:
   *
   * - **Sólo antes de la ejecución.** Con el caso en curso, completado o
   *   cancelado ya no hay nada que volver a aceptar; sumar un integrante a una
   *   intervención en marcha no le quita su aceptación al equipo que opera.
   * - **Sólo si hay algo que invalidar.** Armar el equipo de un caso nuevo
   *   asigna integrantes que todavía no aceptaron: no hay aceptación previa que
   *   quede sin efecto ni caso que regresar, y avisar «volvé a aceptar» a quien
   *   nunca aceptó sería ruido.
   *
   * @param tx - Transacción activa, que ya tiene el caso bloqueado.
   * @param surgicalCase - Caso modificado.
   * @param changedFields - Qué cambió.
   * @param actor - Quien modificó.
   * @returns Cuántas aceptaciones quedaron sin efecto (0 si no hubo nada que hacer).
   */
  async invalidateBeforeExecution(
    tx: EntityManager,
    surgicalCase: ProcedureCases,
    changedFields: readonly RelevantChange[],
    actor: AuthenticatedUser,
  ): Promise<number> {
    if (!PRE_EXECUTION_STATES.includes(surgicalCase.statusConceptId)) return 0;

    const team = await this.casesRepo.findTeamByCase(tx, surgicalCase.id);
    const someoneAccepted = team.some(
      (member) => member.statusConceptId === CONCEPTS.TEAM_ACCEPTED,
    );
    const readyForSurgery =
      surgicalCase.statusConceptId === CONCEPTS.CASE_READY_FOR_SURGERY;
    if (!someoneAccepted && !readyForSurgery) return 0;

    return this.invalidate(tx, surgicalCase, changedFields, actor);
  }
}
