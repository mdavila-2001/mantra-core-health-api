# Plan de implementación API — cierre del módulo Médico

- Fecha: 2026-09-24 · Repo: `mantra-core-health-api` · Rama: `justin/medical-module-cierre-api` · Base: `origin/dev` (`7541797cd93dfe3cde50c8a7fd3bf404cc709f12`).
- Fuente funcional: plan `02-medical-module-plan-b57dfd316c4d`, basado exclusivamente en `02_METAPROMPT_MEDICO.md`.
- Resultado observable: los procesos Médicos que ya tienen un contrato aprobado conservan sus invariantes en API y persistencia; los requisitos que dependen de propietarios externos quedan explícitamente bloqueados, no se simulan.
- Datos: exclusivamente sintéticos. PostgreSQL/Mongo/Redis desechables bajo el proyecto Docker `mch-medical-20260924`; nunca usar el endpoint de base del `.env` gestionado.
- OUT: QR/pasarela/cobro integrado, movimiento de fondos, liquidación, delivery, mutaciones del módulo Paciente que pertenecen a `justin/patient-closure-api`, acuerdos ficticios de aseguradora/SEGIP/TOUS/videollamada.

## Alcance

- IN: contratos API/persistencia de perfil profesional, sedes/agenda, expediente/órdenes/resultados, avisos, cobertura/documentación fiscal e informes, conforme a las interfaces existentes y a las pruebas de aceptación MED.
- Modelo canónico: no editar DDL ni entidades sin hallar la fuente en `mantra-core-health-model`; si se requiere cambio de esquema, abrir microtarea modelada con DDL compatible y plan en worktree separado antes de implementarla.
- Los escenarios y criterios fuente están en `wt-medical-module-closure/docs/work/02-medical-module-plan-b57dfd316c4d/MATRIX.json`. La matriz API añadirá refs de integración; no duplicará responsabilidades PAC.
- Ningún cobro, pago, transferencia o comprobante se infiere de una mutación clínica. Repetición, tenant y actor son parte de cada CA.

## Estado observado — 2026-09-24

No se cambió código de producto API ni modelo. Hay pruebas unitarias dirigidas y una única integración parcial aprobadas; el init DDL canónico, la suite completa de unitarios y el lote amplio de integración no terminaron en verde. Estados de las 18 microtareas abajo reflejan evidencia parcial y bloqueos; HECHO = 0/18.

## Hitos y microtareas

### H1 — Perfil profesional y sedes (MED-01–06)
**CA:** Dado un profesional sintético, cuando consulta/edita sus categorías aprobadas, entonces cada dato conserva su tipo, titular y relación y otro tenant no lo lee.
**DoD:** tests API dirigidos + typecheck/lint; integración contra Postgres aislado cuando exista mutación; contrato generado/breaking-check si cambia OpenAPI.

| ID | Microtarea | CA / DoD | Estado |
|---|---|---|---|
| H1.S1.M1 | Inventariar DTO/entidad/DDL y tests de registro profesional, credenciales y contactos en `profiles`; comparar con fuente MED sin usar anotaciones históricas como estado. | Mapa con archivos/líneas y gaps; sólo lectura. | A MEDIAS |
| H1.S1.M2 | Verificar tipos societarios, entidad fiscal/documentos y campos NIT/razón social del emisor médico. | `profiles`/`billing` tests; no inventar entidad externa ni permitir archivo ajeno. | A MEDIAS |
| H1.S2.M1 | Verificar cardinalidad y acceso de `practice_sites` por profesional/tenant, incluidos puntos geográficos. | Specs `practice` dirigidos; tenant negativo y persistencia aislada. | A MEDIAS |

### H2 — Disponibilidad, citas y avisos (MED-07/08)
**CA:** Dado un profesional en más de una sede, cuando publica/cancela un intervalo, entonces la agenda persiste zona/sede correctas, rechaza solapes incompatibles y emite un aviso deduplicado sólo a receptores acordados.

| ID | Microtarea | CA / DoD | Estado |
|---|---|---|---|
| H2.S1.M1 | Revisar API/specs `scheduling` para sede pública/privada, períodos, zona y concurrencia. | Specs existentes `fx1/fx2/fx3/fx4`; no duplicar endpoints. | A MEDIAS |
| H2.S1.M2 | Revisar worker/outbox de demora, cancelación y cupo liberado; reproducir reinicio/reintento en aislamiento. | Tests worker/persistencia dirigidos; receptor, evento e idempotencia observados. | BLOQUEADO |

### H3 — Recepción asistida y límite PAC (MED-09)
**CA:** Dado un paciente nuevo iniciado por Médico/Secretaría, cuando completa luego la activación del flujo Paciente, entonces conserva el mismo ID y tutor/autorización, sin segunda identidad.

| ID | Microtarea | CA / DoD | Estado |
|---|---|---|---|
| H3.S1.M1 | Leer la rama base compartida y mapear el contrato de alta asistida; no modificar campos/perfiles propietarios de PAC. | Tests API existentes; revisión de contrato con fixture sintético. | BLOQUEADO |
| H3.S1.M2 | Ejecutar escenario con activación/tutor sólo si el contrato ya está presente en `origin/dev`; caso negativo de ID duplicado y tutor no autorizado. | Integration test en PostgreSQL aislado; nunca tocar worktree/branch PAC. | BLOQUEADO |

### H4 — Consulta, órdenes, resultados y cierre (MED-10–12)
**CA:** Dado un episodio sintético, cuando se guardan diagnóstico, receta y órdenes separadas, entonces autor, paciente, consulta y versiones persisten; resultado recibido es visible sólo a actores autorizados y el cierre no borra historia.

| ID | Microtarea | CA / DoD | Estado |
|---|---|---|---|
| H4.S1.M1 | Inventariar diagnosis/encounters/medication requests/orders/results, eventos y documentos. | Specs `clinical`, `diagnostics`, `chart` dirigidos; confirmar disparador de aviso. | A MEDIAS |
| H4.S1.M2 | Corregir sólo una brecha confirmada de evento, vínculo o autorización, prueba roja primero. | Integration test Postgres/Mongo según módulo; doble sólo en frontera externa declarada. | BLOQUEADO |
| H4.S2.M1 | Revisar API `virtual_encounters`; separar registro de encuentro de proveedor de video. | No declarar sala operativa sin proveedor real probado. | A MEDIAS |
| H4.S2.M2 | Buscar contrato estructurado de indicación de dosis y job persistente de medicación. | No derivar frecuencia si falta; T−15/T exige hora/zona y ciclo de cancelación/deduplicación explícitos. | A MEDIAS |

### H5 — Facturación, cobertura e informes (MED-13–15)
**CA:** Dada una consulta y cobertura vigentes, cuando facturación prepara documento/reclamo, entonces paciente/aseguradora/emisor e importes quedan enlazados sin cobrar, transferir ni duplicar valores.

| ID | Microtarea | CA / DoD | Estado |
|---|---|---|---|
| H5.S1.M1 | Trazar emisión `billing` por rol, origen/encuentro, destinatario fiscal y lectura posterior. | Specs de invoices con actor no administrador y aislamiento de tenant; no generar cobro. | A MEDIAS |
| H5.S1.M2 | Trazar reclamo de seguro y adjudicación al encounter/documento médico, separando la parte de paciente/aseguradora. | Tests exactos de vínculos/importes/moneda; API externa de aseguradora sólo mock contratado. | A MEDIAS |
| H5.S1.M3 | Revisar programación de lotes e informes existentes; registrar calendarios sin inventar términos del seguro. | Idempotencia/reinicio/cancelación en tests; sin transferencias bancarias. | TODO |
| H5.S1.M4 | Mantener fuera QR/cobro integrado y verificar que facturas, consulta de importes y cierre clínico no dependen de pago simulado. | Suite de regresión focalizada, escenario MED-E17. | A MEDIAS |

### H6 — Regresión, integración y entrega
**CA:** Los recorridos permitidos operan contra API y persistencia locales aisladas con datos sintéticos, sin errores en consola/red ni fugas entre tenants; los bloqueos externos quedan con evidencia.

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H6.S1.M1 | Montar PostgreSQL local con perfil `local-db` y proyecto/volumen exclusivos; completar init desde DDL versionado. | `pg_isready`, marcador de proyecto y DB local; jamás usar `.env` gestionado. | BLOQUEADO |
| H6.S1.M2 | Ejecutar specs dirigidos, typecheck, lint y contratos afectados; luego suite completa disponible. | Guardar salidas con códigos y conteos. | A MEDIAS |
| H6.S1.M3 | Ejecutar journeys API reales para MED-E01–E17; separar evidencia externa y `NO EJECUTADO`. | Reporte final, fixtures sintéticos y estado sin PHI. | A MEDIAS |

## Riesgos y bloqueos previstos

| Riesgo | Mitigación |
|---|---|
| `.env` local apunta a Postgres/Mongo gestionados | Nunca levantar API con esos valores; DB/servicios locales dedicados con variables sintéticas. |
| Worktree API de Paciente está activo | No tocarlo; no modificar ownership PAC; aislar rama `justin/medical-module-cierre-api`. |
| Falta proveedor/catálogo/contrato comercial | Dejar escenario bloqueado; no inventar proveedor ni respuesta. |
| Cambio requiere columna o entidad | Detener esa microtarea, planificar y probar en el repositorio/modelo fuente; no editar DDL generado. |
