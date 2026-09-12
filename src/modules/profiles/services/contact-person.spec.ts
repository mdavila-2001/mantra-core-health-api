import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { CONCEPTS } from '../../../common';
import { PROF } from '../profiles.concepts';
import { createContactPerson } from './contact-person';

function build() {
  const persons = {
    create: fn((_tx: unknown, data: unknown) => ({
      id: 'person-1',
      ...(data as Record<string, unknown>),
    })),
  };
  const identifiers = {
    create: fn((_tx: unknown, data: unknown) => ({
      id: 'identifier-1',
      ...(data as Record<string, unknown>),
    })),
  };
  const contactPoints = { create: fn() };
  return {
    repos: { persons, identifiers, contactPoints },
    persons,
    identifiers,
    contactPoints,
    tx: {} as never,
  };
}

describe('createContactPerson', () => {
  it('crea la persona con PERSON_ACTIVE/VITAL_ALIVE y el nombre completo tal cual', () => {
    const d = build();

    createContactPerson(d.repos as never, d.tx, {
      displayName: 'Mariana Siles Justiniano',
      email: 'legal@aseguradora.com',
      actorUserId: 'user-1',
    });

    expect(d.persons.create).toHaveBeenCalledWith(d.tx, {
      displayName: 'Mariana Siles Justiniano',
      personStatusConceptId: PROF.PERSON_ACTIVE,
      vitalStatusConceptId: PROF.VITAL_ALIVE,
      actorUserId: 'user-1',
    });
  });

  it('el correo siempre se crea con OWNER_PERSON y CONTACT_USE_WORK', () => {
    const d = build();

    createContactPerson(d.repos as never, d.tx, {
      displayName: 'Carlos Mendoza',
      email: 'gm@aseguradora.com',
      actorUserId: 'user-1',
    });

    expect(d.contactPoints.create).toHaveBeenCalledWith(d.tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: 'person-1',
      systemConceptId: CONCEPTS.CONTACT_EMAIL,
      value: 'gm@aseguradora.com',
      useConceptId: CONCEPTS.CONTACT_USE_WORK,
      actorUserId: 'user-1',
    });
    expect(d.contactPoints.create).toHaveBeenCalledTimes(1);
  });

  it('con celular crea un CONTACT_MOBILE además del correo; sin él, no', () => {
    const d = build();

    createContactPerson(d.repos as never, d.tx, {
      displayName: 'Carlos Mendoza',
      email: 'gm@aseguradora.com',
      mobile: '+591 70012345',
      actorUserId: 'user-1',
    });

    expect(d.contactPoints.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        systemConceptId: CONCEPTS.CONTACT_MOBILE,
        value: '+591 70012345',
        useConceptId: CONCEPTS.CONTACT_USE_WORK,
      }),
    );
    expect(d.contactPoints.create).toHaveBeenCalledTimes(2);
  });

  it('con teléfono crea un CONTACT_PHONE; sin CI, no crea ningún identifier', () => {
    const d = build();

    const resultado = createContactPerson(d.repos as never, d.tx, {
      displayName: 'Mariana Siles',
      email: 'legal@aseguradora.com',
      phone: '+591 70099999',
      actorUserId: 'user-1',
    });

    expect(d.contactPoints.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        systemConceptId: CONCEPTS.CONTACT_PHONE,
        value: '+591 70099999',
      }),
    );
    expect(d.identifiers.create).not.toHaveBeenCalled();
    expect(resultado.identifierId).toBeUndefined();
  });

  it('con CI crea el identifier con OWNER_PERSON/ID_TYPE_NATIONAL/USE_OFFICIAL/STATE_ACTIVE y devuelve su id', () => {
    const d = build();

    const resultado = createContactPerson(d.repos as never, d.tx, {
      displayName: 'Mariana Siles',
      email: 'legal@aseguradora.com',
      nationalId: '4872190 SC',
      actorUserId: 'user-1',
    });

    expect(d.identifiers.create).toHaveBeenCalledWith(d.tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: 'person-1',
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: '4872190 SC',
      useConceptId: CONCEPTS.USE_OFFICIAL,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: 'user-1',
    });
    expect(resultado.personId).toBe('person-1');
    expect(resultado.identifierId).toBe('identifier-1');
  });
});
