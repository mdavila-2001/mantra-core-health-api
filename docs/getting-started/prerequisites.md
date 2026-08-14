# Prerrequisitos

> Verificado en Fase 0 (`docs/reports/baseline.md`) contra el entorno real de desarrollo.

| Herramienta | Versión usada en esta auditoría | Notas |
|---|---|---|
| Node.js | v24.18.0 | `nodenext`/ES2023, ver `tsconfig.json` |
| Yarn | 1.22.22 (classic) | Gestor de paquetes del proyecto (`yarn.lock`) |
| Docker + Docker Compose | — | Requerido para `docker-compose.yml` (Postgres, MongoDB, Redis, OpenSearch, MinIO, API, 21 workers) |
| Python 3 + pip | — | Solo para el portal de documentación (`docs/requirements.txt`: MkDocs Material) |

## Infraestructura local (Docker Compose)

`docker-compose.yml` define 5 almacenes de datos, la API y **21 procesos worker** independientes.
Ver `docs/architecture/integration-map.md` para el propósito de cada uno.

```bash
docker compose up -d postgres mongodb redis opensearch minio
```

No es necesario levantar los 21 workers ni el contenedor `api` para desarrollo local: `yarn
start:dev` corre la API directamente con Node, apuntando a los contenedores de datos.
