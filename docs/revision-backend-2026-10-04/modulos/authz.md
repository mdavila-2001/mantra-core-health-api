# Revisión del módulo `authz` — ALOVIDA

## Alcance y evidencia

Se revisaron los controladores y servicios de catálogo, roles, grants, relaciones asistenciales, representación legal, accesos clínicos, break-the-glass, PDP y sus repositorios. Esta pasada complementa la [revisión transversal de autorización](../transversal/authz-transversal.md): aquella comprobó el encadenamiento HTTP común, RLS y rutas de otros dominios; este informe comprueba que los recursos que **crea y consume `authz`** mantengan la misma custodia clínica.

`corepack yarn test src/modules/authz --runInBand --silent` aprobó **17 suites y 108 pruebas**. Esas pruebas usan repositorios simulados y cubren reglas de vigencia, duplicados y delegación de controladores; no incluyen dos tenants ni un paciente, encuentro o consentimiento de otra custodia.

## Hallazgo confirmado

### AUTHZ-M01 — Crítica — los grants clínicos pueden enlazar un paciente ajeno al tenant del actor

El interceptor transversal sólo contrasta los campos de propiedad explícitos `tenantId` y `custodianTenantId`; no puede inferir la custodia de `patientProfileId`, `encounterId` ni `consentId` ([`tenant-scope.ts`](../../../src/common/tenant/tenant-scope.ts#L5-L22), [`tenant-context.interceptor.ts`](../../../src/common/tenant/tenant-context.interceptor.ts#L124-L145)). Eso impide elegir arbitrariamente el `tenantId` del cuerpo, pero no prueba que las referencias clínicas pertenezcan a ese tenant.

Las dos rutas de mayor impacto son de `CLINICAL_APPROVER` o `SECURITY_ADMIN` ([`authz-clinical.controller.ts`](../../../src/modules/authz/controllers/authz-clinical.controller.ts#L21-L74)). `grantClinicalAccess` no carga ni contrasta paciente, usuario destinatario, encuentro o consentimiento: busca sólo un grant activo por paciente/usuario y persiste los IDs proporcionados ([`authz-clinical.service.ts`](../../../src/modules/authz/services/authz-clinical.service.ts#L72-L138)). `breakTheGlass` tampoco resuelve el paciente ni el encuentro y crea, con el `tenantId` del DTO, el grant elevado, sesión y evento de auditoría ([`authz-clinical.service.ts`](../../../src/modules/authz/services/authz-clinical.service.ts#L147-L239)). El repositorio confirma que la consulta PDP de grants activos usa usuario y paciente, sin `tenantId` ([`clinical-access-grants.repository.ts`](../../../src/modules/authz/repositories/clinical-access-grants.repository.ts#L84-L95)).

El mismo patrón alcanza las relaciones asistenciales y la representación legal: las altas aceptan `patientProfileId` y `tenantId` del DTO y persisten ambos sin cargar el perfil ni verificar su custodia ([`authz-care-relationships.service.ts`](../../../src/modules/authz/services/authz-care-relationships.service.ts#L112-L155), [`…:444-L499`](../../../src/modules/authz/services/authz-care-relationships.service.ts#L444-L499)). La respuesta del paciente sí compara el perfil del actor con el de la relación, una protección posterior que no corrige una relación creada con custodia incongruente ([`…:206-L225`](../../../src/modules/authz/services/authz-care-relationships.service.ts#L206-L225)).

**Escenario.** Un aprobador del tenant A presenta un `tenantId=A` válido y un `patientProfileId` de B. El interceptor acepta el tenant del cuerpo. Los servicios vistos persisten el grant o relación con `tenantId=A` y ese paciente, sin consulta al módulo de perfiles ni al encuentro. Luego el PDP encuentra el grant por `(grantedUserId, patientProfileId)` sin acotar tenant. Con RLS apagado por defecto, no existe una barrera de base que refute este flujo; con RLS activo, la inserción sigue quedando en A, por lo que se necesita verificar la referencia antes de persistir. No se ejecutó explotación con base real: el resultado se sostiene por el camino de código leído.

**Plan.** Crear una resolución clínica única que cargue el paciente con su tenant/custodia y, cuando estén presentes, el encuentro y consentimiento; comprobar que todos pertenecen al mismo paciente y tenant activo antes de crear o revocar bases de acceso. Derivar el tenant de ese recurso autorizado, en lugar de volver a tomarlo del DTO. Aplicar la verificación también a relaciones y representación legal; mantener las comprobaciones ya existentes de actor paciente. La denegación debería conservar 404 uniforme fuera de alcance, con `ErrorCode.NOT_FOUND` y razones catalogadas propuestas `AUTHZ_PATIENT_OUT_OF_SCOPE`, `AUTHZ_ENCOUNTER_PATIENT_MISMATCH` y `AUTHZ_CONSENT_PATIENT_MISMATCH`. Esto además corrige la ausencia de `details.reason` ya inventariada de forma transversal en [`catalogo-errores.md`](../transversal/catalogo-errores.md).

| Caso | Prueba dirigida | Resultado esperado tras corregir |
| --- | --- | --- |
| Correcto | `authz-clinical.service.spec.ts`: aprobador de A concede `READ` a usuario de A sobre paciente P-A y consentimiento/encuentro de P-A | Crea grant, auditoría y outbox con tenant A; PDP lo evalúa para P-A |
| Límite | Misma prueba: `patientProfileId=P-A`, sin encuentro, con `purposeOfUse=TREATMENT` | Alta válida; sólo se permite la ausencia de consentimiento prevista por tratamiento directo |
| Error | Aprobador de A usa `tenantId=A` y `patientProfileId=P-B`; repetir con `encounterId` de otro paciente | No crea grant, sesión BTG, relación ni auditoría de acceso; no consulta PDP de éxito |
| Falla catalogada | E2E `test/integration/authz-clinical-scope.int-spec.ts`: `POST /authz/patients/P-B/break-the-glass` con sesión de A y DTO de A | `404 / NOT_FOUND / AUTHZ_PATIENT_OUT_OF_SCOPE`, sin grant ni break-glass session |

## Controles verificados

El guard/interceptor global exige JWT y resuelve el tenant antes de comparar los campos propietarios del request. El controlador de revocación de autoservicio `authz/me` resuelve el perfil paciente de sesión y rechaza una relación o grant de otro titular antes de delegar ([`authz-me.service.ts`](../../../src/modules/authz/services/authz-me.service.ts#L132-L185)). El PDP implementa deny-overrides, vigencia y bases legítimas; esos controles no incorporan la custodia del grant cuando lo consulta por usuario y paciente. Las excepciones de este módulo tampoco aportan `details.reason` estable, que corresponde al hallazgo transversal de contrato y no se cuenta de nuevo aquí.
