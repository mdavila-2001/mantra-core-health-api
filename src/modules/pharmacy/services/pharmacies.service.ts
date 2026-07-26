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
import { PharmaciesRepository, PharmacyLicensesRepository } from '../repositories';
import { PHARM } from '../pharmacy.concepts';
import { CreatePharmacyDto, PharmacyResponseDto, StatusResultDto, VerifyLicenseDto } from '../dto';

/**
 * Identidad de farmacia y verificación regulatoria.
 *  - UC-24-01: alta de farmacia con licencia inicial (padre + hijo en una tx).
 *  - UC-24-03: verificar una licencia y aprobar la farmacia cuando todas sus
 *    licencias están verificadas.
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes del hijo: las FK son columnas uuid planas y MikroORM no ordena los
 * inserts entre entidades no relacionadas.
 */
@Injectable()
export class PharmaciesService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly licensesRepo: PharmacyLicensesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmaciesService.name);
  }

  /** UC-24-01: crea una farmacia (estado DRAFT / verificación PENDING) y su licencia inicial. */
  async createPharmacy(dto: CreatePharmacyDto, actor: AuthenticatedUser): Promise<PharmacyResponseDto> {
    this.logger.info(
      { operation: 'pharmacy.create', tenantId: dto.tenantId, code: dto.code },
      'Creating pharmacy',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.pharmaciesRepo.findByTenantAndCode(tx, dto.tenantId, dto.code);
      if (clash) {
        this.logger.warn(
          { operation: 'pharmacy.create', reason: 'code-in-use', code: dto.code },
          'Rejected pharmacy creation: code already used in tenant',
        );
        throw new ConflictException('Ya existe una farmacia con ese código en el tenant', {
          code: dto.code,
        });
      }

      const pharmacy = this.pharmaciesRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        pharmacyTypeConceptId: dto.isRetail === false ? undefined : PHARM.PHARMACY_TYPE_RETAIL,
        ownershipTypeConceptId: PHARM.OWNERSHIP_PRIVATE,
        defaultCurrencyConceptId: PHARM.CURRENCY_USD,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes del hijo.
      await tx.flush();

      const license = this.licensesRepo.create(tx, {
        pharmacyId: pharmacy.id,
        licenseTypeConceptId: PHARM.LICENSE_TYPE_OPERATING,
        licenseNumber: dto.license.licenseNumber,
        issuingAuthorityTenantId: dto.license.issuingAuthorityTenantId,
        jurisdictionConceptId: dto.license.jurisdictionConceptId,
        validFrom: dto.license.validFrom ? new Date(dto.license.validFrom) : undefined,
        validTo: dto.license.validTo ? new Date(dto.license.validTo) : undefined,
        evidenceFileId: dto.license.evidenceFileId,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy.create', pharmacyId: pharmacy.id, licenseId: license.id },
        'Pharmacy created',
      );
      return {
        id: pharmacy.id,
        code: pharmacy.code,
        legalName: pharmacy.legalName,
        status: pharmacy.statusConceptId,
        verificationStatus: pharmacy.verificationStatusConceptId,
        licenseId: license.id,
        createdAt: pharmacy.createdAt,
      };
    });
  }

  /**
   * UC-24-03: verifica (o rechaza) una licencia. Si `approve` y ya no quedan
   * licencias sin verificar, aprueba la farmacia (verificación VERIFIED + ACTIVE).
   */
  async verifyLicense(
    pharmacyId: string,
    licenseId: string,
    dto: VerifyLicenseDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    const approve = dto.approve ?? true;
    this.logger.info(
      { operation: 'pharmacy.license.verify', pharmacyId, licenseId, approve },
      'Verifying pharmacy license',
    );
    return this.em.transactional(async (tx) => {
      const pharmacy = await this.pharmaciesRepo.findById(tx, pharmacyId);
      if (!pharmacy) throw new ResourceNotFoundException('Farmacia no encontrada', { pharmacyId });

      const license = await this.licensesRepo.findById(tx, licenseId);
      if (!license || license.pharmacyId !== pharmacyId) {
        throw new ResourceNotFoundException('Licencia no encontrada', { licenseId });
      }
      if (license.verificationStatusConceptId !== PHARM.VERIFICATION_PENDING) {
        throw new PreconditionFailedException('La licencia no está pendiente de verificación', {
          licenseId,
        });
      }

      license.verificationStatusConceptId = approve
        ? PHARM.VERIFICATION_VERIFIED
        : PHARM.VERIFICATION_REJECTED;
      if (dto.evidenceFileId) license.evidenceFileId = dto.evidenceFileId;
      touch(license, actor.id);
      // Persistir el cambio antes de contar las licencias sin verificar.
      await tx.flush();

      if (approve) {
        const remaining = await this.licensesRepo.countUnverified(
          tx,
          pharmacyId,
          PHARM.VERIFICATION_VERIFIED,
        );
        if (remaining === 0) {
          pharmacy.verificationStatusConceptId = PHARM.VERIFICATION_VERIFIED;
          pharmacy.statusConceptId = PHARM.PHARMACY_ACTIVE;
          touch(pharmacy, actor.id);
        }
      }

      this.logger.info(
        { operation: 'pharmacy.license.verify', pharmacyId, licenseId, approve },
        'Pharmacy license verification applied',
      );
      return { ok: true };
    });
  }
}
