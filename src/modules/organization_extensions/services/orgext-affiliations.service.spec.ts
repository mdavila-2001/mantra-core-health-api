import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextAffiliationsService } from './orgext-affiliations.service';
import { ORGEXT } from '../organization_extensions.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { OrganizationExtensionsErrorReason } from '../organization_extensions.error-reasons';

const T1 = 't1';
const T2 = 't2';
const T3 = 't3';
const NOT_AVAILABLE =
  OrganizationExtensionsErrorReason.ORGEXT_RESOURCE_NOT_AVAILABLE;

/** Administrador con alcance autorizado sobre T1 y T2. */
const actor = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1, T2],
} as any;

/** Ejecuta `fn` con T1 como tenant activo del request. */
const inTenant = <T>(fn: () => Promise<T>, tenantId = T1): Promise<T> =>
  runWithTenant(tenantId, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

/** Pertenencia de los UUID ajenos del cuerpo: por defecto todos son del tenant. */
function referencesDouble() {
  return {
    practiceInTenants: mockFn().mockResolvedValue(true),
    practiceSiteInTenants: mockFn().mockResolvedValue(true),
    healthcareServiceInTenants: mockFn().mockResolvedValue(true),
    clinicalUnitInTenants: mockFn().mockResolvedValue(true),
    publicProfileInTenants: mockFn().mockResolvedValue(true),
    fileInTenants: mockFn().mockResolvedValue(true),
    dataUseAgreementInTenants: mockFn().mockResolvedValue(true),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const affiliationsRepo = {
    findByIdForParty: mockFn(),
    findActiveDuplicate: mockFn(),
    create: mockFn(),
  };
  const boundariesRepo = { countActiveForTenant: mockFn() };
  const references = referencesDouble();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextAffiliationsService(
    em as any,
    affiliationsRepo,
    boundariesRepo as any,
    references as any,
    logger as any,
  );
  return { service, tx, affiliationsRepo, boundariesRepo, references };
}

const baseDto = { primaryTenantId: 't1', participatingTenantId: 't2' };

describe('OrgextAffiliationsService', () => {
  describe('declare (UC-22-07)', () => {
    it('rejects when primary equals participating tenant', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.declare(
            { primaryTenantId: 't1', participatingTenantId: 't1' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when the participating tenant has no active data boundary', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(0);
      await expect(
        inTenant(() => d.service.declare(baseDto as any, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate active affiliation (conflict)', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue({ id: 'a0' });
      await expect(
        inTenant(() => d.service.declare(baseDto as any, actor)),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('una sede, un servicio o un DUA de un tercero responde 404 uniforme y no declara nada', async () => {
      for (const [field, check] of [
        ['hostPracticeSiteId', 'practiceSiteInTenants'],
        ['healthcareServiceId', 'healthcareServiceInTenants'],
        ['dataUseAgreementId', 'dataUseAgreementInTenants'],
      ] as const) {
        const d = build();
        d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
        d.affiliationsRepo.findActiveDuplicate.mockResolvedValue(null);
        d.references[check].mockResolvedValue(false);

        const error = await rejection(
          inTenant(() =>
            d.service.declare({ ...baseDto, [field]: 'x-t3' } as any, actor),
          ),
        );

        expect(error.reason).toBe(NOT_AVAILABLE);
        expect(error.details).toBeUndefined();
        // Sólo las dos partes de la afiliación cuentan como dueños válidos.
        expect(d.references[check]).toHaveBeenCalledWith(d.tx, 'x-t3', [
          T1,
          T2,
        ]);
        expect(d.affiliationsRepo.create).not.toHaveBeenCalled();
      }
    });

    it('creates the affiliation when preconditions hold', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue(null);
      const affiliation = {
        id: 'a1',
        primaryTenantId: 't1',
        participatingTenantId: 't2',
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        createdAt: new Date(),
      };
      d.affiliationsRepo.create.mockReturnValue(affiliation);

      const res = await inTenant(() => d.service.declare(baseDto, actor));

      expect(res.status).toBe(ORGEXT.AFFILIATION_ACTIVE);
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('terminate (UC-22-09)', () => {
    it('throws when the affiliation does not exist', async () => {
      const d = build();
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(null);
      await expect(
        inTenant(() => d.service.terminate('missing', actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the affiliation is not active', async () => {
      const d = build();
      d.affiliationsRepo.findByIdForParty.mockResolvedValue({
        id: 'a1',
        primaryTenantId: T1,
        participatingTenantId: T2,
        statusConceptId: ORGEXT.AFFILIATION_TERMINATED,
      });
      await expect(
        inTenant(() => d.service.terminate('a1', actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('terminates an active affiliation and stamps valid_to', async () => {
      const d = build();
      const affiliation = {
        id: 'a1',
        primaryTenantId: T1,
        participatingTenantId: T2,
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        validTo: undefined as Date | undefined,
        updatedAt: new Date(),
      };
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(affiliation);

      const res = await inTenant(() => d.service.terminate('a1', actor));

      expect(res).toEqual({ ok: true, status: ORGEXT.AFFILIATION_TERMINATED });
      expect(affiliation.statusConceptId).toBe(ORGEXT.AFFILIATION_TERMINATED);
      expect(affiliation.validTo).toBeInstanceOf(Date);
    });
  });

  describe('alcance de tenant (ORGEXT-01)', () => {
    const activeAffiliation = (primary: string, participating: string) => ({
      id: 'a9',
      primaryTenantId: primary,
      participatingTenantId: participating,
      statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
      validTo: undefined as Date | undefined,
      updatedAt: new Date(),
    });

    it('declare toma como primario el tenant del contexto y rechaza el del cuerpo', async () => {
      const d = build();

      const error = await rejection(
        inTenant(() =>
          d.service.declare(
            { primaryTenantId: T2, participatingTenantId: T1 },
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.boundariesRepo.countActiveForTenant).not.toHaveBeenCalled();
      expect(d.affiliationsRepo.create).not.toHaveBeenCalled();
    });

    it('declare exige alcance del actor sobre el tenant participante', async () => {
      const d = build();
      const scopedToT1Only = { ...actor, tenantIds: [T1] };

      const error = await rejection(
        inTenant(() =>
          d.service.declare(
            { primaryTenantId: T1, participatingTenantId: T3 },
            scopedToT1Only,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.affiliationsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('declare valida ambos extremos y persiste el primario del contexto', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue(null);
      d.affiliationsRepo.create.mockReturnValue({
        id: 'a1',
        primaryTenantId: T1,
        participatingTenantId: T2,
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        createdAt: new Date(),
      });

      await inTenant(() => d.service.declare(baseDto, actor));

      expect(d.boundariesRepo.countActiveForTenant).toHaveBeenCalledWith(
        d.tx,
        T2,
        ORGEXT.BOUNDARY_ACTIVE,
      );
      expect(d.affiliationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          primaryTenantId: T1,
          participatingTenantId: T2,
        }),
      );
    });

    it('declare admite un actor de plataforma sin membresía en el participante', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue(null);
      d.affiliationsRepo.create.mockReturnValue({
        id: 'a1',
        primaryTenantId: T1,
        participatingTenantId: T3,
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        createdAt: new Date(),
      });
      const superadmin = { id: 'root', roles: ['SUPERADMIN'] } as any;

      await inTenant(() =>
        d.service.declare(
          { primaryTenantId: T1, participatingTenantId: T3 },
          superadmin,
        ),
      );

      expect(d.affiliationsRepo.create).toHaveBeenCalled();
    });

    it('terminate busca la afiliación acotada al tenant activo', async () => {
      const d = build();
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(
        activeAffiliation(T1, T2),
      );

      await inTenant(() => d.service.terminate('a9', actor));

      expect(d.affiliationsRepo.findByIdForParty).toHaveBeenCalledWith(
        d.tx,
        'a9',
        T1,
      );
    });

    it('terminate permite que termine la parte participante', async () => {
      const d = build();
      const affiliation = activeAffiliation(T2, T1);
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(affiliation);

      const res = await inTenant(() => d.service.terminate('a9', actor));

      expect(res.status).toBe(ORGEXT.AFFILIATION_TERMINATED);
    });

    it('terminate sobre una afiliación ajena responde igual que una inexistente y no la muta', async () => {
      const d = build();
      const foreign = activeAffiliation(T2, T3);
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(foreign);
      const foreignError = await rejection(
        inTenant(() => d.service.terminate('a9', actor)),
      );
      d.affiliationsRepo.findByIdForParty.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.terminate('a9', actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.getStatus()).toBe(404);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(foreign.statusConceptId).toBe(ORGEXT.AFFILIATION_ACTIVE);
      expect(foreign.validTo).toBeUndefined();
    });

    it('sin tenant en el contexto terminate no llega a la base', async () => {
      const d = build();

      await expect(d.service.terminate('a9', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.affiliationsRepo.findByIdForParty).not.toHaveBeenCalled();
    });
  });
});
