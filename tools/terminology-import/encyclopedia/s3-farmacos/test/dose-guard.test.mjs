// Ninguna línea de salida puede contener un patrón de dosis.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanLines, htmlToLines, isLiteralOf, splitSentences } from '../lib/blocks.mjs';
import { DoseLeakError, assertNoDose, containsDose, doseMatch } from '../lib/dose-guard.mjs';
import { buildCimaArticle, validateArticle } from '../lib/article.mjs';
import { slimVtm } from '../lib/corpus.mjs';
import { fx } from './helpers.mjs';

// Frases SINTÉTICAS: solo ejercitan la guardia, no son contenido médico.
const DOSE_SAMPLES = [
  'Tomar 500 mg cada 8 horas.',
  'No superar 4 g al día.',
  'Se administran 0,5 mcg por kilo.',
  'Aclaramiento de creatinina < 30 ml/min.',
  'Vial de 10 ml.',
  'Concentración del 5 % en suero.',
  'Equivale a 1 000 UI.',
  'Una dosis única de carga.',
  'La posología se ajusta según el peso.',
  'Cada 12 horas durante una semana.',
  'Dos veces al día con las comidas.',
  'Una vez por semana.',
  'Pacientes con peso inferior a 40 kg.',
  'Un comprimido por la mañana.',
  'Puede ser necesario ajustar (ver sección 4.2).',
  'Sobredosis accidental.',
  '250mg/5ml suspensión.',
];

const CLEAN_SAMPLES = [
  'Hipersensibilidad al principio activo, a cualquiera de las penicilinas o a alguno de los excipientes incluidos en la sección 6.1.',
  'Frecuentes (≥ 1/100 a < 1/10)',
  'Antes de iniciar el tratamiento, realizar una prueba de detección del alelo HLA-B*5701 (ver sección 4.4).',
  'Grupo farmacoterapéutico: penicilinas de amplio espectro; código ATC: J01CA04.',
  'A11G · ACIDO ASCORBICO (VITAMINA C), INCLUYENDO COMBINACIONES',
  'Código ATC J01CA04',
  'Probenecid',
  'Reacciones adversas notificadas en 3 de los pacientes del estudio',
];

test('cada patrón de dosis conocido se detecta', () => {
  for (const s of DOSE_SAMPLES) assert.ok(containsDose(s), `no detectó: «${s}»`);
});

test('texto sin dosis no se marca (códigos ATC, frecuencias MedDRA, remisiones a otras secciones)', () => {
  for (const s of CLEAN_SAMPLES) assert.equal(doseMatch(s), null, `falso positivo: «${s}»`);
});

test('assertNoDose rechaza una dosis en cualquier campo de prosa del artículo', () => {
  const base = () => ({ conceptRef: { system: 'x', code: '1', slug: 'x' }, sections: [{ kind: 'indications', text: 'Texto limpio.', items: ['a'] }], images: [{ caption: 'Foto' }], facts: [{ label: 'L', value: 'v' }] });
  assert.doesNotThrow(() => assertNoDose(base()));
  const inText = base(); inText.sections[0].text = 'Texto limpio.\nTomar 500 mg cada 8 horas.';
  const inItems = base(); inItems.sections[0].items = ['2 g al día'];
  const inCaption = base(); inCaption.images[0].caption = 'Envase de 10 mg';
  const inFact = base(); inFact.facts[0].value = '100 UI';
  for (const bad of [inText, inItems, inCaption, inFact]) assert.throws(() => assertNoDose(bad), DoseLeakError);
});

test('validateArticle también corta una dosis aunque el resto del contrato esté bien', () => {
  const vtm = slimVtm(fx('cima-vtm-27658006.json'));
  const seedRow = fx('seed-cima-vtm-27658006.json');
  const { article } = buildCimaArticle({
    seedRow, vtm, sections: { '4.3': { response: fx('cima-50239-4.3.json'), retrievedAt: '2026-10-08', fichaDate: '2025-06-07' } },
    listingDate: '2026-09-30', retrievedAt: '2026-09-30',
  });
  assert.doesNotThrow(() => validateArticle(structuredClone(article)));
  const leaky = structuredClone(article);
  leaky.sections[0].text += '\nTomar 500 mg cada 8 horas.';
  assert.throws(() => validateArticle(leaky), DoseLeakError);
});

test('cleanLines retira SOLO la oración con dosis y conserva el resto, literal', () => {
  const html = '<p>Primera oración limpia. Tomar 500 mg cada 8 horas. Tercera oración limpia.</p><p>Línea con 10 ml.</p><p>Línea limpia.</p>';
  const lines = htmlToLines(html);
  const { lines: kept, dropped, sentenceCount } = cleanLines(lines);
  assert.deepEqual(kept, ['Primera oración limpia. Tercera oración limpia.', 'Línea limpia.']);
  assert.equal(dropped.length, 2);
  assert.equal(sentenceCount, 5);
  assert.ok(isLiteralOf(kept, lines));
});

test('sobre una respuesta real (4.4/4.8 de CIMA) la salida no contiene dosis y es literal', () => {
  for (const f of ['cima-50239-4.1.json', 'cima-50239-4.3.json', 'cima-50239-4.5.json', 'cima-50239-4.8-recorte.json', 'cima-50239-5.1.json']) {
    const [item] = fx(f);
    const lines = htmlToLines(item.contenido);
    const { lines: kept } = cleanLines(lines);
    assert.ok(kept.length > 0, f);
    for (const l of kept) assert.equal(doseMatch(l), null, `${f}: «${l}»`);
    assert.ok(isLiteralOf(kept, lines), `${f}: no es literal`);
  }
});

test('splitSentences no corta abreviaturas en minúscula ni números de sección', () => {
  assert.deepEqual(splitSentences('Antecedentes (p. ej. anafilaxia) a otro agente (ver secciones 4.4 y 5.1). Segunda.'), ['Antecedentes (p. ej. anafilaxia) a otro agente (ver secciones 4.4 y 5.1).', 'Segunda.']);
});
