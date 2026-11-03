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
| `FIT-MUT-001` | MUTABILITY | MEDIA | Toda tabla declara su clase de mutabilidad (taxonomía real de `system_ops/mutability`; `UNKNOWN` = sin declarar) |
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
- **Taxonomía de mutabilidad**: `DataCatalogModule` registra `MutabilityFitSource` con el token
  `FIT_MUTABILITY_SOURCE`; lee `MutabilityCatalogService.all()` (sólo lectura) y declara cada tabla
  con su `writeMode`. Las clases válidas (`MUTABILITY_CLASSES`) se derivan de `WRITE_MODES` menos
  `UNKNOWN`. Probado contra el catálogo generado real (`mutability-source.adapter.spec.ts`).

## Dónde viven los resultados

**En `data_catalog.catalog_fit_runs`** (parche del modelo `SQL/patches/2026-11-01_catalog_fit_runs.sql`),
escrita y leída por `FitRunsRepository` con SQL parametrizado (sin entidad ORM mientras la tabla no
esté en el `.puml` del modelo, para no abrir una deriva ORM ↔ modelo).

- **Qué se guarda**: el desenlace de cada corrida (`COMPLETADA` con el `FitReport` completo en
  `report_json`, o `FALLIDA` con la clase del error). Las corridas `EN_CURSO` no se escriben: viven
  en la memoria del proceso que las corre (`running`).
- **Mutabilidad**: `APPEND_ONLY_PURGEABLE`. `UPDATE` prohibido por trigger (`integrity.forbid_mutation`);
  la API purga lo más viejo que `FIT_RUN_RETENTION_MS` (30 días) después de cada escritura.
- **Lectura** (`GET /admin/catalog/fit`): último completado, última falla e historial (`FIT_HISTORY_SIZE`
  dentro de `FIT_RESULT_TTL_MS`) salen de la base: sobreviven a un reinicio y los ven todas las réplicas.
  `retention.kind = BASE_DE_DATOS`.
- **Fallback declarado**: si la base no responde, se sirve la memoria del proceso con
  `retention.kind = MEMORIA_DEL_PROCESO` y `retention.fallbackReason = BD_NO_DISPONIBLE:<clase>`.
  Si la escritura falla, la corrida NO falla (la sonda no mide la base que la guarda):
  `retention.lastWrite.state = NO_GUARDADA` y el internal endpoint devuelve `persisted: false`.
- **Idempotencia**: única por `(trigger_kind, idempotency_key)`. Reusar una clave pasada la hora de
  memoria crea otra corrida que no se guarda (`CLAVE_REPETIDA`).
- **Contrato**: `retention.kind` ganó el valor `BASE_DE_DATOS` y los campos `fallbackReason`,
  `storedForSeconds` y `lastWrite`; el front (`catalog-fit.types.ts`) tipa `kind` como el literal
  `MEMORIA_DEL_PROCESO` y debe ampliarse.

## Qué no verifica

- Las rutas del código salen de `RouteMetadataService` (metadatos de Nest al arrancar); las pruebas
  de esta carpeta usan un doble. La coincidencia real sólo la da la API corriendo.
- El SQL de `fit-live.repository.ts` se escribió contra las entidades y las consultas de
  `CatalogRepository`; no se ejecutó contra PostgreSQL.
- Las rutas nuevas de esta sonda aparecen como `FIT-RUT-001` hasta regenerar el inventario
  (`yarn inventario:endpoints`): la sonda se mide a sí misma.
