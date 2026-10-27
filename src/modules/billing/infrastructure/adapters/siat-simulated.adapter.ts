import { Injectable } from '@nestjs/common';
import {
  simulatedIssuer,
  simulatedCredentials,
  buildSimulatedInvoice,
  siatResponse,
} from '../../siat-simulated/siat-simulated.engine';
import { SIAT_STATUS } from '../../siat-simulated/siat-codes';
import type {
  ISiatEmitterPort,
  SiatAnnulInput,
  SiatCommunicationStatus,
  SiatCredentials,
  SiatInvoiceInput,
  SiatInvoiceResult,
  SiatIssuer,
} from '../../application/ports/siat-emitter.port';
import type { IssuerInput } from '../../siat-simulated/siat-simulated.engine';

/**
 * Adaptador SIAT simulado. Delega en el motor puro de `siat-simulated/`; no
 * hace llamadas de red. Todo resultado lleva `simulated: true` y los valores
 * sintéticos `SIM…` declarados en el motor.
 */
@Injectable()
export class SiatSimulatedAdapter implements ISiatEmitterPort {
  async obtenerIssuer(input: IssuerInput, _ahora: Date): Promise<SiatIssuer> {
    return simulatedIssuer(input);
  }

  async obtenerCredenciales(
    emisor: SiatIssuer,
    ahora: Date,
  ): Promise<SiatCredentials> {
    return simulatedCredentials(emisor, ahora);
  }

  async recibirFactura(input: SiatInvoiceInput): Promise<SiatInvoiceResult> {
    return buildSimulatedInvoice(input);
  }

  async anularFactura(input: SiatAnnulInput): Promise<SiatInvoiceResult['response']> {
    return siatResponse(
      SIAT_STATUS.ANULACION_CONFIRMADA,
      [],
      `anulacion|${input.cuf}|${input.codigoMotivo}`,
    );
  }

  async verificarComunicacion(
    _emisor: SiatIssuer,
  ): Promise<SiatCommunicationStatus> {
    return {
      online: true,
      timestamp: new Date().toISOString(),
      simulated: true,
    };
  }
}
