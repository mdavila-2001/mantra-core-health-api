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
Por línea: marca `table` si cae dentro de una grilla dibujada (bordes LTRect/
LTLine agrupados), porque el texto plano no conserva la estructura de una tabla.
Los superíndices y subíndices (más chicos y con la línea base corrida, p. ej. el
9 de «10⁹/l») no caben en el texto plano: la fila lleva además `html` con
<sup>/<sub>, como el HTML de CIMA.
Se quita el número de página (última fila de la página, sólo dígitos).

Uso: python3 -I ema_pi_extract.py <symbol.txt> <salida-dir> <pdf>...
     escribe <salida-dir>/<nombre>.rows.json por PDF (lo ya escrito no se repite).
"""
import json
import os
import sys
import unicodedata
from multiprocessing import Pool

from pdfminer.converter import PDFPageAggregator
from html import escape
from statistics import median

from pdfminer.layout import LAParams, LTAnno, LTChar, LTCurve, LTLine, LTRect, LTTextContainer, LTTextLine
from pdfminer.pdffont import PDFUnicodeNotDefined
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage

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
    chars = [c for c in ln if isinstance(c, LTChar)]
    text = ln.get_text().rstrip('\n')
    if not chars:
        return text, None
    sizes = {}
    for c in chars:
        sizes[round(c.size, 1)] = sizes.get(round(c.size, 1), 0) + 1
    dom = max(sizes, key=sizes.get)
    base = median(c.y0 for c in chars if round(c.size, 1) == dom)
    out, cur, buf, marked = [], None, [], False
    for item in ln:
        if not isinstance(item, (LTChar, LTAnno)):
            continue
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


def page_rows(page):
    """
    Filas de texto de arriba hacia abajo. Una línea entra en la fila con la que más se solapa en vertical (al menos
    la mitad de la menor de las dos alturas): así un número de sección o una viñeta dibujados en otra columna, con
    la línea base apenas corrida, quedan en su fila y no en la anterior. Dentro de la fila, de izquierda a derecha,
    unidas con tabulador.
    """
    lines = []
    for el in page:
        if isinstance(el, LTTextContainer):
            for ln in el:
                if isinstance(ln, LTTextLine) and ln.get_text().strip():
                    lines.append(ln)
    lines.sort(key=lambda l: (-(l.y0 + l.y1) / 2, l.x0))
    boxes = table_boxes(page)
    rows = []  # cada fila: {'y0', 'y1', 'parts': [(x0, texto, en_tabla)]}
    for ln in lines:
        best, best_ov = None, 0.0
        for r in rows[-3:]:
            ov = min(ln.y1, r['y1']) - max(ln.y0, r['y0'])
            h = min(ln.y1 - ln.y0, r['y1'] - r['y0']) or 1.0
            if ov / h >= 0.5 and ov / h > best_ov:
                best, best_ov = r, ov / h
        cx, cy = (ln.x0 + ln.x1) / 2, (ln.y0 + ln.y1) / 2
        in_table = any(b[0] - 1 <= cx <= b[2] + 1 and b[1] - 1 <= cy <= b[3] + 1 for b in boxes)
        text, html = line_markup(ln)
        part = (ln.x0, text.rstrip(), in_table, html.rstrip() if html else None)
        if best is None:
            rows.append({'y0': ln.y0, 'y1': ln.y1, 'parts': [part]})
        else:
            best['parts'].append(part)
            best['y0'], best['y1'] = min(best['y0'], ln.y0), max(best['y1'], ln.y1)
    rows.sort(key=lambda r: -(r['y0'] + r['y1']) / 2)
    out = []
    for r in rows:
        parts = sorted(r['parts'], key=lambda p: p[0])
        text = parts[0][1] + ''.join('\t' + p[1].strip() for p in parts[1:])
        html = None
        if any(p[3] for p in parts):
            hs = [p[3] if p[3] else escape(p[1]) for p in parts]
            html = hs[0] + ''.join('\t' + h.strip() for h in hs[1:])
        out.append({'text': text, 'y': r['y0'], 'table': any(p[2] for p in parts), 'html': html})
    if out and out[-1]['text'].strip().isdigit() and out[-1]['y'] < 90:
        out.pop()
    return [{'text': r['text'], 'table': r['table'], **({'html': r['html']} if r['html'] else {})} for r in out]


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
    dev = LiteralAggregator(rsrc, table, LAParams())
    interp = PDFPageInterpreter(rsrc, dev)
    pages, started, chars, unresolved = [], False, 0, 0
    with open(pdf, 'rb') as f:
        for n, p in enumerate(PDFPage.get_pages(f), start=1):
            interp.process_page(p)
            rows = page_rows(dev.get_result())
            texts = [r['text'].strip() for r in rows]
            if not started and 'ANEXO I' not in texts:
                continue
            started = True
            pages.append({'page': n, 'rows': rows})
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
