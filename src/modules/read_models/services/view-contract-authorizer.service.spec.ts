import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  ViewContractAuthorizer,
  viewOutOfScope,
} from './view-contract-authorizer.service';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { ReadModelsErrorReason } from '../read_models.error-reasons';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PATIENT = '55555555-5555-5555-5555-555555555555';
const PERMISSION = '11111111-1111-1111-1111-111111111111';
const AUDIENCE = '33333333-3333-3333-3333-333333333333';
const PURPOSE = '44444444-4444-4444-4444-444444444444';
const user = { id: 'u-1', roles: ['CLINICIAN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El autorizador y sus cuatro compuertas.
 */
function build() {
  const permissions = { holds: mockFn().mockResolvedValue(true) };
  const audience = { isInAudience: mockFn().mockResolvedValue(true) };
  const flags = { isEnabled: mockFn().mockResolvedValue(true) };
  const patients = { canAccess: mockFn().mockResolvedValue(true) };
  const authorizer = new ViewContractAuthorizer(
    permissions,
    audience,
    flags,
    patients,
  );
  return { authorizer, permissions, audience, flags, patients };
}

/**
 * Un contrato activo, con los requisitos que se pidan.
 *
 * @param requirements - Requisitos de portal y ruta.
 * @returns Portal, ruta y vista.
 */
function contract(
  requirements: {
    portal?: Record<string, unknown>;
    route?: Record<string, unknown>;
    view?: Record<string, unknown>;
  } = {},
): any {
  return {
    portal: { statusConceptId: CONCEPTS.STATE_ACTIVE, ...requirements.portal },
    route: { statusConceptId: CONCEPTS.STATE_ACTIVE, ...requirements.route },
    view: { statusConceptId: CONCEPTS.STATE_ACTIVE, ...requirements.view },
  };
}

/**
 * Aserción del 404 uniforme.
 *
 * @param promise - Operación que debe denegar.
 */
async function expectDenied(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect((error as ResourceNotFoundException).getResponse()).toEqual(
    viewOutOfScope().getResponse(),
  );
  expect((error as ResourceNotFoundException).reason).toBe(
    ReadModelsErrorReason.READ_MODEL_VIEW_OUT_OF_SCOPE,
  );
}

describe('ViewContractAuthorizer (RM-01)', () => {
  describe('authorizeView', () => {
    it('Límite: un contrato sin requisitos autoriza al usuario autenticado y no consulta nada', async () => {
      const d = build();

      const res = await d.authorizer.authorizeView(contract(), {
        user,
        tenantId: TENANT,
      });

      expect(res).toEqual({
        privileged: false,
        tenantId: TENANT,
        patientProfileId: undefined,
      });
      expect(d.permissions.holds).not.toHaveBeenCalled();
      expect(d.audience.isInAudience).not.toHaveBeenCalled();
      expect(d.flags.isEnabled).not.toHaveBeenCalled();
    });

    it('Correcto: audiencia, permiso, propósito, flag y contextos satisfechos', async () => {
      const d = build();

      const res = await d.authorizer.authorizeView(
        contract({
          portal: {
            audienceRoleValueSetId: AUDIENCE,
            tenantScoped: true,
            patientScoped: true,
          },
          route: {
            requiredPermissionId: PERMISSION,
            purposeOfUseConceptId: PURPOSE,
            featureFlagCode: 'F',
            requiresPatientContext: true,
            requiresTenantContext: true,
          },
        }),
        {
          user,
          tenantId: TENANT,
          patientProfileId: PATIENT,
          purposeOfUseConceptId: PURPOSE,
        },
      );

      expect(res.patientProfileId).toBe(PATIENT);
      expect(d.audience.isInAudience).toHaveBeenCalledWith(user, AUDIENCE);
      expect(d.permissions.holds).toHaveBeenCalledWith(
        user,
        TENANT,
        PERMISSION,
      );
      expect(d.flags.isEnabled).toHaveBeenCalledWith('F', TENANT);
      expect(d.patients.canAccess).toHaveBeenCalledWith(user, PATIENT);
    });

    it.each([
      ['portal inactivo', { portal: { statusConceptId: 'x' } }],
      ['ruta inactiva', { route: { statusConceptId: 'x' } }],
      ['vista inactiva', { view: { statusConceptId: 'x' } }],
    ])('%s: 404 uniforme', async (_name, requirements) => {
      const d = build();

      await expectDenied(
        d.authorizer.authorizeView(contract(requirements as any), {
          user,
          tenantId: TENANT,
        }),
      );
    });

    it('sin el permiso de la ruta: 404 uniforme', async () => {
      const d = build();
      d.permissions.holds.mockResolvedValue(false);

      await expectDenied(
        d.authorizer.authorizeView(
          contract({ route: { requiredPermissionId: PERMISSION } }),
          { user, tenantId: TENANT },
        ),
      );
    });

    it('fuera de la audiencia del portal: 404 uniforme', async () => {
      const d = build();
      d.audience.isInAudience.mockResolvedValue(false);

      await expectDenied(
        d.authorizer.authorizeView(
          contract({ portal: { audienceRoleValueSetId: AUDIENCE } }),
          { user, tenantId: TENANT },
        ),
      );
    });

    it('propósito ausente o distinto del que la ruta exige: 404 uniforme', async () => {
      const d = build();
      const route = { purposeOfUseConceptId: PURPOSE };

      await expectDenied(
        d.authorizer.authorizeView(contract({ route }), { user }),
      );
      await expectDenied(
        d.authorizer.authorizeView(contract({ route }), {
          user,
          purposeOfUseConceptId: 'otro',
        }),
      );
    });

    it('feature flag apagado: 404 uniforme (aun para administración)', async () => {
      const d = build();
      d.flags.isEnabled.mockResolvedValue(false);
      const admin = { id: 'a-1', roles: ['SECURITY_ADMIN'] } as any;

      await expectDenied(
        d.authorizer.authorizeView(
          contract({ route: { featureFlagCode: 'F' } }),
          { user: admin, tenantId: TENANT },
        ),
      );
    });

    it('contexto de tenant exigido y ausente: 404 uniforme', async () => {
      const d = build();

      await expectDenied(
        d.authorizer.authorizeView(
          contract({ route: { requiresTenantContext: true } }),
          { user },
        ),
      );
      await expectDenied(
        d.authorizer.authorizeView(
          contract({ portal: { tenantScoped: true } }),
          { user },
        ),
      );
    });

    it('contexto de paciente exigido: sin paciente, o con uno ajeno sin base clínica, 404 uniforme', async () => {
      const d = build();
      const route = { requiresPatientContext: true };

      await expectDenied(
        d.authorizer.authorizeView(contract({ route }), { user }),
      );

      d.patients.canAccess.mockResolvedValue(false);
      await expectDenied(
        d.authorizer.authorizeView(contract({ route }), {
          user,
          patientProfileId: PATIENT,
        }),
      );
    });

    it('el paciente titular no pasa por la política clínica', async () => {
      const d = build();
      const patient = {
        id: 'p-1',
        roles: ['PATIENT'],
        patientProfileId: PATIENT,
      } as any;

      const res = await d.authorizer.authorizeView(
        contract({ route: { requiresPatientContext: true } }),
        { user: patient },
      );

      expect(res.patientProfileId).toBe(PATIENT);
      expect(d.patients.canAccess).not.toHaveBeenCalled();
    });

    it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
      '%s: bypass explícito de audiencia y permiso, no de propósito ni de contexto',
      async (role) => {
        const d = build();
        d.permissions.holds.mockResolvedValue(false);
        d.audience.isInAudience.mockResolvedValue(false);
        const admin = { id: 'a-1', roles: [role] } as any;
        const requirements = {
          portal: { audienceRoleValueSetId: AUDIENCE },
          route: {
            requiredPermissionId: PERMISSION,
            purposeOfUseConceptId: PURPOSE,
            requiresTenantContext: true,
          },
        };

        const res = await d.authorizer.authorizeView(contract(requirements), {
          user: admin,
          tenantId: TENANT,
          purposeOfUseConceptId: PURPOSE,
        });
        expect(res.privileged).toBe(true);
        expect(d.permissions.holds).not.toHaveBeenCalled();
        expect(d.audience.isInAudience).not.toHaveBeenCalled();

        await expectDenied(
          d.authorizer.authorizeView(contract(requirements), {
            user: admin,
            tenantId: TENANT,
          }),
        );
        await expectDenied(
          d.authorizer.authorizeView(contract(requirements), {
            user: admin,
            purposeOfUseConceptId: PURPOSE,
          }),
        );
      },
    );
  });

  describe('authorizedFields / actionPermitted', () => {
    const field = (overrides: Record<string, unknown> = {}): any => ({
      fieldCode: 'f',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      ...overrides,
    });

    it('descarta los campos inactivos y los que exigen un permiso que el actor no tiene', async () => {
      const d = build();
      d.permissions.holds.mockResolvedValue(false);

      const served = await d.authorizer.authorizedFields(
        [
          field({ fieldCode: 'a' }),
          field({ fieldCode: 'b', statusConceptId: 'x' }),
          field({ fieldCode: 'c', permissionId: PERMISSION }),
        ],
        { privileged: false, tenantId: TENANT },
        user,
      );

      expect(served.map((f) => f.fieldCode)).toEqual(['a']);
    });

    it('evalúa una sola vez el mismo permiso y la administración conserva todos los campos activos', async () => {
      const d = build();
      const fields = [
        field({ fieldCode: 'a', permissionId: PERMISSION }),
        field({ fieldCode: 'b', permissionId: PERMISSION }),
      ];

      const served = await d.authorizer.authorizedFields(
        fields,
        { privileged: false, tenantId: TENANT },
        user,
      );
      expect(served).toHaveLength(2);
      expect(d.permissions.holds).toHaveBeenCalledTimes(1);

      d.permissions.holds.mockClear();
      const adminServed = await d.authorizer.authorizedFields(
        fields,
        { privileged: true, tenantId: TENANT },
        user,
      );
      expect(adminServed).toHaveLength(2);
      expect(d.permissions.holds).not.toHaveBeenCalled();
    });

    it('una acción sin permiso declarado se ofrece; con permiso, según el actor', async () => {
      const d = build();
      const authorized = { privileged: false, tenantId: TENANT };

      expect(
        await d.authorizer.actionPermitted({} as any, authorized, user),
      ).toBe(true);

      d.permissions.holds.mockResolvedValue(false);
      expect(
        await d.authorizer.actionPermitted(
          { requiredPermissionId: PERMISSION } as any,
          authorized,
          user,
        ),
      ).toBe(false);
    });
  });
});
