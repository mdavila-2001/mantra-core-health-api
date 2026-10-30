import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { ServiceCatalogRepository } from '../../billing/repositories';
import { ProcedureReferenceReader } from '../../billing/services/procedure-reference.reader';
import { PracticeAdministrationService } from './practice-administration.service';
import { assertCatalogItemFits } from './healthcare-service-catalog-item';
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
   * @param administration - Regla de administración por organización (A-6).
   * @param catalogRepo - Catálogo de precios de la práctica.
   * @param procedures - Nomenclador de procedimientos.
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
    private readonly administration: PracticeAdministrationService,
    private readonly catalogRepo: ServiceCatalogRepository,
    private readonly procedures: ProcedureReferenceReader,
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

  /**
   * UC-14-06: publica un procedimiento del nomenclador en una sede, con el precio
   * del ítem de catálogo indicado.
   *
   * Lo publica quien administra **esa** organización (A-6): el administrador de
   * otra recibe 403. El precio es por sede: cada servicio apunta a su ítem, y dos
   * sedes de la misma práctica pueden tener ítems distintos.
   *
   * @throws PreconditionFailedException (422) si el concepto no es un
   * procedimiento, o el ítem no sirve (otra práctica, inactivo, otro concepto).
   * @throws ConflictException (409) si la sede ya ofrece ese procedimiento.
   */
  async publishHealthcareService(
    practiceId: string,
    dto: CreateHealthcareServiceDto,
    actor: AuthenticatedUser,
  ): Promise<HealthcareServiceResponseDto> {
    this.logger.info(
      { operation: 'practice.service.publish', practiceId },
      'Publishing healthcare service',
    );
    try {
      return await this.em.transactional(async (tx) => {
        const practice = await this.administration.assertCanAdministerPractice(
          tx,
          practiceId,
          actor,
        );
        if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
          throw new PreconditionFailedException('La práctica no está activa', {
            practiceId,
          });
        }

        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El sitio no pertenece a la práctica',
            { practiceId, siteId: dto.practiceSiteId },
          );
        }
        if (dto.clinicalUnitId) {
          const unit = await this.unitsRepo.findById(tx, dto.clinicalUnitId);
          // La unidad debe colgar de una sede de ESTA práctica: una unidad de otra
          // práctica (o de otro tenant) responde igual que una inexistente.
          const unitSite = unit
            ? await this.sitesRepo.findById(tx, unit.practiceSiteId)
            : null;
          if (!unit || !unitSite || unitSite.practiceId !== practiceId) {
            throw new PreconditionFailedException(
              'La unidad clínica no existe',
              { clinicalUnitId: dto.clinicalUnitId },
            );
          }
        }

        if (!(await this.procedures.isProcedure(tx, dto.serviceConceptId))) {
          throw new PreconditionFailedException(
            'El concepto no es un procedimiento del nomenclador',
            { serviceConceptId: dto.serviceConceptId },
            PracticeErrorReason.SERVICE_CONCEPT_NOT_A_PROCEDURE,
          );
        }
        await assertCatalogItemFits(
          this.catalogRepo,
          tx,
          practiceId,
          dto.serviceConceptId,
          dto.serviceCatalogId,
        );

        const existing = await this.servicesRepo.findBySiteAndConcept(
          tx,
          dto.practiceSiteId,
          dto.serviceConceptId,
        );
        if (existing) throw alreadyOffered(existing.id);

        const service = this.servicesRepo.create(tx, {
          practiceId,
          practiceSiteId: dto.practiceSiteId,
          clinicalUnitId: dto.clinicalUnitId,
          serviceConceptId: dto.serviceConceptId,
          serviceCatalogId: dto.serviceCatalogId,
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
    } catch (error) {
      // Dos publicaciones simultáneas: gana una y la otra choca con el único.
      if (error instanceof UniqueConstraintViolationException) {
        throw alreadyOffered();
      }
      throw error;
    }
  }
}

/**
 * El 409 de «la sede ya ofrece este procedimiento».
 *
 * @param healthcareServiceId - El servicio existente, si se conoce.
 * @returns La excepción lista para lanzar.
 */
function alreadyOffered(healthcareServiceId?: string): ConflictException {
  return new ConflictException(
    'La sede ya ofrece este procedimiento',
    healthcareServiceId ? { healthcareServiceId } : undefined,
    PracticeErrorReason.SERVICE_ALREADY_OFFERED_AT_SITE,
  );
}
