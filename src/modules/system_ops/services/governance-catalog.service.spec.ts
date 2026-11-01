import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GovernanceCatalogService } from './governance-catalog.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findDomainByCode: mockFn(),
    createDomain: mockFn(),
    findClassificationByCode: mockFn(),
    createClassification: mockFn(),
    createEntity: mockFn(),
    findEntityById: mockFn(),
    findEntityByTable: mockFn().mockResolvedValue(null),
    findFieldsByEntity: mockFn().mockResolvedValue([]),
    createField: mockFn(),
    findFieldById: mockFn(),
    findWritePolicyByCode: mockFn(),
    findWritePolicyById: mockFn(),
    createWritePolicy: mockFn(),
    findRetentionPolicyByCode: mockFn(),
    findRetentionPolicyById: mockFn(),
    createRetentionPolicy: mockFn(),
    findAnonymizationRuleByCode: mockFn(),
    findAnonymizationRuleById: mockFn(),
    createAnonymizationRule: mockFn(),
    recordChange: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new GovernanceCatalogService(em as any, repo, logger as any);
  return { service, tx, repo };
}

describe('GovernanceCatalogService', () => {
  describe('catalogEntity (UC-11-01)', () => {
    it('upserts domain/classification, creates entity and fields, records change', async () => {
      const d = build();
      d.repo.findDomainByCode.mockResolvedValue(null);
      d.repo.createDomain.mockReturnValue({ id: 'dom-1' });
      d.repo.findClassificationByCode.mockResolvedValue(null);
      d.repo.createClassification.mockReturnValue({ id: 'cls-1' });
      d.repo.createEntity.mockReturnValue({
        id: 'ent-1',
        schemaName: 'clinical',
        tableName: 'encounters',
      });
      d.repo.createField
        .mockReturnValueOnce({ id: 'fld-1' })
        .mockReturnValueOnce({ id: 'fld-2' });

      const res = await d.service.catalogEntity(
        {
          domain: { code: 'CLIN', name: 'Clinical' },
          classification: { code: 'PHI', name: 'PHI' },
          schemaName: 'clinical',
          tableName: 'encounters',
          isAppendOnly: false,
          isSoftDelete: true,
          hasHistory: true,
          fields: [{ columnName: 'a' }, { columnName: 'b' }],
        },
        actor,
      );

      expect(res).toEqual({
        id: 'ent-1',
        domainId: 'dom-1',
        classificationId: 'cls-1',
        schemaName: 'clinical',
        tableName: 'encounters',
        fieldIds: ['fld-1', 'fld-2'],
      });
      expect(d.repo.recordChange).toHaveBeenCalled();
    });

    it('reuses existing domain and classification when present', async () => {
      const d = build();
      d.repo.findDomainByCode.mockResolvedValue({ id: 'dom-x' });
      d.repo.findClassificationByCode.mockResolvedValue({ id: 'cls-x' });
      d.repo.createEntity.mockReturnValue({
        id: 'ent-2',
        schemaName: 's',
        tableName: 't',
      });

      const res = await d.service.catalogEntity(
        {
          domain: { code: 'CLIN', name: 'Clinical' },
          classification: { code: 'PHI', name: 'PHI' },
          schemaName: 's',
          tableName: 't',
          isAppendOnly: false,
          isSoftDelete: false,
          hasHistory: false,
          fields: [],
        },
        actor,
      );

      expect(res.domainId).toBe('dom-x');
      expect(res.classificationId).toBe('cls-x');
      expect(d.repo.createDomain).not.toHaveBeenCalled();
      expect(d.repo.createClassification).not.toHaveBeenCalled();
    });
  });

  describe('catalogEntity — alta repetida (upsert por schema_name, table_name)', () => {
    const dto = {
      domain: { code: 'CLIN', name: 'Clinical' },
      classification: { code: 'PHI', name: 'PHI' },
      schemaName: 'clinical',
      tableName: 'encounters',
      isAppendOnly: true,
      isSoftDelete: false,
      hasHistory: true,
      ownerTeam: 'clinica',
      fields: [
        { columnName: 'a', isPii: true, notes: 'nueva nota' },
        { columnName: 'c' },
      ],
    };

    it('actualiza la fila existente en vez de crear otra y reconcilia los campos por columna', async () => {
      const d = build();
      d.repo.findDomainByCode.mockResolvedValue({ id: 'dom-1' });
      d.repo.findClassificationByCode.mockResolvedValue({ id: 'cls-1' });
      const existing: any = {
        id: 'ent-1',
        schemaName: 'clinical',
        tableName: 'encounters',
        domainId: 'dom-old',
        classificationId: 'cls-old',
        isAppendOnly: false,
        isSoftDelete: true,
        hasHistory: false,
        historyTable: 'encounters_history',
        ownerTeam: 'viejo',
        updatedAt: new Date(0),
      };
      const fieldA: any = {
        id: 'fld-a',
        columnName: 'a',
        isPii: false,
        updatedAt: new Date(0),
      };
      const fieldB: any = {
        id: 'fld-b',
        columnName: 'b',
        updatedAt: new Date(0),
      };
      d.repo.findEntityByTable.mockResolvedValue(existing);
      d.repo.findFieldsByEntity.mockResolvedValue([fieldA, fieldB]);
      d.repo.createField.mockReturnValue({ id: 'fld-c' });

      const res = await d.service.catalogEntity(dto as any, actor);

      expect(d.repo.findEntityByTable).toHaveBeenCalledWith(
        d.tx,
        'clinical',
        'encounters',
      );
      expect(d.repo.createEntity).not.toHaveBeenCalled();
      expect(res).toEqual({
        id: 'ent-1',
        domainId: 'dom-1',
        classificationId: 'cls-1',
        schemaName: 'clinical',
        tableName: 'encounters',
        fieldIds: ['fld-a', 'fld-c'],
      });
      expect(existing).toMatchObject({
        domainId: 'dom-1',
        classificationId: 'cls-1',
        isAppendOnly: true,
        isSoftDelete: false,
        hasHistory: true,
        historyTable: 'encounters_history',
        ownerTeam: 'clinica',
        updatedByUserId: 'admin-1',
      });
      expect(fieldA).toMatchObject({
        isPii: true,
        notes: 'nueva nota',
        classificationId: 'cls-1',
        updatedByUserId: 'admin-1',
      });
      expect(fieldB.updatedByUserId).toBeUndefined();
      expect(d.repo.createField).toHaveBeenCalledTimes(1);
      expect(d.repo.createField).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ entityRegistryId: 'ent-1', columnName: 'c' }),
      );
      expect(d.repo.recordChange).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          targetId: 'ent-1',
          actionConceptId: expect.anything(),
          previousSnapshotJson: expect.objectContaining({
            domainId: 'dom-old',
            isAppendOnly: false,
            ownerTeam: 'viejo',
          }),
        }),
      );
      const created = d.repo.recordChange.mock.calls[0][1] as any;
      const { SYSOPS } = await import('../system_ops.concepts');
      expect(created.actionConceptId).toBe(SYSOPS.ACTION_UPDATE);
    });

    it('un alta nueva sigue creando la fila y registra CREATE', async () => {
      const d = build();
      d.repo.findDomainByCode.mockResolvedValue({ id: 'dom-1' });
      d.repo.findClassificationByCode.mockResolvedValue({ id: 'cls-1' });
      d.repo.createEntity.mockReturnValue({
        id: 'ent-n',
        schemaName: 'clinical',
        tableName: 'encounters',
      });
      d.repo.createField
        .mockReturnValueOnce({ id: 'f1' })
        .mockReturnValueOnce({ id: 'f2' });

      await d.service.catalogEntity(dto as any, actor);

      expect(d.repo.createEntity).toHaveBeenCalledTimes(1);
      expect(d.repo.findFieldsByEntity).not.toHaveBeenCalled();
      const { SYSOPS } = await import('../system_ops.concepts');
      expect(
        (d.repo.recordChange.mock.calls[0][1] as any).actionConceptId,
      ).toBe(SYSOPS.ACTION_CREATE);
    });
  });

  describe('createWritePolicy (UC-11-02)', () => {
    it('rejects a duplicate code', async () => {
      const d = build();
      d.repo.findWritePolicyByCode.mockResolvedValue({ id: 'w1' });
      await expect(
        d.service.createWritePolicy({ code: 'WP', name: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the policy and records the change', async () => {
      const d = build();
      d.repo.findWritePolicyByCode.mockResolvedValue(null);
      d.repo.createWritePolicy.mockReturnValue({ id: 'w2' });
      const res = await d.service.createWritePolicy(
        { code: 'WP', name: 'x' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'w2' });
      expect(d.repo.recordChange).toHaveBeenCalled();
    });
  });

  describe('applyWritePolicy (UC-11-02)', () => {
    it('throws when the entity does not exist', async () => {
      const d = build();
      d.repo.findEntityById.mockResolvedValue(null);
      await expect(
        d.service.applyWritePolicy('e1', { writePolicyId: 'w1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('links the write policy to the entity', async () => {
      const d = build();
      const entity: any = { id: 'e1', updatedAt: new Date() };
      d.repo.findEntityById.mockResolvedValue(entity);
      d.repo.findWritePolicyById.mockResolvedValue({ id: 'w1' });
      const res = await d.service.applyWritePolicy(
        'e1',
        { writePolicyId: 'w1' },
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(entity.writePolicyId).toBe('w1');
    });
  });

  describe('applyRetention (UC-11-03)', () => {
    it('throws when the retention policy does not exist', async () => {
      const d = build();
      d.repo.findEntityById.mockResolvedValue({
        id: 'e1',
        updatedAt: new Date(),
      });
      d.repo.findRetentionPolicyById.mockResolvedValue(null);
      await expect(
        d.service.applyRetention(
          'e1',
          { retentionPolicyId: 'r1', reason: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('updateField (UC-11-04)', () => {
    it('throws when the field does not exist', async () => {
      const d = build();
      d.repo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.updateField('f1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('assigns the anonymization rule to the field', async () => {
      const d = build();
      const field: any = { id: 'f1', updatedAt: new Date() };
      d.repo.findFieldById.mockResolvedValue(field);
      const res = await d.service.updateField(
        'f1',
        { anonymizationRuleId: 'ar1' },
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(field.anonymizationRuleId).toBe('ar1');
    });
  });
});
