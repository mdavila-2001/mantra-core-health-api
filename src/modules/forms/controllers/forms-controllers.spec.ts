import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsDefinitionSetsController } from './forms-definition-sets.controller';
import { FormsFieldsController } from './forms-fields.controller';
import { FormsAssignmentsController } from './forms-assignments.controller';
import { FormsInstancesController } from './forms-instances.controller';
import { FormsValuesController } from './forms-values.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('FormsDefinitionSetsController', () => {
  function build() {
    const schemaService = {
      createDefinitionSet: mockFn(),
      publishVersion: mockFn(),
      runMigration: mockFn(),
    };
    return {
      controller: new FormsDefinitionSetsController(schemaService as any),
      schemaService,
    };
  }

  it('delegates createDefinitionSet (UC-09-01)', async () => {
    const d = build();
    const dto = { namespaceUri: 'urn:x', code: 'C', name: 'N' };
    await d.controller.createDefinitionSet(dto, actor);
    expect(d.schemaService.createDefinitionSet).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates publishVersion (UC-09-03)', async () => {
    const d = build();
    const dto = { members: [{ fieldId: 'f1' }] };
    await d.controller.publishVersion('set1', 'ver1', dto, actor);
    expect(d.schemaService.publishVersion).toHaveBeenCalledWith(
      'set1',
      'ver1',
      dto,
      actor,
    );
  });

  it('delegates runMigration (UC-09-13)', async () => {
    const d = build();
    const dto = { fromVersionId: 'a', toVersionId: 'b' };
    await d.controller.runMigration('set1', 'mig1', dto, actor);
    expect(d.schemaService.runMigration).toHaveBeenCalledWith(
      'set1',
      'mig1',
      dto,
      actor,
    );
  });
});

describe('FormsFieldsController', () => {
  function build() {
    const fieldsService = {
      createFieldDefinition: mockFn(),
      addDependency: mockFn(),
      upsertLocalization: mockFn(),
      createAccessRule: mockFn(),
    };
    return {
      controller: new FormsFieldsController(fieldsService as any),
      fieldsService,
    };
  }

  it('delegates createFieldDefinition (UC-09-02)', async () => {
    const d = build();
    const dto = { code: 'C', name: 'N', dataType: 'string' };
    await d.controller.createFieldDefinition(dto as any, actor);
    expect(d.fieldsService.createFieldDefinition).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates addDependency (UC-09-04)', async () => {
    const d = build();
    const dto = { sourceFieldId: 's', operator: 'EQ', behavior: 'SHOW' };
    await d.controller.addDependency('t', dto as any, actor);
    expect(d.fieldsService.addDependency).toHaveBeenCalledWith('t', dto, actor);
  });

  it('delegates upsertLocalization (UC-09-05)', async () => {
    const d = build();
    const dto = { label: 'Nombre' };
    await d.controller.upsertLocalization('f1', 'es', dto, actor);
    expect(d.fieldsService.upsertLocalization).toHaveBeenCalledWith(
      'f1',
      'es',
      dto,
      actor,
    );
  });

  it('delegates createAccessRule (UC-09-12)', async () => {
    const d = build();
    const dto = { purposeOfUseValueSetId: 'vs-1' };
    await d.controller.createAccessRule('f1', dto, actor);
    expect(d.fieldsService.createAccessRule).toHaveBeenCalledWith(
      'f1',
      dto,
      actor,
    );
  });
});

describe('FormsAssignmentsController', () => {
  it('delegates createAssignment (UC-09-06)', async () => {
    const assignmentsService = { createAssignment: mockFn() };
    const controller = new FormsAssignmentsController(
      assignmentsService as any,
    );
    const dto = { fieldId: 'f1', targetResourceConceptId: 'rt' };
    await controller.createAssignment(dto, actor);
    expect(assignmentsService.createAssignment).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});

describe('FormsInstancesController', () => {
  function build() {
    const instancesService = {
      openInstance: mockFn(),
      closeInstance: mockFn(),
    };
    const valuesService = { captureValues: mockFn() };
    return {
      controller: new FormsInstancesController(
        instancesService as any,
        valuesService as any,
      ),
      instancesService,
      valuesService,
    };
  }

  it('delegates openInstance (UC-09-07)', async () => {
    const d = build();
    const dto = { resourceId: 'r1' };
    await d.controller.openInstance(dto, actor);
    expect(d.instancesService.openInstance).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates captureValues (UC-09-08)', async () => {
    const d = build();
    const dto = { values: [{ fieldId: 'f1', dataType: 'string', value: 'x' }] };
    await d.controller.captureValues('i1', dto as any, actor);
    expect(d.valuesService.captureValues).toHaveBeenCalledWith(
      'i1',
      dto,
      actor,
    );
  });

  it('delegates closeInstance (UC-09-11)', async () => {
    const d = build();
    await d.controller.closeInstance('i1', actor);
    expect(d.instancesService.closeInstance).toHaveBeenCalledWith('i1', actor);
  });
});

describe('FormsValuesController', () => {
  function build() {
    const valuesService = { correctValue: mockFn(), importValues: mockFn() };
    return {
      controller: new FormsValuesController(valuesService as any),
      valuesService,
    };
  }

  it('delegates correctValue (UC-09-09)', async () => {
    const d = build();
    const dto = { dataType: 'string', value: 'fixed' };
    await d.controller.correctValue('v1', dto as any, actor);
    expect(d.valuesService.correctValue).toHaveBeenCalledWith('v1', dto, actor);
  });

  it('delegates importValues (UC-09-10)', async () => {
    const d = build();
    const dto = { importBatchId: 'b', items: [] };
    await d.controller.importValues(dto, actor);
    expect(d.valuesService.importValues).toHaveBeenCalledWith(dto, actor);
  });
});
