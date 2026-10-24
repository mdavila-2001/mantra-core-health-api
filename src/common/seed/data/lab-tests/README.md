# Catálogo de análisis médicos

No se siembra al arrancar la API: es un corpus grande (≈12 800 conceptos y ≈221 000 propiedades)
que carga un importador idempotente desde fuentes oficiales descargadas fuera de git.

- Importador y modelo de carga: [`tools/terminology-import/lab-tests/`](../../../../../tools/terminology-import/lab-tests/README.md)
- Fuentes, versiones y licencias: [`SOURCES.md`](../../../../../tools/terminology-import/lab-tests/SOURCES.md)
- Pasadas de búsqueda, cobertura y huecos: [`docs/seed-research/lab-tests.md`](../../../../../docs/seed-research/lab-tests.md)

El catálogo de estudios que usa la orden (`service-request-code`, en `dynamic-enum-catalog.ts`)
no cambia: enlazar un estudio local con un código de este catálogo es una decisión clínica pendiente.
