import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PreconditionFailedException } from '../../../common';
import { ValueSetsRepository } from '../../terminology/repositories/value-sets.repository';

/**
 * El código interno estable del catálogo de departamentos de Bolivia.
 *
 * Se nombra por código y no por uuid por lo mismo que
 * `MEDICAL_SPECIALTY_VALUE_SET`: el uuid es derivado del generador de seeds y
 * quedaría mudo y desactualizado; el código es lo que declara el catálogo.
 */
export const ADMINISTRATIVE_AREA_VALUE_SET = 'VS_BO_DEPARTMENT';

/**
 * Quién decide si un uuid es un departamento boliviano.
 *
 * Misma forma —y mismo motivo— que {@link MedicalSpecialtyCatalogService}: la
 * columna que gobierna (`identifiers.issuer_administrative_area_concept_id`) es
 * una FK a `terminology.catalog_concepts`, así que la base acepta **cualquier**
 * concepto. Filtrar la búsqueda por un uuid que no es un departamento no
 * rompería nada visible: devolvería cero resultados y quien busca leería «no
 * existe esa persona», que es una respuesta falsa. Por eso se rechaza con 422
 * en vez de dejar pasar.
 *
 * Lo usa la búsqueda de pacientes por documento (TAREA-07, AC-07-2): el mismo
 * número de carnet expedido en La Paz y en Santa Cruz son dos personas
 * distintas, y el departamento es lo que las separa.
 */
@Injectable()
export class AdministrativeAreaCatalogService {
  constructor(private readonly valueSets: ValueSetsRepository) {}

  /**
   * Falla con 422 si el concepto no es un departamento del catálogo.
   *
   * No cachea, por lo mismo que el catálogo de especialidades: son dos lecturas
   * por índice contra nueve filas, y cachear cambiaría el momento en que un
   * departamento recién sembrado se vuelve elegible.
   *
   * @param em - Contexto de persistencia.
   * @param conceptId - El concepto que el cliente quiere usar como filtro.
   */
  async assertIsAdministrativeArea(
    em: EntityManager,
    conceptId: string,
  ): Promise<void> {
    const miembros = await this.listMemberIds(em);
    if (!miembros.has(conceptId)) {
      throw new PreconditionFailedException(
        'El departamento no pertenece al catálogo de departamentos de Bolivia',
        { conceptId, valueSet: ADMINISTRATIVE_AREA_VALUE_SET },
      );
    }
  }

  /**
   * Los conceptos que el catálogo declara hoy.
   *
   * Un catálogo ausente no se trata como «ningún departamento es válido»: eso
   * convertiría un problema de datos en un rechazo a toda búsqueda por
   * documento. Se dice que el catálogo no está disponible, que es lo que pasa.
   */
  private async listMemberIds(em: EntityManager): Promise<ReadonlySet<string>> {
    const conjunto = await this.valueSets.findByInternalCode(
      em,
      ADMINISTRATIVE_AREA_VALUE_SET,
    );
    const miembros =
      conjunto === null
        ? null
        : await this.valueSets.findIncludedConceptIdsByValueSet(
            em,
            conjunto.id,
          );
    if (miembros === null) {
      throw new PreconditionFailedException(
        'El catálogo de departamentos no está disponible',
        { valueSet: ADMINISTRATIVE_AREA_VALUE_SET },
      );
    }
    return new Set(miembros);
  }
}
