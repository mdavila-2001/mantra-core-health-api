# Pedido de esquema · `gap_minutes` en la franja de plantilla (AG-4)

**De:** Justin · **Para:** Marcelo · **Fecha:** 2026-08-27
**Urgencia:** día 1 del carril agenda — todo lo demás de AG-4 avanza en paralelo,
pero el merge espera esta columna.

## Qué se pide

Una columna en `scheduling.schedule_rules`:

```
gap_minutes : integer NOT NULL DEFAULT 0
```

Por el pipeline de siempre: `.puml` → `gen_ddl.py` → `SQL/patches/`.

## Qué guarda

El **receso entre consultas, por franja** — el pedido literal de la función agenda:
«puede haber un tiempo muerto entre una consulta y la otra, como un receso de unos
minutos; eso podría ajustar el doctor». El mismo doctor puede querer el lunes
«consultas de 45 sin respiro» y el miércoles «consultas de 20 con 10 de margen»,
por eso vive en la franja (donde ya vive `slot_minutes`) y no como configuración
global.

La aritmética que lo consume: los cupos se generan con paso
`slot_minutes + gap_minutes`. Con default 0, **nadie que no lo pida nota nada** —
es el patch más benigno que existe.

## Por qué no hay alternativa sin esquema

`schedule_rules` no tiene jsonb de escape (verificado contra la base: 14 columnas,
ninguna jsonb). Guardarlo en otro lado partiría la franja en dos fuentes.

## Verificación hecha

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_schema='scheduling' AND table_name='schedule_rules';
-- → slot_minutes existe · gap_minutes NO existe · cero jsonb
```
