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
   * La receta del pedido no está emitida: es un borrador o fue invalidada,
   * reemplazada o completada.
   */
  PRESCRIPTION_NOT_ACTIVE = 'PRESCRIPTION_NOT_ACTIVE',
  /** La receta del pedido está emitida, pero su `valid_to` ya pasó. */
  PRESCRIPTION_EXPIRED = 'PRESCRIPTION_EXPIRED',
  /**
   * Una línea del pedido es de un producto de receta obligatoria cuyo fármaco
   * no está en la receta (o no declara fármaco).
   */
  PRODUCT_NOT_PRESCRIBED = 'PRODUCT_NOT_PRESCRIBED',
  /**
   * Lo pedido de un fármaco supera lo que queda de la receta (recetado −
   * entregado − reservado), cuando la unidad recetada es comparable.
   */
  QUANTITY_EXCEEDS_PRESCRIPTION = 'QUANTITY_EXCEEDS_PRESCRIPTION',
  /** Un pedido sin receta trae un producto de receta obligatoria. */
  PRESCRIPTION_REQUIRED = 'PRESCRIPTION_REQUIRED',
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
  /**
   * Ninguna línea del pedido tiene stock real en la sede: todas son «No lo
   * tengo» o no tienen unidades para reservar. El pedido no se escribe. Basta
   * una línea con stock, o una «por confirmar», para que el pedido entre.
   */
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  /**
   * Un ajuste de la confirmación no cuadra con la línea: confirmar existencia
   * sobre una línea que no está «por confirmar», o sin decir la cantidad.
   */
  ORDER_LINE_NOT_PENDING_CONFIRMATION = 'ORDER_LINE_NOT_PENDING_CONFIRMATION',
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
  /** F5c: el espacio o la unidad no son de la sede de práctica de la sede de farmacia. */
  STOCK_POINT_SITE_MISMATCH = 'STOCK_POINT_SITE_MISMATCH',
  /** F5c: la función del espacio no tiene perfil `stockPoint` o el espacio no está activo. */
  SPACE_NOT_STOCK_POINT = 'SPACE_NOT_STOCK_POINT',
  /** F5c: un botiquín (`WARD_STOCK`) exige su unidad clínica. */
  WARD_STOCK_REQUIRES_UNIT = 'WARD_STOCK_REQUIRES_UNIT',
  /** F5c: la unidad ya tiene un botiquín activo. */
  WARD_STOCK_ALREADY_EXISTS = 'WARD_STOCK_ALREADY_EXISTS',
  /** F5c: retiro o dispensa desde un botiquín sin `available_quantity` suficiente. */
  INSUFFICIENT_AVAILABLE_STOCK = 'INSUFFICIENT_AVAILABLE_STOCK',
  /** F5c: la reserva indicada para dispensar desde un botiquín no está confirmada o venció. */
  RESERVATION_NOT_ACTIVE = 'RESERVATION_NOT_ACTIVE',
}
