# Catálogo de flujos verificados para el frontend

> Generado por `node tools/redesa/exercise-front-flows.mjs`. **No se edita a mano**:
> se regenera contra una API real y cada cuerpo de abajo es la respuesta literal
> que devolvió. Si el contrato cambia, vuelva a ejecutarlo.

- Generado contra `http://localhost:3001`
- Peticiones ejercidas: **36**
- Códigos de error deliberados (límites documentados): 3

Lo que aparece aquí está **garantizado**: se ejerció de punta a punta con datos
reales, no con mocks. Lo que no aparece, no lo está.

## Cómo leerlo

- Cada paso trae la petición tal cual se envió y la respuesta tal cual volvió.
- Los pasos con un estado 4xx son **límites deliberados**: el front tiene que
  saber distinguirlos de un fallo, y por eso están aquí.
- Todo campo `*ConceptId` es un UUID del catálogo de terminología. Para pintarlo
  se resuelve con `GET /terminology/concepts?ids=…` (último bloque).

---

## Sesión

### Iniciar sesión (el token de todo lo demás)

`POST /iam/auth/login` → **200**

> `refreshToken` viaja en el cuerpo mientras `AUTH_REFRESH_COOKIE_ENABLED` esté apagado.

**Petición**

```json
{
  "email": "admin@redesa.test",
  "password": "<password — omitido en el catálogo>"
}
```

**Respuesta**

```json
{
  "accessToken": "<accessToken — omitido en el catálogo>",
  "refreshToken": "<refreshToken — omitido en el catálogo>",
  "expiresAt": "2026-09-05T06:49:02.784Z"
}
```

---

## Perfiles (filiación)

### Alta de paciente (F-01)

`POST /profiles/patients` → **201**

**Petición**

```json
{
  "patientCode": "PAC-8942680",
  "displayName": "María Fernández Quiroga",
  "birthDate": "1990-05-14"
}
```

**Respuesta**

```json
{
  "profileId": "53e30166-af53-460b-a513-4058b05393f5",
  "personId": "53e30166-af53-460b-a513-4058b05393f5",
  "patientCode": "PAC-8942680",
  "recordLinkageStatus": "bd3c490e-b866-5ff8-8699-3c0510fbefe1",
  "createdAt": "2026-08-06T06:49:02.838Z"
}
```

### Alta de profesional

`POST /profiles/practitioners` → **201**

> `licenseNumber` y `credentialNumber` son obligatorios; la verificación de la matrícula la hace el propio profesional después, por self-service.

**Petición**

```json
{
  "practitionerCode": "MED-8942680",
  "displayName": "Dr. Carlos Rojas",
  "licenseNumber": "LIC-8942680",
  "credentialNumber": "CRED-8942680",
  "professionalTitle": "Medicina General"
}
```

**Respuesta**

```json
{
  "profileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "personId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "practitionerCode": "MED-8942680",
  "verificationStatus": "ed8371fb-89a7-5bb4-af21-a83710587a20",
  "practiceStatus": "8ccfe178-eaf5-5373-9fa0-de0dcadff8d5",
  "licenseId": "dce9a828-37a6-4b28-9292-39e900171904",
  "credentialId": "80291a3a-268f-4e6b-93e9-4f9bb17da695",
  "createdAt": "2026-08-06T06:49:02.854Z"
}
```

### Registrar contacto de emergencia

`POST /profiles/patients/53e30166-af53-460b-a513-4058b05393f5/related-persons` → **201**

**Petición**

```json
{
  "displayName": "Ana Fernández",
  "isEmergencyContact": true
}
```

**Respuesta**

```json
{
  "id": "341dc72b-27ee-404f-b4d9-f33c1bc092e6",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "personId": "da1d635d-427a-474b-b6ac-11fadb44207b",
  "status": "3a9405a3-736b-5355-8bd0-8b9a5989f522",
  "createdAt": "2026-08-06T06:49:02.883Z"
}
```

### Listado paginado de pacientes

`GET /profiles/patients?q=PAC-8942680&limit=10` → **200**

> Paginación por cursor keyset (`nextCursor`), no por offset: el listado se recorre mientras se dan de alta pacientes.

**Respuesta**

```json
{
  "items": [
    {
      "profileId": "53e30166-af53-460b-a513-4058b05393f5",
      "personId": "53e30166-af53-460b-a513-4058b05393f5",
      "patientCode": "PAC-8942680",
      "displayName": "María Fernández Quiroga",
      "birthDate": "1990-05-14T00:00:00.000Z",
      "personStatusConceptId": "d4939b72-ea54-524d-9021-bdca59efa37a",
      "deceased": false
    }
  ],
  "count": 1,
  "limit": 10,
  "nextCursor": null
}
```

### Ficha completa del paciente

`GET /profiles/patients/53e30166-af53-460b-a513-4058b05393f5` → **200**

> Es la lectura que rellena F-01. No trae datos clínicos: esos viven en `clinical` y `chart`, que responden a otro rol.

**Respuesta**

```json
{
  "profileId": "53e30166-af53-460b-a513-4058b05393f5",
  "personId": "53e30166-af53-460b-a513-4058b05393f5",
  "patientCode": "PAC-8942680",
  "masterPatientIndexCode": null,
  "displayName": "María Fernández Quiroga",
  "birthDate": "1990-05-14T00:00:00.000Z",
  "administrativeGenderConceptId": null,
  "sexAtBirthConceptId": null,
  "genderIdentityConceptId": null,
  "nationalityConceptId": null,
  "preferredLanguageConceptId": null,
  "personStatusConceptId": "d4939b72-ea54-524d-9021-bdca59efa37a",
  "vitalStatusConceptId": "4abd7a42-a25c-5b7d-9f07-e5e844fa903c",
  "deceasedAt": null,
  "aboGroupConceptId": null,
  "rhFactorConceptId": null,
  "insuranceStatusConceptId": null,
  "clinicalLanguageConceptId": null,
  "recordLinkageStatusConceptId": "bd3c490e-b866-5ff8-8699-3c0510fbefe1",
  "relatedPersons": [
    {
      "id": "341dc72b-27ee-404f-b4d9-f33c1bc092e6",
      "displayName": "Ana Fernández",
      "relationshipConceptId": "2828aee1-ea38-5be8-9d2d-110f29459782",
      "isEmergencyContact": true,
      "isLegalGuardian": false
    }
  ],
  "createdAt": "2026-08-06T06:49:02.838Z",
  "updatedAt": "2026-08-06T06:49:02.838Z"
}
```

---

## Agenda

### Crear el recurso agendable del profesional

`POST /scheduling/resources` → **201**

**Petición**

```json
{
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "resourceType": "PRACTITIONER",
  "resourceRefType": "practitioner_profiles",
  "resourceRefId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "name": "Consultorio 8942680",
  "timeZone": "America/La_Paz",
  "capacity": 1
}
```

**Respuesta**

```json
{
  "id": "5ed67467-e698-4ccb-9777-5af09813f64d",
  "name": "Consultorio 8942680",
  "stateConceptId": "38a1d301-f40d-5b17-a695-5e6d605f8b19"
}
```

### Publicar la plantilla semanal

`POST /scheduling/resources/5ed67467-e698-4ccb-9777-5af09813f64d/templates` → **201**

**Petición**

```json
{
  "name": "Mañanas L-D",
  "slotMinutes": 30,
  "rules": [
    {
      "dayOfWeek": 0,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 2,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 3,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 4,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 5,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    },
    {
      "dayOfWeek": 6,
      "startTime": "08:00:00",
      "endTime": "10:00:00"
    }
  ]
}
```

**Respuesta**

```json
{
  "id": "a483702f-a459-4b7c-83d2-5a85052f9859",
  "name": "Mañanas L-D",
  "ruleCount": 7,
  "statusConceptId": "b96b14a3-6a0d-5478-b70f-46b89c715dfe"
}
```

### Materializar los slots de la ventana

`POST /scheduling/templates/a483702f-a459-4b7c-83d2-5a85052f9859/generate-slots` → **201**

> Idempotente: los slots que ya existen se cuentan como `skipped` en vez de duplicarse.

**Petición**

```json
{
  "from": "2026-08-07T00:00:00.000Z",
  "to": "2026-08-15T00:00:00.000Z"
}
```

**Respuesta**

```json
{
  "templateId": "a483702f-a459-4b7c-83d2-5a85052f9859",
  "created": 32,
  "skipped": 0
}
```

### Leer la agenda publicada

`GET /scheduling/resources/5ed67467-e698-4ccb-9777-5af09813f64d/slots?from=2026-08-07T00:00:00.000Z&to=2026-08-15T00:00:00.000Z&limit=3` → **200**

> `onlyAvailable` es `true` por defecto y filtra por cupo restante, no por estado: un slot abierto con el cupo tomado por un hold vivo no se ofrece.

**Respuesta**

```json
{
  "resourceId": "5ed67467-e698-4ccb-9777-5af09813f64d",
  "from": "2026-08-07T00:00:00.000Z",
  "to": "2026-08-15T00:00:00.000Z",
  "items": [
    {
      "id": "8e51ee89-8dff-4dca-9d00-87f06dd523b1",
      "resourceId": "5ed67467-e698-4ccb-9777-5af09813f64d",
      "scheduleTemplateId": "a483702f-a459-4b7c-83d2-5a85052f9859",
      "serviceConceptId": null,
      "startAt": "2026-08-07T08:00:00.000Z",
      "endAt": "2026-08-07T08:30:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "df41aeb2-eb78-49de-99ca-026f8feec26a",
      "resourceId": "5ed67467-e698-4ccb-9777-5af09813f64d",
      "scheduleTemplateId": "a483702f-a459-4b7c-83d2-5a85052f9859",
      "serviceConceptId": null,
      "startAt": "2026-08-07T08:30:00.000Z",
      "endAt": "2026-08-07T09:00:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "4d278689-08d9-40a1-a1db-44624a6c7407",
      "resourceId": "5ed67467-e698-4ccb-9777-5af09813f64d",
      "scheduleTemplateId": "a483702f-a459-4b7c-83d2-5a85052f9859",
      "serviceConceptId": null,
      "startAt": "2026-08-07T09:00:00.000Z",
      "endAt": "2026-08-07T09:30:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    }
  ],
  "count": 3,
  "limit": 3,
  "truncated": true
}
```

### Tomar el cupo (anti doble reserva)

`POST /scheduling/slots/8e51ee89-8dff-4dca-9d00-87f06dd523b1/holds` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5"
}
```

**Respuesta**

```json
{
  "id": "783c475f-7f4d-4ad4-9ddc-e00c3715d5d7",
  "holdToken": "<holdToken — omitido en el catálogo>",
  "expiresAt": "2026-08-06T06:54:02.981Z",
  "remainingCapacity": 0
}
```

### Un segundo hold sobre el mismo slot se rechaza

`POST /scheduling/slots/8e51ee89-8dff-4dca-9d00-87f06dd523b1/holds` → **409**

> Éste es el punto donde se evita el doble booking. El front debe tratar el 409 como "otro paciente se adelantó" y refrescar la agenda.

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5"
}
```

**Respuesta**

```json
{
  "code": "CONFLICT",
  "message": "El slot no tiene cupos disponibles",
  "correlationId": "13",
  "details": {
    "slotId": "8e51ee89-8dff-4dca-9d00-87f06dd523b1"
  },
  "timestamp": "2026-08-06T06:49:02.992Z",
  "path": "/scheduling/slots/8e51ee89-8dff-4dca-9d00-87f06dd523b1/holds"
}
```

### Confirmar la reserva

`POST /scheduling/holds/d4d3bfee-7577-430d-bdb0-d79c8ebce4d7/confirm` → **201**

**Petición**

```json
{
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "channel": "PORTAL",
  "reminderOffsetsMinutes": [
    1440,
    60
  ]
}
```

**Respuesta**

```json
{
  "id": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a",
  "bookableSlotId": "8e51ee89-8dff-4dca-9d00-87f06dd523b1",
  "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
  "remindersScheduled": 2
}
```

### Listar las citas del paciente

`GET /scheduling/bookings?patientProfileId=53e30166-af53-460b-a513-4058b05393f5` → **200**

> Exige al menos `patientProfileId` o `resourceId`. `startAt`/`endAt` vienen resueltos desde el slot. Las canceladas se excluyen salvo `includeCancelled=true`.

**Respuesta**

```json
{
  "items": [
    {
      "id": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a",
      "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
      "resourceId": "5ed67467-e698-4ccb-9777-5af09813f64d",
      "bookableSlotId": "8e51ee89-8dff-4dca-9d00-87f06dd523b1",
      "startAt": "2026-08-07T08:00:00.000Z",
      "endAt": "2026-08-07T08:30:00.000Z",
      "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
      "serviceConceptId": null,
      "bookingChannelConceptId": "9fc57505-f817-555f-a165-dd1b81db04b3",
      "confirmedAt": "2026-08-06T06:49:02.999Z",
      "checkedInAt": null,
      "reasonText": null,
      "createdAt": "2026-08-06T06:49:02.999Z"
    }
  ],
  "count": 1,
  "limit": 100,
  "truncated": false
}
```

### Check-in del paciente

`POST /scheduling/bookings/acb1c601-a9f0-4b30-ba95-b9af94df5b0a/check-in` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "bookingId": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a",
  "checkedInAt": "2026-08-06T06:49:03.018Z"
}
```

### Reprogramar a otro hueco

`POST /scheduling/bookings/acb1c601-a9f0-4b30-ba95-b9af94df5b0a/reschedule` → **200**

**Petición**

```json
{
  "toSlotId": "df41aeb2-eb78-49de-99ca-026f8feec26a",
  "reasonText": "El paciente pidió más tarde"
}
```

**Respuesta**

```json
{
  "bookingId": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a",
  "fromSlotId": "8e51ee89-8dff-4dca-9d00-87f06dd523b1",
  "toSlotId": "df41aeb2-eb78-49de-99ca-026f8feec26a"
}
```

### Cancelar la cita

`POST /scheduling/bookings/acb1c601-a9f0-4b30-ba95-b9af94df5b0a/cancel` → **200**

**Petición**

```json
{
  "cancelledBy": "PATIENT",
  "isNoShow": false
}
```

**Respuesta**

```json
{
  "bookingId": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a",
  "capacityReleased": true
}
```

### Cancelar dos veces se rechaza

`POST /scheduling/bookings/acb1c601-a9f0-4b30-ba95-b9af94df5b0a/cancel` → **409**

> La cancelación no es idempotente: repetirla da 409. El front debe tratarlo como "ya estaba cancelada" y refrescar, no como un fallo a reintentar.

**Petición**

```json
{
  "cancelledBy": "PATIENT"
}
```

**Respuesta**

```json
{
  "code": "CONFLICT",
  "message": "La cita ya está cancelada",
  "correlationId": "19",
  "details": {
    "bookingId": "acb1c601-a9f0-4b30-ba95-b9af94df5b0a"
  },
  "timestamp": "2026-08-06T06:49:03.059Z",
  "path": "/scheduling/bookings/acb1c601-a9f0-4b30-ba95-b9af94df5b0a/cancel"
}
```

---

## Terminología

### Buscar conceptos por texto (rellenar un `*ConceptId`)

`GET /terminology/concepts?limit=2` → **200**

> Los ~280 campos `*ConceptId` del contrato se rellenan con `conceptId`. `$lookup` sólo sirve si ya se conocen sistema y código exactos.

**Respuesta**

```json
{
  "items": [
    {
      "conceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "code": "A00",
      "display": "Cholera",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "9a26c2f2-eccb-45f3-88b8-e515a3bfc64c"
    },
    {
      "conceptId": "31a642d2-99bd-46c3-93ca-a2bf21d32dda",
      "code": "A00",
      "display": "Cholera",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "fa1ec120-8ab5-4c4b-b59d-867114260436"
    }
  ],
  "count": 2,
  "limit": 2
}
```

### Resolver a etiqueta los `*ConceptId` que devuelve el contrato

`GET /terminology/concepts?ids=861fa574-1d70-5762-9622-62740773a0ea,1d5da3aa-9426-5410-a484-404d0a038069,54c90a18-3102-5587-a84e-74200652f4b0` → **200**

> Es la vía para pintar estados. Ninguna otra operación del catálogo resuelve un id, y toda respuesta del contrato los devuelve en UUID. Hasta 200 por petición.

**Respuesta**

```json
{
  "items": [
    {
      "conceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
      "code": "chart:CAREPLAN_ACTIVE",
      "display": "Care plan active",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "ffda3cef-e77a-5002-8709-e79f32e62fb4"
    },
    {
      "conceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
      "code": "chart:DOC_STATUS_ACTIVE",
      "display": "Document active",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "ffda3cef-e77a-5002-8709-e79f32e62fb4"
    },
    {
      "conceptId": "861fa574-1d70-5762-9622-62740773a0ea",
      "code": "chart:NOTE_LIFECYCLE_SIGNED",
      "display": "Clinical note signed",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "ffda3cef-e77a-5002-8709-e79f32e62fb4"
    }
  ],
  "count": 3,
  "limit": 50
}
```

---

## Registro clínico

### Abrir episodio de atención

`POST /clinical/care-episodes` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "responsiblePractitionerId": "310694e9-8169-4b39-afc2-82b1df306ac5"
}
```

**Respuesta**

```json
{
  "id": "082d6425-2595-4351-bfe2-ab502bf03ef6",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "status": "902abacd-a440-52e8-b370-6b5a7618f685",
  "startAt": "2026-08-06T06:49:03.068Z",
  "createdAt": "2026-08-06T06:49:03.068Z"
}
```

### Check-in del encuentro

`POST /clinical/encounters/check-in` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "episodeId": "082d6425-2595-4351-bfe2-ab502bf03ef6",
  "primaryPractitionerId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "reasonText": "Dolor abdominal"
}
```

**Respuesta**

```json
{
  "id": "625fabe2-0235-4778-9344-016bc6628538",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "episodeId": "082d6425-2595-4351-bfe2-ab502bf03ef6",
  "status": "281daa85-6561-5e8b-9802-de6ac76114fa",
  "participantIds": [],
  "locationIds": [],
  "startAt": "2026-08-06T06:49:03.076Z",
  "endAt": null,
  "createdAt": "2026-08-06T06:49:03.076Z"
}
```

### Registrar condición

`POST /clinical/conditions` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
  "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679"
}
```

**Respuesta**

```json
{
  "id": "1b1bf7c1-b26e-475c-996c-652899a43be2",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "clinicalStatus": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
  "verificationStatus": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
  "createdAt": "2026-08-06T06:49:03.085Z"
}
```

### Registrar alergia con su reacción

`POST /clinical/allergy-intolerances` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "substanceConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
  "reactions": [
    {
      "manifestationConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "description": "Urticaria"
    }
  ]
}
```

**Respuesta**

```json
{
  "id": "4a394d4d-f3c6-40ac-9459-b4258e18c513",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "clinicalStatus": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
  "reactionIds": [
    "a528838e-6ca8-47fb-885f-5436b5f322a4"
  ],
  "createdAt": "2026-08-06T06:49:03.095Z"
}
```

### Registrar observación

`POST /clinical/observations` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
  "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
  "valueDecimal": 37.8
}
```

**Respuesta**

```json
{
  "id": "6197260a-f3e4-47dd-b53a-eeb159f06e5d",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "status": "ecaf731a-1f81-5cb1-967a-ef5f888ba053",
  "componentIds": [],
  "rowVersion": 1,
  "createdAt": "2026-08-06T06:49:03.113Z"
}
```

### Prescribir (queda en borrador)

`POST /clinical/medication-requests` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
  "medicationConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
  "prescriberProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "doseText": "500 mg",
  "frequencyText": "cada 8 horas",
  "quantityDecimal": 21
}
```

**Respuesta**

```json
{
  "id": "0b1d361d-b02d-4f43-853a-8b41899e6c60",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": null,
  "createdAt": "2026-08-06T06:49:03.123Z"
}
```

### Firmar la receta

`POST /clinical/medication-requests/0b1d361d-b02d-4f43-853a-8b41899e6c60/sign` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "0b1d361d-b02d-4f43-853a-8b41899e6c60",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-06T06:49:03.135Z",
  "createdAt": "2026-08-06T06:49:03.123Z"
}
```

### Emitir la receta

`POST /clinical/medication-requests/0b1d361d-b02d-4f43-853a-8b41899e6c60/issue` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "0b1d361d-b02d-4f43-853a-8b41899e6c60",
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "status": "cce628c0-3334-50cb-9176-652c14f6f10c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-06T06:49:03.135Z",
  "createdAt": "2026-08-06T06:49:03.123Z"
}
```

### Emitirla de nuevo se rechaza

`POST /clinical/medication-requests/0b1d361d-b02d-4f43-853a-8b41899e6c60/issue` → **422**

> Sólo un borrador puede emitirse. El front debe tratar el 422 como "ya emitida", no como un fallo a reintentar.

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "code": "PRECONDITION_FAILED",
  "message": "Solo un borrador (DRAFT) puede emitirse",
  "correlationId": "29",
  "details": {
    "requestId": "0b1d361d-b02d-4f43-853a-8b41899e6c60",
    "status": "cce628c0-3334-50cb-9176-652c14f6f10c"
  },
  "timestamp": "2026-08-06T06:49:03.160Z",
  "path": "/clinical/medication-requests/0b1d361d-b02d-4f43-853a-8b41899e6c60/issue"
}
```

### Leer el historial clínico del paciente

`GET /clinical/patients/53e30166-af53-460b-a513-4058b05393f5/summary` → **200**

> Los cinco bloques en una llamada. `truncated` declara cuáles quedaron recortados por `limit`: un historial incompleto no debe leerse como completo.

**Respuesta**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "conditions": [
    {
      "id": "1b1bf7c1-b26e-475c-996c-652899a43be2",
      "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "categoryConceptId": null,
      "clinicalStatusConceptId": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
      "verificationStatusConceptId": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
      "severityConceptId": null,
      "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
      "onsetAt": null,
      "resolvedAt": null,
      "createdAt": "2026-08-06T06:49:03.085Z"
    }
  ],
  "allergies": [
    {
      "id": "4a394d4d-f3c6-40ac-9459-b4258e18c513",
      "substanceConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "typeConceptId": null,
      "categoryConceptId": null,
      "criticalityConceptId": null,
      "clinicalStatusConceptId": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
      "createdAt": "2026-08-06T06:49:03.095Z"
    }
  ],
  "medicationRequests": [
    {
      "id": "0b1d361d-b02d-4f43-853a-8b41899e6c60",
      "medicationConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "statusConceptId": "cce628c0-3334-50cb-9176-652c14f6f10c",
      "prescriberProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
      "doseText": "500 mg",
      "frequencyText": "cada 8 horas",
      "validFrom": null,
      "validTo": null,
      "signedAt": "2026-08-06T06:49:03.135Z",
      "issuedAt": "2026-08-06T06:49:03.147Z",
      "createdAt": "2026-08-06T06:49:03.123Z"
    }
  ],
  "observations": [
    {
      "id": "6197260a-f3e4-47dd-b53a-eeb159f06e5d",
      "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "statusConceptId": "ecaf731a-1f81-5cb1-967a-ef5f888ba053",
      "interpretationConceptId": null,
      "valueDecimal": "37.8",
      "valueText": null,
      "valueBoolean": null,
      "valueConceptId": null,
      "quantityValue": null,
      "quantityUnitConceptId": null,
      "effectiveStartAt": null,
      "encounterId": "625fabe2-0235-4778-9344-016bc6628538"
    }
  ],
  "encounters": [
    {
      "id": "625fabe2-0235-4778-9344-016bc6628538",
      "episodeId": "082d6425-2595-4351-bfe2-ab502bf03ef6",
      "statusConceptId": "281daa85-6561-5e8b-9802-de6ac76114fa",
      "classConceptId": "0c28fd2d-9b44-5546-92de-f5046d166725",
      "primaryPractitionerId": "310694e9-8169-4b39-afc2-82b1df306ac5",
      "reasonText": "Dolor abdominal",
      "startAt": "2026-08-06T06:49:03.076Z",
      "endAt": null
    }
  ],
  "limit": 50,
  "truncated": []
}
```

---

## Expediente

### Escribir una nota clínica

`POST /charts/notes` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "authorProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
  "chiefComplaintText": "Dolor abdominal",
  "subjectiveText": "Refiere dolor de tres días",
  "objectiveText": "Abdomen blando, sin defensa",
  "assessmentText": "Gastroenteritis probable",
  "planText": "Hidratación y control en 48 h"
}
```

**Respuesta**

```json
{
  "noteId": "a6665e75-903a-4ee6-8de4-c1c32b59fe01",
  "versionId": "529b8bc8-cce4-4478-8b38-8b99a50d1541",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "1208a600-fa68-5864-bf45-0fa6908c0394",
  "versionStatusConceptId": "51f96bfa-d490-53c1-9f8b-e2ba4ae964bb"
}
```

### Firmar la versión

`POST /charts/notes/a6665e75-903a-4ee6-8de4-c1c32b59fe01/versions/529b8bc8-cce4-4478-8b38-8b99a50d1541/sign` → **201**

**Petición**

```json
{
  "signerProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5"
}
```

**Respuesta**

```json
{
  "noteId": "a6665e75-903a-4ee6-8de4-c1c32b59fe01",
  "versionId": "529b8bc8-cce4-4478-8b38-8b99a50d1541",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
  "versionStatusConceptId": "87fc5b05-f5ad-5e83-8f35-2b72d50a5cef"
}
```

### Liberar la versión al portal del paciente

`POST /charts/notes/versions/529b8bc8-cce4-4478-8b38-8b99a50d1541/release` → **201**

**Petición**

```json
{
  "policyVersion": "v1"
}
```

**Respuesta**

```json
{
  "versionId": "529b8bc8-cce4-4478-8b38-8b99a50d1541",
  "releaseEventId": "4ca42de5-42ba-4891-8ca6-5c5017cc4af4",
  "patientReleaseStatusConceptId": "5b42233a-7dbe-5558-9c57-47d9fcef4ccb"
}
```

### Abrir un plan de cuidados

`POST /charts/care-plans` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "authorProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
  "goalText": "Recuperar hidratación",
  "activities": [
    {
      "detailText": "Control en 48 h"
    }
  ]
}
```

**Respuesta**

```json
{
  "id": "3e0fbf59-3ebf-4a17-8243-db6781139e5e",
  "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
  "activityCount": 1,
  "createdAt": "2026-08-06T06:49:03.228Z"
}
```

### Registrar un documento

`POST /charts/documents` → **201**

**Petición**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "title": "Informe de laboratorio",
  "authorText": "Laboratorio Central",
  "isExternal": true
}
```

**Respuesta**

```json
{
  "id": "dc4371c0-702a-4872-9dbd-121c52e7da6c",
  "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
  "fileCount": 0,
  "createdAt": "2026-08-06T06:49:03.246Z"
}
```

### Leer el expediente completo

`GET /charts/patients/53e30166-af53-460b-a513-4058b05393f5/chart` → **200**

> Notas (con el texto de su versión vigente), planes con sus actividades y documentos, en una llamada. `releasedToPatient` viene derivado.

**Respuesta**

```json
{
  "patientProfileId": "53e30166-af53-460b-a513-4058b05393f5",
  "notes": [
    {
      "noteId": "a6665e75-903a-4ee6-8de4-c1c32b59fe01",
      "encounterId": "625fabe2-0235-4778-9344-016bc6628538",
      "noteTypeConceptId": "06b3e6b3-5154-5061-9620-9ae4a49bcc90",
      "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
      "currentVersionId": "529b8bc8-cce4-4478-8b38-8b99a50d1541",
      "versionNumber": 1,
      "authorProfileId": "310694e9-8169-4b39-afc2-82b1df306ac5",
      "chiefComplaintText": "Dolor abdominal",
      "subjectiveText": "Refiere dolor de tres días",
      "objectiveText": "Abdomen blando, sin defensa",
      "assessmentText": "Gastroenteritis probable",
      "planText": "Hidratación y control en 48 h",
      "signedAt": "2026-08-06T06:49:03.204Z",
      "releasedToPatient": true,
      "createdAt": "2026-08-06T06:49:03.182Z"
    }
  ],
  "carePlans": [
    {
      "id": "3e0fbf59-3ebf-4a17-8243-db6781139e5e",
      "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
      "intentConceptId": "afcb5210-52da-5e5b-b781-869c399da9c6",
      "goalText": "Recuperar hidratación",
      "startDate": null,
      "endDate": null,
      "activities": [
        {
          "id": "04b92828-f8c0-4d75-ad18-60819d3f735d",
          "statusConceptId": "4dd65d40-e8b4-56f1-b001-dac4bcf9169b",
          "detailText": "Control en 48 h",
          "scheduledAt": null
        }
      ],
      "createdAt": "2026-08-06T06:49:03.228Z"
    }
  ],
  "documents": [
    {
      "id": "dc4371c0-702a-4872-9dbd-121c52e7da6c",
      "title": "Informe de laboratorio",
      "categoryConceptId": "b53e6248-fab7-5dc3-b1e6-2f7d0051ac78",
      "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
      "authorText": "Laboratorio Central",
      "isExternal": true,
      "documentDate": null,
      "createdAt": "2026-08-06T06:49:03.246Z"
    }
  ],
  "limit": 50,
  "truncated": []
}
```

---
