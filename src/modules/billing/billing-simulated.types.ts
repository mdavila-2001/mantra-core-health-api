/* Contrato de `/billing/simulated/*`: misma forma que el cliente del front
   (`billing-simulated.types.ts`). Todo objeto declara `simulated: true`. */
import type {
  InvoiceEvent,
  SimulatedInvoiceStatus,
  SimulatedIssuerView,
  SiatResponse,
} from './siat-simulated/siat-simulated.engine';
import type { RowXml } from './siat-simulated/invoice-xml';

export type ChargeSource = 'CONSULTATION' | 'PHARMACY';

export interface ChargeLineView {
  productCode: string;
  description: string;
  quantity: string;
  unitOfMeasure: number;
  unitPrice: string;
  discount: string | null;
  subtotal: string;
}

export interface SimulatedPaymentView {
  id: string;
  methodCode: number;
  methodLabel: string;
  amount: string;
  currency: 'BOB';
  paidAt: string;
  simulated: true;
}

export interface SimulatedInvoiceSummaryView {
  id: string;
  invoiceNumber: number;
  cuf: string;
  status: SimulatedInvoiceStatus;
  siatStatusCode: number;
  issuedAt: string;
  total: string;
  simulated: true;
}

export interface SimulatedChargeView {
  id: string;
  source: ChargeSource;
  sourceRef: string;
  issuerId: string;
  patientProfileId: string;
  patientName: string;
  practitionerProfileId: string | null;
  description: string;
  lines: ChargeLineView[];
  total: string;
  currency: 'BOB';
  createdAt: string;
  payment: SimulatedPaymentView | null;
  suggestedBuyer: {
    name: string;
    documentTypeCode: number;
    documentNumber: string;
    email: string | null;
  };
  latestInvoice: SimulatedInvoiceSummaryView | null;
  /** Siempre `null`: el modelo real no tiene planes de pago por instancia. */
  plan: null;
  simulated: true;
}

export interface SimulatedInvoiceView {
  id: string;
  chargeId: string;
  issuer: SimulatedIssuerView;
  documentSector: number;
  modality: 2;
  invoiceNumber: number;
  cuf: string;
  cufd: string;
  issuedAt: string;
  cabecera: RowXml;
  detalle: RowXml[];
  xml: string;
  hashArchivo: string;
  compressedBytes: number;
  status: SimulatedInvoiceStatus;
  siatResponse: SiatResponse;
  events: InvoiceEvent[];
  simulated: true;
}

export interface SimulatedOutboxEntryView {
  id: string;
  invoiceId: string;
  to: string;
  attachments: string[];
  status: 'NOT_SENT_SIMULATED';
  queuedAt: string;
  simulated: true;
}

export interface MyInvoiceItemView {
  invoice: SimulatedInvoiceSummaryView;
  chargeId: string;
  source: ChargeSource;
  description: string;
  issuerName: string;
  issuerNit: string;
  patientName: string;
  simulated: true;
}
