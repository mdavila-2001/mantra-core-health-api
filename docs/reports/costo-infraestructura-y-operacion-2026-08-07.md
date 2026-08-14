# Costo de infraestructura y operación — 2026-08-07

> Evaluación de la tabla de costos de servidores propuesta, contrastada contra lo
> que **este repositorio realmente exige para arrancar**. Complementa el estudio de
> [costos de mensajería WhatsApp vs. SMS](mensajeria-whatsapp-vs-sms-costos-2026-08-07.md),
> que cubre el costo por aviso; aquí está el costo de tener el sistema encendido.
>
> Las cifras de proveedores provienen de la tabla propuesta y de fuentes públicas
> consultadas el **2026-08-07**. **Ninguna está contratada ni verificada contra una
> factura real.** Lo que sí está verificado contra el repositorio es el
> **inventario de componentes** de la Parte 1: sale de `docker-compose.yml`,
> `package.json` y `src/`, y es lo que determina qué líneas de la tabla sobran,
> cuáles faltan y cuáles no son compatibles.

## Resumen ejecutivo — los seis hallazgos que cambian la tabla

1. **El tipo de cambio de la tabla está desactualizado y es el error más caro.**
   La conversión usada (USD 100 → BOB 696) equivale a **6,96 BOB/USD**, el tipo
   fijo anterior. Tras la unificación cambiaria de junio de 2026 el referencial
   ronda **11,5–12,0 BOB/USD**. **Los importes reales en bolivianos son ~68 % más
   altos que los de la tabla.** El plan Starter de Google Maps no son 696 BOB: son
   ~1.170 BOB, y ~1.357 BOB con impuestos.
2. **Falta el ~16 % de impuestos** que el banco retiene en cada pago a un
   proveedor del exterior (13 % IVA de servicios digitales + hasta 3 % IT), sin
   crédito fiscal. Aplica a Vercel, AWS, Supabase, Atlas, Apple, Google — a todo
   lo de la tabla salvo ADSIB y proveedores locales. Regla práctica:
   **USD × 13,6 = BOB efectivos**.
3. **No es «un contenedor»: son 26.** El repositorio levanta la API **más 20
   procesos worker independientes** más cinco almacenes de datos. La línea «Render
   $25 por contenedor» hay que multiplicarla, no copiarla.
4. **«PostgreSQL» aquí no es PostgreSQL a secas.** El sistema exige
   **TimescaleDB + pgvector + pgcrypto + pg_trgm**, y un worker
   (`compress-chunks.job.ts`) usa **compresión de chunks**, que es una función bajo
   licencia TSL. Eso **descarta AWS RDS** (no ofrece TimescaleDB), **descarta Neon**
   (sólo la edición Apache-2, sin compresión) y **descarta Supabase para proyectos
   nuevos** en PG17+. Es el hallazgo que más cambia la tabla: **las tres opciones
   de base de datos propuestas como recomendadas o alternativas no sirven sin
   modificar el sistema.**
5. **Sobra el broker de mensajes y falta el motor de búsqueda.** No hay AMQP en
   ninguna parte del código: las colas viven en Postgres (`queued_jobs` con
   `FOR UPDATE SKIP LOCKED`) y el patrón outbox. **CloudAMQP y Amazon MQ son gasto
   evitable.** En cambio **OpenSearch 3.7 sí es obligatorio** y no aparece en la
   tabla. Los dos errores casi se cancelan en monto, pero no en riesgo: uno es
   gastar de más, el otro es no poder arrancar.
6. **MongoDB sí hace falta** (a diferencia de lo que uno esperaría en un backend
   con Postgres): el módulo 55 `document_store` usa Mongo 8.0 con validadores
   `$jsonSchema`. La línea de Atlas M10 está justificada.

**Costo mensual realista**, según topología (detalle en la [Parte 3](#parte-3--tres-topologías-completas-con-costo-total)):

| Topología | USD nominal | USD con impuestos | BOB efectivos |
| --- | ---: | ---: | ---: |
| A · VPS único (piloto) | 44,42 | 50,99 | ~597 |
| B · Híbrido (recomendado) | 145,42 | 168,15 | ~1.967 |
| C · Todo gestionado, bien dimensionado | 350,42 | 405,95 | ~4.750 |
| C′ · Todo gestionado, como se leería la tabla literal | 694,42 | 804,99 | ~9.418 |

## Parte 1 — Qué exige realmente el repositorio

Inventario verificado contra `docker-compose.yml`, `package.json` y `src/`. **Esta
es la lista contra la que hay que comprar, no la genérica.**

### 1.1 Procesos de aplicación

| Componente | Cantidad | Límite declarado | Evidencia |
| --- | ---: | --- | --- |
| API NestJS | 1 | 2,0 vCPU / 1.536 MB | `x-api-resources` en `docker-compose.yml` |
| Workers de dominio | **20** | 0,5 vCPU / 512 MB **cada uno** | `x-worker-resources`; 20 entrypoints `src/worker-*.ts` |

Los 20 workers son: `automation`, `billing`, `consent`, `cross_store_consistency`,
`delegated_access`, `health_context`, `identity_assurance`, `integrations`,
`lakehouse`, `messaging`, `pharmacy_inventory`, `promotions`, `qa_lab`,
`read_models`, `reporting`, `scheduling`, `time_series`, `tracking`, `vector_rag`,
`workflow`.

Entre todos ejecutan **29 jobs** con intervalos de 5 s a 1 h (los más frecuentes:
seis cada 30 s, cinco cada 60 s, cinco cada 5 s).

**Dato de arquitectura con consecuencia directa en el costo:** los workers **no se
conectan a la base de datos**. Hablan con la API por HTTP (`SystemApiClient`). Tres
implicaciones:

- Los workers son **procesos ligeros** (sin ORM, sin pool de conexiones): 512 MB
  les sobra y encajan en el escalón más barato de cualquier PaaS.
- **El pool de conexiones a Postgres es uno solo, el de la API.** No hay que
  dimensionar la base de datos para 21 clientes — un alivio real frente a lo que
  suele pasar con arquitecturas de muchos workers.
- **Todo el trabajo de fondo pasa por la API.** La API es el cuello de botella y
  hay que dimensionarla para el tráfico de usuarios *más* el de 29 jobs. Y si los
  workers viven en otro host que la API, **ese tráfico es egress facturable**.

### 1.2 Almacenes de datos — todos obligatorios

| Servicio | Imagen | Para qué | Cliente en el código |
| --- | --- | --- | --- |
| **PostgreSQL + TimescaleDB** | `timescale/timescaledb-ha:pg18` | Esquema principal (288 tablas, RLS), colas, outbox, series temporales, vectores | `@mikro-orm/postgresql`, `pg` |
| **MongoDB** | `mongo:8.0` | Módulo 55 `document_store` (validadores `$jsonSchema` e índices) | `mongodb` ^7.5 |
| **Redis** | `redis:8.8-alpine` | Módulo `redis_runtime`; persistencia activada (`--save 60 1`) | `ioredis` ^5.11 |
| **OpenSearch** | `opensearchproject/opensearch:3.7.0` | Búsqueda | `@opensearch-project/opensearch` ^3.6 |
| **MinIO / S3** | `minio` | Módulo `object_storage` (documentos clínicos) | `@aws-sdk/client-s3` |

**Extensiones de PostgreSQL declaradas** en `src/orm/catalog/extensions.catalog.ts`
— las cuatro son obligatorias, no opcionales:

| Extensión | Para qué | ¿La ofrecen los gestionados? |
| --- | --- | --- |
| `pgcrypto` | `gen_random_uuid()` y hashes de columnas `*_hash` | Sí, en todos |
| `vector` (pgvector) | Módulo 59 `vector_rag`, similitud clínica | Sí, en todos |
| `pg_trgm` | Índices GIN de similitud para búsqueda por nombre | Sí, en todos |
| **`timescaledb`** | Hypertables del módulo 58 `time_series` | **No en RDS. Parcial en Neon. Restringido en Supabase.** |

Además existe **`src/worker/jobs/time_series/compress-chunks.job.ts`**: el sistema
no sólo crea hypertables, **comprime chunks**. Eso es exactamente la función bajo
licencia TSL que las ediciones Apache-2 no tienen.

### 1.3 Componentes de soporte

| Componente | Estado | Nota de costo |
| --- | --- | --- |
| Jaeger + OTel | `docker-compose.jaeger.yml`, aparte | Trazas de los 21 procesos. Self-host o gestionado; **no está en la tabla** |
| `mock-provider-server` | Sólo desarrollo | No se despliega en producción |
| `postgres-init`, `mongo-init` | One-shot | No consumen en régimen |

### 1.4 Huella de memoria estimada

Los límites de `docker-compose.yml` **no son una medición** — el propio fichero lo
advierte: *«defaults conservadores para desarrollo/staging, no una medición de
carga real»*. Suma de límites frente a consumo esperado en reposo:

| Concepto | Suma de límites | Estimación en reposo |
| --- | ---: | ---: |
| API | 1,5 GB | 0,2–0,4 GB |
| 20 workers | 10,0 GB | 2,0–2,6 GB |
| PostgreSQL/Timescale | sin límite | 1,0–2,0 GB |
| MongoDB | sin límite | 0,5–1,0 GB |
| OpenSearch | sin límite | 1,5–2,0 GB |
| Redis | sin límite | 0,1–0,3 GB |
| MinIO | sin límite | 0,1–0,3 GB |
| **Total** | **>11,5 GB sólo la app** | **~5,4–8,6 GB** |

**Conclusión de dimensionamiento:** un host de **16 GB** aguanta el sistema
completo en piloto con margen para caché de disco. Uno de 8 GB **no**: OpenSearch
y Postgres juntos ya se comen la mitad. La CPU es holgada: 29 jobs periódicos sobre
6 vCPU no saturan nada mientras el volumen sea bajo.

## Parte 2 — Revisión línea por línea de la tabla propuesta

Veredictos: ✅ correcta · ⚠️ correcta pero mal dimensionada · ❌ incompatible o
innecesaria · ➕ falta.

### 2.1 Frontend y CDN

| Línea | Veredicto | Comentario |
| --- | --- | --- |
| Vercel Pro, $20/miembro | ✅ | El costo **es por miembro**: con 4 personas son $80/mes, no $20. Es la línea que más crece con el equipo |
| Netlify Pro, $19/miembro | ✅ | Alternativa equivalente; misma advertencia por miembro |
| AWS S3 + CloudFront, $10–15 | ⚠️ | Correcta para el frontend, pero **este backend también necesita S3 para documentos clínicos** (`object_storage`). Son dos usos distintos con crecimiento distinto: el frontend es plano, los documentos clínicos **crecen y no se borran** |

### 2.2 Cómputo de la API y los workers

| Línea | Veredicto | Comentario |
| --- | --- | --- |
| Render, $25/contenedor | ⚠️ | El precio es de un contenedor de 1 vCPU/2 GB. **Aquí hacen falta 21.** Bien dimensionado: API en ese escalón ($25) + 20 workers en el escalón de 0,5 vCPU/512 MB (~$7 c/u) = **~$165/mes**. Mal dimensionado (todo al mismo escalón): **$525/mes** |
| Railway Pro, $20–35 | ⚠️ | Al ser por consumo escala mejor con procesos en reposo, pero 21 servicios siguen siendo 21. La estimación de $20–35 corresponde a **una** carga, no a esta topología |
| AWS ECS Fargate, $15–28 por tarea | ⚠️ | Una tarea de 0,5 vCPU/1 GB 24/7. Con 21 tareas: **$315–588/mes**. Fargate es la opción más cara para procesos que están en reposo casi todo el tiempo |
| Contabo Cloud VPS M (6 vCPU/16 GB), $14–16 | ✅ | **La mejor relación para esta arquitectura.** Los 26 contenedores entran en 16 GB según la Parte 1.4. Sin HA ni respaldos gestionados |
| DigitalOcean Basic (4 vCPU/8 GB), $48 | ⚠️ | 8 GB **no alcanzan** con OpenSearch + Postgres + Mongo + 21 procesos. Habría que subir de escalón, y entonces cuesta 3–4× lo que Contabo |

### 2.3 Base de datos relacional — la sección con el problema grave

| Línea | Veredicto | Comentario |
| --- | --- | --- |
| Supabase Pro, $25 (marcada «recomendado») | ❌ | Supabase **restringe `timescaledb` en proyectos nuevos sobre PG17+** por la licencia TSL. Los proyectos existentes siguen, los nuevos no pueden habilitarlo |
| Neon Launch, $19 | ❌ | Neon incluye **sólo la edición Apache-2 de TimescaleDB**: se pueden crear hypertables, pero **la compresión falla** — y `compress-chunks.job.ts` la usa |
| AWS RDS PostgreSQL db.t4g.small, $32–40 | ❌ | **RDS no ofrece la extensión `timescaledb`**, retirada de las listas permitidas por la licencia TSL |
| ➕ **Tiger Cloud (ex Timescale Cloud)** | ➕ | **Es el gestionado compatible que falta en la tabla.** Entrada por consumo desde ~$0,02/h (~$14,40/mes si corre continuo); planes con nombre desde ~$30–36/mes |
| ➕ **Postgres autogestionado** | ➕ | La imagen `timescale/timescaledb-ha:pg18` sobre el VPS. Costo marginal cero; a cambio, los respaldos y el ajuste son trabajo propio |

> **Esto no es un detalle de configuración.** Si se elige Supabase, Neon o RDS hay
> que **quitar el módulo `time_series` o reescribirlo sobre tablas particionadas
> nativas**, y eso es trabajo de ingeniería, no un cambio de plan.
>
> Además, el sistema soporta **réplica de lectura** (`POSTGRES_READ_URL`,
> `DB_READ_POOL_MAX`). Activarla **duplica** la línea de base de datos. No hace
> falta en piloto.

### 2.4 Documental, caché, búsqueda y colas

| Línea | Veredicto | Comentario |
| --- | --- | --- |
| MongoDB Atlas M10, $57–65 (marcada «recomendado») | ✅ | Justificada: el módulo 55 `document_store` usa Mongo de verdad. **Es la línea gestionada más cara de toda la tabla** — en piloto, autogestionarlo ahorra ~$60/mes |
| AWS DocumentDB, $55–70 | ⚠️ | Compatible parcialmente con la API de Mongo. Antes de elegirlo hay que verificar que soporta los **validadores `$jsonSchema`** que crea `mongo-init` |
| Upstash serverless, $0–10 (marcada «recomendado») | ⚠️ | **La estimación no encaja con esta topología.** El sistema tiene 29 jobs ticando cada 5–60 s; el tramo gratuito de 10.000 comandos diarios se agota en horas. Hay que estimar comandos/día reales antes de asumir $0–10 |
| AWS ElastiCache cache.t4g.micro, $16–18 | ✅ | Coherente. *(La fuente citada en la tabla apunta a «DigitalOcean Droplets» — parece un error de copiado)* |
| CloudAMQP «Tough Tiger», $19 (marcada «recomendado») | ❌ | **No hay AMQP en el sistema.** Las colas son `queued_jobs` en Postgres con `FOR UPDATE SKIP LOCKED`, más el patrón outbox. Ninguna dependencia de `amqplib`, RabbitMQ, Kafka, SQS ni BullMQ |
| AWS Amazon MQ, $22–25 | ❌ | Mismo motivo |
| ➕ **OpenSearch** | ➕ | **Obligatorio y ausente de la tabla.** Autogestionado en el VPS: $0 marginal (~2 GB de RAM). Gestionado: presupuestar ~$30/mes en el escalón mínimo |
| ➕ **Observabilidad (Jaeger/OTel)** | ➕ | 21 procesos instrumentados. Self-host o gestionado; hay que decidirlo, no omitirlo |

### 2.5 Dominios, tiendas y Estado

| Línea | Veredicto | Comentario |
| --- | --- | --- |
| ADSIB `.bo`, $40/año | ✅ | ~3,3 USD/mes prorrateados. Proveedor **local**: no lleva la retención del 16 % y su factura da crédito fiscal |
| Namecheap `.com`, $12–14/año | ✅ | ~1 USD/mes. Conviene tener ambos: `.com` para producto, `.bo` para presencia institucional |
| Apple Developer, $99/año | ⚠️ | El monto es correcto; **el costo real es el requisito previo** (ver 5.2) |
| Google Play, $25 pago único | ✅ | Correcto |
| AGETIC / SEGIP, variable | ⚠️ | **Es la única línea que no se puede estimar y la que más puede bloquear.** El repositorio ya tiene módulo y worker `identity_assurance`: la verificación de identidad civil no es opcional en el diseño. Hay que abrir el convenio **antes** de comprometer fechas |

## Parte 3 — Tres topologías completas con costo total

Supuestos comunes: 1 entorno productivo, sin réplica de lectura, sin alta
disponibilidad, equipo de 1 persona en Vercel, impuestos +16 %, tipo de cambio
11,7 BOB/USD. **No incluye el costo por mensaje de WhatsApp/SMS**, que va en el
otro documento.

### A · VPS único — piloto y demostración

| Concepto | USD/mes |
| --- | ---: |
| Contabo Cloud VPS M (6 vCPU / 16 GB / 400 GB NVMe) | 15,00 |
| Todo lo demás autogestionado (Postgres+Timescale, Mongo, Redis, OpenSearch, MinIO) | 0,00 |
| S3 para respaldos fuera del host | 5,00 |
| Vercel Pro (1 miembro) | 20,00 |
| Dominios prorrateados (.bo 3,33 + .com 1,09) | 4,42 |
| **Subtotal** | **44,42** |
| Menos ADSIB (proveedor local, sin retención) | −3,33 |
| Base sujeta a retención | 41,09 |
| **Total con impuestos (+16 % sobre 41,09, más ADSIB)** | **~50,99** |
| **BOB efectivos** | **~597** |

**Qué se gana:** el sistema completo por menos de 600 BOB/mes.
**Qué se pierde:** cero alta disponibilidad, respaldos y actualizaciones manuales,
un fallo de disco se lleva todo, y no hay entorno de staging. **Aceptable para
piloto con datos no críticos; no para datos clínicos reales de producción.**

### B · Híbrido — recomendado para producción inicial

Autogestiona lo barato de operar, delega lo que duele perder.

| Concepto | USD/mes | Por qué así |
| --- | ---: | --- |
| Contabo VPS M (API + 20 workers + Redis + OpenSearch + MinIO) | 15,00 | Los procesos en reposo no justifican PaaS por contenedor |
| **Tiger Cloud** (Postgres + TimescaleDB gestionado) | 33,00 | Único gestionado compatible con `timescaledb` + compresión |
| MongoDB Atlas M10 | 60,00 | Respaldos y punto-en-el-tiempo sobre documentos clínicos |
| S3 + CloudFront (documentos + frontend + respaldos) | 13,00 | Crece con el volumen clínico |
| Vercel Pro (1 miembro) | 20,00 | +$20 por cada persona añadida |
| Dominios prorrateados | 4,42 | |
| **Subtotal** | **145,42** | |
| Base sujeta a retención (sin ADSIB) | 142,09 | |
| **Total con impuestos** | **~168,15** | |
| **BOB efectivos** | **~1.967** | |

**Es la opción recomendada.** Los dos almacenes cuyo respaldo es innegociable
(Postgres clínico y Mongo documental) quedan gestionados; lo que es fácil de
reconstruir (workers, caché, búsqueda) queda en el VPS barato.

### C · Todo gestionado, bien dimensionado

| Concepto | USD/mes |
| --- | ---: |
| Render: API (1 vCPU/2 GB) | 25,00 |
| Render: 20 workers en escalón 0,5 vCPU/512 MB (~$7 c/u) | 140,00 |
| Tiger Cloud | 33,00 |
| MongoDB Atlas M10 | 60,00 |
| Upstash Redis (estimación revisada al alza por los 29 jobs) | 25,00 |
| OpenSearch gestionado | 30,00 |
| S3 + CloudFront | 13,00 |
| Vercel Pro (1 miembro) | 20,00 |
| Dominios prorrateados | 4,42 |
| **Subtotal** | **350,42** |
| Base sujeta a retención | 347,09 |
| **Total con impuestos** | **~405,95** |
| **BOB efectivos** | **~4.750** |

### C′ · Todo gestionado leyendo la tabla literalmente

Si se toma «Render $25 por contenedor» al pie de la letra para los 21 procesos y se
suman las líneas de broker que no hacen falta:

| Concepto | USD/mes |
| --- | ---: |
| Render 21 × $25 | 525,00 |
| Atlas (60) + RDS (36) + ElastiCache (17) + CloudAMQP (19) | 132,00 |
| Resto (S3, Vercel, dominios) | 37,42 |
| **Subtotal** | **694,42** |
| **Total con impuestos** | **~804,99** |
| **BOB efectivos** | **~9.418** |

**La diferencia entre C y C′ es de ~$400/mes**, y toda viene de dos decisiones:
dimensionar los workers en su escalón real y no comprar un broker que el sistema
no usa.

### Comparación

| | A · VPS | B · Híbrido | C · Gestionado | C′ · Literal |
| --- | ---: | ---: | ---: | ---: |
| USD/mes con impuestos | 50,99 | 168,15 | 405,95 | 804,99 |
| BOB/mes | ~597 | ~1.967 | ~4.750 | ~9.418 |
| Respaldos gestionados | ❌ | ✅ datos críticos | ✅ | ✅ |
| Sobrevive a fallo de host | ❌ | Parcial | ✅ | ✅ |
| Apto para datos clínicos reales | ❌ | ✅ | ✅ | ✅ |

## Parte 4 — La palanca de ingeniería: consolidar workers

Los 20 workers son 20 procesos porque así se diseñó el aislamiento de fallos, no
porque la carga lo exija: **29 jobs periódicos que en su mayoría hacen una consulta
HTTP y vuelven a dormir**.

Agruparlos en 3–4 procesos por afinidad (por ejemplo: clínico, financiero,
plataforma, analítico) cambia el costo en las topologías por contenedor:

| Escenario | Procesos | Costo en Render |
| --- | ---: | ---: |
| Hoy, dimensionado correctamente | 21 | ~$165/mes |
| Consolidado en 4 grupos (API + 4) | 5 | **~$53/mes** |
| Ahorro anual | | **~$1.344** |

**Lo que se pierde:** hoy un worker con fuga de memoria se reinicia solo sin tocar
a los demás (`restart: always` + healthcheck en `:9100/health`). Consolidado,
reiniciar un grupo detiene los jobs de todos sus dominios. También se pierde poder
escalar un dominio caliente por separado.

**Recomendación:** **no consolidar mientras se opere en VPS** (topologías A y B),
donde 20 procesos en reposo no cuestan nada extra y el aislamiento es gratis. **Sí
consolidar antes de migrar a un PaaS por contenedor**, donde cada proceso se paga.
La decisión es de costo, no de arquitectura, y conviene tomarla en ese momento y no
antes.

## Parte 5 — Costos anuales, de una sola vez y con plazo de entrega

### 5.1 Resumen

| Concepto | Monto | Frecuencia | Con impuestos | Plazo de obtención |
| --- | ---: | --- | ---: | --- |
| Apple Developer Program | $99 | Anual | ~$114,84 | **Semanas** (ver 5.2) |
| Google Play Console | $25 | Único | ~$29,00 | Días |
| ADSIB `.bo` | $40 | Anual | $40 (local) | Días |
| Namecheap `.com` | $13 | Anual | ~$15,08 | Inmediato |
| Convenio AGETIC/SEGIP | Variable | Por convenio | Local | **Meses** |

### 5.2 Apple: los $99 no son el obstáculo

La inscripción como **organización** exige, según los requisitos de Apple:

| Requisito | Implicación real |
| --- | --- |
| **Entidad legal** | No se aceptan nombres comerciales, DBA ni sucursales. El nombre legal debe coincidir con el NIT y **aparecerá publicado** como vendedor en la App Store |
| **Autoridad para firmar** | Quien inscribe debe poder obligar legalmente a la organización |
| **Sitio web público** | Con dominio propio de la organización — **dependencia directa de la línea de dominios** |
| **Correo corporativo** | En ese mismo dominio; no sirve Gmail personal |
| **Número D-U-N-S** | Emitido por Dun & Bradstreet. Gratuito en la mayoría de jurisdicciones, pero **su emisión tarda días o semanas** |

**Consecuencia de planificación: el D-U-N-S y el dominio son la ruta crítica de la
publicación en iOS, no el pago.** Hay que iniciarlos con semanas de antelación. Y
como el pago es anual en USD con tarjeta internacional, arrastra la restricción de
la Parte 6.

### 5.3 AGETIC / SEGIP: la línea que puede bloquear el proyecto

Es la única sin cifra, y el repositorio **ya asume que existe**: hay módulo y
worker `identity_assurance`. Tres cosas que conviene cerrar antes de comprometer
fechas: si el convenio es por bolsa transaccional o por consulta, cuál es el plazo
real de firma, y **qué hace el sistema mientras no exista** (¿alta de paciente sin
verificar C.I. y conciliación posterior?). Esa última decisión es de producto y hay
que tomarla aunque el convenio salga rápido, porque también gobierna el modo
degradado.

## Parte 6 — Divisa, impuestos y medio de pago

Idéntico a lo analizado en el [estudio de mensajería](mensajeria-whatsapp-vs-sms-costos-2026-08-07.md),
pero aplicado aquí a un gasto recurrente mayor.

### 6.1 Los tres efectos

1. **Retención de ~16 %** (13 % IVA de servicios digitales + hasta 3 % IT) que la
   entidad financiera aplica a los pagos a proveedores digitales del exterior, **sin
   crédito fiscal**. Alcanza a todas las líneas salvo ADSIB y proveedores locales.
2. **Tipo de cambio.** Desde la unificación de junio de 2026 (RM 245/2026) el
   cambio flota y se aplica el referencial diario del BCB, en torno a **11,5–12,0
   BOB/USD**. La tabla propuesta usa 6,96.
3. **Medio de pago.** Los pagos internacionales con tarjeta se rehabilitaron en
   abril de 2026: **crédito sin límite, débito hasta USD 500**, con topes internos
   por entidad. La topología C (~$406/mes) **no cabe en una tarjeta de débito**; la
   B (~$168/mes) sí, pero sin margen. **Hay que operar con tarjeta de crédito
   empresarial.**

### 6.2 Regla de conversión

> **BOB efectivos = USD × 11,7 × 1,16 ≈ USD × 13,6**

### 6.3 La tabla de Google Maps corregida

| Plan | USD | BOB propuesto (a 6,96) | **BOB real (a 11,7)** | **BOB con impuestos** | Desvío |
| --- | ---: | ---: | ---: | ---: | ---: |
| Starter | 100 | 696 | 1.170 | **1.357** | **+95 %** |
| Essentials | 275 | 1.914 | 3.218 | **3.732** | **+95 %** |
| Pro | 1.200 | 8.352 | 14.040 | **16.286** | **+95 %** |

**El presupuesto en bolivianos de mapas es prácticamente el doble de lo previsto.**
Antes de comprar Essentials conviene medir las llamadas reales del módulo `geo`:
la diferencia entre Starter y Essentials son ~2.375 BOB/mes con impuestos, y si el
uso es sobre todo mostrar mapas (no geocodificar), una base de teselas propia sobre
OpenStreetMap elimina buena parte de esa factura.

## Parte 7 — Lo que ninguna de las dos tablas incluye

Ordenado por lo que más duele descubrir tarde.

1. **Entorno de staging.** Probar migraciones de 288 tablas contra producción no es
   opción. **Duplica el cómputo** (aunque no las licencias): +$15/mes en topología
   A o B con un segundo VPS.
2. **Respaldos y su restauración probada.** Un respaldo que nunca se restauró no es
   un respaldo. Presupuestar almacenamiento (~$5/mes) **y una ventana de trabajo
   periódica** para el simulacro.
3. **Observabilidad.** 21 procesos instrumentados con OTel apuntando a Jaeger. Si
   se autogestiona, es RAM y disco en el host; si no, es una línea nueva.
4. **Retención de logs.** Con datos clínicos, quién accedió a qué es evidencia.
   Volumen y período de retención cuestan almacenamiento.
5. **Crecimiento del almacenamiento clínico.** Documentos, PDFs y adjuntos **no se
   borran**. La línea de S3 es la única que crece sola y de forma monótona: hay que
   proyectarla a 24 meses, no tomarla como fija.
6. **Egress.** Si los workers viven en un host distinto de la API, sus 29 jobs
   generan tráfico facturable entre hosts.
7. **Correo transaccional.** El adaptador de Gmail existe, pero sus cuotas de envío
   no son de grado producción para volúmenes altos.
8. **Costo por mensaje de WhatsApp/SMS.** Va en el otro documento y **no está en
   ninguna de estas cifras**.
9. **Tiempo de operación de personas.** Parcheado, rotación de credenciales,
   guardia. En topología A es sustancial y es lo que se está ahorrando en dinero.

## Parte 8 — Recomendación

**Topología B (híbrida), sin consolidar workers, con Tiger Cloud como base de
datos y sin comprar broker de mensajes.** ~$168/mes con impuestos, ~1.967 BOB.

Justificación en una línea por punto:

- **VPS para cómputo** porque 21 procesos que duermen la mayor parte del tiempo son
  el peor caso para el precio por contenedor, y el mejor para un host propio.
- **Tiger Cloud para Postgres** porque es el único gestionado que corre
  `timescaledb` **con compresión**, y el repositorio ya la usa.
- **Atlas para Mongo** porque es el otro almacén cuyo respaldo no se puede
  improvisar.
- **Redis, OpenSearch y MinIO en el VPS** porque son reconstruibles: si se pierden,
  se repueblan; no son fuente de verdad.
- **Sin CloudAMQP ni Amazon MQ** porque el sistema no habla AMQP.
- **Sin consolidar workers todavía** porque en VPS el aislamiento de fallos es
  gratis; consolidar sólo si se migra a PaaS.

**Orden de compra sugerido**, por plazo de entrega y no por monto:

1. **Hoy:** D-U-N-S y dominios — son la ruta crítica de la publicación en iOS.
2. **Esta semana:** iniciar el trámite del convenio AGETIC/SEGIP.
3. **Al empezar a desplegar:** VPS + Tiger Cloud + S3.
4. **Antes de cargar datos clínicos reales:** Atlas y el simulacro de restauración.
5. **Cuando haya tráfico medido:** el plan de Google Maps que corresponda — no antes.

## Cómo verificar antes de presupuestar

1. **Extensiones**: confirmar con el proveedor de Postgres candidato que
   `timescaledb` **con compresión**, `vector`, `pg_trgm` y `pgcrypto` están
   disponibles en la versión ofertada. Es la comprobación que descarta o habilita
   toda la sección 2.3.
2. **Huella real**: medir RSS y CPU de los 21 procesos con `docker stats` bajo
   carga de prueba. Los límites de `docker-compose.yml` son conservadores por
   diseño, no medidos.
3. **Comandos de Redis/día**: instrumentar antes de asumir el tramo barato de
   Upstash.
4. **Escalones de PaaS**: confirmar el precio del escalón de 0,5 vCPU/512 MB en
   Render/Railway — de ahí sale la diferencia entre $165 y $525.
5. **Tipo de cambio e impuestos**: confirmar con el contador el porcentaje exacto
   retenido y el referencial aplicable, igual que en el estudio de mensajería.
6. **Llamadas a Google Maps**: medir el uso real del módulo `geo` antes de elegir
   plan.

## Fuentes

Consultadas el 2026-08-07. El inventario de la Parte 1 sale del repositorio; el
resto son fuentes públicas de terceros y la tabla propuesta.

- [Tiger Cloud Pricing (ex Timescale)](https://www.tigerdata.com/pricing)
- [PostgreSQL Extensions on Neon, Ranked](https://1bench.dev/extensions/postgresql/on-neon)
- [PostgreSQL Extensions on Supabase, Ranked](https://1bench.dev/extensions/postgresql/on-supabase)
- [PostgreSQL Hosting Options in 2026: Pricing Comparison — Bytebase](https://www.bytebase.com/blog/postgres-hosting-options-pricing-comparison/)
- [Contabo VPS Pricing](https://contabo.com/en/vps/)
- [DigitalOcean Droplets Pricing](https://www.digitalocean.com/pricing/droplets)
- [Render Pricing](https://render.com/pricing)
- [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
- [Apple Developer Program Enrollment](https://developer.apple.com/programs/enroll/)
- [Bolivia habilita las compras con tarjetas bancarias en el exterior — Infobae](https://www.infobae.com/america/america-latina/2026/04/07/bolivia-habilita-las-compras-con-tarjetas-bancarias-en-el-exterior-luego-de-tres-anos-de-restricciones/)
- [Restablecen las compras por internet y pagos en el exterior con tarjetas — ASFI](https://www.asfi.gob.bo/node/1362)
- [Ampliación del IVA por consumo de servicios digitales — Moreno Baldivieso](https://emba.com.bo/ampliacion-del-iva-a-consecuencia-del-consumo-de-los-servicios-digitales/)
