# Una tabla de seed está vacía y el arranque no dice nada

**Síntoma.** Alguna tabla que debería estar poblada por la cadena de seeds está en cero
—`authz.permissions`, `chart.specialty_chart_templates`, `terminology.concept_properties`,
`terminology.concept_relationships`, los value sets del glosario— y en los logs de arranque
no aparece ningún error.

## Lo primero: ¿qué código está corriendo?

Antes que nada, no lo segundo. El arranque escribe su identidad:

```
Arranca v0.1.0 · commit 57d283ea · construido 2026-08-15T18:00:00Z · entorno production
```

```bash
docker logs <contenedor> 2>&1 | grep '"event":"app.build"'
```

Compará ese commit contra la rama. **Una imagen vieja se ve idéntica a una al día.** Ya
pasó: el contenedor de desarrollo quedó un día entero por detrás de `dev` y su `dist/` no
tenía tres de los diez seeds —glosario, formularios clínicos y permisos de plataforma—. Las
tablas estaban vacías porque **ese código no estaba en la imagen**, no porque el seed
fallara. Si `commit` dice `desconocido`, la imagen se construyó sin los build args; se
resuelve con:

```bash
GIT_COMMIT=$(git rev-parse HEAD) BUILD_TIME=$(date -Iseconds) docker compose build api
```

## Lo segundo: ¿qué hizo la cadena?

Cada paso deja registro **aunque no inserte nada**, y hay un resumen al final:

```bash
docker logs <contenedor> 2>&1 | grep '"event":"seed.step"'
docker logs <contenedor> 2>&1 | grep '"event":"seed.summary"'
```

Lecturas posibles:

| Lo que ves | Qué significa |
|---|---|
| `Seeds: 10/10 ok · 0 filas` | Todo sembrado y sin trabajo pendiente. Si igual falta una tabla, el problema no es el seed. |
| `Seeds: 9/10 ok · 1 omitidos` (nivel `error`) | Un seed dependiente falló. El paso trae `err` con la causa. |
| `event: seed.aborted` | Falló el catálogo de conceptos, que es el primero: **los otros nueve ni se intentaron**. Arreglá ése y el resto sale solo. |
| `event: seed.boot.disabled` | `SEED_ON_BOOT=false`. No es un fallo: sembrá con `yarn seed:boot`. |
| Ninguna línea `seed.step` | El proceso no llegó a `onApplicationBootstrap`, o la imagen es anterior a esta instrumentación. |

## Lo tercero: sembrar a mano y mirar el resultado

```bash
yarn seed:boot   # exit 0 si los diez pasaron; ≠0 si alguno quedó omitido
```

Es idempotente: contra una base ya sembrada informa `0 filas` y no toca nada. Correrlo dos
veces seguidas es la forma barata de confirmar que la idempotencia funciona.

## Causas conocidas

- **Colisión de código de concepto.** `terminology.catalog_concepts` tiene
  `UNIQUE(code_system_version_id, code)` y el seed deduplica por **id** (UUIDv5 de la
  clave), así que dos definiciones con el mismo `code` y claves distintas sólo chocan al
  llegar a Postgres. Como el catálogo es el primer paso, se lleva puestos los otros nueve.
  El spec `src/common/seed/concept-codes.spec.ts` lo detecta antes de que llegue a la base.
- **Imagen desactualizada**, tratada arriba.
- **`SEED_ON_BOOT=false`** sin el paso de siembra correspondiente en el despliegue.
