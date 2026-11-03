import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AddressesRepository,
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import {
  createResidenceAddress,
  createWorkAddress,
} from '../../../common/services/residence-address';
import { CatalogConceptsRepository } from '../../../terminology/repositories';
import type {
  CommonRecordsPort,
  PersonAddressInput,
} from '../../application/ports/common-records.port';

/** Identificadores, contactos y direcciones de `common` que escriben las altas. */
@Injectable()
export class CommonRecordsAdapter implements CommonRecordsPort {
  constructor(
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
  ) {}

  createIdentifier(tx: EntityManager, data: object) {
    return this.identifiersRepo.create(
      tx,
      data as Parameters<IdentifiersRepository['create']>[1],
    );
  }

  createContactPoint(tx: EntityManager, data: object) {
    return this.contactPointsRepo.create(
      tx,
      data as Parameters<ContactPointsRepository['create']>[1],
    );
  }

  createResidenceAddress(tx: EntityManager, data: PersonAddressInput) {
    return createResidenceAddress(
      this.addressesRepo,
      tx,
      this.catalogConceptsRepo,
      data,
    );
  }

  createWorkAddress(tx: EntityManager, data: PersonAddressInput) {
    return createWorkAddress(
      this.addressesRepo,
      tx,
      this.catalogConceptsRepo,
      data,
    );
  }
}
