# Recuperación ante desastres y continuidad operativa

Dos planes con horizontes distintos. El **DRP** responde a «se perdió algo, cómo
lo recuperamos». El **BCP** responde a «mientras no está, cómo seguimos
operando».

> **Advertencia de alcance.** Buena parte de este plan describe procedimientos
> que **no se han ensayado**. Está señalado caso por caso. Un plan de recuperación
> sin ensayo no es un plan de recuperación; es una intención documentada, que es
> mejor que nada pero no es lo mismo. Ver las casillas correspondientes en
> [06-checklists.md](06-checklists.md).

---

# Parte 1 · Plan de recuperación ante desastres

## Clasificación de los datos por criticidad

| Clase | Contenido | Pérdida tolerable | Dónde vive |
| --- | --- | --- | --- |
| **C1 · Clínico** | Historia clínica, prescripciones, resultados de laboratorio, consentimientos | **Cero** | PostgreSQL |
| **C1 · Auditoría** | Registro WORM de auditoría | **Cero** (inmutable por diseño) | PostgreSQL |
| **C2 · Operativo** | Agenda, facturación, mensajería, inventario | Minutos | PostgreSQL |
| **C3 · Derivado** | Modelos de lectura, proyecciones, índices de búsqueda, rollups de series temporales | Reconstruible | PostgreSQL, OpenSearch, Mongo |
| **C4 · Efímero** | Cachés, sesiones, colas en memoria, estado de cortacircuitos | Irrelevante | Redis, memoria de proceso |
| **C2 · Archivos** | Documentos clínicos y adjuntos | Cero | MinIO / almacenamiento de objetos |

La clasificación es lo que fija los objetivos: no tiene sentido un RPO de cero
para un índice de OpenSearch que se reconstruye en 20 minutos.

## Objetivos

| Clase | RPO (pérdida máxima) | RTO (tiempo hasta servicio) | Estado |
| --- | --- | --- | --- |
| C1 | 0 | ≤ 1 h | 🔵 Requiere réplica síncrona o WAL archiving; **no configurado** |
| C2 | ≤ 5 min | ≤ 2 h | 🔵 Requiere política de copias; **no configurado** |
| C3 | n/a (reconstruible) | ≤ 4 h | 🟡 Reconstrucción posible, no cronometrada |
| C4 | n/a | inmediato | ✅ Se regeneran solos |

**Los objetivos de C1 y C2 son propuestas, no compromisos vigentes.** Este
repositorio no contiene ni la configuración de copias de seguridad ni la de
replicación: son decisiones de infraestructura. Lo que sí aporta es el criterio
para dimensionarlas y los procedimientos de reconstrucción de C3.

## Escenarios

### DR-01 · Pérdida de una réplica de la API

| | |
| --- | --- |
| **Detección** | El `healthcheck` falla; el balanceador retira la instancia |
| **Impacto** | Ninguno si hay más réplicas: `/readiness` no declara lista una instancia hasta que sus 4 dependencias responden |
| **Procedimiento** | Automático. `restart: always` la levanta |
| **Verificación** | `GET /readiness` en 200 |
| **RTO** | < 1 min |
| **Estado** | ✅ |

### DR-02 · Pérdida de un proceso worker

| | |
| --- | --- |
| **Detección** | `healthcheck` sobre `/health` |
| **Impacto** | El dominio de ese worker deja de procesar mientras esté caído. **No hay pérdida**: el trabajo reclamado se libera al expirar su lock y el siguiente tick lo recoge |
| **Procedimiento** | Automático |
| **Verificación** | `GET :9100/status` muestra `runs` creciendo de nuevo |
| **RTO** | < 2 min |
| **Estado** | ✅ |

### DR-03 · Pérdida de PostgreSQL

| | |
| --- | --- |
| **Detección** | `/readiness` en 503 con `postgresql.status === "down"` |
| **Impacto** | **Caída total.** Es la dependencia de la que todo lo demás depende |
| **Procedimiento** | 1. Confirmar por `/readiness`. 2. Promover la réplica si existe. 3. Si no, restaurar desde la copia más reciente + WAL. 4. Verificar integridad referencial. 5. Reiniciar la API para renovar el pool. 6. Los 20 workers reanudan solos (sus cortacircuitos cierran al primer sondeo exitoso) |
| **RTO objetivo** | ≤ 1 h |
| **Estado** | 🔵 **Sin réplica ni copias configuradas en este repositorio.** El punto 6 sí está verificado |

### DR-04 · Pérdida de MongoDB, Redis u OpenSearch

| | |
| --- | --- |
| **Impacto** | Los módulos 55/56/57 (Document Store, Redis Runtime, Search Platform) dejan de servir. **El núcleo clínico sigue operando**: PostgreSQL es independiente |
| **Procedimiento** | Redis (C4) se levanta vacío y se repuebla solo. OpenSearch (C3) se reindexa desde PostgreSQL. Mongo (C2/C3) se restaura desde copia; lo derivado se reproyecta |
| **RTO** | ≤ 4 h |
| **Estado** | 🟡 Reconstrucción posible; procedimiento no ensayado ni cronometrado |

### DR-05 · Corrupción de datos derivados

| | |
| --- | --- |
| **Detección** | Discrepancia entre el modelo de lectura y la fuente; el job `read-model-reconciliation` la reporta |
| **Impacto** | Lecturas incorrectas; **la fuente de verdad está intacta** |
| **Procedimiento** | Reproyectar desde los eventos de dominio. No requiere restaurar nada |
| **Estado** | 🟡 El job de reconciliación existe; el procedimiento de reproyección masiva no está documentado paso a paso |

### DR-06 · Corrupción o pérdida de datos clínicos (C1)

| | |
| --- | --- |
| **Impacto** | **Catastrófico.** Es el escenario que justifica el resto del documento |
| **Contención preventiva** | Registro WORM de auditoría (inmutable), outbox transaccional, RLS validado contra base real, `ORM_SCHEMA_SYNC=off` en producción para que la aplicación no pueda alterar el esquema por su cuenta |
| **Procedimiento** | 1. **Aislar**: detener escrituras al ámbito afectado. 2. **Delimitar** con el registro de auditoría — quién, qué y cuándo. 3. Restaurar a un punto anterior al daño. 4. Reaplicar lo legítimo posterior desde los eventos de dominio. 5. Informe de incidente clínico |
| **RPO objetivo** | 0 |
| **Estado** | 🔵 El paso 3 depende de copias que no están configuradas aquí. Los pasos 1, 2 y 4 son viables hoy |

### DR-07 · Despliegue defectuoso

| | |
| --- | --- |
| **Detección** | Tasa de `INTERNAL` al alza, `healthcheck` fallando, o `fatal` en el log |
| **Procedimiento** | Rollback de imagen. Ver [`docs/operations/rollback.md`](../operations/rollback.md) |
| **Nota crítica** | Un rollback de código **no revierte una migración de esquema**. Toda migración debe ser aditiva y compatible hacia atrás para que el rollback sea posible |
| **RTO** | ≤ 15 min |
| **Estado** | 🟡 |

---

# Parte 2 · Plan de continuidad operativa

## Qué se degrada y en qué orden

El sistema no es todo-o-nada. Esta tabla dice qué se puede perder sin parar la
atención clínica, que es el criterio que ordena las prioridades durante un
incidente.

| Función | Criticidad | Si su dependencia cae | Degradación aceptable |
| --- | --- | --- | --- |
| Consulta de historia clínica | **Vital** | PostgreSQL | Ninguna. Es la función que justifica el sistema |
| Prescripción | **Vital** | PostgreSQL | Ninguna |
| Agenda de turnos | Alta | PostgreSQL | Lectura sin escritura durante el incidente |
| Notificaciones (email/SMS) | Media | Proveedor externo | **Se difieren**: el outbox las conserva y el worker las envía al recuperarse. Ninguna se pierde |
| Búsqueda de texto libre | Media | OpenSearch | Caer a búsqueda por filtros en PostgreSQL |
| Documentos adjuntos | Alta | MinIO / Mongo | Lectura desde caché; escritura diferida |
| Facturación | Media | PostgreSQL | Diferible dentro del día |
| Analítica y modelos de lectura | Baja | Cualquiera | Diferible por completo |
| Verificación de identidad | Alta | Proveedor externo | **Fail-closed**: se rechaza, nunca se da por verificada. Es una decisión de seguridad deliberada |

## Modos de operación degradada

### Modo 1 · Dependencia secundaria caída

Redis, OpenSearch o Mongo. **La atención clínica no se interrumpe.**

- La API sigue sirviendo todo lo que depende de PostgreSQL.
- `/readiness` da 503, así que **hay que decidir conscientemente** si el
  balanceador debe retirar la instancia: para un incidente de OpenSearch,
  retirarla sería peor que servir sin búsqueda.
- Acción: seguir operando, comunicar la función degradada.

### Modo 2 · Proveedor externo caído

- Los adapters fallan **visible** (`PROVIDER_NOT_CONFIGURED` o el error del
  proveedor), nunca fingen éxito.
- Las notificaciones quedan en el outbox y se envían al recuperarse.
- La verificación de identidad se rechaza: no se da por verificado a nadie.
- Acción: comunicar el retraso en notificaciones. No forzar el emulador —
  `assertMockProviderNotInProduction` lo impide, y con razón.

### Modo 3 · Workers detenidos, API en pie

- Las lecturas y escrituras interactivas funcionan con normalidad.
- Se detiene el trabajo diferido: recordatorios, expiración de reservas,
  cobranza, reconciliación.
- **No hay pérdida**: los ticks recogen el trabajo acumulado al volver.
- Vigilar: el volumen acumulado puede provocar descarte de ticks solapados en la
  reanudación ([R-01](01-matriz-de-riesgos.md#r-01)) — es recuperable, pero
  conviene escalar el worker temporalmente si el retraso es grande.

### Modo 4 · PostgreSQL caído

Sin continuidad posible. Es el escenario DR-03: recuperar es la única opción.

## Roles durante un incidente

| Rol | Responsabilidad |
| --- | --- |
| Comandante | Decide, prioriza y comunica. No ejecuta |
| Operador | Ejecuta los procedimientos del [manual de incidentes](07-manual-de-incidentes.md) |
| Escriba | Registra la cronología. Es lo que después permite el post mortem |
| Enlace clínico | Traduce el impacto técnico a impacto asistencial y decide qué se comunica al personal de salud |

## Comunicación

| Severidad | Criterio | A quién | Cuándo |
| --- | --- | --- | --- |
| SEV-1 | Función vital afectada; datos C1 en riesgo | Todos + enlace clínico | Inmediato |
| SEV-2 | Función alta degradada | Equipo técnico + responsable de producto | ≤ 15 min |
| SEV-3 | Función media o baja degradada | Equipo técnico | ≤ 1 h |
| SEV-4 | Sin impacto en el usuario | Registro | Post mortem |

## Ensayos

| Ensayo | Frecuencia propuesta | Última ejecución |
| --- | --- | --- |
| Restauración de copia a entorno limpio | Trimestral | 🔵 Nunca |
| Campaña de caos completa ([04](04-chaos-engineering.md)) | Antes de cada despliegue mayor | 🟡 Nunca |
| Simulacro de rollback | Semestral | 🔵 Nunca |
| Simulacro de incidente SEV-1 | Anual | 🔵 Nunca |

Esta tabla es, deliberadamente, la parte más incómoda del documento. Es también
la más honesta: **la capacidad de recuperación de este sistema no está
demostrada**, y ninguna cantidad de código de resiliencia sustituye a un ensayo
de restauración que sí se hizo y sí funcionó.
