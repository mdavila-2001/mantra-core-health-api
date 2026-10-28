import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import type { ServiceCatalogRepository } from '../../billing/repositories';
import type { ServiceCatalog } from '../../billing/entities';
import { PracticeErrorReason } from '../practice.error-reasons';

/**
 * Exige que un ítem de catálogo pueda fijar el precio de un procedimiento.
 *
 * El ítem tiene que ser de la misma práctica, estar activo y ser del mismo
 * procedimiento: el precio que ve el paciente es el que se factura, así que no
 * puede salir de un ítem de otra organización ni de otro estudio.
 *
 * @param catalogRepo - Repositorio del catálogo de precios.
 * @param em - Contexto de persistencia o transacción activa.
 * @param practiceId - Práctica que publica el servicio.
 * @param serviceConceptId - Procedimiento del servicio.
 * @param catalogItemId - Ítem propuesto.
 * @returns El ítem, ya validado.
 * @throws PreconditionFailedException (`CATALOG_ITEM_NOT_ELIGIBLE`) si no sirve.
 */
export async function assertCatalogItemFits(
  catalogRepo: Pick<ServiceCatalogRepository, 'findById'>,
  em: EntityManager,
  practiceId: string,
  serviceConceptId: string,
  catalogItemId: string,
): Promise<ServiceCatalog> {
  const item = await catalogRepo.findById(em, catalogItemId);
  if (
    !item ||
    item.practiceId !== practiceId ||
    !item.isActive ||
    item.serviceConceptId !== serviceConceptId
  ) {
    throw new PreconditionFailedException(
      'El ítem de catálogo no es de esta práctica, está inactivo o es de otro procedimiento',
      { serviceCatalogId: catalogItemId },
      PracticeErrorReason.CATALOG_ITEM_NOT_ELIGIBLE,
    );
  }
  return item;
}
