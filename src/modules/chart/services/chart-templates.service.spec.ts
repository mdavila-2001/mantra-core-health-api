import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartTemplatesService } from './chart-templates.service';
import { CHART } from '../chart.concepts';
import { FORMS } from '../../forms/forms.concepts';
import { ResourceNotFoundException, runWithTenant } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const templatesRepo = {
    findTemplateById: mockFn(),
    findActiveDefaults: mockFn().mockResolvedValue([]),
    createAssignment: mockFn(),
    findTemplates: mockFn().mockResolvedValue([]),
    createTemplate: mockFn(),
    createTemplateSection: mockFn(),
    createTemplateField: mockFn(),
    createTemplateFieldAssignment: mockFn(),
    findFieldAssignmentsBySection: mockFn().mockResolvedValue([]),
    findFieldDefinitionsByIds: mockFn().mockResolvedValue([]),
    findLocalizationsByFieldIds: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ChartTemplatesService(
    em as any,
    templatesRepo,
    logger as any,
  );
  return { service, tx, em, templatesRepo };
}

describe('ChartTemplatesService', () => {
  describe('assignTemplate (UC-15-12)', () => {
    it('creates a non-default assignment without touching prior defaults', async () => {
      const d = build();
      d.templatesRepo.createAssignment.mockReturnValue({
        id: 'as1',
        templateId: 't1',
        isDefault: false,
        statusConceptId: CHART.ASSIGNMENT_ACTIVE,
      });

      const res = await d.service.assignTemplate(
        't1',
        { practiceId: 'pr1' },
        actor,
      );
      expect(d.templatesRepo.findActiveDefaults).not.toHaveBeenCalled();
      expect(res.isDefault).toBe(false);
      expect(res.statusConceptId).toBe(CHART.ASSIGNMENT_ACTIVE);
    });

    it('clears prior defaults in scope before inserting a new default', async () => {
      const d = build();
      const prior: any = { id: 'as0', isDefault: true, updatedAt: new Date() };
      d.templatesRepo.findActiveDefaults.mockResolvedValue([prior]);
      d.templatesRepo.createAssignment.mockReturnValue({
        id: 'as1',
        templateId: 't1',
        isDefault: true,
        statusConceptId: CHART.ASSIGNMENT_ACTIVE,
      });

      const res = await d.service.assignTemplate(
        't1',
        { practiceId: 'pr1', isDefault: true },
        actor,
      );
      expect(d.templatesRepo.findActiveDefaults).toHaveBeenCalledWith(
        d.tx,
        CHART.ASSIGNMENT_ACTIVE,
        { practiceId: 'pr1', practitionerProfileId: undefined },
      );
      expect(prior.isDefault).toBe(false);
      expect(res.isDefault).toBe(true);
    });
  });

  describe('createTemplate', () => {
    it('creates the template, its section, and one field assignment per field', async () => {
      const d = build();
      d.templatesRepo.createTemplate.mockReturnValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        tenantId: undefined,
        code: 'CARDIO_INTAKE',
        name: 'Ficha de cardiología',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
      });
      d.templatesRepo.createTemplateSection.mockReturnValue({ id: 'sec1' });
      d.templatesRepo.createTemplateField.mockReturnValue({
        id: 'field1',
        code: 'ejercicio_tolerancia',
        name: 'Tolerancia al ejercicio',
        valueSetId: undefined,
      });
      d.templatesRepo.createTemplateFieldAssignment.mockReturnValue({
        id: 'assign1',
        required: true,
        ordinal: 0,
      });

      const dto = {
        specialtyConceptId: 'sp1',
        code: 'CARDIO_INTAKE',
        name: 'Ficha de cardiología',
        fields: [
          {
            code: 'ejercicio_tolerancia',
            name: 'Tolerancia al ejercicio',
            dataType: 'string' as const,
            required: true,
          },
        ],
      };

      const res = await d.service.createTemplate(dto, actor);

      expect(d.templatesRepo.createTemplateField).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ stateConceptId: FORMS.FIELD_ACTIVE }),
      );
      expect(
        d.templatesRepo.createTemplateFieldAssignment,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          fieldId: 'field1',
          sectionId: 'sec1',
          targetResourceConceptId: CHART.TEMPLATE_FIELD_TARGET,
          stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
        }),
      );
      expect(res.id).toBe('tpl1');
      expect(res.fields).toHaveLength(1);
      expect(res.fields[0]).toMatchObject({
        assignmentId: 'assign1',
        fieldId: 'field1',
        code: 'ejercicio_tolerancia',
        required: true,
      });
    });
  });

  describe('listTemplates', () => {
    it('forwards the optional specialtyId filter and resolves each schema', async () => {
      const d = build();
      d.templatesRepo.findTemplates.mockResolvedValue([
        {
          id: 'tpl1',
          specialtyConceptId: 'sp1',
          code: 'C1',
          name: 'N1',
          version: 1,
          statusConceptId: CHART.TEMPLATE_ACTIVE,
          sectionId: undefined,
        },
      ]);

      const res = await d.service.listTemplates('sp1', 't1');

      expect(d.templatesRepo.findTemplates).toHaveBeenCalledWith(
        d.em,
        'sp1',
        't1',
      );
      expect(res).toHaveLength(1);
      expect(res[0].fields).toEqual([]);
    });
  });

  describe('getTemplate', () => {
    it('throws ResourceNotFoundException when the template does not exist', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(null);

      await expect(d.service.getTemplate('missing')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('hides the template of another tenant behind the same 404', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        tenantId: 'tenant-ajeno',
        sectionId: 'sec1',
      });

      // Saber el uuid no alcanza: la plantilla de otra organización responde
      // igual que una inexistente.
      await expect(
        d.service.getTemplate('tpl1', 'tenant-propio'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('serves the template owned by the actor tenant', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        tenantId: 'tenant-propio',
        code: 'C1',
        name: 'N1',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        sectionId: undefined,
      });

      const res = await d.service.getTemplate('tpl1', 'tenant-propio');
      expect(res.id).toBe('tpl1');
    });

    it('serves a global template even without a tenant in the context', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        tenantId: undefined,
        code: 'C1',
        name: 'N1',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        sectionId: undefined,
      });

      const res = await d.service.getTemplate('tpl1', undefined);
      expect(res.id).toBe('tpl1');
    });

    it('resolves the schema by joining assignments with their field definitions', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        code: 'C1',
        name: 'N1',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        sectionId: 'sec1',
      });
      d.templatesRepo.findFieldAssignmentsBySection.mockResolvedValue([
        { id: 'assign1', fieldId: 'field1', required: true, ordinal: 0 },
      ]);
      d.templatesRepo.findFieldDefinitionsByIds.mockResolvedValue([
        { id: 'field1', code: 'c1', name: 'n1', dataType: 'string' },
      ]);

      const res = await d.service.getTemplate('tpl1');

      expect(d.templatesRepo.findFieldDefinitionsByIds).toHaveBeenCalledWith(
        d.em,
        ['field1'],
      );
      expect(res.fields).toEqual([
        {
          assignmentId: 'assign1',
          fieldId: 'field1',
          code: 'c1',
          name: 'n1',
          dataType: 'string',
          valueSetId: undefined,
          required: true,
          ordinal: 0,
          own: false,
        },
      ]);
    });
    it('expone cardinalidad y ayuda del campo en un solo lote (CL-24)', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        code: 'C1',
        name: 'N1',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        sectionId: 'sec1',
      });
      d.templatesRepo.findFieldAssignmentsBySection.mockResolvedValue([
        { id: 'a1', fieldId: 'f1', required: false, ordinal: 0 },
        { id: 'a2', fieldId: 'f2', required: false, ordinal: 1 },
      ]);
      d.templatesRepo.findFieldDefinitionsByIds.mockResolvedValue([
        {
          id: 'f1',
          code: 'c1',
          name: 'n1',
          dataType: 'string',
          cardinalityMin: 0,
          cardinalityMax: 3,
        },
        { id: 'f2', code: 'c2', name: 'n2', dataType: 'string' },
      ]);
      d.templatesRepo.findLocalizationsByFieldIds.mockResolvedValue([
        { fieldId: 'f1', helpText: 'Hasta tres valores' },
      ]);

      const res = await d.service.getTemplate('tpl1');

      expect(d.templatesRepo.findLocalizationsByFieldIds).toHaveBeenCalledTimes(
        1,
      );
      expect(res.fields[0]).toMatchObject({
        cardinalityMin: 0,
        cardinalityMax: 3,
        helpText: 'Hasta tres valores',
      });
      expect(res.fields[1].helpText).toBeUndefined();
    });
    it('pide a la sección sólo lo global y lo del tenant de la sesión', async () => {
      // El campo que una organización agrega a la ficha de su especialidad es
      // suyo. Sin el tenant en la consulta, la sección es compartida y el campo
      // aparecería en la ficha de cualquier otra.
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl1',
        specialtyConceptId: 'sp1',
        code: 'C1',
        name: 'N1',
        version: 1,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        sectionId: 'sec1',
      });
      d.templatesRepo.findFieldAssignmentsBySection.mockResolvedValue([]);

      await runWithTenant('tenant-a', () => d.service.getTemplate('tpl1'));

      expect(
        d.templatesRepo.findFieldAssignmentsBySection,
      ).toHaveBeenCalledWith(d.em, 'sec1', 'tenant-a');
    });
  });
});
