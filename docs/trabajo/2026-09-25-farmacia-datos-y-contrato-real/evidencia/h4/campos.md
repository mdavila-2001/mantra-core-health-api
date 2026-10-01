# H4.S1.M2 — `PharmacySiteListItemDto` vs `PharmacySite` del front

Comparado contra `mantra-core-health/src/app/core/data-access/pharmacy/pharmacy.types.ts`
(`PharmacySite`, ya existente antes de este carril).

| Campo | Front (`PharmacySite`) | API (`PharmacySiteListItemDto`) | Igual |
|---|---|---|---|
| `siteId` | `string` | `string` (uuid) | sí |
| `siteName` | `string` | `string` | sí |
| `pharmacyId` | `string` | `string` (uuid) | sí |
| `pharmacyName` | `string` | `string` | sí |
| `addressText` | `string \| null` | `string \| null` | sí |
| `latitude` | `number \| null` | `number \| null` | sí |
| `longitude` | `number \| null` | `number \| null` | sí |
| `distanceKm` | `number \| null` | `number \| null` (un decimal, `haversineKm` reusado) | sí |
| `homeDeliveryAvailable` | `boolean \| null` | `boolean \| null` | sí |
| `pickupAvailable` | `boolean \| null` | `boolean \| null` | sí |
| `productCount` | `number` | `number` | sí |

Los diez campos que el front ya declaraba (antes de este carril, en el mock) están, nombre por
nombre y tipo por tipo, en el DTO real nuevo. El mock (`pharmacy.handlers.ts`, `/pharmacy/sites`)
ya usaba exactamente estos mismos nombres — verificado leyendo el handler existente.
