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
import { FacilityLicensesRepository } from '../repositories';
import {
  CreateFacilityLicenseDto,
  VerifyLicenseDto,
  FacilityLicenseResponseDto,
  StatusResultDto,
} from '../dto';
import { ORGEXT } from '../organization_extensions.concepts';

/**
 * Casos de uso de licencias de instalación: registro (UC-22-05) y verificación /
 * rechazo (UC-22-06). El servicio posee la transacción y aplica el guard de
 * unicidad de número de licencia por (tenant, tipo) en la misma unidad de trabajo.
 */
@Injectable()
export class OrgextFacilityLicensesService {
  constructor(
    private readonly em: EntityManager,
    private readonly licensesRepo: FacilityLicensesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrgextFacilityLicensesService.name);
  }

  /** UC-22-05: registra una licencia de instalación en estado pendiente. */
  async register(
    dto: CreateFacilityLicenseDto,
    actor: AuthenticatedUser,
  ): Promise<FacilityLicenseResponseDto> {
    this.logger.info(
      { operation: 'orgext.license.register', tenantId: dto.tenantId },
      'Registering facility license',
    );
    return this.em.transactional(async (tx) => {
      const licenseTypeConceptId = dto.licenseTypeConceptId ?? ORGEXT.LICENSE_TYPE_OPERATING;
      const clash = await this.licensesRepo.findByNumber(
        tx,
        dto.tenantId,
        licenseTypeConceptId,
        dto.licenseNumber,
      );
      if (clash) {
        this.logger.warn(
          { operation: 'orgext.license.register', reason: 'duplicate-number' },
          'Rejected license registration: duplicate license number for tenant/type',
        );
        throw new ConflictException(
          'Ya existe una licencia con ese número para el tipo indicado',
          { licenseNumber: dto.licenseNumber },
        );
      }

      const license = this.licensesRepo.create(tx, {
        tenantId: dto.tenantId,
        practiceSiteId: dto.practiceSiteId,
        facilityTypeConceptId: dto.facilityTypeConceptId ?? ORGEXT.FACILITY_TYPE_HOSPITAL,
        licenseTypeConceptId,
        licenseNumber: dto.licenseNumber,
        issuingAuthorityTenantId: dto.issuingAuthorityTenantId,
        issuingAuthorityName: dto.issuingAuthorityName,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        evidenceFileId: dto.evidenceFileId,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'orgext.license.register', licenseId: license.id },
        'Facility license registered',
      );
      return this.toResponse(license);
    });
  }

  /** UC-22-06: verifica o rechaza una licencia pendiente. */
  async verify(
    licenseId: string,
    dto: VerifyLicenseDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'orgext.license.verify', licenseId, decision: dto.decision },
      'Verifying facility license',
    );
    return this.em.transactional(async (tx) => {
      const license = await this.licensesRepo.findById(tx, licenseId);
      if (!license) throw new ResourceNotFoundException('Licencia no encontrada', { licenseId });

      if (license.verificationStatusConceptId !== ORGEXT.LICENSE_PENDING) {
        throw new PreconditionFailedException('La licencia no está en estado pendiente', {
          licenseId,
        });
      }

      license.verificationStatusConceptId =
        dto.decision === 'VERIFY' ? ORGEXT.LICENSE_VERIFIED : ORGEXT.LICENSE_REJECTED;
      touch(license, actor.id);

      return { ok: true, status: license.verificationStatusConceptId };
    });
  }

  private toResponse(license: {
    id: string;
    tenantId: string;
    licenseNumber: string;
    verificationStatusConceptId: string;
    createdAt: Date;
  }): FacilityLicenseResponseDto {
    return {
      id: license.id,
      tenantId: license.tenantId,
      licenseNumber: license.licenseNumber,
      verificationStatus: license.verificationStatusConceptId,
      createdAt: license.createdAt,
    };
  }
}
