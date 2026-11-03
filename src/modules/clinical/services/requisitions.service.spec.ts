import { describe, expect, it, jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { StudyDetailReason } from '../clinical.error-reasons';
import { RequisitionsService } from './requisitions.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'user-1', roles: [] } as any;
const TENANT = 'tenant-1';

function body(items: any[]): any {
  return {
    custodianTenantId: TENANT,
    patientProfileId: 'patient-1',
    performerTenantId: 'lab-1',
    items,
  };
}

function build(stored: any[] = []) {
  const executed: any[][] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[]) => {
      executed.push([sql, params]);
      return [];
    }),
    find: mockFn(async () => stored),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const created: any[] = [];
  const serviceRequests = {
    create: mockFn(async (dto: any, _actor: any, options: any) => {
      created.push({ dto, options });
      return {
        id: `sr-${created.length}`,
        requisitionId: options.requisitionId,
      };
    }),
  };
  const reader = {
    toResponses: mockFn(async (_tx: any, rows: any[]) =>
      rows.map((r) => ({ id: r.id })),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new RequisitionsService(
    em as any,
    serviceRequests as any,
    reader as any,
    logger as any,
  );
  return { service, serviceRequests, created, reader, executed, tx };
}

const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);

describe('RequisitionsService.create', () => {
  it('crea un renglón por estudio, en la misma transacción y con el mismo requisitionId', async () => {
    const d = build();
    const out = await run(() =>
      d.service.create(
        body([
          { codeConceptId: 'hemograma', componentConceptIds: ['hb', 'hto'] },
          { codeConceptId: 'rx-mano', imaging: { bodySiteConceptId: 'mano' } },
        ]),
        actor,
      ),
    );
    expect(out.replayed).toBe(false);
    expect(out.items).toHaveLength(2);
    expect(d.created).toHaveLength(2);
    expect(d.created[0].options.transaction).toBe(d.tx);
    expect(d.created[1].options.transaction).toBe(d.tx);
    expect(d.created[0].options.requisitionId).toBe(out.requisitionId);
    expect(d.created[1].options.requisitionId).toBe(out.requisitionId);
    // El cuerpo del renglón hereda cabecera + ejecutor.
    expect(d.created[0].dto).toMatchObject({
      custodianTenantId: TENANT,
      patientProfileId: 'patient-1',
      performerTenantId: 'lab-1',
      codeConceptId: 'hemograma',
      componentConceptIds: ['hb', 'hto'],
    });
    expect(d.created[1].dto.imaging).toEqual({ bodySiteConceptId: 'mano' });
  });

  it('fija el tenant activo en la transacción antes de todo lo demás (RLS de los componentes)', async () => {
    const d = build();
    await run(() => d.service.create(body([{ codeConceptId: 'a' }]), actor));
    expect(d.tx.execute).toHaveBeenCalledWith(
      "select set_config('app.current_tenant_id', ?, true)",
      [TENANT],
    );
  });

  it('la decisión de antiduplicación de un renglón viaja a su alta', async () => {
    const d = build();
    await run(() =>
      d.service.create(
        body([
          {
            codeConceptId: 'hemograma',
            componentConceptIds: ['hb'],
            duplicateDecision: {
              previousDiagnosticReportId: 'rep-1',
              duplicateOverrideReason: 'x'.repeat(25),
            },
          },
        ]),
        actor,
      ),
    );
    expect(d.created[0].dto).toMatchObject({
      previousDiagnosticReportId: 'rep-1',
      duplicateOverrideReason: 'x'.repeat(25),
    });
  });

  it('un 422 del renglón 1 anula todo y devuelve itemIndex, field y reason', async () => {
    const d = build();
    d.serviceRequests.create
      .mockImplementationOnce(async () => ({ id: 'sr-0' }))
      .mockImplementationOnce(async () => {
        throw new PreconditionFailedException('Panel sin componentes', {
          reason: StudyDetailReason.COMPONENTS_EMPTY,
          field: 'componentConceptIds',
        });
      });
    await expect(
      run(() =>
        d.service.create(
          body([{ codeConceptId: 'a' }, { codeConceptId: 'hemograma' }]),
          actor,
        ),
      ),
    ).rejects.toMatchObject({
      details: {
        reason: StudyDetailReason.COMPONENTS_EMPTY,
        field: 'componentConceptIds',
        itemIndex: 1,
      },
    });
  });

  it('un error que no es 422 (404 del encuentro) pasa sin tocar', async () => {
    const d = build();
    d.serviceRequests.create.mockImplementationOnce(async () => {
      throw new ResourceNotFoundException('Encuentro no encontrado');
    });
    await expect(
      run(() => d.service.create(body([{ codeConceptId: 'a' }]), actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  describe('repetidos dentro del mismo cuerpo (V10)', () => {
    it('mismo estudio, misma región y lateralidad: 422 con itemIndex y duplicateOfItemIndex, sin escribir', async () => {
      const d = build();
      const item = {
        codeConceptId: 'rx',
        imaging: { bodySiteConceptId: 'mano', lateralityConceptId: 'izq' },
      };
      await expect(
        run(() => d.service.create(body([item, { ...item }]), actor)),
      ).rejects.toMatchObject({
        details: {
          reason: StudyDetailReason.DUPLICATE_STUDY_DETECTED,
          itemIndex: 1,
          duplicateOfItemIndex: 0,
        },
      });
      expect(d.serviceRequests.create).not.toHaveBeenCalled();
    });

    it('misma región con otra lateralidad NO es repetido', async () => {
      const d = build();
      await run(() =>
        d.service.create(
          body([
            {
              codeConceptId: 'rx',
              imaging: {
                bodySiteConceptId: 'mano',
                lateralityConceptId: 'izq',
              },
            },
            {
              codeConceptId: 'rx',
              imaging: {
                bodySiteConceptId: 'mano',
                lateralityConceptId: 'der',
              },
            },
          ]),
          actor,
        ),
      );
      expect(d.created).toHaveLength(2);
    });

    it('laboratorio: componentes en común se pisan; disjuntos no', async () => {
      const a = build();
      await expect(
        run(() =>
          a.service.create(
            body([
              { codeConceptId: 'hemo', componentConceptIds: ['hb', 'hto'] },
              { codeConceptId: 'hemo', componentConceptIds: ['hto'] },
            ]),
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      const b = build();
      await run(() =>
        b.service.create(
          body([
            { codeConceptId: 'hemo', componentConceptIds: ['hb'] },
            { codeConceptId: 'hemo', componentConceptIds: ['plaq'] },
          ]),
          actor,
        ),
      );
      expect(b.created).toHaveLength(2);
    });
  });

  describe('Idempotency-Key', () => {
    it('la misma clave produce el mismo requisitionId y toma un cerrojo consultivo', async () => {
      const d1 = build();
      const d2 = build();
      const a = await run(() =>
        d1.service.create(body([{ codeConceptId: 'a' }]), actor, 'clave-1'),
      );
      const b = await run(() =>
        d2.service.create(body([{ codeConceptId: 'a' }]), actor, 'clave-1'),
      );
      expect(a.requisitionId).toBe(b.requisitionId);
      expect(
        d1.executed.some(([sql]) => /pg_advisory_xact_lock/.test(sql)),
      ).toBe(true);
    });

    it('otra clave u otro paciente: otro requisitionId', async () => {
      const d = build();
      const a = await run(() =>
        d.service.create(body([{ codeConceptId: 'a' }]), actor, 'clave-1'),
      );
      const b = await run(() =>
        d.service.create(body([{ codeConceptId: 'a' }]), actor, 'clave-2'),
      );
      expect(a.requisitionId).not.toBe(b.requisitionId);
    });

    it('sin clave cada llamada es una requisición nueva', async () => {
      const d = build();
      const a = await run(() =>
        d.service.create(body([{ codeConceptId: 'a' }]), actor),
      );
      const b = await run(() =>
        d.service.create(body([{ codeConceptId: 'a' }]), actor),
      );
      expect(a.requisitionId).not.toBe(b.requisitionId);
    });

    it('repetición con el mismo contenido: devuelve lo guardado, replayed y sin escribir', async () => {
      const stored = [
        {
          id: 'sr-9',
          codeConceptId: 'a',
          specimenTypeConceptId: undefined,
          bodySiteConceptId: undefined,
          lateralityConceptId: undefined,
          contrastConceptId: undefined,
        },
      ];
      const d = build(stored);
      const out = await run(() =>
        d.service.create(body([{ codeConceptId: 'a' }]), actor, 'clave-1'),
      );
      expect(out.replayed).toBe(true);
      expect(out.items).toEqual([{ id: 'sr-9' }]);
      expect(d.serviceRequests.create).not.toHaveBeenCalled();
    });

    it('la misma clave con otro contenido: 409 con reason en details', async () => {
      const stored = [
        { id: 'sr-9', codeConceptId: 'a', specimenTypeConceptId: undefined },
      ];
      const d = build(stored);
      const attempt = run(() =>
        d.service.create(body([{ codeConceptId: 'OTRO' }]), actor, 'clave-1'),
      );
      await expect(attempt).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt).rejects.toMatchObject({
        details: {
          reason: StudyDetailReason.REQUISITION_IDEMPOTENCY_KEY_CONFLICT,
        },
      });
      expect(d.serviceRequests.create).not.toHaveBeenCalled();
    });
  });
});
