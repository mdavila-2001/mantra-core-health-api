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
  "expiresAt": "2026-09-11T17:23:56.213Z"
}
```

---

## Perfiles (filiación)

### Alta de paciente (F-01)

`POST /profiles/patients` → **201**

**Petición**

```json
{
  "patientCode": "PAC-5436149",
  "displayName": "María Fernández Quiroga",
  "birthDate": "1990-05-14"
}
```

**Respuesta**

```json
{
  "profileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "personId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "patientCode": "PAC-5436149",
  "recordLinkageStatus": "bd3c490e-b866-5ff8-8699-3c0510fbefe1",
  "createdAt": "2026-08-12T17:23:56.229Z"
}
```

### Alta de profesional

`POST /profiles/practitioners` → **201**

> `licenseNumber` y `credentialNumber` son obligatorios; la verificación de la matrícula la hace el propio profesional después, por self-service.

**Petición**

```json
{
  "practitionerCode": "MED-5436149",
  "displayName": "Dr. Carlos Rojas",
  "licenseNumber": "LIC-5436149",
  "credentialNumber": "CRED-5436149",
  "professionalTitle": "Medicina General"
}
```

**Respuesta**

```json
{
  "profileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "personId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "practitionerCode": "MED-5436149",
  "verificationStatus": "ed8371fb-89a7-5bb4-af21-a83710587a20",
  "practiceStatus": "8ccfe178-eaf5-5373-9fa0-de0dcadff8d5",
  "licenseId": "32eeb3cf-e714-43ea-bdb7-b24d0ac9f382",
  "credentialId": "8264501d-240a-4d04-a01e-100fdfccec08",
  "createdAt": "2026-08-12T17:23:56.237Z"
}
```

### Registrar contacto de emergencia

`POST /profiles/patients/cfdfd225-aef6-4b92-a117-f0f907d4fe93/related-persons` → **201**

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
  "id": "d5899c36-7db9-4da8-b09c-9ef777122a02",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "personId": "6c7ba511-e225-4484-9104-682ef80393d2",
  "status": "3a9405a3-736b-5355-8bd0-8b9a5989f522",
  "createdAt": "2026-08-12T17:23:56.248Z"
}
```

### Listado paginado de pacientes

`GET /profiles/patients?q=PAC-5436149&limit=10` → **200**

> Paginación por cursor keyset (`nextCursor`), no por offset: el listado se recorre mientras se dan de alta pacientes.

**Respuesta**

```json
{
  "items": [
    {
      "profileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
      "personId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
      "patientCode": "PAC-5436149",
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

`GET /profiles/patients/cfdfd225-aef6-4b92-a117-f0f907d4fe93` → **200**

> Es la lectura que rellena F-01. No trae datos clínicos: esos viven en `clinical` y `chart`, que responden a otro rol.

**Respuesta**

```json
{
  "profileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "personId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "patientCode": "PAC-5436149",
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
      "id": "d5899c36-7db9-4da8-b09c-9ef777122a02",
      "displayName": "Ana Fernández",
      "relationshipConceptId": "2828aee1-ea38-5be8-9d2d-110f29459782",
      "isEmergencyContact": true,
      "isLegalGuardian": false
    }
  ],
  "createdAt": "2026-08-12T17:23:56.229Z",
  "updatedAt": "2026-08-12T17:23:56.229Z"
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
  "resourceRefId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "name": "Consultorio 5436149",
  "timeZone": "America/La_Paz",
  "capacity": 1
}
```

**Respuesta**

```json
{
  "id": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
  "name": "Consultorio 5436149",
  "stateConceptId": "38a1d301-f40d-5b17-a695-5e6d605f8b19"
}
```

### Publicar la plantilla semanal

`POST /scheduling/resources/9d2d4f5a-baa6-4b26-8256-9be90374d9ed/templates` → **201**

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
  "id": "fa2944b9-615b-42e3-b955-f5986f29da9f",
  "name": "Mañanas L-D",
  "ruleCount": 7,
  "statusConceptId": "b96b14a3-6a0d-5478-b70f-46b89c715dfe"
}
```

### Materializar los slots de la ventana

`POST /scheduling/templates/fa2944b9-615b-42e3-b955-f5986f29da9f/generate-slots` → **201**

> Idempotente: los slots que ya existen se cuentan como `skipped` en vez de duplicarse.

**Petición**

```json
{
  "from": "2026-08-13T00:00:00.000Z",
  "to": "2026-08-21T00:00:00.000Z"
}
```

**Respuesta**

```json
{
  "templateId": "fa2944b9-615b-42e3-b955-f5986f29da9f",
  "created": 32,
  "skipped": 0
}
```

### Leer la agenda publicada

`GET /scheduling/resources/9d2d4f5a-baa6-4b26-8256-9be90374d9ed/slots?from=2026-08-13T00:00:00.000Z&to=2026-08-21T00:00:00.000Z&limit=3` → **200**

> `onlyAvailable` es `true` por defecto y filtra por cupo restante, no por estado: un slot abierto con el cupo tomado por un hold vivo no se ofrece.

**Respuesta**

```json
{
  "resourceId": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
  "from": "2026-08-13T00:00:00.000Z",
  "to": "2026-08-21T00:00:00.000Z",
  "items": [
    {
      "id": "5a1c459e-c7db-464b-9803-1e962ba09bc2",
      "resourceId": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
      "scheduleTemplateId": "fa2944b9-615b-42e3-b955-f5986f29da9f",
      "serviceConceptId": null,
      "startAt": "2026-08-13T08:00:00.000Z",
      "endAt": "2026-08-13T08:30:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "f2329f9b-8d6d-4804-9197-7dcc6f25420d",
      "resourceId": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
      "scheduleTemplateId": "fa2944b9-615b-42e3-b955-f5986f29da9f",
      "serviceConceptId": null,
      "startAt": "2026-08-13T08:30:00.000Z",
      "endAt": "2026-08-13T09:00:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "929c6d27-e025-4379-9a41-56254c00e96f",
      "resourceId": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
      "scheduleTemplateId": "fa2944b9-615b-42e3-b955-f5986f29da9f",
      "serviceConceptId": null,
      "startAt": "2026-08-13T09:00:00.000Z",
      "endAt": "2026-08-13T09:30:00.000Z",
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

`POST /scheduling/slots/5a1c459e-c7db-464b-9803-1e962ba09bc2/holds` → **201**

**Petición**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93"
}
```

**Respuesta**

```json
{
  "id": "34b71512-54cb-477e-aa45-97bf19fcaff5",
  "holdToken": "<holdToken — omitido en el catálogo>",
  "expiresAt": "2026-08-12T17:28:56.302Z",
  "remainingCapacity": 0
}
```

### Un segundo hold sobre el mismo slot se rechaza

`POST /scheduling/slots/5a1c459e-c7db-464b-9803-1e962ba09bc2/holds` → **409**

> Éste es el punto donde se evita el doble booking. El front debe tratar el 409 como "otro paciente se adelantó" y refrescar la agenda.

**Petición**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93"
}
```

**Respuesta**

```json
{
  "code": "CONFLICT",
  "message": "El slot no tiene cupos disponibles",
  "correlationId": "98",
  "details": {
    "slotId": "5a1c459e-c7db-464b-9803-1e962ba09bc2"
  },
  "timestamp": "2026-08-12T17:23:56.308Z",
  "path": "/scheduling/slots/5a1c459e-c7db-464b-9803-1e962ba09bc2/holds"
}
```

### Confirmar la reserva

`POST /scheduling/holds/171c56cd-37aa-4144-abcd-2fc6927f26d4/confirm` → **201**

**Petición**

```json
{
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
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
  "id": "9d04aed0-fb28-41d4-b380-39fbd51643c3",
  "bookableSlotId": "5a1c459e-c7db-464b-9803-1e962ba09bc2",
  "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
  "remindersScheduled": 2
}
```

### Listar las citas del paciente

`GET /scheduling/bookings?patientProfileId=cfdfd225-aef6-4b92-a117-f0f907d4fe93` → **200**

> Exige al menos `patientProfileId` o `resourceId`. `startAt`/`endAt` vienen resueltos desde el slot. Las canceladas se excluyen salvo `includeCancelled=true`.

**Respuesta**

```json
{
  "items": [
    {
      "id": "9d04aed0-fb28-41d4-b380-39fbd51643c3",
      "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
      "resourceId": "9d2d4f5a-baa6-4b26-8256-9be90374d9ed",
      "bookableSlotId": "5a1c459e-c7db-464b-9803-1e962ba09bc2",
      "appointmentId": "cc160af6-504e-488b-9ae9-edd99bd12788",
      "startAt": "2026-08-13T08:00:00.000Z",
      "endAt": "2026-08-13T08:30:00.000Z",
      "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
      "serviceConceptId": null,
      "bookingChannelConceptId": "9fc57505-f817-555f-a165-dd1b81db04b3",
      "confirmedAt": "2026-08-12T17:23:56.317Z",
      "checkedInAt": null,
      "reasonText": null,
      "createdAt": "2026-08-12T17:23:56.317Z"
    }
  ],
  "count": 1,
  "limit": 100,
  "truncated": false
}
```

### Check-in del paciente

`POST /scheduling/bookings/9d04aed0-fb28-41d4-b380-39fbd51643c3/check-in` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "bookingId": "9d04aed0-fb28-41d4-b380-39fbd51643c3",
  "checkedInAt": "2026-08-12T17:23:56.334Z"
}
```

### Reprogramar a otro hueco

`POST /scheduling/bookings/9d04aed0-fb28-41d4-b380-39fbd51643c3/reschedule` → **200**

**Petición**

```json
{
  "toSlotId": "f2329f9b-8d6d-4804-9197-7dcc6f25420d",
  "reasonText": "El paciente pidió más tarde"
}
```

**Respuesta**

```json
{
  "bookingId": "9d04aed0-fb28-41d4-b380-39fbd51643c3",
  "fromSlotId": "5a1c459e-c7db-464b-9803-1e962ba09bc2",
  "toSlotId": "f2329f9b-8d6d-4804-9197-7dcc6f25420d"
}
```

### Cancelar la cita

`POST /scheduling/bookings/9d04aed0-fb28-41d4-b380-39fbd51643c3/cancel` → **200**

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
  "bookingId": "9d04aed0-fb28-41d4-b380-39fbd51643c3",
  "capacityReleased": true
}
```

### Cancelar dos veces se rechaza

`POST /scheduling/bookings/9d04aed0-fb28-41d4-b380-39fbd51643c3/cancel` → **409**

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
  "correlationId": "104",
  "details": {
    "bookingId": "9d04aed0-fb28-41d4-b380-39fbd51643c3"
  },
  "timestamp": "2026-08-12T17:23:56.361Z",
  "path": "/scheduling/bookings/9d04aed0-fb28-41d4-b380-39fbd51643c3/cancel"
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
      "conceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "code": "ACCESS_READ",
      "display": "Read access",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "ffda3cef-e77a-5002-8709-e79f32e62fb4"
    },
    {
      "conceptId": "8169c0f6-f30a-5156-b604-d43e4927b27d",
      "code": "ACCESS_WRITE",
      "display": "Write access",
      "definition": null,
      "selectable": true,
      "codeSystemVersionId": "ffda3cef-e77a-5002-8709-e79f32e62fb4"
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
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "responsiblePractitionerId": "b71341f5-14b0-4f6a-b0aa-c28e347db569"
}
```

**Respuesta**

```json
{
  "id": "c3546d37-6ef6-4493-a5e5-a729f2cc795a",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "status": "902abacd-a440-52e8-b370-6b5a7618f685",
  "startAt": "2026-08-12T17:23:56.367Z",
  "createdAt": "2026-08-12T17:23:56.367Z"
}
```

### Check-in del encuentro

`POST /clinical/encounters/check-in` → **201**

**Petición**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "episodeId": "c3546d37-6ef6-4493-a5e5-a729f2cc795a",
  "primaryPractitionerId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "reasonText": "Dolor abdominal"
}
```

**Respuesta**

```json
{
  "id": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "episodeId": "c3546d37-6ef6-4493-a5e5-a729f2cc795a",
  "status": "281daa85-6561-5e8b-9802-de6ac76114fa",
  "participantIds": [],
  "locationIds": [],
  "startAt": "2026-08-12T17:23:56.371Z",
  "endAt": null,
  "createdAt": "2026-08-12T17:23:56.371Z"
}
```

### Registrar condición

`POST /clinical/conditions` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
  "codeConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9"
}
```

**Respuesta**

```json
{
  "id": "8c7d554a-30fc-448f-8ed4-7c804d3110c9",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "clinicalStatus": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
  "verificationStatus": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
  "createdAt": "2026-08-12T17:23:56.375Z"
}
```

### Registrar alergia con su reacción

`POST /clinical/allergy-intolerances` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "substanceConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
  "reactions": [
    {
      "manifestationConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "description": "Urticaria"
    }
  ]
}
```

**Respuesta**

```json
{
  "id": "e82ff9f0-d4fb-410e-b21e-15969fbabf1a",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "clinicalStatus": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
  "reactionIds": [
    "b9a28a39-e2c6-438c-9f3c-a75977ad204b"
  ],
  "createdAt": "2026-08-12T17:23:56.380Z"
}
```

### Registrar observación

`POST /clinical/observations` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
  "codeConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
  "valueDecimal": 37.8
}
```

**Respuesta**

```json
{
  "id": "a0f04d6a-9380-4115-850b-48b3dcf683a6",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "status": "ecaf731a-1f81-5cb1-967a-ef5f888ba053",
  "componentIds": [],
  "rowVersion": 1,
  "createdAt": "2026-08-12T17:23:56.386Z"
}
```

### Prescribir (queda en borrador)

`POST /clinical/medication-requests` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
  "medicationConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
  "prescriberProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "doseText": "500 mg",
  "frequencyText": "cada 8 horas",
  "quantityDecimal": 21
}
```

**Respuesta**

```json
{
  "id": "c47d5999-2ede-4e1a-8a4b-12ae488a7621",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": null,
  "createdAt": "2026-08-12T17:23:56.390Z"
}
```

### Firmar la receta

`POST /clinical/medication-requests/c47d5999-2ede-4e1a-8a4b-12ae488a7621/sign` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "c47d5999-2ede-4e1a-8a4b-12ae488a7621",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-12T17:23:56.395Z",
  "createdAt": "2026-08-12T17:23:56.390Z"
}
```

### Emitir la receta

`POST /clinical/medication-requests/c47d5999-2ede-4e1a-8a4b-12ae488a7621/issue` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "c47d5999-2ede-4e1a-8a4b-12ae488a7621",
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "status": "cce628c0-3334-50cb-9176-652c14f6f10c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-12T17:23:56.395Z",
  "createdAt": "2026-08-12T17:23:56.390Z"
}
```

### Emitirla de nuevo se rechaza

`POST /clinical/medication-requests/c47d5999-2ede-4e1a-8a4b-12ae488a7621/issue` → **422**

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
  "correlationId": "114",
  "details": {
    "requestId": "c47d5999-2ede-4e1a-8a4b-12ae488a7621",
    "status": "cce628c0-3334-50cb-9176-652c14f6f10c"
  },
  "timestamp": "2026-08-12T17:23:56.404Z",
  "path": "/clinical/medication-requests/c47d5999-2ede-4e1a-8a4b-12ae488a7621/issue"
}
```

### Leer el historial clínico del paciente

`GET /clinical/patients/cfdfd225-aef6-4b92-a117-f0f907d4fe93/summary` → **200**

> Los cinco bloques en una llamada. `truncated` declara cuáles quedaron recortados por `limit`: un historial incompleto no debe leerse como completo.

**Respuesta**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "conditions": [
    {
      "id": "8c7d554a-30fc-448f-8ed4-7c804d3110c9",
      "codeConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "categoryConceptId": null,
      "clinicalStatusConceptId": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
      "verificationStatusConceptId": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
      "severityConceptId": null,
      "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
      "onsetAt": null,
      "resolvedAt": null,
      "createdAt": "2026-08-12T17:23:56.375Z"
    }
  ],
  "allergies": [
    {
      "id": "e82ff9f0-d4fb-410e-b21e-15969fbabf1a",
      "substanceConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "typeConceptId": null,
      "categoryConceptId": null,
      "criticalityConceptId": null,
      "clinicalStatusConceptId": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
      "createdAt": "2026-08-12T17:23:56.380Z"
    }
  ],
  "medicationRequests": [
    {
      "id": "c47d5999-2ede-4e1a-8a4b-12ae488a7621",
      "medicationConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "statusConceptId": "cce628c0-3334-50cb-9176-652c14f6f10c",
      "prescriberProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
      "doseText": "500 mg",
      "frequencyText": "cada 8 horas",
      "validFrom": null,
      "validTo": null,
      "signedAt": "2026-08-12T17:23:56.395Z",
      "issuedAt": "2026-08-12T17:23:56.400Z",
      "createdAt": "2026-08-12T17:23:56.390Z"
    }
  ],
  "observations": [
    {
      "id": "a0f04d6a-9380-4115-850b-48b3dcf683a6",
      "codeConceptId": "13db7dfe-2295-54de-87c9-a5efe38a8af9",
      "statusConceptId": "ecaf731a-1f81-5cb1-967a-ef5f888ba053",
      "interpretationConceptId": null,
      "valueDecimal": "37.8",
      "valueText": null,
      "valueBoolean": null,
      "valueConceptId": null,
      "quantityValue": null,
      "quantityUnitConceptId": null,
      "effectiveStartAt": null,
      "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0"
    }
  ],
  "encounters": [
    {
      "id": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
      "episodeId": "c3546d37-6ef6-4493-a5e5-a729f2cc795a",
      "statusConceptId": "281daa85-6561-5e8b-9802-de6ac76114fa",
      "classConceptId": "0c28fd2d-9b44-5546-92de-f5046d166725",
      "primaryPractitionerId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
      "reasonText": "Dolor abdominal",
      "startAt": "2026-08-12T17:23:56.371Z",
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
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "authorProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
  "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
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
  "noteId": "1902274a-d4ce-4b13-9930-d35e923e656f",
  "versionId": "026206f1-aecf-48d0-b3c3-b8759c8c695e",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "1208a600-fa68-5864-bf45-0fa6908c0394",
  "versionStatusConceptId": "51f96bfa-d490-53c1-9f8b-e2ba4ae964bb"
}
```

### Firmar la versión

`POST /charts/notes/1902274a-d4ce-4b13-9930-d35e923e656f/versions/026206f1-aecf-48d0-b3c3-b8759c8c695e/sign` → **201**

**Petición**

```json
{
  "signerProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569"
}
```

**Respuesta**

```json
{
  "noteId": "1902274a-d4ce-4b13-9930-d35e923e656f",
  "versionId": "026206f1-aecf-48d0-b3c3-b8759c8c695e",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
  "versionStatusConceptId": "87fc5b05-f5ad-5e83-8f35-2b72d50a5cef"
}
```

### Liberar la versión al portal del paciente

`POST /charts/notes/versions/026206f1-aecf-48d0-b3c3-b8759c8c695e/release` → **201**

**Petición**

```json
{
  "policyVersion": "v1"
}
```

**Respuesta**

```json
{
  "versionId": "026206f1-aecf-48d0-b3c3-b8759c8c695e",
  "releaseEventId": "4d28f44c-ebae-4d31-842e-ea66ec7f1c56",
  "patientReleaseStatusConceptId": "5b42233a-7dbe-5558-9c57-47d9fcef4ccb"
}
```

### Abrir un plan de cuidados

`POST /charts/care-plans` → **201**

**Petición**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "authorProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
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
  "id": "e3560fe0-3fde-4518-b71b-56aad2fddcb9",
  "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
  "activityCount": 1,
  "createdAt": "2026-08-12T17:23:56.433Z"
}
```

### Registrar un documento

`POST /charts/documents` → **201**

**Petición**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "title": "Informe de laboratorio",
  "authorText": "Laboratorio Central",
  "isExternal": true
}
```

**Respuesta**

```json
{
  "id": "b20857b6-37a3-4d0d-8d76-b97bbc5e98c2",
  "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
  "fileCount": 0,
  "createdAt": "2026-08-12T17:23:56.444Z"
}
```

### Leer el expediente completo

`GET /charts/patients/cfdfd225-aef6-4b92-a117-f0f907d4fe93/chart` → **200**

> Notas (con el texto de su versión vigente), planes con sus actividades y documentos, en una llamada. `releasedToPatient` viene derivado.

**Respuesta**

```json
{
  "patientProfileId": "cfdfd225-aef6-4b92-a117-f0f907d4fe93",
  "notes": [
    {
      "noteId": "1902274a-d4ce-4b13-9930-d35e923e656f",
      "encounterId": "6de98e9c-9fe5-4a0d-87df-df0ad9be46b0",
      "noteTypeConceptId": "06b3e6b3-5154-5061-9620-9ae4a49bcc90",
      "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
      "currentVersionId": "026206f1-aecf-48d0-b3c3-b8759c8c695e",
      "versionNumber": 1,
      "authorProfileId": "b71341f5-14b0-4f6a-b0aa-c28e347db569",
      "chiefComplaintText": "Dolor abdominal",
      "subjectiveText": "Refiere dolor de tres días",
      "objectiveText": "Abdomen blando, sin defensa",
      "assessmentText": "Gastroenteritis probable",
      "planText": "Hidratación y control en 48 h",
      "signedAt": "2026-08-12T17:23:56.420Z",
      "releasedToPatient": true,
      "createdAt": "2026-08-12T17:23:56.410Z"
    }
  ],
  "carePlans": [
    {
      "id": "e3560fe0-3fde-4518-b71b-56aad2fddcb9",
      "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
      "intentConceptId": "afcb5210-52da-5e5b-b781-869c399da9c6",
      "goalText": "Recuperar hidratación",
      "startDate": null,
      "endDate": null,
      "activities": [
        {
          "id": "f5b2e949-6aaa-4260-9e00-952c0b12fd04",
          "statusConceptId": "4dd65d40-e8b4-56f1-b001-dac4bcf9169b",
          "detailText": "Control en 48 h",
          "scheduledAt": null
        }
      ],
      "createdAt": "2026-08-12T17:23:56.433Z"
    }
  ],
  "documents": [
    {
      "id": "b20857b6-37a3-4d0d-8d76-b97bbc5e98c2",
      "title": "Informe de laboratorio",
      "categoryConceptId": "b53e6248-fab7-5dc3-b1e6-2f7d0051ac78",
      "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
      "authorText": "Laboratorio Central",
      "isExternal": true,
      "documentDate": null,
      "createdAt": "2026-08-12T17:23:56.444Z"
    }
  ],
  "limit": 50,
  "truncated": []
}
```

---
