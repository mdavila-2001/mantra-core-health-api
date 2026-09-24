import { clinicalRoleId } from '../authz/authz.seed';
import {
  SCHEDULING_ROLE_CODES,
  SCHEDULING_ROLE_SEED,
} from './scheduling.roles';

describe('roles de sistema de scheduling', () => {
  it('declara administrador y agente asignables por tenant con ids deterministas', () => {
    expect(SCHEDULING_ROLE_SEED).toEqual([
      {
        id: clinicalRoleId('SCHEDULING_ADMIN'),
        code: 'SCHEDULING_ADMIN',
        name: 'Administrador de agenda',
        baseRole: 'ADMIN',
        scope: 'TENANT',
      },
      {
        id: clinicalRoleId('SCHEDULING_AGENT'),
        code: 'SCHEDULING_AGENT',
        name: 'Agente de agenda',
        baseRole: 'STAFF',
        scope: 'TENANT',
      },
    ]);
    expect(SCHEDULING_ROLE_CODES).toEqual([
      'SCHEDULING_ADMIN',
      'SCHEDULING_AGENT',
    ]);
  });
});
