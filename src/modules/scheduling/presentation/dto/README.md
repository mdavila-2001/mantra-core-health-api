# DTO de scheduling

Contratos de entrada/salida con `class-validator` y anotaciones Swagger.

## Archivos

| Archivo                      | Contenido                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `scheduling-catalog.dto.ts`  | Recursos, políticas, plantillas y franjas, generación de slots, excepciones                                  |
| `scheduling-bookings.dto.ts` | Holds, confirmación, reprogramación, cancelación, check-in, lista de espera, recordatorios y lotes de worker |

## Convenciones

- **Horas de franja** como `HH:MM[:SS]` validadas con `@Matches`, no como fecha: una plantilla
  semanal describe una hora del día, no un instante concreto.
- **`dayOfWeek`** de 0 a 6 (0 = domingo), acotado con `@Min`/`@Max`.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Importes** como cadena decimal (`@IsNumberString`): el modelo los persiste en `numeric`.
- **Enums de dominio** por código legible (`PRACTITIONER`, `PORTAL`, `ABSENCE`); el servicio los
  traduce al `*_concept_id` del catálogo. El cliente nunca envía UUID de concepto.
- **Franjas anidadas** (`rules`) con `@ValidateNested({ each: true })`, `@Type` y `@ArrayMinSize(1)`:
  una plantilla sin franjas no generaría ningún slot.

## Reglas condicionales

Se validan en el servicio porque no se expresan bien con decoradores:

- `startTime` anterior a `endTime` en cada franja.
- Ventana de generación y de excepción con inicio anterior al fin.
- El slot destino de una reprogramación no puede ser el actual.

## Ejemplo de solicitud

```json
POST /scheduling/slots/{id}/holds
{ "patientProfileId": "22222222-2222-2222-2222-222222222222" }
```

## Ejemplo de respuesta

```json
{
  "id": "…",
  "holdToken": "8f14e45f-ceea-467a-9c2b-1c3d4e5f6a7b",
  "expiresAt": "2026-06-01T09:05:00.000Z",
  "remainingCapacity": 1
}
```

El `holdToken` se entrega **una sola vez** y es la clave con la que se confirma la cita. No vuelve a
aparecer en ninguna lectura posterior ni en los logs.

## DTO de worker

`WorkerBatchDto` (`limit` opcional) y `WorkerBatchResultDto` (`processed`, `detail`) son el contrato
común de los tres endpoints internos, que procesan lotes y son idempotentes.
