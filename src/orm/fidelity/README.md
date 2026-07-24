# src/orm/fidelity — Verificación entidad contra tabla

Responde a una sola pregunta, al final de cada arranque: **¿cada entidad mapeada se
corresponde de verdad con la tabla que dice mapear?**

## Por qué no es redundante

Podría parecerlo: si el arranque acaba de crear las tablas desde las propias entidades,
¿cómo van a no coincidir? Porque la capa de tablas trabaja en modo seguro y, por diseño, hay
cambios que se niega a aplicar: estrechar el tipo de una columna con datos, volver
obligatoria una columna que ya tiene nulos, o cualquier alteración que perdería información.
Esos casos son exactamente los que esta verificación saca a la luz: lo que el arranque no
pudo arreglar solo y necesita una migración revisada.

Y con `ORM_SCHEMA_SYNC=off` -el modo esperado en un entorno donde manda un DBA- esta es la
única red de seguridad que queda.

El modo de fallo que previene es el más caro de esta arquitectura: el código compila, el ORM
arranca, y el error aparece en la primera consulta que toca la columna que no está, en
producción y sin contexto.

## Qué comprueba

| Categoría | Síntoma que evita |
|---|---|
| `tabla-ausente` | La entidad está mapeada y la tabla no existe: toda consulta a ella falla |
| `columna-ausente` | La entidad declara una columna que la tabla no tiene: falla cualquier SELECT que la proyecte |
| `columna-obligatoria-no-mapeada` | La tabla exige una columna NOT NULL sin default que ninguna propiedad mapea: todo INSERT del ORM falla con 23502 |
| `obligatoriedad-divergente` | La base exige la columna y la entidad la declara opcional: falla al escribir, no al leer |

## Qué NO comprueba, y por qué

**No compara tipos SQL.** La equivalencia entre la metadata y `information_schema` está
llena de sinónimos (`int4`/`integer`, `varchar`/`character varying`,
`timestamptz`/`timestamp with time zone`) y una comparación textual produciría cientos de
falsos positivos que enterrarían las diferencias reales. La divergencia de tipos la detecta
la capa 04, que compara con las reglas del dialecto.

**Solo reporta la asimetría que rompe.** Una entidad más estricta que la base (entidad
obligatoria, columna anulable) es benigna: nunca produce un error de escritura. El caso
contrario sí, y es el único que se registra.

## Coste

Dos consultas al catálogo de PostgreSQL y una comparación en memoria sobre unas 15 700
columnas: **entre 37 y 72 ms**, una vez por arranque. Consultar tabla por tabla serían 1159
viajes de ida y vuelta.

## Salida

`verifyAndReport()` registra el resultado y devuelve el `FidelityReport` completo. Sin
deriva:

```
Fidelidad verificada: 1159 entidades coinciden con la base (1159 tablas presentes, 42 ms)
```

Con deriva registra una advertencia con el recuento por categoría y las 25 primeras
diferencias detalladas; el resto se resume. Volcar 4000 diferencias al log no aporta nada
que no aporten las 25 primeras más el total.

**Es advertencia y no error a propósito.** El servicio puede operar con deriva parcial: las
tablas no afectadas funcionan. Convertirlo en fallo de arranque es defendible en un entorno
regulado, pero es una decisión de despliegue y no del componente; por eso el informe se
devuelve además de registrarse, y quien lo consuma puede decidir abortar.

## Relación con `yarn orm:audit`

Son dos preguntas distintas y complementarias:

- **Este servicio**: entidades contra la **base real**. Se ejecuta en cada arranque.
- **`tools/catalog/audit-fidelity.mjs`**: entidades contra el **modelo oficial** de la
  bóveda. Se ejecuta a mano, en desarrollo. Es la pregunta anterior: "¿mapeamos todo lo que
  el modelo declara?".
