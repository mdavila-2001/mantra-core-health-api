/* ============================================================================
    Motor de la emisión SIAT SIMULADA (rutas `/billing/simulated/*`).

    Funciones PURAS y deterministas: dadas las mismas entradas, producen el
    mismo CUIS, CUFD, código de control, CUF, XML y hash. Nada sale a la red y
    nada de lo que produce es un documento tributario: el NIT, el CUIS, el CUFD
    y el código de control son SINTÉTICOS (`SIM…`), y toda respuesta declara
    `simulated: true`.

    El algoritmo del CUF (Módulo 11 + Base 16) es el oficial; ver `cuf.ts`.
    ========================================================================== */

import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { fechaHoraParaCuf, generarCuf } from './cuf';
import { buildInvoiceXml, type RowXml } from './invoice-xml';
import { PURCHASE_SALE_SCHEMA } from './siat-schema';
import {
  SIAT_MESSAGE,
  SIAT_MESSAGE_DESCRIPTION,
  SIAT_STATUS,
  isWarning,
} from './siat-codes';
import { SIMULATED_CATALOGS } from './simulated-catalogs';

export type SimulatedInvoiceStatus =
  'VALIDATED' | 'OBSERVED' | 'REJECTED' | 'ANNULLED';

/** Mensajes que la directiva de simulación puede forzar (como en el simulador del front). */
export const FORCEABLE_MESSAGES: readonly number[] = [
  SIAT_MESSAGE.MONTO_TOTAL_ERRONEO,
  SIAT_MESSAGE.SUBTOTAL_ERRONEO,
  SIAT_MESSAGE.MONTO_TOTAL_SUJETO_IVA_ERRONEO,
  SIAT_MESSAGE.CUF_INVALIDO,
  SIAT_MESSAGE.CUFD_NO_VIGENTE,
  SIAT_MESSAGE.ADVERTENCIA_CORRELATIVIDAD,
  SIAT_MESSAGE.ADVERTENCIA_NIT_DEL_CLIENTE_NO_VALIDO,
];

export interface SiatMessage {
  codigo: number;
  descripcion: string;
  advertencia: boolean;
  forzadoPorSimulacion?: true;
}

export interface SiatResponse {
  transaccion: boolean;
  codigoEstado: number;
  codigoDescripcion: string;
  codigoRecepcion: string | null;
  mensajesList: SiatMessage[];
  simulated: true;
}

export interface InvoiceEvent {
  kind: string;
  at: string;
  siatStatusCode: number | null;
  detail: string;
}

export interface IssuerInput {
  /** `practice.practices.id`. */
  practiceId: string;
  legalName: string;
}

export interface SimulatedIssuerView {
  id: string;
  kind: 'PRACTICE';
  nit: string;
  legalName: string;
  municipality: string;
  address: string;
  phone: string | null;
  branchCode: number;
  pointOfSaleCode: number;
  documentSector: number;
  simulated: true;
}

const sha256 = (texto: string): string =>
  createHash('sha256').update(texto).digest('hex');

/** Hex en mayúsculas de `largo` caracteres, derivado de la semilla. */
export function hexSintetico(semilla: string, largo: number): string {
  let hex = '';
  for (let i = 0; hex.length < largo; i++) hex += sha256(`${semilla}|${i}`);
  return hex.slice(0, largo).toUpperCase();
}

/** Hora de Bolivia (UTC-4) sin zona, `yyyy-MM-ddTHH:mm:ss.SSS`: como va en el XML. */
export function boliviaTime(fecha: Date): string {
  return new Date(fecha.getTime() - 4 * 3_600_000).toISOString().slice(0, 23);
}

/** El emisor ficticio de una práctica. El NIT empieza en 99 y NO es de nadie. */
export function simulatedIssuer(entrada: IssuerInput): SimulatedIssuerView {
  const digitos = BigInt(
    '0x' + sha256(`nit|${entrada.practiceId}`).slice(0, 12),
  )
    .toString()
    .padStart(10, '0')
    .slice(-10);
  return {
    id: entrada.practiceId,
    kind: 'PRACTICE',
    nit: `99${digitos}`,
    legalName: `${entrada.legalName.toUpperCase()} (SIMULADO)`.slice(0, 200),
    municipality: 'Santa Cruz',
    address: 'AV. FICTICIA 100, ZONA DEMO (SIMULADO)',
    phone: null,
    branchCode: 0,
    pointOfSaleCode: 0,
    documentSector: 1,
    simulated: true,
  };
}

export interface SimulatedCredentials {
  issuerId: string;
  cuis: string;
  cuisValidUntil: string;
  cufd: string;
  cufdValidUntil: string;
  codigoControl: string;
}

/**
 * CUIS (365 días) y CUFD (24 h) deterministas. El CUIS es estable por emisor;
 * el CUFD cambia por día de Bolivia, como el real.
 */
export function simulatedCredentials(
  emisor: SimulatedIssuerView,
  ahora: Date,
): SimulatedCredentials {
  const dia = boliviaTime(ahora).slice(0, 10);
  const clave = `${emisor.nit}|${emisor.branchCode}|${emisor.pointOfSaleCode}`;
  const finDelDia = new Date(`${dia}T00:00:00.000Z`);
  finDelDia.setUTCDate(finDelDia.getUTCDate() + 1);
  return {
    issuerId: emisor.id,
    cuis: hexSintetico(`cuis|${clave}`, 8),
    cuisValidUntil: new Date(ahora.getTime() + 365 * 86_400_000).toISOString(),
    cufd: `SIMCUFD${hexSintetico(`cufd|${clave}|${dia}`, 36)}`,
    cufdValidUntil: new Date(finDelDia.getTime() + 4 * 3_600_000).toISOString(),
    codigoControl: hexSintetico(`cufd|${clave}|${dia}|control`, 15),
  };
}

export function mensaje(codigo: number, forzado = false): SiatMessage {
  const descripcion =
    (SIAT_MESSAGE_DESCRIPTION as Record<number, string>)[codigo] ??
    `Mensaje ${codigo}`;
  return {
    codigo,
    descripcion,
    advertencia: isWarning(codigo),
    ...(forzado ? { forzadoPorSimulacion: true as const } : {}),
  };
}

const ESTADO_DESCRIPCION: Record<number, string> = {
  902: 'Recepción Rechazada',
  904: 'Recepción Observada',
  905: 'Anulación Confirmada',
  906: 'Anulación Rechazada',
  907: 'Reversión De Anulación Confirmada',
  908: 'Recepción Validada',
  909: 'Reversión De Anulación Rechazada',
};

export function siatResponse(
  codigoEstado: number,
  mensajes: SiatMessage[] = [],
  semillaRecepcion?: string,
): SiatResponse {
  const aceptada =
    codigoEstado !== SIAT_STATUS.RECEPCION_RECHAZADA &&
    codigoEstado !== SIAT_STATUS.ANULACION_RECHAZADA &&
    codigoEstado !== SIAT_STATUS.REVERSION_ANULACION_RECHAZADA;
  return {
    transaccion: aceptada,
    codigoEstado,
    codigoDescripcion: ESTADO_DESCRIPCION[codigoEstado] ?? String(codigoEstado),
    codigoRecepcion:
      aceptada && semillaRecepcion !== undefined
        ? `SIMREC${hexSintetico(`rec|${semillaRecepcion}`, 16)}`
        : null,
    mensajesList: mensajes,
    simulated: true,
  };
}

export function statusOfResponse(codigoEstado: number): SimulatedInvoiceStatus {
  if (codigoEstado === SIAT_STATUS.RECEPCION_VALIDADA) return 'VALIDATED';
  if (codigoEstado === SIAT_STATUS.RECEPCION_OBSERVADA) return 'OBSERVED';
  return 'REJECTED';
}

export function eventOfResponse(
  kind: string,
  respuesta: SiatResponse,
  at: string,
): InvoiceEvent {
  const mensajes = respuesta.mensajesList
    .map((m) => `${m.codigo}${m.forzadoPorSimulacion ? ' (forzado)' : ''}`)
    .join(', ');
  return {
    kind,
    at,
    siatStatusCode: respuesta.codigoEstado,
    detail: `${respuesta.codigoEstado} ${respuesta.codigoDescripcion}${mensajes === '' ? '' : ` · ${mensajes}`} (SIMULADO)`,
  };
}

// ---- dinero en centavos (texto decimal de punta a punta) --------------------

export function cents(valor: string | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') return 0;
  const [entero, decimales = ''] = valor.split('.');
  return Number(entero) * 100 + Number(decimales.padEnd(2, '0').slice(0, 2));
}

export function importe(centavos: number): string {
  const signo = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos);
  return `${signo}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** cantidad × precio − descuento, en centavos, redondeado. */
export function lineSubtotal(
  cantidad: string,
  precioUnitario: string,
  descuento: string | null,
): string {
  return importe(
    Math.round(Number(cantidad) * cents(precioUnitario)) - cents(descuento),
  );
}

// ---- la factura --------------------------------------------------------------

export interface BuyerData {
  name: string;
  documentTypeCode: number;
  documentNumber: string;
  complement?: string | null;
  email?: string | null;
}

export interface ChargeLineData {
  productCode: string;
  description: string;
  quantity: string;
  unitOfMeasure: number;
  unitPrice: string;
  discount: string | null;
  subtotal: string;
}

export interface BuildInvoiceInput {
  emisor: SimulatedIssuerView;
  credenciales: SimulatedCredentials;
  numeroFactura: number;
  fechaEmision: string;
  patientProfileId: string;
  paymentMethodCode: number;
  lines: ChargeLineData[];
  buyer: BuyerData;
  additionalDiscount: string | null;
  usuario: string;
  /** Mensaje del catálogo oficial que se quiere forzar (rama de la demo). */
  forceMessageCode?: number;
}

export interface BuiltInvoice {
  cuf: string;
  cabecera: RowXml;
  detalle: RowXml[];
  xml: string;
  hashArchivo: string;
  compressedBytes: number;
  response: SiatResponse;
  status: SimulatedInvoiceStatus;
  total: string;
}

/** Arma la factura SIMULADA completa y la «recibe» el SIAT simulado. */
export function buildSimulatedInvoice(
  entrada: BuildInvoiceInput,
): BuiltInvoice {
  const { emisor, credenciales } = entrada;
  const suma = entrada.lines.reduce((s, l) => s + cents(l.subtotal), 0);
  const montoTotal = importe(suma - cents(entrada.additionalDiscount));
  const cuf = generarCuf(
    {
      nit: emisor.nit,
      fechaHora: fechaHoraParaCuf(entrada.fechaEmision),
      sucursal: emisor.branchCode,
      modalidad: 2,
      tipoEmision: 1,
      tipoFactura: 1,
      tipoDocumentoSector: emisor.documentSector,
      numeroFactura: entrada.numeroFactura,
      puntoVenta: emisor.pointOfSaleCode,
    },
    credenciales.codigoControl,
  );
  const leyendas = SIMULATED_CATALOGS.leyendas;
  const complemento =
    entrada.buyer.complement === undefined || entrada.buyer.complement === ''
      ? null
      : entrada.buyer.complement;
  const cabecera: RowXml = {
    nitEmisor: emisor.nit,
    razonSocialEmisor: emisor.legalName,
    municipio: emisor.municipality,
    telefono: emisor.phone,
    numeroFactura: entrada.numeroFactura,
    cuf,
    cufd: credenciales.cufd,
    codigoSucursal: emisor.branchCode,
    direccion: emisor.address,
    codigoPuntoVenta: emisor.pointOfSaleCode,
    fechaEmision: entrada.fechaEmision,
    nombreRazonSocial: entrada.buyer.name.trim(),
    codigoTipoDocumentoIdentidad: Number(entrada.buyer.documentTypeCode),
    numeroDocumento: entrada.buyer.documentNumber.trim(),
    complemento,
    codigoCliente: entrada.patientProfileId,
    codigoMetodoPago: entrada.paymentMethodCode,
    numeroTarjeta: null,
    montoTotal,
    montoTotalSujetoIva: montoTotal,
    codigoMoneda: 1,
    tipoCambio: '1',
    montoTotalMoneda: montoTotal,
    montoGiftCard: null,
    descuentoAdicional: entrada.additionalDiscount,
    codigoExcepcion: null,
    cafc: null,
    leyenda:
      leyendas[entrada.numeroFactura % leyendas.length].descripcionLeyenda,
    usuario: entrada.usuario.slice(0, 100) || 'operador-simulado',
    codigoDocumentoSector: emisor.documentSector,
  };
  const detalle: RowXml[] = entrada.lines.map((l) => ({
    actividadEconomica: 'SIM0001',
    codigoProductoSin: 99_100_001,
    codigoProducto: l.productCode.slice(0, 50),
    descripcion: l.description.slice(0, 500),
    cantidad: l.quantity,
    unidadMedida: l.unitOfMeasure,
    precioUnitario: l.unitPrice,
    montoDescuento: l.discount,
    subTotal: l.subtotal,
    numeroSerie: null,
    numeroImei: null,
  }));
  const xml = buildInvoiceXml(PURCHASE_SALE_SCHEMA, { cabecera, detalle });
  const gz = gzipSync(Buffer.from(xml, 'utf8'));
  const hashArchivo = createHash('sha256').update(gz).digest('hex');

  const forzado = entrada.forceMessageCode;
  let response: SiatResponse;
  if (forzado !== undefined && FORCEABLE_MESSAGES.includes(forzado)) {
    const m = mensaje(forzado, true);
    response = siatResponse(
      m.advertencia
        ? SIAT_STATUS.RECEPCION_OBSERVADA
        : SIAT_STATUS.RECEPCION_RECHAZADA,
      [m],
      cuf,
    );
  } else {
    response = siatResponse(SIAT_STATUS.RECEPCION_VALIDADA, [], cuf);
  }
  return {
    cuf,
    cabecera,
    detalle,
    xml,
    hashArchivo,
    compressedBytes: gz.length,
    response,
    status: statusOfResponse(response.codigoEstado),
    total: montoTotal,
  };
}
