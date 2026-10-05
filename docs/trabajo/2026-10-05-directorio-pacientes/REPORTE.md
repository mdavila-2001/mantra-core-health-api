# Reporte — Directorio de pacientes

- Fecha: 2026-10-05 · Plan: [PLAN.md](./PLAN.md).
- Ramas: marcelo/insurer-patient-directory-dev y marcelo/insurer-patient-directory-test.
- Entorno: Windows, Chromium y AppModule/PostgreSQL sintéticos reales aislados en Docker.
- Versión de código validado: dev639c9722 / test1a7f1f2c. Los commits posteriores de cierre sólo agregan pruebas/evidencia/documentación.
- Peldaño: VERIFIED para el directorio y chat; no REGRESSION_VERIFIED global. Entrega A MEDIAS.
- Avance: 14 / 17 (82.35 %), contado por microtareas HECHO.

## Completado

| ID | Qué se logró | Comando / evidencia | Resultado |
|---|---|---|---|
| H1.S1.M1 | Base dev incorporada por merge y build PASS | git merge-base --is-ancestor origin/<base> marcelo/insurer-patient-directory-<base> | exit0 |
| H1.S1.M2 | Base test incorporada por merge y build PASS | git merge-base --is-ancestor origin/<base> marcelo/insurer-patient-directory-<base> | exit0 |
| H2.S1.M1 | Cobertura vigente, alcance autorizado, conteo exacto y paginación SQL | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H2.S1.M2 | Conversación interna reutilizada; acceso revalidado y persistencia comprobada | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H2.S1.M3 | POST y DTO mínimo publicados en OpenAPI; contrato dirigido comprobado | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H2.S2.M1 | Cliente POST, body mínimo y ausencia de filtros en URL | reporte frontend (218/214 unit y14 UI-mock PASS) | PASS |
| H2.S2.M2 | Debounce/cancelación, filtros, estados, reintento y contador | reporte frontend (218/214 unit y14 UI-mock PASS) | PASS |
| H2.S2.M3 | Siete columnas, tarjetas y mensajería primaria | reporte frontend (218/214 unit y14 UI-mock PASS) | PASS |
| H3.S1.M2 | Recorrido real en ambas variantes; kill-test y reutilización persistida PASS | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H3.S1.M3 | 28 capturas finales revisadas dos veces, segunda independiente/adversarial | frontend: doble-revision.md y revision-visual-p2.md | PASS |
| H2.S1.M4 | Administrador global sin tenant mediante opt-in exclusivo del directorio | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H3.S1.M5 | QA aislada con DOTENV_CONFIG_PATH; default .env conservado | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H3.S1.M6 | Seeds core nativos en QA y fixtures creadas por API real | api-unit-current-bases.txt; api-test-unit-final.txt; api-integration-core-final.txt; api-test-integration-real-final.txt | PASS |
| H3.S1.M8 | Helper de mocks heredado de test corregido sin cambiar aserciones | api-test-typecheck-final.txt; api-test-unit-final.txt | PASS |

## A medias

### H3.S1.M1 — Gates globales
- Qué anda: frontend dev/test build producción, types, lint y regresión218/214 PASS; API dev types/build/lint PASS; API test types/build/lint dirigido PASS, unit70/74 y SQL9 por variante PASS.
- Qué no anda: BASELINE-LINT-TEST: 53 errores Prettier en cinco archivos idénticos a origin/test; BASELINE-OPENAPI: dos operaciones públicas heredadas sin security. BASELINE-CLAIMS-DEV: aserción de roles de reclamos incompatible con su controller; ambos archivos idénticos a origin/dev. CI antiguo API dev falló por ese caso.
- Qué falta exactamente: propietarios de las bases deben corregir esos gates ajenos al directorio; repetir gates globales tras integrar sus correcciones. No se relajan permisos ni aserciones.
- Dónde quedó: evidencia API api-test-baseline-gate-failures.txt, api-test-lint-final.txt, api-test-openapi-lint-rechecked.txt, api-dev-claims-baseline-regression.txt y ci-docs-baseline-failure.txt.

### H3.S1.M4 — Propagación
- Qué anda: cambios comunes del directorio aplicados en dev/test, conservando sus bases y dependencias; tipos/build y pruebas dirigidas PASS en ambas. Helper de mocks sólo en test.
- Qué no anda: el DoD pide gates globales PASS; persisten los fallos de base anteriores.
- Qué falta exactamente: corregir las bases y revalidar gates, sin trasladar funcionalidades generales entre variantes.
- Dónde quedó: ramas existentes, sin merge a integración.

### H3.S1.M7 — Entrega de PR
- Qué anda: cuatro PR publicados por pedido del usuario; actualización API primero y frontend después, sin force ni merge. Estado literal en evidencia/pr-<n>-mergeable.txt.
- Qué no anda: CI frontend pendiente por runner self-hosted marcelo-wsl-front offline; API dev tiene fallo histórico de reclamos; globales heredados aún rojos. No se afirma entrega mergeable completa.
- Qué falta exactamente: reactivar runner frontend y corregir gates heredados; comprobar checks tras el último push y revisión humana antes de merge.
- Dónde quedó: frontend955/956 y API567/568, con reportes y referencias cruzadas.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M1 | A MEDIAS | Correcciones de base de lint, OpenAPI y permisos/prueba de reclamos |
| H3.S1.M4 | A MEDIAS | Gates globales tras incorporar dichas correcciones |
| H3.S1.M7 | A MEDIAS | Runner operativo, checks terminales y revisión humana |

## Evidencia

Las salidas siguientes son fragmentos literales de logs conservados; los comandos completos constan en esos archivos. API y navegador real no usan mocks; los14 casos @ui-mock sí interceptan HTTP para comprobar exclusivamente interfaz.

### api-dev-typecheck-final.txt

[Salida completa](./evidencia/api-dev-typecheck-final.txt)

```text
EXIT_CODE=0
```

### api-dev-build-final.txt

[Salida completa](./evidencia/api-dev-build-final.txt)

```text
EXIT_CODE=0
```

### api-dev-lint-final.txt

[Salida completa](./evidencia/api-dev-lint-final.txt)

```text
EXIT_CODE=0
```

### api-unit-current-bases.txt

[Salida completa](./evidencia/api-unit-current-bases.txt)

```text
Test Suites: 6 passed, 6 total
Tests:       70 passed, 70 total
Time:        15.555 s
```

### api-test-typecheck-final.txt

[Salida completa](./evidencia/api-test-typecheck-final.txt)

```text
EXIT_CODE=0
```

### api-test-build-metadata-final.txt

[Salida completa](./evidencia/api-test-build-metadata-final.txt)

```text
EXIT_CODE=0
```

### api-test-unit-final.txt

[Salida completa](./evidencia/api-test-unit-final.txt)

```text
Test Suites: 7 passed, 7 total
Tests:       74 passed, 74 total
Time:        15.249 s, estimated 16 s
EXIT_CODE=0
```

### api-test-lint-scoped.txt

[Salida completa](./evidencia/api-test-lint-scoped.txt)

```text
EXIT_CODE=0
```

### api-test-lint-final.txt

[Salida completa](./evidencia/api-test-lint-final.txt)

```text
✖ 53 problems (53 errors, 0 warnings)
  53 errors and 0 warnings potentially fixable with the `--fix` option.
EXIT_CODE=1
```

### api-test-openapi-lint-rechecked.txt

[Salida completa](./evidencia/api-test-openapi-lint-rechecked.txt)

```text
run `redocly lint --generate-ignore-file` to add all problems to the ignore file.
EXIT_CODE=1
```

### api-integration-core-final.txt

[Salida completa](./evidencia/api-integration-core-final.txt)

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Time:        39.4 s, estimated 40 s
EXIT_CODE=0
```

### api-test-integration-real-final.txt

[Salida completa](./evidencia/api-test-integration-real-final.txt)

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Time:        49.019 s
EXIT_CODE=0
```

### api-dev-claims-baseline-regression.txt

[Salida completa](./evidencia/api-dev-claims-baseline-regression.txt)

```text
COMMAND: yarn test --runInBand insurance-controllers.spec.ts
Test Suites: 1 failed, 1 total
Tests:       1 failed, 20 passed, 21 total
Time:        7.971 s
EXIT_CODE=1
```

### api-local-cleanup.txt

[Salida completa](./evidencia/api-local-cleanup.txt)

```text
EXIT_CODE=0
```

## No cubierto

No se ejecutó localmente la suite total del producto. CI antiguo API dev sí la ejecutó: 9948 PASS y una falla de reclamos, una prueba omitida preexistente; no es evidencia del último commit. Otros navegadores, lector de pantalla, zoom y contraste numérico no ejercitados. No se envió un mensaje: apertura, recarga, compositor y reutilización sí comprobados. Exportador OTEL desactivado en QA; supresión SQL comprobada con unit/contexto y SDK, sin captura real de spans. Sin datos de producción ni despliegue.

## Desvíos del plan

Bases avanzaron durante QA y se integraron mediante merge limpio. Se corrigió Seguro oculto a1024 con sidebar usando ancho del contenedor y recapturas. Test de chat seleccionaba tabla oculta; selector adaptado sin debilitar requisito. Vacío filtrado estabilizado con viewport explícito/reducedMotion. Primer SQL falló por bootstrap de formularios clínicos; QA usa opción nativa de seeds core, sin ampliar timeout. Segunda corrida falló por fixture sin tenant y se corrigió el request según contrato. Navegador real inicialmente seleccionaba el valor interno Angular; corregido por etiqueta visible. Error TypeScript reducedMotion resuelto mediante API real page.emulateMedia. Logs FAIL se conservan. Hubo una llamada lint que retornó sessionID antes de confirmar fin al iniciar integración; cierre PASS comprobado inmediatamente, desviación registrada.

## Riesgos residuales

CI externo y gates de base bloquean cierre global. Reserva visual MENOR: cola del placeholder del buscador cortada a1024, label accesible completo y control funcional.28 capturas finales inspeccionadas por P1 y P2 independiente, sin MAYOR/BLOQUEANTE; directorio ACEPTABLE CON RESERVAS, estados y dos reales APROBADOS. Captura histórica de fallo inspeccionada en ambas pasadas fue borrada por limpieza de Playwright; no se usa como evidencia positiva ni se simula su recuperación. Diferencia218/214 responde a pruebas propias de las bases, sin borrar tests.

## Decisiones y ambigüedades

INSURANCE_OPERATOR restringido a su aseguradora; cobertura vigente para aseguradoras, padrón global administrativo autorizado mediante opt-in limitado al directorio. POST y allowlist eliminan filtros de URLs y campos ajenos. Logs HTTP reales27 por variante sin query/body/auth; supresión SQL limitada a consultas sensibles. Push y PR anticipados solicitados por usuario; no merge/deploy ni solicitudes de review a terceros. Configuración local y cache auth ignorados, no versionados. Stack sintético propio cerrado con compose down sin-v; tres volúmenes conservados y Docker Desktop intacto. Ninguna ambigüedad adicional.
