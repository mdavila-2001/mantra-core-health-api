import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PharmaciesRepository,
  PharmacyReferencesRepository,
  PharmacySitesRepository,
} from '../repositories';
import { PHARM } from '../pharmacy.concepts';
import {
  assertReferenceInScope,
  requireManagedPharmacy,
} from './pharmacy-scope';
import { CreateSiteDto, SiteResponseDto } from '../dto';

/**
 * Sedes dispensadoras de una farmacia (UC-24-02). Precondición: la farmacia debe
 * estar ACTIVE (verificada). El código de sede es único por farmacia.
 */
@Injectable()
export class PharmacySitesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaciesRepo - Valor de pharmacies repo requerido por la operación.
   * @param sitesRepo - Valor de sites repo requerido por la operación.
   * @param referencesRepo - Comprobación de propiedad de las referencias del cuerpo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly sitesRepo: PharmacySitesRepository,
    private readonly referencesRepo: PharmacyReferencesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacySitesService.name);
  }

  /** UC-24-02: registra una sede dispensadora sobre una farmacia activa. */
  async createSite(
    pharmacyId: string,
    dto: CreateSiteDto,
    actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    this.logger.info(
      { operation: 'pharmacy.site.create', pharmacyId, code: dto.code },
      'Creating pharmacy site',
    );
    return this.em.transactional(async (tx) => {
      const pharmacy = await requireManagedPharmacy(
        this.pharmaciesRepo,
        tx,
        pharmacyId,
        actor,
      );
      if (pharmacy.statusConceptId !== PHARM.PHARMACY_ACTIVE) {
        throw new PreconditionFailedException('La farmacia no está activa', {
          pharmacyId,
        });
      }

      // La sede de práctica debe ser de una práctica del tenant de la farmacia.
      assertReferenceInScope(
        await this.referencesRepo.practiceSiteBelongsToTenant(
          tx,
          dto.practiceSiteId,
          pharmacy.tenantId,
        ),
      );

      const clash = await this.sitesRepo.findByPharmacyAndCode(
        tx,
        pharmacyId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una sede con ese código en la farmacia',
          {
            code: dto.code,
          },
        );
      }

      const site = this.sitesRepo.create(tx, {
        pharmacyId,
        practiceSiteId: dto.practiceSiteId,
        code: dto.code,
        name: dto.name,
        pharmacySiteTypeConceptId:
          dto.pharmacySiteTypeConceptId ?? PHARM.SITE_TYPE_DISPENSING,
        dispensingModeConceptId:
          dto.dispensingModeConceptId ?? PHARM.DISPENSING_MODE_ONSITE,
        controlledSubstanceCapabilityConceptId:
          dto.controlledSubstanceCapabilityConceptId,
        homeDeliveryAvailable: dto.homeDeliveryAvailable,
        pickupAvailable: dto.pickupAvailable,
        statusConceptId: PHARM.SITE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy.site.create', pharmacyId, siteId: site.id },
        'Pharmacy site created',
      );
      return {
        id: site.id,
        pharmacyId: site.pharmacyId,
        code: site.code,
        name: site.name,
        status: site.statusConceptId,
        createdAt: site.createdAt,
      };
    });
  }
}
