import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ISiatEmitterPort,
  SiatEmitResult,
  SiatIssuerProfile,
  SiatSessionCredentials,
} from '../../application/ports/siat-emitter.port';

/**
 * Adaptador SIAT REAL — conecta con los endpoints productivos del SIN de Bolivia.
 *
 * Requiere en el entorno:
 *   SIAT_BASE_URL     — URL base del SIAT (ej. https://siat.impuestos.gob.bo)
 *   SIAT_CONTRACT_ID  — UUID del IntegrationContract de M31 con las credenciales OAuth2/mTLS
 *
 * Estado: skeleton funcional. Los métodos lanzan NotImplementedException
 * hasta que se conecten las credenciales reales del SIN vía integration_contracts (M31).
 * Ver issue en mantra-core-health-api: "Conectar SiatRealAdapter con SIN Bolivia productivo".
 */
@Injectable()
export class SiatRealAdapter implements ISiatEmitterPort {
  readonly siatMode = 'real' as const;

  constructor(private readonly config: ConfigService) {}

  async resolveIssuer(practiceId: string, _legalName: string): Promise<SiatIssuerProfile> {
    // TODO: leer el NIT real del emisor desde `integration_contracts.auth_profiles.credentials_json`
    // o desde la configuración de la práctica en la BD. El contrato de M31 con SIAT_CONTRACT_ID
    // debe tener un auth_profile con el NIT, código de sucursal y punto de venta reales.
    throw new NotImplementedException(
      `SiatRealAdapter.resolveIssuer: práctica ${practiceId} — ` +
        'configurar NIT real en integration_contract antes de habilitar modo real (SIAT_MODE=real)',
    );
  }

  async resolveCredentials(
    issuerNit: string,
    branchCode: number,
    pointOfSaleCode: number,
    _at: Date,
  ): Promise<SiatSessionCredentials> {
    const baseUrl = this.config.get<string>('SIAT_BASE_URL');
    if (!baseUrl) {
      throw new NotImplementedException(
        'SiatRealAdapter.resolveCredentials: SIAT_BASE_URL no configurado',
      );
    }
    // TODO: llamar al SIN para obtener CUIS y CUFD reales usando el token OAuth2 de M31:
    //   POST {baseUrl}/ServicioFacturacionCompras/obtenerCuis
    //   POST {baseUrl}/ServicioFacturacionCompras/obtenerCufd
    // El token OAuth2 se obtiene del IntegrationAuthProfile configurado en SIAT_CONTRACT_ID.
    throw new NotImplementedException(
      `SiatRealAdapter.resolveCredentials: NIT ${issuerNit} suc ${branchCode} PV ${pointOfSaleCode} — ` +
        'integración SIN productiva pendiente',
    );
  }

  async submitInvoice(
    _xmlCompressedBase64: string,
    _cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult> {
    const baseUrl = this.config.get<string>('SIAT_BASE_URL');
    if (!baseUrl) {
      throw new NotImplementedException(
        'SiatRealAdapter.submitInvoice: SIAT_BASE_URL no configurado',
      );
    }
    // TODO: llamar al endpoint de recepción del SIN:
    //   POST {baseUrl}/ServicioFacturacionCompras/recepcionFactura
    //   Body JSON: { codigoAmbiente, codigoPuntoVenta, codigoSistema, codigoSucursal,
    //                nit, codigoDocumentoSector, codigoEmision, codigoModalidad,
    //                cufd, archivo (base64 gzip), hashArchivo, tipoFacturaDocumento }
    // La respuesta incluye transaccion, codigoEstado, codigoRecepcion, mensajesList.
    throw new NotImplementedException(
      `SiatRealAdapter.submitInvoice: emisor NIT ${issuerNit} — ` +
        'integración SIN productiva pendiente',
    );
  }

  async annulInvoice(
    cuf: string,
    codigoMotivo: number,
    _cufd: string,
    issuerNit: string,
  ): Promise<SiatEmitResult> {
    const baseUrl = this.config.get<string>('SIAT_BASE_URL');
    if (!baseUrl) {
      throw new NotImplementedException(
        'SiatRealAdapter.annulInvoice: SIAT_BASE_URL no configurado',
      );
    }
    // TODO: llamar al endpoint de anulación del SIN:
    //   POST {baseUrl}/ServicioFacturacionCompras/anulacionFactura
    //   Body JSON: { codigoAmbiente, codigoSucursal, codigoPuntoVenta, codigoSistema,
    //                cufd, cuf, codigoMotivo }
    throw new NotImplementedException(
      `SiatRealAdapter.annulInvoice: CUF ${cuf} motivo ${codigoMotivo} NIT ${issuerNit} — ` +
        'integración SIN productiva pendiente',
    );
  }
}
