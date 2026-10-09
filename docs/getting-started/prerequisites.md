# Prerrequisitos

> Verificado en Fase 0 (`docs/reports/baseline.md`) contra el entorno real de desarrollo.

| Herramienta | Versión usada en esta auditoría | Notas |
|---|---|---|
| Node.js | v24.18.0 | `nodenext`/ES2023, ver `tsconfig.json` |
| Yarn | 4.14.1 vía Corepack | Fijado en `packageManager` de `package.json`; se invoca con `corepack yarn <script>` (nunca `npm`) |
| Docker + Docker Compose | — | Requerido para `docker-compose.yml` (Postgres, MongoDB, Redis, OpenSearch, MinIO, API y los workers; `ls src/worker-*.ts` cuenta 24 entry points) |
| Python 3 + pip | — | Solo para el portal de documentación (`docs/requirements.txt`: MkDocs Material) |

## Infraestructura local (Docker Compose)

`docker-compose.yml` define 5 almacenes de datos, la API y procesos worker independientes (24 entry points `src/worker-*.ts`).
Ver `docs/architecture/integration-map.md` para el propósito de cada uno.

```bash
docker compose up -d postgres mongodb redis opensearch minio   # postgres y mongodb pertenecen al perfil local-db; nombrarlos los activa
```

No es necesario levantar los workers ni el contenedor `api` para desarrollo local: `yarn
start:dev` corre la API directamente con Node, apuntando a los contenedores de datos.
