/**
 * `source_ref_type` con el que una intención de pago declara que cobra una deuda
 * (`source_ref_id` = `payment_debts.id`). Es texto libre en el DTO y no hay un
 * catálogo que lo defina: los valores que el módulo reconoce viven acá.
 */
export const DEBT_SOURCE_REF_TYPE = 'payment_debt';

/**
 * `source_ref_type` conocidos que NO son una deuda. Una intención con uno de estos
 * tipos no tiene una deuda que reservar. El valor de cursos lo fija el módulo de
 * educación (`COURSE_PAYMENT_SOURCE_REF`); una prueba lo contrasta para que no
 * se desincronicen.
 */
export const NON_DEBT_SOURCE_REF_TYPES: readonly string[] = [
  'EDUCATION_COURSE',
];

/**
 * ¿La intención puede estar cobrando una deuda aunque no lo declare con
 * `source_ref_type = payment_debt`?
 *
 * La compuerta contra la deuda (M2) sólo mide lo que sabe que es una deuda; si una
 * intención se escapa de esa lectura el cobro se despacha igual y el sobrepago se
 * descubre con el dinero ya movido (N3 de la re-revisión). Por eso la pregunta se
 * contesta hacia el lado seguro: tiene propósito `DEBT`, o trae una referencia de
 * origen (tipo o id) cuyo tipo no es uno de los conocidos como ajenos a las
 * deudas.
 */
export function mayChargeADebt(intent: {
  purposeIsDebt: boolean;
  sourceRefType?: string | null;
  sourceRefId?: string | null;
}): boolean {
  if (intent.purposeIsDebt) return true;
  const type = intent.sourceRefType?.trim();
  if (!type && !intent.sourceRefId) return false;
  return !type || !NON_DEBT_SOURCE_REF_TYPES.includes(type);
}
