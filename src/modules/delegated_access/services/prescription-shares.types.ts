import type { MedicationRequests } from '../../clinical/entities';
import type { PrescriberLicense } from '../../clinical/services/prescription-pdf.service';
import type { PrescriptionShareResourceType } from '../dto/prescription-shares.dto';
import type { SharedAccessLinks } from '../entities';
import type {
  PrescriptionShareEndedReason,
  PrescriptionShareStatus,
} from './prescription-share-expiry';

/**
 * Tipos del enlace compartido de receta que comparten el servicio y quienes lo
 * llaman (la pantalla de la farmacia, FAR-02).
 */

/** Origen de un uso del enlace, para `shared_access_link_uses`. */
export interface PrescriptionShareUseContext {
  /** IP del cliente; si no es una IP válida, se guarda `null`. */
  readonly sourceIp?: string | null;
  /** Agente de usuario; se recorta a 512 caracteres. */
  readonly userAgent?: string | null;
}

/** Quién emitió la receta compartida. */
export interface PrescriptionSharePrescriber {
  /** Perfil profesional del prescriptor, o `null` si la receta no lo tiene. */
  readonly practitionerProfileId: string | null;
  /** Nombre visible, o `null` si no se encuentra. */
  readonly name: string | null;
  /** Matrícula nacional, o `null` si no declaró. */
  readonly license: PrescriberLicense | null;
}

/**
 * Lo que `openForPharmacy` le entrega a la pantalla de la farmacia (FAR-02).
 * Trae los ítems vigentes enteros: la proyección y el enmascarado del paciente
 * (S-4) los decide quien arma la respuesta HTTP.
 */
export interface PharmacyPrescriptionShare {
  readonly shareId: string;
  /** Tenant custodio de la receta (`shared_access_links.tenant_id`). */
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceType: PrescriptionShareResourceType;
  readonly resourceId: string;
  /** Emisión más antigua de los ítems vigentes. */
  readonly issuedAt: Date | null;
  /** `valid_to` más próximo de los ítems vigentes, o `null` si no tienen. */
  readonly validTo: Date | null;
  /** Vencimiento del enlace. */
  readonly expiresAt: Date;
  readonly prescriber: PrescriptionSharePrescriber;
  /** Ítems emitidos y vigentes (regla única de `prescription-validity.ts`). */
  readonly items: readonly MedicationRequests[];
}

/** Un enlace con los ítems que comparte, ya clasificados. */
export interface ResolvedShare {
  readonly link: SharedAccessLinks;
  readonly activeItems: MedicationRequests[];
  readonly allItems: MedicationRequests[];
  readonly status: PrescriptionShareStatus;
  readonly endedReason: PrescriptionShareEndedReason | null;
}
