import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  CanonicalResourcesRepository,
  HealthProvenanceRepository,
} from '../repositories';
import {
  RegisterIdentifierDto,
  IdentifierResponseDto,
  CreateRelationshipDto,
  RelationshipResponseDto,
  CreateResourceBindingDto,
  ResourceBindingResponseDto,
  RetireResourceDto,
  RetireResourceResponseDto,
} from '../dto';

/**
 * Recurso canónico: identificadores de negocio, relaciones entre recursos,
 * binding a entidades de dominio y retiro gobernado
 * (UC-52-04 … 06, UC-52-14).
 */
@Injectable()
export class CanonicalResourcesService {
  constructor(
    private readonly em: EntityManager,
    private readonly resourcesRepo: CanonicalResourcesRepository,
    private readonly provenanceRepo: HealthProvenanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CanonicalResourcesService.name);
  }

  /**
   * UC-52-04: registrar un identificador de negocio. Sólo puede haber uno
   * principal vigente por sistema emisor: con dos, resolver el recurso por su
   * identificador quedaría ambiguo.
   */
  async registerIdentifier(
    resourceId: string,
    dto: RegisterIdentifierDto,
  ): Promise<IdentifierResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.identifier.register',
        resourceId,
        system: dto.identifierSystem,
      },
      'Registering canonical resource identifier',
    );

    return this.em.transactional(async (tx) => {
      const resource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException('Recurso canónico no encontrado', {
          resourceId,
        });
      }
      if (resource.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED) {
        throw new PreconditionFailedException('El recurso está retirado', {
          resourceId,
        });
      }

      const duplicate = await this.resourcesRepo.findIdentifier(
        tx,
        resourceId,
        dto.identifierSystem,
        dto.identifierValue,
      );
      if (duplicate) {
        throw new ConflictException('El recurso ya tiene ese identificador', {
          resourceId,
          identifierSystem: dto.identifierSystem,
        });
      }

      const effectiveFrom = dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date();
      const isPrimary = dto.isPrimary ?? false;

      let supersededIdentifierId: string | undefined;
      if (isPrimary) {
        const previous =
          await this.resourcesRepo.findPrimaryIdentifierForUpdate(
            tx,
            resourceId,
            dto.identifierSystem,
          );
        if (previous) {
          previous.effectiveTo = effectiveFrom;
          supersededIdentifierId = previous.id;
        }
      }

      const identifier = this.resourcesRepo.createIdentifier(tx, {
        canonicalHealthResourceId: resourceId,
        identifierSystem: dto.identifierSystem,
        identifierValue: dto.identifierValue,
        identifierTypeConceptId: dto.identifierTypeConceptId,
        assigningAuthority: dto.assigningAuthority,
        isPrimary,
        effectiveFrom,
      });

      resource.updatedAt = new Date();

      return {
        id: identifier.id,
        canonicalHealthResourceId: resourceId,
        isPrimary,
        supersededIdentifierId,
      };
    });
  }

  /**
   * UC-52-05: relacionar dos recursos canónicos. La relación es temporal: una
   * nueva del mismo par y tipo cierra la anterior en lugar de convivir con
   * ella, porque dos relaciones vigentes contradictorias no se resuelven solas.
   */
  async createRelationship(
    resourceId: string,
    dto: CreateRelationshipDto,
  ): Promise<RelationshipResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.relationship.create',
        resourceId,
        targetId: dto.targetResourceId,
      },
      'Linking canonical resources',
    );

    // Un recurso relacionado consigo mismo no aporta nada y crea un ciclo de
    // longitud uno en el grafo clínico.
    if (resourceId === dto.targetResourceId) {
      throw new PreconditionFailedException(
        'Un recurso no se relaciona consigo mismo',
        {
          resourceId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      // Ambos extremos se bloquean, y siempre en el mismo orden, para que dos
      // relaciones cruzadas simultáneas no se abracen en un interbloqueo.
      const [first, second] = [resourceId, dto.targetResourceId].sort();
      const firstResource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        first,
      );
      const secondResource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        second,
      );

      const source = first === resourceId ? firstResource : secondResource;
      const target = first === resourceId ? secondResource : firstResource;
      if (!source) {
        throw new ResourceNotFoundException('Recurso canónico no encontrado', {
          resourceId,
        });
      }
      if (!target) {
        throw new ResourceNotFoundException(
          'Recurso canónico destino no encontrado',
          {
            targetResourceId: dto.targetResourceId,
          },
        );
      }
      if (source.custodianTenantId !== target.custodianTenantId) {
        throw new PreconditionFailedException(
          'Los recursos son de custodios distintos',
          {
            resourceId,
            targetResourceId: dto.targetResourceId,
          },
        );
      }
      if (
        source.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED ||
        target.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED
      ) {
        throw new PreconditionFailedException(
          'Alguno de los recursos está retirado',
          {
            resourceId,
            targetResourceId: dto.targetResourceId,
          },
        );
      }

      const effectiveFrom = dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date();
      const previous = await this.resourcesRepo.findLiveRelationshipForUpdate(
        tx,
        resourceId,
        dto.targetResourceId,
        dto.relationshipTypeConceptId,
      );
      if (previous) {
        previous.effectiveTo = effectiveFrom;
      }

      const relationship = this.resourcesRepo.createRelationship(tx, {
        sourceResourceId: resourceId,
        targetResourceId: dto.targetResourceId,
        relationshipTypeConceptId: dto.relationshipTypeConceptId,
        relationshipRoleConceptId: dto.relationshipRoleConceptId,
        effectiveFrom,
        confidenceScore: dto.confidenceScore,
      });

      const now = new Date();
      source.updatedAt = now;
      target.updatedAt = now;

      return {
        id: relationship.id,
        sourceResourceId: resourceId,
        targetResourceId: dto.targetResourceId,
        supersededRelationshipId: previous?.id,
      };
    });
  }

  /**
   * UC-52-06: enlazar el recurso a una entidad del dominio clínico.
   *
   * Es una referencia, no una copia: la tabla clínica sigue siendo la fuente
   * operativa y aquí no se escribe nada suyo. El enlace queda además como
   * arista de linaje, para poder reconstruir de qué versión canónica salió.
   */
  async createBinding(
    resourceId: string,
    dto: CreateResourceBindingDto,
  ): Promise<ResourceBindingResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.binding.create',
        resourceId,
        domainEntityId: dto.domainEntityId,
      },
      'Binding canonical resource to domain entity',
    );

    return this.em.transactional(async (tx) => {
      const resource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException('Recurso canónico no encontrado', {
          resourceId,
        });
      }
      if (resource.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED) {
        throw new PreconditionFailedException('El recurso está retirado', {
          resourceId,
        });
      }
      // Sin versión vigente no hay de qué colgar el linaje: el binding apunta a
      // un contenido concreto, no al recurso en abstracto.
      if (!resource.currentVersionId) {
        throw new PreconditionFailedException(
          'El recurso no tiene versión vigente',
          {
            resourceId,
          },
        );
      }

      const duplicate = await this.resourcesRepo.findBinding(
        tx,
        resourceId,
        dto.domainEntityTypeConceptId,
        dto.domainEntityId,
        dto.bindingRoleConceptId,
      );
      if (duplicate) {
        throw new ConflictException('Ese enlace ya existe', {
          resourceId,
          domainEntityId: dto.domainEntityId,
        });
      }

      const binding = this.resourcesRepo.createBinding(tx, {
        canonicalHealthResourceId: resourceId,
        domainEntityTypeConceptId: dto.domainEntityTypeConceptId,
        domainEntityId: dto.domainEntityId,
        bindingRoleConceptId: dto.bindingRoleConceptId,
        bindingStatusConceptId: CONCEPTS.BINDING_BOUND,
        mappingVersionId: dto.mappingVersionId,
      });

      const edge = this.provenanceRepo.createLineageEdge(tx, {
        tenantId: resource.custodianTenantId,
        sourceTypeConceptId: CONCEPTS.HD_ENTITY_RESOURCE_VERSION,
        sourceId: resource.currentVersionId,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_DOMAIN_ENTITY,
        targetId: dto.domainEntityId,
        transformationTypeConceptId: CONCEPTS.LINEAGE_BIND,
      });

      resource.updatedAt = new Date();

      return {
        id: binding.id,
        canonicalHealthResourceId: resourceId,
        bindingStatusConceptId: CONCEPTS.BINDING_BOUND,
        lineageEdgeId: edge.id,
      };
    });
  }

  /**
   * UC-52-14: retirar el recurso. Es un borrado lógico: las versiones nunca se
   * borran —son la trazabilidad legal de lo que se afirmó y cuándo—, y lo que
   * se cierra son sus enlaces y relaciones vigentes.
   */
  async retireResource(
    resourceId: string,
    dto: RetireResourceDto,
    actor: AuthenticatedUser,
  ): Promise<RetireResourceResponseDto> {
    this.logger.info(
      { operation: 'health-data.resource.retire', resourceId },
      'Retiring canonical resource',
    );

    return this.em.transactional(async (tx) => {
      const resource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException('Recurso canónico no encontrado', {
          resourceId,
        });
      }
      if (resource.lifecycleStatusConceptId === CONCEPTS.RESOURCE_RETIRED) {
        throw new ConflictException('El recurso ya está retirado', {
          resourceId,
        });
      }

      const now = new Date();
      const bindings = await this.resourcesRepo.findLiveBindingsForUpdate(
        tx,
        resourceId,
      );
      for (const binding of bindings) {
        binding.endedAt = now;
      }

      const relationships =
        await this.resourcesRepo.findLiveRelationshipsForUpdate(tx, resourceId);
      for (const relationship of relationships) {
        relationship.effectiveTo = now;
      }

      const provenance = this.provenanceRepo.createProvenanceRecord(tx, {
        custodianTenantId: resource.custodianTenantId,
        activityConceptId: CONCEPTS.PROV_RETIRE,
        occurredStartAt: now,
        responsibleAgentId: actor.id,
      });
      this.provenanceRepo.createProvenanceTarget(tx, {
        healthProvenanceRecordId: provenance.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_CANONICAL_RESOURCE,
        targetId: resourceId,
      });

      resource.lifecycleStatusConceptId = CONCEPTS.RESOURCE_RETIRED;
      resource.updatedAt = now;

      this.logger.warn(
        {
          operation: 'health-data.resource.retire',
          resourceId,
          closedBindings: bindings.length,
          closedRelationships: relationships.length,
          reason: dto.reason,
        },
        'Canonical resource retired',
      );

      return {
        id: resourceId,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED,
        closedBindings: bindings.length,
        closedRelationships: relationships.length,
        provenanceRecordId: provenance.id,
      };
    });
  }
}
