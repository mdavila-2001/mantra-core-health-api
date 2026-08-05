# DTOs de contexto de sistema

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID (`*ConceptId`).
- **Sólo dos vocabularios viajan como literal**: `ValidationMode` (`STRICT` / `LENIENT`) y
  `RefreshTrigger` (`SCHEDULED` / `MANUAL` / `EVENT`), que son los que el caso de uso enumera. Todo
  lo demás —tipo de contexto, ámbito, modo de selección, política de refresco, locale, país, tipo de
  fuente, tipo de consumidor— es catálogo abierto y llega como `*ConceptId`. Inventarle valores a un
  catálogo que el modelo declara abierto sería adivinar.
- Las fechas de entrada son ISO-8601 (`@IsISO8601`); las de salida, `toISOString()`.

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `CreateEnumDefinitionDto` | `EnumDefinitionResponseDto` |
| 02 | `DraftEnumVersionDto` (+ `EnumOptionDto`) | `EnumVersionResponseDto` |
| 03 | — (sin cuerpo) | `PublishEnumVersionResponseDto` |
| 04 | `CreateEnumBindingDto` | `EnumBindingResponseDto` |
| 05 | `ResolveEnumValueDto` | `ResolveEnumValueResponseDto` |
| 06 | `CreateSystemContextDto` | `SystemContextResponseDto` |
| 07 + 08 | `RefreshSystemContextDto` (+ `ContextInputDto`) | `RefreshRunResponseDto` |
| 09 | `ActivateContextVersionDto` | `ActivateContextVersionResponseDto` |
| 10 | `CreateContextBindingDto` | `ContextBindingResponseDto` |
| 11 | `RetireEnumDefinitionDto` | `RetireEnumDefinitionResponseDto` |
| 12 | `RollbackContextDto` | `RollbackContextResponseDto` |

## Decisiones que no son obvias

- **UC-45-03 no lleva cuerpo**: publicar no aporta datos, sólo identifica qué versión se publica, y
  eso ya está en la ruta.
- **`EnumOptionDto.ordinal` es opcional**: por defecto se numera con el orden del array, que es lo
  que el llamante ya expresó al construirlo.
- **`DraftEnumVersionDto.options` usa `@ArrayMinSize(1)`**: una versión sin opciones no puede
  publicarse nunca, así que rechazarla al redactar ahorra un borrador muerto.
- **`ResolveEnumValueDto` acepta `conceptId` o `code`, ambos opcionales**: el llamante puede tener
  cualquiera de los dos, y la ausencia de ambos es un caso legítimo —un campo opcional que llega
  vacío—, no un error de forma. Qué hacer con eso lo decide el binding.
- **`ResolveEnumValueResponseDto` no es un error cuando rechaza**: devuelve `accepted: false` con
  `rejectionReason`. Un 4xx obligaría al llamante a distinguir "el servicio falló" de "el valor no
  vale".
- **`ResolveEnumValueResponseDto.cacheToken`** viaja siempre, aceptado o no: es lo que el llamante
  memoiza, y una respuesta sin token le obligaría a resolver de nuevo cada vez.
- **`RefreshSystemContextDto` lleva las entradas** (UC-45-08) en lugar de tener endpoint propio: la
  procedencia se escribe en la misma transacción que la versión, y separarla permitiría añadirla a
  una versión ya cerrada.
- **`ContextInputDto.missing`** distingue "esta fuente no se pudo recoger" de "no se declaró": con
  `required: true`, lo primero falla la corrida.
- **`ActivateContextVersionDto.expectedContentHash` y `RollbackContextDto.expectedContentHash` son
  opcionales**: quien sepa qué contenido revisó puede exigir que sea ése; quien no, no queda
  bloqueado.
- **`RefreshRunResponseDto` distingue tres desenlaces**: `duplicate` (la clave ya se usó),
  `unchanged` (nada que versionar) y el caso normal con `versionId`. Colapsarlos dejaría al worker
  sin saber si debe promover algo.
- **`CreateSystemContextDto.contextJson` documenta que nunca lleva secretos**, sólo referencias
  gobernadas. Es la regla del caso de uso y el sitio donde un desarrollador la va a leer.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
