# Plan — actualización segura de credenciales profesionales propias

- Fecha: 2026-09-24 · Repos afectados: `mantra-core-health-api` y `mantra-core-health` (H1-FE) · Predecesor: `02-medical-module-plan-b57dfd316c4d`, F0.M4
- Fuente funcional única: `/Users/josejeremias/Downloads/02_METAPROMPT_MEDICO.md`, SHA-256 `b57dfd316c4d642eb5e1db49257397b8fd2864b511317282ae4b70ff1262a656`.
- Criterios: H1.S1.M3, MED-04, MED-E01 y MED-E02. El nombre y alcance de este trabajo derivan sólo de la fuente Médico.
- Resultado observable: durante el alta, los títulos académicos aceptan un PDF ligado a su fila; después del alta, el profesional puede corregir una credencial propia pendiente desde la pantalla de edición. El archivo queda ligado al actor y la credencial. Credenciales verificadas o ajenas no se editan.
- Kill-test: con un ID de una credencial pendiente de otra cuenta, `PATCH /profiles/practitioners/me/credentials/:id` no cambia ni revela la fila; un intento sobre una credencial ya verificada tampoco la modifica.

## Alcance

- IN: implementar el `PATCH` que el cliente frontend ya invoca; actualizar únicamente los campos editables de una credencial pendiente; persistir un `fileId` de PDF anónimo en la fila correspondiente al dar de alta al profesional; reutilizar propiedad del perfil, servicios de archivos y columnas existentes; documentar OpenAPI; probar autorización, estado, archivo y allowlist.
- OUT: cambios al modelo/DDL, credenciales ajenas, verificación administrativa, nueva clasificación de títulos, catálogo oficial de colegios/profesiones, identidad o pantallas de Paciente, pagos, delivery, despliegue y merge. `nombre`, `país` y `ciudad` del título tampoco entran: no los exige la fuente Médico y no hay columna/contrato confirmado para ciudad.
- Ambigüedades registradas: la etiqueta normativa de matrícula/colegio y el catálogo SEGIP de ocupaciones quedan abiertos en el plan maestro; esta ruta no decide ni altera esos significados.

## H1 — Edición propia de credenciales pendientes

**CA:** Dado un profesional autenticado y una credencial suya en estado pendiente, cuando manda un `PATCH` parcial con campos editables y, opcionalmente, un archivo que él subió, entonces la lectura posterior conserva el tipo, institución, número y referencia de archivo. Un recurso ajeno se responde como no encontrado; verificación y edición concurrentes se serializan para que la revisión no valide un documento viejo.
**DoD:** specs dirigidos de servicio/repositorio/controlador/DTO, typecheck, lint, build, OpenAPI generado y validado, suite de `profiles` y prueba HTTP sobre PostgreSQL aislado con lectura posterior y caso real de bloqueo. Salidas literales en `REPORTE.md`.
**Estado:** EN CURSO

### H1.S1 — Actualización parcial con control de propietario

**CA:** Dado el `PATCH` que `ProfilesClient.updateOwnCredential()` ya envía, cuando el propietario corrige un campo editable, entonces la API valida el cuerpo, resuelve al dueño desde la sesión y persiste sólo los campos enviados.
**DoD:** tests de servicio para éxito, dueño distinto, estado no editable y archivo no utilizable; test del controller para ruta/delegación; suite dirigida, typecheck, lint y OpenAPI.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M3-API-01 | Escribir primero los tests de servicio/repositorio/controlador para editar una credencial pendiente propia, negar ID ajeno/estado bloqueado, comprobar dueño del archivo y serializar con verificación. | El test reproduce que el cliente `PATCH` no tiene handler ni caso de uso. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts src/modules/profiles/repositories/professional-credentials.repository.spec.ts src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts` → nuevo comportamiento falla por ausencia del caso/handler o locking. | HECHO — RED: 3 suites, 13 fallidas / 135 aprobadas / 148 total; causa: caso de uso/ruta/bloqueo ausentes |
| H1.S1.M3-API-02 | Agregar DTO parcial, lectura con bloqueo de fila, servicio y ruta autenticada usando `professional_credentials.file_id` y `attachableFiles.assertUsableBy` existentes; serializar también retiro/verificación de la misma fila. | Los tests anteriores pasan sin cambiar el modelo; campos ajenos al allowlist se rechazan por el ValidationPipe global. | `corepack yarn test --runInBand src/modules/profiles` → suite verde; `corepack yarn typecheck` y `corepack yarn eslint --max-warnings=0 <archivos-tocados>` → exit 0. | HECHO — 18 suites / 402 pruebas aprobadas; typecheck y lint exit 0 |
| H1.S1.M3-API-03 | Publicar el contrato de errores/respuesta en Swagger y validar el artefacto API. | OpenAPI muestra `PATCH`, request parcial y respuestas reales de la ruta. | `node tools/openapi/generate-openapi.mjs` en PG temporal → ruta y esquema generados; `corepack yarn docs:openapi:lint` → exit 0. | HECHO — generación real y lint; el artefacto versionado conserva sólo el cambio de esta ruta |
| H1.S1.M3-API-04 | Ejecutar prueba HTTP con PostgreSQL sintético y recargar la credencial si el stack aislado está disponible. | Sólo el actor titular puede comprobar la lectura persistida; se conservan estado y archivo. | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --runInBand test/integration/practitioner-own-credential.int-spec.ts` con PostgreSQL 18 efímero → HTTP + persistencia + negativas + espera de lock real. | HECHO — 1 suite / 4 pruebas aprobadas contra PostgreSQL 18 |
| H1.S1.M3-API-05 | Primero escribir tests para reclamar PDF anónimo de cada título en el alta profesional y probar rollback si una referencia no es utilizable. | Dado un alta profesional con `credentials[].fileId` de `POST /iam/auth/upload-registration-document`, entonces cada fila persiste su propio fileId y queda a nombre del actor recién creado; un PDF reclamado/no autorizado no crea cuenta ni credenciales. | RED: DTO/servicio; integración HTTP sube tres PDF sintéticos, registra dos títulos del mismo tipo y una maestría, lee filas/owner y prueba rechazo por reutilización; typecheck, lint dirigido, build y OpenAPI. | HECHO — 2 suites / 98 pruebas unitarias; 1 integración HTTP / 1 prueba contra PostgreSQL 18; typecheck, lint, build y OpenAPI válidos |

## H1-FE — Adjuntos de credenciales durante el alta

**CA:** Dado uno o más PDFs en filas distintas de título, cuando se envía el alta entonces la interfaz sube cada archivo una vez y manda su `fileId` con la fila correcta; si una subida falla, no crea la cuenta ni descarta lo capturado.
**DoD:** tests de componente/cliente RED primero, subida observada antes del alta, cuerpo con asociación por fila y fallo sin POST; typecheck, lint dirigido y build. Plan frontend: `wt-medical-execution-fe/docs/trabajo/2026-09-24-medical-credential-attachments/PLAN.md`.
**Estado:** HECHO — specs, Playwright 4/4 y captura visual revisada en el worktree frontend.

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Docker no responde en el runner y el PostgreSQL 16 instalado no trae pgvector. | Sin una base compatible, el DDL canónico falla antes de llegar al endpoint. | Se creó PostgreSQL 18 en `/tmp`, se habilitó `pgvector 0.8.6`, se sembraron sólo catálogos del repo y se ejecutó la prueba HTTP; no se usó una base compartida ni se omitió DDL. |
| La pantalla anterior vive también en ramas visuales `mockup`. | Posible confusión entre simulación y API real. | Trabajar sobre `origin/dev` y probar el servicio real. |
| La pre-carga anónima se creó originalmente para PDFs de organizaciones. | Evitar reclamar un archivo ajeno, reusado o no apto como credencial. | El contrato documenta ambos usos; mantener PDF/`DOCUMENT`; reclamar en la transacción con `AttachableFileService.claimAnonymousUpload`, `SEED.tenantId` y el usuario recién creado; probar propiedad y rollback con PostgreSQL aislado. |
| Catálogo oficial matrícula/colegio no confirmado. | MED-E02 queda abierto aunque se corrija el PATCH genérico. | No crear etiquetas ni conceptos regulatorios en esta microtarea. |

## IN / OUT por diff

IN: lo anterior más `src/modules/iam/dto/register-practitioner.dto.ts`, `src/modules/iam/services/iam-practitioner-self-registration.service.ts` y sus specs/integración para persistir fileId anónimo. H1-FE toca sólo las filas académicas del registro profesional en el worktree FE indicado.

OUT: `mantra-core-health-model/`, frontend, `.env`, `proxy.conf.json`, seeds, DDL, catálogos regulatorios y cualquier archivo propiedad de Paciente.
