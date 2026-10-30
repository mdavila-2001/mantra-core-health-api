import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { PRAC } from '../practice.concepts';
import {
  PARENT_RULE_SEED,
  TYPOLOGY_RULE_SEED,
} from '../domain/structure/structure-catalog';
import { CareSpacesAdminService } from './care-spaces-admin.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-a';
const OTHER = 'tenant-b';
const actor = { id: 'owner-1', roles: ['USER'] } as any;

let seq = 0;
const nextId = () => `id-${++seq}`;

/**
 * Arma el servicio con dobles en memoria: la sede y sus espacios viven en
 * arrays, y los dobles de acceso reproducen el contrato de
 * `StructureAccessService` (404 si la fila no es del tenant activo).
 */
function build(opts: { typology?: string; siteStatus?: string } = {}) {
  const site: any = {
    id: 's1',
    practiceId: 'p1',
    tenantId: TENANT,
    statusConceptId: opts.siteStatus ?? PRAC.SITE_ACTIVE,
    facilityTypologyConceptId: opts.typology,
    rowVersion: 1,
  };
  const spaces: any[] = [];
  const assignments: any[] = [];
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const access = {
    requireSite: mockFn(async (_t: any, id: string, tenant: string) => {
      if (id !== site.id || site.tenantId !== tenant)
        throw new ResourceNotFoundException('Sitio no encontrado');
      return site;
    }),
    requireSpace: mockFn(async (_t: any, id: string, tenant: string) => {
      const s = spaces.find((x) => x.id === id);
      if (!s || s.tenantId !== tenant)
        throw new ResourceNotFoundException('Espacio no encontrado');
      return s;
    }),
    assertCanWriteSite: mockFn().mockResolvedValue(undefined),
    assertCanRead: mockFn().mockResolvedValue(undefined),
  };
  const spacesRepo = {
    findBySite: mockFn(async () => [...spaces]),
    findChildren: mockFn(async (_t: any, id: string) =>
      spaces.filter((s) => s.parentSpaceId === id),
    ),
    create: mockFn((_t: any, data: any) => {
      const row = { id: nextId(), rowVersion: 1, ...data };
      delete row.actorUserId;
      spaces.push(row);
      return row;
    }),
  };
  const unitsRepo = {
    findById: mockFn().mockResolvedValue(null),
    findBySite: mockFn().mockResolvedValue([]),
  };
  const rulesRepo = {
    parentRules: mockFn().mockResolvedValue(PARENT_RULE_SEED),
    typologyRules: mockFn().mockResolvedValue(TYPOLOGY_RULE_SEED),
  };
  const assignmentsRepo = {
    findById: mockFn(
      async (_t: any, id: string) =>
        assignments.find((a) => a.id === id) ?? null,
    ),
    findCurrentBySpaces: mockFn(async (_t: any, ids: string[]) =>
      assignments.filter((a) => ids.includes(a.careSpaceId) && !a.validTo),
    ),
    create: mockFn((_t: any, data: any) => {
      const row = { id: nextId(), ...data };
      assignments.push(row);
      return row;
    }),
  };
  const zero = { count: 0, sampleIds: [] };
  const blockersRepo = {
    forSpace: mockFn().mockResolvedValue({
      activeEncounters: zero,
      futureProcedures: zero,
      futureBookings: zero,
      schedulableResources: zero,
    }),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CareSpacesAdminService(
    em,
    access as any,
    spacesRepo as any,
    unitsRepo as any,
    rulesRepo as any,
    assignmentsRepo as any,
    blockersRepo as any,
    historyRepo as any,
    outbox as any,
    logger as any,
  );
  return {
    service,
    site,
    spaces,
    assignments,
    access,
    spacesRepo,
    historyRepo,
    outbox,
    blockersRepo,
    tx,
  };
}

const room = (over: Record<string, unknown> = {}) => ({
  code: `R-${++seq}`,
  name: 'Local',
  formCode: 'LOC_FORM_ROOM',
  functionCode: 'SPACE_FN_CONSULTING_ROOM',
  ...over,
});

describe('CareSpacesAdminService', () => {
  describe('alta (POST /sites/:siteId/care-spaces)', () => {
    it('sede de otro tenant: 404, sin autorizar ni crear (fail-closed)', async () => {
      const d = build();
      await expect(
        d.service.create('s1', room() as any, actor, OTHER),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.access.assertCanWriteSite).not.toHaveBeenCalled();
      expect(d.spacesRepo.create).not.toHaveBeenCalled();
    });

    it('sin administrar la org ni la sucursal: 403 y no crea', async () => {
      const d = build();
      d.access.assertCanWriteSite.mockRejectedValue(
        new ForbiddenException('no'),
      );
      await expect(
        d.service.create('s1', room() as any, actor, TENANT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.spacesRepo.create).not.toHaveBeenCalled();
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('sede no activa: 422 SITE_NOT_ACTIVE (F0: «rejects when the site is not active»)', async () => {
      const d = build({ siteStatus: PRAC.SITE_RETIRED });
      await expect(
        d.service.create('s1', room() as any, actor, TENANT),
      ).rejects.toMatchObject({ reason: 'SITE_NOT_ACTIVE' });
    });

    it('permitido: nace PLANNED con tenant, revisión con tenant y evento', async () => {
      const d = build();
      const res = await d.service.create(
        's1',
        room({ code: 'C-1' }) as any,
        actor,
        TENANT,
      );
      expect(res.status?.code).toBe('SPACE_PLANNED');
      expect(res.form?.code).toBe('LOC_FORM_ROOM');
      expect(res.operationalStatus).toBeNull();
      expect(d.spacesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT, practiceSiteId: 's1' }),
      );
      expect(d.historyRepo.append).toHaveBeenCalledWith(
        d.tx,
        'care_spaces',
        res.id,
        expect.objectContaining({
          operationConceptId: AUD.OPERATION_INSERT,
          tenantId: TENANT,
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'practice.care_space.created',
          tenantId: TENANT,
          aggregateId: res.id,
        }),
      );
    });

    it('cuerpo de F0 (sin forma ni función): local genérico ACTIVO y disponible', async () => {
      const d = build();
      const res = await d.service.create(
        's1',
        { code: 'C-OLD', name: 'Room' } as any,
        actor,
        TENANT,
      );
      expect(res.status?.code).toBe('SPACE_ACTIVE');
      expect(res.function?.code).toBe('SPACE_TYPE_ROOM');
      expect(res.operationalStatus?.code).toBe('SPACE_OP_AVAILABLE');
    });

    it('cama en la raíz: 422 SPACE_PARENT_RULE_VIOLATION', async () => {
      const d = build();
      await expect(
        d.service.create(
          's1',
          room({
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
          }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_PARENT_RULE_VIOLATION' });
      expect(d.spacesRepo.create).not.toHaveBeenCalled();
    });

    it('cama bajo un local: permitido', async () => {
      const d = build();
      const parent = await d.service.create('s1', room() as any, actor, TENANT);
      const bed = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: parent.id,
        }) as any,
        actor,
        TENANT,
      );
      expect(bed.parentId).toBe(parent.id);
      expect(bed.path.map((p) => p.id)).toEqual([parent.id]);
    });

    it('función que no admite la forma: 422 SPACE_FUNCTION_FORM_MISMATCH', async () => {
      const d = build();
      await expect(
        d.service.create(
          's1',
          room({ functionCode: 'SPACE_FN_BED_STANDARD' }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_FUNCTION_FORM_MISMATCH' });
    });

    it('quirófano en un Puesto de Salud: 422 SPACE_TYPOLOGY_FORBIDDEN', async () => {
      const d = build({ typology: PRAC.TYPOLOGY_HEALTH_POST });
      await expect(
        d.service.create(
          's1',
          room({ functionCode: 'SPACE_FN_OPERATING_ROOM' }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_TYPOLOGY_FORBIDDEN' });
    });

    it('código repetido en la sede: 409 SPACE_CODE_TAKEN', async () => {
      const d = build();
      await d.service.create('s1', room({ code: 'DUP' }) as any, actor, TENANT);
      const err: any = await d.service
        .create('s1', room({ code: 'DUP' }) as any, actor, TENANT)
        .catch((e) => e);
      expect(err.reason).toBe('SPACE_CODE_TAKEN');
      expect(err.getStatus()).toBe(409);
    });

    it('activo bajo un padre planificado: 422 PARENT_NOT_ACTIVE', async () => {
      const d = build();
      const parent = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_BUILDING',
          functionCode: 'SPACE_FN_BUILDING_GENERIC',
        }) as any,
        actor,
        TENANT,
      );
      await expect(
        d.service.create(
          's1',
          room({ parentSpaceId: parent.id, activate: true }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'PARENT_NOT_ACTIVE' });
    });

    it('padre de otra sede u otro tenant: 404 sin revelar', async () => {
      const d = build();
      await expect(
        d.service.create(
          's1',
          room({ parentSpaceId: 'foreign' }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('código de atributo de otro grupo: 422 SPACE_UNKNOWN_CODE', async () => {
      const d = build();
      await expect(
        d.service.create(
          's1',
          room({ pressureCode: 'ASEPSIS_SEMI' }) as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_UNKNOWN_CODE' });
    });
  });

  describe('alta masiva', () => {
    it('crea por patrón bajo el mismo padre', async () => {
      const d = build();
      const parent = await d.service.create('s1', room() as any, actor, TENANT);
      const res = await d.service.bulkCreate(
        's1',
        {
          parentSpaceId: parent.id,
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          codePattern: 'CAMA-{1..3}',
          namePattern: 'Cama {}',
          censable: true,
        } as any,
        actor,
        TENANT,
      );
      expect(res.created.map((c) => c.code)).toEqual([
        'CAMA-1',
        'CAMA-2',
        'CAMA-3',
      ]);
      expect(res.created[0].censable).toBe(true);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(4);
    });

    it('todo o nada: un código tomado rechaza el lote entero', async () => {
      const d = build();
      const parent = await d.service.create('s1', room() as any, actor, TENANT);
      await d.service.create(
        's1',
        room({
          code: 'CAMA-2',
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: parent.id,
        }) as any,
        actor,
        TENANT,
      );
      const before = d.spaces.length;
      await expect(
        d.service.bulkCreate(
          's1',
          {
            parentSpaceId: parent.id,
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
            codePattern: 'CAMA-{1..3}',
            namePattern: 'Cama',
          } as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'IMPORT_INVALID_ROWS' });
      expect(d.spaces.length).toBe(before);
    });

    it('patrón inválido: 422 BULK_PATTERN_INVALID', async () => {
      const d = build();
      await expect(
        d.service.bulkCreate(
          's1',
          {
            formCode: 'LOC_FORM_ROOM',
            functionCode: 'SPACE_FN_OFFICE_ADMIN',
            codePattern: 'SIN-RANGO',
            namePattern: 'x',
          } as any,
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'BULK_PATTERN_INVALID' });
    });
  });

  describe('importación', () => {
    const rows = [
      {
        code: 'ED-1',
        name: 'Edificio',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
      },
      {
        code: 'P-1',
        name: 'Piso 1',
        formCode: 'LOC_FORM_LEVEL',
        functionCode: 'SPACE_FN_LEVEL_GENERIC',
        parentCode: 'ED-1',
      },
      {
        code: 'X',
        name: 'Cama suelta',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
      },
      {
        code: 'Y',
        name: 'Sin padre',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OFFICE_ADMIN',
        parentCode: 'NO-EXISTE',
      },
    ];

    it('dryRun: errores por línea y nada escrito', async () => {
      const d = build();
      const res = await d.service.importRows(
        's1',
        { rows } as any,
        true,
        actor,
        TENANT,
      );
      expect(res.ok).toBe(false);
      expect(res.rows.map((r) => r.status)).toEqual([
        'ok',
        'ok',
        'error',
        'error',
      ]);
      expect(res.rows[2].errors[0]).toEqual({
        field: 'parentSpaceId',
        reason: 'SPACE_PARENT_RULE_VIOLATION',
      });
      expect(res.rows[3].errors[0]).toEqual({
        field: 'parentCode',
        reason: 'NOT_FOUND',
      });
      expect(d.spacesRepo.create).not.toHaveBeenCalled();
    });

    it('dryRun=false con errores: ok false y created 0 (todo o nada)', async () => {
      const d = build();
      const res = await d.service.importRows(
        's1',
        { rows } as any,
        false,
        actor,
        TENANT,
      );
      expect(res).toMatchObject({ ok: false, created: 0 });
      expect(d.spacesRepo.create).not.toHaveBeenCalled();
    });

    it('dryRun=false válido: crea en orden y resuelve el padre del mismo lote', async () => {
      const d = build();
      const res = await d.service.importRows(
        's1',
        { rows: rows.slice(0, 2) } as any,
        false,
        actor,
        TENANT,
      );
      expect(res).toMatchObject({ ok: true, created: 2 });
      const level = d.spaces.find((s) => s.code === 'P-1');
      expect(level.parentSpaceId).toBe(
        d.spaces.find((s) => s.code === 'ED-1').id,
      );
    });

    it('campo con tipo inválido: error de validación de la fila', async () => {
      const d = build();
      const res = await d.service.importRows(
        's1',
        { rows: [{ ...rows[0], floorNumber: 'tres' }] } as any,
        true,
        actor,
        TENANT,
      );
      expect(res.rows[0].status).toBe('error');
      expect(res.rows[0].errors[0].field).toBe('floorNumber');
    });
  });

  describe('edición, movimiento e If-Match', () => {
    it('sin If-Match: 412 IF_MATCH_REQUIRED; con otra versión: 412 ROW_VERSION_MISMATCH', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      const e1: any = await d.service
        .update(s.id, { name: 'X' } as any, undefined, actor, TENANT)
        .catch((e) => e);
      expect([e1.getStatus(), e1.reason]).toEqual([412, 'IF_MATCH_REQUIRED']);
      const e2: any = await d.service
        .update(s.id, { name: 'X' } as any, '"7"', actor, TENANT)
        .catch((e) => e);
      expect([e2.getStatus(), e2.reason]).toEqual([
        412,
        'ROW_VERSION_MISMATCH',
      ]);
    });

    it('con If-Match correcto edita, versiona y publica', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      const res = await d.service.update(
        s.id,
        { name: 'Nuevo', areaM2: 12.5 } as any,
        'W/"1"',
        actor,
        TENANT,
      );
      expect(res.name).toBe('Nuevo');
      expect(res.areaM2).toBe(12.5);
      expect(d.outbox.publishDomainEvent).toHaveBeenLastCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'practice.care_space.updated' }),
      );
    });

    it('código de un espacio ya activo: 422 SPACE_IMMUTABLE_FIELD', async () => {
      const d = build();
      const s = await d.service.create(
        's1',
        { code: 'ACT', name: 'Room' } as any,
        actor,
        TENANT,
      );
      await expect(
        d.service.update(s.id, { code: 'OTRO' } as any, '1', actor, TENANT),
      ).rejects.toMatchObject({ reason: 'SPACE_IMMUTABLE_FIELD' });
    });

    it('espacio de otro tenant: 404', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      await expect(
        d.service.update(s.id, { name: 'X' } as any, '1', actor, OTHER),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('mover un padre bajo su hijo: 422 SPACE_CYCLE', async () => {
      const d = build();
      const area = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
        }) as any,
        actor,
        TENANT,
      );
      const inner = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
          parentSpaceId: area.id,
        }) as any,
        actor,
        TENANT,
      );
      await expect(
        d.service.move(
          area.id,
          { parentSpaceId: inner.id },
          '1',
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_CYCLE' });
    });

    it('mover a la raíz respeta la regla: un local sí', async () => {
      const d = build();
      const area = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_AREA',
          functionCode: 'SPACE_FN_AREA_GENERIC',
        }) as any,
        actor,
        TENANT,
      );
      const r = await d.service.create(
        's1',
        room({ parentSpaceId: area.id }) as any,
        actor,
        TENANT,
      );
      const moved = await d.service.move(
        r.id,
        { parentSpaceId: null },
        '1',
        actor,
        TENANT,
      );
      expect(moved.parentId).toBeNull();
    });
  });

  describe('ciclo de vida y retiro', () => {
    it('retirar sin motivo: 422 LIFECYCLE_REASON_REQUIRED', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      await expect(
        d.service.changeLifecycle(
          s.id,
          { action: 'retire' } as any,
          '1',
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'LIFECYCLE_REASON_REQUIRED' });
    });

    it('retirar con hijos y reservas: 409 SPACE_RETIRE_BLOCKED con próxima acción', async () => {
      const d = build();
      const parent = await d.service.create('s1', room() as any, actor, TENANT);
      await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: parent.id,
        }) as any,
        actor,
        TENANT,
      );
      d.blockersRepo.forSpace.mockResolvedValue({
        activeEncounters: { count: 0, sampleIds: [] },
        futureProcedures: { count: 0, sampleIds: [] },
        futureBookings: { count: 7, sampleIds: ['b1', 'b2', 'b3', 'b4', 'b5'] },
        schedulableResources: { count: 0, sampleIds: [] },
      });
      const err: any = await d.service
        .changeLifecycle(
          parent.id,
          { action: 'retire', reason: 'obra' },
          '1',
          actor,
          TENANT,
        )
        .catch((e) => e);
      expect(err.getStatus()).toBe(409);
      expect(err.reason).toBe('SPACE_RETIRE_BLOCKED');
      const kinds = err.details.blockers.map((b: any) => [b.kind, b.count]);
      expect(kinds).toEqual([
        ['ACTIVE_CHILDREN', 1],
        ['FUTURE_BOOKING', 7],
      ]);
      expect(err.details.blockers[0].nextAction).toMatch(/hijos/);
      expect(err.details.unverifiable.map((u: any) => u.kind)).toEqual([
        'INVENTORY_LOCATION',
        'EQUIPMENT',
      ]);
      expect(d.spaces.find((s) => s.id === parent.id).statusConceptId).toBe(
        PRAC.SPACE_PLANNED,
      );
    });

    it('retirar sin bloqueos: RETIRED, cerrado, vínculos cerrados y motivo en la historia', async () => {
      const d = build();
      const s = await d.service.create(
        's1',
        { code: 'OLD', name: 'Room' } as any,
        actor,
        TENANT,
      );
      d.assignments.push({
        id: 'a1',
        careSpaceId: s.id,
        clinicalUnitId: 'u1',
        tenantId: TENANT,
      });
      const res = await d.service.changeLifecycle(
        s.id,
        { action: 'retire', reason: 'demolido' },
        '1',
        actor,
        TENANT,
      );
      expect(res.status?.code).toBe('SPACE_RETIRED');
      expect(res.operationalStatus?.code).toBe('SPACE_OP_CLOSED');
      expect(d.assignments[0].validTo).toBeInstanceOf(Date);
      expect(d.historyRepo.append).toHaveBeenLastCalledWith(
        d.tx,
        'care_spaces',
        s.id,
        expect.objectContaining({
          tenantId: TENANT,
          dataSnapshot: expect.objectContaining({
            lifecycleReason: 'demolido',
          }),
        }),
      );
      const event = d.outbox.publishDomainEvent.mock.calls.at(-1)[1];
      expect(event.payloadJson).toMatchObject({
        action: 'retire',
        from: 'ACTIVE',
        to: 'RETIRED',
        reasonProvided: true,
      });
      expect(JSON.stringify(event.payloadJson)).not.toContain('demolido');
    });

    it('suspender con hijos activos: 409 SPACE_SUSPEND_BLOCKED', async () => {
      const d = build();
      const p = await d.service.create(
        's1',
        { code: 'P', name: 'P' } as any,
        actor,
        TENANT,
      );
      await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: p.id,
          activate: true,
        }) as any,
        actor,
        TENANT,
      );
      await expect(
        d.service.changeLifecycle(
          p.id,
          { action: 'suspend', reason: 'x' },
          '1',
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_SUSPEND_BLOCKED' });
    });

    it('activar un hijo con el padre planificado: 422 PARENT_NOT_ACTIVE', async () => {
      const d = build();
      const p = await d.service.create('s1', room() as any, actor, TENANT);
      const bed = await d.service.create(
        's1',
        room({
          formCode: 'LOC_FORM_BED',
          functionCode: 'SPACE_FN_BED_STANDARD',
          parentSpaceId: p.id,
        }) as any,
        actor,
        TENANT,
      );
      await expect(
        d.service.changeLifecycle(
          bed.id,
          { action: 'activate' },
          '1',
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'PARENT_NOT_ACTIVE' });
    });

    it('retire-check: lectura de un miembro, sin escribir', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      const res = await d.service.retireCheck(s.id, actor, TENANT);
      expect(res.blockers).toEqual([]);
      expect(d.access.assertCanRead).toHaveBeenCalled();
    });
  });

  describe('vínculos con unidades', () => {
    it('un solo OWNER vigente: el segundo responde 409', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      const unitsRepo = (d.service as any).unitsRepo;
      unitsRepo.findById.mockImplementation(async (_t: any, id: string) => ({
        id,
        practiceSiteId: 's1',
        tenantId: TENANT,
        statusConceptId: PRAC.UNIT_ACTIVE,
      }));
      const a = await d.service.addAssignment(
        s.id,
        { clinicalUnitId: 'u1', roleCode: 'SPACE_UNIT_ROLE_OWNER' },
        actor,
        TENANT,
      );
      expect(a.role?.code).toBe('SPACE_UNIT_ROLE_OWNER');
      await expect(
        d.service.addAssignment(
          s.id,
          { clinicalUnitId: 'u2', roleCode: 'SPACE_UNIT_ROLE_OWNER' },
          actor,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'ASSIGNMENT_OWNER_TAKEN' });
      const shared = await d.service.addAssignment(
        s.id,
        { clinicalUnitId: 'u2', roleCode: 'SPACE_UNIT_ROLE_SHARED' },
        actor,
        TENANT,
      );
      expect(shared.clinicalUnitId).toBe('u2');
    });

    it('unidad de otra sede: 404', async () => {
      const d = build();
      const s = await d.service.create('s1', room() as any, actor, TENANT);
      await expect(
        d.service.addAssignment(
          s.id,
          { clinicalUnitId: 'u9', roleCode: 'SPACE_UNIT_ROLE_SHARED' },
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
