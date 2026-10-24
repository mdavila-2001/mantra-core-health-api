import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { PharmacyInventoryScopePolicy } from './pharmacy-inventory-scope.policy';
import { buildScopeWorld } from './pharmacy-inventory-scope.testing';

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const NOT_AVAILABLE =
  PharmacyInventoryErrorReason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE;
const INCONSISTENT =
  PharmacyInventoryErrorReason.PHARMACY_INVENTORY_SCOPE_INCONSISTENT;

const admin = { id: 'admin-1', roles: ['SECURITY_ADMIN'], tenantIds: [T1] };
const tx = {} as any;

const build = buildScopeWorld;

/** Ejecuta `fn` con el tenant dado como tenant activo del request. */
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

describe('PharmacyInventoryScopePolicy', () => {
  describe('requireManagedPharmacy', () => {
    it('resuelve la farmacia del tenant activo para un miembro', async () => {
      const { policy } = build();

      await expect(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-1', admin)),
      ).resolves.toEqual({ tenantId: T1, pharmacyId: 'ph-1' });
    });

    it('una farmacia de T2 responde igual que una inexistente', async () => {
      const { policy } = build();
      const foreign = await rejection(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-2', admin)),
      );
      const missing = await rejection(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-9', admin)),
      );

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(NOT_AVAILABLE);
      expect(foreign.details).toBeUndefined();
      expect(foreign.getResponse()).toEqual(missing.getResponse());
    });

    it('rechaza a un actor que no es miembro del tenant activo sin consultar la base', async () => {
      const { policy, repo } = build();
      const outsider = { ...admin, tenantIds: [T2] };

      const error = await rejection(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-1', outsider)),
      );

      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(repo.findPharmacyInTenant).not.toHaveBeenCalled();
    });

    it('admite a un actor de plataforma sobre el tenant que eligió', async () => {
      const { policy } = build();
      const platform = { id: 'root', roles: ['SUPERADMIN'] } as any;

      await expect(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-1', platform)),
      ).resolves.toEqual({ tenantId: T1, pharmacyId: 'ph-1' });
      const crossTenant = await rejection(
        inTenant(() => policy.requireManagedPharmacy(tx, 'ph-2', platform)),
      );
      expect(crossTenant.reason).toBe(NOT_AVAILABLE);
    });

    it('sin tenant en el contexto no llega a la base', async () => {
      const { policy, repo } = build();

      await expect(
        policy.requireManagedPharmacy(tx, 'ph-1', admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(repo.findPharmacyInTenant).not.toHaveBeenCalled();
    });
  });

  describe('requireManagedSite / requireManagedProduct / requireManagedConnection', () => {
    it('resuelven la farmacia a través de su hijo', async () => {
      const { policy } = build();

      await expect(
        inTenant(() => policy.requireManagedSite(tx, 'site-1', admin)),
      ).resolves.toEqual({
        tenantId: T1,
        pharmacyId: 'ph-1',
        siteId: 'site-1',
      });
      await expect(
        inTenant(() => policy.requireManagedProduct(tx, 'prod-1', admin)),
      ).resolves.toEqual({ tenantId: T1, pharmacyId: 'ph-1' });
      await expect(
        inTenant(() => policy.requireManagedConnection(tx, 'conn-1', admin)),
      ).resolves.toEqual({ tenantId: T1, pharmacyId: 'ph-1' });
    });

    it('un hijo de T2 responde igual que uno inexistente', async () => {
      const { policy } = build();
      const calls: [string, () => Promise<unknown>, () => Promise<unknown>][] =
        [
          [
            'site',
            () => policy.requireManagedSite(tx, 'site-2', admin),
            () => policy.requireManagedSite(tx, 'site-9', admin),
          ],
          [
            'product',
            () => policy.requireManagedProduct(tx, 'prod-2', admin),
            () => policy.requireManagedProduct(tx, 'prod-9', admin),
          ],
          [
            'connection',
            () => policy.requireManagedConnection(tx, 'conn-2', admin),
            () => policy.requireManagedConnection(tx, 'conn-9', admin),
          ],
        ];

      for (const [, foreignCall, missingCall] of calls) {
        const foreign = await rejection(inTenant(foreignCall));
        const missing = await rejection(inTenant(missingCall));
        expect(foreign.getStatus()).toBe(404);
        expect(foreign.reason).toBe(NOT_AVAILABLE);
        expect(foreign.details).toBeUndefined();
        expect(foreign.getResponse()).toEqual(missing.getResponse());
      }
    });
  });

  describe('referencias del cuerpo dentro de su padre', () => {
    const pharmacy = { tenantId: T1, pharmacyId: 'ph-1' };
    const site = { ...pharmacy, siteId: 'site-1' };

    it('acepta la cadena íntegra de T1', async () => {
      const { policy } = build();

      await expect(policy.requireSite(tx, pharmacy, 'site-1')).resolves.toEqual(
        site,
      );
      await expect(
        policy.requireStockKey(tx, site, {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
          inventoryLotId: 'lot-1',
        }),
      ).resolves.toBeUndefined();
      await expect(
        policy.requireLocationInPharmacy(tx, pharmacy, 'loc-1b'),
      ).resolves.toMatchObject({ id: 'loc-1b' });
    });

    it('acepta una clave sin lote', async () => {
      const { policy } = build();

      await expect(
        policy.requireStockKey(tx, site, {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
        }),
      ).resolves.toBeUndefined();
    });

    it.each([
      [
        'sede de T2',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireSite(tx, pharmacy, 'site-2'),
      ],
      [
        'ubicación de T2',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLocation(tx, site, 'loc-2'),
      ],
      [
        'ubicación de otra sede de la misma farmacia',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLocation(tx, site, 'loc-1b'),
      ],
      [
        'ubicación de T2 entre las de la farmacia',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLocationInPharmacy(tx, pharmacy, 'loc-2'),
      ],
      [
        'ubicación huérfana',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLocationInPharmacy(tx, pharmacy, 'loc-orphan'),
      ],
      [
        'producto de T2',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireProduct(tx, pharmacy, 'prod-2'),
      ],
      [
        'lote de T2',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLot(tx, 'lot-2', 'prod-1'),
      ],
      [
        'lote que no es del producto',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLot(tx, 'lot-1', 'prod-2'),
      ],
      [
        'lote inexistente',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireLot(tx, 'lot-9', 'prod-1'),
      ],
      [
        'clave con ubicación y producto de T1 pero lote de T2',
        (p: PharmacyInventoryScopePolicy) =>
          p.requireStockKey(tx, site, {
            inventoryLocationId: 'loc-1',
            pharmacyProductId: 'prod-1',
            inventoryLotId: 'lot-2',
          }),
      ],
    ])('rechaza %s con 404 uniforme', async (_name, call) => {
      const { policy } = build();

      const error = await rejection(call(policy));

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
    });

    it('requirePatientContext exige perfil existente y receta de ese paciente', async () => {
      const { policy } = build();

      await expect(
        policy.requirePatientContext(tx, 'pat-1', 'rx-1'),
      ).resolves.toBeUndefined();
      await expect(
        policy.requirePatientContext(tx, undefined, undefined),
      ).resolves.toBeUndefined();
      const missingPatient = await rejection(
        policy.requirePatientContext(tx, 'pat-9', undefined),
      );
      const foreignRequest = await rejection(
        policy.requirePatientContext(tx, 'pat-1', 'rx-9'),
      );
      const requestWithoutPatient = await rejection(
        policy.requirePatientContext(tx, undefined, 'rx-1'),
      );

      for (const error of [
        missingPatient,
        foreignRequest,
        requestWithoutPatient,
      ]) {
        expect(error.reason).toBe(NOT_AVAILABLE);
        expect(error.details).toBeUndefined();
      }
    });
  });

  describe('cadena ya guardada', () => {
    const pharmacy = { tenantId: T1, pharmacyId: 'ph-1' };
    const site = { ...pharmacy, siteId: 'site-1' };

    it('resolveStoredLocation devuelve la sede verdadera de la ubicación', async () => {
      const { policy } = build();

      await expect(
        policy.resolveStoredLocation(tx, pharmacy, 'loc-1b'),
      ).resolves.toEqual({
        ...pharmacy,
        siteId: 'site-1b',
        locationId: 'loc-1b',
      });
    });

    it.each([
      ['ubicación inexistente', 'loc-9'],
      ['ubicación cuya sede no existe', 'loc-orphan'],
      ['ubicación de otra farmacia', 'loc-2'],
    ])(
      'resolveStoredLocation con %s responde 422 SCOPE_INCONSISTENT',
      async (_n, id) => {
        const { policy } = build();

        const error = await rejection(
          policy.resolveStoredLocation(tx, pharmacy, id),
        );

        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error.getStatus()).toBe(422);
        expect(error.reason).toBe(INCONSISTENT);
      },
    );

    it('assertStoredStockKey acepta la cadena íntegra y rechaza cada eslabón roto', async () => {
      const { policy } = build();

      await expect(
        policy.assertStoredStockKey(tx, site, {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
          inventoryLotId: 'lot-1',
        }),
      ).resolves.toBeUndefined();
      const keys = [
        { inventoryLocationId: 'loc-2' },
        { inventoryLocationId: 'loc-1', pharmacyProductId: 'prod-2' },
        {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
          inventoryLotId: 'lot-2',
        },
      ];
      for (const key of keys) {
        const error = await rejection(
          policy.assertStoredStockKey(tx, site, key),
        );
        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error.reason).toBe(INCONSISTENT);
      }
    });
  });
});
