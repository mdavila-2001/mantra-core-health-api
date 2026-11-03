import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import type { Consents } from '../entities';
import { ConsentScopeService } from './consent-scope.service';
import { ConsentErrorReason } from '../consent.error-reasons';
import {
  ConsentsRepository,
  ConsentProvisionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { ClinicalAccessGrantsRepository } from '../../authz/repositories';
import { AuditTrailService } from '../../audit/services';
import { CONS } from '../consent.concepts';
import {
  AmendProvisionsDto,
  ConsentProvisionInputDto,
  ConsentResponseDto,
  CreateConsentDto,
  StatusResultDto,
  WithdrawConsentDto,
} from '../dto';

/** Cómo se informa un consentimiento inexistente o fuera del alcance. */
const CONSENT_NOT_FOUND = {
  message: 'Consentimiento no encontrado',
  reason: ConsentErrorReason.CONSENT_NOT_FOUND,
} as const;

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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param consentsRepo - Valor de consents repo requerido por la operación.
   * @param provisionsRepo - Valor de provisions repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param clinicalGrantsRepo - Accesos clínicos que se apoyan en el consentimiento.
   * @param auditTrail - Cadena de auditoría WORM.
   * @param scope - Política común de tenant y referencias de la decisión.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly consentsRepo: ConsentsRepository,
    private readonly provisionsRepo: ConsentProvisionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly clinicalGrantsRepo: ClinicalAccessGrantsRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly scope: ConsentScopeService,
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
    // El tenant sale del contexto verificado, nunca del cuerpo.
    const tenantId = this.scope.resolveTenant(dto.tenantId);
    return this.em.transactional(async (tx) => {
      await this.scope.assertPatientExists(tx, dto.patientProfileId);
      await this.scope.assertPurposeScope(
        tx,
        tenantId,
        dto.processingPurposeId,
        dto.processingLegalBasisId,
      );
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
        tenantId,
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

  /**
   * UC-07-02: retira un consentimiento activo y emite el evento que dispara la re-evaluación.
   *
   * Ruta administrativa: el consentimiento se carga por `(id, tenant activo)`.
   * Uno de otro tenant responde igual que uno inexistente (404, mismo mensaje y
   * `reason`, sin `details`).
   */
  async withdraw(
    id: string,
    dto: WithdrawConsentDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    const tenantId = requireTenantId();
    return this.withdrawScoped(id, dto, actor, (consent) =>
      this.inTenantOrDeny(consent, tenantId, 'consent.consent.withdraw', id),
    );
  }

  /**
   * UC-07-02 desde el titular: retira un consentimiento propio.
   *
   * El alcance no es el tenant sino la titularidad: el consentimiento se carga
   * por `(id, patientProfileId)` del propio paciente, resuelto por la sesión.
   * Un consentimiento de otra persona responde igual que uno inexistente.
   */
  async withdrawAsOwner(
    id: string,
    patientProfileId: string,
    dto: WithdrawConsentDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.withdrawScoped(id, dto, actor, (consent) => {
      if (!consent || consent.patientProfileId !== patientProfileId) {
        this.logScopeDenied('consent.consent.withdraw-own', id);
        throw new ResourceNotFoundException(
          CONSENT_NOT_FOUND.message,
          undefined,
          CONSENT_NOT_FOUND.reason,
        );
      }
      return consent;
    });
  }

  /**
   * Cuerpo común del retiro. `authorize` decide el alcance con el que se cargó
   * el consentimiento y lanza el 404 uniforme si no corresponde.
   */
  private async withdrawScoped(
    id: string,
    dto: WithdrawConsentDto,
    actor: AuthenticatedUser,
    authorize: (consent: Consents | null) => Consents,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'consent.consent.withdraw', consentId: id },
      'Withdrawing consent',
    );
    return this.em.transactional(async (tx) => {
      const consent = authorize(await this.consentsRepo.findById(tx, id));
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

      // C-20: la revocación PROPAGA a los accesos clínicos que se apoyaban en este
      // consentimiento. Sin esto, retirar el consentimiento no invalidaba el grant
      // y el PDP seguía concediendo acceso. No borra accesos ya realizados (el
      // data_access_log es WORM); solo cierra los grants vigentes.
      const revokedGrants = await this.clinicalGrantsRepo.revokeForConsent(
        tx,
        consent.id,
        actor.id,
        now,
      );
      await tx.flush();

      // CAN-AUDIT-001: sella el retiro en la cadena WORM (mutación sensible).
      await this.auditTrail.record(tx, actor, {
        action: 'CONSENT_WITHDRAWN',
        entity: 'consent',
        entityId: consent.id,
        tenantId: consent.tenantId,
      });

      this.logger.info(
        {
          operation: 'consent.consent.withdraw',
          consentId: consent.id,
          revokedGrants,
        },
        'Consent withdrawn; dependent clinical access grants revoked',
      );

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
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const consent = this.inTenantOrDeny(
        await this.consentsRepo.findById(tx, id),
        tenantId,
        'consent.consent.amend-provisions',
        id,
      );
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

  /**
   * Exige que el consentimiento cargado sea del tenant activo; si no, registra
   * la denegación y responde el 404 uniforme.
   *
   * @param consent - Consentimiento cargado por id, o `null`.
   * @param tenantId - Tenant activo.
   * @param operation - Operación que se intentó.
   * @param id - Id pedido.
   * @returns El consentimiento, ya acotado al tenant.
   */
  private inTenantOrDeny(
    consent: Consents | null,
    tenantId: string,
    operation: string,
    id: string,
  ): Consents {
    try {
      return assertResourceInTenant(
        consent,
        consent?.tenantId,
        tenantId,
        CONSENT_NOT_FOUND,
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        this.logScopeDenied(operation, id);
      }
      throw error;
    }
  }

  /**
   * Registra la denegación por alcance. Sólo ids y operación: nunca el contenido.
   *
   * @param operation - Operación que se intentó.
   * @param consentId - Id pedido, que puede no existir o ser de otro tenant.
   */
  private logScopeDenied(operation: string, consentId: string): void {
    this.logger.warn(
      { operation, consentId, reason: 'out-of-scope' },
      'Consentimiento inexistente o fuera del alcance del actor',
    );
  }

  /**
   * Crea create provision.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param consentId - Identificador de consent.
   * @param provision - Valor de provision requerido por la operación.
   * @param actorId - Identificador de actor.
   * @param validFromDefault - Valor de valid from default requerido por la operación.
   */
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

  /**
   * Transforma to response.
   *
   * @param consent - Valor de consent requerido por la operación.
   * @returns Resultado de to response conforme al contrato `ConsentResponseDto`.
   */
  private toResponse(consent: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Identificador asociado a patient profile.
     */
    patientProfileId: string;
    /**
     * Identificador asociado a status concept.
     */
    statusConceptId: string;
    /**
     * Identificador asociado a processing purpose.
     */
    processingPurposeId: string;
    /**
     * Fecha y hora en que se creó el registro.
     */
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
