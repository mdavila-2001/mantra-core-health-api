import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ObservationsService } from './observations.service';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
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
  const observationsRepo = {
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
    createComponent: mockFn(),
    createPerformer: mockFn(),
    createReferenceRange: mockFn(),
    createNote: mockFn(),
    findComponents: mockFn().mockResolvedValue([]),
  };
  const encountersRepo = { findById: mockFn() };
  const serviceRequestsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
  };
  const service = new ObservationsService(
    em as any,
    observationsRepo,
    encountersRepo as any,
    serviceRequestsRepo as any,
    logger as any,
    clinicalRead as any,
  );
  return {
    service,
    tx,
    observationsRepo,
    encountersRepo,
    serviceRequestsRepo,
    clinicalRead,
  };
}

describe('ObservationsService', () => {
  describe('record (UC-08-03)', () => {
    it('records a quantity observation with a component', async () => {
      const d = build();
      d.observationsRepo.create.mockReturnValue({
        id: 'obs1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.OBSERVATION_FINAL,
        rowVersion: 1,
        createdAt: new Date(),
      });
      d.observationsRepo.createComponent.mockReturnValue({ id: 'comp1' });

      const res = await d.service.record(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          quantityValue: 120,
          quantityUnitConceptId: 'mmHg',
          components: [{ codeConceptId: 'c-sys', quantityValue: 80 }],
          performers: [{ performerTypeConceptId: 'pt', performerId: 'hp1' }],
          referenceRanges: [{ lowValue: 60, highValue: 100 }],
          notes: ['nota'],
        },
        actor,
      );

      expect(res.status).toBe(CLIN.OBSERVATION_FINAL);
      expect(res.componentIds).toEqual(['comp1']);
      expect(d.observationsRepo.createPerformer).toHaveBeenCalled();
      expect(d.observationsRepo.createReferenceRange).toHaveBeenCalled();
      expect(d.observationsRepo.createNote).toHaveBeenCalled();
    });

    it('rejects when the encounter does not exist', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.record(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            encounterId: 'missing',
            quantityValue: 1,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    describe('MCH-008 · coherencia de paciente, encuentro y orden', () => {
      const base = {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
        quantityValue: 1,
      };

      function withCreatedObservation(d: ReturnType<typeof build>) {
        d.observationsRepo.create.mockReturnValue({
          id: 'obs1',
          patientProfileId: 'p1',
          statusConceptId: CLIN.OBSERVATION_FINAL,
          rowVersion: 1,
          createdAt: new Date(),
        });
      }

      it('rechaza el encuentro de otro paciente y no escribe', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue({
          id: 'enc-b',
          patientProfileId: 'p2',
          tenantId: 't1',
        });
        await expect(
          d.service.record({ ...base, encounterId: 'enc-b' } as any, actor),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.observationsRepo.create).not.toHaveBeenCalled();
      });

      it('rechaza el encuentro de otro tenant aunque sea del paciente', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue({
          id: 'enc-x',
          patientProfileId: 'p1',
          tenantId: 't2',
        });
        await expect(
          d.service.record({ ...base, encounterId: 'enc-x' } as any, actor),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.observationsRepo.create).not.toHaveBeenCalled();
      });

      it('rechaza la orden de otro paciente y no escribe', async () => {
        const d = build();
        d.serviceRequestsRepo.findById.mockResolvedValue({
          id: 'sr-b',
          patientProfileId: 'p2',
          custodianTenantId: 't1',
        });
        await expect(
          d.service.record(
            { ...base, basedOnServiceRequestId: 'sr-b' } as any,
            actor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.observationsRepo.create).not.toHaveBeenCalled();
      });

      it('rechaza la orden de otro tenant que no la deriva a este', async () => {
        const d = build();
        d.serviceRequestsRepo.findById.mockResolvedValue({
          id: 'sr-x',
          patientProfileId: 'p1',
          custodianTenantId: 't2',
          performerTenantId: 't3',
        });
        await expect(
          d.service.record(
            { ...base, basedOnServiceRequestId: 'sr-x' } as any,
            actor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.observationsRepo.create).not.toHaveBeenCalled();
      });

      it('acepta una orden derivada a este tenant y conserva origen, custodio y paciente', async () => {
        const d = build();
        withCreatedObservation(d);
        d.serviceRequestsRepo.findById.mockResolvedValue({
          id: 'sr-ref',
          patientProfileId: 'p1',
          custodianTenantId: 't-origen',
          performerTenantId: 't1',
        });
        await d.service.record(
          { ...base, basedOnServiceRequestId: 'sr-ref' } as any,
          actor,
        );
        expect(d.observationsRepo.create).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            basedOnServiceRequestId: 'sr-ref',
          }),
        );
      });

      it('acepta encuentro y orden coherentes del mismo tenant', async () => {
        const d = build();
        withCreatedObservation(d);
        d.encountersRepo.findById.mockResolvedValue({
          id: 'enc-a',
          patientProfileId: 'p1',
          tenantId: 't1',
        });
        d.serviceRequestsRepo.findById.mockResolvedValue({
          id: 'sr-a',
          patientProfileId: 'p1',
          custodianTenantId: 't1',
        });
        await d.service.record(
          {
            ...base,
            encounterId: 'enc-a',
            basedOnServiceRequestId: 'sr-a',
          } as any,
          actor,
        );
        expect(d.observationsRepo.create).toHaveBeenCalledTimes(1);
      });
    });

    it('rejects when no value family is provided', async () => {
      const d = build();
      await expect(
        d.service.record(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('amend (UC-08-04)', () => {
    /**
     * Ejecuta la operación obs.
     * @returns Resultado de obs.
     */
    const obs = () => ({
      id: 'obs1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.OBSERVATION_FINAL,
      rowVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('amends an observation and adds a note', async () => {
      const d = build();
      const o = obs();
      d.observationsRepo.findById.mockResolvedValue(o);
      const res = await d.service.amend(
        'obs1',
        { note: 'corrección', valueDecimal: 5 },
        actor,
      );
      expect(o.statusConceptId).toBe(CLIN.OBSERVATION_AMENDED);
      expect(d.observationsRepo.createNote).toHaveBeenCalled();
      expect(res.status).toBe(CLIN.OBSERVATION_AMENDED);
    });

    it('throws when the observation does not exist', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.amend('missing', { note: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects amending an observation in a non-amendable status', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue({
        ...obs(),
        statusConceptId: CLIN.OBSERVATION_AMENDED,
      });
      await expect(
        d.service.amend('obs1', { note: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects on optimistic version mismatch', async () => {
      const d = build();
      d.observationsRepo.findById.mockResolvedValue({
        ...obs(),
        rowVersion: 4,
      });
      await expect(
        d.service.amend(
          'obs1',
          { note: 'x', expectedRowVersion: 1 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });
});

describe('ObservationsService · MCH-007, enmienda por id', () => {
  it('pregunta por el paciente de la observación y, sin permiso, no la toca', async () => {
    const d = build();
    const observation = {
      id: 'obs-ajena',
      patientProfileId: 'paciente-ajeno',
      statusConceptId: CLIN.OBSERVATION_FINAL,
      rowVersion: 1,
    };
    d.observationsRepo.findById.mockResolvedValue(observation);
    d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );

    await expect(
      d.service.amend(
        'obs-ajena',
        { valueText: 'otro', note: 'corrección' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(observation.statusConceptId).toBe(CLIN.OBSERVATION_FINAL);
    expect(d.observationsRepo.createNote).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });
});
