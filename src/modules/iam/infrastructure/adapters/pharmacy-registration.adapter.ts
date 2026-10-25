import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Pharmacies } from '../../../pharmacy/entities/pharmacies.entity';
import type { PharmacyRegistrationPort } from '../../application/ports/pharmacy-registration.port';

/** La fila de `pharmacy.pharmacies` que nace con el alta de una farmacia. */
@Injectable()
export class PharmacyRegistrationAdapter implements PharmacyRegistrationPort {
  createPharmacy(tx: EntityManager, data: object): void {
    tx.create(Pharmacies, data as never, { partial: true });
  }
}
