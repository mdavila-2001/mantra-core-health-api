import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReportingDefinitionsService } from './reporting-definitions.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['REPORTING_ADMIN'] };
const SOURCE = '11111111-1111-1111-1111-111111111111';
const DEFINITION = '22222222-2222-2222-2222-222222222222';
const READ_MODEL = '33333333-3333-3333-3333-333333333333';
const PERMISSION = '44444444-4444-4444-4444-444444444444';

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
  return { service, tx, definitionsRepo, runsRepo };
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

    function wire(d: ReturnType<typeof build>) {
      d.definitionsRepo.findDefinitionByCode.mockResolvedValue(null);
      d.definitionsRepo.findDataSourceById.mockResolvedValue({
        id: SOURCE,
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
    function wire(
      d: ReturnType<typeof build>,
      definition: Record<string, unknown> = {},
    ) {
      const def: any = {
        id: DEFINITION,
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
