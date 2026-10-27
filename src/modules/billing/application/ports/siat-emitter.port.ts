/* ============================================================================
    Puerto SIAT — contrato entre la capa de aplicación y los adaptadores de
    emisión (simulado y real). Los tipos de entrada/salida derivan directamente
    del motor simulado para que ambos adaptadores compartan la misma superficie.
    ========================================================================== */

import type {
  BuildInvoiceInput,
  BuiltInvoice,
  IssuerInput,
  SimulatedCredentials,
  SimulatedIssuerView,
  SiatResponse,
} from '../../siat-simulated/siat-simulated.engine';

// ---- tipos de puerto -------------------------------------------------------

export interface SiatIssuer extends SimulatedIssuerView {}

export interface SiatCredentials extends SimulatedCredentials {}

export interface SiatInvoiceInput extends BuildInvoiceInput {}

export interface SiatInvoiceResult extends BuiltInvoice {}

export interface SiatCommunicationStatus {
  online: boolean;
  timestamp: string;
  simulated: boolean;
}

export interface SiatAnnulInput {
  emisor: SiatIssuer;
  credenciales: SiatCredentials;
  cuf: string;
  codigoMotivo: number;
  fechaEmision: string;
}

// ---- puerto ----------------------------------------------------------------

export interface ISiatEmitterPort {
  /**
   * Obtiene (o renueva) las credenciales del emisor para la práctica dada.
   * En el adaptador real llama a `obtenerCUIS`; en el simulado las deriva
   * de forma determinista del `practiceId`.
   */
  obtenerIssuer(input: IssuerInput, ahora: Date): Promise<SiatIssuer>;

  /**
   * Obtiene las credenciales diarias (CUFD + CUIS) vigentes para el emisor.
   * En el adaptador real llama a `obtenerCUFD`; en el simulado las deriva
   * del día de Bolivia.
   */
  obtenerCredenciales(
    emisor: SiatIssuer,
    ahora: Date,
  ): Promise<SiatCredentials>;

  /**
   * Envía la factura al SIAT y devuelve la respuesta oficial.
   * En el adaptador real serializa, comprime, firma (modalidad 1) y llama
   * a `recepcionFactura`; en el simulado la construye y la valida localmente.
   */
  recibirFactura(input: SiatInvoiceInput): Promise<SiatInvoiceResult>;

  /**
   * Solicita la anulación de una factura emitida.
   * En el adaptador real llama a `anulacionFactura`; en el simulado construye
   * la respuesta determinista correspondiente al motivo.
   */
  anularFactura(input: SiatAnnulInput): Promise<SiatResponse>;

  /**
   * Verifica que el canal con el SIN esté activo.
   * En el adaptador real llama a `verificarComunicacion`; en el simulado
   * siempre devuelve `online: true`.
   */
  verificarComunicacion(emisor: SiatIssuer): Promise<SiatCommunicationStatus>;
}

export const SIAT_EMITTER_PORT = Symbol('SIAT_EMITTER_PORT');
