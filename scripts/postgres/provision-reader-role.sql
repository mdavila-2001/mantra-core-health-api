-- Rol de SOLO LECTURA para los testers de datos que entran desde fuera por el
-- puerto publicado de PostgreSQL (ver docs/operations/coolify.md § 7).
--
-- Por qué existe además de `provision-roles.sql`: aquel aplica los tres roles
-- de la aplicación (owner/writer/reader) UN ESQUEMA POR EJECUCIÓN, porque en un
-- entorno gestionado el DBA quiere decidir esquema a esquema. Éste hace una
-- sola cosa —dar SELECT sobre TODO a un lector externo— e itera él mismo sobre
-- los esquemas, que es lo que hace falta cuando hay ~60 módulos y quien lo
-- ejecuta es el operador del despliegue, no un DBA.
--
-- NO CONTIENE CONTRASEÑAS, igual que `provision-roles.sql`: un
-- `CREATE ROLE ... PASSWORD 'literal'` en un archivo versionado es una
-- credencial filtrada. El rol se crea con LOGIN y sin contraseña —que bajo
-- `scram-sha-256` no autentica a nadie— y la contraseña se fija aparte:
--
--   openssl rand -base64 18
--   psql ... -c "ALTER ROLE alovida_reader PASSWORD '<el valor generado>'"
--
-- POR QUÉ `\gexec` Y NO BLOQUES `DO $$`: psql NO sustituye `:'variable'` dentro
-- de una cadena entre dólares — la trata como literal y el servidor recibe los
-- dos puntos, que es un error de sintaxis. Un script con la forma
-- `DO $$ ... :'role' ... $$` no llega ni a ejecutarse. Aquí cada sentencia se
-- construye con `format()` en una consulta normal, donde psql sí interpola, y
-- `\gexec` ejecuta lo que esa consulta devuelve.
--
-- Idempotente en el estado final, no solo en la creación: reimpone los
-- atributos seguros y retira los privilegios que sobran en cada ejecución, así
-- que un GRANT manual hecho durante una incidencia no sobrevive para siempre.
--
-- Uso:
--   psql -U alovida -d alovida_health \
--     -v role_reader=alovida_reader -v owner=alovida -v database=alovida_health \
--     -f scripts/postgres/provision-reader-role.sql
--
-- Verificación (lo único que demuestra el mínimo privilegio es intentar
-- escribir y recibir un 42501, no leer el catálogo de concesiones):
--   PGPASSWORD=... psql -h <servidor> -U alovida_reader -d alovida_health \
--     -c 'insert into <cualquier tabla> default values'   -- debe dar 42501

\set ON_ERROR_STOP on

-- 1. El rol. `CREATE ROLE IF NOT EXISTS` no existe, así que se consulta el
--    catálogo: la consulta no devuelve ninguna fila si el rol ya está, y
--    `\gexec` sobre cero filas no ejecuta nada.
SELECT format('CREATE ROLE %I LOGIN', :'role_reader')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role_reader')
\gexec

-- 2. Atributos. Se reimponen SIEMPRE, no solo al crear: el rol se expone a
--    internet y no puede acumular poderes por una ejecución anterior más laxa.
--    NOBYPASSRLS es el crítico — con BYPASSRLS el lector ignora las políticas
--    de aislamiento por tenant y ve las filas de todos los prestadores.
SELECT format(
  'ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT LOGIN',
  :'role_reader')
\gexec

GRANT CONNECT ON DATABASE :"database" TO :"role_reader";

-- 3. SELECT sobre todos los esquemas de la aplicación, presentes y futuros.
--    Se excluyen los del catálogo y los internos de TimescaleDB: sus tablas ya
--    se leen a través de las hipertablas del esquema del módulo.
--
--    Retirar antes de conceder es lo que hace idempotente el ESTADO y no solo
--    la creación: si alguien le dio INSERT a mano, aquí lo pierde.
SELECT format('REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM %I', nspname, :'role_reader')
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg\_temp%'
  AND nspname NOT LIKE 'pg\_toast%'
  AND nspname NOT LIKE '\_timescaledb%'
ORDER BY nspname
\gexec

SELECT format('GRANT USAGE ON SCHEMA %I TO %I', nspname, :'role_reader')
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg\_temp%'
  AND nspname NOT LIKE 'pg\_toast%'
  AND nspname NOT LIKE '\_timescaledb%'
ORDER BY nspname
\gexec

SELECT format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I', nspname, :'role_reader')
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg\_temp%'
  AND nspname NOT LIKE 'pg\_toast%'
  AND nspname NOT LIKE '\_timescaledb%'
ORDER BY nspname
\gexec

-- Las tablas que cree la próxima migración, sin volver a correr esto. Solo
-- aplica a lo que cree :owner, que es quien ejecuta las migraciones.
SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT SELECT ON TABLES TO %I',
  :'owner', nspname, :'role_reader')
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg\_temp%'
  AND nspname NOT LIKE 'pg\_toast%'
  AND nspname NOT LIKE '\_timescaledb%'
ORDER BY nspname
\gexec

-- 4. Lo que NO se concede, dicho en voz alta: ninguna secuencia (un lector no
--    necesita nextval), ninguna función, y ningún esquema creado por un rol
--    distinto de :owner después de esta ejecución.
