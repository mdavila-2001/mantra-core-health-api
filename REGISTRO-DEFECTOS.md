# Registro de defectos abiertos

**Corte:** 2026-08-15 · **Origen:** consolidación de las cuatro fuentes que el equipo venía
usando por separado.

## Por qué existe este archivo

Los defectos estaban repartidos en cuatro documentos que no se conocen entre sí, y **no hay
un solo issue abierto en GitHub** (`gh issue list` devuelve vacío en los dos repos). Cuando
alguien dice «los defectos que venimos poniendo», hay que adivinar a cuál se refiere:

| Fuente | Qué tiene | Dónde vive |
|---|---|---|
| `INFORME-HALLAZGOS-M1-2026-08-12.md` | Fichas H-01…H-10, la única con formato de defecto | raíz del workspace (**fuera de git**) |
| `COORDINACION-AGENTES.md` | Bitácora de sesiones con bloqueadores 🔴/🟡 | repo del front, 1 509 líneas |
| `ESTADO-Y-PENDIENTES.md` | Backlog P0/P1/P2 | este repo |
| `PENDIENTES-RED-SOCIAL-BUSCADOR.md` | Huecos H1–H5 de `community` | raíz del workspace |

Este archivo no los reemplaza: los indexa y los ordena por lo que cuesta que sigan abiertos.

---

## Resueltos hoy, pendientes de merge

| # | Defecto | PR |
|---|---|---|
| R-1 | **Dos conceptos declaraban el código `REL_PROCEDURE`.** El seed deduplica por id (UUIDv5 de la clave) pero la restricción es `UNIQUE(version, code)`: la colisión sólo aparecía en Postgres. Como el catálogo es el primer paso de la cadena, **se llevaba puestos los otros nueve** y una base nueva quedaba sin sembrar. | #104 |
| R-2 | **La siembra de arranque era muda e inapagable.** Los seeds logueaban sólo `if (inserted > 0)`, así que un seed ausente de la imagen se veía igual que uno sin trabajo. Ahora hay `SEED_ON_BOOT`, `yarn seed:boot`, cronómetro y resumen por paso. | #105 |
| R-3 | **`yarn lint` estaba rojo en `dev`** (19 errores de prettier de los merges del 15/08). Nadie lo vio porque el CI está caído. | #106 |
| R-4 | **El corpus MeSH cargaba 1 441 367 filas que no consulta nadie** (98,3 % del total, 501 MiB, el grueso de los ~10 min de carga). | #107 |
| R-5 | **No se podía saber qué código corre un contenedor.** Una imagen del 14/08 sin tres seeds pasó un día entera sin que nadie lo notara. | #108 |

---

## Bloqueantes abiertos

**B-1 · El CI de GitHub Actions está caído a nivel de cuenta desde el 2026-08-14.**
Las corridas mueren en 3-5 s sin asignar runner, en todas las ramas de los dos repos.
**Ninguna verificación automática está corriendo.** Todo lo que se mergee hasta que se
reponga entra sin checks; hay que verificar local y pegar la evidencia.

**B-2 · `.puml`, `SQL/` y `salud-db/` no están bajo control de versiones.**
Ningún cambio de esquema puede viajar en un PR: se distribuye por zip. Es la causa raíz de
B-3 y de que el ajuste de `rebuild_stack.py` del PR #107 no pueda revisarse.
*(`CARRIL_REPORT.md:98-103`)*

**B-3 · `gen_ddl.py 05` pierde 7 FK ya resueltas** al regenerar en este workspace: lee un
vault ausente. Cualquiera que regenere un módulo acá introduce la regresión.
*(`CARRIL_REPORT.md:86-92`)*

**B-4 · `postgres-init` falla en algunas máquinas** — busca `/init/SQL/apply_all.sql` y el
directorio está vacío. Impide levantar el stack limpio y correr `yarn test:integration`.
*(`COORDINACION-AGENTES.md:1489-1495`)*

**B-5 · `yarn.lock` no instala con `--immutable`** — entrada huérfana
`@aws-sdk/s3-request-presigner@3.1094.0` que `package.json` ya no pide. El `Dockerfile` usa
`--immutable`, así que **falla la construcción de la imagen**.
*(`COORDINACION-AGENTES.md:1483-1488`)*

**B-6 · `profiles.practitioner_affiliations` no tiene backend en `dev`.** El front está
mergeado pero el DDL y el `affiliations` del summary siguen en una rama sin integrar: la
pestaña Trayectoria no tiene quién la sirva.

---

## Defectos funcionales, verificados ejecutando

Todos de `INFORME-HALLAZGOS-M1-2026-08-12.md`, con evidencia medida.

| Ficha | Defecto | Por qué duele |
|---|---|---|
| **H-01** | Aprobar la verificación de identidad **no habilita el acceso**. El caso llega a `CASE_VERIFIED` pero el check queda en `CHECK_IN_PROGRESS`, la aserción nunca nace y `GET /profiles/patients/me/summary` sigue en **403**. | Rompe el desenlace del recorrido de demo. La pantalla promete «Se habilita tu acceso». |
| **H-02** | `generateSlots` ignora la zona horaria de la sede: una agenda «08:00–12:00» publica turnos **04:00–07:30**. | Toda agenda publicada desde la interfaz nace con el horario corrido. |
| **H-03** | El `code` de los conceptos de módulo es letra muerta y engaña: se declara `IDA_CASE_OPEN`, la base guarda `identity_assurance:CASE_OPEN`, y el front resuelve por código y degrada a «Desconocido» en silencio. | Ya causó un commit equivocado. |
| **H-06** | El backend no valida la evidencia que recibe: `evidenceFileId` no se contrasta contra `common.files`, y la subida no declara lista blanca de MIME. | El `accept` del front es el único filtro. |
| **H-05** | Envío nativo de formulario en `patient-merge`: la página recarga y pierde la query string. | Única pantalla que queda así. |
| **H-04** | `patientCode` es un UUID visible al paciente (`PAT-9aa617b6-…`). | Requiere decidir formato. |
| **H-07** | Textos internos filtrados a la vista del paciente («Organización activa: …», «Roles: USER, PATIENT»). | |
| **H-10** | El seeder de desarrollo tiene un rojo permanente (523/524): una expectativa vieja frente a la política de firma vigente. | El producto está bien; el seeder miente. |

Además: **rutas hijas de operación sin guard de rol** — un paciente que escriba
`/administration/geolocation/trips/new` llega al formulario (la API responde 403, no hay
fuga, pero la pantalla no debería ofrecerse).

---

## Módulos con escrituras y sin lecturas

El patrón dominante del backend: superficie de comandos sin capa de consulta.

| Módulo | GET / escrituras | Consecuencia |
|---|---|---|
| `community` | 0 / 19 | Cero superficie pública, cero worker de fan-out, cero frontend. 8 entidades sin ningún caso de uso. |
| `forms` | 0 / 13 | El paciente no puede obtener el formulario a renderizar ni el profesional leer respuestas. |
| `ads` (+`marketing`) | 0 / 18 | 75 entidades modeladas y ninguna ruta que devuelva una campaña. |
| `messaging` | 1 / 12 | Sin bandeja, sin contador de no leídas, sin preferencias. El único GET es `/internal`. |
| `billing` | 1 / 14 | Existe `invoices:issue-from-encounter` y `kpi-snapshots:compute`, pero nada para leerlos. |
| `insurance` | 5 / 23 | Se puede crear un plan o un claim y después nadie puede listarlo. |
| `practice` (+`organization_extensions`) | 5 / 13 (+0/9) | Sin lectura de personal, roles ni infraestructura. |

Quedan **25 módulos** en esa situación; el siguiente grande es `procedures_perioperative`
(38 entidades, 24 escrituras).

---

## Pruebas y verificación

- **1 falla unitaria preexistente**: `local-disk-file-storage.adapter.spec.ts`, timeout.
- **4 fallas de integración preexistentes**: `vademecum` (falta un patch de seed) e
  `identity-verification-cycle` (concept id).
- **12 suites saltadas por opt-in de entorno** (`TERMINOLOGY_DATASET_TESTS`, `RLS_TEST`…):
  intencional, pero la cobertura está ausente por defecto.
- **H-08 / H-09**: la suite `real` no se puede correr de un tirón (el rate limit de 10/min
  tumba la segunda spec) y el lanzador se cuelga con `--browser chrome`; con `electron`
  corre en 17-30 s.
- **El patrón que une a tres de los defectos ya cerrados**: la prueba codificaba el error.
  El doble se editó para coincidir con el código en vez de con el sistema. Está desarrollado
  en la Parte 3 del informe M1 y merece una discusión de equipo más que cualquier ficha suelta.

---

## Sistema de diseño (repo del front)

- **Dos sistemas conviviendo sin solape**: `src/styles.css` (REDSAT v1.0, Inter,
  `<app-card>`, 132 pantallas) contra `src/styles/redsat.css` (v1.1, Nunito Sans,
  `class="app-card"`, 141 pantallas). Se navega de uno a otro sin cambiar de ruta.
- **Contradicción tipográfica sin resolver**: la fuente normativa fija Poppins + Inter; la
  hoja de la bóveda fija Poppins + Nunito Sans.
- **Dos excepciones de contraste declaradas y no corregidas**: `--petroleo` en oscuro es a
  la vez tinta de enlace (3,09:1, falla) y relleno de botón primario; `--borde-ctrl` en
  oscuro da 2,47:1 contra el 3:1 que pide WCAG 1.4.11.

---

## Proceso

**El working tree compartido entre carriles paralelos ya mordió tres veces**: un carril
encontró su trabajo montado sobre la rama de otro tras un `git checkout` ajeno; otro quedó
con sus dos commits sobre ramas de terceros; y el módulo `surveys` completo **se perdió con
un `git reset` de otra sesión** y hubo que recuperarlo. La recomendación registrada —un
`git worktree` por carril— sigue sin adoptarse.

**Once recargas en un minuto cierran la sesión**: una recarga es un canje de refresh token y
`token/refresh` está limitado a 10/min. Declarado «por diseño», pero conviene decidirlo.

---

## Deuda menor

- **Secreto de webhook derivado en vez de real**, en 6 sitios (mismo defecto repetido); el
  de `payments` apunta a resolverlo desde `gateway_connections.webhook_secret_ref`.
- **Workers con adapters stub**: envío SMS/email/push, borrado real y embeddings.
  `TS_RETENTION_POLICIES` sin configurar, así que el job de retención no borra nada.
- **RLS**: mecanismo cerrado, activación pendiente de decisión de despliegue. Hoy el runtime
  corre con el rol propietario.
- **`model-manifest.yaml` desactualizado** (declara M19 con 33 tablas contra 38 reales, no
  registra el módulo 64) y **colisión de numeración en el 64**.
- **Relación de glosario huérfana**: `hipertension-arterial → control-de-signos-vitales`
  apunta a un slug que el catálogo no declara. Su propio spec la fija en 1, así que hoy es
  un hueco aceptado; conviene decidir si se agrega el término o se quita la relación.
