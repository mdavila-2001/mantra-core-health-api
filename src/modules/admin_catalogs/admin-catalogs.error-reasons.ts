/**
 * Sub-códigos de negocio estables del módulo `admin_catalogs` (editor de
 * catálogos globales). El cliente ramifica sobre `reason`, nunca sobre el texto.
 */
export enum AdminCatalogsErrorReason {
  /** El servicio no existe o su práctica es de otra organización (mismo 404). */
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',

  /** La práctica no existe o es de otra organización (mismo 404). */
  SERVICE_PRACTICE_NOT_FOUND = 'SERVICE_PRACTICE_NOT_FOUND',

  /** Ya existe un servicio con ese código en la práctica y con datos distintos. */
  SERVICE_CATALOG_CODE_ALREADY_EXISTS = 'SERVICE_CATALOG_CODE_ALREADY_EXISTS',

  /** El precio tiene que ser mayor que cero. */
  SERVICE_CATALOG_PRICE_NOT_POSITIVE = 'SERVICE_CATALOG_PRICE_NOT_POSITIVE',

  /** Otra persona cambió el servicio: la versión esperada ya no es la vigente. */
  SERVICE_CATALOG_VERSION_MISMATCH = 'SERVICE_CATALOG_VERSION_MISMATCH',

  /** La moneda pedida no es una de las admitidas para el catálogo. */
  SERVICE_CATALOG_CURRENCY_NOT_SUPPORTED = 'SERVICE_CATALOG_CURRENCY_NOT_SUPPORTED',

  /** La edición no trae ningún campo editable. */
  SERVICE_CATALOG_EMPTY_UPDATE = 'SERVICE_CATALOG_EMPTY_UPDATE',
}
