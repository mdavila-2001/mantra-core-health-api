import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PreconditionFailedException } from '../../../../common';
import { BO_FACILITY_VALUE_SET } from '../../../../common/seed/bolivia-facilities.catalog';
import {
  PROFILES_TERMINOLOGY_PORT,
  type ProfilesTerminologyPort,
} from '../ports/profiles-terminology.port';

/**
 * Quién decide si un uuid es un establecimiento del padrón oficial
 * (`VS_BO_HEALTH_FACILITY`).
 *
 * Misma forma que {@link AdministrativeAreaCatalogService}: la columna
 * `practitioner_affiliations.health_facility_concept_id` es una FK plana a
 * `terminology.catalog_concepts`, así que la base aceptaría cualquier concepto
 * como si fuera un hospital. El catálogo decide cuáles lo son.
 */
@Injectable()
export class HealthFacilityCatalogService {
  constructor(
    @Inject(PROFILES_TERMINOLOGY_PORT)
    private readonly terminology: ProfilesTerminologyPort,
  ) {}

  /**
   * Falla con 422 si el concepto no integra el padrón.
   *
   * @param em - Contexto de persistencia.
   * @param conceptId - El concepto que el cliente declara como establecimiento.
   */
  async assertIsHealthFacility(
    em: EntityManager,
    conceptId: string,
  ): Promise<void> {
    const set = await this.terminology.findByInternalCode(
      em,
      BO_FACILITY_VALUE_SET,
    );
    const members =
      set === null
        ? null
        : await this.terminology.findIncludedConceptIdsByValueSet(em, set.id);
    if (members === null) {
      throw new PreconditionFailedException(
        'El padrón de establecimientos no está disponible',
        { valueSet: BO_FACILITY_VALUE_SET },
      );
    }
    if (!members.includes(conceptId)) {
      throw new PreconditionFailedException(
        'El establecimiento no pertenece al padrón oficial de establecimientos de salud',
        { conceptId, valueSet: BO_FACILITY_VALUE_SET },
      );
    }
  }
}
