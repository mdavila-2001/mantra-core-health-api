import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  ClinicalFormsSeedService,
  CODE_TRANSVERSAL,
} from './clinical-forms-seed.service';
import { STANDARD_FORMS } from './data/clinical-forms/catalog';
import { CHART_TEMPLATE_PROVENANCE_FIELD_CODE } from '../../modules/chart/dto';
import { deterministicId } from '../constants/concepts';

/**
 * Construye el seed con un contexto de persistencia controlado.
 *
 * @param existing - Identificadores que la base ya tiene.
 * @returns Servicio y las filas que intentó crear, por entidad.
 */
function build(
  existing: Set<string> = new Set(),
  /**
   * Las especialidades que el value set del modelo publica, por código. Vacío
   * simula la base pelada: sin `VS_MEDICAL_SPECIALTY`, el seed acuña los suyos.
   */
  ofModel: ReadonlyMap<string, string> = new Map(),
) {
  const created: { entity: string; data: any }[] = [];
  const updated: { where: any; data: any }[] = [];

  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      // Los conceptos del value set se devuelven con su código: es por código
      // —no por uuid— que el seed arma el mapa de especialidades del modelo.
      const byId = new Map(
        [...ofModel].map(([code, id]) => [id, code] as const),
      );
      return Promise.resolve(
        ids
          .filter((id) => existing.has(id) || byId.has(id))
          .map((id) => ({ id, code: byId.get(id) })),
      );
    }),
    nativeUpdate: mockFn((_entity: any, where: any, data: any) => {
      updated.push({ where, data });
      return Promise.resolve(1);
    }),
    findOne: mockFn((_entity: any, where: any) =>
      Promise.resolve(existing.has(where?.id) ? { id: where.id } : null),
    ),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    // El flush se anota en la misma bitácora que los `create` para poder afirmar
    // el ORDEN entre ambos, que es una regla de este seed y no un detalle.
    flush: mockFn(() => {
      created.push({ entity: '<flush>', data: null });
      return Promise.resolve();
    }),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  // El value set existe sólo si el caso declaró especialidades del modelo.
  const valueSets = {
    findByInternalCode: mockFn(() =>
      Promise.resolve(ofModel.size > 0 ? { id: 'vs-especialidades' } : null),
    ),
    findIncludedConceptIdsByValueSet: mockFn(() =>
      Promise.resolve([...ofModel.values()]),
    ),
  };

  return {
    service: new ClinicalFormsSeedService(
      orm as any,
      logger as any,
      valueSets as any,
    ),
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    /** La bitácora completa de `create`/`flush`, en orden. */
    bitacora: () => created.map((row) => row.entity),
    /** Los `nativeUpdate` que corrió, en orden. */
    actualizaciones: () => updated,
  };
}

/** Las especialidades distintas que declara el catálogo. */
const SPECIALTIES = new Set(STANDARD_FORMS.map((form) => form.specialty.code));

/**
 * Lo que publicaría `VS_MEDICAL_SPECIALTY`: todas las del catálogo menos
 * `TRANSVERSAL`, que no es una especialidad médica y no está en el value set.
 * Los uuid son de mentira a propósito — lo que importa es que NO coincidan con
 * los acuñados, que es exactamente el caso que la unificación resuelve.
 */
const MODEL_SPECIALTIES = new Map(
  [...SPECIALTIES]
    .filter((code) => code !== CODE_TRANSVERSAL)
    .map((code) => [code, `vs-${code.toLowerCase()}`] as const),
);

describe('ClinicalFormsSeedService', () => {
  it('siembra una plantilla por cada formulario del catálogo', async () => {
    const { service, rowsOf } = build();

    const result = await service.run();

    expect(result.templates).toBe(STANDARD_FORMS.length);
    expect(rowsOf('SpecialtyChartTemplates')).toHaveLength(
      STANDARD_FORMS.length,
    );
    expect(rowsOf('DynamicFieldSections')).toHaveLength(STANDARD_FORMS.length);
  });

  it('siembra las especialidades que faltan como conceptos de terminología', async () => {
    const { service, rowsOf } = build();

    const result = await service.run();

    expect(result.specialties).toBe(SPECIALTIES.size);
    const concepts = rowsOf('CatalogConcepts');
    expect(concepts).toHaveLength(SPECIALTIES.size);
    // El `code` almacenado es la clave, no el código humano: `catalog_concepts`
    // tiene UNIQUE(code_system_version_id, code) y el catálogo transversal ya
    // usa códigos genéricos.
    for (const concept of concepts) {
      expect(concept.code).toMatch(/^clinical-forms:specialty:/);
      expect(concept.display).not.toBe('');
    }
  });

  it('cuelga cada plantilla de la especialidad que declara su archivo', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const templates = new Map(
      rowsOf('SpecialtyChartTemplates').map((row) => [row.code, row]),
    );
    for (const form of STANDARD_FORMS) {
      expect(templates.get(form.code)?.specialtyConceptId).toBe(
        deterministicId(`clinical-forms:specialty:${form.specialty.code}`),
      );
      // Sin tenant: el catálogo es global y toda organización lo ve.
      expect(templates.get(form.code)?.tenantId).toBeUndefined();
    }
  });

  it('guarda la procedencia en la clave reservada del esquema', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const reserved = rowsOf('DynamicFieldDefinitions').filter((row) =>
      row.code.endsWith(`.${CHART_TEMPLATE_PROVENANCE_FIELD_CODE}`),
    );
    expect(reserved).toHaveLength(STANDARD_FORMS.length);

    for (const field of reserved) {
      const record = field.defaultValueJson;
      expect(typeof record.organization).toBe('string');
      expect(record.organization).not.toBe('');
      expect(record.url).toMatch(/^https:\/\//);
      expect(record.license).not.toBe('');
      expect(record.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('prefija el código de cada campo con el de su plantilla', async () => {
    const { service, rowsOf } = build();

    await service.run();

    // `forms.dynamic_field_definitions` es una tabla global: quince formularios
    // con un `motivo_consulta` cada uno chocarían entre sí sin el prefijo.
    const codes = rowsOf('DynamicFieldDefinitions').map((row) => row.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const form of STANDARD_FORMS) {
      for (const field of form.fields) {
        expect(codes).toContain(`${form.code}.${field.code}`);
      }
    }
  });

  it('deja la clave reservada fuera del rango de los campos reales', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const assignments = rowsOf('FieldAssignments');
    const reserved = assignments.filter(
      (row) => row.fieldId.length > 0 && row.ordinal === -1,
    );
    expect(reserved).toHaveLength(STANDARD_FORMS.length);
    expect(assignments.every((row) => row.ordinal >= -1)).toBe(true);
  });

  it('flushea la sección antes de crear la plantilla que la referencia', async () => {
    const { service, bitacora: createdEntities } = build();

    await service.run();

    // `specialty_chart_templates.section_id` es una columna `uuid` plana con FK,
    // no una relación del ORM: MikroORM no ordena los inserts por ella. Sin el
    // flush intermedio la plantilla entra antes que su sección y la base rechaza
    // el lote entero — el seed queda «omitido» y el catálogo, vacío. Pasó de
    // verdad al correrlo contra postgres; esta prueba es la que lo fija.
    const log = createdEntities();
    const section = log.indexOf('DynamicFieldSections');
    const template = log.indexOf('SpecialtyChartTemplates');

    expect(section).toBeGreaterThanOrEqual(0);
    expect(template).toBeGreaterThan(section);
    expect(log.slice(section, template)).toContain('<flush>');
  });

  it('corrido dos veces no duplica nada', async () => {
    const first = build();
    await first.service.run();

    // Segunda corrida: la base ya tiene todo lo que la primera creó.
    const alreadyPresent = new Set<string>([
      ...first.rowsOf('CatalogConcepts').map((row) => row.id),
      ...first.rowsOf('SpecialtyChartTemplates').map((row) => row.id),
      ...first.rowsOf('DynamicFieldSections').map((row) => row.id),
      ...first.rowsOf('DynamicFieldDefinitions').map((row) => row.id),
      ...first.rowsOf('FieldAssignments').map((row) => row.id),
    ]);
    const second = build(alreadyPresent);

    const result = await second.service.run();

    expect(result.templates).toBe(0);
    expect(result.specialties).toBe(0);
    expect(second.rowsOf('SpecialtyChartTemplates')).toHaveLength(0);
    expect(second.rowsOf('DynamicFieldDefinitions')).toHaveLength(0);
  });

  it('no pisa una plantilla que la organización ya editó', async () => {
    const edited = STANDARD_FORMS[0];
    const templateId = deterministicId(
      `clinical-forms:template:${edited.code}`,
    );
    const { service, rowsOf } = build(new Set([templateId]));

    const result = await service.run();

    // La plantilla editada se saltea entera: ni su nombre ni sus campos se
    // vuelven a escribir. El resto del catálogo sí entra.
    expect(result.templates).toBe(STANDARD_FORMS.length - 1);
    const codes = rowsOf('SpecialtyChartTemplates').map((row) => row.code);
    expect(codes).not.toContain(edited.code);
    const editedFields = rowsOf('DynamicFieldDefinitions').filter((row) =>
      row.code.startsWith(`${edited.code}.`),
    );
    expect(editedFields).toHaveLength(0);
  });
});

describe('ClinicalFormsSeedService — v2 del catálogo', () => {
  it('guarda en la clave reservada la presentación de cada campo: lista, sección y condición', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const medgen = rowsOf('DynamicFieldDefinitions').find(
      (row) =>
        row.code ===
        `MEDGEN_CONSULTA_BASE.${CHART_TEMPLATE_PROVENANCE_FIELD_CODE}`,
    );
    const presentation = medgen.defaultValueJson.fieldPresentation;
    expect(presentation.tipo_de_alergia).toMatchObject({
      multiple: true,
      showWhen: { field: 'tiene_alergias', equals: true },
    });
    expect(presentation.diagnostico_presuntivo.options).toContain(
      'Dengue o síndrome febril agudo',
    );
    // La procedencia sigue entera al lado.
    expect(medgen.defaultValueJson.organization).not.toBe('');
  });

  it('al subir de versión actualiza la ficha de catálogo y retira lo que ya no se pregunta', async () => {
    const form = STANDARD_FORMS.find((f) => f.code === 'MEDGEN_CONSULTA_BASE')!;
    const templateId = deterministicId(`clinical-forms:template:${form.code}`);
    const { service, actualizaciones: updates } = build();
    // La plantilla ya sembrada, en la v1.
    const em = (service as any).orm.em.fork();
    em.findOne.mockImplementation((_entity: any, where: any) =>
      Promise.resolve(
        where?.id === templateId
          ? { id: templateId, version: 1, sectionId: 'sec-medgen' }
          : null,
      ),
    );

    await service.run();

    const catalog = updates().find(
      (u) =>
        u.where.id ===
        deterministicId(
          `clinical-forms:field:${form.code}.${CHART_TEMPLATE_PROVENANCE_FIELD_CODE}`,
        ),
    );
    expect(catalog?.data.defaultValueJson.fieldPresentation).toBeDefined();

    const withdrawal = updates().find((u) => u.where.fieldId?.$nin);
    expect(withdrawal?.where).toMatchObject({
      sectionId: 'sec-medgen',
      tenantId: null,
    });
    expect(withdrawal?.data).toMatchObject({ visible: false });
    // Lo vigente no se retira: la condición excluye a cada campo de la v2.
    expect(withdrawal?.where.fieldId.$nin).toContain(
      deterministicId(
        `clinical-forms:field:${form.code}.diagnostico_presuntivo`,
      ),
    );
  });
});

describe('catálogo de formularios estándar', () => {
  it('no repite códigos de plantilla', () => {
    const codes = STANDARD_FORMS.map((form) => form.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('exige ficha de procedencia completa en cada formulario', () => {
    for (const form of STANDARD_FORMS) {
      expect(form.provenance.sourceTitle).not.toBe('');
      expect(form.provenance.organization).not.toBe('');
      expect(form.provenance.url).toMatch(/^https:\/\//);
      expect(form.provenance.license).not.toBe('');
      expect(form.provenance.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('declara al menos un campo por formulario, sin códigos repetidos', () => {
    for (const form of STANDARD_FORMS) {
      expect(form.fields.length).toBeGreaterThan(0);
      const codes = form.fields.map((field) => field.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it('cubre los cuatro transversales y las especialidades del reclamo', () => {
    expect(SPECIALTIES).toContain(CODE_TRANSVERSAL);
    for (const specialty of [
      'CARDIOLOGIA',
      'PEDIATRIA',
      'GINECOLOGIA_OBSTETRICIA',
      'TRAUMATOLOGIA',
      'OFTALMOLOGIA',
      'ODONTOLOGIA',
      'PSIQUIATRIA',
      'DERMATOLOGIA',
      'MEDICINA_INTERNA',
    ]) {
      expect(SPECIALTIES).toContain(specialty);
    }
  });

  it('ningún formulario usa la clave reservada como campo propio', () => {
    for (const form of STANDARD_FORMS) {
      const codes = form.fields.map((field) => field.code);
      expect(codes).not.toContain(CHART_TEMPLATE_PROVENANCE_FIELD_CODE);
    }
  });

  /* ---- el vocabulario de especialidades ----------------------------------- */

  it('cuelga las plantillas de los conceptos del modelo cuando el value set está', async () => {
    const { service, rowsOf } = build(new Set(), MODEL_SPECIALTIES);

    await service.run();

    const odonto = rowsOf('SpecialtyChartTemplates').find(
      (row: any) => row.code === 'ODONTO_ODONTOGRAMA_OMS',
    );
    expect(odonto.specialtyConceptId).toBe(
      MODEL_SPECIALTIES.get('ODONTOLOGIA'),
    );
    // Y no acuña las que el modelo ya declara.
    const minted = rowsOf('CatalogConcepts').map((row: any) => row.code);
    expect(minted).not.toContain('clinical-forms:specialty:ODONTOLOGIA');
  });

  it('sin value set del modelo, sigue acuñando sus propios conceptos', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const odonto = rowsOf('SpecialtyChartTemplates').find(
      (row: any) => row.code === 'ODONTO_ODONTOGRAMA_OMS',
    );
    expect(odonto.specialtyConceptId).toBe(
      deterministicId('clinical-forms:specialty:ODONTOLOGIA'),
    );
    const minted = rowsOf('CatalogConcepts').map((row: any) => row.code);
    expect(minted).toContain('clinical-forms:specialty:ODONTOLOGIA');
  });

  it('TRANSVERSAL se acuña siempre: no es una especialidad médica', async () => {
    const { service, rowsOf } = build(new Set(), MODEL_SPECIALTIES);

    await service.run();

    const minted = rowsOf('CatalogConcepts').map((row: any) => row.code);
    expect(minted).toContain('clinical-forms:specialty:TRANSVERSAL');
  });

  it('re-apunta al modelo las plantillas colgadas de un concepto acuñado', async () => {
    const { service, actualizaciones: updates } = build(new Set(), MODEL_SPECIALTIES);

    await service.run();

    const repair = updates().find(
      (row) =>
        row.where?.specialtyConceptId ===
        deterministicId('clinical-forms:specialty:ODONTOLOGIA'),
    );
    expect(repair).toBeDefined();
    expect(repair!.data.specialtyConceptId).toBe(
      MODEL_SPECIALTIES.get('ODONTOLOGIA'),
    );
  });

  it('sin value set no intenta reparar nada', async () => {
    const { service, actualizaciones: updates } = build();

    await service.run();

    const repairs = updates().filter(
      (row) => row.data?.specialtyConceptId !== undefined,
    );
    expect(repairs).toHaveLength(0);
  });

  /* ---- el catálogo de especialidades, cuando el modelo no lo trajo -------- */

  it('sin value set del modelo publica VS_MEDICAL_SPECIALTY con los conceptos acuñados', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const sets = rowsOf('ValueSets');
    expect(sets).toHaveLength(1);
    expect(sets[0].internalCode).toBe('VS_MEDICAL_SPECIALTY');

    const versions = rowsOf('ValueSetVersions');
    expect(versions).toHaveLength(1);
    // Sin `isDefault` no hay versión vigente que expandir, y el catálogo
    // seguiría contando como ausente aunque el conjunto exista.
    expect(versions[0].isDefault).toBe(true);
    expect(versions[0].valueSetId).toBe(sets[0].id);

    const members = rowsOf('ValueSetMembers');
    expect(members.length).toBeGreaterThan(0);
    expect(members.every((row: any) => row.included === true)).toBe(true);
    expect(
      members.every((row: any) => row.valueSetVersionId === versions[0].id),
    ).toBe(true);
    // Los mismos conceptos que este seed acuña, no unos nuevos.
    expect(members.map((row: any) => row.conceptId)).toContain(
      deterministicId('clinical-forms:specialty:CARDIOLOGIA'),
    );
  });

  it('lo transversal no entra al catálogo: no es una especialidad médica', async () => {
    const { service, rowsOf } = build();

    await service.run();

    expect(
      rowsOf('ValueSetMembers').map((row: any) => row.conceptId),
    ).not.toContain(
      deterministicId(`clinical-forms:specialty:${CODE_TRANSVERSAL}`),
    );
  });

  it('con el value set del modelo presente no escribe una sola fila de catálogo', async () => {
    const { service, rowsOf } = build(new Set(), MODEL_SPECIALTIES);

    await service.run();

    expect(rowsOf('ValueSets')).toHaveLength(0);
    expect(rowsOf('ValueSetVersions')).toHaveLength(0);
    expect(rowsOf('ValueSetMembers')).toHaveLength(0);
  });

  /* ---- el odontograma del formulario OMS ----------------------------------- */

  it('el formulario OMS declara el odontograma como json y ya no exige la prosa', () => {
    const oms = STANDARD_FORMS.find(
      (form) => form.code === 'ODONTO_ODONTOGRAMA_OMS',
    )!;
    expect(oms.version).toBeGreaterThanOrEqual(2);

    const odontogram = oms.fields.find(
      (field) => field.code === 'odontograma_fdi',
    )!;
    expect(odontogram.dataType).toBe('json');

    const prose = oms.fields.find(
      (field) => field.code === 'estado_por_pieza',
    )!;
    expect(prose.required).toBe(false);
  });
});
