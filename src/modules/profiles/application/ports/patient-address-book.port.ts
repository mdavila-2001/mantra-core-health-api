import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Una fila vigente de la libreta de direcciones del paciente, tal como la
 * necesita el servicio. La implementa la entidad `common.addresses`; el puerto
 * la describe por forma para que `profiles` no dependa del ORM de `common`.
 */
export interface AddressBookRow {
  readonly id: string;
  readonly useConceptId?: string;
  readonly label?: string | null;
  readonly lines?: string | null;
  readonly city?: string | null;
  readonly municipalityConceptId?: string | null;
  readonly administrativeArea2ConceptId?: string | null;
  readonly districtText?: string | null;
  readonly latitude?: string | null;
  readonly longitude?: string | null;
  readonly isPreferred: boolean;
}

/** Lo que hace falta para guardar una dirección en la libreta. */
export interface NewSavedAddress {
  readonly personId: string;
  readonly label: string;
  readonly municipalityConceptId: string;
  readonly lines?: string;
  /** Distrito o zona, como texto (ADR-0028). */
  readonly district?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isPreferred: boolean;
  readonly actorUserId: string;
}

/**
 * Las direcciones del paciente en `common.addresses` (modelo v4.2.61).
 *
 * Existe aparte de `PersonRecordsPort` porque aquel trata el domicilio y el
 * trabajo de a uno —una vigente por uso—, y la libreta es una lista.
 */
export interface PatientAddressBookPort {
  /** Las vigentes de la persona: domicilio, trabajo y guardadas. */
  listCurrent(em: EntityManager, personId: string): Promise<AddressBookRow[]>;
  /** Guarda una dirección nueva con uso «guardada». */
  createSaved(
    em: EntityManager,
    data: NewSavedAddress,
  ): Promise<AddressBookRow>;
  /** Cierra una vigente (`valid_to`): nunca se borra, queda la historia. */
  close(row: AddressBookRow, at: Date, actorUserId: string): void;
  /** Marca o desmarca la preferida. */
  setPreferred(
    row: AddressBookRow,
    preferred: boolean,
    actorUserId: string,
  ): void;
  /**
   * Corrige el domicilio o el trabajo con la regla de siempre: cierra el
   * vigente y abre otro (`replaceResidenceAddress`).
   */
  replaceFixed(
    em: EntityManager,
    data: {
      personId: string;
      useConceptId: string;
      municipalityConceptId?: string;
      lines?: string;
      district?: string;
      latitude?: number | null;
      longitude?: number | null;
      actorUserId: string;
    },
    at: Date,
  ): Promise<void>;
}

export const PATIENT_ADDRESS_BOOK_PORT = Symbol('PATIENT_ADDRESS_BOOK_PORT');
