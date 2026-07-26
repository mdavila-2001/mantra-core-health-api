# clinical_ext / dto

Contratos de entrada/salida con `class-validator` + `class-transformer` +
`@nestjs/swagger`. Los request DTO validan tipos, requeridos, longitudes, uuids y
enums; los response DTO exponen solo campos seguros (nunca fugan columnas internas).

- `care-team.dto.ts` — `CreateCareTeamDto`, `CareTeamMemberInputDto`, `CareTeamResponseDto`.
- `cds.dto.ts` — `CreateCdsRuleDto`, `PublishRuleVersionDto`, `EvaluateCdsDto`,
  `CheckInteractionsDto`, `CreateDrugInteractionDto`, `CdsRuleResponseDto`, `AlertBatchResponseDto`.
- `clinical-alert.dto.ts` — `OverrideAlertDto`, `ClinicalAlertResponseDto`.
- `order-set.dto.ts` — `CreateOrderSetDto`, `ApplyOrderSetDto`, `OrderSetResponseDto`, `ApplyOrderSetResponseDto`.
- `referral.dto.ts` — `CreateReferralDto`, `RespondReferralDto`, `ReferralResponseDto`.
- `care-gap.dto.ts` — `RecomputeCareGapsDto`, `CloseCareGapDto`, `ProjectImmunizationPlanDto`,
  `CreateImmunizationScheduleDto`, y sus responses.
- `virtual-encounter.dto.ts` — `CreateVirtualEncounterDto`, `EndVirtualEncounterDto`, `VirtualEncounterResponseDto`.
- `operation-result.dto.ts` — `StatusResultDto` (`{ ok }`).
