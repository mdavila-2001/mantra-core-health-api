import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomUUID } from 'node:crypto';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { TELE } from '../telemetry.concepts';
import {
  TrackingDisclosureVersionsRepository,
  TrackingDisclosureAcceptancesRepository,
  TrackingConsentsRepository,
  TrackingPurposeDefinitionsRepository,
  AnalyticsSubjectsRepository,
} from '../repositories';
import {
  CreateDisclosureAcceptanceDto,
  DisclosureAcceptanceResponseDto,
  CreateTrackingConsentDto,
  TrackingConsentResponseDto,
  ProvisionAnalyticsSubjectDto,
  AnalyticsSubjectResponseDto,
} from '../dto';

/**
 * Ciclo de consentimiento de tracking: aceptación de disclosure (UC-28-04),
 * otorgamiento de consentimiento por propósito (UC-28-05), provisión de sujeto
 * pseudónimo de analítica (UC-28-06) y retiro de consentimiento con desactivación
 * en cascada del sujeto (UC-28-12). Los consentimientos son append-only por
 * decisión: la última fila por (user, purpose) define el estado efectivo.
 */
@Injectable()
export class TelemetryConsentService {
  constructor(
    private readonly em: EntityManager,
    private readonly disclosuresRepo: TrackingDisclosureVersionsRepository,
    private readonly acceptancesRepo: TrackingDisclosureAcceptancesRepository,
    private readonly consentsRepo: TrackingConsentsRepository,
    private readonly purposesRepo: TrackingPurposeDefinitionsRepository,
    private readonly subjectsRepo: AnalyticsSubjectsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryConsentService.name);
  }

  /** UC-28-04: registra la aceptación de una disclosure vigente por usuario/sesión. */
  async acceptDisclosure(
    dto: CreateDisclosureAcceptanceDto,
    actor: AuthenticatedUser,
  ): Promise<DisclosureAcceptanceResponseDto> {
    const userId = dto.userId ?? actor.id;
    this.logger.info(
      {
        operation: 'telemetry.disclosure.accept',
        versionId: dto.trackingDisclosureVersionId,
      },
      'Recording disclosure acceptance',
    );
    return this.em.transactional(async (tx) => {
      const version = await this.disclosuresRepo.findById(
        tx,
        dto.trackingDisclosureVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión de disclosure no encontrada',
          {
            trackingDisclosureVersionId: dto.trackingDisclosureVersionId,
          },
        );
      }

      // Idempotencia lógica por (user, version, session): reusa la existente.
      const existing = await this.acceptancesRepo.findExisting(
        tx,
        userId,
        dto.trackingDisclosureVersionId,
        dto.sessionId,
      );
      if (existing) {
        return {
          id: existing.id,
          trackingDisclosureVersionId: existing.trackingDisclosureVersionId,
          userId: existing.userId,
          acceptedAt: existing.acceptedAt ?? existing.createdAt,
        };
      }

      const now = new Date();
      const acceptance = this.acceptancesRepo.create(tx, {
        trackingDisclosureVersionId: dto.trackingDisclosureVersionId,
        userId,
        sessionId: dto.sessionId,
        acceptedAt: now,
        ipPrefixHash: dto.ipPrefixHash,
        userAgentHash: dto.userAgentHash,
        acceptanceStatusConceptId: TELE.ACCEPTANCE_ACCEPTED,
      });
      await tx.flush();

      return {
        id: acceptance.id,
        trackingDisclosureVersionId: acceptance.trackingDisclosureVersionId,
        userId: acceptance.userId,
        acceptedAt: now,
      };
    });
  }

  /** UC-28-05: otorga consentimiento de tracking para un propósito que lo requiere. */
  async grantConsent(
    dto: CreateTrackingConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TrackingConsentResponseDto> {
    const userId = dto.userId ?? actor.id;
    this.logger.info(
      {
        operation: 'telemetry.consent.grant',
        purposeDefinitionId: dto.purposeDefinitionId,
      },
      'Granting tracking consent',
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
      if (purpose.requiresConsent === false) {
        throw new PreconditionFailedException(
          'El propósito no requiere consentimiento',
          {
            purposeDefinitionId: dto.purposeDefinitionId,
          },
        );
      }

      const now = new Date();
      const consent = this.consentsRepo.create(tx, {
        userId,
        purposeDefinitionId: dto.purposeDefinitionId,
        decisionConceptId: TELE.DECISION_GRANTED,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        consentVersion: dto.consentVersion,
        grantedAt: now,
        evidenceHash: dto.evidenceHash,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: consent.id,
        userId: consent.userId,
        purposeDefinitionId: consent.purposeDefinitionId,
        decisionConceptId: consent.decisionConceptId,
        grantedAt: now,
      };
    });
  }

  /** UC-28-06: provisiona (idempotente) un sujeto de analítica pseudónimo. */
  async provisionSubject(
    dto: ProvisionAnalyticsSubjectDto,
  ): Promise<AnalyticsSubjectResponseDto> {
    const key = dto.pseudonymousSubjectKey ?? this.deriveSubjectKey(dto);
    this.logger.info(
      { operation: 'telemetry.subject.provision' },
      'Provisioning analytics subject',
    );
    return this.em.transactional(async (tx) => {
      // unique(pseudonymous_subject_key): si ya existe, se reutiliza (idempotente).
      const existing = await this.subjectsRepo.findByKey(tx, key);
      if (existing) {
        return {
          id: existing.id,
          pseudonymousSubjectKey: existing.pseudonymousSubjectKey,
          keyVersion: existing.keyVersion,
          reused: true,
          createdAt: existing.createdAt,
        };
      }

      const subject = this.subjectsRepo.create(tx, {
        pseudonymousSubjectKey: key,
        keyVersion: dto.keyVersion ?? 1,
        userId: dto.userId,
        patientProfileId: dto.patientProfileId,
        createdFromConsentId: dto.createdFromConsentId,
      });
      await tx.flush();

      return {
        id: subject.id,
        pseudonymousSubjectKey: subject.pseudonymousSubjectKey,
        keyVersion: subject.keyVersion,
        reused: false,
        createdAt: subject.createdAt,
      };
    });
  }

  /** UC-28-12: retira el consentimiento (append-only) y desactiva el sujeto en cascada. */
  async withdrawConsent(
    consentId: string,
    actor: AuthenticatedUser,
  ): Promise<TrackingConsentResponseDto> {
    this.logger.info(
      { operation: 'telemetry.consent.withdraw', consentId },
      'Withdrawing tracking consent',
    );
    return this.em.transactional(async (tx) => {
      const consent = await this.consentsRepo.findById(tx, consentId);
      if (!consent) {
        throw new ResourceNotFoundException('Consentimiento no encontrado', {
          consentId,
        });
      }

      // El estado efectivo lo define la última decisión de (user, purpose).
      const latest = await this.consentsRepo.findLatest(
        tx,
        consent.userId,
        consent.purposeDefinitionId,
      );
      if (!latest || latest.decisionConceptId !== TELE.DECISION_GRANTED) {
        throw new PreconditionFailedException(
          'No hay un consentimiento vigente que retirar',
          {
            consentId,
          },
        );
      }

      const now = new Date();
      const withdrawal = this.consentsRepo.create(tx, {
        userId: consent.userId,
        purposeDefinitionId: consent.purposeDefinitionId,
        decisionConceptId: TELE.DECISION_WITHDRAWN,
        jurisdictionConceptId: consent.jurisdictionConceptId,
        consentVersion: consent.consentVersion,
        withdrawnAt: now,
        evidenceHash: consent.evidenceHash,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Corta la recolección futura: desactiva sujetos originados por este consentimiento.
      const subjects = await this.subjectsRepo.findActiveByConsent(
        tx,
        consent.id,
      );
      for (const subject of subjects) {
        subject.deactivatedAt = now;
      }
      await tx.flush();

      return {
        id: withdrawal.id,
        userId: withdrawal.userId,
        purposeDefinitionId: withdrawal.purposeDefinitionId,
        decisionConceptId: withdrawal.decisionConceptId,
        withdrawnAt: now,
      };
    });
  }

  /** Deriva una clave pseudónima estable (HMAC-like) sin exponer PII. */
  private deriveSubjectKey(dto: ProvisionAnalyticsSubjectDto): string {
    const material = [
      dto.userId,
      dto.patientProfileId,
      dto.createdFromConsentId,
    ].filter(Boolean);
    if (material.length === 0) return `anon:${randomUUID()}`;
    return createHash('sha256').update(material.join('|')).digest('hex');
  }
}
