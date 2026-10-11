# Plan — Migración DDD de pharmacy_inventory

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-api` (`dev`, luego `test`) · Predecesor: ADR-0026 y piloto `scheduling`; `profiles` (#634/#635)
- Resultado observable: el módulo `pharmacy_inventory` respeta las cuatro capas de ADR-0026, conserva sus contratos HTTP y su comportamiento, y sus pruebas dirigidas pasan en ambas bases.
- Kill-test: `corepack yarn test src/architecture/module-layering.spec.ts --runInBand` después de incluir `pharmacy_inventory` en `MIGRATED_MODULES`.

## Alcance
- IN: los 91 archivos actuales de `src/modules/pharmacy_inventory`; conceptos puros, fachadas/casos de uso, puertos y adaptadores de dependencias externas, repositorios propios, controllers/DTO, composición del módulo, documentación de layout y guard de capas.
- OUT: `entities/` (21 entidades generadas, intocables), DDL/modelo/seeds, contratos HTTP, rutas, DTO y mensajes, claves/códigos de error, reglas de negocio, módulos externos y pruebas de integración.
- Ambigüedades registradas: la ficha del handoff no concreta qué operaciones necesitan extracción individual ni detalla puertos. Supuesto: seguir exactamente ADR-0026 y el piloto `scheduling`; preservar la API de cada fachada y abrir puertos sólo para dependencias de otros contextos ya usadas. Confirmar cualquier operación que requiera cambiar semántica con el propietario.

## H1 — `pharmacy_inventory` migrado al molde DDD
**CA:** Dado el módulo con 6 controllers, 16 DTOs, 16 repositorios, 11 servicios y 21 entidades, cuando se recorre cada operación existente, entonces el transporte queda en `presentation/`, la persistencia y los adaptadores en `infrastructure/`, la orquestación en `application/` y las reglas puras en `domain/`, sin cambiar los contratos ni la salida observable.
**DoD:** `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent`, `corepack yarn test src/architecture/module-layering.spec.ts --runInBand`, `corepack yarn typecheck`, ESLint dirigido, `git diff --check` y `corepack yarn test` completa; replicar specs y guard sobre `origin/test`. Salida literal guardada en `evidencia/` y reporte; PR por base, sin merge.
**Estado:** EN CURSO

### H1.S1 — Discovery y red de regresión
**CA:** Dado el árbol y los contratos existentes, cuando se mide el baseline, entonces quedan identificadas las dependencias y las pruebas pasan antes del refactor.
**DoD:** inventario del módulo, `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent` y `corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent`; salidas archivadas.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Inventariar archivos, controllers, DTO, repositorios, servicios, entidades e imports cruzados | Las cantidades y los contextos externos usados constan en la nota de discovery | `rg --files` + `rg` de imports → inventario guardado | HECHO |
| H1.S1.M2 | Medir tests dirigidos y guard de arquitectura antes de cambiar archivos | Los dos comandos terminan en 0 y sus conteos quedan guardados | comandos de baseline arriba → salida literal en `evidencia/baseline.txt` | HECHO |

### H1.S2 — Capas de dominio y presentación
**CA:** Dado el módulo actual, cuando se ubican contratos y reglas puras, entonces DTO/controllers y conceptos/reglas están en sus capas y cada ruta/respuesta conserva su forma.
**DoD:** diff de movimientos revisado, tests dirigidos del módulo y `git diff --check`.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Ubicar los 6 controllers bajo `presentation/controllers/` y sus tests junto al transporte | Todas las rutas, guards y argumentos siguen iguales | `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent`, `corepack yarn typecheck`, `git diff --check` → salidas en `evidencia/controllers.txt` | HECHO |
| H1.S2.M2 | Ubicar los 16 DTO bajo `presentation/dto/` y corregir imports | Validaciones, nombres de propiedades y OpenAPI no cambian | `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent`, `corepack yarn typecheck`, `git diff --check` → `evidencia/dto.txt` | HECHO |
| H1.S2.M3 | Separar conceptos y reglas puras a `domain/` sin Nest, ORM ni entidades | El dominio usa conceptos compartidos y tipos estructurales; precios no importa entidades ORM | suites dirigidos, typecheck, ESLint dirigido, revisión de imports → `evidencia/domain.txt` | HECHO |

### H1.S3 — Persistencia y puertos entre contextos
**CA:** Dado cada acceso a persistencia o dependencia externa existente, cuando se ejecuta una operación, entonces conserva la consulta/transacción previa y toda dependencia externa cruza por un puerto local con adaptador.
**DoD:** specs del módulo, guard de capas, typecheck y lint dirigido.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S3.M1 | Ubicar los 16 repositorios propios bajo `infrastructure/repositories/` y mantener firmas/consultas | Los 16 repositorios conservan código y firmas; se reescribieron imports con AST | tests dirigidos, typecheck, ESLint dirigido → `evidencia/repositories.txt` | HECHO |
| H1.S3.M2 | Definir puerto/adaptador para dependencias de `directory` realmente usadas | La autorización de pedidos pasa por un puerto local y su adaptador; el cableado Nest conserva `DirectoryAuthorizationModule` | suites dirigidos, typecheck, ESLint, búsqueda de imports → `evidencia/directory-port.txt` | HECHO |
| H1.S3.M3 | Definir puerto/adaptador para dependencias de `insurance` realmente usadas | Pedidos consume liquidaciones por puerto local; DTO y tipos no importan clases de `insurance` | suites dirigidos, typecheck, ESLint, búsqueda de imports → `evidencia/insurance-port.txt` | HECHO |
| H1.S3.M4 | Definir puerto/adaptador para dependencias de `pharmacy` realmente usadas | Pedidos y lecturas usan snapshots del puerto local; adaptador conserva consultas y filtros; no quedan imports en servicios/dominio | suites dirigidos, typecheck, ESLint, búsqueda de imports → `evidencia/pharmacy-port.txt` | HECHO |
| H1.S3.M5 | Definir puerto/adaptador para dependencias de `messaging` realmente usadas | Eventos transaccionales y avisos post-commit cruzan por puertos locales independientes | suites dirigidos, typecheck, ESLint, búsqueda de imports → `evidencia/messaging-port.txt` | HECHO |
| H1.S3.M6 | Definir puerto/adaptador para dependencias de `profiles` realmente usadas | La campana usa un puerto con snapshot local; repositorio y entidad solo quedan en infraestructura/cableado del módulo | suites dirigidos, typecheck, ESLint, búsqueda de imports → `evidencia/profiles-port.txt` | HECHO |

### H1.S4 — Aplicación y composición
**CA:** Dado cada servicio existente, cuando se invoca desde controller o módulo externo, entonces la fachada pública delega en operaciones de aplicación y conserva resultado, errores y límites transaccionales.
**DoD:** specs existentes sin weakening, tests dirigidos, guard, typecheck y lint.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S4.M1 | Migrar `inventory-count.service.ts` | Conteo, aprobación y errores conservan semántica | test de conteo + guard | HECHO |
| H1.S4.M2 | Migrar `inventory-locations.service.ts` | Operaciones de ubicaciones conservan semántica | test de ubicaciones + guard | HECHO |
| H1.S4.M3 | Migrar `inventory-recall.service.ts` | Retiro/liberación de recall conservan semántica | tests de recall + guard | HECHO |
| H1.S4.M4 | Migrar `inventory-reservations.service.ts` | Reservas conservan resultados y transacciones | tests de reservations + guard | HECHO |
| H1.S4.M5 | Migrar `inventory-sync.service.ts` | Sync conserva resultados y transacciones | tests dirigidos de sync + guard | HECHO |
| H1.S4.M6 | Migrar `inventory-transfers.service.ts` | Transferencias conservan reglas y movimientos | tests dirigidos de transferencias + guard | HECHO |
| H1.S4.M7 | Migrar `medication-dispensations.service.ts` | Dispensación/reversión conservan resultados y eventos | test de dispensación + guard | HECHO |
| H1.S4.M8 | Migrar `pharmacy-inventory-read.service.ts` | Lecturas conservan orden y valores | tests de lectura + guard | HECHO |
| H1.S4.M9 | Migrar `pharmacy-pricing.ts` | Cálculo de precios conserva resultados | tests dirigidos de pricing + guard | HECHO |
| H1.S4.M10 | Migrar `pharmacy-order-notifications.service.ts` | Notificaciones conservan evento, destinatario y resultado | tests de orders/notificaciones + guard | HECHO |
| H1.S4.M11 | Migrar `pharmacy-orders.service.ts` | Ciclo de pedidos conserva estados, autorizaciones y transacciones | tests de orders/staff + guard | HECHO |
| H1.S4.M12 | Migrar `pharmacy-procurement.service.ts` | Compras/recepciones conservan operaciones y límites | test de procurement + guard | HECHO |
| H1.S4.M13 | Actualizar `pharmacy_inventory.module.ts` y sumar el módulo al guard | Nest resuelve providers y `MIGRATED_MODULES` cubre el módulo | guard + tests dirigidos + typecheck | HECHO |

### H1.S5 — Regresión y entrega en `dev`/`test`
**CA:** Dadas las bases `dev` y `test`, cuando se ejecutan las suites y gates del módulo, entonces ambas conservan sus contratos y pasan todas las pruebas aplicables.
**DoD:** suites dirigidas, guard, typecheck, lint dirigido, regresión completa en `dev`, reporte, PRs contra ambas bases y revisión `mergeable`/checks; sin merge.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S5.M1 | Ejecutar los gates dirigidos y la suite completa en `dev` | Todos los gates salen con código 0 | comandos indicados + salida en `evidencia/dev-full-test.txt`, `evidencia/s4-final.txt` | HECHO |
| H1.S5.M2 | Portar el commit a base fresca `test` y repetir gates dirigidos | `test` conserva el mismo diff funcional y gates dirigidos verdes | specs + guard + typecheck + lint | HECHO |
| H1.S5.M3 | Escribir reporte y abrir PR por base con límites y no cubierto explícitos | Reporte enlazado, PRs abiertos y sin merge | `gh pr view` con estado, base, mergeabilidad y checks | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| 91 archivos, 11 servicios y dependencias cruzadas a 5 contextos | Cambio extenso y riesgo de alterar operaciones de inventario/facturación | Migración de una microtarea por vez; conservar baseline y correr tests tras cada grupo |
| Entidades/tablas de farmacia | Regeneración o contrato de datos divergente | Excluir `entities/`, DDL, seeds y modelo |
| Dependencias de directory/insurance/pharmacy/messaging/profiles | Contratos cruzados o cambios de otro módulo | Puertos dentro de `pharmacy_inventory`, adaptadores locales y no modificar módulos consumidores |
| Bases `dev` y `test` pueden divergir | Cherry-pick incompleto | Worktree fresco por base y verificar árbol/ref antes del port |
