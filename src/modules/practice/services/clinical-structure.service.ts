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
  HealthcareServicesRepository,
} from '../repositories';
import {
  CreateClinicalUnitDto,
  CreateHealthcareServiceDto,
  ClinicalUnitResponseDto,
  HealthcareServiceResponseDto,
} from '../dto';
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import { OutboxService } from '../../messaging/services/outbox.service';
import { PracticeErrorReason } from '../practice.error-reasons';
import { StructureAccessService } from './structure-access.service';
import { appendStructureRevision } from './structure-history';
import { STRUCTURE_EVENTS, publishStructureEvent } from './structure-events';
import { flushStructure } from './structure-write-errors';

/**
 * Estructura clínica bajo un sitio: unidades jerárquicas (UC-14-04) y
 * publicación de servicios de salud (UC-14-06). El alta de espacios (UC-14-05)
 * pasó a `CareSpacesAdminService` en F1, con las reglas del árbol físico.
 */
@Injectable()
export class ClinicalStructureService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practicesRepo - Valor de practices repo requerido por la operación.
   * @param sitesRepo - Valor de sites repo requerido por la operación.
   * @param unitsRepo - Valor de units repo requerido por la operación.
   * @param servicesRepo - Valor de services repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param access - Pertenencia al tenant y quién escribe la estructura (org o sucursal).
   * @param historyRepo - Versionado append-only en `audit.*_history`.
   * @param outbox - Eventos de dominio en la misma transacción.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly logger: PinoLogger,
    private readonly access: StructureAccessService,
    private readonly historyRepo: HistoryRepository,
    private readonly outbox: OutboxService,
  ) {
    this.logger.setContext(ClinicalStructureService.name);
  }

  /** UC-14-04: crea una unidad clínica (opcionalmente jerárquica) bajo un sitio activo. */
  async createClinicalUnit(
    siteId: string,
    dto: CreateClinicalUnitDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ClinicalUnitResponseDto> {
    this.logger.info(
      { operation: 'practice.unit.create', siteId },
      'Creating clinical unit',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.access.requireSite(tx, siteId, tenantId);
      await this.access.assertCanWriteSite(tx, site, actor);
      if (site.statusConceptId !== PRAC.SITE_ACTIVE) {
        throw new PreconditionFailedException('El sitio no está activo', {
          siteId,
        });
      }

      if (dto.parentUnitId) {
        const parent = await this.unitsRepo.findById(tx, dto.parentUnitId);
        if (
          !parent ||
          parent.practiceSiteId !== siteId ||
          parent.statusConceptId === PRAC.UNIT_RETIRED
        ) {
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
          PracticeErrorReason.UNIT_CODE_TAKEN,
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
        // F1: el tenant de la sede (NOT NULL desde v4.2.67b, FK compuesta).
        tenantId: site.tenantId,
        validFrom: new Date(),
        actorUserId: actor.id,
      });
      await flushStructure(tx);
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'unit',
        unit,
        AUD.OPERATION_INSERT,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.unitCreated,
        {
          tenantId: unit.tenantId,
          aggregateId: unit.id,
          actorUserId: actor.id,
          payload: {
            siteId,
            unitId: unit.id,
            parentId: unit.parentUnitId ?? null,
            code: unit.code,
            rowVersion: unit.rowVersion ?? 1,
          },
        },
      );
      await flushStructure(tx);
      return {
        id: unit.id,
        practiceSiteId: unit.practiceSiteId,
        code: unit.code,
        status: unit.statusConceptId,
        createdAt: unit.createdAt,
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
