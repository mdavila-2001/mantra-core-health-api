# Reporte — ejecución Codex del módulo Médico: identidad fiscal

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/medical-module-execution-20260924`
- Peldaño de evidencia alcanzado: `VERIFIED` para el NIT del perfil profesional; el plan Médico global sigue abierto.
- Avance: 4 / 5 microtareas HECHO (80 %); falta publicar el commit en el PR #453.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Casos RED para relectura, cambio parcial y cierre del NIT. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts` | RED: 3 fallos nuevos / 141 aprobadas. |
| H1.S1.M2 | DTO, persistencia histórica y lectura propia del NIT y razón social; la ficha pública no consulta ni devuelve el dato. | Mismo spec dirigido tras implementar. | GREEN: 144/144. |
| H1.S1.M3 | OpenAPI YAML/JSON y gates del diff actualizados. | typecheck, ESLint dirigido, `corepack yarn docs:openapi:lint`, parse JSON y `git diff --check`. | Todos terminaron con código 0; OpenAPI válido. |
| H1.S1.M4 | Recorrido HTTP sobre PostgreSQL 18: alta, dos PATCH, relectura, dos filas históricas y privacidad pública. | `corepack yarn test:integration test/integration/practitioner-own-profile.int-spec.ts --runInBand --silent` con base efímera materializada desde `database/SQL/apply_all.sql` y `apply_deferred.sql`. | 1 suite / 6 pruebas aprobadas. |
| H2.S1.M1 | Causa del check `docs` del PR #453 identificada. | `gh run view 36041223938 --job 107773588987 --log-failed`; comparación del workflow contra `origin/dev`. | La imagen histórica de MinIO responde `unauthorized`; `.github/workflows` no pertenece al diff médico. |

## A medias

### H1.S1.M5 — publicación

- Qué anda: la rama contiene el cambio validado y el PR #453 ya existe.
- Qué no anda: el commit de este tramo todavía no fue publicado al momento de escribir este reporte.
- Qué falta exactamente: commit y push; volver a consultar los checks.
- Dónde quedó: worktree `wt-medical-execution-api`, rama `justin/medical-module-execution-20260924`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M5 | EN CURSO | Commit y push al PR #453. |
| CI-DOCS | BLOQUEADO | Sustituir la distribución histórica retirada de MinIO mediante un cambio de infraestructura separado y basado en una fuente oficial. |

## Evidencia

```text
Test Suites: 20 passed, 20 total
Tests:       418 passed, 418 total
Snapshots:   0 total
```

```text
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        6.184 s
```

```text
openapi/openapi.yaml: validated in 484ms
openapi.json: valid JSON
```

Typecheck, ESLint dirigido y `git diff --check` finalizaron con código 0.

## No cubierto

- Pantalla frontend y captura visual del perfil fiscal.
- Entidad fiscal empresarial, documentos legales, representante, poder, pagos y aseguradoras.
- Suite global completa de la API.

## Desvíos del plan

- La primera corrida de integración encontró la base vacía porque `test:integration` fuerza `ORM_SCHEMA_SYNC=off`. Se materializó el DDL versionado y se repitió; la segunda corrida fue verde.
- No se corrigió el workflow de MinIO dentro de este PR: el fallo antecede al diff médico y las distribuciones históricas oficiales consultadas ya no están disponibles por etiqueta, digest ni descarga directa.

## Riesgos residuales

- El check `docs` seguirá bloqueado hasta que la infraestructura adopte una distribución oficial disponible o construya MinIO desde la fuente fijada.
- El contrato empresarial de MED-06 todavía debe decidir si el emisor fiscal vive en la persona, práctica o tenant.

## Decisiones y ambigüedades

- Se reutilizó `common.identifiers` con `ID_TYPE_TAX`, igual que Paciente, sin cambios de DDL.
- Una edición parcial conserva el campo fiscal omitido; vaciar el número cierra la fila vigente sin crear otra.
- NIT y razón social sólo se leen en `me/summary`; la ficha pública no ejecuta la consulta de filiación privada.
