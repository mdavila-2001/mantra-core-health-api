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
  ESTADO_DEL_VINCULO,
  ProfilesAffiliationsService,
} from './profiles-affiliations.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTRO_TENANT = '22222222-2222-2222-2222-222222222222';
const SEDE = '33333333-3333-3333-3333-333333333333';

/** Quien administra la organización de arriba. */
const orgAdmin = {
  id: 'user-org',
  roles: ['USER'],
  tenantIds: [TENANT],
} as any;

/** Un profesional cualquiera, sin organización propia. */
const medico = {
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
    ensureMembresiaAsistencial: mockFn().mockResolvedValue({
      membership: { id: 'memb-1' },
      creada: true,
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El emisor de avisos: interesa CON QUÉ se lo llama, no que entregue.
  const avisos = { emit: mockFn().mockResolvedValue({ delivered: true }) };

  const service = new ProfilesAffiliationsService(
    em,
    affiliationsRepo as any,
    accountLinksRepo as any,
    tenantAdmin as any,
    memberships as any,
    logger as any,
    avisos as any,
  );
  return {
    service,
    em,
    tx,
    affiliationsRepo,
    accountLinksRepo,
    tenantAdmin,
    memberships,
    logger,
    avisos,
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
        d.service.estadoInicial(d.em, undefined, medico),
      ).resolves.toBe(ESTADO_DEL_VINCULO.DECLARADO);
    });

    it('con una sede de una organización QUE TIENE dueño nace pendiente', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: TENANT });
      d.tenantAdmin.hasAdministrators.mockResolvedValue(true);

      await expect(d.service.estadoInicial(d.em, SEDE, medico)).resolves.toBe(
        ESTADO_DEL_VINCULO.PENDIENTE,
      );
    });

    it('con una sede de una organización SIN dueño nace declarado', async () => {
      // Los hospitales públicos y las cajas del padrón nunca van a registrarse,
      // así que no tienen a quién apruebe. Dejar el pedido pendiente condenaría
      // a sus médicos a esperar para siempre.
      const d = build();
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: TENANT });
      d.tenantAdmin.hasAdministrators.mockResolvedValue(false);

      await expect(d.service.estadoInicial(d.em, SEDE, medico)).resolves.toBe(
        ESTADO_DEL_VINCULO.DECLARADO,
      );
    });

    /**
     * Consultorio propio: pedirse permiso a uno mismo no es una regla, es un
     * trámite inventado — y dejaría trabado a quien atiende particular.
     */
    it('con una sede de su propia organización nace aprobado', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: TENANT });

      await expect(d.service.estadoInicial(d.em, SEDE, orgAdmin)).resolves.toBe(
        ESTADO_DEL_VINCULO.APROBADO,
      );
    });

    it('una sede sin organización a cargo nace declarado', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: undefined });

      await expect(d.service.estadoInicial(d.em, SEDE, medico)).resolves.toBe(
        ESTADO_DEL_VINCULO.DECLARADO,
      );
    });

    it('una sede que no existe se dice, en vez de crear un vínculo al aire', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue(null);

      await expect(
        d.service.estadoInicial(d.em, SEDE, medico),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('visiblesDeTerceros · la regla en un solo lugar', () => {
    it('a un tercero sólo se le muestran los vínculos aprobados', async () => {
      const d = build();

      await d.service.visiblesDeTerceros(d.em, 'pp-1');

      expect(
        d.affiliationsRepo.findByPractitionerInStatus,
      ).toHaveBeenCalledWith(d.em, 'pp-1', [ESTADO_DEL_VINCULO.APROBADO]);
    });
  });

  describe('listarSolicitudes · la bandeja de la organización', () => {
    it('exige administrar esa organización', async () => {
      const d = build();
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.listarSolicitudes(TENANT, orgAdmin),
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
      d.em.find.mockResolvedValue([{ id: SEDE }]);

      await d.service.listarSolicitudes(TENANT, orgAdmin);

      const [, criterio] = d.em.find.mock.calls[0] as [unknown, any];
      expect(criterio).toEqual({ managingTenantId: TENANT });
      expect(d.affiliationsRepo.findBySites).toHaveBeenCalledWith(
        d.em,
        [SEDE],
        [ESTADO_DEL_VINCULO.PENDIENTE],
      );
    });

    it('una organización sin sedes no tiene solicitudes que mostrar', async () => {
      const d = build();
      d.em.find.mockResolvedValue([]);

      await expect(
        d.service.listarSolicitudes(TENANT, orgAdmin),
      ).resolves.toEqual({ items: [] });
    });
  });

  describe('aprobar y rechazar', () => {
    /** Una solicitud pendiente sobre una sede de esta organización. */
    function conSolicitud(d: ReturnType<typeof build>): any {
      const solicitud = {
        id: 'af-1',
        practitionerProfileId: 'pp-1',
        practiceSiteId: SEDE,
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      };
      d.affiliationsRepo.findById.mockResolvedValue(solicitud);
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: TENANT });
      return solicitud;
    }

    it('el motivo del rechazo SE GUARDA, no sólo se registra', async () => {
      // La columna existe desde v4.1.9 y nadie la escribía: el motivo viajaba
      // sólo al log, así que un rechazo era mudo para quien lo recibe.
      const d = build();
      const solicitud = conSolicitud(d);

      await d.service.rechazar(
        TENANT,
        'af-1',
        { reason: '  No figurás en nuestro plantel  ' } as never,
        orgAdmin,
      );

      expect(solicitud.decisionReasonText).toBe(
        'No figurás en nuestro plantel',
      );
    });

    it('un motivo en blanco no ensucia la columna', async () => {
      const d = build();
      const solicitud = conSolicitud(d);

      await d.service.rechazar(
        TENANT,
        'af-1',
        { reason: '   ' } as never,
        orgAdmin,
      );

      expect(solicitud.decisionReasonText).toBeUndefined();
    });

    it('revocar da de baja un vínculo YA APROBADO', async () => {
      // El concepto existía desde v4.1.9 y nada lo escribía: aprobar era
      // irreversible por omisión, no por decisión.
      const d = build();
      const solicitud = conSolicitud(d);
      solicitud.statusConceptId = ESTADO_DEL_VINCULO.APROBADO;

      await d.service.revocar(
        TENANT,
        'af-1',
        { reason: 'Terminó su contrato' } as never,
        orgAdmin,
      );

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.REVOCADO);
      expect(solicitud.decisionReasonText).toBe('Terminó su contrato');
    });

    it('no se puede revocar lo que todavía está pendiente', async () => {
      const d = build();
      conSolicitud(d);

      await expect(
        d.service.revocar(TENANT, 'af-1', {} as never, orgAdmin),
      ).rejects.toThrow(/aprobado/);
    });

    it('aprobar le avisa al médico, y le dice qué cambia para él', async () => {
      // Enterarse de que lo aprobaron sin saber que ya puede publicar agenda
      // deja el aviso a mitad de camino.
      const d = build();
      conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      const [aviso] = d.avisos.emit.mock.calls[0];
      expect(aviso.kind).toBe('AFFILIATION_APPROVED');
      expect(aviso.recipientUserId).toBe('user-med');
      expect(aviso.bodyText).toMatch(/publicar tu agenda/);
    });

    it('el aviso del rechazo LLEVA el motivo', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.rechazar(
        TENANT,
        'af-1',
        { reason: 'No figurás en nuestro plantel' } as never,
        orgAdmin,
      );

      const [aviso] = d.avisos.emit.mock.calls[0];
      expect(aviso.kind).toBe('AFFILIATION_REJECTED');
      expect(aviso.bodyText).toContain('No figurás en nuestro plantel');
    });

    it('el aviso de la revocación aclara que las citas siguen', async () => {
      const d = build();
      const solicitud = conSolicitud(d);
      solicitud.statusConceptId = ESTADO_DEL_VINCULO.APROBADO;

      await d.service.revocar(TENANT, 'af-1', {} as never, orgAdmin);

      const [aviso] = d.avisos.emit.mock.calls[0];
      expect(aviso.bodyText).toMatch(/ya confirmaste siguen en pie/);
    });

    it('un profesional sin cuenta no rompe la decisión', async () => {
      // Existe —lo cargó una organización— y no hay a dónde mandarle el aviso.
      // No es un error: la decisión se toma igual.
      const d = build();
      const solicitud = conSolicitud(d);
      d.em.execute.mockResolvedValue([]);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.APROBADO);
      expect(d.avisos.emit).not.toHaveBeenCalled();
    });

    it('si el aviso falla, la decisión YA está tomada', async () => {
      // Emitir va después de la transacción a propósito: un fallo de mensajería
      // no puede revertir una aprobación que la organización ya decidió.
      const d = build();
      const solicitud = conSolicitud(d);
      d.avisos.emit.mockResolvedValue({
        delivered: false,
        skippedReason: 'canal caído',
      });

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.APROBADO);
    });

    it('aprobar deja el vínculo activo', async () => {
      const d = build();
      const solicitud = conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.APROBADO);
    });

    it('rechazar deja el vínculo fuera de pie', async () => {
      const d = build();
      const solicitud = conSolicitud(d);

      await d.service.rechazar(
        TENANT,
        'af-1',
        { reason: 'No trabaja acá' } as any,
        orgAdmin,
      );

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.RECHAZADO);
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
        practiceSiteId: SEDE,
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      });
      // La sede no aparece cuando se la busca acotada a ESTE tenant.
      d.em.findOne.mockResolvedValue(null);

      await expect(
        d.service.aprobar(OTRO_TENANT, 'af-1', orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('la sede se busca siempre acotada a la organización que decide', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      const [, criterio] = d.em.findOne.mock.calls.at(-1) as [unknown, any];
      expect(criterio).toEqual({ id: SEDE, managingTenantId: TENANT });
    });

    it('una solicitud ya resuelta no se vuelve a decidir', async () => {
      const d = build();
      const solicitud = conSolicitud(d);
      solicitud.statusConceptId = ESTADO_DEL_VINCULO.APROBADO;

      await expect(
        d.service.aprobar(TENANT, 'af-1', orgAdmin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una solicitud inexistente se dice como tal', async () => {
      const d = build();
      d.affiliationsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.aprobar(TENANT, 'af-x', orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('decidir exige administrar la organización', async () => {
      const d = build();
      conSolicitud(d);
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.aprobar(TENANT, 'af-1', orgAdmin),
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
    function conSolicitud(d: ReturnType<typeof build>): any {
      const solicitud = {
        id: 'af-1',
        practitionerProfileId: 'pp-1',
        practiceSiteId: SEDE,
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      };
      d.affiliationsRepo.findById.mockResolvedValue(solicitud);
      d.em.findOne.mockResolvedValue({ id: SEDE, managingTenantId: TENANT });
      return solicitud;
    }

    it('aprobar le da al profesional la llave de esa organización', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      expect(d.accountLinksRepo.findActiveByPerson).toHaveBeenCalledWith(
        d.tx,
        'pp-1',
      );
      expect(d.memberships.ensureMembresiaAsistencial).toHaveBeenCalledWith(
        d.tx,
        { userId: 'user-med', tenantId: TENANT, actorUserId: orgAdmin.id },
      );
    });

    /**
     * La membresía se escribe en la MISMA transacción que el estado: si una
     * fallara y la otra no, la organización habría aprobado a alguien que no
     * puede entrar, o al revés.
     */
    it('la membresía viaja en la transacción de la decisión', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      const [tx] = d.memberships.ensureMembresiaAsistencial.mock.calls.at(-1);
      expect(tx).toBe(d.tx);
    });

    /**
     * Un perfil cargado por la organización puede no tener todavía una cuenta
     * que lo encarne. La decisión de la organización vale igual: negar la
     * aprobación por eso sería dejarla sin efecto por un motivo que no es suyo.
     */
    it('un profesional sin cuenta se aprueba igual, y queda avisado', async () => {
      const d = build();
      const solicitud = conSolicitud(d);
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      expect(solicitud.statusConceptId).toBe(ESTADO_DEL_VINCULO.APROBADO);
      expect(d.memberships.ensureMembresiaAsistencial).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    /** Rechazar no abre ninguna puerta: es la mitad del sentido de rechazar. */
    it('rechazar no concede nada', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.rechazar(
        TENANT,
        'af-1',
        { reason: 'No trabaja acá' } as any,
        orgAdmin,
      );

      expect(d.accountLinksRepo.findActiveByPerson).not.toHaveBeenCalled();
      expect(d.memberships.ensureMembresiaAsistencial).not.toHaveBeenCalled();
    });

    /**
     * La membresía se concede sobre la organización que decide, no sobre la que
     * el vínculo nombre: es la misma acotación que ya protege a la sede.
     */
    it('la membresía es de la organización que aprueba', async () => {
      const d = build();
      conSolicitud(d);

      await d.service.aprobar(TENANT, 'af-1', orgAdmin);

      const [, params] =
        d.memberships.ensureMembresiaAsistencial.mock.calls.at(-1);
      expect(params.tenantId).toBe(TENANT);
    });
  });
});
