import { jest } from '@jest/globals';
import { ReceivedServicesRepository } from './received-services.repository';

/** Crea un mock tipado de forma laxa. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ME = { patient: 'patient-1', tenant: 'tenant-1' };

function data(overrides: Record<string, unknown> = {}): any {
  return {
    custodianTenantId: ME.tenant,
    patientProfileId: ME.patient,
    serviceTypeConceptId: 'type',
    serviceConceptId: 'service',
    statusConceptId: 'done',
    performedAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function row(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'row-1',
    custodianTenantId: ME.tenant,
    patientProfileId: ME.patient,
    ...overrides,
  };
}

/** Un `em` falso que resuelve `findOne` por el campo de origen que se le pregunta. */
function build(rows: {
  procedure?: any;
  immunization?: any;
  procedureCase?: any;
}) {
  const em = {
    findOne: mockFn(async (_entity: unknown, where: any) => {
      if (where.sourceProcedureId) return rows.procedure ?? null;
      if (where.sourceImmunizationId) return rows.immunization ?? null;
      if (where.procedureCaseId) return rows.procedureCase ?? null;
      return null;
    }),
    create: mockFn((_entity: unknown, values: any) => ({
      id: 'nuevo',
      ...values,
    })),
    find: mockFn(),
    count: mockFn(),
  };
  return { em, repository: new ReceivedServicesRepository() };
}

describe('ReceivedServicesRepository.upsert', () => {
  it('crea la fila cuando no existe ninguna con ese origen', async () => {
    const d = build({});
    const result = await d.repository.upsert(
      d.em as any,
      data({ sourceProcedureId: 'proc-1' }),
    );
    expect(d.em.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ sourceProcedureId: 'proc-1' });
  });

  it('completa la fila existente en lugar de duplicar el servicio', async () => {
    const existing = row({
      sourceProcedureId: 'proc-1',
      updatedAt: new Date(0),
    });
    const d = build({ procedure: existing });
    const result = await d.repository.upsert(
      d.em as any,
      data({
        sourceProcedureId: 'proc-1',
        procedureCaseId: 'case-1',
        performerProfileId: 'cirujano',
      }),
    );
    expect(d.em.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
    expect(existing.procedureCaseId).toBe('case-1');
    expect(existing.performerProfileId).toBe('cirujano');
  });

  it('un caso que llega después de su procedimiento se suma a la misma fila', async () => {
    const existing = row({ sourceProcedureId: 'proc-1' });
    const d = build({ procedure: existing });
    await d.repository.upsert(
      d.em as any,
      data({ sourceProcedureId: 'proc-1', procedureCaseId: 'case-1' }),
    );
    expect(existing.procedureCaseId).toBe('case-1');
  });

  describe('la fila de otro paciente no se toca', () => {
    it('no pisa el servicio de otro paciente que se cita como origen', async () => {
      const foreign = row({
        id: 'fila-ajena',
        patientProfileId: 'otro-paciente',
        sourceProcedureId: 'proc-ajeno',
        statusConceptId: 'original',
      });
      const d = build({ procedure: foreign });
      const result = await d.repository.upsert(
        d.em as any,
        data({ sourceProcedureId: 'proc-ajeno', procedureCaseId: 'case-1' }),
      );
      // La fila ajena queda exactamente como estaba.
      expect(foreign.statusConceptId).toBe('original');
      expect(foreign.procedureCaseId).toBeUndefined();
      // El caso sigue siendo un servicio propio, sin reutilizar el origen ajeno.
      expect(result).toMatchObject({
        procedureCaseId: 'case-1',
        sourceProcedureId: undefined,
        patientProfileId: ME.patient,
      });
    });

    it('no pisa la fila de otro tenant aunque el paciente coincida', async () => {
      const foreign = row({
        custodianTenantId: 'otro-tenant',
        sourceProcedureId: 'proc-x',
        statusConceptId: 'original',
      });
      const d = build({ procedure: foreign });
      await d.repository.upsert(
        d.em as any,
        data({ sourceProcedureId: 'proc-x', procedureCaseId: 'case-1' }),
      );
      expect(foreign.statusConceptId).toBe('original');
    });

    it('si todos los orígenes son ajenos no proyecta nada', async () => {
      const foreign = row({
        patientProfileId: 'otro-paciente',
        sourceProcedureId: 'proc-ajeno',
      });
      const d = build({ procedure: foreign });
      const result = await d.repository.upsert(
        d.em as any,
        data({ sourceProcedureId: 'proc-ajeno' }),
      );
      expect(result).toBeNull();
      expect(d.em.create).not.toHaveBeenCalled();
    });

    it('un caso cuyo id ya figura en la fila de otro paciente no se reutiliza', async () => {
      const foreign = row({
        patientProfileId: 'otro-paciente',
        procedureCaseId: 'case-1',
      });
      const d = build({ procedureCase: foreign });
      const result = await d.repository.upsert(
        d.em as any,
        data({ procedureCaseId: 'case-1' }),
      );
      expect(result).toBeNull();
    });
  });
});

describe('ReceivedServicesRepository.isProcedureOf', () => {
  it.each([
    [1, true],
    [0, false],
  ])('con %i coincidencias responde %s', async (count, expected) => {
    const d = build({});
    d.em.count.mockResolvedValue(count);
    await expect(
      d.repository.isProcedureOf(d.em as any, 'proc-1', ME.patient, ME.tenant),
    ).resolves.toBe(expected);
    // Pregunta por paciente Y tenant: un id suelto no alcanza.
    expect(d.em.count).toHaveBeenCalledWith(expect.anything(), {
      id: 'proc-1',
      patientProfileId: ME.patient,
      custodianTenantId: ME.tenant,
    });
  });
});

describe('ReceivedServicesRepository.findChargeLines', () => {
  const charge = (caseId: string, overrides: Record<string, unknown> = {}) => ({
    procedureCaseId: caseId,
    procedureId: 'proc-1',
    quantity: '1',
    unitPrice: '10',
    currencyCode: 'BOB',
    ...overrides,
  });

  it('descarta los cargos de casos que no son de este paciente', async () => {
    const d = build({});
    d.em.find
      .mockResolvedValueOnce([charge('case-mio'), charge('case-ajeno')])
      .mockResolvedValueOnce([{ id: 'case-mio' }]);
    const lines = await d.repository.findChargeLines(
      d.em as any,
      ME.patient,
      ['case-mio'],
      ['proc-1'],
    );
    expect(lines.map((line) => line.procedureCaseId)).toEqual(['case-mio']);
    // Los casos se cruzan con el paciente, no solo por id.
    expect(d.em.find).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ patientProfileId: ME.patient }),
      expect.anything(),
    );
  });

  it('sin ids no consulta nada', async () => {
    const d = build({});
    await expect(
      d.repository.findChargeLines(d.em as any, ME.patient, [], []),
    ).resolves.toEqual([]);
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('sin cargos no consulta los casos', async () => {
    const d = build({});
    d.em.find.mockResolvedValueOnce([]);
    await expect(
      d.repository.findChargeLines(d.em as any, ME.patient, ['c'], []),
    ).resolves.toEqual([]);
    expect(d.em.find).toHaveBeenCalledTimes(1);
  });
});
