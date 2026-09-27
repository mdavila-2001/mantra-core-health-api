# Contrato — Campañas preventivas de la aseguradora (Proceso 4 · M-06, Tarea 4)

- **Versión:** 1.1 · **Fecha:** 2026-09-26 (v1.0: 2026-09-25)
- **Módulo:** `src/modules/insurance` · **Esquema:** `insurance` (parche del modelo `v4223`)
- **Plan y evidencia:** `docs/trabajo/2026-09-25-insurance-preventive-campaigns/` (v1.0) y
  `docs/trabajo/2026-09-26-campanas-aseguradora/` (v1.1 — certificación contra el prompt de
  Tarea 4 y cierre de brechas)

## 1. Propósito y trazabilidad

El registro de procesos del cliente, módulo Aseguradora de salud, «MODULO DE PROMOCIONES» (§6.4), pide:

> En alianza con las empresas importadoras de medicamentos y fabricantes de medicamentos se realizarán campañas de la mano del seguro, el objetivo es la prevención de las enfermedades, AYUDANDO CON ESTO a que no suban las PRIMAS y el seguro NO EROGUE DINERO en la gestión por estas enfermedades. Se realizarán campañas de la mano de las empresas de Laboratorios para prevenir enfermedades.

La verificación del 2026-09-25 lo marcaba **FALTA** en API y en ambos frentes (anexo E, filas A4.1 y A4.2). Fuentes: `mantra_core_technologies_health_docs/SALUD/📋 Registro de procesos por módulo.md` §6.4 y `AlovidaPromptManager/docs/requisitos/REQUISITOS-CLIENTE-ALOVIDA.md:555-559`.

## 2. Actores

| Actor | Qué hace | Cómo se autoriza |
|---|---|---|
| Administrador de la aseguradora (OWNER/ADMIN del tenant) | Crea, edita, activa/pausa/finaliza campañas | Membresía activa con rol de administración en el **tenant activo** (`X-Tenant-Id`) |
| `INSURANCE_OPERATOR` (rol global del JWT) | Igual que el administrador, sin ser OWNER/ADMIN | Membresía activa **en el tenant** (cualquier rol, típicamente STAFF) + rol `INSURANCE_OPERATOR` |
| Miembro de la aseguradora (STAFF, sin `INSURANCE_OPERATOR`) | Lista y consulta campañas | Membresía activa en el tenant activo |
| Plataforma (`SECURITY_ADMIN`, `SUPERADMIN`) | Igual que el administrador, sobre la aseguradora que indique `X-Tenant-Id` | Rol de plataforma |
| Afiliado | Ve las campañas vigentes de su aseguradora | Titularidad de su perfil contra el JWT (`assertOwnsPatientProfile`); `GET .../my-benefits` la resuelve directo del claim `pid` |
| Público (sin token) | Ve las campañas vigentes de cualquier aseguradora | Ninguna: `GET .../active` es `@Public()` |

El claim `tenantTypes` del JWT es dato de presentación y **no autoriza nada**.
`INSURANCE_ADMIN`, el rol que nombra el prompt del cliente, **no existe como rol IAM**: equivale
a la membresía OWNER/ADMIN de la fila de arriba — es la autoridad real, no un rol adicional
(v1.1, ambigüedad A16).

## 3. Decisión de producto D4: la campaña se anuncia, no se dirige

La verificación del 2026-09-25 dejó abierta la decisión **D4**: dirigir campañas a pacientes por su diagnóstico exige un consentimiento específico que el sistema no tiene. Por eso:

- La campaña se muestra a **todos los afiliados con cobertura vigente** de la aseguradora que la creó.
- `targetConditionCode` (CIE-10) **describe** la patología que se previene. Nunca se cruza con `clinical.conditions` ni con ningún dato clínico del afiliado.
- Ningún endpoint de este contrato acepta un filtro por diagnóstico del afiliado.

## 4. Modelo

| Tabla | Contenido |
|---|---|
| `insurance.insurance_campaigns` | Aseguradora, `code` único por aseguradora, título, descripción, tipo, patología CIE-10 opcional, `copay_bonus_percentage` (0..100), vigencia `valid_from`/`valid_to`, estado y `activated_at` |
| `insurance.insurance_campaign_partners` | Aliados: rol `SPONSOR` (importadora o fabricante que financia) o `PROVIDER` (laboratorio, farmacia o centro donde se atiende), tipo, nombre, referencia blanda `partner_tenant_id` y `network_provider_membership_id` opcional |

`partner_tenant_id` no tiene FK física: las importadoras y fabricantes no son tenants del sistema. El precedente es `network_provider_memberships.provider_entity_id`.

Dos CHECK en base de datos respaldan las reglas de §6: `ck_insurance_campaigns_valid_period` y `ck_insurance_campaigns_copay_bonus_range`.

## 5. Estados y transiciones

```
DRAFT ──► ACTIVE ◄──► PAUSED
             │           │
             ▼           ▼
          EXPIRED ◄──────┘        (terminal)
```

| Desde | Hacia |
|---|---|
| `DRAFT` | `ACTIVE` |
| `ACTIVE` | `PAUSED`, `EXPIRED` |
| `PAUSED` | `ACTIVE`, `EXPIRED` |
| `EXPIRED` | ninguna |

- Repetir el estado actual es idempotente: responde 200 sin escribir ni auditar.
- `EXPIRED` es cierre administrativo y no se reabre: se crea otra campaña con otro código.
- Activar una campaña cuyo `valid_to` ya pasó responde 422.
- **Vencimiento efectivo por fecha:** una campaña `ACTIVE` con `valid_to` pasado deja de verse
  para el afiliado aunque nadie la haya cerrado. No hay cron; la consulta filtra por fecha. Desde
  v1.1, la vista de la aseguradora (`InsuranceCampaignResponseDto`) expone además `effectiveStatus`
  (`EXPIRED` si `valid_to` ya pasó y `status` sigue `ACTIVE`/`PAUSED`) sin mutar `status`; y el
  filtro `?status=ACTIVE` del listado administrativo excluye las vencidas por la misma regla.

## 6. Reglas de negocio y errores

| Regla | Respuesta |
|---|---|
| `validTo` anterior a `validFrom` | 400 |
| `copayBonusPercentage` fuera de 0..100 o con más de 2 decimales | 400 (DTO) |
| `code` fuera de `^[A-Z0-9][A-Z0-9-]{2,39}$` | 400 (DTO) |
| Sin aliados, o más de 20 | 400 (DTO) |
| `activate=true` con `validTo` anterior a hoy | 400 |
| `targetConditionCode` que el catálogo CIE-10 no conoce | 400 |
| `code` repetido en la misma aseguradora | 409 (también ante una carrera: el filtro global convierte la violación de unicidad) |
| Transición fuera de la tabla de §5, o activar una vencida | 422 (`PreconditionFailedException`) |
| Editar (`PATCH :id`) una campaña `ACTIVE`/`EXPIRED` | 422: hay que pausarla primero |
| Aliado con `networkProviderMembershipId` de la red de OTRA aseguradora | 422 |
| Campaña inexistente en ninguna aseguradora | 404 |
| Campaña que existe en OTRA aseguradora (`GET :id`, `PATCH :id/status`, `PATCH :id`) | 403 y auditoría `INSURANCE_CAMPAIGN_ACCESS_DENIED` (v1.1 — revierte la v1.0, ver A17) |
| Actor sin administración de una aseguradora al mutar | 403 y auditoría `INSURANCE_CAMPAIGN_ACCESS_DENIED` (v1.1) |
| Organización activa que no es aseguradora | 403 y auditoría `INSURANCE_CAMPAIGN_ACCESS_DENIED` (v1.1) |
| Plataforma sin `X-Tenant-Id` | 422 con la pista |
| Perfil que no es del titular | 403 y auditoría `INSURANCE_CAMPAIGN_ACCESS_DENIED` |
| Cuenta sin perfil de paciente en `GET .../my-benefits` | 403 |

Un actor **sin tenant activo** que no es plataforma recibe 403 antes que cualquier validación, para que un paciente nunca vea 400 ni 412 al intentar mutar. Desde v1.1, **todo 403 de esta tabla que involucre `insurance_campaigns` deja una fila en `audit.audit_log`** — antes sólo lo hacía el de IDOR del afiliado.

## 7. Endpoints

Ruta canónica **`insurance/campaigns`**, con alias **deprecado** `insurance-campaigns` mientras
el front y los artefactos generados (Postman, OpenAPI) terminan de migrar (v1.1 — retirar el alias
en la próxima promoción de este módulo). Todos autenticados menos `active`; `@Roles()` vacío en
los demás, el servicio decide por membresía o titularidad.

| Método y ruta | Quién | Respuesta |
|---|---|---|
| `POST insurance/campaigns` | Administrador | 201 `InsuranceCampaignResponseDto` |
| `GET insurance/campaigns` | Miembro | 200 `InsuranceCampaignPageDto` (cursor opaco, `type`, `status`, `limit` 1..100) |
| `GET insurance/campaigns/active` | **Público**, sin token | 200 `PatientCampaignDto[]`, de cualquier aseguradora o de una sola con `?carrierId=` |
| `GET insurance/campaigns/my-benefits` | Afiliado (perfil del JWT) | 200 `PatientCampaignDto[]` |
| `GET insurance/campaigns/patient/:patientProfileId` | Titular | 200 `PatientCampaignDto[]` |
| `GET insurance/campaigns/:id` | Miembro | 200 `InsuranceCampaignResponseDto` |
| `PATCH insurance/campaigns/:id/status` | Administrador | 200 `InsuranceCampaignResponseDto` |
| `PATCH insurance/campaigns/:id` | Administrador | 200 `InsuranceCampaignResponseDto` — edición parcial, sólo `DRAFT`/`PAUSED` |

Orden de declaración: `active`, `my-benefits` y `patient/:patientProfileId` van **antes** que
`:id`, si no Nest los leería como un identificador. El perfil de `patient/:patientProfileId`
viaja en la URL a propósito, para que un intento sobre el perfil de otro afiliado sea verificable
y auditable — se conserva junto a `my-benefits` exactamente para ese caso de IDOR explícito.

## 8. Qué ve el afiliado

`PatientCampaignDto` se arma campo por campo y **no incluye** `insuranceCarrierId`, `partnerTenantId`, ids de usuario, fechas de auditoría ni el estado. Solo llegan campañas que cumplen todo esto:

1. Estado `ACTIVE`.
2. `valid_from <= hoy <= valid_to`, con «hoy» como día civil de `America/La_Paz`.
3. De la aseguradora de una **cobertura vigente** del propio afiliado.

Una cobertura cuenta como vigente solo si `patientCoverageValidity` da `CURRENT`: cobertura y plan activos y la fecha dentro de ambos rangos. Una vigencia `UNKNOWN` no cuenta: ante la duda no se anuncia. Es la misma regla que ya usa `DeclaredCoveragesReader`.

## 9. Ambigüedades y desvíos

| ID | Asunción | Quién confirma |
|---|---|---|
| A1 | Número de parche `v4223`: el `v4222` solo aparece en un mensaje de commit del modelo | Justin |
| A2 | `copay_bonus_percentage` es `numeric` sin precisión, como el resto del módulo; los 2 decimales se exigen en el DTO | — |
| A3 | Un paciente sin tenant activo recibe 403 (no 412) al mutar | Pablo |
| A5 | Las 12 FK nuevas quedan «inferidas por convención» en el DDL porque la bóveda no tiene sus fichas | Pablo |
| A6 | `partner_tenant_id` sin FK física | Pablo |
| A7 | `EXPIRED` es manual; no hay cron de vencimiento | Justin |
| A9 | Plataforma pasa `assertOwnsPatientProfile`; el 403 de IDOR se prueba con un segundo paciente | — |
| A15 | Solo cobertura `CURRENT` cuenta; `UNKNOWN` no | Justin |
| A16 | `INSURANCE_ADMIN` del prompt del cliente ≡ membresía OWNER/ADMIN del tenant aseguradora; no se crea un rol IAM nuevo (v1.1) | Justin |
| A17 | `PATCH :id` edita sólo en `DRAFT`/`PAUSED` (no `ACTIVE`, para no reescribir lo que un afiliado ya vio); `code` y, fuera de `DRAFT`, `campaignType` quedan inmutables (v1.1) | Producto |
| D-1 | En este código `PreconditionFailedException` responde **422**, no 412 | — |
| D-2 | `DRAFT` no puede pasar a `EXPIRED`: una campaña abandonada en borrador no se cierra, se deja | Justin |
| D-3 | **(v1.0, superada en v1.1).** Los conceptos de estado, tipo y aliado llevan traducción en `terminology-designations.es.ts` desde v1.1: se publicaron los 4 value sets dinámicos (`insurance-campaign-status/-type/-partner-role/-partner-type`) en `DYNAMIC_ENUM_CATALOG`. El front puede dejar de rotular con su mapa cerrado | — |
| D-4 | **(v1.0, superada en v1.1).** `yarn orm:catalog` se regeneró en v1.1 con la bóveda al día (PR docs #84), acotado a mano al schema `insurance` para no arrastrar deriva ajena de otros módulos (pharma_lab/data_catalog/qa_execution) | Pablo |
| D-5 | `database/SQL` de la API **no** se refrescó con espejo (`--delete`): en `origin/dev` ya difería del modelo (4 parches propios de la API y 2 archivos distintos). Se copiaron solo los archivos de esta tarea | Pablo |
| D-6 | CA-02: una campaña que existe en otra aseguradora responde **403 auditado** desde v1.1, no 404 silencioso (revierte D-4 de la v1.0 original de este contrato); no habilita enumeración porque los `id` son UUIDv4 | Justin |

## 10. Fuera de alcance

- Segmentar afiliados por diagnóstico (D4).
- Canje real en farmacia: no existe ruta de canje ni voucher (el botón del front navega al
  directorio de farmacias o a agendar, nunca canjea).
- Cron que marque `EXPIRED` al vencer: `effectiveStatus` (v1.1) lo deriva por fecha en cada
  respuesta, sin escribir nada.
- Métricas de impacto actuarial de la campaña (conteo de afiliados alcanzados, canjes): el
  front deriva localmente número de aliados y días restantes; no hay endpoint para eso.
- `fixedCopayAmount` y un valor comodín `ALL_ALLIED_PROVIDERS` para «todos los prestadores»: el
  modelo exige 1..20 aliados explícitos y sólo tiene `copay_bonus_percentage`; ampliarlo es una
  promoción de modelo aparte, no de este contrato.
