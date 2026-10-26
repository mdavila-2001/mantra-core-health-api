import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  ConceptDesignations,
  ConceptProperties,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  BO_MEDICAL_SPECIALTIES,
  BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE,
  BO_SPECIALTY_PARENT_PROPERTY_CODE,
  MEDICAL_SPECIALTY_VALUE_SET,
  type BoMedicalSpecialtySeed,
  boSpecialtyConceptCode,
  boSpecialtyConceptId,
  boSpecialtyDesignationId,
  boSpecialtyMemberId,
  boSpecialtyPropertyId,
  normalizeSpecialtyName,
} from './bo-medical-specialties.catalog';

/** Tipo de dato de las propiedades, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

type Em = ReturnType<MikroORM['em']['fork']>;

/** Cuántas filas dejó cada nivel en esta pasada. */
export interface BoMedicalSpecialtiesSeedResult {
  /** Conceptos de especialidad creados. */
  concepts: number;
  /** Designaciones preferidas (ES) creadas. */
  designations: number;
  /** Propiedades (disciplina y especialidad troncal) creadas. */
  properties: number;
  /** Membresías nuevas en la versión vigente de `VS_MEDICAL_SPECIALTY`. */
  memberships: number;
  /** Membresías propias cuyo `ordinal` se realineó. */
  reordered: number;
  /** Especialidades no sumadas porque el conjunto ya las trae por otra vía. */
  shadowed: number;
}

/**
 * Suma a `VS_MEDICAL_SPECIALTY` las especialidades de
 * `bo-medical-specialties.catalog.ts`: las subespecialidades médicas,
 * quirúrgicas y odontológicas que el paquete del modelo no declara.
 *
 * ## Por qué suma a un conjunto ajeno
 *
 * Porque es **el** catálogo que valida `MedicalSpecialtyCatalogService`: el
 * alta del médico, su edición de especialidad y el filtro de la guía aceptan
 * sólo miembros vigentes de ese conjunto. Un conjunto paralelo no lo vería
 * nadie. Se suma sin pisar: ningún miembro del modelo se toca, ni su orden.
 *
 * ## Reglas
 *
 * - **Sólo agrega.** Conceptos, designaciones, propiedades y membresías con id
 *   determinista; una segunda corrida no escribe nada. La única actualización
 *   es el `ordinal` de las membresías **propias** (ver abajo).
 * - **No crea el conjunto.** Si no está —ni el paquete del modelo ni el
 *   suplente de `ClinicalFormsSeedService` lo trajeron— avisa y sale: crear
 *   uno acá competiría con esos dos dueños.
 * - **No duplica.** Una especialidad que el conjunto ya trae por otra vía —el
 *   modelo la sumó con el mismo código, o con el mismo nombre— no se agrega:
 *   dos conceptos para lo mismo parten a los profesionales en dos filtros. Se
 *   cuenta como `shadowed` y se avisa.
 * - **Orden.** Las propias van detrás de las del conjunto original, en orden
 *   alfabético. Al ampliar el catálogo una especialidad nueva cae entre medio
 *   de las ya sembradas, así que se realinea el `ordinal` de las propias (mismo
 *   criterio que `BoOccupationsSeedService.seedMemberships`); las del modelo
 *   conservan el suyo.
 *
 * Corre después de `ClinicalFormsSeedService`, que es quien publica el
 * conjunto suplente en una base sin el paquete del modelo, y antes del
 * directorio de redes, que mapea las especialidades por nombre contra este
 * conjunto. El orden lo impone `SeedBootstrapService`.
 */
@Injectable()
export class BoMedicalSpecialtiesSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BoMedicalSpecialtiesSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @returns Cuántas filas escribió esta pasada, por nivel.
   */
  async run(): Promise<BoMedicalSpecialtiesSeedResult> {
    this.assertCatalog();

    const em = this.orm.em.fork();
    const now = new Date();
    const counters: BoMedicalSpecialtiesSeedResult = {
      concepts: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
      reordered: 0,
      shadowed: 0,
    };

    const valueSet = await em.findOne(ValueSets, {
      internalCode: MEDICAL_SPECIALTY_VALUE_SET,
    });
    const version = valueSet
      ? await em.findOne(ValueSetVersions, {
          valueSetId: valueSet.id,
          isDefault: true,
        })
      : null;
    if (!valueSet || !version) {
      this.logger.warn(
        {
          operation: 'seed.bo-medical-specialties',
          valueSet: MEDICAL_SPECIALTY_VALUE_SET,
        },
        'El catálogo de especialidades no está (o no tiene versión vigente): no hay a qué sumar las especialidades ampliadas',
      );
      return counters;
    }

    counters.concepts += await this.seedConcepts(em, now);
    counters.designations += await this.seedDesignations(em, now);
    counters.properties += await this.seedProperties(em, now);
    const members = await this.seedMemberships(em, version.id, now);
    counters.memberships += members.created;
    counters.reordered += members.reordered;
    counters.shadowed += members.shadowed;

    const written =
      counters.concepts +
      counters.designations +
      counters.properties +
      counters.memberships +
      counters.reordered;
    if (written > 0) {
      this.logger.info(
        { operation: 'seed.bo-medical-specialties', ...counters },
        'Especialidades ampliadas sumadas a VS_MEDICAL_SPECIALTY',
      );
    }
    return counters;
  }

  /**
   * Rompe si el catálogo declara un código dos veces.
   *
   * Dos entradas con el mismo código colapsarían en el mismo id determinista y
   * una taparía a la otra sin ruido.
   */
  private assertCatalog(): void {
    const seen = new Set<string>();
    for (const specialty of BO_MEDICAL_SPECIALTIES) {
      if (seen.has(specialty.code)) {
        throw new Error(
          `El catálogo de especialidades declara el código "${specialty.code}" más de una vez`,
        );
      }
      seen.add(specialty.code);
    }
  }

  /** Los conceptos, en el sistema de códigos interno. */
  private async seedConcepts(em: Em, now: Date): Promise<number> {
    const existing = await this.existingIds(
      em,
      CatalogConcepts,
      BO_MEDICAL_SPECIALTIES.map((s) => boSpecialtyConceptId(s.code)),
    );
    let created = 0;
    for (const specialty of BO_MEDICAL_SPECIALTIES) {
      const id = boSpecialtyConceptId(specialty.code);
      if (existing.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          // Prefijado: `catalog_concepts` es UNIQUE(code_system_version_id,
          // code) y el sistema interno lo comparte todo el catálogo. Los
          // cargadores que resuelven por código toman el último segmento.
          code: boSpecialtyConceptCode(specialty.code),
          display: specialty.display,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  /** La designación preferida en castellano de cada especialidad. */
  private async seedDesignations(em: Em, now: Date): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      BO_MEDICAL_SPECIALTIES.map((s) => boSpecialtyDesignationId(s.code)),
    );
    let created = 0;
    for (const specialty of BO_MEDICAL_SPECIALTIES) {
      const id = boSpecialtyDesignationId(specialty.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: boSpecialtyConceptId(specialty.code),
          value: specialty.display,
          languageConceptId: CONCEPTS.LANG_ES,
          designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
          preferred: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  /**
   * La disciplina de cada una y, si es subespecialidad, su troncal. Hoy no las
   * usa ninguna pantalla; van para que el selector pueda separar médicas de
   * odontológicas o agrupar por tronco sin volver a clasificar a mano.
   */
  private async seedProperties(em: Em, now: Date): Promise<number> {
    const declared = BO_MEDICAL_SPECIALTIES.flatMap((specialty) =>
      this.propertiesOf(specialty),
    );
    const existing = await this.existingIds(
      em,
      ConceptProperties,
      declared.map((p) => p.id),
    );
    let created = 0;
    for (const property of declared) {
      if (existing.has(property.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: property.id,
          conceptId: property.conceptId,
          propertyCode: property.propertyCode,
          dataType: STRING_DATA_TYPE,
          valueJson: property.value,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  /** Las propiedades que declara una especialidad. */
  private propertiesOf(specialty: BoMedicalSpecialtySeed): {
    id: string;
    conceptId: string;
    propertyCode: string;
    value: string;
  }[] {
    const conceptId = boSpecialtyConceptId(specialty.code);
    const rows = [
      {
        id: boSpecialtyPropertyId(
          specialty.code,
          BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE,
        ),
        conceptId,
        propertyCode: BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE,
        value: specialty.discipline as string,
      },
    ];
    if (specialty.parentCode) {
      rows.push({
        id: boSpecialtyPropertyId(
          specialty.code,
          BO_SPECIALTY_PARENT_PROPERTY_CODE,
        ),
        conceptId,
        propertyCode: BO_SPECIALTY_PARENT_PROPERTY_CODE,
        value: specialty.parentCode,
      });
    }
    return rows;
  }

  /**
   * Las membresías en la versión vigente: las propias detrás de las del
   * conjunto original, en orden alfabético, sin repetir lo que ya trae.
   */
  private async seedMemberships(
    em: Em,
    versionId: string,
    now: Date,
  ): Promise<{ created: number; reordered: number; shadowed: number }> {
    const members = (await em.find(
      ValueSetMembers,
      { valueSetVersionId: versionId },
      { fields: ['id', 'conceptId', 'ordinal', 'included'] as never },
    )) as unknown as {
      id: string;
      conceptId: string;
      ordinal?: number | null;
      included?: boolean;
      updatedAt?: Date;
    }[];

    const ownIds = new Set(
      BO_MEDICAL_SPECIALTIES.map((s) => boSpecialtyMemberId(versionId, s.code)),
    );
    const own = new Map(
      members.filter((m) => ownIds.has(m.id)).map((m) => [m.id, m]),
    );
    const foreign = members.filter((m) => !ownIds.has(m.id));

    // Lo que el conjunto ya trae, por código (el último segmento: el modelo
    // usa `CARDIOLOGIA`, el suplente `clinical-forms:specialty:CARDIOLOGIA`) y
    // por nombre normalizado.
    const foreignIncluded = foreign.filter((m) => m.included !== false);
    const foreignConcepts = foreignIncluded.length
      ? ((await em.find(
          CatalogConcepts,
          { id: { $in: foreignIncluded.map((m) => m.conceptId) } },
          { fields: ['id', 'code', 'display'] as never },
        )) as unknown as { code: string; display: string }[])
      : [];
    const takenCodes = new Set(
      foreignConcepts.map((c) => String(c.code).split(':').at(-1)),
    );
    const takenNames = new Set(
      foreignConcepts.map((c) => normalizeSpecialtyName(c.display ?? '')),
    );

    const base =
      foreign.reduce(
        (max, m) =>
          typeof m.ordinal === 'number' ? Math.max(max, m.ordinal) : max,
        -1,
      ) + 1;

    const sorted = [...BO_MEDICAL_SPECIALTIES].sort((a, b) =>
      a.display.localeCompare(b.display, 'es'),
    );

    let created = 0;
    let reordered = 0;
    let shadowed = 0;
    let position = 0;
    for (const specialty of sorted) {
      const id = boSpecialtyMemberId(versionId, specialty.code);
      const current = own.get(id);
      const isShadowed =
        takenCodes.has(specialty.code) ||
        takenNames.has(normalizeSpecialtyName(specialty.display));
      if (isShadowed) {
        shadowed += 1;
        // Una membresía propia que quedó repetida porque el modelo la sumó
        // después no se borra: puede haber profesionales que la declararon.
        // Se avisa para que la migración la decida una persona.
        this.logger.warn(
          {
            operation: 'seed.bo-medical-specialties',
            code: specialty.code,
            alreadyMember: current !== undefined,
          },
          'El catálogo de especialidades ya trae esta especialidad por otra vía: no se suma',
        );
        continue;
      }
      const ordinal = base + position;
      position += 1;
      if (current !== undefined) {
        if (current.ordinal !== ordinal) {
          current.ordinal = ordinal;
          current.updatedAt = now;
          reordered += 1;
        }
        continue;
      }
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionId,
          conceptId: boSpecialtyConceptId(specialty.code),
          included: true,
          ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return { created, reordered, shadowed };
  }

  /** Los ids que ya están en la base, de entre los que se van a sembrar. */
  private async existingIds<T extends object>(
    em: Em,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return new Set(rows.map((row) => (row as { id: string }).id));
  }
}
