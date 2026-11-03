import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS, touch } from '../../../../common';
import { Addresses } from '../../../common/entities';
import { AddressesRepository } from '../../../common/repositories';
import {
  createSavedAddress,
  replaceResidenceAddress,
} from '../../../common/services/residence-address';
import { CatalogConceptsRepository } from '../../../terminology/repositories';
import type {
  AddressBookRow,
  NewSavedAddress,
  PatientAddressBookPort,
} from '../../application/ports/patient-address-book.port';

/** Los usos que forman la libreta: el domicilio, el trabajo y las guardadas. */
const USOS_DE_LA_LIBRETA = [
  CONCEPTS.ADDR_USE_HOME,
  CONCEPTS.ADDR_USE_WORK,
  CONCEPTS.ADDR_USE_SAVED,
] as const;

/** `PatientAddressBookPort` sobre `common.addresses`. */
@Injectable()
export class PatientAddressBookAdapter implements PatientAddressBookPort {
  constructor(
    private readonly addresses: AddressesRepository,
    private readonly concepts: CatalogConceptsRepository,
  ) {}

  listCurrent(em: EntityManager, personId: string): Promise<AddressBookRow[]> {
    return this.addresses.findCurrentByOwnerAndUses(
      em,
      personId,
      USOS_DE_LA_LIBRETA,
    );
  }

  async createSaved(
    em: EntityManager,
    data: NewSavedAddress,
  ): Promise<AddressBookRow> {
    const fila = await createSavedAddress(
      this.addresses,
      em,
      this.concepts,
      data,
    );
    // Con municipio siempre hay fila: el DTO lo exige. El `null` sólo existe
    // para la dirección vacía, que la libreta nunca pide guardar.
    if (fila === null) {
      throw new Error(
        'createSavedAddress no creó fila con municipio declarado',
      );
    }
    return fila;
  }

  close(row: AddressBookRow, at: Date, actorUserId: string): void {
    this.addresses.closeCurrent(row as Addresses, at, actorUserId);
  }

  setPreferred(
    row: AddressBookRow,
    preferred: boolean,
    actorUserId: string,
  ): void {
    const fila = row as Addresses;
    fila.isPreferred = preferred;
    touch(fila, actorUserId);
  }

  replaceFixed(
    em: EntityManager,
    data: Parameters<PatientAddressBookPort['replaceFixed']>[1],
    at: Date,
  ): Promise<void> {
    return replaceResidenceAddress(this.addresses, em, this.concepts, data, at);
  }
}
