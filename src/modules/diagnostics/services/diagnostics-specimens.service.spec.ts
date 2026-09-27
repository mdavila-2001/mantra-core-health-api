import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsSpecimensService } from './diagnostics-specimens.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forked = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const repo = {
    findSpecimen: mockFn(),
    findAccession: mockFn(),
    findContainer: mockFn(),
    createSpecimen: mockFn(),
    createAccession: mockFn(),
    addAccessionSpecimen: mockFn(),
    recordCustodyEvent: mockFn(),
    recordRejection: mockFn(),
    createContainer: mockFn(),
    recordContainerEvent: mockFn(),
    cancelTestsForSpecimen: mockFn().mockResolvedValue(0),
    findAccessionForTenant: mockFn(),
    findAccessionSpecimens: mockFn().mockResolvedValue([]),
    findSpecimenForTenant: mockFn(),
    findSpecimensByIds: mockFn().mockResolvedValue([]),
    findContainersBySpecimenIds: mockFn().mockResolvedValue([]),
    findCustodyEventsBySpecimenIds: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsSpecimensService(
    em as any,
    repo,
    logger as any,
  );
  return { service, tx, em, repo };
}

describe('DiagnosticsSpecimensService', () => {
  describe('createSpecimen (soporte)', () => {
    it('creates a collected specimen and flushes', async () => {
      const d = build();
      d.repo.createSpecimen.mockReturnValue({
        id: 's1',
        statusConceptId: DIAG.SPECIMEN_COLLECTED,
      });
      const res = await d.service.createSpecimen(
        {
          patientProfileId: 'p1',
          custodianTenantId: 't1',
          specimenTypeConceptId: 'c1',
        },
        actor,
      );
      expect(res).toEqual({ id: 's1', status: DIAG.SPECIMEN_COLLECTED });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('accession (UC-20-01)', () => {
    it('rejects when a specimen does not exist', async () => {
      const d = build();
      d.repo.findSpecimen.mockResolvedValue(null);
      await expect(
        d.service.accession(
          {
            patientProfileId: 'p1',
            custodianTenantId: 't1',
            specimenIds: ['x'],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('accessions, marks specimen received and records custody', async () => {
      const d = build();
      const specimen = {
        id: 's1',
        statusConceptId: DIAG.SPECIMEN_COLLECTED,
        custodianTenantId: 't1',
      };
      d.repo.findSpecimen.mockResolvedValue(specimen);
      d.repo.createAccession.mockReturnValue({
        id: 'a1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      });
      d.repo.addAccessionSpecimen.mockReturnValue({ id: 'as1' });

      const res = await d.service.accession(
        {
          patientProfileId: 'p1',
          custodianTenantId: 't1',
          specimenIds: ['s1'],
        },
        actor,
      );

      expect(res).toEqual({
        id: 'a1',
        status: DIAG.ACCESSION_RECEIVED,
        accessionSpecimenIds: ['as1'],
      });
      expect(specimen.statusConceptId).toBe(DIAG.SPECIMEN_RECEIVED);
      expect(d.repo.recordCustodyEvent).toHaveBeenCalled();
    });

    it('refuses to accession a rejected specimen (precondition)', async () => {
      const d = build();
      d.repo.findSpecimen.mockResolvedValue({
        id: 's1',
        statusConceptId: DIAG.SPECIMEN_REJECTED,
      });
      await expect(
        d.service.accession(
          {
            patientProfileId: 'p1',
            custodianTenantId: 't1',
            specimenIds: ['s1'],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('reject (UC-20-02)', () => {
    it('throws when specimen missing', async () => {
      const d = build();
      d.repo.findSpecimen.mockResolvedValue(null);
      await expect(
        d.service.reject('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects specimen and cancels dependent tests', async () => {
      const d = build();
      const specimen = { id: 's1', statusConceptId: DIAG.SPECIMEN_RECEIVED };
      d.repo.findSpecimen.mockResolvedValue(specimen);
      d.repo.recordRejection.mockReturnValue({ id: 'rej1' });

      const res = await d.service.reject(
        's1',
        { rejectionReasonConceptId: 'r1' },
        actor,
      );

      expect(res).toEqual({ id: 'rej1', status: DIAG.SPECIMEN_REJECTED });
      expect(specimen.statusConceptId).toBe(DIAG.SPECIMEN_REJECTED);
      expect(d.repo.cancelTestsForSpecimen).toHaveBeenCalledWith(
        d.tx,
        's1',
        DIAG.TEST_CANCELLED,
      );
    });
  });

  describe('recordCustodyEvent (UC-20-03)', () => {
    it('throws when container missing', async () => {
      const d = build();
      d.repo.findContainer.mockResolvedValue(null);
      await expect(
        d.service.recordCustodyEvent(
          'missing',
          { specimenId: 's1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('records container + custody events and updates status', async () => {
      const d = build();
      const container = { id: 'c1', statusConceptId: DIAG.CONTAINER_ACTIVE };
      d.repo.findContainer.mockResolvedValue(container);
      d.repo.recordCustodyEvent.mockReturnValue({ id: 'cust1' });

      const res = await d.service.recordCustodyEvent(
        'c1',
        { specimenId: 's1' },
        actor,
      );

      expect(res.id).toBe('cust1');
      expect(container.statusConceptId).toBe(DIAG.CONTAINER_STORED);
      expect(d.repo.recordContainerEvent).toHaveBeenCalled();
    });
  });

  describe('getAccession (CL-47, lectura)', () => {
    it('aceptado: arma el detalle con especímenes, contenedores y custodia', async () => {
      const d = build();
      d.repo.findAccessionForTenant.mockResolvedValue({
        id: 'acc1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        accessionNumber: 'ACC-1',
        receivedAt: new Date('2026-01-01'),
        priorityConceptId: 'prio1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      });
      d.repo.findAccessionSpecimens.mockResolvedValue([
        {
          id: 'as1',
          specimenId: 's1',
          sequenceNumber: 1,
          statusConceptId: 'st1',
        },
      ]);
      d.repo.findSpecimensByIds.mockResolvedValue([
        {
          id: 's1',
          patientProfileId: 'p1',
          specimenTypeConceptId: 'type1',
          statusConceptId: DIAG.SPECIMEN_RECEIVED,
        },
      ]);
      d.repo.findContainersBySpecimenIds.mockResolvedValue([
        {
          id: 'c1',
          specimenId: 's1',
          containerIdentifier: 'CONT-1',
          containerTypeConceptId: 'ct1',
          statusConceptId: DIAG.CONTAINER_ACTIVE,
        },
      ]);
      d.repo.findCustodyEventsBySpecimenIds.mockResolvedValue([
        {
          id: 'cust1',
          specimenId: 's1',
          custodyEventTypeConceptId: DIAG.CUSTODY_RECEPTION,
          occurredAt: new Date('2026-01-01'),
        },
      ]);

      const res = await d.service.getAccession('acc1', 't1');

      expect(res.id).toBe('acc1');
      expect(res.specimens).toHaveLength(1);
      expect(res.specimens[0].specimen.containers).toHaveLength(1);
      expect(res.specimens[0].specimen.custodyEvents).toHaveLength(1);
    });

    it('límite: una acesión sin especímenes todavía devuelve la lista vacía', async () => {
      const d = build();
      d.repo.findAccessionForTenant.mockResolvedValue({
        id: 'acc1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        accessionNumber: 'ACC-1',
        receivedAt: new Date('2026-01-01'),
        priorityConceptId: 'prio1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      });

      const res = await d.service.getAccession('acc1', 't1');

      expect(res.specimens).toEqual([]);
    });

    it('inválido: 404 si la acesión no existe o es de otro tenant', async () => {
      const d = build();
      d.repo.findAccessionForTenant.mockResolvedValue(null);
      await expect(d.service.getAccession('acc1', 't1')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.repo.findAccessionForTenant).toHaveBeenCalledWith(
        expect.anything(),
        'acc1',
        't1',
      );
    });
  });

  describe('getSpecimen (CL-47, lectura)', () => {
    it('aceptado: arma el detalle con contenedores y custodia', async () => {
      const d = build();
      d.repo.findSpecimenForTenant.mockResolvedValue({
        id: 's1',
        patientProfileId: 'p1',
        specimenTypeConceptId: 'type1',
        statusConceptId: DIAG.SPECIMEN_RECEIVED,
      });
      d.repo.findContainersBySpecimenIds.mockResolvedValue([]);
      d.repo.findCustodyEventsBySpecimenIds.mockResolvedValue([]);

      const res = await d.service.getSpecimen('s1', 't1');

      expect(res.id).toBe('s1');
      expect(res.containers).toEqual([]);
      expect(res.custodyEvents).toEqual([]);
    });

    it('inválido: 404 si el espécimen no existe o es de otro tenant', async () => {
      const d = build();
      d.repo.findSpecimenForTenant.mockResolvedValue(null);
      await expect(d.service.getSpecimen('s1', 't2')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
