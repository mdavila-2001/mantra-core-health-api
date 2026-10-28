# Cobertura — equipos de diagnóstico, registros de Europa (fuentes oficiales)

Generado: 2026-10-27T23:44:50.082Z

| Métrica | Valor |
|---|---|
| EUDAMED /udi: recorrido completo | NO (reanudable) |
| EUDAMED /udi: filas vistas | 550000 |
| EUDAMED /udi: filas en alcance de diagnóstico | 37909 |
| EUDAMED /udi: filas exportadas (1 por UDI-DI, versión vigente) | 37785 |
| BD/RDM: filas leídas / exportadas (CND W) | 2437994 / 128698 |
| Actores EUDAMED | 50657 |
| Conceptos EMDN v2026 / en alcance | 8516 / 3134 |
| Fabricantes distintos / marcas distintas | 5330 / 117519 |

## Huecos

| Fuente | Motivo |
|---|---|
| eudamed-udi | recorrido de /udi INCOMPLETO: 550 páginas de ~5 650 (reanudable con fetch-eudamed.mjs); las filas exportadas son un subconjunto |
| mhra-pard | licencia: PARD clasifica por términos GMDN y su aviso (FAQ «What is GMDN?», leído 2026-10-27) exige licencia de la GMDN Agency para extraer ese contenido con fines de categorización alternativa, mapeo o entrenamiento de IA; no hay descarga masiva |
| swissmedic-swissdamed | términos: las condiciones de Swissmedic prohíben la extracción automatizada sin autorización expresa (leídas el 2026-10-24; hoy el host responde 200 pero swissdamed no publica archivo abierto ni condiciones de reutilización verificables); sin autorización escrita no se descarga |
| eudamed-certificates | la API interna del portal (basicUdiData) no tiene términos de reutilización leídos; el Data Lake oficial no expone certificados ni organismo notificado |
| it-salute-bdrdm-fuera-de-W | curaduría: la BD/RDM trae 2,4 millones de registros; solo la categoría CND W está titulada como diagnóstico in vitro. Los tipos de diagnóstico dentro de Z11/Z12/C/G/Q… exigen decisión tipo por tipo contra la CND (propietario) |
| ec-nando | no es un registro de equipos (organismos notificados); sin descarga masiva |
| de-bfarm | sin descarga pública de registros de equipos (remite a EUDAMED); re-sondeado 2026-10-27: el host responde, sin archivo |
| es-aemps-ccps | consulta pública sin descarga masiva; re-sondeado 2026-10-27: el host responde, sin archivo |
| fr-ansm | sin registro nacional descargable (remite a EUDAMED); re-sondeado 2026-10-27 |
