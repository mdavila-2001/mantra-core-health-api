import { Injectable } from '@nestjs/common';
import { PharmacyReadRepository } from '../../../pharmacy/repositories';
import type { PharmacyDirectoryPort } from '../../application/ports/pharmacy-directory.port';

/** Adaptador a las lecturas publicadas por el contexto pharmacy. */
@Injectable()
export class PharmacyDirectoryAdapter implements PharmacyDirectoryPort {
  constructor(private readonly pharmacy: PharmacyReadRepository) {}

  findVisibleByTenant(
    ...args: Parameters<PharmacyReadRepository['findVisibleByTenant']>
  ) {
    return this.pharmacy.findVisibleByTenant(...args);
  }

  findVisibleById(
    ...args: Parameters<PharmacyReadRepository['findVisibleById']>
  ) {
    return this.pharmacy.findVisibleById(...args);
  }

  findActiveSites(
    ...args: Parameters<PharmacyReadRepository['findActiveSites']>
  ) {
    return this.pharmacy.findActiveSites(...args);
  }

  findActiveSiteById(
    ...args: Parameters<PharmacyReadRepository['findActiveSiteById']>
  ) {
    return this.pharmacy.findActiveSiteById(...args);
  }

  findActiveProductsByIds(
    ...args: Parameters<PharmacyReadRepository['findActiveProductsByIds']>
  ) {
    return this.pharmacy.findActiveProductsByIds(...args);
  }

  findSellableProductsByIds(
    ...args: Parameters<PharmacyReadRepository['findSellableProductsByIds']>
  ) {
    return this.pharmacy.findSellableProductsByIds(...args);
  }

  findCurrentPublicPriceLists(
    ...args: Parameters<PharmacyReadRepository['findCurrentPublicPriceLists']>
  ) {
    return this.pharmacy.findCurrentPublicPriceLists(...args);
  }

  findCurrentPrices(
    ...args: Parameters<PharmacyReadRepository['findCurrentPrices']>
  ) {
    return this.pharmacy.findCurrentPrices(...args);
  }

  findPracticeSites(
    ...args: Parameters<PharmacyReadRepository['findPracticeSites']>
  ) {
    return this.pharmacy.findPracticeSites(...args);
  }

  findAddresses(...args: Parameters<PharmacyReadRepository['findAddresses']>) {
    return this.pharmacy.findAddresses(...args);
  }

  findConcepts(...args: Parameters<PharmacyReadRepository['findConcepts']>) {
    return this.pharmacy.findConcepts(...args);
  }
}
