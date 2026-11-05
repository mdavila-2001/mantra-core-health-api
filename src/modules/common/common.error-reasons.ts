/**
 * Catálogo de sub-códigos de negocio estables del módulo `common` (archivos).
 * Se usan como tercer argumento (`reason`) de las excepciones de dominio, para
 * que un cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum CommonErrorReason {
  /**
   * El actor puede ver el archivo (rol de revisión) pero no modificarlo: sólo
   * su propietario, o la plataforma, versiona, deriva, vincula o borra.
   */
  FILE_MUTATION_NOT_ALLOWED = 'FILE_MUTATION_NOT_ALLOWED',
  /**
   * La ruta genérica de vínculos no autoriza al actor a colgar un archivo de
   * ese tipo de dueño o de ese dueño concreto: los recursos clínicos se
   * vinculan por la ruta clínica del recurso, que sí evalúa la relación
   * asistencial con el paciente.
   */
  FILE_LINK_OWNER_NOT_ALLOWED = 'FILE_LINK_OWNER_NOT_ALLOWED',
}
