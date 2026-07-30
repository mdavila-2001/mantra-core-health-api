import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyExternalProductMappings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para mapear un producto a un código externo (UC-24-08). */
export interface CreateMappingData {
  /**
   * Identificador asociado a pharmacy integration connection.
   */
  pharmacyIntegrationConnectionId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Valor de external product code mantenido por la instancia.
   */
  externalProductCode: string;
  /**
   * Valor de external unit code mantenido por la instancia.
   */
  externalUnitCode?: string;
  /**
   * Valor de mapping version mantenido por la instancia.
   */
  mappingVersion?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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
