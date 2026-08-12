# Repositorios — Audio TTS

Acceso a datos del schema `audio_tts`. **Stateless**: cada método recibe el
`EntityManager` activo, de modo que el servicio controla la unidad de trabajo.

| Repositorio | Tabla(s) | Notas |
|---|---|---|
| `AudioAssetsRepository` | `audio_assets`, `audio_templates` | `claimBatch` (lease + `SKIP LOCKED`), `createPendingIfMissing`, `markReady`, `markFailed`, `sweepExhausted`, `releaseReservation` |
| `AudioQuotaRepository` | `audio_budget_month`, `audio_actor_generation_daily`, `audio_generation_usage` | reserva/liquidación/devolución atómicas, cupo por actor, consumo por asset y retención |

## Por qué aquí hay SQL directo

Las operaciones que deciden **quién gana una carrera** están escritas en SQL y no
en el ORM, y no es preferencia de estilo: su corrección depende de que la
comprobación y la escritura ocurran en la **misma sentencia**. Un `find` seguido
de un `persist` deja entre las dos exactamente la ventana que hay que cerrar.

| Operación | Forma | Qué garantiza |
|---|---|---|
| `createPendingIfMissing` | `INSERT … ON CONFLICT (asset_key) DO NOTHING` | dos peticiones del mismo audio producen **una** generación |
| `claimBatch` | `UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)` | N workers no se disputan filas; un lease expirado vuelve a ser reclamable |
| `reserveBudget` | `ON CONFLICT DO UPDATE … WHERE reserved+settled+n <= usable` | N peticiones concurrentes no superan el presupuesto; **cero filas es la denegación** |
| `claimActorGeneration` | `ON CONFLICT DO UPDATE … WHERE count < limit` | el cupo diario no se supera en carrera |
| `markReady`, `releaseReservation`, `sweepExhausted` | CTE que **lee y pone a cero** en la misma sentencia | la reserva se devuelve **exactamente una vez** |

El último punto es el más fácil de romper: leer `reserved_units` desde el
`RETURNING` del propio `UPDATE` devuelve el valor ya puesto a cero, y la
compensación liberaría 0 unidades sin que nada fallara.
