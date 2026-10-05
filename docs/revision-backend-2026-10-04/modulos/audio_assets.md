# Revisión del módulo `audio_assets` — ALOVIDA

## Alcance y resultado

Se revisaron resolución, contenido, caché, almacenamiento, generación interna,
presupuesto, cifrado y tests. No se confirmó un hallazgo nuevo en esta unidad.
El código contiene defensas específicas para el riesgo principal: que un audio
con un nombre u otro dato dinámico sea reutilizado o servido entre tenants.

| Control | Evidencia |
| --- | --- |
| Identidad y caché | La clave incorpora `tenantId` cuando el render usa datos identificables, y la búsqueda de binario reutilizable conserva ese alcance. |
| Contenido | El endpoint busca el asset READY y devuelve 404 antes de leer storage cuando el tenant activo no coincide ([audio-content.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/audio_assets/audio-content.service.ts#L17-L47)). |
| Datos dinámicos | No hay texto libre de TTS: sólo plantillas; se valida/normaliza y el texto persistido se cifra. |
| Procesos internos | Preparación, publicación, falla, verificación y GC quedan tras el rol `SYSTEM` ([audio-assets-internal.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/audio_assets/controllers/audio-assets-internal.controller.ts#L19-L104)). |
| Publicación | La generación exige prueba de publicación y conserva el ciclo de vida de storage en el repositorio. |

La excepción de contenido sin tenant está destinada al barrido interno
`SYSTEM`. El interceptor de tenant rechaza a actores ordinarios sin un tenant
resoluble; el comportamiento deberá mantenerse así si se modifica esa capa.

## Pruebas ejecutadas

```text
corepack yarn test src/modules/audio_assets --runInBand --silent
7 suites, 31 pruebas aprobadas
```

Se incluyen pruebas de cifrado, plantilla, valores dinámicos, claves, alcance de
tenant, contenido y resolución. Faltan integración de almacenamiento/cola y una
E2E con dos tenants y el interceptor HTTP real.

## Matriz de regresión que se conserva

| Área | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Resolución | Plantilla registrada y variable permitida | longitud máxima permitida | plantilla/campo desconocido | `404/RESOURCE_NOT_FOUND/AUDIO_TEMPLATE_NOT_FOUND` |
| Aislamiento | Asset T1 leído bajo T1 | asset compartido sin tenant | asset T1 solicitado desde T2 | `404/RESOURCE_NOT_FOUND/AUDIO_ASSET_NOT_FOUND` |
| Generación | worker SYSTEM publica con prueba válida | cuota y reintento configurados | prueba/checksum/estado inválido | error de lifecycle saneado, sin texto ni secreto |
| Mantenimiento | verificar y GC de asset elegible | límite máximo | intentar deprecar fallback | respuesta de regla catalogada |
