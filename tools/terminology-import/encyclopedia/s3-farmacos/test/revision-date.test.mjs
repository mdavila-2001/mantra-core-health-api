import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRevisionDate } from '../lib/revision-date.mjs';

const resp = (text) => [{ seccion: '10', titulo: 'FECHA DE LA REVISIÓN DEL TEXTO', contenido: `<div><p>${text}</p></div>` }];

test('lee la fecha SOLO si el documento la escribe', () => {
  assert.deepEqual(parseRevisionDate(resp('Junio 2019')), { value: '2019-06', precision: 'month', text: 'Junio 2019' });
  assert.equal(parseRevisionDate(resp('06/2019')).value, '2019-06');
  assert.equal(parseRevisionDate(resp('15/03/2018')).value, '2018-03-15');
  assert.equal(parseRevisionDate(resp('Marzo de 2020')).value, '2020-03');
  // Respuesta real de un medicamento autorizado por la EMA: remite a la web, no trae fecha.
  assert.equal(parseRevisionDate(resp('La información detallada de este medicamento está disponible en la página web de la Agencia Europea de Medicamentos http://www.ema.europa.eu/.')), null);
  assert.equal(parseRevisionDate(null), null);
  assert.equal(parseRevisionDate([{ seccion: '4.3', contenido: '<p>Junio 2019</p>' }]), null);
});
