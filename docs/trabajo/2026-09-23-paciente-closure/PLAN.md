# Plan local — cierre funcional de Paciente (API)

- Fecha: 2026-09-23 · Repo: `mantra-core-health-api` · Rama: `justin/patient-closure-api` · base `dev` (`7541797cd93dfe3cde50c8a7fd3bf404cc709f12`).
- Fuente funcional única: [plan maestro](../../../../MetaPrompts/PLAN_PACIENTE_01_METAPROMPT_17b41ce468a1_2026-09-23/PATIENT_PLAN_01_METAPROMPT_2026-09-23.md); [metaprompt literal](../../../../MetaPrompts/PLAN_PACIENTE_01_METAPROMPT_17b41ce468a1_2026-09-23/SOURCE.md), SHA-256 `17b41ce468a147a4a4e97cc3b028869bed4088fe314845e3e8bf3f28f7f2b9b5`. El maestro contiene los 71 IDs, criterios CA/DoD, límites y decisiones. No derivar alcance de otros metaprompts.
- Estado actualizado 2026-09-24: PARCIAL. H0.S2.M2 real aprobado; copagos integración 8/8 en DB desechable. Consolidación: [REPORTE.md](../../../../MetaPrompts/PLAN_PACIENTE_01_METAPROMPT_17b41ce468a1_2026-09-23/REPORTE.md). No se cerró ningún criterio fuente completo.
- Resultado observable: IAM/Profiles/Agenda/Clinical/Diagnostics/Pharmacy/Insurance/Messaging exponen y autorizan las capacidades existentes del paciente con consistencia de IDs, transición, decimales y visibilidad.
- Kill-test: paciente sintético se registra, persiste ubicación, recibe una orden emitida por médico sintético y, en nueva sesión, API devuelve paciente/ubicación/orden/autor desde DB real.

## Alcance

- IN: tareas API M1 de H1–H6 y comprobación API M3/M7 según el maestro; pruebas unitarias y de integración sólo con DB desechable aislada.
- OUT: `.env`, `proxy.conf.json`, modelo y DDL generado a mano, despliegue/PR/merge/producción, endpoints inventados, integraciones externas sin contrato, datos productivos y pruebas que trunquen una DB compartida.
- Decisiones: D02, D03, D04, D05, D06, D07, D08, D10 y D11 del maestro quedan explícitas; no inventar catálogos, acuerdos, firmas ni conclusiones jurídicas.

## Hitos y microtareas

- H0 (línea base/contratos): H0.S1.M3 corre suite por workers; H0.S2.M1 documenta P01–P10; H0.S2.M2 HECHO con DB aislada y lectura SQL; H0.S2.M3 conserva 107 hojas, 104 IN y 3 OUT.
- H1 (alta/perfil), H2 (representación), H3 (agenda), H4 (documentos/avisos), H5 (pedidos sin cobertura), H6 (cobertura): ejecutar cada M1 con spec de servicio/DTO después de identificar la brecha. Las filas y criterios exactos están en el maestro; una prueba con ORM doble no acredita escritura real.
- H7: integración/aislamiento y regresión sólo sobre infraestructura desechable; M3 por contrato no equivale a autorización para tocar un stack compartido.

| Unidad | Criterio de aceptación | DoD local | Estado inicial |
|---|---|---|---|
| H0.S1.M3 | Dado el SHA API aislado, cuando corre toda la suite, se conoce conteo exacto. | `corepack yarn test` usando `maxWorkers:4`/`workerIdleMemoryLimit:768MB` de Jest; salida completa guardada. | HECHO (8.422/8.423; un contrato live externo opt-in) |
| H0.S2.M2 | Dado paciente sintético, API real persiste ubicación/orden/autoría y nueva sesión recupera los datos. | Playwright PAC-KILL + consulta SQL de sólo lectura en PostgreSQL aislado. | HECHO; 1/1; evidencia en REPORTE maestro |
| H1–H6 M1 | Dado actor/cuerpo del criterio origen, cuando la API procesa, respeta autorización, DTO, persistencia y rechaza datos/actores ajenos. | Caso unitario TDD dirigido por servicio; gates API. Persistencia sólo con integration spec seguro. | TODO |
| H1–H6 M3, H7.S1.M2 | Dada infraestructura, cuando el journey real se ejecuta, UI/API/DB coinciden y se conserva aislamiento/idempotencia. | `corepack yarn test:integration ...` sólo con fixture/env auditados y entorno desechable; evidencia con lectura posterior. | PARCIAL; H0.S2.M2 y una suite de copagos pasaron; otros journeys pendientes |
| H7.S4.M3 | Dada la rama final, cuando corren gates y regresión, baseline y conteos se comparan. | typecheck, lint, build, suite completa por workers; outputs archivados. | TODO |

## Reglas de ejecución

TDD por microtarea: reproducir primero; nunca `skip`/`only`, borrar tests ni debilitar aserciones; cambio mínimo; test dirigido; typecheck/lint; revisión del diff. `test:integration` se audita antes de correr. El harness puede truncar esquemas de negocio con `resetBusinessData()`: queda prohibido invocarlo contra el stack/DB local compartido. El run actual usó sólo `patient-copays-17b41ce4`; cada futura prueba requiere confirmar nuevamente su destino antes del reset.
