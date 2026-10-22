import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystemVersions,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  AFFILIATION_CATALOG_SETS,
  AFFILIATION_CATALOG_VERSION,
  affiliationCodeSystemVersionId,
  affiliationCodeSystemVersionLabel,
  affiliationConceptId,
  affiliationMemberId,
  affiliationSetCanonicalUrl,
  affiliationSetId,
  affiliationSetVersionId,
  type AffiliationCatalogSet,
} from './affiliation-catalogs.catalog';

/** Entorno de persistencia bifurcado que recibe cada paso. */
type SeedEntityManager = ReturnType<MikroORM['em']['fork']>;

/** Cuántas filas insertó una pasada, por nivel. */
export interface AffiliationCatalogsSeedResult {
  /** Versiones de sistema de códigos creadas (una por conjunto). */
  codeSystemVersions: number;
  /** Conceptos creados. */
  concepts: number;
  /** Conjuntos de valores creados. */
  valueSets: number;
  /** Versiones de conjunto creadas. */
  versions: number;
  /** Membresías de la expansión creadas. */
  memberships: number;
  /** Conjuntos que ya traía otra fuente con otro id y por eso no se tocaron. */
  skippedForeignSets: number;
}

/**
 * Materializa los cuatro conjuntos de valores del onboarding legal de una
 * organización (ver `affiliation-catalogs.catalog.ts`).
 *
 * ## Por qué existe
 *
 * Sin ellos `AffiliationDocumentConceptsService` rechaza el alta de
 * organización con 422 «El catálogo de documentos de afiliación no está
 * disponible». Eran los únicos catálogos del alta que no sembraba la API
 * (defecto D6, 26/09/2026): los demás —tipo de tenant, formas societarias,
 * departamentos— ya tenían su seeder.
 *
 * ## Idempotencia
 *
 * Todo id es determinista (UUIDv5 sobre una clave estable): una corrida
 * repetida compara por id e inserta sólo lo que falta, así que arrancar dos
 * veces no duplica ni escribe nada la segunda vez. Una siembra a medias se
 * completa.
 *
 * ## Convivencia con el paquete de seeds del modelo
 *
 * El paquete del modelo (`gen_seeds.py`) declara los mismos conjuntos, con otros
 * ids. `value_sets.internal_code` es único, así que si la base ya los trae de
 * ahí el conjunto **se deja como está** y se avisa: el dueño de esas filas es
 * el paquete, y mezclar conceptos de dos orígenes en el mismo conjunto
 * dejaría miembros duplicados por código. Un conjunto que la propia API
 * sembró antes (mismo id) sí se completa.
 *
 * Corre **después** de `TerminologySeedService`: los conceptos cuelgan del
 * sistema de códigos interno (`SEED.codeSystemId`) y `CONCEPTS.TERM_ACTIVE`
 * es el estado que aquél materializa. El orquestador (`SeedBootstrapService`)
 * impone el orden.
 */
@Injectable()
export class AffiliationCatalogsSeedService {
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
    this.logger.setContext(AffiliationCatalogsSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que `yarn seed:boot` y el arnés de las
   * pruebas de integración puedan garantizar el catálogo por su cuenta.
   *
   * @returns Cuántas filas insertó esta pasada, por nivel.
   */
  async run(): Promise<AffiliationCatalogsSeedResult> {
    this.assertUniqueCodes();

    const em = this.orm.em.fork();
    const now = new Date();
    const counters: AffiliationCatalogsSeedResult = {
      codeSystemVersions: 0,
      concepts: 0,
      valueSets: 0,
      versions: 0,
      memberships: 0,
      skippedForeignSets: 0,
    };

    for (const set of AFFILIATION_CATALOG_SETS) {
      if (await this.isOwnedByAnotherSource(em, set)) {
        counters.skippedForeignSets += 1;
        this.logger.warn(
          { operation: 'seed.affiliation-catalogs', valueSet: set.code },
          'El conjunto ya existe con otro id (paquete de seeds del modelo): no se toca',
        );
        continue;
      }
      await this.seedSet(em, now, set, counters);
    }

    const inserted =
      counters.codeSystemVersions +
      counters.concepts +
      counters.valueSets +
      counters.versions +
      counters.memberships;
    if (inserted > 0) {
      this.logger.info(
        { operation: 'seed.affiliation-catalogs', ...counters },
        'Catálogos de afiliación y representación legal materializados',
      );
    }
    return counters;
  }

  /**
   * Rompe si el catálogo declara dos veces el mismo código dentro de un
   * conjunto: colapsarían en el mismo id y una taparía a la otra sin avisar.
   */
  private assertUniqueCodes(): void {
    for (const set of AFFILIATION_CATALOG_SETS) {
      const seen = new Set<string>();
      for (const member of set.members) {
        if (seen.has(member.code)) {
          throw new Error(
            `El catálogo ${set.code} declara el código "${member.code}" más de una vez`,
          );
        }
        seen.add(member.code);
      }
    }
  }

  /** `true` si el conjunto ya está en la base con un id que no es el de este seeder. */
  private async isOwnedByAnotherSource(
    em: SeedEntityManager,
    set: AffiliationCatalogSet,
  ): Promise<boolean> {
    const present = await em.findOne(ValueSets, { internalCode: set.code });
    return present !== null && present.id !== affiliationSetId(set);
  }

  /** Los cinco niveles de un conjunto, de abajo hacia arriba por dependencia de FK. */
  private async seedSet(
    em: SeedEntityManager,
    now: Date,
    set: AffiliationCatalogSet,
    counters: AffiliationCatalogsSeedResult,
  ): Promise<void> {
    // Nivel 1: la versión del sistema de códigos que aloja los conceptos.
    const codeSystemVersionId = affiliationCodeSystemVersionId(set);
    const [hasCodeSystemVersion] = await this.existingIds(
      em,
      CodeSystemVersions,
      [codeSystemVersionId],
    );
    if (!hasCodeSystemVersion) {
      em.create(
        CodeSystemVersions,
        {
          id: codeSystemVersionId,
          codeSystemId: SEED.codeSystemId,
          version: affiliationCodeSystemVersionLabel(set),
          publishedAt: now,
          // La vigente del sistema interno es `SEED.version`; ésta sólo existe
          // para que `OTRO` no choque entre conjuntos.
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.codeSystemVersions += 1;
      await em.flush();
    }

    // Nivel 2: los conceptos.
    const existingConcepts = new Set(
      await this.existingIds(
        em,
        CatalogConcepts,
        set.members.map((member) => affiliationConceptId(set, member.code)),
      ),
    );
    for (const member of set.members) {
      const id = affiliationConceptId(set, member.code);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId,
          code: member.code,
          display: member.display,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.concepts += 1;
    }
    await em.flush();

    // Nivel 3: el conjunto de valores.
    const valueSetIdentifier = affiliationSetId(set);
    const [hasValueSet] = await this.existingIds(em, ValueSets, [
      valueSetIdentifier,
    ]);
    if (!hasValueSet) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: set.code,
          name: set.name,
          canonicalUrl: affiliationSetCanonicalUrl(set),
          description: set.description,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
      await em.flush();
    }

    // Nivel 4: su versión única, marcada vigente. Sin esa marca,
    // `findIncludedConceptIdsByValueSet` devuelve `null` y el servicio de
    // dominio responde igual «no está disponible».
    const versionIdentifier = affiliationSetVersionId(set);
    const [hasVersion] = await this.existingIds(em, ValueSetVersions, [
      versionIdentifier,
    ]);
    if (!hasVersion) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: AFFILIATION_CATALOG_VERSION,
          validFrom: now,
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.versions += 1;
      await em.flush();
    }

    // Nivel 5: la expansión, en el orden declarado.
    const existingMembers = new Set(
      await this.existingIds(
        em,
        ValueSetMembers,
        set.members.map((member) => affiliationMemberId(set, member.code)),
      ),
    );
    set.members.forEach((member, ordinal) => {
      const id = affiliationMemberId(set, member.code);
      if (existingMembers.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: affiliationConceptId(set, member.code),
          included: true,
          ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.memberships += 1;
    });
    await em.flush();
  }

  /** Los ids que ya están en la base, de entre los que se van a sembrar. */
  private async existingIds<T extends object>(
    em: SeedEntityManager,
    entity: new () => T,
    ids: string[],
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return rows.map((row) => (row as { id: string }).id);
  }
}
