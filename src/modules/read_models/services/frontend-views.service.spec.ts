import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FrontendViewsService } from './frontend-views.service';
import { ViewContractAuthorizer } from './view-contract-authorizer.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { RM } from '../read_models.concepts';
import { ReadModelsErrorReason } from '../read_models.error-reasons';

const admin = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const endUser = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => em),
  };
  const definitionsRepo = { findById: mockFn() };
  const runsRepo = { findLatestByDefinition: mockFn() };
  const surfacesRepo = { findByCode: mockFn(), create: mockFn() };
  const routesRepo = { findBySurfaceAndCode: mockFn(), create: mockFn() };
  const pageViewsRepo = {
    findById: mockFn(),
    findByRouteAndCode: mockFn(),
    create: mockFn(),
  };
  const childrenRepo = {
    listFields: mockFn(),
    listActions: mockFn(),
    listFilters: mockFn().mockResolvedValue([]),
    listSortOptions: mockFn().mockResolvedValue([]),
    createField: mockFn(),
    createSortOption: mockFn(),
    createAction: mockFn(),
    createKpi: mockFn(),
    createState: mockFn(),
  };
  const prefsRepo = { findByUserAndView: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El autorizador es el real; sus cuatro preguntas las responden dobles.
  const gates = {
    permissions: { holds: mockFn().mockResolvedValue(false) },
    audience: { isInAudience: mockFn().mockResolvedValue(false) },
    flags: { isEnabled: mockFn().mockResolvedValue(false) },
    patients: { canAccess: mockFn().mockResolvedValue(false) },
  };
  const authorizer = new ViewContractAuthorizer(
    gates.permissions,
    gates.audience,
    gates.flags,
    gates.patients,
  );
  const projection = {
    execute: mockFn().mockResolvedValue({ rows: [], nextCursor: null }),
  };

  const service = new FrontendViewsService(
    em as any,
    definitionsRepo as any,
    runsRepo as any,
    surfacesRepo,
    routesRepo,
    pageViewsRepo as any,
    childrenRepo as any,
    prefsRepo,
    authorizer,
    projection as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    definitionsRepo,
    runsRepo,
    surfacesRepo,
    routesRepo,
    pageViewsRepo,
    childrenRepo,
    prefsRepo,
    gates,
    projection,
  };
}

const publishDto = {
  portalName: 'Internal',
  portalType: 'INTERNAL' as const,
  routePattern: '/crm/accounts',
  pageTitle: 'Accounts',
  readModelDefinitionId: 'def-1',
  viewCode: 'account_list',
  viewType: 'TABLE' as const,
  fields: [
    {
      fieldCode: 'name',
      sourceColumn: 'name',
      label: 'Name',
      dataType: 'string',
      ordinal: 1,
    },
  ],
  actions: [
    {
      actionCode: 'view',
      label: 'View',
      actionType: 'NAVIGATE' as const,
      ordinal: 1,
    },
  ],
  states: [{ stateType: 'EMPTY' as const, title: 'Empty', message: 'No data' }],
};

describe('FrontendViewsService', () => {
  describe('publishViewContract (UC-30-02)', () => {
    it('rejects when the definition does not exist (404)', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishViewContract(
          'portal',
          'route',
          publishDto as any,
          admin,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the definition is not ACTIVE (422)', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        statusConceptId: RM.DEF_DRAFT,
      });
      await expect(
        d.service.publishViewContract(
          'portal',
          'route',
          publishDto as any,
          admin,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate view in the same route (409)', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.surfacesRepo.findByCode.mockResolvedValue({ id: 'surf-1' });
      d.routesRepo.findBySurfaceAndCode.mockResolvedValue({ id: 'route-1' });
      d.pageViewsRepo.findByRouteAndCode.mockResolvedValue({ id: 'view-x' });

      await expect(
        d.service.publishViewContract(
          'portal',
          'route',
          publishDto as any,
          admin,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('upserts surface/route, creates the view and its children', async () => {
      const d = build();
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        statusConceptId: RM.DEF_ACTIVE,
      });
      d.surfacesRepo.findByCode.mockResolvedValue(null);
      d.surfacesRepo.create.mockReturnValue({ id: 'surf-1' });
      d.routesRepo.findBySurfaceAndCode.mockResolvedValue(null);
      d.routesRepo.create.mockReturnValue({ id: 'route-1' });
      d.pageViewsRepo.findByRouteAndCode.mockResolvedValue(null);
      d.pageViewsRepo.create.mockReturnValue({
        id: 'view-1',
        viewCode: 'account_list',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });

      const res = await d.service.publishViewContract(
        'portal',
        'route',
        publishDto,
        admin,
      );

      expect(res.id).toBe('view-1');
      expect(res.portalSurfaceId).toBe('surf-1');
      expect(res.frontendRouteId).toBe('route-1');
      expect(res.fieldCount).toBe(1);
      expect(res.actionCount).toBe(1);
      expect(d.childrenRepo.createField).toHaveBeenCalledTimes(1);
      expect(d.childrenRepo.createAction).toHaveBeenCalledTimes(1);
      expect(d.childrenRepo.createState).toHaveBeenCalledTimes(1);
      // surface + route + view => at least 3 flushes
      expect(d.tx.flush).toHaveBeenCalledTimes(3);
    });
  });

  describe('serveData / deriveAvailableActions (UC-30-05 / UC-30-11 · RM-01 · RM-02)', () => {
    const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const PERMISSION = '11111111-1111-1111-1111-111111111111';
    const FIELD_PERMISSION = '22222222-2222-2222-2222-222222222222';
    const AUDIENCE = '33333333-3333-3333-3333-333333333333';
    const PURPOSE = '44444444-4444-4444-4444-444444444444';
    const PATIENT = '55555555-5555-5555-5555-555555555555';
    const ACTIVE = CONCEPTS.STATE_ACTIVE;

    /** Cablea portal, ruta, vista y definición; los requisitos van por parámetro. */
    function wire(
      d: ReturnType<typeof build>,
      requirements: {
        portal?: Record<string, unknown>;
        route?: Record<string, unknown>;
        definition?: Record<string, unknown>;
      } = {},
    ) {
      d.surfacesRepo.findByCode.mockResolvedValue({
        id: 'surf-1',
        statusConceptId: ACTIVE,
        ...requirements.portal,
      });
      d.routesRepo.findBySurfaceAndCode.mockResolvedValue({
        id: 'route-1',
        statusConceptId: ACTIVE,
        ...requirements.route,
      });
      d.pageViewsRepo.findByRouteAndCode.mockResolvedValue({
        id: 'view-1',
        viewCode: 'account_list',
        readModelDefinitionId: 'def-1',
        statusConceptId: ACTIVE,
      });
      d.definitionsRepo.findById.mockResolvedValue({
        id: 'def-1',
        statusConceptId: RM.DEF_ACTIVE,
        rowLevelSecurityRequired: true,
        ...requirements.definition,
      });
      d.childrenRepo.listFields.mockResolvedValue([
        {
          fieldCode: 'name',
          sourceColumn: 'name',
          label: 'Name',
          dataType: 'string',
          sensitive: false,
          statusConceptId: ACTIVE,
        },
        {
          fieldCode: 'ssn',
          sourceColumn: 'ssn',
          label: 'SSN',
          dataType: 'string',
          sensitive: true,
          statusConceptId: ACTIVE,
        },
        {
          fieldCode: 'salary',
          sourceColumn: 'salary',
          label: 'Salary',
          dataType: 'number',
          sensitive: false,
          permissionId: FIELD_PERMISSION,
          statusConceptId: ACTIVE,
        },
      ]);
      d.childrenRepo.listActions.mockResolvedValue([
        {
          actionCode: 'edit',
          label: 'Edit',
          actionTypeConceptId: RM.ACTION_TYPE_MUTATION,
          requiredPermissionId: 'perm-1',
          statusConceptId: ACTIVE,
        },
      ]);
      d.runsRepo.findLatestByDefinition.mockResolvedValue({
        completedAt: new Date(Date.now() - 5000),
        resultConceptId: RM.RESULT_SUCCESS,
      });
    }

    /** El mismo 404 que produce un portal inexistente. */
    async function expectOutOfScope(promise: Promise<unknown>) {
      const error = await promise.then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      const exception = error as ResourceNotFoundException;
      expect(exception.getStatus()).toBe(404);
      expect(exception.message).toBe('Vista no encontrada');
      expect(exception.reason).toBe(
        ReadModelsErrorReason.READ_MODEL_VIEW_OUT_OF_SCOPE,
      );
      expect(exception.details).toBeUndefined();
      return exception;
    }

    const serve = (
      d: ReturnType<typeof build>,
      user: any = endUser,
      query: Record<string, unknown> = {},
    ) =>
      runWithTenant(TENANT, () =>
        d.service.serveData('portal', 'route', 'account_list', user, {
          filters: {},
          ...query,
        }),
      );

    it('Límite: una ruta sin requisito de permiso ni contexto se sirve a un usuario autenticado', async () => {
      const d = build();
      wire(d);
      d.projection.execute.mockResolvedValue({
        rows: [{ name: 'Ana', ssn: 'raw' }],
        nextCursor: 'next',
      });

      const res = await serve(d);

      expect(res.viewCode).toBe('account_list');
      expect(res.nextCursor).toBe('next');
      expect(res.data).toEqual([{ name: 'Ana', ssn: null }]);
    });

    it('enmascara lo sensible: la columna ni se selecciona y su valor sale nulo', async () => {
      const d = build();
      wire(d);

      const res = await serve(d);

      expect(res.fields.find((f) => f.fieldCode === 'ssn')?.masked).toBe(true);
      expect(res.fields.find((f) => f.fieldCode === 'name')?.masked).toBe(
        false,
      );
      const request = d.projection.execute.mock.calls[0][0];
      expect(request.fields.map((f: any) => f.fieldCode)).toEqual(['name']);
      // La acción exige un permiso que el usuario no tiene -> deshabilitada.
      expect(res.availableActions[0].enabled).toBe(false);
      expect(res.stalenessSeconds).toBeGreaterThanOrEqual(4);
    });

    it('un campo con permission_id que el usuario no tiene no se sirve; con él, sí', async () => {
      const d = build();
      wire(d);
      const without = await serve(d);
      expect(without.fields.map((f) => f.fieldCode)).toEqual(['name', 'ssn']);

      d.gates.permissions.holds.mockImplementation(
        (_u: unknown, _t: unknown, id: string) =>
          Promise.resolve(id === FIELD_PERMISSION),
      );
      const withPermission = await serve(d);
      expect(withPermission.fields.map((f) => f.fieldCode)).toEqual([
        'name',
        'ssn',
        'salary',
      ]);
    });

    it('Correcto: con audiencia, permiso, propósito y contextos se sirve y se filtra por tenant y paciente', async () => {
      const d = build();
      wire(d, {
        portal: {
          audienceRoleValueSetId: AUDIENCE,
          tenantScoped: true,
          patientScoped: true,
        },
        route: {
          requiredPermissionId: PERMISSION,
          purposeOfUseConceptId: PURPOSE,
          requiresPatientContext: true,
          requiresTenantContext: true,
        },
        definition: { rowLevelSecurityRequired: false },
      });
      d.gates.audience.isInAudience.mockResolvedValue(true);
      d.gates.permissions.holds.mockResolvedValue(true);
      d.gates.patients.canAccess.mockResolvedValue(true);

      await serve(
        d,
        { ...endUser },
        {
          purposeOfUse: PURPOSE,
          patientProfileId: PATIENT,
        },
      );

      const request = d.projection.execute.mock.calls[0][0];
      expect(request).toMatchObject({
        tenantScoped: true,
        tenantId: TENANT,
        patientScoped: true,
        patientProfileId: PATIENT,
      });
      expect(d.gates.audience.isInAudience).toHaveBeenCalledWith(
        endUser,
        AUDIENCE,
      );
      expect(d.gates.permissions.holds).toHaveBeenCalledWith(
        endUser,
        TENANT,
        PERMISSION,
      );
    });

    it.each([
      ['permiso', { route: { requiredPermissionId: PERMISSION } }],
      ['audiencia', { portal: { audienceRoleValueSetId: AUDIENCE } }],
      ['propósito', { route: { purposeOfUseConceptId: PURPOSE } }],
      ['feature flag', { route: { featureFlagCode: 'NEW_VIEW' } }],
      ['contexto de paciente', { route: { requiresPatientContext: true } }],
      ['portal inactivo', { portal: { statusConceptId: 'inactive' } }],
    ])(
      'Error: falta %s -> el mismo 404 que una vista inexistente, sin listar hijos ni tocar la proyección',
      async (_name, requirements) => {
        const d = build();
        wire(d, requirements as any);

        const denied = await expectOutOfScope(serve(d));
        const deniedActions = await expectOutOfScope(
          runWithTenant(TENANT, () =>
            d.service.deriveAvailableActions(
              'portal',
              'route',
              'account_list',
              undefined,
              endUser,
            ),
          ),
        );
        d.surfacesRepo.findByCode.mockResolvedValue(null);
        const missing = await expectOutOfScope(serve(d));

        expect(denied.getResponse()).toEqual(missing.getResponse());
        expect(deniedActions.getResponse()).toEqual(missing.getResponse());
        expect(d.childrenRepo.listFields).not.toHaveBeenCalled();
        expect(d.childrenRepo.listActions).not.toHaveBeenCalled();
        expect(d.projection.execute).not.toHaveBeenCalled();
      },
    );

    it('falta tenant en el contexto cuando la ruta lo exige: 404 uniforme', async () => {
      const d = build();
      wire(d, { route: { requiresTenantContext: true } });

      await expectOutOfScope(
        d.service.serveData('portal', 'route', 'account_list', endUser, {
          filters: {},
        }),
      );
      expect(d.projection.execute).not.toHaveBeenCalled();
    });

    it('SECURITY_ADMIN entra por el bypass explícito de audiencia y permiso, pero no del propósito ni de los contextos', async () => {
      const d = build();
      wire(d, {
        portal: { audienceRoleValueSetId: AUDIENCE },
        route: {
          requiredPermissionId: PERMISSION,
          purposeOfUseConceptId: PURPOSE,
        },
      });

      await expectOutOfScope(serve(d, admin));
      expect(d.gates.audience.isInAudience).not.toHaveBeenCalled();
      expect(d.gates.permissions.holds).not.toHaveBeenCalled();

      const res = await serve(d, admin, { purposeOfUse: PURPOSE });
      expect(res.viewCode).toBe('account_list');
      // El bypass también revela los campos sensibles.
      expect(res.fields.find((f) => f.fieldCode === 'ssn')?.masked).toBe(false);
    });

    it('un administrador tampoco salta el acceso a un paciente ajeno', async () => {
      const d = build();
      wire(d, { route: { requiresPatientContext: true } });

      await expectOutOfScope(serve(d, admin, { patientProfileId: PATIENT }));
      expect(d.gates.patients.canAccess).toHaveBeenCalledWith(admin, PATIENT);
    });

    it('el paciente ve su propio contexto sin consultar la política clínica', async () => {
      const d = build();
      wire(d, { route: { requiresPatientContext: true } });
      const patient = {
        id: 'p-1',
        roles: ['PATIENT'],
        patientProfileId: PATIENT,
      };

      const res = await serve(d, patient);

      expect(res.viewCode).toBe('account_list');
      expect(d.gates.patients.canAccess).not.toHaveBeenCalled();
    });

    it('una definición ausente es una proyección no disponible (422), no una lista vacía', async () => {
      const d = build();
      wire(d);
      d.definitionsRepo.findById.mockResolvedValue(null);

      await expect(serve(d)).rejects.toMatchObject({
        reason: ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
      });
    });

    it('deriva las acciones con el permiso real de cada una', async () => {
      const d = build();
      wire(d);
      d.gates.permissions.holds.mockResolvedValue(true);

      const actions = await runWithTenant(TENANT, () =>
        d.service.deriveAvailableActions(
          'portal',
          'route',
          'account_list',
          undefined,
          endUser,
        ),
      );

      expect(actions[0].enabled).toBe(true);
      expect(d.gates.permissions.holds).toHaveBeenCalledWith(
        endUser,
        TENANT,
        'perm-1',
      );
    });

    it('throws when the view cannot be resolved', async () => {
      const d = build();
      d.surfacesRepo.findByCode.mockResolvedValue(null);
      await expect(
        d.service.serveData('portal', 'route', 'v', endUser),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('upsertPreferences (UC-30-09)', () => {
    it('rejects visible fields outside the contract allow-list (422)', async () => {
      const d = build();
      d.pageViewsRepo.findById.mockResolvedValue({
        id: 'view-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.childrenRepo.listFields.mockResolvedValue([{ fieldCode: 'name' }]);

      await expect(
        d.service.upsertPreferences(
          'view-1',
          { visibleFields: ['name', 'hacker'] } as any,
          endUser,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates preferences when none exist', async () => {
      const d = build();
      d.pageViewsRepo.findById.mockResolvedValue({
        id: 'view-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.childrenRepo.listFields.mockResolvedValue([{ fieldCode: 'name' }]);
      d.prefsRepo.findByUserAndView.mockResolvedValue(null);
      d.prefsRepo.create.mockReturnValue({
        id: 'pref-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });

      const res = await d.service.upsertPreferences(
        'view-1',
        { visibleFields: ['name'], density: 'COMPACT', pageSize: 25 } as any,
        endUser,
      );

      expect(res).toEqual({
        id: 'pref-1',
        frontendPageViewId: 'view-1',
        created: true,
        status: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('updates existing preferences in place', async () => {
      const d = build();
      d.pageViewsRepo.findById.mockResolvedValue({
        id: 'view-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const existing = {
        id: 'pref-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.prefsRepo.findByUserAndView.mockResolvedValue(existing);

      const res = await d.service.upsertPreferences(
        'view-1',
        { sortCode: 'name_asc' },
        endUser,
      );
      expect(res.created).toBe(false);
      expect(d.prefsRepo.create).not.toHaveBeenCalled();
    });
  });
});
