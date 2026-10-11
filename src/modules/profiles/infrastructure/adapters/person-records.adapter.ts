import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { findCurrentIdentityAssertionForPerson } from '../../../identity_assurance/repositories/identity-assertions.repository';
import {
  AddressesRepository,
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import {
  createResidenceAddress,
  createWorkAddress,
  replaceResidenceAddress,
  summarizeAddress,
} from '../../../common/services/residence-address';
import { CatalogConceptsRepository } from '../../../terminology/repositories';
import { Identifiers } from '../../../common/entities';
import type { PersonRecordsPort } from '../../application/ports/person-records.port';

@Injectable()
export class PersonRecordsAdapter implements PersonRecordsPort {
  constructor(
    private readonly contacts: ContactPointsRepository,
    private readonly addresses: AddressesRepository,
    private readonly identifiers: IdentifiersRepository,
    private readonly concepts: CatalogConceptsRepository,
  ) {}

  async hasCurrentIdentityAssertion(em: EntityManager, personId: string) {
    return Boolean(await findCurrentIdentityAssertionForPerson(em, personId));
  }

  async findCurrentContact<T>(
    em: EntityManager,
    ownerId: string,
    systemConceptId: string,
    useConceptId?: string,
  ): Promise<T | null> {
    const row =
      useConceptId === undefined
        ? this.contacts.findCurrentByOwnerAndSystem(
            em,
            ownerId,
            systemConceptId,
          )
        : this.contacts.findCurrentByOwnerSystemAndUse(
            em,
            ownerId,
            systemConceptId,
            useConceptId,
          );
    return (await row) as T | null;
  }

  findAllCurrentContacts<T>(em: EntityManager, ownerId: string) {
    return this.contacts.findAllCurrentByOwner(em, ownerId) as Promise<T[]>;
  }

  closeContact(row: object, at: Date, actorUserId: string) {
    this.contacts.closeCurrent(
      row as Parameters<ContactPointsRepository['closeCurrent']>[0],
      at,
      actorUserId,
    );
  }

  createContact(em: EntityManager, data: object) {
    return this.contacts.create(
      em,
      data as Parameters<ContactPointsRepository['create']>[1],
    );
  }

  findCurrentAddress<T>(
    em: EntityManager,
    personId: string,
    useConceptId: string,
  ) {
    return this.addresses.findCurrentByOwnerAndUse(
      em,
      personId,
      useConceptId,
    ) as Promise<T | null>;
  }

  summarizeAddress(row?: object | null) {
    return summarizeAddress(row as Parameters<typeof summarizeAddress>[0]);
  }

  closeAddress(row: object, at: Date, actorUserId: string) {
    this.addresses.closeCurrent(
      row as Parameters<AddressesRepository['closeCurrent']>[0],
      at,
      actorUserId,
    );
  }

  async createAddress(
    em: EntityManager,
    data: Parameters<PersonRecordsPort['createAddress']>[1],
  ) {
    const writer = data.work ? createWorkAddress : createResidenceAddress;
    await writer(this.addresses, em, this.concepts, {
      personId: data.personId,
      municipalityConceptId: data.municipalityConceptId,
      lines: data.lines,
      latitude: data.latitude,
      longitude: data.longitude,
      actorUserId: data.actorUserId,
    });
  }

  replaceAddress(
    em: EntityManager,
    data: Parameters<PersonRecordsPort['replaceAddress']>[1],
    at: Date,
  ) {
    return replaceResidenceAddress(this.addresses, em, this.concepts, data, at);
  }

  findCurrentIdentifiers<T>(em: EntityManager, personId: string) {
    return em.find(Identifiers, {
      ownerId: personId,
      validTo: null,
    }) as Promise<T[]>;
  }

  findActiveDuplicate<T>(
    em: EntityManager,
    data: { typeConceptId: string; value: string },
  ) {
    return this.identifiers.findActiveDuplicate(em, data) as Promise<T | null>;
  }

  createIdentifier(em: EntityManager, data: object) {
    return this.identifiers.create(
      em,
      data as Parameters<IdentifiersRepository['create']>[1],
    );
  }

  findCatalogConcept(em: EntityManager, id: string) {
    return this.concepts.findById(em, id);
  }
}
