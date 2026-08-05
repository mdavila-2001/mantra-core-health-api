import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsSchemaService } from './forms-schema.service';
import { FORMS } from '../forms.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const setsRepo = {
    findSetByNamespace: mockFn(),
    findSetById: mockFn(),
    findVersionById: mockFn(),
    createSet: mockFn(),
    createVersion: mockFn(),
    createMember: mockFn(),
  };
  const migrationsRepo = { findById: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsSchemaService(
    em as any,
    setsRepo,
    migrationsRepo,
    logger as any,
  );
  return { service, tx, setsRepo, migrationsRepo };
}

describe('FormsSchemaService', () => {
  describe('createDefinitionSet (UC-09-01)', () => {
    it('creates set then version, flushing between them', async () => {
      const d = build();
      d.setsRepo.findSetByNamespace.mockResolvedValue(null);
      d.setsRepo.createSet.mockReturnValue({
        id: 'set1',
        statusConceptId: FORMS.SET_STATUS_DRAFT,
      });
      d.setsRepo.createVersion.mockReturnValue({ id: 'ver1' });

      const res = await d.service.createDefinitionSet(
        { namespaceUri: 'urn:x', code: 'C', name: 'N' },
        actor,
      );

      expect(res).toEqual({
        id: 'set1',
        versionId: 'ver1',
        status: FORMS.SET_STATUS_DRAFT,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('rejects a namespace already in use', async () => {
      const d = build();
      d.setsRepo.findSetByNamespace.mockResolvedValue({ id: 'set0' });
      await expect(
        d.service.createDefinitionSet(
          { namespaceUri: 'urn:x', code: 'C', name: 'N' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.setsRepo.createSet).not.toHaveBeenCalled();
    });
  });

  describe('publishVersion (UC-09-03)', () => {
    it('publishes a draft version and activates the set', async () => {
      const d = build();
      const set = {
        id: 'set1',
        statusConceptId: FORMS.SET_STATUS_DRAFT,
        updatedAt: new Date(),
      };
      const version = {
        id: 'ver1',
        definitionSetId: 'set1',
        publicationStatusConceptId: FORMS.PUB_DRAFT,
      };
      d.setsRepo.findSetById.mockResolvedValue(set);
      d.setsRepo.findVersionById.mockResolvedValue(version);

      const res = await d.service.publishVersion(
        'set1',
        'ver1',
        { members: [{ fieldId: 'f1' }] },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(version.publicationStatusConceptId).toBe(FORMS.PUB_PUBLISHED);
      expect(set.statusConceptId).toBe(FORMS.SET_STATUS_ACTIVE);
      expect(d.setsRepo.createMember).toHaveBeenCalledTimes(1);
    });

    it('rejects publishing a version that is not draft', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue({ id: 'set1' });
      d.setsRepo.findVersionById.mockResolvedValue({
        id: 'ver1',
        definitionSetId: 'set1',
        publicationStatusConceptId: FORMS.PUB_PUBLISHED,
      });
      await expect(
        d.service.publishVersion(
          'set1',
          'ver1',
          { members: [{ fieldId: 'f1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('runMigration (UC-09-13)', () => {
    it('records a completed migration between two versions of the set', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue({ id: 'set1' });
      d.migrationsRepo.findById.mockResolvedValue(null);
      d.setsRepo.findVersionById.mockResolvedValue({
        id: 'v',
        definitionSetId: 'set1',
      });
      d.migrationsRepo.create.mockReturnValue({
        id: 'mig1',
        statusConceptId: FORMS.MIGRATION_COMPLETED,
      });

      const res = await d.service.runMigration(
        'set1',
        'mig1',
        { fromVersionId: 'vA', toVersionId: 'vB' },
        actor,
      );

      expect(res).toEqual({
        id: 'mig1',
        status: FORMS.MIGRATION_COMPLETED,
        migratedValues: 0,
      });
    });

    it('rejects a migration id that already exists', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue({ id: 'set1' });
      d.migrationsRepo.findById.mockResolvedValue({ id: 'mig1' });
      await expect(
        d.service.runMigration(
          'set1',
          'mig1',
          { fromVersionId: 'a', toVersionId: 'b' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the set does not exist', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue(null);
      await expect(
        d.service.runMigration(
          'missing',
          'mig1',
          { fromVersionId: 'a', toVersionId: 'b' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
