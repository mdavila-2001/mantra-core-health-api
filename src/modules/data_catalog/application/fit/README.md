# Sonda de ajuste de la catalogación

Responde una pregunta que ninguna otra pieza del módulo responde: **¿sigue el catálogo ajustado a la
realidad?** La cobertura (`GET /admin/catalog/coverage`) mide cuánto está *curado*; la deriva
(`admin/portal/catalogo/deriva`, `permission-drift`) mide una comparación a la vez. La sonda las
cruza: rutas del código ↔ inventario ↔ operaciones importadas, modelo ↔ ORM ↔ base observada,
fichas, frescura y sensibilidad.

## Rutas

| Ruta | Quién | Qué hace |
| --- | --- | --- |
| `GET /admin/catalog/fit` | `PORTAL_READ_ROLES` | Último resultado: puntaje por dimensión, comprobaciones, hallazgos e historial resumido. `state`: `VIGENTE`, `ATRASADO` (S7) o `SIN_RESULTADO`. |
| `POST /admin/catalog/fit/run` | `CATALOG_WRITE_ROLES` | Pide una corrida (**202**). Exige `Idempotency-Key`: la misma clave devuelve la misma corrida; con una corrida en vuelo, también. |
| `POST /internal/catalog/fit/run` | `SYSTEM` (worker) | Corre y **espera** el desenlace, para que un fallo de la sonda falle el tick del worker. |

El tick es `worker.data_catalog.fit-tick` (cada 5 min), en `src/worker/jobs/data_catalog/fit-tick.job.ts`.
Pasa por `runTick`, el único camino de liveness que existe: alimenta `workerHealth` del worker
`data_catalog`, así que la sonda de la sonda se ve donde se vea ese worker en «Instancias». No hay
un mecanismo paralelo. (El latido del worker hacia «Instancias» está *diseñado* en
`docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/descubrimiento/04-sonda-de-vida.md` y no
estaba en el código al escribir esto: cuando exista, este tick ya queda cubierto por él.)

## Comprobaciones

Cada una es declarativa y pura (`checks/*.ts`): recibe `FitInputs` y devuelve `measured`,
`unavailable` o `undeclared`. El **id es estable**: no se reutiliza ni se renombra.

| Id | Dimensión | Sev. | Comprueba |
| --- | --- | --- | --- |
| `FIT-RUT-001` | ROUTES | ALTA | Toda ruta HTTP del código está en el inventario |
| `FIT-RUT-002` | ROUTES | ALTA | Toda operación del inventario tiene ruta real (sin huérfanas) |
| `FIT-RUT-003` | ROUTES | MEDIA | El inventario sólo lista rutas (sin métodos auxiliares con verbo desconocido) |
| `FIT-RUT-004` | ROUTES | MEDIA | Toda ruta del inventario está publicada en el contrato OpenAPI (`CONTRATO_AUSENTE` = existe y no se publica) |
| `FIT-MOD-001` | MODEL | ALTA | Toda tabla del modelo está en el catálogo vivo |
| `FIT-MOD-002` | MODEL | ALTA | Toda tabla observada está en el catálogo estático |
| `FIT-MOD-003` | MODEL | ALTA | Toda columna del modelo está en la base observada |
| `FIT-MOD-004` | MODEL | MEDIA | Toda columna observada está en el modelo |
| `FIT-MOD-005` | MODEL | MEDIA | El ORM coincide con el modelo (6 categorías) |
| `FIT-MOD-006` | MODEL | MEDIA | El modelo coincide con la base contra la que se generó el inventario (foto) |
| `FIT-COM-001` | COMPLETENESS | ALTA | Toda operación declara tablas (o por qué no toca ninguna) |
| `FIT-COM-002` | COMPLETENESS | MEDIA | Toda operación con cuerpo declara DTO de entrada |
| `FIT-COM-003` | COMPLETENESS | MEDIA | Toda operación (salvo 204) declara DTO de salida |
| `FIT-COM-004` | COMPLETENESS | MEDIA | Toda operación no pública declara roles |
| `FIT-COM-005` | COMPLETENESS | MEDIA | Toda tabla tiene descripción de sistema (modelo o comentario en la base) |
| `FIT-COM-006` | COMPLETENESS | MEDIA | Toda tabla observada tiene ficha curada con descripción de negocio |
| `FIT-FRE-001` | FRESHNESS | ALTA | El último escaneo exitoso no supera el umbral (`SCAN_STALE_AFTER_MS`) |
| `FIT-FRE-002` | FRESHNESS | ALTA | La huella de lo importado = la del código desplegado |
| `FIT-FRE-003` | FRESHNESS | ALTA | La huella del inventario generado = la del código desplegado |
| `FIT-MUT-001` | MUTABILITY | MEDIA | Toda tabla declara su clase de mutabilidad. **Hoy: `NO_DECLARADO`** |
| `FIT-SEN-001` | SENSITIVITY | MEDIA | Toda tabla tiene sensibilidad clasificada |
| `FIT-SEN-002` | SENSITIVITY | MEDIA | Toda columna tiene sensibilidad clasificada |
| `FIT-SEN-003` | SENSITIVITY | ALTA | Ninguna columna que parece dato personal/clínico/credencial está por debajo de lo detectado |

## Reglas del puntaje

- **Numerador y denominador siempre.** El puntaje de una dimensión es Σ ítems satisfechos / Σ ítems
  de sus comprobaciones *medidas*; cada comprobación tiene su propia base (`covered`/`denominator`) y
  `summary` dice qué es un ítem. En `FIT-MOD-005/006` y `FIT-FRE-*` el ítem es una categoría o una
  huella, no cada elemento: los conteos van en `evidence`.
- **`null` no es cero.** Sin base el ratio es `null`. `SIN_DATO` (no se pudo leer la fuente),
  `NO_DECLARADO` (no hay dónde declararlo) y `NO_APLICA` (universo vacío) nunca cuentan como 0 ni
  como 100 %. Una fuente caída deja `SIN_DATO` a *sus* comprobaciones y no tumba las demás.
- **El veredicto no promedia.** Una falla `ALTA` desajusta (`DESAJUSTADA`); `MEDIA`/`BAJA` avisan
  (`CON_AVISOS`); `INFO` no cambia nada; no saber una comprobación `ALTA` impide `AJUSTADA`.
- **Puntos ciegos explícitos**: `blindSpots` lista las comprobaciones que no pudieron medir.

## Puntos de extensión

- **Más comprobaciones**: inyectar `FitCheckRegistry` y llamar `register(check)` (id `FIT-XXX-000`).
  El registro lo exporta `DataCatalogModule`.
- **Taxonomía de mutabilidad** (append-only / actualizable / soft-delete / purga / legal-hold): registrar
  un proveedor con el token `FIT_MUTABILITY_SOURCE` (`{ declarations(): Promise<Map<'schema.tabla', clase>> }`)
  en `DataCatalogModule`. Con él, `FIT-MUT-001` pasa de `NO_DECLARADO` a medir (declaradas con clase
  válida / sin declarar / fuera de la taxonomía).

## Dónde viven los resultados (y por qué)

**En memoria del proceso, con TTL de 24 h** (`FIT_RESULT_TTL_MS`) e historial de 48 corridas. Se
descartó lo que existe porque ninguna tabla significa lo que habría que guardar: `catalog_scan_runs`
es de escaneos de `pg_catalog`; `catalog_change_events` exige `scan_run_id` y `object_id`;
`platform_ops.health_check_runs` exige un `health_check` previo y puede abrir incidentes; `ops_console`
no tiene tablas. Consecuencias: un reinicio vacía el historial y con varias réplicas de la API cada
una ve las corridas que ella misma hizo; el tick del worker lo renueva cada 5 min y `GET` dice
`SIN_RESULTADO`/`EXPIRADO`/`ATRASADO` en vez de servir un número viejo como si fuera de hoy.

### Propuesta de DDL (NO aplicada: el esquema fluye modelo → entidades, en el repo del modelo)

```sql
-- data_catalog.catalog_fit_runs — append-only (REVOKE UPDATE, DELETE al rol de la aplicación)
create table data_catalog.catalog_fit_runs (
  id                 uuid primary key,
  source_code        varchar     not null default 'primary',
  trigger_kind       varchar     not null,               -- 'TICK' | 'MANUAL'
  requested_by_user_id uuid,
  idempotency_key    varchar,
  status             varchar     not null,               -- 'COMPLETADA' | 'FALLIDA'
  model_version      varchar     not null,
  verdict            varchar,                            -- 'AJUSTADA' | 'CON_AVISOS' | 'DESAJUSTADA' | 'SIN_DATOS'
  code_fingerprint   varchar,
  deployed_commit    varchar,
  report_json        jsonb,                              -- el FitReport completo
  error_code         varchar,
  requested_at       timestamptz not null,
  finished_at        timestamptz not null,
  created_at         timestamptz not null default now()
);
create unique index ux_data_catalog_fit_runs_idempotency
  on data_catalog.catalog_fit_runs (requested_by_user_id, idempotency_key) where idempotency_key is not null;
create index ix_data_catalog_fit_runs_finished on data_catalog.catalog_fit_runs (source_code, finished_at desc);
```

## Qué no verifica

- Las rutas del código salen de `RouteMetadataService` (metadatos de Nest al arrancar); las pruebas
  de esta carpeta usan un doble. La coincidencia real sólo la da la API corriendo.
- El SQL de `fit-live.repository.ts` se escribió contra las entidades y las consultas de
  `CatalogRepository`; no se ejecutó contra PostgreSQL.
- Las rutas nuevas de esta sonda aparecen como `FIT-RUT-001` hasta regenerar el inventario
  (`yarn inventario:endpoints`): la sonda se mide a sí misma.
