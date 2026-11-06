"""
EMA — extracción literal y verificable del anexo I (ficha técnica) de los PDF
de información de producto, para que build-monographs.mjs publique sólo lo que
se puede demostrar literal.

Por carácter (sobre pdfminer.six, versión fijada en requirements.txt):
  - El texto sale del mapa ToUnicode del PDF o, en fuentes de texto, de su
    codificación declarada (WinAnsi, Standard, Differences).
  - Fuente simbólica (Symbol, Wingdings, …: por nombre): sólo vale lo que da
    su ToUnicode. Sin ToUnicode, el carácter es U+FFFD (la codificación de una
    fuente simbólica no dice qué símbolo dibuja: 0xB3 sería «³» y es «≥»).
  - Código del área privada U+F000–U+F0FF en una fuente Symbol: se traduce con
    la tabla oficial «Adobe Symbol Encoding to Unicode» (unicode.org). Si la
    tabla da varios valores, sólo se acepta cuando todos son el mismo carácter
    en NFKC (espacio, Omega, mu: se emite esa forma, p. ej. μ U+03BC); si no
    (Delta, barra de fracción) o el valor es «Corporate Use», U+FFFD. Cualquier
    otro carácter del área privada, o un glifo sin Unicode, también es U+FFFD.
Tablas: las celdas salen de la grilla dibujada (pdfplumber, estrategia `lines`:
sólo la geometría de los bordes; el texto sigue siendo el de `literal_text`).
Cada glifo va a la celda que contiene su centro; una fila de la página lleva
`grid` con las celdas (texto, html, colspan/rowspan si la grilla no tiene el
borde interior) y, por celda, `alt`: las palabras de `pdftotext -bbox` (poppler,
otro extractor) cuyo centro cae en la misma celda. La tabla queda marcada si un
glifo o una palabra de su área no cae en ninguna celda (`unassigned`), si está
dentro de otra tabla (`nested`) o si una celda tiene un trazo que no es borde
(`graphic`). Una línea dentro de una grilla que pdfplumber no reconoce como
tabla, o fuera de la grilla pero a la altura de una tabla, sigue marcada
`table`, sin celdas, y su sección no se publica.
Cada fila lleva también `alt`: las palabras de `pdftotext -bbox` cuyo centro cae
en la fila (fuera de las tablas); la página lleva `altUnassigned` con las
palabras que no caen en ninguna fila ni celda.
Los superíndices y subíndices (más chicos y con la línea base corrida, p. ej. el
9 de «10⁹/l») no caben en el texto plano: la fila lleva además `html` con
<sup>/<sub>, como el HTML de CIMA.
Se quita el número de página (última fila de la página, sólo dígitos).
Completitud: se cuentan todos los glifos de la página (también los de figuras)
y los que llegan a las filas; si falta alguno, las filas de esa página quedan
marcadas `incomplete` y su sección no se publica.
Gráficos en el texto: un símbolo puede estar dibujado como vector y no como
glifo (p. ej. el «≥» de Besremi, 4.3, es una curva y una barra). Una fila con un
trazo (fuera de una grilla de tabla) dentro de su franja queda marcada `graphic`
y su sección no se publica. Un subrayado (trazo horizontal fino de 12 pt o más)
no cuenta.

Uso: python3 -I ema_pi_extract.py <symbol.txt> <salida-dir> <pdf>...
     escribe <salida-dir>/<nombre>.rows.json por PDF (lo ya escrito no se repite).
"""
import json
import os
import re
import subprocess
import sys
import unicodedata
from multiprocessing import Pool

from pdfminer.converter import PDFPageAggregator
from html import escape, unescape
from statistics import median

from pdfminer.layout import LAParams, LTAnno, LTChar, LTCurve, LTFigure, LTLine, LTRect, LTTextBox, LTTextLine
from pdfminer.pdffont import PDFUnicodeNotDefined
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage

import pdfplumber

REPLACEMENT = '�'
SYMBOLIC_NAMES = ('symbol', 'wingding', 'webding', 'dingbat', 'mtextra', 'mt extra', 'marlett')


def load_symbol_table(path):
    """Código Symbol → valores Unicode (tabla oficial de Adobe/Unicode). CUS se marca con None."""
    table = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            if not line or line.startswith('#'):
                continue
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 4:
                continue
            uni, code = int(parts[0], 16), int(parts[1], 16)
            table.setdefault(code, []).append(None if '(CUS)' in parts[3] else chr(uni))
    return table


def symbol_char(vals):
    """Valores de la tabla para un código → el carácter, si es uno solo en NFKC; si no, U+FFFD."""
    if not vals or None in vals:
        return REPLACEMENT
    forms = {unicodedata.normalize('NFKC', v) for v in vals}
    return forms.pop() if len(forms) == 1 else REPLACEMENT


def is_symbolic(font):
    name = (getattr(font, 'fontname', '') or '').lower()
    return any(s in name for s in SYMBOLIC_NAMES)


def literal_text(font, cid, symbol_table):
    """Texto de un glifo, o U+FFFD si no se puede afirmar qué carácter es."""
    umap = getattr(font, 'unicode_map', None)
    text = None
    from_tounicode = False
    if umap is not None:
        try:
            text = umap.get_unichr(cid)
            from_tounicode = True
        except KeyError:
            text = None
    if text is None:
        if is_symbolic(font):
            return REPLACEMENT
        try:
            text = font.to_unichr(cid)
        except PDFUnicodeNotDefined:
            return REPLACEMENT
    out = []
    for ch in text:
        cp = ord(ch)
        if 0xE000 <= cp <= 0xF8FF:
            if 0xF000 <= cp <= 0xF0FF and 'symbol' in (font.fontname or '').lower() and from_tounicode:
                out.append(symbol_char(symbol_table.get(cp - 0xF000, [])))
            else:
                out.append(REPLACEMENT)
        elif cp == 0xFFFD:
            out.append(REPLACEMENT)
        else:
            out.append(ch)
    return ''.join(out)


class LiteralAggregator(PDFPageAggregator):
    """PDFPageAggregator que decide el texto de cada glifo con `literal_text`."""

    def __init__(self, rsrcmgr, symbol_table, laparams):
        super().__init__(rsrcmgr, laparams=laparams)
        self.symbol_table = symbol_table
        self.fonts = {}

    def render_char(self, matrix, font, fontsize, scaling, rise, cid, ncs, graphicstate):
        text = literal_text(font, cid, self.symbol_table)
        key = font.fontname
        if key not in self.fonts:
            self.fonts[key] = {
                'toUnicode': getattr(font, 'unicode_map', None) is not None,
                'symbolicByName': is_symbolic(font),
                'symbolicFlag': bool(getattr(font, 'flags', 0) & 4),
            }
        item = LTChar(matrix, font, fontsize, scaling, rise, text, font.char_width(cid), font.char_disp(cid), ncs, graphicstate)
        self.cur_item.add(item)
        return item.adv


def table_boxes(page):
    """Grillas dibujadas: grupos de ≥ 3 bordes que se tocan, de ≥ 60 × 8 pt."""
    segs = [el.bbox for el in page if isinstance(el, (LTRect, LTLine, LTCurve)) and el.width < page.width * 0.9]
    parent = list(range(len(segs)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(segs)):
        a = segs[i]
        for j in range(i + 1, len(segs)):
            b = segs[j]
            if a[0] - 2 <= b[2] and b[0] - 2 <= a[2] and a[1] - 2 <= b[3] and b[1] - 2 <= a[3]:
                parent[find(i)] = find(j)
    groups = {}
    for i, s in enumerate(segs):
        groups.setdefault(find(i), []).append(s)
    boxes = []
    for g in groups.values():
        x0, y0, x1, y1 = min(s[0] for s in g), min(s[1] for s in g), max(s[2] for s in g), max(s[3] for s in g)
        if len(g) >= 3 and x1 - x0 >= 60 and y1 - y0 >= 8:
            boxes.append((x0, y0, x1, y1))
    return boxes


def line_markup(ln):
    """Texto de la línea y, si tiene superíndices o subíndices, su HTML con <sup>/<sub> (si no, None)."""
    return markup(list(ln))


def markup(items):
    """Texto de una secuencia de glifos (de una línea o del tramo de una línea en una celda) y su HTML con <sup>/<sub>, o None."""
    items = [i for i in items if isinstance(i, (LTChar, LTAnno))]
    chars = [c for c in items if isinstance(c, LTChar)]
    text = ''.join(i.get_text() for i in items).rstrip('\n')
    if not chars:
        return text, None
    sizes = {}
    for c in chars:
        sizes[round(c.size, 1)] = sizes.get(round(c.size, 1), 0) + 1
    dom = max(sizes, key=sizes.get)
    base = median(c.y0 for c in chars if round(c.size, 1) == dom)
    out, cur, buf, marked = [], None, [], False
    for item in items:
        kind = None
        if isinstance(item, LTChar) and item.size < 0.85 * dom:
            if item.y0 > base + 0.15 * dom:
                kind = 'sup'
            elif item.y0 < base - 0.05 * dom:
                kind = 'sub'
        t = item.get_text()
        if kind != cur:
            if buf:
                out.append(f'<{cur}>{escape("".join(buf))}</{cur}>' if cur else escape(''.join(buf)))
            cur, buf = kind, []
        buf.append(t)
        marked = marked or kind is not None
    if buf:
        out.append(f'<{cur}>{escape("".join(buf))}</{cur}>' if cur else escape(''.join(buf)))
    return text, (''.join(out).rstrip('\n') if marked else None)


def text_lines(container):
    """Todas las líneas de texto: sueltas en la página, dentro de cajas y dentro de figuras (recursivo)."""
    for el in container:
        if isinstance(el, LTTextLine):
            yield el
        elif isinstance(el, LTTextBox):
            for ln in el:
                if isinstance(ln, LTTextLine):
                    yield ln
        elif isinstance(el, LTFigure):
            yield from text_lines(el)


def count_chars(container):
    """Glifos de la página, en cualquier nivel (para el control de completitud)."""
    n = 0
    for el in container:
        if isinstance(el, LTChar):
            n += 1
        elif hasattr(el, '__iter__') and not isinstance(el, LTAnno):
            n += count_chars(el)
    return n


GRID_SETTINGS = {'vertical_strategy': 'lines', 'horizontal_strategy': 'lines'}


def _boundaries(values):
    """Coordenadas de bordes de la grilla, fusionando las que distan 1 pt o menos."""
    reps = []
    for v in sorted(values):
        if not reps or v - reps[-1] > 1.0:
            reps.append(v)
    return reps


def _nearest(reps, v):
    return min(range(len(reps)), key=lambda i: abs(reps[i] - v))


def grid_tables(plumber_page, height):
    """
    Tablas de la grilla dibujada (pdfplumber, sólo geometría) en coordenadas de pdfminer (origen abajo). Cada celda
    lleva su fila y columna en la grilla y, si abarca más de una, su rowspan/colspan (la grilla no tiene ese borde).
    """
    tables = []
    for t in plumber_page.find_tables(GRID_SETTINGS):
        cells = [(c[0], height - c[3], c[2], height - c[1]) for c in t.cells]
        if not cells:
            continue
        xs = _boundaries({v for c in cells for v in (c[0], c[2])})
        ys = list(reversed(_boundaries({v for c in cells for v in (c[1], c[3])})))  # de arriba hacia abajo
        out = []
        for c in cells:
            col, row = _nearest(xs, c[0]), _nearest(ys, c[3])
            out.append({
                'bbox': c, 'row': row, 'col': col,
                'colspan': max(1, _nearest(xs, c[2]) - col), 'rowspan': max(1, _nearest(ys, c[1]) - row),
                'frags': [], 'alt': [], 'graphic': False,
            })
        b = t.bbox
        tables.append({'bbox': (b[0], height - b[3], b[2], height - b[1]), 'cells': out, 'nested': False, 'unassigned': 0, 'altUnassigned': 0})
    inside = lambda a, b: a[0] >= b[0] - 1 and a[1] >= b[1] - 1 and a[2] <= b[2] + 1 and a[3] <= b[3] + 1
    for a in tables:
        for b in tables:
            if a is not b and inside(a['bbox'], b['bbox']):
                a['nested'] = b['nested'] = True
    return tables


def _inside(box, x, y, pad=0.0):
    return box[0] - pad <= x <= box[2] + pad and box[1] - pad <= y <= box[3] + pad


def _cell_at(table, x, y):
    for c in table['cells']:
        if _inside(c['bbox'], x, y):
            return c
    return None


def _on_border(g, table):
    """Un trazo que es borde de una celda (línea fina sobre un lado) o su fondo (rectángulo del tamaño de la celda o de la tabla)."""
    horizontal, vertical = g[3] - g[1] <= 2.0, g[2] - g[0] <= 2.0
    for c in table['cells'] + [{'bbox': table['bbox']}]:
        b = c['bbox']
        if horizontal and min(abs((g[1] + g[3]) / 2 - b[1]), abs((g[1] + g[3]) / 2 - b[3])) <= 2.0 and g[0] < b[2] and g[2] > b[0]:
            return True
        if vertical and min(abs((g[0] + g[2]) / 2 - b[0]), abs((g[0] + g[2]) / 2 - b[2])) <= 2.0 and g[1] < b[3] and g[3] > b[1]:
            return True
        if all(abs(u - v) <= 2.0 for u, v in zip(g, b)):
            return True
    return False


def _visual_lines(frags):
    """Tramos de una celda → líneas de arriba hacia abajo (solapamiento vertical ≥ 0,5), cada una de izquierda a derecha."""
    lines = []
    for f in sorted(frags, key=lambda f: (-(f['y0'] + f['y1']) / 2, f['x0'])):
        best = None
        for ln in lines[-3:]:
            ov = min(f['y1'], ln['y1']) - max(f['y0'], ln['y0'])
            h = min(f['y1'] - f['y0'], ln['y1'] - ln['y0']) or 1.0
            if ov / h >= 0.5:
                best = ln
        if best is None:
            lines.append({'y0': f['y0'], 'y1': f['y1'], 'frags': [f]})
        else:
            best['frags'].append(f)
            best['y0'], best['y1'] = min(best['y0'], f['y0']), max(best['y1'], f['y1'])
    return [sorted(ln['frags'], key=lambda f: f['x0']) for ln in lines]


def _cell_out(c):
    """Celda → `{text, html?, colspan?, rowspan?, graphic?, alt}`: líneas unidas con salto de línea, tramos de una línea con tabulador."""
    lines = _visual_lines(c['frags'])
    texts, htmls, marked = [], [], False
    for ln in lines:
        parts = [markup(f['items']) for f in ln]
        texts.append('\t'.join(t.strip() if i else t.rstrip() for i, (t, _) in enumerate(parts)))
        htmls.append('\t'.join((h if h else escape(t)).strip() if i else (h if h else escape(t)).rstrip() for i, (t, h) in enumerate(parts)))
        marked = marked or any(h for _, h in parts)
    out = {'text': '\n'.join(texts)}
    if marked:
        out['html'] = '<br>'.join(htmls)
    if c['colspan'] > 1:
        out['colspan'] = c['colspan']
    if c['rowspan'] > 1:
        out['rowspan'] = c['rowspan']
    if c['graphic']:
        out['graphic'] = True
    out['alt'] = ' '.join(c['alt'])
    return out


def page_rows(page, tables=(), words=()):
    """
    Filas de texto de arriba hacia abajo. Una línea entra en la fila con la que más se solapa en vertical (al menos
    la mitad de la menor de las dos alturas): así un número de sección o una viñeta dibujados en otra columna, con
    la línea base apenas corrida, quedan en su fila y no en la anterior. Dentro de la fila, de izquierda a derecha,
    unidas con tabulador.
    Las líneas dentro de una tabla de la grilla (`tables`, de `grid_tables`) no forman filas: cada glifo va a su celda
    y la tabla ocupa una fila con `grid`. `words` (de `pdftotext -bbox`) se reparten por celda y por fila en `alt`.
    """
    lines = [ln for ln in text_lines(page) if ln.get_text().strip()]
    emitted = sum(1 for ln in lines for c in ln if isinstance(c, LTChar))
    total = count_chars(page)
    blank = sum(1 for ln in text_lines(page) if not ln.get_text().strip() for c in ln if isinstance(c, LTChar))
    incomplete = emitted + blank != total
    lines.sort(key=lambda l: (-(l.y0 + l.y1) / 2, l.x0))
    boxes = table_boxes(page)
    rows = []  # cada fila: {'y0', 'y1', 'parts': [(x0, texto, en_tabla)]} o, la de una tabla, {'y0', 'y1', 'grid'}
    for ln in lines:
        cx, cy = (ln.x0 + ln.x1) / 2, (ln.y0 + ln.y1) / 2
        grid = next((t for t in tables if _inside(t['bbox'], cx, cy)), None)
        if grid is not None:
            cur, buf = None, []

            def flush():
                while buf and isinstance(buf[-1], LTAnno):
                    buf.pop()
                if cur is not None and buf:
                    cs = [i for i in buf if isinstance(i, LTChar)]
                    cur['frags'].append({'items': list(buf), 'x0': min(i.x0 for i in cs), 'y0': min(i.y0 for i in cs), 'y1': max(i.y1 for i in cs)})

            for item in ln:
                if isinstance(item, LTChar):
                    c = _cell_at(grid, (item.x0 + item.x1) / 2, (item.y0 + item.y1) / 2)
                    if c is None:
                        grid['unassigned'] += 1
                    if c is not cur:
                        flush()
                        cur, buf = c, []
                    if c is not None:
                        buf.append(item)
                elif isinstance(item, LTAnno) and cur is not None:
                    buf.append(item)
            flush()
            continue
        best, best_ov = None, 0.0
        for r in rows[-3:]:
            ov = min(ln.y1, r['y1']) - max(ln.y0, r['y0'])
            h = min(ln.y1 - ln.y0, r['y1'] - r['y0']) or 1.0
            if ov / h >= 0.5 and ov / h > best_ov:
                best, best_ov = r, ov / h
        in_table = any(b[0] - 1 <= cx <= b[2] + 1 and b[1] - 1 <= cy <= b[3] + 1 for b in boxes)
        # Una línea fuera de la grilla pero a su altura (un rótulo al costado, una cifra de una figura) no es texto corrido:
        # se marca como tabla, igual que cuando compartía fila con las líneas de la tabla.
        h = (ln.y1 - ln.y0) or 1.0
        in_table = in_table or any((min(ln.y1, t['bbox'][3]) - max(ln.y0, t['bbox'][1])) / h >= 0.5 for t in tables)
        text, html = line_markup(ln)
        part = (ln.x0, text.rstrip(), in_table, html.rstrip() if html else None)
        if best is None:
            rows.append({'y0': ln.y0, 'y1': ln.y1, 'x0': ln.x0, 'x1': ln.x1, 'parts': [part], 'alt': []})
        else:
            best['parts'].append(part)
            best['y0'], best['y1'] = min(best['y0'], ln.y0), max(best['y1'], ln.y1)
            best['x0'], best['x1'] = min(best['x0'], ln.x0), max(best['x1'], ln.x1)
    for t in tables:
        if any(c['frags'] for c in t['cells']):
            rows.append({'y0': t['bbox'][1], 'y1': t['bbox'][3], 'x0': t['bbox'][0], 'x1': t['bbox'][2], 'grid': t})
    rows.sort(key=lambda r: -(r['y0'] + r['y1']) / 2)
    # Palabras del otro extractor: a la celda o a la fila que contiene su centro; las que no caen en ninguna se cuentan.
    alt_unassigned = 0
    for w in words:
        wx, wy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
        grid = next((t for t in tables if _inside(t['bbox'], wx, wy)), None)
        if grid is not None:
            c = _cell_at(grid, wx, wy)
            if c is None:
                grid['altUnassigned'] += 1
            else:
                c['alt'].append(w[4])
            continue
        r = next((r for r in rows if 'grid' not in r and r['y0'] - 1 <= wy <= r['y1'] + 1 and r['x0'] - 2 <= wx <= r['x1'] + 2), None)
        if r is None:
            alt_unassigned += 1
        else:
            r['alt'].append(w[4])
    # Trazos fuera de las grillas de tabla: si caen dentro de la franja de una fila, la fila puede tener un símbolo dibujado.
    all_strokes = [el.bbox for el in page if isinstance(el, (LTRect, LTLine, LTCurve)) and el.width < page.width * 0.9]
    curves = [el.bbox for el in page if isinstance(el, LTCurve) and not isinstance(el, (LTRect, LTLine))]
    # Un subrayado (trazo horizontal fino de al menos 12 pt) no es un símbolo: no marca la fila ni la celda.
    underline = lambda g: g not in curves and g[3] - g[1] <= 1.5 and g[2] - g[0] >= 12
    strokes = [g for g in all_strokes if not any(b[0] - 1 <= g[0] and g[2] <= b[2] + 1 and b[1] - 1 <= g[1] and g[3] <= b[3] + 1 for b in boxes)]
    strokes = [g for g in strokes if not underline(g)]
    # Dentro de una tabla de la grilla, un trazo que no es borde ni fondo de una celda marca la celda donde cae.
    for t in tables:
        for g in all_strokes:
            gx, gy = (g[0] + g[2]) / 2, (g[1] + g[3]) / 2
            if _inside(t['bbox'], gx, gy, 1.0) and not _on_border(g, t) and not underline(g):
                c = _cell_at(t, gx, gy)
                if c is not None:
                    c['graphic'] = True
    for r in rows:
        if 'grid' not in r:
            r['graphic'] = any(r['y0'] - 1 <= (g[1] + g[3]) / 2 <= r['y1'] + 1 and g[0] <= r['x1'] + 10 and g[2] >= r['x0'] - 10 for g in strokes)
    out = []
    for r in rows:
        if 'grid' in r:
            t = r['grid']
            matrix = {}
            for c in sorted(t['cells'], key=lambda c: (c['row'], c['col'])):
                matrix.setdefault(c['row'], []).append(_cell_out(c))
            grid = {'rows': [matrix[k] for k in sorted(matrix)]}
            for flag in ('nested', 'unassigned', 'altUnassigned'):
                if t[flag]:
                    grid[flag] = t[flag]
            text = '\n'.join('\t'.join(c['text'] for c in row) for row in grid['rows'])
            out.append({'text': text, 'y': r['y0'], 'table': True, 'html': None, 'graphic': False, 'grid': grid})
            continue
        parts = sorted(r['parts'], key=lambda p: p[0])
        text = parts[0][1] + ''.join('\t' + p[1].strip() for p in parts[1:])
        html = None
        if any(p[3] for p in parts):
            hs = [p[3] if p[3] else escape(p[1]) for p in parts]
            html = hs[0] + ''.join('\t' + h.strip() for h in hs[1:])
        out.append({'text': text, 'y': r['y0'], 'table': any(p[2] for p in parts), 'html': html, 'graphic': r['graphic'], 'alt': ' '.join(r['alt'])})
    if out and 'grid' not in out[-1] and out[-1]['text'].strip().isdigit() and out[-1]['y'] < 90:
        out.pop()
    rows_out = []
    for r in out:
        row = {'text': r['text'], 'table': r['table']}
        if r['html']:
            row['html'] = r['html']
        if r['graphic']:
            row['graphic'] = True
        if incomplete:
            row['incomplete'] = True
        if 'grid' in r:
            row['grid'] = r['grid']
        elif words:
            row['alt'] = r['alt']
        rows_out.append(row)
    return rows_out, alt_unassigned


PDFTOTEXT_WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')


def pdftotext_words(pdf):
    """`pdftotext -bbox` (poppler) → por página, palabras `(x0, y0, x1, y1, texto)` en coordenadas de pdfminer."""
    xml = subprocess.run(['pdftotext', '-bbox', '-enc', 'UTF-8', pdf, '-'], check=True, capture_output=True).stdout.decode('utf-8')
    pages = []
    for chunk in xml.split('<page ')[1:]:
        height = float(re.search(r'height="([\d.]+)"', chunk).group(1))
        pages.append([(float(a), height - float(d), float(c), height - float(b), unescape(t)) for a, b, c, d, t in PDFTOTEXT_WORD.findall(chunk)])
    return pages


def extract(args):
    symbol_path, out_dir, pdf = args
    out = os.path.join(out_dir, os.path.basename(pdf)[:-4] + '.rows.json')
    if os.path.exists(out):
        return out
    try:
        result = extract_pdf(symbol_path, pdf)
    except Exception as err:  # PDF ilegible: se registra y no se publica nada de él.
        result = {'pdf': os.path.basename(pdf), 'error': f'{type(err).__name__}: {err}', 'pages': [], 'chars': 0, 'unresolved': 0, 'fonts': {}}
    tmp = out + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)
    os.replace(tmp, out)
    return out


def extract_pdf(symbol_path, pdf):
    table = load_symbol_table(symbol_path)
    rsrc = PDFResourceManager()
    dev = LiteralAggregator(rsrc, table, LAParams(all_texts=True))
    interp = PDFPageInterpreter(rsrc, dev)
    words = pdftotext_words(pdf)
    pages, started, chars, unresolved = [], False, 0, 0
    with open(pdf, 'rb') as f, pdfplumber.open(pdf) as plumber:
        for n, p in enumerate(PDFPage.get_pages(f), start=1):
            interp.process_page(p)
            layout = dev.get_result()
            rows, _ = page_rows(layout)
            texts = [r['text'].strip() for r in rows]
            if not started and 'ANEXO I' not in texts:
                continue
            started = True
            page_words = words[n - 1] if n - 1 < len(words) else []
            tables = []
            if table_boxes(layout):
                pp = plumber.pages[n - 1]
                # Sólo con el mismo sistema de coordenadas en los dos (sin rotación ni origen corrido); si no, la tabla queda sin celdas.
                if pp.rotation == 0 and tuple(round(v, 1) for v in pp.bbox) == (0.0, 0.0, round(layout.width, 1), round(layout.height, 1)) and layout.bbox[:2] == (0, 0):
                    tables = grid_tables(pp, layout.height)
                pp.close()
            rows, alt_unassigned = page_rows(layout, tables, page_words)
            pages.append({'page': n, 'rows': rows, **({'altUnassigned': alt_unassigned} if alt_unassigned else {})})
            for r in rows:
                chars += len(r['text'])
                unresolved += r['text'].count(REPLACEMENT)
            if 'ANEXO II' in texts:
                break
    return {'pdf': os.path.basename(pdf), 'pages': pages, 'chars': chars, 'unresolved': unresolved, 'fonts': dev.fonts}


def main():
    symbol_path, out_dir, pdfs = sys.argv[1], sys.argv[2], sys.argv[3:]
    os.makedirs(out_dir, exist_ok=True)
    jobs = [(symbol_path, out_dir, p) for p in pdfs]
    workers = int(os.environ.get('EMA_PI_WORKERS', '1'))
    done = 0
    if workers > 1:
        with Pool(workers) as pool:
            for _ in pool.imap_unordered(extract, jobs):
                done += 1
                if done % 50 == 0:
                    print(f'[ema-pi-extract] {done}/{len(jobs)}', flush=True)
    else:
        for j in jobs:
            extract(j)
            done += 1
    print(f'[ema-pi-extract] {done}/{len(jobs)}', flush=True)


if __name__ == '__main__':
    main()
