import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSitesRepository } from '../../../practice/repositories';
import { BulkSiteRowDto } from '../../dto';
import type { PharmacySites } from '../../entities';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import { PharmacySitesRepository } from '../../repositories';
import { PharmacyProvisioningService } from '../pharmacy-provisioning.service';
import { PharmacySitesService } from '../pharmacy-sites.service';
import {
  rejectRow,
  textField,
  type BulkContext,
  type BulkHandler,
} from './bulk-handler';

/**
 * Sucursales por su código: crea **sedes de venta** (`pharmacy_sites`), con la
 * misma cadena que el alta de la farmacia (sede de práctica → sede
 * dispensadora, `PharmacyProvisioningService.addSite`), así salen en «Horario y
 * turnos», en el stock por sucursal y en «Dónde comprar». No escribe
 * `directory.branches`, que es lo que lista la pantalla «Sucursales».
 *
 * El cambio toca solo el nombre y si hace retiro o envío; la dirección y el
 * punto se cargan al crear.
 */
@Injectable()
export class SitesBulkHandler implements BulkHandler<
  PharmacySites,
  BulkSiteRowDto,
  BulkSiteRowDto
> {
  readonly keyField = 'code';
  readonly createRow = BulkSiteRowDto;
  readonly updateRow = BulkSiteRowDto;

  constructor(
    private readonly sitesRepo: PharmacySitesRepository,
    private readonly practiceSitesRepo: PracticeSitesRepository,
    private readonly provisioning: PharmacyProvisioningService,
    private readonly sites: PharmacySitesService,
  ) {}

  keyOf(raw: Record<string, unknown>): string | null {
    return textField(raw, 'code');
  }

  findExisting(
    tx: EntityManager,
    ctx: BulkContext,
    key: string,
  ): Promise<PharmacySites | null> {
    return this.sitesRepo.findByPharmacyAndCode(tx, ctx.pharmacy.id, key);
  }

  async create(
    tx: EntityManager,
    ctx: BulkContext,
    row: BulkSiteRowDto,
  ): Promise<string> {
    assertPoint(row);
    const code = row.code.trim();
    const headquarters = ctx.pharmacy.primaryPracticeSiteId
      ? await this.practiceSitesRepo.findById(
          tx,
          ctx.pharmacy.primaryPracticeSiteId,
        )
      : null;
    if (!headquarters) {
      throw rejectRow(
        'row',
        'PHARMACY_PRACTICE_MISSING',
        'La farmacia no tiene casa central registrada: no se pueden sumar sucursales',
      );
    }
    if (
      await this.practiceSitesRepo.findByPracticeAndCode(
        tx,
        headquarters.practiceId,
        code,
      )
    ) {
      throw rejectRow(
        'code',
        PharmacyErrorReason.ALREADY_EXISTS,
        'Ya hay una sede de la organización con ese código',
      );
    }
    const { pharmacy, actor } = ctx;
    const created = await this.provisioning.addSite(
      tx,
      {
        tenantId: pharmacy.tenantId,
        code: pharmacy.code,
        legalName: pharmacy.legalName,
        tradeName: pharmacy.tradeName,
        ownerUserId: actor.id,
        timeZone: headquarters.timeZone,
      },
      headquarters.practiceId,
      pharmacy.id,
      {
        name: row.name.trim(),
        addressLines: row.addressLines,
        latitude: row.latitude,
        longitude: row.longitude,
      },
      code,
      actor.id,
    );
    await tx.flush();
    const site = await this.sitesRepo.findByPharmacyAndCode(
      tx,
      pharmacy.id,
      code,
    );
    if (site) {
      site.pickupAvailable = row.pickupAvailable ?? site.pickupAvailable;
      site.homeDeliveryAvailable =
        row.homeDeliveryAvailable ?? site.homeDeliveryAvailable;
    }
    return created.pharmacySiteId;
  }

  update(
    _tx: EntityManager,
    ctx: BulkContext,
    existing: PharmacySites,
    row: BulkSiteRowDto,
  ): Promise<{ id: string; changed: boolean }> {
    assertPoint(row);
    const changed = this.sites.updateSite(
      existing,
      {
        name: row.name.trim(),
        pickupAvailable: row.pickupAvailable,
        homeDeliveryAvailable: row.homeDeliveryAvailable,
      },
      ctx.actor.id,
    );
    return Promise.resolve({ id: existing.id, changed });
  }
}

/** Latitud y longitud van juntas o no van. */
function assertPoint(row: BulkSiteRowDto): void {
  if ((row.latitude === undefined) !== (row.longitude === undefined)) {
    throw rejectRow(
      row.latitude === undefined ? 'latitude' : 'longitude',
      'COORDINATES_INCOMPLETE',
      'La latitud y la longitud van juntas',
    );
  }
}
