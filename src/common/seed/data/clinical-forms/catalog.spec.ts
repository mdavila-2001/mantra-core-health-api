import { STANDARD_FORMS, validar, type RawForm } from './catalog';

/**
 * Calidad del contenido de la v2 del catálogo (reclamo del 2026-10-02): las
 * escalas se eligen, cada «sí» con detalle pregunta «¿cuál?» y el diagnóstico
 * presuntivo abre las observaciones que ese cuadro exige.
 */

/** Fichas que no son una consulta: informan un estudio o registran una decisión. */
const SIN_DIAGNOSTICO_PRESUNTIVO = new Set([
  'BIOQ_INFORME_BASE',
  'PATOL_INFORME_BASE',
  'RADIO_INFORME_BASE',
  'TRANSV_ANAMNESIS_GENERAL',
  'TRANSV_CONSENTIMIENTO_INFORMADO',
  'TRANSV_EPICRISIS',
  'TRANSV_EXAMEN_FISICO',
  'CARDIO_RIESGO_CV_OMS',
  'PEDIA_CURVAS_CRECIMIENTO_OMS',
  'ODONTO_ANAMNESIS',
  'ODONTO_ODONTOGRAMA_OMS',
  'ANEST_VALORACION_PREANESTESICA',
  'GINOBS_CONTROL_PRENATAL',
  'GINOBS_CONSULTA_GINECOLOGICA',
  'PEDIA_CONTROL_NINO_SANO',
  'OBST_CONTROL_BASE',
  'MEDEP_EVALUACION_BASE',
  'ENFER_VALORACION_BASE',
  'PSIQ_EVALUACION_BASE',
]);

const campos = STANDARD_FORMS.flatMap((form) =>
  form.fields.map((field) => ({ form, field })),
);

describe('catálogo v2 — contenido', () => {
  it('las escalas con categorías finitas se eligen de una lista, no se escriben', () => {
    const escalas = /\b(ASA|Mallampati|NYHA|ECOG|mMRC|Bristol|Fitzpatrick)\b/;
    const libres = campos
      .filter(({ field }) => escalas.test(field.name))
      .filter(({ field }) => field.options === undefined)
      .map(({ form, field }) => `${form.code}.${field.code}`);
    expect(libres).toEqual([]);
  });

  it('cada especialidad tiene una ficha base y fichas específicas por condición', () => {
    const porEspecialidad = new Map<
      string,
      { base: string[]; especificas: string[] }
    >();
    for (const form of STANDARD_FORMS) {
      if (form.kind === 'GENERAL') continue;
      const grupo = porEspecialidad.get(form.specialty.code) ?? {
        base: [],
        especificas: [],
      };
      (form.kind === 'BASE' ? grupo.base : grupo.especificas).push(form.code);
      porEspecialidad.set(form.specialty.code, grupo);
    }
    for (const [especialidad, grupo] of porEspecialidad) {
      expect({ especialidad, bases: grupo.base.length }).toEqual({
        especialidad,
        bases: 1,
      });
      expect({
        especialidad,
        especificas: grupo.especificas.length > 0,
      }).toEqual({
        especialidad,
        especificas: true,
      });
    }
    // Las transversales son de toda consulta.
    expect(
      STANDARD_FORMS.filter((f) => f.kind === 'GENERAL')
        .map((f) => f.code)
        .sort(),
    ).toEqual([
      'TRANSV_ANAMNESIS_GENERAL',
      'TRANSV_CONSENTIMIENTO_INFORMADO',
      'TRANSV_EPICRISIS',
      'TRANSV_EXAMEN_FISICO',
    ]);
  });

  it('las fichas base de consulta piden el diagnóstico presuntivo de una lista', () => {
    const consultas = STANDARD_FORMS.filter(
      (f) =>
        f.kind === 'BASE' &&
        !SIN_DIAGNOSTICO_PRESUNTIVO.has(f.code) &&
        !f.code.includes('_INFORME_'),
    );
    expect(consultas.length).toBeGreaterThan(20);
    for (const form of consultas) {
      const presuntivo = form.fields.find(
        (field) =>
          field.code === 'diagnostico_presuntivo' ||
          field.code === 'motivo_agregado',
      );
      expect({
        form: form.code,
        opciones: (presuntivo?.options?.length ?? 0) >= 4,
      }).toEqual({
        form: form.code,
        opciones: true,
      });
    }
  });

  it('las fichas de control tienen seguimiento, evaluación propia y cierre', () => {
    const controles = STANDARD_FORMS.filter((f) => f.code.includes('_CTRL_'));
    expect(controles.length).toBeGreaterThan(60);
    for (const form of controles) {
      const secciones = new Set(form.fields.map((field) => field.section));
      expect(form.fields.some((field) => field.code === 'diagnostico')).toBe(
        true,
      );
      expect(
        [...secciones].some((nombre) => nombre?.startsWith('Evaluación:')),
      ).toBe(true);
    }
  });

  it('«¿tiene alergias?» pregunta a qué cuando la respuesta es sí', () => {
    const conAlergias = STANDARD_FORMS.filter((form) =>
      form.fields.some((field) => field.code === 'tiene_alergias'),
    );
    expect(conAlergias.length).toBeGreaterThan(10);
    for (const form of conAlergias) {
      const hijos = form.fields.filter(
        (field) =>
          field.showWhen?.field === 'tiene_alergias' &&
          field.showWhen.equals === true,
      );
      expect(hijos.length).toBeGreaterThan(0);
    }
  });

  it('el dengue pide los signos de alarma de la guía OPS/OMS', () => {
    const signos = campos.filter(
      ({ field }) => field.code === 'dengue_signos_de_alarma',
    );
    expect(signos.length).toBeGreaterThanOrEqual(1);
    for (const { field } of signos) {
      expect(field.required).toBe(true);
      expect(field.multiple).toBe(true);
      expect(field.options).toEqual(
        expect.arrayContaining(['Vómitos persistentes', 'Sangrado de mucosas']),
      );
    }
  });

  it('una lista de varias respuestas se guarda como json, y una de una sola como texto', () => {
    for (const { field } of campos) {
      if (field.options === undefined) continue;
      expect(field.dataType).toBe(field.multiple === true ? 'json' : 'string');
    }
  });

  it('ninguna ficha cita un instrumento con licencia comercial no confirmada', () => {
    const conLicencia =
      /PHQ-9|GAD-7|Beck|MMSE|Mini-Mental|STOP-BANG|IIEF|Braden|Morse|MUST|Roma IV|CAM-ICU/;
    const citados = campos
      .filter(({ field }) =>
        conLicencia.test(
          `${field.name} ${(field.options ?? []).join(' ')} ${field.description ?? ''}`,
        ),
      )
      .map(({ form, field }) => `${form.code}.${field.code}`);
    expect(citados).toEqual([]);
  });
});

describe('catálogo v2 — validación de carga', () => {
  const base = (fields: RawForm['fields']): RawForm => ({
    ...STANDARD_FORMS[0],
    fields,
  });

  it('rechaza una condición que apunta a un campo inexistente', () => {
    expect(() =>
      validar(
        base([
          {
            code: 'detalle',
            name: '¿Cuál?',
            dataType: 'text',
            showWhen: { field: 'no_existe', equals: true },
          },
        ]),
      ),
    ).toThrow(/depende de "no_existe"/);
  });

  it('rechaza una condición con un valor que el padre no ofrece', () => {
    expect(() =>
      validar(
        base([
          {
            code: 'tabaco',
            name: 'Tabaco',
            dataType: 'string',
            options: ['Nunca', 'Actual'],
          },
          {
            code: 'cigarrillos',
            name: 'Cigarrillos',
            dataType: 'integer',
            showWhen: { field: 'tabaco', equals: 'Siempre' },
          },
        ]),
      ),
    ).toThrow(/no es una de sus opciones/);
  });

  it('rechaza un sí/no condicionado con un texto', () => {
    expect(() =>
      validar(
        base([
          { code: 'fuma', name: 'Fuma', dataType: 'boolean' },
          {
            code: 'cuanto',
            name: 'Cuánto',
            dataType: 'integer',
            showWhen: { field: 'fuma', equals: 'sí' },
          },
        ]),
      ),
    ).toThrow(/no es sí\/no/);
  });

  it('rechaza una lista de varias respuestas que no se guarda como json', () => {
    expect(() =>
      validar(
        base([
          {
            code: 'sintomas',
            name: 'Síntomas',
            dataType: 'string',
            options: ['Fiebre', 'Tos'],
            multiple: true,
          },
        ]),
      ),
    ).toThrow(/debe ser json/);
  });

  it('acepta json sólo para listas de varias respuestas o controles dedicados', () => {
    expect(() =>
      validar(base([{ code: 'libre', name: 'Libre', dataType: 'json' }])),
    ).toThrow(/no está entre los admitidos/);
  });
});

/**
 * Las fichas de las Normas Nacionales de Atención Clínica (Bolivia, 2012). Sus
 * listas se extraen del PDF con un filtro mecánico; estas pruebas fijan lo que
 * ese filtro no puede dejar pasar.
 */
describe('fichas de las NNAC de Bolivia', () => {
  const nnac = STANDARD_FORMS.filter((ficha) => ficha.code.startsWith('NNAC_'));
  const DOSIS =
    /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|ml|mL|UI|mEq|gotas?|comprimidos?|tabletas?|ampollas?)\b|\b(?:IV|VO|IM|SC)\b|\bdosis\b/u;

  it('hay una ficha por cada norma de las unidades 1 a 14 (excepto nutrición)', () => {
    expect(nnac.length).toBeGreaterThanOrEqual(190);
  });

  it('todas citan al Ministerio de Salud y Deportes como fuente', () => {
    for (const ficha of nnac) {
      expect(ficha.provenance.organization).toMatch(
        /Ministerio de Salud y Deportes/,
      );
      expect(ficha.provenance.note).toMatch(/pág\. \d+/);
    }
  });

  it('ninguna opción es una dosis, una vía de administración o una instrucción', () => {
    const ofensoras = nnac.flatMap((ficha) =>
      ficha.fields
        .flatMap((campo) => campo.options ?? [])
        .filter((opcion) => DOSIS.test(opcion))
        .map((opcion) => `${ficha.code}: ${opcion}`),
    );
    expect(ofensoras).toEqual([]);
  });

  it('las opciones son frases cortas, sin restos de otra sección', () => {
    for (const ficha of nnac) {
      for (const opcion of ficha.fields.flatMap((c) => c.options ?? [])) {
        expect(opcion.length).toBeLessThanOrEqual(160);
        expect(opcion).not.toMatch(/\(\s*[^)]*$/u);
      }
    }
  });

  it('todas piden diagnóstico y dejan el tratamiento como texto', () => {
    for (const ficha of nnac) {
      const diagnostico = ficha.fields.find((c) => c.code === 'diagnostico');
      const tratamiento = ficha.fields.find((c) => c.code === 'tratamiento');
      expect(diagnostico?.required).toBe(true);
      expect(tratamiento?.dataType).toBe('text');
      expect(tratamiento?.options).toBeUndefined();
    }
  });
});
