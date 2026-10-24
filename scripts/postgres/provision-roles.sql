-- Aprovisionamiento idempotente de los roles de aplicación de PostgreSQL.
--
-- Esta es la versión declarativa, pensada para que un DBA la revise y la
-- ejecute en un entorno gestionado. En desarrollo se usa `yarn db:provision:dev`,
-- que hace lo mismo pero además descubre los esquemas, fija las contraseñas
-- desde el entorno y VERIFICA el resultado ejecutando operaciones reales — que
-- es lo único que demuestra que el mínimo privilegio se aplicó (§54).
--
-- Este archivo NO contiene contraseñas y no las puede contener: se fijan aparte,
-- desde un gestor de secretos. Un `CREATE ROLE ... PASSWORD 'literal'` en un
-- archivo versionado es una credencial filtrada, aunque el entorno sea local.
--
-- Convenciones:
--   :role_writer   rol de escritura de la aplicación (DML, sin DDL)
--   :role_reader   rol de lectura (solo SELECT)
--   :role_owner    propietario de los objetos y ejecutor de migraciones
--   :database      base sobre la que se otorga CONNECT
--   :schema        esquema al que se aplican los privilegios
--
-- Se invoca con `psql -v role_writer=... -v schema=...`, un esquema por
-- ejecución. El script de desarrollo itera sobre todos los esquemas gestionados.

\set ON_ERROR_STOP on

-- 1. Roles. `IF NOT EXISTS` no existe para CREATE ROLE en todas las versiones
-- soportadas, así que se consulta el catálogo. La consulta no devuelve ninguna
-- fila si el rol ya está, y `\gexec` sobre cero filas no ejecuta nada.
--
-- POR QUÉ `\gexec` Y NO UN BLOQUE `DO $$`: psql NO sustituye `:'variable'`
-- dentro de una cadena entre dólares — la pasa literal, y el servidor recibe
-- los dos puntos y responde `syntax error at or near ":"`. Este archivo llevaba
-- esa forma desde que se escribió, así que NUNCA se pudo ejecutar; se descubrió
-- el 05/09/2026 al correrlo por primera vez de verdad. En una consulta normal
-- psql sí interpola, y `\gexec` ejecuta cada fila que devuelve.
SELECT format('CREATE ROLE %I LOGIN', :'role_writer')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role_writer')
\gexec

SELECT format('CREATE ROLE %I LOGIN', :'role_reader')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'role_reader')
\gexec

-- 2. Atributos inseguros. Se aplican SIEMPRE, no solo al crear: un rol que
-- alguien elevó a mano vuelve aquí a su sitio en la siguiente ejecución. Sin
-- este paso el script sería idempotente en la creación pero no en el estado
-- final, que es lo que de verdad importa (§57-3).
--
-- NOBYPASSRLS es el atributo crítico de este backend: con BYPASSRLS, el rol
-- ignora las políticas de aislamiento por tenant de las 288 tablas que las
-- tienen, y el aislamiento multi-tenant a nivel de base deja de existir.
SELECT format(
  'ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT LOGIN',
  :'role_writer')
\gexec

SELECT format(
  'ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT LOGIN',
  :'role_reader')
\gexec

-- 3. Conexión a la base.
GRANT CONNECT ON DATABASE :"database" TO :"role_writer";
GRANT CONNECT ON DATABASE :"database" TO :"role_reader";

-- 4. Privilegios sobre el esquema y sus objetos actuales.
GRANT USAGE ON SCHEMA :"schema" TO :"role_writer";
GRANT USAGE ON SCHEMA :"schema" TO :"role_reader";

-- El escritor hace DML y nada más. No recibe TRUNCATE: es una operación
-- destructiva que ninguna ruta de negocio necesita y que salta los disparadores
-- de auditoría, así que se reserva al propietario.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA :"schema" TO :"role_writer";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA :"schema" TO :"role_writer";

-- El lector solo lee.
GRANT SELECT ON ALL TABLES IN SCHEMA :"schema" TO :"role_reader";

-- 5. Convergencia: retira lo que no debería tener.
--
-- Sin este paso, una ejecución anterior con permisos más amplios -o un GRANT
-- manual durante una incidencia- sobreviviría a todas las reejecuciones
-- siguientes. Es la diferencia entre un script idempotente y uno que solo
-- añade.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA :"schema" FROM :"role_reader";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA :"schema" FROM :"role_reader";
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA :"schema" FROM :"role_writer";
REVOKE CREATE ON SCHEMA :"schema" FROM :"role_writer", :"role_reader";

-- 6. Privilegios por defecto, para los objetos que aún no existen.
--
-- Dependen del rol que CREA el objeto, no del que ejecuta este script: por eso
-- van con `FOR ROLE :role_owner`. Si las migraciones cambiaran de rol ejecutor,
-- estos privilegios dejarían de aplicarse a las tablas nuevas y el fallo
-- aparecería como un 42501 en la primera escritura sobre una tabla recién
-- creada — un síntoma que no señala a su causa.
ALTER DEFAULT PRIVILEGES FOR ROLE :"role_owner" IN SCHEMA :"schema"
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"role_writer";
ALTER DEFAULT PRIVILEGES FOR ROLE :"role_owner" IN SCHEMA :"schema"
  GRANT SELECT ON TABLES TO :"role_reader";
ALTER DEFAULT PRIVILEGES FOR ROLE :"role_owner" IN SCHEMA :"schema"
  GRANT USAGE, SELECT ON SEQUENCES TO :"role_writer";
