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
  /**
   * La farmacia marcó el producto «no tengo» para toda la farmacia
   * (`out_of_stock_declared`), y esa marca gana sobre el stock de cada sede:
   * una sede no la apaga. Se quita desde el catálogo.
   */
  PRODUCT_OUT_OF_STOCK_DECLARED = 'PRODUCT_OUT_OF_STOCK_DECLARED',
  /** El producto es un borrador o está retirado: no se ofrece en ninguna sede. */
  PRODUCT_NOT_PUBLISHED = 'PRODUCT_NOT_PUBLISHED',
  /**
   * La sede lleva ese producto por lotes (recepciones y conteos): su existencia
   * no se cambia con el interruptor por sede.
   */
  SITE_PRODUCT_KEPT_BY_LOTS = 'SITE_PRODUCT_KEPT_BY_LOTS',
  /** «Lo tengo» con cantidad 0 se contradice: se marca «No lo tengo». */
  SITE_AVAILABILITY_QUANTITY_INVALID = 'SITE_AVAILABILITY_QUANTITY_INVALID',
  /**
   * La API no sabe dónde está el sistema de la farmacia externa
   * (`PHARMACY_ERP_BASE_URL` vacía): no se llama a nadie ni se crea lote.
   */
  PHARMACY_INTEGRATION_NOT_CONFIGURED = 'PHARMACY_INTEGRATION_NOT_CONFIGURED',
  /**
   * El sistema de la farmacia externa no respondió, respondió con error o con
   * algo que no se entiende. No se crea lote.
   */
  PHARMACY_INTEGRATION_UNAVAILABLE = 'PHARMACY_INTEGRATION_UNAVAILABLE',
  /** La conexión no está activa o no admite consultar stock. */
  PHARMACY_INTEGRATION_CONNECTION_INACTIVE = 'PHARMACY_INTEGRATION_CONNECTION_INACTIVE',
}
