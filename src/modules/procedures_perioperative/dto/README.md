# DTO perioperatorios

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`periop.dto.ts`) porque los 14 casos de uso comparten vocabulario (caso, sitio anatómico,
lateralidad, gravedad).

## Convenciones

- **Enums de dominio por código legible** (`ELECTIVE`, `ASA III`, `TIME_OUT`, `ETT`, `UDI_DI`,
  `BIOPSY`…); el servicio los traduce al `*_concept_id` del catálogo. Nunca se acepta un concept id
  de estado del cliente.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Medidas y puntuaciones como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y la
  distancia tiromentoniana o el sangrado estimado perderían precisión por `number`.
- **Colecciones anidadas** (`diagnoses`, `riskScores`, `responses`, `identifiers`, `complications`,
  `items`) con `@ValidateNested({ each: true })` y `@Type`. Llevan `@ArrayMinSize(1)` las que no
  tienen sentido vacías: diagnósticos, respuestas del checklist, identificadores de implante y
  cargos.
- **Rangos acotados**: `expectedHttpStatus` no aplica aquí, pero sí `aldreteScore` (0–10) y las
  fechas de vigencia.

## `identifiers` con `@ArrayMinSize(1)`

`RecordImplantDto` exige al menos un identificador. Es la única lista del módulo cuyo mínimo tiene
consecuencia regulatoria: un implante sin UDI, lote ni serie no se puede localizar si el fabricante
lo retira del mercado, y el paciente ya lo lleva puesto.

## Lo que no se acepta

- **Derivados**: `caseNumber`, `stepNumber`, `sequenceNumber` del diagnóstico, `reportVersion`,
  `actualStartAt` / `actualEndAt` y todo estado se calculan y se devuelven; nunca se reciben.
- **El estado del caso**: lo mueven cuatro actos concretos (verificar órdenes, inducir, firmar el
  reporte, cancelar). No hay DTO que lo fije directamente.
- **El alta de recuperación desde la valoración**: `RecordPacuAssessmentDto` anota, `DischargePacuDto`
  da el alta. Son dos peticiones porque son dos decisiones.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Caso | `ScheduleCaseDto`, `AddDiagnosesDto` (+ `CaseDiagnosisDto`), `AssignTeamMemberDto` | `CaseResponseDto`, `DiagnosesResponseDto`, `TeamMemberResponseDto` |
| Preoperatorio | `CreatePreopAssessmentDto` (+ `RiskScoreDto`), `VerifyOrdersDto` | `PreopAssessmentResponseDto`, `VerifyOrdersResponseDto` |
| Seguridad | `SubmitChecklistPhaseDto` (+ `ChecklistResponseItemDto`) | `ChecklistPhaseResponseDto` |
| Anestesia | `CreateAnesthesiaPlanDto` (+ `AirwayAssessmentDto`), `RecordAnesthesiaEventDto` | `AnesthesiaPlanResponseDto`, `ApprovePlanResponseDto`, `AnesthesiaEventResponseDto` |
| Intervención | `CreateOperativeStepDto`, `RecordFindingDto`, `RecordImplantDto` (+ `ImplantIdentifierDto`), `RecordMedicationUseDto`, `RecordSpecimenDto` | `OperativeStepResponseDto`, `FindingResponseDto`, `ImplantResponseDto`, `SuppliesResponseDto` |
| Reporte | `DraftOperativeReportDto` (+ `ComplicationDto`), `SignReportDto` | `OperativeReportResponseDto`, `SignReportResponseDto` |
| Recuperación | `AdmitToPacuDto`, `RecordPacuAssessmentDto`, `DischargePacuDto` (+ `PostoperativeOrderDto`, `PostoperativeFollowupDto`) | `PacuStayResponseDto`, `PacuAssessmentResponseDto`, `DischargePacuResponseDto` |
| Cierre | `CancelCaseDto`, `PostChargesDto` (+ `ChargeItemDto`) | `CancelCaseResponseDto`, `PostChargesResponseDto` |

## Campos que documentan su obligación condicional

Varios opcionales lo son en el DTO pero obligatorios según otro campo, y su descripción lo dice:
`urgencyReasonText` (si el caso no es electivo), `rescuePlanText` (si se anticipa vía aérea
difícil), `exceptionReason` (si la respuesta es `EXCEPTION`). El servicio los valida, porque la
condición depende de otro campo del mismo cuerpo.

## Ejemplo de solicitud

```json
POST /procedure-cases/{id}/implants
{
  "procedureId": "11111111-1111-1111-1111-111111111111",
  "implantDeviceId": "22222222-2222-2222-2222-222222222222",
  "implantRole": "PRIMARY",
  "bodySiteConceptId": "33333333-3333-3333-3333-333333333333",
  "laterality": "LEFT",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "07612345000014",
      "issuingSystem": "GS1",
      "lotNumber": "L-2026-042",
      "serialNumber": "SN-99871",
      "expirationDate": "2031-06-30"
    }
  ],
  "udiCarrier": "(01)07612345000014(10)L-2026-042(21)SN-99871"
}
```

## Ejemplo de respuesta

```json
{
  "id": "44444444-4444-4444-4444-444444444444",
  "statusConceptId": "…",
  "identifierIds": ["55555555-5555-5555-5555-555555555555"],
  "deviceUseId": "66666666-6666-6666-6666-666666666666"
}
```

`deviceUseId` apunta al registro de uso del dispositivo, separado del implante: es el que responde
a "¿dónde se usó este lote?" cuando llega una alerta del fabricante.
