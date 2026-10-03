# Plan — Búsqueda de contactos del chat en dev

- Fecha: 2026-10-03. Repositorio: mantra-core-health-api.
- Base: origin/dev, 89ce296d262b3d12a43de872efae07a31f22bc9b.
- Rama: marcelo/feat-busqueda-contactos-chat.
- Resultado observable: el consumidor del chat puede buscar contactos mediante POST community/conversations/contacts/search.
- Predecesor: revisión de los PR del frontend; implementación existente en test, commit 3e60276f de Justin.
- Kill-test: el controlador no ofrece la ruta o permite consultar con un perfil ajeno.

## Alcance

- IN: portar únicamente DTO, controlador, servicio de lectura, repositorio de perfiles y sus pruebas desde la implementación de test. Validar el contrato aditivo con dev actual.
- OUT: creación de conversaciones, avisos internos, frontend, bases de datos, migraciones, despliegue y merge.
- Supuesto: «endpoint» refiere a la búsqueda de contactos faltante identificada en la revisión anterior. Nombre de desarrollador: marcelo, como las ramas previas del usuario.

## H1 — Incorporar la búsqueda autenticada

**CA:** Dado un actor autenticado, cuando busca desde su perfil, entonces recibe solo contactos públicos activos elegibles sin bloqueos.
**DoD:** pruebas dirigidas en serie, compilación, revisión del diff y PR contra dev.
**Estado:** EN CURSO

### H1.S1 — Contrato y acceso

**CA:** Dado un cuerpo válido, cuando se consulta, entonces se respeta la propiedad del perfil y el límite de resultados.
**DoD:** ejecutar Jest con los cuatro specs afectados, salida 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Portar el contrato HTTP | Dado un cuerpo inválido, cuando se valida, entonces se rechaza | `yarn test --runInBand read-messaging.dto.spec.ts community-messaging.controller.spec.ts` → PASS | HECHO |
| H1.S1.M2 | Portar la búsqueda restringida | Dado un perfil ajeno o bloqueado, cuando se busca, entonces no se expone | `yarn test --runInBand public-profiles.repository.spec.ts community-messaging-read.service.spec.ts` → PASS | HECHO |

### H1.S2 — Verificación y entrega

**CA:** Dado dev actual, cuando se compila y publica la rama, entonces el cambio es revisable sin modificar dev directamente.
**DoD:** compilación y controles dirigidos; publicar PR.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Compilar el backend | Dado el código nuevo, cuando se construye, entonces no hay errores TypeScript | `docker build --target build -t alovida-chat-api-build:dev .` → salida 0 | HECHO |
| H1.S2.M2 | Revisar el diff | Dado el parche, cuando se revisa, entonces no contiene secretos ni cambios fuera del alcance | `git diff --check` → salida 0; revisión de archivos | HECHO |
| H1.S2.M3 | Publicar PR | Dada la rama nueva, cuando se publica, entonces su base es dev | `gh pr view --json url,baseRefName,headRefName` → base dev | EN CURSO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Test tiene otros cambios de escritura | Alterar contratos ajenos | Portar solo archivos y hunks de lectura |
| Pruebas unitarias usan dobles | No prueban el flujo desplegado | Declarar ese límite; no afirmar verificación E2E |
| CI remoto demora | PR aún no habilitado para revisión | Observar los checks y declarar su estado |
