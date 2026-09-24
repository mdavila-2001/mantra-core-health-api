# Reporte — verificación API del módulo Médico

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama: justin/medical-module-cierre-api
- Base: origin/dev 7541797cd93dfe3cde50c8a7fd3bf404cc709f12
- Fuente funcional única: plan 02-medical-module-plan-b57dfd316c4d, derivado exclusivamente de 02_METAPROMPT_MEDICO.md con SHA-256 b57dfd316c4d642eb5e1db49257397b8fd2864b511317282ae4b70ff1262a656
- Peldaño máximo: TESTED para unitarios/API dirigida y una integración parcial; no se alcanzó VERIFIED ni REGRESSION_VERIFIED.
- Avance: 0/18 microtareas HECHO (0 %). Estado: 12 A MEDIAS, 5 BLOQUEADO, 1 TODO.
- Alcance real: auditoría, pruebas existentes y artefactos de reporte; no se alteraron código API, pruebas, OpenAPI ni modelo/DDL.

## Completado

Ninguna microtarea API alcanzó HECHO; esta sección queda vacía porque no se cumplió un DoD integral.

## Verificaciones parciales

| Área | Comando o selección | Resultado |
|---|---|---|
| Pruebas unitarias dirigidas de perfil, sedes, agenda, clínica, virtual, diagnóstico, facturación y seguro | corepack yarn test --runInBand con 21 archivos spec dirigidos | 21 suites aprobadas; 505 pruebas aprobadas; exit 0. La lista exacta de rutas no quedó preservada en el log de salida. |
| Verificación de tipos | corepack yarn typecheck | exit 0 |
| Lint API | corepack yarn lint | exit 0 |
| Descripción OpenAPI | corepack yarn docs:openapi:lint | exit 0; “openapi.yaml validated in 1262ms; API description is valid.” |
| Pruebas del check breaking | corepack yarn docs:openapi:check-breaking:test | 20 pruebas aprobadas; no se modificó OpenAPI |
| Registro profesional aislado | test/integration/practitioner-registration.int-spec.ts tras cargar terminología sintética parcial | 1 suite, 8 pruebas aprobadas; no certifica otros recorridos ni init canónica |

## A medias

### H1 — perfil, credenciales, contactos, fiscalidad y sedes
- Qué anda: los grupos de pruebas dirigidas cubrieron perfiles y sedes sin fallar.
- Qué no anda: no se completó para cada dato el recorrido actor/tenant/API/DB/lectura posterior exigido por los CA.
- Qué falta exactamente: inventario por cada DTO/entidad/DDL, prueba negativa real entre tenants y confirmar entidad fiscal/documentos canónicos.
- Dónde quedó: API worktree y estados H1.* en PLAN.md; no hay diff de producto.

### H2 — disponibilidad y avisos
- Qué anda: pasaron las pruebas unitarias dirigidas de agenda, reservas, walk-in, demora, lista de espera y escenarios FX indicados en el registro de ejecución.
- Qué no anda: no se verificaron durable outbox/worker, destinatario, reinicio, concurrencia y persistencia con DB.
- Qué falta exactamente: levantar servicios aislados estables y ejecutar los tests persistentes después de arreglar la conexión local.
- Dónde quedó: H2.S1.M1 A MEDIAS; H2.S1.M2 BLOQUEADO.

### H3 — recepción asistida / frontera con Paciente
- Qué anda: se mantuvieron aislados los worktrees y datos del plan Paciente.
- Qué no anda: no existe evidencia de que la rama API base integre el contrato de activación/tutor de Paciente para este recorrido.
- Qué falta exactamente: confirmar contrato e identidad con su propietario; luego correr escenario sintético de ID y autorización. No duplicar ni modificar el módulo Paciente.
- Dónde quedó: H3.S1.M1 y M2 BLOQUEADOS.

### H4 — expediente, órdenes, resultados, teleconsulta y medicación
- Qué anda: pruebas unitarias de encounters, medicamentos, service requests, avisos, virtual encounters, órdenes diagnósticas y resultados pasan en la ejecución dirigida.
- Qué no anda: ningún episodio completo se confirmó con persistencia/actor siguiente; no se probó proveedor de video ni calendario persistente de tomas.
- Qué falta exactamente: ejecutar integración Postgres/Mongo estable; confirmar proveedor real, contrato de dosis estructurada, hora/zona y job con cancelación/deduplicación.
- Dónde quedó: H4.S1.M1, H4.S2.M1 y H4.S2.M2 A MEDIAS; H4.S1.M2 BLOQUEADO por infraestructura de integración.

### H5 — facturación, cobertura e informes
- Qué anda: pruebas dirigidas de invoices, statements, claims, settlement y analytics pasan; OpenAPI y sus tests pasan.
- Qué no anda: no se verificó en DB el actor médico, emisor fiscal, separación de montos ni periodicidad de lotes.
- Qué falta exactamente: integración aislada completa e identificación de los términos de aseguradora, calendario y propietario.
- Dónde quedó: H5.S1.M1, M2 y M4 A MEDIAS; M3 TODO.

### H6 — integración y regresión
- Qué anda: typecheck/lint API, OpenAPI y el caso singular de registro profesional (8/8).
- Qué no anda: inicialización DDL canónica falló; suite completa de unitarios agotó heap; lote de integración perdió conexión; no se cubrieron MED-E01–E17.
- Qué falta exactamente: que el propietario corrija la inicialización en el orden válido, disponer de Docker estable, repetir base limpia y ejecutar journeys completos. Sin evidencia, no atribuir los fallos de conexión al código de producto.
- Dónde quedó: H6.S1.M1 BLOQUEADO; M2/M3 A MEDIAS.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M2 | BLOQUEADO | DB local estable y pruebas de outbox/worker tras reinicio |
| H3.S1.M1–M2 | BLOQUEADO | Contrato con propietario Paciente, sin cambios simultáneos en sus ramas |
| H4.S1.M2 | BLOQUEADO | Conexión de integración recuperada para confirmar o descartar una brecha real |
| H5.S1.M3 | TODO | Acordar y comprobar periodicidad/idempotencia del lote con propietario de seguro |
| H6.S1.M1 | BLOQUEADO | Resolver init canónica de catálogo y levantar servicios aislados |
| H1/H2/H4/H5/H6 restantes | A MEDIAS | Cumplir CA/DoD por microtarea, incluida persistencia cuando aplica |

## Evidencia

- corepack yarn typecheck → exit 0.
- corepack yarn lint → exit 0.
- corepack yarn docs:openapi:lint → exit 0; openapi.yaml validated in 1262ms; API description is valid.
- corepack yarn docs:openapi:check-breaking:test → 20 pruebas aprobadas.
- Selección dirigida corregida → Test Suites: 21 passed, 21 total; Tests: 505 passed, 505 total. El primer intento de selección apuntó a dos paths inexistentes: 18 suites pasaron y 2 fallaron con ENOENT; al corregir los paths, el segundo intento quedó verde.
- test/integration/practitioner-registration.int-spec.ts tras carga sintética parcial → 1 suite aprobada; 8 pruebas aprobadas.
- Integración por lotes → Test Suites: 12 failed, 1 skipped, 1 passed, 13 of 14 total; Tests: 90 failed, 8 skipped, 26 passed, 124 total. En los logs de arranque consta ECONNREFUSED 127.0.0.1:55433.
- corepack yarn test --runInBand, repetido con NODE_OPTIONS=--max-old-space-size=6144 corepack yarn test --runInBand --silent → heap de Node agotado cerca de 6 GB; sin conteo final.
- init DDL original → código 3 en patch base 2026-09-19_v4221_aseguradoras_codigo_unico.sql: esperaba 17 aseguradoras canónicas y observó 0. El seeder que crea esos catálogos corre después.
- Una copia temporal de database/SQL que omitió ese patch inicializó 1260 tablas, pero no es verificación de init canónica. El seeder oficial del modelo cargó sólo el módulo 03 (1369 conceptos) y avisó 7104 referencias huérfanas de semillas de otros módulos ausentes.
- No se editaron ni alteraron pruebas. Los datos fueron sintéticos; no se usó .env administrado.

## No cubierto

No se confirmó persistencia de edición de perfiles/credenciales/documentación fiscal, aislamiento tenant negativo, worker de demoras/cancelaciones después de reinicio, frontera de identidad/tutor con Paciente, episodio completo con resultado/autoría, sala virtual real, jobs de medicación, factura/reclamo con actor real, lote periódico ni MED-E01–E17 de punta a punta. La suite completa API no produjo resumen.

## Desvíos del plan

Para obtener una prueba dirigida se cargó terminología mediante el paquete oficial del repositorio modelo en una base desechable con credenciales sintéticas y se omitieron los demás módulos seed; no se cambió el repo modelo. La primera init canónica falló por orden de datos. Después se usó una copia temporal del SQL sin el patch que depende del catálogo; esa adaptación sólo permitió el test de registro y no se considera init aprobada. Docker dejó de responder durante el lote de integración; no se reinició para no afectar servicios externos al plan.

## Riesgos residuales

La init de PostgreSQL limpia depende de seed de catálogo posterior a un patch que exige ese catálogo. Mientras no se resuelva en el propietario correcto, cualquier evidencia de integración es parcial. La suite completa API es intensiva y no terminó con el heap usado. Un caso singular verde no representa la cobertura end-to-end del plan.

## Decisiones y ambigüedades

Se conservó el alcance de identidad de Paciente y no se copiaron criterios de su plan. La primera selección unitaria falló por dos rutas inexistentes (ENOENT); se corrigió la selección y se registró aparte el resultado verde, sin alterar pruebas. No se atribuyeron los ECONNREFUSED a defectos del producto. No se cambió el modelo/DDL ni se parcheó la copia vendorizada; el defecto de orden queda explícito para su propietario. No se cambió una microtarea a HECHO porque el DoD exige evidencia integral que no existe.
