import { Injectable } from '@nestjs/common';
import type {
  AvailabilityResponseDto,
  MedicationAvailabilityResponseDto,
  SiteStockResponseDto,
} from '../../presentation/dto';
import { ReadMedicationAvailabilityUseCase } from './read-medication-availability.use-case';
import {
  ReadPharmacyInventoryUseCase,
  type GeoPoint,
} from './read-pharmacy-inventory.use-case';

/** Fachada pública de lectura de stock y disponibilidad. */
@Injectable()
export class PharmacyInventoryReadService {
  constructor(
    private readonly readInventory: ReadPharmacyInventoryUseCase,
    private readonly readMedicationAvailability: ReadMedicationAvailabilityUseCase,
  ) {}

  getSiteStock(
    siteId: string,
    productId?: string,
  ): Promise<SiteStockResponseDto> {
    return this.readInventory.getSiteStock(siteId, productId);
  }

  availability(
    productIds: readonly string[],
    origin: GeoPoint | undefined,
    limit?: number,
  ): Promise<AvailabilityResponseDto> {
    return this.readInventory.availability(productIds, origin, limit);
  }

  availabilityByMedication(
    conceptIds: readonly string[],
    origin: GeoPoint | undefined,
    limit?: number,
  ): Promise<MedicationAvailabilityResponseDto> {
    return this.readMedicationAvailability.execute(conceptIds, origin, limit);
  }
}

export {
  compareAvailability,
  haversineKm,
} from './read-pharmacy-inventory.use-case';
export type { GeoPoint } from './read-pharmacy-inventory.use-case';
