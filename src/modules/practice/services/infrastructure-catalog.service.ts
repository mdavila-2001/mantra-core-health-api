import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ATTRIBUTES,
  FORMS,
  FORM_FHIR_CODE,
  FUNCTIONS,
  FUNCTION_PROFILES,
  REGULATORY,
  ROOT_FORMS,
  SPACE_LIFECYCLE,
  TYPOLOGY_SOURCES,
  UNIT_LIFECYCLE,
  type ConceptFamily,
  type FormKey,
  type FunctionCode,
  type FunctionFlags,
  type TypologyCode,
} from '../infrastructure-catalog';
import {
  AVAILABILITY,
  BLOCK_KINDS,
  BLOCK_REASONS,
  BLOCK_REASON_KINDS,
  CLEANING_PRIORITIES,
  CLEANING_STATUSES,
  CLEANING_TRIGGERS,
  CLEANING_TYPES,
  HYGIENE,
  ISOLATION,
  OCCUPANCY,
} from '../ops-catalog';
import {
  V2_BED_STATUS_LABELS,
  V2_BED_STATUS_RULES,
  V2_LOCAL_CODE_SYSTEM,
} from '../domain/bed-status-v2';
import { MAX_BATCH_SIZE } from './infrastructure-rules';
import { InfrastructureRulesRepository } from '../repositories';
import { ref } from './structure-mapper';
import type { ConceptRef } from '../dto/infrastructure.types';

/** Función con su perfil. */
export interface FunctionProfileView extends FunctionFlags, ConceptRef {
  /** Formas permitidas (códigos completos). */
  readonly forms: string[];
}

/** `GET /practice/infrastructure-catalog` (CONTRATO-F0-F1 §3). */
export interface InfrastructureCatalog {
  readonly forms: (ConceptRef & { fhirCode: string })[];
  readonly functions: FunctionProfileView[];
  /** Reglas padre→hijo **leídas de la base**. */
  readonly parentRules: { parent: string; child: string }[];
  /** Formas que admiten no tener padre (constante: la tabla no puede guardarla). */
  readonly rootForms: string[];
  /** Reglas de tipología **leídas de la base**, con su norma de origen. */
  readonly typologyRules: {
    typology: string;
    function: string;
    rule: string;
    source: string;
  }[];
  readonly lifecycle: ConceptRef[];
  readonly unitLifecycle: ConceptRef[];
  readonly attributes: {
    asepsis: ConceptRef[];
    pressure: ConceptRef[];
    sex: ConceptRef[];
    ageGroup: ConceptRef[];
    bedCategory: ConceptRef[];
    unitRole: ConceptRef[];
  };
  readonly regulatory: {
    subsector: ConceptRef[];
    careLevel: ConceptRef[];
    typology: (ConceptRef & { source: string })[];
    sedes: ConceptRef[];
    licenseStatus: ConceptRef[];
    capacityKind: ConceptRef[];
  };
  /** Tope de filas por alta masiva o importación. */
  readonly limits: { maxBatchSize: number };
  /** Disponibilidad (eje manual de F2). */
  readonly availability: ConceptRef[];
  /** Higiene (eje manual). */
  readonly hygiene: ConceptRef[];
  /** Aislamiento (eje manual). */
  readonly isolation: ConceptRef[];
  /** Ocupación (derivada, sólo lectura). */
  readonly occupancy: ConceptRef[];
  /** Tipos de bloqueo. */
  readonly blockKinds: ConceptRef[];
  /** Motivos de bloqueo con los tipos a los que aplican y si exigen texto. */
  readonly blockReasons: (ConceptRef & {
    kinds: string[];
    requiresText: boolean;
  })[];
  readonly cleaningTypes: ConceptRef[];
  readonly cleaningPriorities: ConceptRef[];
  readonly cleaningStatuses: ConceptRef[];
  readonly cleaningTriggers: ConceptRef[];
  /** Resumen HL7 v2-0116 de los ejes: la tabla de reglas del contrato. */
  readonly v2Map: {
    codeSystemLocal: string;
    codes: { code: string; label: string }[];
    rules: { rule: number; code: string; when: string }[];
  };
}

const list = (family: ConceptFamily): ConceptRef[] =>
  family.all().map((entry) => ref(entry)!);

/**
 * Catálogo de infraestructura: formas, funciones con su perfil, reglas
 * padre→hijo y de tipología, ciclo de vida, atributos y datos regulatorios.
 * Las reglas salen de las tablas (son datos); el perfil de función es la
 * constante del contrato.
 */
@Injectable()
export class InfrastructureCatalogService {
  /**
   * @param em - Contexto de persistencia.
   * @param rulesRepo - Reglas leídas de la base.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly rulesRepo: InfrastructureRulesRepository,
  ) {}

  /**
   * Arma el catálogo.
   *
   * @returns El catálogo completo.
   */
  async get(): Promise<InfrastructureCatalog> {
    const rules = await this.rulesRepo.loadRuleSet(this.em.fork());
    const parentRules = [...rules.parentChildren.entries()].flatMap(
      ([parentId, children]) =>
        [...children].map((childId) => ({
          parent: FORMS.byConceptId(parentId)?.code ?? parentId,
          child: FORMS.byConceptId(childId)?.code ?? childId,
        })),
    );
    const typologyRules = [
      ...[...rules.typologyAllowed].map(
        ([id, fns]) => ['TYPO_ALLOWED', id, fns] as const,
      ),
      ...[...rules.typologyRequired].map(
        ([id, fns]) => ['TYPO_REQUIRED', id, fns] as const,
      ),
    ].flatMap(([rule, typologyId, fns]) =>
      [...fns].map((fnId) => {
        const typology =
          REGULATORY.typology.byConceptId(typologyId)?.code ?? typologyId;
        return {
          typology,
          function: FUNCTIONS.byConceptId(fnId)?.code ?? fnId,
          rule,
          source: TYPOLOGY_SOURCES[typology as TypologyCode] ?? '',
        };
      }),
    );

    return {
      forms: FORMS.all().map((entry) => ({
        ...ref(entry)!,
        fhirCode:
          FORM_FHIR_CODE[entry.code.replace('LOC_FORM_', '') as FormKey],
      })),
      functions: FUNCTIONS.all().map((entry) => {
        const profile = FUNCTION_PROFILES[entry.code as FunctionCode];
        const { forms, ...flags } = profile;
        return {
          ...ref(entry)!,
          forms: forms.map((form) => `LOC_FORM_${form}`),
          ...flags,
        };
      }),
      parentRules,
      rootForms: ROOT_FORMS.map((form) => `LOC_FORM_${form}`),
      typologyRules,
      lifecycle: list(SPACE_LIFECYCLE),
      unitLifecycle: list(UNIT_LIFECYCLE),
      attributes: {
        asepsis: list(ATTRIBUTES.asepsis),
        pressure: list(ATTRIBUTES.pressure),
        sex: list(ATTRIBUTES.sex),
        ageGroup: list(ATTRIBUTES.ageGroup),
        bedCategory: list(ATTRIBUTES.bedCategory),
        unitRole: list(ATTRIBUTES.unitRole),
      },
      regulatory: {
        subsector: list(REGULATORY.subsector),
        careLevel: list(REGULATORY.careLevel),
        typology: REGULATORY.typology.all().map((entry) => ({
          ...ref(entry)!,
          source: TYPOLOGY_SOURCES[entry.code as TypologyCode],
        })),
        sedes: list(REGULATORY.sedes),
        licenseStatus: list(REGULATORY.licenseStatus),
        capacityKind: list(REGULATORY.capacityKind),
      },
      limits: { maxBatchSize: MAX_BATCH_SIZE },
      availability: list(AVAILABILITY),
      hygiene: list(HYGIENE),
      isolation: list(ISOLATION),
      occupancy: list(OCCUPANCY),
      blockKinds: list(BLOCK_KINDS),
      blockReasons: BLOCK_REASONS.all().map((entry) => ({
        ...ref(entry)!,
        kinds: [...(BLOCK_REASON_KINDS[entry.code] ?? [])],
        requiresText: entry.code === 'BLOCK_RSN_OTHER',
      })),
      cleaningTypes: list(CLEANING_TYPES),
      cleaningPriorities: list(CLEANING_PRIORITIES),
      cleaningStatuses: list(CLEANING_STATUSES),
      cleaningTriggers: list(CLEANING_TRIGGERS),
      v2Map: {
        codeSystemLocal: V2_LOCAL_CODE_SYSTEM,
        codes: Object.entries(V2_BED_STATUS_LABELS).map(([code, label]) => ({
          code,
          label,
        })),
        rules: V2_BED_STATUS_RULES.map((rule) => ({ ...rule })),
      },
    };
  }
}
