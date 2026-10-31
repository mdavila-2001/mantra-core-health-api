import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  validateSync,
} from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { OutboxService } from '../../messaging/services/outbox.service';
import { PRAC } from '../practice.concepts';
import {
  PracticeErrorReason,
  conflict,
  reasonMessage,
  ruleException,
} from '../practice.error-reasons';
import type { CareSpaces, ClinicalUnits, PracticeSites } from '../entities';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  RetireBlockersRepository,
  SpaceUnitAssignmentsRepository,
  StructureRulesRepository,
} from '../repositories';
import {
  CareSpaceAttributesDto,
  type BulkCreateCareSpacesDto,
  type BulkCreatedDto,
  type CareSpaceDetailDto,
  type CreateCareSpaceDto,
  type CreateUnitAssignmentDto,
  type ImportCareSpacesDto,
  type ImportResultDto,
  type ImportRowResultDto,
  type LifecycleChangeDto,
  type MoveCareSpaceDto,
  type RetireCheckDto,
  type SpaceUnitAssignmentDto,
  type UpdateCareSpaceDto,
} from '../dto';
import {
  PRACTICE_CONCEPT_BY_CODE,
  type FormCode,
  type ParentRule,
  type TypologyRule,
} from '../domain/structure/structure-catalog';
import {
  judgeFunctionForm,
  judgeNoCycle,
  judgeParentChild,
  judgeTypology,
} from '../domain/structure/structure-rules';
import {
  judgeParentAllows,
  judgeTransition,
  type LifecycleState,
} from '../domain/structure/lifecycle';
import { expandPattern } from '../domain/structure/code-pattern';
import {
  UNVERIFIABLE_SPACE_CHECKS,
  blocker,
  type Blocker,
} from '../domain/structure/retire-blockers';
import { StructureAccessService } from './structure-access.service';
import { appendStructureRevision } from './structure-history';
import { STRUCTURE_EVENTS, publishStructureEvent } from './structure-events';
import { flushStructure } from './structure-write-errors';
import { toAssignment, toSpaceDetail } from './structure-mapper';
import {
  assertIfMatch,
  codeOf,
  formIdOf,
  formOf,
  functionIdOf,
  resolveAttributes,
  stateOf,
  type FieldError,
  type SpaceAttributeColumns,
} from './structure-input';

/** Estado → concepto del espacio. */
const SPACE_STATUS: Record<LifecycleState, string> = {
  PLANNED: PRAC.SPACE_PLANNED,
  ACTIVE: PRAC.SPACE_ACTIVE,
  SUSPENDED: PRAC.SPACE_SUSPENDED,
  RETIRED: PRAC.SPACE_RETIRED,
};

/** Estado → estado operacional (el eje de disponibilidad es de F2). */
const OPERATIONAL_FOR: Record<LifecycleState, string | null> = {
  PLANNED: null,
  ACTIVE: PRAC.SPACE_OP_AVAILABLE,
  SUSPENDED: PRAC.SPACE_OP_CLOSED,
  RETIRED: PRAC.SPACE_OP_CLOSED,
};

/** Una fila de importación, validada con las mismas reglas que el alta. */
class ImportRowInput extends CareSpaceAttributesDto {
  @IsString() @MinLength(1) @MaxLength(100) code!: string;
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsString() formCode!: string;
  @IsString() functionCode!: string;
  @IsOptional() @IsString() parentCode?: string;
  @IsOptional() @IsString() clinicalUnitCode?: string;
  @IsOptional() @IsBoolean() activate?: boolean;
}

/** Lo que hace falta para validar un alta. */
interface SpaceCandidate {
  code: string;
  name: string;
  formCode: string;
  functionCode: string;
  parent: { form: FormCode | null; state: LifecycleState | null } | null;
  target: LifecycleState;
}

/** Reglas cargadas una vez por transacción. */
interface RuleSet {
  parentRules: ParentRule[];
  typologyRules: TypologyRule[];
  typologyCode: string | null;
}

/**
 * Árbol físico de una sede (F1, contrato §3): alta (simple, masiva e
 * importada), edición, movimiento, ciclo de vida, comprobación de retiro y
 * vínculos con unidades.
 *
 * Cada operación es una transacción: autoriza (404 cruzado, admin de la org o
 * de la sucursal), valida con las reglas puras de `domain/structure/`, escribe
 * con `tenant_id`, sella la revisión en `audit.care_spaces_history` y publica
 * el evento outbox. Las reglas vienen de las tablas sembradas, no de `if`s.
 */
@Injectable()
export class CareSpacesAdminService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: StructureAccessService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly rulesRepo: StructureRulesRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
    private readonly blockersRepo: RetireBlockersRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareSpacesAdminService.name);
  }

  // ------------------------------------------------------------------ alta

  /**
   * `POST /sites/:siteId/care-spaces` extendido (UC-14-05 + F1).
   *
   * Sin `formCode` ni `functionCode` (clientes de F0) se toma `LOC_FORM_ROOM`
   * + función genérica (o `spaceTypeConceptId` si es una función conocida) y
   * nace ACTIVO como antes; con el cuerpo nuevo nace PLANNED salvo
   * `activate: true`.
   */
  async create(
    siteId: string,
    dto: CreateCareSpaceDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceDetailDto> {
    this.logger.info(
      { operation: 'practice.space.create', siteId },
      'Creating care space',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.writableSite(tx, siteId, tenantId, actor);
      const legacy =
        dto.formCode === undefined && dto.functionCode === undefined;
      const functionCode =
        dto.functionCode ??
        (dto.spaceTypeConceptId
          ? (codeOf(dto.spaceTypeConceptId) ?? dto.spaceTypeConceptId)
          : 'SPACE_TYPE_ROOM');
      const formCode = dto.formCode ?? 'LOC_FORM_ROOM';
      const target: LifecycleState =
        legacy || dto.activate ? 'ACTIVE' : 'PLANNED';

      const siteSpaces = await this.spacesRepo.findBySite(tx, siteId);
      const parent = dto.parentSpaceId
        ? this.sameSiteSpace(siteSpaces, dto.parentSpaceId, 'parentSpaceId')
        : null;
      if (dto.clinicalUnitId)
        await this.sameSiteUnit(tx, site, dto.clinicalUnitId);

      const rules = await this.loadRules(tx, site);
      const errors = this.validateCandidate(
        {
          code: dto.code,
          name: dto.name,
          formCode,
          functionCode,
          parent: parent
            ? { form: formOf(parent), state: stateOf(parent) }
            : null,
          target,
        },
        rules,
        new Set(siteSpaces.map((s) => s.code)),
      );
      this.throwFirst(errors, { siteId, code: dto.code });

      const attrs = resolveAttributes(dto);
      this.throwFirst(
        attrs.errors.map((e) => ({ ...e, details: { field: e.field } })),
        { siteId },
      );

      const space = this.insert(tx, site, {
        code: dto.code,
        name: dto.name,
        formCode,
        functionCode,
        parentSpaceId: parent?.id,
        clinicalUnitId: dto.clinicalUnitId,
        target,
        attrs: attrs.values,
        actorId: actor.id,
      });
      await flushStructure(tx);
      await this.sealCreated(tx, space, actor);
      await flushStructure(tx);
      return toSpaceDetail(space, [...siteSpaces, space], []);
    });
  }

  /**
   * `POST /sites/:siteId/care-spaces/bulk`: N espacios iguales bajo un mismo
   * padre, con código y nombre por patrón. Todo o nada; máximo 200.
   */
  async bulkCreate(
    siteId: string,
    dto: BulkCreateCareSpacesDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<BulkCreatedDto> {
    return this.em.transactional(async (tx) => {
      const site = await this.writableSite(tx, siteId, tenantId, actor);
      const expanded = expandPattern(dto.codePattern, dto.namePattern);
      if (!expanded.ok) throw ruleException(expanded.reason, expanded.details);

      const siteSpaces = await this.spacesRepo.findBySite(tx, siteId);
      const parent = dto.parentSpaceId
        ? this.sameSiteSpace(siteSpaces, dto.parentSpaceId, 'parentSpaceId')
        : null;
      if (dto.clinicalUnitId)
        await this.sameSiteUnit(tx, site, dto.clinicalUnitId);
      const rules = await this.loadRules(tx, site);
      const attrs = resolveAttributes(dto);
      const target: LifecycleState = dto.activate ? 'ACTIVE' : 'PLANNED';

      const codes = new Set(siteSpaces.map((s) => s.code));
      const rows: ImportRowResultDto[] = expanded.items.map((item, index) => {
        const errors = [
          ...this.validateCandidate(
            {
              code: item.code,
              name: item.name,
              formCode: dto.formCode,
              functionCode: dto.functionCode,
              parent: parent
                ? { form: formOf(parent), state: stateOf(parent) }
                : null,
              target,
            },
            rules,
            codes,
          ),
          ...attrs.errors,
        ];
        codes.add(item.code);
        return {
          line: index + 1,
          status: errors.length ? 'error' : 'ok',
          errors: errors.map(({ field, reason }) => ({
            field,
            reason,
            message: reasonMessage(reason),
          })),
        };
      });
      if (rows.some((r) => r.status === 'error')) {
        throw ruleException(PracticeErrorReason.IMPORT_INVALID_ROWS, {
          rows: rows
            .filter((r) => r.status === 'error')
            .map((r) => ({ ...r, code: expanded.items[r.line - 1].code })),
        });
      }

      const created = expanded.items.map((item) =>
        this.insert(tx, site, {
          code: item.code,
          name: item.name,
          formCode: dto.formCode,
          functionCode: dto.functionCode,
          parentSpaceId: parent?.id,
          clinicalUnitId: dto.clinicalUnitId,
          target,
          attrs: attrs.values,
          actorId: actor.id,
        }),
      );
      await flushStructure(tx);
      for (const space of created) await this.sealCreated(tx, space, actor);
      await flushStructure(tx);
      const all = [...siteSpaces, ...created];
      return { created: created.map((s) => toSpaceDetail(s, all, [])) };
    });
  }

  /**
   * `POST /sites/:siteId/care-spaces/import?dryRun=`: filas ya parseadas.
   *
   * `parentCode` puede nombrar un espacio existente o una fila anterior del
   * mismo lote (el orden importa). Con `dryRun=true` no escribe nada; con
   * `false` escribe todas o ninguna (`ok: false, created: 0`).
   */
  async importRows(
    siteId: string,
    dto: ImportCareSpacesDto,
    dryRun: boolean,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ImportResultDto> {
    return this.em.transactional(async (tx) => {
      const site = await this.writableSite(tx, siteId, tenantId, actor);
      const siteSpaces = await this.spacesRepo.findBySite(tx, siteId);
      const units = await this.unitsRepo.findBySite(tx, siteId);
      const rules = await this.loadRules(tx, site);

      const byCode = new Map<
        string,
        { form: FormCode | null; state: LifecycleState | null; id?: string }
      >(
        siteSpaces.map((s) => [
          s.code,
          { form: formOf(s), state: stateOf(s), id: s.id },
        ]),
      );
      const codes = new Set(siteSpaces.map((s) => s.code));
      const planned: Array<{
        row: ImportRowInput;
        attrs: SpaceAttributeColumns;
        unitId?: string;
      }> = [];

      const results: ImportRowResultDto[] = dto.rows.map((raw, index) => {
        // La validación es por fila (y no del cuerpo entero) para poder
        // devolver los errores por línea; una fila que no es objeto es eso.
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
          return {
            line: index + 1,
            status: 'error' as const,
            errors: [
              {
                field: 'row',
                reason: 'NOT_AN_OBJECT',
                message: reasonMessage('NOT_AN_OBJECT'),
              },
            ],
          };
        }
        const row = plainToInstance(ImportRowInput, raw);
        const errors: FieldError[] = validateSync(row, {
          whitelist: true,
          forbidNonWhitelisted: true,
        }).map((e) => ({
          field: e.property,
          reason: Object.keys(e.constraints ?? { invalid: '' })[0] ?? 'invalid',
        }));
        let unitId: string | undefined;
        let attrs: SpaceAttributeColumns = {};
        if (errors.length === 0) {
          let parent: SpaceCandidate['parent'] = null;
          if (row.parentCode) {
            const p = byCode.get(row.parentCode);
            if (!p) errors.push({ field: 'parentCode', reason: 'NOT_FOUND' });
            else parent = { form: p.form, state: p.state };
          }
          if (row.clinicalUnitCode) {
            const unit = units.find(
              (u) =>
                u.code === row.clinicalUnitCode &&
                u.statusConceptId !== PRAC.UNIT_RETIRED,
            );
            if (!unit)
              errors.push({ field: 'clinicalUnitCode', reason: 'NOT_FOUND' });
            else unitId = unit.id;
          }
          const target: LifecycleState = row.activate ? 'ACTIVE' : 'PLANNED';
          if (!errors.some((e) => e.field === 'parentCode')) {
            errors.push(
              ...this.validateCandidate(
                {
                  code: row.code,
                  name: row.name,
                  formCode: row.formCode,
                  functionCode: row.functionCode,
                  parent,
                  target,
                },
                rules,
                codes,
              ).map(({ field, reason }) => ({ field, reason })),
            );
          }
          const resolved = resolveAttributes(row);
          attrs = resolved.values;
          errors.push(...resolved.errors);
          if (errors.length === 0) {
            codes.add(row.code);
            byCode.set(row.code, {
              form: row.formCode as FormCode,
              state: target,
            });
          }
        }
        if (errors.length === 0) planned.push({ row, attrs, unitId });
        return {
          line: index + 1,
          status: errors.length ? 'error' : 'ok',
          errors: errors.map(({ field, reason }) => ({
            field,
            reason,
            message: reasonMessage(reason),
          })),
        };
      });

      const ok = results.every((r) => r.status === 'ok');
      if (dryRun || !ok)
        return { ok, dryRun, rows: results, created: dryRun ? undefined : 0 };

      // Alta en orden: un padre del lote se crea (y se resuelve su id) antes
      // que sus hijos.
      const idByCode = new Map(siteSpaces.map((s) => [s.code, s.id]));
      const created: CareSpaces[] = [];
      for (const { row, attrs, unitId } of planned) {
        const space = this.insert(tx, site, {
          code: row.code,
          name: row.name,
          formCode: row.formCode,
          functionCode: row.functionCode,
          parentSpaceId: row.parentCode
            ? idByCode.get(row.parentCode)
            : undefined,
          clinicalUnitId: unitId,
          target: row.activate ? 'ACTIVE' : 'PLANNED',
          attrs,
          actorId: actor.id,
        });
        idByCode.set(row.code, space.id);
        created.push(space);
      }
      await flushStructure(tx);
      for (const space of created) await this.sealCreated(tx, space, actor);
      await flushStructure(tx);
      return { ok: true, dryRun, rows: results, created: created.length };
    });
  }

  // ------------------------------------------------------------- edición

  /**
   * `PATCH /care-spaces/:id`. `code` y `formCode` sólo cambian mientras el
   * espacio está PLANNED (422 `SPACE_IMMUTABLE_FIELD` después).
   */
  async update(
    spaceId: string,
    dto: UpdateCareSpaceDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceDetailDto> {
    return this.em.transactional(async (tx) => {
      const { space, site } = await this.writableSpace(
        tx,
        spaceId,
        tenantId,
        actor,
      );
      assertIfMatch(ifMatch, space.rowVersion);
      const state = stateOf(space);
      const siteSpaces = await this.spacesRepo.findBySite(tx, site.id);
      const rules = await this.loadRules(tx, site);
      const changes: string[] = [];

      const codeChanges = dto.code !== undefined && dto.code !== space.code;
      const formChanges =
        dto.formCode !== undefined && dto.formCode !== formOf(space);
      if ((codeChanges || formChanges) && state !== 'PLANNED') {
        throw ruleException(PracticeErrorReason.SPACE_IMMUTABLE_FIELD, {
          fields: [codeChanges && 'code', formChanges && 'formCode'].filter(
            Boolean,
          ),
          status: state,
        });
      }
      if (codeChanges) {
        if (siteSpaces.some((s) => s.id !== space.id && s.code === dto.code)) {
          throw conflict(
            PracticeErrorReason.SPACE_CODE_TAKEN,
            'Ya existe un espacio con ese código en la sede',
            { code: dto.code },
          );
        }
        space.code = dto.code!;
        changes.push('code');
      }

      const formCode = (dto.formCode ??
        formOf(space) ??
        'LOC_FORM_ROOM') as FormCode;
      const functionCode =
        dto.functionCode ??
        codeOf(space.spaceTypeConceptId) ??
        'SPACE_TYPE_ROOM';
      if (formChanges || dto.functionCode !== undefined) {
        if (!formIdOf(formCode)) {
          throw ruleException(PracticeErrorReason.SPACE_UNKNOWN_CODE, {
            field: 'formCode',
            formCode,
          });
        }
        const fit = judgeFunctionForm(functionCode, formCode);
        if (!fit.ok) throw ruleException(fit.reason, fit.details);
        const typo = judgeTypology(
          rules.typologyCode,
          functionCode,
          rules.typologyRules,
        );
        if (!typo.ok) throw ruleException(typo.reason, typo.details);
      }
      if (formChanges) {
        const parent = space.parentSpaceId
          ? siteSpaces.find((s) => s.id === space.parentSpaceId)
          : undefined;
        const asChild = judgeParentChild(
          parent ? formOf(parent) : null,
          formCode,
          rules.parentRules,
        );
        if (!asChild.ok) throw ruleException(asChild.reason, asChild.details);
        for (const child of siteSpaces.filter(
          (s) => s.parentSpaceId === space.id,
        )) {
          const childForm = formOf(child);
          if (!childForm) continue;
          const asParent = judgeParentChild(
            formCode,
            childForm,
            rules.parentRules,
          );
          if (!asParent.ok)
            throw ruleException(asParent.reason, {
              ...asParent.details,
              childId: child.id,
            });
        }
        space.formConceptId = formIdOf(formCode);
        changes.push('formCode');
      }
      if (
        dto.functionCode !== undefined &&
        functionIdOf(functionCode) !== space.spaceTypeConceptId
      ) {
        space.spaceTypeConceptId = functionIdOf(functionCode)!;
        changes.push('functionCode');
      }
      if (dto.name !== undefined && dto.name !== space.name) {
        space.name = dto.name;
        changes.push('name');
      }
      if (dto.clinicalUnitId !== undefined) {
        if (dto.clinicalUnitId !== null)
          await this.sameSiteUnit(tx, site, dto.clinicalUnitId);
        space.clinicalUnitId = dto.clinicalUnitId ?? undefined;
        changes.push('clinicalUnitId');
      }
      const attrs = resolveAttributes(dto);
      if (attrs.errors.length) {
        throw ruleException(attrs.errors[0].reason, {
          field: attrs.errors[0].field,
        });
      }
      for (const [key, value] of Object.entries(attrs.values)) {
        (space as unknown as Record<string, unknown>)[key] = value ?? undefined;
        changes.push(key);
      }

      touch(space, actor.id);
      await flushStructure(tx);
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'space',
        space,
        AUD.OPERATION_UPDATE,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.spaceUpdated,
        {
          tenantId: space.tenantId,
          aggregateId: space.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            spaceId: space.id,
            changes,
            rowVersion: space.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.detail(tx, space, siteSpaces);
    });
  }

  /** `POST /care-spaces/:id/move`: regla padre→hijo y anti-ciclo. */
  async move(
    spaceId: string,
    dto: MoveCareSpaceDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceDetailDto> {
    return this.em.transactional(async (tx) => {
      const { space, site } = await this.writableSpace(
        tx,
        spaceId,
        tenantId,
        actor,
      );
      assertIfMatch(ifMatch, space.rowVersion);
      const siteSpaces = await this.spacesRepo.findBySite(tx, site.id);
      const rules = await this.loadRules(tx, site);
      const newParentId = dto.parentSpaceId ?? null;
      const parent = newParentId
        ? this.sameSiteSpace(siteSpaces, newParentId, 'parentSpaceId')
        : null;

      const cycle = judgeNoCycle(
        space.id,
        newParentId,
        new Map(siteSpaces.map((s) => [s.id, s.parentSpaceId ?? null])),
      );
      if (!cycle.ok) throw ruleException(cycle.reason, cycle.details);
      const form = formOf(space) ?? 'LOC_FORM_ROOM';
      const shape = judgeParentChild(
        parent ? formOf(parent) : null,
        form,
        rules.parentRules,
      );
      if (!shape.ok) throw ruleException(shape.reason, shape.details);
      const state = stateOf(space)!;
      const lifecycle = judgeParentAllows(
        state,
        parent ? stateOf(parent) : null,
      );
      if (!lifecycle.ok)
        throw ruleException(lifecycle.reason, lifecycle.details);

      const from = space.parentSpaceId ?? null;
      space.parentSpaceId = newParentId ?? undefined;
      touch(space, actor.id);
      await flushStructure(tx);
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'space',
        space,
        AUD.OPERATION_UPDATE,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.spaceMoved,
        {
          tenantId: space.tenantId,
          aggregateId: space.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            spaceId: space.id,
            fromParentId: from,
            toParentId: newParentId,
            rowVersion: space.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.detail(tx, space, siteSpaces);
    });
  }

  // -------------------------------------------------------- ciclo de vida

  /** `GET /care-spaces/:id/retire-check`: los bloqueos, sin cambiar nada. */
  async retireCheck(
    spaceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<RetireCheckDto> {
    const space = await this.access.requireSpace(this.em, spaceId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    return {
      blockers: await this.retireBlockers(this.em, space),
      unverifiable: [...UNVERIFIABLE_SPACE_CHECKS],
    };
  }

  /**
   * `POST /care-spaces/:id/lifecycle`.
   *
   * - `activate`/`reactivate`: el padre tiene que estar ACTIVO (422
   *   `PARENT_NOT_ACTIVE`).
   * - `suspend`: con hijos activos, 409 `SPACE_SUSPEND_BLOCKED` (un hijo no
   *   puede quedar más activo que su padre; no se suspende en cascada).
   * - `retire`: con bloqueos, 409 `SPACE_RETIRE_BLOCKED` y
   *   `details.blockers`; si no, cierra vigencia y vínculos vigentes.
   *
   * El motivo queda en la revisión de `audit.care_spaces_history`; el evento
   * sólo dice que lo hubo (texto libre: puede traer datos que no deben viajar).
   */
  async changeLifecycle(
    spaceId: string,
    dto: LifecycleChangeDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceDetailDto> {
    return this.em.transactional(async (tx) => {
      const { space, site } = await this.writableSpace(
        tx,
        spaceId,
        tenantId,
        actor,
        true,
      );
      assertIfMatch(ifMatch, space.rowVersion);
      const from = stateOf(space) ?? 'ACTIVE';
      const verdict = judgeTransition(from, dto.action, dto.reason);
      if (!verdict.ok) throw ruleException(verdict.reason, verdict.details);
      const to = verdict.to!;
      const siteSpaces = await this.spacesRepo.findBySite(tx, site.id);

      if (to === 'ACTIVE') {
        const parent = space.parentSpaceId
          ? siteSpaces.find((s) => s.id === space.parentSpaceId)
          : undefined;
        const allowed = judgeParentAllows(
          'ACTIVE',
          parent ? stateOf(parent) : null,
        );
        if (!allowed.ok) throw ruleException(allowed.reason, allowed.details);
      }
      if (to === 'SUSPENDED') {
        const active = siteSpaces.filter(
          (s) =>
            s.parentSpaceId === space.id &&
            s.statusConceptId === PRAC.SPACE_ACTIVE,
        );
        const b = blocker(
          'ACTIVE_CHILDREN',
          active.map((s) => s.id),
        );
        if (b) {
          throw conflict(
            PracticeErrorReason.SPACE_SUSPEND_BLOCKED,
            'El espacio tiene hijos activos',
            { blockers: [b] },
          );
        }
      }
      const now = new Date();
      if (to === 'RETIRED') {
        const blockers = await this.retireBlockers(tx, space, siteSpaces);
        if (blockers.length > 0) {
          throw conflict(
            PracticeErrorReason.SPACE_RETIRE_BLOCKED,
            'El espacio no se puede retirar todavía',
            {
              blockers,
              unverifiable: UNVERIFIABLE_SPACE_CHECKS,
            },
          );
        }
        space.validTo = now;
        for (const a of await this.assignmentsRepo.findCurrentBySpaces(tx, [
          space.id,
        ])) {
          a.validTo = now;
          touch(a, actor.id, now);
        }
      }
      if (to === 'ACTIVE' && !space.validFrom) space.validFrom = now;

      space.statusConceptId = SPACE_STATUS[to];
      space.operationalStatusConceptId = OPERATIONAL_FOR[to] ?? undefined;
      touch(space, actor.id, now);
      await flushStructure(tx);
      await this.historyRepo.append(tx, 'care_spaces', space.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: {
          ...this.snapshot(space),
          lifecycleAction: dto.action,
          lifecycleReason: dto.reason ?? null,
        },
        changedByUserId: actor.id,
        tenantId: space.tenantId,
      });
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.spaceLifecycleChanged,
        {
          tenantId: space.tenantId,
          aggregateId: space.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            spaceId: space.id,
            action: dto.action,
            from,
            to,
            reasonProvided: Boolean(dto.reason?.trim()),
            rowVersion: space.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.detail(tx, space, siteSpaces);
    });
  }

  // ------------------------------------------------------------- vínculos

  /** `POST /care-spaces/:id/unit-assignments`: un solo OWNER vigente. */
  async addAssignment(
    spaceId: string,
    dto: CreateUnitAssignmentDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SpaceUnitAssignmentDto> {
    return this.em.transactional(async (tx) => {
      const { space, site } = await this.writableSpace(
        tx,
        spaceId,
        tenantId,
        actor,
      );
      await this.sameSiteUnit(tx, site, dto.clinicalUnitId);
      const roleId = PRACTICE_CONCEPT_BY_CODE.get(dto.roleCode)!.id;
      const current = await this.assignmentsRepo.findCurrentBySpaces(tx, [
        space.id,
      ]);
      if (current.some((a) => a.clinicalUnitId === dto.clinicalUnitId)) {
        throw conflict(
          PracticeErrorReason.ASSIGNMENT_EXISTS,
          'La unidad ya está vinculada a este espacio',
          { clinicalUnitId: dto.clinicalUnitId },
        );
      }
      if (
        roleId === PRAC.SPACE_UNIT_ROLE_OWNER &&
        current.some((a) => a.roleConceptId === PRAC.SPACE_UNIT_ROLE_OWNER)
      ) {
        throw conflict(
          PracticeErrorReason.SPACE_OWNER_TAKEN,
          'El espacio ya tiene una unidad propietaria vigente',
          {},
        );
      }
      const assignment = this.assignmentsRepo.create(tx, {
        tenantId: space.tenantId,
        careSpaceId: space.id,
        clinicalUnitId: dto.clinicalUnitId,
        roleConceptId: roleId,
        validFrom: new Date(),
        actorUserId: actor.id,
      });
      await flushStructure(tx);
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.spaceUpdated,
        {
          tenantId: space.tenantId,
          aggregateId: space.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            spaceId: space.id,
            changes: ['assignments'],
            assignmentId: assignment.id,
            op: 'added',
            roleCode: dto.roleCode,
          },
        },
      );
      await flushStructure(tx);
      return toAssignment(assignment);
    });
  }

  /** `DELETE /care-spaces/:id/unit-assignments/:assignmentId`: cierra la vigencia. */
  async removeAssignment(
    spaceId: string,
    assignmentId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<{ ok: boolean }> {
    return this.em.transactional(async (tx) => {
      const { space, site } = await this.writableSpace(
        tx,
        spaceId,
        tenantId,
        actor,
        true,
      );
      const assignment = await this.assignmentsRepo.findById(tx, assignmentId);
      if (
        !assignment ||
        assignment.careSpaceId !== space.id ||
        assignment.tenantId !== tenantId ||
        assignment.validTo
      ) {
        throw new ResourceNotFoundException('Vínculo no encontrado', {
          assignmentId,
        });
      }
      assignment.validTo = new Date();
      touch(assignment, actor.id);
      await flushStructure(tx);
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.spaceUpdated,
        {
          tenantId: space.tenantId,
          aggregateId: space.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            spaceId: space.id,
            changes: ['assignments'],
            assignmentId,
            op: 'removed',
          },
        },
      );
      await flushStructure(tx);
      return { ok: true };
    });
  }

  // --------------------------------------------------------------- apoyo

  private async writableSite(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<PracticeSites> {
    const site = await this.access.requireSite(tx, siteId, tenantId);
    await this.access.assertCanWriteSite(tx, site, actor);
    if (site.statusConceptId !== PRAC.SITE_ACTIVE) {
      throw ruleException(PracticeErrorReason.SITE_NOT_ACTIVE, { siteId });
    }
    return site;
  }

  /** Espacio del tenant, su sede y autorización de escritura. */
  private async writableSpace(
    tx: EntityManager,
    spaceId: string,
    tenantId: string,
    actor: AuthenticatedUser,
    allowRetiredForLifecycle = false,
  ): Promise<{ space: CareSpaces; site: PracticeSites }> {
    const space = await this.access.requireSpace(tx, spaceId, tenantId);
    const site = await this.access.requireSite(
      tx,
      space.practiceSiteId,
      tenantId,
    );
    await this.access.assertCanWriteSite(tx, site, actor);
    if (
      !allowRetiredForLifecycle &&
      space.statusConceptId === PRAC.SPACE_RETIRED
    ) {
      throw ruleException(PracticeErrorReason.SPACE_RETIRED, { spaceId });
    }
    return { space, site };
  }

  /** Un espacio de la misma sede y no retirado, o 404 (no se dice de dónde es). */
  private sameSiteSpace(
    siteSpaces: readonly CareSpaces[],
    id: string,
    field: string,
  ): CareSpaces {
    const found = siteSpaces.find((s) => s.id === id);
    if (!found) {
      throw new ResourceNotFoundException(
        'Espacio no encontrado',
        { [field]: id },
        PracticeErrorReason.PARENT_NOT_FOUND,
      );
    }
    if (found.statusConceptId === PRAC.SPACE_RETIRED) {
      throw ruleException(PracticeErrorReason.PARENT_NOT_ACTIVE, {
        [field]: id,
        parentStatus: 'RETIRED',
      });
    }
    return found;
  }

  /** Una unidad de la misma sede y no retirada, o 404. */
  private async sameSiteUnit(
    tx: EntityManager,
    site: PracticeSites,
    unitId: string,
  ): Promise<ClinicalUnits> {
    const unit = await this.unitsRepo.findById(tx, unitId);
    if (
      !unit ||
      unit.practiceSiteId !== site.id ||
      unit.tenantId !== site.tenantId
    ) {
      throw new ResourceNotFoundException(
        'Unidad clínica no encontrada',
        { clinicalUnitId: unitId },
        PracticeErrorReason.UNIT_NOT_FOUND,
      );
    }
    if (unit.statusConceptId === PRAC.UNIT_RETIRED) {
      throw ruleException(PracticeErrorReason.CROSS_SITE_REFERENCE, {
        clinicalUnitId: unitId,
        status: 'RETIRED',
      });
    }
    return unit;
  }

  private async loadRules(
    tx: EntityManager,
    site: PracticeSites,
  ): Promise<RuleSet> {
    const [parentRules, typologyRules] = await Promise.all([
      this.rulesRepo.parentRules(tx),
      this.rulesRepo.typologyRules(tx),
    ]);
    return {
      parentRules,
      typologyRules,
      typologyCode: codeOf(site.facilityTypologyConceptId),
    };
  }

  /** Reglas de un alta; devuelve todos los errores, no sólo el primero. */
  private validateCandidate(
    c: SpaceCandidate,
    rules: RuleSet,
    existingCodes: ReadonlySet<string>,
  ): Array<FieldError & { details: Record<string, unknown> }> {
    const out: Array<FieldError & { details: Record<string, unknown> }> = [];
    if (existingCodes.has(c.code)) {
      out.push({
        field: 'code',
        reason: PracticeErrorReason.SPACE_CODE_TAKEN,
        details: { code: c.code },
      });
    }
    if (!formIdOf(c.formCode)) {
      out.push({
        field: 'formCode',
        reason: PracticeErrorReason.SPACE_UNKNOWN_CODE,
        details: { formCode: c.formCode },
      });
      return out;
    }
    const form = c.formCode as FormCode;
    for (const [field, verdict] of [
      ['functionCode', judgeFunctionForm(c.functionCode, form)],
      [
        'parentSpaceId',
        judgeParentChild(
          c.parent ? c.parent.form : null,
          form,
          rules.parentRules,
        ),
      ],
      [
        'functionCode',
        judgeTypology(rules.typologyCode, c.functionCode, rules.typologyRules),
      ],
      [
        'parentSpaceId',
        judgeParentAllows(c.target, c.parent ? c.parent.state : null),
      ],
    ] as const) {
      if (!verdict.ok)
        out.push({ field, reason: verdict.reason, details: verdict.details });
    }
    return out;
  }

  /** Lanza el primer error: 409 si es de código, 422 si es de regla. */
  private throwFirst(
    errors: Array<FieldError & { details?: Record<string, unknown> }>,
    context: Record<string, unknown>,
  ): void {
    const first = errors[0];
    if (!first) return;
    if (first.reason === String(PracticeErrorReason.SPACE_CODE_TAKEN)) {
      throw conflict(
        PracticeErrorReason.SPACE_CODE_TAKEN,
        'Ya existe un espacio con ese código en la sede',
        { ...context, ...first.details },
      );
    }
    throw ruleException(first.reason, { ...context, ...first.details });
  }

  private insert(
    tx: EntityManager,
    site: PracticeSites,
    data: {
      code: string;
      name: string;
      formCode: string;
      functionCode: string;
      parentSpaceId?: string;
      clinicalUnitId?: string;
      target: LifecycleState;
      attrs: SpaceAttributeColumns;
      actorId: string;
    },
  ): CareSpaces {
    const a = data.attrs;
    const op = OPERATIONAL_FOR[data.target];
    return this.spacesRepo.create(tx, {
      tenantId: site.tenantId,
      practiceSiteId: site.id,
      parentSpaceId: data.parentSpaceId,
      clinicalUnitId: data.clinicalUnitId,
      code: data.code,
      name: data.name,
      formConceptId: formIdOf(data.formCode),
      spaceTypeConceptId: functionIdOf(data.functionCode)!,
      statusConceptId: SPACE_STATUS[data.target],
      operationalStatusConceptId: op ?? undefined,
      validFrom: data.target === 'ACTIVE' ? new Date() : undefined,
      capacity: a.capacity ?? undefined,
      description: a.description ?? undefined,
      floorNumber: a.floorNumber ?? undefined,
      areaM2: a.areaM2 ?? undefined,
      asepsisConceptId: a.asepsisConceptId ?? undefined,
      pressureConceptId: a.pressureConceptId ?? undefined,
      airChangesPerHour: a.airChangesPerHour ?? undefined,
      hvacValidatedOn: a.hvacValidatedOn ?? undefined,
      sexRestrictionConceptId: a.sexRestrictionConceptId ?? undefined,
      ageGroupConceptId: a.ageGroupConceptId ?? undefined,
      bedCategoryConceptId: a.bedCategoryConceptId ?? undefined,
      censable: a.censable ?? undefined,
      gln: a.gln ?? undefined,
      prepMinutes: a.prepMinutes ?? undefined,
      cleanupMinutes: a.cleanupMinutes ?? undefined,
      actorUserId: data.actorId,
    });
  }

  private async sealCreated(
    tx: EntityManager,
    space: CareSpaces,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await appendStructureRevision(
      this.historyRepo,
      tx,
      'space',
      space,
      AUD.OPERATION_INSERT,
      actor.id,
    );
    await publishStructureEvent(
      this.outbox,
      tx,
      STRUCTURE_EVENTS.spaceCreated,
      {
        tenantId: space.tenantId,
        aggregateId: space.id,
        actorUserId: actor.id,
        payload: {
          siteId: space.practiceSiteId,
          spaceId: space.id,
          parentId: space.parentSpaceId ?? null,
          code: space.code,
          formCode: codeOf(space.formConceptId),
          functionCode: codeOf(space.spaceTypeConceptId),
          statusCode: codeOf(space.statusConceptId),
          rowVersion: space.rowVersion ?? 1,
        },
      },
    );
  }

  /** Bloqueos de retiro: hijos no retirados + lo que vive en otros módulos. */
  private async retireBlockers(
    tx: EntityManager,
    space: CareSpaces,
    siteSpaces?: readonly CareSpaces[],
  ): Promise<Blocker[]> {
    const all =
      siteSpaces ?? (await this.spacesRepo.findChildren(tx, space.id));
    const children = all.filter(
      (s) =>
        s.parentSpaceId === space.id &&
        s.statusConceptId !== PRAC.SPACE_RETIRED,
    );
    const ext = await this.blockersRepo.forSpace(tx, space.id);
    return [
      blocker(
        'ACTIVE_CHILDREN',
        children.map((c) => c.id),
      ),
      blocker(
        'ACTIVE_ENCOUNTER',
        ext.activeEncounters.sampleIds,
        ext.activeEncounters.count,
      ),
      blocker(
        'FUTURE_PROCEDURE',
        ext.futureProcedures.sampleIds,
        ext.futureProcedures.count,
      ),
      blocker(
        'FUTURE_BOOKING',
        ext.futureBookings.sampleIds,
        ext.futureBookings.count,
      ),
      blocker(
        'SCHEDULABLE_RESOURCE',
        ext.schedulableResources.sampleIds,
        ext.schedulableResources.count,
      ),
      blocker(
        'INVENTORY_LOCATION',
        ext.inventoryLocations.sampleIds,
        ext.inventoryLocations.count,
      ),
    ].filter((b): b is Blocker => b !== null);
  }

  private snapshot(space: CareSpaces): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(space).filter(
        ([k, v]) => !k.startsWith('__') && typeof v !== 'function',
      ),
    );
  }

  private async detail(
    tx: EntityManager,
    space: CareSpaces,
    siteSpaces: readonly CareSpaces[],
  ): Promise<CareSpaceDetailDto> {
    const assignments = await this.assignmentsRepo.findCurrentBySpaces(tx, [
      space.id,
    ]);
    const others = siteSpaces.filter((s) => s.id !== space.id);
    return toSpaceDetail(space, [...others, space], assignments);
  }
}
