# ADR-0014: Despliegue — Docker Compose multiproceso

## Estado
Aceptado.

## Contexto
El sistema necesita desplegar 1 API + 20 workers + 5 almacenes de datos como unidades
independientes que pueden reiniciarse, escalarse y desplegarse por separado.

## Fuerzas y restricciones
- Aislamiento de fallos entre workers: un crash de `automation` no debe tumbar `messaging`
  (decisión de diseño explícita en `src/worker/bootstrap.ts`).
- Necesidad de apagado ordenado (`enableShutdownHooks()`) en cada proceso.

## Opciones consideradas
Orquestador de contenedores (Kubernetes) vs. Docker Compose: el repositorio define
`docker-compose.yml` como la especificación real de despliegue multiservicio; no hay manifiestos
Kubernetes en el repositorio en el momento de esta auditoría.

## Decisión
Docker Compose como especificación de despliegue: 26 servicios (`api`, 20 `worker-*`, `postgres`,
`postgres-init`, `mongodb`, `mongo-init`, `redis`, `opensearch`, `opensearch-init`, `minio`).

## Consecuencias positivas
- Un solo archivo declara la topología completa del sistema — fuente de verdad reproducible.
- Cada worker es un servicio independiente, escalable y reiniciable por separado.

## Consecuencias negativas
- Docker Compose no da orquestación de alta disponibilidad multi-nodo real (failover automático,
  bin-packing) — si el sistema necesita eso, requiere migrar a Kubernetes o equivalente.
- Sin manifiestos de un orquestador real, la estrategia de despliegue en un entorno de producción
  con alta disponibilidad no está definida en este repositorio.

## Riesgos
`docs/operations/{environments,deployment,scaling}.md` (Fase 14) deben aclarar si Docker Compose
es también la estrategia de producción o solo de desarrollo/staging — no verificado en esta fase.

## Evidencia
`docker-compose.yml`, `Dockerfile`, `src/worker/bootstrap.ts`.

## Plan de revisión
Definir en Fase 14 si producción usa Docker Compose, un orquestador, o un servicio gestionado.
