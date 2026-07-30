import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacySuppliers } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un proveedor de farmacia. */
export interface CreateSupplierData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a supplier tenant.
   */
  supplierTenantId: string;
  /**
   * Valor de supplier code mantenido por la instancia.
   */
  supplierCode?: string;
  /**
   * Identificador asociado a business partner.
   */
  businessPartnerId?: string;
  /**
   * Identificador asociado a payment terms concept.
   */
  paymentTermsConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.pharmacy_suppliers`. */
@Injectable()
export class SuppliersRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PharmacySuppliers | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PharmacySuppliers | null> {
    return em.findOne(PharmacySuppliers, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PharmacySuppliers`.
   */
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
