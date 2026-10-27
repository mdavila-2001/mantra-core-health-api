import { Injectable } from '@nestjs/common';
import {
  simulatedIssuer,
  simulatedCredentials,
  siatResponse,
} from '../../siat-simulated/siat-simulated.engine';
import {
  SIAT_STATUS,
  SIAT_STATUS_DESCRIPTION,
} from '../../siat-simulated/siat-codes';
import type {
  ISiatEmitterPort,
  SiatEmitResult,
  SiatIssuerProfile,
  SiatSessionCredentials,
} from '../../application/ports/siat-emitter.port';

/** Implementación simulada del puerto SIAT. Envuelve el motor sintético existente. */
@Injectable()
export class SiatSimulatedAdapter implements ISiatEmitterPort {
  readonly siatMode = 'simulated' as const;

  async resolveIssuer(practiceId: string, legalName: string): Promise<SiatIssuerProfile> {
    const view = simulatedIssuer({ practiceId, legalName });
    return {
      nit: view.nit,
      legalName: view.legalName,
      municipality: view.municipality,
      address: view.address,
      phone: view.phone,
      branchCode: view.branchCode,
      pointOfSaleCode: view.pointOfSaleCode,
      documentSector: view.documentSector,
    };
  }

  async resolveCredentials(
    issuerNit: string,
    branchCode: number,
    pointOfSaleCode: number,
    at: Date,
  ): Promise<SiatSessionCredentials> {
    const mockView = {
      id: issuerNit,
      kind: 'PRACTICE' as const,
      nit: issuerNit,
      legalName: '',
      municipality: '',
      address: '',
      phone: null,
      branchCode,
      pointOfSaleCode,
      documentSector: 1,
      simulated: true as const,
    };
    const creds = simulatedCredentials(mockView, at);
    return {
      cuis: creds.cuis,
      cufd: creds.cufd,
      codigoControl: creds.codigoControl,
    };
  }

  async submitInvoice(
    _xmlCompressedBase64: string,
    _cufd: string,
    _issuerNit: string,
  ): Promise<SiatEmitResult> {
    const status = SIAT_STATUS.RECEPCION_VALIDADA;
    const raw = siatResponse(status, [], `submit|${Date.now()}`);
    return {
      transaccion: raw.transaccion,
      codigoEstado: raw.codigoEstado,
      codigoDescripcion:
        SIAT_STATUS_DESCRIPTION[status as keyof typeof SIAT_STATUS_DESCRIPTION] ??
        raw.codigoDescripcion,
      codigoRecepcion: raw.codigoRecepcion,
      mensajesList: raw.mensajesList.map((m) => ({
        codigo: m.codigo,
        descripcion: m.descripcion,
        advertencia: m.advertencia,
      })),
      siatMode: 'simulated',
    };
  }

  async annulInvoice(
    _cuf: string,
    _codigoMotivo: number,
    _cufd: string,
    _issuerNit: string,
  ): Promise<SiatEmitResult> {
    const status = SIAT_STATUS.ANULACION_CONFIRMADA;
    const raw = siatResponse(status, []);
    return {
      transaccion: raw.transaccion,
      codigoEstado: raw.codigoEstado,
      codigoDescripcion:
        SIAT_STATUS_DESCRIPTION[status as keyof typeof SIAT_STATUS_DESCRIPTION] ??
        raw.codigoDescripcion,
      codigoRecepcion: null,
      mensajesList: [],
      siatMode: 'simulated',
    };
  }
}
