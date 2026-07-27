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
  HospitalsRepository,
  HospitalServiceLinesRepository,
  FacilityLicensesRepository,
} from '../repositories';
import {
  CreateHospitalDto,
  ActivateHospitalDto,
  CreateServiceLineDto,
  HospitalResponseDto,
  ServiceLineResponseDto,
  StatusResultDto,
} from '../dto';
import { ORGEXT } from '../organization_extensions.concepts';

/**
 * Casos de uso del ciclo de vida de un hospital y sus líneas de servicio:
 * especialización (UC-22-01), activación con guard de licencia verificada
 * (UC-22-02), alta de línea de servicio (UC-22-03) y retiro soft-delete
 * (UC-22-04).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de los hijos: las FK son columnas uuid planas y MikroORM no ordena
 * inserts entre entidades no relacionadas.
 */
@Injectable()
export class OrgextHospitalsService {
  constructor(
    private readonly em: EntityManager,
    private readonly hospitalsRepo: HospitalsRepository,
    private readonly serviceLinesRepo: HospitalServiceLinesRepository,
    private readonly licensesRepo: FacilityLicensesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrgextHospitalsService.name);
  }

  /** UC-22-01: especializa un practice/tenant como hospital en estado borrador. */
  async specialize(
    dto: CreateHospitalDto,
    actor: AuthenticatedUser,
  ): Promise<HospitalResponseDto> {
    this.logger.info(
      {
        operation: 'orgext.hospital.specialize',
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
      },
      'Specializing practice as hospital',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.hospitalsRepo.findByTenantOrPractice(
        tx,
        dto.tenantId,
        dto.practiceId,
      );
      if (clash) {
        this.logger.warn(
          {
            operation: 'orgext.hospital.specialize',
            reason: 'already-specialized',
          },
          'Rejected hospital specialization: tenant or practice already specialized',
        );
        throw new ConflictException(
          'El tenant o el practice ya está especializado como hospital',
          {
            tenantId: dto.tenantId,
            practiceId: dto.practiceId,
          },
        );
      }

      const hospital = this.hospitalsRepo.create(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        hospitalTypeConceptId:
          dto.hospitalTypeConceptId ?? ORGEXT.HOSPITAL_TYPE_GENERAL,
        careLevelConceptId: dto.careLevelConceptId,
        ownershipTypeConceptId: dto.ownershipTypeConceptId,
        teachingStatusConceptId: dto.teachingStatusConceptId,
        emergencyCapabilityConceptId: dto.emergencyCapabilityConceptId,
        licensedBedCapacity: dto.licensedBedCapacity,
        operationalBedCapacity: dto.operationalBedCapacity,
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'orgext.hospital.specialize', hospitalId: hospital.id },
        'Hospital specialized',
      );
      return this.toResponse(hospital);
    });
  }

  /** UC-22-02: activa un hospital tras verificar que tiene una licencia verificada. */
  async activate(
    hospitalId: string,
    dto: ActivateHospitalDto,
    actor: AuthenticatedUser,
  ): Promise<HospitalResponseDto> {
    this.logger.info(
      { operation: 'orgext.hospital.activate', hospitalId },
      'Activating hospital',
    );
    return this.em.transactional(async (tx) => {
      const hospital = await this.hospitalsRepo.findById(tx, hospitalId);
      if (!hospital)
        throw new ResourceNotFoundException('Hospital no encontrado', {
          hospitalId,
        });

      if (hospital.statusConceptId !== ORGEXT.HOSPITAL_DRAFT) {
        throw new PreconditionFailedException(
          'El hospital no está en estado borrador/inactivo',
          {
            hospitalId,
          },
        );
      }

      const verifiedCount = await this.licensesRepo.countVerifiedForTenant(
        tx,
        hospital.tenantId,
        ORGEXT.LICENSE_VERIFIED,
      );
      if (verifiedCount === 0) {
        this.logger.warn(
          {
            operation: 'orgext.hospital.activate',
            reason: 'no-verified-license',
            hospitalId,
          },
          'Rejected hospital activation: no verified facility license',
        );
        throw new PreconditionFailedException(
          'El hospital no tiene ninguna licencia de instalación verificada',
          { hospitalId },
        );
      }

      hospital.statusConceptId = ORGEXT.HOSPITAL_ACTIVE;
      if (dto.primaryPracticeSiteId)
        hospital.primaryPracticeSiteId = dto.primaryPracticeSiteId;
      if (dto.publicProfileId) hospital.publicProfileId = dto.publicProfileId;
      touch(hospital, actor.id);

      this.logger.info(
        { operation: 'orgext.hospital.activate', hospitalId },
        'Hospital activated',
      );
      return this.toResponse(hospital);
    });
  }

  /** UC-22-03: define una línea de servicio para un hospital activo. */
  async addServiceLine(
    hospitalId: string,
    dto: CreateServiceLineDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceLineResponseDto> {
    this.logger.info(
      { operation: 'orgext.service-line.create', hospitalId },
      'Defining hospital service line',
    );
    return this.em.transactional(async (tx) => {
      const hospital = await this.hospitalsRepo.findById(tx, hospitalId);
      if (!hospital)
        throw new ResourceNotFoundException('Hospital no encontrado', {
          hospitalId,
        });

      if (hospital.statusConceptId !== ORGEXT.HOSPITAL_ACTIVE) {
        throw new PreconditionFailedException('El hospital no está activo', {
          hospitalId,
        });
      }

      const line = this.serviceLinesRepo.create(tx, {
        hospitalId,
        clinicalUnitId: dto.clinicalUnitId,
        healthcareServiceId: dto.healthcareServiceId,
        serviceLineConceptId:
          dto.serviceLineConceptId ?? ORGEXT.SERVICE_LINE_GENERAL,
        specialtyConceptId: dto.specialtyConceptId,
        acuityLevelConceptId: dto.acuityLevelConceptId,
        referralRequired: dto.referralRequired,
        statusConceptId: ORGEXT.SERVICE_LINE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'orgext.service-line.create',
          hospitalId,
          lineId: line.id,
        },
        'Service line defined',
      );
      return {
        id: line.id,
        hospitalId: line.hospitalId,
        status: line.statusConceptId,
        createdAt: line.createdAt,
      };
    });
  }

  /** UC-22-04: retira (soft-delete) una línea de servicio activa. */
  async retireServiceLine(
    hospitalId: string,
    lineId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'orgext.service-line.retire', hospitalId, lineId },
      'Retiring service line',
    );
    return this.em.transactional(async (tx) => {
      const line = await this.serviceLinesRepo.findByIdForHospital(
        tx,
        lineId,
        hospitalId,
      );
      if (!line)
        throw new ResourceNotFoundException('Línea de servicio no encontrada', {
          lineId,
        });

      if (line.statusConceptId !== ORGEXT.SERVICE_LINE_ACTIVE) {
        throw new PreconditionFailedException(
          'La línea de servicio no está activa',
          { lineId },
        );
      }

      line.statusConceptId = ORGEXT.SERVICE_LINE_RETIRED;
      touch(line, actor.id);

      return { ok: true, status: line.statusConceptId };
    });
  }

  private toResponse(hospital: {
    id: string;
    tenantId: string;
    practiceId: string;
    statusConceptId: string;
    createdAt: Date;
  }): HospitalResponseDto {
    return {
      id: hospital.id,
      tenantId: hospital.tenantId,
      practiceId: hospital.practiceId,
      status: hospital.statusConceptId,
      createdAt: hospital.createdAt,
    };
  }
}
