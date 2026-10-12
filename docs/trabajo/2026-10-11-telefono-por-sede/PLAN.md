# Plan — Teléfono del médico en cada lugar de atención

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-model`, `mantra-core-health-api`, `mantra-core-health` · Predecesor: ninguno
- Resultado observable: el médico puede guardar un número de contacto distinto para cada lugar donde atiende. Lo declara al registrar su consultorio propio en el alta y lo agrega o cambia para cualquier sede con una vinculación vigente desde «Dónde atiendo». La tabla muestra el número de cada fila.
- Kill-test: guardar dos números distintos para el mismo médico en dos sedes, recargar `GET /practitioners/:profileId/sites` y comprobar que cada fila conserva el suyo. El número general del perfil profesional no debe cambiar.

## Decisiones y alcance

- **Confirmado por el usuario:** el número es **opcional** y puede ser **particular para cada lugar**. Se interpreta como contacto del médico en esa sede, incluso cuando la sede pertenece a una clínica u hospital de otra organización.
- **Dato existente distinto:** el alta ya pide `workLandline` y `workMobilePhone` del perfil profesional. Se mantienen como contactos generales. El número nuevo pertenece a la vinculación `practitioner_role_assignments` (médico + sede), no a `practice_sites` compartida por todos los médicos.
- **IN:** campo nullable en la vinculación; alta de consultorio propio; edición del número para cualquier sede con asignación vigente; respuesta API; tabla y formulario de «Dónde atiendo»; simulador; migración y verificaciones de persistencia.
- **OUT:** cambiar el teléfono institucional central de una clínica; crear vinculaciones con hospitales desde el alta pública. El alta actual sólo crea el consultorio propio; las sedes ajenas se vinculan después, y allí se carga su número específico.
- **Ramas de trabajo:** `codex/phone-per-workplace-20261011` sobre `origin/dev` para API/modelo y sobre `origin/mockup` para frontend. El frontend principal tiene cambios locales ajenos a este trabajo; se preservan.
- **Cambio respecto del plan inicial:** guardar el número en la sede compartida haría que todos los médicos de esa clínica vieran el mismo teléfono. La respuesta del usuario requiere un número por médico y sede; por eso la persistencia se sitúa en la asignación de rol.

## H1 — Modelo persistente

**CA:** Dado un médico con dos sedes, cuando registra teléfonos distintos, entonces cada asignación vigente conserva su propio número opcional.
**DoD:** fuente `.puml` actualizada; SQL y entidad regenerados desde ella; diff de artefactos generado sin cambios colaterales; migración aditiva aplicable a datos existentes.
**Estado:** código y DDL escritos; parche de base existente pendiente de aplicar

### H1.S1 — Fuente canónica y materialización

**CA:** Dado el modelo de `practitioner_role_assignments`, cuando se materializa, entonces `contact_phone` es nullable y no altera las claves existentes.
**DoD:** `python3 -S salud-db/gen_ddl.py 14` y `python3 -S salud-db/check_ddl_sources.py` terminan con código 0; revisar `git diff` del módulo 14.
**Estado:** fuente, DDL y entidad generada revisados; migración escrita

| ID | Microtarea | CA (dado/cuando/entonces) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Añadir `contact_phone` a `diagram_14_practice.puml` | Dada una asignación, cuando carece de número, entonces el dato admite null | `rg -n 'contact_phone' 'Mantra Core Health Context/modules/diagram_14_practice.puml'` → una definición | ESCRITO |
| H1.S1.M2 | Regenerar DDL y entidad ORM desde el modelo | Dada la fuente actualizada, cuando se regenera, entonces SQL y ORM tienen el campo | `python3 -S salud-db/gen_ddl.py 14` + generador de entidades del módulo 14 → ambos contienen `contact_phone` | GENERADO |
| H1.S1.M3 | Preparar migración aditiva para base existente | Dada una base sin el campo, cuando se aplica la migración, entonces los registros previos siguen válidos | SQL de migración aplicado a base local → columna nullable, filas previas intactas | ESCRITO |

## H2 — API y autorización

**CA:** Dada una asignación vigente a una sede, cuando el médico guarda un teléfono, entonces la API lo devuelve en esa sede y sólo para ese médico. Si no está vinculado, se rechaza la escritura.
**DoD:** specs dirigidos API, typecheck, lint y build; integración con Postgres prueba dos sedes, dos números y autorización.
**Estado:** código revisado con `tsc` y tipo temporal ajeno al cambio; integración real pendiente

### H2.S1 — Alta y actualización

**CA:** Dado un consultorio propio o una sede vinculada, cuando se informa o limpia el número, entonces el cambio persiste en la asignación correcta.
**DoD:** specs de `own-site-provisioning` y `practitioner-sites` pasan.
**Estado:** alta, ruta y respuesta escritas; compilación dirigida con tipo temporal, integración real pendiente

| ID | Microtarea | CA (dado/cuando/entonces) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Extender `CreateOwnSiteDto` y el alta de médico con teléfono opcional | Dado un alta con `ownSite.contactPhone`, cuando termina, entonces la asignación creada tiene ese número | spec de `iam-practitioner-self-registration` → valor guardado y ausencia aceptada | ESCRITO |
| H2.S1.M2 | Añadir ruta de autoservicio para teléfono de sede vinculada | Dada una asignación vigente, cuando el actor guarda o borra el número, entonces cambia sólo esa asignación | `corepack yarn test --runInBand src/modules/practice/services/practitioner-sites.service.spec.ts` → autoriza, guarda y borra | ESCRITO |
| H2.S1.M3 | Exponer el número en `PractitionerSiteDto` | Dadas dos sedes con números distintos, cuando se listan, entonces cada una trae el suyo | spec dirigido + integración Postgres → `contactPhone` correcto o null | ESCRITO |
| H2.S1.M4 | Regenerar OpenAPI y comprobar compatibilidad | Dado un cliente que omite el campo, cuando usa las rutas existentes, entonces sigue funcionando | `corepack yarn docs:openapi:generate` + `corepack yarn docs:openapi:check-breaking` → sin ruptura | TODO |
| H2.S1.M5 | Incluir sedes vinculadas de otras organizaciones | Dado un médico con sede activa en una clínica de otro tenant, cuando consulta y edita su contacto, entonces esa sede aparece y conserva su propio número | Lectura y escritura con la asignación activa del médico → sede ajena visible y editable, otros datos intactos | COMPILA |

## H3 — Alta y pantalla «Dónde atiendo»

**CA:** Dado un consultorio propio en el alta o una sede ya vinculada, cuando el médico registra un teléfono opcional, entonces la interfaz lo muestra en su fila al volver a cargar.
**DoD:** specs dirigidos frontend, typecheck y lint de archivos tocados; Playwright contra API local con captura a 375, 768 y 1440 px.
**Estado:** frontend compilado; 229 pruebas dirigidas verdes; captura de tabla y editor realizada

### H3.S1 — Captura y presentación

**CA:** Dado un número válido, cuando se guarda, entonces el payload y la tabla usan el contacto de esa sede.
**DoD:** specs de registro, cliente de sedes y `work-history` pasan.
**Estado:** campos, cliente, tabla y simulador escritos; pruebas dirigidas verdes

| ID | Microtarea | CA (dado/cuando/entonces) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Agregar teléfono a «Su consultorio propio» en el alta | Dado un número, cuando se registra, entonces viaja como `ownSite.contactPhone` | `corepack yarn test --include=**/register-practitioner.spec.ts` → payload correcto | PRUEBA VERDE |
| H3.S1.M2 | Actualizar tipos y cliente de sedes | Dada respuesta de API, cuando se lee, entonces `contactPhone` llega a la vista | `corepack yarn test --include=**/practice-sites.client.spec.ts` → contrato HTTP correcto | PRUEBA VERDE |
| H3.S1.M3 | Permitir cambiar el número en cualquier sede vinculada | Dada una sede propia o ajena, cuando se guarda el número, entonces la lista se actualiza | `corepack yarn test --include=**/work-history.spec.ts` → propia, ajena, vacío y error | PRUEBA VERDE |
| H3.S1.M4 | Mostrar teléfono por fila y actualizar simulador | Dadas dos sedes, cuando se muestra «Dónde atiendo», entonces cada fila tiene su propio número o «Sin registrar» | Playwright 375/768/1440 → filas legibles sin scroll lateral nuevo; mocks coherentes | FOTO |

## H4 — Verificación integrada

**CA:** Dado un alta y dos sedes vinculadas, cuando se guarda, recarga y edita el teléfono de una, entonces la API y la UI conservan el otro valor.
**DoD:** ejecutar recorrido navegador → API → Postgres, inspeccionar respuestas, persistencia, consola y red; guardar capturas y `REPORTE.md` con resultados literales. Comparar regresión dirigida y documentar fallos ajenos preexistentes sin debilitar aserciones.
**Estado:** TODO

### H4.S1 — Flujo real y evidencia

**CA:** Dado el entorno local, cuando se completa el recorrido, entonces los teléfonos corresponden a sus sedes y el alta del médico conserva el dato.
**DoD:** Playwright `--workers=1` y consulta SQL por las asignaciones afectadas; reporte con evidencia.
**Estado:** TODO

| ID | Microtarea | CA (dado/cuando/entonces) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Recorrer alta propia, vinculación ajena y edición | Dados dos números distintos, cuando se recarga, entonces no se cruzan | Playwright `--workers=1` + SELECT local → dos asignaciones con valores esperados | TODO |
| H4.S1.M2 | Capturar formulario y tabla en tamaños móvil/tablet/escritorio | Dada la nueva columna, cuando se mira en 375/768/1440, entonces sigue siendo legible | capturas abiertas y revisadas; reporte documenta hallazgos | TODO |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Confundir el contacto general del médico con el de una sede | Mantener `workLandline`/`workMobilePhone` separados y usar `contactPhone` sólo en la asignación |
| Un médico modifica el teléfono central de una clínica | La ruta nueva escribe únicamente su asignación vigente; no modifica `practice_sites` |
| Datos históricos sin teléfono | Campo nullable y respuesta `null`; la interfaz muestra «Sin registrar» |
| Ramas separadas y frontend principal con trabajo local | Worktrees aislados desde `origin/dev`/`origin/mockup`; no cambiar el checkout principal |
| Reglas antiguas de correcciones sólo visuales | Este pedido explícito amplía el alcance a API y modelo; el reporte deja constancia |
