# DTO de CRM

Contratos de entrada/salida con `class-validator` y anotaciones Swagger. Todo el módulo comparte un
único archivo (`crm.dto.ts`) porque los contratos son pequeños y se leen mejor juntos que dispersos.

## Convenciones

- **Enums de dominio por código legible**: `CUSTOMER`, `WEB`, `TASK`, `HIGH`, `RESOLVED`… El servicio
  los traduce al `*_concept_id` del catálogo; el cliente nunca envía UUID de concepto.
- **Importes y porcentajes como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`.
- **`leadScore` entra como entero 0–100** (`@IsInt` + `@Min`/`@Max`) y se persiste como cadena: es
  la única conversión de tipo que hace el servicio, y está comentada donde ocurre.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Referencias polimórficas** (`subjectType` + `subjectRefId`, `partnerRefType` + `partnerRefId`):
  el tipo va como código y el id como UUID, tal como los declara el modelo.

## DTO disponibles

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Cuentas | `CreateAccountDto`, `AddTeamMemberDto` | `AccountResponseDto`, `TeamMemberResponseDto` |
| Leads | `CreateLeadDto`, `QualifyLeadDto`, `ConvertLeadDto` | `LeadResponseDto`, `ConvertLeadResponseDto` |
| Oportunidades | `AdvanceStageDto`, `LoseOpportunityDto` | `OpportunityResponseDto` |
| Actividades | `CreateActivityDto` | `ActivityResponseDto` |
| Alianzas | `CreatePartnershipDto` | `PartnershipResponseDto` |
| Casos | `CreateCaseDto`, `AddCaseCommentDto`, `ChangeCaseStatusDto` | `CaseResponseDto`, `CaseStatusResponseDto` |
| Contactos | `ChannelOptInDto` | `ChannelOptInResponseDto` |
| Vista 360 | — | `Account360ResponseDto` |

## Campos opcionales

Reflejan la nullabilidad del modelo: `website`, `taxId`, `parentAccountId` en la cuenta;
`fullName`/`email`/`phone` en el lead (un lead puede llegar con datos parciales);
`crmAccountId`/`contactId` en la actividad.

## Reglas condicionales

Se validan en el servicio porque dependen de otros campos o del estado:

- Una actividad `NOTE` exige `bodyText`.
- La alianza solo crea acuerdo marco si viene `commitmentAmount`.
- `ConvertLeadDto` exige pipeline y etapa: una oportunidad sin ubicación en el pipeline no es
  medible.

## Ejemplo de solicitud

```json
POST /crm/leads/{id}/convert
{
  "pipelineId": "11111111-1111-1111-1111-111111111111",
  "stageId": "22222222-2222-2222-2222-222222222222",
  "opportunityName": "Contrato anual Clínica Sur",
  "amount": "15000.00"
}
```

## Ejemplo de respuesta

```json
{
  "leadId": "33333333-3333-3333-3333-333333333333",
  "opportunityId": "44444444-4444-4444-4444-444444444444"
}
```

Reintentar la conversión del mismo lead devuelve `409` con el id de la oportunidad ya creada, en vez
de generar una segunda.
