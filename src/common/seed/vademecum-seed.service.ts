import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystems,
  CodeSystemVersions,
  ConceptDesignations,
  ConceptProperties,
  TerminologySources,
} from '../../modules/terminology/entities';
import { DrugInteractions } from '../../modules/clinical_ext/entities';
import { CONCEPTS } from '../constants/concepts';
import vademecumDataset from './data/vademecum/vademecum.dataset.json';

/**
 * Materializa el vademécum de desarrollo: el catálogo de medicamentos contra el
 * que se prescribe.
 *
 * ## Por qué es un seed de la app y no del paquete de `seedsGenerales`
 *
 * El dataset depende de conceptos que siembra {@link TerminologySeedService}:
 * los idiomas `EN`/`ES` de cada designación y las severidades
 * `clinical_ext:SEVERITY_*` de cada interacción, todos del code system interno.
 * Vivía como `SQL/patches/2026-07-30_vademecum_dev_seed.sql`, fuera de
 * `apply_all.sql`, así que una base reconstruida **no lo traía**: sólo aparecía
 * si alguien aplicaba el patch a mano o corría su prueba de integración. Y
 * aplicarlo antes del arranque fallaba con violación de FK, porque esos
 * conceptos todavía no existían.
 *
 * Como seed dependiente el orden queda resuelto por construcción: corre después
 * del catálogo de conceptos, en el mismo `OnApplicationBootstrap` que los otros.
 *
 * ## Los ids vienen del dataset, no se derivan acá
 *
 * `data/vademecum/vademecum.dataset.json` se exportó de la base ya poblada, con
 * los UUID deterministas del seed original: así una base que ya tenía el
 * catálogo reconoce sus propias filas y esta pasada no inserta nada, en vez de
 * duplicarlo con ids nuevos.
 *
 * Idempotente: consulta lo presente por id y sólo inserta lo que falta.
 * Se flushea por niveles porque las FK son columnas uuid planas y MikroORM no
 * ordena inserts entre entidades que no están relacionadas por referencia.
 *
 * > No es un vademécum clínico: son 17 medicamentos tipeados a mano para poder
 * > ejercitar la receta en desarrollo. La carga real es de datos —una versión
 * > nueva del code system— y no de código.
 */
@Injectable()
export class VademecumSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` de la aplicación.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VademecumSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración lo invoquen
   * tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(): Promise<{
    /**
     * Filas efectivamente insertadas; 0 si el catálogo ya estaba completo.
     */
    inserted: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    inserted += await this.seedSources(em, now);
    await em.flush();

    inserted += await this.seedCodeSystem(em, now);
    await em.flush();

    inserted += await this.seedVersion(em, now);
    await em.flush();

    inserted += await this.seedConcepts(em, now);
    await em.flush();

    // Designaciones, propiedades e interacciones cuelgan de los conceptos, que
    // recién ahora están en la base.
    inserted += await this.seedDesignations(em, now);
    inserted += await this.seedProperties(em, now);
    inserted += await this.seedInteractions(em, now);
    await em.flush();

    if (inserted > 0) {
      this.logger.info(
        { inserted, medications: vademecumDataset.concepts.length },
        'Vademécum de desarrollo materializado',
      );
    }
    return { inserted };
  }

  /** Las fuentes de terminología que el catálogo cita (ATC, RxNorm, SNOMED). */
  private async seedSources(em: EntityManager, now: Date): Promise<number> {
    let inserted = 0;
    for (const source of vademecumDataset.sources) {
      if (await em.findOne(TerminologySources, { id: source.id })) continue;
      em.create(
        TerminologySources,
        {
          id: source.id,
          code: source.code,
          name: source.name,
          owner: source.owner ?? undefined,
          officialUrl: source.official_url ?? undefined,
          license: source.license ?? undefined,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /** El code system `vademecum` propiamente dicho. */
  private async seedCodeSystem(em: EntityManager, now: Date): Promise<number> {
    let inserted = 0;
    for (const system of vademecumDataset.codeSystem) {
      if (await em.findOne(CodeSystems, { id: system.id })) continue;
      em.create(
        CodeSystems,
        {
          id: system.id,
          sourceId: system.source_id,
          internalCode: system.internal_code,
          name: system.name,
          canonicalUrl: system.canonical_url,
          oid: system.oid ?? undefined,
          caseSensitive: system.case_sensitive ?? undefined,
          supportsComposition: system.supports_composition ?? undefined,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /** La versión publicada del code system: los conceptos cuelgan de ella. */
  private async seedVersion(em: EntityManager, now: Date): Promise<number> {
    let inserted = 0;
    for (const version of vademecumDataset.codeSystemVersion) {
      if (await em.findOne(CodeSystemVersions, { id: version.id })) continue;
      em.create(
        CodeSystemVersions,
        {
          id: version.id,
          codeSystemId: version.code_system_id,
          version: version.version,
          publishedAt: version.published_at
            ? new Date(version.published_at)
            : undefined,
          isDefault: version.is_default ?? undefined,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /** Los 17 medicamentos, con su código ATC como `code`. */
  private async seedConcepts(em: EntityManager, now: Date): Promise<number> {
    const present = await em.find(
      CatalogConcepts,
      { id: { $in: vademecumDataset.concepts.map((c) => c.id) } },
      { fields: ['id'] },
    );
    const existing = new Set(present.map((c) => c.id));

    let inserted = 0;
    for (const concept of vademecumDataset.concepts) {
      if (existing.has(concept.id)) continue;
      em.create(
        CatalogConcepts,
        {
          id: concept.id,
          codeSystemVersionId: concept.code_system_version_id,
          code: concept.code,
          display: concept.display,
          definition: concept.definition ?? undefined,
          abstract: concept.abstract ?? undefined,
          selectable: concept.selectable ?? undefined,
          stateConceptId: CONCEPTS.STATUS_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /**
   * Nombres alternativos: la marca comercial y el nombre en castellano. Las de
   * marca van con `language_concept_id` nulo a propósito — un nombre comercial
   * no pertenece a un idioma.
   */
  private async seedDesignations(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    const present = await em.find(
      ConceptDesignations,
      { id: { $in: vademecumDataset.designations.map((d) => d.id) } },
      { fields: ['id'] },
    );
    const existing = new Set(present.map((d) => d.id));

    let inserted = 0;
    for (const designation of vademecumDataset.designations) {
      if (existing.has(designation.id)) continue;
      em.create(
        ConceptDesignations,
        {
          id: designation.id,
          conceptId: designation.concept_id,
          languageConceptId: designation.language_concept_id ?? undefined,
          designationTypeConceptId:
            designation.designation_type_concept_id ?? undefined,
          value: designation.value,
          preferred: designation.preferred ?? undefined,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /**
   * Presentaciones, concentraciones, vías, clase terapéutica, indicaciones y
   * códigos externos. Es lo que la pantalla de receta necesita para que el
   * profesional elija sin teclear el nombre a mano.
   */
  private async seedProperties(em: EntityManager, now: Date): Promise<number> {
    const present = await em.find(
      ConceptProperties,
      { id: { $in: vademecumDataset.properties.map((p) => p.id) } },
      { fields: ['id'] },
    );
    const existing = new Set(present.map((p) => p.id));

    let inserted = 0;
    for (const property of vademecumDataset.properties) {
      if (existing.has(property.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: property.id,
          conceptId: property.concept_id,
          propertyCode: property.property_code,
          dataType: property.data_type,
          valueJson: property.value_json,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /** Las interacciones conocidas entre pares de sustancias del catálogo. */
  private async seedInteractions(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    let inserted = 0;
    for (const interaction of vademecumDataset.interactions) {
      if (await em.findOne(DrugInteractions, { id: interaction.id })) continue;
      em.create(
        DrugInteractions,
        {
          id: interaction.id,
          substanceAConceptId: interaction.substance_a_concept_id,
          substanceBConceptId: interaction.substance_b_concept_id,
          severityConceptId: interaction.severity_concept_id,
          mechanismText: interaction.mechanism_text ?? undefined,
          managementText: interaction.management_text ?? undefined,
          evidenceLevelConceptId:
            interaction.evidence_level_concept_id ?? undefined,
          source: interaction.source ?? undefined,
          sourceVersion: interaction.source_version ?? undefined,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }
}
