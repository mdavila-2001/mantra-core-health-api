> [!note] Origen y revisión
> Plan redactado por **Codex** (sólo lectura sobre el repo, 2026-10-05) a pedido del dueño, y
> revisado por Claude contra el monitoreo desplegado. Correcciones aplicadas sobre lo que Codex
> no podía ver (su checkout era anterior al merge de `infra/monitoring/`):
> 1. **Las métricas `alovida_container_*` existen** (exportador del bot): `alovida_container_running`,
>    `_unhealthy`, `_expected_running`, `_restart_count`, `_oom_killed`, `_started_at_seconds`,
>    con etiquetas `name`, `service`, `resource`, `display`.
> 2. **cAdvisor etiqueta el contenedor como `name`**, no `container`: en las consultas de abajo,
>    leé `container=~` como `name=~`.
> 3. **Traefik todavía no está en Prometheus.** Las consultas `traefik_*` exigen antes habilitar
>    sus métricas en el proxy de Coolify y sumar el target al `prometheus.yml`. Hasta entonces,
>    el tráfico se aproxima con la red por contenedor (`container_network_*_bytes_total`).
> 4. La sonda blackbox tiene `job="blackbox-http"` (no `.*alovida.*`).


# Plan SRE — decidir qué queda y qué se apaga en el VPS AloVida

No se modificó ningún archivo. Este plan parte del incidente del 05/10 y no presupone que la causa haya sido OOM: lo trata como hipótesis a confirmar.

## Lo que ya sabemos

- El VPS tiene 47 GiB de RAM y el disco no es el cuello de botella (13 % usado).
- Hay dos stacks completos de la aplicación (`test` y `dev`), más monitoreo, Coolify y un servicio de IA. El modelo MedGemma 27B ya consumió aproximadamente 30 GB y coincide temporalmente con un OOM del kernel.
- El compose de test configura un límite de 1,5 GiB para la API y 384 MiB por worker; OpenSearch tiene heap Java de 512 MiB. El resto de los motores no tiene límite explícito en el archivo. docker-compose.coolify.yml (`docker-compose.coolify.yml:335`)
- Este checkout no contiene `infra/monitoring/`; por lo tanto, los nombres exactos de las métricas custom `alovida_container_*` deben comprobarse en Prometheus antes de automatizar consultas. Las consultas estándar de cAdvisor, node-exporter, blackbox y Traefik sí están detalladas abajo.

## Inventario inicial

“RAM de referencia” no significa consumo real: es el límite configurado o, si no existe, “a medir” durante siete días.

| Servicio o grupo | Entorno | Para qué sirve | Quién depende | RAM de referencia |
|---|---|---|---|---|
| PostgreSQL/TimescaleDB | test y dev | Base transaccional principal | API, migraciones; indirectamente todos los módulos | Sin límite; medir RSS y cache |
| MongoDB | test y dev | Documentos no relacionales | API / módulo `document_store` | Sin límite; medir |
| Redis | test y dev | Estado efímero, caché y rate-limit | API | Sin límite; medir |
| OpenSearch | test y dev | Índices y búsquedas | API / `search_platform` | Heap 512 MiB; RSS real a medir |
| MinIO | test y dev | Archivos tipo S3 | API / `object_storage` | Sin límite; medir |
| `*-init` y `api-migrate` | test y dev | Inicializan motores y migran/siembran al desplegar | Sólo el despliegue | Cero en régimen: son one-shot |
| API | test y dev | Backend HTTP NestJS | Frontends, workers y usuarios | Límite 1,5 GiB por stack |
| `worker-messaging` | test y dev | Relay del outbox, colas y notificaciones; corre cada 5 s | Altas, eventos y notificaciones | Límite 384 MiB |
| `worker-scheduling` | test y dev | Libera holds, procesa recordatorios y lista de espera | Agenda | Límite 384 MiB |
| `worker-workflow` | test y dev | Vence tiempos de procesos de workflow | Flujos clínicos/operativos | Límite 384 MiB |
| `worker-read_models` | test y dev | Reconcilia proyecciones de lectura | Consultas y proyecciones | Límite 384 MiB |
| `alovida-frontend` | test | Frontend del entorno test | Nadie, por decisión del dueño | Debe quedar apagado |
| `mockup-frontend` | test | Maqueta visual | Diseño/demos, a confirmar | A medir |
| `alovida-frontend-dev` | dev | Web pública en `app.alovidasalud.com` | Usuarios de dev, a confirmar | A medir |
| `alovida-dev-data` | test | Redis/OpenSearch/MinIO auxiliares expuestos | Uso real a confirmar | A medir; exposición se cierra |
| MedGemma 4B / 27B | ai-service | Inferencia y benchmarks de IA | Dueño/equipo IA, a confirmar | 27B: ~30 GB observados; 4B: medir |
| Prometheus, Grafana, Alertmanager, exporters, bot, autoheal | monitoring | Ver y alertar sobre salud del VPS | Operación/SRE | A medir, se mantiene durante la evaluación |
| Coolify 4 y su base/Redis | plataforma | Panel y orquestación de deploys | Todos los recursos | A medir; no apagar |

La justificación de los cuatro workers no es inferida: el compose los define como esenciales y el código confirma sus tareas. Mensajería drena el outbox y entrega notificaciones; scheduling libera reservas y despacha recordatorios; workflow vence procesos; read-models reconcilia proyecciones. compose (`docker-compose.coolify.yml:701`), módulos de workers (`src/worker/jobs/messaging/messaging.worker-module.ts:20`).

El sistema tiene más workers posibles, pero los demás ya están fuera del compose de Coolify a propósito; el propio archivo registra que 18 workers sumarían 6,9 GB de límites y no entran en el VPS. compose (`docker-compose.coolify.yml:725`)

## Regla objetiva para decidir “aporta valor”

Un servicio queda clasificado como “aporta” sólo si cumple al menos una de estas condiciones en una ventana continua de 7 días, incluyendo un horario de uso normal:

| Evidencia | Cómo medirla | Decisión que habilita |
|---|---|---|
| Tiene tráfico real | Requests en Traefik, éxito de blackbox y confirmación del dueño sobre usuarios | Mantener o bajar recursos |
| Procesa trabajo durable | Filas creadas/procesadas en outbox, colas, DLQ o tareas de dominio | Mantener worker o programarlo |
| Otro servicio lo necesita | `depends_on`, conexiones reales y red Docker `alovida` | No apagar hasta eliminar/migrar la dependencia |
| Tiene usuarios o una obligación de negocio | Dueño identificado, horario de necesidad y consecuencia si falta | Mantener, programar o apagar fuera de horario |
| Su costo justifica su existencia | p95 de RAM/CPU, picos y presión sobre el VPS | Reducir límite, fusionar o apagar |
| No tiene evidencia | Cero tráfico, cero trabajo, sin dependencias y sin dueño | Candidato a apagar |

No se deben mirar payloads, direcciones de destinatarios ni textos de error: contienen potencialmente PHI. Las consultas de base deben devolver sólo conteos, estados, códigos de cola y antigüedad.

### Consultas PromQL

Primero, en Prometheus, inventariar las métricas custom realmente disponibles:

```promql
count by (__name__) ({__name__=~"alovida_container_.*"})
```

Luego asociar el nombre de contenedor real a cada recurso de Coolify. No asumir etiquetas: verificar si la instancia usa `container`, `name`, `service` o `container_label_com_docker_compose_service`.

| Qué | Consulta PromQL | Ventana |
|---|---|---|
| Requests por servicio AloVida | `sum by (service, code) (increase(traefik_service_requests_total{service=~".*alovida.*"}[7d]))` | 7 días |
| Errores HTTP | `sum by (service, code) (increase(traefik_service_requests_total{service=~".*alovida.*",code=~"5.."}[7d]))` | 7 días |
| Disponibilidad externa | `min_over_time(probe_success{job=~".*alovida.*"}[7d])` | 7 días |
| RAM p95 por contenedor | `quantile_over_time(0.95, (container_memory_working_set_bytes{image!="",container=~".*alovida.*"})[7d:5m])` | 7 días |
| CPU p95 por contenedor | `quantile_over_time(0.95, (rate(container_cpu_usage_seconds_total{image!="",container=~".*alovida.*"}[5m]))[7d:5m])` | 7 días |
| Mínimo de RAM disponible del VPS | `min_over_time((node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)[7d:5m])` | 7 días |
| Señal de OOM del host | `increase(node_vmstat_oom_kill[7d])` | 7 días |
| Límite versus uso | `container_memory_working_set_bytes / container_spec_memory_limit_bytes` | 7 días |
| Estado/recurrencia del contenedor | Métrica custom validada del bot `alovida_container_*`; usar su nombre real tras el inventario anterior | 7 días |

Si Traefik no exporta `service` o el nombre difiere, se debe inspeccionar primero:

```promql
count by (__name__) ({__name__=~"traefik_.*requests.*"})
```

La adaptación del selector es una tarea de descubrimiento, no una excusa para omitir la medición.

### Trabajo de colas y outbox

El backend usa outbox transaccional propio sobre PostgreSQL, no RabbitMQ/Kafka/BullMQ. La tabla `messaging.outbox_messages` y las colas `messaging.queued_jobs` tienen estados por concepto; mensajería las procesa. modelo SQL (`database/SQL/35_messaging/02_tables.sql:22`), flujo documentado (`docs/events/overview.md:18`).

Ejecutar diariamente estas consultas de conteo, guardando el resultado agregado sin payloads:

```sql
SELECT c.code AS cola,
       s.code AS estado,
       count(*) AS trabajos,
       min(q.created_at) AS mas_antiguo
FROM messaging.queued_jobs q
JOIN messaging.message_queues c ON c.id = q.queue_id
JOIN terminology.catalog_concepts s ON s.id = q.status_concept_id
WHERE q.created_at >= now() - interval '7 days'
GROUP BY c.code, s.code
ORDER BY c.code, s.code;
```

```sql
SELECT s.code AS estado,
       count(*) AS mensajes,
       min(o.created_at) AS mas_antiguo
FROM messaging.outbox_messages o
JOIN terminology.catalog_concepts s ON s.id = o.status_concept_id
WHERE o.created_at >= now() - interval '7 days'
GROUP BY s.code
ORDER BY s.code;
```

```sql
SELECT c.code AS cola,
       count(*) AS dlq_7d,
       min(d.recorded_at) AS primer_fallo
FROM messaging.dead_letter_jobs d
JOIN messaging.message_queues c ON c.id = d.queue_id
WHERE d.recorded_at >= now() - interval '7 days'
GROUP BY c.code
ORDER BY dlq_7d DESC;
```

Un worker no puede considerarse prescindible sólo porque su CPU sea baja: si evita que crezca una cola crítica, aporta valor.

## Matriz de decisión inicial

| Recurso | Estado inicial | Acción propuesta | Evidencia faltante |
|---|---|---|---|
| `alovida-frontend` test | Decisión conocida | Mantener apagado | Ninguna: lo pidió el dueño |
| PostgreSQL publicado en `:5432` | Riesgo conocido | Cerrar exposición pública ya; acceso por túnel SSH/VPN si hiciera falta | Confirmar que no existe cliente externo legítimo |
| Redis/OpenSearch/MinIO de `alovida-dev-data` expuestos | Riesgo conocido | Cerrar puertos públicos ya | Ninguna para cerrar la exposición; medir 7 días antes de apagar el recurso |
| MedGemma 27B y benchmark | Riesgo muy alto | Mantener apagado en este VPS; no ejecutar junto a stacks completos | Decisión de negocio sobre IA; consumo real del 4B |
| Monitoreo | Necesario para medir | Mantener durante todo el plan | RAM p95 por componente |
| Coolify | Dependencia de plataforma | Mantener | RAM p95; no se prueba apagándolo |
| API + Postgres + Redis de `dev` | A medir | Mantener hasta conocer usuarios/tráfico; luego apagar fuera de horario si es entorno interno | Dueño, horario y tráfico de `app.alovidasalud.com` |
| Mongo/OpenSearch/MinIO de dev y test | A medir, pero con dependencia declarada | No fusionar ni apagar individualmente sin medir conexiones y funcionalidades | Uso real por API; solicitudes de archivos/búsqueda/documentos |
| Cuatro workers esenciales | A medir con fuerte evidencia de necesidad | Mantener durante la primera ventana; evaluar programación sólo si no hay trabajo | Outbox, colas y efectos de apagarlos |
| `mockup-frontend` | A medir | Apagar fuera de horario o apagar si no tiene visitas/dueño | Tráfico y responsable |
| `alovida-dev-data` | A medir | Cerrar exposición; apagar si no tiene consumidores en siete días | Conexiones y dependencia de otros recursos |
| Duplicar infraestructura dev/test | Decisión arquitectónica | No compartir bases persistentes por defecto; evaluar apagar dev por horario o usar un único entorno de prueba con datos claramente aislados | Dueño y necesidad de dos entornos simultáneos |

“Fusionar” no debe significar que dev y test compartan una misma base, Redis u objetos sin aislamiento: eso mezcla datos, pruebas y fallos. La alternativa segura es un entorno apagable por horario, o un único entorno de integración explícitamente acordado y con datos sintéticos.

## Ejecución por fases

| Fase | Acción | Riesgo | Reversión |
|---|---|---|---|
| 0. Recuperar y preservar evidencia | Cuando vuelva el VPS, registrar hora, estado de contenedores, eventos del kernel/OOM, RAM, swap, CPU y disco antes de reiniciar servicios arbitrariamente | Perder la causa del incidente | No aplica; es observación |
| 1. Reducir exposición | Quitar publicación pública de PostgreSQL, Redis, OpenSearch y MinIO; no borrar contenedores ni volúmenes | Cortar un acceso externo legítimo | Reabrir temporalmente sólo para IPs autorizadas, nunca a todo Internet |
| 2. Establecer línea de base | Etiquetar cada recurso con entorno, dueño y criticidad; validar nombres de métricas y tableros | Mediciones mal agrupadas | Revisar etiquetas contra `docker ps`/Coolify antes de decidir |
| 3. Medir siete días | Capturar PromQL, blackbox, tráfico y conteos de colas; anotar p95/pico y usuarios | Ninguno funcional | No aplica |
| 4. Recortar primero lo inequívoco | Mantener frontend test apagado; detener 27B; programar o detener mockup/dev-data si no tienen uso | Demo o herramienta interna no declarada | Iniciar el recurso desde Coolify; los volúmenes quedan intactos |
| 5. Reducir límites con canario | Aplicar límites primero en test, un servicio por vez; observar 24–48 h | OOM dentro del contenedor o latencia | Restaurar el límite anterior y revisar p95/picos |
| 6. Programar dev | Si no hay uso nocturno, apagar frontend y/o stack dev completo fuera del horario pactado | Interrumpir pruebas o demos | Encendido manual y ventana de aviso; no se eliminan volúmenes |
| 7. Decidir IA | Admitir 4B sólo con presupuesto de RAM; 27B requiere otro host o apagar explícitamente cargas incompatibles | Nuevo OOM del host | Detener el servicio IA; no ejecutar benchmark automático |
| 8. Cierre operativo | Dejar dashboard, alerta de RAM/OOM, lista de recursos, dueño y horario de cada uno | Volver a acumular servicios sin dueño | Revisión mensual y toda vez que se cree un recurso |

En ninguna fase se borran volúmenes, imágenes útiles ni datos. “Apagar” es detener y deshabilitar arranque automático; no eliminar.

## Presupuesto de RAM objetivo

La regla operativa inicial debe ser:

- Mantener al menos **12 GiB (25 %)** de `MemAvailable` en forma sostenida.
- Alerta preventiva al bajar de **16 GiB**, crítica al bajar de **12 GiB** o ante cualquier incremento de `node_vmstat_oom_kill`.
- Reservar aproximadamente **8 GiB** para kernel, page cache, Docker, Coolify y variación no atribuida.
- Admitir servicios sólo si la suma de límites comprometidos deja esos 12 GiB libres. Con 47 GiB, el techo inicial para límites de aplicaciones es **27 GiB**, hasta tener p95 reales.

Límites iniciales a validar en test antes de generalizar:

| Servicio | Límite sugerido inicial | Fundamento |
|---|---:|---|
| API | 1536 MiB | Ya configurado; `NODE_OPTIONS` limita V8 a 1024 MiB |
| Cada worker esencial | 384 MiB | Ya configurado; revisar p95 antes de bajar |
| PostgreSQL | 3 GiB por stack | Punto de partida conservador; confirmar cache/conexiones |
| MongoDB | 1,5 GiB por stack | Punto de partida; confirmar uso documental |
| Redis | 512 MiB por stack | Punto de partida; configurar política de memoria antes de imponerlo |
| OpenSearch | 1,5 GiB por stack | Heap declarado de 512 MiB más memoria nativa/cache |
| MinIO | 512 MiB por stack | Punto de partida; confirmar transferencias concurrentes |
| Frontend | 512 MiB | Punto de partida; medir RSS |
| Mockup | 256 MiB | Punto de partida si se mantiene |
| Prometheus | 2 GiB | Confirmar retención y cardinalidad |
| Grafana/Alertmanager/exporters/bot/autoheal | 1 GiB conjunto inicial | Separar si el p95 contradice este presupuesto |
| MedGemma 4B | 8 GiB máximo temporal | Sólo si el presupuesto admite la carga |
| MedGemma 27B | No admisible en este VPS con margen anti-OOM | ~30 GB observados deja sin margen operativo seguro |

Los límites son barandas, no prueba de que el servicio funcione con esa RAM. Cada reducción necesita 24–48 h de observación y revisión de salud, tráfico, colas y logs sin PHI.

## Preguntas que el dueño debe resolver

| Pregunta de negocio | Decisión necesaria |
|---|---|
| ¿Quién usa realmente `app.alovidasalud.com` y en qué horario? | Define si dev puede apagarse por horario o desaparecer |
| ¿Test y dev necesitan existir al mismo tiempo? | Define si se mantienen dos stacks o un entorno aislado compartido |
| ¿Quién usa `mockup-frontend` y qué nivel de disponibilidad necesita? | Define apagado permanente, nocturno o mantenimiento |
| ¿Qué función concreta justifica MedGemma 4B/27B? | Define presupuesto, horario y si se compra/migra a infraestructura separada |
| ¿Hay testers externos que realmente requieran PostgreSQL directo? | Si no, el puerto se cierra definitivamente |
| ¿`alovida-dev-data` tiene consumidores legítimos? | Si no, se apaga después de la ventana de siete días |
| ¿Qué procesos clínicos o administrativos no pueden demorarse? | Define qué workers son 24×7 y cuáles pueden programarse |
| ¿Cuál es el horario de menor impacto para cambios? | Define las ventanas de canario, apagado y reversión |

El resultado esperado no es “tener menos contenedores” sino una lista auditable: recurso, dueño, usuarios, valor medido, RAM p95, límite, horario, dependencia y decisión.