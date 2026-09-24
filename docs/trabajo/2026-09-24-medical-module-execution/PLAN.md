# Plan — actualización segura de credenciales profesionales propias

- Fecha: 2026-09-24 · Repos afectados: `mantra-core-health-api` · Predecesor: `02-medical-module-plan-b57dfd316c4d`, F0.M4
- Fuente funcional única: `/Users/josejeremias/Downloads/02_METAPROMPT_MEDICO.md`, SHA-256 `b57dfd316c4d642eb5e1db49257397b8fd2864b511317282ae4b70ff1262a656`.
- Criterios: H1.S1.M3, MED-04, MED-E01 y MED-E02. El nombre y alcance de este trabajo derivan sólo de la fuente Médico.
- Resultado observable: después del alta, un profesional autenticado puede corregir una credencial propia aún pendiente desde la pantalla de edición; el archivo adjunto debe seguir siendo de ese actor. Credenciales verificadas o de otra persona no se editan.
- Kill-test: con un ID de una credencial pendiente de otra cuenta, `PATCH /profiles/practitioners/me/credentials/:id` no cambia ni revela la fila; un intento sobre una credencial ya verificada tampoco la modifica.

## Alcance

- IN: implementar el `PATCH` que el cliente frontend ya invoca; actualizar únicamente los campos editables de una credencial pendiente; reutilizar propiedad del perfil, validación del archivo y entidad/columna existentes; documentar la ruta con Swagger; probar autorización, estado, archivo y campos permitidos.
- OUT: cambios al modelo/DDL, credenciales ajenas, verificación administrativa, nueva clasificación de títulos, catálogo oficial de colegios/profesiones, identidad o pantallas de Paciente, pagos, delivery, despliegue y merge.
- Ambigüedades registradas: la etiqueta normativa de matrícula/colegio y el catálogo SEGIP de ocupaciones quedan abiertos en el plan maestro; esta ruta no decide ni altera esos significados.

## H1 — Edición propia de credenciales pendientes

**CA:** Dado un profesional autenticado y una credencial suya en estado pendiente, cuando manda un `PATCH` parcial con campos editables y, opcionalmente, un archivo que él subió, entonces la lectura posterior conserva el tipo, institución, número y referencia de archivo. Un recurso ajeno se responde como no encontrado; verificación y edición concurrentes se serializan para que la revisión no valide un documento viejo.
**DoD:** specs dirigidos de servicio/repositorio/controlador/DTO, typecheck, lint, build, OpenAPI generado y validado, suite de `profiles` y prueba HTTP sobre PostgreSQL aislado con lectura posterior y caso real de bloqueo. Salidas literales en `REPORTE.md`.
**Estado:** HECHO

### H1.S1 — Actualización parcial con control de propietario

**CA:** Dado el `PATCH` que `ProfilesClient.updateOwnCredential()` ya envía, cuando el propietario corrige un campo editable, entonces la API valida el cuerpo, resuelve al dueño desde la sesión y persiste sólo los campos enviados.
**DoD:** tests de servicio para éxito, dueño distinto, estado no editable y archivo no utilizable; test del controller para ruta/delegación; suite dirigida, typecheck, lint y OpenAPI.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M3-API-01 | Escribir primero los tests de servicio/repositorio/controlador para editar una credencial pendiente propia, negar ID ajeno/estado bloqueado, comprobar dueño del archivo y serializar con verificación. | El test reproduce que el cliente `PATCH` no tiene handler ni caso de uso. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts src/modules/profiles/repositories/professional-credentials.repository.spec.ts src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts` → nuevo comportamiento falla por ausencia del caso/handler o locking. | HECHO — RED: 3 suites, 13 fallidas / 135 aprobadas / 148 total; causa: caso de uso/ruta/bloqueo ausentes |
| H1.S1.M3-API-02 | Agregar DTO parcial, lectura con bloqueo de fila, servicio y ruta autenticada usando `professional_credentials.file_id` y `attachableFiles.assertUsableBy` existentes; serializar también retiro/verificación de la misma fila. | Los tests anteriores pasan sin cambiar el modelo; campos ajenos al allowlist se rechazan por el ValidationPipe global. | `corepack yarn test --runInBand src/modules/profiles` → suite verde; `corepack yarn typecheck` y `corepack yarn eslint --max-warnings=0 <archivos-tocados>` → exit 0. | HECHO — 18 suites / 402 pruebas aprobadas; typecheck y lint exit 0 |
| H1.S1.M3-API-03 | Publicar el contrato de errores/respuesta en Swagger y validar el artefacto API. | OpenAPI muestra `PATCH`, request parcial y respuestas reales de la ruta. | `node tools/openapi/generate-openapi.mjs` en PG temporal → ruta y esquema generados; `corepack yarn docs:openapi:lint` → exit 0. | HECHO — generación real y lint; el artefacto versionado conserva sólo el cambio de esta ruta |
| H1.S1.M3-API-04 | Ejecutar prueba HTTP con PostgreSQL sintético y recargar la credencial si el stack aislado está disponible. | Sólo el actor titular puede comprobar la lectura persistida; se conservan estado y archivo. | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --runInBand test/integration/practitioner-own-credential.int-spec.ts` con PostgreSQL 18 efímero → HTTP + persistencia + negativas + espera de lock real. | HECHO — 1 suite / 4 pruebas aprobadas contra PostgreSQL 18 |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Docker no responde en el runner y el PostgreSQL 16 instalado no trae pgvector. | Sin una base compatible, el DDL canónico falla antes de llegar al endpoint. | Se creó PostgreSQL 18 en `/tmp`, se habilitó `pgvector 0.8.6`, se sembraron sólo catálogos del repo y se ejecutó la prueba HTTP; no se usó una base compartida ni se omitió DDL. |
| La pantalla anterior vive también en ramas visuales `mockup`. | Posible confusión entre simulación y API real. | Trabajar sobre `origin/dev` y probar el servicio real. |
| Catálogo oficial matrícula/colegio no confirmado. | MED-E02 queda abierto aunque se corrija el PATCH genérico. | No crear etiquetas ni conceptos regulatorios en esta microtarea. |

## IN / OUT por diff

IN: `src/modules/profiles/dto/`, `src/modules/profiles/controllers/profiles-practitioners.controller.ts`, `src/modules/profiles/services/profiles-practitioners.service.ts`, `src/modules/profiles/repositories/professional-credentials.repository.ts` y sus specs; OpenAPI generado sólo si el repo lo versiona.

OUT: `mantra-core-health-model/`, frontend, `.env`, `proxy.conf.json`, seeds, DDL, catálogos regulatorios y cualquier archivo propiedad de Paciente.
