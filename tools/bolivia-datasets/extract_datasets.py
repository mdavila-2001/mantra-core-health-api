#!/usr/bin/env python3
"""Convierte los markdown del stakeholder en datasets JSON que el seed puede leer.

## Por qué existe

`markdown_convertidos/` son diez tablas markdown que salieron de PDFs y planillas
del stakeholder: aseguradoras, clínicas, hospitales, aranceles y las redes de
prestadores de dos compañías. Es el dato real que la plataforma tiene que
mostrar, pero en un formato que sirve para leer, no para cargar.

Este script es el puente. Lee esos markdown y emite JSON normalizado en
`src/common/seed/data/bolivia/`, que es lo que consumen los seeders. Existe como
script —y no como una conversión hecha a mano una vez— porque el stakeholder va a
mandar versiones nuevas: cuando eso pase, se vuelve a correr y se diffea el JSON.

## Lo que NO hace

**No arregla el OCR.** El arancel de honorarios advierte en su propia hoja de
metadatos que «El PDF es escaneado… conviene validar nombres, acentos, códigos y
UMA antes de cargar a producción», y se le nota: «Anestesiblogos», «Térax»,
«cardiol6gico». El script marca esas filas con `ocr_sospechoso: true` en vez de
adivinar qué decían, para que la revisión humana sepa dónde mirar. Inventar la
corrección sería peor que dejar el texto crudo: un nombre de estudio plausible
pero falso no se distingue del bueno.

## Uso

    python tools/bolivia-datasets/extract_datasets.py [--fuente RUTA] [--salida RUTA]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Iterable, Iterator

RAIZ_API = Path(__file__).resolve().parents[2]
# Los padrones viven en el repositorio del modelo, que se clona como hermano de
# este. Se reapunta con `--fuente` si están en otro lado.
FUENTE_POR_DEFECTO = RAIZ_API.parent / "mantra-core-health-model" / "markdown_convertidos"
SALIDA_POR_DEFECTO = RAIZ_API / "src" / "common" / "seed" / "data" / "bolivia"

# Marcas de daño de OCR: letras y dígitos mezclados dentro de una palabra, o
# caracteres que el reconocedor usa para rellenar lo que no pudo leer.
PATRON_OCR = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\d|\d[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}|[|©®~¢£¥§¤]")


# --------------------------------------------------------------------------- #
#  Lectura de tablas markdown
# --------------------------------------------------------------------------- #

def celdas(linea: str) -> list[str]:
    """Parte una fila markdown en celdas ya recortadas."""
    if not linea.strip().startswith("|"):
        return []
    partes = linea.strip().strip("|").split("|")
    return [p.strip() for p in partes]


def es_separador(fila: list[str]) -> bool:
    """Reconoce la fila `| --- | --- |` que separa cabecera de cuerpo."""
    return bool(fila) and all(re.fullmatch(r":?-{2,}:?", c) for c in fila if c)


def filas_de_tabla(lineas: Iterable[str]) -> Iterator[tuple[list[str], list[str]]]:
    """Emite `(cabecera, fila)` por cada fila de dato de cada tabla del archivo.

    Un mismo archivo puede traer varias tablas —el de aseguradoras trae dos
    apiladas más una columna suelta con las siglas de departamento—, así que la
    cabecera se rearma cada vez que aparece un separador nuevo.
    """
    cabecera: list[str] = []
    anterior: list[str] = []
    for linea in lineas:
        fila = celdas(linea)
        if not fila:
            anterior = []
            continue
        if es_separador(fila):
            cabecera = anterior
            continue
        if cabecera:
            yield cabecera, fila
        anterior = fila


def buscar(fuente: Path, *nombres: str) -> Path | None:
    """Encuentra un archivo del stakeholder aunque le hayan cambiado el nombre.

    Cada entrega renombra: la primera trajo
    `LISTADO_DE_ASEGURADORAS_1.md` y la de `RealDataSeeds/` el mismo listado como
    `LISTADO DE ASEGURADORAS.md` — guiones bajos por espacios, sin el sufijo. En
    vez de mantener dos listas de nombres literales, se compara **normalizado**:
    sin extensión, sin signos y sin el numeral final.
    """
    objetivos = {re.sub(r"\s*\d+$", "", normalizar(n)) for n in nombres}
    for candidato in sorted(fuente.glob("*.md")):
        clave = re.sub(r"\s*\d+$", "", normalizar(candidato.stem))
        if clave in objetivos:
            return candidato
    return None


def buscar_en_entregas(fuente: Path, *nombres: str) -> Path | None:
    """Busca un archivo en la carpeta de origen y en las entregas hermanas.

    El stakeholder no manda todo junto: los nueve primeros llegaron en
    `markdown_convertidos/` y la lista de farmacias/laboratorios apareció después
    en `RealDataSeeds/`. En vez de obligar a consolidar las carpetas a mano —lo
    que invita a mezclar versiones—, se mira primero en el origen indicado y
    después en las hermanas.
    """
    hallado = buscar(fuente, *nombres)
    if hallado is not None:
        return hallado
    for hermana in sorted(fuente.parent.iterdir()):
        if hermana.is_dir() and hermana != fuente:
            hallado = buscar(hermana, *nombres)
            if hallado is not None:
                return hallado
    return None


def exigir(fuente: Path, *nombres: str) -> Path:
    """Como `buscar`, pero falla con un mensaje útil si el archivo no está."""
    hallado = buscar(fuente, *nombres)
    if hallado is None:
        raise SystemExit(
            f"No se encontró «{nombres[0]}» en {fuente}. "
            f"Nombres probados: {', '.join(nombres)}"
        )
    return hallado


def leer(ruta: Path) -> list[str]:
    """Lee un markdown del stakeholder, venga como venga.

    Los primeros diez archivos llegaron en UTF-8 limpio. La entrega de
    `RealDataSeeds/` llegó exportada desde Excel con pandas y trae **dos capas de
    problema** encima:

    1. **UTF-16 con BOM**, que `read_text('utf-8')` ni siquiera abre.
    2. **Acentos rotos por partida doble**: el texto pasó por una consola de
       Windows y quedó guardado como si CP850 fuera Latin-1. Así,
       «Farmacia Chávez» se lee «Farmacia Chßvez» y «CRUCEÑO» sale «CRUCEÐO».

    Lo segundo se revierte re-codificando a CP850 y releyendo como Latin-1: el
    byte 0xE1 que CP850 muestra como «ß» es la «á» de Latin-1. Se aplica **sólo
    si el resultado mejora** —si el texto ya estaba bien, esa vuelta lo
    rompería—, y el criterio es contar caracteres imposibles en castellano.
    """
    crudo = ruta.read_bytes()
    if crudo[:2] in (b"\xff\xfe", b"\xfe\xff"):
        texto = crudo.decode("utf-16")
    else:
        texto = crudo.decode("utf-8")

    if _sospechoso_de_mojibake(texto):
        try:
            texto = texto.encode("cp850").decode("latin-1")
        except (UnicodeEncodeError, UnicodeDecodeError):
            # Si no convierte limpio no era este daño: mejor el texto original
            # que uno a medio arreglar.
            pass
    return texto.splitlines()


# Caracteres que CP850 usa para dibujar cajas y que no aparecen en un nombre de
# empresa boliviana: si están, el texto pasó por la consola.
_RASTRO_DE_CONSOLA = "ßÐ═░▒▄█┌┐└┘├┤┬┴┼"


def _sospechoso_de_mojibake(texto: str) -> bool:
    """Verdadero cuando el texto parece haber pasado por una consola DOS."""
    return sum(texto.count(c) for c in _RASTRO_DE_CONSOLA) > 3


def columna(cabecera: list[str], fila: list[str], *nombres: str) -> str:
    """Devuelve la celda de la primera columna cuyo título case con `nombres`."""
    for nombre in nombres:
        objetivo = normalizar(nombre)
        for i, titulo in enumerate(cabecera):
            if normalizar(titulo) == objetivo and i < len(fila):
                return fila[i].strip()
    return ""


def normalizar(texto: str) -> str:
    """Minúsculas sin tildes ni signos, para comparar títulos y claves."""
    plano = unicodedata.normalize("NFKD", texto)
    plano = "".join(c for c in plano if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", plano.lower()).strip()


def sospechoso_de_ocr(texto: str) -> bool:
    return bool(PATRON_OCR.search(texto))


def codigo(prefijo: str, texto: str, usados: set[str]) -> str:
    """Código estable, legible y único a partir del nombre.

    Se trunca para que sea legible, y cuando dos nombres largos colapsan en el
    mismo prefijo —el arancel tiene decenas: «Cierre de fistula meningea por via
    transinusal» y «…por via transfrontal»— se desempata con un hash del texto
    completo. El hash es de la frase entera, así que el código no depende del
    orden en que se recorran las filas: reordenar el markdown no renombra nada.
    """
    base = re.sub(r"[^A-Z0-9]+", "_", normalizar(texto).upper()).strip("_")[:44]
    candidato = f"{prefijo}_{base}" if base else prefijo
    if candidato not in usados:
        usados.add(candidato)
        return candidato
    huella = hashlib.sha1(texto.encode("utf-8")).hexdigest()[:6].upper()
    alterno = f"{candidato}_{huella}"
    if alterno in usados:
        raise RuntimeError(f"Código repetido pese al hash: {alterno} ({texto!r})")
    usados.add(alterno)
    return alterno


def telefonos(texto: str) -> list[str]:
    """Separa el amasijo de teléfonos que traen las redes en números sueltos."""
    crudos = re.split(r"[\s/,;]+", texto.replace("INT", " INT "))
    return [t for t in (c.strip() for c in crudos) if re.fullmatch(r"\d{6,10}", t)]


# --------------------------------------------------------------------------- #
#  1 · Aseguradoras  (registro de procesos · PACIENTE §1.13.1)
# --------------------------------------------------------------------------- #

def extraer_aseguradoras(fuente: Path) -> list[dict]:
    """Las compañías de seguro, separadas en las que venden salud y el resto.

    El archivo apila dos tablas: «PRINCIPALES ASEGURADORAS DE PERSONAS» —las que
    ofrecen seguro de salud, que es lo que el registro de procesos pide tener
    cargado— y «…GENERALES Y FIANZAS», que aseguran bienes. Se conservan las dos
    con un `ramo` distinto: el paciente sólo debe ver las de personas, pero la
    lista completa es la que existe en el mercado y sirve para el alta de
    organizaciones.
    """
    lineas = leer(exigir(fuente, "LISTADO_DE_ASEGURADORAS_1", "LISTADO DE ASEGURADORAS"))
    ramo = "PERSONAS"
    salida: list[dict] = []
    usados: set[str] = set()
    vistos: set[str] = set()

    for cabecera, fila in filas_de_tabla(lineas):
        nombre = columna(cabecera, fila, "NOMBRE EMPRESA")
        # La segunda tabla viene embebida como fila de la primera, con su propio
        # título y su propia cabecera repetida.
        if nombre.upper().startswith("PRINCIPALES ASEGURADORAS GENERALES"):
            ramo = "GENERALES"
            continue
        if not nombre or normalizar(nombre) == "nombre empresa":
            continue
        nit = columna(cabecera, fila, "NIT")
        if not re.fullmatch(r"\d{6,15}", nit):
            continue
        if nit in vistos:
            continue
        vistos.add(nit)
        salida.append(
            {
                "code": codigo("BO_ASEG", columna(cabecera, fila, "SIGLA") or nombre, usados),
                "razonSocial": nombre,
                "sigla": columna(cabecera, fila, "SIGLA"),
                "nit": nit,
                "direccion": columna(cabecera, fila, "DIRECCION"),
                "ramo": ramo,
                "ofreceSalud": ramo == "PERSONAS",
            }
        )
    return salida


# --------------------------------------------------------------------------- #
#  2 · Establecimientos  (registro de procesos · MEDICO §3.1 y §3.2)
# --------------------------------------------------------------------------- #

def extraer_establecimientos(fuente: Path, usados: set[str] | None = None) -> list[dict]:
    """Clínicas privadas, hospitales de los tres niveles y cajas de salud.

    El nivel y la naturaleza (privada, pública, seguridad social) salen del
    archivo de origen y del encabezado de sección, no de adivinar por el nombre.
    """
    salida: list[dict] = []
    # Compartido con `consultorios_de_las_redes` cuando lo pasa el llamador: los
    # códigos tienen que ser únicos a lo largo de TODO el padrón, no por pasada.
    if usados is None:
        usados = set()

    # -- clínicas privadas --------------------------------------------------
    for cabecera, fila in filas_de_tabla(leer(exigir(fuente, "LISTA_DE_CLINICAS_PRIVADAS_1", "LISTA DE CLINICAS PRIVADAS"))):
        nombre = columna(cabecera, fila, "ESTABLECIMIENTO")
        if not nombre or normalizar(nombre) == "establecimiento":
            continue
        salida.append(
            {
                "code": codigo("BO_EST", nombre, usados),
                "nombre": nombre,
                "razonSocial": columna(cabecera, fila, "RAZON SOCIAL") or None,
                "nit": columna(cabecera, fila, "NIT") or None,
                "direccion": columna(cabecera, fila, "DIRECCION") or None,
                "telefonos": telefonos(columna(cabecera, fila, "TELEFONO")),
                "departamento": "SC",
                "municipio": "SANTA CRUZ DE LA SIERRA",
                "tipo": "CLINICA_PRIVADA",
                "nivel": None,
                "naturaleza": "PRIVADA",
            }
        )

    # -- hospitales de 3.º y 2.º nivel, y cajas -----------------------------
    lineas = leer(exigir(fuente, "LISTA_DE_HOSPITAL_DE_TERCER_SEGUNDO_NIVEL_Y_CAJAS_1", "LISTA DE HOSPITAL DE TERCER, SEGUNDO NIVEL Y CAJAS"))
    seccion = ""
    for linea in lineas:
        if linea.startswith("#"):
            seccion = normalizar(linea)
    # Se recorre otra vez llevando la sección vigente en paralelo a las tablas.
    seccion = ""
    cabecera: list[str] = []
    anterior: list[str] = []
    for linea in lineas:
        if linea.startswith("#"):
            seccion = normalizar(linea)
            cabecera = []
            anterior = []
            continue
        fila = celdas(linea)
        if not fila:
            anterior = []
            continue
        if es_separador(fila):
            cabecera = anterior
            continue
        if not cabecera:
            anterior = fila
            continue
        anterior = fila
        nombre = columna(cabecera, fila, "ESTABLECIMIENTO")
        if not nombre or normalizar(nombre) == "establecimiento":
            continue
        if "tercer nivel" in seccion:
            tipo, nivel, naturaleza = "HOSPITAL", 3, "PUBLICA"
        elif "segundo nivel" in seccion:
            tipo, nivel, naturaleza = "HOSPITAL", 2, "PUBLICA"
        elif "caja" in seccion:
            tipo, nivel, naturaleza = "CAJA_SALUD", None, "SEGURIDAD_SOCIAL"
        else:
            continue
        salida.append(
            {
                "code": codigo("BO_EST", nombre, usados),
                "nombre": nombre,
                "razonSocial": None,
                "nit": None,
                "direccion": columna(cabecera, fila, "DIRECCION") or None,
                "telefonos": telefonos(columna(cabecera, fila, "TELEFONO")),
                "departamento": "SC",
                "municipio": "SANTA CRUZ DE LA SIERRA",
                "tipo": tipo,
                "nivel": nivel,
                "naturaleza": naturaleza,
                "redSalud": columna(cabecera, fila, "RED SALUD") or None,
            }
        )

    # -- centros de salud de primer nivel -----------------------------------
    for cabecera, fila in filas_de_tabla(
        leer(exigir(fuente, "LISTA_DE_HOSPITAL_DE_PRIMER_NIVEL_SANTA_CRUZ_1", "LISTA DE HOSPITAL DE PRIMER NIVEL SANTA CRUZ"))
    ):
        nombre = columna(cabecera, fila, "ESTABLECIMIENTO")
        if not nombre or normalizar(nombre) == "establecimiento":
            continue
        municipio = columna(cabecera, fila, "MUNICIPIO")
        salida.append(
            {
                "code": codigo("BO_EST", f"{municipio} {nombre}", usados),
                "nombre": nombre,
                "razonSocial": None,
                "nit": None,
                "direccion": columna(cabecera, fila, "DIRECCION", "DIRECCIÓN") or None,
                "telefonos": [],
                "departamento": "SC",
                "municipio": municipio,
                "tipo": "CENTRO_SALUD",
                "nivel": 1,
                "naturaleza": "PUBLICA",
            }
        )

    # -- farmacias, laboratorios y centros de imagen -------------------------
    #
    # Entran al MISMO catálogo que clínicas y hospitales, y no a uno propio,
    # porque el registro de procesos los trata igual: los módulos FARMACIA,
    # LABORATORIO DE SANGRE y ANÁLISIS MEDICOS abren con el mismo capítulo
    # —«Registro en la App Datos Legales de la empresa»— y los mismos 18 puntos
    # que cualquier otra institución. Lo que los distingue es el `tipo`, que es
    # justamente por donde se filtra.
    #
    # El archivo llegó en la entrega de `RealDataSeeds/`, así que puede no estar
    # en una copia vieja del origen: se omite en silencio si falta, en vez de
    # romper la extracción de los otros nueve.
    archivo_empresas = buscar_en_entregas(
        fuente, "LISTA DE FARMACIAS, LABORATORIOS Y ANALISIS MEDICOS"
    )
    if archivo_empresas is not None:
        seccion = ""
        for linea in leer(archivo_empresas):
            if linea.startswith("#"):
                seccion = normalizar(linea)
                continue
            fila = celdas(linea)
            if not fila or es_separador(fila):
                continue
            nombre = limpiar_nan(fila[0])
            # El export de pandas repite el título de la hoja y la cabecera como
            # filas normales; ninguna de las dos es una empresa.
            if not nombre or normalizar(nombre) in (
                "nombre comercial",
                "lista de farmacias",
                "lista de laboratorios de sangre",
                "lista de analisis clinicos",
            ):
                continue
            if "farmacia" in seccion:
                tipo = "FARMACIA"
            elif "laboratorio" in seccion:
                tipo = "LABORATORIO"
            elif "analisis" in seccion:
                tipo = "IMAGEN"
            else:
                continue
            salida.append(
                {
                    "code": codigo("BO_EST", nombre, usados),
                    "nombre": nombre,
                    "razonSocial": limpiar_nan(fila[1] if len(fila) > 1 else ""),
                    "nit": limpiar_nan(fila[2] if len(fila) > 2 else ""),
                    "direccion": limpiar_nan(fila[4] if len(fila) > 4 else ""),
                    "telefonos": telefonos(fila[3] if len(fila) > 3 else ""),
                    "departamento": "SC",
                    "municipio": "SANTA CRUZ DE LA SIERRA",
                    "tipo": tipo,
                    "nivel": None,
                    "naturaleza": "PRIVADA",
                }
            )

    return salida


def limpiar_nan(valor: str) -> str | None:
    """Vacía las celdas que pandas escribió como `NaN`.

    El export de Excel pone el literal `NaN` donde la planilla tenía un hueco.
    Cargarlo tal cual dejaría farmacias con la dirección «NaN», que es peor que
    no tener dirección: parece un dato.
    """
    v = valor.strip()
    return None if not v or v.lower() in ("nan", "none") else v


# --------------------------------------------------------------------------- #
#  3 · Redes de prestadores  (registro de procesos · PACIENTE §3.2)
# --------------------------------------------------------------------------- #

def consultorios_de_las_redes(fuente: Path, usados: set[str]) -> list[dict]:
    """Los consultorios que sólo nombran las redes de las aseguradoras.

    ## Por qué se suman al mismo padrón

    Cuando un médico declara dónde trabaja, la lista de la que elige es
    `VS_BO_HEALTH_FACILITY` — el padrón. Si el lugar no está ahí, no lo puede
    elegir. Y las redes nombran **148 clínicas**, de las que sólo **12** están
    en el padrón oficial: las otras 136 son consultorios privados y centros
    chicos que el listado del Ministerio nunca iba a tener. Sin esto, un médico
    de «CLINICA AOD» no tiene forma de decir dónde atiende.

    ## De dónde sale el nombre

    Las redes no traen una columna de establecimiento: lo pegan al final de la
    dirección, después de una raya —«AC. IRALA ESQ. CHUQUISACA NRO. 737 –
    CLINICA FOIANINI»—. Se parte por ahí y se conserva **la dirección entera**
    tal como vino, porque el nombre extraído es una lectura nuestra y la
    dirección es el dato.

    Las direcciones sin raya no producen establecimiento: son un domicilio y
    nada más, y fabricar un nombre a partir de una calle sería inventar.

    ## Por qué van marcados

    `naturaleza` los distingue como `RED_ASEGURADORA`: no son el padrón
    oficial, los declaró una aseguradora en su red. Un gimnasio y un hospital de
    tercer nivel pueden convivir en la misma lista mientras cada uno diga de
    dónde salió.
    """
    ya_en_el_padron = {
        _clave_de_establecimiento(e["nombre"]) for e in _PADRON_OFICIAL_CACHE
    }
    vistos: dict[str, dict] = {}

    for red in extraer_redes(fuente)["redes"]:
        for profesional in red["profesionales"]:
            for sede in profesional["sedes"]:
                direccion = (sede.get("direccion") or "").strip()
                nombre = _nombre_pegado_a_la_direccion(direccion)
                if not nombre:
                    continue
                clave = _clave_de_establecimiento(nombre)
                if not clave or clave in ya_en_el_padron:
                    continue
                ficha = vistos.get(clave)
                if ficha is None:
                    vistos[clave] = {
                        "code": codigo("BO_EST", nombre, usados),
                        "nombre": nombre,
                        "razonSocial": None,
                        "nit": None,
                        "direccion": direccion,
                        "telefonos": list(sede.get("telefonos") or []),
                        "departamento": "SC",
                        "municipio": (profesional.get("ciudad") or "").upper()
                        or "SANTA CRUZ DE LA SIERRA",
                        "tipo": "CONSULTORIO",
                        "nivel": None,
                        "naturaleza": "RED_ASEGURADORA",
                    }
                else:
                    for t in sede.get("telefonos") or []:
                        if t not in ficha["telefonos"]:
                            ficha["telefonos"].append(t)

    return sorted(vistos.values(), key=lambda e: e["nombre"])


# Las mismas palabras de relleno que hacen que «CLINICA DE LAS AMERICAS» y «LAS
# AMERICAS» sean el mismo lugar. Sin esto se cargarían por duplicado.
_RELLENO = r"\b(CLINICA|CENTRO|MEDICO|MEDICA|HOSPITAL|INSTITUTO|SRL|SA|LTDA|DE|DEL|LA|EL|LOS|LAS|Y)\b"

_PADRON_OFICIAL_CACHE: list[dict] = []


def _clave_de_establecimiento(nombre: str) -> str:
    """Cómo se decide que dos nombres son el mismo lugar."""
    limpio = re.sub(_RELLENO, " ", normalizar(nombre).upper())
    return re.sub(r"[^A-Z0-9]+", " ", limpio).strip()


def _nombre_pegado_a_la_direccion(direccion: str) -> str:
    """Lo que va después de la raya, si hay raya y si parece un nombre."""
    for separador in ("\u2013", "\u2014"):
        if separador in direccion:
            cola = direccion.rsplit(separador, 1)[1].strip().strip('"').strip()
            # Un número suelto o dos letras no son el nombre de un lugar.
            return cola if len(cola) >= 3 and not cola.isdigit() else ""
    return ""

def extraer_redes(fuente: Path) -> dict:
    """Los médicos habilitados por cada aseguradora, con sus planes y sedes.

    Un mismo médico aparece una vez por sede y por plan, así que se agrupa por
    nombre: el resultado es un profesional con la lista de sus consultorios y la
    de los planes que lo tienen habilitado. Sin ese agrupado la guía mostraría
    cinco veces al mismo doctor.
    """
    redes: list[dict] = []

    fuentes = [
        ("BO_ASEG_ALIANZA_VIDA_S_A", "Alianza", "Alianza_Medicos_Habilitados.md",
         ("Nombre del médico",), ("Ciudad",), ("Seguro habilitado",),
         ("Dirección de consultorio",), ("Teléfono fijo", "Teléfono celular")),
        ("BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A", "Nacional Seguros",
         "Nacional_Seguros_Red_Medica_Bolivia.md",
         ("Médico",), ("Ciudad/Zona",), ("Plan habilitado",),
         ("Dirección",), ("Teléfono(s)",)),
    ]

    for carrier, etiqueta, archivo, c_medico, c_ciudad, c_plan, c_dir, c_tel in fuentes:
        profesionales: dict[str, dict] = {}
        planes: set[str] = set()
        for cabecera, fila in filas_de_tabla(leer(exigir(fuente, archivo.replace(".md","")))):
            nombre = columna(cabecera, fila, *c_medico)
            if not nombre or normalizar(nombre) in {"medico", "nombre del medico"}:
                continue
            especialidad = columna(cabecera, fila, "Especialidad")
            clave = normalizar(nombre)
            ficha = profesionales.setdefault(
                clave,
                {
                    "nombre": nombre,
                    "especialidades": [],
                    "ciudad": columna(cabecera, fila, *c_ciudad),
                    "sedes": [],
                    "planes": [],
                },
            )
            if especialidad and especialidad not in ficha["especialidades"]:
                ficha["especialidades"].append(especialidad)
            direccion = columna(cabecera, fila, *c_dir)
            tel = []
            for titulo in c_tel:
                tel.extend(telefonos(columna(cabecera, fila, titulo)))
            if direccion and not any(s["direccion"] == direccion for s in ficha["sedes"]):
                ficha["sedes"].append({"direccion": direccion, "telefonos": tel})
            for plan in (p.strip() for p in columna(cabecera, fila, *c_plan).split(",")):
                if plan and plan not in ficha["planes"]:
                    ficha["planes"].append(plan)
                if plan:
                    planes.add(plan)
        redes.append(
            {
                "carrierCode": carrier,
                "aseguradora": etiqueta,
                "planes": sorted(planes),
                # Ordena ignorando la caja: con el orden natural de Python las
                # minúsculas van después de TODAS las mayúsculas, así que
                # «Alvarez de Pardo» caería detrás de «Alvarez Oliva» sólo por
                # la «d». El padrón cambió de MAYÚSCULAS a capital inicial y el
                # orden no tiene por qué moverse con él.
                "profesionales": sorted(profesionales.values(),
                                        key=lambda p: p["nombre"].upper()),
            }
        )
    return {"redes": redes}


# --------------------------------------------------------------------------- #
#  4 · Aranceles  (registro de procesos · PACIENTE §5, «cuál es el costo»)
# --------------------------------------------------------------------------- #

def extraer_aranceles(fuente: Path) -> dict:
    """Los honorarios médicos en UMA y el arancel odontológico en dólares.

    Las filas sin importe son encabezados de grupo dentro de la especialidad
    («RADIOGRAFIAS-TORAX», «COLUMNA»): se conservan como `grupo` de las filas que
    les siguen en vez de descartarse, porque es lo que da sentido al listado.
    """
    medicos: list[dict] = []
    usados: set[str] = set()
    repetidos: set[tuple[str, str, str]] = set()
    grupo = ""
    especialidad_previa = ""

    for cabecera, fila in filas_de_tabla(
        leer(exigir(fuente, "Arancel_Honorarios_Medicos_Santa_Cruz_2025_3_columnas"))
    ):
        especialidad = columna(cabecera, fila, "Especialidad")
        concepto = columna(cabecera, fila, "Procedimiento / concepto")
        uma = columna(cabecera, fila, "UMA")
        if not especialidad or not concepto:
            continue
        # La hoja de metadatos del final usa la misma tabla.
        if normalizar(especialidad) in {
            "documento", "institucion", "paginas del pdf original",
            "registros extraidos", "uso sugerido", "advertencia",
            "columnas clave", "campo",
        }:
            continue
        if especialidad != especialidad_previa:
            grupo = ""
            especialidad_previa = especialidad
        if not re.fullmatch(r"\d+(?:[.,]\d+)?", uma):
            # Encabezado de grupo: no tiene importe, nombra lo que viene abajo.
            grupo = concepto
            continue
        # El PDF repite filas idénticas —el mismo concepto, el mismo grupo, el
        # mismo importe— tanto por la maquetación del original como por el OCR.
        # La segunda copia no aporta nada, así que se descarta: dos códigos para
        # el mismo servicio dejarían al que cotiza sin saber cuál usar.
        clave = (normalizar(especialidad), normalizar(grupo), normalizar(concepto))
        if clave in repetidos:
            continue
        repetidos.add(clave)
        medicos.append(
            {
                "code": codigo("BO_ARM", f"{especialidad} {grupo} {concepto}", usados),
                "especialidad": especialidad,
                "grupo": grupo or None,
                "concepto": concepto,
                "uma": float(uma.replace(",", ".")),
                "ocrSospechoso": sospechoso_de_ocr(concepto),
            }
        )

    odontologicos: list[dict] = []
    usados_odo: set[str] = set()
    repetidos_odo: set[tuple[str, str]] = set()
    seccion = ""
    cabecera: list[str] = []
    anterior: list[str] = []
    for linea in leer(exigir(fuente, "LISTADO_ARANCEL_ODONTOLOGICO_2026_1", "LISTADO ARANCEL ODONTOLOGICO 2026")):
        if linea.startswith("##"):
            seccion = linea.lstrip("# ").strip()
            cabecera = []
            anterior = []
            continue
        fila = celdas(linea)
        if not fila:
            anterior = []
            continue
        if es_separador(fila):
            cabecera = anterior
            continue
        if not cabecera:
            anterior = fila
            continue
        anterior = fila
        concepto = columna(cabecera, fila, "Concepto")
        precio = columna(cabecera, fila, "Precio $us.", "Precio $us")
        if not concepto or not re.fullmatch(r"\d+(?:[.,]\d+)?", precio):
            continue
        clave_odo = (normalizar(seccion), normalizar(concepto))
        if clave_odo in repetidos_odo:
            continue
        repetidos_odo.add(clave_odo)
        odontologicos.append(
            {
                "code": codigo("BO_ARO", f"{seccion} {concepto}", usados_odo),
                "seccion": seccion,
                "concepto": re.sub(r"^[a-z0-9]\)\s*", "", concepto),
                "precioUsd": float(precio.replace(",", ".")),
                "ocrSospechoso": sospechoso_de_ocr(concepto),
            }
        )

    return {"honorariosMedicos": medicos, "arancelOdontologico": odontologicos}


# --------------------------------------------------------------------------- #
#  5 · Especialidades observadas  (registro de procesos · MEDICO §1.4.2)
# --------------------------------------------------------------------------- #

def extraer_especialidades(fuente: Path) -> list[dict]:
    """Las especialidades que aparecen realmente en las redes y en el arancel.

    Sirven para contrastar contra `VS_MEDICAL_SPECIALTY`: lo que esté acá y no
    en el catálogo es una especialidad que existe en el mercado y que el médico
    hoy no puede elegir al registrarse.
    """
    conteo: dict[str, dict] = {}
    archivos = [
        ("Alianza_Medicos_Habilitados.md", "Especialidad", "red-alianza"),
        ("Nacional_Seguros_Red_Medica_Bolivia.md", "Especialidad", "red-nacional"),
        ("Arancel_Honorarios_Medicos_Santa_Cruz_2025_3_columnas.md", "Especialidad", "arancel"),
    ]
    for archivo, titulo, origen in archivos:
        for cabecera, fila in filas_de_tabla(leer(exigir(fuente, archivo.replace(".md","")))):
            valor = columna(cabecera, fila, titulo)
            if not valor or len(valor) < 4:
                continue
            clave = normalizar(valor)
            if clave in {"especialidad", "documento", "institucion", "campo", "advertencia"}:
                continue
            ficha = conteo.setdefault(
                clave, {"nombre": valor, "apariciones": 0, "origenes": []}
            )
            ficha["apariciones"] += 1
            if origen not in ficha["origenes"]:
                ficha["origenes"].append(origen)
    return sorted(conteo.values(), key=lambda e: (-e["apariciones"], e["nombre"]))


# --------------------------------------------------------------------------- #

def contar(nodo) -> int:
    """Cuenta las hojas de dato de un dataset, entren o no en listas anidadas."""
    if isinstance(nodo, list):
        return sum(contar(x) for x in nodo) or len(nodo)
    if isinstance(nodo, dict):
        anidados = sum(contar(v) for v in nodo.values() if isinstance(v, (list, dict)))
        return anidados or 1
    return 0


def escribir(salida: Path, nombre: str, contenido, nota: str) -> int:
    salida.mkdir(parents=True, exist_ok=True)
    cuerpo = {"_nota": nota, "datos": contenido}
    ruta = salida / nombre
    # `newline=""` porque en Windows la traducción por defecto convierte cada
    # «\n» en CRLF, y `.gitattributes` declara `*.json text eol=lf`: sin esto,
    # regenerar desde Windows deja los cinco datasets modificados en `git
    # status` sin que haya cambiado un solo dato.
    with open(ruta, "w", encoding="utf-8", newline="") as fh:
        fh.write(json.dumps(cuerpo, ensure_ascii=False, indent=2) + "\n")
    n = contar(contenido)
    print(f"  {nombre:38s} {n:5d} registros")
    return n


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--fuente", type=Path, default=FUENTE_POR_DEFECTO)
    p.add_argument("--salida", type=Path, default=SALIDA_POR_DEFECTO)
    args = p.parse_args()

    if not args.fuente.is_dir():
        print(f"No existe la carpeta de origen: {args.fuente}", file=sys.stderr)
        return 1

    print(f"Origen : {args.fuente}")
    print(f"Destino: {args.salida}\n")

    escribir(
        args.salida, "insurance-carriers.dataset.json",
        extraer_aseguradoras(args.fuente),
        "Aseguradoras de Bolivia. Origen: LISTADO_DE_ASEGURADORAS_1.md. "
        "Regenerar con tools/bolivia-datasets/extract_datasets.py.",
    )
    # El padrón oficial primero; los consultorios de las redes se suman después
    # y se descartan contra él, para no cargar dos veces el mismo lugar con dos
    # nombres. `usados` viaja entre las dos pasadas para que ningún código choque.
    codigos_de_establecimiento: set[str] = set()
    padron = extraer_establecimientos(args.fuente, codigos_de_establecimiento)
    _PADRON_OFICIAL_CACHE.clear()
    _PADRON_OFICIAL_CACHE.extend(padron)
    consultorios = consultorios_de_las_redes(args.fuente, codigos_de_establecimiento)
    print(f"Padrón : {len(padron)} oficiales + {len(consultorios)} de redes")
    escribir(
        args.salida, "health-facilities.dataset.json",
        padron + consultorios,
        "Establecimientos de salud de Santa Cruz. Origen: LISTA_DE_CLINICAS_PRIVADAS_1.md, "
        "LISTA_DE_HOSPITAL_DE_TERCER_SEGUNDO_NIVEL_Y_CAJAS_1.md y "
        "LISTA_DE_HOSPITAL_DE_PRIMER_NIVEL_SANTA_CRUZ_1.md. Los de naturaleza "
        "RED_ASEGURADORA salen de las redes de Alianza y Nacional: son consultorios "
        "que el padrón oficial no lista y sin los cuales un médico no puede declarar "
        "dónde atiende.",
    )
    escribir(
        args.salida, "provider-networks.dataset.json",
        extraer_redes(args.fuente),
        "Redes de prestadores de Alianza y Nacional Seguros, agrupadas por profesional. "
        "Contiene nombres de médicos reales: es dato profesional, no clínico.",
    )
    escribir(
        args.salida, "fee-schedule.dataset.json",
        extraer_aranceles(args.fuente),
        "Aranceles médicos (UMA) y odontológicos (USD). El PDF de honorarios es escaneado: "
        "las filas con ocrSospechoso=true necesitan revisión humana antes de producción.",
    )
    escribir(
        args.salida, "observed-specialties.dataset.json",
        extraer_especialidades(args.fuente),
        "Especialidades que aparecen en las redes y el arancel, para contrastar contra "
        "VS_MEDICAL_SPECIALTY.",
    )
    print("\nListo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
