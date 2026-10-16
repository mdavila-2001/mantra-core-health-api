# Revisión del módulo `polyglot_storage` — ALOVIDA

## Alcance y resultado

Se revisaron gobierno de datasets, colocaciones, cifrado, residencia, failover, costes e integridad. `corepack yarn test src/modules/polyglot_storage --runInBand --silent` aprobó **6 suites y 84 pruebas**. No se confirmó un fallo en las reglas de gobierno leídas: las operaciones tienen roles operativos explícitos y la aprobación de colocación verifica residencia, clasificación, cifrado y aislamiento antes de activarla.

## Riesgo confirmado de entrega incompleta

El módulo registra gobierno, pero no ejecuta operaciones sobre los motores: el propio README declara pendientes la creación física de colecciones, réplica, validación de capacidades, cálculo de hashes y cableado de outbox. Por tanto, una colocación `APPROVED` no demuestra por sí misma que el backend real tenga cifrado, retención, réplica o RLS configurados.

**Plan:** antes de habilitar escrituras reales, implementar adaptadores por backend que apliquen y comprueben cada política; emitir outbox en la misma transacción de gobierno; hacer que el worker de salud pruebe la capacidad real y que la activación falle cerrada si no existe evidencia verificable. Probar backend conforme, región fuera de residencia, cifrado ausente y `422/PRECONDITION_FAILED/POLYGLOT_PLACEMENT_POLICY_NOT_SATISFIED`.

## Cobertura a conservar

| Área | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Colocación | Dataset/colección/región conformes | vínculo y failover con secundario | país, región o cifrado incompatible | `422/PRECONDITION_FAILED/POLYGLOT_PLACEMENT_POLICY_NOT_SATISFIED` |
| Costes | periodo cerrado idempotente | reejecución del mismo periodo | periodo abierto o invertido | `422/PRECONDITION_FAILED/POLYGLOT_COST_PERIOD_INVALID` |
| Integridad | hashes coinciden | política de cuarentena | divergencia | estado cuarentena y evento outbox verificable |
