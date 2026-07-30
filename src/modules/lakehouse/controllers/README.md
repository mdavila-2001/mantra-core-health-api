# Controladores — lakehouse

Dos controladores, 11 endpoints para 12 casos de uso. Todos delegan en un servicio y no contienen
lógica.

## `/lakehouse` — `LakehouseController` (7)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /lakehouse/zones` | 01 | 201 | `DATA_PLATFORM_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /lakehouse/catalogs` | 02 | 201 | ídem |
| `POST /lakehouse/data-products/:id/versions` | 03 | 201 | `DATA_PRODUCT_OWNER`, `PLATFORM_ADMIN` |
| `POST /lakehouse/datasets` | 04 | 201 | `DATA_PLATFORM_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /lakehouse/transformations/:defId/runs` | 05, 06 | 201 | `SYSTEM`, `TRANSFORMATION_WORKER`, `PLATFORM_ADMIN` |
| `POST /lakehouse/ingestion/curated-runs` | 07 | 201 | `SYSTEM`, `DEIDENTIFICATION_WORKER`, `PLATFORM_ADMIN` |
| `POST /lakehouse/datasets/:id/quality-runs` | 08 | 201 | `DATA_STEWARD`, `SYSTEM`, `PLATFORM_ADMIN` |

## `/research` — `ResearchController` (4)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /research/projects/:id/cohorts` | 09 | 201 | `PRINCIPAL_INVESTIGATOR`, `RESEARCH_GOVERNANCE`, `PLATFORM_ADMIN` |
| `POST /research/dataset-releases` | 10 | 201 | `PRINCIPAL_INVESTIGATOR`, `PLATFORM_ADMIN` |
| `POST /research/dataset-releases/:id/approve` | 11 | 201 | `RESEARCH_GOVERNANCE`, `DPO`, `PLATFORM_ADMIN` |
| `POST /research/dataset-releases/:id/revoke` | 12 | 200 | `RESEARCH_GOVERNANCE`, `DPO`, `SYSTEM`, `PLATFORM_ADMIN` |

## Dos prefijos, un módulo

`/research` no cuelga de `/lakehouse` porque así lo declara el caso de uso, y la separación tiene
sentido: lo que se gobierna ahí no es almacenamiento sino **acceso a datos de pacientes con fines de
investigación**. Que la ruta lo diga ayuda a que nadie lo confunda con una operación de plataforma.

## Quién puede hacer qué

**Quien pide el release no lo aprueba.** `PRINCIPAL_INVESTIGATOR` aparece en `/dataset-releases` pero
no en `/approve` ni en `/revoke`. El investigador que necesita los datos no puede ser quien decide
que se le den — es la separación que da sentido a que exista una gobernanza de investigación.

**Quien transforma no evalúa lo que produjo.** `TRANSFORMATION_WORKER` no aparece en
`/quality-runs`: quien escribe el dato no es quien certifica que está bien.

**Quien de-identifica no define la zona.** `DEIDENTIFICATION_WORKER` sólo aparece en
`/ingestion/curated-runs`; las zonas las define el ingeniero de plataforma. El worker no puede
crearse una zona `curated` a medida.

`RESEARCH_GOVERNANCE` sí puede definir cohortes junto al investigador: el caso de uso pone al PI como
actor, y la gobernanza necesita poder corregir una cohorte mal definida sin bloquear el estudio.

`SYSTEM` aparece en `/revoke` porque el barrido de releases vencidos lo hace un worker.

## Códigos de estado

`201` en todo salvo `/revoke`, que es `200`: revocar no crea nada, cierra algo que ya existía.

`/approve` es `201` aunque también cambie el estado de la solicitud, porque su efecto principal es
crear el manifiesto — que es el objeto que el investigador va a consumir.

## `:id` en las rutas de upsert

`data-products/:id/versions` y `projects/:id/cohorts` reciben el id del agregado padre, que puede no
existir todavía: el caso de uso declara `UPSERT` para los dos. El controlador sólo lo pasa; la
decisión de crear o actualizar —y el rechazo si el código ya lo tiene otro— es del servicio.

## UC-63-06 no tiene ruta

El caso de uso lo declara *interno, parte del commit de UC-63-05*. El linaje se registra dentro de
`runTransformation`, y la respuesta lo informa en `lineageEdges`.

## Actor

Todas las rutas reciben `@CurrentUser()`. En `/dataset-releases` el actor **es** quien solicita
(`requestedByUserId`): no se acepta por el cuerpo, porque dejaría pedir un release a nombre de otro
investigador.

## Pruebas

11 pruebas de delegación en `lakehouse-controllers.spec.ts`.
