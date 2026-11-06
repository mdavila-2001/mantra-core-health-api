"""
Pruebas del extractor verificado con PDF reales de la EMA (información de
producto en castellano: Deferasirox Accord y Besremi) y la tabla oficial de
Adobe/Unicode.

Uso: python3 -I -m unittest discover -s tools/terminology-import/clinical-pharmacology/py -p 'test_*.py'
     (con pdfminer.six de py/requirements.txt instalado)
"""
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ema_pi_extract as x  # noqa: E402

FIX = os.path.join(HERE, '..', 'test', 'fixtures', 'ema-pi')
SYMBOL = os.path.join(FIX, 'adobe-symbol.txt')


class FakeFont:
    def __init__(self, fontname, unicode_map=None, encoding=None):
        self.fontname = fontname
        self.unicode_map = unicode_map
        self._encoding = encoding or {}

    def to_unichr(self, cid):
        if cid in self._encoding:
            return self._encoding[cid]
        raise x.PDFUnicodeNotDefined(None, cid)


class FakeMap:
    def __init__(self, m):
        self.m = m

    def get_unichr(self, cid):
        return self.m[cid]


class SymbolTable(unittest.TestCase):
    def setUp(self):
        self.t = x.load_symbol_table(SYMBOL)

    def test_greaterequal_bullet(self):
        self.assertEqual(x.symbol_char(self.t[0xB3]), '≥')
        self.assertEqual(x.symbol_char(self.t[0xB7]), '•')

    def test_equivalentes_nfkc(self):
        self.assertEqual(x.symbol_char(self.t[0x6D]), 'μ', 'µ (U+00B5) y μ (U+03BC) son el mismo carácter en NFKC')

    def test_no_equivalentes_y_cus(self):
        self.assertEqual(x.symbol_char(self.t[0x44]), x.REPLACEMENT, 'Δ U+0394 y ∆ U+2206 no son iguales en NFKC')
        self.assertEqual(x.symbol_char(self.t[0x60]), x.REPLACEMENT, 'radicalex es Corporate Use')


class LiteralChar(unittest.TestCase):
    def setUp(self):
        self.t = x.load_symbol_table(SYMBOL)

    def test_symbol_pua_por_tounicode(self):
        font = FakeFont('BCDJEE+SymbolMT', unicode_map=FakeMap({5: ''}))
        self.assertEqual(x.literal_text(font, 5, self.t), '≥')

    def test_simbolica_sin_tounicode_no_se_adivina(self):
        font = FakeFont('SymbolMT', encoding={0xB3: '³'})
        self.assertEqual(x.literal_text(font, 0xB3, self.t), x.REPLACEMENT, 'la codificación WinAnsi diría «³»')

    def test_fuente_de_texto_por_codificacion(self):
        font = FakeFont('TimesNewRomanPSMT', encoding={0xED: 'í'})
        self.assertEqual(x.literal_text(font, 0xED, self.t), 'í')

    def test_pua_fuera_de_symbol(self):
        font = FakeFont('Wingdings-Regular', unicode_map=FakeMap({1: ''}))
        self.assertEqual(x.literal_text(font, 1, self.t), x.REPLACEMENT)


class RealPdf(unittest.TestCase):
    def test_deferasirox_accord(self):
        with tempfile.TemporaryDirectory() as out:
            path = x.extract((SYMBOL, out, os.path.join(FIX, 'deferasirox-accord_es.pdf')))
            with open(path, encoding='utf-8') as f:
                doc = json.load(f)
        rows = [r for p in doc['pages'] for r in p['rows']]
        texts = [r['text'] for r in rows]
        self.assertEqual(doc['unresolved'], 0)
        self.assertIn('ANEXO I', [t.strip() for t in texts])
        self.assertIn('ANEXO II', [t.strip() for t in texts], 'se corta al empezar el anexo II')
        self.assertTrue(any('(≥ 7 ml/kg/mes de concentrado de hematíes)' in t for t in texts), 'pdftotext lo dejaba en «( 7 ml/kg/mes»')
        self.assertTrue(any('ferritina sérica > 1 000 μg/l' in t for t in texts))
        self.assertTrue(any(r['table'] for r in rows), 'las tablas de dosificación quedan marcadas')
        self.assertIn('2.\tCOMPOSICIÓN CUALITATIVA Y CUANTITATIVA', texts, 'el número de sección va antes del título aunque esté en otra columna')
        self.assertTrue(any('50 000/mm<sup>3</sup> (50 x 10<sup>9</sup>/l)' in (r.get('html') or '') for r in rows), 'superíndices en html')
        self.assertFalse(any(t.strip().isdigit() and len(t.strip()) <= 3 for t in texts[-3:]), 'sin número de página al final')


class VectorSymbol(unittest.TestCase):
    def test_besremi_mayor_o_igual_dibujado(self):
        """En Besremi, 4.3, el «≥» de «clase ≥ 2 de la NYHA» es una curva y una barra, no un glifo."""
        with tempfile.TemporaryDirectory() as out:
            path = x.extract((SYMBOL, out, os.path.join(FIX, 'besremi_es.pdf')))
            with open(path, encoding='utf-8') as f:
                doc = json.load(f)
        rows = [r for p in doc['pages'] for r in p['rows']]
        nyha = [r for r in rows if 'clase' in r['text'] and 'NYHA' in r['text']]
        self.assertEqual(len(nyha), 1)
        self.assertEqual(nyha[0]['text'], 'insuficiencia cardiaca congestiva (clase\t2 de la NYHA), arritmia cardiaca grave, estenosis')
        self.assertTrue(nyha[0].get('graphic'), 'la fila queda marcada: el símbolo no está en el texto')
        self.assertFalse(any(r.get('graphic') for r in rows if r['text'].strip() in ('Posología', 'Embarazo')), 'un subrayado no marca la fila')
        self.assertFalse(any(r.get('incomplete') for r in rows), 'todos los glifos de la página llegan a las filas')


class GridTables(unittest.TestCase):
    """Tablas de Deferasirox Accord (4.2): celdas de la grilla, texto literal por celda y palabras de pdftotext en la misma celda."""

    @classmethod
    def setUpClass(cls):
        with tempfile.TemporaryDirectory() as out:
            path = x.extract((SYMBOL, out, os.path.join(FIX, 'deferasirox-accord_es.pdf')))
            with open(path, encoding='utf-8') as f:
                cls.doc = json.load(f)
        cls.grids = [(p['page'], r['grid']) for p in cls.doc['pages'] for r in p['rows'] if 'grid' in r]

    def test_celdas_de_la_dosis_inicial(self):
        page, g = self.grids[0]
        self.assertEqual(page, 4)
        first = g['rows'][0]
        self.assertEqual([(c['text'], c.get('colspan')) for c in first], [('Dosis inicial recomendada', 4)], 'fila de título: una celda que abarca las 4 columnas')
        self.assertEqual([c['text'] for c in g['rows'][2]][:2], ['>1 000 μg/l', 'o'])
        self.assertEqual(g['rows'][2][3]['text'], '14 mg/kg/día')
        self.assertTrue(all(c['alt'] == c['text'] for c in g['rows'][2] if '\n' not in c['text']), 'pdftotext ve las mismas palabras en cada celda')

    def test_celda_de_varias_lineas(self):
        _, g = self.grids[1]
        self.assertEqual(g['rows'][1][0]['text'].split('\n')[0], 'Persistentemente > 2 500', 'las líneas de una celda se unen con salto de línea')

    def test_completitud_y_anidadas(self):
        self.assertTrue(all(not g.get('unassigned') for _, g in self.grids), 'todo glifo de una tabla cae en una celda')
        nested = [p for p, g in self.grids if g.get('nested')]
        self.assertEqual(nested, [9], 'la página 9 tiene una tabla dentro de otra: la exterior (la que recibe los glifos) queda marcada')

    def test_filas_fuera_de_tabla_con_palabras_de_pdftotext(self):
        rows = [r for p in self.doc['pages'] for r in p['rows'] if 'grid' not in r]
        self.assertTrue(all('alt' in r for r in rows))
        row = next(r for r in rows if '(≥ 7 ml/kg/mes de concentrado de hematíes)' in r['text'])
        self.assertIn('7 ml/kg/mes', row['alt'])


class CellBorders(unittest.TestCase):
    TABLE = {'bbox': (0, 0, 200, 100), 'cells': [{'bbox': (0, 50, 100, 100)}, {'bbox': (100, 50, 200, 100)}, {'bbox': (0, 0, 200, 50)}]}

    def test_borde_y_fondo(self):
        self.assertTrue(x._on_border((0, 49.6, 200, 50.4), self.TABLE), 'línea horizontal sobre el borde entre filas')
        self.assertTrue(x._on_border((99.5, 50, 100.5, 100), self.TABLE), 'línea vertical entre columnas')
        self.assertTrue(x._on_border((0, 50, 100, 100), self.TABLE), 'fondo del tamaño de la celda')

    def test_trazo_dentro_de_la_celda(self):
        self.assertFalse(x._on_border((40, 70, 46, 78), self.TABLE), 'un símbolo dibujado dentro de la celda no es borde')


class Frames(unittest.TestCase):
    def test_titulo_de_seccion_en_una_celda(self):
        """Una «tabla» con un título de sección dentro es un marco (Imaavy, pág. 2; Constella, 5.3)."""
        for line in ('1.\tNOMBRE DEL MEDICAMENTO', '4.2\tPosología y forma de administración', '5.3  Datos preclínicos sobre seguridad', 'ANEXO I'):
            self.assertTrue(x.QRD_HEADING.match(line), line)
        for line in ('1 Independientemente de la gravedad', '11. La aleatorización fue estratificada', '4.5 mg/kg', '30\tPlacebo'):
            self.assertFalse(x.QRD_HEADING.match(line), f'nota al pie o celda de datos: {line}')


if __name__ == '__main__':
    unittest.main()
