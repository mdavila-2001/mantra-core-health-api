import { jest } from '@jest/globals';
import { ConsentMeService } from './consent-me.service';
import { CONS } from '../consent.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'u1', roles: ['PATIENT'] } as any;
const PACIENTE = 'p1';

/**
 * Aislamiento por titular y retiro (BR-20): las lecturas `me` sólo devuelven
 * filas del propio perfil y retirar lo ajeno es 404 sin llegar al caso de uso.
 */
function build(opts: { hasProfile?: boolean; found?: any } = {}) {
  const { hasProfile = true, found = null } = opts;
  const em: any = {
    fork: () => em,
    find: mockFn().mockResolvedValue([]),
    findOne: mockFn().mockResolvedValue(found),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn().mockResolvedValue(
      hasProfile ? { personId: 'per' } : null,
    ),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: PACIENTE }),
  };
  const consents = { withdraw: mockFn().mockResolvedValue({ ok: true }) };
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const service = new ConsentMeService(
    em,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    consents as any,
    logger as any,
  );
  return { service, em, consents };
}

describe('ConsentMeService (BR-20)', () => {
  it('las lecturas filtran por el perfil del titular, nunca por otro', async () => {
    const d = build();
    await d.service.listConsents(ACTOR);
    await d.service.listHipaaAuthorizations(ACTOR);
    await d.service.listObjections(ACTOR);
    await d.service.listTreatmentConsents(ACTOR);
    const filtros = d.em.find.mock.calls.map((call: any[]) => call[1]);
    expect(filtros.length).toBe(4);
    for (const filtro of filtros) {
      expect(filtro.patientProfileId).toBe(PACIENTE);
    }
  });

  it('sin persona vinculada las listas vienen vacías y no consultan nada', async () => {
    const d = build({ hasProfile: false });
    await expect(d.service.listConsents(ACTOR)).resolves.toEqual({ items: [] });
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('un consentimiento retirado figura como WITHDRAWN con su fecha, y las solicitudes de vínculo no se listan', async () => {
    const d = build();
    const retirado = new Date('2026-09-01T10:00:00Z');
    d.em.find.mockImplementation(async (entity: any) =>
      entity.name === 'Consents'
        ? [
            {
              id: 'c1',
              processingPurposeId: 'pp',
              statusConceptId: CONS.CONSENT_WITHDRAWN,
              withdrawnAt: retirado,
              validTo: retirado,
              createdAt: retirado,
            },
          ]
        : [{ id: 'pp', code: 'TREATMENT', name: 'Tratamiento' }],
    );
    const { items } = await d.service.listConsents(ACTOR);
    expect(items[0]).toMatchObject({
      id: 'c1',
      state: 'WITHDRAWN',
      withdrawnAt: retirado,
      purpose: { id: 'pp', name: 'Tratamiento' },
    });
    const filtro = d.em.find.mock.calls[0][1];
    expect(filtro.categoryConceptId).toEqual({
      $ne: CONS.CATEGORY_PRACTITIONER_ACCESS,
    });
  });

  it('retirar lo ajeno o inexistente es 404 y no llega al caso de uso', async () => {
    const d = build({ found: null });
    await expect(
      d.service.withdrawOwn(ACTOR, 'ajeno', {}),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.consents.withdraw).not.toHaveBeenCalled();
  });

  it('retirar lo propio delega en UC-07-02 con el actor', async () => {
    const d = build({
      found: { id: 'c1', categoryConceptId: CONS.CATEGORY_PRIVACY },
    });
    await expect(d.service.withdrawOwn(ACTOR, 'c1', {})).resolves.toEqual({
      ok: true,
    });
    expect(d.consents.withdraw).toHaveBeenCalledWith('c1', {}, ACTOR);
    expect(d.em.findOne.mock.calls[0][1]).toEqual({
      id: 'c1',
      patientProfileId: PACIENTE,
    });
  });
});
