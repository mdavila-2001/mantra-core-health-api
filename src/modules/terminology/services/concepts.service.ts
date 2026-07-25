import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CatalogConceptsRepository, ConceptDesignationsRepository, ConceptRelationshipsRepository } from '../repositories';
import {
  type CreateDesignationDto,
  type DesignationResponseDto,
  type CreateRelationshipDto,
  type RelationshipResponseDto,
} from '../dto';

/** Tipo de dato por defecto para propiedades de concepto sin `dataType` explícito. */
const DEFAULT_PROPERTY_DATA_TYPE = 'string';

/**
 * Reglas de negocio sobre conceptos ya existentes: alta de designaciones (y
 * propiedades) (UC-03-05) y relaciones entre conceptos (UC-03-06).
 */
@Injectable()
export class ConceptsService {
  constructor(
    private readonly em: EntityManager,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly designationsRepo: ConceptDesignationsRepository,
    private readonly relationshipsRepo: ConceptRelationshipsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConceptsService.name);
  }

  /** UC-03-05: añade una designación (y opcionalmente propiedades) a un concepto. */
  async addDesignation(
    conceptId: string,
    dto: CreateDesignationDto,
    actor: AuthenticatedUser,
  ): Promise<DesignationResponseDto> {
    this.logger.info(
      { operation: 'terminology.concept.designation.create', conceptId },
      'Añadiendo designación a concepto',
    );

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findById(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', { conceptId });
      }

      const languageConceptId = dto.language === 'EN' ? CONCEPTS.LANG_EN : CONCEPTS.LANG_ES;
      const designationTypeConceptId =
        dto.designationType === 'PREFERRED' ? CONCEPTS.DESIG_PREFERRED : CONCEPTS.DESIG_SYNONYM;

      const designation = this.designationsRepo.createDesignation(tx, {
        conceptId,
        value: dto.value,
        languageConceptId,
        designationTypeConceptId,
        preferred: dto.preferred,
        actorUserId: actor.id,
      });

      const properties = dto.properties ?? [];
      for (const property of properties) {
        this.designationsRepo.createProperty(tx, {
          conceptId,
          propertyCode: property.propertyCode,
          valueJson: property.valueJson,
          dataType: property.dataType ?? DEFAULT_PROPERTY_DATA_TYPE,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        { operation: 'terminology.concept.designation.create', designationId: designation.id },
        'Designación creada',
      );
      return {
        id: designation.id,
        conceptId,
        value: designation.value,
        languageConceptId,
        designationTypeConceptId,
        preferred: designation.preferred,
        propertiesCount: properties.length,
      };
    });
  }

  /** UC-03-06: crea una relación dirigida entre dos conceptos existentes. */
  async addRelationship(
    conceptId: string,
    dto: CreateRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<RelationshipResponseDto> {
    this.logger.info(
      { operation: 'terminology.concept.relationship.create', conceptId, targetConceptId: dto.targetConceptId },
      'Creando relación entre conceptos',
    );

    if (dto.targetConceptId === conceptId) {
      this.logger.warn(
        { operation: 'terminology.concept.relationship.create', conceptId },
        'Relación rechazada: un concepto no puede relacionarse consigo mismo',
      );
      throw new ConflictException('Un concepto no puede relacionarse consigo mismo', { conceptId });
    }

    return this.em.transactional(async (tx) => {
      const source = await this.conceptsRepo.findById(tx, conceptId);
      if (!source) {
        throw new ResourceNotFoundException('Concepto origen no encontrado', { conceptId });
      }
      const target = await this.conceptsRepo.findById(tx, dto.targetConceptId);
      if (!target) {
        throw new ResourceNotFoundException('Concepto destino no encontrado', {
          targetConceptId: dto.targetConceptId,
        });
      }

      const relationshipTypeConceptId =
        dto.relationshipType === 'PART_OF' ? CONCEPTS.REL_PART_OF : CONCEPTS.REL_IS_A;

      const duplicate = await this.relationshipsRepo.findEquivalent(
        tx,
        conceptId,
        dto.targetConceptId,
        relationshipTypeConceptId,
      );
      if (duplicate) {
        this.logger.warn(
          { operation: 'terminology.concept.relationship.create', conceptId, targetConceptId: dto.targetConceptId },
          'Relación duplicada',
        );
        throw new ConflictException('Ya existe una relación equivalente entre esos conceptos', {
          conceptId,
          targetConceptId: dto.targetConceptId,
        });
      }

      const relationship = this.relationshipsRepo.create(tx, {
        sourceConceptId: conceptId,
        targetConceptId: dto.targetConceptId,
        relationshipTypeConceptId,
        ordinal: dto.ordinal,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'terminology.concept.relationship.create', relationshipId: relationship.id },
        'Relación creada',
      );
      return {
        id: relationship.id,
        sourceConceptId: conceptId,
        targetConceptId: dto.targetConceptId,
        relationshipTypeConceptId,
        ordinal: relationship.ordinal,
      };
    });
  }
}
