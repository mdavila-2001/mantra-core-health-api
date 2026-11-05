import { jest } from '@jest/globals';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AccountingPractitionerSimpleController } from './accounting-practitioner-simple.controller';

const actor = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-1',
} as any;

function build() {
  const simple = {
    summary: mockFn(),
    listAccounts: mockFn(),
    createAccount: mockFn(),
    updateAccount: mockFn(),
    deleteAccount: mockFn(),
    listRecords: mockFn(),
    createRecord: mockFn(),
    updateRecord: mockFn(),
    deleteRecord: mockFn(),
    listTransactions: mockFn(),
    createTransaction: mockFn(),
    updateTransaction: mockFn(),
    deleteTransaction: mockFn(),
  };
  return {
    simple,
    controller: new AccountingPractitionerSimpleController(simple as any),
  };
}

describe('AccountingPractitionerSimpleController (P49)', () => {
  const proto =
    AccountingPractitionerSimpleController.prototype as unknown as Record<
      string,
      object
    >;
  const handlers = Object.getOwnPropertyNames(proto).filter(
    (n) => n !== 'constructor',
  );

  it('publica exactamente las 13 rutas de la spec bajo /accounting/practitioner/simple', () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AccountingPractitionerSimpleController,
      ),
    ).toBe('accounting/practitioner/simple');
    const routes = handlers
      .map(
        (h) =>
          `${RequestMethod[Reflect.getMetadata(METHOD_METADATA, proto[h])]} ${Reflect.getMetadata(PATH_METADATA, proto[h])}`,
      )
      .sort();
    expect(routes).toEqual(
      [
        'GET summary',
        'GET accounts',
        'POST accounts',
        'PUT accounts/:id',
        'DELETE accounts/:id',
        'GET records',
        'POST records',
        'PUT records/:id',
        'DELETE records/:id',
        'GET transactions',
        'POST transactions',
        'PUT transactions/:id',
        'DELETE transactions/:id',
      ].sort(),
    );
  });

  it('todas las rutas son sólo para PRACTITIONER', () => {
    expect(handlers).toHaveLength(13);
    for (const handler of handlers) {
      expect(Reflect.getMetadata(ROLES_KEY, proto[handler])).toEqual([
        'PRACTITIONER',
      ]);
    }
  });

  it('los borrados responden 204 y las altas 201', () => {
    for (const handler of handlers) {
      const method = Reflect.getMetadata(METHOD_METADATA, proto[handler]);
      const code = Reflect.getMetadata(HTTP_CODE_METADATA, proto[handler]);
      if (method === RequestMethod.DELETE) expect(code).toBe(204);
      if (method === RequestMethod.POST) expect(code).toBe(201);
    }
  });

  it('delega la lectura con la práctica y el actor', async () => {
    const { controller, simple } = build();
    await controller.summary({ practiceId: 'p1', period: 'year' }, actor);
    await controller.listAccounts({ practiceId: 'p1' }, actor);
    await controller.listRecords({ practiceId: 'p1', kind: 'DEBT' }, actor);
    await controller.listTransactions({ practiceId: 'p1' }, actor);
    expect(simple.summary).toHaveBeenCalledWith('p1', 'year', actor);
    expect(simple.listAccounts).toHaveBeenCalledWith('p1', actor);
    expect(simple.listRecords).toHaveBeenCalledWith('p1', 'DEBT', actor);
    expect(simple.listTransactions).toHaveBeenCalledWith('p1', actor);
  });

  it('delega las escrituras con el cuerpo, el id y el actor', async () => {
    const { controller, simple } = build();
    const account = {
      practiceId: 'p1',
      name: 'X',
      accountClass: 'EXPENSE',
    } as any;
    const record = { practiceId: 'p1', kind: 'EXPENSE' } as any;
    const transaction = { practiceId: 'p1', amount: '1' } as any;
    await controller.createAccount(account, actor);
    await controller.updateAccount('a1', { name: 'Y' }, actor);
    await controller.deleteAccount('a1', actor);
    await controller.createRecord(record, actor);
    await controller.updateRecord('r1', { amount: '2' }, actor);
    await controller.deleteRecord('r1', actor);
    await controller.createTransaction(transaction, actor);
    await controller.updateTransaction('t1', { amount: '3' }, actor);
    await controller.deleteTransaction('t1', actor);
    expect(simple.createAccount).toHaveBeenCalledWith(account, actor);
    expect(simple.updateAccount).toHaveBeenCalledWith(
      'a1',
      { name: 'Y' },
      actor,
    );
    expect(simple.deleteAccount).toHaveBeenCalledWith('a1', actor);
    expect(simple.createRecord).toHaveBeenCalledWith(record, actor);
    expect(simple.updateRecord).toHaveBeenCalledWith(
      'r1',
      { amount: '2' },
      actor,
    );
    expect(simple.deleteRecord).toHaveBeenCalledWith('r1', actor);
    expect(simple.createTransaction).toHaveBeenCalledWith(transaction, actor);
    expect(simple.updateTransaction).toHaveBeenCalledWith(
      't1',
      { amount: '3' },
      actor,
    );
    expect(simple.deleteTransaction).toHaveBeenCalledWith('t1', actor);
  });
});
