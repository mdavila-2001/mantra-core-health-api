# Servicios de publicidad

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `AdsAccountsService` | 01, 02, 03 | Cuentas, socios y conexión con la plataforma |
| `AdsCampaignsService` | 04, 05, 16 | Jerarquía de campaña, segmentación, identidad y presupuesto |
| `AdsDataService` | 06, 07, 08, 09, 13 | Política de datos, ingesta, conversiones y catálogo |
| `AdsOptimizationService` | 10, 11, 12, 14, 15 | Experimentos, reglas, moderación, facturación y leads |

## Reglas de negocio

- **Provisión (01)**: el business manager se crea si no viene; la cuenta nace activa con el gasto en
  cero y el propietario con rol de administrador — una cuenta sin administrador no la gestionaría
  nadie.
- **Socio (02)**: se reutiliza por referencia externa (es la misma agencia) y la vigencia anterior
  se cierra antes de abrir la nueva. El acceso delegado exige que la cuenta sea del mismo BM.
- **Conexión (03)**: la credencial viaja como identificador del vault, nunca el token. Importar
  identidades es un upsert, así que reconectar no duplica páginas.
- **Lanzamiento (04)**: campaña, conjuntos, ubicaciones, creativos, assets y anuncios en una sola
  transacción. Todo pausado y el anuncio en `pending_review`. Se exige presupuesto en algún nivel y
  que la cuenta no haya agotado su tope.
- **Segmentación (05)**: la audiencia nace `populating` (su tamaño lo publica la plataforma) y la
  lookalike exige país. El rango de edad no puede estar invertido.
- **Identidad (05)**: una asignación vigente por rol; asignar otra cierra la anterior.
- **Política de datos (06)**: una regla `HASH` exige transformación. La política es el cortafuegos
  del modelo: sin ella no hay garantía de que un dato de salud no salga a la plataforma.
- **Ingesta (07)**: las filas de hecho son append-only; el rollup diario se **reescribe**. El gasto
  de la cuenta sube con el delta contra lo ya contabilizado, de modo que reingerir un día no lo
  duplica. Alcanzar el tope se registra con `warn`.
- **Conversión (08)**: se deduplica antes de nada; si el par ya existe, sube `duplicate_count` y no
  se persiste otra vez. Después se aplica la política: `BLOCK` tumba el evento y lo deja en
  `blocked_ad_events`, `DROP` quita el campo y `HASH` lo marca como transformado. Sin consentimiento
  no se procesa lo que la política lo exige.
- **Offline (09)**: un evento cuenta como emparejado cuando trae campaña atribuida. `match_rate` y
  `attributed_value` se derivan de lo subido.
- **Experimento (10)**: reparto exactamente 100 y un solo control; arrancar activa las entidades
  pausadas de cada variante.
- **Regla (11)**: aplica la acción sobre las entidades que le entregan y registra la ejecución
  **siempre**, aunque no cambie nada: saber que la regla corrió en vacío también es información.
- **Moderación (12)**: aprobar deja el anuncio efectivo activo y cierra sus infracciones abiertas;
  rechazar abre infracción (con código, categoría y severidad obligatorios) y detiene la entrega.
  Cada evento deja instantánea en `delivery_status_snapshots`. La apelación es única por infracción.
- **Factura (14)**: agrega los rollups del periodo en una línea por campaña; el total se deriva de
  las líneas. Número duplicado o periodo ya facturado se rechazan.
- **Lead (15)**: idempotente por identificador externo. Sólo se aceptan respuestas que corresponden
  a una pregunta del formulario, se exigen las obligatorias y la IP se guarda hasheada.
- **Presupuesto (16)**: el tramo no puede solapar otro vigente ni exceder el tope de la cuenta.
  Cambiar presupuesto o puja reinicia el aprendizaje y deja instantánea.

## Evaluación de la política de datos

`applyPolicy` filtra las reglas cuyo patrón casa con el nombre del evento (`*` como comodín de
sufijo, o coincidencia exacta) y las clasifica:

| Acción | Efecto |
| --- | --- |
| `BLOCK` | Tumba el evento entero y lo registra en `blocked_ad_events` |
| `DROP` | El campo no se persiste |
| `HASH` | El campo se marca como transformado en la respuesta |
| `ALLOW` | Sin efecto |

Que una sola regla `BLOCK` baste para tumbar el evento es deliberado: el coste de perder una
conversión es muy inferior al de filtrar un dato de salud a un tercero.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. Las dependencias cruzadas son de
lectura y validación: `AdsCampaignsService` consulta cuentas e identidades, `AdsDataService`
consulta la conexión y la cuenta, y `AdsOptimizationService` consulta campañas, conjuntos, anuncios
y rollups para facturar y para dejar instantánea de entrega.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluido el lanzamiento completo de la jerarquía.
`FOR UPDATE` sobre cuenta, campaña, conjunto, anuncio, catálogo, feed, deduplicación, infracción y
regla; `FOR UPDATE SKIP LOCKED` en los conjuntos que evalúa una regla; `row_version` aporta bloqueo
optimista automático.

## Excepciones

`ResourceNotFoundException` (business manager, cuenta, campaña, conjunto, anuncio, conexión,
identidad, dataset, catálogo, feed, regla, infracción o formulario inexistente),
`PreconditionFailedException` (cuenta o conexión inactivas, tope de gasto agotado, sin presupuesto,
ventana invertida, reparto de experimento inválido, rechazo sin detalle de política, feed de otro
catálogo, respuestas obligatorias faltantes, tramo por encima del tope, consentimiento ausente) y
`ConflictException` (referencia externa duplicada, plataforma ya conectada, número de factura
repetido, periodo ya facturado, infracción ya apelada, tramo solapado).

## Logs

`operation: 'ads.<área>.<acción>'`. `warn` al alcanzar el tope de gasto, al bloquear un evento por
política y al recibir un rechazo de la plataforma. Nunca se loguean payloads de conversión,
respuestas de leads ni identificadores de usuario.

## Pruebas

`ads-accounts.service.spec.ts` (17), `ads-campaigns.service.spec.ts` (24),
`ads-data.service.spec.ts` (28) y `ads-optimization.service.spec.ts` (30): idempotencia de webhooks
y feeds, delta del gasto al reingerir, deduplicación navegador/servidor, bloqueo y descarte por
política, cierre de vigencias, reparto de experimento, agregación de la factura y reinicio del
aprendizaje.
