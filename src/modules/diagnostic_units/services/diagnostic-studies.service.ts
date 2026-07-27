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
  DiagnosticUnitsRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyComponentsRepository,
} from '../repositories';
import {
  CreateStudyOfferingDto,
  StatusResultDto,
  StudyOfferingResponseDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';

/**
 * Casos de uso del catálogo de estudios: publicar una oferta con sus componentes
 * de panel (UC-23-05) y retirar (soft-delete) una oferta (UC-23-08).
 */
@Injectable()
export class DiagnosticStudiesService {
  constructor(
    private readonly em: EntityManager,
    private readonly unitsRepo: DiagnosticUnitsRepository,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly componentsRepo: DiagnosticStudyComponentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticStudiesService.name);
  }

  /** UC-23-05: publicar una oferta de estudio con componentes (panel). */
  async createOffering(
    unitId: string,
    dto: CreateStudyOfferingDto,
    actor: AuthenticatedUser,
  ): Promise<StudyOfferingResponseDto> {
    this.logger.info(
      {
        operation: 'diagnostic_units.offering.create',
        unitId,
        studyCode: dto.studyCode,
      },
      'Publishing study offering',
    );
    return this.em.transactional(async (tx) => {
      const unit = await this.unitsRepo.findById(tx, unitId);
      if (!unit)
        throw new ResourceNotFoundException('Unidad no encontrada', { unitId });
      if (unit.statusConceptId !== DUNIT.UNIT_ACTIVE) {
        throw new PreconditionFailedException('La unidad no está activa', {
          unitId,
        });
      }

      const clash = await this.offeringsRepo.findByStudyCode(
        tx,
        unit.id,
        dto.studyCode,
      );
      if (clash) {
        throw new ConflictException(
          'El código de estudio ya existe en la unidad',
          {
            studyCode: dto.studyCode,
          },
        );
      }

      const offering = this.offeringsRepo.create(tx, {
        diagnosticUnitId: unit.id,
        studyCode: dto.studyCode,
        studyConceptId: dto.studyConceptId,
        displayName: dto.displayName,
        diagnosticUnitSiteId: dto.diagnosticUnitSiteId,
        modalityConceptId: dto.modalityConceptId,
        bodySiteConceptId: dto.bodySiteConceptId,
        specimenTypeConceptId: dto.specimenTypeConceptId,
        description: dto.description,
        preparationInstructions: dto.preparationInstructions,
        expectedDurationMinutes: dto.expectedDurationMinutes,
        expectedTurnaroundMinutes: dto.expectedTurnaroundMinutes,
        requiresMedicalOrder: dto.requiresMedicalOrder,
        requiresPriorAuthorization: dto.requiresPriorAuthorization,
        homeCollectionEligible: dto.homeCollectionEligible,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir la oferta padre antes de sus componentes.
      await tx.flush();

      const components = dto.components ?? [];
      for (const c of components) {
        // Evita autorreferencia (un panel no puede contenerse a sí mismo).
        if (c.componentOfferingId === offering.id) {
          throw new PreconditionFailedException(
            'Un panel no puede referenciarse a sí mismo como componente',
            { offeringId: offering.id },
          );
        }
        this.componentsRepo.create(tx, {
          parentOfferingId: offering.id,
          componentOfferingId: c.componentOfferingId,
          componentRoleConceptId: c.componentRoleConceptId,
          quantity: c.quantity,
          ordinal: c.ordinal,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'diagnostic_units.offering.create',
          offeringId: offering.id,
        },
        'Study offering published',
      );
      return {
        id: offering.id,
        studyCode: offering.studyCode,
        status: offering.statusConceptId,
        componentCount: components.length,
      };
    });
  }

  /** UC-23-08: retirar (soft-delete) una oferta de estudio. */
  async retireOffering(
    offeringId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'diagnostic_units.offering.retire', offeringId },
      'Retiring study offering',
    );
    return this.em.transactional(async (tx) => {
      const offering = await this.offeringsRepo.findById(tx, offeringId);
      if (!offering)
        throw new ResourceNotFoundException('Oferta no encontrada', {
          offeringId,
        });

      if (offering.statusConceptId === DUNIT.OFFERING_RETIRED) {
        throw new ConflictException('La oferta ya está retirada', {
          offeringId,
        });
      }

      offering.statusConceptId = DUNIT.OFFERING_RETIRED;
      touch(offering, actor.id);

      return { ok: true };
    });
  }
}
