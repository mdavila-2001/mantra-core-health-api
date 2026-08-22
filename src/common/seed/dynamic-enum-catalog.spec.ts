import {
  CONCEPT_INDEX_BY_ID,
  DYNAMIC_ENUM_CATALOG,
  enumBindingId,
  enumDefinitionId,
  splitTarget,
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
} from './dynamic-enum-catalog';

/**
 * El catálogo es una declaración a mano, así que sus invariantes se comprueban
 * aquí y no en revisión. Un error en una entrada no rompe nada visible: produce un
 * selector con una opción de menos, o un amarre que ningún formulario resuelve, y
 * el fallo aparece semanas después en una pantalla.
 */
describe('DYNAMIC_ENUM_CATALOG', () => {
  it('no repite el código de una enumeración', () => {
    const codes = DYNAMIC_ENUM_CATALOG.map((entry) => entry.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no gobierna el mismo campo desde dos enumeraciones', () => {
    // Es la misma regla que impone `createBinding` en el servicio: dos
    // enumeraciones sobre un campo dejarían la resolución a merced del orden de
    // inserción.
    const targets = DYNAMIC_ENUM_CATALOG.flatMap((entry) => entry.targets);

    expect(new Set(targets).size).toBe(targets.length);
  });

  it('no vuelve a gobernar la especialidad del profesional', () => {
    // La gobierna `VS_MEDICAL_SPECIALTY`, que siembra el paquete del modelo con
    // sus 36 especialidades. Volver a declararla acá resucitaría el duplicado de
    // una sola opción —el que causaba F-19— pero sólo en las bases nuevas: en las
    // ya sembradas el seed no pisa, así que quedaría retirado. Dos entornos
    // respondiendo distinto es peor que el defecto original.
    const targets = DYNAMIC_ENUM_CATALOG.flatMap((entry) => entry.targets);

    expect(targets).not.toContain(
      'profiles.practitioner_specialties.specialty_concept_id',
    );
  });

  it('escribe todo destino como esquema.tabla.columna', () => {
    for (const entry of DYNAMIC_ENUM_CATALOG) {
      for (const target of entry.targets) {
        expect(() => splitTarget(target)).not.toThrow();
      }
    }
  });

  it('gobierna sólo columnas de concepto', () => {
    // Un destino que no acaba en `_concept_id` no es un campo de catálogo: sería
    // un amarre imposible de satisfacer.
    for (const entry of DYNAMIC_ENUM_CATALOG) {
      for (const target of entry.targets) {
        expect(target.endsWith('_concept_id')).toBe(true);
      }
    }
  });

  it('referencia sólo conceptos que el seed materializa', () => {
    const huerfanos = DYNAMIC_ENUM_CATALOG.flatMap((entry) =>
      entry.concepts
        .filter((conceptId) => !CONCEPT_INDEX_BY_ID.has(conceptId))
        .map((conceptId) => `${entry.code} -> ${conceptId}`),
    );

    expect(huerfanos).toEqual([]);
  });

  it('no declara ninguna enumeración vacía', () => {
    for (const entry of DYNAMIC_ENUM_CATALOG) {
      expect(entry.concepts.length).toBeGreaterThan(0);
      expect(entry.targets.length).toBeGreaterThan(0);
    }
  });

  it('no repite un concepto dentro de la misma enumeración', () => {
    for (const entry of DYNAMIC_ENUM_CATALOG) {
      expect(new Set(entry.concepts).size).toBe(entry.concepts.length);
    }
  });

  it('elige el valor por defecto de entre sus propios conceptos', () => {
    for (const entry of DYNAMIC_ENUM_CATALOG) {
      if (!entry.defaultConceptId) continue;
      expect(entry.concepts).toContain(entry.defaultConceptId);
    }
  });

  it('deriva identificadores deterministas y distintos por nivel', () => {
    // El valor del diseño está aquí: el mismo código produce el mismo uuid en
    // todo entorno, así que un cliente puede memoizar por código.
    expect(valueSetId('administrative-gender')).toBe(
      valueSetId('administrative-gender'),
    );
    expect(valueSetId('administrative-gender')).not.toBe(
      valueSetId('sex-at-birth'),
    );
    expect(valueSetId('administrative-gender')).not.toBe(
      enumDefinitionId('administrative-gender'),
    );
    expect(valueSetMemberId('a', 'c1')).not.toBe(valueSetMemberId('a', 'c2'));
    expect(enumBindingId('a', 't1')).not.toBe(enumBindingId('a', 't2'));
  });

  it('publica la URL canónica en el espacio de nombres del proyecto', () => {
    expect(valueSetCanonicalUrl('sex-at-birth')).toBe(
      'https://mantracore.health/fhir/ValueSet/sex-at-birth',
    );
  });

  it('cubre los dos campos que dejaron el alta de paciente sin selector', () => {
    // Regresión del bloqueo B1 reportado desde el frontend: el alta salió sin
    // género ni sexo al nacer porque no había forma de poblar esos selectores.
    const targets = DYNAMIC_ENUM_CATALOG.flatMap((entry) => entry.targets);

    expect(targets).toContain(
      'profiles.persons.administrative_gender_concept_id',
    );
    expect(targets).toContain('profiles.persons.sex_at_birth_concept_id');
  });
});

describe('splitTarget', () => {
  it('parte el destino en sus tres nombres', () => {
    expect(splitTarget('profiles.persons.sex_at_birth_concept_id')).toEqual({
      schemaName: 'profiles',
      entityName: 'persons',
      fieldName: 'sex_at_birth_concept_id',
    });
  });

  it('rechaza un destino con partes de menos', () => {
    expect(() => splitTarget('persons.gender')).toThrow();
  });

  it('rechaza un destino con una parte vacía', () => {
    expect(() => splitTarget('profiles..gender_concept_id')).toThrow();
  });
});
