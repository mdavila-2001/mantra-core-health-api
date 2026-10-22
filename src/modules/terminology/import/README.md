# Terminology · import

Lectura de los archivos de carga masiva. La frontera entre «un archivo que
alguien subió» y «filas con las que el servicio puede trabajar»: entra un
`Buffer`, salen `FilaLeida` y `ProblemaDeFila`, sea cual sea el formato.

## Qué NO se hace acá (importante)

**Nada de acá valida contenido.** Si una celda obligatoria está vacía, si un
texto se pasa de largo o si un código se repite dentro del archivo lo decide el
validador del servicio, que es el único que conoce las reglas del catálogo.

Un parseador **nunca lanza por el contenido de una fila**: devuelve el problema
apuntando a ella. Sólo lanza si el buffer no es de su formato, que es un error
del archivo y no de una fila. Esa separación es lo que permite informar «la fila
14 tiene el código vacío» en vez de rechazar el archivo entero.

## El número de fila es el que ve quien abre el archivo

El encabezado es la fila 1, así que la primera fila de datos es la 2. Una fila
entrecomillada que ocupa tres renglones sigue siendo **una** fila. En NDJSON,
donde no hay encabezado, el número es el del renglón.

## Archivos

| Archivo | Qué es |
|---|---|
| `row-contract.ts` | Los tipos que comparten todos los formatos, y el error de formato no admitido. Es el contrato contra el que se escribe un parseador nuevo |
| `format-detector.ts` | Decide el formato por **contenido**, nunca por extensión ni por el tipo declarado en la subida |
| `import-profiles.ts` | Qué columnas se esperan según lo que se esté cargando, con sus alias en castellano |
| `csv-parser.ts` | RFC 4180 propio: separador detectado entre coma y punto y coma, comillas, saltos dentro de celda, marca de orden de bytes |
| `ndjson-parser.ts` | Un objeto JSON por línea. Es el formato con el que nació el importador |
| `index.ts` | Lo que se usa desde afuera, incluida la lista de parseadores disponibles |

El parseador de planillas se escribe contra `row-contract.ts` y se suma a la
lista de `index.ts` al integrarlo.
