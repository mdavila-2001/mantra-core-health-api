import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ATTRIBUTES } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { SpaceUnitAssignmentsService } from './space-unit-assignments.service';
import {
  TENANT_A,
  TENANT_B,
  actor,
  makeSite,
  makeSpace,
  mockFn,
} from './infrastructure.testing';

const OWNER = ATTRIBUTES.unitRole.byInput('OWNER')!.id;
const SHARED = ATTRIBUTES.unitRole.byInput('SHARED')!.id;

function build(space = makeSpace(), open: any[] = []) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    space: mockFn().mockResolvedValue({
      space,
      site: makeSite(),
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const unitsRepo = {
    findById: mockFn(async (_tx: any, id: string) => ({
      id,
      tenantId: TENANT_A,
      practiceSiteId: 's1',
      statusConceptId: PRAC.UNIT_ACTIVE,
    })),
  };
  const rows: any[] = [...open];
  const assignmentsRepo = {
    findOpenBySpaces: mockFn(async () => rows.filter((r) => !r.validTo)),
    findByIdInTenant: mockFn(
      async (_tx: any, id: string) => rows.find((r) => r.id === id) ?? null,
    ),
    create: mockFn((_tx: any, data: any) => {
      const row = {
        id: `as-${rows.length + 1}`,
        ...data,
        createdAt: new Date(),
      };
      rows.push(row);
      return row;
    }),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const service = new SpaceUnitAssignmentsService(
    em as any,
    context as any,
    unitsRepo as any,
    assignmentsRepo as any,
    historyRepo as any,
    events as any,
  );
  return {
    service,
    tx,
    space,
    unitsRepo,
    assignmentsRepo,
    historyRepo,
    events,
    rows,
  };
}

describe('SpaceUnitAssignmentsService.assign', () => {
  it('OWNER: crea el vínculo vigente, refleja la unidad en el espacio, versiona el espacio y publica', async () => {
    const d = build();
    const view = await d.service.assign(
      'sp-1',
      'u1',
      'SPACE_UNIT_ROLE_OWNER',
      actor,
      'req-1',
    );
    expect(view).toMatchObject({
      clinicalUnitId: 'u1',
      validTo: null,
      role: { code: 'SPACE_UNIT_ROLE_OWNER' },
    });
    expect(d.rows[0]).toMatchObject({
      tenantId: TENANT_A,
      careSpaceId: 'sp-1',
      roleConceptId: OWNER,
    });
    expect(d.space.clinicalUnitId).toBe('u1');
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'care_spaces',
      'sp-1',
      expect.objectContaining({ tenantId: TENANT_A }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.space_unit_assignment.created',
        correlationId: 'req-1',
      }),
    );
  });

  it('SHARED y LOAN no tocan el espejo del espacio ni su historia', async () => {
    const d = build();
    await d.service.assign('sp-1', 'u1', 'LOAN', actor);
    expect(d.space.clinicalUnitId).toBeUndefined();
    expect(d.historyRepo.append).not.toHaveBeenCalled();
  });

  it('INV-16: un segundo OWNER vigente es 409 con la próxima acción; el mismo par es 409', async () => {
    const owner = {
      id: 'as-0',
      careSpaceId: 'sp-1',
      clinicalUnitId: 'u0',
      roleConceptId: OWNER,
      validTo: undefined,
    };
    const d = build(makeSpace(), [owner]);
    const error = await d.service
      .assign('sp-1', 'u1', 'OWNER', actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(
      PracticeErrorReason.SPACE_UNIT_OWNER_TAKEN,
    );
    expect((error as any).details.nextAction).toEqual(expect.any(String));
    await expect(
      d.service.assign('sp-1', 'u0', 'SHARED', actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_UNIT_ASSIGNMENT_EXISTS,
    });
    expect(d.rows).toHaveLength(1);
  });

  it('la unidad de otro tenant es 404; la de otra sede, 422; la clausurada, 422; un rol inventado, 422', async () => {
    const ajena = build();
    ajena.unitsRepo.findById.mockResolvedValue({
      id: 'u1',
      tenantId: TENANT_B,
      practiceSiteId: 's1',
      statusConceptId: PRAC.UNIT_ACTIVE,
    });
    await expect(
      ajena.service.assign('sp-1', 'u1', 'SHARED', actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    const otraSede = build();
    otraSede.unitsRepo.findById.mockResolvedValue({
      id: 'u1',
      tenantId: TENANT_A,
      practiceSiteId: 's9',
      statusConceptId: PRAC.UNIT_ACTIVE,
    });
    await expect(
      otraSede.service.assign('sp-1', 'u1', 'SHARED', actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.UNIT_SITE_MISMATCH });
    const retirada = build();
    retirada.unitsRepo.findById.mockResolvedValue({
      id: 'u1',
      tenantId: TENANT_A,
      practiceSiteId: 's1',
      statusConceptId: PRAC.UNIT_RETIRED,
    });
    await expect(
      retirada.service.assign('sp-1', 'u1', 'SHARED', actor),
    ).rejects.toMatchObject({ reason: PracticeErrorReason.UNIT_NOT_AVAILABLE });
    await expect(
      build().service.assign('sp-1', 'u1', 'DUEÑO', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    for (const d of [ajena, otraSede, retirada])
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
  });

  it('un espacio clausurado no admite vínculos', async () => {
    const d = build(makeSpace({ statusConceptId: PRAC.SPACE_RETIRED }));
    await expect(
      d.service.assign('sp-1', 'u1', 'SHARED', actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.LIFECYCLE_TRANSITION_INVALID,
    });
  });
});

describe('SpaceUnitAssignmentsService.close', () => {
  it('cierra la vigencia sin borrar la fila; cerrar el OWNER limpia el espejo y versiona', async () => {
    const space = makeSpace({ clinicalUnitId: 'u1' });
    const owner = {
      id: 'as-1',
      tenantId: TENANT_A,
      careSpaceId: 'sp-1',
      clinicalUnitId: 'u1',
      roleConceptId: OWNER,
      validFrom: new Date(),
      validTo: undefined,
    };
    const d = build(space, [owner]);
    const view = await d.service.close('sp-1', 'as-1', actor, 'req-2');
    expect(owner.validTo).toBeInstanceOf(Date);
    expect(view.validTo).not.toBeNull();
    expect(d.rows).toHaveLength(1);
    expect(space.clinicalUnitId).toBeNull();
    expect(d.historyRepo.append).toHaveBeenCalledTimes(1);
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.space_unit_assignment.closed',
      }),
    );
  });

  it('un vínculo ya cerrado es 409; uno de otro espacio o de otro tenant es 404', async () => {
    const cerrado = {
      id: 'as-1',
      careSpaceId: 'sp-1',
      clinicalUnitId: 'u1',
      roleConceptId: SHARED,
      validFrom: new Date(),
      validTo: new Date(),
    };
    await expect(
      build(makeSpace(), [cerrado]).service.close('sp-1', 'as-1', actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.SPACE_UNIT_ASSIGNMENT_CLOSED,
    });
    const deOtro = {
      id: 'as-2',
      careSpaceId: 'otro',
      clinicalUnitId: 'u1',
      roleConceptId: SHARED,
      validFrom: new Date(),
      validTo: undefined,
    };
    const d = build(makeSpace(), [deOtro]);
    await expect(d.service.close('sp-1', 'as-2', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    d.assignmentsRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(d.service.close('sp-1', 'as-9', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.assignmentsRepo.findByIdInTenant).toHaveBeenCalledWith(
      d.tx,
      'as-9',
      TENANT_A,
    );
  });
});
