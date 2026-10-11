import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import {
  LINK_STATUS,
  ProfilesAffiliationsService,
} from './profiles-affiliations.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '22222222-2222-2222-2222-222222222222';
const SITE = '33333333-3333-3333-3333-333333333333';

/** Quien administra la organización de arriba. */
const orgAdmin = {
  id: 'user-org',
  roles: ['USER'],
  tenantIds: [TENANT],
} as any;

/** Un profesional cualquiera, sin organización propia. */
const doctor = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  tenantIds: [],
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    find: mockFn().mockResolvedValue([]),
    findOne: mockFn().mockResolvedValue(null),
    // La cuenta del profesional, para saber a quién avisarle. Por defecto la
    // tiene: un profesional sin cuenta es la excepción, no la regla.
    execute: mockFn().mockResolvedValue([{ user_id: 'user-med' }]),
  };
  em.fork = mockFn(() => em);
  tx.find = em.find;
  tx.findOne = em.findOne;

  const affiliationsRepo = {
    findByPractitionerInStatus: mockFn().mockResolvedValue([]),
    findBySites: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(null),
  };
  // Por defecto el profesional tiene cuenta: es el caso corriente. Las pruebas
  // que hablan del perfil sin cuenta lo devuelven a `null` explícitamente.
  const accountLinksRepo = {
    findActiveByPerson: mockFn().mockResolvedValue({ userId: 'user-med' }),
  };
  // Quién administra una organización se prueba en su propio spec; acá el doble
  // deja pasar salvo cuando la prueba habla justamente del permiso.
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
    // Por defecto la organización SÍ tiene quién decida: es el caso
    // corriente y deja que cada prueba declare lo contrario si le importa.
    hasAdministrators: mockFn().mockResolvedValue(true),
  };
  const memberships = {
    ensureCareMembership: mockFn().mockResolvedValue({
      membership: { id: 'memb-1' },
      creada: true,
    }),
  };
  const organizations = {
    findSite: mockFn().mockResolvedValue(null),
    findSitesByTenant: mockFn().mockResolvedValue([]),
    findSiteForTenant: mockFn().mockResolvedValue(null),
    hasAdministrators: tenantAdmin.hasAdministrators,
    assertCanAdminister: tenantAdmin.assertCanAdminister,
    ensureCareMembership: memberships.ensureCareMembership,
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El emisor de avisos: interesa CON QUÉ se lo llama, no que entregue.
  const notices = { emit: mockFn().mockResolvedValue({ delivered: true }) };

  const service = new ProfilesAffiliationsService(
    em,
    affiliationsRepo as any,
    accountLinksRepo as any,
    logger as any,
    notices as any,
    organizations as any,
  );
  return {
    service,
    em,
    tx,
    affiliationsRepo,
    accountLinksRepo,
    tenantAdmin,
    memberships,
    organizations,
    logger,
    avisos: notices,
  };
}

describe('ProfilesAffiliationsService (TP-2)', () => {
  /**
   * Antes de esto, declarar una afiliación la daba por cierta en el acto:
   * cualquiera podía decirse parte de una clínica y el sistema lo publicaba en
   * su trayectoria y en su perfil, sin que nadie de esa clínica se enterara.
   */
  describe('estadoInicial · con qué nace el vínculo', () => {
    it('sin sede nace DECLARADO, porque nadie lo aprobó', async () => {
      // Antes nacía «aprobado», y era escribir un hecho que no ocurrió: sin sede
      // el vínculo no nombra ninguna organización de la plataforma, así que no
      // hubo aprobación de nadie. `DECLARADO` lo dice sin mentir, y habilita igual.
      const d = build();

      await expect(
        d.service.initialState(d.em, undefined, doctor),
      ).resolves.toBe(LINK_STATUS.DECLARADO);
    });

    it('con una sede de una organización QUE TIENE dueño nace pendiente', async () => {
      const d = build();
      d.organizations.findSite.mockResolvedValue({
        id: SITE,
        managingTenantId: TENANT,
      });
      d.tenantAdmin.hasAdministrators.mockResolvedValue(true);

      await expect(d.service.initialState(d.em, SITE, doctor)).resolves.toBe(
        LINK_STATUS.PENDIENTE,
      );
    });

    it('con una sede de una organización SIN dueño nace declarado', async () => {
      // Los hospitales públicos y las cajas del padrón nunca van a registrarse,
      // así que no tienen a quién apruebe. Dejar el pedido pendiente condenaría
      // a sus médicos a esperar para siempre.
      const d = build();
      d.organizations.findSite.mockResolvedValue({
        id: SITE,
        managingTenantId: TENANT,
      });
      d.tenantAdmin.hasAdministrators.mockResolvedValue(false);

      await expect(d.service.initialState(d.em, SITE, doctor)).resolves.toBe(
        LINK_STATUS.DECLARADO,
      );
    });

    /**
     * Consultorio propio: pedirse permiso a uno mismo no es una regla, es un
     * trámite inventado — y dejaría trabado a quien atiende particular.
     */
    it('con una sede de su propia organización nace aprobado', async () => {
      const d = build();
      d.organizations.findSite.mockResolvedValue({
        id: SITE,
        managingTenantId: TENANT,
      });

      await expect(d.service.initialState(d.em, SITE, orgAdmin)).resolves.toBe(
        LINK_STATUS.APROBADO,
      );
    });

    it('una sede sin organización a cargo nace declarado', async () => {
      const d = build();
      d.organizations.findSite.mockResolvedValue({
        id: SITE,
        managingTenantId: undefined,
      });

      await expect(d.service.initialState(d.em, SITE, doctor)).resolves.toBe(
        LINK_STATUS.DECLARADO,
      );
    });

    it('una sede que no existe se dice, en vez de crear un vínculo al aire', async () => {
      const d = build();
      d.organizations.findSite.mockResolvedValue(null);

      await expect(
        d.service.initialState(d.em, SITE, doctor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('visiblesDeTerceros · la regla en un solo lugar', () => {
    it('a un tercero sólo se le muestran los vínculos aprobados', async () => {
      const d = build();

      await d.service.visibleThird(d.em, 'pp-1');

      expect(
        d.affiliationsRepo.findByPractitionerInStatus,
      ).toHaveBeenCalledWith(d.em, 'pp-1', [LINK_STATUS.APROBADO]);
    });
  });

  describe('listarSolicitudes · la bandeja de la organización', () => {
    it('exige administrar esa organización', async () => {
      const d = build();
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.listRequests(TENANT, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    /**
     * El filtro por organización va **en la consulta**: las sedes se resuelven
     * acotadas al tenant y las solicitudes salen de esa lista. Es la lección
     * del #156 — la cola de moderación se listaba sin filtro y un moderador
     * veía las denuncias de todas las clínicas.
     */
    it('busca las sedes acotadas al tenant y las solicitudes sobre esas sedes', async () => {
      const d = build();
      d.organizations.findSitesByTenant.mockResolvedValue([{ id: SITE }]);

      await d.service.listRequests(TENANT, orgAdmin);

      expect(d.organizations.findSitesByTenant).toHaveBeenCalledWith(
        d.em,
        TENANT,
      );
      expect(d.affiliationsRepo.findBySites).toHaveBeenCalledWith(
        d.em,
        [SITE],
        [LINK_STATUS.PENDIENTE],
      );
    });

    it('una organización sin sedes no tiene solicitudes que mostrar', async () => {
      const d = build();
      d.organizations.findSitesByTenant.mockResolvedValue([]);

      await expect(d.service.listRequests(TENANT, orgAdmin)).resolves.toEqual({
        items: [],
      });
    });
  });

  describe('aprobar y rechazar', () => {
    /** Una solicitud pendiente sobre una sede de esta organización. */
    function withRequest(d: ReturnType<typeof build>): any {
      const request = {
        id: 'af-1',
        practitionerProfileId: 'pp-1',
        practiceSiteId: SITE,
        statusConceptId: LINK_STATUS.PENDIENTE,
      };
      d.affiliationsRepo.findById.mockResolvedValue(request);
      d.organizations.findSiteForTenant.mockResolvedValue({
        id: SITE,
        managingTenantId: TENANT,
      });
      return request;
    }

    it('el motivo del rechazo SE GUARDA, no sólo se registra', async () => {
      // La columna existe desde v4.1.9 y nadie la escribía: el motivo viajaba
      // sólo al log, así que un rechazo era mudo para quien lo recibe.
      const d = build();
      const request = withRequest(d);

      await d.service.reject(
        TENANT,
        'af-1',
        { reason: '  No figura en nuestro plantel  ' } as never,
        orgAdmin,
      );

      expect(request.decisionReasonText).toBe('No figura en nuestro plantel');
    });

    it('un motivo en blanco no ensucia la columna', async () => {
      const d = build();
      const request = withRequest(d);

      await d.service.reject(
        TENANT,
        'af-1',
        { reason: '   ' } as never,
        orgAdmin,
      );

      expect(request.decisionReasonText).toBeUndefined();
    });

    it('revocar da de baja un vínculo YA APROBADO', async () => {
      // El concepto existía desde v4.1.9 y nada lo escribía: aprobar era
      // irreversible por omisión, no por decisión.
      const d = build();
      const request = withRequest(d);
      request.statusConceptId = LINK_STATUS.APROBADO;

      await d.service.revoke(
        TENANT,
        'af-1',
        { reason: 'Terminó su contrato' } as never,
        orgAdmin,
      );

      expect(request.statusConceptId).toBe(LINK_STATUS.REVOCADO);
      expect(request.decisionReasonText).toBe('Terminó su contrato');
    });

    it('no se puede revocar lo que todavía está pendiente', async () => {
      const d = build();
      withRequest(d);

      await expect(
        d.service.revoke(TENANT, 'af-1', {} as never, orgAdmin),
      ).rejects.toThrow(/aprobado/);
    });

    it('aprobar le avisa al médico, y le dice qué cambia para él', async () => {
      // Enterarse de que lo aprobaron sin saber que ya puede publicar agenda
      // deja el aviso a mitad de camino.
      const d = build();
      withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      const [notice] = d.avisos.emit.mock.calls[0];
      expect(notice.kind).toBe('AFFILIATION_APPROVED');
      expect(notice.recipientUserId).toBe('user-med');
      expect(notice.bodyText).toMatch(/publicar su agenda/);
    });

    it('el aviso del rechazo LLEVA el motivo', async () => {
      const d = build();
      withRequest(d);

      await d.service.reject(
        TENANT,
        'af-1',
        { reason: 'No figura en nuestro plantel' } as never,
        orgAdmin,
      );

      const [notice] = d.avisos.emit.mock.calls[0];
      expect(notice.kind).toBe('AFFILIATION_REJECTED');
      expect(notice.bodyText).toContain('No figura en nuestro plantel');
    });

    it('el aviso de la revocación aclara que las citas siguen', async () => {
      const d = build();
      const request = withRequest(d);
      request.statusConceptId = LINK_STATUS.APROBADO;

      await d.service.revoke(TENANT, 'af-1', {} as never, orgAdmin);

      const [notice] = d.avisos.emit.mock.calls[0];
      expect(notice.bodyText).toMatch(/ya confirmó siguen en pie/);
    });

    it('un profesional sin cuenta no rompe la decisión', async () => {
      // Existe —lo cargó una organización— y no hay a dónde mandarle el aviso.
      // No es un error: la decisión se toma igual.
      const d = build();
      const request = withRequest(d);
      d.em.execute.mockResolvedValue([]);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(request.statusConceptId).toBe(LINK_STATUS.APROBADO);
      expect(d.avisos.emit).not.toHaveBeenCalled();
    });

    it('si el aviso falla, la decisión YA está tomada', async () => {
      // Emitir va después de la transacción a propósito: un fallo de mensajería
      // no puede revertir una aprobación que la organización ya decidió.
      const d = build();
      const request = withRequest(d);
      d.avisos.emit.mockResolvedValue({
        delivered: false,
        skippedReason: 'canal caído',
      });

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(request.statusConceptId).toBe(LINK_STATUS.APROBADO);
    });

    it('aprobar deja el vínculo activo', async () => {
      const d = build();
      const request = withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(request.statusConceptId).toBe(LINK_STATUS.APROBADO);
    });

    it('rechazar deja el vínculo fuera de pie', async () => {
      const d = build();
      const request = withRequest(d);

      await d.service.reject(
        TENANT,
        'af-1',
        { reason: 'No trabaja acá' } as any,
        orgAdmin,
      );

      expect(request.statusConceptId).toBe(LINK_STATUS.RECHAZADO);
    });

    /**
     * El criterio e2e del prompt: el administrador de A no decide sobre las
     * solicitudes de B. Y responde 404 y no 403 — para quien administra esta
     * organización, la solicitud de otra sencillamente no existe; decir
     * «prohibido» confirmaría que existe, que es la mitad de lo que un sondeo
     * busca.
     */
    it('una solicitud de otra organización no existe para ésta', async () => {
      const d = build();
      d.affiliationsRepo.findById.mockResolvedValue({
        id: 'af-1',
        practiceSiteId: SITE,
        statusConceptId: LINK_STATUS.PENDIENTE,
      });
      // La sede no aparece cuando se la busca acotada a ESTE tenant.
      d.organizations.findSiteForTenant.mockResolvedValue(null);

      await expect(
        d.service.approve(OTHER_TENANT, 'af-1', orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('la sede se busca siempre acotada a la organización que decide', async () => {
      const d = build();
      withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(d.organizations.findSiteForTenant).toHaveBeenCalledWith(
        d.tx,
        SITE,
        TENANT,
      );
    });

    it('una solicitud ya resuelta no se vuelve a decidir', async () => {
      const d = build();
      const request = withRequest(d);
      request.statusConceptId = LINK_STATUS.APROBADO;

      await expect(
        d.service.approve(TENANT, 'af-1', orgAdmin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una solicitud inexistente se dice como tal', async () => {
      const d = build();
      d.affiliationsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.approve(TENANT, 'af-x', orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('decidir exige administrar la organización', async () => {
      const d = build();
      withRequest(d);
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.approve(TENANT, 'af-1', orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  /**
   * El eslabón que faltaba (MAC-VINCULO).
   *
   * Aprobar cambiaba el estado del vínculo y nada más, así que el médico seguía
   * sin poder publicar agenda en esa organización: el claim `tenants` del token
   * sale de las membresías, y sin una el interceptor de contexto lo rechazaba
   * antes de que la regla del vínculo llegara a mirarlo. La aprobación se
   * quedaba sin efecto.
   */
  describe('la aprobación concede membresía', () => {
    /** Una solicitud pendiente sobre una sede de esta organización. */
    function withRequest(d: ReturnType<typeof build>): any {
      const request = {
        id: 'af-1',
        practitionerProfileId: 'pp-1',
        practiceSiteId: SITE,
        statusConceptId: LINK_STATUS.PENDIENTE,
      };
      d.affiliationsRepo.findById.mockResolvedValue(request);
      d.organizations.findSiteForTenant.mockResolvedValue({
        id: SITE,
        managingTenantId: TENANT,
      });
      return request;
    }

    it('aprobar le da al profesional la llave de esa organización', async () => {
      const d = build();
      withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(d.accountLinksRepo.findActiveByPerson).toHaveBeenCalledWith(
        d.tx,
        'pp-1',
      );
      expect(d.memberships.ensureCareMembership).toHaveBeenCalledWith(d.tx, {
        userId: 'user-med',
        tenantId: TENANT,
        actorUserId: orgAdmin.id,
      });
    });

    /**
     * La membresía se escribe en la MISMA transacción que el estado: si una
     * fallara y la otra no, la organización habría aprobado a alguien que no
     * puede entrar, o al revés.
     */
    it('la membresía viaja en la transacción de la decisión', async () => {
      const d = build();
      withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      const [tx] = d.memberships.ensureCareMembership.mock.calls.at(-1);
      expect(tx).toBe(d.tx);
    });

    /**
     * Un perfil cargado por la organización puede no tener todavía una cuenta
     * que lo encarne. La decisión de la organización vale igual: negar la
     * aprobación por eso sería dejarla sin efecto por un motivo que no es suyo.
     */
    it('un profesional sin cuenta se aprueba igual, y queda avisado', async () => {
      const d = build();
      const request = withRequest(d);
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      expect(request.statusConceptId).toBe(LINK_STATUS.APROBADO);
      expect(d.memberships.ensureCareMembership).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    /** Rechazar no abre ninguna puerta: es la mitad del sentido de rechazar. */
    it('rechazar no concede nada', async () => {
      const d = build();
      withRequest(d);

      await d.service.reject(
        TENANT,
        'af-1',
        { reason: 'No trabaja acá' } as any,
        orgAdmin,
      );

      expect(d.accountLinksRepo.findActiveByPerson).not.toHaveBeenCalled();
      expect(d.memberships.ensureCareMembership).not.toHaveBeenCalled();
    });

    /**
     * La membresía se concede sobre la organización que decide, no sobre la que
     * el vínculo nombre: es la misma acotación que ya protege a la sede.
     */
    it('la membresía es de la organización que aprueba', async () => {
      const d = build();
      withRequest(d);

      await d.service.approve(TENANT, 'af-1', orgAdmin);

      const [, params] = d.memberships.ensureCareMembership.mock.calls.at(-1);
      expect(params.tenantId).toBe(TENANT);
    });
  });

  describe('avisarDelPedido · la bandeja deja de depender de que alguien mire', () => {
    /** Deja al tenant con los administradores indicados. */
    function withAdmins(d: ReturnType<typeof build>, howMany: number): void {
      d.em.execute.mockImplementation(async (sql: string) =>
        sql.includes('tenant_memberships')
          ? Array.from({ length: howMany }, (_, i) => ({
              user_id: `admin-${i}`,
            }))
          : [{ user_id: 'user-med' }],
      );
    }

    it('le avisa a CADA administrador de la organización', async () => {
      // Son exactamente quienes pueden decidir. Mandárselo a todo el personal
      // sería avisarle a gente que sólo puede mirar.
      const d = build();
      withAdmins(d, 3);

      await d.service.orderNotify(TENANT, 'af-1', 'pp-1');

      expect(d.avisos.emit).toHaveBeenCalledTimes(3);
      const [notice] = d.avisos.emit.mock.calls[0];
      expect(notice.kind).toBe('AFFILIATION_REQUESTED');
      expect(notice.tenantId).toBe(TENANT);
    });

    it('sin administradores no avisa a nadie, y no falla', async () => {
      // Es el hospital público del padrón: no hay quién decida, y por eso el
      // vínculo nace declarado en vez de pendiente.
      const d = build();
      withAdmins(d, 0);

      await d.service.orderNotify(TENANT, 'af-1', 'pp-1');

      expect(d.avisos.emit).not.toHaveBeenCalled();
    });

    it('el aviso dice QUIÉN pide, no «un profesional» a secas', async () => {
      const d = build();
      d.em.execute.mockImplementation(async (sql: string) =>
        sql.includes('tenant_memberships') ? [{ user_id: 'admin-0' }] : [],
      );
      d.em.find.mockImplementation(async (entity: any) => {
        const name = entity?.name ?? String(entity);
        return name.includes('Persons')
          ? [{ id: 'pp-1', displayName: 'Ana Rossell' }]
          : [];
      });

      await d.service.orderNotify(TENANT, 'af-1', 'pp-1');

      const [notice] = d.avisos.emit.mock.calls[0];
      expect(notice.bodyText).toContain('Ana Rossell');
    });
  });
});
