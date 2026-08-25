import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  ConceptProperties,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  PROVIDER_DIRECTORY_ENTRIES,
  PROVIDER_DIRECTORY_PROPERTY_CODES,
  PROVIDER_DIRECTORY_PROPERTY_DATA_TYPE,
  PROVIDER_DIRECTORY_VALUE_SET,
  PROVIDER_DIRECTORY_VALUE_SET_NAME,
  PROVIDER_DIRECTORY_VERSION,
  providerDirectoryCanonicalUrl,
  providerDirectoryConceptCode,
  providerDirectoryConceptId,
  providerDirectoryMemberId,
  providerDirectoryPropertyId,
  providerDirectoryValueSetId,
  providerDirectoryVersionId,
  type ProviderDirectoryEntry,
} from './provider-directory.catalog';

/** Cuántas filas creó cada nivel de la siembra. */
export interface ProviderDirectoryCounters {
  valueSets: number;
  versions: number;
  practitioners: number;
  properties: number;
  memberships: number;
}

/**
 * Siembra el directorio de médicos habilitados de Alianza y Nacional Seguros.
 *
 * Son 763 fichas —961 filas del dataset, fusionadas: 198 médicos figuran en
 * las dos redes— **sin cuenta de usuario**. El dataset no trae
 * correo y el alta de la API lo exige, así que no pueden iniciar sesión. Lo que
 * el directorio da es lo que el registro de procesos pide en PACIENTE §3.2
 * —«revisar cuáles son los médicos que trabajan con cada aseguradora»—: fichas
 * que se ven y se buscan.
 *
 * El día que uno de esos médicos se registre de verdad, su alta *reclama* la
 * ficha. Ese vínculo no existe todavía: hoy el concepto y un eventual
 * `health_practitioner_profiles` son dos cosas separadas.
 *
 * Sigue el mismo patrón que `BoliviaFacilitiesSeedService` —value set, versión,
 * conceptos, propiedades, expansión— y por las mismas razones: es idempotente,
 * y `isDefault: true` en la versión es lo que hace que leer la expansión sin
 * pedir versión no devuelva 404.
 */
@Injectable()
export class ProviderDirectorySeedService {
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
    this.logger.setContext(ProviderDirectorySeedService.name);
  }

  /**
   * Materializa el directorio completo.
   *
   * @returns Cuántas filas creó cada nivel.
   */
  async run(): Promise<ProviderDirectoryCounters> {
    const em = this.orm.em.fork();
    const now = new Date();
    const contadores: ProviderDirectoryCounters = {
      valueSets: 0,
      versions: 0,
      practitioners: 0,
      properties: 0,
      memberships: 0,
    };

    const valueSetIdentifier = providerDirectoryValueSetId();
    const versionIdentifier = providerDirectoryVersionId();

    // Los dos niveles se flushean por separado y no juntos al final:
    // `value_set_versions.value_set_id` es una columna `uuid` plana con FK, no
    // una relación del ORM, así que MikroORM ordena los inserts por tabla y no
    // por dependencia — la versión podía salir antes que el conjunto y violar
    // su FK. Es el mismo motivo por el que `TerminologySeedService` flushea por
    // niveles.

    // --- Nivel 1: el conjunto ---
    if (!(await em.findOne(ValueSets, { id: valueSetIdentifier }))) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: PROVIDER_DIRECTORY_VALUE_SET,
          name: PROVIDER_DIRECTORY_VALUE_SET_NAME,
          canonicalUrl: providerDirectoryCanonicalUrl(),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      contadores.valueSets += 1;
      await em.flush();
    }

    // --- Nivel 2: su versión vigente ---
    if (!(await em.findOne(ValueSetVersions, { id: versionIdentifier }))) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: PROVIDER_DIRECTORY_VERSION,
          validFrom: now,
          // Sin esta marca, leer la expansión sin versión devuelve 404 aunque
          // el conjunto y sus miembros existan.
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      contadores.versions += 1;
      await em.flush();
    }

    contadores.practitioners += await this.seedConcepts(em, now);
    contadores.properties += await this.seedProperties(em, now);
    contadores.memberships += await this.seedMemberships(
      em,
      now,
      versionIdentifier,
    );

    const total =
      contadores.valueSets +
      contadores.versions +
      contadores.practitioners +
      contadores.properties +
      contadores.memberships;
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.provider-directory', ...contadores },
        'Directorio de médicos habilitados materializado',
      );
    }
    return contadores;
  }

  /** Un concepto por profesional. */
  private async seedConcepts(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existentes = await this.existingIds(
      em,
      CatalogConcepts,
      PROVIDER_DIRECTORY_ENTRIES.map(providerDirectoryConceptId),
    );

    let creados = 0;
    for (const profesional of PROVIDER_DIRECTORY_ENTRIES) {
      const id = providerDirectoryConceptId(profesional);
      if (existentes.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: providerDirectoryConceptCode(profesional),
          // El nombre propio de una persona no tiene traducción: va tal cual
          // viene de la red, sin designación aparte.
          display: profesional.nombre,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /** Especialidades, ciudad, sedes, planes y aseguradoras. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const declaradas = PROVIDER_DIRECTORY_ENTRIES.flatMap((profesional) =>
      this.propertiesOf(profesional).map(([propertyCode, value]) => ({
        id: providerDirectoryPropertyId(profesional, propertyCode),
        conceptId: providerDirectoryConceptId(profesional),
        propertyCode,
        value,
      })),
    );

    const existentes = await this.existingIds(
      em,
      ConceptProperties,
      declaradas.map((p) => p.id),
    );

    let creadas = 0;
    for (const propiedad of declaradas) {
      if (existentes.has(propiedad.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: propiedad.id,
          conceptId: propiedad.conceptId,
          propertyCode: propiedad.propertyCode,
          dataType: PROVIDER_DIRECTORY_PROPERTY_DATA_TYPE,
          valueJson: propiedad.value,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
    }
    await em.flush();
    return creadas;
  }

  /**
   * Lo que cada profesional declara, como pares código → valor.
   *
   * Todo va en `value_json` porque la columna es una sola (`jsonb`): las listas
   * viajan como arrays y no como texto concatenado, que es lo que permite
   * filtrar por especialidad sin parsear una cadena.
   */
  private propertiesOf(
    profesional: ProviderDirectoryEntry,
  ): [string, unknown][] {
    return [
      [
        PROVIDER_DIRECTORY_PROPERTY_CODES.especialidades,
        profesional.especialidades,
      ],
      [PROVIDER_DIRECTORY_PROPERTY_CODES.ciudad, profesional.ciudad],
      [PROVIDER_DIRECTORY_PROPERTY_CODES.sedes, profesional.sedes],
      [PROVIDER_DIRECTORY_PROPERTY_CODES.planes, profesional.planes],
      [
        PROVIDER_DIRECTORY_PROPERTY_CODES.aseguradoras,
        profesional.aseguradoras,
      ],
    ];
  }

  /** La expansión: cada profesional es miembro del conjunto. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
    versionIdentifier: string,
  ): Promise<number> {
    const existentes = await this.existingIds(
      em,
      ValueSetMembers,
      PROVIDER_DIRECTORY_ENTRIES.map(providerDirectoryMemberId),
    );

    let creadas = 0;
    let ordinal = 0;
    for (const profesional of PROVIDER_DIRECTORY_ENTRIES) {
      const id = providerDirectoryMemberId(profesional);
      const posicion = ordinal;
      ordinal += 1;
      if (existentes.has(id)) continue;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: providerDirectoryConceptId(profesional),
          included: true,
          ordinal: posicion,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
    }
    await em.flush();
    return creadas;
  }

  /**
   * Qué ids de los pedidos ya están en la base.
   *
   * En bloques, porque son casi cinco mil propiedades y una sola cláusula `IN`
   * con todas ellas es una consulta que ningún planificador agradece.
   */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entidad: new () => T,
    ids: readonly string[],
  ): Promise<ReadonlySet<string>> {
    const encontrados = new Set<string>();
    const TAMANO_BLOQUE = 500;
    for (let inicio = 0; inicio < ids.length; inicio += TAMANO_BLOQUE) {
      const bloque = ids.slice(inicio, inicio + TAMANO_BLOQUE);
      const filas = await em.find(
        entidad,
        { id: { $in: bloque } },
        { fields: ['id'] as never },
      );
      for (const fila of filas) {
        encontrados.add((fila as { id: string }).id);
      }
    }
    return encontrados;
  }
}
