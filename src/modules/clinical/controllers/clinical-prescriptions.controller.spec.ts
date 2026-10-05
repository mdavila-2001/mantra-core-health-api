import { jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClinicalPrescriptionsController } from './clinical-prescriptions.controller';
import { CLINICAL_PROXY_SCOPE } from '../services/clinical-read.service';

const actor = { id: 'user-1', roles: ['PATIENT'] } as any;

function setup() {
  const read = {
    assertOwnRecord: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
    assertPuedeLeerHistoria: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
  };
  const documents = {
    list: jest
      .fn<() => Promise<any>>()
      .mockResolvedValue({ items: [], total: 0 }),
    one: jest.fn<() => Promise<any>>().mockResolvedValue({
      id: 'rx-1',
      patientProfileId: 'patient-1',
      issuedAt: new Date(),
    }),
    all: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    pdf: jest
      .fn<() => Promise<Buffer>>()
      .mockResolvedValue(Buffer.from('%PDF')),
  };
  const response = { setHeader: jest.fn() } as any;
  const logger = { info: jest.fn() };
  return {
    controller: new ClinicalPrescriptionsController(
      read as any,
      documents as any,
      logger as any,
    ),
    read,
    documents,
    response,
  };
}

describe('ClinicalPrescriptionsController', () => {
  it('autoriza antes de leer el histórico completo', async () => {
    const d = setup();
    d.read.assertOwnRecord.mockRejectedValueOnce(new ForbiddenException());
    await expect(
      d.controller.history('patient-1', actor, d.response),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.read.assertOwnRecord).toHaveBeenCalledWith(
      'patient-1',
      actor,
      undefined,
      CLINICAL_PROXY_SCOPE.PRESCRIPTIONS_READ,
    );
    expect(d.documents.all).not.toHaveBeenCalled();
  });

  it('oculta la existencia de una receta ajena', async () => {
    const d = setup();
    d.read.assertPuedeLeerHistoria.mockRejectedValueOnce(
      new ForbiddenException(),
    );
    await expect(
      d.controller.one('rx-1', actor, d.response),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(d.read.assertPuedeLeerHistoria).toHaveBeenCalledWith(
      'patient-1',
      actor,
      CLINICAL_PROXY_SCOPE.PRESCRIPTIONS_READ,
    );
    expect(d.documents.pdf).not.toHaveBeenCalled();
  });

  it('devuelve un PDF sin caché para el titular', async () => {
    const d = setup();
    await d.controller.one('rx-1', actor, d.response);
    expect(d.response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(d.response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
  });
});
