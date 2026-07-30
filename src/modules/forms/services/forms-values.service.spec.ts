import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsValuesService } from './forms-values.service';
import { FORMS } from '../forms.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'clin-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const valuesRepo = {
    findById: mockFn(),
    create: mockFn(),
    createAudit: mockFn(),
    createProvenance: mockFn(),
  };
  const instancesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsValuesService(
    em as any,
    valuesRepo as any,
    instancesRepo as any,
    logger as any,
  );
  return { service, tx, valuesRepo, instancesRepo };
}

const openInstance = {
  id: 'i1',
  stateConceptId: FORMS.INSTANCE_OPEN,
  resourceTypeConceptId: 'rt',
  resourceId: 'ri',
};

describe('FormsValuesService', () => {
  describe('captureValues (UC-09-08)', () => {
    it('captures values and writes an audit row per value', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(openInstance);
      d.valuesRepo.create.mockReturnValue({
        id: 'v1',
        fieldId: 'f1',
        ordinal: 0,
      });
      const res = await d.service.captureValues(
        'i1',
        { values: [{ fieldId: 'f1', dataType: 'string', value: 'hi' }] } as any,
        actor,
      );
      expect(res).toEqual({ ids: ['v1'] });
      expect(d.valuesRepo.createAudit).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ actionConceptId: FORMS.AUDIT_CREATE }),
      );
    });

    it('rejects capturing on an instance that is not open', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue({
        ...openInstance,
        stateConceptId: FORMS.INSTANCE_CLOSED,
      });
      await expect(
        d.service.captureValues(
          'i1',
          {
            values: [{ fieldId: 'f1', dataType: 'string', value: 'x' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('correctValue (UC-09-09)', () => {
    it('supersedes the previous value with a corrected version', async () => {
      const d = build();
      const previous = {
        id: 'v1',
        valueStatusConceptId: FORMS.VALUE_FINAL,
        formInstanceId: 'i1',
        resourceTypeConceptId: 'rt',
        resourceId: 'ri',
        fieldId: 'f1',
        ordinal: 0,
        valueVersion: 1,
        updatedAt: new Date(),
      };
      d.valuesRepo.findById.mockResolvedValue(previous);
      d.valuesRepo.create.mockReturnValue({ id: 'v2' });
      const res = await d.service.correctValue(
        'v1',
        { dataType: 'string', value: 'fixed' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'v2' });
      expect(previous.valueStatusConceptId).toBe(FORMS.VALUE_SUPERSEDED);
      expect(d.valuesRepo.createAudit).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ actionConceptId: FORMS.AUDIT_CORRECT }),
      );
    });

    it('rejects correcting an already superseded value', async () => {
      const d = build();
      d.valuesRepo.findById.mockResolvedValue({
        id: 'v1',
        valueStatusConceptId: FORMS.VALUE_SUPERSEDED,
      });
      await expect(
        d.service.correctValue(
          'v1',
          { dataType: 'string', value: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the value does not exist', async () => {
      const d = build();
      d.valuesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.correctValue(
          'v1',
          { dataType: 'string', value: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('importValues (UC-09-10)', () => {
    it('imports external values with provenance and audit', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(openInstance);
      d.valuesRepo.create.mockReturnValue({
        id: 'v1',
        fieldId: 'f1',
        ordinal: 0,
      });
      const res = await d.service.importValues(
        {
          importBatchId: 'batch-1',
          items: [
            {
              formInstanceId: 'i1',
              fieldId: 'f1',
              dataType: 'string',
              value: 'ext',
            },
          ],
        } as any,
        actor,
      );
      expect(res).toEqual({ ids: ['v1'] });
      expect(d.valuesRepo.createProvenance).toHaveBeenCalled();
      expect(d.valuesRepo.createAudit).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ actionConceptId: FORMS.AUDIT_IMPORT }),
      );
    });

    it('throws when a target instance does not exist', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.importValues(
          {
            importBatchId: 'b',
            items: [
              {
                formInstanceId: 'i9',
                fieldId: 'f1',
                dataType: 'string',
                value: 'x',
              },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
