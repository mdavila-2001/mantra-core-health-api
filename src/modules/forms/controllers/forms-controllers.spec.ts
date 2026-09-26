import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsDefinitionSetsController } from './forms-definition-sets.controller';
import { FormsFieldsController } from './forms-fields.controller';
import { FormsAssignmentsController } from './forms-assignments.controller';
import { FormsInstancesController } from './forms-instances.controller';
import { FormsMeController } from './forms-me.controller';
import { FormsValuesController } from './forms-values.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('FormsDefinitionSetsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const schemaService = {
      createDefinitionSet: mockFn(),
      publishVersion: mockFn(),
      runMigration: mockFn(),
    };
    const readService = {
      listDefinitionSets: mockFn(),
      getDefinitionSet: mockFn(),
    };
    return {
      controller: new FormsDefinitionSetsController(
        schemaService as any,
        readService as any,
      ),
      schemaService,
      readService,
    };
  }

  it('delegates listDefinitionSets with the default limit', async () => {
    const d = build();
    await d.controller.listDefinitionSets(undefined);
    expect(d.readService.listDefinitionSets).toHaveBeenCalledWith(
      undefined,
      50,
    );
  });

  it('delegates getDefinitionSet', async () => {
    const d = build();
    await d.controller.getDefinitionSet('set1');
    expect(d.readService.getDefinitionSet).toHaveBeenCalledWith(
      'set1',
      undefined,
    );
  });

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
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const fieldsService = {
      createFieldDefinition: mockFn(),
      updateFieldDefinition: mockFn(),
      addDependency: mockFn(),
      upsertLocalization: mockFn(),
      createAccessRule: mockFn(),
    };
    return {
      controller: new FormsFieldsController(fieldsService as any),
      fieldsService,
    };
  }

  // CL-61 / CL-69 — la ruta que el generador llamaba para renombrar y daba 404.
  it('delegates updateFieldDefinition y la abre a quien atiende (CL-69)', async () => {
    const d = build();
    await d.controller.updateFieldDefinition('f1', { name: 'x' }, actor);
    expect(d.fieldsService.updateFieldDefinition).toHaveBeenCalledWith(
      'f1',
      { name: 'x' },
      actor,
    );
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      Object.getOwnPropertyDescriptor(
        FormsFieldsController.prototype,
        'updateFieldDefinition',
      )!.value,
    ) as string[];
    expect(roles).toEqual(
      expect.arrayContaining(['PRACTITIONER', 'CLINICIAN', 'SECURITY_ADMIN']),
    );
  });

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
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const assignmentsService = {
      createAssignment: mockFn(),
      updateAssignment: mockFn(),
      retireAssignment: mockFn(),
      reorderAssignments: mockFn(),
    };
    const readService = {
      listAssignments: mockFn(),
      getExtensionBudget: mockFn(),
    };
    return {
      controller: new FormsAssignmentsController(
        assignmentsService as any,
        readService as any,
      ),
      assignmentsService,
      readService,
    };
  }

  // CL-61 — las tres rutas que el generador ya llamaba y daban 404.
  it('delegates updateAssignment, retireAssignment y reorderAssignments (CL-61)', async () => {
    const d = build();
    await d.controller.updateAssignment('as1', { required: true }, actor);
    expect(d.assignmentsService.updateAssignment).toHaveBeenCalledWith(
      'as1',
      { required: true },
      actor,
    );
    await d.controller.retireAssignment('as1', actor);
    expect(d.assignmentsService.retireAssignment).toHaveBeenCalledWith(
      'as1',
      actor,
    );
    const orden = { targetResourceConceptId: 'rt', assignmentIds: ['as1'] };
    await d.controller.reorderAssignments(orden, actor);
    expect(d.assignmentsService.reorderAssignments).toHaveBeenCalledWith(
      orden,
      actor,
    );
  });

  it('las rutas de edición abren la puerta a quien atiende (CL-61)', () => {
    const rolesDe = (handler: string): string[] =>
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(
          FormsAssignmentsController.prototype,
          handler,
        )!.value,
      ) as string[];
    for (const handler of [
      'updateAssignment',
      'retireAssignment',
      'reorderAssignments',
    ]) {
      expect(rolesDe(handler)).toEqual(
        expect.arrayContaining(['PRACTITIONER', 'CLINICIAN', 'SECURITY_ADMIN']),
      );
    }
  });

  it('delegates createAssignment (UC-09-06)', async () => {
    const d = build();
    const dto = { fieldId: 'f1', targetResourceConceptId: 'rt' };
    await d.controller.createAssignment(dto, actor);
    expect(d.assignmentsService.createAssignment).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates listAssignments with its filters and the default limit', async () => {
    const d = build();
    await d.controller.listAssignments('rt', 'f1', undefined, undefined);
    expect(d.readService.listAssignments).toHaveBeenCalledWith(
      { targetResourceConceptId: 'rt', fieldId: 'f1', sectionId: undefined },
      undefined,
      50,
    );
  });

  it('delegates getBudget with the tenant of the context', async () => {
    const d = build();
    await d.controller.getBudget('rt');
    expect(d.readService.getExtensionBudget).toHaveBeenCalledWith(
      'rt',
      undefined,
    );
  });

  it('deja asignar a quien atiende, no sólo a quien administra', () => {
    // El generador de formularios vive de esto: un doctor podía declarar un
    // campo y no colgarlo de ningún sitio. Los límites de tenant y política los
    // aplica el servicio; acá se comprueba que la puerta del rol esté abierta,
    // que es lo que se cerró sin querer si alguien recorta este decorador.
    const rolesDe = (handler: string): string[] =>
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(
          FormsAssignmentsController.prototype,
          handler,
        )!.value,
      ) as string[];
    expect(rolesDe('createAssignment')).toEqual(
      expect.arrayContaining(['PRACTITIONER', 'CLINICIAN', 'SECURITY_ADMIN']),
    );
    expect(rolesDe('getBudget')).toEqual(
      expect.arrayContaining(['PRACTITIONER', 'CLINICIAN', 'SECURITY_ADMIN']),
    );
  });
});

describe('FormsInstancesController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const instancesService = {
      openInstance: mockFn(),
      closeInstance: mockFn(),
    };
    const valuesService = { captureValues: mockFn() };
    const readService = {
      listInstancesByEncounter: mockFn(),
      getInstance: mockFn(),
    };
    return {
      controller: new FormsInstancesController(
        instancesService as any,
        valuesService as any,
        readService as any,
      ),
      instancesService,
      valuesService,
      readService,
    };
  }

  it('delegates listInstances by encounter with the default limit', async () => {
    const d = build();
    await d.controller.listInstances('enc-1', undefined);
    expect(d.readService.listInstancesByEncounter).toHaveBeenCalledWith(
      'enc-1',
      50,
    );
  });

  it('delegates getInstance', async () => {
    const d = build();
    await d.controller.getInstance('i1');
    expect(d.readService.getInstance).toHaveBeenCalledWith('i1');
  });

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

describe('FormsMeController', () => {
  const paciente = { id: 'u-1', patientProfileId: 'pp-1' } as any;

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const readService = {
      listMyInstances: mockFn(),
      getMyInstance: mockFn(),
    };
    return {
      controller: new FormsMeController(readService as any),
      readService,
    };
  }

  it('delegates listMyInstances with the actor and the default limit', async () => {
    const d = build();
    await d.controller.listMyInstances(paciente, undefined);
    expect(d.readService.listMyInstances).toHaveBeenCalledWith(paciente, 50);
  });

  it('delegates getMyInstance with the actor of the session', async () => {
    const d = build();
    await d.controller.getMyInstance('i1', paciente);
    expect(d.readService.getMyInstance).toHaveBeenCalledWith('i1', paciente);
  });

  it('declares no role requirement: the filter is the patient claim', () => {
    // Igual que surveys/me: sin @Roles ni en la clase ni en los handlers — el
    // guard de roles deja pasar y el servicio exige el perfil de paciente.
    const rolesDe = (handler: string): unknown =>
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(FormsMeController.prototype, handler)!
          .value,
      );
    expect(Reflect.getMetadata(ROLES_KEY, FormsMeController)).toBeUndefined();
    expect(rolesDe('listMyInstances')).toBeUndefined();
    expect(rolesDe('getMyInstance')).toBeUndefined();
  });
});

describe('FormsValuesController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
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
