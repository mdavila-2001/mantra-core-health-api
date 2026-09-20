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
  const service = new ConditionsService(
    em as any,
    conditionsRepo as any,
    encountersRepo as any,
    auditTrail as any,
    historyRepo as any,
    logger as any,
    filesService as any,
    clinicalRead as any,
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
