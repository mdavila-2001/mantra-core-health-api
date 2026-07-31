# Arranque local

> Comandos reales verificados en Fase 0. Ver [prerrequisitos](prerequisites.md) primero.

## 1. Instalar dependencias

```bash
yarn install
```

## 2. Levantar infraestructura de datos

```bash
docker compose up -d postgres mongodb redis opensearch minio
```

## 3. Configurar variables de entorno

Copiar `.env.example` a `.env` y ajustar credenciales locales — ver
[variables de entorno](environment-variables.md) para el detalle completo.

## 4. Arrancar la API en modo desarrollo

```bash
yarn start:dev
```

Con `NODE_ENV` distinto de `production`, quedan disponibles:

- `GET /health` — sonda de liveness (pública).
- `GET /docs` — Swagger UI (documento generado en caliente).
- `GET /reference` — [Scalar](../api/conventions.md), referencia interactiva del mismo contrato.

## 5. (Opcional) Arrancar un worker de dominio

```bash
yarn start:worker:messaging:dev   # o cualquiera de los 20, ver docs/architecture/integration-map.md
```

## Compilar y generar el contrato OpenAPI real

```bash
yarn build
yarn docs:openapi:generate   # openapi/openapi.json + openapi/openapi.yaml
yarn docs:openapi:lint       # redocly lint — debe dar 0 errores
```

## Ejecutar pruebas

Ver [ejecutar pruebas](running-tests.md) para el detalle de cada capa y sus resultados de
referencia.

## Servir el portal de documentación

```bash
pip install -r docs/requirements.txt
yarn docs:serve   # mkdocs serve
```
