# Controladores de laboratorio de pruebas

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`QaLabController`, prefijo `qa`) con 12 endpoints sobre `environments`,
`suites`, `runs`, `case-results`, `defects` y `schedules`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`:

| Rol | Alcance |
| --- | --- |
| `QA_ADMIN` | Todo el módulo |
| `QA_ENGINEER` | Casos, publicación, corridas, evidencia y triage |
| `SYSTEM` | Captura de ejecución, evaluación, cierre y registro de defectos |
| `RELEASE_MANAGER` | Enlazar evidencia a un release |

Es deliberado que sólo `QA_ADMIN` registre entornos: declarar un entorno como seguro para capturar
payloads decide si datos reales pueden acabar guardados, y esa no es una decisión de quien escribe
pruebas.

También lo es que `RELEASE_MANAGER` no pueda tocar corridas ni defectos: su papel es leer la
evidencia y sellarla, no producirla.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta, incluidos los dos de
`runs/:runId/cases/:caseId/execute`. `ValidationPipe` global sobre los cuerpos.

## El único `PATCH` del módulo

`PATCH /qa/defects/:defectId` es el triage, y es `PATCH` porque modifica campos sueltos de un
defecto existente (estado, gravedad, responsable) sin reemplazarlo. El resto del módulo son altas y
transiciones, que van por `POST`.

## Los endpoints sin cuerpo

`POST /qa/case-results/:resultId/evaluate` y `POST /qa/runs/:runId/finalize` no reciben cuerpo: todo
lo que deciden —aserciones del caso, resultados de la corrida— ya está en la base. Aceptar
parámetros abriría la puerta a declarar aprobado lo que no lo está.

## Códigos de respuesta

`201 Created` en las altas (entorno, caso, corrida, ejecución capturada, artefacto, defecto,
programación). `200 OK` en lo que muta algo existente: publicar la suite, evaluar, cerrar, hacer
triage y enlazar el release.

## Pruebas

`qa-lab.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el actor
y los ids de ruta, con los dos de la ejecución de caso), los endpoints sin cuerpo y propagación de
errores.
