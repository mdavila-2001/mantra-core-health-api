import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { VectorCatalogRepository } from '../repositories';
import { ACTIVE_JOB_STATUSES } from '../constants';
import {
  RegisterModelVersionDto,
  ModelVersionResponseDto,
  CreateCollectionDto,
  CollectionResponseDto,
  DefineRagPolicyDto,
  PublishRagPolicyDto,
  RagPolicyResponseDto,
  RetireModelVersionDto,
  UpdateCollectionLifecycleDto,
  LifecycleResponseDto,
} from '../dto';

/**
 * Gobierno del catálogo vectorial (UC-59-01, 02, 03, 13): qué modelos se pueden
 * usar, qué colecciones existen, bajo qué política se consultan y cuándo se
 * retiran.
 *
 * Todo lo de aquí decide qué está permitido. La ejecución —embeber, buscar,
 * borrar— vive en los otros servicios.
 */
@Injectable()
export class VectorGovernanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: VectorCatalogRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VectorGovernanceService.name);
  }

  /**
   * UC-59-01: registrar y aprobar una versión de modelo de embedding.
   *
   * La aprobación para datos de paciente se registra con quién la dio y cuándo:
   * es la decisión que después habilita o impide crear una colección con PHI, y
   * tiene que poder auditarse por separado del alta del modelo.
   */
  async registerModelVersion(
    dto: RegisterModelVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ModelVersionResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.catalogRepo.findModelVersion(
        tx,
        dto.providerCode,
        dto.modelId,
        dto.modelVersion,
      );
      if (existing) {
        throw new ConflictException(
          'Esa versión del modelo ya está registrada.',
          {
            providerCode: dto.providerCode,
            modelId: dto.modelId,
            modelVersion: dto.modelVersion,
          },
        );
      }

      const model = this.catalogRepo.createModelVersion(tx, {
        providerCode: dto.providerCode,
        modelId: dto.modelId,
        modelVersion: dto.modelVersion,
        dimension: dto.dimension,
        distanceMetric: dto.distanceMetric,
        tokenizerVersion: dto.tokenizerVersion,
        approvedForPhi: dto.approvedForPhi === true,
        approvedAt: new Date(),
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'EmbeddingModelVersionApproved',
        aggregateType: 'vector_rag.embedding_model_versions',
        aggregateId: model.id,
        payloadJson: {
          providerCode: model.providerCode,
          modelId: model.modelId,
          modelVersion: model.modelVersion,
          dimension: model.dimension,
          approvedForPhi: model.approvedForPhi,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.model.register',
          modelVersionId: model.id,
          approvedForPhi: model.approvedForPhi,
        },
        'Versión de modelo de embedding aprobada',
      );

      return {
        id: model.id,
        providerCode: model.providerCode,
        modelId: model.modelId,
        modelVersion: model.modelVersion,
        dimension: model.dimension,
        approvedForPhi: model.approvedForPhi,
      };
    });
  }

  /**
   * UC-59-02: crear la colección con su vínculo de tenant.
   *
   * Tres comprobaciones que no se pueden separar:
   *
   * - el modelo no puede estar retirado: una colección nueva sobre un modelo
   *   retirado nace ya obsoleta;
   * - si la colección va a contener datos de paciente, el modelo tiene que estar
   *   aprobado para ello — mandar PHI a un proveedor no aprobado es una fuga, no
   *   un error de configuración;
   * - la dimensión y la métrica salen del modelo, no de la petición: son suyas, y
   *   dejar que difieran haría que el índice no sirviera para las búsquedas.
   */
  async createCollection(
    dto: CreateCollectionDto,
    actor: AuthenticatedUser,
  ): Promise<CollectionResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.catalogRepo.findCollectionByCode(
        tx,
        dto.tenantId,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una colección con ese código para el tenant.',
          {
            tenantId: dto.tenantId,
            code: dto.code,
          },
        );
      }

      const namespaceTaken = await this.catalogRepo.findBindingByNamespace(
        tx,
        dto.namespace,
      );
      if (namespaceTaken) {
        throw new ConflictException(
          'El namespace ya está en uso por otro vínculo.',
          {
            namespace: dto.namespace,
          },
        );
      }

      const model = await this.catalogRepo.findModelVersionForUpdate(
        tx,
        dto.embeddingModelVersionId,
      );
      if (!model) {
        throw new ResourceNotFoundException(
          'Versión de modelo no encontrada.',
          {
            embeddingModelVersionId: dto.embeddingModelVersionId,
          },
        );
      }
      if (model.retiredAt) {
        throw new PreconditionFailedException(
          'El modelo está retirado; no se pueden crear colecciones nuevas sobre él.',
          { embeddingModelVersionId: model.id },
        );
      }

      const containsPhi = dto.containsPhi === true;
      if (containsPhi && !model.approvedForPhi) {
        throw new PreconditionFailedException(
          'El modelo no está aprobado para datos de paciente.',
          { embeddingModelVersionId: model.id },
        );
      }

      if (dto.accessPolicyId) {
        const policy = await this.catalogRepo.findPolicyById(
          tx,
          dto.accessPolicyId,
        );
        if (!policy) {
          throw new ResourceNotFoundException(
            'Política de acceso RAG no encontrada.',
            {
              accessPolicyId: dto.accessPolicyId,
            },
          );
        }
      }

      const collection = this.catalogRepo.createCollection(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        // Del modelo, no del cuerpo: el vector que produce tiene la dimensión y la
        // métrica que tiene, y declararlas distintas no las cambia.
        dimension: model.dimension,
        distanceMetric: model.distanceMetric,
        embeddingModelVersionId: model.id,
        containsPhi,
        accessPolicyId: dto.accessPolicyId,
        lifecycleState: 'active',
      });

      const binding = this.catalogRepo.createBinding(tx, {
        tenantId: dto.tenantId,
        vectorCollectionId: collection.id,
        namespace: dto.namespace,
        encryptionProfileCode: dto.encryptionProfileCode,
        state: 'active',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'VectorCollectionProvisioned',
        aggregateType: 'vector_rag.vector_collections',
        aggregateId: collection.id,
        payloadJson: {
          code: collection.code,
          namespace: binding.namespace,
          dimension: collection.dimension,
          containsPhi,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.collection.create',
          collectionId: collection.id,
          containsPhi,
        },
        'Colección vectorial creada',
      );

      return {
        id: collection.id,
        code: collection.code,
        dimension: collection.dimension,
        distanceMetric: collection.distanceMetric,
        lifecycleState: collection.lifecycleState,
        bindingId: binding.id,
      };
    });
  }

  /** UC-59-03 (primera mitad): definir la política de acceso RAG en borrador. */
  async defineRagPolicy(
    dto: DefineRagPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<RagPolicyResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.catalogRepo.findPolicyByCodeForUpdate(
        tx,
        dto.tenantId,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una política con ese código para el tenant.',
          {
            tenantId: dto.tenantId,
            code: dto.code,
          },
        );
      }

      // Exigir consentimiento sin exigir a qué paciente se refiere la consulta
      // deja el consentimiento sin nada que comprobar: no se sabría de quién.
      if (dto.consentRequired === true && dto.patientScopeRequired !== true) {
        throw new PreconditionFailedException(
          'Exigir consentimiento obliga a exigir también el ámbito de paciente.',
          { code: dto.code },
        );
      }

      const policy = this.catalogRepo.createPolicy(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        allowedPrincipalTypes: dto.allowedPrincipalTypes,
        allowedPurposeCodes: dto.allowedPurposeCodes,
        allowedSecurityLabels: dto.allowedSecurityLabels,
        patientScopeRequired: dto.patientScopeRequired === true,
        consentRequired: dto.consentRequired === true,
        fieldRedactionProfile: dto.fieldRedactionProfile,
        state: 'draft',
      });

      this.logger.info(
        { operation: 'vector.policy.define', policyId: policy.id },
        'Política de acceso RAG definida en borrador',
      );

      return {
        id: policy.id,
        code: policy.code,
        state: policy.state,
        reboundCollections: 0,
      };
    });
  }

  /**
   * UC-59-03 (segunda mitad): publicar la política y reenlazar colecciones.
   *
   * Una política en borrador no gobierna nada: `openRetrievalSession` sólo acepta
   * publicadas. Publicar es el momento en que la revisión de privacidad pasa a
   * tener efecto, y por eso reenlazar las colecciones va en la misma transacción.
   */
  async publishRagPolicy(
    policyId: string,
    dto: PublishRagPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<RagPolicyResponseDto> {
    return this.em.transactional(async (tx) => {
      const policy = await this.catalogRepo.findPolicyById(tx, policyId);
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de acceso RAG no encontrada.',
          { policyId },
        );
      }

      policy.state = 'published';

      let rebound = 0;
      for (const collectionId of dto.rebindCollectionIds ?? []) {
        const collection = await this.catalogRepo.findCollectionForUpdate(
          tx,
          collectionId,
        );
        if (!collection) {
          throw new ResourceNotFoundException('Colección no encontrada.', {
            collectionId,
          });
        }
        if (collection.tenantId !== policy.tenantId) {
          throw new PreconditionFailedException(
            'La colección pertenece a otro tenant que la política.',
            { collectionId, tenantId: collection.tenantId },
          );
        }
        collection.accessPolicyId = policy.id;
        rebound += 1;
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: policy.tenantId,
        eventType: 'RagAccessPolicyPublished',
        aggregateType: 'vector_rag.rag_access_policies',
        aggregateId: policy.id,
        payloadJson: {
          code: policy.code,
          consentRequired: policy.consentRequired,
          patientScopeRequired: policy.patientScopeRequired,
          reboundCollections: rebound,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.policy.publish',
          policyId,
          reboundCollections: rebound,
        },
        'Política de acceso RAG publicada',
      );

      return {
        id: policy.id,
        code: policy.code,
        state: policy.state,
        reboundCollections: rebound,
      };
    });
  }

  /**
   * UC-59-13 (primera mitad): retirar el modelo.
   *
   * No se borra: se marca `retired_at`. Las colecciones que ya lo usan siguen
   * funcionando —sus embeddings son válidos—, pero deja de poder usarse para
   * colecciones nuevas.
   *
   * Se rechaza si hay jobs vivos que dependen de él: retirar el modelo con un job
   * a medias dejaría media colección embebida con un modelo y media con otro.
   */
  async retireModelVersion(
    modelVersionId: string,
    dto: RetireModelVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ModelVersionResponseDto> {
    return this.em.transactional(async (tx) => {
      const model = await this.catalogRepo.findModelVersionForUpdate(
        tx,
        modelVersionId,
      );
      if (!model) {
        throw new ResourceNotFoundException(
          'Versión de modelo no encontrada.',
          {
            modelVersionId,
          },
        );
      }
      if (model.retiredAt) {
        throw new ConflictException('El modelo ya está retirado.', {
          modelVersionId,
        });
      }

      const collections = await this.catalogRepo.findCollectionsByModel(
        tx,
        modelVersionId,
      );
      for (const collection of collections) {
        const activeJobs = await this.catalogRepo.findActiveJobsByCollection(
          tx,
          collection.id,
          [...ACTIVE_JOB_STATUSES],
        );
        if (activeJobs.length > 0) {
          throw new PreconditionFailedException(
            'Hay jobs de embedding vivos que dependen del modelo.',
            {
              modelVersionId,
              collectionId: collection.id,
              activeJobs: activeJobs.length,
            },
          );
        }
      }

      model.retiredAt = new Date();

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'EmbeddingModelRetired',
        aggregateType: 'vector_rag.embedding_model_versions',
        aggregateId: model.id,
        payloadJson: {
          modelId: model.modelId,
          modelVersion: model.modelVersion,
          affectedCollections: collections.length,
          reason: dto.reason ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'vector.model.retire',
          modelVersionId,
          affectedCollections: collections.length,
        },
        'Versión de modelo de embedding retirada',
      );

      return {
        id: model.id,
        providerCode: model.providerCode,
        modelId: model.modelId,
        modelVersion: model.modelVersion,
        dimension: model.dimension,
        approvedForPhi: model.approvedForPhi,
        retiredAt: model.retiredAt.toISOString(),
      };
    });
  }

  /**
   * UC-59-13 (segunda mitad): sellar o deprecar la colección.
   *
   * Sellar congela los vínculos del tenant, que es lo que bloquea escrituras
   * nuevas. Sin eso, "sellada" sería una etiqueta que no impide nada.
   *
   * Volver a `active` no descongela: reabrir una colección sellada es una decisión
   * que merece su propia operación, no un efecto lateral de cambiar un estado.
   */
  async updateCollectionLifecycle(
    collectionId: string,
    dto: UpdateCollectionLifecycleDto,
    actor: AuthenticatedUser,
  ): Promise<LifecycleResponseDto> {
    return this.em.transactional(async (tx) => {
      const collection = await this.catalogRepo.findCollectionForUpdate(
        tx,
        collectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          collectionId,
        });
      }
      if (collection.lifecycleState === dto.lifecycleState) {
        return {
          id: collection.id,
          lifecycleState: collection.lifecycleState,
          frozenBindings: 0,
        };
      }

      collection.lifecycleState = dto.lifecycleState;

      let frozen = 0;
      if (dto.lifecycleState === 'sealed') {
        const bindings =
          await this.catalogRepo.findBindingsByCollectionForUpdate(
            tx,
            collectionId,
          );
        for (const binding of bindings) {
          if (binding.state === 'frozen') continue;
          binding.state = 'frozen';
          frozen += 1;
        }
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: collection.tenantId,
        eventType: 'VectorCollectionSealed',
        aggregateType: 'vector_rag.vector_collections',
        aggregateId: collection.id,
        payloadJson: {
          code: collection.code,
          lifecycleState: collection.lifecycleState,
          frozenBindings: frozen,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'vector.collection.lifecycle',
          collectionId,
          lifecycleState: collection.lifecycleState,
          frozenBindings: frozen,
        },
        'Ciclo de vida de la colección cambiado',
      );

      return {
        id: collection.id,
        lifecycleState: collection.lifecycleState,
        frozenBindings: frozen,
      };
    });
  }
}
