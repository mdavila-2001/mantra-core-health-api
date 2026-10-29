import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ATTRIBUTES,
  CAPACITY_DERIVATIONS,
  FORMS,
  FUNCTIONS,
  REGULATORY,
  type CapacityDerivation,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  InfrastructureRulesRepository,
  SiteDeclaredCapacitiesRepository,
} from '../repositories';
import { StructureContextService } from './structure-context.service';
import { mapReferenceViolation } from './structure-errors';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { isoDate } from './structure-mapper';

/** Capacidad declarada vigente de un tipo. */
export interface DeclaredCapacityView {
  readonly kindCode: string;
  readonly quantity: number;
  readonly asOf: string;
  readonly resolutionNumber: string | null;
}

/** Función exigida por la tipología que el establecimiento todavía no tiene activa. */
export interface CapacityWarning {
  readonly kind: 'TYPOLOGY_REQUIRED_MISSING';
  readonly functionCode: string;
  readonly typologyCode: string;
}

/** `GET /sites/:siteId/capacity`. */
export interface SiteCapacity {
  readonly declared: DeclaredCapacityView[];
  readonly derived: { kindCode: string; quantity: number }[];
  /** Tipos con capacidad declarada distinta de la derivada: se reporta, no se corrige (INV-20). */
  readonly gaps: { kindCode: string; declared: number; derived: number }[];
  /** Advertencias de tipología (`TYPO_REQUIRED`): no bloquean, un hospital se construye de a poco. */
  readonly warnings: CapacityWarning[];
  /** Instante del cálculo (ISO) para el estado S7. */
  readonly asOf: string;
}

/** Cuerpo de `POST /sites/:siteId/declared-capacities`. */
export interface DeclaredCapacityInput {
  capacityKindCode: string;
  quantity: number;
  asOf: string;
  resolutionNumber?: string;
  validTo?: string;
}

/**
 * Capacidad declarada vs. derivada del establecimiento (`procesos/03`, flujo C).
 *
 * La capacidad **real** se cuenta (espacios activos por tipo) y nunca se escribe
 * a mano; la **declarada** ante el SEDES se guarda aparte con fecha de corte y
 * resolución, y la diferencia se reporta (INV-20).
 */
@Injectable()
export class SiteCapacityService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param declaredRepo - Declaraciones.
   * @param rulesRepo - Reglas de tipología (para las advertencias).
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly declaredRepo: SiteDeclaredCapacitiesRepository,
    private readonly rulesRepo: InfrastructureRulesRepository,
    private readonly events: StructureEventsService,
  ) {}

  /**
   * `GET /sites/:siteId/capacity`.
   *
   * @param siteId - Establecimiento.
   * @param actor - Quien lee.
   * @returns Declarada, derivada, brechas y advertencias.
   */
  async get(siteId: string, actor: AuthenticatedUser): Promise<SiteCapacity> {
    return this.em.transactional(async (tx) => {
      const { site } = await this.context.site(tx, siteId, actor, 'read');
      const now = new Date();
      const today = now.toISOString().slice(0, 10);

      const rows = await this.declaredRepo.findBySite(tx, site.id);
      const latest = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        const asOf = isoDate(row.asOf)!;
        const validTo = isoDate(row.validTo);
        if (asOf > today || (validTo !== null && validTo < today)) continue;
        const current = latest.get(row.capacityKindConceptId);
        // `findBySite` ya viene de la más reciente a la más vieja.
        if (!current) latest.set(row.capacityKindConceptId, row);
      }
      const declared: DeclaredCapacityView[] = [...latest.values()].map(
        (row) => ({
          kindCode:
            REGULATORY.capacityKind.byConceptId(row.capacityKindConceptId)
              ?.code ?? row.capacityKindConceptId,
          quantity: row.quantity,
          asOf: isoDate(row.asOf)!,
          resolutionNumber: row.resolutionNumber ?? null,
        }),
      );

      const derivedByKind = await this.derive(tx, site.id);
      const derived = REGULATORY.capacityKind.codes().map((kindCode) => ({
        kindCode,
        quantity: derivedByKind.get(kindCode) ?? 0,
      }));
      const gaps = declared
        .map((d) => ({
          kindCode: d.kindCode,
          declared: d.quantity,
          derived: derivedByKind.get(d.kindCode) ?? 0,
        }))
        .filter((gap) => gap.declared !== gap.derived);

      return {
        declared,
        derived,
        gaps,
        warnings: await this.warnings(
          tx,
          site.id,
          site.facilityTypologyConceptId,
        ),
        asOf: now.toISOString(),
      };
    });
  }

  /**
   * `POST /sites/:siteId/declared-capacities`: agrega una declaración (no
   * sobrescribe las anteriores).
   *
   * @param siteId - Establecimiento.
   * @param input - Tipo, cantidad, fecha de corte y resolución.
   * @param actor - Quien la registra.
   * @param correlationId - Id de correlación.
   * @returns La declaración registrada.
   */
  async declare(
    siteId: string,
    input: DeclaredCapacityInput,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<DeclaredCapacityView & { id: string; validTo: string | null }> {
    return this.em.transactional(async (tx) => {
      const { site, tenantId } = await this.context.site(
        tx,
        siteId,
        actor,
        'regulatory',
      );
      const kind = REGULATORY.capacityKind.byInput(input.capacityKindCode);
      if (!kind) {
        throw new PreconditionFailedException(
          `Tipo de capacidad desconocido: ${input.capacityKindCode}`,
          {
            errors: [
              {
                field: 'capacityKindCode',
                reason: PracticeErrorReason.CATALOG_CODE_INVALID,
              },
            ],
          },
          PracticeErrorReason.CATALOG_CODE_INVALID,
        );
      }
      if (input.validTo && input.validTo < input.asOf) {
        throw new PreconditionFailedException(
          'validTo es anterior a asOf',
          {
            errors: [
              {
                field: 'validTo',
                reason: PracticeErrorReason.VALIDITY_RANGE_INVALID,
              },
            ],
          },
          PracticeErrorReason.VALIDITY_RANGE_INVALID,
        );
      }
      const row = this.declaredRepo.create(tx, {
        tenantId,
        practiceSiteId: site.id,
        capacityKindConceptId: kind.id,
        quantity: input.quantity,
        asOf: new Date(input.asOf),
        resolutionNumber: input.resolutionNumber?.trim() || undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined,
        actorUserId: actor.id,
      });
      await mapReferenceViolation(() => tx.flush());
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.capacityDeclared,
        aggregateType: 'practice_site',
        aggregateId: site.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          practiceSiteId: site.id,
          declarationId: row.id,
          kindCode: kind.code,
          quantity: row.quantity,
          asOf: input.asOf,
        },
      });
      return {
        id: row.id,
        kindCode: kind.code,
        quantity: row.quantity,
        asOf: isoDate(row.asOf)!,
        resolutionNumber: row.resolutionNumber ?? null,
        validTo: isoDate(row.validTo),
      };
    });
  }

  /**
   * Cuenta los espacios activos de la sede por tipo de capacidad, con una sola
   * consulta de agregados filtrados. La definición de cada tipo es dato
   * (`CAPACITY_DERIVATIONS`).
   */
  private async derive(
    tx: EntityManager,
    siteId: string,
  ): Promise<Map<string, number>> {
    const params: unknown[] = [];
    const columns = Object.values(CAPACITY_DERIVATIONS).map((rule, index) => {
      const conditions = this.conditions(rule, params);
      return `count(*) filter (where ${conditions})::int as k${index}`;
    });
    const rows = await tx.execute<Record<string, number>[]>(
      `select ${columns.join(', ')} from practice.care_spaces where practice_site_id = ? and status_concept_id = ?`,
      [...params, siteId, PRAC.SPACE_ACTIVE],
    );
    const out = new Map<string, number>();
    Object.keys(CAPACITY_DERIVATIONS).forEach((kind, index) =>
      out.set(kind, rows[0]?.[`k${index}`] ?? 0),
    );
    return out;
  }

  /** Condición SQL de un tipo; agrega sus parámetros a `params`. */
  private conditions(rule: CapacityDerivation, params: unknown[]): string {
    const parts: string[] = [];
    if (rule.form) {
      parts.push('form_concept_id = ?');
      params.push(FORMS.byInput(`LOC_FORM_${rule.form}`)!.id);
    }
    const byFunction = (rule.functions ?? []).map(
      (fn) => FUNCTIONS.byInput(fn)!.id,
    );
    const byCategory = (rule.bedCategories ?? []).map(
      (c) => ATTRIBUTES.bedCategory.byInput(c)!.id,
    );
    const either: string[] = [];
    if (byFunction.length > 0) {
      either.push(
        `space_type_concept_id in (${byFunction.map(() => '?').join(', ')})`,
      );
      params.push(...byFunction);
    }
    if (byCategory.length > 0) {
      either.push(
        `bed_category_concept_id in (${byCategory.map(() => '?').join(', ')})`,
      );
      params.push(...byCategory);
    }
    if (either.length > 0) parts.push(`(${either.join(' or ')})`);
    if (rule.censable === true) parts.push('censable is true');
    if (rule.censable === false) parts.push('censable is not true');
    return parts.length > 0 ? parts.join(' and ') : 'true';
  }

  /** Funciones exigidas (`TYPO_REQUIRED`) por la tipología que no tienen un espacio activo. */
  private async warnings(
    tx: EntityManager,
    siteId: string,
    typologyId: string | null | undefined,
  ): Promise<CapacityWarning[]> {
    if (!typologyId) return [];
    const rules = await this.rulesRepo.loadRuleSet(tx);
    const required = rules.typologyRequired.get(typologyId);
    if (!required || required.size === 0) return [];
    const active = await tx.execute<{ fn: string }[]>(
      `select distinct space_type_concept_id as fn from practice.care_spaces
        where practice_site_id = ? and status_concept_id = ?`,
      [siteId, PRAC.SPACE_ACTIVE],
    );
    const have = new Set(active.map((row) => row.fn));
    const typology =
      REGULATORY.typology.byConceptId(typologyId)?.code ?? typologyId;
    return [...required]
      .filter((fn) => !have.has(fn))
      .map((fn) => ({
        kind: 'TYPOLOGY_REQUIRED_MISSING' as const,
        functionCode: FUNCTIONS.byConceptId(fn)?.code ?? fn,
        typologyCode: typology,
      }));
  }
}
