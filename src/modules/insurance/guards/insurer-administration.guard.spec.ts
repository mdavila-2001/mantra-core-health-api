import { jest } from '@jest/globals';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ClaimsController } from '../controllers/claims.controller';
import { InsuranceCampaignsController } from '../controllers/insurance-campaigns.controller';
import { PractitionerSettlementBatchesController } from '../controllers/practitioner-settlement-batches.controller';
import { InsurerAdministrationGuard } from './insurer-administration.guard';

// Loose-typed mock factory, como el resto de las specs del módulo.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';

type Handler = (...args: never[]) => unknown;

/** Contexto HTTP con el handler real, para que el Reflector lea su metadata. */
function contextFor(
  controller: { prototype: object },
  method: string,
  user: { id: string; roles: string[] } | undefined,
  // `null` = sin tenant resuelto; `undefined` tomaría el valor por defecto.
  resolvedTenantId: string | null = TENANT,
): ExecutionContext {
  const handler = (controller.prototype as Record<string, Handler>)[method];
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        resolvedTenantId: resolvedTenantId ?? undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

function build({
  canAdminister = false,
  carrier = { id: 'carrier-1' } as object | null,
}: { canAdminister?: boolean; carrier?: object | null } = {}) {
  const tx = { execute: mockFn().mockResolvedValue([]) };
  const fork = {
    ...tx,
    transactional: mockFn((cb: (t: unknown) => unknown) => cb(tx)),
  };
  const em = { fork: mockFn().mockReturnValue(fork) };
  const tenantAdministration = {
    canAdminister: mockFn().mockResolvedValue(canAdminister),
  };
  const catalog = {
    findCarrierByTenantId: mockFn().mockResolvedValue(carrier),
  };
  const guard = new InsurerAdministrationGuard(
    new Reflector(),
    em as never,
    tenantAdministration as never,
    catalog as never,
  );
  return { guard, em, fork, tx, tenantAdministration, catalog };
}

const ownerDeAseguradora = { id: 'owner-1', roles: ['USER'] };

describe('InsurerAdministrationGuard', () => {
  const originalRls = process.env.RLS_ENFORCE;
  afterEach(() => {
    if (originalRls === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = originalRls;
  });

  describe('correcto', () => {
    it('el OWNER/ADMIN de la aseguradora activa pasa aunque sólo tenga el rol global USER', async () => {
      const d = build({ canAdminister: true });

      await expect(
        d.guard.canActivate(
          contextFor(ClaimsController, 'adjudicate', ownerDeAseguradora),
        ),
      ).resolves.toBe(true);
      expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        ownerDeAseguradora,
      );
      expect(d.catalog.findCarrierByTenantId).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
      );
    });

    it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
      '%s pasa sin consultar la base (el servicio decide el tenant)',
      async (rol) => {
        const d = build();

        await expect(
          d.guard.canActivate(
            contextFor(
              InsuranceCampaignsController,
              'create',
              { id: 'p', roles: [rol] },
              null,
            ),
          ),
        ).resolves.toBe(true);
        expect(d.em.fork).not.toHaveBeenCalled();
      },
    );

    it('BILLING/FINANCE pasan en las escrituras del reclamo (camino heredado de assertLegacyClaimRoles)', async () => {
      const d = build();

      for (const metodo of ['adjudicate', 'publishEob', 'reverse']) {
        for (const rol of ['BILLING', 'FINANCE']) {
          await expect(
            d.guard.canActivate(
              contextFor(ClaimsController, metodo, { id: 'b', roles: [rol] }),
            ),
          ).resolves.toBe(true);
        }
      }
      expect(d.em.fork).not.toHaveBeenCalled();
    });
  });

  describe('límite', () => {
    it('BILLING no sirve para campañas ni lotes: ahí el servicio no lo acepta', async () => {
      const d = build({ canAdminister: false });
      const billing = { id: 'b', roles: ['BILLING'] };

      await expect(
        d.guard.canActivate(
          contextFor(InsuranceCampaignsController, 'create', billing),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        d.guard.canActivate(
          contextFor(
            PractitionerSettlementBatchesController,
            'generate',
            billing,
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('administrar un tenant que no es aseguradora (una clínica) no alcanza', async () => {
      const d = build({ canAdminister: true, carrier: null });

      await expect(
        d.guard.canActivate(
          contextFor(InsuranceCampaignsController, 'changeStatus', {
            id: 'duena-de-clinica',
            roles: ['USER', 'PRACTITIONER'],
          }),
        ),
      ).rejects.toThrow(
        'Se requiere ser OWNER o ADMIN de la aseguradora activa',
      );
    });

    it('con RLS_ENFORCE=true lee la membresía dentro del tenant resuelto', async () => {
      process.env.RLS_ENFORCE = 'true';
      const d = build({ canAdminister: true });

      await expect(
        d.guard.canActivate(
          contextFor(
            PractitionerSettlementBatchesController,
            'generate',
            ownerDeAseguradora,
          ),
        ),
      ).resolves.toBe(true);
      expect(d.fork.transactional).toHaveBeenCalledTimes(1);
      expect(d.tx.execute).toHaveBeenCalledWith(
        "select set_config('app.current_tenant_id', ?, true)",
        [TENANT],
      );
      expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        ownerDeAseguradora,
      );
    });

    it('sin RLS no abre transacción: una lectura en el fork', async () => {
      delete process.env.RLS_ENFORCE;
      const d = build({ canAdminister: true });

      await d.guard.canActivate(
        contextFor(ClaimsController, 'adjudicate', ownerDeAseguradora),
      );

      expect(d.fork.transactional).not.toHaveBeenCalled();
    });
  });

  describe('inválido', () => {
    it('un paciente (miembro STAFF, rol PATIENT) recibe 403 y no se consulta el catálogo', async () => {
      const d = build({ canAdminister: false });

      await expect(
        d.guard.canActivate(
          contextFor(ClaimsController, 'adjudicate', {
            id: 'paciente',
            roles: ['USER', 'PATIENT'],
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.catalog.findCarrierByTenantId).not.toHaveBeenCalled();
    });

    it('INSURANCE_OPERATOR sin membresía OWNER/ADMIN tampoco muta (sólo lee analítica)', async () => {
      const d = build({ canAdminister: false });

      await expect(
        d.guard.canActivate(
          contextFor(InsuranceCampaignsController, 'create', {
            id: 'operador',
            roles: ['USER', 'INSURANCE_OPERATOR'],
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sin tenant resuelto, 403 con la pista del X-Tenant-Id', async () => {
      const d = build({ canAdminister: true });

      await expect(
        d.guard.canActivate(
          contextFor(ClaimsController, 'adjudicate', ownerDeAseguradora, null),
        ),
      ).rejects.toThrow(/X-Tenant-Id/);
      expect(d.em.fork).not.toHaveBeenCalled();
    });

    it('sin sujeto (no debería llegar tras JwtAuthGuard), 403', async () => {
      const d = build({ canAdminister: true });

      await expect(
        d.guard.canActivate(
          contextFor(ClaimsController, 'adjudicate', undefined),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});

/**
 * Dónde está montado: sólo en las mutaciones de la aseguradora. Las lecturas y
 * el envío del reclamo (lado del prestador) siguen sin esta barrera.
 */
describe('@InsurerAdministration montado en los controladores', () => {
  function guardsOf(controller: { prototype: object }, method: string) {
    return (
      (Reflect.getMetadata(
        GUARDS_METADATA,
        (controller.prototype as Record<string, Handler>)[method],
      ) as unknown[] | undefined) ?? []
    );
  }

  it.each([
    [ClaimsController, 'adjudicate'],
    [ClaimsController, 'publishEob'],
    [ClaimsController, 'reverse'],
    [InsuranceCampaignsController, 'create'],
    [InsuranceCampaignsController, 'changeStatus'],
    [PractitionerSettlementBatchesController, 'generate'],
  ])('%p.%s lo lleva', (controller, method) => {
    expect(guardsOf(controller, method)).toContain(InsurerAdministrationGuard);
  });

  it.each([
    [ClaimsController, 'submit'],
    [ClaimsController, 'openDispute'],
    [InsuranceCampaignsController, 'list'],
    [InsuranceCampaignsController, 'listForPatient'],
    [InsuranceCampaignsController, 'getById'],
    [PractitionerSettlementBatchesController, 'getById'],
    [PractitionerSettlementBatchesController, 'list'],
  ])('%p.%s no lo lleva', (controller, method) => {
    expect(guardsOf(controller, method)).not.toContain(
      InsurerAdministrationGuard,
    );
  });
});
