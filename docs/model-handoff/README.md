# Entrega al modelo — artefactos que no tienen dónde vivir en git

## Qué es esta carpeta

Un buzón, no una fuente de DDL.

`SQL/`, `Mantra Core Health Context/` y `salud-db/` **no son repositorios git**:
viven solo en la máquina de quien mantiene el modelo. Cuando alguien encuentra
—y arregla— una deriva de esquema fuera de esa máquina, no tiene forma de
hacérselo llegar salvo por acá.

## Lo que NO es

**No es una carpeta de migraciones.** Nadie aplica nada desde acá, ni el compose
la monta, ni `apply_all.sql` la conoce. Tener dos fuentes de DDL es lo que
`docs/architecture/ddl-sources.md` prohíbe explícitamente, y lo que ya rompió el
esquema dos veces:

- **v4.0.8** (2026-07-30) — un merge trajo 6 migraciones sueltas a
  `mantra-core-health-api/database/`.
- **v4.0.9** (2026-08-05) — volvió a aparecer, con el compose apuntando ahí. Esa
  vez el efecto se consumó: `iam.email_verifications` no existía en base limpia
  y los 27 casos de registro del smoke respondían 500.

`salud-db/check_ddl_sources.py` existe para que eso falle ruidosamente. Sigue
pasando con esta carpeta porque acá solo hay `ALTER TABLE`, nunca `CREATE TABLE`
— pero la regla de fondo es la misma: **esto es correspondencia, no esquema**.

## Qué hacer al recibir un archivo acá

1. Moverlo a `SQL/patches/` en la copia del modelo.
2. Comprobar que el `.puml` y `SQL/` declaren lo mismo (el PR que lo trajo
   describe qué se cambió en cada capa).
3. **Borrar el archivo de esta carpeta.**

Si la carpeta queda vacía, mejor: significa que no hay deriva pendiente.
