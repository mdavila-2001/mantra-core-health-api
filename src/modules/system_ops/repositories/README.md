# Repositorios de `system_ops`

Acceso a datos STATELESS: cada método recibe el `EntityManager` activo como primer
parámetro, de modo que el servicio controla la transacción y el `flush` por niveles
(las FK son columnas uuid planas; MikroORM no ordena inserts entre entidades no
relacionadas). No contienen reglas de negocio.

- `governance.repository.ts` — dominios, clasificaciones, entity/field registry,
  políticas de escritura/retención/anonimización y `governance_change_log`.
- `retention-execution.repository.ts` — ejecuciones de retención, `record_revisions`
  y conteo de legal holds ACTIVE por objetivo.
- `residency.repository.ts` — políticas de residencia, bindings y transferencias.
- `legal-hold.repository.ts` — legal holds (+ búsqueda de hold ACTIVE por objetivo).
- `backup.repository.ts` — políticas de backup y pruebas de restauración.
- `assessment.repository.ts` — frameworks, controles, evaluaciones, resultados,
  hallazgos, planes y acciones (+ agregados para cierre condicional).
- `draft.repository.ts` — draft records y su revisión al publicar.
