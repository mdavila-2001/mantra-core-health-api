/**
 * Sub-códigos de negocio estables del módulo `ui_visibility`. El cliente ramifica
 * sobre `reason`, nunca sobre el texto. Los cinco primeros son los del contrato
 * (CONTRATO.md §Endpoints); los demás los añade este módulo y están en la entrega.
 */
export enum UiVisibilityErrorReason {
  /** El elemento no existe (o la regla/sujeto se pidió sobre uno inexistente). 404. */
  UI_ELEMENT_NOT_FOUND = 'UI_ELEMENT_NOT_FOUND',

  /** El elemento está RETIRED: no admite reglas nuevas. 409. */
  UI_ELEMENT_RETIRED = 'UI_ELEMENT_RETIRED',

  /** `If-Match` no es la versión vigente de la regla. 409. */
  UI_RULE_VERSION_MISMATCH = 'UI_RULE_VERSION_MISMATCH',

  /** Ya hay una regla sin terminar para la misma terna elemento + sujeto. 409. */
  UI_RULE_DUPLICATE = 'UI_RULE_DUPLICATE',

  /** El sujeto no existe, no es de la forma que exige su tipo o no está al alcance del actor. 422. */
  UI_RULE_INVALID_SUBJECT = 'UI_RULE_INVALID_SUBJECT',

  /** La regla no existe o es de otra organización (mismo 404). */
  UI_RULE_NOT_FOUND = 'UI_RULE_NOT_FOUND',

  /** La regla ya está terminada: no se edita. 409. */
  UI_RULE_ENDED = 'UI_RULE_ENDED',

  /** Falta la cabecera `If-Match` (o no es una versión entera). 400. */
  UI_RULE_IF_MATCH_REQUIRED = 'UI_RULE_IF_MATCH_REQUIRED',

  /** La vigencia no es coherente (`validTo` no es posterior a `validFrom`). 422. */
  UI_RULE_INVALID_VALIDITY = 'UI_RULE_INVALID_VALIDITY',

  /** El `PATCH` no trae ningún campo editable. 422. */
  UI_RULE_EMPTY_UPDATE = 'UI_RULE_EMPTY_UPDATE',

  /** Ya existe un elemento con esa clave (alta manual). 409. */
  UI_ELEMENT_KEY_EXISTS = 'UI_ELEMENT_KEY_EXISTS',

  /** El `parentKey` declarado no existe en el catálogo ni en el lote. 422. */
  UI_ELEMENT_PARENT_NOT_FOUND = 'UI_ELEMENT_PARENT_NOT_FOUND',

  /** La jerarquía declarada tiene un ciclo. 422. */
  UI_ELEMENT_HIERARCHY_CYCLE = 'UI_ELEMENT_HIERARCHY_CYCLE',

  /** El lote de `sync` repite una clave con contenido distinto o excede el tope. 422. */
  UI_ELEMENT_SYNC_INVALID = 'UI_ELEMENT_SYNC_INVALID',

  /** El usuario o el rol pedido en `preview` no existe o no está al alcance del actor. 404. */
  UI_PREVIEW_SUBJECT_NOT_FOUND = 'UI_PREVIEW_SUBJECT_NOT_FOUND',

  /** `preview` exige exactamente uno de `userId` o `roleCode`. 400. */
  UI_PREVIEW_SUBJECT_REQUIRED = 'UI_PREVIEW_SUBJECT_REQUIRED',

  /**
   * Un HIDE sobre una pantalla de gobierno de la visibilidad (`UI_PROTECTED_KEY_PREFIXES`) con un
   * sujeto que alcanzaría a administradores (ALL, SUPERADMIN/SECURITY_ADMIN o un usuario admin). 422.
   */
  UI_RULE_PROTECTED_ELEMENT = 'UI_RULE_PROTECTED_ELEMENT',
}
