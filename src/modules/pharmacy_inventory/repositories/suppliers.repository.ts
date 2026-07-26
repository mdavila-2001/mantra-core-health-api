import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacySuppliers } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un proveedor de farmacia. */
export interface CreateSupplierData {
  pharmacyId: string;
  supplierTenantId: string;
  supplierCode?: string;
  businessPartnerId?: string;
  paymentTermsConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.pharmacy_suppliers`. */
@Injectable()
export class SuppliersRepository {
  findById(em: EntityManager, id: string): Promise<PharmacySuppliers | null> {
    return em.findOne(PharmacySuppliers, { id });
  }

  create(em: EntityManager, data: CreateSupplierData): PharmacySuppliers {
    return em.create(
      PharmacySuppliers,
      {
        pharmacyId: data.pharmacyId,
        supplierTenantId: data.supplierTenantId,
        supplierCode: data.supplierCode,
        businessPartnerId: data.businessPartnerId,
        paymentTermsConceptId: data.paymentTermsConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
