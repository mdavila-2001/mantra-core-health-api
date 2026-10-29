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
  /** El espacio de la ubicación no es de la sede de la farmacia (o la unidad no es de esa sede). */
  STOCK_POINT_SITE_MISMATCH = 'STOCK_POINT_SITE_MISMATCH',
  /** La función del espacio no es un punto de stock (`stockPoint`). */
  SPACE_NOT_STOCK_POINT = 'SPACE_NOT_STOCK_POINT',
  /** El espacio no está activo (o está fuera de su vigencia): no recibe stock. */
  STOCK_POINT_SPACE_NOT_ACTIVE = 'STOCK_POINT_SPACE_NOT_ACTIVE',
  /** La unidad no está activa. */
  STOCK_POINT_UNIT_NOT_ACTIVE = 'STOCK_POINT_UNIT_NOT_ACTIVE',
  /** El espacio no pertenece a la unidad indicada. */
  STOCK_POINT_UNIT_MISMATCH = 'STOCK_POINT_UNIT_MISMATCH',
  /** Un botiquín de piso se crea para una unidad: falta `clinicalUnitId`. */
  WARD_STOCK_UNIT_REQUIRED = 'WARD_STOCK_UNIT_REQUIRED',
  /** La unidad ya tiene su botiquín de piso vigente. */
  WARD_STOCK_ALREADY_EXISTS = 'WARD_STOCK_ALREADY_EXISTS',
  /** Sólo una ubicación vigente se reubica. */
  STOCK_LOCATION_NOT_ACTIVE = 'STOCK_LOCATION_NOT_ACTIVE',
  /** El tipo de ubicación pedido no existe (`SHELF` o `WARD_STOCK`). */
  LOCATION_TYPE_INVALID = 'LOCATION_TYPE_INVALID',
  /** El botiquín no tiene `available_quantity` suficiente (las reservas no se rompen). */
  INSUFFICIENT_AVAILABLE_STOCK = 'INSUFFICIENT_AVAILABLE_STOCK',
}
