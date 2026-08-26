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
  };
  em.fork = mockFn(() => em);
  tx.find = em.find;
  tx.findOne = em.findOne;

  const affiliationsRepo = {
    findByPractitionerInStatus: mockFn().mockResolvedValue([]),
    findBySites: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(null),
  };
  // Quién administra una organización se prueba en su propio spec; acá el doble
  // deja pasar salvo cuando la prueba habla justamente del permiso.
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
    // Por defecto la organización SÍ tiene quién decida: es el caso
    // corriente y deja que cada prueba declare lo contrario si le importa.
    hasAdministrators: mockFn().mockResolvedValue(true),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ProfilesAffiliationsService(
    em,
    affiliationsRepo as any,
    tenantAdmin as any,
    logger as any,
  );
  return { service, em, tx, affiliationsRepo, tenantAdmin };
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
});
