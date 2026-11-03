import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CatalogConceptsRepository,
  ConceptDesignationsRepository,
  ValueSetsRepository,
} from '../../../terminology/repositories';
import type { ProfilesTerminologyPort } from '../../application/ports/profiles-terminology.port';

@Injectable()
export class ProfilesTerminologyAdapter implements ProfilesTerminologyPort {
  constructor(
    private readonly valueSets: ValueSetsRepository,
    private readonly concepts: CatalogConceptsRepository,
    private readonly properties: ConceptDesignationsRepository,
  ) {}

  findByInternalCode(em: EntityManager, internalCode: string) {
    return this.valueSets.findByInternalCode(em, internalCode);
  }

  findIncludedConceptIdsByValueSet(em: EntityManager, valueSetId: string) {
    return this.valueSets.findIncludedConceptIdsByValueSet(em, valueSetId);
  }

  search(
    em: EntityManager,
    filters: { query?: string; ids?: string[] },
    limit: number,
  ) {
    return this.concepts.search(em, filters, limit);
  }

  findPropertyForConcepts(
    em: EntityManager,
    conceptIds: string[],
    propertyCode: string,
  ) {
    return this.properties.findPropertyForConcepts(
      em,
      conceptIds,
      propertyCode,
    );
  }
}
