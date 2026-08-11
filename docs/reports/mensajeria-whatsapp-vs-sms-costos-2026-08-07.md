# WhatsApp vs. SMS en el módulo de mensajería — costos y decisión — 2026-08-07

> Estudio de costos para integrar WhatsApp como canal de notificación en
> `mantra-core-health-redesa-api`, comparado con SMS. Cubre cuatro tipos de costo
> que suelen confundirse: **por mensaje** (Meta / operador), **de plataforma** (BSP
> u hospedaje), **de ingeniería** (lo que hay que construir en este repo) y
> **fiscal y cambiario** (lo que añade pagar a un proveedor del exterior desde
> Bolivia).
>
> Las tarifas de terceros se recopilaron el **2026-08-07** de fuentes públicas
> (ver [Fuentes](#fuentes)). **Ninguna cifra de proveedor está contratada ni
> verificada contra una factura real**: antes de comprometer presupuesto hay que
> confirmarlas en la tarjeta de tarifas de la cuenta (ver
> [Cómo verificar](#cómo-verificar-antes-de-presupuestar)).

## Resumen ejecutivo

1. **WhatsApp es entre 3,5× y 39× más barato que SMS para el mismo aviso hacia
   Bolivia**, según con quién se compare el SMS. El diferencial no viene de un
   descuento: viene de que el SMS a Bolivia es caro (USD 0,09–0,22 por *segmento*)
   y de que un recordatorio en español con tildes ocupa **dos** segmentos.
2. **El costo por mensaje no es el riesgo principal**; el riesgo es la
   **recategorización de plantillas**. La misma plantilla clasificada como
   *marketing* en vez de *utility* cuesta **6,5× más** (USD 0,0740 vs. 0,0113).
   Un recordatorio de cita mal redactado se convierte en marketing.
3. **Meta no firma acuerdos de tratamiento de datos de salud** (no hay BAA para
   WhatsApp). Esto no es un costo, es una restricción de diseño: las plantillas
   no pueden llevar contenido clínico. Ver [Restricciones](#restricciones-no-monetarias-que-condicionan-el-diseño).
4. **La ruta más barata es Cloud API directo de Meta, sin BSP** — Meta no cobra
   hospedaje, sólo mensajes. Twilio añade USD 0,005 por mensaje; 360dialog cobra
   una cuota fija. A los volúmenes previsibles de este producto, el BSP puede
   costar más que los mensajes.
5. **Pagar a Meta o a un BSP desde Bolivia añade ~16 % de impuestos retenidos**
   que no aparecen en ninguna tarifa, y que un proveedor local **no** cobra
   —además de que su factura sí da crédito fiscal—. Esto no invierte la
   comparación, pero **estrecha la ventaja de WhatsApp sobre el agregador local
   de 3,5× a ~2,7×**. Ver [Parte 4](#parte-4--aristas-de-contexto-boliviano-y-de-operación).
6. **El canal más barato es el que no sale del sistema.** El módulo ya entrega
   in-app; ese aviso cuesta cero. Todo lo que se resuelva ahí no se paga en
   WhatsApp ni en SMS. La comparación WhatsApp vs. SMS sólo aplica a lo que
   *tiene* que salir.
7. **La recomendación no es elegir uno**: cascada in-app → WhatsApp → SMS. El
   módulo ya está construido para eso (multicanal con preferencias y acuses por
   canal). Ojo con el costo de la cascada: un respaldo mal calibrado paga los dos
   canales (ver [3.3](#33-el-costo-de-la-cascada-se-paga-dos-veces)).

## Punto de partida: qué existe ya en el repo

Esto importa para el costo de ingeniería — la mayor parte del andamiaje ya está.

| Pieza existente | Dónde | Qué aporta a WhatsApp/SMS |
| --- | --- | --- |
| Punto de extensión de proveedor | `NotificationProviderAdapter` en `src/worker/jobs/messaging/notification-delivery.job.ts` | El worker ya descubre pendientes y registra el intento; falta el adaptador que llama al proveedor |
| Adaptador de referencia | `src/worker/jobs/messaging/google-email-provider.adapter.ts` | Patrón a copiar (wiring, errores, trazas) |
| Credenciales por tenant | `provider_channel_configs.credential_id` → `integrations.provider_credentials` | Cada clínica puede tener su propio número/WABA sin tocar código |
| Referencia de plantilla del proveedor | `message_templates.provider_template_ref` | Campo ya previsto para el *nombre de plantilla aprobada* de Meta |
| Acuses del proveedor | `POST /webhooks/providers/:providerCode/receipts` con firma HMAC, `delivery_receipts`, `delivery_status_transitions`, `adapter_event_mappings` | Los estados `sent/delivered/read/failed` de Meta tienen dónde caer |
| Opt-in y horarios de silencio | `recipient_preferences.opted_in`, `quiet_hours_json`, comprobación de consentimiento en `NotificationsService` | WhatsApp **exige** opt-in; ya se puede registrar y hacer valer |
| Límite de tasa por proveedor | `provider_channel_configs.rate_limit_per_min` | Los *messaging limits* de Meta (250/1k/10k/100k por 24 h) tienen dónde expresarse |

**Lo que falta y no existe:** los conceptos de canal y de proveedor. Hoy
`src/common/constants/concepts.ts` sólo define `CHANNEL_TYPE_IN_APP`,
`CHANNEL_TYPE_EMAIL` y `MSG_PROVIDER_TYPE_EMAIL`. No hay canal SMS ni WhatsApp
en terminología, ni filas semilla que los instancien.

## Parte 1 — Costos de WhatsApp

### 1.1 Cómo cobra Meta desde el 1 de julio de 2025

Meta abandonó el cobro **por conversación** y cobra **por plantilla entregada**.
El precio depende de dos cosas: la **categoría** de la plantilla y el **código de
país del destinatario** (no el del emisor).

| Categoría | ¿Se cobra? |
| --- | --- |
| **Marketing** | Siempre. Sin descuentos por volumen. |
| **Utility** (confirmaciones, recordatorios, avisos de estado) | Sí, salvo dentro de una ventana de servicio abierta. Con descuentos por volumen. |
| **Authentication** (OTP) | Sí, incluso dentro de la ventana. Con descuentos por volumen. |
| **Service** (respuestas libres del negocio dentro de la ventana de 24 h) | **Gratis** desde el 2024-11-01. |

Dos exenciones que sí valen dinero en este producto:

- **Ventana de servicio de 24 h**: si el paciente escribe primero, todo lo que se
  le responda —incluidas plantillas *utility*— es gratis durante 24 h.
- **Free entry point (72 h)**: si el contacto llega por un anuncio Click-to-WhatsApp
  o un botón de página, la ventana es de 72 h y es gratuita.

### 1.2 Tarifa aplicable a Bolivia

**Bolivia no tiene tarifa propia: cae en el grupo «Rest of Latin America»**, según
la documentación de precios de Meta. Tarjeta vigente al 1 de julio de 2026, en USD
por mensaje entregado:

| Categoría | Rest of Latin America (Bolivia) | Referencia: Colombia | Referencia: México |
| --- | --- | --- | --- |
| Marketing | **0,0740** | 0,0125 | 0,0305 |
| Utility | **0,0113** | 0,0008 | 0,0085 |
| Authentication | **0,0113** | 0,0008 | 0,0085 |

> ⚠️ Bolivia está en el grupo *caro* de la región. Un recordatorio a un número
> boliviano cuesta ~14× lo que el mismo recordatorio a un número colombiano.
> Si el producto se despliega en varios países, el costo por tenant varía mucho.

**Descuentos por volumen** (sólo *utility* y *authentication*, nunca *marketing*):
escalones aproximados de −5 %, −10 %, −15 % y −20 % sobre la tarifa base según el
volumen mensual agregado del portfolio. Los umbrales son específicos por
mercado-categoría y se reinician cada mes. Para el modelado de abajo **no se
aplica ningún descuento** (supuesto conservador).

### 1.3 Costo de plataforma: tres rutas

| Ruta | Cuota fija | Recargo por mensaje | Cuándo conviene |
| --- | --- | --- | --- |
| **A. Cloud API directo de Meta** | USD 0 (Meta no cobra hospedaje) | USD 0 | Siempre que se acepte integrar contra la API de Meta y gestionar la WABA propia. **Es lo que este repo ya está preparado para hacer.** |
| **B. 360dialog** | ~EUR 49/mes (≈ USD 53) | USD 0 (sin markup sobre Meta) | Si se quiere un intermediario con soporte sin pagar por mensaje |
| **C. Twilio** | USD 0 | **+USD 0,005** entrante y saliente | Si ya se usa Twilio para SMS/voz y se prefiere una sola factura |

El punto de cruce entre B y C está alrededor de **10.000 mensajes/mes**: por
debajo sale mejor el recargo por mensaje, por encima la cuota fija. La ruta A gana
en todos los tramos y es la que menos depende de terceros — a cambio de que la
gestión de la WABA, la verificación del negocio y la aprobación de plantillas
recaen en el equipo.

### 1.4 Costos que no son por mensaje

| Concepto | Costo | Nota |
| --- | --- | --- |
| Cuenta de WhatsApp Business (WABA) | USD 0 | |
| Verificación del negocio en Meta | USD 0 | Cuesta **tiempo** (documentación legal de la clínica) y condiciona los límites de envío |
| Número de teléfono dedicado | Costo del número | No puede estar activo en la app de WhatsApp normal |
| Aprobación de plantillas | USD 0 | Horas a días por plantilla; cada cambio de texto reinicia la revisión |
| Almacenamiento de media | Infraestructura propia | Sólo si se envían PDFs/imágenes; el repo ya tiene `object_storage` |
| Endpoint de webhooks público con TLS | Infraestructura propia | Ya existe el controlador; falta exponerlo |

**Límites de envío (no cuestan dinero, pero limitan la operación):** una WABA sin
verificar arranca en 250 conversaciones iniciadas por el negocio cada 24 h, y
escala a 1.000 / 10.000 / 100.000 / ilimitado según verificación y **calidad**.
Una calificación de calidad baja (por reportes de usuarios) hace *bajar* el
escalón. Esto se modela con `rate_limit_per_min`, pero el escalón real lo decide Meta.

### 1.5 Costo de ingeniería en este repo

Estimación en jornadas de una persona, partiendo de lo que ya existe. **Es una
estimación, no una medición.**

| Trabajo | Jornadas | Apoyo existente |
| --- | --- | --- |
| Conceptos `CHANNEL_TYPE_WHATSAPP` / `MSG_PROVIDER_TYPE_WHATSAPP` + semillas | 0,5 | `concepts.ts`, `messaging-seed.service.ts` |
| Adaptador Cloud API en el worker (envío + errores + trazas) | 2–3 | Patrón de `google-email-provider.adapter.ts` |
| Credenciales por tenant y rotación | 1 | `provider_channel_configs.credential_id` |
| Registro de plantillas: mapear `provider_template_ref` + idioma + variables posicionales | 2 | Campo ya existe; lo nuevo es la validación de variables |
| Webhook de estados con verificación `X-Hub-Signature-256` y mapeo a transiciones | 2 | Controlador y HMAC ya existen |
| **Ventana de servicio de 24 h** (estado por destinatario) | 1–2 | No existe. **Determina si un mensaje se cobra o es gratis** |
| Opt-in por canal + enlace con `consent` | 1 | `recipient_preferences` ya lo soporta |
| Entrantes: BAJA/STOP y respuestas de confirmación de cita | 2–3 | `integrations.inbound_messages` existe |
| Media adjunta (opcional) | 2 | `object_storage` |
| **Total** | **~12–17 jornadas** | |

## Parte 2 — Costos de SMS

### 2.1 Tarifas hacia Bolivia

El SMS se cobra **por segmento**, no por mensaje. Precios de lista recopilados el
2026-08-07, en USD por segmento saliente hacia Bolivia:

| Proveedor | USD/segmento | Origen del dato |
| --- | --- | --- |
| Twilio (números internacionales, página oficial) | **0,2215** | Página de precios de Twilio para Bolivia |
| Sinch | 0,22035 | Comparador de terceros |
| Infobip | 0,15585 | Comparador de terceros |
| Twilio (tarifa citada por comparador) | 0,1452 | Comparador de terceros — **discrepa de la página oficial** |
| Plivo | 0,09199 | Comparador de terceros |
| Agregador local / operador (Entel, Tigo, Viva) | **0,014–0,029** | 0,10–0,20 BOB por SMS, volumen |

> La discrepancia entre los dos datos de Twilio (0,2215 vs. 0,1452) es exactamente
> el tipo de cosa que hay que resolver con una cotización real antes de
> presupuestar. Abajo se modela con la cifra oficial, que es la conservadora.

**Costos adicionales de SMS:**

- Número internacional: desde **USD 1,15/mes**.
- Remitente alfanumérico: gratis en Twilio, pero es **unidireccional** (el paciente
  no puede responder) y su aceptación depende del operador.
- Mensajes fallidos: **USD 0,001** por mensaje que termina en estado `Failed`.

### 2.2 La trampa de la segmentación (esto duplica la factura)

Un SMS es de 160 caracteres **sólo en GSM-7**. En cuanto el texto lleva una tilde,
una «ñ» o un signo `¿`, el mensaje pasa a **UCS-2 y el segmento baja a 70
caracteres** (67 si es concatenado).

```text
"Recordatorio: su cita es el 12/08 a las 10:30 en Clinica Norte. Responda 1 para confirmar."
  → 90 caracteres, sin tildes  → GSM-7  → 1 segmento

"Recordatorio: su cita es el 12/08 a las 10:30 en Clínica Norte. Responda 1 para confirmación."
  → 93 caracteres, con tildes  → UCS-2  → 2 segmentos  → el doble de costo
```

**Quitar las tildes de las plantillas SMS reduce la factura a la mitad.** Esta
decisión de redacción vale más dinero que la elección de proveedor entre Plivo e
Infobip. WhatsApp no tiene este problema: cobra por mensaje entregado sin importar
la longitud ni la codificación.

### 2.3 Costo de ingeniería en este repo

| Trabajo | Jornadas |
| --- | --- |
| Conceptos y semillas de canal/proveedor SMS | 0,5 |
| Adaptador del proveedor + cálculo/registro de segmentos | 2 |
| Webhook de acuses de entrega (DLR) → `delivery_status_transitions` | 1,5 |
| Palabra clave de baja (BAJA/STOP) → `recipient_preferences.opted_in = false` | 1 |
| **Total** | **~5 jornadas** |

Es más barato de construir que WhatsApp (no hay plantillas que aprobar, ni ventana
de 24 h, ni registro de negocio) y más caro de operar.

## Parte 3 — Comparación con números

### 3.1 Escenario modelado

Recordatorio de cita, categoría *utility*, destinatarios en Bolivia. Supuestos
explícitos:

- El SMS ocupa **2 segmentos** (texto con tildes, ~93 caracteres).
- **No** se aplican descuentos por volumen de Meta.
- **No** se descuenta la ventana de servicio de 24 h (todos los mensajes se cobran).
  En operación real, una parte de los mensajes cae dentro de la ventana y es gratis,
  así que el costo de WhatsApp de abajo es un **techo**.
- EUR/USD = 1,08 para convertir la cuota de 360dialog.

| Canal / ruta | 1.000 msg/mes | 10.000 msg/mes | 50.000 msg/mes |
| --- | ---: | ---: | ---: |
| **WhatsApp — Cloud API directo** | **USD 11,30** | **USD 113,00** | **USD 565,00** |
| WhatsApp — 360dialog (EUR 49 fijos) | USD 64,22 | USD 165,92 | USD 617,92 |
| WhatsApp — Twilio (+0,005/msg) | USD 16,30 | USD 163,00 | USD 815,00 |
| SMS — agregador local (0,02/segmento) | USD 40,00 | USD 400,00 | USD 2.000,00 |
| SMS — Plivo (0,09199/segmento) | USD 183,98 | USD 1.839,80 | USD 9.199,00 |
| SMS — Twilio (0,2215/segmento, lista) | USD 443,00 | USD 4.430,00 | USD 22.150,00 |
| *SMS — Twilio, plantilla sin tildes (1 segmento)* | *USD 221,50* | *USD 2.215,00* | *USD 11.075,00* |

**Lectura:** a 10.000 recordatorios/mes, WhatsApp por Cloud API directo cuesta
**USD 113** contra **USD 4.430** de SMS por Twilio — **39× menos**. Contra el
agregador local más barato sigue siendo **3,5× menos**. La diferencia crece con el
volumen porque WhatsApp escala con descuentos y el SMS no.

Las cifras de arriba son **sólo el cargo del proveedor**. Faltan cuatro efectos
que sí mueven la factura y se analizan a continuación: la recategorización
(3.2), la cascada (3.3), los reintentos y los entrantes (3.4), y los impuestos
bolivianos ([Parte 4](#parte-4--aristas-de-contexto-boliviano-y-de-operación)).

### 3.2 El escenario que rompe el cálculo

Si Meta reclasifica la plantilla de *utility* a *marketing*, el costo pasa de
0,0113 a 0,0740 por mensaje:

| 10.000 msg/mes | Utility | Marketing | Factor |
| --- | ---: | ---: | ---: |
| Costo Meta | USD 113,00 | USD 740,00 | **6,5×** |

Aun así sigue siendo más barato que cualquier SMS, pero deja de ser
despreciable. **La categorización la decide Meta automáticamente a partir del
texto de la plantilla.** Un recordatorio que incluya «aproveche nuestra promoción»
deja de ser *utility*. Esto hay que vigilarlo en producción, no sólo al aprobar.

### 3.3 El costo de la cascada: se paga dos veces

Si WhatsApp falla y el sistema reintenta por SMS, **se pagan los dos canales**.
El respaldo no es gratis y su costo lo fija la tasa de fallo, no el volumen total.

A 10.000 recordatorios/mes con WhatsApp por Cloud API directo (USD 113 de base):

| Tasa de fallo de WhatsApp | Respaldo por agregador local | Respaldo por Twilio |
| ---: | ---: | ---: |
| 5 % (500 avisos) | +USD 20,00 → **133,00** | +USD 221,50 → **334,50** |
| 10 % (1.000 avisos) | +USD 40,00 → **153,00** | +USD 443,00 → **556,00** |
| 25 % (2.500 avisos) | +USD 100,00 → **213,00** | +USD 1.107,50 → **1.220,50** |

**Con un 10 % de fallo, el respaldo por Twilio cuesta cuatro veces todo el canal
WhatsApp.** Tres consecuencias de diseño, todas baratas de implementar y caras de
omitir:

- El respaldo debe dispararse con el estado **`failed` del acuse de Meta**, no con
  un temporizador. Un tiempo de espera corto convierte entregas lentas en dobles
  envíos pagados.
- `sent` y `delivered` **no** son señal de fallo. Sólo el estado terminal negativo
  lo es; `read` nunca debería exigirse para dar por bueno un aviso.
- Un número que falla de forma sistemática (no tiene WhatsApp) debe marcarse en
  `recipient_preferences` para que la próxima vez vaya directo a SMS y no pague
  el intento de WhatsApp. Sin esto se paga el fallo todos los meses.

### 3.4 Reintentos y mensajes entrantes

Dos costos que el módulo genera por cómo ya está construido —reintenta con
backoff y tiene cola muerta— y que no aparecen en ninguna tarifa:

| Efecto | WhatsApp | SMS |
| --- | --- | --- |
| **Reintentar un envío no entregado** | Gratis. Meta cobra **sólo al entregar**, así que los reintentos de algo que nunca llegó no se facturan. | Se cobra **cada intento aceptado** por el operador, más USD 0,001 por cada mensaje que termina en `Failed`. |
| **Recibir un mensaje del paciente** | Gratis por Cloud API directo. Por Twilio, **+USD 0,005 por entrante**. | Requiere número dedicado (el remitente alfanumérico no recibe); se cobra la recepción. |

El entrante tiene además un efecto **a favor** que ninguna tabla de tarifas
muestra: cada respuesta del paciente **abre una ventana de servicio de 24 h** en la
que todo lo que se le envíe —incluidas plantillas *utility*— es gratis. Una
plantilla que termina en «Responda 1 para confirmar» no sólo confirma la cita:
abre una ventana que absorbe sin costo el siguiente aviso. **Esto puede ser el
mayor descuento disponible y depende de una decisión de redacción.**

Consecuencia para el modelado: la Parte 3.1 asume que **ningún** mensaje cae
dentro de una ventana abierta. Con una tasa de respuesta del 30 % y un segundo
aviso por paciente, el costo real de WhatsApp estaría ~30 % por debajo de la
tabla. No lo cuantifico más porque la tasa de respuesta no se conoce: **hay que
medirla, y es la primera métrica que debería emitir el canal.**

### 3.5 El canal que no cuesta nada y ya está construido

Toda la Parte 3 compara canales **externos**. El módulo ya entrega notificaciones
**in-app** (`in_app_notifications`, `CHANNEL_TYPE_IN_APP`) y tiene adaptador de
**email** funcionando. Ambos tienen costo marginal cero o casi cero.

| Canal | Costo marginal por aviso | Estado en el repo |
| --- | ---: | --- |
| In-app | USD 0 | **Funcionando** |
| Email | ~USD 0 en los volúmenes de este producto | **Funcionando** (adaptador Gmail) |
| WhatsApp *utility* | USD 0,0113 | Por construir |
| SMS (2 segmentos) | USD 0,04–0,44 | Por construir |

El aviso más barato es el que el paciente ya leyó en la aplicación. La pregunta
correcta no es «¿WhatsApp o SMS?» sino **«¿qué fracción de los avisos tiene que
salir del sistema?»** — y esa fracción es la que se multiplica por las tarifas de
arriba. Un paciente con la aplicación instalada y sesión activa no necesita
ninguno de los dos canales de pago para un recordatorio de cita.

Esto no invalida el proyecto de WhatsApp: la mayoría de los pacientes no tendrá la
aplicación abierta, y el email tiene tasas de lectura bajas para avisos con hora.
Pero cambia el orden de la cascada y, con él, el presupuesto.

### 3.6 Comparación cualitativa

| Dimensión | WhatsApp | SMS |
| --- | --- | --- |
| Costo por aviso a Bolivia | Muy bajo | Alto |
| Requiere internet en el teléfono | Sí | No |
| Cobertura del destinatario | Alta pero no universal | Universal |
| Acuse de **lectura** | Sí (`read`) | No (sólo entrega) |
| Bidireccional | Sí, nativo | Sólo con número dedicado (no alfanumérico) |
| Contenido libre | Sólo dentro de la ventana de 24 h | Siempre |
| Aprobación previa del texto | Sí, plantilla por plantilla | No |
| Latencia típica | Segundos | Segundos, con más variabilidad por operador |
| Tiempo hasta primer envío | Días (verificación + plantillas) | Horas |
| Riesgo de bloqueo por calidad | Sí, baja el escalón de envío | Bajo |

## Parte 4 — Aristas de contexto boliviano y de operación

Las tarifas de las partes 1 a 3 son las de la factura del proveedor. Lo que sale
de la cuenta bancaria en Bolivia es otra cosa.

### 4.1 Divisa, impuestos y medio de pago

Meta, Twilio y 360dialog facturan en **USD contra tarjeta internacional**. En
Bolivia eso arrastra tres efectos:

1. **Impuestos retenidos por el banco.** Los pagos a servicios digitales del
   exterior están alcanzados por el IVA de servicios digitales: la entidad
   financiera actúa como **agente de retención** y añade **13 %**, más hasta un
   **3 % de IT** según el tratamiento. **Presupuestar ~16 % por encima de la
   tarifa.**
2. **Asimetría de crédito fiscal.** Ese 13 % retenido a un proveedor del exterior
   **no genera crédito fiscal** para la empresa. La factura de un agregador de SMS
   **boliviano** sí. Esto favorece al proveedor local en ~13 % adicionales sobre la
   comparación nominal, y es el único factor de todo el estudio que juega en
   contra de WhatsApp.
3. **Tipo de cambio y acceso a divisas.** Desde la unificación cambiaria de junio
   de 2026 (Resolución Ministerial 245/2026) el tipo de cambio flota y el BCB
   publica un valor referencial diario, que es el que se aplica a las
   transacciones internacionales con tarjeta. Los pagos internacionales con
   tarjeta se rehabilitaron en abril de 2026: **crédito sin límite, débito hasta
   USD 500**, con límites internos escalonados por entidad financiera.
   Consecuencia operativa: **el canal de mensajería debe pagarse con tarjeta de
   crédito empresarial**, no de débito — a 50.000 mensajes/mes el cargo ya supera
   el tope de débito.

**Efecto sobre la comparación** (10.000 recordatorios/mes, sin cascada):

| Ruta | Tarifa nominal | Con impuestos | Crédito fiscal | **Costo efectivo** |
| --- | ---: | ---: | ---: | ---: |
| WhatsApp — Cloud API directo | USD 113,00 | +16 % → 131,08 | No | **USD 131,08** |
| SMS — agregador local | USD 400,00 | Ya incluido en factura local | Sí (13 %) | **USD 354,00** |
| SMS — Twilio | USD 4.430,00 | +16 % → 5.138,80 | No | **USD 5.138,80** |

**La ventaja de WhatsApp sobre el agregador local baja de 3,5× a ~2,7×.** Sigue
ganando, pero el margen es la mitad de holgado de lo que sugiere la tarifa. Contra
Twilio la diferencia es irrelevante: los impuestos aplican a ambos por igual.

> Este apartado es el que más necesita validación de un contador: el tratamiento
> exacto (RC-IVA vs. IVA de servicios digitales, procedencia del IT, y si la
> empresa puede registrarse para el régimen de servicios digitales) depende de la
> figura tributaria del titular de la cuenta. **Las cifras de arriba son una
> aproximación de planificación, no una liquidación.**

### 4.2 Numeración: qué número usa cada canal

No es el mismo problema para los dos canales, y esto se pasa por alto con
facilidad:

- **WhatsApp** necesita un número que la empresa controle y que pueda recibir una
  verificación única. **Sirve una línea móvil boliviana normal (+591) de Entel,
  Tigo o Viva**, de costo local. La única restricción es que ese número **no puede
  estar activo en la app de WhatsApp corriente**. Es decir: WhatsApp **no** obliga
  a comprar numeración a un CPaaS.
- **SMS bidireccional** sí obliga: para recibir respuestas hace falta un número del
  proveedor. Twilio publica para Bolivia **números de prefijo internacional desde
  USD 1,15/mes** (no numeración local +591), y la numeración boliviana tiene
  **requisitos de documentación regulatoria**. Un aviso que llega desde un número
  extranjero tiene peor tasa de lectura y más probabilidad de ser tomado por
  spam.
- El **remitente alfanumérico** (mostrar «CLINICA» en vez de un número) es gratis
  en Twilio pero es **unidireccional**: mata el «Responda 1 para confirmar», que es
  justamente lo que hace útil el recordatorio.

**Consecuencia:** la confirmación de citas por respuesta del paciente es barata y
natural en WhatsApp, y cara o imposible en SMS. Es una diferencia funcional, no
sólo de precio.

### 4.3 Throughput y ventanas de envío masivo

La Cloud API entrega por defecto **80 mensajes por segundo** por número, ampliable
a **1.000 mps sin costo adicional** si el número tiene calificación de calidad
media o superior y el escalón de conversaciones iniciadas es ilimitado.

Para este producto: 80 mps son 288.000 mensajes/hora, muy por encima de cualquier
tanda de recordatorios previsible. **El límite que morderá primero no es el
throughput sino el escalón de conversaciones iniciadas por 24 h** (250 sin
verificar, luego 1.000 / 10.000 / 100.000). Una WABA recién verificada con tope de
1.000 conversaciones/24 h no puede lanzar la tanda matutina de 3.000 recordatorios
de una red de clínicas. Esto condiciona el arranque: **hay que escalar el escalón
antes de migrar el volumen real, no el mismo día.**

`provider_channel_configs.rate_limit_per_min` sirve para no chocar contra el
límite, pero el escalón lo concede Meta según calidad — no se compra.

### 4.4 Retención en Meta, borrado y trazabilidad

Tres puntos que chocan con controles que este repo ya implementa:

- **Meta procesa y retiene** el contenido de las plantillas enviadas y los
  metadatos de entrega en su infraestructura. El sistema deja de ser la única
  copia. Cualquier obligación de borrado que el producto asuma **no alcanza a lo
  que ya se envió** — otro argumento para el aviso ciego sin contenido clínico.
- **El número de teléfono es un identificador personal** que se transfiere a Meta
  en cada envío. Aunque la plantilla no lleve datos clínicos, *el hecho de que ese
  número reciba mensajes de una clínica* ya es información. Con destinatarios de
  una especialidad sensible, el propio patrón de envío es el dato.
- **Los acuses hay que conservarlos.** `delivery_receipts` es append-only y
  `delivery_status_transitions` guarda el rastro; eso es lo que permite demostrar
  que un recordatorio se envió y se entregó. Conviene decidir la retención de esa
  evidencia **antes** de encender el canal, no cuando haga falta para una
  reclamación.

## Restricciones no monetarias que condicionan el diseño

Estas no cambian el costo, pero sí lo que se puede enviar. Para un backend que
maneja datos clínicos son más determinantes que el precio.

1. **Meta no actúa como encargado del tratamiento de datos de salud.** No ofrece
   BAA para WhatsApp y sus términos de la Cloud API lo declaran explícitamente.
   Consecuencia práctica: **ninguna plantilla puede contener diagnóstico,
   resultado, medicamento ni especialidad**. El patrón seguro es el aviso ciego:
   *«Tiene un documento disponible en su portal»* + enlace autenticado. Lo mismo
   aplica al SMS, con el matiz de que el SMS no atraviesa a un tercero que hace
   perfilado publicitario.
2. **Bolivia no tiene ley general de protección de datos personales vigente**
   (existe la Ley 1080 de Ciudadanía Digital de 2018 y el derecho constitucional
   a la privacidad; los anteproyectos de AGETIC y sociedad civil siguen sin
   aprobarse). Es decir: **el control aquí es contractual y de política interna,
   no legal**. Dado que este repo ya implementa controles de estilo HIPAA (WORM,
   RLS por tenant, auditoría), degradar el estándar sólo para WhatsApp sería
   incoherente con el resto del sistema.
3. **WhatsApp exige opt-in previo y verificable**, obtenido por un canal donde el
   paciente entendió qué iba a recibir. El módulo ya lo puede registrar
   (`recipient_preferences.opted_in` + `consent`); lo que falta es que el flujo de
   alta del paciente lo capture.
4. **La política de mensajería de WhatsApp restringe contenido de salud**
   promocional (venta de medicamentos y productos médicos). Los avisos
   transaccionales de agenda no están afectados, pero cualquier campaña de
   `marketing` sí debe revisarse antes.
5. **El número reasignado o compartido es el riesgo más subestimado.** Una línea
   dada de baja se reasigna a otra persona, y el celular familiar lo lee quien lo
   tenga a mano. En ambos casos el aviso llega a un tercero, y **ningún control
   del backend lo detecta**: la entrega se marca `delivered` con normalidad.
   WhatsApp lo agrava respecto al SMS porque el historial queda visible en el
   dispositivo y en WhatsApp Web. Tres mitigaciones, todas de producto y no de
   infraestructura: aviso ciego sin dato clínico (ya recomendado), **revalidación
   periódica del número** en el flujo de atención, y **baja automática del canal
   tras N fallos o tras un cambio de titularidad detectado**. Ninguna está en el
   alcance estimado de la Parte 1.5 — hay que decidir si entran.

## Recomendación

**Cascada in-app → WhatsApp → SMS, con Cloud API directo y sin BSP.**

Justificación en una línea por punto:

- **In-app primero** porque cuesta cero, ya funciona y absorbe a los pacientes con
  la aplicación activa antes de tocar ningún proveedor de pago.
- **WhatsApp después** porque a Bolivia cuesta entre 2,7× y 39× menos por aviso
  —incluidos los impuestos de la Parte 4.1— y además devuelve acuse de lectura,
  que hoy no se tiene en ningún canal.
- **SMS como respaldo** porque los pacientes sin WhatsApp o sin datos móviles
  seguirían sin recibir el recordatorio —la fracción exacta no se conoce y hay que
  medirla— y una cita perdida cuesta más que el SMS más caro de la tabla. La cascada se implementa con la preferencia por canal que
  ya existe; el disparador es el `FAILED` del acuse de WhatsApp.
- **Cloud API directo** porque los BSP no aportan nada que este repo no tenga ya
  (colas, reintentos, cola muerta, conciliación de acuses, plantillas versionadas)
  y sí añaden un recargo permanente.
- **SMS reservado para autenticación** (OTP) si se decide que el segundo factor no
  debe depender del mismo canal que las notificaciones — es una decisión de
  seguridad, no de costo.

Orden de trabajo sugerido: canal SMS primero si urge tener *cualquier* canal
externo (5 jornadas), WhatsApp después (12–17 jornadas). Si no urge, WhatsApp
directo y saltarse el SMS hasta tener datos de fallo reales.

**Antes de escribir código hacen falta tres decisiones que no son técnicas:**

1. ¿Qué entidad legal es titular de la WABA — la plataforma o cada clínica? Esto
   cambia el modelo: una WABA por tenant (aísla la reputación y los límites, pero
   multiplica la verificación) o una compartida (más simple, pero la mala calidad
   de un tenant afecta a todos, y el escalón de conversaciones por 24 h de la
   Parte 4.3 se reparte entre todos).
2. ¿Quién paga los mensajes — la plataforma o el tenant? Si es el tenant, hay que
   atribuir el costo por mensaje en `notification_deliveries` para poder facturarlo,
   y eso hay que diseñarlo antes de enviar el primer mensaje, no después. **Lo que
   hay que registrar en el momento del envío**, porque después no se puede
   reconstruir: `tenant_id`, categoría de la plantilla facturada, país del
   destinatario, si el mensaje cayó dentro de una ventana de servicio, y si fue
   envío primario o respaldo de cascada. Sin esos cinco campos, la factura de Meta
   no se puede repartir entre clínicas.
3. ¿Con qué instrumento se paga? Por la Parte 4.1, tarjeta de **crédito**
   empresarial —la de débito tiene tope de USD 500— y hay que dar de alta el
   proveedor en contabilidad sabiendo que la retención del 13 % no da crédito
   fiscal.

## Cómo verificar antes de presupuestar

Ninguna cifra de este documento debe llegar a un presupuesto sin este paso.

1. **Tarifa de Meta**: crear la WABA y abrir *Meta Business Suite → Facturación →
   Tarjeta de tarifas*. Muestra el precio exacto por país-categoría de esa cuenta,
   que es el único que factura. Confirmar en particular que Bolivia sigue en
   «Rest of Latin America» y la fecha de vigencia de la tarjeta.
2. **Tarifa de SMS**: pedir cotización con volumen real a Twilio/Infobip/Plivo y a
   un agregador local boliviano. La brecha entre el precio de lista y el negociado
   es grande en este mercado, y el dato de lista de Twilio para Bolivia ya
   discrepa entre dos fuentes públicas.
3. **Segmentación**: contar los segmentos de las plantillas SMS reales con las
   tildes puestas, no con texto de ejemplo.
4. **Ventana de 24 h**: medir qué fracción de las notificaciones caería dentro de
   una ventana abierta. Es el descuento más grande disponible y no aparece en
   ninguna tarifa.
5. **Impuestos**: confirmar con el contador el tratamiento exacto de los pagos a
   servicios digitales del exterior (porcentaje retenido, si procede el IT, y si
   conviene registrarse en el régimen de servicios digitales). El ~16 % de la
   Parte 4.1 es una aproximación de planificación.
6. **Escalón de conversaciones**: verificar en qué escalón queda la WABA tras la
   verificación del negocio, y compararlo con el pico diario real de recordatorios
   antes de migrar volumen.
7. **Tasa de fallo**: el costo de la cascada (3.3) depende de ella y no se conoce.
   Se mide enviando un lote piloto, no estimándola.

## Fuentes

Consultadas el 2026-08-07. Las páginas de proveedores cambian sin aviso.

- [Pricing on the WhatsApp Business Platform — Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [WhatsApp Business API Pricing Calculator 2026 — Real Meta Rates (WhatSetter)](https://www.whatsetter.com/tools/whatsapp-api-pricing-calculator)
- [Pricing — Yazi docs](https://docs.askyazi.com/whatsapp-api-pricing/pricing)
- [SMS Pricing in Bolivia for Text Messaging — Twilio](https://www.twilio.com/en-us/sms/pricing/bo)
- [WhatsApp Messaging Pricing — Twilio](https://www.twilio.com/en-us/whatsapp/pricing)
- [Bolivia SMS Pricing Comparison — Sent.dm](https://www.sent.dm/en/resources/sms-pricing/bolivia-sms-pricing)
- [WhatsApp Business Platform Pricing — 360dialog](https://360dialog.com/pricing)
- [Is WhatsApp HIPAA Compliant? — HIPAA Journal](https://www.hipaajournal.com/whatsapp-hipaa-compliant/)
- [Ampliación del IVA a consecuencia del consumo de los servicios digitales — Moreno Baldivieso](https://emba.com.bo/ampliacion-del-iva-a-consecuencia-del-consumo-de-los-servicios-digitales/)
- [Aplicación del IVA sobre servicios digitales en Bolivia — PPO Indacochea](https://www.ppolegal.com/blog/2021/05/10/aplicacion-del-iva-sobre-servicios-digitales-en-bolivia/)
- [Bolivia habilita las compras con tarjetas bancarias en el exterior — Infobae](https://www.infobae.com/america/america-latina/2026/04/07/bolivia-habilita-las-compras-con-tarjetas-bancarias-en-el-exterior-luego-de-tres-anos-de-restricciones/)
- [Restablecen las compras por internet y pagos en el exterior con tarjetas — ASFI](https://www.asfi.gob.bo/node/1362)
- [Nuevo tipo de cambio en Bolivia 2026 — CodigoNext](https://www.codigonext.com/recursos/bolivia-tipo-cambio-2026/)
- [Increase message throughput in WhatsApp — AWS Social Messaging](https://docs.aws.amazon.com/social-messaging/latest/userguide/increase-message-throughput.html)
- [Capacity and messaging limits — Kaleyra](https://developers.kaleyra.io/docs/capacity-and-messaging-limits)
- [Normativa sobre protección de datos personales en Bolivia](https://medium.com/@mrduranch/normativa-sobre-datos-personales-en-bolivia-ece7a61f50b0)
- [Anteproyecto de Ley de Protección de Datos Personales — AGETIC](https://agetic.gob.bo/sites/default/files/2025-06/DATOS-PERSONALES-PRESENTACION-ANTEPROYECTO-DE-LEY-2024-firmado.pdf)
