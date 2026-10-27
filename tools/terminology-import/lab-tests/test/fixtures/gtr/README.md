# Recortes reales de NCBI GTR (fixtures)

Tomados el 2026-10-27 de `https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/` (dominio público, NCBI/NLM):

- `test_version.sample.tsv`: cabecera + 11 filas reales de `test_version.gz` (SHA-256 del archivo completo
  `b9d49d82…c850`, Last-Modified 2026-10-22), elegidas para cubrir: prueba vigente simple, multigen, con
  herencia y respuesta a fármacos, con codificación dañada en origen (™ doblemente codificado), con nombre de
  fabricante, versión vieja, `test_currStat=72`, `test_pubStat=4`, tipo Research y laboratorios de ES/BR.
- `test_condition_gene.sample.txt`: todas las filas de `test_condition_gene.txt` (SHA-256 `8ffb7634…ab71d`) de
  esas accesiones.
- `tests_by_method_category.txt`: el archivo completo (1,6 kB).

El archivo real termina las líneas con CRLF; el recorte quedó con LF. El lector se prueba con CRLF aparte.
