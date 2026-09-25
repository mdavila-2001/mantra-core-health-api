# Fixtures sintéticos — carga masiva de terminología

**Sintético, generado el 2026-09-25 por `generar-fixtures.mjs`, sin procedencia externa.**
Todos los códigos llevan el prefijo reservado `ZZ-`. Idempotente: correr el script dos veces
produce los mismos bytes en los `.csv` (verificable con `sha256sum *.csv`).

| Archivo (`.csv` y su gemelo `.xlsx`) | Filas de datos | `problemas` esperados |
|---|---|---|
| `ok-50` | 50 (`ZZ-001`…`ZZ-050`) | 0 |
| `con-errores` | 50, de las cuales 5 malas: fila 5 `display` vacío · fila 9 `code` vacío · fila 14 `code` de 256 · fila 20 `code` = `ZZ-003` (repetido) · fila 33 `display` de 256 | 5 |
| `vacio-solo-encabezado` | 0 | 1 (sin filas) |
| `bom` | 3 | 0 |
| `separador-punto-y-coma` | 3 | 0 |
| `comillas-y-saltos` | 3 | 0 |
| `unicode` | 3 | 0 |
| `columnas-desordenadas` | 3 | 0 |
| `columna-desconocida` | 3 (+ columna `extra`) | 1 |
| `sin-encabezado` | — | 1, 0 filas |
| `fila-vacia-al-final` | 3 (+ 2 líneas vacías) | 0 |
| `duplicado-en-archivo` | 4 (`ZZ-001` dos veces) | 1 (lo detecta la validación, no el parseador) |
| `grande-10k` | 10 000 | 0 (sólo XLSX) |
| `error-red` | 50, contenido igual a `ok-50` | dispara el 503 del simulador por nombre; en la API real importa igual que `ok-50` |
| `celda-numerica` | 3 (sólo XLSX) | `code` numérico → `'10'`; fórmula con valor → su valor; fórmula sin valor → problema |
| `no-es-nada.pdf` | — | `FormatoNoAdmitidoError` → 422 |

Copiados a `playwright/fixtures/carga-masiva/` del front sin regenerar (mismo `sha256sum`).
