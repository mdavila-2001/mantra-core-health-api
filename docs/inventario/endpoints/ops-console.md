<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `ops-console`

- **Bloque:** —
- **Operaciones:** 1 (1 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 1
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/ops-console.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/ops/tools` | Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud | BAJO | 0 | sesión (sin roles) |

---

## 1. GET /admin/ops/tools

- **Origen:** CONTRATO
- **Nombre:** Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** no localizada

### Qué es y para qué sirve (negocio)

Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/tools`: handler no localizado en el código. Exige sesión; el controlador no declara roles. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | No determinado: el handler no está en el código | `contrato` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — tipo no declarado

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

_No se pudo derivar (la operación no tiene handler en el código)._

El árbol de decisión completo está en [flujos](../flujos/ops-console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- ops-console — etapa `ctrl:sin controlador` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

