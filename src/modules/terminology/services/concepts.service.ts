import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
  ConceptDesignationsRepository,
  ConceptRelationshipsRepository,
  ValueSetsRepository,
} from '../repositories';
import {
  type CreateDesignationDto,
  type DesignationResponseDto,
  type CreateRelationshipDto,
  type RelationshipResponseDto,
  type UpsertConceptPropertiesDto,
  type ConceptPropertiesResponseDto,
  type DeprecateConceptDto,
  type DeprecateConceptResponseDto,
  type LookupResponseDto,
} from '../dto';

/** Tipo de dato por defecto para propiedades de concepto sin `dataType` explícito. */
const DEFAULT_PROPERTY_DATA_TYPE = 'string';

/**
 * Reglas de negocio sobre conceptos ya existentes: alta de designaciones (y
 * propiedades) (UC-03-05), relaciones entre conceptos (UC-03-06), retirada
 * (UC-03-10) y resolución `$lookup` (UC-03-11).
 */
@Injectable()
export class ConceptsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conceptsRepo - Valor de concepts repo requerido por la operación.
   * @param designationsRepo - Valor de designations repo requerido por la operación.
   * @param relationshipsRepo - Valor de relationships repo requerido por la operación.
   * @param valueSetsRepo - Valor de value sets repo requerido por la operación.
   * @param codeSystemsRepo - Valor de code systems repo requerido por la operación.
   * @param versionsRepo - Valor de versions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly designationsRepo: ConceptDesignationsRepository,
    private readonly relationshipsRepo: ConceptRelationshipsRepository,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly codeSystemsRepo: CodeSystemsRepository,
    private readonly versionsRepo: CodeSystemVersionsRepository,
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
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      const languageConceptId =
        dto.language === 'EN' ? CONCEPTS.LANG_EN : CONCEPTS.LANG_ES;
      const designationTypeConceptId =
        dto.designationType === 'PREFERRED'
          ? CONCEPTS.DESIG_PREFERRED
          : CONCEPTS.DESIG_SYNONYM;

      // El caso de uso exige una sola designación preferida por idioma: al marcar
      // ésta hay que degradar las anteriores, con la fila bloqueada para que dos
      // altas simultáneas no dejen dos preferidas.
      if (dto.preferred) {
        const siblings = await this.designationsRepo.findByLanguageForUpdate(
          tx,
          conceptId,
          languageConceptId,
        );
        for (const sibling of siblings) {
          if (sibling.preferred) {
            sibling.preferred = false;
            touch(sibling, actor.id);
          }
        }
      }

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
        {
          operation: 'terminology.concept.designation.create',
          designationId: designation.id,
        },
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
      {
        operation: 'terminology.concept.relationship.create',
        conceptId,
        targetConceptId: dto.targetConceptId,
      },
      'Creando relación entre conceptos',
    );

    if (dto.targetConceptId === conceptId) {
      this.logger.warn(
        { operation: 'terminology.concept.relationship.create', conceptId },
        'Relación rechazada: un concepto no puede relacionarse consigo mismo',
      );
      throw new ConflictException(
        'Un concepto no puede relacionarse consigo mismo',
        { conceptId },
      );
    }

    return this.em.transactional(async (tx) => {
      const source = await this.conceptsRepo.findById(tx, conceptId);
      if (!source) {
        throw new ResourceNotFoundException('Concepto origen no encontrado', {
          conceptId,
        });
      }
      const target = await this.conceptsRepo.findById(tx, dto.targetConceptId);
      if (!target) {
        throw new ResourceNotFoundException('Concepto destino no encontrado', {
          targetConceptId: dto.targetConceptId,
        });
      }

      const relationshipTypeConceptId =
        dto.relationshipType === 'PART_OF'
          ? CONCEPTS.REL_PART_OF
          : CONCEPTS.REL_IS_A;

      const duplicate = await this.relationshipsRepo.findEquivalent(
        tx,
        conceptId,
        dto.targetConceptId,
        relationshipTypeConceptId,
      );
      if (duplicate) {
        this.logger.warn(
          {
            operation: 'terminology.concept.relationship.create',
            conceptId,
            targetConceptId: dto.targetConceptId,
          },
          'Relación duplicada',
        );
        throw new ConflictException(
          'Ya existe una relación equivalente entre esos conceptos',
          {
            conceptId,
            targetConceptId: dto.targetConceptId,
          },
        );
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
        {
          operation: 'terminology.concept.relationship.create',
          relationshipId: relationship.id,
        },
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

  /**
   * UC-03-05 (segunda mitad): alta o actualización de propiedades del concepto.
   *
   * El caso de uso declara `concept_properties — UPSERT`: reenviar la misma
   * `property_code` actualiza su valor. Insertar sin más dejaría dos filas con el
   * mismo código y el consumidor no sabría cuál vale.
   */
  async upsertProperties(
    conceptId: string,
    dto: UpsertConceptPropertiesDto,
    actor: AuthenticatedUser,
  ): Promise<ConceptPropertiesResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.properties.upsert',
        conceptId,
        count: dto.properties.length,
      },
      'Actualizando propiedades de concepto',
    );

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findById(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      let created = 0;
      let updated = 0;
      // Se recorre en serie a propósito: dos propiedades con el mismo código en el
      // mismo cuerpo tienen que colapsar en una, y para eso la segunda debe ver la
      // que acaba de registrar la primera.
      for (const property of dto.properties) {
        const existing = await this.designationsRepo.findProperty(
          tx,
          conceptId,
          property.propertyCode,
        );
        if (existing) {
          existing.valueJson = property.valueJson;
          existing.dataType = property.dataType ?? existing.dataType;
          touch(existing, actor.id);
          updated += 1;
        } else {
          this.designationsRepo.createProperty(tx, {
            conceptId,
            propertyCode: property.propertyCode,
            valueJson: property.valueJson,
            dataType: property.dataType ?? DEFAULT_PROPERTY_DATA_TYPE,
            actorUserId: actor.id,
          });
          created += 1;
        }
        await tx.flush();
      }

      this.logger.info(
        {
          operation: 'terminology.concept.properties.upsert',
          conceptId,
          created,
          updated,
        },
        'Propiedades de concepto actualizadas',
      );
      return { conceptId, created, updated };
    });
  }

  /**
   * UC-03-10: retira un concepto (soft-retire, nunca borrado) y opcionalmente
   * apunta al que lo reemplaza.
   *
   * Además excluye el concepto de las expansiones de conjuntos de valores que lo
   * referencian: dejarlo dentro haría que un value set siguiera ofreciendo un
   * código retirado.
   */
  async deprecateConcept(
    conceptId: string,
    dto: DeprecateConceptDto,
    actor: AuthenticatedUser,
  ): Promise<DeprecateConceptResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.deprecate',
        conceptId,
        replacedByConceptId: dto.replacedByConceptId,
      },
      'Retirando concepto',
    );

    if (dto.replacedByConceptId === conceptId) {
      throw new ConflictException(
        'Un concepto no puede reemplazarse a sí mismo',
        { conceptId },
      );
    }

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findByIdForUpdate(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      // Retirar dos veces no es un error: el estado final es el mismo. Se responde
      // sin volver a tocar la fila para no falsear la marca de modificación.
      if (concept.stateConceptId === CONCEPTS.TERM_RETIRED) {
        this.logger.warn(
          { operation: 'terminology.concept.deprecate', conceptId },
          'El concepto ya estaba retirado',
        );
        return {
          id: concept.id,
          stateConceptId: CONCEPTS.TERM_RETIRED,
          replacedByConceptId: concept.replacedByConceptId,
          excludedMembers: 0,
          alreadyRetired: true,
        };
      }

      if (dto.replacedByConceptId) {
        const replacement = await this.conceptsRepo.findById(
          tx,
          dto.replacedByConceptId,
        );
        if (!replacement) {
          throw new ResourceNotFoundException(
            'Concepto de reemplazo no encontrado',
            {
              replacedByConceptId: dto.replacedByConceptId,
            },
          );
        }
        // Reemplazar por otro concepto ya retirado dejaría al consumidor sin
        // ninguna alternativa válida a la que migrar.
        if (replacement.stateConceptId === CONCEPTS.TERM_RETIRED) {
          throw new PreconditionFailedException(
            'El concepto de reemplazo está retirado',
            {
              replacedByConceptId: dto.replacedByConceptId,
            },
          );
        }
        concept.replacedByConceptId = dto.replacedByConceptId;
      }

      concept.stateConceptId = CONCEPTS.TERM_RETIRED;
      concept.validTo = new Date();
      touch(concept, actor.id);

      const members = await this.valueSetsRepo.findMembersByConceptForUpdate(
        tx,
        conceptId,
      );
      for (const member of members) {
        member.included = false;
        touch(member, actor.id);
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.concept.deprecate',
          conceptId,
          excludedMembers: members.length,
        },
        'Concepto retirado',
      );
      return {
        id: concept.id,
        stateConceptId: CONCEPTS.TERM_RETIRED,
        replacedByConceptId: concept.replacedByConceptId,
        excludedMembers: members.length,
        alreadyRetired: false,
      };
    });
  }

  /**
   * UC-03-11 (`$lookup`): resuelve un concepto por `(system, code)` y devuelve sus
   * designaciones y propiedades.
   *
   * `system` es la URL canónica del sistema de códigos, y el concepto se resuelve
   * contra su versión vigente: una versión borrador todavía no está sellada y sus
   * códigos pueden cambiar.
   */
  async lookupConcept(
    system: string,
    code: string,
  ): Promise<LookupResponseDto> {
    this.logger.info(
      { operation: 'terminology.concept.lookup', system, code },
      'Resolviendo concepto',
    );

    const codeSystem = await this.codeSystemsRepo.findByCanonicalUrl(
      this.em,
      system,
    );
    if (!codeSystem) {
      throw new ResourceNotFoundException('Sistema de códigos no encontrado', {
        system,
      });
    }

    const version = await this.versionsRepo.findDefaultActiveVersion(
      this.em,
      codeSystem.id,
      CONCEPTS.TERM_ACTIVE,
    );
    if (!version) {
      throw new ResourceNotFoundException(
        'El sistema de códigos no tiene versión vigente publicada',
        {
          system,
        },
      );
    }

    const concept = await this.conceptsRepo.findByVersionAndCode(
      this.em,
      version.id,
      code,
    );
    if (!concept) {
      throw new ResourceNotFoundException(
        'Código no encontrado en la versión vigente',
        { system, code },
      );
    }

    const [designations, properties] = await Promise.all([
      this.designationsRepo.findByConcept(this.em, concept.id),
      this.designationsRepo.findPropertiesByConcept(this.em, concept.id),
    ]);

    this.logger.info(
      { operation: 'terminology.concept.lookup', conceptId: concept.id },
      'Concepto resuelto',
    );
    return {
      conceptId: concept.id,
      code: concept.code,
      display: concept.display,
      definition: concept.definition,
      selectable: concept.selectable,
      stateConceptId: concept.stateConceptId,
      designations: designations.map((designation) => ({
        value: designation.value,
        languageConceptId: designation.languageConceptId,
        preferred: designation.preferred,
      })),
      properties: properties.map((property) => ({
        propertyCode: property.propertyCode,
        dataType: property.dataType,
        valueJson: property.valueJson,
      })),
    };
  }
}
