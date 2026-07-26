import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ExternalProvidersRepository,
  IntegrationEndpointsRepository,
  WebhookSubscriptionsRepository,
} from '../repositories';
import {
  RegisterProviderDto,
  PublishEndpointDto,
  CreateWebhookSubscriptionDto,
  ProviderResponseDto,
  EndpointResponseDto,
  WebhookSubscriptionResponseDto,
} from '../dto';
import {
  INTEG,
  PROVIDER_TYPE_CONCEPT_BY_CODE,
  AUTH_TYPE_CONCEPT_BY_CODE,
  HTTP_METHOD_CONCEPT_BY_CODE,
  DIRECTION_CONCEPT_BY_CODE,
} from '../integrations.concepts';

/**
 * Casos de uso sobre proveedores externos: registro (UC-12-01), publicación de
 * endpoints versionados con mapeos (UC-12-04) y gestión de suscripciones de
 * webhook (UC-12-11).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos: las FK son columnas uuid planas y MikroORM no
 * ordena inserts entre entidades no relacionadas.
 *
 * Nota de diseño: el módulo 12 no incluye un caso de uso de "activación" de
 * proveedor, por lo que el registro deja el proveedor directamente en estado
 * ACTIVE (usable de inmediato). Las operaciones que exigen "provider ACTIVE"
 * validan contra ese estado.
 */
@Injectable()
export class IntegrationsProvidersService {
  constructor(
    private readonly em: EntityManager,
    private readonly providersRepo: ExternalProvidersRepository,
    private readonly endpointsRepo: IntegrationEndpointsRepository,
    private readonly webhooksRepo: WebhookSubscriptionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationsProvidersService.name);
  }

  /** UC-12-01: registra un proveedor externo con código único global. */
  async registerProvider(
    dto: RegisterProviderDto,
    actor: AuthenticatedUser,
  ): Promise<ProviderResponseDto> {
    this.logger.info({ operation: 'integrations.provider.register', actorId: actor.id }, 'Registering provider');
    return this.em.transactional(async (tx) => {
      const clash = await this.providersRepo.findByCode(tx, dto.code);
      if (clash) {
        this.logger.warn(
          { operation: 'integrations.provider.register', reason: 'code-in-use' },
          'Rejected provider registration: code already exists',
        );
        throw new ConflictException('Ya existe un proveedor con ese código', { code: dto.code });
      }

      const provider = this.providersRepo.create(tx, {
        code: dto.code,
        name: dto.name,
        providerTypeConceptId: PROVIDER_TYPE_CONCEPT_BY_CODE[dto.providerType],
        stateConceptId: INTEG.PROVIDER_ACTIVE,
        baseUrl: dto.baseUrl,
        authTypeConceptId: dto.authType ? AUTH_TYPE_CONCEPT_BY_CODE[dto.authType] : undefined,
        docUrl: dto.docUrl,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info({ operation: 'integrations.provider.register', providerId: provider.id }, 'Provider registered');
      return {
        id: provider.id,
        code: provider.code,
        name: provider.name,
        state: provider.stateConceptId,
        createdAt: provider.createdAt,
      };
    });
  }

  /** UC-12-04: publica un endpoint versionado y sus mapeos de campos. */
  async publishEndpoint(
    providerId: string,
    dto: PublishEndpointDto,
    actor: AuthenticatedUser,
  ): Promise<EndpointResponseDto> {
    this.logger.info(
      { operation: 'integrations.endpoint.publish', providerId, version: dto.version },
      'Publishing endpoint',
    );
    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findById(tx, providerId);
      if (!provider) throw new ResourceNotFoundException('Proveedor no encontrado', { providerId });
      if (provider.stateConceptId !== INTEG.PROVIDER_ACTIVE) {
        throw new PreconditionFailedException('El proveedor no está activo', { providerId });
      }

      const existing = await this.endpointsRepo.findByProviderAndVersion(tx, providerId, dto.version);
      if (existing) {
        throw new ConflictException('Ya existe un endpoint con esa versión para el proveedor', {
          providerId,
          version: dto.version,
        });
      }

      const endpoint = this.endpointsRepo.createEndpoint(tx, {
        providerId,
        code: dto.code,
        operation: dto.operation,
        version: dto.version,
        stateConceptId: INTEG.ENDPOINT_PUBLISHED,
        httpMethodConceptId: dto.httpMethod ? HTTP_METHOD_CONCEPT_BY_CODE[dto.httpMethod] : undefined,
        path: dto.path,
        requestSchemaJson: dto.requestSchemaJson,
        responseSchemaJson: dto.responseSchemaJson,
        timeoutMs: dto.timeoutMs,
        actorUserId: actor.id,
      });
      // Padre antes que hijos: el endpoint debe existir para las FK de los mapeos.
      await tx.flush();

      const mappings = dto.mappings ?? [];
      for (const m of mappings) {
        this.endpointsRepo.createFieldMapping(tx, {
          endpointId: endpoint.id,
          sourcePath: m.sourcePath,
          targetField: m.targetField,
          conceptMapId: m.conceptMapId,
          transformJson: m.transformJson,
          directionConceptId: m.direction ? DIRECTION_CONCEPT_BY_CODE[m.direction] : undefined,
          actorUserId: actor.id,
        });
      }

      return {
        id: endpoint.id,
        providerId,
        code: endpoint.code,
        version: endpoint.version,
        state: endpoint.stateConceptId,
        mappingsCount: mappings.length,
      };
    });
  }

  /** UC-12-11: crea o actualiza (upsert lógico) una suscripción de webhook. */
  async createWebhookSubscription(
    providerId: string,
    dto: CreateWebhookSubscriptionDto,
    actor: AuthenticatedUser,
  ): Promise<WebhookSubscriptionResponseDto> {
    this.logger.info(
      { operation: 'integrations.webhook.subscribe', providerId, eventType: dto.eventType },
      'Managing webhook subscription',
    );
    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findById(tx, providerId);
      if (!provider) throw new ResourceNotFoundException('Proveedor no encontrado', { providerId });
      if (provider.stateConceptId !== INTEG.PROVIDER_ACTIVE) {
        throw new PreconditionFailedException('El proveedor no está activo', { providerId });
      }

      const existing = await this.webhooksRepo.findByLogicalKey(tx, providerId, dto.eventType, dto.tenantId);
      if (existing) {
        existing.callbackUrl = dto.callbackUrl;
        existing.secretRef = dto.secretRef;
        existing.stateConceptId = INTEG.WEBHOOK_ACTIVE;
        touch(existing, actor.id);
        await tx.flush();
        return {
          id: existing.id,
          providerId,
          eventType: existing.eventType,
          state: existing.stateConceptId,
          updated: true,
        };
      }

      const sub = this.webhooksRepo.create(tx, {
        providerId,
        eventType: dto.eventType,
        callbackUrl: dto.callbackUrl,
        stateConceptId: INTEG.WEBHOOK_ACTIVE,
        tenantId: dto.tenantId,
        secretRef: dto.secretRef,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: sub.id,
        providerId,
        eventType: sub.eventType,
        state: sub.stateConceptId,
        updated: false,
      };
    });
  }
}
