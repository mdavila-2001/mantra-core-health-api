# Estado de la API y tareas pendientes

Documento de continuidad. Explica **qué parte del sistema cubre cada quien**, qué
se subió a esta rama y **qué queda pendiente de asignar**.

Fecha de corte: 2026-07-27.

---

## 1. Reparto del trabajo

El sistema está especificado en 60 documentos de casos de uso (`casos_de_uso/*.puml`),
uno por módulo. El reparto es:

| | Módulos | UC | Rutas montadas |
| --- | ---: | ---: | ---: |
| Módulos 01–31 (Pablo) | 30 | 367 | 417 |
| Módulos 32–63 (nuestra parte) | 27 | 356 | 379 |
| Sin asignar (55, 56, 57) | 3 | 37 | 0 |
| **Total** | **60** | **760** | **796** |

Nuestra parte continúa el trabajo de Pablo **con el mismo estándar**: misma
estructura de carpetas por módulo, mismas convenciones de nombres, mismo patrón de
transacción, mismo estilo de DTOs y de documentación. No se introdujo ninguna
arquitectura paralela.

### 1.1. Nuestra parte, en dos tandas

- **Tanda A — 17 módulos, 227 UC.** Módulos de alta y flujo de estados directo:

  | Nº | Módulo | UC | | Nº | Módulo | UC |
  | ---: | --- | ---: | --- | ---: | --- | ---: |
  | 36 | `qa_lab` | 12 | | 46 | `platform_ops` | 14 |
  | 37 | `tracking` | 11 | | 47 | `education` | 14 |
  | 38 | `erp` | 16 | | 49 | `crm` | 15 |
  | 39 | `reporting` | 12 | | 50 | `marketing` | 12 |
  | 40 | `auth_providers` | 12 | | 51 | `promotions` | 13 |
  | 41 | `scheduling` | 14 | | 52 | `health_data` ⁽¹⁾ | 14 |
  | 42 | `payments` | 14 | | 53 | `procedures_perioperative` | 14 |
  | 43 | `ads` | 16 | | | | |
  | 44 | `health_context` | 12 | | | | |
  | 45 | `system_context` | 12 | | | | |

  ⁽¹⁾ El `.puml` se llama `52_health_data_platform`; la carpeta es `health_data`.

- **Tanda B — 10 módulos, 129 UC.** Módulos con diseño propio (outbox, escritura
  poliglota, SQL dinámico): `messaging` (35), `automation` (48),
  `polyglot_storage` (54), `time_series` (58), `vector_rag` (59),
  `object_storage` (60), `graph_intelligence` (61), `cross_store_consistency` (62),
  `lakehouse` (63) y `workflow` (32).

Cada módulo se entregó con la misma cadena: constantes → repositorios → DTOs →
servicios → controladores → wiring del módulo → pruebas → 5 READMEs (raíz del
módulo, `repositories/`, `services/`, `dto/`, `controllers/`).

---

## 2. Auditoría cruzada y corrección sobre el módulo 03

Terminada nuestra parte, se cotejaron **los 60 `.puml` contra las rutas realmente
montadas** en el código, incluidos los 30 módulos de Pablo. La comprobación fue
automática, no visual: se extrajeron por un lado los endpoints declarados en las
notas de los `.puml` y por otro los decoradores `@Controller` / `@Get` / `@Post` /
`@Put` / `@Patch` / `@Delete` de cada `*.controller.ts`, y se cruzaron por módulo.

**Resultado: un único hueco real, el módulo 03 `terminology`.** Declaraba 12 casos
de uso pero sólo tenía 7 rutas. Se completó (rutas nuevas marcadas con ➕):

| UC | Endpoint |
| --- | --- |
| 03-05 | ➕ `POST /terminology/concepts/:conceptId/properties` |
| 03-08 | ➕ `POST /terminology/ValueSet/:id/$expand` |
| 03-09 | ➕ `POST /terminology/ConceptMap/$translate` |
| 03-10 | ➕ `POST /terminology/concepts/:conceptId/$deprecate` |
| 03-11 | ➕ `GET /terminology/CodeSystem/$lookup?system=&code=` |
| 03-12 | ➕ `PUT /terminology/tenants/:tenantId/catalog-policies` |

Además se corrigió un **defecto de comportamiento** en lo que ya existía:
`ConceptsService.addDesignation` no cumplía la invariante que el `.puml` exige —
«una sola designación preferida por idioma». No degradaba la designación anterior
ni bloqueaba las filas, así que dos altas simultáneas dejaban dos preferidas. Ahora
usa `findByLanguageForUpdate` (`SELECT … FOR UPDATE`).

El módulo pasó de 30 a 86 pruebas. Detalle completo en
`src/modules/terminology/README.md`.

### 2.1. Módulos que salen con menos rutas que UC (no son huecos)

`audit` (10), `workflow` (32), `messaging` (35), `system_context` (45) y
`lakehouse` (63) tienen menos rutas que casos de uso. **Está bien así**: sus
`.puml` marcan esos UC como `N/A`, `interno`, o de worker, o bien dos UC comparten
un mismo endpoint. Ejemplos verificados uno a uno:

- `audit`: 3 UC marcados `N/A` (triggers y consumidores de outbox); `POST /privacy/dsar`
  y `PATCH /privacy/dsar/{id}` pertenecen al mismo UC. 11 endpoints reales = 11 rutas.
- `system_context`: UC-45-08 dice literalmente *«(interno) parte del run de refresco …
  misma transacción que UC-45-07»*, por lo que está plegado dentro de
  `POST /system-context/contexts/:id/refresh`. Separarlo rompería la atomicidad
  que el propio caso de uso exige.

---

## 3. Estado de verificación

| Comprobación | Estado |
| --- | --- |
| `yarn build` | limpio |
| `yarn test` | **354 suites / 3504 pruebas en verde** |
| Cobertura de rutas vs `.puml` | 796/796, sin huecos (salvo módulos sin asignar) |
| `eslint` sobre código de producción de `terminology` | 0 hallazgos |

Las rutas nuevas con prefijo `$` se validaron contra `path-to-regexp` v8 para
confirmar que compilan: en Nest 11 sólo `:` inicia un parámetro, `$` es un
segmento literal.

---

## 4. Qué se sube al repositorio y qué no

**Se sube:** todo el código bajo `src/modules/` (controladores, servicios,
repositorios, DTOs, entidades, pruebas y READMEs). Es lo que permite a otra
persona seguir trabajando.

**No se sube** (ya cubierto por `.gitignore`, verificado con `git check-ignore`):

| Ruta | Motivo |
| --- | --- |
| `docs/postman/` | Colección y environment de Postman: herramienta de trabajo local |
| `node_modules/`, `dist/`, `coverage/` | Artefactos regenerables |
| `.env*` | Credenciales |
| `CLAUDE.md`, `.claude/` | Configuración local por desarrollador |
| `graphify-out/`, salidas del smoke | Artefactos generados |

> ⚠️ **Atención con `/docs/`.** La regla del `.gitignore` ignora **toda** la carpeta
> `docs/` de la raíz, no sólo `docs/postman/`. Si alguien deja ahí documentación
> pensada para el equipo, no se subirá y no habrá aviso. Conviene afinar la regla a
> `/docs/postman/` cuando se decida qué documentación es compartida.

---

## 5. Tareas pendientes — a asignar

Ordenadas por criticidad. Ninguna es un endpoint que falte; son cosas
transversales que afectan a **todo** el sistema, tanto a los módulos 01–31 como a
los 32–63.

### 5.1. 🔴 Aislamiento por tenant (RLS) — no existe en ninguna capa

Todos los `.puml` lo declaran como precondición («RLS por tenant»), y la guía
interna del proyecto lo marca como obligatorio. En la práctica:

- En la API **no hay** `set_config` ni `SET LOCAL` en ninguna parte
  (`grep` sobre `src/` devuelve cero resultados).
- En la base **no hay** ni un solo `CREATE POLICY` ni `ENABLE ROW LEVEL SECURITY`
  (`grep` sobre `SQL/` devuelve cero resultados).

Es decir, no se trata de que la API no propague el tenant a unas políticas ya
escritas: **las políticas no están escritas.** Hoy nada impide a nivel de base de
datos que una consulta devuelva filas de otro tenant.

Implicaría dos trabajos coordinados:
1. Escribir las políticas RLS en el esquema (`salud-db`).
2. Añadir un hook por request en la API que fije la variable de sesión del tenant
   dentro de la misma conexión/transacción.

**Impacto:** los 60 módulos. **Perfil sugerido:** quien lleve el esquema de base de
datos, junto con alguien de backend para el hook.

### 5.2. 🟠 Pruebas de integración contra base de datos real

Las 3504 pruebas actuales son **unitarias, con el `EntityManager` mockeado**.
Verifican reglas de negocio, pero **ninguna ha tocado una base de datos**. Por
tanto no están verificados: los bloqueos pesimistas (`FOR UPDATE`), las
restricciones `UNIQUE`, las FK, el SQL dinámico ni las transacciones reales.

El proyecto ya tiene el andamiaje montado (`yarn test:integration`,
`test/jest-integration.json`) — falta poblarlo.

**Impacto:** todo el sistema. **Prioridad:** alta antes de cualquier despliegue.

### 5.3. 🟡 Convertir la auditoría de endpoints en un check de CI

La comprobación `.puml` ↔ rutas se hizo con un script que **vive fuera del
repositorio** (se ejecutó en un directorio temporal). Hoy, si alguien añade un caso
de uso y olvida el endpoint, nadie se entera hasta la siguiente revisión manual.

**Tarea:** llevar ese script a `tools/`, dejarlo como comando de `package.json` y
engancharlo al CI para que un endpoint faltante rompa el build.

**Esfuerzo:** bajo. **Valor:** evita repetir esta auditoría a mano.

### 5.4. 🟡 Módulos 55, 56 y 57 — sin asignar

`document_store` (MongoDB), `redis_runtime` (Redis) y `search_platform`
(OpenSearch). 37 UC entre los tres. No tienen carpeta en `src/modules/` porque
quedaron fuera del reparto: usan motores distintos de PostgreSQL y requieren
infraestructura que aún no está decidida.

**Tarea:** decidir si entran en alcance y, en su caso, asignarlos.

### 5.5. 🟢 Gramáticas no especificadas por el modelo

En algunos puntos el modelo declara un campo pero no su sintaxis (los operadores de
regla de `$expand` en terminology; `expression_json`, `field_mapping_json` y
`dedupe_key_expr` en automation y workflow). En todos esos casos se fijó la
interpretación mínima que **falla cerrada** —una regla que no se entiende no
selecciona nada, y se registra un `warn`— y se documentó en el README del módulo
correspondiente.

**Tarea:** que negocio/terminología confirme o corrija esas interpretaciones antes
de cargar datos reales.

---

## 6. Dónde mirar

- `src/modules/<módulo>/README.md` — endpoints, reglas de negocio y decisiones de
  diseño de cada módulo.
- `src/modules/terminology/README.md` — incluye la tabla de gramáticas de `$expand`
  citada en el punto 5.5.
- `casos_de_uso/*.puml` — especificación funcional de origen.
