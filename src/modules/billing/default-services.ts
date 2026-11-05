import { CONCEPTS } from '../../common';

/**
 * El servicio con el que nace toda práctica (FT-22-R01).
 *
 * La fuente literal del pedido dice que la vista de servicios «tendrá de forma
 * predeterminada cita médica». Hasta acá el catálogo arrancaba vacío y cada
 * organización tenía que cargar a mano lo único que hace **toda** práctica
 * médica, así que la pantalla del profesional abría sin nada que mostrar.
 *
 * Vive en un módulo propio y no adentro del servicio que lo usa porque lo
 * consumen dos carriles distintos: el alta de la práctica y el paso de seed que
 * lo repone en las prácticas que ya existían.
 */
export const DEFAULT_APPOINTMENT_SERVICE = Object.freeze({
  /** Código natural dentro de la práctica; es la clave que evita duplicarlo. */
  code: 'CITA_MEDICA',
  /** Rótulo visible, en el idioma del producto. */
  name: 'Cita médica',
  /**
   * Precio inicial.
   *
   * Cero y no un arancel inventado: el propietario no declaró importe, y una
   * consulta médica no tiene precio de referencia nacional que se pueda copiar.
   * La pantalla lo dice con palabras («Definí el precio») en vez de mostrar un
   * número que nadie eligió.
   */
  defaultPrice: '0.00',
  /** Boliviano, la moneda del producto y la que usa el resto del código nuevo. */
  currencyConceptId: CONCEPTS.CURRENCY_BOB,
});

/**
 * Asegura que una práctica tenga el servicio «Cita médica» (FT-22-R01).
 *
 * Toda práctica nace con este servicio en 0.00. Se invoca tanto al
 * provisionar la práctica (consultorio propio, organización) como al
 * consultar su catálogo, garantizando que nunca quede vacía.
 *
 * @param em - Contexto de persistencia o transacción activa.
 * @param serviceCatalogRepo - Repositorio del catálogo.
 * @param practiceId - Identificador de la práctica.
 * @param actorUserId - Usuario que realiza la acción (opcional).
 * @returns true si se insertó el servicio, false si ya existía.
 */
export async function ensureDefaultAppointmentService(
  em: any,
  serviceCatalogRepo: any,
  practiceId: string,
  actorUserId?: string,
): Promise<boolean> {
  const existing = await serviceCatalogRepo.findByCode(
    em,
    practiceId,
    DEFAULT_APPOINTMENT_SERVICE.code,
  );
  if (existing) return false;

  serviceCatalogRepo.create(em, {
    practiceId,
    code: DEFAULT_APPOINTMENT_SERVICE.code,
    name: DEFAULT_APPOINTMENT_SERVICE.name,
    defaultPrice: DEFAULT_APPOINTMENT_SERVICE.defaultPrice,
    currencyConceptId: DEFAULT_APPOINTMENT_SERVICE.currencyConceptId,
    isActive: true,
    actorUserId,
  });
  await em.flush();
  return true;
}
