import { Injectable } from '@nestjs/common';
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
import { FORMS, FUNCTIONS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  CareSpacesRepository,
  InfrastructureRulesRepository,
} from '../repositories';
import type { CareSpaceDetail } from '../dto/infrastructure.types';
import { assertRowVersion, withVersionConflict } from '../http/row-version';
import { CareSpaceReadService } from './care-space-read.service';
import {
  PARENT_OPEN_STATUSES,
  checkFunctionProfile,
  checkParentRule,
  checkTypology,
  missingForActivation,
  resolveAttributes,
  resolveShape,
  type FieldError,
  type SpaceAttributesInput,
} from './infrastructure-rules';
import { practiceOutOfScope } from './practice-scope';
import { StructureContextService } from './structure-context.service';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { moveBreaksPlanException } from '../plan/plan-constraint-reasons';
import { mapReferenceViolation } from './structure-errors';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';

/** `reason` de código repetido, como texto (`FieldError.reason` mezcla motivos del enum y de formato). */
const CODE_TAKEN: string = PracticeErrorReason.SPACE_CODE_TAKEN;

/** Cuerpo de `PATCH /care-spaces/:id`: lo que se puede cambiar. */
export interface SpacePatch extends SpaceAttributesInput {
  /** Código: sólo mientras el espacio está planificado. */
  code?: string;
  /** Nombre. */
  name?: string;
  /** Forma: sólo mientras el espacio está planificado. */
  formCode?: string;
  /** Función. */
  functionCode?: string;
}

/**
 * Edición y movimiento de un espacio (`procesos/01`, flujo D): `PATCH` y `move`,
 * ambos con `If-Match`, historia y evento.
 */
@Injectable()
export class CareSpaceUpdateService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param spacesRepo - Espacios.
   * @param rulesRepo - Reglas.
   * @param historyRepo - Historia.
   * @param events - Outbox.
   * @param reader - Arma el detalle de respuesta.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly rulesRepo: InfrastructureRulesRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly events: StructureEventsService,
    private readonly reader: CareSpaceReadService,
  ) {}

  /**
   * `PATCH /care-spaces/:id`.
   *
   * `code` y `formCode` son inmutables una vez que el espacio dejó de estar
   * planificado (INV-09): 422 `SPACE_IMMUTABLE_FIELD`. Un cambio que no cambia
   * nada responde 200 sin tocar la versión.
   *
   * @param spaceId - Espacio.
   * @param patch - Campos a cambiar.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien edita.
   * @param correlationId - Id de correlación.
   * @returns El detalle actualizado.
   */
  async patch(
    spaceId: string,
    patch: SpacePatch,
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
      this.assertEditable(space);
      assertRowVersion(space.rowVersion, expectedVersion);

      const errors: FieldError[] = [];
      const changed: string[] = [];
      const locked = space.statusConceptId !== PRAC.SPACE_PLANNED;

      const nextCode = patch.code?.trim();
      if (nextCode !== undefined && nextCode !== space.code) {
        if (locked) errors.push(this.immutable('code'));
        else if (
          await this.spacesRepo.findBySiteAndCode(
            tx,
            space.practiceSiteId,
            nextCode,
          )
        ) {
          errors.push({
            field: 'code',
            reason: PracticeErrorReason.SPACE_CODE_TAKEN,
            message: `El código ${nextCode} ya existe en el establecimiento`,
          });
        } else {
          space.code = nextCode;
          changed.push('code');
        }
      }

      const currentForm = FORMS.byConceptId(space.formConceptId);
      const currentFn = FUNCTIONS.byConceptId(space.spaceTypeConceptId);
      const wantsShape =
        patch.formCode !== undefined || patch.functionCode !== undefined;
      if (wantsShape) {
        const shape = resolveShape(
          patch.formCode ?? currentForm?.code,
          patch.functionCode ?? currentFn?.code,
        );
        errors.push(...shape.errors);
        if (shape.form && shape.fn) {
          if (shape.form.id !== space.formConceptId && locked)
            errors.push(this.immutable('formCode'));
          else {
            const rules = await this.rulesRepo.loadRuleSet(tx);
            const parent = space.parentSpaceId
              ? await this.spacesRepo.findByIdInTenant(
                  tx,
                  space.parentSpaceId,
                  tenantId,
                )
              : null;
            const resolved = {
              form: shape.form,
              fn: shape.fn,
              parentFormId: parent?.formConceptId ?? null,
            };
            const site = (
              await this.context.site(tx, space.practiceSiteId, actor, 'write')
            ).site;
            for (const check of [
              checkParentRule(rules, resolved),
              checkFunctionProfile(resolved),
              shape.fn.id !== space.spaceTypeConceptId
                ? checkTypology(rules, site.facilityTypologyConceptId, shape.fn)
                : null,
            ])
              if (check) errors.push(check);
            if (errors.length === 0) {
              if (shape.form.id !== space.formConceptId) {
                space.formConceptId = shape.form.id;
                changed.push('formCode');
              }
              if (shape.fn.id !== space.spaceTypeConceptId) {
                space.spaceTypeConceptId = shape.fn.id;
                changed.push('functionCode');
              }
            }
          }
        }
      }

      if (patch.name !== undefined && patch.name.trim() !== space.name) {
        if (!patch.name.trim())
          errors.push({ field: 'name', reason: 'REQUIRED' });
        else {
          space.name = patch.name.trim();
          changed.push('name');
        }
      }

      const attributes = resolveAttributes(patch);
      errors.push(...attributes.errors);
      if (attributes.errors.length === 0)
        changed.push(
          ...this.applyAttributes(space, patch, attributes.resolved),
        );

      if (
        space.statusConceptId === PRAC.SPACE_ACTIVE ||
        space.statusConceptId === PRAC.SPACE_SUSPENDED
      ) {
        const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId);
        const form = FORMS.byConceptId(space.formConceptId);
        if (fn && form) {
          errors.push(
            ...missingForActivation({
              fn,
              form,
              areaM2: space.areaM2,
              pressureConceptId: space.pressureConceptId,
              airChangesPerHour: space.airChangesPerHour,
              hvacValidatedOn: space.hvacValidatedOn,
              bedCategoryConceptId: space.bedCategoryConceptId,
              censable: space.censable,
            }),
          );
        }
      }

      if (errors.length > 0) {
        throw this.toException(errors);
      }
      if (changed.length === 0)
        return (await this.reader.detailsOf(tx, [space]))[0];

      touch(space, actor.id);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, space.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(space),
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.spaceUpdated,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          careSpaceId: space.id,
          changedFields: changed,
          rowVersion: space.rowVersion,
        },
      });
      return (await this.reader.detailsOf(tx, [space]))[0];
    });
  }

  /**
   * `POST /care-spaces/:id/move`: cambia el padre validando la regla padre→hijo,
   * la sede, el estado del padre y los ciclos (INV-03, INV-04, INV-10). El
   * subárbol se mueve con el nodo.
   *
   * @param spaceId - Espacio a mover.
   * @param newParentId - Nuevo padre, o `null` para dejarlo en la raíz.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien lo mueve.
   * @param correlationId - Id de correlación.
   * @returns El detalle actualizado.
   */
  async move(
    spaceId: string,
    newParentId: string | null,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<CareSpaceDetail> {
    try {
      return await this.moveInTransaction(
        spaceId,
        newParentId,
        expectedVersion,
        actor,
        correlationId,
      );
    } catch (error) {
      // Los triggers diferidos del plano rechazan al confirmar; se traducen aquí.
      throw moveBreaksPlanException(error, spaceId) ?? error;
    }
  }

  private async moveInTransaction(
    spaceId: string,
    newParentId: string | null,
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
      this.assertEditable(space);
      assertRowVersion(space.rowVersion, expectedVersion);

      const previousParentId = space.parentSpaceId ?? null;
      if (previousParentId === newParentId)
        return (await this.reader.detailsOf(tx, [space]))[0];

      let parent: CareSpaces | null = null;
      if (newParentId !== null) {
        parent = await this.spacesRepo.findByIdInTenant(
          tx,
          newParentId,
          tenantId,
        );
        if (!parent) throw practiceOutOfScope('Espacio padre no encontrado');
        if (parent.practiceSiteId !== space.practiceSiteId) {
          throw this.rule(
            PracticeErrorReason.PARENT_SITE_MISMATCH,
            'parentSpaceId',
            'El nuevo padre es de otro establecimiento',
          );
        }
        const subtree = await this.spacesRepo.subtreeIds(tx, space.id);
        if (subtree.includes(parent.id)) {
          throw this.rule(
            PracticeErrorReason.SPACE_CYCLE,
            'parentSpaceId',
            'No se puede mover un espacio bajo sí mismo ni bajo uno de sus descendientes',
          );
        }
        if (!PARENT_OPEN_STATUSES.has(parent.statusConceptId)) {
          throw this.rule(
            PracticeErrorReason.PARENT_NOT_ACTIVE,
            'parentSpaceId',
            'El nuevo padre está suspendido o clausurado',
          );
        }
        if (
          space.statusConceptId === PRAC.SPACE_ACTIVE &&
          parent.statusConceptId !== PRAC.SPACE_ACTIVE
        ) {
          throw this.rule(
            PracticeErrorReason.PARENT_NOT_ACTIVE,
            'parentSpaceId',
            'Un espacio activo no cuelga de un padre sin activar',
          );
        }
      }

      const form = FORMS.byConceptId(space.formConceptId);
      const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId);
      if (form && fn) {
        const rules = await this.rulesRepo.loadRuleSet(tx);
        const error = checkParentRule(rules, {
          form,
          fn,
          parentFormId: parent?.formConceptId ?? null,
        });
        if (error)
          throw this.rule(
            error.reason,
            error.field,
            error.message ?? 'Regla padre→hijo',
          );
      }

      space.parentSpaceId = newParentId as string;
      touch(space, actor.id);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, space.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(space),
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.spaceMoved,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          careSpaceId: space.id,
          fromParentSpaceId: previousParentId,
          toParentSpaceId: newParentId,
          rowVersion: space.rowVersion,
        },
      });
      return (await this.reader.detailsOf(tx, [space]))[0];
    });
  }

  /** Un espacio clausurado es de sólo lectura. */
  private assertEditable(space: CareSpaces): void {
    if (space.statusConceptId === PRAC.SPACE_RETIRED) {
      throw this.rule(
        PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
        'status',
        'El espacio está clausurado: es de sólo lectura',
      );
    }
  }

  private immutable(field: string): FieldError {
    return {
      field,
      reason: PracticeErrorReason.SPACE_IMMUTABLE_FIELD,
      message: `${field} no se cambia una vez activado el espacio; para renombrar, cambiá name`,
    };
  }

  private rule(
    reason: string,
    field: string,
    message: string,
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      { errors: [{ field, reason }] },
      reason,
    );
  }

  private toException(errors: readonly FieldError[]): Error {
    const first = errors[0];
    const details = {
      errors: errors.map(({ field, reason }) => ({ field, reason })),
    };
    if (first.reason === CODE_TAKEN) {
      return new ConflictException(
        first.message ?? 'Código en uso',
        details,
        first.reason,
      );
    }
    return new PreconditionFailedException(
      first.message ?? 'Datos inválidos',
      details,
      first.reason,
    );
  }

  /**
   * Aplica los atributos presentes en el parche y devuelve los campos que
   * realmente cambiaron.
   */
  private applyAttributes(
    space: CareSpaces,
    patch: SpaceAttributesInput,
    resolved: Record<string, string | null>,
  ): string[] {
    const changed: string[] = [];
    const set = <K extends keyof CareSpaces>(
      key: K,
      value: CareSpaces[K] | undefined,
      field: string,
    ): void => {
      if (space[key] === value || (space[key] == null && value == null)) return;
      // `null` y no `undefined`: el ORM escribe NULL sólo cuando se lo dice.
      space[key] = (value ?? null) as CareSpaces[K];
      changed.push(field);
    };
    if (patch.description !== undefined)
      set('description', patch.description ?? undefined, 'description');
    if (patch.capacity !== undefined)
      set('capacity', patch.capacity ?? undefined, 'capacity');
    if (patch.floorNumber !== undefined)
      set('floorNumber', patch.floorNumber ?? undefined, 'floorNumber');
    if (patch.areaM2 !== undefined)
      set(
        'areaM2',
        patch.areaM2 == null ? undefined : String(patch.areaM2),
        'areaM2',
      );
    if (patch.airChangesPerHour !== undefined) {
      set(
        'airChangesPerHour',
        patch.airChangesPerHour == null
          ? undefined
          : String(patch.airChangesPerHour),
        'airChangesPerHour',
      );
    }
    if (patch.hvacValidatedOn !== undefined) {
      const next = patch.hvacValidatedOn
        ? new Date(patch.hvacValidatedOn)
        : undefined;
      if (space.hvacValidatedOn?.toString() !== next?.toString()) {
        space.hvacValidatedOn = (next ?? null) as Date;
        changed.push('hvacValidatedOn');
      }
    }
    if ('asepsisConceptId' in resolved)
      set(
        'asepsisConceptId',
        resolved.asepsisConceptId ?? undefined,
        'asepsisCode',
      );
    if ('pressureConceptId' in resolved)
      set(
        'pressureConceptId',
        resolved.pressureConceptId ?? undefined,
        'pressureCode',
      );
    if ('sexRestrictionConceptId' in resolved)
      set(
        'sexRestrictionConceptId',
        resolved.sexRestrictionConceptId ?? undefined,
        'sexRestrictionCode',
      );
    if ('ageGroupConceptId' in resolved)
      set(
        'ageGroupConceptId',
        resolved.ageGroupConceptId ?? undefined,
        'ageGroupCode',
      );
    if ('bedCategoryConceptId' in resolved)
      set(
        'bedCategoryConceptId',
        resolved.bedCategoryConceptId ?? undefined,
        'bedCategoryCode',
      );
    if (patch.censable !== undefined)
      set('censable', patch.censable ?? undefined, 'censable');
    if (patch.prepMinutes !== undefined)
      set('prepMinutes', patch.prepMinutes ?? undefined, 'prepMinutes');
    if (patch.cleanupMinutes !== undefined)
      set(
        'cleanupMinutes',
        patch.cleanupMinutes ?? undefined,
        'cleanupMinutes',
      );
    if (patch.gln !== undefined) set('gln', patch.gln ?? undefined, 'gln');
    return changed;
  }
}
