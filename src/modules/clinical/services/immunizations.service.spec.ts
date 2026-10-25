import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ImmunizationsService } from './immunizations.service';
import { ConflictException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const order: string[] = [];
  const tx = {
    flush: mockFn().mockImplementation(async () => {
      order.push('flush');
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const receivedServices = {
    projectImmunization: mockFn().mockImplementation(async () => {
      order.push('project');
    }),
  };
  const immunizationsRepo = {
    findByPatientVaccineDose: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ImmunizationsService(
    em as any,
    immunizationsRepo as any,
    logger as any,
    receivedServices as any,
  );
  return { service, immunizationsRepo, receivedServices, tx, order };
}

describe('ImmunizationsService (UC-08-13)', () => {
  it('records a completed immunization', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue(null);
    d.immunizationsRepo.create.mockReturnValue({
      id: 'imm1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.IMMUNIZATION_COMPLETED,
      doseNumber: 1,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        vaccineConceptId: 'v1',
        doseNumber: 1,
      },
      actor,
    );
    expect(res.status).toBe(CLIN.IMMUNIZATION_COMPLETED);
    expect(res.doseNumber).toBe(1);
  });

  it('projects the immunization to received services in the same transaction, after it is flushed', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue(null);
    const immunization = {
      id: 'imm1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.IMMUNIZATION_COMPLETED,
      createdAt: new Date(),
    };
    d.immunizationsRepo.create.mockReturnValue(immunization);
    await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        vaccineConceptId: 'v1',
      },
      actor,
    );
    expect(d.receivedServices.projectImmunization).toHaveBeenCalledWith(
      d.tx,
      immunization,
      'user-1',
    );
    // El servicio depende de la vacuna por FK: la vacuna se vuelca primero.
    expect(d.order).toEqual(['flush', 'project', 'flush']);
  });

  it('does not project a duplicate dose', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue({
      id: 'existing',
    });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          vaccineConceptId: 'v1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.receivedServices.projectImmunization).not.toHaveBeenCalled();
  });

  it('rejects a duplicate dose', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue({
      id: 'existing',
    });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          vaccineConceptId: 'v1',
          doseNumber: 1,
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
