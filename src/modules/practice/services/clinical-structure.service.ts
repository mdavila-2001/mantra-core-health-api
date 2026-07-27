import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import {
  PracticesRepository,
  PracticeSitesRepository,
  ClinicalUnitsRepository,
  CareSpacesRepository,
  HealthcareServicesRepository,
} from '../repositories';
import {
  CreateClinicalUnitDto,
  CreateCareSpaceDto,
  CreateHealthcareServiceDto,
  ClinicalUnitResponseDto,
  CareSpaceResponseDto,
  HealthcareServiceResponseDto,
} from '../dto';

/**
 * Estructura clínica bajo un sitio: unidades jerárquicas (UC-14-04), espacios de
 * atención (UC-14-05) y publicación de servicios de salud (UC-14-06).
 */
@Injectable()
export class ClinicalStructureService {
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalStructureService.name);
  }

  /** UC-14-04: crea una unidad clínica (opcionalmente jerárquica) bajo un sitio activo. */
  async createClinicalUnit(
    siteId: string,
    dto: CreateClinicalUnitDto,
    actor: AuthenticatedUser,
  ): Promise<ClinicalUnitResponseDto> {
    this.logger.info(
      { operation: 'practice.unit.create', siteId },
      'Creating clinical unit',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.sitesRepo.findById(tx, siteId);
      if (!site)
        throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
      if (site.statusConceptId !== PRAC.SITE_ACTIVE) {
        throw new PreconditionFailedException('El sitio no está activo', {
          siteId,
        });
      }

      if (dto.parentUnitId) {
        const parent = await this.unitsRepo.findById(tx, dto.parentUnitId);
        if (!parent || parent.practiceSiteId !== siteId) {
          throw new PreconditionFailedException(
            'La unidad padre no pertenece al sitio',
            {
              siteId,
              parentUnitId: dto.parentUnitId,
            },
          );
        }
      }

      const clash = (await this.unitsRepo.findBySite(tx, siteId)).find(
        (u) => u.code === dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una unidad con ese código en el sitio',
          {
            siteId,
            code: dto.code,
          },
        );
      }

      const unit = this.unitsRepo.create(tx, {
        practiceSiteId: siteId,
        parentUnitId: dto.parentUnitId,
        code: dto.code,
        name: dto.name,
        unitTypeConceptId: dto.unitTypeConceptId ?? PRAC.UNIT_TYPE_DEPARTMENT,
        specialtyConceptId: dto.specialtyConceptId,
        serviceModeConceptId: dto.serviceModeConceptId,
        statusConceptId: PRAC.UNIT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: unit.id,
        practiceSiteId: unit.practiceSiteId,
        code: unit.code,
        status: unit.statusConceptId,
        createdAt: unit.createdAt,
      };
    });
  }

  /** UC-14-05: crea un espacio de atención bajo un sitio (opcionalmente en una unidad). */
  async createCareSpace(
    siteId: string,
    dto: CreateCareSpaceDto,
    actor: AuthenticatedUser,
  ): Promise<CareSpaceResponseDto> {
    this.logger.info(
      { operation: 'practice.space.create', siteId },
      'Creating care space',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.sitesRepo.findById(tx, siteId);
      if (!site)
        throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
      if (site.statusConceptId !== PRAC.SITE_ACTIVE) {
        throw new PreconditionFailedException('El sitio no está activo', {
          siteId,
        });
      }

      if (dto.clinicalUnitId) {
        const unit = await this.unitsRepo.findById(tx, dto.clinicalUnitId);
        if (!unit || unit.practiceSiteId !== siteId) {
          throw new PreconditionFailedException(
            'La unidad no pertenece al sitio',
            {
              siteId,
              clinicalUnitId: dto.clinicalUnitId,
            },
          );
        }
      }
      if (dto.parentSpaceId) {
        const parent = await this.spacesRepo.findById(tx, dto.parentSpaceId);
        if (!parent || parent.practiceSiteId !== siteId) {
          throw new PreconditionFailedException(
            'El espacio padre no pertenece al sitio',
            {
              siteId,
              parentSpaceId: dto.parentSpaceId,
            },
          );
        }
      }

      const clash = (await this.spacesRepo.findBySite(tx, siteId)).find(
        (s) => s.code === dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un espacio con ese código en el sitio',
          {
            siteId,
            code: dto.code,
          },
        );
      }

      const space = this.spacesRepo.create(tx, {
        practiceSiteId: siteId,
        clinicalUnitId: dto.clinicalUnitId,
        parentSpaceId: dto.parentSpaceId,
        code: dto.code,
        name: dto.name,
        spaceTypeConceptId: dto.spaceTypeConceptId ?? PRAC.SPACE_TYPE_ROOM,
        capacity: dto.capacity,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        statusConceptId: PRAC.SPACE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: space.id,
        practiceSiteId: space.practiceSiteId,
        code: space.code,
        status: space.statusConceptId,
        operationalStatus: space.operationalStatusConceptId!,
        createdAt: space.createdAt,
      };
    });
  }

  /** UC-14-06: publica un servicio de salud en la práctica (opcionalmente en sitio/unidad). */
  async publishHealthcareService(
    practiceId: string,
    dto: CreateHealthcareServiceDto,
    actor: AuthenticatedUser,
  ): Promise<HealthcareServiceResponseDto> {
    this.logger.info(
      { operation: 'practice.service.publish', practiceId },
      'Publishing healthcare service',
    );
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice)
        throw new ResourceNotFoundException('Práctica no encontrada', {
          practiceId,
        });
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }

      if (dto.practiceSiteId) {
        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El sitio no pertenece a la práctica',
            {
              practiceId,
              siteId: dto.practiceSiteId,
            },
          );
        }
      }
      if (dto.clinicalUnitId) {
        const unit = await this.unitsRepo.findById(tx, dto.clinicalUnitId);
        if (!unit) {
          throw new PreconditionFailedException('La unidad clínica no existe', {
            clinicalUnitId: dto.clinicalUnitId,
          });
        }
      }

      const service = this.servicesRepo.create(tx, {
        practiceId,
        practiceSiteId: dto.practiceSiteId,
        clinicalUnitId: dto.clinicalUnitId,
        serviceConceptId: dto.serviceConceptId ?? PRAC.SERVICE_GENERAL,
        specialtyConceptId: dto.specialtyConceptId,
        referralRequired: dto.referralRequired,
        appointmentRequired: dto.appointmentRequired,
        telehealthAvailable: dto.telehealthAvailable,
        statusConceptId: PRAC.SERVICE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: service.id,
        practiceId: service.practiceId,
        status: service.statusConceptId,
        createdAt: service.createdAt,
      };
    });
  }
}
