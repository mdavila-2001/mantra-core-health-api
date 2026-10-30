"""
Pruebas del extractor verificado con un PDF real de la EMA (Deferasirox Accord,
información de producto en castellano) y la tabla oficial de Adobe/Unicode.

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


if __name__ == '__main__':
    unittest.main()
