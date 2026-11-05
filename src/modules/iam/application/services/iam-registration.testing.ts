import { CommonRecordsAdapter } from '../../infrastructure/adapters/common-records.adapter';
import { DirectoryRegistrationAdapter } from '../../infrastructure/adapters/directory-registration.adapter';
import { ProfilesRegistrationAdapter } from '../../infrastructure/adapters/profiles-registration.adapter';

/**
 * Cableado de pruebas de las altas: arma los adaptadores **reales** de los
 * puertos de registro sobre dobles de los repositorios de otros contextos, de
 * modo que las pruebas siguen mirando las llamadas a esos repositorios.
 * Lo que una prueba no use queda como `{}`.
 */
type Doubles<K extends string> = Partial<Record<K, unknown>>;
const blank = (): never => ({}) as never;

export function profilesRegistration(
  d: Doubles<
    | 'persons'
    | 'personProfiles'
    | 'patientProfiles'
    | 'accountLinks'
    | 'practitioners'
    | 'authorizations'
    | 'credentials'
    | 'languages'
    | 'specialties'
    | 'relatedPersons'
    | 'identifiers'
    | 'contactPoints'
    | 'administrativeAreas'
    | 'specialtyCatalog'
    | 'admissions'
  >,
): ProfilesRegistrationAdapter {
  const pick = (key: keyof typeof d): never => (d[key] ?? blank()) as never;
  return new ProfilesRegistrationAdapter(
    pick('persons'),
    pick('personProfiles'),
    pick('patientProfiles'),
    pick('accountLinks'),
    pick('practitioners'),
    pick('authorizations'),
    pick('credentials'),
    pick('languages'),
    pick('specialties'),
    pick('relatedPersons'),
    pick('identifiers'),
    pick('contactPoints'),
    pick('administrativeAreas'),
    pick('specialtyCatalog'),
    // v4.2.67: la solicitud de admisión nace en la misma transacción del alta.
    (d.admissions ?? {
      openForRegistration: () => Promise.resolve({}),
    }) as never,
  );
}

export function commonRecords(
  d: Doubles<'identifiers' | 'contactPoints' | 'addresses' | 'catalogConcepts'>,
): CommonRecordsAdapter {
  const pick = (key: keyof typeof d): never => (d[key] ?? blank()) as never;
  return new CommonRecordsAdapter(
    pick('identifiers'),
    pick('contactPoints'),
    pick('addresses'),
    pick('catalogConcepts'),
  );
}

export function directoryRegistration(
  d: Doubles<
    | 'memberships'
    | 'tenants'
    | 'branches'
    | 'typeProfile'
    | 'affiliationDocuments'
    | 'representatives'
  >,
): DirectoryRegistrationAdapter {
  const pick = (key: keyof typeof d): never => (d[key] ?? blank()) as never;
  return new DirectoryRegistrationAdapter(
    pick('memberships'),
    pick('tenants'),
    pick('branches'),
    pick('typeProfile'),
    pick('affiliationDocuments'),
    pick('representatives'),
  );
}
