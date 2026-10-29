import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import type { CareSpaces, PracticeSites } from '../entities';
import { ATTRIBUTES, REGULATORY } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { conceptIdOf, HYGIENE, INITIAL_HYGIENE } from '../ops-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  InfrastructureRulesRepository,
  SpaceUnitAssignmentsRepository,
} from '../repositories';
import type { CareSpaceDetail } from '../dto/infrastructure.types';
import { withVersionConflict } from '../http/row-version';
import { CareSpaceReadService } from './care-space-read.service';
import {
  MAX_BATCH_SIZE,
  PARENT_OPEN_STATUSES,
  PatternError,
  checkFunctionProfile,
  checkParentRule,
  checkTypology,
  expandBulkPattern,
  missingForActivation,
  resolveAttributes,
  resolveShape,
  type FieldError,
  type RuleSet,
  type SpaceAttributesInput,
} from './infrastructure-rules';
import { practiceOutOfScope } from './practice-scope';
import { StructureContextService } from './structure-context.service';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';
import { mapReferenceViolation } from './structure-errors';

/** `reason` de código repetido, como texto: `FieldError.reason` mezcla motivos del enum y de formato. */
const CODE_TAKEN: string = PracticeErrorReason.SPACE_CODE_TAKEN;

/** Un espacio a crear, en los términos del cuerpo del contrato. */
export interface SpaceInput extends SpaceAttributesInput {
  /** Código único en el establecimiento. */
  code: string;
  /** Nombre. */
  name: string;
  /** Forma (`LOC_FORM_*`); por omisión `LOC_FORM_ROOM`. */
  formCode?: string;
  /** Función; por omisión la genérica (`SPACE_TYPE_ROOM`). */
  functionCode?: string;
  /** Espacio padre por id. */
  parentSpaceId?: string | null;
  /** Espacio padre por código (importación). */
  parentCode?: string | null;
  /** Unidad clínica propietaria. */
  clinicalUnitId?: string | null;
  /** Activar al crear (sólo alta individual). */
  activate?: boolean;
}

/** Cómo se resolvió el padre de una fila. */
interface ParentResolution {
  /** Id del padre ya persistido; ausente si el padre es otra fila del mismo lote. */
  readonly id?: string;
  /** Forma del padre. */
  readonly formConceptId: string | null;
  /** Estado del padre. */
  readonly statusConceptId: string;
}

/** Contexto común de validación de un lote. */
interface BatchContext {
  readonly site: PracticeSites;
  readonly tenantId: string;
  readonly rules: RuleSet;
  /** Códigos que ya existen en la sede. */
  readonly takenCodes: ReadonlySet<string>;
  /** Unidades de la sede por id (para validar `clinicalUnitId`). */
  readonly unitsById: ReadonlyMap<string, { statusConceptId: string }>;
  /** Cómo resolver el padre de una fila. */
  readonly resolveParent: (row: SpaceInput) => ParentResolution | FieldError;
}

/** Fila validada y lista para insertar. */
interface PreparedRow {
  readonly input: SpaceInput;
  readonly formConceptId: string;
  readonly functionConceptId: string;
  readonly formCode: string;
  readonly attrs: Record<string, string | null>;
  readonly parent: ParentResolution;
  readonly activate: boolean;
}

/**
 * Alta de espacios: individual, masiva por patrón e importación con validación
 * en seco (CONTRATO-F0-F1 §3, `procesos/01`).
 *
 * Las tres vías comparten **una** validación (`validateRow`), de modo que un
 * espacio no puede entrar por el lote con una regla que el alta individual
 * rechaza (`procesos/01`, «DEBE»: padre→hijo, perfil de función y tipología en
 * todas las vías). El lote y la importación son todo o nada (INV-17).
 */
@Injectable()
export class CareSpaceCreationService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza la sede.
   * @param spacesRepo - Espacios.
   * @param unitsRepo - Unidades.
   * @param rulesRepo - Reglas padre→hijo y de tipología.
   * @param assignmentsRepo - Vínculos espacio ↔ unidad.
   * @param historyRepo - Historia append-only.
   * @param events - Outbox transaccional.
   * @param reader - Arma el detalle de respuesta.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly rulesRepo: InfrastructureRulesRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly events: StructureEventsService,
    private readonly reader: CareSpaceReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareSpaceCreationService.name);
  }

  /**
   * `POST /sites/:siteId/care-spaces`: un espacio, `SPACE_PLANNED` salvo `activate:true`.
   *
   * @param siteId - Establecimiento.
   * @param input - Cuerpo.
   * @param actor - Quien lo crea.
   * @param correlationId - Id de correlación de la petición.
   * @returns `CareSpaceDetail` del espacio creado.
   */
  async create(
    siteId: string,
    input: SpaceInput,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<CareSpaceDetail> {
    this.logger.info(
      { operation: 'practice.space.create', siteId },
      'Creating care space',
    );
    return this.em.transactional(async (tx) => {
      const scope = await this.context.site(tx, siteId, actor, 'write');
      this.context.assertSiteActive(scope.site);
      const batch = await this.batchContext(tx, scope.site, scope.tenantId, [
        input,
      ]);
      const prepared = this.validateRow(input, batch, 0);
      if (prepared.errors.length > 0) throw this.toException(prepared.errors);
      const created = await this.insertRows(
        tx,
        [prepared.row!],
        scope.site,
        scope.tenantId,
        actor,
        correlationId,
      );
      return (
        await this.reader.detailsOf(tx, [created[0].space], { fresh: true })
      )[0];
    });
  }

  /**
   * `POST /sites/:siteId/care-spaces/bulk`: expande el patrón y crea todo o nada.
   *
   * @param siteId - Establecimiento.
   * @param body - Padre, forma, función, patrones y atributos comunes.
   * @param actor - Quien lo crea.
   * @param correlationId - Id de correlación de la petición.
   * @returns Los espacios creados.
   */
  async bulk(
    siteId: string,
    body: Omit<SpaceInput, 'code' | 'name' | 'activate'> & {
      codePattern: string;
      namePattern: string;
    },
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<{ created: CareSpaceDetail[] }> {
    return this.em.transactional(async (tx) => {
      const scope = await this.context.site(tx, siteId, actor, 'write');
      this.context.assertSiteActive(scope.site);
      let expanded;
      try {
        expanded = expandBulkPattern(body.codePattern, body.namePattern);
      } catch (error) {
        if (error instanceof PatternError) {
          throw new PreconditionFailedException(
            error.message,
            {
              errors: [
                {
                  field: error.field,
                  reason: PracticeErrorReason.SPACE_BULK_PATTERN_INVALID,
                },
              ],
            },
            PracticeErrorReason.SPACE_BULK_PATTERN_INVALID,
          );
        }
        throw error;
      }
      if (expanded.length > MAX_BATCH_SIZE) {
        throw new PreconditionFailedException(
          `El alta masiva admite hasta ${MAX_BATCH_SIZE} espacios`,
          undefined,
          PracticeErrorReason.SPACE_BULK_LIMIT,
        );
      }
      const { codePattern: _c, namePattern: _n, ...common } = body;
      const rows: SpaceInput[] = expanded.map((item) => ({
        ...common,
        ...item,
      }));
      const batch = await this.batchContext(
        tx,
        scope.site,
        scope.tenantId,
        rows,
      );
      const errors: { line: number; errors: FieldError[] }[] = [];
      const prepared: PreparedRow[] = [];
      rows.forEach((row, index) => {
        const result = this.validateRow(row, batch, index);
        if (result.errors.length > 0)
          errors.push({ line: index + 1, errors: result.errors });
        else prepared.push(result.row!);
      });
      if (errors.length > 0) {
        throw new PreconditionFailedException(
          'Alguna fila del lote no cumple las reglas; no se creó ninguna',
          {
            rows: errors.map((e) => ({
              line: e.line,
              errors: e.errors.map(({ field, reason }) => ({ field, reason })),
            })),
          },
          errors.every((e) => e.errors.every((x) => x.reason === CODE_TAKEN))
            ? PracticeErrorReason.SPACE_CODE_TAKEN
            : PracticeErrorReason.SPACE_BATCH_INVALID,
        );
      }
      const created = await this.insertRows(
        tx,
        prepared,
        scope.site,
        scope.tenantId,
        actor,
        correlationId,
      );
      const details = await this.reader.detailsOf(
        tx,
        created.map((c) => c.space),
        { fresh: true },
      );
      return { created: details };
    });
  }

  /**
   * `POST /sites/:siteId/care-spaces/import`: valida las filas y, con `dryRun=false`, las crea.
   *
   * La importación revalida siempre: el estado pudo cambiar entre el `dryRun` y
   * la carga definitiva. El número de línea es el que el cliente mandó en
   * `line` (o la posición de la fila, desde 1).
   *
   * @param siteId - Establecimiento.
   * @param rows - Filas ya parseadas por el cliente.
   * @param dryRun - `true`: no persiste nada.
   * @param actor - Quien importa.
   * @param correlationId - Id de correlación de la petición.
   * @returns Resultado por línea y, si se importó, cuántos se crearon.
   */
  async import(
    siteId: string,
    rows: ReadonlyArray<SpaceInput & { line?: number }>,
    dryRun: boolean,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<import('../dto/infrastructure.types').ImportResult> {
    return this.em.transactional(async (tx) => {
      const scope = await this.context.site(tx, siteId, actor, 'write');
      this.context.assertSiteActive(scope.site);
      if (rows.length === 0 || rows.length > MAX_BATCH_SIZE) {
        throw new PreconditionFailedException(
          `La importación admite de 1 a ${MAX_BATCH_SIZE} filas`,
          undefined,
          PracticeErrorReason.SPACE_BULK_LIMIT,
        );
      }
      // La importación nunca activa: los espacios nacen planificados y se
      // activan uno a uno (el padre tiene que estar activo antes que el hijo).
      rows = rows.map((row) => ({ ...row, activate: false }));
      const batch = await this.importContext(
        tx,
        scope.site,
        scope.tenantId,
        rows,
      );
      const results = rows.map((row, index) => ({
        line: row.line ?? index + 1,
        outcome: this.validateRow(row, batch, index),
      }));
      const duplicates = this.fileErrors(
        rows,
        results.map((r) => r.line),
      );
      const lines = results.map((entry, index) => {
        const errors = [
          ...entry.outcome.errors,
          ...(duplicates.get(index) ?? []),
        ];
        return {
          line: entry.line,
          status: errors.length === 0 ? ('ok' as const) : ('error' as const),
          errors: errors.map(({ field, reason }) => ({ field, reason })),
        };
      });
      const ok = lines.every((l) => l.status === 'ok');
      if (dryRun || !ok) return { ok, rows: lines };

      const prepared = results.map((r) => r.outcome.row!);
      const created = await this.insertRows(
        tx,
        prepared,
        scope.site,
        scope.tenantId,
        actor,
        correlationId,
        rows.map((row) => row.code),
      );
      return { ok: true, rows: lines, created: created.length };
    });
  }

  /** Errores que sólo se ven mirando el archivo entero: código repetido y ciclos de `parentCode`. */
  private fileErrors(
    rows: ReadonlyArray<SpaceInput>,
    _lines: number[],
  ): Map<number, FieldError[]> {
    const errors = new Map<number, FieldError[]>();
    const add = (index: number, error: FieldError): void => {
      errors.set(index, [...(errors.get(index) ?? []), error]);
    };
    const firstSeen = new Map<string, number>();
    rows.forEach((row, index) => {
      const code = row.code?.trim();
      if (!code) return;
      if (firstSeen.has(code)) {
        add(index, {
          field: 'code',
          reason: PracticeErrorReason.SPACE_CODE_TAKEN,
          message: `El código ${code} está repetido en el archivo`,
        });
      } else firstSeen.set(code, index);
    });
    // Ciclo: la cadena de `parentCode` vuelve a la misma fila.
    const byCode = new Map(
      rows.map((row, index) => [row.code?.trim(), index] as const),
    );
    rows.forEach((row, index) => {
      const seen = new Set<number>([index]);
      let cursor: SpaceInput | undefined = row;
      while (cursor?.parentCode) {
        const next = byCode.get(cursor.parentCode.trim());
        if (next === undefined) return;
        if (seen.has(next)) {
          add(index, {
            field: 'parentCode',
            reason: PracticeErrorReason.SPACE_CYCLE,
            message: 'El padre indicado forma un ciclo',
          });
          return;
        }
        seen.add(next);
        cursor = rows[next];
      }
    });
    return errors;
  }

  /** Contexto de validación para el alta individual y el lote (padre por id). */
  private async batchContext(
    tx: EntityManager,
    site: PracticeSites,
    tenantId: string,
    rows: readonly SpaceInput[],
  ): Promise<BatchContext> {
    const [rules, taken, units] = await Promise.all([
      this.rulesRepo.loadRuleSet(tx),
      this.spacesRepo.takenCodes(
        tx,
        site.id,
        rows.map((r) => r.code?.trim() ?? ''),
      ),
      this.unitsRepo.findBySite(tx, site.id),
    ]);
    const parentIds = [
      ...new Set(
        rows
          .map((r) => r.parentSpaceId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const parents = new Map<string, CareSpaces>();
    for (const id of parentIds) {
      const parent = await this.spacesRepo.findByIdInTenant(tx, id, tenantId);
      if (!parent) throw practiceOutOfScope('Espacio padre no encontrado');
      parents.set(id, parent);
    }
    return {
      site,
      tenantId,
      rules,
      takenCodes: taken,
      unitsById: new Map(units.map((u) => [u.id, u])),
      resolveParent: (row) => {
        if (!row.parentSpaceId)
          return { formConceptId: null, statusConceptId: PRAC.SPACE_ACTIVE };
        const parent = parents.get(row.parentSpaceId)!;
        if (parent.practiceSiteId !== site.id) {
          return {
            field: 'parentSpaceId',
            reason: PracticeErrorReason.PARENT_SITE_MISMATCH,
            message: 'El espacio padre es de otro establecimiento',
          };
        }
        return {
          id: parent.id,
          formConceptId: parent.formConceptId ?? null,
          statusConceptId: parent.statusConceptId,
        };
      },
    };
  }

  /** Contexto de validación de la importación: el padre se referencia por código. */
  private async importContext(
    tx: EntityManager,
    site: PracticeSites,
    tenantId: string,
    rows: readonly SpaceInput[],
  ): Promise<BatchContext> {
    const codes = rows.map((r) => r.code?.trim() ?? '');
    const [rules, taken, units, siteSpaces] = await Promise.all([
      this.rulesRepo.loadRuleSet(tx),
      this.spacesRepo.takenCodes(tx, site.id, codes),
      this.unitsRepo.findBySite(tx, site.id),
      this.spacesRepo.findBySite(tx, site.id),
    ]);
    const existingByCode = new Map(siteSpaces.map((s) => [s.code, s]));
    const fileByCode = new Map(rows.map((r) => [r.code?.trim(), r] as const));
    return {
      site,
      tenantId,
      rules,
      takenCodes: taken,
      unitsById: new Map(units.map((u) => [u.id, u])),
      resolveParent: (row) => {
        const code = row.parentCode?.trim();
        if (!code && !row.parentSpaceId)
          return { formConceptId: null, statusConceptId: PRAC.SPACE_ACTIVE };
        if (!code) {
          const byId = siteSpaces.find((s) => s.id === row.parentSpaceId);
          return byId
            ? {
                id: byId.id,
                formConceptId: byId.formConceptId ?? null,
                statusConceptId: byId.statusConceptId,
              }
            : {
                field: 'parentSpaceId',
                reason: PracticeErrorReason.PARENT_SITE_MISMATCH,
                message: 'Padre no encontrado en el establecimiento',
              };
        }
        const inFile = fileByCode.get(code);
        if (inFile) {
          const shape = resolveShape(inFile.formCode, inFile.functionCode);
          return {
            formConceptId: shape.form?.id ?? null,
            statusConceptId: PRAC.SPACE_PLANNED,
          };
        }
        const existing = existingByCode.get(code);
        if (existing) {
          return {
            id: existing.id,
            formConceptId: existing.formConceptId ?? null,
            statusConceptId: existing.statusConceptId,
          };
        }
        return {
          field: 'parentCode',
          reason: PracticeErrorReason.SPACE_PARENT_RULE,
          message: `No existe el padre ${code}`,
        };
      },
    };
  }

  /**
   * Valida una fila contra todas las reglas (INV-04, 05, 06, 08, padre abierto,
   * unidad de la sede, atributos). Devuelve **todos** los errores de la fila.
   */
  private validateRow(
    input: SpaceInput,
    batch: BatchContext,
    _index: number,
  ): { errors: FieldError[]; row?: PreparedRow } {
    const errors: FieldError[] = [];
    const code = input.code?.trim();
    if (!code)
      errors.push({
        field: 'code',
        reason: 'REQUIRED',
        message: 'El código es obligatorio',
      });
    if (!input.name?.trim())
      errors.push({
        field: 'name',
        reason: 'REQUIRED',
        message: 'El nombre es obligatorio',
      });
    if (code && batch.takenCodes.has(code)) {
      errors.push({
        field: 'code',
        reason: PracticeErrorReason.SPACE_CODE_TAKEN,
        message: `El código ${code} ya existe en el establecimiento`,
      });
    }

    const shape = resolveShape(input.formCode, input.functionCode);
    errors.push(...shape.errors);
    const attributes = resolveAttributes(input);
    errors.push(...attributes.errors);

    const parent = batch.resolveParent(input);
    if ('reason' in parent) errors.push(parent);

    if (shape.form && shape.fn && !('reason' in parent)) {
      const resolvedShape = {
        form: shape.form,
        fn: shape.fn,
        parentFormId: parent.formConceptId,
      };
      const checks = [
        checkParentRule(batch.rules, resolvedShape),
        checkFunctionProfile(resolvedShape),
        checkTypology(
          batch.rules,
          batch.site.facilityTypologyConceptId,
          shape.fn,
        ),
      ];
      for (const check of checks) if (check) errors.push(check);
      if (parent.formConceptId !== null || parent.id) {
        if (!PARENT_OPEN_STATUSES.has(parent.statusConceptId)) {
          errors.push({
            field: 'parentSpaceId',
            reason: PracticeErrorReason.PARENT_NOT_ACTIVE,
            message:
              'El padre está suspendido o clausurado: reactivalo o elegí otro',
          });
        }
      }
    }

    if (input.clinicalUnitId) {
      const unit = batch.unitsById.get(input.clinicalUnitId);
      if (!unit) {
        errors.push({
          field: 'clinicalUnitId',
          reason: PracticeErrorReason.UNIT_SITE_MISMATCH,
          message: 'La unidad no es de este establecimiento',
        });
      } else if (unit.statusConceptId === PRAC.UNIT_RETIRED) {
        errors.push({
          field: 'clinicalUnitId',
          reason: PracticeErrorReason.UNIT_NOT_AVAILABLE,
          message: 'La unidad está clausurada',
        });
      }
    }

    const activate = Boolean(input.activate);
    if (activate && shape.form && shape.fn && !('reason' in parent)) {
      if (parent.id && parent.statusConceptId !== PRAC.SPACE_ACTIVE) {
        errors.push({
          field: 'activate',
          reason: PracticeErrorReason.PARENT_NOT_ACTIVE,
          message: 'No se activa un hijo con el padre sin activar',
        });
      }
      errors.push(
        ...missingForActivation({
          fn: shape.fn,
          form: shape.form,
          areaM2: input.areaM2,
          pressureConceptId: attributes.resolved.pressureConceptId,
          airChangesPerHour: input.airChangesPerHour,
          hvacValidatedOn: input.hvacValidatedOn,
          bedCategoryConceptId: attributes.resolved.bedCategoryConceptId,
          censable: input.censable,
        }),
      );
    }

    if (errors.length > 0 || !shape.form || !shape.fn || 'reason' in parent)
      return { errors };
    return {
      errors,
      row: {
        input,
        formConceptId: shape.form.id,
        functionConceptId: shape.fn.id,
        formCode: shape.form.code,
        attrs: attributes.resolved,
        parent,
        activate,
      },
    };
  }

  /** Persiste las filas validadas: padres antes que hijos, historia y evento por espacio. */
  private async insertRows(
    tx: EntityManager,
    rows: readonly PreparedRow[],
    site: PracticeSites,
    tenantId: string,
    actor: AuthenticatedUser,
    correlationId: string | undefined,
    keys?: readonly (string | undefined)[],
  ): Promise<{ space: CareSpaces; assignmentId?: string }[]> {
    const now = new Date();
    const byCode = new Map<string, CareSpaces>();
    const out: { space: CareSpaces; assignmentId?: string }[] = [];
    // Profundidad dentro del lote: una fila cuyo padre es otra fila del lote va después.
    const index = new Map<string, number>();
    rows.forEach((row, i) =>
      index.set((keys?.[i] ?? row.input.code).trim(), i),
    );
    const depthOf = (i: number, guard = 0): number => {
      const parentCode = rows[i].input.parentCode?.trim();
      const parentIndex = parentCode ? index.get(parentCode) : undefined;
      return parentIndex === undefined || guard > rows.length
        ? 0
        : 1 + depthOf(parentIndex, guard + 1);
    };
    const order = rows
      .map((_row, i) => i)
      .sort((a, b) => depthOf(a) - depthOf(b));

    let level = -1;
    for (const i of order) {
      const row = rows[i];
      const depth = depthOf(i);
      if (depth !== level) {
        await this.flushCreated(tx);
        level = depth;
      }
      const parentCode = row.input.parentCode?.trim();
      const parentId =
        row.parent.id ?? (parentCode ? byCode.get(parentCode)?.id : undefined);
      const space = this.spacesRepo.create(tx, {
        practiceSiteId: site.id,
        tenantId,
        code: row.input.code.trim(),
        name: row.input.name.trim(),
        spaceTypeConceptId: row.functionConceptId,
        formConceptId: row.formConceptId,
        parentSpaceId: parentId,
        clinicalUnitId: row.input.clinicalUnitId ?? undefined,
        capacity: row.input.capacity ?? undefined,
        description: row.input.description ?? undefined,
        floorNumber: row.input.floorNumber ?? undefined,
        areaM2: row.input.areaM2 == null ? undefined : String(row.input.areaM2),
        asepsisConceptId: row.attrs.asepsisConceptId ?? undefined,
        pressureConceptId: row.attrs.pressureConceptId ?? undefined,
        airChangesPerHour:
          row.input.airChangesPerHour == null
            ? undefined
            : String(row.input.airChangesPerHour),
        hvacValidatedOn: row.input.hvacValidatedOn
          ? new Date(row.input.hvacValidatedOn)
          : undefined,
        sexRestrictionConceptId: row.attrs.sexRestrictionConceptId ?? undefined,
        ageGroupConceptId: row.attrs.ageGroupConceptId ?? undefined,
        bedCategoryConceptId: row.attrs.bedCategoryConceptId ?? undefined,
        censable: row.input.censable ?? undefined,
        prepMinutes: row.input.prepMinutes ?? undefined,
        cleanupMinutes: row.input.cleanupMinutes ?? undefined,
        gln: row.input.gln ?? undefined,
        statusConceptId: row.activate ? PRAC.SPACE_ACTIVE : PRAC.SPACE_PLANNED,
        validFrom: row.activate ? now : undefined,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        // F2: un espacio que nace activo está listo para usar. La inspección
        // (`infra.inspection_required`) sólo rige tras una orden de limpieza.
        ...(row.activate
          ? {
              hygieneStatusConceptId: conceptIdOf(HYGIENE, INITIAL_HYGIENE),
              hygieneChangedAt: now,
            }
          : {}),
        actorUserId: actor.id,
      });
      byCode.set(space.code, space);
      out[i] = { space };
    }
    await this.flushCreated(tx);

    for (const i of order) {
      const entry = out[i];
      const space = entry.space;
      let assignmentId: string | undefined;
      if (rows[i].input.clinicalUnitId) {
        const assignment = this.assignmentsRepo.create(tx, {
          tenantId,
          careSpaceId: space.id,
          clinicalUnitId: rows[i].input.clinicalUnitId,
          roleConceptId: ATTRIBUTES.unitRole.byInput('SPACE_UNIT_ROLE_OWNER')!
            .id,
          validFrom: now,
          actorUserId: actor.id,
        });
        assignmentId = assignment.id;
        entry.assignmentId = assignmentId;
      }
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, space.id, {
        operationConceptId: AUD.OPERATION_INSERT,
        dataSnapshot: structureSnapshot(space),
        changedByUserId: actor.id,
        tenantId,
        firstRevision: true,
      });
    }
    await this.flushCreated(tx);

    for (const i of order) {
      const space = out[i].space;
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.spaceCreated,
        aggregateType: 'care_space',
        aggregateId: space.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          careSpaceId: space.id,
          practiceSiteId: site.id,
          parentSpaceId: space.parentSpaceId ?? null,
          code: space.code,
          formCode: rows[i].formCode,
          status: rows[i].activate ? 'SPACE_ACTIVE' : 'SPACE_PLANNED',
          rowVersion: space.rowVersion,
        },
      });
    }
    return out;
  }

  /** `flush` que traduce la violación de FK compuesta por tenant al 404 uniforme. */
  private flushCreated(tx: EntityManager): Promise<void> {
    return withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
  }

  /** Primer error → excepción con el status que corresponde a su motivo. */
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

  /** Tipología del establecimiento como entrada de catálogo (para mensajes). */
  typologyOf(site: PracticeSites): string | undefined {
    return REGULATORY.typology.byConceptId(site.facilityTypologyConceptId)
      ?.code;
  }
}
