// TAREA-41 F4 — qué afirma una oración de 4.5 (negación, falta de estudios, cautela).
//
// Las oraciones son literales de las fichas técnicas de CIMA (AEMPS) bajadas el
// 2026-10-29; las cuatro primeras categorías salen de la revisión de la salida
// real de `import-cima.mjs --safety` (25 835 pares).
//
// Correr: node --test tools/terminology-import/test/interaction-assertion.test.mjs

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { UNSPECIFIED_SEVERITY, cimaSafety, buildTermIndex, interactionSeverity } from '../lib/glossary-es/cima-safety.mjs';
import { INTERACTION_ASSERTION as A, INTERACTION_DROP_REASON, interactionAssertion } from '../lib/glossary-es/interaction-assertion.mjs';

const assertion = (sentence) => interactionAssertion(sentence, interactionSeverity(sentence), UNSPECIFIED_SEVERITY);

test('niega la interacción: se descarta (la ficha dice lo contrario de un par)', () => {
  for (const s of [
    'Los estudios clínicos han demostrado que no se dan interacciones clínicamente significativas entre abacavir, zidovudina y lamivudina.',
    'No se observaron interacciones farmacodinámicas clínicamente significativas al administrar de forma conjunta clopidogrel y atenolol, nifedipino o ambos.',
    'Dronedarona no afecta la farmacocinética de clopidogrel o de su metabolito activo.',
    'La administración junto con rifampicina no afectó a la farmacocinética de palonosetrón.',
    'En base a las características conocidas de nebivolol y amlodipino, no se espera ninguna interacción farmacocinética clínicamente relevante entre los componentes individuales de este medicamento.',
    'Los datos clínicos indican que regorafenib no tiene efecto en la farmacocinética de la digoxina, por lo tanto, puede ser administrado de forma concomitante con sustratos de la glicoproteína P.',
    'Litio - la administración junto con ziprasidona no tuvo efecto sobre los parámetros farmacocinéticos del litio.',
  ]) assert.equal(assertion(s), A.NEGATED, s);
});

test('no se estudió: ausencia de datos, tampoco es un par', () => {
  for (const s of [
    'Didanosina/Lamivudina — Interacción no estudiada.',
    'No se han realizado estudios de interacción que evalúen los efectos de amiodarona o verapamilo sobre atorvastatina.',
    'Leflunomida: no se ha estudiado el empleo de leflunomida con hidroxicloroquina.',
    'El efecto de cabozantinib en la farmacocinética de warfarina no se ha estudiado.',
  ]) assert.equal(assertion(s), A.NO_DATA, s);
});

test('la doble negación es una cautela, no una ausencia: se conserva', () => {
  for (const s of [
    'No se puede excluir que olaparib pueda aumentar la exposición a sustratos de BCRP (p.ej., metotrexato, rosuvastatina).',
    'Por lo tanto, no se puede excluir que la administración concomitante de larotrectinib con sustratos de OATP1B1 pueda aumentar la exposición a los mismos.',
  ]) assert.equal(assertion(s), A.POSSIBLE, s);
});

test('«no se recomienda» y «contraindicado» mandan aunque la oración también niegue', () => {
  const warned = 'Aunque no se ha informado de interacciones, el uso simultáneo de coal tar (brea de hulla) no se recomienda con medicamentos con potencial fototóxico.';
  assert.equal(interactionSeverity(warned), 'NOT_RECOMMENDED');
  assert.equal(assertion(warned), A.WARNING);
  assert.equal(assertion('Ante la ausencia de estudios sobre interacciones farmacocinéticas, no se recomienda el uso de Beacita en pacientes que estén recibiendo acarbosa.'), A.WARNING);
});

test('«Aunque no se han descrito…, se recomienda controlar» es una precaución: se conserva', () => {
  assert.equal(
    assertion('Aunque no se han descrito interacciones entre ibuprofeno o dexibuprofeno y sulfonilureas, se recomienda un control de los valores de glucosa en sangre como precaución durante el uso concomitante.'),
    A.UNSPECIFIED,
  );
});

test('oración mixta (niega una parte y afirma otra): se conserva', () => {
  assert.equal(
    assertion('Ácido acetilsalicílico (AAS): AAS no modificó la inhibición, mediada por clopidogrel, de la agregación plaquetaria inducida por ADP, pero clopidogrel potenció el efecto del AAS en la agregación plaquetaria.'),
    A.UNSPECIFIED,
  );
  assert.equal(
    assertion('Saxagliptina — Aunque no se ha estudiado directamente, es probable que itraconazol aumente las concentraciones de saxagliptina. — Usar con precaución'),
    A.UNSPECIFIED,
  );
});

test('«no estudiada» con una sospecha a continuación se conserva (la sospecha es el dato)', () => {
  assert.equal(
    assertion('Dasatinib Nilotinib Vinblastina Vincristina — Interacción no estudiada. Las concentraciones de estos medicamentos pueden aumentar al administrarse de forma concomitante con cobicistat.'),
    A.UNSPECIFIED,
  );
});

test('una interacción afirmada sigue siendo un par', () => {
  for (const s of [
    'Tacrolimus — Cuando un AINE se administra con tacrolimus existe un posible aumento del riesgo de nefrotoxicidad.',
    'Los niveles plasmáticos de la fenitoína y carbamazepina pueden aumentar, con los consiguientes efectos adversos.',
    'La administración concomitante de pazopanib con inhibidores de CYP3A4, P-gp y BCRP, como lapatinib, dará lugar a un incremento de las concentraciones plasmáticas de pazopanib.',
  ]) assert.equal(assertion(s), A.UNSPECIFIED, s);
});

test('la sílaba «sin» de un nombre no es negación: «Viekirax sin dasabuvir … la magnitud de la interacción»', () => {
  assert.equal(assertion('Viekirax sin dasabuvir — ↔ duloxetina — La magnitud de la interacción fue similar a la observada con Viekirax + dasabuvir.'), A.UNSPECIFIED);
});

test('cimaSafety: la oración que niega no produce par y queda en la cola con su razón', () => {
  const ingredientIndex = buildTermIndex([
    { conceptId: 'c-zidovudina', text: 'zidovudina' },
    { conceptId: 'c-lamivudina', text: 'lamivudina' },
  ]);
  const html = '<p>Los estudios clínicos han demostrado que no se dan interacciones clínicamente significativas entre abacavir, zidovudina y lamivudina.</p>'
    + '<p>La zidovudina puede aumentar las concentraciones de abacavir.</p>';
  const result = cimaSafety({
    drug: { conceptId: 'c-abacavir', slug: 'cima-vtm-1', name: 'abacavir' },
    sections: [{ section: '4.5', html, nregistro: '84740', productName: 'ABACAVIR', fichaDate: '2024-01-22', retrievedAt: '2026-10-29' }],
    clinicalIndex: buildTermIndex([]),
    ingredientIndex,
  });
  assert.deepEqual(result.interactions.map((i) => i.substanceB), ['zidovudina']);
  const dropped = result.unmatched.filter((u) => u.reason === INTERACTION_DROP_REASON[A.NEGATED]);
  assert.equal(dropped.length, 1);
  assert.match(dropped[0].sentence, /no se dan interacciones/);
});

test('«No se realizaron estudios…» (pretérito) también es falta de datos; «no se han estudiado. Son de esperar…» conserva la sospecha', () => {
  assert.equal(assertion('No se realizaron estudios de interacción específicos con indacaterol/glicopirronio/furoato de mometasona.'), A.NO_DATA);
  assert.equal(assertion('Lansoprazol — No se han estudiado. Son de esperar'), A.UNSPECIFIED);
});

test('negaciones con otro verbo («no provocó cambios», «no ejercieron ningún efecto», «falta de efecto en la farmacocinética»)', () => {
  for (const s of [
    'Anticonceptivos orales - la administración de ziprasidona no provocó cambios significativos de la farmacocinética de los componentes estrogénicos (etinil estradiol, un sustrato CYP3A4) o progesterona.',
    'Cimetidina, eritromicina, viloxazina, warfarina y dextropropoxifeno no ejercieron ningún efecto sobre la farmacocinética de MHD.',
    'En base a la falta de efecto en la farmacocinética in vivo del sustrato OAT de tenofovir, no es probable la inhibición in vivo de OAT1.',
  ]) assert.equal(assertion(s), A.NEGATED, s);
});
