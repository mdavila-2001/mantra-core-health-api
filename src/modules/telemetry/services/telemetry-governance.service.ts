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
import { TELE } from '../telemetry.concepts';
import {
  TrackingPurposeDefinitionsRepository,
  ActivityEventSchemaDefinitionsRepository,
  TrackingDisclosureVersionsRepository,
  FunnelDefinitionsRepository,
  FunnelStepsRepository,
} from '../repositories';
import {
  CreateTrackingPurposeDto,
  TrackingPurposeResponseDto,
  CreateEventSchemaDto,
  EventSchemaResponseDto,
  CreateDisclosureVersionDto,
  DisclosureVersionResponseDto,
  CreateFunnelDto,
  FunnelResponseDto,
} from '../dto';

/**
 * Gobernanza de telemetría: catálogo de propósitos de tracking (UC-28-01),
 * esquemas de evento versionados (UC-28-02), versiones de disclosure (UC-28-03)
 * y definición de funnels con pasos (UC-28-10).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, porque las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
@Injectable()
export class TelemetryGovernanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param purposesRepo - Valor de purposes repo requerido por la operación.
   * @param schemasRepo - Valor de schemas repo requerido por la operación.
   * @param disclosuresRepo - Valor de disclosures repo requerido por la operación.
   * @param funnelsRepo - Valor de funnels repo requerido por la operación.
   * @param funnelStepsRepo - Valor de funnel steps repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly purposesRepo: TrackingPurposeDefinitionsRepository,
    private readonly schemasRepo: ActivityEventSchemaDefinitionsRepository,
    private readonly disclosuresRepo: TrackingDisclosureVersionsRepository,
    private readonly funnelsRepo: FunnelDefinitionsRepository,
    private readonly funnelStepsRepo: FunnelStepsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryGovernanceService.name);
  }

  /** UC-28-01: define un propósito de tracking con su base legal. */
  async definePurpose(
    dto: CreateTrackingPurposeDto,
    actor: AuthenticatedUser,
  ): Promise<TrackingPurposeResponseDto> {
    this.logger.info(
      { operation: 'telemetry.purpose.define', purposeCode: dto.purposeCode },
      'Defining tracking purpose',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.purposesRepo.findByCode(tx, dto.purposeCode);
      if (clash) {
        throw new ConflictException('El código de propósito ya existe', {
          purposeCode: dto.purposeCode,
        });
      }

      const purpose = this.purposesRepo.create(tx, {
        purposeCode: dto.purposeCode,
        name: dto.name,
        purposeCategoryConceptId:
          dto.purposeCategoryConceptId ?? TELE.PURPOSE_CATEGORY_ANALYTICS,
        legalBasisConceptId:
          dto.legalBasisConceptId ?? TELE.LEGAL_BASIS_CONSENT,
        requiresConsent: dto.requiresConsent ?? true,
        permitsMarketingUse: dto.permitsMarketingUse ?? false,
        permitsCrossTenantAggregation:
          dto.permitsCrossTenantAggregation ?? false,
        defaultRetentionDays: dto.defaultRetentionDays,
        versionNumber: 1,
        effectiveFrom: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: purpose.id,
        purposeCode: purpose.purposeCode,
        versionNumber: purpose.versionNumber,
        statusConceptId: purpose.statusConceptId,
        requiresConsent: purpose.requiresConsent ?? true,
        createdAt: purpose.createdAt,
      };
    });
  }

  /** UC-28-02: registra un esquema de evento (versionado) para un propósito activo. */
  async registerEventSchema(
    dto: CreateEventSchemaDto,
    actor: AuthenticatedUser,
  ): Promise<EventSchemaResponseDto> {
    const schemaVersion = dto.schemaVersion ?? 1;
    this.logger.info(
      {
        operation: 'telemetry.schema.register',
        eventName: dto.eventName,
        schemaVersion,
      },
      'Registering event schema',
    );
    return this.em.transactional(async (tx) => {
      const purpose = await this.purposesRepo.findById(
        tx,
        dto.purposeDefinitionId,
      );
      if (!purpose) {
        throw new ResourceNotFoundException(
          'Propósito de tracking no encontrado',
          {
            purposeDefinitionId: dto.purposeDefinitionId,
          },
        );
      }
      if (purpose.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El propósito de tracking no está activo',
          {
            purposeDefinitionId: dto.purposeDefinitionId,
          },
        );
      }

      const clash = await this.schemasRepo.findByNameVersion(
        tx,
        dto.eventName,
        schemaVersion,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un esquema con ese nombre y versión',
          {
            eventName: dto.eventName,
            schemaVersion,
          },
        );
      }

      const schema = this.schemasRepo.create(tx, {
        eventName: dto.eventName,
        schemaVersion,
        purposeDefinitionId: dto.purposeDefinitionId,
        portalTypeConceptId: dto.portalTypeConceptId ?? TELE.PORTAL_WEB,
        propertySchemaJson: dto.propertySchemaJson,
        prohibitedPropertyPatternsJson: dto.prohibitedPropertyPatternsJson,
        piiClassificationConceptId:
          dto.piiClassificationConceptId ?? TELE.PII_NONE,
        phiAllowed: dto.phiAllowed ?? false,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        effectiveFrom: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: schema.id,
        eventName: schema.eventName,
        schemaVersion: schema.schemaVersion,
        purposeDefinitionId: schema.purposeDefinitionId,
        statusConceptId: schema.statusConceptId,
        createdAt: schema.createdAt,
      };
    });
  }

  /** UC-28-03: publica una versión de disclosure y cierra la vigente anterior. */
  async publishDisclosure(
    dto: CreateDisclosureVersionDto,
    actor: AuthenticatedUser,
  ): Promise<DisclosureVersionResponseDto> {
    const versionNumber = dto.versionNumber ?? 1;
    this.logger.info(
      {
        operation: 'telemetry.disclosure.publish',
        documentCode: dto.documentCode,
        versionNumber,
      },
      'Publishing disclosure version',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.disclosuresRepo.findByDocumentVersion(
        tx,
        dto.documentCode,
        versionNumber,
      );
      if (clash) {
        throw new ConflictException('Ya existe esa versión del documento', {
          documentCode: dto.documentCode,
          versionNumber,
        });
      }

      // Cierra la vigencia de las versiones abiertas del mismo documento.
      const open = await this.disclosuresRepo.findOpenByDocument(
        tx,
        dto.documentCode,
      );
      const now = new Date();
      for (const prev of open) {
        prev.effectiveTo = now;
      }

      const version = this.disclosuresRepo.create(tx, {
        documentCode: dto.documentCode,
        versionNumber,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? TELE.JURISDICTION_DEFAULT,
        fileId: dto.fileId,
        contentHash: dto.contentHash,
        effectiveFrom: now,
        statusConceptId: TELE.DISCLOSURE_PUBLISHED,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: version.id,
        documentCode: version.documentCode,
        versionNumber: version.versionNumber,
        statusConceptId: version.statusConceptId,
        createdAt: version.createdAt,
      };
    });
  }

  /** UC-28-10: define un funnel y sus pasos (contiguos) en una sola transacción. */
  async defineFunnel(
    dto: CreateFunnelDto,
    actor: AuthenticatedUser,
  ): Promise<FunnelResponseDto> {
    this.logger.info(
      {
        operation: 'telemetry.funnel.define',
        funnelCode: dto.funnelCode,
        steps: dto.steps.length,
      },
      'Defining funnel',
    );
    return this.em.transactional(async (tx) => {
      const purpose = await this.purposesRepo.findById(
        tx,
        dto.purposeDefinitionId,
      );
      if (!purpose) {
        throw new ResourceNotFoundException(
          'Propósito de tracking no encontrado',
          {
            purposeDefinitionId: dto.purposeDefinitionId,
          },
        );
      }

      const clash = await this.funnelsRepo.findByCode(tx, dto.funnelCode);
      if (clash) {
        throw new ConflictException('El código de funnel ya existe', {
          funnelCode: dto.funnelCode,
        });
      }

      // Cada paso debe referenciar un esquema de evento existente.
      for (const step of dto.steps) {
        const schema = await this.schemasRepo.findById(
          tx,
          step.eventSchemaDefinitionId,
        );
        if (!schema) {
          throw new PreconditionFailedException(
            'Esquema de evento de un paso no existe',
            {
              eventSchemaDefinitionId: step.eventSchemaDefinitionId,
            },
          );
        }
      }

      const funnel = this.funnelsRepo.create(tx, {
        funnelCode: dto.funnelCode,
        name: dto.name,
        portalTypeConceptId: dto.portalTypeConceptId ?? TELE.PORTAL_WEB,
        purposeDefinitionId: dto.purposeDefinitionId,
        versionNumber: dto.versionNumber ?? 1,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // step_number contiguo desde 1 respetando el orden recibido.
      let n = 1;
      for (const step of dto.steps) {
        this.funnelStepsRepo.create(tx, {
          funnelDefinitionId: funnel.id,
          stepNumber: step.stepNumber ?? n,
          eventSchemaDefinitionId: step.eventSchemaDefinitionId,
          qualificationRuleJson: step.qualificationRuleJson,
        });
        n += 1;
      }
      await tx.flush();

      return {
        id: funnel.id,
        funnelCode: funnel.funnelCode,
        versionNumber: funnel.versionNumber,
        stepCount: dto.steps.length,
        statusConceptId: funnel.statusConceptId,
        createdAt: funnel.createdAt,
      };
    });
  }
}
