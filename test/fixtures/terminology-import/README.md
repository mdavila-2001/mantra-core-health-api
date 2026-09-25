# Fixtures de la carga masiva de terminología

Sintéticos, generados el 2026-09-25 por `generar-fixtures.mjs`, sin procedencia externa. Códigos
con el prefijo reservado `ZZ-` (contrato compartido `CONTRATO-CARGA-MASIVA.md` §4). Ningún dato de
persona ni catálogo real: son de prueba, para ejercitar el parser y la validación, y se pueden
regenerar corriendo el script de nuevo (`node generar-fixtures.mjs`) — dos corridas producen los
mismos bytes.

| Archivo | Filas de datos | `problemas` esperados |
|---|---|---|
| `ok-50.csv` | 50 (`ZZ-001`…`ZZ-050`) | 0 |
| `con-errores.csv` | 50, 5 malas: fila 5 `display` vacío · fila 9 `code` vacío · fila 14 `code` de 256 · fila 20 `code` = `ZZ-003` (repetido) · fila 33 `display` de 256 | 5, con `fila` y `columna` exactas |
| `vacio-solo-encabezado.csv` | 0 | 1 (fila 1: «sin filas») → 422 `IMPORT_EMPTY_FILE` |
| `bom.csv` | 3 | 0 |
| `separador-punto-y-coma.csv` | 3 | 0 |
| `comillas-y-saltos.csv` | 3 (una `definition` con coma, comilla y salto de línea) | 0 |
| `unicode.csv` | 3 (tildes, ñ, emoji) | 0 |
| `columnas-desordenadas.csv` | 3 (`definition,display,code`) | 0 |
| `columna-desconocida.csv` | 3 (+ columna `extra`) | 1 (fila 1, «columna extra no reconocida») |
| `sin-encabezado.csv` | — | 1 (fila 1) y 0 filas |
| `fila-vacia-al-final.csv` | 3 (+ 2 líneas vacías) | 0 |
| `duplicado-en-archivo.csv` | 4 (`ZZ-001` dos veces) | 1 (fila 4, `code`) — lo detecta la validación del servicio, no el parseador |
| `no-es-nada.pdf` | — | `FormatoNoAdmitidoError` → 422 |

## Lo que falta y por qué

Los **gemelos `.xlsx`** de cada archivo de arriba, más `grande-10k.xlsx` (10 000 filas, sólo para
el spec de límite) y `celda-numerica.xlsx`, **no están generados esta noche**: no hay ninguna
dependencia XLSX instalada. Se evaluaron dos (`exceljs`, `xlsx` de npm) y las dos se rechazaron con
evidencia — ver `docs/trabajo/2026-09-25-marcelo-calidad/decision-dependencia.md` del carril de
Marcelo. No se resolvió a mano por fuera del proceso (generar un `.xlsx` sin la librería que se
va a usar para leerlo después no probaría nada).

## Uso

```bash
node test/fixtures/terminology-import/generar-fixtures.mjs
```

Sobrescribe los 13 archivos de esta carpeta con contenido idéntico al que ya está commiteado
(determinismo verificado: `sha256sum` igual en dos corridas seguidas).
