import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { ImmunizationsRepository } from '../repositories';
import { CreateImmunizationDto, ImmunizationResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/** UC-08-13: registro de inmunizaciones; evita doble dosis por vacuna+número. */
@Injectable()
export class ImmunizationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly immunizationsRepo: ImmunizationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ImmunizationsService.name);
  }

  /** UC-08-13: registra una inmunización aplicada. */
  async create(
    dto: CreateImmunizationDto,
    actor: AuthenticatedUser,
  ): Promise<ImmunizationResponseDto> {
    this.logger.info(
      { operation: 'clinical.immunization.create', patientProfileId: dto.patientProfileId },
      'Recording immunization',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.immunizationsRepo.findByPatientVaccineDose(
        tx,
        dto.custodianTenantId,
        dto.patientProfileId,
        dto.vaccineConceptId,
        dto.doseNumber,
      );
      if (existing) {
        throw new ConflictException('Esa dosis de la vacuna ya fue registrada', {
          patientProfileId: dto.patientProfileId,
          vaccineConceptId: dto.vaccineConceptId,
          doseNumber: dto.doseNumber ?? null,
        });
      }

      const immunization = this.immunizationsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        vaccineConceptId: dto.vaccineConceptId,
        statusConceptId: CLIN.IMMUNIZATION_COMPLETED,
        doseNumber: dto.doseNumber,
        lotNumber: dto.lotNumber,
        routeConceptId: dto.routeConceptId,
        administeredAt: dto.administeredAt ? new Date(dto.administeredAt) : new Date(),
        administeredByProfileId: dto.administeredByProfileId,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.immunization.create', immunizationId: immunization.id },
        'Immunization recorded',
      );
      return {
        id: immunization.id,
        patientProfileId: immunization.patientProfileId,
        status: immunization.statusConceptId,
        doseNumber: immunization.doseNumber ?? null,
        createdAt: immunization.createdAt,
      };
    });
  }
}
