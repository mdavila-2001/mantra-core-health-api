# Reporte — ejecución Codex del módulo Médico: identidad fiscal

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/medical-module-execution-20260924`
- Peldaño de evidencia alcanzado: `VERIFIED` para el NIT profesional, el aislamiento del walk-in, la autorización virtual y los roles operativos de agenda; el plan Médico global sigue abierto.
- Avance: 18 / 18 microtareas HECHO en los tramos incluidos; el plan Médico global sigue abierto.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Casos RED para relectura, cambio parcial y cierre del NIT. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts` | RED: 3 fallos nuevos / 141 aprobadas. |
| H1.S1.M2 | DTO, persistencia histórica y lectura propia del NIT y razón social; la ficha pública no consulta ni devuelve el dato. | Mismo spec dirigido tras implementar. | GREEN: 144/144. |
| H1.S1.M3 | OpenAPI YAML/JSON y gates del diff actualizados. | typecheck, ESLint dirigido, `corepack yarn docs:openapi:lint`, parse JSON y `git diff --check`. | Todos terminaron con código 0; OpenAPI válido. |
| H1.S1.M4 | Recorrido HTTP sobre PostgreSQL 18: alta, dos PATCH, relectura, dos filas históricas y privacidad pública. | `corepack yarn test:integration test/integration/practitioner-own-profile.int-spec.ts --runInBand --silent` con base efímera materializada desde `database/SQL/apply_all.sql` y `apply_deferred.sql`. | 1 suite / 6 pruebas aprobadas. |
| H1.S1.M5 | Cambio publicado en el PR API. | `git push origin justin/medical-module-execution-20260924` | Commit `27055a6d` publicado en el PR #453. |
| H2.S1.M1 | Causa del check `docs` del PR #453 identificada. | `gh run view 36041223938 --job 107773588987 --log-failed`; comparación del workflow contra `origin/dev`. | La imagen histórica de MinIO responde `unauthorized`; `.github/workflows` no pertenece al diff médico. |
| H3.S1.M1 | Caso RED para el UUID de una agenda perteneciente a otro tenant. | Spec dirigido de `SchedulingBookingsService`. | RED: el promise resolvió una cita confirmada; 1 fallo nuevo / 154 aprobadas. |
| H3.S1.M2 | La cita directa compara `resource.tenantId` con el tenant activo antes del bypass del mostrador y rechaza sin alcance comprobable. | Specs dirigidos de bookings y walk-in. | GREEN: 2 suites / 159 pruebas. |
| H3.S1.M3 | Recorrido HTTP con un rol `SCHEDULING_AGENT` limitado al tenant A y un recurso movido al tenant B. | `corepack yarn test:integration test/integration/fx10-mostrador-atomico.int-spec.ts --runInBand --silent` sobre PostgreSQL 18 efímero. | 1 suite / 3 pruebas; 403 y cero identificadores para el paciente provisional. |
| H3.S1.M4 | Regresión del módulo, gates y publicación en el PR API. | Suite `src/modules/scheduling`, typecheck, ESLint dirigido, `git diff --check`, commit y push. | 21 suites / 493 pruebas; gates en código 0; publicado en PR #453. |
| H4.S1.M1 | Casos RED de unión por tercero y acceso del rol paciente al endpoint. | Specs dirigidos de servicio y controlador. | RED: 2 fallos nuevos / 9 aprobadas. |
| H4.S1.M2 | Create/join/end resuelven el encuentro padre y validan tenant, paciente titular, profesional principal o participante activo antes de mutar. | Specs dirigidos tras implementar. | GREEN: 2 suites / 18 pruebas. |
| H4.S1.M3 | Recorrido HTTP: profesional principal crea, paciente titular se une, profesional ajeno recibe 403 y la fila sigue `IN_PROGRESS`; el titular profesional finaliza. | Integración sobre PostgreSQL 18 efímero. | 1 suite / 1 prueba en 17.841 s. |
| H4.S1.M4 | Regresión de `clinical_ext`, typecheck, ESLint dirigido y diff check. | Gates locales y publicación en PR #453. | 15 suites / 84 pruebas; todos los gates terminaron en código 0. |
| H5.S1.M1 | Caso RED del catálogo de roles de agenda. | Spec dirigido de `scheduling.roles`. | RED: Jest no pudo resolver el módulo inexistente. |
| H5.S1.M2 | Catálogo determinista de `SCHEDULING_ADMIN` y `SCHEDULING_AGENT`, agregado al seed común con scope `TENANT`. | Spec de catálogo y consulta sobre bootstrap PostgreSQL. | Ambos roles existen, son de sistema y asignables; bases `ADMIN`/`STAFF`. |
| H5.S1.M3 | FX-10 dejó de insertar rol y asignación por SQL; usa `POST /authz/users/:id/role-assignments` y comprueba el claim posterior. | Integración FX-10 sobre PostgreSQL 18 efímero. | 1 suite / 3 pruebas en 14.719 s; `scopedRoles[tenant]` contiene `SCHEDULING_AGENT`. |
| H5.S1.M4 | Regresión scheduling, typecheck, ESLint dirigido y diff check. | Gates locales y publicación en PR #453. | 22 suites / 494 pruebas; todos los gates terminaron en código 0. |

## A medias

Ninguna dentro de los tramos incluidos en este plan.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| CI-DOCS | BLOQUEADO | Sustituir la distribución histórica retirada de MinIO mediante un cambio de infraestructura separado y basado en una fuente oficial. |

## Evidencia

```text
Test Suites: 20 passed, 20 total
Tests:       418 passed, 418 total
Snapshots:   0 total
```

```text
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        6.184 s
```

```text
Test Suites: 2 passed, 2 total
Tests:       159 passed, 159 total
```

```text
Test Suites: 21 passed, 21 total
Tests:       493 passed, 493 total
```

```text
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        15.507 s
```

```text
Test Suites: 15 passed, 15 total
Tests:       84 passed, 84 total
```

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Time:        17.841 s
```

```text
Test Suites: 22 passed, 22 total
Tests:       494 passed, 494 total
```

```text
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        14.719 s
```

```text
openapi/openapi.yaml: validated in 484ms
openapi.json: valid JSON
```

Typecheck, ESLint dirigido y `git diff --check` finalizaron con código 0.

## No cubierto

- Pantalla frontend y captura visual del perfil fiscal.
- Entidad fiscal empresarial, documentos legales, representante, poder, pagos y aseguradoras.
- Suite global completa de la API.
- Auditoría de todos los endpoints de agenda que cargan recursos por UUID.
- Integración con un proveedor real de videollamada, credenciales de sala, expiración y grabación.

## Desvíos del plan

- La primera corrida de integración encontró la base vacía porque `test:integration` fuerza `ORM_SCHEMA_SYNC=off`. Se materializó el DDL versionado y se repitió; la segunda corrida fue verde.
- No se corrigió el workflow de MinIO dentro de este PR: el fallo antecede al diff médico y las distribuciones históricas oficiales consultadas ya no están disponibles por etiqueta, digest ni descarga directa.
- La primera extensión de FX-10 dejó ambos profesionales en el tenant semilla y no reprodujo el cruce. El fixture final conserva un recurso válido y cambia su `tenant_id` a otra organización sembrada antes de ejecutar la solicitud.

## Riesgos residuales

- El check `docs` seguirá bloqueado hasta que la infraestructura adopte una distribución oficial disponible o construya MinIO desde la fuente fijada.
- El contrato empresarial de MED-06 todavía debe decidir si el emisor fiscal vive en la persona, práctica o tenant.
- El enlace y las credenciales de la sala virtual siguen siendo datos declarados por el cliente hasta que se apruebe el contrato con un proveedor.

## Decisiones y ambigüedades

- Se reutilizó `common.identifiers` con `ID_TYPE_TAX`, igual que Paciente, sin cambios de DDL.
- Una edición parcial conserva el campo fiscal omitido; vaciar el número cierra la fila vigente sin crear otra.
- NIT y razón social sólo se leen en `me/summary`; la ficha pública no ejecuta la consulta de filiación privada.
- El tenant activo resuelto por el guard es la autoridad para una solicitud HTTP; `actor.tenantIds` sólo respalda invocaciones internas y, si ambos faltan, la cita directa falla cerrada.
- Una sesión virtual no concede acceso por `createdByUserId` ni por rol general. `join` admite al paciente titular; `create` y `end` exigen profesional principal o participante activo. `SUPERADMIN` tampoco evita esa relación clínica.
- Los roles de scheduling son catálogos de sistema globales; su asignación sigue siendo explícita y acotada por tenant. El bootstrap no los concede automáticamente.
