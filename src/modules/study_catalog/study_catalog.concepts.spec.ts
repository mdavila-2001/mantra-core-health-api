import { describe, expect, it } from '@jest/globals';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deterministicId } from '../../common/constants/concepts';
import { DYNAMIC_ENUM_CATALOG } from '../../common/seed/dynamic-enum-catalog';
import { CLINICAL_CONCEPT_SEEDS } from '../clinical/clinical.concepts';
import {
  DIAGNOSTICS_CONCEPT_SEEDS,
  SPECIMEN_TYPE_CONCEPTS,
} from '../diagnostics/diagnostics.concepts';
import imaging from './data/imagenologia.json';
import localKeys from './data/local-concept-keys.json';
import {
  BODY_SITE_CONCEPT_IDS,
  CONTRAST_CONCEPT_IDS,
  MODALITY_CONCEPT_IDS,
  STUDY_CATALOG_CONCEPT_SEEDS,
  bodySiteConceptId,
  contrastConceptId,
  modalityConceptId,
} from './study_catalog.concepts';

const entry = (code: string) =>
  DYNAMIC_ENUM_CATALOG.find((e) => e.code === code);

describe('conceptos del catálogo de estudios', () => {
  it('declara 14 modalidades, 156 regiones y 3 contrastes, sin ids repetidos', () => {
    expect(MODALITY_CONCEPT_IDS).toHaveLength(14);
    expect(BODY_SITE_CONCEPT_IDS).toHaveLength(156);
    expect(CONTRAST_CONCEPT_IDS).toHaveLength(3);
    const all = [
      ...MODALITY_CONCEPT_IDS,
      ...BODY_SITE_CONCEPT_IDS,
      ...CONTRAST_CONCEPT_IDS,
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it('cada modalidad y región del JSON tiene su concepto, con el rótulo del catálogo', () => {
    for (const m of imaging.modalidades) {
      const seed = STUDY_CATALOG_CONCEPT_SEEDS.find(
        (s) => s.key === `study_catalog:MODALITY_${m.codigo}`,
      );
      expect(seed?.display).toBe(m.nombre);
      expect(modalityConceptId(m.codigo)).toBe(
        deterministicId(`study_catalog:MODALITY_${m.codigo}`),
      );
    }
    for (const r of imaging.regiones) {
      const seed = STUDY_CATALOG_CONCEPT_SEEDS.find(
        (s) => s.key === `study_catalog:REGION_${r.codigo}`,
      );
      expect(seed?.display).toBe(r.nombre);
      expect(bodySiteConceptId(r.codigo)).toBe(
        deterministicId(`study_catalog:REGION_${r.codigo}`),
      );
    }
  });

  it('los códigos de opción son únicos entre sí', () => {
    const codes = STUDY_CATALOG_CONCEPT_SEEDS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('contrasteConceptId traduce los tres valores del catálogo y rechaza otros', () => {
    expect(contrastConceptId('sin')).toBe(CONTRAST_CONCEPT_IDS[0]);
    expect(contrastConceptId('con')).toBe(CONTRAST_CONCEPT_IDS[1]);
    expect(contrastConceptId('sin_y_con')).toBe(CONTRAST_CONCEPT_IDS[2]);
    expect(() => contrastConceptId('otro')).toThrow();
    expect(() => modalityConceptId('NOPE')).toThrow();
    expect(() => bodySiteConceptId('NOPE')).toThrow();
  });

  it('los tres value sets nuevos gobiernan las columnas de v4.2.82 y todos los estudios del JSON usan conceptos declarados', () => {
    expect(entry('service-request-imaging-modality')?.targets).toEqual([
      'clinical.service_requests.modality_concept_id',
    ]);
    expect(entry('imaging-body-structure')?.targets).toEqual([
      'clinical.service_requests.body_site_concept_id',
    ]);
    expect(entry('imaging-contrast')?.targets).toEqual([
      'clinical.service_requests.contrast_concept_id',
    ]);
    expect(entry('imaging-body-structure')?.concepts).toHaveLength(156);
    for (const e of imaging.estudios) {
      expect(() => modalityConceptId(e.modalidad)).not.toThrow();
      expect(() => bodySiteConceptId(e.region)).not.toThrow();
    }
    for (const r of imaging.regiones)
      if (r.padre)
        expect(() => bodySiteConceptId(r.padre as string)).not.toThrow();
  });

  it('muestra y lateralidad suman su columna de service_requests a los value sets existentes', () => {
    expect(entry('specimen-type')?.targets).toContain(
      'clinical.service_requests.specimen_type_concept_id',
    );
    expect(entry('condition-laterality')?.targets).toContain(
      'clinical.service_requests.laterality_concept_id',
    );
  });
});

describe('local-concept-keys.json (puente código local -> clave del seed)', () => {
  it('coincide con los conceptos que declaran clinical y diagnostics', () => {
    const studies: Record<string, string> = {};
    for (const s of CLINICAL_CONCEPT_SEEDS) {
      if (/^[A-Z]{3}_/.test(s.code) && s.key.startsWith('clinical:STUDY_'))
        studies[s.code] = s.key;
    }
    expect(localKeys.studies).toEqual(studies);
    const spec = new Set(SPECIMEN_TYPE_CONCEPTS);
    const specimens: Record<string, string> = {};
    for (const s of DIAGNOSTICS_CONCEPT_SEEDS)
      if (spec.has(deterministicId(s.key))) specimens[s.code] = s.key;
    expect(localKeys.specimens).toEqual(specimens);
  });
});

describe('catálogos versionados', () => {
  it('el SHA-256 de cada JSON coincide con SHA256SUMS', () => {
    const dir = join(process.cwd(), 'src', 'modules', 'study_catalog', 'data');
    const sums = Object.fromEntries(
      readFileSync(join(dir, 'SHA256SUMS'), 'utf8')
        .trim()
        .split('\n')
        .map((l) => l.trim().split(/\s+/).reverse()),
    );
    for (const f of [
      'laboratorio.json',
      'imagenologia.json',
      'regiones-cuerpo-3d.json',
    ]) {
      expect(
        createHash('sha256')
          .update(readFileSync(join(dir, f)))
          .digest('hex'),
      ).toBe(sums[f]);
    }
  });
});
