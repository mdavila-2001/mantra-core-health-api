# Verificación de escrituras y lectura de porciones — Subtarea 2.4

Fecha: 2026-09-13. Repositorio: `mantra-core-health-api`.

Las escrituras vinculadas, su autorización, la validación decimal y el helper HTTP están implementados. El typecheck global terminó con código 0, incluido el acceso OWNER/ADMIN al detalle de farmacia. Las pruebas unitarias correspondientes también pasaron. El último intento de integración agotó el tiempo de preparación sin producir el fixture; no acredita todavía el recorrido API → PostgreSQL.

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
| Último bootstrap HTTP con PostgreSQL aislado | ExitCode 1; timeout de `beforeAll` a los 300000 ms; 434.074 s totales; fixture no creado | `integration-bootstrap-http.log` |
| Instrumentación por etapas y límite de preparación de 600000 ms | Escritos y formateados; ejecución pendiente | `test/integration/patient-coverage-copays.int-spec.ts` |
| Build global oficial | ExitCode 0; sesión 50586 finalizada | `build.log` (salida silenciosa) |
| Compilación incremental después de la corrección Swagger | `yarn.cmd exec tsc -p tsconfig.build.json`: ExitCode 0; sesión 21892 finalizada | Confirmación del proceso finalizado por coordinación |
| Generación OpenAPI anterior a la corrección final | ExitCode 0; 1168 paths, 1266 operaciones, 1144 esquemas | `openapi.log` |
| Documentación de endpoints anterior a la corrección final | ExitCode 0; 1266 endpoints, 66 módulos, 67 archivos Markdown | `endpoints.log` |
| Redocly de la salida generada y de HEAD | Ambos ExitCode 1; mismos 12 errores y rutas, comprobados mediante comparación exacta | `openapi-lint.log`, `openapi-baseline-lint.log` |
| Último lint de nueve archivos | ExitCode 1 por 13 avisos unbound-method en el test de metadatos del controlador; corregidos con Reflect.get, repetición de lint y pruebas pendiente | `lint-final-delta.log` |
| Regeneración OpenAPI tras corregir ApiOkResponse de tres GET de pedidos | En ejecución; esquema final todavía pendiente de comprobar | No confundir con la generación anterior |
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

## Pendiente y alcance de la evidencia

El typecheck global de la sesión 41321 terminó con ExitCode 0 e incluye las mejoras de respuesta, replay, indistinguibilidad y acceso OWNER/ADMIN al detalle de farmacia. Las dos suites de ese acceso finalizaron con 84 pruebas correctas. Las unitarias usan dobles de EntityManager y no acreditan PostgreSQL, FK, concurrencia entre conexiones o navegación real.

El bootstrap HTTP de la sesión 2066 terminó con ExitCode 1: `beforeAll` excedió 300000 ms y la ejecución completa duró 434.074 s. El primer `SELECT` de MikroORM apareció después del timeout; el cierre posterior también produjo un error de socket. No se completó el fixture ni se obtuvo evidencia de un recorrido financiero. Estos datos no identifican por sí solos qué etapa del arranque consumió el tiempo.

Para el siguiente intento se agregaron marcas de inicio y fin con hora ISO y tiempo transcurrido para importar el harness, arrancar la aplicación y crear los participantes y recursos. No registran secretos ni datos clínicos. El límite de este fixture complejo se amplió a 600000 ms después del timeout comprobado; esa nueva configuración aún no se ejecutó. El helper declara ahora `pickupAvailable: true` al crear la sede, precondición real de la transición a retiro listo. Sólo se comprobaron formato y whitespace de estos cambios posteriores.

El build oficial de la sesión 50586 terminó con ExitCode 0. La compilación incremental de la sesión 21892 también terminó con ExitCode 0 e incluye la corrección de metadatos `ApiOkResponse` de los tres GET de pedidos. La generación OpenAPI y la documentación de endpoints anteriores a esa corrección terminaron correctamente, pero Redocly conserva los mismos 12 errores y rutas presentes en HEAD: no se declara lint completo aprobado. La regeneración final, la repetición del lint de nueve archivos y las pruebas de metadatos siguen pendientes. El ajuste `Reflect.get` atiende 13 avisos unbound-method sin cambiar la autorización ni las aserciones de negocio. El recorrido API → PostgreSQL aislado todavía no está acreditado.

`coverageForOrder(requireCurrent=true)` todavía exige `VERIFY_VERIFIED`. La revisión automática rechazó retirar ese requisito introducido durante esta implementación, alegando que ampliaba elegibilidad financiera sin autorización suficientemente explícita. La autorización del usuario para retirarlo sigue pendiente. La escritura actual `POST /patient-coverages` crea `VERIFY_PENDING`; ese desacuerdo bloquea el recorrido financiero completo mediante las escrituras existentes. No se atribuye este bloqueo a una skill.

Los logs contienen avisos previos de VM Modules e imports JSON sin atributos. Los códigos de salida indicados proceden de los procesos finalizados, no de sesiones todavía activas.
