import type { EntityManager } from '@mikro-orm/postgresql';

export interface PersonAddressSummary {
  readonly lines?: string;
  readonly city?: string;
  readonly municipalityConceptId?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface PersonRecordsPort {
  hasCurrentIdentityAssertion(
    em: EntityManager,
    personId: string,
  ): Promise<boolean>;
  findCurrentContact<T>(
    em: EntityManager,
    ownerId: string,
    systemConceptId: string,
    useConceptId?: string,
  ): Promise<T | null>;
  findAllCurrentContacts<T>(em: EntityManager, ownerId: string): Promise<T[]>;
  closeContact(row: object, at: Date, actorUserId: string): void;
  createContact(em: EntityManager, data: object): unknown;
  findCurrentAddress<T>(
    em: EntityManager,
    personId: string,
    useConceptId: string,
  ): Promise<T | null>;
  summarizeAddress(row?: object | null): PersonAddressSummary | undefined;
  closeAddress(row: object, at: Date, actorUserId: string): void;
  createAddress(
    em: EntityManager,
    data: {
      personId: string;
      useConceptId: string;
      municipalityConceptId?: string;
      lines?: string;
      latitude?: number;
      longitude?: number;
      actorUserId: string;
      work: boolean;
    },
  ): Promise<void>;
  replaceAddress(
    em: EntityManager,
    data: {
      personId: string;
      useConceptId: string;
      municipalityConceptId?: string;
      lines?: string;
      latitude?: number | null;
      longitude?: number | null;
      actorUserId: string;
    },
    at: Date,
  ): Promise<void>;
  findCurrentIdentifiers<T>(em: EntityManager, personId: string): Promise<T[]>;
  findActiveDuplicate<T>(
    em: EntityManager,
    data: { typeConceptId: string; value: string },
  ): Promise<T | null>;
  createIdentifier(em: EntityManager, data: object): unknown;
  findCatalogConcept(em: EntityManager, id: string): Promise<unknown>;
}

export const PERSON_RECORDS_PORT = Symbol('PERSON_RECORDS_PORT');
