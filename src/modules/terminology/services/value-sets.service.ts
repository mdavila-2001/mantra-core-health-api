import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  CodeSystemVersionsRepository,
  ConceptDesignationsRepository,
  ConceptRelationshipsRepository,
  ValueSetsRepository,
} from '../repositories';
import type { CatalogConcepts, ValueSetRules } from '../entities';
import {
  type CreateValueSetDto,
  type ValueSetResponseDto,
  type ExpandValueSetDto,
  type ExpandValueSetResponseDto,
} from '../dto';

/** Versión inicial que recibe todo conjunto de valores recién creado. */
const INITIAL_VALUE_SET_VERSION = '1.0.0';

/** Estados de versión desde los que se admite expandir (UC-03-08). */
const EXPANDABLE_STATES: ReadonlySet<string> = new Set([
  CONCEPTS.TERM_DRAFT,
  CONCEPTS.TERM_ACTIVE,
]);

/**
 * Separador de la lista de códigos del operador `in`. El modelo guarda la lista en
 * una sola columna `value`, y ésta es la convención con la que se lee.
 */
const IN_LIST_SEPARATOR = ',';

/**
 * Reglas de negocio de conjuntos de valores: alta (UC-03-07) y materialización de
 * la expansión (UC-03-08).
 *
 * El alta crea los tres niveles (conjunto → versión → reglas) en una transacción.
 * Como las FK son columnas `uuid` planas (no relaciones del ORM), MikroORM no
 * ordena los inserts: hay que `flush` tras el conjunto y tras la versión antes de
 * crear lo que los referencia.
 */
@Injectable()
export class ValueSetsService {
  constructor(
    private readonly em: EntityManager,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly relationshipsRepo: ConceptRelationshipsRepository,
    private readonly designationsRepo: ConceptDesignationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ValueSetsService.name);
  }

  /** UC-03-07: crea un conjunto de valores con su versión inicial y sus reglas. */
  async createValueSet(
    dto: CreateValueSetDto,
    actor: AuthenticatedUser,
  ): Promise<ValueSetResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.value-set.create',
        internalCode: dto.internalCode,
      },
      'Creando conjunto de valores',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.valueSetsRepo.findByInternalCode(
        tx,
        dto.internalCode,
      );
      if (duplicate) {
        this.logger.warn(
          {
            operation: 'terminology.value-set.create',
            internalCode: dto.internalCode,
          },
          'Código interno de conjunto de valores duplicado',
        );
        throw new ConflictException(
          'Ya existe un conjunto de valores con ese código interno',
          {
            internalCode: dto.internalCode,
          },
        );
      }

      // Nivel 1: conjunto de valores.
      const valueSet = this.valueSetsRepo.createValueSet(tx, {
        internalCode: dto.internalCode,
        name: dto.name,
        canonicalUrl: dto.canonicalUrl,
        stateConceptId: CONCEPTS.TERM_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Nivel 2: versión inicial (referencia al conjunto ya persistido).
      const version = this.valueSetsRepo.createVersion(tx, {
        valueSetId: valueSet.id,
        version: INITIAL_VALUE_SET_VERSION,
        isDefault: true,
        stateConceptId: CONCEPTS.TERM_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Nivel 3: reglas (referencian la versión ya persistida).
      const rules = dto.rules ?? [];
      for (const rule of rules) {
        const operatorConceptId =
          rule.operator === 'IS_A'
            ? CONCEPTS.VS_OP_IS_A
            : rule.operator === 'IN'
              ? CONCEPTS.VS_OP_IN
              : undefined;
        this.valueSetsRepo.createRule(tx, {
          valueSetVersionId: version.id,
          codeSystemId: rule.codeSystemId,
          operatorConceptId,
          property: rule.property,
          value: rule.value,
          included: rule.included ?? true,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.value-set.create',
          valueSetId: valueSet.id,
          rulesCount: rules.length,
        },
        'Conjunto de valores creado',
      );
      return {
        id: valueSet.id,
        versionId: version.id,
        rulesCount: rules.length,
      };
    });
  }

  /**
   * UC-03-08 (`$expand`): materializa los miembros de una versión evaluando sus
   * reglas contra el catálogo.
   *
   * La expansión **reemplaza** los miembros anteriores. Acumularlos dejaría dentro
   * códigos que las reglas ya no seleccionan, y el consumidor no tendría forma de
   * distinguirlos de los vigentes.
   */
  async expandValueSet(
    valueSetId: string,
    dto: ExpandValueSetDto,
    actor: AuthenticatedUser,
  ): Promise<ExpandValueSetResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.value-set.expand',
        valueSetId,
        valueSetVersionId: dto.valueSetVersionId,
      },
      'Expandiendo conjunto de valores',
    );

    return this.em.transactional(async (tx) => {
      const valueSet = await this.valueSetsRepo.findById(tx, valueSetId);
      if (!valueSet) {
        throw new ResourceNotFoundException(
          'Conjunto de valores no encontrado',
          { valueSetId },
        );
      }

      const version = await this.valueSetsRepo.findVersionForUpdate(
        tx,
        dto.valueSetVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión del conjunto de valores no encontrada',
          {
            valueSetVersionId: dto.valueSetVersionId,
          },
        );
      }
      // Expandir la versión de otro conjunto sobreescribiría miembros ajenos.
      if (version.valueSetId !== valueSetId) {
        throw new ConflictException(
          'La versión no pertenece a ese conjunto de valores',
          {
            valueSetId,
            valueSetVersionId: dto.valueSetVersionId,
          },
        );
      }
      if (
        version.stateConceptId &&
        !EXPANDABLE_STATES.has(version.stateConceptId)
      ) {
        throw new PreconditionFailedException(
          'Sólo se expanden versiones en borrador o activas',
          {
            valueSetVersionId: version.id,
            stateConceptId: version.stateConceptId,
          },
        );
      }

      const rules = await this.valueSetsRepo.findRulesByVersion(tx, version.id);
      const selected = await this.evaluateRules(tx, rules);

      const replacedMembers = await this.valueSetsRepo.deleteMembersByVersion(
        tx,
        version.id,
      );
      let ordinal = 0;
      for (const conceptId of selected) {
        this.valueSetsRepo.createMember(tx, {
          valueSetVersionId: version.id,
          conceptId,
          included: true,
          ordinal,
          actorUserId: actor.id,
        });
        ordinal += 1;
      }

      if (dto.activate !== false) {
        version.stateConceptId = CONCEPTS.TERM_ACTIVE;
      }
      if (dto.makeDefault) {
        // Sólo una versión por defecto: promover ésta obliga a degradar la anterior.
        const previous = await this.valueSetsRepo.findDefaultVersionsForUpdate(
          tx,
          valueSetId,
        );
        for (const other of previous) {
          if (other.id !== version.id) {
            other.isDefault = false;
            touch(other, actor.id);
          }
        }
        version.isDefault = true;
      }
      touch(version, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.value-set.expand',
          valueSetVersionId: version.id,
          includedMembers: selected.length,
          replacedMembers,
        },
        'Conjunto de valores expandido',
      );
      return {
        valueSetId,
        valueSetVersionId: version.id,
        stateConceptId: version.stateConceptId ?? CONCEPTS.TERM_DRAFT,
        rulesEvaluated: rules.length,
        includedMembers: selected.length,
        replacedMembers,
      };
    });
  }

  /**
   * Evalúa las reglas de una versión y devuelve los ids de concepto seleccionados,
   * en orden estable.
   *
   * Las reglas `included=true` suman y las `included=false` restan, y las
   * exclusiones se aplican **al final**: si no, el resultado dependería del orden
   * en que se hubieran dado de alta las reglas.
   */
  private async evaluateRules(
    tx: EntityManager,
    rules: ValueSetRules[],
  ): Promise<string[]> {
    const included: string[] = [];
    const excluded = new Set<string>();

    for (const rule of rules) {
      const matched = await this.evaluateRule(tx, rule);
      if (rule.included) {
        for (const conceptId of matched) included.push(conceptId);
      } else {
        for (const conceptId of matched) excluded.add(conceptId);
      }
    }

    const seen = new Set<string>();
    return included.filter((conceptId) => {
      if (excluded.has(conceptId) || seen.has(conceptId)) return false;
      seen.add(conceptId);
      return true;
    });
  }

  /** Evalúa una sola regla contra los conceptos activos de su sistema de códigos. */
  private async evaluateRule(
    tx: EntityManager,
    rule: ValueSetRules,
  ): Promise<string[]> {
    const version = await this.versionsRepo.findDefaultActiveVersion(
      tx,
      rule.codeSystemId,
      CONCEPTS.TERM_ACTIVE,
    );
    // Un sistema de códigos sin versión vigente no aporta conceptos. La regla se
    // salta en vez de romper la expansión entera: el resto sigue siendo válido.
    if (!version) {
      this.logger.warn(
        {
          operation: 'terminology.value-set.expand',
          ruleId: rule.id,
          codeSystemId: rule.codeSystemId,
        },
        'Regla ignorada: el sistema de códigos no tiene versión vigente',
      );
      return [];
    }

    const concepts = await this.conceptsRepo.findByVersion(
      tx,
      version.id,
      CONCEPTS.TERM_ACTIVE,
    );
    // Sin operador la regla toma la versión completa: es el caso "todo el sistema".
    if (!rule.operatorConceptId) {
      return concepts.map((concept) => concept.id);
    }

    switch (rule.operatorConceptId) {
      case CONCEPTS.VS_OP_IN:
        return this.matchIn(concepts, rule.value);
      case CONCEPTS.VS_OP_IS_A:
        return this.matchIsA(tx, concepts, rule.value);
      case CONCEPTS.VS_OP_PROP:
        return this.matchProperty(tx, concepts, rule.property, rule.value);
      default:
        // Operador que el modelo no declara: se ignora la regla en vez de
        // adivinar su semántica y expandir de más.
        this.logger.warn(
          {
            operation: 'terminology.value-set.expand',
            ruleId: rule.id,
            operatorConceptId: rule.operatorConceptId,
          },
          'Regla ignorada: operador desconocido',
        );
        return [];
    }
  }

  /** Operador `in`: los conceptos cuyo código esté en la lista de `value`. */
  private matchIn(
    concepts: CatalogConcepts[],
    value: string | undefined,
  ): string[] {
    if (!value) return [];
    const codes = new Set(
      value
        .split(IN_LIST_SEPARATOR)
        .map((code) => code.trim())
        .filter((code) => code.length > 0),
    );
    return concepts
      .filter((concept) => codes.has(concept.code))
      .map((concept) => concept.id);
  }

  /**
   * Operador `is-a`: el concepto cuyo código es `value` y todos sus descendientes
   * por relaciones `is-a`, de forma transitiva.
   */
  private async matchIsA(
    tx: EntityManager,
    concepts: CatalogConcepts[],
    value: string | undefined,
  ): Promise<string[]> {
    if (!value) return [];
    const root = concepts.find((concept) => concept.code === value);
    if (!root) return [];

    // Aristas hijo -> padre acotadas a los conceptos de la versión; se invierten
    // para poder descender desde la raíz.
    const edges = await this.relationshipsRepo.findByTypeForSources(
      tx,
      CONCEPTS.REL_IS_A,
      concepts.map((concept) => concept.id),
    );
    const children = new Map<string, string[]>();
    for (const edge of edges) {
      const siblings = children.get(edge.targetConceptId) ?? [];
      siblings.push(edge.sourceConceptId);
      children.set(edge.targetConceptId, siblings);
    }

    const collected = new Set<string>([root.id]);
    const pending = [root.id];
    while (pending.length > 0) {
      const current = pending.pop() as string;
      for (const child of children.get(current) ?? []) {
        // El `has` corta también los ciclos: una jerarquía mal curada no debe
        // colgar la expansión.
        if (!collected.has(child)) {
          collected.add(child);
          pending.push(child);
        }
      }
    }
    return concepts
      .filter((concept) => collected.has(concept.id))
      .map((concept) => concept.id);
  }

  /** Operador `prop`: los conceptos cuya propiedad `property` valga `value`. */
  private async matchProperty(
    tx: EntityManager,
    concepts: CatalogConcepts[],
    property: string | undefined,
    value: string | undefined,
  ): Promise<string[]> {
    if (!property || value === undefined) return [];
    const rows = await this.designationsRepo.findPropertyForConcepts(
      tx,
      concepts.map((concept) => concept.id),
      property,
    );
    // `value_json` es jsonb y `value` una columna de texto: se compara la forma
    // textual del valor, que es la única representación común a ambos.
    const matching = new Set(
      rows
        .filter((row) => stringifyPropertyValue(row.valueJson) === value)
        .map((row) => row.conceptId),
    );
    return concepts
      .filter((concept) => matching.has(concept.id))
      .map((concept) => concept.id);
  }
}

/** Forma textual de un `value_json` para compararlo con el `value` de una regla. */
function stringifyPropertyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
}
