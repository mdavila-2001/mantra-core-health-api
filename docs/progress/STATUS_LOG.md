
## 2026-09-24T18:22:24.641563+00:00 — Carril portabilidad-aseguradora — S1-backend
- Estado: EN CURSO
- QA: no iniciado
- Ramas creadas desde dev limpio; arranco H1.S1.M1 (verify insensible a mayusculas).

## 2026-09-24T18:24:01.923371+00:00 — Carril portabilidad-aseguradora — S1.M1
- Estado: EN CURSO
- QA: ejecutando
- Pipe normaliza a minusculas y valida mayusculas/mixto; spec nuevo escrito. Corriendo yarn test.

## 2026-09-24T18:32:18.519693+00:00 — Carril portabilidad-aseguradora — S1.M1
- Estado: EN CURSO
- QA: ejecutando
- yarn test del pipe/controller corriendo en background por timeout de 120s del tool; esperando resultado antes de seguir.

## 2026-09-24T18:34:55.924034+00:00 — Carril portabilidad-aseguradora — S1.M1-M2
- Estado: EN CURSO
- QA: ejecutando
- Fixture de hash corregida a 64 chars; requestedAt unificado con generatedAt en createExportJob y en el servicio; specs nuevos escritos. Corriendo yarn test.

## 2026-09-24T18:36:24.560964+00:00 — Carril portabilidad-aseguradora — S1.M1-M2
- Estado: HECHO
- QA: PASS
- M1 (hash mayusculas) y M2 (generatedAt unico) verdes: 15/15. Repositorio de encounters agregado (M3 en curso: falta DTO+servicio+PDF+tests).

## 2026-09-24T18:38:27.468394+00:00 — Carril portabilidad-aseguradora — S1.M3
- Estado: EN CURSO
- QA: ejecutando
- encounters cableado: repositorio, DTO, servicio (build+fetch+concept lookup), seccion Atenciones en el PDF, schemaVersion /2, caso sin-coberturas (M5) y caso de mapeo de atenciones agregados al spec. Corriendo yarn test.

## 2026-09-24T18:41:19.700697+00:00 — Carril portabilidad-aseguradora — S1.M3-M5
- Estado: HECHO
- QA: PASS
- M3 (atenciones), M4 (spec del PDF) y M5 (sin coberturas) verdes: 17/17. Corrijo M6: ownership en descargas + payload VALID.

## 2026-09-24T18:42:11.213286+00:00 — Carril portabilidad-aseguradora — S1.M6
- Estado: HECHO
- QA: PASS
- M6 verde: 14/14 (ownership en descargas + payload VALID de 7 campos). Sigo con M8 (lane-29: renombrar identificadores del PDF service y del servicio).

## 2026-09-24T18:46:55.784501+00:00 — Carril portabilidad-aseguradora — S1.M8
- Estado: HECHO
- QA: PASS
- Renombres lane-29 del PDF service y del servicio (armarCertificado->buildCertificate, dibujar->draw, PapelDePortabilidad->PortabilitySheet, TablaFila->TableRow, em0->lookupEm, documento->nationalIdentifier); modulo insurance completo verde 333/333. Corriendo typecheck.

## 2026-09-24T18:54:04.135317+00:00 — Carril portabilidad-aseguradora — S1-backend
- Estado: EN CURSO
- QA: PASS parcial
- typecheck 0; modulo insurance 333/333 tras M1-M8. Corriendo lint acotado antes de M9 (OpenAPI/Postman + README).

## 2026-09-24T18:59:26.453833+00:00 — Carril portabilidad-aseguradora — S1.M1-M8
- Estado: HECHO
- QA: PASS
- S1.M1 a M8 completas: lint 0, typecheck 0, insurance 333/333. Sigo con M9 (regenerar OpenAPI/Postman + README del modulo).

## 2026-09-24T19:06:47.759588+00:00 — Carril portabilidad-aseguradora — S1.M9
- Estado: EN CURSO
- QA: ejecutando
- OpenAPI regenerado (schemaVersion/2, PortabilityEncounterDto, lint OK), Postman regenerado, seccion Portabilidad del titular agregada al README del modulo. Corriendo docs:coverage y docs:links.

## 2026-09-24T19:07:39.869925+00:00 — Carril portabilidad-aseguradora — S1-backend
- Estado: HECHO
- QA: PASS
- S1 backend completo salvo M7 (int-spec Neon, se hace despues del front por orden del plan): M1-M6,M8,M9 verdes. docs:openapi:lint OK, docs:coverage 6 problemas preexistentes en otros modulos (data_catalog/ops_console/qa_execution, no tocados), docs:links sin enlaces rotos. Paso a S2 (front).

## 2026-09-24T20:46:55.296404+00:00 — Carril portabilidad-aseguradora — S1.M7
- Estado: EN CURSO
- QA: ejecutando
- Nuevo test/integration/insurance-portability.int-spec.ts (dos cuentas por HTTP, reset=false): 403 real + fila en audit.audit_log + JSON descargado hashea igual + verify en mayusculas con generatedAt unico. Typecheck del proyecto OK. Corriendo contra Neon en background.

## 2026-09-24T21:02:23.852421+00:00 — Carril portabilidad-aseguradora — S1.M7
- Estado: EN CURSO
- QA: ejecutando
- Bug real encontrado por el int-spec contra Neon: HealthProvenanceRecords.custodianTenantId es NOT NULL y el servicio nunca lo pasaba -> TODO export real fallaba con 500 (el spec unitario con EM mockeado nunca lo hubiera detectado). Corregido con SEED.tenantId, mismo patron que createExportJob. Mismo defecto preexistente en DataReleaseService.exportBundle (fuera de alcance, se documenta en el REPORTE). Tambien corregi mi propia consulta SQL del int-spec (columna es entity, no entity_type; recorded_at, no created_at). Unit spec 14/14 verde tras el fix. Relanzando el int-spec contra Neon.

## 2026-09-24T21:05:27.517097+00:00 — Carril portabilidad-aseguradora — S1.M7
- Estado: EN CURSO
- QA: ejecutando
- Segundo bug real encontrado por Neon: falta flush() entre crear el job y el manifiesto (healthExportJobId es columna uuid plana, no relacion; MikroORM podia insertar el manifiesto antes que el job y la FK lo rechazaba con 422). Corregido con un flush explicito, mismo patron documentado en DataReleaseService. Unit spec 14/14 verde. Relanzando el int-spec.

## 2026-09-24T21:08:49.209728+00:00 — Carril portabilidad-aseguradora — S1.M7
- Estado: HECHO
- QA: PASS
- S1.M7 completo: 2/2 verde contra Neon. Se encontraron y corrigieron DOS bugs reales de produccion que ningun spec unitario (EM mockeado) hubiera detectado: (1) custodianTenantId NOT NULL nunca enviado -> 500 en todo export real; (2) faltaba flush() entre crear el job y el manifiesto -> FK violation 422 (healthExportJobId es columna uuid plana, MikroORM podia invertir el orden de insercion). CA-03 (403+auditoria real) y CA-04 (JSON hashea igual+verify en mayusculas+generatedAt unico) verificados contra base real.
