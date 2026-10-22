"""Corrección de errores de OCR en el arancel escaneado, contra un léxico oficial.

El «Arancel de Honorarios Médicos de Santa Cruz 2025» llega como OCR de un PDF
escaneado: «Resecci6n», «atencién», «Reduccién @ inmovilizacién»,
«aneste- si6logo». El PDF original no está disponible, así que esto corrige
SÓLO LETRAS y sólo cuando el resultado es una palabra que existe en un léxico
oficial en castellano:

- los nombres de CIE-10-ES Diagnósticos y Procedimientos 2026 (Ministerio de
  Sanidad de España), que traen el vocabulario médico y el castellano corriente
  de las descripciones de procedimientos;
- las palabras del propio arancel que ya aparecen bien escritas en filas sin
  marca de OCR (frecuencia ≥ 3).

Nunca toca números: un importe dudoso no se adivina, se marca. Lo que no se
resuelve con certeza queda tal cual y la fila sale con `revisionPendiente`.

Reglas:
1. Palabra cortada por fin de línea («aneste- si6logo») → se une si la unión,
   corregida, está en el léxico.
2. Carácter suelto «@»: es la conjunción mal leída. «e» antes de palabra que
   empieza por «i»/«hi» (regla del castellano), «a» en el resto («Tenolisis @
   nivel» → «a nivel»).
3. Basura tipográfica en los bordes de una palabra (‘ ’ § © ® « » ~ |) se quita.
4. Palabra que no está en el léxico: se prueban las confusiones típicas del OCR
   (6→ó, 0→o, 1→l/í, é→ó/á/í/e, i→ú/í, a→á, e→é, o→ó, u→ú, rn→m) de a una y de a
   dos; vale el único candidato del léxico, o el más frecuente si hay varios.
"""
from __future__ import annotations

# Léxico versionado: lo genera `python ocr_es.py <glossary-data-build>/ndjson`.
LEXICO_VERSIONADO = "lexico-es-medico.tsv"

import json
import re
import unicodedata
from collections import Counter
from itertools import combinations
from pathlib import Path

BASURA_EN_BORDES = "‘’§©®«»~|\"'`´"
CONFUSIONES: dict[str, tuple[str, ...]] = {
    "6": ("ó",), "0": ("o",), "1": ("l", "í"),
    "é": ("ó", "á", "í", "e"), "i": ("ú", "í"), "a": ("á",), "e": ("é",), "o": ("ó",), "u": ("ú",),
    "l": ("i", "í"),
}
# Confusiones de VARIAS letras que el OCR del arancel comete con frecuencia
# (medidas sobre las palabras que quedaban sin resolver): la «ñ» leída como «fi»,
# «rú»/«úr» de «quirúrgico» leídas como «ni», «dr» o «ar», y «rn» ↔ «m».
CONFUSIONES_MULTIPLES: tuple[tuple[str, str], ...] = (
    ("fi", "ñ"), ("ni", "rú"), ("dr", "úr"), ("ar", "úr"), ("rn", "m"), ("m", "rn"),
)
PALABRAS_FIJAS = {"ylo": "y/o", "yio": "y/o", "det": "del"}
PALABRA = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+")


def _plano(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c)).lower()


class Lexico:
    """Palabras válidas, en minúscula y con tildes, con su frecuencia."""

    def __init__(self, palabras: Counter) -> None:
        self.frecuencia = palabras

    @classmethod
    def desde_corpus(cls, ndjson: list[Path], minimo: int = 2) -> "Lexico":
        """Palabras de los textos oficiales en castellano del glosario: nombres,
        definiciones, resúmenes y secciones (CIE-10-ES, MedlinePlus, fichas técnicas
        de CIMA). Las que aparecen menos de `minimo` veces se descartan: así una
        errata de la fuente no se vuelve «válida»."""
        c: Counter = Counter()

        def textos(fila: dict):
            yield fila.get("esName") or ""
            yield fila.get("definition") or ""
            yield fila.get("plainSummaryEs") or ""
            for sec in fila.get("sections") or []:
                yield sec.get("text") or ""
            for sec in (fila.get("drugFacts") or {}).get("sections") or []:
                yield sec.get("text") or ""

        for ruta in ndjson:
            with ruta.open(encoding="utf-8") as f:
                for linea in f:
                    for texto in textos(json.loads(linea)):
                        c.update(p.lower() for p in PALABRA.findall(texto) if not any(ch.isdigit() for ch in p))
        return cls(Counter({w: n for w, n in c.items() if n >= minimo}))

    def __contains__(self, palabra: str) -> bool:
        return palabra.lower() in self.frecuencia

    def guardar(self, ruta: Path) -> None:
        """Una palabra por línea con su frecuencia, ordenado: archivo versionable."""
        ruta.write_text("".join(f"{w}\t{n}\n" for w, n in sorted(self.frecuencia.items())), encoding="utf-8")

    @classmethod
    def leer(cls, ruta: Path) -> "Lexico":
        c: Counter = Counter()
        for linea in ruta.read_text(encoding="utf-8").splitlines():
            w, n = linea.split("\t")
            c[w] = int(n)
        return cls(c)


def _multiples(base: str) -> set[str]:
    """Cada confusión de varias letras, aplicada en cada posición donde aparece."""
    salida = set()
    for malo, bueno in CONFUSIONES_MULTIPLES:
        inicio = base.find(malo)
        while inicio != -1:
            salida.add(base[:inicio] + bueno + base[inicio + len(malo):])
            inicio = base.find(malo, inicio + 1)
    return salida


def _variantes(palabra: str) -> set[str]:
    """Las palabras que salen de aplicar una o dos confusiones de OCR de una letra,
    una confusión de varias letras, o una de varias más una de una letra."""
    base = palabra.lower()
    salida = _multiples(base)
    for m in list(salida):
        salida |= _simples(m, 1)
    salida |= _simples(base, 2)
    salida.discard(base)
    return salida


def _simples(base: str, hasta: int) -> set[str]:
    salida: set[str] = set()
    posiciones = [i for i, ch in enumerate(base) if ch in CONFUSIONES]
    for k in range(1, hasta + 1):
        for combo in combinations(posiciones, k):
            parciales = [base]
            for i in combo:
                parciales = [p[:i] + r + p[i + 1:] for p in parciales for r in CONFUSIONES[base[i]]]
            salida.update(parciales)
    return salida


def _con_caja(original: str, corregida: str) -> str:
    """La corrección con la misma caja que la palabra original."""
    if original.isupper():
        return corregida.upper()
    if original[:1].isupper():
        return corregida[:1].upper() + corregida[1:]
    return corregida


CODIGO_ANATOMICO = re.compile(r"[A-Za-z]{1,3}\d{1,3}")


def corregir_palabra(palabra: str, lexico: Lexico) -> tuple[str, bool]:
    """(palabra, resuelta). Sin dígitos ni basura es válida si está en el léxico.
    Los códigos como «C1», «L4» o «T12» (vértebras, pares craneales) no se tocan."""
    if palabra.lower() in lexico or palabra.isdigit() or CODIGO_ANATOMICO.fullmatch(palabra):
        return palabra, True
    candidatos = [v for v in _variantes(palabra) if v in lexico and not any(ch.isdigit() for ch in v)]
    if not candidatos:
        return palabra, False
    mejor = max(candidatos, key=lambda v: (lexico.frecuencia[v], v))
    return _con_caja(palabra, mejor), True


def corregir_texto(texto: str, lexico: Lexico) -> tuple[str, list[str], list[str]]:
    """(texto corregido, cambios «a→b», palabras sin resolver)."""
    cambios: list[str] = []
    pendientes: list[str] = []
    tokens = texto.split()
    salida: list[str] = []
    i = 0
    while i < len(tokens):
        tok = tokens[i].strip(BASURA_EN_BORDES)
        if tok != tokens[i]:
            cambios.append(f"{tokens[i]}→{tok}")
        if not tok:
            i += 1
            continue
        # 1 · palabra cortada por guion de fin de línea. Si la unión no da una
        # palabra del léxico, los dos pedazos quedan como están (un pedazo suelto
        # no se «corrige»: «inmo-» no es «inmóvil»).
        if tok.endswith("-") and len(tok) > 1 and i + 1 < len(tokens) and tokens[i + 1][:1].islower():
            sig = tokens[i + 1].strip(BASURA_EN_BORDES)
            final = re.match(r"^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)(.*)$", sig)
            if final:
                unida, ok = corregir_palabra(tok[:-1] + final.group(1), lexico)
                if ok:
                    cambios.append(f"{tok} {sig}→{unida}{final.group(2)}")
                    salida.append(unida + final.group(2))
                    i += 2
                    continue
            pendientes.append(f"{tok} {sig}")
            salida.extend([tok, sig])
            i += 2
            continue
        # «0» suelto entre palabras es la conjunción «o»; «yio», «y/o».
        if tok == "0" and salida and not salida[-1][-1:].isdigit() and i + 1 < len(tokens) and not tokens[i + 1][:1].isdigit():
            cambios.append("0→o")
            salida.append("o")
            i += 1
            continue
        if tok.lower() in PALABRAS_FIJAS:
            cambios.append(f"{tok}→{PALABRAS_FIJAS[tok.lower()]}")
            salida.append(PALABRAS_FIJAS[tok.lower()])
            i += 1
            continue
        # 2 · «@» suelto: la conjunción
        if tok == "@":
            sig = _plano(tokens[i + 1]) if i + 1 < len(tokens) else ""
            conj = "e" if re.match(r"^h?i(?![aeou])", sig) else "a"
            cambios.append(f"@→{conj}")
            salida.append(conj)
            i += 1
            continue
        # 4 · palabra por palabra, preservando la puntuación pegada
        partes = re.split(r"([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)", tok)
        nuevo = []
        for parte in partes:
            if parte and PALABRA.fullmatch(parte) and not parte.isdigit() and len(parte) > 1:
                corregida, ok = corregir_palabra(parte, lexico)
                if corregida != parte:
                    cambios.append(f"{parte}→{corregida}")
                if not ok:
                    pendientes.append(parte)
                nuevo.append(corregida)
            else:
                nuevo.append(parte)
        salida.append("".join(nuevo))
        i += 1
    return " ".join(salida), cambios, pendientes


if __name__ == "__main__":
    import sys

    carpeta = Path(sys.argv[1])
    fuentes = [carpeta / f for f in ("cie10es-diagnosticos.ndjson", "cie10es-procedimientos.ndjson",
                                     "medlineplus-es.ndjson", "medlineplus-es-pruebas.ndjson", "cima.ndjson")]
    lexico = Lexico.desde_corpus(fuentes)
    destino = Path(__file__).with_name(LEXICO_VERSIONADO)
    lexico.guardar(destino)
    print(f"léxico: {len(lexico.frecuencia)} palabras → {destino}")
