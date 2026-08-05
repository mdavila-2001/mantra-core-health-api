/**
 * Cuerpo opcional de `POST /integrations/messages/{id}:dispatch` (UC-12-06).
 *
 * El despacho es real: el worker hace un POST firmado contra el endpoint del
 * proveedor y registra el status/latencia reales. Ya no se aceptan resultados
 * simulados (`simulateFailure`/`httpStatus`/`errorText` fueron retirados del
 * contrato); el cuerpo se mantiene por compatibilidad y extensibilidad futura.
 */
export class DispatchMessageDto {}
