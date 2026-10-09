# Plan — Bitácora: decoradores obligatorios, candado con baseline y acciones de negocio

- Fecha: 2026-10-09 · Repos afectados: `mantra-core-health-api` · Predecesor: PR #612 (dev) / #615 (test), commit `3188262b` (bitácora transversal)
- Rama: `justin/audit-trail-business-actions` desde `origin/dev` @ `4a111bd1` · worktree `wt-audit-trail-2`
- Resultado observable: quien lee `audit.audit_log` ve en las rutas que mutan de 16 módulos sensibles un verbo de negocio (`CONSENT_CAPTURED`, `JOURNAL_POSTED`…) en lugar de `HTTP POST /ruta`, y una ruta nueva que muta sin `@Audited` ni `@NotAudited` rompe `yarn test`.
- Kill-test: agregar una ruta `@Post()` sin decorador a cualquier controlador y correr la spec del candado: debe fallar nombrando la ruta.

## Alcance
- IN: renombre `@AuditTrail`→`@Audited`, `@SkipAuditTrail`→`@NotAudited`, fuente `body.<x>` del id; spec jest que recorre la metadata de Nest con baseline que sólo se achica; `@Audited` en todas las rutas que mutan de `delegated_access`, `medical_groups`, `authz`, `consent`, `payments`, `billing`, `accounting`, `identity_assurance`, `clinical`, `clinical_ext`, `health_data`, `diagnostics`, `scheduling`, `profiles`, `chart`, `forms`; retirar el control estático `tools/alovida/audit-trail-coverage*` (reemplazado por la spec) y sus pasos de CI.
- OUT: servicios de dominio (la rama `justin/api-silent-failures` toca insurance, iam, forms, clinical, clinical_ext, read_models, consent, integrations, community, profiles — sólo se editan **controladores**); renombrar `AuditTrailInterceptor` (ya mergeado y registrado); `data_access_log` en lecturas por `POST`; atomicidad con `RLS_ENFORCE=false`; Docker, `test:integration`, smoke.
- Ambigüedades registradas:
  - El brief pide «`@Audited` o `@NotAudited('sealed in service')`» para las rutas cuyo servicio ya sella. **Supuesto:** `@Audited` con la MISMA acción que usa el servicio, porque varios servicios sellan sólo una rama (p. ej. sólo el éxito) y `@NotAudited` dejaría el fallo sin rastro; el anti-doble-sello (`markAuditSealed`) evita la fila repetida. Confirmar con la coordinadora.
  - Rutas sin decorador fuera de los 16 módulos: siguen selladas por el interceptor con identidad derivada (red de seguridad); el baseline sólo registra que les falta nombre explícito.

## H1 — Nombre de negocio obligatorio en toda ruta que muta
**CA:** Dado el árbol de controladores, cuando se corre la spec del candado, entonces falla si una ruta POST/PUT/PATCH/DELETE no tiene `@Audited` ni `@NotAudited` y no está en el baseline, o si el baseline nombra una ruta ya decorada o inexistente.
**DoD:** jest dirigido verde · `tsc --noEmit` exit 0 · eslint `--max-warnings=0` sobre lo tocado.
**Estado:** DONE

### H1.S1 — Decoradores
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Renombrar decoradores y claves; `body.<x>` como fuente del id | `@Audited({ entityId: 'body.x' })` sella el id del cuerpo | jest `src/common/audit-trail src/modules/audit/interceptors` verde | DONE |
| H1.S1.M2 | Mensajería interna pasa a `@NotAudited` | 7 rutas de cola con `@NotAudited` | tsc exit 0 | DONE |

### H1.S2 — Candado
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Spec que recorre `AppModule` → controladores → handlers | falla con una ruta sin decorador fuera del baseline (kill-test) | jest de la spec verde + kill-test rojo pegado | DONE |
| H1.S2.M2 | Baseline versionado que sólo se achica | falla si el baseline nombra una ruta decorada o inexistente | jest de la spec verde | DONE |
| H1.S2.M3 | Retirar `tools/alovida/audit-trail-coverage*` y sus pasos de CI | sin referencias colgantes | `grep -rn audit-trail-coverage` vacío | DONE |

### H1.S3 — Acciones de negocio en 16 módulos (333 rutas)
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S3.M1 | permisos y consentimiento: delegated_access, medical_groups, authz, consent | 0 rutas de esos módulos en el baseline | spec del candado verde | DONE |
| H1.S3.M2 | dinero: payments, billing, accounting | ídem | ídem | DONE |
| H1.S3.M3 | identidad: identity_assurance, profiles | ídem | ídem | DONE |
| H1.S3.M4 | PHI: clinical, clinical_ext, health_data, diagnostics, chart, forms | ídem | ídem | DONE |
| H1.S3.M5 | agenda: scheduling | ídem | ídem | DONE |

## H2 — Entrega
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | Informe `docs/progress/evidence/flujo-errores/API-A-bitacora.md` + `REPORTE.md` | salidas literales pegadas | archivo en disco | OUT — la evidencia va en el cuerpo del PR |
| H2.M2 | PR a `dev` y cherry-pick a `test`, sin mergear | dos PR abiertos | `gh pr view --json mergeable` | DONE |

## Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Importar `AppModule` en jest es pesado | RAM compartida | `--maxWorkers=1`, por `heavy.sh` |
| Conflictos con `justin/api-silent-failures` | merge | sólo controladores; decoradores en líneas propias |
| `result.id` no siempre es UUID en la respuesta | `entity_id` nulo | el interceptor ya ignora lo que no es UUID |

## Resultado (2026-10-09, retomado tras el reinicio de la Mac)
- 332 rutas de los 16 módulos con `@Audited`; `POST /payments/callbacks/:callbackPath` es `@Public` y lleva `@NotAudited` como las otras 15 públicas que mutan.
- Nombres: propuestos desde el nombre del handler y revisados a mano; donde el servicio ya sella se usa SU acción (`MEDICATION_SIGNED`, `JOURNAL_POSTED`, `CONSENT_WITHDRAWN`…), y donde el servicio sella por rama (`CONDITION_CONFIRMED`/…, `ASSET_AUTOMATION_ENABLED`/`_DISABLED`) una acción paraguas que sólo se usa si el servicio no selló (p. ej. en el fallo).
- `entity`: las 332 contrastadas contra los `tableName` reales del ORM (0 inventadas).
- Baseline: 728 rutas fuera de esos módulos, `BASELINE_SIZE = 728`.
- Kill-test: sin el `@Audited` de `ConsentsController.capture` la spec falla con `+ "POST /consent/consents (ConsentsController.capture)"`.
