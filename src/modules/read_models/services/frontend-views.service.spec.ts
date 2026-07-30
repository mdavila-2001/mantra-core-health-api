import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FrontendViewsService } from './frontend-views.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { RM } from '../read_models.concepts';

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
    createField: mockFn(),
    createSortOption: mockFn(),
    createAction: mockFn(),
    createKpi: mockFn(),
    createState: mockFn(),
  };
  const prefsRepo = { findByUserAndView: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new FrontendViewsService(
    em as any,
    definitionsRepo as any,
    runsRepo as any,
    surfacesRepo,
    routesRepo,
    pageViewsRepo as any,
    childrenRepo as any,
    prefsRepo,
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

  describe('serveData (UC-30-05 / UC-30-11)', () => {
    it('masks sensitive fields for a non-privileged user and computes staleness', async () => {
      const d = build();
      d.surfacesRepo.findByCode.mockResolvedValue({ id: 'surf-1' });
      d.routesRepo.findBySurfaceAndCode.mockResolvedValue({ id: 'route-1' });
      d.pageViewsRepo.findByRouteAndCode.mockResolvedValue({
        id: 'view-1',
        viewCode: 'account_list',
        readModelDefinitionId: 'def-1',
      });
      d.childrenRepo.listFields.mockResolvedValue([
        {
          fieldCode: 'name',
          label: 'Name',
          dataType: 'string',
          sensitive: false,
        },
        { fieldCode: 'ssn', label: 'SSN', dataType: 'string', sensitive: true },
      ]);
      d.childrenRepo.listActions.mockResolvedValue([
        {
          actionCode: 'edit',
          label: 'Edit',
          actionTypeConceptId: RM.ACTION_TYPE_MUTATION,
          requiredPermissionId: 'perm-1',
        },
      ]);
      d.runsRepo.findLatestByDefinition.mockResolvedValue({
        completedAt: new Date(Date.now() - 5000),
      });

      const res = await d.service.serveData(
        'portal',
        'route',
        'account_list',
        endUser,
      );

      expect(res.fields.find((f) => f.fieldCode === 'ssn')?.masked).toBe(true);
      expect(res.fields.find((f) => f.fieldCode === 'name')?.masked).toBe(
        false,
      );
      // action requires a permission the end user lacks -> disabled
      expect(res.availableActions[0].enabled).toBe(false);
      expect(res.stalenessSeconds).toBeGreaterThanOrEqual(4);
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
