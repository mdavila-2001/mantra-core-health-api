import type { EntityManager } from '@mikro-orm/postgresql';

/** Datos de un archivo que acompaña a una admisión. */
export interface AdmissionFileFacts {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: Date;
  readonly contentHash?: string;
}

/** La cédula de un profesional, tal como la guarda el registro común. */
export interface ForeignNationalId {
  readonly ownerId: string;
  readonly value: string;
  readonly issuerAdministrativeAreaConceptId?: string | null;
}

/** Un punto de contacto del profesional. */
export interface ForeignContactPoint {
  readonly systemConceptId: string;
  readonly useConceptId?: string | null;
  readonly value: string;
}

/** Una dirección del profesional. */
export interface ForeignAddress {
  readonly useConceptId?: string | null;
  readonly lines?: string | null;
  readonly districtText?: string | null;
  readonly city?: string | null;
  readonly municipalityConceptId?: string | null;
  readonly administrativeAreaConceptId?: string | null;
  readonly latitude?: string | null;
  readonly longitude?: string | null;
}

/** Un consultorio donde ejerce el profesional. */
export interface ForeignPracticeSite {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly latitude: string | null;
  readonly longitude: string | null;
}

/**
 * Lecturas de otros contextos que la admisión necesita para armar su vista:
 * catálogo, cuentas, archivos, cédula, contactos, direcciones y consultorios.
 *
 * Son SÓLO lecturas y devuelven formas propias: la aplicación de `profiles` no
 * importa entidades de otros contextos (regla de capas, ADR-0026). Todas
 * trabajan con el `EntityManager` que reciben, así que sirven igual dentro de
 * la transacción del alta, del reenvío o de una lectura.
 */
export interface AdmissionForeignReadsPort {
  /** Nombre legible de varios conceptos de catálogo. */
  conceptNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>>;
  /** Nombre visible de varias cuentas. */
  userNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>>;
  /** ¿Existe esa cuenta? */
  userExists(em: EntityManager, userId: string): Promise<boolean>;
  /** Nombre, tipo, tamaño, fecha y huella de varios archivos. */
  fileFacts(
    em: EntityManager,
    fileIds: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, AdmissionFileFacts>>;
  /** La cédula de cada profesional (la primera por dueño). */
  nationalIds(
    em: EntityManager,
    ownerIds: readonly string[],
  ): Promise<Map<string, ForeignNationalId>>;
  /** Puntos de contacto del profesional. */
  contactPoints(
    em: EntityManager,
    ownerId: string,
  ): Promise<ForeignContactPoint[]>;
  /** Direcciones del profesional. */
  addresses(em: EntityManager, ownerId: string): Promise<ForeignAddress[]>;
  /** Consultorios donde ejerce, por id. */
  practiceSites(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<ForeignPracticeSite[]>;
}

export const ADMISSION_FOREIGN_READS_PORT = Symbol(
  'ADMISSION_FOREIGN_READS_PORT',
);
