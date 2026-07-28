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
  CareRelationshipsRepository,
  PatientLegalRepresentationsRepository,
} from '../repositories';
import {
  CreateCareRelationshipDto,
  CreateLegalRepresentationDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
  CareRelationshipView,
  LegalRepresentationView,
  type CareRelationshipType,
  type CareRelationshipPurpose,
  type LegalRepresentationType,
} from '../dto';
import { AUTHZ } from '../authz.concepts';

const CARE_REL_TYPE_CONCEPT: Record<CareRelationshipType, string> = {
  TREATING: AUTHZ.CARE_REL_TREATING,
  CONSULTING: AUTHZ.CARE_REL_CONSULTING,
  EMERGENCY: AUTHZ.CARE_REL_EMERGENCY,
};

const CARE_REL_PURPOSE_CONCEPT: Record<CareRelationshipPurpose, string> = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
  EMERGENCY: AUTHZ.PURPOSE_EMERGENCY,
};

const REPRESENTATION_TYPE_CONCEPT: Record<LegalRepresentationType, string> = {
  LEGAL_GUARDIAN: AUTHZ.REPRESENTATION_LEGAL_GUARDIAN,
  PARENT: AUTHZ.REPRESENTATION_PARENT,
  ATTORNEY: AUTHZ.REPRESENTATION_ATTORNEY,
  CURATOR: AUTHZ.REPRESENTATION_CURATOR,
};

/**
 * Relación asistencial (C-06 / CAN-AUTH-001) y representación legal del paciente
 * (C-07 / A-03). Estos vínculos son bases legítimas de acceso a los datos del
 * paciente que evalúa el PDP, además de `clinical_access_grants`. La revocación
 * NUNCA borra: cambia el estado y cierra la vigencia (`valid_to`).
 */
@Injectable()
export class AuthzCareRelationshipsService {
  constructor(
    private readonly em: EntityManager,
    private readonly careRepo: CareRelationshipsRepository,
    private readonly legalRepo: PatientLegalRepresentationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzCareRelationshipsService.name);
  }

  /** Establece una relación asistencial practicante↔paciente. */
  async establishCareRelationship(
    dto: CreateCareRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.care-relationship.establish',
        patientProfileId: dto.patientProfileId,
        practitionerProfileId: dto.practitionerProfileId,
        relationshipType: dto.relationshipType,
      },
      'Establishing care relationship',
    );
    return this.em.transactional(async (tx) => {
      const validFrom = dto.validFrom ?? new Date();
      if (dto.validTo && dto.validTo <= validFrom) {
        throw new PreconditionFailedException(
          'validTo debe ser posterior a validFrom',
          {},
        );
      }

      const existing = await this.careRepo.findActive(
        tx,
        dto.patientProfileId,
        dto.practitionerProfileId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una relación asistencial activa para ese practicante',
          {
            patientProfileId: dto.patientProfileId,
            practitionerProfileId: dto.practitionerProfileId,
          },
        );
      }

      const rel = this.careRepo.create(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        practitionerProfileId: dto.practitionerProfileId,
        relationshipTypeConceptId: CARE_REL_TYPE_CONCEPT[dto.relationshipType],
        purposeConceptId: dto.purposeOfUse
          ? CARE_REL_PURPOSE_CONCEPT[dto.purposeOfUse]
          : undefined,
        validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: rel.id,
        status: CONCEPTS.STATE_ACTIVE,
        createdAt: rel.createdAt,
      };
    });
  }

  /** Revoca (o expira) una relación asistencial activa. NUNCA borra. */
  async revokeCareRelationship(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.care-relationship.revoke', id },
      'Revoking care relationship',
    );
    return this.em.transactional(async (tx) => {
      const rel = await this.careRepo.findById(tx, id);
      if (!rel)
        throw new ResourceNotFoundException(
          'Relación asistencial no encontrada',
          { id },
        );
      if (rel.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La relación asistencial no está activa',
          { id, status: rel.statusConceptId },
        );
      }

      const now = new Date();
      const expired = rel.validTo !== undefined && rel.validTo <= now;
      rel.statusConceptId = expired
        ? CONCEPTS.STATE_EXPIRED
        : CONCEPTS.STATE_REVOKED;
      if (!expired) rel.validTo = now;
      touch(rel, actor.id);
      await tx.flush();
      return { ok: true, affected: 1 };
    });
  }

  /** Lista las relaciones asistenciales de un paciente (scoping por tenant). */
  async listCareRelationshipsByPatient(
    tenantId: string,
    patientProfileId: string,
  ): Promise<CareRelationshipView[]> {
    const em = this.em.fork();
    const rows = await this.careRepo.findByPatient(
      em,
      tenantId,
      patientProfileId,
    );
    return rows.map((r) => ({
      id: r.id,
      patientProfileId: r.patientProfileId,
      practitionerProfileId: r.practitionerProfileId,
      relationshipTypeConceptId: r.relationshipTypeConceptId,
      statusConceptId: r.statusConceptId,
      purposeConceptId: r.purposeConceptId,
      validFrom: r.validFrom,
      validTo: r.validTo,
    }));
  }

  /** Registra una representación legal del paciente. */
  async establishLegalRepresentation(
    dto: CreateLegalRepresentationDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.legal-representation.establish',
        patientProfileId: dto.patientProfileId,
        representativeUserId: dto.representativeUserId,
        representationType: dto.representationType,
      },
      'Establishing legal representation',
    );
    return this.em.transactional(async (tx) => {
      const validFrom = dto.validFrom ?? new Date();
      if (dto.validTo && dto.validTo <= validFrom) {
        throw new PreconditionFailedException(
          'validTo debe ser posterior a validFrom',
          {},
        );
      }

      const existing = await this.legalRepo.findActive(
        tx,
        dto.patientProfileId,
        dto.representativeUserId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una representación legal activa para ese usuario',
          {
            patientProfileId: dto.patientProfileId,
            representativeUserId: dto.representativeUserId,
          },
        );
      }

      const rep = this.legalRepo.create(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        representativeUserId: dto.representativeUserId,
        representationTypeConceptId:
          REPRESENTATION_TYPE_CONCEPT[dto.representationType],
        validFrom,
        validTo: dto.validTo,
        documentRef: dto.documentRef,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: rep.id,
        status: CONCEPTS.STATE_ACTIVE,
        createdAt: rep.createdAt,
      };
    });
  }

  /** Revoca (o expira) una representación legal activa. NUNCA borra. */
  async revokeLegalRepresentation(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.legal-representation.revoke', id },
      'Revoking legal representation',
    );
    return this.em.transactional(async (tx) => {
      const rep = await this.legalRepo.findById(tx, id);
      if (!rep)
        throw new ResourceNotFoundException(
          'Representación legal no encontrada',
          { id },
        );
      if (rep.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La representación legal no está activa',
          { id, status: rep.statusConceptId },
        );
      }

      const now = new Date();
      const expired = rep.validTo !== undefined && rep.validTo <= now;
      rep.statusConceptId = expired
        ? CONCEPTS.STATE_EXPIRED
        : CONCEPTS.STATE_REVOKED;
      if (!expired) rep.validTo = now;
      touch(rep, actor.id);
      await tx.flush();
      return { ok: true, affected: 1 };
    });
  }

  /** Lista las representaciones legales de un paciente (scoping por tenant). */
  async listLegalRepresentationsByPatient(
    tenantId: string,
    patientProfileId: string,
  ): Promise<LegalRepresentationView[]> {
    const em = this.em.fork();
    const rows = await this.legalRepo.findByPatient(
      em,
      tenantId,
      patientProfileId,
    );
    return rows.map((r) => ({
      id: r.id,
      patientProfileId: r.patientProfileId,
      representativeUserId: r.representativeUserId,
      representationTypeConceptId: r.representationTypeConceptId,
      statusConceptId: r.statusConceptId,
      documentRef: r.documentRef,
      validFrom: r.validFrom,
      validTo: r.validTo,
    }));
  }
}
