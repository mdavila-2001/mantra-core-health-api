import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PreconditionFailedException } from '../../../common';
import {
  BO_DEPARTMENT_BY_INE_PREFIX,
  BO_DEPARTMENT_VALUE_SET,
  BO_MUNICIPALITY_VALUE_SET,
} from '../../../common/seed/bo-geography.catalog';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import { ValueSetsRepository } from '../../terminology/repositories/value-sets.repository';

/**
 * El filtro territorial ya resuelto: o un municipio, o un departamento.
 *
 * Nunca los dos. Con municipio, el departamento sobra —el municipio ya está
 * adentro de uno solo— y acotar por los dos sería acotar dos veces lo mismo.
 */
export type PublicTerritoryFilter =
  | { readonly municipalityConceptId: string }
  | {
      readonly departmentConceptId: string;
      /**
       * Los prefijos de código con los que empiezan los municipios de ese
       * departamento, uno por cada forma de código sembrada (ver
       * {@link departmentSiglaOfMunicipalityCode}).
       */
      readonly municipalityCodePrefixes: readonly string[];
    };

/** Prefijo del código de concepto de un departamento (`geo:bo:department:SC`). */
const DEPARTMENT_CODE_PREFIX = 'geo:bo:department:';

/** Prefijo del código de concepto de un municipio por INE (`geo:bo:municipality:070101`). */
const MUNICIPALITY_INE_CODE_PREFIX = 'geo:bo:municipality:';

/**
 * La sigla del departamento del que cuelga un municipio, a partir de su código.
 *
 * Hay **dos** formas de código sembradas, según quién sembró la base:
 *
 * - `<SIGLA>-<NOMBRE>` (`SC-SANTA_CRUZ_DE_LA_SIERRA`), la del generador del
 *   modelo, que es la que describe `residence-address.ts`;
 * - `geo:bo:municipality:<INE>` (`geo:bo:municipality:070101`), la del catálogo
 *   estático `bo-geography.catalog.ts`, cuyos dos primeros dígitos son el
 *   departamento. Es la que tiene la base de desarrollo del compose.
 *
 * Se aceptan las dos porque aceptar una sola dejaría el filtro vacío, sin
 * avisar, en la base que use la otra.
 */
export function departmentSiglaOfMunicipalityCode(
  code: string,
): string | undefined {
  const sigla = code.match(/^([A-Z]{2})-/)?.[1];
  if (sigla) return sigla;
  const ine = code.startsWith(MUNICIPALITY_INE_CODE_PREFIX)
    ? code.slice(MUNICIPALITY_INE_CODE_PREFIX.length).match(/^(\d{2})\d{4}$/)
    : null;
  return ine ? BO_DEPARTMENT_BY_INE_PREFIX.get(ine[1]) : undefined;
}

/** Los prefijos de código de los municipios de un departamento, en las dos formas. */
function municipalityCodePrefixesOf(sigla: string): string[] {
  const prefijos = [`${sigla}-`];
  for (const [ine, candidata] of BO_DEPARTMENT_BY_INE_PREFIX) {
    if (candidata === sigla)
      prefijos.push(`${MUNICIPALITY_INE_CODE_PREFIX}${ine}`);
  }
  return prefijos;
}

/**
 * Valida y resuelve el filtro territorial en dos pasos del directorio público
 * (departamento → municipio, subtarea 2.3).
 *
 * Mismo criterio que la especialidad (AC-02-8): un uuid que no pertenece al
 * catálogo se rechaza con **422**, nunca se ignora. Ignorarlo devolvería el
 * directorio entero y la pantalla diría, sin decirlo, que todos ésos están en
 * el lugar pedido. Por lo mismo, un municipio que no es del departamento elegido
 * también es 422: no hay criterio para decidir cuál de los dos gana.
 *
 * No cachea, igual que `AdministrativeAreaCatalogService`: son lecturas por
 * índice contra catálogos chicos.
 */
@Injectable()
export class PublicTerritoryFilterService {
  /**
   * @param valueSets - Conjuntos de valores, para saber qué es departamento y qué municipio.
   * @param concepts - Conceptos del catálogo, para leer su código.
   */
  constructor(
    private readonly valueSets: ValueSetsRepository,
    private readonly concepts: CatalogConceptsRepository,
  ) {}

  /**
   * Resuelve el par pedido a un filtro aplicable.
   *
   * @param em - Contexto de persistencia.
   * @param pedido - `concept_id` de departamento y/o de municipio, tal como llegaron.
   * @returns El filtro, o `undefined` si no se pidió ninguno de los dos.
   * @throws PreconditionFailedException (422) si alguno no es del catálogo, o si
   *   el municipio no pertenece al departamento.
   */
  async resolve(
    em: EntityManager,
    pedido: { department?: string; municipality?: string },
  ): Promise<PublicTerritoryFilter | undefined> {
    const department = pedido.department?.trim() || undefined;
    const municipality = pedido.municipality?.trim() || undefined;
    if (!department && !municipality) return undefined;

    let departmentSigla: string | undefined;
    if (department) {
      await this.assertMember(em, BO_DEPARTMENT_VALUE_SET, department, {
        mensaje:
          'El departamento no pertenece al catálogo de departamentos de Bolivia',
      });
      const code = (await this.concepts.findById(em, department))?.code ?? '';
      departmentSigla = code.startsWith(DEPARTMENT_CODE_PREFIX)
        ? code.slice(DEPARTMENT_CODE_PREFIX.length)
        : undefined;
      if (!departmentSigla) {
        throw new PreconditionFailedException(
          'El departamento no tiene una sigla reconocible en el catálogo',
          { conceptId: department },
        );
      }
    }

    if (!municipality) {
      return {
        departmentConceptId: department!,
        municipalityCodePrefixes: municipalityCodePrefixesOf(departmentSigla!),
      };
    }

    await this.assertMember(em, BO_MUNICIPALITY_VALUE_SET, municipality, {
      mensaje: 'El municipio no pertenece al catálogo de municipios de Bolivia',
    });
    if (departmentSigla) {
      const code = (await this.concepts.findById(em, municipality))?.code ?? '';
      if (departmentSiglaOfMunicipalityCode(code) !== departmentSigla) {
        throw new PreconditionFailedException(
          'El municipio no pertenece al departamento elegido',
          { department, municipality },
        );
      }
    }
    return { municipalityConceptId: municipality };
  }

  /** Falla con 422 si el concepto no es miembro del conjunto de valores. */
  private async assertMember(
    em: EntityManager,
    valueSetCode: string,
    conceptId: string,
    opciones: { mensaje: string },
  ): Promise<void> {
    const conjunto = await this.valueSets.findByInternalCode(em, valueSetCode);
    const miembros = conjunto
      ? await this.valueSets.findIncludedConceptIdsByValueSet(em, conjunto.id)
      : null;
    // Un catálogo ausente no es «ningún lugar es válido»: se dice lo que pasa.
    if (miembros === null) {
      throw new PreconditionFailedException(
        'El catálogo territorial no está disponible',
        { valueSet: valueSetCode },
      );
    }
    if (!miembros.includes(conceptId)) {
      throw new PreconditionFailedException(opciones.mensaje, {
        conceptId,
        valueSet: valueSetCode,
      });
    }
  }
}
