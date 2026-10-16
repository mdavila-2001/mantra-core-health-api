# Revisión transversal — deriva de esquema

Fecha: 2026-10-05. Rama: `pablo/revision-backend-2026-10-04`. Alcance: entidades MikroORM de `src/modules/**/entities`, catálogo declarativo `src/orm/catalog`, DDL versionado en `database/SQL` y SQL PostgreSQL de `database/NoSQL`, parches versionados y mecanismo de fidelidad de `src/orm/fidelity`. Esta es una **auditoría documental y estática**: no se modificó código ni se consultó una base viva.

## 1. Alcance y cobertura real

Se leyó `src/orm/fidelity/schema-fidelity.service.ts`, `fidelity-report.ts`, el bootstrap, la capa de tablas y el informe `fidelity-audit.json`. Un barrido de `CREATE TABLE` sobre los 365 `.sql` de `database/SQL` (incluidos 56 en `patches/`) y los dos `.sql` de `database/NoSQL` encontró 1.215 claves `schema.table`; se compararon con las 1.262 entidades que lee `tools/catalog/lib/tsentities.mjs`: 47 claves de entidad sin `CREATE TABLE` versionado. El conteo es de **presencia textual de tablas**, no de base materializada, y sus coincidencias no demuestran igualdad de tipos, índices ni restricciones. Las diferencias de columnas y obligatoriedad que se publican abajo se releyeron manualmente en entidad y DDL y se refutaron buscando ALTER/CREATE posteriores en **todos** los parches del worktree.

El plan original cita `/Users/pablo/Documents/GitHub/alovida/SQL`; **esa ruta no existe en este entorno**. Hay otro `../SQL` relativo a este worktree, propiedad del workspace local, cuya procedencia y versión respecto al equipo Pablo no están acreditadas; se excluyó del contraste para no presentar ese árbol como la fuente citada. Tampoco se aplicó `apply_all.sql`, no se ejecutó `api-migrate`, no se abrió PostgreSQL y no se corrió la suite. El `AGENTS.md` general pide plan y reporte separados; la instrucción de esta unidad restringe la escritura a este archivo, que documenta alcance, plan y estado de evidencia, sin crear archivos fuera de alcance.

## 2. Resumen ejecutivo

| Severidad | Hallazgos verificados | Impacto condicionado |
|---|---:|---|
| Alta | 2 (`SCH-01`, `SCH-02`) | Escritura/lectura de objetos con DDL canónico; agenda de servicios tras aplicar sólo DDL versionado |
| Media | 1 (`SCH-03`) | 31 entidades de `pharma_lab` carecen de fuente `CREATE TABLE` versionada y de FK/índices en el catálogo revisado |
| Crítica / baja | 0 / 0 | No se observó una base desplegada ni pérdida real de datos |

La salida del comparador `fidelity-audit.json` **no es** una medición de la base real: `tools/catalog/audit-fidelity.mjs:1-20` compara contra la bóveda del modelo; `SchemaFidelityService.verify()` usa `information_schema` y sólo corre cuando se lo invoca después del bootstrap (`src/orm/fidelity/schema-fidelity.service.ts:81-107`, `src/orm/bootstrap/schema-bootstrap.service.ts:117-119`). El informe de bóveda señala 3 entidades, 6 columnas faltantes y 23 diferencias de obligatoriedad, pero esos números no se trasladan aquí como hallazgos de DDL sin comprobar sus tablas y parches.

## 3. Mapa de la unidad y de las fuentes

| Componente | Función observada | Límite para esta revisión |
|---|---|---|
| `database/SQL/*/02_tables.sql`, índices y FK | DDL base. `apply_all.sql` aplica módulos en secuencia; `patches/` queda fuera y se aplica aparte (`database/SQL/README.md:99-112`). | Un `CREATE TABLE IF NOT EXISTS` no actualiza columnas de una base ya poblada. |
| `database/NoSQL/58_.../*.sql`, `59_.../*.sql` | Tablas PG de TimescaleDB (12) y pgvector (14). | Se incluyeron para descartar 26 falsos positivos de una comparación limitada a `database/SQL`. |
| `src/orm/catalog/schemas.catalog.ts` | Registra esquemas, incluido `pharma_lab` con 31 entidades (`:51`). | Registrar un esquema no genera por sí solo las FK ni los índices del dominio. |
| `src/orm/catalog/indexes`, `foreign-keys` | Define objetos que la metadata de entidades no declara; `scheduling` sí contiene índices/FK de las columnas nuevas (`indexes/scheduling.idx.ts:20,45,86-100`; `foreign-keys/scheduling.fk.ts:17,41,86-98`). | El catálogo de objetos difiere del DDL versionado; su aplicación depende de bootstrap. |
| `SchemaBootstrapService` | `off` retorna antes de verificar (`src/orm/bootstrap/schema-bootstrap.service.ts:54-64`); `safe` calcula DDL aditivo (`src/orm/bootstrap/layers/04-tables.layer.ts:24-49`). | `api-migrate` de Coolify ejecuta `safe` y fidelidad (`docker-compose.coolify.yml:633-638`), mitigando faltantes aditivos si termina bien; API corre `off` (`:213-220`). No se verificó ejecución real. |
| `SchemaFidelityService` | Detecta tabla/columna ausente, columna obligatoria no mapeada y entidad opcional ante `NOT NULL` sin default (`src/orm/fidelity/schema-fidelity.service.ts:119-219`). | No compara tipos (`:139-151`), emite advertencia y retorna reporte, sin abortar por deriva (`:62-78`). |

**Inventario de tablas sin `CREATE TABLE` en la copia versionada, agrupado por esquema:** `audit` 8, `clinical` 1, `organization_extensions` 1, `payments` 1, `pharma_lab` 31, `pharmacy_inventory` 1, `procedures_perioperative` 2, `scheduling` 1, `system_ops` 1 = **47**. Los 26 objetos `time_series`/`vector_rag` que aparentaban faltar al mirar sólo `database/SQL` quedaron **refutados** por `database/NoSQL`. La ausencia de DDL **no implica** que falten tablas en un despliegue donde `api-migrate` `safe` las creó; requiere cotejo con `information_schema` para afirmarlo.

## 4. Hallazgos por severidad, evidencia y refutación adversarial

### SCH-01 · Alta · `object_storage`: columnas optativas en entidad, obligatorias en DDL

**Evidencia exacta.** `src/modules/object_storage/entities/object_manifests.entity.ts:40-65` declara `patient_profile_id`, `current_version_id` y `retention_policy_code` con `nullable: true`. `database/SQL/60_object_storage/02_tables.sql:19-31` crea esas tres columnas como `NOT NULL`, sin default. La ruta `POST /object-storage/uploads/:id/complete` (`src/modules/object_storage/controllers/object-storage.controller.ts:88-101`) llama a `createManifest` sin `retentionPolicyCode` y con `patientProfileId` opcional (`src/modules/object_storage/services/object-storage.service.ts:285-298`, `src/modules/object_storage/repositories/object-storage.repository.ts:196-244`); `currentVersionId` se asigna más tarde, antes del cierre de la transacción (`src/modules/object_storage/services/object-storage.service.ts:325-353`). Una carga sin paciente y política, permitida por el modelo de objetos administrativos (`:982-985`), llega a la base con columnas exigidas que el servicio no suministra. Sobre el DDL versionado sin alteración ulterior, el `INSERT` falla por `23502`; el filtro HTTP hoy lo traduce a **400 / `VALIDATION_FAILED` / reason ausente** (`src/common/filters/all-exceptions.filter.ts:597-606`), aunque es deriva del servidor.

**Impacto y escenario.** Una carga no clínica de un tenant autorizado puede fallar al completar, aun con cuerpo válido. También existen otras 14 diferencias `NOT NULL`/`nullable` dentro de `object_storage` identificadas por barrido y coherentes con `fidelity-audit.json` (por ejemplo `archive_manifests.verified_at`: entidad `src/modules/object_storage/entities/archive_manifests.entity.ts:64-69`, DDL `database/SQL/60_object_storage/02_tables.sql:68`). Esas ramas adicionales no se siguen aquí hasta un endpoint, por lo que el hallazgo operativo se centra en `object_manifests`.

**Refutación adversarial.** Se buscó `ALTER TABLE "object_storage"` y esos nombres de columna en los 56 parches: no hay corrección versionada. `safe` es aditivo y no debe asumirse que quite `NOT NULL` de una columna existente (`src/orm/bootstrap/layers/04-tables.layer.ts:10-22`); el chequeo de fidelidad sí la señalaría pero sólo avisa. `currentVersionId` se asigna antes de `flush`, de modo que **no se declara** su omisión como falla en esta ruta. No se observó una base real: podría haber un ALTER externo no documentado.

**Plan de corrección (M).** 1) Confirmar en `information_schema` el estado de las tres columnas en una base de prueba reproducida desde el DDL versionado y en el entorno objetivo, sin copiar datos de salud. 2) Acordar con dueños del modelo que `patient_profile_id` y `retention_policy_code` admiten NULL para objetos no clínicos; editar la fuente canónica del modelo y regenerar `database/SQL/60_object_storage/02_tables.sql`, no modificar a mano sólo la copia. 3) Crear parche incremental `ALTER COLUMN ... DROP NOT NULL` para bases ya creadas, con auditoría de filas y rollback definido; evaluar `current_version_id` separadamente por su asignación antes de `flush`. 4) Correr comparación real entidad/base y prueba de completar carga sin paciente. 5) Revisar el resto de columnas optativas de `object_storage` con sus rutas antes de generalizar el parche.

### SCH-02 · Alta · `scheduling`: DDL carece de tabla y columnas que el catálogo y la lectura usan

**Evidencia exacta.** Existe la entidad `@Entity({ schema: 'scheduling', tableName: 'practitioner_service_offerings' })` (`src/modules/scheduling/entities/practitioner_service_offerings.entity.ts:4-52`), pero `database/SQL/41_scheduling/02_tables.sql` contiene `schedule_rules` (`:80-97`), `bookable_slots` (`:115-131`) y `appointment_bookings` (`:173-195`) sin `CREATE TABLE` para esa oferta. La entidad `appointment_bookings` declara `practitioner_service_offering_id` y `service_snapshot` (`src/modules/scheduling/entities/appointment_bookings.entity.ts:169-188`); `bookable_slots` declara `practitioner_service_offering_id` (`src/modules/scheduling/entities/bookable_slots.entity.ts:40-45`); `schedule_rules` declara `booking_mode_concept_id` (`src/modules/scheduling/entities/schedule_rules.entity.ts:68-73`). Ninguna de las cuatro columnas figura en los bloques DDL citados. El catálogo ya declara sus FK e índices (`src/orm/catalog/foreign-keys/scheduling.fk.ts:17,41,86-98`; `indexes/scheduling.idx.ts:20,45,86-100`), y una lectura SQL real hace `JOIN scheduling.practitioner_service_offerings` por `s.practitioner_service_offering_id` (`src/modules/scheduling/repositories/scheduling-offerings.repository.ts:241-251`). Si se usa sólo el DDL versionado, esa lectura falla con `42P01` o `42703`; el filtro actual acaba en **500 / `INTERNAL` / reason ausente** (`src/common/filters/all-exceptions.filter.ts:639-640,340-345`).

**Impacto y escenario.** El camino de agenda de servicios depende de una tabla y columnas no reproducibles con `apply_all.sql` y sus parches en este corte. Separa un despliegue DDL administrado por DBA (`ORM_SCHEMA_SYNC=off`) de uno con `api-migrate safe`, que podría agregar los objetos desde entidades.

**Refutación adversarial.** Se buscaron los cinco identificadores en **todo** `database/SQL/patches` y `database/NoSQL`; no aparece `practitioner_service_offerings` ni las cuatro columnas. Sí hay parches de agenda para `gap_minutes`, pago, formulario y reconsulta, pero agregan otras cosas. `api-migrate` en Coolify (`docker-compose.coolify.yml:633-638`) puede materializar la diferencia antes de servir, así que no se afirma que el despliegue Coolify actual esté roto. No se confirmó el estado de una base viva.

**Plan de corrección (L).** 1) Verificar con modelo/DBA si la oferta de servicios es un concepto aprobado y si se integra al DDL canónico o se retira de la API; no inventar tabla por conveniencia. 2) Si se aprueba, declarar tabla, columnas, tipos, nullabilidad, PK, FK e índices en la fuente del modelo y regenerar `database/SQL/41_scheduling/*`; comprobar equivalencia con `src/orm/catalog`. 3) Crear migración aditiva y backfill para bases con reservas previas, dejando las nuevas referencias anulables donde el código representa consulta sin oferta. 4) Aplicar en PostgreSQL aislado desde cero y sobre una copia sintética anterior; ejecutar `SchemaFidelityService.verify()` y la consulta del repositorio. 5) Añadir gate de CI que compare entidades/catálogo contra DDL más parches sin confundir `database/NoSQL` con ausencia.

### SCH-03 · Media · `pharma_lab`: 31 entidades sin fuente DDL ni FK/índices declarativos del dominio

**Evidencia exacta.** `src/orm/catalog/schemas.catalog.ts:51` registra `['pharma_lab', null, 'pharma_lab', 31]`; una entidad concreta es `src/modules/pharma_lab/entities/pharma_labs.entity.ts:13-38`, con `tenant_id` indicado como FK hacia `directory.tenants` (`:24-25`). `src/modules/pharma_lab/services/pharma-lab-organization.service.ts:71-103` inserta `PharmaLabs` y el controlador publica `POST /pharma-labs` (`src/modules/pharma_lab/controllers/pharma-labs.controller.ts:34-56`). El árbol `database/SQL` no tiene directorio de `pharma_lab`, ningún `CREATE TABLE "pharma_lab"...` en sus 365 SQL, ni lo aportan los 2 SQL de `database/NoSQL`; el mismo resultado surge de comparar las 31 claves de entidad con `CREATE TABLE`. La búsqueda `rg -n 'pharma_labs|medical_visitors|visit_requests' src/orm/catalog` no devuelve índices ni FK para esas tablas; sólo el esquema está registrado. El `@Property({ fieldName: 'tenant_id', type: 'uuid', unique: true })` es una columna UUID con unicidad, **no** una relación `@ManyToOne` que pruebe FK física. Una instalación sólo con el DDL versionado no puede insertar en `pharma_lab.pharma_labs` (`42P01`; respuesta actual **500 / `INTERNAL` / reason ausente**).

**Impacto y escenario.** El dominio no se puede reconstruir fielmente desde el DDL versionado. Con `api-migrate safe` las tablas pueden aparecer por metadata ORM, pero no se acredita una FK física `tenant_id → directory.tenants`; una asociación huérfana sería posible si ninguna otra barrera de persistencia la impide. No se afirma que haya huérfanos ni una base en producción sin tablas.

**Refutación adversarial.** Se inspeccionaron los 56 parches, incluido el de `data_catalog`, `qa_execution` y campañas que sí crean tablas fuera de `02_tables.sql`; ninguno crea `pharma_lab`. El reporte `fidelity-audit.json` lista entidades sobrantes respecto de la bóveda, lo que **no** autoriza borrar estas entidades: hay endpoints y servicios activos. El `safe` de Coolify reduce el riesgo de tabla ausente en ese despliegue, pero no convierte en versionado el DDL ni demuestra las FK. La ausencia del SQL externo de Pablo impide descartar que exista una migración fuera de este repo.

**Plan de corrección (L).** 1) Inventariar las 31 tablas y sus dependencias, contrastándolas con el modelo canónico con los responsables de producto y datos. 2) Aprobar su incorporación o plan de retiro; no regenerar ni eliminar a ciegas. 3) Para las aprobadas, emitir DDL de base y migración incremental con FKs, índices y política RLS, y actualizar `src/orm/catalog` desde la misma fuente; comprobar `pharma_labs.tenant_id` en particular. 4) Ejecutar `apply_all.sql` más parches aprobados en PostgreSQL aislado y comparar columnas/FK/índices contra metadata/catálogo. 5) Probar alta/lectura de laboratorio y rechazo de tenant inexistente, conservando rollback seguro.

## 5. Pruebas de cuatro puntos por hallazgo

Son **pruebas propuestas, no ejecutadas**. Las filas de “falla catalogada” describen el contrato objetivo para un error de esquema detectado antes o durante la petición: **500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT`**, reason **nuevo propuesto**, con mensaje genérico y sin nombres de tablas/columnas o datos clínicos. Hoy el reason falta. Idealmente el gate de despliegue impide servir tráfico con esa deriva; el test de filtro fija la respuesta si el incidente ocurre después de arrancar.

| Hallazgo | Punto | Tipo / spec propuesto | Preparación y entrada exacta | Resultado esperado |
|---|---|---|---|---|
| SCH-01 | Correcto | integración `test/integration/object-storage-schema.int-spec.ts` | DDL corregido, upload sintético válido, `patientProfileId` omitido, `retentionPolicyCode` omitido | `POST /object-storage/uploads/{id}/complete` devuelve 201; fila con NULL en ambas columnas |
| SCH-01 | Límite | integración, mismo spec | Igual entrada, con `patientProfileId` válido y política explícita | 201; valores persistidos; `current_version_id` apunta a versión creada |
| SCH-01 | Error | integración, mismo spec | DDL anterior con las tres columnas `NOT NULL`, completar upload sin paciente | Reproduce `23502` antes de corrección; prueba roja controlada, sin PHI en salida |
| SCH-01 | Falla catalogada | unit `src/common/filters/all-exceptions.database.spec.ts` | Simular `23502` identificado como deriva de esquema en la operación `complete` | **500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT`** tras clasificador seguro; no confundir con validación de request |
| SCH-02 | Correcto | integración `test/integration/scheduling-offerings-schema.int-spec.ts` | Base con DDL nuevo y una oferta/slot sintéticos | Lectura SQL `tramosDeServicio` devuelve cupo y colchones; no hay `42P01`/`42703` |
| SCH-02 | Límite | integración, mismo spec | Slot de consulta con `practitioner_service_offering_id=NULL` | Lectura que no requiere oferta respeta el caso consulta; ninguna FK lo bloquea |
| SCH-02 | Error | integración, mismo spec | Base reconstruida sólo con DDL viejo; ejecutar query de `scheduling-offerings.repository.ts:241-251` | Reproduce `42P01` o `42703` y se etiqueta como deriva, no como petición inválida |
| SCH-02 | Falla catalogada | unit `src/common/filters/all-exceptions.database.spec.ts` | Simular `42P01` para la consulta anterior | **500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT`**; no exponer SQL ni identificadores |
| SCH-03 | Correcto | integración `test/integration/pharma-lab-schema.int-spec.ts` | DDL y catálogo aprobados, tenant sintético existente, `POST /pharma-labs` | 201 e ID persistido; FK a `directory.tenants` visible en `pg_constraint` |
| SCH-03 | Límite | integración, mismo spec | Registrar dos laboratorios con el mismo `tenantId` | Segundo se rechaza 409/`CONFLICT`; unicidad física confirmada |
| SCH-03 | Error | integración, mismo spec | Base con sólo `apply_all.sql` viejo, sin migración del módulo | Reproduce `42P01` en inserción/lectura; no se declara éxito por crear sólo el schema |
| SCH-03 | Falla catalogada | unit `src/common/filters/all-exceptions.database.spec.ts` | Simular `42P01` de `pharma_lab.pharma_labs` | **500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT`**; `reason` fijo sin nombre de tabla |

## 6. Matriz de pruebas de la unidad completa

La matriz cubre las **superficies seguidas manualmente** y el job de materialización, no los 1.262 métodos de entidad ni todos los endpoints. Para el bootstrap, HttpStatus/ErrorCode/reason se usan como **clasificación operativa propuesta**; el job no emite una respuesta HTTP. Para los endpoints, la tupla es el contrato de filtro propuesto ante deriva.

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| `POST /object-storage/uploads/:id/complete` | Objeto no clínico se completa | Objeto con paciente y retención | DDL antiguo exige NULL prohibido | 500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT` |
| `scheduling-offerings.repository` lectura | Oferta y cupo existen | Slot sin oferta | Tabla/columna ausente | 500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT` si llega por HTTP |
| `POST /pharma-labs` | Tenant válido | Segundo laboratorio del mismo tenant | Tabla ausente o FK de tenant inexistente | 500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT` para tabla ausente; 409 / `CONFLICT` / `PHARMA_LAB_ALREADY_EXISTS` para duplicado, reason de negocio propuesto |
| `SchemaBootstrapService.run(safe,true)` | Reporte de fidelidad vacío tras migrar | DDL sin cambios, 0 sentencias | `NOT NULL` incompatible permanece | Estado de job `SCHEMA_DRIFT`, equivalente operativo 500 / `INTERNAL` / `SYSTEM_SCHEMA_DRIFT`; despliegue debe detenerse |

## 7. Catálogo de errores de esquema y límites del comparador

| Reason a crear | Status / ErrorCode | Uso y límite |
|---|---|---|
| `SYSTEM_SCHEMA_DRIFT` | 500 / `INTERNAL` | Fallo de tabla/columna ausente o `NOT NULL` contrario al contrato, diagnosticado por gate o mapeo seguro; no incluir nombres SQL en respuesta |
| `PHARMA_LAB_ALREADY_EXISTS` | 409 / `CONFLICT` | Duplicado de laboratorio por tenant, independiente de deriva |

El estado actual para `42P01`/`42703` no está en el `switch` SQLSTATE (`src/common/filters/all-exceptions.filter.ts:559-640`): cae en 500/`INTERNAL` sin reason. `23502` está mapeado a 400/`VALIDATION_FAILED` (`:597-606`), lo que clasificaría erróneamente `SCH-01` como error del cliente. El plan del catálogo de errores transversal debe decidir el clasificador seguro sin convertir **todo** `23502` en 500: puede ser un request inválido en otras rutas. La distinción requiere contexto de operación o un gate previo de esquema.

Se descartaron como hallazgos varios candidatos del barrido inicial: `time_series`/`vector_rag` están en los SQL de `database/NoSQL`; `profiles.practitioner_affiliations.role_title` fue hecho nullable en el DDL base y en el parche `database/SQL/patches/2026-09-05_v426_practitioner_affiliations_role_title_nullable.sql:11-12`; `billing.quotations.payment_frequency` sí se añade en `database/SQL/patches/2026-09-18_v4218_quotations_flexible_payment_plan.sql:48-55`. `fidelity-audit.json` llama “sobrantes” a `common.identifiers.holder_name` y `profiles.persons.work_employer_concept_id`, pero ambos aparecen en `database/SQL/02_common/02_tables.sql:16` y `database/SQL/05_profiles/02_tables.sql:24`, respectivamente. Son diferencias frente a la bóveda, **no** prueba de ausencia en DDL. Tipos SQL, nulabilidad inversa, defaults, FK e índices de las otras 1.200+ tablas no fueron validados exhaustivamente.

## 8. Olas de ejecución y esfuerzo

| Ola | Trabajo | Esfuerzo | Salida verificable |
|---|---|---|---|
| 0 | Confirmar `SCH-01` en PostgreSQL aislado y corregir nulabilidad de `object_manifests` en modelo/DDL/parche | M | Inserción sin paciente/retención y comparación `information_schema`/metadata verde |
| 1 | Resolver contrato de oferta de servicios de `SCH-02` con modelo y emitir DDL/migración | L | Base desde cero + base actualizada ejecutan query de agenda sin columnas ausentes |
| 1 | Decidir incorporación de las 31 entidades `pharma_lab` y materializar DDL/FK/índices | L | `POST /pharma-labs` persiste y `pg_constraint` acredita FK, con bootstrap en `off` |
| 2 | Añadir comparación automatizada entidad/DDL+parches+NoSQL PG y gate de fidelidad real | L | CI detecta los tres fixtures de deriva y no falla por los casos refutados |

El DDL canónico declara que la dirección de cambio es modelo → SQL → BD → ORM (`database/SQL/README.md:7-14`); los planes deben seguir esa secuencia y evitar que `safe` o un parche aislado se conviertan en la única fuente de tablas aprobadas. Cualquier migración sobre datos reales requiere diseño y aprobación propios, fuera de esta auditoría documental.

## 9. Trabajo pendiente de integrar y estado de verificación

El plan recibido menciona otros commits locales aún fuera de `origin/dev`, especialmente `fa74b78c` (errores) y `2372d42a` (DTOs). Ninguno se aplicó ni se atribuyó a este worktree; si llegan a `dev`, se revalidarán los tests y los mensajes de error. La fuente externa `/Users/pablo/Documents/GitHub/alovida/SQL` falta; una comparación con la versión que usa el DBA sigue **pendiente**. El `../SQL` del workspace local existe, pero su origen no está confirmado y no se usó.

Verificación realizada: lectura de líneas citadas; barrido de 1.262 entidades contra 1.215 `CREATE TABLE` versionados; búsqueda de las tablas/columnas de los tres hallazgos en todos los SQL y parches disponibles; revisión de mitigaciones de bootstrap. **No se corrió PostgreSQL, ni specs, ni la suite completa.** Por ello se afirma la deriva entre **artefactos versionados**, no el estado de una base desplegada. Sólo se escribió este informe.
