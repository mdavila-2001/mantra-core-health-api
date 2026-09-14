# =========================================================================
# Mantra Core Technologies · ALOVIDA
# Imágenes de inicialización de las bases (postgres / mongo / opensearch).
# -------------------------------------------------------------------------
# POR QUÉ EXISTE ESTE ARCHIVO, Y NO UN `volumes:` COMO EN DESARROLLO.
#
# Los servicios `*-init` necesitan dos cosas del repositorio: el script de
# arranque (`docker/db-init/*.sh`) y el DDL (`database/`). En la máquina de
# quien programa se montan con un bind y ya está, porque el demonio de Docker
# ve el mismo disco que el checkout.
#
# En Coolify NO. Coolify clona el repositorio DENTRO de un contenedor auxiliar
# (`/artifacts/<uuid>`) y desde ahí lanza `docker compose up` contra el socket
# del host. El montaje relativo `./docker/db-init` lo resuelve el DEMONIO, que
# corre en el host y donde esa ruta no existe: Docker entonces crea el
# directorio VACÍO y lo monta igual. El resultado fue exactamente esto:
#
#     bash: /init/bin/init-postgres.sh: No such file or directory
#     service "postgres-init" didn't complete successfully: exit 127
#
# (127 es «orden no encontrada»; bash lo devuelve también cuando el script que
# se le pasa no existe. Por eso el fallo NO se reproduce en local.)
#
# La build sí viaja bien —el contexto se envía desde el contenedor auxiliar al
# demonio—, que es como se construyen `api`, `api-migrate` y los workers. Así
# que el script y el DDL se HORNEAN en la imagen y no se monta nada.
#
# Contexto de build: la RAÍZ del repositorio (compose: `context: .`).
# Cada servicio construye su propia etapa con `target:`; BuildKit no construye
# las que no se le piden.
# =========================================================================

# -------------------------------------------------------------------------
# postgres-init · DDL relacional (SQL/) + los stores PG de NoSQL/ (58, 59)
# -------------------------------------------------------------------------
FROM timescale/timescaledb-ha:pg18 AS postgres-init
COPY docker/db-init/init-postgres.sh /init/bin/init-postgres.sh
COPY database/SQL                    /init/SQL
COPY database/NoSQL                  /init/NoSQL
ENTRYPOINT ["bash", "/init/bin/init-postgres.sh"]

# -------------------------------------------------------------------------
# mongo-init · colecciones y validadores del document store (NoSQL/55)
# -------------------------------------------------------------------------
FROM mongo:8.2.12 AS mongo-init
COPY docker/db-init/init-mongo.sh                 /init/bin/init-mongo.sh
COPY database/NoSQL/55_document_store_mongodb     /init/mongo
ENTRYPOINT ["bash", "/init/bin/init-mongo.sh"]

# -------------------------------------------------------------------------
# opensearch-init · mappings e index templates (NoSQL/57)
# -------------------------------------------------------------------------
FROM curlimages/curl:8.21.0 AS opensearch-init
COPY docker/db-init/init-opensearch.sh            /init/bin/init-opensearch.sh
COPY database/NoSQL/57_search_platform_opensearch /init/os
ENTRYPOINT ["/bin/sh", "/init/bin/init-opensearch.sh"]
