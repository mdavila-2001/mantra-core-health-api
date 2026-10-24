"""Pruebas del corrector de OCR del arancel (casos REALES del Arancel de Honorarios
Médicos de Santa Cruz 2025). Correr: python3 -m unittest tools/bolivia-datasets/test_ocr_es.py"""
import unittest
from pathlib import Path

from ocr_es import LEXICO_VERSIONADO, Lexico, corregir_texto

LEXICO = Lexico.leer(Path(__file__).with_name(LEXICO_VERSIONADO))


def corregido(texto: str) -> str:
    return corregir_texto(texto, LEXICO)[0]


class CorreccionDeLetras(unittest.TestCase):
    def test_digitos_y_tildes_confundidos(self):
        self.assertEqual(corregido("Embarazo ect6pico"), "Embarazo ectópico")
        self.assertEqual(corregido("Cardioversién eléctrica de emergencia"), "Cardioversión eléctrica de emergencia")
        self.assertEqual(corregido("Fototerapia corporal total, por sesi6n"), "Fototerapia corporal total, por sesión")

    def test_confusiones_de_varias_letras(self):
        self.assertEqual(corregido("Laparoscopia quinirgica"), "Laparoscopia quirúrgica")
        self.assertEqual(corregido("cuerpo extrafio"), "cuerpo extraño")
        self.assertEqual(corregido("Blopsia"), "Biopsia")
        self.assertEqual(corregido("Hemia"), "Hernia")

    def test_guion_de_fin_de_linea_y_conjunciones(self):
        self.assertEqual(
            corregido("Pleurodesis quimica (Incluye drenale pleural, @ instilacién de subs- tancias)."),
            "Pleurodesis química (Incluye drenale pleural, e instilación de substancias).",
        )
        self.assertEqual(corregido("Tenolisis @ nivel del pie"), "Tenolisis a nivel del pie")
        self.assertEqual(corregido("con 0 sin compromiso"), "con o sin compromiso")
        self.assertEqual(corregido("derecho yio Izquierdo"), "derecho y/o Izquierdo")

    def test_lo_que_no_se_toca(self):
        # Importes y códigos anatómicos quedan exactamente como vienen.
        self.assertEqual(corregido("axis (c1-c2) con injerto 34,066"), "axis (c1-c2) con injerto 34,066")
        self.assertEqual(corregido("Fractura L4 y T12"), "Fractura L4 y T12")
        # Un pedazo de palabra cortada que no se puede unir con certeza no se «corrige».
        texto, _, pendientes = corregir_texto("inmovil- zaci6n con minerva", LEXICO)
        self.assertTrue(texto.startswith("inmovil- "))
        self.assertIn("inmovil- zaci6n", pendientes)


if __name__ == "__main__":
    unittest.main()
