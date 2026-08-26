# FAR-E1 — verificación del bloqueador, y un precedente que acorta la discusión

**Para:** Ender · **De:** Justin · **Fecha:** 2026-08-26
**Sobre:** el paquete `BLOQUEADOR-FAR-E1-MODELO` (2026-08-25)
**Base contrastada:** `mantra_redesa_health` viva, stack `mantra-redesa`

---

## Veredicto: tu informe se sostiene entero

Contrasté tus cinco afirmaciones contra la base, una por una, porque son
comprobables y no quería reenviarlas a Marcelo sin haberlas mirado.

| Afirmación | Resultado |
|---|---|
| `inventory_reservations` no tiene modalidad, dirección de entrega, código de retiro, motivo de rechazo ni total congelado | ✅ confirmado — 16 columnas, ninguna de ésas |
| `inventory_reservation_lines` no tiene precio unitario ni moneda | ✅ confirmado — 14 columnas, sólo cantidades |
| No hay jsonb de escape en **ninguna** tabla de `pharmacy_inventory` | ✅ confirmado — cero columnas `jsonb` en todo el esquema |
| `quotation_id` es una FK sin destino canónico | ✅ confirmado — no aparece en `information_schema` como FK resuelta |
| No existe tabla de pedido de paciente | ✅ confirmado — sólo `pharmacy_purchase_orders`, que es del flujo proveedor |

**Tu conclusión es correcta: FAR-E1 completo no se puede persistir hoy.**

---

## Lo que encontré y no está en tu informe

### `medication_dispensation_lines` ya tiene el patrón de precio congelado

En tu mismo módulo, en la tabla de al lado:

```
pharmacy_inventory.medication_dispensation_lines
  unit_price_amount · numeric
  patient_amount    · numeric
  insurer_amount    · numeric
```

El modelo **ya decidió** cómo congela precios en farmacia. Eso cambia el peso de
tu pregunta 1: deja de ser «¿dónde ponemos los precios congelados?» —una
decisión de diseño abierta— y pasa a ser «¿replicamos la forma que el módulo ya
usa?», que es mucho más fácil de responder y mucho más difícil de discutir.

**Sugerencia concreta:** reescribí la pregunta 1 citando esta tabla. A Marcelo le
llega una propuesta con precedente, no una consulta abierta.

### Pero la moneda **sí** es nueva — separala

Esa tabla guarda **importe sin moneda**. Y en todo `pharmacy_inventory` la
moneda aparece sólo en dos lugares, ninguno del flujo del paciente:

```
inventory_ledger_entries · currency_concept_id
pharmacy_purchase_orders · currency_concept_id
```

Así que si tu contrato promete moneda **por línea**, eso no es copiar el
precedente: es pedir algo que el flujo de paciente nunca tuvo. Conviene partir la
pregunta en dos:

1. **Precio congelado** → «como `medication_dispensation_lines`». Casi resuelta.
2. **Moneda** → pregunta propia. Y vale la pena plantear la alternativa: si en la
   práctica el sistema es mono-moneda, quizás vive en la cabecera y no por línea,
   que es lo que hace `pharmacy_purchase_orders`.

Dos preguntas fáciles rinden más que una difícil.

---

## Sobre tu pregunta 1 — extender vs. `pharmacy_orders`

Coincido con tu inclinación por **(b)**, y te agrego un argumento:

`inventory_reservations` ya la usan otros flujos de staff. Meterle modalidad de
entrega y código de retiro la convierte en una tabla que **significa dos cosas
distintas según quién creó la fila**. Eso no se paga al escribirla: se paga
después, cada vez que alguien la lee y tiene que preguntarse de qué flujo es
esta fila.

Dicho eso, es decisión de Marcelo, y lo importante es lo que ya lograste: **tu
contrato HTTP aguanta las dos respuestas**. Eso es lo que permite avanzar
mientras él decide.

---

## Lo que arrancaría ya, sin esperar a nadie

Estoy de acuerdo con tu sección «mientras tanto». El núcleo no depende del
modelo:

- crear pedido = reserva parcial, con línea `SIN_STOCK` que no tumba el pedido
- los 10 estados por `defineModuleConcepts()` — cero SQL
- expiración 48 h (worker + perezosa)
- cancelación con liberación de stock
- titularidad con 404 indistinguible
- lectura en palabras, sin N+1

Es aproximadamente la mitad de FAR-E1.

**Lo que sí haría explícito:** avisarle a FAR-I2 que los seis campos comerciales
llegan en una segunda vuelta. Que el front sepa que va a recibir el pedido sin
modalidad, sin código de retiro y sin precios congelados, y no los dé por hechos
en su mock. Un contrato que se cumple a medias sin avisar es peor que uno que
declara sus dos etapas.

---

## Una nota de proceso

Marcelo tiene **dos pedidos míos** esperando, del vínculo médico↔organización:

- los peldaños de la escalera de organización (faltan «del padrón» y «reclamada»)
- el modo del vínculo (falta «declarado»)

Si los dos paquetes le llegan juntos —el tuyo con las preguntas afiladas como
propongo arriba— tiene bastante más chance de resolver todo en un bloque que si
le caen por separado en dos momentos distintos.

**¿Armamos un solo pedido o preferís mandar el tuyo aparte?** Lo que decidas
está bien; sólo quería que la opción existiera antes de que él se despierte.

---

## Cómo verifiqué

Por si querés reproducirlo. Todo contra la base viva, sin tocar nada:

```sql
-- columnas de las dos tablas candidatas
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='pharmacy_inventory'
  AND table_name IN ('inventory_reservations','inventory_reservation_lines')
ORDER BY table_name, ordinal_position;

-- ¿hay jsonb de escape en el módulo?
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema='pharmacy_inventory' AND data_type='jsonb';

-- el precedente de precio congelado
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema='pharmacy_inventory'
  AND (column_name LIKE '%price%' OR column_name LIKE '%amount%'
       OR column_name LIKE '%currency%');
```
