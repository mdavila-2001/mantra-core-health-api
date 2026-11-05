<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `ops-console`

Referencia exhaustiva de 1 operación(es) del módulo `ops-console`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `ops-console`
- **Controladores:** No localizados
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/ops/tools](#1-get-admin-ops-tools) — Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud

---

## 1. GET /admin/ops/tools

- **Módulo:** `ops-console`
- **Etiqueta OpenAPI:** `ops-console`
- **Nombre:** Herramientas e integraciones de la API: catálogo, adaptador en uso, configuración y salud
- **Operation ID:** `OpsToolsController_tools`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** no localizada automáticamente

### Descripción de negocio

Lista completa sin paginar. `isHealthy` sólo lo pone una sonda LIVE (las de `/readiness`, con caché de 10 s); CONFIGURATION y NOT_APPLICABLE devuelven `null` y nunca se informan como caídas. `missingEnvVars` y `requiredEnvVars` llevan nombres de variables, nunca valores.


### Descripción del sistema

NestJS resuelve `GET /admin/ops/tools` en `OpsToolsController_tools`. No se detectó una delegación adicional desde el controlador. No recibe body. No se encontró metadato estático adicional del controlador.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ops/tools HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/ops/tools HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `un tipo no especificado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/tools"
}
```

---

