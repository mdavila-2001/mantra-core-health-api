# Coberturas y copagos del paciente

Esta guía describe el contrato implementado para asociar un reclamo al pedido exacto de farmacia o a una orden diagnóstica y publicar su liquidación para el paciente. Los importes representan responsabilidad adjudicada; no calculan saldos después de pagos ni alteran el cobro.

## Estado de la entrega

La lectura real de `GET /profiles/patients/me` sobre API compilada y PostgreSQL aislado responde 200, con identidades estables, cobertura 80.25, copago 0 y deducible 10.50. La corrección del parámetro PostgreSQL pasó 114 pruebas, lint y compilación. El contrato OpenAPI final está generado y auditado. El primer recorrido de perfil real pasó 2/2, pero la inspección encontró un estado contradictorio por el prefijo de códigos de catálogo; la corrección posterior pasó 148 pruebas, lint, compilación, typecheck global final (incluye specs) y lectura HTTP de dos pacientes. Póliza y beneficio están CURRENT; el segundo paciente conserva su identidad sin recibir la póliza o el plan del primero. El recorrido final de perfil pasó 2/2 en 26.6 s y ambas capturas (1440×900 y 390×844) fueron inspeccionadas: contenido vigente, importes legibles y sin desbordes. El tráfico comprobó login/perfil 200 vía proxy 4215 y cero intentos al puerto 3000, usando exclusivamente participantes sintéticos creados por HTTP. El recorrido financiero completo tampoco está acreditado; estos resultados parciales no representan una entrega terminada.

Resuelto 2026-09-13: la condición `verificationStatusConceptId === INS.VERIFY_VERIFIED`, añadida accidentalmente al alta vinculada, se retiró de `LinkedClaimAccessService.coverageForOrder(..., requireCurrent: true)`. Ninguna escritura del módulo produce `VERIFY_VERIFIED`; una cobertura declarada (`VERIFY_PENDING`) basta para presentar el reclamo, siempre que esté activa y vigente — mismo patrón que `practitioner_affiliations` (v4.1.9). La aseguradora sigue pudiendo adjudicar o denegar.

El modelo y sus fuentes se revisan en [modelo #19](https://github.com/mantra-core-technologies/mantra-core-health-model/pull/19) y [bóveda #73](https://github.com/mdavila-2001/mantra_core_technologies_health_docs/pull/73). La evidencia final de perfil se conserva en el [seguimiento de bóveda #74](https://github.com/mdavila-2001/mantra_core_technologies_health_docs/pull/74), con plan y walkthrough anteriores preservados. Las capturas de participantes sintéticos permanecen en esa bóveda privada; el flujo financiero conserva su verificación pendiente.

## Lecturas del paciente

| Ruta | Contrato relevante |
| --- | --- |
| `GET /profiles/patients/me` | `coverages`, conservando los demás datos del perfil y tutores. |
| `GET /pharmacy/orders/:id` | `PharmacyOrderDto`, con `reservationLines`, `insuranceSettlement` e `insuranceSettlementAvailability`. |
| `GET /pharmacy/orders/me` | `items` de pedidos; cada uno incluye la proyección de liquidación. |
| `GET /diagnostic-results/me/orders` | `items` por orden con liquidación, preparación y referencias a resultados liberados. |

Cada cobertura expone una identidad estable `id`, nombre de aseguradora y plan, `policyIdentifier`, `memberIdentifier`, `verified`, estado catalogado y `validityStatus`. Conserva también `planId` y el orden de prioridad existente. `referenceDate` es una fecha civil de `America/La_Paz`; `effectiveFrom` y `effectiveTo` no deben desplazarse por conversión de zona horaria.

`benefits` contiene filas con identidad propia, categoría, servicio específico cuando exista, `coveragePercent`, `copayAmount`, `deductibleAmount` y vigencia. Puede haber varias filas de la misma categoría. Los valores ausentes del perfil se omiten: no equivalen a cero. Las coberturas futuras, vencidas o inactivas siguen siendo visibles con su estado. Un identificador provisional no prueba una afiliación verificada.

`currencyCode` procede del catálogo; `Bs` corresponde únicamente a `BOB`. `carrierWhatsappNumber` y `carrierCallCenterPhone` son canales independientes. La respuesta no publica JSON administrativo ni convierte las exclusiones generales del plan en la cláusula de una denegación concreta.

## Autorización y privacidad

| Operación vinculada | Actor autorizado |
| --- | --- |
| Crear reclamo o autorización previa | Membresía activa `OWNER`/`ADMIN` del tenant prestador del pedido. |
| Adjudicar, publicar EOB o revertir reclamo | Membresía activa `OWNER`/`ADMIN` del tenant de la aseguradora del reclamo. |
| Leer la liquidación de un pedido | Titular resuelto desde la cuenta autenticada y su vínculo persistente con el paciente. |

Se conservan los accesos administrativos de plataforma del servicio de administración de tenants. El tenant activo debe corresponder al prestador o aseguradora que realiza la operación. Un UUID válido o un rol de otro tenant no conceden acceso.

Los reclamos genéricos sin origen de pedido conservan su protección histórica en el servicio (`BILLING`, `FINANCE`, `SUPERADMIN`). El flujo vinculado usa membresías y no depende de que `BILLING` o `FINANCE` existan en el mapeo efectivo de roles. No se amplía la protección histórica de disputas ni de otras rutas por esta guía.

La lectura de seguros comprueba la titularidad antes de consultar pólizas o EOB y carga la información por lotes. El acceso operativo al pedido de farmacia conserva sus propias reglas y no concede acceso a la póliza ni a la EOB privada: la vista de personal devuelve `insuranceSettlement: null` y `NOT_AVAILABLE`. La lectura diagnóstica enriquece solamente las órdenes del titular y conserva preparación y resultados liberados.

## Preparar un reclamo de farmacia

El pedido debe estar confirmado, dentro del período válido de retiro y sin sustituciones pendientes. El alta se hace antes del retiro o de una dispensación parcial. Cada reclamo representa el pedido completo; no se asocia por receta, paciente, nombre o fecha.

Obtenga un `PharmacyOrderDto` mediante una lectura autorizada del pedido. `lines` es la presentación del pedido; `reservationLines` identifica las porciones físicas congeladas necesarias para crear el reclamo:

| Campo de `reservationLines[]` | Uso |
| --- | --- |
| `id` | Se envía como `inventoryReservationLineId`. |
| `productId` | Producto de farmacia de esa porción. |
| `quantity` | Cantidad congelada, como cadena decimal. |
| `unitPriceAmount` | Precio unitario congelado, nullable. |
| `billedAmount` | Importe facturado de esa porción, nullable. |
| `currencyConceptId` | Moneda congelada, nullable. |

No sustituya un `null` por cero ni combine porciones distintas con la misma receta o producto. Si faltan importes o moneda, no prepare un reclamo definitivo a partir de esa respuesta. La API vuelve a resolver y validar paciente, prestador, cantidades, importes y moneda desde las filas persistentes.

En `POST /insurance-claims`, seleccione explícitamente `patientCoverageId` e `insuranceCarrierId`. Envíe `billingProviderEntityId = order.pharmacyId`, `inventoryReservationId = order.id` y una línea por cada porción congelada. No envíe `serviceRequestId` ni `diagnosticStudyOfferingId` para este origen. La API resuelve el tipo real de facturador como farmacia.

Correspondencia de campos del cuerpo:

```ts
const lines = order.reservationLines.map((portion, index) => ({
  lineSequence: index + 1,
  inventoryReservationLineId: portion.id,
  quantity: portion.quantity,
  billedAmount: portion.billedAmount,
}));

const body = {
  insuranceCarrierId,
  patientCoverageId,
  billingProviderEntityId: order.pharmacyId,
  inventoryReservationId: order.id,
  claimIdentifier,
  idempotencyKey,
  lines,
};
```

Este mapeo presupone haber comprobado que los campos nullable necesarios tienen valor. `currencyConceptId` es opcional para farmacia: se resuelve del pedido y, si se declara, debe coincidir. `serviceConceptId` y `quantity` pueden omitirse en cada línea; si se declaran, deben coincidir con el pedido. `billedAmount` es obligatorio y debe ser exacto. `patientResponsibilityAmount` no adjudica un cargo en este flujo: omítalo; un valor no nulo distinto de cero se rechaza.

## Preparar un reclamo diagnóstico

Use el mismo `POST /insurance-claims` con `serviceRequestId`, `billingProviderEntityId` de la unidad diagnóstica y `currencyConceptId` explícito. Envíe una sola línea con `diagnosticStudyOfferingId`, cantidad `"1"` e importe `billedAmount` declarado por el prestador autorizado. La oferta debe pertenecer a la unidad y al estudio de la orden; el tenant de la unidad debe ser el prestador asignado.

El importe se congela en las líneas del reclamo. Esta subtarea no incorpora un motor de tarifas. La cobertura seleccionada debe pertenecer al paciente de la orden y resolver al mismo seguro y moneda. No envíe vínculos de farmacia para este origen.

## Respuesta del alta e identidad de las líneas

`POST /insurance-claims` devuelve `201` con `CreatedClaimDto`: `id`, `status`, `createdAt` y, para un reclamo vinculado, `lineIds` ordenados por `lineSequence` ascendente. `status` es el identificador catalogado del estado; no es la etiqueta de disponibilidad del paciente.

Los `lineIds` son las identidades de `insurance_claim_lines` que se necesitan en la adjudicación. Son diferentes de `reservationLines[].id`, que identifica las porciones del pedido. Si el cuerpo se envió desordenado, ordénelo por `lineSequence` para correlacionar la respuesta; no use la posición original sin ordenar.

```json
{
  "id": "<claim-id>",
  "status": "<submitted-status-concept-id>",
  "createdAt": "2026-09-13T20:00:00.000Z",
  "lineIds": ["<claim-line-id>"]
}
```

Los identificadores entre `<...>` son marcadores de documentación y deben sustituirse por valores obtenidos mediante las escrituras y lecturas autorizadas. El ejemplo no representa datos insertados manualmente en PostgreSQL.

El pedido se bloquea transaccionalmente para evitar reclamos activos duplicados. Una repetición con la misma clave de idempotencia y el mismo pedido/cuerpo devuelve el registro existente y sus líneas; cambiar el contenido no crea una segunda liquidación. Después de una reversión puede presentarse un reemplazo conservando el reclamo anterior, siempre que el pedido siga cumpliendo las precondiciones de alta antes de dispensar.

## Autorización previa opcional

El reclamo vinculado puede crearse sin autorización previa. Si se envía `priorAuthorizationRequestId`, la solicitud debe corresponder exactamente a `patientCoverageId` y al mismo origen de pedido.

Para crearla, use `POST /prior-authorization-requests`. En farmacia, declare `inventoryReservationId` y `requestingProviderEntityId` de la farmacia. Puede incluir `medicationRequestId`, pero debe ser la receta de ese pedido; una receta sin `inventoryReservationId` no identifica un pedido exacto y se rechaza. `inventoryReservationId` y `serviceRequestId` son incompatibles tanto en el servicio como en PostgreSQL.

Los `items` de autorización farmacéutica se agrupan por `pharmacyProductId`, con `requestedQuantity` y `requestedAmount` exactos sumados desde sus porciones congeladas; deben representar todos los productos. Esto difiere de las líneas del reclamo, que conservan cada `inventoryReservationLineId` por separado. Para diagnóstico, la autorización contiene una oferta diagnóstica, cantidad `"1"` y moneda explícita.

## Adjudicar y publicar con precisión decimal

Use `POST /insurance-claims/:id/adjudications`. En el flujo vinculado se exige una adjudicación por cada `lineIds[]`, sin faltantes ni duplicados. Aunque los DTO compartidos admiten algunos importes opcionales por compatibilidad histórica, el servicio exige todos los importes explícitos, no negativos y conciliados para el nuevo flujo.

La igualdad es:

```text
100.005 = 60.002 + 10.001 + 30.002
facturado = aporte del seguro + cargo confirmado al paciente + excluido sin asignar
```

Todos esos valores viajan como cadenas. No convierta importes a `Number`, no redondee el reparto para validarlo y no convierta un dato ausente en `"0"`.

Ejemplo de una línea parcialmente cubierta:

```json
{
  "outcome": "APPROVED",
  "totalApprovedAmount": "60.002",
  "totalPatientAmount": "10.001",
  "totalDeniedAmount": "30.002",
  "lineAdjudications": [
    {
      "insuranceClaimLineId": "<claim-line-id>",
      "decision": "APPROVED",
      "approvedAmount": "60.002",
      "patientAmount": "10.001",
      "deniedAmount": "30.002",
      "policyClauseReference": "Cláusula 12.3: el importe indicado queda excluido de esta prestación."
    }
  ]
}
```

La adjudicación devuelve `{ "id": "<adjudication-version-id>" }`. Los únicos valores persistentes de `outcome` y `decision` de este contrato son `APPROVED` y `DENIED`; el resultado para el paciente será `PARTIALLY_APPROVED` en este ejemplo, derivado de las decisiones y los importes. No se añade un estado persistente parcial sólo para presentar la tarjeta.

`policyClauseReference` es obligatoria cuando una línea se deniega o tiene `deniedAmount` distinto de cero, incluso si su decisión es `APPROVED`. Su límite es 255 caracteres; `denialRationale` es opcional, con límite de 4000. La cláusula fundamenta esa exclusión concreta.

Después, `POST /insurance-claims/:id/eob` con `{}` publica la última versión coherente y devuelve `{ "id": "<eob-id>" }`; puede incluirse `documentRecordId` si existe un documento. La EOB se vincula al paciente de la cobertura. Una adjudicación privada todavía no produce un cargo definitivo en las lecturas del paciente.

## Proyección de liquidación y disponibilidad

`insuranceSettlementAvailability` es una clasificación de transporte, no un estado persistente adicional:

| Valor | Comportamiento |
| --- | --- |
| `AVAILABLE` | Hay una única liquidación vigente, completa y publicada para el titular; `insuranceSettlement` contiene sus datos. |
| `PENDING_PUBLICATION` | Existe reclamo coherente sin versión/EOB publicada vigente; incluye un reemplazo pendiente de publicación. |
| `UNDER_REVIEW` | La proyección encuentra reversión, ambigüedad, versión sustituida incoherente, cambios de pedido o datos incompletos. Oculta los importes. |
| `NOT_AVAILABLE` | No hay reclamo vinculado proyectable o el pedido no forma parte del conjunto autorizado/elegible. También se usa en la vista operativa del personal. |

En los tres últimos casos, `insuranceSettlement` es `null`. Una EOB retirada o duplicada se clasifica como `UNDER_REVIEW`; no se reutiliza silenciosamente una publicación anterior.

Con `AVAILABLE`, `PatientInsuranceSettlementDto` contiene `claimId`, `claimIdentifier`, `adjudicationVersionId`, `adjudicationVersion`, `eobId`, `carrierName`, `policyIdentifier` nullable, los cuatro totales como cadenas, `currencyCode`, `result` y `exclusions`.

Cada exclusión contiene `claimLineId`, `itemId`, `itemName`, `amount`, `policyClauseReference` y `denialRationale` nullable. La farmacia usa la identidad de la porción reservada; diagnóstico, la identidad de la oferta. La respuesta no convierte una cláusula histórica ausente en una cláusula inventada: retira la liquidación definitiva de la proyección hasta resolver la inconsistencia.

`totalPatientAmount` se muestra como «A tu cargo» y `totalDeniedAmount` como «Excluido sin asignar». Un rechazo total puede conservar cargo al paciente `"0"` e importe excluido igual al facturado. El rechazo del seguro no se convierte automáticamente en deuda y se diferencia del rechazo logístico de farmacia.

## Versiones, reversión y dispensación

Cada adjudicación nueva añade una versión y sus decisiones; enlaza `supersedesVersionId` con la anterior y conserva el historial. Mientras esa versión nueva no tenga una EOB publicada, la anterior deja de aparecer como liquidación vigente. La lectura valida la cadena, la integridad de cada línea y la pertenencia de la EOB al titular.

`POST /insurance-claims/:id/reversals` recibe `reversedAdjudicationVersionId` de la versión vigente; admite `reversalAmount` decimal no negativo e `idempotencyKey` opcionales. Devuelve `{ "id": "<reversal-id>" }`, conserva versiones/EOB y marca el reclamo como revertido. La proyección retira su vigencia. El reemplazo posterior es un nuevo reclamo del mismo pedido, con historia separada y sujeto a las precondiciones de alta.

Cancelar el pedido, cambiar cantidades/importes/moneda, cambiar la orden/oferta o dejar una sustitución pendiente impide presentar el snapshot anterior como vigente. Una dispensación parcial que conserve la economía original del pedido no invalida por sí sola una liquidación ya publicada: el snapshot compara las cantidades reservadas originales, no el saldo por entregar. Al dispensar, `medication_dispensations.insurance_claim_id` conserva el vínculo al reclamo activo.

## Fuentes y despliegue

- [DTO de reclamos, adjudicación, publicación y reversión](../../src/modules/insurance/dto/claims.dto.ts).
- [DTO de autorización previa](../../src/modules/insurance/dto/prior-auth.dto.ts).
- [Proyección de liquidación](../../src/modules/insurance/dto/patient-settlement.dto.ts).
- [Lectura del perfil y beneficios](../../src/modules/profiles/dto/read-patients.dto.ts).
- [Pedido de farmacia y porciones congeladas](../../src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts).
- [Selección de EOB vigente](../../src/modules/insurance/services/patient-settlement-projection.ts).

La regeneración conserva las 72 definiciones de índices de `diagnostic_units`. El diff de ese archivo retira nueve líneas de comentario sobre la antigua excepción B-10; no elimina índices. Las notas canónicas de encuestas incorporadas en la bóveda permiten conservar su módulo 65 e índices al regenerar el catálogo.

Los patches operativos de API #397 se conservan en el [seguimiento de modelo #21](https://github.com/mantra-core-technologies/mantra-core-health-model/pull/21) (`70abc7d`), posterior a la integración de #19 y su copia API (`1f8851d1`): privilegios futuros con `current_user` y comentarios sobre las FK `profile_id` ya correctas. La sincronización oficial y el control de fuentes terminaron con exit 0; el patch completo no se aplicó. Sus dos sentencias de privilegios se comprobaron en PostgreSQL aislado con BEGIN/ROLLBACK; permisos y rol volvieron exactamente a la línea base, sin tocar políticas ni bases remotas. [Evidencia de fidelidad](../tareas/subtarea-2.4-transparencia-copagos/evidence/api-final/deployment-patch-fidelity.json).

Orden de despliegue: **patch del modelo → API → frontend**. La reversión de aplicación conserva las columnas aditivas y el historial financiero; no elimina ni reasocia los reclamos históricos.
