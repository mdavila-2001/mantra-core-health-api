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
 * Idempotente: consulta lo presente y sólo inserta lo que falta. Las fuentes se
 * reconocen por su clave natural (`code`) porque otro seeder puede haberlas
 * insertado con otros ids; ver la nota en `seedSources`.
 * Se flushea por niveles porque las FK son columnas uuid planas y MikroORM no
 * ordena inserts entre entidades que no están relacionadas por referencia.
 *
 * > No es un vademécum clínico: son 17 medicamentos tipeados a mano para poder
 * > ejercitar la receta en desarrollo. La carga real es de datos —una versión
 * > nueva del code system— y no de código.
 *
 * ## B-13 — sin contenido clínico ni fuentes que no lo respaldan
 *
 * Hasta el 2026-09-02 el dataset citaba RxNorm, SNOMED CT y WHO ATC/DDD como
 * fuentes de `contraindications`/`indications`/`adverse_effects`/`monitoring`
 * —155 propiedades, 68 de ellas clínicas—, pero ninguna de esas tres nomen-
 * claturas publica ese contenido: son códigos, no dosis ni contraindicaciones.
 * Peor que el dato sin fuente: uno **con una fuente que no lo respalda**. Se
 * retiraron las 68 filas clínicas y los 18 códigos externos (`rxnorm_cui`,
 * `snomed_code`) que citaban esas fuentes, y `sources` quedó con una única
 * entrada honesta (`MANTRA_DEV_VADEMECUM`) que dice lo que el dataset es: 17
 * medicamentos de desarrollo, sin fuente autoritativa. La receta no se entera
 * — sólo lee `dose_forms`/`strengths` (`medication-block.ts`). Las 5
 * interacciones (`clinical_ext.drug_interactions`) no se tocan: las consume
 * CDS y su fuente es una decisión de producto aparte (P-25-1).
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
   * Se niega en producción salvo permiso explícito (mismo patrón que
   * {@link ProviderAccountsSeedService.run}): el dataset es contenido de
   * desarrollo sin fuente autoritativa (B-13), y una imagen que arranca con
   * `NODE_ENV=production` no debería poblarlo sin que alguien lo pida a
   * propósito. También cubre `POST /content-packs/VADEMECUM/apply`, que llama
   * a este mismo método.
   *
   * @param nodeEnv - Entorno, para negarse en producción.
   * @param allowProduction - Permiso explícito para sembrar en producción.
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(
    nodeEnv = process.env.NODE_ENV,
    allowProduction = process.env.SEED_VADEMECUM_ALLOW_PRODUCTION === 'true',
  ): Promise<{
    /**
     * Filas efectivamente insertadas; 0 si el catálogo ya estaba completo o si
     * se saltó por `skipped`.
     */
    inserted: number;
    /** Motivo por el que no se hizo nada, si se saltó. */
    skipped?: 'production-not-allowed';
  }> {
    if (nodeEnv === 'production' && !allowProduction) {
      this.logger.warn(
        { operation: 'seed.vademecum' },
        'Vademécum de desarrollo omitido en producción: hace falta SEED_VADEMECUM_ALLOW_PRODUCTION=true',
      );
      return { inserted: 0, skipped: 'production-not-allowed' };
    }

    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    const fuentes = await this.seedSources(em, now);
    inserted += fuentes.inserted;
    await em.flush();

    inserted += await this.seedCodeSystem(em, now, fuentes.idReal);
    await em.flush();

    inserted += await this.seedVersion(em, now, fuentes.idReal);
    await em.flush();

    inserted += await this.seedConcepts(em, now, fuentes.idReal);
    await em.flush();

    // Designaciones, propiedades e interacciones cuelgan de los conceptos, que
    // recién ahora están en la base.
    inserted += await this.seedDesignations(em, now, fuentes.idReal);
    inserted += await this.seedProperties(em, now, fuentes.idReal);
    inserted += await this.seedInteractions(em, now, fuentes.idReal);
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
  /**
   * Las fuentes se reconocen por `code`, que es su clave natural y la que lleva
   * la restricción única (`uq_terminology_sources_code`) — NO por `id`.
   *
   * Buscar por `id` parece equivalente y no lo es: la misma fuente se inserta
   * con ids distintos según quién llegue primero. El parche del repositorio del
   * modelo (`2026-07-30_vademecum_dev_seed.sql`) los deriva con
   * `md5('mantra:vademecum:source:WHO_ATC')::uuid`, y este dataset trae UUIDv5
   * de la misma clave. Para `WHO_ATC` eso da `c020961b-…` contra `63041c91-…`:
   * la fila existe, la búsqueda por id no la ve, se intenta el insert y la
   * restricción sobre `code` lo tumba.
   *
   * Como los seeds corren en cada arranque, el fallo no era transitorio: el
   * vademécum entero quedaba sin sembrar en toda base que hubiera visto el
   * parche SQL. Por `code` la pasada es idempotente venga de donde venga la
   * fila.
   */
  /**
   * El id que de verdad está en la base para un id del dataset.
   *
   * Todo lo que cuelga de un concepto —designaciones, propiedades,
   * interacciones— lo referencia por uuid plano con FK, así que si el padre ya
   * existía con otro id hay que traducirlo o la FK no resuelve.
   */
  private static real(idReal: Map<string, string>, id: string): string {
    return idReal.get(id) ?? id;
  }

  private async seedSources(
    em: EntityManager,
    now: Date,
  ): Promise<{ inserted: number; idReal: Map<string, string> }> {
    let inserted = 0;
    // Traducción del id que trae el dataset al que de verdad está en la base.
    // Sólo lleva entradas para las fuentes que ya existían con OTRO id.
    const idReal = new Map<string, string>();
    for (const source of vademecumDataset.sources) {
      const presente = await em.findOne(TerminologySources, {
        code: source.code,
      });
      if (presente) {
        if (presente.id !== source.id) idReal.set(source.id, presente.id);
        continue;
      }
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
    return { inserted, idReal };
  }

  /**
   * El code system `vademecum` propiamente dicho.
   *
   * `code_systems.source_id` tiene FK contra `terminology_sources.id`, así que
   * no vale insertar el id del dataset a ciegas: si la fuente ya existía con
   * otro id —el caso del parche SQL, ver `seedSources`— esa FK no resuelve y el
   * insert muere. Se traduce por el mapa que dejó `seedSources`.
   */
  private async seedCodeSystem(
    em: EntityManager,
    now: Date,
    idReal: Map<string, string>,
  ): Promise<number> {
    let inserted = 0;
    for (const system of vademecumDataset.codeSystem) {
      const presente = await em.findOne(CodeSystems, {
        internalCode: system.internal_code,
      });
      if (presente) {
        if (presente.id !== system.id) idReal.set(system.id, presente.id);
        continue;
      }
      em.create(
        CodeSystems,
        {
          id: system.id,
          sourceId: idReal.get(system.source_id) ?? system.source_id,
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
  private async seedVersion(
    em: EntityManager,
    now: Date,
    idReal: Map<string, string>,
  ): Promise<number> {
    let inserted = 0;
    for (const version of vademecumDataset.codeSystemVersion) {
      const codeSystemId =
        idReal.get(version.code_system_id) ?? version.code_system_id;
      const presente = await em.findOne(CodeSystemVersions, {
        codeSystemId,
        version: version.version,
      });
      if (presente) {
        if (presente.id !== version.id) idReal.set(version.id, presente.id);
        continue;
      }
      em.create(
        CodeSystemVersions,
        {
          id: version.id,
          codeSystemId,
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
  private async seedConcepts(
    em: EntityManager,
    now: Date,
    idReal: Map<string, string>,
  ): Promise<number> {
    // Una sola consulta por la clave natural (version, code) en vez de una por
    // concepto: son 17 hoy, pero el dataset crece con cada versión del
    // vademécum y esto corre en cada arranque.
    const versionIds = [
      ...new Set(
        vademecumDataset.concepts.map(
          (c) =>
            idReal.get(c.code_system_version_id) ?? c.code_system_version_id,
        ),
      ),
    ];
    const present = await em.find(
      CatalogConcepts,
      {
        codeSystemVersionId: { $in: versionIds },
        code: { $in: vademecumDataset.concepts.map((c) => c.code) },
      },
      { fields: ['id', 'codeSystemVersionId', 'code'] },
    );
    const existing = new Map(
      present.map((c) => [`${c.codeSystemVersionId}|${c.code}`, c.id]),
    );

    let inserted = 0;
    for (const concept of vademecumDataset.concepts) {
      const codeSystemVersionId =
        idReal.get(concept.code_system_version_id) ??
        concept.code_system_version_id;
      const yaEsta = existing.get(`${codeSystemVersionId}|${concept.code}`);
      if (yaEsta !== undefined) {
        if (yaEsta !== concept.id) idReal.set(concept.id, yaEsta);
        continue;
      }
      em.create(
        CatalogConcepts,
        {
          id: concept.id,
          codeSystemVersionId,
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
    idReal: Map<string, string>,
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
          conceptId: VademecumSeedService.real(idReal, designation.concept_id),
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
  private async seedProperties(
    em: EntityManager,
    now: Date,
    idReal: Map<string, string>,
  ): Promise<number> {
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
          conceptId: VademecumSeedService.real(idReal, property.concept_id),
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
    idReal: Map<string, string>,
  ): Promise<number> {
    let inserted = 0;
    for (const interaction of vademecumDataset.interactions) {
      if (await em.findOne(DrugInteractions, { id: interaction.id })) continue;
      em.create(
        DrugInteractions,
        {
          id: interaction.id,
          substanceAConceptId: VademecumSeedService.real(
            idReal,
            interaction.substance_a_concept_id,
          ),
          substanceBConceptId: VademecumSeedService.real(
            idReal,
            interaction.substance_b_concept_id,
          ),
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
