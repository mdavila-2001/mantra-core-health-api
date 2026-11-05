import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import type {
  ISiatEmitterPort,
  SiatEmitResult,
  SiatIssuerProfile,
  SiatSessionCredentials,
} from '../../application/ports/siat-emitter.port';
import { SIAT_STATUS_DESCRIPTION } from '../../siat-simulated/siat-codes';

/**
 * Configuración cargada desde variables de entorno para el adaptador real del SIAT.
 *
 * NIT y datos del emisor viven en el entorno porque las entidades `Practice`
 * no almacenan campos tributarios bolivianos. Cuando se modele el NIT a nivel de
 * consultorio en la base, estas variables de entorno deben reemplazarse por una
 * consulta a ese modelo. Ver issue que documenta esta deuda.
 *
 * Rutas de los servicios web tomadas del catálogo oficial:
 * https://siatinfo.impuestos.gob.bo/index.php/facturacion-en-linea/implementacion-servicios-facturacion
 * Verificar contra la versión del SIN en uso antes de poner en producción.
 */
export interface SiatRealConfig {
  baseUrl: string;
  codigoSistema: string;
  codigoAmbiente: number;
  timeoutMs: number;
  nit: string;
  branchCode: number;
  pointOfSaleCode: number;
  documentSector: number;
  municipality: string;
  address: string;
  phone: string | null;
}

export function loadSiatRealConfig(): SiatRealConfig {
  return {
    baseUrl: (process.env.SIAT_BASE_URL ?? '').replace(/\/+$/, ''),
    codigoSistema: process.env.SIAT_CODIGO_SISTEMA ?? '',
    codigoAmbiente: Number(process.env.SIAT_CODIGO_AMBIENTE ?? '2'),
    timeoutMs: Number(process.env.SIAT_TIMEOUT_MS ?? '15000'),
    nit: process.env.SIAT_NIT ?? '',
    branchCode: Number(process.env.SIAT_BRANCH_CODE ?? '0'),
    pointOfSaleCode: Number(process.env.SIAT_POINT_OF_SALE_CODE ?? '0'),
    documentSector: Number(process.env.SIAT_DOCUMENT_SECTOR ?? '1'),
    municipality: process.env.SIAT_MUNICIPALITY ?? '',
    address: process.env.SIAT_ADDRESS ?? '',
    phone: process.env.SIAT_PHONE ?? null,
  };
}

const SIAT_PATHS = {
  cuis: '/ServicioWebCodigoUnicoInicioSistema',
  cufd: '/ServicioWebCodigoUnicoFacturaDiaria',
  recepcion: '/ServicioWebRecepcionFactura',
  anulacion: '/ServicioWebAnulacionFactura',
} as const;

/** Implementación real del puerto SIAT. Llama al SIN de Bolivia (Computarizada en Línea, modalidad 2). */
@Injectable()
export class SiatRealAdapter implements ISiatEmitterPort {
  readonly siatMode = 'real' as const;

  private readonly http: AxiosInstance;
  private readonly cfg: SiatRealConfig;

  constructor() {
    this.cfg = loadSiatRealConfig();
    this.http = axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: this.cfg.timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Devuelve el perfil del emisor usando los env vars del entorno.
   * `practiceId` se recibe por contrato pero no se usa aún: el NIT y los datos
   * del establecimiento se leen de las variables de entorno hasta que el modelo
   * incorpore esos campos a la entidad `Practice`.
   */
  async resolveIssuer(
    _practiceId: string,
    legalName: string,
  ): Promise<SiatIssuerProfile> {
    return {
      nit: this.cfg.nit,
      legalName,
      municipality: this.cfg.municipality,
      address: this.cfg.address,
      phone: this.cfg.phone,
      branchCode: this.cfg.branchCode,
      pointOfSaleCode: this.cfg.pointOfSaleCode,
      documentSector: this.cfg.documentSector,
    };
  }

  /** Obtiene CUIS y luego CUFD del SIN para el emisor e instante dados. */
  async resolveCredentials(
    issuerNit: string,
    branchCode: number,
    pointOfSaleCode: number,
    _at: Date,
  ): Promise<SiatSessionCredentials> {
    const base = {
      codigoAmbiente: this.cfg.codigoAmbiente,
      codigoSistema: this.cfg.codigoSistema,
      codigoSucursal: branchCode,
      codigoPuntoVenta: pointOfSaleCode,
      nit: Number(issuerNit),
    };

    const cuisRes = await this.http.post<{
      cuis: string;
      codigoEstado: number;
      codigoDescripcion: string;
    }>(SIAT_PATHS.cuis, base);

    const cuis = cuisRes.data.cuis;

    const cufdRes = await this.http.post<{
      codigo: string;
      codigoControl: string;
      codigoEstado: number;
      codigoDescripcion: string;
    }>(SIAT_PATHS.cufd, { ...base, cuis });

    return {
      cuis,
      cufd: cufdRes.data.codigo,
      codigoControl: cufdRes.data.codigoControl,
    };
  }

  /** Envía el XML comprimido en base64 al SIN y devuelve la respuesta de recepción. */
  async submitInvoice(
    xmlCompressedBase64: string,
    cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult> {
    const res = await this.http.post<RawSiatResponse>(SIAT_PATHS.recepcion, {
      codigoAmbiente: this.cfg.codigoAmbiente,
      codigoSistema: this.cfg.codigoSistema,
      nit: Number(issuerNit),
      codigoEmision: 1,
      codigoModalidad: 2,
      tipoFacturaDocumento: 1,
      codigoDocumentoFiscal: this.cfg.documentSector,
      codigoSucursal: this.cfg.branchCode,
      codigoPuntoVenta: this.cfg.pointOfSaleCode,
      cufd,
      archivo: xmlCompressedBase64,
    });
    return this.toEmitResult(res.data);
  }

  /** Anula una factura ya recibida por el SIN. */
  async annulInvoice(
    cuf: string,
    codigoMotivo: number,
    cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult> {
    const res = await this.http.post<RawSiatResponse>(SIAT_PATHS.anulacion, {
      codigoAmbiente: this.cfg.codigoAmbiente,
      codigoSistema: this.cfg.codigoSistema,
      nit: Number(issuerNit),
      cufd,
      codigoMotivo,
      cuf,
      codigoSucursal: this.cfg.branchCode,
      codigoPuntoVenta: this.cfg.pointOfSaleCode,
    });
    return this.toEmitResult(res.data);
  }

  private toEmitResult(raw: RawSiatResponse): SiatEmitResult {
    return {
      transaccion: raw.transaccion ?? false,
      codigoEstado: raw.codigoEstado,
      codigoDescripcion:
        SIAT_STATUS_DESCRIPTION[
          raw.codigoEstado as keyof typeof SIAT_STATUS_DESCRIPTION
        ] ?? raw.codigoDescripcion,
      codigoRecepcion: raw.codigoRecepcion ?? null,
      mensajesList: (raw.mensajesList ?? []).map((m) => ({
        codigo: m.codigo,
        descripcion: m.descripcion,
        advertencia: m.advertencia,
      })),
      siatMode: 'real',
    };
  }
}

interface RawSiatResponse {
  transaccion?: boolean;
  codigoEstado: number;
  codigoDescripcion: string;
  codigoRecepcion?: string | null;
  mensajesList?: Array<{
    codigo: number;
    descripcion: string;
    advertencia: boolean;
  }>;
}
