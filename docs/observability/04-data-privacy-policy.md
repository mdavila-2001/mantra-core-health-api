# 04 · Política de privacidad de los datos de trazas

> Fase 18. Este backend maneja PHI (información de salud protegida), documentos de identidad y
> datos de facturación. Una traza mal configurada convierte el almacén de trazas en una copia
> paralela de la historia clínica, fuera del control de acceso y de las políticas de retención de
> la base de datos. Este documento define qué puede y qué no puede salir del proceso.

## 1. Principio

> **El almacén de trazas es un sistema de diagnóstico, no un almacén de datos.**

Una traza debe permitir responder *qué operación ocurrió, cuánto tardó, dónde falló y sobre qué
entidad*. Nunca *qué decía el dato*.

## 2. Prohibido registrar

Ni como atributo de span, ni como evento, ni como nombre de span, ni en logs correlacionados.

### Credenciales y secretos

- Contraseñas, en claro o hasheadas
- Access tokens, refresh tokens, tokens de verificación de correo
- Cabeceras `Authorization`, `Cookie`, `Set-Cookie`
- API keys de proveedores, `JWT_SECRET`, `MFA_ENCRYPTION_KEY`, `WEBHOOK_SIGNING_KEY`,
  `DOWNLOAD_URL_SECRET`
- Secretos TOTP, códigos OTP
- Cadenas de conexión y credenciales de base de datos
- El contenido de `process.env`

### Datos personales y de salud

- Documentos de identidad
- Nombres, apellidos, fechas de nacimiento
- Direcciones postales completas, geolocalización precisa
- Correos electrónicos y teléfonos
- Diagnósticos, códigos clínicos aplicados a un paciente, resultados de laboratorio
- Prescripciones, notas clínicas, historia clínica
- Datos bancarios, números de tarjeta, importes asociados a una persona identificada

### Cargas útiles

- Cuerpos de petición y de respuesta HTTP, completos o parciales
- Payloads de eventos de dominio
- Valores de parámetros SQL
- Valores almacenados en Redis, MongoDB u OpenSearch
- Contenido de archivos, imágenes o estudios
- Query strings (pueden llevar tokens de descarga firmados)
- Stack traces devueltos al cliente

## 3. Permitido registrar

| Categoría | Ejemplos | Justificación |
| --- | --- | --- |
| Identificadores técnicos | `trace_id`, `span_id`, `correlationId` | no derivan de datos personales |
| Identificadores internos | `app.entity.id`, `app.event.id`, `app.job.execution.id` | UUID opacos; sin la base de datos no revelan nada, y son lo que hace útil una traza para soporte |
| Nombres de operación | `iam.authenticate`, `GET /iam/users/:id` | plantilla de ruta, nunca el id concreto |
| Clasificaciones | `app.module`, `app.operation`, `app.entity.type` | vocabulario cerrado |
| Tenant | `app.tenant.id` | necesario para aislar incidentes por cliente |
| Métricas de resultado | `app.result.count`, `messaging.delivery.outcome` | agregados, no datos |
| Metadatos de infraestructura | `db.system`, `server.address`, `http.response.status_code` | ni personales ni secretos |
| Motivos de fallo clasificados | `reason: bad-password`, `app.error.code` | vocabulario cerrado |

## 4. Controles implementados

| # | Control | Dónde | Qué impide |
| --- | --- | --- | --- |
| C1 | Sin `headersToSpanAttributes` en la instrumentación HTTP | `src/observability/instrumentations.ts` | Captura de `Authorization` y `Cookie` |
| C2 | `enhancedDatabaseReporting: false` en `pg` y MongoDB | ídem | Valores de parámetros SQL (diagnósticos, documentos) |
| C3 | `dbStatementSerializer` que emite solo el comando | ídem | Claves y valores de Redis |
| C4 | Rutas excluidas del trazado | `telemetry.constants.ts` | Ruido, y con él la exposición de superficie interna |
| C5 | `redact` de pino con `remove: true` | `src/logging/pino-options.ts` | Cabeceras y campos sensibles en los logs |
| C6 | El filtro global no adjunta el objeto de excepción completo | `all-exceptions.filter.ts` | SQL y valores dentro de mensajes de error |
| C7 | Vista `TraceSpan` reducida para el dominio | `tracing.service.ts` | Que un dominio vuelque objetos arbitrarios |
| C8 | Carrier de traza en `metadataJson`, no en el payload | `outbox.service.ts` | Alterar el payload de negocio |
| C9 | Procesador `attributes/redact` en el Collector | `infra/otel-collector/otel-collector.config.yml` | Segunda barrera ante una instrumentación de terceros |
| C10 | Muestreo < 100% en producción | `OTEL_TRACES_SAMPLER_ARG` | Reduce el volumen y la ventana de exposición |

## 5. Verificación automatizada

La prohibición no es solo documental: hay pruebas que fallan si se rompe.

| Prueba | Qué comprueba |
| --- | --- |
| `test/integration/observability.int-spec.ts` → «privacidad» | Serializa **todos** los spans de una petición con contraseña, correo y cabecera `Authorization` y verifica que ninguno de esos valores aparece |
| `scripts/verify-jaeger.sh` → paso 6 | Contra Jaeger real: rechaza cualquier etiqueta cuyo nombre o valor coincida con `authorization\|cookie\|password\|secret\|token` o con la credencial usada en la prueba |
| `src/observability/instrumentations.spec.ts` | Que el serializador de Redis emite solo el comando y que las rutas sensibles siguen excluidas |

Ambas se ejecutaron y pasaron. Ver [05-performance-results.md](05-performance-results.md) y el
informe de la iniciativa para la evidencia.

## 6. Retención

| Entorno | Retención | Motivo |
| --- | --- | --- |
| Desarrollo | En memoria, se pierde al reiniciar | Nunca contiene datos reales de pacientes |
| Staging | 7 días | Suficiente para investigar una regresión |
| Producción | **7 días** como máximo por defecto | Una traza es un artefacto de diagnóstico a corto plazo; guardarla más tiempo aumenta la exposición sin aumentar la utilidad |

La retención se aplica en el almacenamiento (índices `jaeger-*` con política ILM/ISM), no en la
aplicación. Ver [03-production-topology.md](03-production-topology.md).

## 7. Control de acceso

- La UI de trazas **no se publica en Internet**. Red privada, detrás de VPN o proxy autenticado.
- El acceso se concede al mismo grupo que ya tiene acceso a los logs de producción; no crea un
  nivel de privilegio nuevo ni lo evita.
- El endpoint OTLP no se expone públicamente: recibe telemetría sin autenticar y quien lo alcanzara
  podría inyectar trazas falsas o saturar el almacenamiento.
- En desarrollo, los puertos de Jaeger se publican en `127.0.0.1`, no en `0.0.0.0`.

## 8. Auditoría

| Momento | Acción |
| --- | --- |
| En cada PR que añada un span manual | Revisar atributos contra §2 y actualizar el [catálogo](02-business-spans-catalog.md) |
| Al actualizar cualquier `@opentelemetry/instrumentation-*` | Revisar el changelog por atributos nuevos capturados por defecto |
| Trimestral | Muestrear trazas reales de producción y buscar los patrones de §2 |

## 9. Procedimiento ante una filtración

Si se detecta información sensible en las trazas:

1. **Contener.** Poner `OTEL_ENABLED=false` en los servicios afectados y desplegar. La aplicación
   sigue funcionando exactamente igual; solo deja de trazar.
2. **Cortar el origen.** Identificar el atributo y su procedencia (instrumentación automática, span
   manual, evento). Añadir la regla de borrado en el procesador `attributes/redact` del Collector
   —efecto inmediato, sin desplegar la aplicación— y corregir el origen en el código.
3. **Evaluar el alcance.** Qué se expuso, durante cuánto tiempo y quién pudo verlo (accesos a la UI
   y al almacenamiento).
4. **Purgar.** Borrar los índices afectados del almacenamiento. Con retención de 7 días, purgar el
   rango completo suele ser más rápido y más seguro que un borrado selectivo.
5. **Revocar.** Si se expusieron credenciales, rotarlas: JWT, claves de webhook, claves de
   proveedor. Asumir comprometido todo secreto que haya aparecido.
6. **Documentar.** Registrar el incidente según el procedimiento de seguridad del proyecto
   (`docs/security/`), incluida la causa raíz y el control añadido para que no se repita.
7. **Reactivar.** Volver a habilitar la telemetría solo tras verificar la corrección con
   `scripts/verify-jaeger.sh`, cuyo paso 6 es exactamente esta comprobación.

## 10. Responsables operativos

| Rol | Responsabilidad |
| --- | --- |
| Equipo de backend | Cumplir §2 en cada span manual; mantener el catálogo al día |
| Responsable de la plataforma | Collector, retención, acceso a la UI, TLS |
| Responsable de seguridad / protección de datos | Auditoría trimestral y conducción del §9 |

## Ver también

- [Catálogo de spans de negocio](02-business-spans-catalog.md)
- [Topología de producción](03-production-topology.md)
- [Runbook operativo](06-operational-runbook.md)
