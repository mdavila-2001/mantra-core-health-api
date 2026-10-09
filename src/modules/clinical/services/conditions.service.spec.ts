import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConditionsService } from './conditions.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ForbiddenException } from '@nestjs/common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/** Encuentro coherente por defecto: mismo paciente y mismo tenant que las condiciones de prueba. */
const ENCOUNTER = { id: 'enc-1', patientProfileId: 'p1', tenantId: 't1' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const conditionsRepo = {
    findActiveByCode: mockFn(),
    create: mockFn(),
    findById: mockFn(),
  };
  const encountersRepo = { findById: mockFn().mockResolvedValue(ENCOUNTER) };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const filesService = { createLink: mockFn() };
  const clinicalRead = {
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  // BR-14 (CL-07): por defecto el encuentro no está sellado, así que la
  // guarda no rechaza nada salvo que el test la sobreescriba.
  const encounterSealGuard = {
    assertEncounterWritable: mockFn().mockResolvedValue(undefined),
  };
  const service = new ConditionsService(
    em as any,
    conditionsRepo as any,
    encountersRepo as any,
    auditTrail as any,
    historyRepo as any,
    logger as any,
    filesService as any,
    clinicalRead as any,
    encounterSealGuard as any,
  );
  return {
    service,
    tx,
    conditionsRepo,
    encountersRepo,
    auditTrail,
    historyRepo,
    filesService,
    clinicalRead,
    encounterSealGuard,
    logger,
  };
}

describe('ConditionsService (UC-08-08)', () => {
  it('records a condition as active and confirmed', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
    d.conditionsRepo.create.mockReturnValue({
      id: 'cond1',
      patientProfileId: 'p1',
      custodianTenantId: 't1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
      },
      actor,
    );
    expect(res.clinicalStatus).toBe(CLIN.CONDITION_ACTIVE);
    expect(res.verificationStatus).toBe(CLIN.CONDITION_CONFIRMED);
    expect(d.auditTrail.record).toHaveBeenCalledTimes(1);
    expect(d.historyRepo.append).toHaveBeenCalledWith(
      expect.anything(),
      'conditions',
      'cond1',
      expect.objectContaining({ changedByUserId: actor.id }),
    );
  });

  describe('alta como presuntivo (Hito 4 §B)', () => {
    const body = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'code1',
    };

    /** Una condición recién creada con el estado de verificación dado. */
    function created(verificationStatusConceptId: string) {
      return {
        id: 'cond1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
        verificationStatusConceptId,
        createdAt: new Date(),
      };
    }

    it('nace provisional —en estudio, y activa— si el cuerpo lo pide', async () => {
      const d = build();
      d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
      d.conditionsRepo.create.mockReturnValue(
        created(CLIN.CONDITION_PROVISIONAL),
      );

      const res = await d.service.create(
        {
          ...body,
          verificationStatusConceptId: CLIN.CONDITION_PROVISIONAL,
        },
        actor,
      );

      expect(d.conditionsRepo.create.mock.calls[0][1]).toMatchObject({
        verificationStatusConceptId: CLIN.CONDITION_PROVISIONAL,
        clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      });
      expect(res.verificationStatus).toBe(CLIN.CONDITION_PROVISIONAL);
    });

    it('sin el campo sigue naciendo confirmado: el contrato anterior no cambia', async () => {
      const d = build();
      d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
      d.conditionsRepo.create.mockReturnValue(created(CLIN.CONDITION_CONFIRMED));

      await d.service.create(body, actor);

      expect(d.conditionsRepo.create.mock.calls[0][1]).toMatchObject({
        verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
      });
    });

    it('confirmado explícito equivale a omitirlo', async () => {
      const d = build();
      d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
      d.conditionsRepo.create.mockReturnValue(created(CLIN.CONDITION_CONFIRMED));

      await d.service.create(
        { ...body, verificationStatusConceptId: CLIN.CONDITION_CONFIRMED },
        actor,
      );

      expect(d.conditionsRepo.create.mock.calls[0][1]).toMatchObject({
        verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
      });
    });

    it.each([
      [
        'un refutado, que se descarta después de estudiarlo',
        CLIN.CONDITION_REFUTED,
      ],
      ['un concepto que no es de verificación', CLIN.CONDITION_ACTIVE],
      ['un uuid cualquiera', '2f3c6a52-6a0e-4c0e-9c8e-3d9c8e1f5a77'],
    ])('no se registra %s: 422 y no escribe nada', async (_caso, valor) => {
      const d = build();

      await expect(
        d.service.create(
          { ...body, verificationStatusConceptId: valor },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.conditionsRepo.create).not.toHaveBeenCalled();
      expect(d.auditTrail.record).not.toHaveBeenCalled();
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });
  });

  it('rejects a duplicate active condition', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('BR-14 (CL-07): rejects recording a condition against a sealed encounter', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
    d.encounterSealGuard.assertEncounterWritable.mockRejectedValue(
      new PreconditionFailedException('sellado'),
    );
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          encounterId: 'enc-1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.conditionsRepo.create).not.toHaveBeenCalled();
  });
});

describe('ConditionsService.changeClinicalStatus (Patch v4.0.8)', () => {
  it('moves an active condition to inactive and audits the change', async () => {
    const d = build();
    const condition = {
      id: 'cond1',
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      clinicalCourseConceptId: undefined,
      resolvedAt: undefined,
    };
    d.conditionsRepo.findById.mockResolvedValue(condition);

    const res = await d.service.changeClinicalStatus(
      'cond1',
      {
        newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
        reasonText: 'El paciente ya no presenta síntomas',
      },
      actor,
    );

    expect(res.clinicalStatus).toBe(CLIN.CONDITION_INACTIVE);
    expect(condition.resolvedAt).toBeUndefined();
    expect(d.auditTrail.record).toHaveBeenCalledTimes(1);
    expect(d.auditTrail.record.mock.calls[0][2].action).toBe(
      'CONDITION_STATUS_CHANGED',
    );
    expect(d.historyRepo.append).toHaveBeenCalledTimes(1);
  });

  it('BR-14 (CL-10): keeps the reason in the history snapshot and out of the log', async () => {
    const d = build();
    const condition = {
      id: 'cond1',
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      clinicalCourseConceptId: undefined,
      resolvedAt: undefined,
    };
    d.conditionsRepo.findById.mockResolvedValue(condition);

    await d.service.changeClinicalStatus(
      'cond1',
      {
        newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
        reasonText: 'Motivo clínico confidencial del cambio',
      },
      actor,
    );

    expect(d.historyRepo.append).toHaveBeenCalledWith(
      expect.anything(),
      'conditions',
      'cond1',
      expect.objectContaining({
        dataSnapshot: expect.objectContaining({
          statusChangeReasonText: 'Motivo clínico confidencial del cambio',
        }),
      }),
    );
    const loggedPayloads = d.logger.info.mock.calls;
    expect(loggedPayloads.length).toBeGreaterThan(0);
    for (const [payload] of loggedPayloads) {
      expect(JSON.stringify(payload)).not.toContain(
        'Motivo clínico confidencial del cambio',
      );
    }
  });

  it('sets resolvedAt when resolving an acute condition', async () => {
    const d = build();
    const condition = {
      id: 'cond1',
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      clinicalCourseConceptId: CLIN.CONDITION_COURSE_ACUTE,
      resolvedAt: undefined,
    };
    d.conditionsRepo.findById.mockResolvedValue(condition);

    await d.service.changeClinicalStatus(
      'cond1',
      {
        newClinicalStatusConceptId: CLIN.CONDITION_RESOLVED,
        reasonText: 'Cursó tratamiento completo, sin recaída',
      },
      actor,
    );

    expect(condition.resolvedAt).toBeInstanceOf(Date);
  });

  it('rejects resolving a chronic condition', async () => {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue({
      id: 'cond1',
      custodianTenantId: 't1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      clinicalCourseConceptId: CLIN.CONDITION_COURSE_CHRONIC,
    });

    await expect(
      d.service.changeClinicalStatus(
        'cond1',
        {
          newClinicalStatusConceptId: CLIN.CONDITION_RESOLVED,
          reasonText: 'Intento de cerrar una condición crónica',
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('rejects a transition not allowed from the current status', async () => {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue({
      id: 'cond1',
      custodianTenantId: 't1',
      clinicalStatusConceptId: CLIN.CONDITION_RESOLVED,
    });

    await expect(
      d.service.changeClinicalStatus(
        'cond1',
        {
          newClinicalStatusConceptId: CLIN.CONDITION_REMISSION,
          reasonText: 'RESOLVED sólo admite RECURRENCE',
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('clears resolvedAt on recurrence from a resolved condition', async () => {
    const d = build();
    const condition = {
      id: 'cond1',
      custodianTenantId: 't1',
      clinicalStatusConceptId: CLIN.CONDITION_RESOLVED,
      clinicalCourseConceptId: CLIN.CONDITION_COURSE_ACUTE,
      resolvedAt: new Date('2026-01-01'),
    };
    d.conditionsRepo.findById.mockResolvedValue(condition);

    await d.service.changeClinicalStatus(
      'cond1',
      {
        newClinicalStatusConceptId: CLIN.CONDITION_RECURRENCE,
        reasonText: 'Reaparecieron los síntomas',
      },
      actor,
    );

    expect(condition.resolvedAt).toBeUndefined();
  });

  it('throws ResourceNotFoundException when the condition does not exist', async () => {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.changeClinicalStatus(
        'missing',
        {
          newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
          reasonText: 'no existe',
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('ConditionsService · attachFile (ALV-033)', () => {
  it('liga el archivo a ESTA condición, con OwnerType.CONDITION', async () => {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue({ id: 'cond1' });
    d.filesService.createLink.mockResolvedValue({
      id: 'link1',
      fileId: 'file1',
      ownerId: 'cond1',
      ownerType: 'CONDITION',
      createdAt: new Date('2026-01-01'),
    });

    const result = await d.service.attachFile(
      'cond1',
      { fileId: 'file1' },
      actor,
    );

    expect(d.filesService.createLink).toHaveBeenCalledWith(
      'file1',
      { ownerType: 'CONDITION', ownerId: 'cond1' },
      actor,
    );
    expect(result.ownerId).toBe('cond1');
  });

  it('rechaza adjuntar a una condición que no existe', async () => {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.attachFile('missing', { fileId: 'file1' }, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.filesService.createLink).not.toHaveBeenCalled();
  });
});

describe('ConditionsService · MCH-007, mutaciones por id', () => {
  const foreign = {
    id: 'cond-ajena',
    patientProfileId: 'paciente-ajeno',
    custodianTenantId: 't1',
    clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
  };

  function withoutPermission() {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue({ ...foreign });
    d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );
    return d;
  }

  it('cambiar el estado pregunta por el paciente de la condición y, sin permiso, no escribe', async () => {
    const d = withoutPermission();
    await expect(
      d.service.changeClinicalStatus(
        foreign.id,
        {
          newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
          reasonText: 'x',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
    expect(d.historyRepo.append).not.toHaveBeenCalled();
  });

  it('adjuntar un archivo sin permiso no crea el vínculo', async () => {
    const d = withoutPermission();
    await expect(
      d.service.attachFile(foreign.id, { fileId: 'f1' } as any, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.filesService.createLink).not.toHaveBeenCalled();
  });
});

describe('ConditionsService · MCH-008.2, coherencia del encuentro', () => {
  const dtoBase = {
    custodianTenantId: 't1',
    patientProfileId: 'p1',
    codeConceptId: 'code1',
    encounterId: 'enc-1',
  };

  it('rechaza un encuentro de otro paciente', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...ENCOUNTER,
      patientProfileId: 'otro-paciente',
    });

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.conditionsRepo.create).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('rechaza un encuentro de otro tenant', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...ENCOUNTER,
      tenantId: 'otro-tenant',
    });

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.conditionsRepo.create).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('rechaza un encuentro inexistente', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.conditionsRepo.create).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('un encuentro ajeno responde 404 y no 409, aunque ya haya una condición activa con ese código', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...ENCOUNTER,
      patientProfileId: 'otro-paciente',
    });
    d.conditionsRepo.findActiveByCode.mockResolvedValue({ id: 'existing' });

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.conditionsRepo.findActiveByCode).not.toHaveBeenCalled();
    expect(d.conditionsRepo.create).not.toHaveBeenCalled();
  });

  it('registra la condición cuando el encuentro es coherente', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
    d.conditionsRepo.create.mockReturnValue({
      id: 'cond1',
      patientProfileId: 'p1',
      custodianTenantId: 't1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
      createdAt: new Date(),
    });

    await d.service.create(dtoBase as any, actor);

    expect(d.conditionsRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ encounterId: 'enc-1' }),
    );
  });
});

describe('ConditionsService.verify (C3 / P41)', () => {
  const medical = {
    id: 'user-1',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'prac-1',
  } as any;
  const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString();
  const IN_ONE_MONTH = new Date(Date.now() + 30 * 86_400_000).toISOString();

  /** Un presuntivo del paciente p1, activo y en estudio. */
  function presumptive(over: Record<string, unknown> = {}) {
    return {
      id: 'cond-1',
      patientProfileId: 'p1',
      custodianTenantId: 't1',
      codeConceptId: 'code-1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      verificationStatusConceptId: CLIN.CONDITION_PROVISIONAL,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      ...over,
    };
  }

  function armar(condition = presumptive()) {
    const d = build();
    // Toda evidencia pedida existe y es del paciente, salvo que el test diga
    // otra cosa; un informe nombra su orden y una nota, su consulta.
    (d.tx as any).findOne = mockFn(async (_entity: unknown, where: any) => ({
      id: where.id,
      patientProfileId: where.patientProfileId,
      serviceRequestId: 'sr-1',
      encounterId: 'enc-1',
    }));
    d.conditionsRepo.findById.mockResolvedValue(condition);
    return { ...d, condicion: condition };
  }

  describe('correcto', () => {
    it('confirma con motivo y fechas: activa, confirmada y la decisión sellada en el historial', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          reasonText: '  Cuadro compatible  ',
          onsetAt: YESTERDAY,
          expectedResolutionAt: IN_ONE_MONTH,
        },
        medical,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_CONFIRMED);
      expect(res.clinicalStatusConceptId).toBe(CLIN.CONDITION_ACTIVE);
      expect(res.onsetAt).toEqual(new Date(YESTERDAY));
      expect(res.verification).toEqual(
        expect.objectContaining({
          outcome: 'CONFIRMED',
          decidedByProfileId: 'prac-1',
          reasonText: 'Cuadro compatible',
          basedOn: null,
        }),
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        medical,
      );
      const revision = d.historyRepo.append.mock.calls[0][3];
      expect(revision.dataSnapshot.verification.outcome).toBe('CONFIRMED');
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        medical,
        expect.objectContaining({ action: 'CONDITION_CONFIRMED' }),
      );
    });

    it('refuta sólo con evidencia de análisis del mismo paciente: queda inactiva', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'REFUTED',
          basedOn: { kind: 'ANALYSIS', diagnosticReportId: 'dr-1' },
        },
        medical,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_REFUTED);
      expect(res.clinicalStatusConceptId).toBe(CLIN.CONDITION_INACTIVE);
      expect(res.resolvedAt).toBeInstanceOf(Date);
      // Se guarda lo resuelto: el informe nombra su orden.
      expect(res.verification?.basedOn).toEqual({
        kind: 'ANALYSIS',
        serviceRequestId: 'sr-1',
        diagnosticReportId: 'dr-1',
      });
      expect((d.tx as any).findOne).toHaveBeenCalledWith(expect.anything(), {
        id: 'dr-1',
        patientProfileId: 'p1',
      });
    });
  });

  describe('límite', () => {
    it('confirma una crónica sin fin esperado y usa el inicio que ya tenía', async () => {
      const start = new Date('2026-08-01T00:00:00Z');
      const d = armar(
        presumptive({
          onsetAt: start,
          expectedResolutionAt: new Date('2026-12-01T00:00:00Z'),
        }),
      );
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          reasonText: 'HbA1c 8,1 %',
          clinicalCourseConceptId: CLIN.CONDITION_COURSE_CHRONIC,
        },
        medical,
      );
      expect(res.onsetAt).toEqual(start);
      expect(res.expectedResolutionAt).toBeUndefined();
      expect(res.clinicalCourseConceptId).toBe(CLIN.CONDITION_COURSE_CHRONIC);
    });

    it('una crónica descarta el fin esperado aunque venga en el cuerpo', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          basedOn: { kind: 'NOTE', noteId: 'n-1' },
          onsetAt: YESTERDAY,
          expectedResolutionAt: IN_ONE_MONTH,
          clinicalCourseConceptId: CLIN.CONDITION_COURSE_CHRONIC,
        },
        medical,
      );
      expect(res.expectedResolutionAt).toBeUndefined();
      expect(res.verification?.basedOn).toEqual({
        kind: 'NOTE',
        noteId: 'n-1',
        encounterId: 'enc-1',
      });
    });

    it('acepta un fin esperado igual al inicio', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          reasonText: 'x',
          onsetAt: YESTERDAY,
          expectedResolutionAt: YESTERDAY,
        },
        medical,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_CONFIRMED);
    });

    it('un motivo hecho de espacios no cuenta como sustento', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: '   ' },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('inválido / no autorizado', () => {
    it('409 si el diagnóstico ya estaba confirmado, sin tocar nada', async () => {
      const d = armar(
        presumptive({ verificationStatusConceptId: CLIN.CONDITION_CONFIRMED }),
      );
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: 'x' },
          medical,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('422 al confirmar sin fin esperado ni curso crónico', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'CONFIRMED', reasonText: 'x', onsetAt: YESTERDAY },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 al confirmar sin inicio, ni en el cuerpo ni en la condición', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          {
            outcome: 'CONFIRMED',
            reasonText: 'x',
            expectedResolutionAt: IN_ONE_MONTH,
          },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 si el fin esperado es anterior al inicio', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          {
            outcome: 'CONFIRMED',
            reasonText: 'x',
            onsetAt: '2026-01-02T00:00:00Z',
            expectedResolutionAt: '2026-01-01T00:00:00Z',
          },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 si la evidencia es de otro paciente (o no existe)', async () => {
      const d = armar();
      (d.tx as any).findOne.mockResolvedValue(null);
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', basedOn: { kind: 'NOTE', noteId: 'n-ajena' } },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('422 si el informe no nombra orden y no se indicó ninguna', async () => {
      const d = armar();
      (d.tx as any).findOne.mockResolvedValue({ id: 'dr-1' });
      await expect(
        d.service.verify(
          'cond-1',
          {
            outcome: 'REFUTED',
            basedOn: { kind: 'ANALYSIS', diagnosticReportId: 'dr-1' },
          },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 si el curso clínico no es uno del catálogo', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          {
            outcome: 'CONFIRMED',
            reasonText: 'x',
            onsetAt: YESTERDAY,
            expectedResolutionAt: IN_ONE_MONTH,
            clinicalCourseConceptId: '99999999-9999-4999-8999-999999999999',
          },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 si la nota no trae su identificador', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', basedOn: { kind: 'NOTE' } },
          medical,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('404 si la condición no existe', async () => {
      const d = armar();
      d.conditionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.verify(
          'nada',
          { outcome: 'REFUTED', reasonText: 'x' },
          medical,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('403 si no puede escribir en la historia del paciente', async () => {
      const d = armar();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin vínculo'),
      );
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: 'x' },
          medical,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('403 si la sesión no tiene perfil profesional', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.conditionsRepo.findById).not.toHaveBeenCalled();
    });
  });
});
