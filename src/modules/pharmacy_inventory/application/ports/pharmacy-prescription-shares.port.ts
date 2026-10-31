/** Origen de la apertura, para el registro de usos del enlace. */
export interface PrescriptionShareOpenContext {
  /** IP del cliente; el contexto dueño del enlace la valida. */
  readonly sourceIp?: string | null;
  /** Agente de usuario del cliente. */
  readonly userAgent?: string | null;
}

/** Matrícula del prescriptor, como la publica la verificación de receta. */
export interface SharedPrescriptionLicenseSnapshot {
  readonly number: string;
  readonly authority: string | null;
  readonly state: 'ACTIVE' | 'PENDING';
}

/** Quién emitió la receta compartida. */
export interface SharedPrescriptionPrescriberSnapshot {
  readonly name: string | null;
  readonly license: SharedPrescriptionLicenseSnapshot | null;
}

/** Un ítem vigente de la receta, plano: lo que la farmacia necesita de él. */
export interface SharedPrescriptionItemSnapshot {
  /** `clinical.medication_requests.id`. */
  readonly id: string;
  readonly medicationConceptId: string;
  readonly doseText: string | null;
  readonly frequencyText: string | null;
  /** Cantidad recetada, o `null` si la receta no la fija o no es numérica. */
  readonly quantity: number | null;
  readonly unitConceptId: string | null;
}

/** Una receta compartida, ya abierta (y registrada) por el contexto dueño. */
export interface SharedPrescriptionSnapshot {
  readonly shareId: string;
  readonly patientProfileId: string;
  readonly issuedAt: Date | null;
  readonly validTo: Date | null;
  readonly prescriber: SharedPrescriptionPrescriberSnapshot;
  /** Solo los ítems emitidos y vigentes. */
  readonly items: readonly SharedPrescriptionItemSnapshot[];
}

/**
 * Apertura del enlace de una receta por una farmacia (contexto
 * `delegated_access`, FAR-01).
 *
 * Abrir **registra el uso**: `OPENED` si es válido; `DENIED` y un 410 si está
 * vencido o revocado. Un token desconocido es un 404 sin uso.
 *
 * `prepare` arma la respuesta con la receta ya resuelta y corre **antes** de
 * que se escriba el `OPENED`: si falla, no queda una apertura que no se
 * sirvió. Lo que devuelve es lo que devuelve la apertura.
 */
export interface PharmacyPrescriptionSharesPort {
  openForPharmacy<T>(
    token: string,
    context: PrescriptionShareOpenContext,
    prepare: (share: SharedPrescriptionSnapshot) => Promise<T>,
  ): Promise<T>;
}

/** Token de inyección de la apertura de recetas compartidas. */
export const PHARMACY_PRESCRIPTION_SHARES_PORT = Symbol(
  'PHARMACY_PRESCRIPTION_SHARES_PORT',
);
