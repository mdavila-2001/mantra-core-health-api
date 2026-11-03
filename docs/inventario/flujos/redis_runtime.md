<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `redis_runtime`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 6 (6 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [redis_runtime](../endpoints/redis_runtime.md)

## Proceso: MÓDULO 56 — `redis_runtime`

- **Código:** `redis_runtime` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 6
- **Actores:** Cualquier sesión válida · PLATFORM_OPERATOR
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/redis_runtime/README.md`

### Para qué sirve

Runtime de baja latencia sobre Redis **real** (contenedor `mantra-redesa-redis-1`, `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` del entorno; por defecto `localhost:6380`). Vía `ioredis`.

_Fuente: `src/modules/redis_runtime/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:RedisRuntimeController` | Operaciones de RedisRuntimeController que el README no asigna a un caso de uso | DESCONOCIDO /redis-runtime | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /redis-runtime/cache | PLATFORM_OPERATOR | BAJO | 0 |
|  |  | DELETE /redis-runtime/cache/{key} | PLATFORM_OPERATOR | BAJO | 0 |
|  |  | GET /redis-runtime/cache/{key} | PLATFORM_OPERATOR | BAJO | 0 |
|  |  | POST /redis-runtime/locks | PLATFORM_OPERATOR | BAJO | 0 |
|  |  | DELETE /redis-runtime/locks/{key} | PLATFORM_OPERATOR | BAJO | 0 |

### Diagrama — etapas `ctrl:RedisRuntimeController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a4(["PLATFORM_OPERATOR"]):::actor
  subgraph s0["ctrl:RedisRuntimeController · Operaciones de RedisRuntimeController que el READ…"]
    o1["DESCONOCIDO /redis-runtime"]:::op
    o3["POST /redis-runtime/cache"]:::op
    o5["DELETE /redis-runtime/cache/{key}"]:::op
    o6["GET /redis-runtime/cache/{key}"]:::op
    o7["POST /redis-runtime/locks"]:::op
    o8["DELETE /redis-runtime/locks/{key}"]:::op
  end
  a2 --> o1
  a4 --> o3
  a4 --> o5
  a4 --> o6
  a4 --> o7
  a4 --> o8
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. DESCONOCIDO /redis-runtime

Tenant del contexto; obligatorio para acotar cualquier operación.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!tenant"}:::decision
  n2 --> n3
  n4(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n3 -->|"sí"| n4
  n5(("200 Responde con éxito")):::ok
  n3 -->|"no"| n5
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /redis-runtime/cache

Escribir un valor en caché con TTL (namespaced por tenant)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedisRuntimeController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenant"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n4 -->|"sí"| n5
  n6["Llama a RedisRuntimeService.setWithTtl"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a RedisRuntimeService.keyFor"]:::llamada
  n6 --> n7
  n8{"!tenant"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n8 -->|"sí"| n9
  n10{"!key"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. DELETE /redis-runtime/cache/{key}

Borrar una clave de caché (namespaced por tenant)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedisRuntimeController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenant"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n4 -->|"sí"| n5
  n6["Llama a RedisRuntimeService.del"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a RedisRuntimeService.keyFor"]:::llamada
  n6 --> n7
  n8{"!tenant"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n8 -->|"sí"| n9
  n10{"!key"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /redis-runtime/cache/{key}

Leer un valor de caché por clave (namespaced por tenant)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedisRuntimeController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenant"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n4 -->|"sí"| n5
  n6["Llama a RedisRuntimeService.get"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a RedisRuntimeService.keyFor"]:::llamada
  n6 --> n7
  n8{"!tenant"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n8 -->|"sí"| n9
  n10{"!key"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /redis-runtime/locks

Adquirir un lock distribuido (SET NX PX + token)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedisRuntimeController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenant"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n4 -->|"sí"| n5
  n6["Llama a RedisRuntimeService.acquireLock"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a RedisRuntimeService.keyFor"]:::llamada
  n6 --> n7
  n8{"!tenant"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n8 -->|"sí"| n9
  n10{"!key"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. DELETE /redis-runtime/locks/{key}

Liberar un lock si el token coincide (CAS)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedisRuntimeController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenant"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Se requiere X-Tenant-Id para operar sobre el runtime"]):::error
  n4 -->|"sí"| n5
  n6["Llama a RedisRuntimeService.releaseLock"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a RedisRuntimeService.keyFor"]:::llamada
  n6 --> n7
  n8{"!tenant"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n8 -->|"sí"| n9
  n10{"!key"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

