import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsReadService } from './forms-read.service';
import { FORMS } from '../forms.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const TENANT = 'tenant-1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // La lectura trabaja sobre un fork del EntityManager; el fork expone el
  // findOne con que el service ancla el encuentro de la instancia.
  const emFork = { findOne: mockFn().mockResolvedValue(null) };
  const em = { fork: mockFn(() => emFork) };
  const setsRepo = {
    findSetById: mockFn(),
    findSets: mockFn().mockResolvedValue([]),
    findVersionsBySet: mockFn().mockResolvedValue([]),
    findMembersByVersions: mockFn().mockResolvedValue([]),
  };
  const fieldsRepo = {
    findFieldsByIds: mockFn().mockResolvedValue([]),
    findValidationRulesByFieldIds: mockFn().mockResolvedValue([]),
    findDependenciesByTargetFieldIds: mockFn().mockResolvedValue([]),
    findLocalizationsByFieldIds: mockFn().mockResolvedValue([]),
    findActiveAccessRulesByFieldIds: mockFn().mockResolvedValue([]),
  };
  const assignmentsRepo = {
    findAssignments: mockFn().mockResolvedValue([]),
    findSectionsByIds: mockFn().mockResolvedValue([]),
  };
  const instancesRepo = {
    findById: mockFn(),
    findByResourceId: mockFn().mockResolvedValue([]),
  };
  const valuesRepo = { findCurrentByInstance: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsReadService(
    em as any,
    setsRepo as any,
    fieldsRepo as any,
    assignmentsRepo as any,
    instancesRepo as any,
    valuesRepo as any,
    logger as any,
  );
  return {
    service,
    emFork,
    setsRepo,
    fieldsRepo,
    assignmentsRepo,
    instancesRepo,
    valuesRepo,
  };
}

describe('FormsReadService', () => {
  describe('listDefinitionSets', () => {
    it('lists visible sets without truncation', async () => {
      const d = build();
      d.setsRepo.findSets.mockResolvedValue([
        {
          id: 's1',
          namespaceUri: 'urn:x',
          code: 'C',
          name: 'N',
          statusConceptId: FORMS.SET_STATUS_ACTIVE,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      const res = await d.service.listDefinitionSets(TENANT, 50);
      expect(d.setsRepo.findSets).toHaveBeenCalledWith(d.emFork, TENANT, 51);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('s1');
      expect(res.truncated).toBe(false);
    });

    it('declares the cut instead of hiding it', async () => {
      const d = build();
      d.setsRepo.findSets.mockResolvedValue([
        { id: 's1', createdAt: new Date() },
        { id: 's2', createdAt: new Date() },
      ]);
      const res = await d.service.listDefinitionSets(undefined, 1);
      expect(res.items).toHaveLength(1);
      expect(res.truncated).toBe(true);
    });
  });

  describe('getDefinitionSet', () => {
    it('throws 404 when the set does not exist', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue(null);
      await expect(
        d.service.getDefinitionSet('missing', TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('hides a set owned by another tenant behind a 404', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue({
        id: 's1',
        ownerTenantId: 'tenant-ajeno',
      });
      await expect(
        d.service.getDefinitionSet('s1', TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('composes versions, members, fields and sections in batches', async () => {
      const d = build();
      d.setsRepo.findSetById.mockResolvedValue({
        id: 's1',
        namespaceUri: 'urn:x',
        code: 'C',
        name: 'N',
        ownerTenantId: undefined,
        statusConceptId: FORMS.SET_STATUS_ACTIVE,
        createdAt: new Date('2026-01-01'),
      });
      d.setsRepo.findVersionsBySet.mockResolvedValue([
        {
          id: 'v1',
          semanticVersion: '1.0.0',
          schemaHash: 'h',
          recordedAt: new Date('2026-01-02'),
        },
      ]);
      d.setsRepo.findMembersByVersions.mockResolvedValue([
        {
          definitionSetVersionId: 'v1',
          fieldId: 'f1',
          sectionId: 'sec1',
          required: true,
          ordinal: 0,
        },
      ]);
      d.fieldsRepo.findFieldsByIds.mockResolvedValue([
        { id: 'f1', code: 'FC', name: 'Campo', dataType: 'string' },
      ]);
      d.fieldsRepo.findValidationRulesByFieldIds.mockResolvedValue([
        {
          id: 'r1',
          fieldId: 'f1',
          ruleTypeConceptId: FORMS.RULE_TYPE_REQUIRED,
          parametersJson: {},
        },
      ]);
      d.fieldsRepo.findDependenciesByTargetFieldIds.mockResolvedValue([
        {
          id: 'd1',
          targetFieldId: 'f1',
          sourceFieldId: 'f9',
          operatorConceptId: FORMS.OP_EQUALS,
          behaviorConceptId: FORMS.BEHAVIOR_SHOW,
        },
      ]);
      d.fieldsRepo.findLocalizationsByFieldIds.mockResolvedValue([
        { fieldId: 'f1', languageConceptId: 'lang-es', label: 'Etiqueta' },
      ]);
      d.assignmentsRepo.findSectionsByIds.mockResolvedValue([
        { id: 'sec1', code: 'SC', name: 'Sección' },
      ]);

      const res = await d.service.getDefinitionSet('s1', TENANT);

      expect(d.fieldsRepo.findFieldsByIds).toHaveBeenCalledWith(d.emFork, [
        'f1',
      ]);
      expect(d.assignmentsRepo.findSectionsByIds).toHaveBeenCalledWith(
        d.emFork,
        ['sec1'],
      );
      expect(res.versions).toHaveLength(1);
      expect(res.versions[0].members).toEqual([
        { fieldId: 'f1', sectionId: 'sec1', required: true, ordinal: 0 },
      ]);
      expect(res.fields).toHaveLength(1);
      expect(res.fields[0].validationRules).toHaveLength(1);
      expect(res.fields[0].dependencies).toHaveLength(1);
      expect(res.fields[0].localizations[0].label).toBe('Etiqueta');
      expect(res.sections[0].name).toBe('Sección');
    });
  });

  describe('listInstancesByEncounter', () => {
    it('throws 404 when the encounter does not exist', async () => {
      const d = build();
      d.emFork.findOne.mockResolvedValue(null);
      await expect(
        runWithTenant(TENANT, () =>
          d.service.listInstancesByEncounter('enc-x', 50),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('hides the encounter of another tenant behind a 404', async () => {
      const d = build();
      d.emFork.findOne.mockResolvedValue({
        id: 'enc-1',
        tenantId: 'tenant-ajeno',
      });
      await expect(
        runWithTenant(TENANT, () =>
          d.service.listInstancesByEncounter('enc-1', 50),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('requires a tenant in the context', async () => {
      const d = build();
      await expect(
        d.service.listInstancesByEncounter('enc-1', 50),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('lists the instances of an owned encounter, declaring the cut', async () => {
      const d = build();
      d.emFork.findOne.mockResolvedValue({ id: 'enc-1', tenantId: TENANT });
      d.instancesRepo.findByResourceId.mockResolvedValue([
        {
          id: 'i1',
          resourceId: 'enc-1',
          resourceTypeConceptId: FORMS.RESOURCE_TYPE_PATIENT,
          schemaVersion: 1,
          createdAt: new Date('2026-01-03'),
        },
        {
          id: 'i2',
          resourceId: 'enc-1',
          resourceTypeConceptId: FORMS.RESOURCE_TYPE_PATIENT,
          schemaVersion: 1,
          createdAt: new Date('2026-01-02'),
        },
      ]);
      const res = await runWithTenant(TENANT, () =>
        d.service.listInstancesByEncounter('enc-1', 1),
      );
      expect(d.instancesRepo.findByResourceId).toHaveBeenCalledWith(
        d.emFork,
        'enc-1',
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('i1');
      expect(res.truncated).toBe(true);
    });
  });

  describe('getInstance', () => {
    /** Instancia anclable: su recurso resuelve a un encuentro del tenant. */
    function conInstanciaPropia(d: ReturnType<typeof build>) {
      d.instancesRepo.findById.mockResolvedValue({
        id: 'i1',
        resourceId: 'enc-1',
        resourceTypeConceptId: FORMS.RESOURCE_TYPE_PATIENT,
        schemaVersion: 1,
        stateConceptId: FORMS.INSTANCE_CLOSED,
        createdAt: new Date('2026-01-03'),
      });
      d.emFork.findOne.mockResolvedValue({ id: 'enc-1', tenantId: TENANT });
    }

    it('throws 404 when the instance does not exist', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(null);
      await expect(
        runWithTenant(TENANT, () => d.service.getInstance('missing')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails closed when the resource does not resolve to an encounter', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue({
        id: 'i1',
        resourceId: 'no-es-encuentro',
      });
      d.emFork.findOne.mockResolvedValue(null);
      await expect(
        runWithTenant(TENANT, () => d.service.getInstance('i1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('hides the instance of another tenant behind a 404', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue({
        id: 'i1',
        resourceId: 'enc-1',
      });
      d.emFork.findOne.mockResolvedValue({
        id: 'enc-1',
        tenantId: 'tenant-ajeno',
      });
      await expect(
        runWithTenant(TENANT, () => d.service.getInstance('i1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('resolves each value from the column its data type determines', async () => {
      const d = build();
      conInstanciaPropia(d);
      d.valuesRepo.findCurrentByInstance.mockResolvedValue([
        { id: 'v1', fieldId: 'f-str', ordinal: 0, valueString: 'Penicilina' },
        { id: 'v2', fieldId: 'f-bool', ordinal: 1, valueBoolean: true },
        { id: 'v3', fieldId: 'f-dec', ordinal: 2, valueDecimal: '36.6' },
      ]);
      d.fieldsRepo.findFieldsByIds.mockResolvedValue([
        { id: 'f-str', dataType: 'string' },
        { id: 'f-bool', dataType: 'boolean' },
        { id: 'f-dec', dataType: 'decimal' },
      ]);

      const res = await runWithTenant(TENANT, () =>
        d.service.getInstance('i1'),
      );

      expect(d.valuesRepo.findCurrentByInstance).toHaveBeenCalledWith(
        d.emFork,
        'i1',
        FORMS.VALUE_SUPERSEDED,
      );
      expect(res.values.map((v) => v.value)).toEqual([
        'Penicilina',
        true,
        '36.6',
      ]);
      expect(res.values.every((v) => v.masked === false)).toBe(true);
    });

    it('falls back to the populated column when the field definition is gone', async () => {
      const d = build();
      conInstanciaPropia(d);
      d.valuesRepo.findCurrentByInstance.mockResolvedValue([
        { id: 'v1', fieldId: 'f-borrado', ordinal: 0, valueText: 'Nota larga' },
      ]);
      d.fieldsRepo.findFieldsByIds.mockResolvedValue([]);

      const res = await runWithTenant(TENANT, () =>
        d.service.getInstance('i1'),
      );
      expect(res.values[0].dataType).toBeUndefined();
      expect(res.values[0].value).toBe('Nota larga');
    });

    it('masks and omits the value of a field with an active access rule', async () => {
      const d = build();
      conInstanciaPropia(d);
      d.valuesRepo.findCurrentByInstance.mockResolvedValue([
        { id: 'v1', fieldId: 'f-sensible', ordinal: 0, valueString: 'VIH+' },
        { id: 'v2', fieldId: 'f-libre', ordinal: 1, valueString: 'ok' },
      ]);
      d.fieldsRepo.findFieldsByIds.mockResolvedValue([
        { id: 'f-sensible', dataType: 'string' },
        { id: 'f-libre', dataType: 'string' },
      ]);
      d.fieldsRepo.findActiveAccessRulesByFieldIds.mockResolvedValue([
        { id: 'ar1', fieldId: 'f-sensible' },
      ]);

      const res = await runWithTenant(TENANT, () =>
        d.service.getInstance('i1'),
      );

      expect(d.fieldsRepo.findActiveAccessRulesByFieldIds).toHaveBeenCalledWith(
        d.emFork,
        ['f-sensible', 'f-libre'],
        FORMS.ACCESS_RULE_ACTIVE,
      );
      const sensible = res.values.find((v) => v.fieldId === 'f-sensible')!;
      const libre = res.values.find((v) => v.fieldId === 'f-libre')!;
      expect(sensible.masked).toBe(true);
      expect(sensible.value).toBeNull();
      expect(libre.masked).toBe(false);
      expect(libre.value).toBe('ok');
    });
  });

  describe('listAssignments', () => {
    it('lists assignments with their sections resolved, declaring the cut', async () => {
      const d = build();
      d.assignmentsRepo.findAssignments.mockResolvedValue([
        {
          id: 'a1',
          fieldId: 'f1',
          targetResourceConceptId: 'rt',
          sectionId: 'sec1',
          required: true,
          visible: true,
          editable: true,
          ordinal: 0,
        },
        {
          id: 'a2',
          fieldId: 'f2',
          targetResourceConceptId: 'rt',
          sectionId: 'sec1',
          required: false,
          visible: true,
          editable: true,
          ordinal: 1,
        },
      ]);
      d.assignmentsRepo.findSectionsByIds.mockResolvedValue([
        { id: 'sec1', code: 'SC', name: 'Sección' },
      ]);

      const res = await d.service.listAssignments(
        { targetResourceConceptId: 'rt' },
        TENANT,
        1,
      );

      expect(d.assignmentsRepo.findAssignments).toHaveBeenCalledWith(
        d.emFork,
        { targetResourceConceptId: 'rt' },
        TENANT,
        2,
      );
      // Las secciones se resuelven para la página servida, no para el sobrante.
      expect(d.assignmentsRepo.findSectionsByIds).toHaveBeenCalledWith(
        d.emFork,
        ['sec1'],
      );
      expect(res.items).toHaveLength(1);
      expect(res.sections[0].name).toBe('Sección');
      expect(res.truncated).toBe(true);
    });
  });
});
