# Verificación de escrituras y lectura de porciones — Subtarea 2.4

Fecha: 2026-09-13. Repositorio: `mantra-core-health-api`.

Las escrituras vinculadas, su autorización, la validación decimal y el helper HTTP están implementados. El typecheck global y las unitarias anteriores pasaron. El setup de participantes y recursos terminó por HTTP y exportó el fixture; el error posterior de lectura del perfil se corrigió en `0972bbf0`. La petición real ahora responde 200 y preserva identidades, beneficio fraccionario y copago cero. El perfil final pasó 2/2 en navegador (26.6 s), con ambas capturas inspeccionadas; la liquidación financiera completa sigue pendiente.

Los archivos `.log` y la lista de archivos de lint se conservan localmente en esta carpeta y se indican como rutas, no como enlaces públicos. El resumen JSON enlazado sí se versiona.

| Comprobación | Resultado observado | Evidencia |
| --- | --- | --- |
| Formato inicial de 24 archivos | ExitCode 0 | `formatter.log` |
| Lote de 14 suites | 12 suites correctas; 358 de 360 pruebas correctas; ExitCode 1; 173.457 s | `unit-tests.log`, [resultado JSON](unit-tests-result.json) |
| Corrección y repetición de las 2 suites afectadas | 2 suites, 37 pruebas correctas; ExitCode 0; 18.061 s | `unit-tests-corrections.log` |
| Lint de 43 archivos TypeScript modificados | ExitCode 0 | `lint.log`, `lint-files.txt` |
| Regresión final de autorización por identificador | 3 suites, 80 pruebas correctas; ExitCode 0; 77.552 s | `unit-tests-authorization.log` |
| Lint de los 6 archivos de autorización modificados después del lote general | ExitCode 0 | `lint-authorization.log` |
| Typecheck global, incluida la autorización de detalle de farmacia | ExitCode 0; sesión 41321 finalizada | `typecheck.log` |
| Acceso al detalle de farmacia | 2 suites, 84 pruebas correctas; ExitCode 0; 35.249 s | `pharmacy-read-access.log` |
| Bootstrap HTTP inicial con PostgreSQL aislado | ExitCode 1; timeout de beforeAll a los 300000 ms; 434.074 s; fixture no creado | `integration-bootstrap-http.log` |
| Bootstrap HTTP con instrumentación y límite de 600000 ms | ExitCode 1; setup HTTP completo y exportación PASS; perfil respondió 400; 1 FAIL, 1 PASS y 6 omitidas; 221.059 s | `integration-bootstrap-final.log` |
| Build global oficial | ExitCode 0; sesión 50586 finalizada | `build.log` (salida silenciosa) |
| Compilación incremental después de la corrección Swagger | `yarn.cmd exec tsc -p tsconfig.build.json`: ExitCode 0; sesión 21892 finalizada | Confirmación del proceso finalizado por coordinación |
| Generación OpenAPI anterior a la corrección final | ExitCode 0; 1168 paths, 1266 operaciones, 1144 esquemas | `openapi.log` |
| Documentación de endpoints anterior a la corrección final | ExitCode 0; 1266 endpoints, 66 módulos, 67 archivos Markdown | `endpoints.log` |
| Redocly final y HEAD | Ambos ExitCode 1; mismas 12 rutas: 10 security-defined, 1 no-identical-paths, 1 operation-2xx-response; sin fallos nuevos | `openapi-final-lint.log`, `openapi-baseline-lint.log` |
| Lint de nueve archivos y corrección de metadatos | Intento inicial ExitCode 1, 13 errores unbound-method en un archivo. Correctivo ExitCode 0; 1 prueba PASS, 32 omitidas, 21.501 s | `lint-final-delta.log`, `lint-metadata-correction.log`, `unit-metadata-correction.log` |
| Regeneración OpenAPI y documentación final | ExitCode 0; 1168 paths, 1266 operaciones, 1153 esquemas; 66 módulos y 67 documentos | `openapi-final.log`, `endpoints-final.log` |
| Auditoría del contrato de los tres GET de pedidos | ExitCode 0; 90 propiedades, 10 clases alcanzables, 9 nuevas; tipos y nulabilidad coinciden | [JSON del contrato](openapi-contract-verification.json) |
| Regresión de perfil y vigencias tras corregir el parámetro PostgreSQL | 2 suites y 114 pruebas PASS; 6.456 s; lint de dos archivos e incremental compile ExitCode 0 | `profile-array-regression-after-corrected.log`, `profile-array-lint.log`, `profile-array-compile.log` |
| Typecheck global final tras perfil/FK/moneda | `yarn.cmd typecheck`: ExitCode 0; incluye specs y últimas fuentes; `API_FINAL_TYPECHECK_EXIT=0` | `typecheck-final-profile-currency.log`, sesión 28684 |
| Perfil real final de dos pacientes | Ambos login/perfil 200; póliza y beneficio CURRENT; identidades estables; 80.25/0/10.50 BOB; segundo paciente sin póliza/plan del primero | [JSON HTTP final](profile-real-http-final.json) |
| Estado del perfil por FK | 2 suites, 115 PASS; 76.966 s; lote separado del de 114 casos | `profile-status-fk-tests.log` |
| Descubrimiento Jest acotado | --listTests exit 0, 1 spec; no ejecuta integración ni acredita mejora de velocidad | [JSON de descubrimiento](jest-crawl-scope-verification.json) |
| Catálogo de moneda y helper | Consulta aislada exit 0; 3 suites, 148 PASS, 13.162 s; lint de siete archivos y compile exit 0; HTTP final de dos pacientes PASS; perfil real final 2/2 y ambas capturas inspeccionadas | [JSON de catálogo y pruebas](currency-catalog-observation.json), `profile-currency-final-tests.log` |
| Dos patches de despliegue promovidos al modelo y sincronizados | Modelo 70abc7d y API 1f8851d1; sync oficial, --check y check_ddl_sources exit 0. Dos sentencias verificadas en PG aislado con ROLLBACK y baseline restituido; no patch completo | [JSON de fidelidad](deployment-patch-fidelity.json), [prueba PG](default-privileges-rollback-verification.json) |
| Sintaxis de preload de integración: `node --check test/support/copays-isolated-env.cjs` | ExitCode 0, sin salida | No ejecuta el preload ni abre conexiones |
| `git diff --check` | ExitCode 0; avisos de conversión CRLF/LF | Comprobación final de whitespace |

Los dos fallos iniciales estaban localizados:

- La prueba nueva de porciones esperaba `20.001 × 0.5 = 10.0005`. El motor de farmacia existente congela importes con `multiplyAmounts`, que aplica redondeo decimal half-up de dos posiciones: `10.00`. La expectativa se alineó con ese importe congelado. También se filtraron porciones liberadas y sin stock, conservando confirmadas y entregadas; la prueba incluye ambos estados descartados.
- Una prueba de metadatos exigía que las cuatro escrituras de reclamos heredaran los roles globales históricos. Las seis rutas vinculadas de reclamos/autorizaciones delegan ahora en la membresía del servicio. La prueba conserva los roles de disputas y los metadatos de clase; las pruebas de servicio comprueban que los genéricos siguen protegidos.

Las siete regresiones finales cubren STAFF y aseguradora ajena con el mismo cuerpo 403 que un recurso inexistente, tanto en la rama vinculada como en la genérica. Sólo se normaliza `ForbiddenException`; un error de infraestructura conserva su identidad. Esas siete pruebas se suman al conjunto anterior: la evidencia de 367 casos distintos está distribuida entre los lotes y sus repeticiones focalizadas.

## Contratos comprobados por las pruebas

- `POST /insurance-claims` devuelve `CreatedClaimDto` con `lineIds?: string[]` sólo para un reclamo vinculado, ordenados por `lineSequence`. Un replay equivalente devuelve los mismos identificadores bajo el lock del pedido. Una clave con otro origen, cobertura, aseguradora, prestador, moneda, secuencia o importe recibe conflicto. El genérico conserva la respuesta anterior.
- La autorización del pedido y del prestador precede a las consultas de cobertura privada. Las mutaciones por identificador devuelven el mismo 403 para un recurso ausente y uno fuera de alcance.
- El alta exige OWNER/ADMIN activo del prestador; adjudicar, publicar, revertir y determinar autorización previa exigen administración activa de la aseguradora. Los accesos administrativos de plataforma se mantienen.
- Las líneas de farmacia representan todas las porciones físicas confirmadas. Las diagnósticas corresponden a una orden y oferta del prestador asignado. Se usan tipos reales PHARMACY y DIAGNOSTIC_UNIT.
- `validateLinkedClaimSettlement` exige líneas completas y únicas, importes decimales no negativos, conciliación sin solapamiento y cláusula para denegación o importe excluido.
- Las nuevas adjudicaciones conservan las versiones anteriores. Publicar comprueba la versión vigente y el paciente real de la cobertura; revertir conserva el historial.
- `loadSnapshots` trabaja por lotes y `matchesLinkedClaimSnapshot` compara origen, porciones, cantidades, moneda e importes. La entrega parcial/completa no cambia el importe congelado; cancelación, vencimiento, sustitución pendiente o cambio económico impiden tratarlo como vigente.
- La autorización previa acepta `medicationRequestId` como dato opcional del pedido de farmacia vinculado y exige coincidencia con su receta real.
- `test/support/copays-pharmacy-scenario.ts` construye y consulta el escenario exclusivamente por HTTP. Usa `GET /pharmacy/orders/:id → reservationLines` para obtener las FK físicas. Crea dos pedidos de una misma receta y un primer pedido repartido entre lotes. Su ejecución real corresponde al coordinador.

## Comandos de pruebas

Lote inicial:

```powershell
yarn.cmd test --runInBand src/modules/insurance/services/linked-claim-validation.spec.ts src/modules/insurance/services/linked-claim-access.service.spec.ts src/modules/insurance/services/linked-claim-order.service.spec.ts src/modules/insurance/services/claims-linked.service.spec.ts src/modules/insurance/services/prior-auth-linked.service.spec.ts src/modules/insurance/services/claims.service.spec.ts src/modules/insurance/controllers/insurance-controllers.spec.ts src/modules/insurance/services/patient-settlement-projection.spec.ts src/modules/insurance/services/patient-settlement.service.spec.ts src/modules/pharmacy_inventory/services/pharmacy-orders.service.spec.ts src/modules/pharmacy_inventory/services/pharmacy-orders.staff.spec.ts src/modules/diagnostics/services/diagnostics-patient-results.orders.service.spec.ts src/modules/profiles/services/profiles-patients.service.spec.ts src/modules/profiles/patient-coverage-validity.spec.ts
```

Correcciones:

```powershell
yarn.cmd test --runInBand src/modules/pharmacy_inventory/services/pharmacy-orders.service.spec.ts src/modules/insurance/controllers/insurance-controllers.spec.ts
```

Autorización final:

```powershell
yarn.cmd test --runInBand src/modules/insurance/services/linked-claim-access.service.spec.ts src/modules/insurance/services/claims-linked.service.spec.ts src/modules/insurance/services/prior-auth-linked.service.spec.ts
```

La evidencia de navegador, los logs y el historial se archivan en el [seguimiento de bóveda #74](https://github.com/mdavila-2001/mantra_core_technologies_health_docs/pull/74), separado de #73 ya integrado. Los PNG de participantes sintéticos permanecen en esa bóveda privada.

## Pendiente y alcance de la evidencia

El primer recorrido de perfil real en navegador pasó 2/2; la inspección posterior detectó un estado contradictorio por el prefijo de códigos de catálogo. La corrección posterior tiene 148 pruebas, lint, compilación y HTTP final de dos pacientes aprobados; el recorrido final de perfil pasó 2/2 en 26.6 s y ambas capturas nuevas fueron inspeccionadas. La ejecución anterior se conserva como antecedente del hallazgo. Los PR originales modelo #19 y bóveda #73 ya están integrados; los dos patches operativos se integraron mediante [modelo #21](https://github.com/mantra-core-technologies/mantra-core-health-model/pull/21).

El typecheck global final `yarn.cmd typecheck` (sesión 28684) terminó con ExitCode 0 después de las correcciones de perfil/FK/moneda; incluye specs y todas las últimas fuentes. El typecheck anterior de la sesión 41321 también terminó con ExitCode 0 e incluye las mejoras de respuesta, replay, indistinguibilidad y acceso OWNER/ADMIN al detalle de farmacia. Las dos suites de ese acceso finalizaron con 84 pruebas correctas. Las unitarias usan dobles de EntityManager y no acreditan PostgreSQL, FK, concurrencia entre conexiones o navegación real.

El bootstrap HTTP de la sesión 2066 terminó con ExitCode 1: `beforeAll` excedió 300000 ms y la ejecución completa duró 434.074 s. El primer `SELECT` de MikroORM apareció después del timeout; el cierre posterior también produjo un error de socket. No se completó el fixture ni se obtuvo evidencia de un recorrido financiero. Estos datos no identifican por sí solos qué etapa del arranque consumió el tiempo.

El siguiente intento (sesión 91751) usó marcas UTC por etapa y un límite de 600000 ms. La importación del harness tomó 124.940 s y el arranque de la aplicación 79.801 s; todas las escrituras HTTP del setup terminaron a los 210.216 s. La suite terminó en 221.059 s con 1 FAIL, 1 PASS y 6 omitidas: exportó el fixture y falló al leer el perfil por un parámetro de arreglo PostgreSQL. El fix `0972bbf0` se comprobó sobre la API compilada y el mismo fixture, con HTTP 200 y 114 pruebas aprobadas. El alcance de descubrimiento Jest quedó separado en `43458c6a`; no se publicaron credenciales del fixture.

El build oficial de la sesión 50586 y la compilación incremental 21892 terminaron con ExitCode 0. OpenAPI y la documentación final se publicaron en `cafa518b`; la auditoría validó 90 propiedades alcanzables. El lint correctivo y la prueba focalizada de metadatos terminaron con ExitCode 0. Redocly final conserva exactamente los 12 errores y rutas de HEAD, sin fallos nuevos; no se declara lint global aprobado. El perfil real ya está comprobado por HTTP y navegador con participantes sintéticos; el recorrido financiero completo permanece pendiente. Las capturas `coverage-1440.png` y `coverage-390.png` del artefacto UI `final-real-profile` muestran póliza/beneficio vigentes y 80.25 %, 0 Bs y 10.50 Bs, legibles y sin desbordes. Sus registros de tráfico contienen login/perfil 200 vía proxy 4215 y cero intentos al puerto 3000, sin payloads ni credenciales. El banner global previo «Datos de prueba» es incondicional y no identifica mocks. API y UI se detuvieron deliberadamente después de validar.

`coverageForOrder(requireCurrent=true)` todavía exige `VERIFY_VERIFIED`. La revisión automática rechazó retirar ese requisito introducido durante esta implementación, alegando que ampliaba elegibilidad financiera sin autorización suficientemente explícita. La autorización del usuario para retirarlo sigue pendiente. La escritura actual `POST /patient-coverages` crea `VERIFY_PENDING`; ese desacuerdo bloquea el recorrido financiero completo mediante las escrituras existentes. No se atribuye este bloqueo a una skill.

**Actualización 2026-09-13 (autorizada):** el usuario confirmó que una cobertura declarada (`VERIFY_PENDING`) basta. `LinkedClaimAccessService.coverageForOrder` ya no exige `VERIFY_VERIFIED`; sigue exigiendo `COVERAGE_ACTIVE` y vigencia de cobertura/plan. El bloqueo anterior queda como antecedente; el recorrido financiero completo se reintenta con esta corrección — ver la fila nueva en la tabla de este documento con su resultado.

Los logs contienen avisos previos de VM Modules e imports JSON sin atributos. Los códigos de salida indicados proceden de los procesos finalizados, no de sesiones todavía activas.
