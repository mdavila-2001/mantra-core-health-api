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
  ClinicalAccessGrantsRepository,
  BreakGlassSessionsRepository,
} from '../repositories';
import { DataAccessLogRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import {
  CreateClinicalAccessGrantDto,
  BreakTheGlassDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
  type PurposeOfUse,
  type AccessLevel,
} from '../dto';
import { AUTHZ } from '../authz.concepts';

const PURPOSE_CONCEPT: Record<PurposeOfUse, string> = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
};

const ACCESS_LEVEL_CONCEPT: Record<AccessLevel, string> = {
  READ: AUTHZ.ACCESS_LEVEL_READ,
  WRITE: AUTHZ.ACCESS_LEVEL_WRITE,
  FULL: AUTHZ.ACCESS_LEVEL_FULL,
};

const DEFAULT_BTG_WINDOW_MINUTES = 60;

/**
 * UC-06-06 — Acceso clínico con propósito de uso.
 * UC-06-07 — Break-the-glass / anulación de emergencia (extiende 06-06).
 * UC-06-10 — Revocación/expiración de un acceso clínico.
 */
@Injectable()
export class AuthzClinicalService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grantsRepo - Valor de grants repo requerido por la operación.
   * @param btgRepo - Valor de btg repo requerido por la operación.
   * @param dataAccessLogRepo - Valor de data access log repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly grantsRepo: ClinicalAccessGrantsRepository,
    private readonly btgRepo: BreakGlassSessionsRepository,
    private readonly dataAccessLogRepo: DataAccessLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzClinicalService.name);
  }

  /** UC-06-06: concede acceso clínico a un usuario sobre un paciente. */
  async grantClinicalAccess(
    patientProfileId: string,
    dto: CreateClinicalAccessGrantDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.clinical-access.grant',
        patientProfileId,
        grantedUserId: dto.grantedUserId,
        purposeOfUse: dto.purposeOfUse,
      },
      'Granting clinical access',
    );
    return this.em.transactional(async (tx) => {
      const validFrom = dto.validFrom ?? new Date();
      if (dto.validTo <= validFrom) {
        throw new PreconditionFailedException(
          'validTo debe ser posterior a validFrom',
          {},
        );
      }
      // Salvo tratamiento directo, se exige un consentimiento que respalde el acceso.
      if (dto.purposeOfUse !== 'TREATMENT' && !dto.consentId) {
        throw new PreconditionFailedException(
          'Se requiere consentimiento salvo para tratamiento directo',
          { purposeOfUse: dto.purposeOfUse },
        );
      }

      const existing = await this.grantsRepo.findActive(
        tx,
        patientProfileId,
        dto.grantedUserId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe un acceso clínico activo para ese usuario',
          {
            patientProfileId,
            grantedUserId: dto.grantedUserId,
          },
        );
      }

      const grant = this.grantsRepo.create(tx, {
        patientProfileId,
        grantedUserId: dto.grantedUserId,
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        encounterId: dto.encounterId,
        consentId: dto.consentId,
        reasonConceptId: PURPOSE_CONCEPT[dto.purposeOfUse],
        accessLevelConceptId: ACCESS_LEVEL_CONCEPT[dto.accessLevel],
        validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: grant.id, status: 'ACTIVE', createdAt: grant.createdAt };
    });
  }

  /**
   * UC-06-07: acceso de emergencia. Crea un acceso clínico elevado sin
   * consentimiento (ventana corta) y una sesión break-the-glass que dispara la
   * revisión obligatoria del Oficial de Privacidad.
   */
  async breakTheGlass(
    patientProfileId: string,
    dto: BreakTheGlassDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.warn(
      {
        operation: 'authz.break-the-glass',
        patientProfileId,
        userId: actor.id,
      },
      'Break-the-glass emergency access invoked',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const windowMinutes = dto.windowMinutes ?? DEFAULT_BTG_WINDOW_MINUTES;
      const expiresAt = new Date(now.getTime() + windowMinutes * 60_000);

      const grant = this.grantsRepo.create(tx, {
        patientProfileId,
        grantedUserId: actor.id,
        tenantId: dto.tenantId,
        encounterId: dto.encounterId,
        consentId: undefined,
        reasonConceptId: AUTHZ.PURPOSE_EMERGENCY,
        accessLevelConceptId: AUTHZ.ACCESS_LEVEL_ELEVATED,
        validFrom: now,
        validTo: expiresAt,
        actorUserId: actor.id,
      });
      await tx.flush();

      // La sesión break-the-glass deja constancia del MOTIVO (justification) y
      // queda para REVISIÓN posterior (campos reviewed_*/review_outcome en
      // authz.break_glass_sessions, que resuelve el Oficial de Privacidad).
      this.btgRepo.create(tx, {
        tenantId: dto.tenantId,
        userId: actor.id,
        patientRefId: patientProfileId,
        patientRefTypeConceptId: AUTHZ.RESOURCE_TYPE_PATIENT,
        justification: dto.justification,
        reasonConceptId: AUTHZ.PURPOSE_EMERGENCY,
        activatedAt: now,
        expiresAt,
        actorUserId: actor.id,
      });

      // Evento de acceso de emergencia (CAN-EMERG-001): registra los DATOS
      // CONSULTADOS bajo la anulación en la tabla WORM audit.data_access_log,
      // enlazado al mismo paciente/propósito, para la trazabilidad y la revisión.
      // Se persiste en la MISMA transacción que el grant y la sesión BTG.
      this.dataAccessLogRepo.record(tx, {
        userId: actor.id,
        tenantId: dto.tenantId,
        patientProfileId,
        purpose: 'EMERGENCY',
        legalBasisConceptId: AUD.LEGAL_BASIS_LEGAL_OBLIGATION,
        resourceType: 'PATIENT_PROFILE',
        resourceId: patientProfileId,
        actionConceptId: AUD.ACTION_READ,
        recordedByUserId: actor.id,
      });

      await tx.flush();

      // NOTIFICACIÓN AL PACIENTE (break-the-glass): aquí se dispararía la
      // notificación posterior obligatoria al paciente informando del acceso de
      // emergencia a su historia (p. ej. emitir un evento de dominio/outbox
      // `authz.break_glass.activated` que el módulo de mensajería consume). No se
      // envía de forma síncrona para no acoplar el acceso clínico al canal de
      // notificación; el evento se drena tras el COMMIT de esta transacción.

      return { id: grant.id, status: 'ACTIVE', createdAt: grant.createdAt };
    });
  }

  /** UC-06-10: revoca (o expira) un acceso clínico activo. */
  async revokeClinicalAccess(
    grantId: string,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.clinical-access.revoke', grantId },
      'Revoking clinical access',
    );
    return this.em.transactional(async (tx) => {
      const grant = await this.grantsRepo.findById(tx, grantId);
      if (!grant)
        throw new ResourceNotFoundException('Acceso clínico no encontrado', {
          grantId,
        });
      if (grant.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El acceso clínico no está activo',
          {
            grantId,
            state: grant.stateConceptId,
          },
        );
      }

      const now = new Date();
      const expired = grant.validTo <= now;
      grant.stateConceptId = expired
        ? CONCEPTS.STATE_EXPIRED
        : CONCEPTS.STATE_REVOKED;
      if (!expired) grant.validTo = now;
      touch(grant, actor.id);
      await tx.flush();

      return { ok: true, affected: 1 };
    });
  }
}
