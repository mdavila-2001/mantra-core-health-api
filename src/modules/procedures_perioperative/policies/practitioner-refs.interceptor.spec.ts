import { jest } from '@jest/globals';
import { lastValueFrom, of } from 'rxjs';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import { PractitionerRefsInterceptor } from './practitioner-refs.interceptor';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const PROPIO = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function build(body: unknown, assert = mockFn().mockResolvedValue(undefined)) {
  const interceptor = new PractitionerRefsInterceptor(
    {} as any,
    { assertInTenant: assert } as any,
  );
  const handler = mockFn(() => of('ok'));
  const context: any = {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  };
  const run = () =>
    runWithTenant(TENANT, () =>
      lastValueFrom(interceptor.intercept(context, { handle: handler })),
    );
  return { run, handler, assert };
}

describe('PractitionerRefsInterceptor', () => {
  it('comprueba los profesionales del cuerpo contra el tenant del contexto y deja pasar si son propios', async () => {
    const d = build({ patientProfileId: 'x', primarySurgeonProfileId: PROPIO });
    await expect(d.run()).resolves.toBe('ok');
    expect(d.assert).toHaveBeenCalledWith(expect.anything(), TENANT, [
      { field: 'primarySurgeonProfileId', profileId: PROPIO },
    ]);
  });

  it('si alguno no es del tenant, el handler NO se ejecuta (mutación: sin el interceptor llegaría a escribir)', async () => {
    const d = build(
      { coordinatorProfileId: PROPIO },
      mockFn().mockRejectedValue(
        Object.assign(new Error('no'), {
          status: 422,
          reason: Reason.PRACTITIONER_NOT_IN_TENANT,
        }),
      ),
    );
    await expect(d.run()).rejects.toMatchObject({
      reason: Reason.PRACTITIONER_NOT_IN_TENANT,
    });
    expect(d.handler).not.toHaveBeenCalled();
  });

  it('un cuerpo sin profesionales sigue de largo sin consultar la base', async () => {
    const d = build({ eventCode: 'INCISION' });
    await expect(d.run()).resolves.toBe('ok');
    expect(d.assert).not.toHaveBeenCalled();
  });
});
