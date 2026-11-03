import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { PROF } from '../../profiles.concepts';
import { RegistrationAffiliationsService } from './registration-affiliations.service';
import { LINK_STATUS } from './profiles-affiliations.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PROFILE = 'prof-1';

function build(
  organizations: {
    slug: string;
    practiceId: string;
    name: string;
    siteId: string | null;
  }[],
) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { fork: () => ({}) };
  let seq = 0;
  const port = {
    findPublicOrganizations: mockFn((_: unknown, slugs: string[]) =>
      Promise.resolve(organizations.filter((o) => slugs.includes(o.slug))),
    ),
    findSite: mockFn((_: unknown, siteId: string) =>
      Promise.resolve({ id: siteId, managingTenantId: `tenant-of-${siteId}` }),
    ),
  };
  const repo = {
    create: mockFn((_: unknown, data: any) => ({ id: `af-${++seq}`, ...data })),
  };
  const affiliations = {
    initialState: mockFn().mockResolvedValue(LINK_STATUS.PENDIENTE),
    orderNotify: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new RegistrationAffiliationsService(
    em as never,
    port as never,
    repo as never,
    affiliations as never,
    logger as never,
  );
  return { service, tx, port, repo, affiliations, logger };
}

const foianini = {
  slug: 'clinica-foianini',
  practiceId: 'pr-1',
  name: 'Clínica Foianini',
  siteId: 'site-1',
};
const sinSede = {
  slug: 'centro-nuevo',
  practiceId: 'pr-2',
  name: 'Centro Nuevo',
  siteId: null,
};

describe('RegistrationAffiliationsService', () => {
  it('crea un vínculo atado a la sede de cada organización, con el estado de siempre', async () => {
    const d = build([foianini]);

    const created = await d.service.requestWithin(d.tx as never, {
      practitionerProfileId: PROFILE,
      organizationSlugs: ['clinica-foianini'],
      actorUserId: 'user-1',
    });

    expect(d.repo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        practitionerProfileId: PROFILE,
        organizationName: 'Clínica Foianini',
        practiceSiteId: 'site-1',
        affiliationTypeConceptId: PROF.AFFILIATION_TYPE_EMPLOYMENT,
        statusConceptId: LINK_STATUS.PENDIENTE,
        actorUserId: 'user-1',
      }),
    );
    expect(created).toEqual([
      {
        id: 'af-1',
        practiceId: 'pr-1',
        practiceSiteId: 'site-1',
        statusConceptId: LINK_STATUS.PENDIENTE,
      },
    ]);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('calcula el estado SIN organizaciones propias: nadie aprueba su propio pedido al registrarse', async () => {
    const d = build([foianini]);

    await d.service.requestWithin(d.tx as never, {
      practitionerProfileId: PROFILE,
      organizationSlugs: ['clinica-foianini'],
      actorUserId: 'user-1',
    });

    expect(d.affiliations.initialState).toHaveBeenCalledWith(d.tx, 'site-1', {
      tenantIds: [],
    });
  });

  it('una organización sin sede queda declarada: no hay bandeja donde pedirlo', async () => {
    const d = build([sinSede]);

    const [created] = await d.service.requestWithin(d.tx as never, {
      practitionerProfileId: PROFILE,
      organizationSlugs: ['centro-nuevo'],
      actorUserId: 'user-1',
    });

    expect(created.statusConceptId).toBe(LINK_STATUS.DECLARADO);
    expect(d.affiliations.initialState).not.toHaveBeenCalled();
  });

  it('rechaza todo antes de escribir si algún slug ya no nombra una organización pública', async () => {
    const d = build([foianini]);

    await expect(
      d.service.requestWithin(d.tx as never, {
        practitionerProfileId: PROFILE,
        organizationSlugs: ['clinica-foianini', 'no-existe'],
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('no duplica la misma organización elegida dos veces', async () => {
    const d = build([foianini]);

    const created = await d.service.requestWithin(d.tx as never, {
      practitionerProfileId: PROFILE,
      organizationSlugs: ['clinica-foianini', ' clinica-foianini '],
      actorUserId: 'user-1',
    });

    expect(created).toHaveLength(1);
  });

  it('sin instituciones no consulta nada', async () => {
    const d = build([]);

    await expect(
      d.service.requestWithin(d.tx as never, {
        practitionerProfileId: PROFILE,
        organizationSlugs: [],
        actorUserId: 'user-1',
      }),
    ).resolves.toEqual([]);
    expect(d.port.findPublicOrganizations).not.toHaveBeenCalled();
  });

  describe('notifyPending', () => {
    it('avisa sólo a las organizaciones con un pedido pendiente', async () => {
      const d = build([]);

      await d.service.notifyPending(PROFILE, [
        {
          id: 'af-1',
          practiceId: 'pr-1',
          practiceSiteId: 'site-1',
          statusConceptId: LINK_STATUS.PENDIENTE,
        },
        {
          id: 'af-2',
          practiceId: 'pr-2',
          practiceSiteId: null,
          statusConceptId: LINK_STATUS.DECLARADO,
        },
      ]);

      expect(d.affiliations.orderNotify).toHaveBeenCalledTimes(1);
      expect(d.affiliations.orderNotify).toHaveBeenCalledWith(
        'tenant-of-site-1',
        'af-1',
        PROFILE,
      );
    });

    it('nunca lanza: el vínculo ya existe y un aviso fallido no lo deshace', async () => {
      const d = build([]);
      d.affiliations.orderNotify.mockRejectedValue(
        new Error('mensajería caída'),
      );

      await expect(
        d.service.notifyPending(PROFILE, [
          {
            id: 'af-1',
            practiceId: 'pr-1',
            practiceSiteId: 'site-1',
            statusConceptId: LINK_STATUS.PENDIENTE,
          },
        ]),
      ).resolves.toBeUndefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });
  });
});
