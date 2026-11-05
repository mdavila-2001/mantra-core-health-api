// =============================================================================
// PMDA · maestro JMDN (一般的名称) del 医療機器基準データベース.
//
// `fetch-pmda-jmdn.mjs` guarda las páginas de detalle (`stdDB_jmdn_resr.cgi`,
// Shift_JIS) tal cual. Cada ficha es una `<table id="jmdn_table">` con filas
// etiqueta → valor:
//   名称等  nombre y, en la segunda línea, «別表1-1, クラスⅣ, コード：40770004,
//           GHTFルール：7-⑤,7-⑥»
//   保守等  特定保守 / 設置管理 / 修理区分 / QMS
//   類別    p. ej. «器12  理学診療用器具»
//   中分類  p. ej. «超音波画像診断装置»
//   製品群  una línea por grupo
//   定義    definición
//   備考    nombres y clases anteriores
// Nada se traduce ni se completa: lo que la ficha no trae queda en null.
// =============================================================================

import { textOrNull } from './row.mjs';

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function cellText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .split('\n')
    .map((l) => l.replace(/[ \t　]+$/u, '').replace(/^[ \t]+/, ''))
    .filter((l) => l.trim() !== '')
    .join('\n');
}

/** «別表1-1, クラスⅣ, コード：40770004, GHTFルール：7-⑤,7-⑥» → partes. */
export function parseJmdnHeadline(text) {
  const t = String(text ?? '').replace(/^[\s　]+/u, '');
  const pick = (re) => textOrNull(re.exec(t)?.[1]);
  return {
    annex: pick(/(別表[^,，]+)/),
    class: pick(/クラス([ⅠⅡⅢⅣ]+)/),
    code: pick(/コード：\s*(\d{8})/),
    ghtfRule: pick(/GHTFルール：\s*(.+)$/),
  };
}

function parseKeyValues(text) {
  const out = {};
  for (const part of String(text ?? '').split(/[,，]\s*/)) {
    const m = /^([^：]+)：\s*(.*)$/.exec(part.trim());
    if (m) out[m[1].trim()] = textOrNull(m[2].replace(/　/g, ' '));
  }
  return out;
}

/** Una página de detalle → lista de fichas JMDN. */
export function parseJmdnPage(html) {
  const entries = [];
  const tables = html.split(/<table id="jmdn_table"/i).slice(1);
  for (const chunk of tables) {
    const table = chunk.slice(0, chunk.search(/<\/table>/i));
    const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((m) =>
      [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
        cellText(c[1]),
      ),
    );
    if (rows.length === 0) continue;
    const fields = {};
    let headline = null;
    for (const cells of rows) {
      if (cells.length >= 2 && cells[0] !== '') fields[cells[0]] = cells[1];
      else if (
        cells.length === 1 &&
        fields['名称等'] !== undefined &&
        headline === null
      )
        headline = cells[0];
    }
    const name = textOrNull(fields['名称等']);
    if (name === null) continue;
    const head = parseJmdnHeadline(headline);
    const ruibetsu = textOrNull(fields['類別']);
    const rm = ruibetsu === null ? null : /^(\S+)\s+([\s\S]+)$/.exec(ruibetsu);
    const maintenance = parseKeyValues(fields['保守等']);
    entries.push({
      code: head.code,
      name,
      class: head.class,
      annex: head.annex,
      ghtfRule: head.ghtfRule,
      category:
        rm === null
          ? ruibetsu === null
            ? null
            : { code: null, name: ruibetsu }
          : { code: rm[1], name: rm[2].trim() },
      subcategory: textOrNull(fields['中分類']),
      productGroups:
        textOrNull(fields['製品群'])
          ?.split('\n')
          .map((l) => l.trim())
          .filter(Boolean) ?? [],
      definition: textOrNull(fields['定義']),
      maintenance: {
        specifiedMaintenance: maintenance['特定保守'] ?? null,
        installationControl: maintenance['設置管理'] ?? null,
        repairCategory: maintenance['修理区分'] ?? null,
        qms: maintenance['QMS'] ?? null,
      },
      remarks: textOrNull(fields['備考']),
    });
  }
  return entries;
}
