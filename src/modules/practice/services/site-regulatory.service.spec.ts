import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { FUNCTIONS, REGULATORY } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { RowVersionMismatchException } from '../http/row-version';
import { SiteRegulatoryService } from './site-regulatory.service';
import {
  TENANT_A,
  actor,
  makeSite,
  makeSpace,
  mockFn,
  ruleSet,
} from './infrastructure.testing';

function build(site = makeSite(), level = 'ORG') {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    site: mockFn().mockResolvedValue({
      site,
      tenantId: TENANT_A,
      access: { level, branchIds: new Set() },
    }),
  };
  const spacesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const rulesRepo = { loadRuleSet: mockFn().mockResolvedValue(ruleSet()) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const service = new SiteRegulatoryService(
    em as any,
    context as any,
    spacesRepo as any,
    rulesRepo as any,
    historyRepo as any,
    events as any,
  );
  return { service, tx, site, context, spacesRepo, historyRepo, events };
}
/** Las consultas SQL que el servicio le hizo al `tx`, en orden. */
const sqls = (tx: any): string[] =>
  tx.execute.mock.calls.map((c: any[]) => String(c[0]));

describe('SiteRegulatoryService.patch', () => {
  it('edita con If-Match vigente, versiona con tenant y publica; sin cambios no hace nada', async () => {
    const d = build();
    const res = await d.service.patch(
      's1',
      {
        subsectorCode: 'SUBSECTOR_PUBLIC',
        careLevelCode: 'CARE_LEVEL_2',
        typologyCode: 'TYPOLOGY_HOSPITAL_L2',
        sedesCode: 'SEDES_SCZ',
        managingEntityName: ' Municipio ',
        municipalityName: 'Santa Cruz',
      },
      1,
      actor,
      'req-1',
    );
    expect(d.context.site).toHaveBeenCalledWith(
      d.tx,
      's1',
      actor,
      'regulatory',
    );
    expect(d.site).toMatchObject({
      managingEntityName: 'Municipio',
      municipalityName: 'Santa Cruz',
    });
    expect(res).toMatchObject({
      subsector: { code: 'SUBSECTOR_PUBLIC' },
      typology: { code: 'TYPOLOGY_HOSPITAL_L2' },
      sedes: { code: 'SEDES_SCZ' },
    });
    expect(res.typology!.source).toContain('Segundo Nivel');
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'practice_sites',
      's1',
      expect.objectContaining({ tenantId: TENANT_A }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.site.regulatory_updated',
        correlationId: 'req-1',
      }),
    );

    const igual = build(makeSite({ municipalityName: 'Santa Cruz' }));
    await igual.service.patch(
      's1',
      { municipalityName: 'Santa Cruz' },
      1,
      actor,
    );
    expect(igual.tx.flush).not.toHaveBeenCalled();
    await expect(
      build(makeSite({ rowVersion: 2 })).service.patch(
        's1',
        { municipalityName: 'X' },
        1,
        actor,
      ),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
  });

  it('un código de catálogo inválido es 422 con el campo', async () => {
    const d = build();
    const error = await d.service
      .patch('s1', { typologyCode: 'TYPOLOGY_X' }, 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as any).details.errors[0]).toEqual({
      field: 'typologyCode',
      reason: PracticeErrorReason.CATALOG_CODE_INVALID,
    });
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('INV-07: cambiar a Puesto de Salud con un quirófano vigente es 409 TYPOLOGY_CONFLICT con la lista; uno clausurado no cuenta', async () => {
    const d = build();
    d.spacesRepo.findBySite.mockResolvedValue([
      makeSpace({
        id: 'qx',
        code: 'QX-1',
        spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!.id,
        statusConceptId: PRAC.SPACE_ACTIVE,
      }),
      makeSpace({
        id: 'qx-old',
        code: 'QX-0',
        spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!.id,
        statusConceptId: PRAC.SPACE_RETIRED,
      }),
      makeSpace({
        id: 'c1',
        code: 'C-1',
        spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_CONSULTING_ROOM')!.id,
        statusConceptId: PRAC.SPACE_ACTIVE,
      }),
    ]);
    const error = await d.service
      .patch('s1', { typologyCode: 'TYPOLOGY_HEALTH_POST' }, 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(PracticeErrorReason.TYPOLOGY_CONFLICT);
    expect((error as any).details.spaces).toEqual([
      expect.objectContaining({
        id: 'qx',
        code: 'QX-1',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
        rule: 'TYPO_ALLOWED',
        nextAction: expect.any(String),
      }),
    ]);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('cambiar a una tipología que no restringe (hospital) no revisa los espacios', async () => {
    const d = build();
    await d.service.patch(
      's1',
      { typologyCode: 'TYPOLOGY_HOSPITAL_L3' },
      1,
      actor,
    );
    expect(d.tx.flush).toHaveBeenCalled();
  });
});

describe('SiteRegulatoryService · código SNIS', () => {
  it('otra sede del mismo tenant con ese código: 409 genérico', async () => {
    const d = build();
    d.tx.execute.mockResolvedValueOnce([{ id: 'otra-sede' }]);
    const error = await d.service
      .patch('s1', { snisCode: 'SNIS-1' }, 1, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as any).reason).toBe(
      PracticeErrorReason.SNIS_CODE_UNAVAILABLE,
    );
    expect((error as any).details).toBeUndefined();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('un código verificado por otra organización: 409 genérico; la comprobación devuelve sólo un booleano y cierra el contexto SYSTEM', async () => {
    const d = build();
    d.tx.execute
      .mockResolvedValueOnce([]) // misma organización
      .mockResolvedValueOnce([]) // set_config true
      .mockResolvedValueOnce([{ taken: true }])
      .mockResolvedValueOnce([]); // set_config false
    const error = await d.service
      .patch('s1', { snisCode: 'SNIS-1' }, 1, actor)
      .catch((e: unknown) => e);
    expect((error as any).reason).toBe(
      PracticeErrorReason.SNIS_CODE_UNAVAILABLE,
    );
    expect((error as any).message).not.toContain('SNIS-1');
    const consultas = sqls(d.tx);
    expect(consultas[1]).toContain("'app.system_context', 'true'");
    expect(consultas[2]).toMatch(/select exists/);
    expect(consultas[2]).not.toMatch(/select \*|select id|returning/i);
    expect(consultas.at(-1)).toContain("'app.system_context', 'false'");
  });

  it('el contexto SYSTEM se cierra aunque la consulta falle', async () => {
    const d = build();
    d.tx.execute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);
    await expect(
      d.service.patch('s1', { snisCode: 'SNIS-1' }, 1, actor),
    ).rejects.toThrow('boom');
    expect(sqls(d.tx).at(-1)).toContain("'app.system_context', 'false'");
  });

  it('un código libre se guarda; cambiarlo borra la verificación en la respuesta y en la historia sin escribir snis_verified_*', async () => {
    const verificada = makeSite({
      snisCode: 'VIEJO',
      snisVerifiedAt: new Date(),
      snisVerifiedByUserId: 'op',
    });
    const d = build(verificada);
    d.tx.execute.mockImplementation(async (sql: string) =>
      sql.includes('select exists') ? [{ taken: false }] : [],
    );
    const res = await d.service.patch('s1', { snisCode: 'NUEVO' }, 1, actor);
    expect(res).toMatchObject({
      snisCode: 'NUEVO',
      snisVerified: false,
      snisVerifiedAt: null,
    });
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      d.tx,
      'practice_sites',
      's1',
      expect.objectContaining({
        dataSnapshot: expect.objectContaining({
          snisCode: 'NUEVO',
          snisVerifiedAt: null,
        }),
      }),
    );
    // Lo hace el trigger de la base: la entidad no toca esas columnas.
    expect(verificada.snisVerifiedAt).toBeInstanceOf(Date);
  });

  it('limpiar el código con null no consulta disponibilidad', async () => {
    const d = build(makeSite({ snisCode: 'X' }));
    await d.service.patch('s1', { snisCode: null }, 1, actor);
    expect(d.tx.execute).not.toHaveBeenCalled();
    expect(d.site.snisCode).toBeNull();
  });
});

describe('SiteRegulatoryService.verifySnis', () => {
  it('sólo la plataforma: cualquier otro nivel recibe 403 y no escribe', async () => {
    for (const level of ['ORG', 'BRANCH_ADMIN', 'MEMBER']) {
      const d = build(makeSite({ snisCode: 'S' }), level);
      await expect(d.service.verifySnis('s1', actor)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(d.tx.execute).not.toHaveBeenCalled();
    }
  });

  it('sin código SNIS responde 422', async () => {
    const d = build(makeSite(), 'PLATFORM');
    await expect(d.service.verifySnis('s1', actor)).rejects.toMatchObject({
      reason: PracticeErrorReason.SNIS_CODE_MISSING,
    });
  });

  it('abre el contexto SYSTEM sólo para el UPDATE acotado por id y tenant, y lo cierra', async () => {
    const d = build(makeSite({ snisCode: 'S-1' }), 'PLATFORM');
    d.tx.execute.mockImplementation(async (sql: string) =>
      sql.includes('update practice.practice_sites') ? [{ id: 's1' }] : [],
    );
    const res = await d.service.verifySnis('s1', actor, 'req-5');
    const consultas = sqls(d.tx);
    expect(consultas[0]).toContain("'app.system_context', 'true'");
    expect(consultas[1]).toMatch(/update practice\.practice_sites/);
    expect(consultas[1]).toMatch(/where id = \? and tenant_id = \?/);
    expect(consultas[2]).toContain("'app.system_context', 'false'");
    expect(d.tx.execute.mock.calls[1][1]).toEqual(
      expect.arrayContaining(['s1', TENANT_A, actor.id]),
    );
    expect(res).toMatchObject({ snisCode: 'S-1', snisVerified: true });
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.site.snis_verified',
        correlationId: 'req-5',
      }),
    );
  });

  it('un choque de unicidad al verificar es el mismo 409 genérico y el contexto SYSTEM se cierra', async () => {
    const d = build(makeSite({ snisCode: 'S-1' }), 'PLATFORM');
    d.tx.execute.mockImplementation(async (sql: string) => {
      if (sql.includes('update practice.practice_sites'))
        throw Object.assign(new Error('dup'), { code: '23505' });
      return [];
    });
    await expect(d.service.verifySnis('s1', actor)).rejects.toMatchObject({
      reason: PracticeErrorReason.SNIS_CODE_UNAVAILABLE,
    });
    expect(sqls(d.tx).at(-1)).toContain("'app.system_context', 'false'");
    expect(d.events.publish).not.toHaveBeenCalled();
  });
});

describe('SiteRegulatoryService.get', () => {
  it('lee con permiso de lectura y trae la norma de la tipología', async () => {
    const d = build(
      makeSite({
        facilityTypologyConceptId: REGULATORY.typology.byInput(
          'TYPOLOGY_HOSPITAL_L3',
        )!.id,
      }),
    );
    const res = await d.service.get('s1', actor);
    expect(d.context.site).toHaveBeenCalledWith(d.tx, 's1', actor, 'read');
    expect(res.typology).toMatchObject({
      code: 'TYPOLOGY_HOSPITAL_L3',
      source: expect.stringContaining('Tercer Nivel'),
    });
  });
});
