# src / modules / telemetry / infrastructure / google-analytics

Adaptador de analítica web sobre el **Measurement Protocol de Google Analytics 4**.

Reenvía server-side la telemetría que el módulo ya persistió: el portal no habla
con Google, habla con esta API, y esta API decide qué sale. Un bloqueador de
anuncios no lo silencia, ningún dato personal se le escapa al navegador y el
consentimiento se aplica una sola vez, aquí.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `google-analytics.config.ts` | Configuración concreta del cliente, derivada del entorno del módulo. |
| `google-analytics.mapper.ts` | Traducción pura al Measurement Protocol: identidad derivada, saneado de nombres/propiedades y troceado por los límites de GA4. |
| `google-analytics.mapper.spec.ts` | Pruebas unitarias del mapeo y de la clasificación de errores. |
| `google-analytics-http.client.ts` | Única pieza que conoce la URL, las credenciales y el formato de respuesta. |
| `google-analytics.adapter.ts` | Implementación del puerto con mamparo, cortacircuitos, reintento y plazo. |
| `google-analytics.adapter.spec.ts` | Pruebas unitarias del adaptador con el cliente doblado. |
| `google-analytics.contract.spec.ts` | Contrato de extremo a extremo contra un colector local que habla el protocolo real. |

## Límites de GA4 que impone el mapper

| Regla | Valor | Consecuencia si se ignora |
| --- | --- | --- |
| Eventos por petición | 25 | La petición entera se rechaza. |
| `timestamp_micros` | uno **por petición**, no por evento | Los eventos de una misma petición se fechan igual: por eso se agrupan por proximidad temporal. |
| Antigüedad máxima | 72 h | GA4 descarta el evento **sin decirlo**. |
| Nombre de evento | ≤ 40 caracteres, `[a-z0-9_]`, empieza por letra | El evento se ignora. |
| Nombres reservados | `session_start`, `first_visit`, … | El evento se ignora o contamina un informe estándar. |
| Parámetros por evento | 25, nombre ≤ 40, valor ≤ 100 | Se descartan los sobrantes. |
| Prefijos reservados | `_`, `firebase_`, `ga_`, `google_`, `gtag.` | El parámetro se ignora. |
| Cuerpo JSON | < 130 kB | La petición se rechaza. |

El endpoint de recolección responde `204 No Content` **tanto si cuenta el evento
como si lo descarta**: lo que no valide el mapper no lo valida nadie. Para ver el
motivo real está `GA4_DEBUG_VALIDATION=true`, que envía a `/debug/mp/collect` y
registra en el log lo que Google objeta.

## Criterios de mantenimiento

- El `client_id` se deriva con SHA-256 y sal del despliegue: estable para que un
  visitante no se multiplique, e irreversible para que Google no pueda cruzar
  sus datos con los identificadores internos.
- Ningún identificador interno viaja en claro; la prueba de contrato lo afirma.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y
  errores relevantes.
