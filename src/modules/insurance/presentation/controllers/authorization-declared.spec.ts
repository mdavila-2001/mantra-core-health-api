import 'reflect-metadata';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { InsuranceBackboneController } from './insurance-backbone.controller';
import { InsuranceReadController } from './insurance-read.controller';
import { InsurerPatientsController } from './insurer-patients.controller';
import { MyClaimsController } from './my-claims.controller';
import { InsurerPractitionerRequestsController } from './practitioner-insurer-requests.controller';

/**
 * O3-3: estas rutas no piden un rol global porque el servicio decide por la
 * membresía en la aseguradora activa o por el sujeto del token.
 * Lo declaran con `@Roles()` vacío para que la decisión quede escrita y el
 * informe de cobertura no las cuente como huérfanas. Si una pierde el
 * decorador —o alguien le pone un rol global sin revisar a quién deja
 * afuera—, esta prueba lo marca.
 */
const DECLARED: ReadonlyArray<readonly [object, readonly string[]]> = [
  [
    InsuranceBackboneController,
    [
      'updateContactChannels',
      'createPlan',
      'createBenefit',
      'updateBenefit',
      'updateBenefitRules',
      'updatePlanPremium',
    ],
  ],
  [
    InsuranceReadController,
    [
      'listCarriers',
      'getCarrier',
      'listBrokers',
      'getBroker',
      'listBrokerClients',
    ],
  ],
  [InsurerPatientsController, ['listPatients', 'options', 'openConversation']],
  [MyClaimsController, ['listMyClaims']],
  [
    InsurerPractitionerRequestsController,
    ['listReceived', 'approve', 'reject'],
  ],
];

describe('insurance: autorización declarada en las rutas sin rol global', () => {
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
