# Catálogo de razones de `emit()` — propuesta para `AgendaNoticePort v1.1.0`

- **Para:** Ender, dueño del contrato · **De:** Justin, carril B · **Fecha:** 2026-09-20
- **Origen:** `VERSION-ESTABLE.md` §5 asigna este `DECISION_REQUIRED` a Justin —
  *«Reintentabilidad de un fallo de `emit()` … con el catálogo de razones que decida crear»*—
  apoyado en `CONTRATO-AGENDA-NOTICE-PORT.md` §9: **`skippedReason` es texto libre, no un
  código estable.**
- **Implementación:** `src/modules/scheduling/ports/agenda-notice-reason.catalog.ts`
  (+ 8 pruebas, incluida la que detecta si el catálogo se queda viejo)

## 1. El problema, medido

Hoy las dos frases siguientes vuelven por el mismo campo, con la misma forma y sin nada que las
distinga:

```json
{"delivered": false, "skippedReason": "La emisión del aviso falló; la operación no se revierte"}
{"delivered": false, "skippedReason": "El destinatario no tiene cuenta de portal"}
```

La primera **puede** resolverse sola en el próximo intento. La segunda **no va a resolverse nunca**
por reintentar. Un consumidor que quiera tratarlas distinto sólo puede comparar prosa
(`skippedReason.includes(...)`), que es justo lo que §9 del contrato desaconseja.

Esto no es teórico: **HALL-02** —la relación no entregaba ni un aviso porque el id del canal no
coincidía— se veía exactamente como la primera frase, y por eso pasó una noche entera sin que
nadie lo investigara.

## 2. El catálogo

Diez razones. Ninguna inventada: cada `texto` es el literal que el código emite hoy.

| Código | Clase | Canal | Texto que hoy emite el código |
|---|---|---|---|
| `EMIT_FAILED` | `retryable` ⚠️ | in-app | La emisión del aviso falló; la operación no se revierte |
| `NO_PORTAL_ACCOUNT` | `terminal` | in-app | El destinatario no tiene cuenta de portal |
| `IN_APP_SUPPRESSED` | `terminal` | in-app | El destinatario no acepta este aviso por el canal in-app |
| `IN_APP_DEBOUNCED` | `not-a-failure` | in-app | Ya había un aviso igual sin entregar |
| `IN_APP_DELIVERY_EMPTY` | `retryable` | in-app | La entrega no produjo bandeja in-app |
| `NO_EMAIL_ON_FILE` | `terminal` | correo | La cuenta no declaró correo |
| `EMAIL_SUPPRESSED` | `terminal` | correo | El destinatario no acepta este aviso por correo |
| `EMAIL_DEBOUNCED` | `not-a-failure` | correo | Ya había un correo igual sin enviar |
| `EMAIL_ENQUEUE_FAILED` | `retryable` | correo | No se pudo encolar el correo |
| `CHAT_DELIVERY_FAILED` | `retryable` | chat | No se pudo entregar el aviso por chat |

### Las tres clases

| Clase | Qué significa | Qué debería hacer el consumidor |
|---|---|---|
| `retryable` | No salió por algo que puede no pasar la próxima vez | Reintentar con backoff, y rendirse con registro |
| `terminal` | No salió por una condición del destinatario o su preferencia | **No reintentar.** Insistir es spam |
| `not-a-failure` | No salió **a propósito** | No es un error: no cuenta para tasas de fallo ni alertas |

## 3. Por qué los códigos son en inglés y en mayúsculas

**No es una convención nueva.** `skippedReason` ya se usa como código estable en otros dos módulos
de este mismo repositorio:

- `AGENT_NOT_ACTIVE` — `src/modules/health_context/services/context-collection.service.ts:281`
- `SUITE_NOT_ACTIVE`, `ENVIRONMENT_NOT_ACTIVE`, `SUITE_ALREADY_RUNNING`, `NO_ACTIVE_CASES`,
  `NO_CRON_EXPRESSION` — `src/modules/qa_lab/services/qa-catalog.service.ts:505-570`

Los tres puertos de avisos —agenda, consentimiento y afiliación— son **la excepción, no la regla**.
Esta propuesta los alinea con lo que el repositorio ya hace, en vez de inventar un tercer estilo.

## 4. La única clasificación que NO es una decisión mía

`EMIT_FAILED` está marcado `retryable` **a falta de información, no por convicción**, y va con ⚠️
en la tabla a propósito.

El adaptador captura **cualquier** excepción en un solo `catch` (`messaging-agenda-notice.adapter.ts`,
`emit()`), y ahí caen por igual:

- una base que no responde — **transitoria**, reintentar la resuelve;
- un `channelId` que no existe — **permanente**, reintentar mil veces da mil fallos.

Separarlas exige distinguir el error en origen, y eso toca el adaptador. **Mientras tanto la
asimetría de costos manda:** reintentar un fallo permanente cuesta un intento; perder uno
transitorio cuesta el aviso, y —por **HALL-09**— lo pierde **sin dejar rastro en ninguna tabla**.

Esto es lo mismo que pide **Q-06**, y sigue siendo de negocio. El catálogo no la decide: la deja
visible y con nombre.

## 5. Cómo entra al contrato sin romperlo

**No propongo cambiar el tipo de `skippedReason`.** Es `string?` en `v1.0.0`, hay consumidores que
lo leen, y cambiarlo rompería el artefacto que el carril B fijó por versión.

Propongo **un campo nuevo y opcional**:

```ts
export interface AgendaNoticeResult {
  readonly delivered: boolean;
  readonly skippedReason?: string;        // v1.0.0 — se queda igual, prosa para humanos
  readonly skippedReasonCode?: string;    // v1.1.0 — el código estable, para los `if`
  // …
}
```

Por qué así:

1. **Compatible hacia atrás.** Un consumidor de `v1.0.0` no ve el campo nuevo y sigue funcionando;
   uno de `v1.1.0` que reciba una respuesta vieja recibe `undefined`, que es un caso que ya tiene
   que manejar.
2. **Es aditivo**, así que es un **minor**, no un major: no hay plan de transición que coordinar.
3. **La prosa no se pierde.** El texto sigue siendo lo que se lee en un log; el código es lo que se
   compara en una condición. Son dos públicos distintos y hoy comparten un solo campo.

Mientras el contrato no se mueva, `razonDeTexto()` traduce de uno a otro **sin tocar el puerto**:
el catálogo ya es usable hoy, y el día que `skippedReasonCode` exista, el mapa por texto se vuelve
innecesario y se borra.

## 6. Lo que este trabajo NO hace

- **No implementa reintentos.** Clasificar no es reintentar; el diseño del reintento depende de Q-06.
- **No toca el adaptador ni el puerto.** Cero cambios de comportamiento.
- **No cubre los puertos hermanos** — `practitioner-access-notice` y `affiliation-notice` tienen
  el mismo defecto y sus propias razones («El canal de avisos falló», «Ya había un aviso igual»).
  Son de otros dueños y este catálogo no se los impone: si les sirve, el patrón está acá.

## 7. Qué necesito de vos, Ender

Una de estas tres, y con cualquiera cierro mi parte:

1. **Aceptás el campo `skippedReasonCode` para `v1.1.0`** → abro el cambio del puerto y el adaptador
   empieza a emitir el código junto al texto.
2. **Preferís otra forma** (un enum en el contrato, un campo anidado, otros nombres) → la aplico;
   lo que importa es que el código sea estable, no cómo se llame.
3. **Decidís que el contrato se queda en `v1.0.0`** → el catálogo se queda como traductor del lado
   del consumidor, y queda registrado que la comparación por prosa es deliberada.

Lo que no puede quedar es la pregunta abierta sin dueño: hoy figura con mi nombre y ya está
contestada.
