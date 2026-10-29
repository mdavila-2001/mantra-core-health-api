import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import type { CareSpaces } from '../entities';
import {
  FORMS,
  FUNCTIONS,
  SPACE_LIFECYCLE,
  SPACE_TRANSITIONS,
  type LifecycleAction,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import {
  conceptIdOf,
  HYGIENE,
  hygieneUntouched,
  INITIAL_HYGIENE,
} from '../ops-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import { CareSpacesRepository } from '../repositories';
import type { CareSpaceDetail, RetireCheck } from '../dto/infrastructure.types';
import { assertRowVersion, withVersionConflict } from '../http/row-version';
import { CareSpaceReadService } from './care-space-read.service';
import { missingForActivation } from './infrastructure-rules';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RetireBlockerRegistry,
  SUBTREE_CTE,
} from './retire-blockers';
import { StructureContextService } from './structure-context.service';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { mapReferenceViolation } from './structure-errors';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';

/**
 * Ciclo de vida del espacio y verificación de clausura
 * (`procesos/02`, `POST /care-spaces/:id/lifecycle`, `GET …/retire-check`).
 *
 * `PLANNED → ACTIVE ⇄ SUSPENDED → RETIRED`. Nunca se borra nada (INV-14): la
 * clausura cierra con `valid_to` y el código queda reservado.
 */
@Injectable()
export class CareSpaceLifecycleService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param spacesRepo - Espacios.
   * @param blockers - Registro de proveedores de bloqueo.
   * @param historyRepo - Historia.
   * @param events - Outbox.
   * @param reader - Arma el detalle de respuesta.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly spacesRepo: CareSpacesRepository,
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly blockers: RetireBlockerRegistry,
    private readonly historyRepo: HistoryRepository,
    private readonly events: StructureEventsService,
    private readonly reader: CareSpaceReadService,
  ) {}

  /**
   * `GET /care-spaces/:id/retire-check`: los bloqueos de clausura, sin mutar.
   * Es informativo: la clausura los vuelve a calcular dentro de su transacción.
   *
   * @param spaceId - Espacio.
   * @param actor - Quien consulta.
   * @returns Los bloqueos y el instante del cálculo.
   */
  async retireCheck(
    spaceId: string,
    actor: AuthenticatedUser,
  ): Promise<RetireCheck> {
    return this.em.transactional(async (tx) => {
      const { space, tenantId } = await this.context.space(
        tx,
        spaceId,
        actor,
        'write',
      );
      return this.computeBlockers(tx, space, tenantId);
    });
  }

  /**
   * `POST /care-spaces/:id/lifecycle`.
   *
   * @param spaceId - Espacio.
   * @param action - `activate`, `suspend`, `reactivate` o `retire`.
   * @param reason - Motivo; obligatorio en `suspend` y `retire`.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien lo cambia.
   * @param correlationId - Id de correlación.
   * @returns El detalle actualizado.
   */
  async change(
    spaceId: string,
    action: LifecycleAction,
    reason: string | undefined,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<CareSpaceDetail> {
    return this.em.transactional(async (tx) => {
      const { space, tenantId } = await this.context.space(
        tx,
        spaceId,
        actor,
        'write',
      );
      // La fila se bloquea (`for update`) ANTES de leer el estado y de recolectar los
      // bloqueos: quien cuelga algo del espacio —un activo, una tarifa, una cama— toma
      // la misma fila `for share`, así que o ve el espacio vivo y la clausura espera y
      // lo ve como bloqueo, o la clausura gana y esa escritura ve el espacio retirado.
      // Después se relee la entidad: lo cargado antes del bloqueo puede estar viejo.
      await this.lockForChange(tx, space, tenantId, action === 'retire');
      assertRowVersion(space.rowVersion, expectedVersion);

      const transition = SPACE_TRANSITIONS[action];
      if (!transition.from.includes(space.statusConceptId)) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
          `No se puede ${action} un espacio ${SPACE_LIFECYCLE.byConceptId(space.statusConceptId)?.code ?? 'en ese estado'}`,
          {
            action,
            from: SPACE_LIFECYCLE.byConceptId(space.statusConceptId)?.code,
          },
        );
      }
      const cleanReason = reason?.trim();
      if (transition.requiresReason && !cleanReason) {
        throw this.invalid(
          PracticeErrorReason.LIFECYCLE_REASON_REQUIRED,
          `${action} exige un motivo`,
          { action },
        );
      }

      if (action === 'activate' || action === 'reactivate') {
        await this.assertCanOpen(tx, space, tenantId);
      }
      if (action === 'retire') {
        const check = await this.computeBlockers(tx, space, tenantId);
        if (check.blockers.length > 0) {
          throw new ConflictException(
            'No se puede clausurar: hay dependencias pendientes',
            { blockers: check.blockers, asOf: check.asOf },
            PracticeErrorReason.SPACE_RETIRE_BLOCKED,
          );
        }
      }

      const from = space.statusConceptId;
      const now = new Date();
      space.statusConceptId = transition.to;
      if (action === 'activate') {
        space.validFrom = space.validFrom ?? now;
        // F2: al activarse queda lista para usar. Si la higiene sigue como la dejó
        // el alta o el backfill (sin operación que la haya tocado), se fija; una
        // `reactivate` conserva la que tenía (puede estar sucia).
        if (hygieneUntouched(space)) {
          space.hygieneStatusConceptId = conceptIdOf(HYGIENE, INITIAL_HYGIENE);
          space.hygieneChangedAt = now;
        }
      }
      if (action === 'retire') space.validTo = now;
      touch(space, actor.id, now);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, space.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: {
          ...structureSnapshot(space),
          lifecycleAction: action,
          lifecycleReason: cleanReason ?? null,
        },
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.spaceLifecycle,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          careSpaceId: space.id,
          action,
          from: SPACE_LIFECYCLE.byConceptId(from)?.code ?? from,
          to: SPACE_LIFECYCLE.byConceptId(transition.to)?.code ?? transition.to,
          reason: cleanReason ?? null,
          rowVersion: space.rowVersion,
        },
      });
      return (await this.reader.detailsOf(tx, [space]))[0];
    });
  }

  /**
   * Bloquea el espacio (y, al clausurar, todo su subárbol, que es lo que mira
   * `computeBlockers`) en la transacción y relee su estado. Las filas se toman en
   * orden de id para que dos clausuras que se cruzan no se interbloqueen.
   */
  private async lockForChange(
    tx: EntityManager,
    space: CareSpaces,
    tenantId: string,
    subtree: boolean,
  ): Promise<void> {
    await tx.execute(
      subtree
        ? `${SUBTREE_CTE}
           select cs.id from practice.care_spaces cs
            where cs.id in (select id from sub) and cs.tenant_id = ?
            order by cs.id for update`
        : `select cs.id from practice.care_spaces cs
            where cs.id = ? and cs.tenant_id = ? for update`,
      [space.id, tenantId],
    );
    await tx.refresh(space);
  }

  /** Padre activo y datos que exige el perfil de la función (INV-10, `procesos/02` precondición 4). */
  private async assertCanOpen(
    tx: EntityManager,
    space: CareSpaces,
    tenantId: string,
  ): Promise<void> {
    if (space.parentSpaceId) {
      const parent = await this.spacesRepo.findByIdInTenant(
        tx,
        space.parentSpaceId,
        tenantId,
      );
      if (!parent || parent.statusConceptId !== PRAC.SPACE_ACTIVE) {
        throw this.invalid(
          PracticeErrorReason.PARENT_NOT_ACTIVE,
          'El padre no está activo: activalo o reactivalo primero',
          {
            parentSpaceId: space.parentSpaceId,
            nextAction: 'Reactivar o activar el espacio padre',
          },
        );
      }
    }
    const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId);
    const form = FORMS.byConceptId(space.formConceptId);
    if (!fn || !form) return;
    const missing = missingForActivation({
      fn,
      form,
      areaM2: space.areaM2,
      pressureConceptId: space.pressureConceptId,
      airChangesPerHour: space.airChangesPerHour,
      hvacValidatedOn: space.hvacValidatedOn,
      bedCategoryConceptId: space.bedCategoryConceptId,
      censable: space.censable,
    });
    if (missing.length > 0) {
      throw this.invalid(
        PracticeErrorReason.SPACE_PROFILE_INCOMPLETE,
        `Faltan datos para activar ${fn.code}: ${missing.map((m) => m.field).join(', ')}`,
        { errors: missing.map(({ field, reason }) => ({ field, reason })) },
      );
    }
  }

  /** Calcula los bloqueos con los proveedores registrados, sobre el subárbol. */
  private async computeBlockers(
    tx: EntityManager,
    space: CareSpaces,
    tenantId: string,
  ): Promise<RetireCheck> {
    const now = new Date();
    const blockers = [];
    for (const provider of this.blockers.all()) {
      const found = await provider.collect({
        tx,
        tenantId,
        rootId: space.id,
        now,
        subtreeCte: SUBTREE_CTE,
      });
      if (found) blockers.push(found);
    }
    return { blockers, asOf: now.toISOString() };
  }

  private invalid(
    reason: string,
    message: string,
    details?: Record<string, unknown>,
  ): PreconditionFailedException {
    return new PreconditionFailedException(message, details, reason);
  }
}
