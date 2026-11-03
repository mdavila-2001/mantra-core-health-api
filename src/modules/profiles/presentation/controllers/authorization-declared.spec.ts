import 'reflect-metadata';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { OwnAdmissionController } from './own-admission.controller';
import { PatientAddressBookController } from './patient-address-book.controller';
import { PractitionerSignatureAssetsController } from './practitioner-signature-assets.controller';
import { PrimaryPractitionerController } from './primary-practitioner.controller';
import { ProfilesPatientsController } from './profiles-patients.controller';
import { ProfilesPractitionersController } from './profiles-practitioners.controller';

/**
 * O3-3: estas rutas no piden un rol global porque el servicio decide por la
 * titularidad del perfil (sujeto de la sesión).
 * Lo declaran con `@Roles()` vacío para que la decisión quede escrita y el
 * informe de cobertura no las cuente como huérfanas. Si una pierde el
 * decorador —o alguien le pone un rol global sin revisar a quién deja
 * afuera—, esta prueba lo marca.
 */
const DECLARED: ReadonlyArray<readonly [object, readonly string[]]> = [
  [OwnAdmissionController, ['get', 'resubmit', 'withdraw']],
  [
    PatientAddressBookController,
    ['list', 'create', 'update', 'remove', 'prefer'],
  ],
  [PractitionerSignatureAssetsController, ['getOwn', 'setOwn']],
  [
    PrimaryPractitionerController,
    ['getOwn', 'setOwn', 'removeOwn', 'listOwnPatients'],
  ],
  [
    ProfilesPatientsController,
    [
      'getOwnSummary',
      'removeOwnPhoto',
      'registerOwnDependent',
      'addRelatedPerson',
    ],
  ],
  [
    ProfilesPractitionersController,
    [
      'setPractitionerPhoto',
      'removePractitionerPhoto',
      'addJurisdictionAuthorization',
      'listOwnAffiliations',
      'addOwnAffiliation',
      'updateOwnAffiliation',
      'removeOwnAffiliation',
      'addOwnCredential',
      'updateOwnCredential',
      'removeOwnCredential',
      'addSpecialty',
      'setOwnPrimarySpecialty',
      'updateOwnSpecialty',
      'removeOwnSpecialty',
      'updateOwnLicense',
      'removeOwnLicense',
    ],
  ],
];

describe('profiles: autorización declarada en las rutas sin rol global', () => {
  it.each(
    DECLARED.map(([ctrl, handlers]) => [
      (ctrl as { name: string }).name,
      ctrl,
      handlers,
    ]),
  )('%s declara `@Roles()` vacío', (_name, ctrl, handlers) => {
    const proto = (ctrl as { prototype: Record<string, object> }).prototype;
    for (const handler of handlers as string[]) {
      expect(typeof proto[handler]).toBe('function');
      expect([handler, Reflect.getMetadata(ROLES_KEY, proto[handler])]).toEqual(
        [handler, []],
      );
    }
  });
});
