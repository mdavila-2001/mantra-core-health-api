# Contrato — Campañas preventivas de la aseguradora (Proceso 4 · M-06, Tarea 4)

- **Versión:** 1.0 · **Fecha:** 2026-09-25
- **Módulo:** `src/modules/insurance` · **Esquema:** `insurance` (parche del modelo `v4223`)
- **Plan y evidencia:** `docs/trabajo/2026-09-25-insurance-preventive-campaigns/`

## 1. Propósito y trazabilidad

El registro de procesos del cliente, módulo Aseguradora de salud, «MODULO DE PROMOCIONES» (§6.4), pide:

> En alianza con las empresas importadoras de medicamentos y fabricantes de medicamentos se realizarán campañas de la mano del seguro, el objetivo es la prevención de las enfermedades, AYUDANDO CON ESTO a que no suban las PRIMAS y el seguro NO EROGUE DINERO en la gestión por estas enfermedades. Se realizarán campañas de la mano de las empresas de Laboratorios para prevenir enfermedades.

La verificación del 2026-09-25 lo marcaba **FALTA** en API y en ambos frentes (anexo E, filas A4.1 y A4.2). Fuentes: `mantra_core_technologies_health_docs/SALUD/📋 Registro de procesos por módulo.md` §6.4 y `AlovidaPromptManager/docs/requisitos/REQUISITOS-CLIENTE-ALOVIDA.md:555-559`.

## 2. Actores

| Actor | Qué hace | Cómo se autoriza |
|---|---|---|
| Administrador de la aseguradora (OWNER/ADMIN del tenant) | Crea campañas y las activa, pausa o finaliza | Membresía activa con rol de administración en el **tenant activo** (`X-Tenant-Id`) |
| Miembro de la aseguradora (STAFF) | Lista y consulta campañas | Membresía activa en el tenant activo |
| Plataforma (`SECURITY_ADMIN`, `SUPERADMIN`) | Igual que el administrador, sobre la aseguradora que indique `X-Tenant-Id` | Rol de plataforma |
| Afiliado | Ve las campañas vigentes de su aseguradora | Titularidad de su perfil contra el JWT (`assertOwnsPatientProfile`) |

El claim `tenantTypes` del JWT es dato de presentación y **no autoriza nada**.

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
- **Vencimiento efectivo por fecha:** una campaña `ACTIVE` con `valid_to` pasado deja de verse para el afiliado aunque nadie la haya cerrado. No hay cron; la consulta filtra por fecha.

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
| Campaña inexistente o de otra aseguradora | 404, sin distinguir los dos casos |
| Actor sin administración de una aseguradora al mutar | 403 |
| Organización activa que no es aseguradora | 403 |
| Plataforma sin `X-Tenant-Id` | 422 con la pista |
| Perfil que no es del titular | 403 y auditoría `INSURANCE_CAMPAIGN_ACCESS_DENIED` |

Un actor **sin tenant activo** que no es plataforma recibe 403 antes que cualquier validación, para que un paciente nunca vea 400 ni 412 al intentar mutar.

## 7. Endpoints

Todos con `@Roles()` vacío (autenticado); el servicio decide por membresía o titularidad.

| Método y ruta | Quién | Respuesta |
|---|---|---|
| `POST /insurance-campaigns` | Administrador | 201 `InsuranceCampaignResponseDto` |
| `GET /insurance-campaigns` | Miembro | 200 `InsuranceCampaignPageDto` (cursor opaco, `type`, `status`, `limit` 1..100) |
| `GET /insurance-campaigns/patient/:patientProfileId` | Titular | 200 `PatientCampaignDto[]` |
| `GET /insurance-campaigns/:id` | Miembro | 200 `InsuranceCampaignResponseDto` |
| `PATCH /insurance-campaigns/:id/status` | Administrador | 200 `InsuranceCampaignResponseDto` |

`patient/:patientProfileId` se declara **antes** que `:id`. El id del perfil viaja en la URL a propósito, para que un intento sobre el perfil de otro afiliado sea verificable y auditable.

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
| D-1 | En este código `PreconditionFailedException` responde **422**, no 412 | — |
| D-2 | `DRAFT` no puede pasar a `EXPIRED`: una campaña abandonada en borrador no se cierra, se deja | Justin |
| D-3 | Los conceptos de estado, tipo y aliado **no** llevan traducción en `terminology-designations.es.ts`: esa tabla solo admite conceptos de un conjunto de valores publicado y su prueba rechaza los sobrantes. El front rotula con su propio mapa cerrado | — |
| D-4 | `yarn orm:catalog` no se regeneró: lee la bóveda documental, que no tiene fichas de las tablas nuevas y trae deriva ajena; regenerarlo borraba catálogos de otros módulos | Pablo |
| D-5 | `database/SQL` de la API **no** se refrescó con espejo (`--delete`): en `origin/dev` ya difería del modelo (4 parches propios de la API y 2 archivos distintos). Se copiaron solo los archivos de esta tarea | Pablo |

## 10. Fuera de alcance

- Segmentar afiliados por diagnóstico (D4).
- Canje real en farmacia: no existe ruta de canje.
- Edición completa de una campaña: solo alta y cambio de estado.
- Cron que marque `EXPIRED` al vencer.
- Métricas de impacto actuarial de la campaña.
