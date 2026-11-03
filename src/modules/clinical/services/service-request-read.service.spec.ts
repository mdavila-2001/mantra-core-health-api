import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { CLIN } from '../clinical.concepts';
import { ServiceRequestReadService } from './service-request-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'user-1', roles: ['CLINICIAN'] } as any;

const ORDER = {
  id: 'sr-1',
  custodianTenantId: 'tenant-1',
  patientProfileId: 'patient-1',
  codeConceptId: 'hemograma',
  statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
  categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  requisitionId: 'req-1',
  createdAt: new Date('2026-10-31T10:00:00Z'),
};

function build(order: any = ORDER) {
  const fork = { findOne: mockFn(async () => order) };
  const em = { fork: () => fork };
  const clinicalRead = { assertCanReadHistory: mockFn(async () => undefined) };
  const detail = {
    describe: mockFn(
      async () =>
        new Map([
          [
            'sr-1',
            {
              codeDisplay: 'Hemograma',
              specimenTypeDisplay: 'Sangre',
              components: [
                { conceptId: 'hb', display: 'Hemoglobina', ordinal: 1 },
              ],
              componentsSpecified: true,
              imaging: null,
            },
          ],
        ]),
    ),
  };
  const notes = { noteIdsFor: mockFn(async () => new Map()) };
  const siteNames = { namesFor: mockFn(async () => new Map()) };
  const service = new ServiceRequestReadService(
    em as any,
    clinicalRead as any,
    detail as any,
    notes as any,
    siteNames as any,
  );
  return { service, clinicalRead, fork };
}

describe('ServiceRequestReadService.getById (C5)', () => {
  it('correcto: devuelve la orden con su detalle', async () => {
    const d = build();
    const out = await runWithTenant('tenant-1', () =>
      d.service.getById('sr-1', actor),
    );
    expect(out).toMatchObject({
      id: 'sr-1',
      requisitionId: 'req-1',
      codeDisplay: 'Hemograma',
      componentsSpecified: true,
      components: [{ conceptId: 'hb', ordinal: 1 }],
      category: 'LAB',
    });
    expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
      'patient-1',
      actor,
    );
  });

  it('una orden de otro tenant es 404 y ni siquiera consulta la relación asistencial', async () => {
    const d = build();
    await expect(
      runWithTenant('otro-tenant', () => d.service.getById('sr-1', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
  });

  it('inexistente: 404', async () => {
    const d = build(null);
    await expect(
      runWithTenant('tenant-1', () => d.service.getById('x', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('médico sin relación con el paciente: 404, no 403 (no revela que la orden existe)', async () => {
    const d = build();
    d.clinicalRead.assertCanReadHistory.mockImplementation(async () => {
      throw new ForbiddenException('No atiende a este paciente');
    });
    await expect(
      runWithTenant('tenant-1', () => d.service.getById('sr-1', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
