import { jest } from '@jest/globals';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { AUTHZ } from '../authz.concepts';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { SecurityEvents } from '../../iam/entities';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import { FieldPermissions, ResourceScopeGrants, Roles } from '../entities';
import { AuthzGovernanceExtService } from './authz-governance-ext.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

type Row = Record<string, any>;

/** Evalúa igualdad, `null`, `$in`, `$lt`, `$gt` y `$or`: un filtro quitado del servicio rompe la prueba. */
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (k === '$or') return (v as Row[]).some((w) => matches(row, w));
    if (v === null) return row[k] === null || row[k] === undefined;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      const op = v as Record<string, any>;
      if ('$in' in op) return op.$in.includes(row[k]);
      if ('$lt' in op) return row[k] < op.$lt;
      if ('$gt' in op) return row[k] > op.$gt;
    }
    return row[k] === v;
  });
}

const TA = '00000000-0000-4000-8000-0000000000a1';
const TB = '00000000-0000-4000-8000-0000000000b1';
const PLATFORM = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const SCOPED_A = {
  id: 'admin-a',
  roles: ['SECURITY_ADMIN'],
  scopedRoles: { [TA]: ['SECURITY_ADMIN'] },
  tenantIds: [TA],
} as any;

const grant = (
  id: string,
  tenantId: string | undefined,
  effect: string,
  extra: Row = {},
): Row => ({
  id,
  tenantId,
  effectConceptId: effect,
  subjectTypeConceptId: AUTHZ.SUBJECT_TYPE_USER,
  resourceTypeConceptId: AUTHZ.RESOURCE_TYPE_PATIENT,
  subjectId: 'sub',
  permissionId: 'perm',
  resourceId: 'res',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...extra,
});

function armar(grants: Row[], opts: { updateAffects?: number } = {}) {
  const nativeUpdates: { where: Row; data: Row }[] = [];
  const created: { entity: unknown; data: Row }[] = [];
  const tx: any = {
    create: mockFn((entity: unknown, data: Row) => {
      created.push({ entity, data });
      return data;
    }),
    findOne: mockFn(
      async (_e: unknown, where: Row) =>
        grants.find((g) => matches(g, where)) ?? null,
    ),
    find: mockFn(async (_e: unknown, where: Row) =>
      grants.filter((g) => matches(g, where)),
    ),
    nativeUpdate: mockFn(async (_e: unknown, where: Row, data: Row) => {
      nativeUpdates.push({ where, data });
      if (opts.updateAffects !== undefined) return opts.updateAffects;
      const hit = grants.filter((g) => matches(g, where));
      hit.forEach((g) => Object.assign(g, data));
      return hit.length;
    }),
  };
  const em: any = { ...tx, transactional: mockFn((cb: any) => cb(tx)) };
  const logger = { setContext: mockFn(), info: mockFn() };
  return {
    service: new AuthzGovernanceExtService(em, logger as never),
    tx,
    nativeUpdates,
    created,
    logger,
    grants,
  };
}

const enTenant = <T>(tenantId: string, fn: () => T): T =>
  runWithTenant(tenantId, fn);
const REASON = { reason: 'Se cargó por error, el médico sí debe acceder' };

const escena = (): Row[] => [
  grant('g-a-allow', TA, AUTHZ.EFFECT_ALLOW),
  grant('g-a-deny', TA, AUTHZ.EFFECT_DENY),
  grant('g-b-allow', TB, AUTHZ.EFFECT_ALLOW),
  grant('g-b-deny', TB, AUTHZ.EFFECT_DENY),
  grant('g-global', undefined, AUTHZ.EFFECT_DENY),
];

describe('AuthzGovernanceExtService · listado (hallazgo ALTO 2)', () => {
  it('un actor con alcance sólo ve los permisos de su tenant: ni los de otros ni los globales', async () => {
    const { service, tx } = armar(escena());
    const page = await enTenant(TA, () =>
      service.resourceScopeGrants({}, SCOPED_A),
    );
    expect(page.items.map((g) => g.id).sort()).toEqual([
      'g-a-allow',
      'g-a-deny',
    ]);
    expect(tx.find).toHaveBeenCalledWith(
      ResourceScopeGrants,
      expect.objectContaining({ tenantId: TA }),
      expect.anything(),
    );
  });

  it('el filtro por sujeto/recurso no abre la puerta a otro tenant', async () => {
    const { service } = armar(escena());
    const page = await enTenant(TA, () =>
      service.resourceScopeGrants({ subjectId: 'sub' }, SCOPED_A),
    );
    expect(page.items.every((g) => g.tenantId === TA)).toBe(true);
  });

  it('un actor de plataforma ve los de todos los tenants y los globales', async () => {
    const { service } = armar(escena());
    const page = await service.resourceScopeGrants({}, PLATFORM);
    expect(page.items).toHaveLength(5);
  });

  it('un actor con alcance sin tenant en el contexto falla cerrado', async () => {
    const { service, tx } = armar(escena());
    await expect(
      service.resourceScopeGrants({}, SCOPED_A),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(tx.find).not.toHaveBeenCalled();
  });
});

describe('AuthzGovernanceExtService · terminar un permiso (hallazgo ALTO 2)', () => {
  it.each(['g-b-allow', 'g-b-deny', 'g-global'])(
    'con alcance, %s (de otro tenant o global) responde el mismo 404 que uno inexistente y no se escribe nada',
    async (id) => {
      const { service, nativeUpdates, grants } = armar(escena());
      const ajeno = await enTenant(TA, () =>
        service.endResourceScopeGrant(id, REASON, SCOPED_A),
      ).catch((e) => e);
      const inexistente = await enTenant(TA, () =>
        service.endResourceScopeGrant('g-nadie', REASON, SCOPED_A),
      ).catch((e) => e);
      expect(ajeno).toBeInstanceOf(ResourceNotFoundException);
      expect(ajeno).toMatchObject({
        reason: Reason.RESOURCE_SCOPE_GRANT_NOT_FOUND,
      });
      expect(ajeno.getStatus()).toBe(inexistente.getStatus());
      expect(ajeno.message).toBe(inexistente.message);
      expect(ajeno.getResponse()).toEqual(inexistente.getResponse());
      expect(nativeUpdates).toHaveLength(0);
      expect(grants.find((g) => g.id === id)!.validTo).toBeUndefined();
    },
  );

  it('la denegación ajena no se delata: sin motivo sobre un DENY de otro tenant sigue siendo 404, no 422', async () => {
    const { service } = armar(escena());
    await expect(
      enTenant(TA, () =>
        service.endResourceScopeGrant('g-b-deny', undefined, SCOPED_A),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('con alcance, un permiso propio se termina y el UPDATE lleva el tenant en su condición', async () => {
    const { service, nativeUpdates, grants } = armar(escena());
    const r = await enTenant(TA, () =>
      service.endResourceScopeGrant('g-a-allow', undefined, SCOPED_A),
    );
    expect(r.id).toBe('g-a-allow');
    expect(nativeUpdates[0].where).toMatchObject({
      id: 'g-a-allow',
      tenantId: TA,
    });
    expect(grants.find((g) => g.id === 'g-a-allow')!.validTo).toBeInstanceOf(
      Date,
    );
    expect(grants.find((g) => g.id === 'g-b-allow')!.validTo).toBeUndefined();
  });

  it('la precondición de tenant va en la escritura: si el UPDATE no afecta filas es 409 y no hay segunda escritura', async () => {
    const { service, nativeUpdates } = armar(escena(), { updateAffects: 0 });
    await expect(
      enTenant(TA, () =>
        service.endResourceScopeGrant('g-a-allow', undefined, SCOPED_A),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(nativeUpdates).toHaveLength(1);
    expect(nativeUpdates[0].where).toMatchObject({ tenantId: TA });
  });

  it('un actor de plataforma termina el permiso de cualquier tenant, y el global', async () => {
    const { service, grants } = armar(escena());
    await service.endResourceScopeGrant('g-b-allow', undefined, PLATFORM);
    await service.endResourceScopeGrant('g-global', REASON, PLATFORM);
    expect(grants.find((g) => g.id === 'g-b-allow')!.validTo).toBeInstanceOf(
      Date,
    );
    expect(grants.find((g) => g.id === 'g-global')!.validTo).toBeInstanceOf(
      Date,
    );
  });

  it('un permiso inexistente es 404 también para plataforma', async () => {
    const { service } = armar(escena());
    await expect(
      service.endResourceScopeGrant('g-nadie', REASON, PLATFORM),
    ).rejects.toMatchObject({ reason: Reason.RESOURCE_SCOPE_GRANT_NOT_FOUND });
  });

  it('terminar dos veces es 409', async () => {
    const { service } = armar(escena());
    await service.endResourceScopeGrant('g-b-allow', undefined, PLATFORM);
    await expect(
      service.endResourceScopeGrant('g-b-allow', undefined, PLATFORM),
    ).rejects.toMatchObject({
      reason: Reason.RESOURCE_SCOPE_GRANT_ALREADY_ENDED,
    });
  });
});

describe('AuthzGovernanceExtService · motivo para terminar una denegación', () => {
  const casosSinMotivo: [string, any][] = [
    ['sin cuerpo', undefined],
    ['cuerpo vacío', {}],
    ['motivo en blanco', { reason: '              ' }],
    ['motivo demasiado corto', { reason: 'ya no' }],
  ];

  it.each(casosSinMotivo)(
    'un DENY propio %s: 422 con motivo estable y no se escribe',
    async (_n, dto) => {
      const { service, nativeUpdates, grants } = armar(escena());
      await expect(
        enTenant(TA, () =>
          service.endResourceScopeGrant('g-a-deny', dto, SCOPED_A),
        ),
      ).rejects.toMatchObject({
        reason: Reason.RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED,
      });
      await expect(
        enTenant(TA, () =>
          service.endResourceScopeGrant('g-a-deny', dto, SCOPED_A),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(nativeUpdates).toHaveLength(0);
      expect(grants.find((g) => g.id === 'g-a-deny')!.validTo).toBeUndefined();
    },
  );

  it('un DENY de plataforma sin motivo también se rechaza', async () => {
    const { service, nativeUpdates } = armar(escena());
    await expect(
      service.endResourceScopeGrant('g-b-deny', undefined, PLATFORM),
    ).rejects.toMatchObject({
      reason: Reason.RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED,
    });
    expect(nativeUpdates).toHaveLength(0);
  });

  it('un DENY con motivo se termina, y el registro lleva el efecto y no el texto libre', async () => {
    const { service, grants, logger } = armar(escena());
    await enTenant(TA, () =>
      service.endResourceScopeGrant('g-a-deny', REASON, SCOPED_A),
    );
    expect(grants.find((g) => g.id === 'g-a-deny')!.validTo).toBeInstanceOf(
      Date,
    );
    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).toContain('DENY');
    expect(logged).not.toContain(REASON.reason);
  });

  it('el motivo de terminar un DENY se persiste en iam.security_events (tipo RESOURCE_SCOPE_GRANT_ENDED)', async () => {
    const { service, created, tx } = armar(escena());
    await enTenant(TA, () =>
      service.endResourceScopeGrant('g-a-deny', REASON, SCOPED_A),
    );
    expect(created).toHaveLength(1);
    expect(created[0].entity).toBe(SecurityEvents);
    expect(created[0].data).toMatchObject({
      eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_RESOURCE_SCOPE_GRANT_ENDED,
      outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
      userId: 'sub',
      recordedByUserId: 'admin-a',
      detailJson: {
        grantId: 'g-a-deny',
        tenantId: TA,
        effect: 'DENY',
        reason: REASON.reason,
        permissionId: 'perm',
        subjectType: 'USER',
      },
    });
    expect(created[0].data.recordedAt).toBeInstanceOf(Date);
    // Mismo `tx` que el UPDATE: o quedan los dos, o ninguno.
    expect(tx.create).toHaveBeenCalledTimes(1);
  });

  it('sin evento si la terminación no ocurre (409 por ya terminado, 412 por falta de motivo)', async () => {
    const yaTerminado = armar(escena(), { updateAffects: 0 });
    await expect(
      yaTerminado.service.endResourceScopeGrant('g-b-deny', REASON, PLATFORM),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(yaTerminado.created).toHaveLength(0);
    const sinMotivo = armar(escena());
    await expect(
      sinMotivo.service.endResourceScopeGrant('g-b-deny', undefined, PLATFORM),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(sinMotivo.created).toHaveLength(0);
  });

  it('un ALLOW sin motivo también deja evento, con reason null y sujeto no usuario sin user_id', async () => {
    const { service, created } = armar([
      grant('g-rol', TB, AUTHZ.EFFECT_ALLOW, {
        subjectTypeConceptId: AUTHZ.SUBJECT_TYPE_ROLE,
      }),
    ]);
    await service.endResourceScopeGrant('g-rol', undefined, PLATFORM);
    expect(created[0].data.userId).toBeUndefined();
    expect(created[0].data.detailJson).toMatchObject({
      effect: 'ALLOW',
      reason: null,
      subjectType: 'ROLE',
    });
  });

  it('un ALLOW no exige motivo (compatibilidad con los clientes que no mandan cuerpo)', async () => {
    const { service } = armar(escena());
    await expect(
      service.endResourceScopeGrant('g-b-allow', undefined, PLATFORM),
    ).resolves.toMatchObject({ id: 'g-b-allow' });
  });
});

describe('AuthzGovernanceExtService.roleFieldPermissions · alcance de tenant', () => {
  const roles: Row[] = [
    { id: 'r-global', code: 'G', tenantId: undefined },
    { id: 'r-a', code: 'A', tenantId: TA },
    { id: 'r-b', code: 'B', tenantId: TB },
  ];
  const campos: Row[] = ['r-global', 'r-a', 'r-b'].map((roleId) => ({
    roleId,
    entity: 'Patient',
    columnName: 'name',
    canRead: true,
    canWrite: false,
  }));

  function armarRoles() {
    const tx: any = {
      findOne: mockFn(async (e: unknown, w: Row) =>
        e === Roles ? (roles.find((r) => matches(r, w)) ?? null) : null,
      ),
      find: mockFn(async (e: unknown, w: Row) =>
        e === FieldPermissions ? campos.filter((c) => matches(c, w)) : [],
      ),
    };
    const logger = { setContext: mockFn(), info: mockFn() };
    return { service: new AuthzGovernanceExtService(tx, logger as never), tx };
  }

  it('con alcance, el rol de OTRO tenant responde el mismo 404 que uno inexistente y no se leen sus campos', async () => {
    const { service, tx } = armarRoles();
    const ajeno = await enTenant(TA, () =>
      service.roleFieldPermissions('r-b', SCOPED_A),
    ).catch((e) => e);
    const inexistente = await enTenant(TA, () =>
      service.roleFieldPermissions('r-nadie', SCOPED_A),
    ).catch((e) => e);
    expect(ajeno).toBeInstanceOf(ResourceNotFoundException);
    expect(ajeno).toMatchObject({ reason: inexistente.reason });
    expect(ajeno.getStatus()).toBe(inexistente.getStatus());
    expect(ajeno.message).toBe(inexistente.message);
    expect(tx.find).not.toHaveBeenCalledWith(
      FieldPermissions,
      expect.anything(),
      expect.anything(),
    );
  });

  it.each(['r-global', 'r-a'])(
    'con alcance, el rol %s (global o del propio tenant) se lee',
    async (id) => {
      const { service } = armarRoles();
      const r = await enTenant(TA, () =>
        service.roleFieldPermissions(id, SCOPED_A),
      );
      expect(r.items).toHaveLength(1);
    },
  );

  it('un actor de plataforma lee el rol de cualquier tenant', async () => {
    const { service } = armarRoles();
    await expect(
      service.roleFieldPermissions('r-b', PLATFORM),
    ).resolves.toMatchObject({ roleId: 'r-b' });
  });

  it('con alcance y sin tenant en el contexto falla cerrado', async () => {
    const { service } = armarRoles();
    await expect(
      service.roleFieldPermissions('r-a', SCOPED_A),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
