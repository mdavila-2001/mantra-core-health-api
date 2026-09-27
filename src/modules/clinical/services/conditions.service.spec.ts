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
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
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

    const resultado = await d.service.attachFile(
      'cond1',
      { fileId: 'file1' },
      actor,
    );

    expect(d.filesService.createLink).toHaveBeenCalledWith(
      'file1',
      { ownerType: 'CONDITION', ownerId: 'cond1' },
      actor,
    );
    expect(resultado.ownerId).toBe('cond1');
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
  const ajena = {
    id: 'cond-ajena',
    patientProfileId: 'paciente-ajeno',
    custodianTenantId: 't1',
    clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
  };

  function sinPermiso() {
    const d = build();
    d.conditionsRepo.findById.mockResolvedValue({ ...ajena });
    d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );
    return d;
  }

  it('cambiar el estado pregunta por el paciente de la condición y, sin permiso, no escribe', async () => {
    const d = sinPermiso();
    await expect(
      d.service.changeClinicalStatus(
        ajena.id,
        {
          newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
          reasonText: 'x',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
    expect(d.historyRepo.append).not.toHaveBeenCalled();
  });

  it('adjuntar un archivo sin permiso no crea el vínculo', async () => {
    const d = sinPermiso();
    await expect(
      d.service.attachFile(ajena.id, { fileId: 'f1' } as any, actor),
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
  const medica = {
    id: 'user-1',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'prac-1',
  } as any;
  const AYER = new Date(Date.now() - 86_400_000).toISOString();
  const EN_UN_MES = new Date(Date.now() + 30 * 86_400_000).toISOString();

  /** Un presuntivo del paciente p1, activo y en estudio. */
  function presuntivo(over: Record<string, unknown> = {}) {
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

  function armar(condicion = presuntivo()) {
    const d = build();
    (d.tx as any).findOne = mockFn().mockResolvedValue({ id: 'evidencia' });
    d.conditionsRepo.findById.mockResolvedValue(condicion);
    return { ...d, condicion };
  }

  describe('correcto', () => {
    it('confirma con motivo y fechas: activa, confirmada y la decisión sellada en el historial', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          reasonText: '  Cuadro compatible  ',
          onsetAt: AYER,
          expectedResolutionAt: EN_UN_MES,
        },
        medica,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_CONFIRMED);
      expect(res.clinicalStatusConceptId).toBe(CLIN.CONDITION_ACTIVE);
      expect(res.onsetAt).toEqual(new Date(AYER));
      expect(res.verification).toEqual(
        expect.objectContaining({
          outcome: 'CONFIRMED',
          decidedByProfileId: 'prac-1',
          reasonText: 'Cuadro compatible',
          basedOn: null,
        }),
      );
      expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
        'p1',
        medica,
      );
      const revision = d.historyRepo.append.mock.calls[0][3];
      expect(revision.dataSnapshot.verification.outcome).toBe('CONFIRMED');
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        medica,
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
        medica,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_REFUTED);
      expect(res.clinicalStatusConceptId).toBe(CLIN.CONDITION_INACTIVE);
      expect(res.verification?.basedOn).toEqual({
        kind: 'ANALYSIS',
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
      const inicio = new Date('2026-08-01T00:00:00Z');
      const d = armar(
        presuntivo({
          onsetAt: inicio,
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
        medica,
      );
      expect(res.onsetAt).toEqual(inicio);
      expect(res.expectedResolutionAt).toBeUndefined();
      expect(res.clinicalCourseConceptId).toBe(CLIN.CONDITION_COURSE_CHRONIC);
    });

    it('acepta un fin esperado igual al inicio', async () => {
      const d = armar();
      const res = await d.service.verify(
        'cond-1',
        {
          outcome: 'CONFIRMED',
          reasonText: 'x',
          onsetAt: AYER,
          expectedResolutionAt: AYER,
        },
        medica,
      );
      expect(res.verificationStatusConceptId).toBe(CLIN.CONDITION_CONFIRMED);
    });

    it('un motivo hecho de espacios no cuenta como sustento', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: '   ' },
          medica,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('inválido / no autorizado', () => {
    it('409 si el diagnóstico ya estaba confirmado, sin tocar nada', async () => {
      const d = armar(
        presuntivo({ verificationStatusConceptId: CLIN.CONDITION_CONFIRMED }),
      );
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: 'x' },
          medica,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('422 al confirmar sin fin esperado ni curso crónico', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'CONFIRMED', reasonText: 'x', onsetAt: AYER },
          medica,
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
            expectedResolutionAt: EN_UN_MES,
          },
          medica,
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
          medica,
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
          medica,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('422 si la nota no trae su identificador', async () => {
      const d = armar();
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', basedOn: { kind: 'NOTE' } },
          medica,
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
          medica,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('403 si no puede escribir en la historia del paciente', async () => {
      const d = armar();
      d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
        new ForbiddenException('sin vínculo'),
      );
      await expect(
        d.service.verify(
          'cond-1',
          { outcome: 'REFUTED', reasonText: 'x' },
          medica,
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
