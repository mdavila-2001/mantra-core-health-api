/**
 * Catálogo de sub-códigos de negocio estables para `pharmacy_inventory`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto de ese tipo fue, dentro de este módulo. Un cliente
 * puede ramificar sobre `reason` sin parsear `message`.
 */
export enum PharmacyInventoryErrorReason {
  /**
   * La farmacia, sede, ubicación, producto, lote, proveedor, orden, reserva,
   * dispensación, conteo, recall, paciente o receta no existe o no pertenece
   * al ámbito del actor. Ambos casos responden igual a propósito.
   */
  PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE = 'PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE',
  /**
   * Los datos ya guardados no cierran la cadena farmacia, sede, ubicación,
   * producto y lote: operar sobre ellos escribiría asientos con una farmacia
   * o una sede que no son las verdaderas.
   */
  PHARMACY_INVENTORY_SCOPE_INCONSISTENT = 'PHARMACY_INVENTORY_SCOPE_INCONSISTENT',
}
