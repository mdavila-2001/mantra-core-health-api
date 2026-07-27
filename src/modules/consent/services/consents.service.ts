import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConsentsRepository,
  ConsentProvisionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { CONS } from '../consent.concepts';
import {
  AmendProvisionsDto,
  ConsentProvisionInputDto,
  ConsentResponseDto,
  CreateConsentDto,
  StatusResultDto,
  WithdrawConsentDto,
} from '../dto';

/**
 * Casos de uso sobre `consent.consents`: captura de consentimiento (UC-07-01),
 * revocación/retiro con disparo de re-evaluación de accesos (UC-07-02) y
 * actualización de provisiones granulares (UC-07-09).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre (consents) antes de crear hijos (provisions, events): las FK son columnas
 * uuid, MikroORM no ordena inserts entre entidades no relacionadas.
 */
@Injectable()
export class ConsentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly consentsRepo: ConsentsRepository,
    private readonly provisionsRepo: ConsentProvisionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConsentsService.name);
  }

  /** UC-07-01: captura un consentimiento activo con sus provisiones y evidencia de evento. */
  async capture(
    dto: CreateConsentDto,
    actor: AuthenticatedUser,
  ): Promise<ConsentResponseDto> {
    this.logger.info(
      {
        operation: 'consent.consent.capture',
        patientProfileId: dto.patientProfileId,
      },
      'Capturing consent',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.consentsRepo.findActiveByPurpose(
        tx,
        dto.patientProfileId,
        dto.processingPurposeId,
        CONS.CONSENT_ACTIVE,
      );
      if (clash) {
        this.logger.warn(
          { operation: 'consent.consent.capture', reason: 'duplicate-active' },
          'Rejected consent capture: an active consent already exists for this purpose',
        );
        throw new ConflictException(
          'Ya existe un consentimiento activo para este propósito',
          {
            patientProfileId: dto.patientProfileId,
            processingPurposeId: dto.processingPurposeId,
          },
        );
      }

      const now = new Date();
      const consent = this.consentsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        categoryConceptId: dto.categoryConceptId ?? CONS.CATEGORY_PRIVACY,
        processingPurposeId: dto.processingPurposeId,
        processingLegalBasisId: dto.processingLegalBasisId,
        statusConceptId: CONS.CONSENT_ACTIVE,
        tenantId: dto.tenantId ?? SEED.tenantId,
        grantedByUserId: dto.grantedByUserId ?? actor.id,
        grantedByRelatedPersonId: dto.grantedByRelatedPersonId,
        policyUri: dto.policyUri,
        policyVersion: dto.policyVersion,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : now,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      // Persistir el padre antes de los hijos (FK uuid planas).
      await tx.flush();

      for (const provision of dto.provisions ?? []) {
        this.createProvision(tx, consent.id, provision, actor.id);
      }

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        subjectId: consent.id,
        eventTypeConceptId: CONS.EVENT_GRANTED,
        previousStatusConceptId: CONS.STATUS_NONE,
        newStatusConceptId: CONS.CONSENT_ACTIVE,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'consent.consent.capture', consentId: consent.id },
        'Consent captured',
      );
      return this.toResponse(consent);
    });
  }

  /** UC-07-02: retira un consentimiento activo y emite el evento que dispara la re-evaluación. */
  async withdraw(
    id: string,
    dto: WithdrawConsentDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'consent.consent.withdraw', consentId: id },
      'Withdrawing consent',
    );
    return this.em.transactional(async (tx) => {
      const consent = await this.consentsRepo.findById(tx, id);
      if (!consent)
        throw new ResourceNotFoundException('Consentimiento no encontrado', {
          id,
        });
      if (consent.statusConceptId !== CONS.CONSENT_ACTIVE) {
        throw new ConflictException('El consentimiento no está activo', {
          id,
          status: consent.statusConceptId,
        });
      }

      const now = new Date();
      consent.statusConceptId = CONS.CONSENT_WITHDRAWN;
      consent.withdrawnAt = now;
      consent.withdrawalReasonConceptId = dto.withdrawalReasonConceptId;
      consent.validTo = now;
      touch(consent, actor.id);

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        subjectId: consent.id,
        eventTypeConceptId: CONS.EVENT_WITHDRAWN,
        previousStatusConceptId: CONS.CONSENT_ACTIVE,
        newStatusConceptId: CONS.CONSENT_WITHDRAWN,
        reasonConceptId: dto.withdrawalReasonConceptId,
        recordedByUserId: actor.id,
      });

      return { ok: true };
    });
  }

  /** UC-07-09: cierra las provisiones vigentes e inserta las nuevas (soft-close). */
  async amendProvisions(
    id: string,
    dto: AmendProvisionsDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'consent.consent.amend-provisions', consentId: id },
      'Amending consent provisions',
    );
    return this.em.transactional(async (tx) => {
      const consent = await this.consentsRepo.findById(tx, id);
      if (!consent)
        throw new ResourceNotFoundException('Consentimiento no encontrado', {
          id,
        });
      if (consent.statusConceptId !== CONS.CONSENT_ACTIVE) {
        throw new ConflictException('El consentimiento no está activo', {
          id,
          status: consent.statusConceptId,
        });
      }

      const now = new Date();
      const open = await this.provisionsRepo.findOpenByConsent(tx, id);
      for (const prov of open) {
        prov.validTo = now;
        touch(prov, actor.id);
      }

      for (const provision of dto.provisions) {
        this.createProvision(tx, id, provision, actor.id, now);
      }

      touch(consent, actor.id);

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        subjectId: id,
        eventTypeConceptId: CONS.EVENT_PROVISIONS_AMENDED,
        previousStatusConceptId: CONS.CONSENT_ACTIVE,
        newStatusConceptId: CONS.CONSENT_ACTIVE,
        recordedByUserId: actor.id,
      });

      return { ok: true };
    });
  }

  private createProvision(
    tx: EntityManager,
    consentId: string,
    provision: ConsentProvisionInputDto,
    actorId: string,
    validFromDefault?: Date,
  ): void {
    this.provisionsRepo.create(tx, {
      consentId,
      provisionTypeConceptId:
        provision.provisionTypeConceptId ?? CONS.PROVISION_TYPE_BASE,
      actionConceptId:
        provision.action === 'DENY' ? CONS.ACTION_DENY : CONS.ACTION_PERMIT,
      dataClassConceptId: provision.dataClassConceptId,
      actorUserId: provision.actorUserId,
      actorRoleConceptId: provision.actorRoleConceptId,
      purposeOfUseConceptId: provision.purposeOfUseConceptId,
      securityLabelConceptId: provision.securityLabelConceptId,
      validFrom: provision.validFrom
        ? new Date(provision.validFrom)
        : (validFromDefault ?? new Date()),
      validTo: provision.validTo ? new Date(provision.validTo) : undefined,
      createdByUserId: actorId,
    });
  }

  private toResponse(consent: {
    id: string;
    patientProfileId: string;
    statusConceptId: string;
    processingPurposeId: string;
    createdAt: Date;
  }): ConsentResponseDto {
    return {
      id: consent.id,
      patientProfileId: consent.patientProfileId,
      status: consent.statusConceptId,
      processingPurposeId: consent.processingPurposeId,
      createdAt: consent.createdAt,
    };
  }
}
