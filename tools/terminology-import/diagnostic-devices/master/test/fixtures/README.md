# Fixtures de `master/`

Recortes **verbatim** de archivos reales, para probar los parsers sin red:

| Archivo | De dónde sale |
|---|---|
| `foiclass.sample.txt` | Cabecera + 21 líneas de `foiclass.csv` (FDA Product Classification Database) en `github.com/ej86/fda-ai-medical-device-analytics@8840a03632ffdc346a8bf05a459236c913b9198c` (sha256 del archivo completo `ed54a12f…13de`). Elegidas para cubrir cada criterio: parte IVD, subparte diagnóstica, subparte de monitoreo, subparte no diagnóstica, establecimientos de sangre, sección fuera de los rangos verificados, parte 610 y product codes sin regulación. |
| `aiml.sample.csv` | Cabecera + 5 registros de `aiml-devices-csv.csv` (lista FDA de dispositivos con IA) del mismo commit (sha256 `4da0d15a…d41d`), incluido el registro `DEN230027`, cuyo campo de empresa trae un salto de línea entre comillas. |

Las filas sintéticas de los tests (para validar el formato, la resolución de
fabricantes y la agrupación por UDI-DI) se arman en el propio test y nunca se
escriben en `out/`.
