import { PreconditionFailedException } from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

/**
 * Catálogo maestro de servicios (`billing.service_catalog`): lista fija sobre la
 * que cada doctor arma su presupuesto. El precio de catálogo es sólo referencia
 * — cada presupuesto lleva el precio propio que puso el profesional, nunca
 * `defaultPrice` a ciegas.
 */
/**
 * Un precio en 0 no se acepta al dar de alta ni al corregir un servicio: la
 * cita se cobraría en 0,00 (FAC-06). Un negativo ya lo rechaza el DTO con 400;
 * acá solo llega un importe no negativo con hasta dos decimales. Lo que crea
 * el sistema («Cita médica» en `0.00` al dar de alta una práctica) no pasa por
 * este servicio y sigue igual.
 *
 * @param price - Importe validado por el DTO, como texto.
 * @throws PreconditionFailedException (422) si el importe es 0.
 */
export function assertPricePositive(price: string): void {
  if (Number(price) > 0) return;
  throw new PreconditionFailedException(
    'El precio tiene que ser mayor que 0',
    { defaultPrice: price },
    BillingErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
  );
}
