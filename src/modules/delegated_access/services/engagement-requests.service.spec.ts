import { jest } from '@jest/globals';
import {
  EngagementRequestsService,
  REQUEST_TTL_DAYS,
} from './engagement-requests.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';
import { namesRepoDouble } from './support-names.testing';
import { STATUS } from './concept-maps';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const ANA = { id: 'user-ana', roles: [] } as any;

const pendingItem = (id: string, actions = ['schedule.view']) => ({
  id,
  engagementRequestId: 'req-1',
  targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
  practitionerRoleAssignmentId: `pra-${id}`,
  proposedActionsJson: actions,
  decisionConceptId: DELEG.ENGAGEMENT_DECISION_PENDING,
  createdAt: new Date(),
});

/** Construye el servicio con repositorios y colaboradores en doble. */
function build(items = [pendingItem('i1'), pendingItem('i2')]) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const request = {
    id: 'req-1',
    tenantId: TENANT,
    requesterUserId: 'user-ana',
    directionConceptId: DELEG.ENGAGEMENT_DIRECTION_REQUEST,
    roleTemplateId: 'tpl-secretary',
    statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const requests = {
    findById: mockFn().mockResolvedValue(request),
    findItems: mockFn().mockResolvedValue(items),
    create: mockFn().mockReturnValue({
      id: 'req-new',
      statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
      createdAt: new Date('2026-10-30'),
    }),
    createItem: mockFn(),
    findOverduePending: mockFn().mockResolvedValue([]),
    findByTenant: mockFn().mockResolvedValue([]),
    findByRequester: mockFn().mockResolvedValue([]),
  };
  const templates = {
    findEffectiveByCode: mockFn().mockResolvedValue({
      id: 'tpl-secretary',
      code: 'SECRETARY',
      defaultActionsJson: ['schedule.view', 'schedule.create'],
    }),
    findById: mockFn().mockResolvedValue({
      id: 'tpl-secretary',
      code: 'SECRETARY',
    }),
  };
  const engagement = {
    id: 'eng-1',
    tenantMembershipId: 'mem-1',
    statusConceptId: STATUS.ACTIVE,
  };
  const engagements = {
    create: mockFn().mockReturnValue(engagement),
    findByIds: mockFn().mockResolvedValue([engagement]),
    findActiveByMembershipTemplate: mockFn().mockResolvedValue(null),
  };
  const grants = {
    create: mockFn().mockImplementation(() => ({
      id: `grant-${Math.random()}`,
    })),
    addActions: mockFn(),
  };
  const directory = {
    findTenant: mockFn().mockResolvedValue({
      id: TENANT,
      tenantTypeConceptId: 'x',
    }),
    findMembership: mockFn().mockResolvedValue(null),
    ensureActiveStaffMembership: mockFn().mockResolvedValue({ id: 'mem-1' }),
  };
  const targets = {
    assertTarget: mockFn().mockResolvedValue({}),
    buildSnapshot: mockFn().mockResolvedValue({ rows: [] }),
  };
  const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EngagementRequestsService(
    em as any,
    requests as any,
    templates as any,
    engagements as any,
    grants as any,
    directory as any,
    targets as any,
    effective as any,
    scope,
    logger as any,
    namesRepoDouble(mockFn) as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    tx,
    request,
    requests,
    templates,
    engagements,
    grants,
    directory,
    targets,
    effective,
    inTenant,
  };
}

describe('EngagementRequestsService', () => {
  describe('create', () => {
    const dto = {
      tenantId: TENANT,
      roleTemplateCode: 'SECRETARY',
      items: [
        {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: 'pra-perez',
        },
      ],
    } as any;

    it('abre la solicitud pendiente, vence a los 15 días y propone las acciones de la plantilla', async () => {
      const d = build();
      const before = Date.now();
      await d.service.create(dto, ANA);
      const [[, data]] = d.requests.create.mock.calls;
      expect(data.statusConceptId).toBe(DELEG.ENGAGEMENT_STATUS_PENDING);
      expect(data.directionConceptId).toBe(DELEG.ENGAGEMENT_DIRECTION_REQUEST);
      const days = (data.expiresAt.getTime() - before) / 86_400_000;
      expect(days).toBeGreaterThan(REQUEST_TTL_DAYS - 0.01);
      expect(days).toBeLessThan(REQUEST_TTL_DAYS + 0.01);
      const [[, item]] = d.requests.createItem.mock.calls;
      expect(item.proposedActions).toEqual([
        'schedule.view',
        'schedule.create',
      ]);
    });

    it('valida cada objetivo contra la organización a la que se pide', async () => {
      const d = build();
      await d.service.create(dto, ANA);
      expect(d.targets.assertTarget).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'PRACTITIONER',
        expect.objectContaining({ practitionerRoleAssignmentId: 'pra-perez' }),
      );
    });

    it('M8: fija el tenant de la organización pedida para las políticas por fila', async () => {
      const d = build();
      await d.service.create(dto, ANA);
      const [[, params]] = d.tx.execute.mock.calls.filter(([sql]: [string]) =>
        sql.includes('app.current_tenant_id'),
      );
      expect(params).toEqual([TENANT]);
    });

    it('M3: tope de solicitudes abiertas por persona y organización: no se inunda la bandeja del administrador', async () => {
      const d = build();
      const open = (): any => ({
        tenantId: TENANT,
        statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      d.requests.findByRequester.mockResolvedValue([open(), open(), open()]);
      await expect(d.service.create(dto, ANA)).rejects.toMatchObject({
        reason: Reason.SUPPORT_REQUEST_LIMIT_REACHED,
      });
      expect(d.requests.create).not.toHaveBeenCalled();
    });

    it('M3: las solicitudes de otra organización, ya decididas o vencidas no cuentan para el tope', async () => {
      const d = build();
      d.requests.findByRequester.mockResolvedValue([
        { tenantId: 'otra', statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING },
        {
          tenantId: TENANT,
          statusConceptId: DELEG.ENGAGEMENT_STATUS_APPROVED,
        },
        {
          tenantId: TENANT,
          statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
          expiresAt: new Date(Date.now() - 1000),
        },
      ]);
      await expect(d.service.create(dto, ANA)).resolves.toBeDefined();
    });

    it('rechaza una organización inexistente con 404 uniforme', async () => {
      const d = build();
      d.directory.findTenant.mockResolvedValue(null);
      await expect(d.service.create(dto, ANA)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('no amplía un vínculo que no es de la persona o no está activo', async () => {
      const d = build();
      d.directory.findMembership.mockResolvedValue({ id: 'otra-membresia' });
      await expect(
        d.service.create({ ...dto, parentAssignmentId: 'eng-1' }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
      });
    });
  });

  describe('decide', () => {
    it('aprobación parcial: aprueba un ítem, rechaza otro con motivo y abre el vínculo', async () => {
      const d = build();
      const result = await d.inTenant(() =>
        d.service.decide(
          'req-1',
          {
            items: [
              { itemId: 'i1', decision: 'APPROVED' },
              {
                itemId: 'i2',
                decision: 'REJECTED',
                comment: 'No atiende ese doctor',
              },
            ],
            recertifyEveryMonths: 6,
          } as any,
          ADMIN,
        ),
      );
      expect(result.status).toBe('APPROVED');
      expect(result.grantIds).toHaveLength(1);
      expect(result.engagementId).toBe('eng-1');
      expect(d.grants.create).toHaveBeenCalledTimes(1);
      const [[, engagementData]] = d.engagements.create.mock.calls;
      expect(engagementData.recertifyEveryMonths).toBe(6);
      expect(engagementData.originConceptId).toBe(
        DELEG.ENGAGEMENT_ORIGIN_REQUEST,
      );
      expect(d.effective.refreshTenant).toHaveBeenCalled();
    });

    it('un ajuste cambia el objetivo y las acciones del permiso emitido', async () => {
      const d = build([pendingItem('i1')]);
      await d.inTenant(() =>
        d.service.decide(
          'req-1',
          {
            items: [
              {
                itemId: 'i1',
                decision: 'ADJUSTED',
                comment: 'Solo ver',
                adjustment: {
                  targetKind: 'PRACTITIONER',
                  practitionerRoleAssignmentId: 'pra-otro',
                  actions: ['schedule.view'],
                },
              },
            ],
          } as any,
          ADMIN,
        ),
      );
      expect(d.targets.assertTarget).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'PRACTITIONER',
        expect.objectContaining({ practitionerRoleAssignmentId: 'pra-otro' }),
      );
      const [[, , permissionIds]] = d.grants.addActions.mock.calls;
      expect(permissionIds).toHaveLength(1);
    });

    it('pendiente 27: aprueba átomos con una condición ABAC: la concesión nace con su condición y el guardián la valida', async () => {
      const d = build([pendingItem('i1', ['agenda.appointment.view'])]);
      const writeGuard = { assertCanWrite: mockFn().mockResolvedValue({}) };
      (d.service as any).writeGuard = writeGuard;
      const condition = {
        schemaVersion: 1,
        time: {
          windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
        },
      };
      await d.inTenant(() =>
        d.service.decide(
          'req-1',
          {
            items: [
              {
                itemId: 'i1',
                decision: 'APPROVED',
                actions: [
                  'agenda.appointment.view',
                  'agenda.appointment.cancel',
                ],
                condition,
              },
            ],
          } as any,
          ADMIN,
        ),
      );
      expect(writeGuard.assertCanWrite).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          grant: expect.objectContaining({
            actions: ['agenda.appointment.view', 'agenda.appointment.cancel'],
            condition,
          }),
        }),
      );
      expect(d.grants.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ condition, conditionSchemaVersion: 1 }),
      );
      const [[, , permissionIds]] = d.grants.addActions.mock.calls;
      expect(permissionIds).toHaveLength(2);
    });

    it('pendiente 27: una condición inválida la corta el guardián y no se crea el permiso', async () => {
      const d = build([pendingItem('i1')]);
      (d.service as any).writeGuard = {
        assertCanWrite: mockFn().mockRejectedValue(
          Object.assign(new Error('condición'), {
            reason: 'CONDITION_TIME_EMPTY_WINDOW',
          }),
        ),
      };
      await expect(
        d.inTenant(() =>
          d.service.decide(
            'req-1',
            {
              items: [
                {
                  itemId: 'i1',
                  decision: 'APPROVED',
                  condition: { schemaVersion: 1, time: { windows: [] } },
                },
              ],
            } as any,
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({ reason: 'CONDITION_TIME_EMPTY_WINDOW' });
      expect(d.grants.create).not.toHaveBeenCalled();
    });

    it('un vínculo activo con la misma plantilla se amplía: el modelo admite uno por membresía y plantilla', async () => {
      const d = build([pendingItem('i1')]);
      d.engagements.findActiveByMembershipTemplate.mockResolvedValue({
        id: 'eng-existente',
        statusConceptId: STATUS.ACTIVE,
      });
      await d.inTenant(() =>
        d.service.decide(
          'req-1',
          { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
          ADMIN,
        ),
      );
      expect(d.engagements.create).not.toHaveBeenCalled();
      const [[, data]] = d.grants.create.mock.calls;
      expect(data.organizationUserAssignmentId).toBe('eng-existente');
    });

    it('la membresía terminada o suspendida se reactiva en vez de abrir otra', async () => {
      const d = build([pendingItem('i1')]);
      await d.inTenant(() =>
        d.service.decide(
          'req-1',
          { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
          ADMIN,
        ),
      );
      expect(d.directory.ensureActiveStaffMembership).toHaveBeenCalledWith(
        expect.anything(),
        'user-ana',
        TENANT,
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        'admin-1',
      );
    });

    it('B1: quien pidió no decide su propia solicitud (separación de funciones)', async () => {
      const d = build([pendingItem('i1')]);
      const yoMismo = { id: 'user-ana', roles: ['SECURITY_ADMIN'] } as any;
      await expect(
        d.inTenant(() =>
          d.service.decide(
            'req-1',
            { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
            yoMismo,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_DECISION_SELF });
      expect(d.engagements.create).not.toHaveBeenCalled();
      expect(d.grants.create).not.toHaveBeenCalled();
    });

    it('un permiso FIXED guarda la foto congelada', async () => {
      const d = build([pendingItem('i1')]);
      await d.inTenant(() =>
        d.service.decide(
          'req-1',
          {
            items: [
              { itemId: 'i1', decision: 'APPROVED', expansionMode: 'FIXED' },
            ],
          } as any,
          ADMIN,
        ),
      );
      expect(d.targets.buildSnapshot).toHaveBeenCalled();
      const [[, grantData]] = d.grants.create.mock.calls;
      expect(grantData.fixedSnapshot).toEqual({ rows: [] });
      expect(grantData.statusConceptId).toBe(DELEG.SUPPORT_GRANT_ACTIVE);
    });

    it('si todo se rechaza no abre vínculo y la solicitud queda rechazada', async () => {
      const d = build([pendingItem('i1')]);
      const result = await d.inTenant(() =>
        d.service.decide(
          'req-1',
          {
            items: [{ itemId: 'i1', decision: 'REJECTED', comment: 'No' }],
          } as any,
          ADMIN,
        ),
      );
      expect(result.status).toBe('REJECTED');
      expect(result.engagementId).toBeUndefined();
      expect(d.engagements.create).not.toHaveBeenCalled();
    });

    it('exige decidir todos los ítems pendientes', async () => {
      const d = build();
      await expect(
        d.inTenant(() =>
          d.service.decide(
            'req-1',
            { items: [{ itemId: 'i1', decision: 'APPROVED' }] } as any,
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_DECISION_INCOMPLETE });
    });

    it('rechazar o ajustar sin motivo es un error de validación', async () => {
      const d = build([pendingItem('i1')]);
      await expect(
        d.inTenant(() =>
          d.service.decide(
            'req-1',
            { items: [{ itemId: 'i1', decision: 'REJECTED' }] } as any,
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_DECISION_REASON_REQUIRED,
      });
    });

    it('una solicitud de otra organización responde como inexistente', async () => {
      const d = build();
      d.request.tenantId = 'tenant-ajeno';
      await expect(
        d.inTenant(() =>
          d.service.decide('req-1', { items: [] } as any, ADMIN),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no decide una solicitud vencida ni una ya decidida', async () => {
      const vencida = build();
      vencida.request.expiresAt = new Date(Date.now() - 1000);
      await expect(
        vencida.inTenant(() =>
          vencida.service.decide('req-1', { items: [] } as any, ADMIN),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_REQUEST_EXPIRED });

      const decidida = build();
      decidida.request.statusConceptId = DELEG.ENGAGEMENT_STATUS_APPROVED;
      await expect(
        decidida.inTenant(() =>
          decidida.service.decide('req-1', { items: [] } as any, ADMIN),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('expireOverdue', () => {
    it('marca como vencidas las pendientes pasado su plazo', async () => {
      const d = build();
      const overdue = [
        { statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING },
        { statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING },
      ];
      d.requests.findOverduePending.mockResolvedValue(overdue);
      await expect(d.service.expireOverdue()).resolves.toBe(2);
      expect(
        overdue.every(
          (r) => r.statusConceptId === DELEG.ENGAGEMENT_STATUS_EXPIRED,
        ),
      ).toBe(true);
    });
  });

  describe('listForTenant', () => {
    it('muestra como vencida una pendiente cuyo plazo ya pasó', async () => {
      const d = build();
      d.requests.findByTenant.mockResolvedValue([
        { ...d.request, expiresAt: new Date(Date.now() - 1000) },
      ]);
      const page = await d.inTenant(() => d.service.listForTenant({}));
      expect(page.items[0].status).toBe('EXPIRED');
    });
  });

  describe('forma de la vista (lo que usan las pantallas)', () => {
    /** Una solicitud decidida con los ítems dados. */
    const decided = (
      status: string,
      decisions: string[],
    ): ReturnType<typeof build> => {
      const items = decisions.map((decision, i) => ({
        ...pendingItem(`i${i}`),
        decisionConceptId: decision,
        healthcareServiceId: i === 0 ? 'svc-1' : undefined,
        careSpaceId: i === 1 ? 'space-1' : undefined,
      }));
      const d = build(items as any);
      d.request.statusConceptId = status;
      d.requests.findByTenant.mockResolvedValue([d.request]);
      return d;
    };
    const view = async (d: ReturnType<typeof build>) =>
      (await d.inTenant(() => d.service.listForTenant({}))).items[0];

    it('trae el código de la plantilla (además del id), quién pide, la organización, la fecha de creación y los nombres de cada ítem', async () => {
      const d = decided(DELEG.ENGAGEMENT_STATUS_PENDING, [
        DELEG.ENGAGEMENT_DECISION_PENDING,
        DELEG.ENGAGEMENT_DECISION_PENDING,
      ]);
      const names = (d.service as any).names;
      names.userNames.mockResolvedValue(
        new Map([['user-ana', 'Ana Gutiérrez']]),
      );
      names.tenantNames.mockResolvedValue(
        new Map([[TENANT, 'Hospital Piloto Mantra']]),
      );
      names.doctorNamesByRoleAssignment.mockResolvedValue(
        new Map([['pra-i0', { profileId: 'p', name: 'Andrés Pérez' }]]),
      );
      names.serviceNames.mockResolvedValue(new Map([['svc-1', 'Cardiología']]));
      names.locationNames.mockResolvedValue(new Map([['space-1', 'Piso 1']]));
      const v = await view(d);
      expect(v).toMatchObject({
        roleTemplateId: 'tpl-secretary',
        roleTemplateCode: 'SECRETARY',
        requesterName: 'Ana Gutiérrez',
        organizationName: 'Hospital Piloto Mantra',
        createdAt: d.request.createdAt,
        status: 'PENDING',
      });
      expect(v.items[0]).toMatchObject({
        practitionerName: 'Andrés Pérez',
        serviceName: 'Cardiología',
      });
      expect(v.items[1]).toMatchObject({ locationName: 'Piso 1' });
    });

    it('una aprobada donde algún ítem se rechazó figura PARTIAL', async () => {
      const d = decided(DELEG.ENGAGEMENT_STATUS_APPROVED, [
        DELEG.ENGAGEMENT_DECISION_APPROVED,
        DELEG.ENGAGEMENT_DECISION_REJECTED,
      ]);
      expect((await view(d)).status).toBe('PARTIAL');
    });

    it('aprobada entera (con o sin ajustes) sigue APPROVED; rechazada, REJECTED; cancelada, CANCELLED', async () => {
      const approved = decided(DELEG.ENGAGEMENT_STATUS_APPROVED, [
        DELEG.ENGAGEMENT_DECISION_APPROVED,
        DELEG.ENGAGEMENT_DECISION_ADJUSTED,
      ]);
      expect((await view(approved)).status).toBe('APPROVED');
      const rejected = decided(DELEG.ENGAGEMENT_STATUS_REJECTED, [
        DELEG.ENGAGEMENT_DECISION_REJECTED,
        DELEG.ENGAGEMENT_DECISION_REJECTED,
      ]);
      expect((await view(rejected)).status).toBe('REJECTED');
      const cancelled = decided(DELEG.ENGAGEMENT_STATUS_CANCELLED, [
        DELEG.ENGAGEMENT_DECISION_PENDING,
      ]);
      expect((await view(cancelled)).status).toBe('CANCELLED');
    });
  });
});
