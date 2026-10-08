// =============================================================================
// Fecha de la ficha cuando la API no la entrega: se lee de la sección 10 de la
// propia ficha («Fecha de la revisión del texto»). Solo se acepta una fecha que el
// documento ESCRIBA; si no hay, no se inventa (la sección queda sin publicar).
// =============================================================================

import { htmlToLines } from './blocks.mjs';

const MONTHS = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06', julio: '07',
  agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {any} response respuesta JSON de la sección 10
 * @returns {{ value: string, precision: 'day'|'month', text: string } | null}
 *   `value` es AAAA-MM-DD o AAAA-MM, tal como lo dice el documento.
 */
export function parseRevisionDate(response) {
  const item = Array.isArray(response) ? response.find((s) => s?.seccion === '10') : null;
  if (!item?.contenido) return null;
  const text = htmlToLines(item.contenido).join(' ');
  let m = /\b(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*((?:19|20)\d{2})\b/.exec(text);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[1]) >= 1 && Number(m[1]) <= 31) {
    return { value: `${m[3]}-${pad(m[2])}-${pad(m[1])}`, precision: 'day', text: m[0] };
  }
  m = /\b(\d{1,2})\s*[/.-]\s*((?:19|20)\d{2})\b/.exec(text);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return { value: `${m[2]}-${pad(m[1])}`, precision: 'month', text: m[0] };
  m = new RegExp(`\\b(${Object.keys(MONTHS).join('|')})\\s+(?:de\\s+|del\\s+)?((?:19|20)\\d{2})\\b`, 'i').exec(text);
  if (m) return { value: `${m[2]}-${MONTHS[m[1].toLowerCase()]}`, precision: 'month', text: m[0] };
  return null;
}
