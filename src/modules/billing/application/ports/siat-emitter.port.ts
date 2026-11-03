/** NIT, sucursal, punto de venta y sector documental de un emisor SIAT. */
export interface SiatIssuerProfile {
  readonly nit: string;
  readonly legalName: string;
  readonly municipality: string;
  readonly address: string;
  readonly phone: string | null;
  readonly branchCode: number;
  readonly pointOfSaleCode: number;
  readonly documentSector: number;
}

/** CUIS, CUFD y código de control vigentes en un instante dado. */
export interface SiatSessionCredentials {
  readonly cuis: string;
  readonly cufd: string;
  readonly codigoControl: string;
}

export interface SiatEmitMessage {
  readonly codigo: number;
  readonly descripcion: string;
  readonly advertencia: boolean;
}

export interface SiatEmitResult {
  readonly transaccion: boolean;
  readonly codigoEstado: number;
  readonly codigoDescripcion: string;
  readonly codigoRecepcion: string | null;
  readonly mensajesList: readonly SiatEmitMessage[];
  /** 'simulated' en pruebas, 'real' al conectar el SIN productivo. */
  readonly siatMode: 'simulated' | 'real';
}

/**
 * Puerto SIAT: abstrae la comunicación con el SIN boliviano (real o simulada).
 *
 * La implementación simulada (`SiatSimulatedAdapter`) envuelve el motor
 * sintético de `siat-simulated.engine`. La real (`SiatRealAdapter`) usa
 * `integration_contracts` (M31) para OAuth2/mTLS y llama a los endpoints
 * productivos del SIN.
 */
export interface ISiatEmitterPort {
  readonly siatMode: 'simulated' | 'real';

  /** Perfil del emisor: NIT real o sintético según el modo. */
  resolveIssuer(
    practiceId: string,
    legalName: string,
  ): Promise<SiatIssuerProfile>;

  /** CUIS y CUFD vigentes al instante indicado. */
  resolveCredentials(
    issuerNit: string,
    branchCode: number,
    pointOfSaleCode: number,
    at: Date,
  ): Promise<SiatSessionCredentials>;

  /** Envía el XML comprimido en base64 al SIN y devuelve la respuesta de recepción. */
  submitInvoice(
    xmlCompressedBase64: string,
    cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult>;

  /** Anula una factura ya recibida por el SIN (o el simulador). */
  annulInvoice(
    cuf: string,
    codigoMotivo: number,
    cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult>;
}

export const SIAT_EMITTER_PORT = Symbol('BILLING_SIAT_EMITTER_PORT');
