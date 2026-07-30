import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsFieldsService } from './forms-fields.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'steward-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const fieldsRepo = {
    findFieldByCode: mockFn(),
    findFieldById: mockFn(),
    createField: mockFn(),
    createValidationRule: mockFn(),
    findDependency: mockFn(),
    createDependency: mockFn(),
    findLocalization: mockFn(),
    createLocalization: mockFn(),
    createAccessRule: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsFieldsService(em as any, fieldsRepo, logger as any);
  return { service, tx, fieldsRepo };
}

describe('FormsFieldsService', () => {
  describe('createFieldDefinition (UC-09-02)', () => {
    it('creates the field then its validation rules', async () => {
      const d = build();
      d.fieldsRepo.findFieldByCode.mockResolvedValue(null);
      d.fieldsRepo.createField.mockReturnValue({ id: 'f1' });
      const res = await d.service.createFieldDefinition(
        {
          code: 'C',
          name: 'N',
          dataType: 'string',
          validationRules: [{ ruleType: 'REQUIRED', parameters: {} }],
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'f1' });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.fieldsRepo.createValidationRule).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicated field code', async () => {
      const d = build();
      d.fieldsRepo.findFieldByCode.mockResolvedValue({ id: 'f0' });
      await expect(
        d.service.createFieldDefinition(
          { code: 'C', name: 'N', dataType: 'string' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addDependency (UC-09-04)', () => {
    it('creates a dependency between two distinct active fields', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'x' });
      d.fieldsRepo.findDependency.mockResolvedValue(null);
      d.fieldsRepo.createDependency.mockReturnValue({ id: 'dep1' });
      const res = await d.service.addDependency(
        'target-1',
        { sourceFieldId: 'source-1', operator: 'EQ', behavior: 'SHOW' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'dep1' });
    });

    it('rejects a self dependency', async () => {
      const d = build();
      await expect(
        d.service.addDependency(
          'same',
          { sourceFieldId: 'same', operator: 'EQ', behavior: 'SHOW' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated dependency', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'x' });
      d.fieldsRepo.findDependency.mockResolvedValue({ id: 'dep0' });
      await expect(
        d.service.addDependency(
          't',
          { sourceFieldId: 's', operator: 'EQ', behavior: 'SHOW' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('upsertLocalization (UC-09-05)', () => {
    it('creates a localization for a supported language', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.fieldsRepo.findLocalization.mockResolvedValue(null);
      d.fieldsRepo.createLocalization.mockReturnValue({ id: 'loc1' });
      const res = await d.service.upsertLocalization(
        'f1',
        'es',
        { label: 'Nombre' },
        actor,
      );
      expect(res).toEqual({ id: 'loc1' });
    });

    it('rejects an unsupported language', async () => {
      const d = build();
      await expect(
        d.service.upsertLocalization('f1', 'zz', { label: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the field does not exist', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.upsertLocalization('f1', 'es', { label: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createAccessRule (UC-09-12)', () => {
    it('creates an access rule for an existing field', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.fieldsRepo.createAccessRule.mockReturnValue({ id: 'ar1' });
      const res = await d.service.createAccessRule(
        'f1',
        { purposeOfUseValueSetId: 'vs-1', maskStrategy: 'REDACT' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'ar1' });
    });

    it('throws when the field does not exist', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.createAccessRule(
          'f1',
          { purposeOfUseValueSetId: 'vs-1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
