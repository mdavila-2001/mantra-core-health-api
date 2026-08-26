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
  CODIGO_TRANSVERSAL,
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
  delModelo: ReadonlyMap<string, string> = new Map(),
) {
  const created: { entity: string; data: any }[] = [];
  const actualizados: { where: any; data: any }[] = [];

  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      // Los conceptos del value set se devuelven con su código: es por código
      // —no por uuid— que el seed arma el mapa de especialidades del modelo.
      const porId = new Map(
        [...delModelo].map(([code, id]) => [id, code] as const),
      );
      return Promise.resolve(
        ids
          .filter((id) => existing.has(id) || porId.has(id))
          .map((id) => ({ id, code: porId.get(id) })),
      );
    }),
    nativeUpdate: mockFn((_entity: any, where: any, data: any) => {
      actualizados.push({ where, data });
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
      Promise.resolve(delModelo.size > 0 ? { id: 'vs-especialidades' } : null),
    ),
    findIncludedConceptIdsByValueSet: mockFn(() =>
      Promise.resolve([...delModelo.values()]),
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
    actualizaciones: () => actualizados,
  };
}

/** Las especialidades distintas que declara el catálogo. */
const ESPECIALIDADES = new Set(
  STANDARD_FORMS.map((form) => form.specialty.code),
);

/**
 * Lo que publicaría `VS_MEDICAL_SPECIALTY`: todas las del catálogo menos
 * `TRANSVERSAL`, que no es una especialidad médica y no está en el value set.
 * Los uuid son de mentira a propósito — lo que importa es que NO coincidan con
 * los acuñados, que es exactamente el caso que la unificación resuelve.
 */
const ESPECIALIDADES_DEL_MODELO = new Map(
  [...ESPECIALIDADES]
    .filter((codigo) => codigo !== CODIGO_TRANSVERSAL)
    .map((codigo) => [codigo, `vs-${codigo.toLowerCase()}`] as const),
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

    expect(result.specialties).toBe(ESPECIALIDADES.size);
    const conceptos = rowsOf('CatalogConcepts');
    expect(conceptos).toHaveLength(ESPECIALIDADES.size);
    // El `code` almacenado es la clave, no el código humano: `catalog_concepts`
    // tiene UNIQUE(code_system_version_id, code) y el catálogo transversal ya
    // usa códigos genéricos.
    for (const concepto of conceptos) {
      expect(concepto.code).toMatch(/^clinical-forms:specialty:/);
      expect(concepto.display).not.toBe('');
    }
  });

  it('cuelga cada plantilla de la especialidad que declara su archivo', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const plantillas = new Map(
      rowsOf('SpecialtyChartTemplates').map((row) => [row.code, row]),
    );
    for (const form of STANDARD_FORMS) {
      expect(plantillas.get(form.code)?.specialtyConceptId).toBe(
        deterministicId(`clinical-forms:specialty:${form.specialty.code}`),
      );
      // Sin tenant: el catálogo es global y toda organización lo ve.
      expect(plantillas.get(form.code)?.tenantId).toBeUndefined();
    }
  });

  it('guarda la procedencia en la clave reservada del esquema', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const reservados = rowsOf('DynamicFieldDefinitions').filter((row) =>
      row.code.endsWith(`.${CHART_TEMPLATE_PROVENANCE_FIELD_CODE}`),
    );
    expect(reservados).toHaveLength(STANDARD_FORMS.length);

    for (const campo of reservados) {
      const ficha = campo.defaultValueJson;
      expect(typeof ficha.organization).toBe('string');
      expect(ficha.organization).not.toBe('');
      expect(ficha.url).toMatch(/^https:\/\//);
      expect(ficha.license).not.toBe('');
      expect(ficha.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('prefija el código de cada campo con el de su plantilla', async () => {
    const { service, rowsOf } = build();

    await service.run();

    // `forms.dynamic_field_definitions` es una tabla global: quince formularios
    // con un `motivo_consulta` cada uno chocarían entre sí sin el prefijo.
    const codigos = rowsOf('DynamicFieldDefinitions').map((row) => row.code);
    expect(new Set(codigos).size).toBe(codigos.length);
    for (const form of STANDARD_FORMS) {
      for (const field of form.fields) {
        expect(codigos).toContain(`${form.code}.${field.code}`);
      }
    }
  });

  it('deja la clave reservada fuera del rango de los campos reales', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const asignaciones = rowsOf('FieldAssignments');
    const reservadas = asignaciones.filter(
      (row) => row.fieldId.length > 0 && row.ordinal === -1,
    );
    expect(reservadas).toHaveLength(STANDARD_FORMS.length);
    expect(asignaciones.every((row) => row.ordinal >= -1)).toBe(true);
  });

  it('flushea la sección antes de crear la plantilla que la referencia', async () => {
    const { service, bitacora } = build();

    await service.run();

    // `specialty_chart_templates.section_id` es una columna `uuid` plana con FK,
    // no una relación del ORM: MikroORM no ordena los inserts por ella. Sin el
    // flush intermedio la plantilla entra antes que su sección y la base rechaza
    // el lote entero — el seed queda «omitido» y el catálogo, vacío. Pasó de
    // verdad al correrlo contra postgres; esta prueba es la que lo fija.
    const log = bitacora();
    const seccion = log.indexOf('DynamicFieldSections');
    const plantilla = log.indexOf('SpecialtyChartTemplates');

    expect(seccion).toBeGreaterThanOrEqual(0);
    expect(plantilla).toBeGreaterThan(seccion);
    expect(log.slice(seccion, plantilla)).toContain('<flush>');
  });

  it('corrido dos veces no duplica nada', async () => {
    const primera = build();
    await primera.service.run();

    // Segunda corrida: la base ya tiene todo lo que la primera creó.
    const yaEstan = new Set<string>([
      ...primera.rowsOf('CatalogConcepts').map((row) => row.id),
      ...primera.rowsOf('SpecialtyChartTemplates').map((row) => row.id),
      ...primera.rowsOf('DynamicFieldSections').map((row) => row.id),
      ...primera.rowsOf('DynamicFieldDefinitions').map((row) => row.id),
      ...primera.rowsOf('FieldAssignments').map((row) => row.id),
    ]);
    const segunda = build(yaEstan);

    const result = await segunda.service.run();

    expect(result.templates).toBe(0);
    expect(result.specialties).toBe(0);
    expect(segunda.rowsOf('SpecialtyChartTemplates')).toHaveLength(0);
    expect(segunda.rowsOf('DynamicFieldDefinitions')).toHaveLength(0);
  });

  it('no pisa una plantilla que la organización ya editó', async () => {
    const editada = STANDARD_FORMS[0];
    const templateId = deterministicId(
      `clinical-forms:template:${editada.code}`,
    );
    const { service, rowsOf } = build(new Set([templateId]));

    const result = await service.run();

    // La plantilla editada se saltea entera: ni su nombre ni sus campos se
    // vuelven a escribir. El resto del catálogo sí entra.
    expect(result.templates).toBe(STANDARD_FORMS.length - 1);
    const codigos = rowsOf('SpecialtyChartTemplates').map((row) => row.code);
    expect(codigos).not.toContain(editada.code);
    const camposDeLaEditada = rowsOf('DynamicFieldDefinitions').filter((row) =>
      row.code.startsWith(`${editada.code}.`),
    );
    expect(camposDeLaEditada).toHaveLength(0);
  });
});

describe('catálogo de formularios estándar', () => {
  it('no repite códigos de plantilla', () => {
    const codigos = STANDARD_FORMS.map((form) => form.code);
    expect(new Set(codigos).size).toBe(codigos.length);
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
      const codigos = form.fields.map((field) => field.code);
      expect(new Set(codigos).size).toBe(codigos.length);
    }
  });

  it('cubre los cuatro transversales y las especialidades del reclamo', () => {
    expect(ESPECIALIDADES).toContain(CODIGO_TRANSVERSAL);
    for (const especialidad of [
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
      expect(ESPECIALIDADES).toContain(especialidad);
    }
  });

  it('ningún formulario usa la clave reservada como campo propio', () => {
    for (const form of STANDARD_FORMS) {
      const codigos = form.fields.map((field) => field.code);
      expect(codigos).not.toContain(CHART_TEMPLATE_PROVENANCE_FIELD_CODE);
    }
  });

  /* ---- el vocabulario de especialidades ----------------------------------- */

  it('cuelga las plantillas de los conceptos del modelo cuando el value set está', async () => {
    const { service, rowsOf } = build(new Set(), ESPECIALIDADES_DEL_MODELO);

    await service.run();

    const odonto = rowsOf('SpecialtyChartTemplates').find(
      (fila: any) => fila.code === 'ODONTO_ODONTOGRAMA_OMS',
    );
    expect(odonto.specialtyConceptId).toBe(
      ESPECIALIDADES_DEL_MODELO.get('ODONTOLOGIA'),
    );
    // Y no acuña las que el modelo ya declara.
    const acunados = rowsOf('CatalogConcepts').map((fila: any) => fila.code);
    expect(acunados).not.toContain('clinical-forms:specialty:ODONTOLOGIA');
  });

  it('sin value set del modelo, sigue acuñando sus propios conceptos', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const odonto = rowsOf('SpecialtyChartTemplates').find(
      (fila: any) => fila.code === 'ODONTO_ODONTOGRAMA_OMS',
    );
    expect(odonto.specialtyConceptId).toBe(
      deterministicId('clinical-forms:specialty:ODONTOLOGIA'),
    );
    const acunados = rowsOf('CatalogConcepts').map((fila: any) => fila.code);
    expect(acunados).toContain('clinical-forms:specialty:ODONTOLOGIA');
  });

  it('TRANSVERSAL se acuña siempre: no es una especialidad médica', async () => {
    const { service, rowsOf } = build(new Set(), ESPECIALIDADES_DEL_MODELO);

    await service.run();

    const acunados = rowsOf('CatalogConcepts').map((fila: any) => fila.code);
    expect(acunados).toContain('clinical-forms:specialty:TRANSVERSAL');
  });

  it('re-apunta al modelo las plantillas colgadas de un concepto acuñado', async () => {
    const { service, actualizaciones } = build(
      new Set(),
      ESPECIALIDADES_DEL_MODELO,
    );

    await service.run();

    const reparacion = actualizaciones().find(
      (fila) =>
        fila.where?.specialtyConceptId ===
        deterministicId('clinical-forms:specialty:ODONTOLOGIA'),
    );
    expect(reparacion).toBeDefined();
    expect(reparacion!.data.specialtyConceptId).toBe(
      ESPECIALIDADES_DEL_MODELO.get('ODONTOLOGIA'),
    );
  });

  it('sin value set no intenta reparar nada', async () => {
    const { service, actualizaciones } = build();

    await service.run();

    const reparaciones = actualizaciones().filter(
      (fila) => fila.data?.specialtyConceptId !== undefined,
    );
    expect(reparaciones).toHaveLength(0);
  });

  /* ---- el odontograma del formulario OMS ----------------------------------- */

  it('el formulario OMS declara el odontograma como json y ya no exige la prosa', () => {
    const oms = STANDARD_FORMS.find(
      (form) => form.code === 'ODONTO_ODONTOGRAMA_OMS',
    )!;
    expect(oms.version).toBeGreaterThanOrEqual(2);

    const odontograma = oms.fields.find(
      (field) => field.code === 'odontograma_fdi',
    )!;
    expect(odontograma.dataType).toBe('json');

    const prosa = oms.fields.find(
      (field) => field.code === 'estado_por_pieza',
    )!;
    expect(prosa.required).toBe(false);
  });
});
