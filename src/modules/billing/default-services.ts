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
