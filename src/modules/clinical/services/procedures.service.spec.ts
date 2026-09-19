import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProceduresService } from './procedures.service';
import { ResourceNotFoundException } from '../../../common';
import { ForbiddenException } from '@nestjs/common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const proceduresRepo = { findById: mockFn(), create: mockFn() };
  const serviceRequestsRepo = { findById: mockFn() };
  const filesService = { createLink: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
  };
  const service = new ProceduresService(
    em as any,
    proceduresRepo,
    serviceRequestsRepo as any,
    filesService as any,
    logger as any,
    clinicalRead as any,
  );
  return {
    service,
    proceduresRepo,
    serviceRequestsRepo,
    filesService,
    clinicalRead,
  };
}

describe('ProceduresService (UC-08-12)', () => {
  it('records a completed procedure and closes the source order', async () => {
    const d = build();
    const sr = {
      id: 'sr1',
      statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      updatedAt: new Date(),
    };
    d.serviceRequestsRepo.findById.mockResolvedValue(sr);
    d.proceduresRepo.create.mockReturnValue({
      id: 'proc1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.PROCEDURE_COMPLETED,
      serviceRequestId: 'sr1',
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
        serviceRequestId: 'sr1',
      },
      actor,
    );
    expect(sr.statusConceptId).toBe(CLIN.SERVICE_REQUEST_COMPLETED);
    expect(res.status).toBe(CLIN.PROCEDURE_COMPLETED);
  });

  it('rejects when the source service request is missing', async () => {
    const d = build();
    d.serviceRequestsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          serviceRequestId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the parent procedure does not exist', async () => {
    const d = build();
    d.proceduresRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          parentProcedureId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('ProceduresService · attachFile (ALV-033, odontología)', () => {
  it('liga el archivo a ESTE procedimiento, con OwnerType.PROCEDURE', async () => {
    const d = build();
    d.proceduresRepo.findById.mockResolvedValue({ id: 'proc1' });
    d.filesService.createLink.mockResolvedValue({
      id: 'link1',
      fileId: 'file1',
      ownerId: 'proc1',
      ownerType: 'PROCEDURE',
      createdAt: new Date('2026-01-01'),
    });

    const resultado = await d.service.attachFile(
      'proc1',
      { fileId: 'file1' },
      actor,
    );

    expect(d.filesService.createLink).toHaveBeenCalledWith(
      'file1',
      { ownerType: 'PROCEDURE', ownerId: 'proc1' },
      actor,
    );
    expect(resultado.ownerId).toBe('proc1');
  });

  it('rechaza adjuntar a un procedimiento que no existe', async () => {
    const d = build();
    d.proceduresRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.attachFile('missing', { fileId: 'file1' }, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.filesService.createLink).not.toHaveBeenCalled();
  });
});

describe('ProceduresService · MCH-007, adjuntar por id', () => {
  it('pregunta por el paciente del procedimiento y, sin permiso, no crea el vínculo', async () => {
    const d = build();
    d.proceduresRepo.findById.mockResolvedValue({
      id: 'proc1',
      patientProfileId: 'paciente-ajeno',
    });
    d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );

    await expect(
      d.service.attachFile('proc1', { fileId: 'f1' } as any, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(d.filesService.createLink).not.toHaveBeenCalled();
  });
});
