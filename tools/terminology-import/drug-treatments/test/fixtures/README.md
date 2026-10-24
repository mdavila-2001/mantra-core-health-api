# Fixtures de `drug-treatments`

Filas **reales y literales** copiadas de los archivos fijados en `lib/sources.mjs`
(mismo commit). Sirven para probar los parsers sin red. Atribución y licencias:

| Archivo | Origen | Licencia |
|---|---|---|
| `labeledin-expert.txt`, `labeledin-crowd.txt` | LabeledIn (NLM/NCBI), copia en `dhimmel/indications@11d535ba` | Dominio público (US Government Work) |
| `pharmacotherapydb.tsv` | PharmacotherapyDB 1.0, `dhimmel/indications@11d535ba` | CC0 1.0 |
| `drugcentral-indications.tsv`, `drugcentral-identifiers.tsv` | DrugCentral, `olegursu/drugtarget@64630f7c` | CC BY 4.0 — atribución: DrugCentral |
| `drugmechdb.yaml` | DrugMechDB, `SuLab/DrugMechDB@aef22421` | CC0 1.0 |
| `maxo.tsv` | MAxO annotations, `monarch-initiative/maxo-annotations@42edd966` | CC BY 4.0 — atribución: Monarch Initiative |
| `mondo.sssom.tsv` | MONDO SSSOM, `monarch-initiative/mondo@a645ab57` (sin las filas `SCTID`) | CC BY 4.0 — atribución: Monarch Initiative |

`drugcentral-indications.tsv` conserva la columna `SNOMEDCT_CUI` tal cual la publica la fuente
porque la prueba verifica que el parser la **descarta**.
