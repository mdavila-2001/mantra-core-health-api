# Servicios — Accounting

Dueños de la unidad de trabajo: usan `em.transactional` para escrituras (`em.fork`
para lecturas puntuales) y hacen `flush` del padre antes de crear hijos. Lanzan
excepciones de dominio (`ResourceNotFoundException` 404, `ConflictException` 409,
`PreconditionFailedException` 422).

| Servicio | Casos de uso |
|----------|--------------|
| `LedgerService` | UC-16-01 posteo (valida balance + periodo abierto), UC-16-02 determinación, UC-16-03 reversa, UC-16-13 adjunto, alta de cuenta (soporte) |
| `FiscalService` | UC-16-04 abrir ejercicio, UC-16-05 bloquear periodo |
| `AccrualService` | UC-16-06 objeto de devengo, UC-16-07 corrida de devengo |
| `SubledgerService` | UC-16-08 partida abierta, UC-16-09 clearing |
| `AssetService` | UC-16-10 capitalización, UC-16-11 depreciación batch |
| `LiabilityService` | UC-16-12 pago de cuota (principal + interés) |
| `ExchangeRateService` | UC-16-14 registro/upsert de tasa |

- `PostingHelper` (interno): postea un asiento balanceado dentro de la transacción
  del llamador; lo reutilizan los flujos que "incluyen UC-16-01" (devengo, activos,
  pasivos, clearing). Vuelve a validar débito=crédito antes de escribir.
- `money.ts`: `toCents`/`sumCents`/`fromCents` para comparar saldos sin ruido de
  coma flotante.

Tests unit en `*.spec.ts` (mockean repos, `em` y `PostingHelper`): cubren happy
path, no-encontrado, conflicto y al menos un rechazo de regla (incluido el 422 de
partida doble no balanceada y el 422 de periodo bloqueado).
