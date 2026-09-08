# Informe de cobertura ALOVIDA (estático)

- Entidades (tablas mapeadas): **1190**
- Endpoints declarados: **916** en 198 controllers
- Módulos: **58**

## ORPHAN_TABLE — entidades sin consumidor fuera de `entities/` (4)
> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.
- `organization_extensions` · DataUseAgreements (src/modules/organization_extensions/entities/data_use_agreements.entity.ts)
- `payments` · CashRegisters (src/modules/payments/entities/cash_registers.entity.ts)
- `pharmacy_inventory` · PurchaseQuotations (src/modules/pharmacy_inventory/entities/purchase_quotations.entity.ts)
- `system_ops` · AcceptedRisks (src/modules/system_ops/entities/accepted_risks.entity.ts)

## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (1)
- src/modules/audio_assets/controllers/audio-assets.controller.ts:28 — @Post 'resolve'

## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (0)
