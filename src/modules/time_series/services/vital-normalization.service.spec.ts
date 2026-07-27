import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CLIN } from '../../clinical/clinical.concepts';
import { VitalNormalizationService } from './vital-normalization.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const PATIENT_ID = '22222222-2222-2222-2222-222222222222';
const DEVICE_ID = '33333333-3333-3333-3333-333333333333';
const CODE_CONCEPT_ID = '44444444-4444-4444-4444-444444444444';
const UNIT_CONCEPT_ID = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const ingestRepo = {
    findVital: mockFn(async () => null),
    findDeviceReadingForUpdate: mockFn(async () => ({
      ingestionId: 'ing-1',
      sourceVersion: '1',
      qualityState: 'received',
      numericValue: 72,
      deviceId: DEVICE_ID,
      observedAtDevice: new Date('2026-01-01T00:00:00.000Z'),
    })),
    createVital: mockFn((_tx: any, data: any) => ({ ...data })),
    createPipelineMetric: mockFn(),
  };
  const observationsRepo = { create: mockFn(() => ({ id: 'obs-1' })) };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new VitalNormalizationService(
    em as any,
    ingestRepo as any,
    observationsRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, ingestRepo, observationsRepo, outbox, logger };
}

const DTO = {
  time: '2026-01-01T00:00:00.000Z',
  tenantId: TENANT_ID,
  seriesId: 'serie-1',
  observationCode: 'HR',
  observationCodeConceptId: CODE_CONCEPT_ID,
  patientProfileId: PATIENT_ID,
  unitCode: 'bpm',
  unitConceptId: UNIT_CONCEPT_ID,
} as any;

describe('VitalNormalizationService', () => {
  it('normaliza la lectura a constante vital validada', async () => {
    const d = build();

    const result = await d.service.normalizeReading(DTO, actor);

    const vital = d.ingestRepo.createVital.mock.calls[0][1];
    expect(vital.validationState).toBe('validated');
    expect(vital.numericValue).toBe(72);
    expect(result.duplicate).toBe(false);
  });

  it('no promueve al registro clínico si no se pide', async () => {
    const d = build();

    const result = await d.service.normalizeReading(DTO, actor);

    expect(d.observationsRepo.create).not.toHaveBeenCalled();
    expect(result.clinicallyPromotedObservationId).toBeUndefined();
  });

  it('promueve y enlaza la observación en la misma transacción', async () => {
    const d = build();

    const result = await d.service.normalizeReading(
      { ...DTO, promoteToClinical: true },
      actor,
    );

    const observation = d.observationsRepo.create.mock.calls[0][1];
    expect(observation.codeConceptId).toBe(CODE_CONCEPT_ID);
    expect(observation.statusConceptId).toBe(CLIN.OBSERVATION_FINAL);
    expect(observation.valueTypeConceptId).toBe(CLIN.VALUE_TYPE_QUANTITY);
    expect(observation.quantityValue).toBe('72');
    expect(result.clinicallyPromotedObservationId).toBe('obs-1');
    expect(
      d.ingestRepo.createVital.mock.results[0].value
        .clinicallyPromotedObservationId,
    ).toBe('obs-1');
  });

  it('devuelve la normalización previa sin volver a promover', async () => {
    const d = build();
    d.ingestRepo.findVital.mockResolvedValue({
      validationState: 'validated',
      clinicallyPromotedObservationId: 'obs-previa',
    });

    const result = await d.service.normalizeReading(
      { ...DTO, promoteToClinical: true },
      actor,
    );

    expect(result.duplicate).toBe(true);
    expect(result.clinicallyPromotedObservationId).toBe('obs-previa');
    expect(d.observationsRepo.create).not.toHaveBeenCalled();
    expect(d.ingestRepo.createVital).not.toHaveBeenCalled();
  });

  it('rechaza normalizar si no hay lectura cruda', async () => {
    const d = build();
    d.ingestRepo.findDeviceReadingForUpdate.mockResolvedValue(null);

    await expect(d.service.normalizeReading(DTO, actor)).rejects.toThrow(
      /No hay lectura cruda/,
    );
  });

  it('rechaza normalizar una lectura marcada como rechazada', async () => {
    const d = build();
    d.ingestRepo.findDeviceReadingForUpdate.mockResolvedValue({
      qualityState: 'rejected',
      numericValue: 72,
    });

    await expect(d.service.normalizeReading(DTO, actor)).rejects.toThrow(
      /rechazada/,
    );
  });

  it('rechaza normalizar una lectura sin valor numérico', async () => {
    const d = build();
    d.ingestRepo.findDeviceReadingForUpdate.mockResolvedValue({
      qualityState: 'received',
      numericValue: null,
    });

    await expect(d.service.normalizeReading(DTO, actor)).rejects.toThrow(
      /valor numérico/,
    );
  });

  it('deduplica el evento por serie, instante y código', async () => {
    const d = build();

    await d.service.normalizeReading(DTO, actor);

    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'VitalNormalizedAndPromoted',
        idempotencyKey: 'ts-normalize:serie-1:2026-01-01T00:00:00.000Z:HR',
      }),
    );
  });
});
