import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  DiagnosticUnitsRepository,
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyPricesRepository,
} from '../repositories';
import {
  CreatePriceScheduleDto,
  CreateStudyPriceDto,
  PriceScheduleResponseDto,
  StatusResultDto,
  StudyPriceResponseDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';

/**
 * Casos de uso de precios: crear un cronograma (UC-23-06), fijar/versionar el
 * precio de un estudio de forma append-only (UC-23-07) y cerrar una versión de
 * precio vigente (UC-23-08). Los importes publicados nunca se reescriben: una
 * nueva versión cierra la anterior (`effective_to` + estado SUPERSEDED).
 */
@Injectable()
export class DiagnosticPricingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param unitsRepo - Valor de units repo requerido por la operación.
   * @param schedulesRepo - Valor de schedules repo requerido por la operación.
   * @param offeringsRepo - Valor de offerings repo requerido por la operación.
   * @param pricesRepo - Valor de prices repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly unitsRepo: DiagnosticUnitsRepository,
    private readonly schedulesRepo: DiagnosticPriceSchedulesRepository,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly pricesRepo: DiagnosticStudyPricesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticPricingService.name);
  }

  /** UC-23-06: crear un cronograma de precios para la unidad. */
  async createSchedule(
    unitId: string,
    dto: CreatePriceScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<PriceScheduleResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.schedule.create', unitId, code: dto.code },
      'Creating price schedule',
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

      const clash = await this.schedulesRepo.findByCode(tx, unit.id, dto.code);
      if (clash) {
        throw new ConflictException(
          'El código de cronograma ya existe en la unidad',
          {
            code: dto.code,
          },
        );
      }

      const schedule = this.schedulesRepo.create(tx, {
        diagnosticUnitId: unit.id,
        code: dto.code,
        priceScheduleTypeConceptId: dto.priceScheduleTypeConceptId,
        diagnosticUnitSiteId: dto.diagnosticUnitSiteId,
        insurerTenantId: dto.insurerTenantId,
        brokerTenantId: dto.brokerTenantId,
        currencyConceptId: dto.currencyConceptId,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        publicVisibility: dto.publicVisibility,
        actorUserId: actor.id,
      });

      return {
        id: schedule.id,
        code: schedule.code,
        status: schedule.statusConceptId,
      };
    });
  }

  /** UC-23-07: fijar/versionar el precio de un estudio (append-only). */
  async addStudyPrice(
    scheduleId: string,
    dto: CreateStudyPriceDto,
    actor: AuthenticatedUser,
  ): Promise<StudyPriceResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.price.version', scheduleId },
      'Versioning study price',
    );
    return this.em.transactional(async (tx) => {
      const schedule = await this.schedulesRepo.findById(tx, scheduleId);
      if (!schedule) {
        throw new ResourceNotFoundException('Cronograma no encontrado', {
          scheduleId,
        });
      }
      if (schedule.statusConceptId !== DUNIT.SCHEDULE_ACTIVE) {
        throw new PreconditionFailedException('El cronograma no está activo', {
          scheduleId,
        });
      }

      const offering = await this.offeringsRepo.findById(
        tx,
        dto.diagnosticStudyOfferingId,
      );
      if (!offering) {
        throw new ResourceNotFoundException('Oferta de estudio no encontrada', {
          offeringId: dto.diagnosticStudyOfferingId,
        });
      }
      if (offering.diagnosticUnitId !== schedule.diagnosticUnitId) {
        throw new PreconditionFailedException(
          'La oferta no pertenece a la misma unidad que el cronograma',
          { scheduleId, offeringId: offering.id },
        );
      }

      const effectiveFrom = dto.effectiveFrom ?? new Date();

      // Cierra la versión vigente del par (schedule, offering), si existe.
      const current = await this.pricesRepo.findActive(
        tx,
        schedule.id,
        offering.id,
      );
      if (current) {
        current.effectiveTo = effectiveFrom;
        current.statusConceptId = DUNIT.PRICE_SUPERSEDED;
      }

      const maxVersion = await this.pricesRepo.maxVersion(
        tx,
        schedule.id,
        offering.id,
      );
      const price = this.pricesRepo.create(tx, {
        priceScheduleId: schedule.id,
        diagnosticStudyOfferingId: offering.id,
        versionNumber: maxVersion + 1,
        baseAmount: dto.baseAmount,
        patientAmount: dto.patientAmount,
        insurerAmount: dto.insurerAmount,
        taxAmount: dto.taxAmount,
        discountFactor: dto.discountFactor,
        pricingRuleJson: dto.pricingRuleJson,
        effectiveFrom,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'diagnostic_units.price.version',
          priceId: price.id,
          version: price.versionNumber,
        },
        'Study price versioned',
      );
      return {
        id: price.id,
        versionNumber: price.versionNumber,
        status: price.statusConceptId,
        effectiveFrom: price.effectiveFrom,
      };
    });
  }

  /** UC-23-08: cerrar una versión de precio vigente (retirar oferta de precio). */
  async closePrice(
    priceId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'diagnostic_units.price.close', priceId },
      'Closing price',
    );
    return this.em.transactional(async (tx) => {
      const price = await this.pricesRepo.findById(tx, priceId);
      if (!price)
        throw new ResourceNotFoundException('Precio no encontrado', {
          priceId,
        });

      if (price.statusConceptId !== DUNIT.PRICE_ACTIVE || price.effectiveTo) {
        throw new PreconditionFailedException(
          'Solo se puede cerrar una versión de precio activa y aún abierta',
          { priceId },
        );
      }

      price.effectiveTo = new Date();
      price.statusConceptId = DUNIT.PRICE_RETIRED;
      price.recordedByUserId = actor.id;

      return { ok: true };
    });
  }
}
