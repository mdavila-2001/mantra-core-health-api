import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReportingDefinitionsService } from './reporting-definitions.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ReportingErrorReason } from '../reporting.error-reasons';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

const actor = { id: 'user-1', roles: ['REPORTING_ADMIN'] };
const SOURCE = '11111111-1111-1111-1111-111111111111';
const DEFINITION = '22222222-2222-2222-2222-222222222222';
const READ_MODEL = '33333333-3333-3333-3333-333333333333';
const PERMISSION = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const definitionsRepo = {
    createDataSource: mockFn(),
    findDataSourceById: mockFn(),
    findDataSourceByCode: mockFn(),
    createDefinition: mockFn(),
    findDefinitionById: mockFn(),
    findDefinitionForUpdate: mockFn(),
    findDefinitionByCode: mockFn(),
    createParameter: mockFn(),
    findParametersByDefinition: mockFn(),
    createColumn: mockFn(),
    createVersion: mockFn(),
    findVersion: mockFn(),
    findActiveVersion: mockFn(),
    createDashboard: mockFn(),
    findDashboardByCode: mockFn(),
    createWidget: mockFn(),
  };
  const runsRepo = {
    findSchedulesByDefinitionForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ReportingDefinitionsService(
    em as any,
    definitionsRepo,
    runsRepo as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    definitionsRepo,
    runsRepo,
  };
}

describe('ReportingDefinitionsService', () => {
  describe('createDataSource (UC-39-01)', () => {
    const dto = {
      code: 'DS-CITAS',
      name: 'Citas',
      sourceType: 'READ_MODEL' as const,
      readModelDefinitionId: READ_MODEL,
    };

    it('registers the data source as active', async () => {
      const d = build();
      d.definitionsRepo.findDataSourceByCode.mockResolvedValue(null);
      d.definitionsRepo.createDataSource.mockReturnValue({ id: SOURCE });

      const res = await d.service.createDataSource(dto, actor);

      expect(res).toEqual({
        id: SOURCE,
        code: 'DS-CITAS',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.definitionsRepo.findDataSourceByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createDataSource(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires the read model when the source type is READ_MODEL', async () => {
      const d = build();
      d.definitionsRepo.findDataSourceByCode.mockResolvedValue(null);

      await expect(
        d.service.createDataSource(
          { ...dto, readModelDefinitionId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('requires the view name when the source type is VIEW', async () => {
      const d = build();
      d.definitionsRepo.findDataSourceByCode.mockResolvedValue(null);

      await expect(
        d.service.createDataSource(
          {
            ...dto,
            sourceType: 'VIEW' as const,
            readModelDefinitionId: undefined,
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createDefinition (UC-39-02)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        code: 'REP-01',
        name: 'Citas por mes',
        dataSourceId: SOURCE,
        requiredPermissionId: PERMISSION,
        columns: [{ code: 'mes', label: 'Mes' }],
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.definitionsRepo.findDefinitionByCode.mockResolvedValue(null);
      d.definitionsRepo.findDataSourceById.mockResolvedValue({
        id: SOURCE,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.definitionsRepo.createDefinition.mockReturnValue({ id: DEFINITION });
      d.definitionsRepo.createColumn.mockReturnValue({ id: 'col-1' });
      d.definitionsRepo.createParameter.mockReturnValue({ id: 'par-1' });
    }

    it('creates the definition in draft with its columns', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createDefinition(dto(), actor);

      expect(res).toMatchObject({
        id: DEFINITION,
        stateConceptId: CONCEPTS.REPORT_DRAFT,
        columnIds: ['col-1'],
        parameterIds: [],
      });
    });

    it('numbers parameters and columns in the order received', async () => {
      const d = build();
      wire(d);

      await d.service.createDefinition(
        dto({
          parameters: [
            { code: 'desde', name: 'Desde', dataType: 'date' },
            { code: 'hasta', name: 'Hasta', dataType: 'date' },
          ],
        }),
        actor,
      );

      expect(d.definitionsRepo.createParameter.mock.calls[0][1].ordinal).toBe(
        1,
      );
      expect(d.definitionsRepo.createParameter.mock.calls[1][1].ordinal).toBe(
        2,
      );
      expect(d.definitionsRepo.createColumn.mock.calls[0][1].ordinal).toBe(1);
    });

    it('refuses a non-public report that declares no permission', async () => {
      const d = build();

      await expect(
        d.service.createDefinition(
          dto({ requiredPermissionId: undefined }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a public report with no permission', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createDefinition(
        dto({ requiredPermissionId: undefined, isPublic: true }),
        actor,
      );

      expect(res.id).toBe(DEFINITION);
    });

    it('rejects repeated column codes', async () => {
      const d = build();

      await expect(
        d.service.createDefinition(
          dto({
            columns: [
              { code: 'mes', label: 'Mes' },
              { code: 'mes', label: 'Mes duplicado' },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive data source', async () => {
      const d = build();
      wire(d);
      d.definitionsRepo.findDataSourceById.mockResolvedValue({
        id: SOURCE,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.createDefinition(dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the data source does not exist', async () => {
      const d = build();
      wire(d);
      d.definitionsRepo.findDataSourceById.mockResolvedValue(null);

      await expect(
        d.service.createDefinition(dto(), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishVersion (UC-39-03)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param definition - Valor de definition requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      definition: Record<string, unknown> = {},
    ) {
      const def: any = {
        id: DEFINITION,
        tenantId: TENANT_A,
        currentVersion: 1,
        stateConceptId: CONCEPTS.REPORT_DRAFT,
        querySpecJson: { select: '*' },
        ...definition,
      };
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(def);
      d.definitionsRepo.findVersion.mockResolvedValue(null);
      d.definitionsRepo.findParametersByDefinition.mockResolvedValue([]);
      d.definitionsRepo.createVersion.mockReturnValue({ id: 'ver-1' });
      return def;
    }

    it('the first publication uses version 1 and activates the definition', async () => {
      const d = build();
      const definition = wire(d);

      const res = await d.service.publishVersion(DEFINITION, {}, actor);

      expect(res).toMatchObject({
        version: 1,
        definitionStateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
      });
      expect(definition.stateConceptId).toBe(CONCEPTS.REPORT_STATE_ACTIVE);
    });

    it('a later publication increments the version', async () => {
      const d = build();
      const definition = wire(d, {
        currentVersion: 3,
        stateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
      });

      const res = await d.service.publishVersion(DEFINITION, {}, actor);

      expect(res.version).toBe(4);
      expect(definition.currentVersion).toBe(4);
    });

    it('freezes the query and the parameters in the version', async () => {
      const d = build();
      wire(d);
      d.definitionsRepo.findParametersByDefinition.mockResolvedValue([
        { code: 'desde', dataType: 'date', required: true },
      ]);

      await d.service.publishVersion(DEFINITION, {}, actor);

      const spec = d.definitionsRepo.createVersion.mock.calls[0][1].specJson;
      expect(spec).toMatchObject({
        querySpec: { select: '*' },
        parameters: [{ code: 'desde', dataType: 'date', required: true }],
      });
    });

    it('rejects a version that already exists', async () => {
      const d = build();
      wire(d);
      d.definitionsRepo.findVersion.mockResolvedValue({ id: 'ver-existing' });

      await expect(
        d.service.publishVersion(DEFINITION, {}, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to version a deprecated definition', async () => {
      const d = build();
      wire(d, { stateConceptId: CONCEPTS.REPORT_DEPRECATED });

      await expect(
        d.service.publishVersion(DEFINITION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createDashboard (UC-39-10)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        code: 'DASH-01',
        name: 'Operación',
        widgets: [{ widgetType: 'TABLE' as const, title: 'Citas' }],
        ...overrides,
      };
    }

    it('creates the dashboard with its widgets', async () => {
      const d = build();
      d.definitionsRepo.findDashboardByCode.mockResolvedValue(null);
      d.definitionsRepo.createDashboard.mockReturnValue({ id: 'dash-1' });
      d.definitionsRepo.createWidget.mockReturnValue({ id: 'wid-1' });

      const res = await d.service.createDashboard(dto(), actor);

      expect(res).toMatchObject({
        id: 'dash-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        widgetIds: ['wid-1'],
      });
    });

    it('requires a visualization on a chart widget', async () => {
      const d = build();

      await expect(
        d.service.createDashboard(
          dto({
            widgets: [{ widgetType: 'CHART' as const, title: 'Ingresos' }],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a widget pointing at a deprecated report', async () => {
      const d = build();
      d.definitionsRepo.findDashboardByCode.mockResolvedValue(null);
      d.definitionsRepo.findDefinitionById.mockResolvedValue({
        id: DEFINITION,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.REPORT_DEPRECATED,
      });

      await expect(
        d.service.createDashboard(
          dto({
            widgets: [
              {
                widgetType: 'TABLE' as const,
                title: 'Citas',
                reportDefinitionId: DEFINITION,
              },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate dashboard code', async () => {
      const d = build();
      d.definitionsRepo.findDashboardByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createDashboard(dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deprecateDefinition (UC-39-12)', () => {
    const dto = { reason: 'Reemplazado por REP-02' };

    it('deprecates the definition and suspends its schedules', async () => {
      const d = build();
      const definition: any = {
        id: DEFINITION,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
      };
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(definition);
      const schedule: any = {
        id: 'sched-1',
        isEnabled: true,
        stateConceptId: CONCEPTS.SCHEDULE_STATE_ACTIVE,
      };
      d.runsRepo.findSchedulesByDefinitionForUpdate.mockResolvedValue([
        schedule,
      ]);

      const res = await d.service.deprecateDefinition(DEFINITION, dto, actor);

      expect(res).toMatchObject({
        stateConceptId: CONCEPTS.REPORT_DEPRECATED,
        schedulesSuspended: 1,
      });
      expect(definition.stateConceptId).toBe(CONCEPTS.REPORT_DEPRECATED);
      expect(schedule.isEnabled).toBe(false);
      expect(schedule.stateConceptId).toBe(CONCEPTS.SCHEDULE_SUSPENDED);
    });

    it('does not re-suspend an already suspended schedule', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue({
        id: DEFINITION,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
      });
      d.runsRepo.findSchedulesByDefinitionForUpdate.mockResolvedValue([
        { id: 'sched-1', stateConceptId: CONCEPTS.SCHEDULE_SUSPENDED },
      ]);

      const res = await d.service.deprecateDefinition(DEFINITION, dto, actor);

      expect(res.schedulesSuspended).toBe(0);
    });

    it('rejects deprecating twice', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue({
        id: DEFINITION,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.REPORT_DEPRECATED,
      });

      await expect(
        d.service.deprecateDefinition(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the definition does not exist', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.deprecateDefinition(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});

/** Aserciones del 404 uniforme de REP-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(
    ReportingErrorReason.REPORTING_RESOURCE_OUT_OF_SCOPE,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('ReportingDefinitionsService · alcance de tenant (REP-01)', () => {
  const foreignDefinition = (overrides: Record<string, unknown> = {}) => ({
    id: DEFINITION,
    tenantId: TENANT_B,
    currentVersion: 1,
    stateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
    ...overrides,
  });

  describe('altas: el tenant sale del contexto, no del cuerpo', () => {
    it('createDataSource persiste el tenant activo e ignora el del cuerpo', async () => {
      const d = build();
      d.definitionsRepo.findDataSourceByCode.mockResolvedValue(null);
      d.definitionsRepo.createDataSource.mockReturnValue({ id: SOURCE });

      await d.service.createDataSource(
        {
          code: 'DS-1',
          name: 'Citas',
          sourceType: 'READ_MODEL' as const,
          readModelDefinitionId: READ_MODEL,
          tenantId: TENANT_B,
        },
        actor,
      );

      expect(d.definitionsRepo.createDataSource.mock.calls[0][1]).toMatchObject(
        { tenantId: TENANT_A },
      );
    });

    it('createDataSource sin tenant en el contexto se rechaza (TENANT_REQUIRED) y no persiste', async () => {
      const d = build();

      await expect(
        d.raw.createDataSource(
          {
            code: 'DS-1',
            name: 'Citas',
            sourceType: 'VIEW' as const,
            viewName: 'v',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.definitionsRepo.createDataSource).not.toHaveBeenCalled();
    });

    it('createDefinition persiste el tenant activo e ignora el del cuerpo', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionByCode.mockResolvedValue(null);
      d.definitionsRepo.findDataSourceById.mockResolvedValue({
        id: SOURCE,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.definitionsRepo.createDefinition.mockReturnValue({ id: DEFINITION });
      d.definitionsRepo.createColumn.mockReturnValue({ id: 'col-1' });

      await d.service.createDefinition(
        {
          code: 'REP-X',
          name: 'X',
          dataSourceId: SOURCE,
          requiredPermissionId: PERMISSION,
          columns: [{ code: 'mes', label: 'Mes' }],
          tenantId: TENANT_B,
        } as any,
        actor,
      );

      expect(d.definitionsRepo.createDefinition.mock.calls[0][1]).toMatchObject(
        { tenantId: TENANT_A },
      );
    });

    it('createDefinition con una fuente de otro tenant: 404 uniforme, igual que una inexistente, y no crea nada', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionByCode.mockResolvedValue(null);
      const input: any = {
        code: 'REP-X',
        name: 'X',
        dataSourceId: SOURCE,
        requiredPermissionId: PERMISSION,
        columns: [{ code: 'mes', label: 'Mes' }],
      };

      d.definitionsRepo.findDataSourceById.mockResolvedValue({
        id: SOURCE,
        tenantId: TENANT_B,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const foreign = await expectOutOfScope(
        d.service.createDefinition(input, actor),
        'Fuente de datos no encontrada',
      );

      d.definitionsRepo.findDataSourceById.mockResolvedValue(null);
      const missing = await expectOutOfScope(
        d.service.createDefinition(input, actor),
        'Fuente de datos no encontrada',
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.definitionsRepo.createDefinition).not.toHaveBeenCalled();
      expect(d.definitionsRepo.createColumn).not.toHaveBeenCalled();
    });

    it('createDashboard persiste el tenant activo y rechaza un widget con la definición de otro tenant', async () => {
      const d = build();
      d.definitionsRepo.findDashboardByCode.mockResolvedValue(null);
      d.definitionsRepo.createDashboard.mockReturnValue({ id: 'dash-1' });
      d.definitionsRepo.createWidget.mockReturnValue({ id: 'w-1' });

      await d.service.createDashboard(
        {
          code: 'DASH-1',
          name: 'Operación',
          widgets: [{ widgetType: 'TABLE' as const, title: 'Citas' }],
          tenantId: TENANT_B,
        } as any,
        actor,
      );
      expect(d.definitionsRepo.createDashboard.mock.calls[0][1]).toMatchObject({
        tenantId: TENANT_A,
      });

      d.definitionsRepo.createDashboard.mockClear();
      d.definitionsRepo.createWidget.mockClear();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        foreignDefinition(),
      );
      await expectOutOfScope(
        d.service.createDashboard(
          {
            code: 'DASH-2',
            name: 'Operación',
            widgets: [
              {
                widgetType: 'TABLE' as const,
                title: 'Citas',
                reportDefinitionId: DEFINITION,
              },
            ],
          } as any,
          actor,
        ),
        'Definición del widget no encontrada',
      );
      expect(d.definitionsRepo.createDashboard).not.toHaveBeenCalled();
      expect(d.definitionsRepo.createWidget).not.toHaveBeenCalled();
    });
  });

  describe('publishVersion y deprecateDefinition por UUID', () => {
    it('publicar una definición de otro tenant: 404 uniforme, igual que inexistente; no crea versión ni cambia estado', async () => {
      const d = build();
      const foreign = foreignDefinition();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(foreign);

      const foreignError = await expectOutOfScope(
        d.service.publishVersion(DEFINITION, {}, actor),
        'Definición no encontrada',
      );

      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(null);
      const missingError = await expectOutOfScope(
        d.service.publishVersion(DEFINITION, {}, actor),
        'Definición no encontrada',
      );

      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.definitionsRepo.createVersion).not.toHaveBeenCalled();
      expect(foreign.currentVersion).toBe(1);
      expect(foreign.stateConceptId).toBe(CONCEPTS.REPORT_STATE_ACTIVE);
    });

    it('el tenant activo viaja a la consulta que bloquea la cabecera', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.publishVersion(DEFINITION, {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      expect(d.definitionsRepo.findDefinitionForUpdate).toHaveBeenCalledWith(
        d.tx,
        DEFINITION,
        TENANT_A,
      );
    });

    it('una definición sin tenant (huérfana) también es «no encontrada» para un tenant', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(
        foreignDefinition({ tenantId: undefined }),
      );

      await expectOutOfScope(
        d.service.publishVersion(DEFINITION, {}, actor),
        'Definición no encontrada',
      );
    });

    it('deprecar una definición de otro tenant: 404 uniforme; no suspende sus programaciones', async () => {
      const d = build();
      const foreign = foreignDefinition();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(foreign);

      await expectOutOfScope(
        d.service.deprecateDefinition(DEFINITION, { reason: 'x' }, actor),
        'Definición no encontrada',
      );

      expect(
        d.runsRepo.findSchedulesByDefinitionForUpdate,
      ).not.toHaveBeenCalled();
      expect(foreign.stateConceptId).toBe(CONCEPTS.REPORT_STATE_ACTIVE);
    });

    it('un administrador de B sí opera sobre la definición de B (el 404 no es general)', async () => {
      const d = build();
      const own = foreignDefinition();
      d.definitionsRepo.findDefinitionForUpdate.mockResolvedValue(own);
      d.runsRepo.findSchedulesByDefinitionForUpdate.mockResolvedValue([]);
      const serviceOfB = inTenant(d.raw, TENANT_B);

      const res = await serviceOfB.deprecateDefinition(
        DEFINITION,
        { reason: 'x' },
        actor,
      );

      expect(res.stateConceptId).toBe(CONCEPTS.REPORT_DEPRECATED);
    });
  });
});
