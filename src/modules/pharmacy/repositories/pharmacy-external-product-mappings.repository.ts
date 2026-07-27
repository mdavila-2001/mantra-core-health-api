import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyExternalProductMappings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para mapear un producto a un código externo (UC-24-08). */
export interface CreateMappingData {
  pharmacyIntegrationConnectionId: string;
  pharmacyProductId: string;
  externalProductCode: string;
  externalUnitCode?: string;
  mappingVersion?: string;
  verificationStatusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_external_product_mappings`. */
@Injectable()
export class PharmacyExternalProductMappingsRepository {
  /** Busca un mapeo por (conexión, producto) para validar unicidad. */
  findByConnectionAndProduct(
    em: EntityManager,
    connectionId: string,
    productId: string,
  ): Promise<PharmacyExternalProductMappings | null> {
    return em.findOne(PharmacyExternalProductMappings, {
      pharmacyIntegrationConnectionId: connectionId,
      pharmacyProductId: productId,
    });
  }

  /** Mapeos vigentes (no inactivos) de un producto (para retiro en cascada). */
  findActiveByProduct(
    em: EntityManager,
    productId: string,
    inactiveConceptId: string,
  ): Promise<PharmacyExternalProductMappings[]> {
    return em.find(PharmacyExternalProductMappings, {
      pharmacyProductId: productId,
      verificationStatusConceptId: { $ne: inactiveConceptId },
    });
  }

  /** Crea el mapeo en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateMappingData,
  ): PharmacyExternalProductMappings {
    return em.create(
      PharmacyExternalProductMappings,
      {
        pharmacyIntegrationConnectionId: data.pharmacyIntegrationConnectionId,
        pharmacyProductId: data.pharmacyProductId,
        externalProductCode: data.externalProductCode,
        externalUnitCode: data.externalUnitCode,
        mappingVersion: data.mappingVersion,
        verificationStatusConceptId: data.verificationStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
