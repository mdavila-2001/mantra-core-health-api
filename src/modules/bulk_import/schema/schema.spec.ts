import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { BULK_IMPORT_LIMITS } from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import { parseSource, rowsFromJson } from '../parsing/source-parser';
import { TemplateService } from '../services/template.service';
import { codedPairs } from './clinical-kinds';
import {
  exampleRow,
  validateRowAgainstSchema,
  type KindSchema,
} from './field-schema';
import { ALL_KIND_SCHEMAS, findKindSchema } from './registry';

const templates = new TemplateService();
const ROOT = process.cwd();

describe('registro de tipos de carga', () => {
  it('declara los tres tipos de alta de usuarios y los siete de historia clínica', () => {
    expect(ALL_KIND_SCHEMAS.map((s) => s.kind)).toEqual([
      'usuario-paciente',
      'usuario-profesional',
      'usuario-personal-organizacion',
      'hc-encuentro',
      'hc-diagnostico',
      'hc-medicacion',
      'hc-alergia',
      'hc-signo-vital',
      'hc-resultado',
      'hc-nota',
    ]);
  });

  it('no repite nombres de tipo ni de columna dentro de un tipo', () => {
    expect(new Set(ALL_KIND_SCHEMAS.map((s) => s.kind)).size).toBe(
      ALL_KIND_SCHEMAS.length,
    );
    for (const schema of ALL_KIND_SCHEMAS) {
      const names = schema.fields.map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('cada columna cita un archivo existente del código (nada inventado)', () => {
    for (const schema of ALL_KIND_SCHEMAS) {
      for (const field of schema.fields) {
        const [file] = field.source.split('#');
        expect({
          kind: schema.kind,
          field: field.name,
          file,
          exists: existsSync(join(ROOT, file)),
        }).toEqual({
          kind: schema.kind,
          field: field.name,
          file,
          exists: true,
        });
      }
    }
  });

  it('las claves únicas apuntan a columnas obligatorias que existen', () => {
    for (const schema of ALL_KIND_SCHEMAS) {
      expect(schema.uniqueKeys.length).toBeGreaterThan(0);
      for (const key of schema.uniqueKeys) {
        for (const column of key) {
          const spec = schema.fields.find((f) => f.name === column);
          expect(spec?.required).toBe(true);
        }
      }
    }
  });

  it('ningún ejemplo trae un código clínico real: los pares usan el sistema y el prefijo sintéticos', () => {
    for (const schema of ALL_KIND_SCHEMAS.filter(
      (s) => s.group === 'CLINICAL',
    )) {
      for (const pair of codedPairs(schema)) {
        const row = exampleRow(schema);
        expect(row[pair.system]).toBe('sistema-demo');
        expect(row[pair.code]).toMatch(/^SINT-/);
      }
    }
  });

  it('las cargas de usuarios no admiten contraseña ni roles privilegiados', () => {
    for (const schema of ALL_KIND_SCHEMAS.filter((s) => s.group === 'USERS')) {
      const names = schema.fields.map((f) => f.name);
      expect(names).not.toContain('password');
      expect(names).not.toContain('clinicalRoles');
      expect(names).not.toContain('initialRole');
    }
    const staff = findKindSchema('usuario-personal-organizacion') as KindSchema;
    expect(staff.fields.find((f) => f.name === 'role')?.values).not.toContain(
      'OWNER',
    );
  });
});

describe.each(ALL_KIND_SCHEMAS.map((s) => [s.kind, s] as const))(
  'T1 · plantilla de %s',
  (_kind, schema) => {
    it('la fila de ejemplo pasa la validación estructural', () => {
      const { issues } = validateRowAgainstSchema(schema, exampleRow(schema));
      expect(issues).toEqual([]);
    });

    it('la plantilla JSON trae kind, version, columnas, ejemplo y reglas, y su ejemplo pasa', () => {
      const json = templates.json(schema);
      expect(json.kind).toBe(schema.kind);
      expect(json.version).toBe(schema.version);
      expect(json.columns.map((c) => c.name)).toEqual(
        schema.fields.map((f) => f.name),
      );
      for (const column of json.columns) {
        expect(Object.keys(column)).toEqual(
          expect.arrayContaining([
            'name',
            'type',
            'required',
            'description',
            'example',
          ]),
        );
      }
      expect(json.rules.length).toBeGreaterThan(0);
      expect(json.example).toHaveLength(1);
      const parsed = rowsFromJson(schema, JSON.parse(JSON.stringify(json)));
      expect(parsed.fileIssues).toEqual([]);
      for (const raw of parsed.rows) {
        expect(validateRowAgainstSchema(schema, raw.values).issues).toEqual([]);
      }
    });

    it('la plantilla CSV leída por el propio importador pasa sin hallazgos', () => {
      const file = templates.file(schema, 'csv');
      expect(file.fileName).toBe(
        `plantilla-${schema.kind}-v${schema.version}.csv`,
      );
      expect(file.contentType).toBe('text/csv; charset=utf-8');
      const parsed = parseSource(schema, {
        file: file.content,
        fileName: file.fileName,
      });
      expect(parsed.format).toBe('csv');
      expect(parsed.fileIssues).toEqual([]);
      expect(parsed.rows).toHaveLength(1);
      expect(
        validateRowAgainstSchema(schema, parsed.rows[0].values).issues,
      ).toEqual([]);
    });

    it('la plantilla JSON descargada se puede subir tal cual', () => {
      const file = templates.file(schema, 'json');
      expect(file.fileName).toBe(
        `plantilla-${schema.kind}-v${schema.version}.json`,
      );
      expect(file.contentType).toBe('application/json; charset=utf-8');
      const parsed = parseSource(schema, {
        file: file.content,
        fileName: file.fileName,
      });
      expect(parsed.format).toBe('json');
      expect(parsed.fileIssues).toEqual([]);
      expect(
        validateRowAgainstSchema(schema, parsed.rows[0].values).issues,
      ).toEqual([]);
    });

    it('un campo fuera de la plantilla se rechaza (lista blanca), en JSON y en CSV', () => {
      const row = { ...exampleRow(schema), campoAjeno: 'x' };
      const found = validateRowAgainstSchema(schema, row).issues;
      expect(found.map((i) => i.code)).toContain(
        BulkImportReason.UNKNOWN_FIELD,
      );

      const header = [...schema.fields.map((f) => f.name), 'campoAjeno'].join(
        ',',
      );
      const values = [
        ...schema.fields.map((f) => exampleRow(schema)[f.name]),
        'x',
      ].join(',');
      const csv = parseSource(schema, {
        file: Buffer.from(`${header}\n${values}\n`),
        fileName: 'a.csv',
      });
      expect(csv.fileIssues.map((i) => i.code)).toContain(
        BulkImportReason.UNKNOWN_FIELD,
      );
    });

    it('cada obligatoria ausente se reporta en su columna, sin eco de valores', () => {
      for (const field of schema.fields.filter((f) => f.required)) {
        const row = { ...exampleRow(schema) } as Record<string, string>;
        delete row[field.name];
        const { issues } = validateRowAgainstSchema(schema, row);
        expect(
          issues.some(
            (i) =>
              i.field === field.name && i.code === BulkImportReason.REQUIRED,
          ),
        ).toBe(true);
      }
    });
  },
);

describe('validación de campos (nivel límite e inválido)', () => {
  const patient = findKindSchema('usuario-paciente') as KindSchema;
  const base = () => ({ ...exampleRow(patient) }) as Record<string, string>;
  const codes = (row: Record<string, unknown>) =>
    validateRowAgainstSchema(patient, row).issues.map(
      (i) => `${i.field}:${i.code}`,
    );

  it('correcto: el ejemplo no tiene hallazgos', () => {
    expect(codes(base())).toEqual([]);
  });

  it('límite: documento con 4 y con 40 caracteres pasa; con 3 y 41 no', () => {
    expect(codes({ ...base(), nationalId: 'AB-1' })).toEqual([]);
    expect(codes({ ...base(), nationalId: 'A'.repeat(40) })).toEqual([]);
    expect(codes({ ...base(), nationalId: 'AB1' })).toEqual([
      'nationalId:TOO_SHORT',
    ]);
    expect(codes({ ...base(), nationalId: 'A'.repeat(41) })).toEqual([
      'nationalId:TOO_LONG',
    ]);
  });

  it('límite: fecha de nacimiento mínima 1910-01-01 pasa; 1909-12-31, futura y 30 de febrero no', () => {
    expect(codes({ ...base(), birthDate: '1910-01-01' })).toEqual([]);
    expect(codes({ ...base(), birthDate: '1909-12-31' })).toEqual([
      'birthDate:OUT_OF_RANGE',
    ]);
    expect(codes({ ...base(), birthDate: '2999-01-01' })).toEqual([
      'birthDate:OUT_OF_RANGE',
    ]);
    expect(codes({ ...base(), birthDate: '2024-02-30' })).toEqual([
      'birthDate:INVALID_FORMAT',
    ]);
    expect(codes({ ...base(), birthDate: '17/05/1990' })).toEqual([
      'birthDate:INVALID_FORMAT',
    ]);
  });

  it('inválido: correo, teléfono, uuid, enum y tipo no escalar', () => {
    expect(codes({ ...base(), email: 'sin-arroba' })).toEqual([
      'email:INVALID_FORMAT',
    ]);
    expect(codes({ ...base(), phone: 'abc' })).toEqual([
      'phone:INVALID_FORMAT',
    ]);
    expect(
      codes({ ...base(), residenceMunicipalityConceptId: 'no-uuid' }),
    ).toEqual(['residenceMunicipalityConceptId:INVALID_FORMAT']);
    expect(codes({ ...base(), sexAtBirth: 'X' })).toEqual([
      'sexAtBirth:NOT_ALLOWED_VALUE',
    ]);
    expect(codes({ ...base(), name: { a: 1 } })).toEqual([
      'name:INVALID_FORMAT',
    ]);
  });

  it('JSON: números y booleanos se aceptan como texto; vacío cuenta como ausente', () => {
    const vitals = findKindSchema('hc-signo-vital') as KindSchema;
    const row = { ...exampleRow(vitals), value: 36.5 };
    expect(validateRowAgainstSchema(vitals, row).issues).toEqual([]);
    expect(
      validateRowAgainstSchema(patient, { ...base(), middleName: '   ' }).row
        .middleName,
    ).toBeUndefined();
  });

  it('los mensajes dicen qué se espera y nunca repiten el valor recibido', () => {
    const SENTINEL = 'VALOR-SENSIBLE-9931';
    const row = {
      ...base(),
      nationalId: `${SENTINEL}!!`,
      email: SENTINEL,
      birthDate: SENTINEL,
      phone: SENTINEL,
      sexAtBirth: SENTINEL,
      [SENTINEL]: SENTINEL,
    };
    const { issues } = validateRowAgainstSchema(patient, row);
    expect(issues.length).toBeGreaterThanOrEqual(5);
    for (const found of issues) {
      expect(JSON.stringify(found)).not.toContain(SENTINEL);
    }
  });

  it('reglas entre campos: resultado con número y texto a la vez, o sin ninguno', () => {
    const result = findKindSchema('hc-resultado') as KindSchema;
    const row = { ...exampleRow(result) } as Record<string, string>;
    expect(validateRowAgainstSchema(result, row).issues).toEqual([]);
    expect(
      validateRowAgainstSchema(result, {
        ...row,
        valueText: 'texto',
      }).issues.map((i) => i.code),
    ).toEqual([BulkImportReason.FIELD_COMBINATION_INVALID]);
    const sinValor = { ...row };
    delete sinValor.valueDecimal;
    delete sinValor.valueText;
    expect(
      validateRowAgainstSchema(result, sinValor).issues.map((i) => i.code),
    ).toEqual([BulkImportReason.FIELD_COMBINATION_INVALID]);
  });

  it('reglas entre campos: par sistema+código incompleto, fin anterior al inicio, nota vacía', () => {
    const condition = findKindSchema('hc-diagnostico') as KindSchema;
    const dx = { ...exampleRow(condition) } as Record<string, string>;
    delete dx.diagnosisSystem;
    expect(
      validateRowAgainstSchema(condition, dx).issues.map((i) => i.field),
    ).toEqual(['diagnosisSystem']);

    const encounter = findKindSchema('hc-encuentro') as KindSchema;
    const inverted = {
      ...exampleRow(encounter),
      endAt: '2024-03-15T09:00:00-04:00',
    };
    expect(
      validateRowAgainstSchema(encounter, inverted).issues.map((i) => i.field),
    ).toEqual(['endAt']);

    const note = findKindSchema('hc-nota') as KindSchema;
    const empty = { ...exampleRow(note) } as Record<string, string>;
    for (const f of [
      'chiefComplaintText',
      'subjectiveText',
      'objectiveText',
      'assessmentText',
      'planText',
    ]) {
      delete empty[f];
    }
    expect(
      validateRowAgainstSchema(note, empty).issues.map((i) => i.code),
    ).toEqual([BulkImportReason.FIELD_COMBINATION_INVALID]);
  });

  it('la dosis exige su unidad', () => {
    const med = findKindSchema('hc-medicacion') as KindSchema;
    const row = { ...exampleRow(med) } as Record<string, string>;
    delete row.unitSystem;
    delete row.unitCode;
    expect(
      validateRowAgainstSchema(med, row).issues.map((i) => i.field),
    ).toEqual(['unitCode']);
  });
});

describe('topes del contrato', () => {
  it('son 5.000 filas y 20 MB', () => {
    expect(BULK_IMPORT_LIMITS.maxRows).toBe(5000);
    expect(BULK_IMPORT_LIMITS.maxBytes).toBe(20 * 1024 * 1024);
  });
});
