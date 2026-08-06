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
  "password": "S3cret-passw0rd"
}
```

**Respuesta**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYWI4MzUxOC1lN2FhLTQwZDctYTcwZC05YTBiYjVmMzMzODAiLCJzaWQiOiJmMmU3MTZhMS1jNTgwLTQ5NzYtODNlNy0yOTQ3OTQzM2MxNDMiLCJyb2xlcyI6WyJTRUNVUklUWV9BRE1JTiIsIlNVUEVSQURNSU4iXSwidGVuYW50cyI6WyIxYmVmY2ZlYS00NGMwLTU2M2EtODFjZC0zMzdlYzZhY2M4NDAiXSwibmFtZSI6IkFkbWluaXN0cmFkb3IgZGUgYXJyYW5xdWUiLCJ0ZW5hbnROYW1lcyI6eyIxYmVmY2ZlYS00NGMwLTU2M2EtODFjZC0zMzdlYzZhY2M4NDAiOiJNYW50cmEgQ29yZSBEZWZhdWx0IFRlbmFudCJ9LCJ0eXAiOiJhY2Nlc3MiLCJpYXQiOjE3ODU5ODY0OTcsImV4cCI6MTc4NTk4NzM5N30.39c43ttjh_gy0GDOZYNgUCyiMqNpaLf0xjVhunx-Jss",
  "refreshToken": "-yDM8b0WM3g17lFmV_LhyRK17ldhL1nmCVVPx27csIRok5dIvTM0kSVyMjtCBFGJ",
  "expiresAt": "2026-09-05T03:21:37.128Z"
}
```

---

## Perfiles (filiación)

### Alta de paciente (F-01)

`POST /profiles/patients` → **201**

**Petición**

```json
{
  "patientCode": "PAC-6497033",
  "displayName": "María Fernández Quiroga",
  "birthDate": "1990-05-14"
}
```

**Respuesta**

```json
{
  "profileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "personId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "patientCode": "PAC-6497033",
  "recordLinkageStatus": "bd3c490e-b866-5ff8-8699-3c0510fbefe1",
  "createdAt": "2026-08-06T03:21:37.181Z"
}
```

### Alta de profesional

`POST /profiles/practitioners` → **201**

> `licenseNumber` y `credentialNumber` son obligatorios; la verificación de la matrícula la hace el propio profesional después, por self-service.

**Petición**

```json
{
  "practitionerCode": "MED-6497033",
  "displayName": "Dr. Carlos Rojas",
  "licenseNumber": "LIC-6497033",
  "credentialNumber": "CRED-6497033",
  "professionalTitle": "Medicina General"
}
```

**Respuesta**

```json
{
  "profileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "personId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "practitionerCode": "MED-6497033",
  "verificationStatus": "ed8371fb-89a7-5bb4-af21-a83710587a20",
  "practiceStatus": "8ccfe178-eaf5-5373-9fa0-de0dcadff8d5",
  "licenseId": "bb1dd7ae-fceb-44af-ad75-9525263acc92",
  "credentialId": "44e2cde6-e238-41d4-b24c-caa97d9be13e",
  "createdAt": "2026-08-06T03:21:37.252Z"
}
```

### Registrar contacto de emergencia

`POST /profiles/patients/899900ff-bce8-4810-8cac-209bcf80d957/related-persons` → **201**

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
  "id": "ede2faea-6049-4f98-99bb-d1e5226a7036",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "personId": "9cf8b05d-7709-43b4-a914-e9a530595f63",
  "status": "3a9405a3-736b-5355-8bd0-8b9a5989f522",
  "createdAt": "2026-08-06T03:21:37.285Z"
}
```

### Listado paginado de pacientes

`GET /profiles/patients?q=PAC-6497033&limit=10` → **200**

> Paginación por cursor keyset (`nextCursor`), no por offset: el listado se recorre mientras se dan de alta pacientes.

**Respuesta**

```json
{
  "items": [
    {
      "profileId": "899900ff-bce8-4810-8cac-209bcf80d957",
      "personId": "899900ff-bce8-4810-8cac-209bcf80d957",
      "patientCode": "PAC-6497033",
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

`GET /profiles/patients/899900ff-bce8-4810-8cac-209bcf80d957` → **200**

> Es la lectura que rellena F-01. No trae datos clínicos: esos viven en `clinical` y `chart`, que responden a otro rol.

**Respuesta**

```json
{
  "profileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "personId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "patientCode": "PAC-6497033",
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
      "id": "ede2faea-6049-4f98-99bb-d1e5226a7036",
      "displayName": "Ana Fernández",
      "relationshipConceptId": "2828aee1-ea38-5be8-9d2d-110f29459782",
      "isEmergencyContact": true,
      "isLegalGuardian": false
    }
  ],
  "createdAt": "2026-08-06T03:21:37.181Z",
  "updatedAt": "2026-08-06T03:21:37.181Z"
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
  "resourceRefId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "name": "Consultorio 6497033",
  "timeZone": "America/La_Paz",
  "capacity": 1
}
```

**Respuesta**

```json
{
  "id": "4a1f7911-b59a-4737-949b-3d776f94e98a",
  "name": "Consultorio 6497033",
  "stateConceptId": "38a1d301-f40d-5b17-a695-5e6d605f8b19"
}
```

### Publicar la plantilla semanal

`POST /scheduling/resources/4a1f7911-b59a-4737-949b-3d776f94e98a/templates` → **201**

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
  "id": "009af078-1f4f-471a-aa57-c833262a09c0",
  "name": "Mañanas L-D",
  "ruleCount": 7,
  "statusConceptId": "b96b14a3-6a0d-5478-b70f-46b89c715dfe"
}
```

### Materializar los slots de la ventana

`POST /scheduling/templates/009af078-1f4f-471a-aa57-c833262a09c0/generate-slots` → **201**

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
  "templateId": "009af078-1f4f-471a-aa57-c833262a09c0",
  "created": 32,
  "skipped": 0
}
```

### Leer la agenda publicada

`GET /scheduling/resources/4a1f7911-b59a-4737-949b-3d776f94e98a/slots?from=2026-08-07T00:00:00.000Z&to=2026-08-15T00:00:00.000Z&limit=3` → **200**

> `onlyAvailable` es `true` por defecto y filtra por cupo restante, no por estado: un slot abierto con el cupo tomado por un hold vivo no se ofrece.

**Respuesta**

```json
{
  "resourceId": "4a1f7911-b59a-4737-949b-3d776f94e98a",
  "from": "2026-08-07T00:00:00.000Z",
  "to": "2026-08-15T00:00:00.000Z",
  "items": [
    {
      "id": "68902738-dfa3-4261-89ea-80ae03f7459f",
      "resourceId": "4a1f7911-b59a-4737-949b-3d776f94e98a",
      "scheduleTemplateId": "009af078-1f4f-471a-aa57-c833262a09c0",
      "serviceConceptId": null,
      "startAt": "2026-08-07T08:00:00.000Z",
      "endAt": "2026-08-07T08:30:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "deae022f-2449-445a-b531-bc96c7a30548",
      "resourceId": "4a1f7911-b59a-4737-949b-3d776f94e98a",
      "scheduleTemplateId": "009af078-1f4f-471a-aa57-c833262a09c0",
      "serviceConceptId": null,
      "startAt": "2026-08-07T08:30:00.000Z",
      "endAt": "2026-08-07T09:00:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b"
    },
    {
      "id": "36811c09-3723-4201-b48a-4851426d6187",
      "resourceId": "4a1f7911-b59a-4737-949b-3d776f94e98a",
      "scheduleTemplateId": "009af078-1f4f-471a-aa57-c833262a09c0",
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

`POST /scheduling/slots/68902738-dfa3-4261-89ea-80ae03f7459f/holds` → **201**

**Petición**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957"
}
```

**Respuesta**

```json
{
  "id": "26cd9979-a914-43de-95c4-04bbea70f98a",
  "holdToken": "3a8aae3b-b5e6-4a5f-9976-92a1150782d9",
  "expiresAt": "2026-08-06T03:26:37.387Z",
  "remainingCapacity": 0
}
```

### Un segundo hold sobre el mismo slot se rechaza

`POST /scheduling/slots/68902738-dfa3-4261-89ea-80ae03f7459f/holds` → **409**

> Éste es el punto donde se evita el doble booking. El front debe tratar el 409 como "otro paciente se adelantó" y refrescar la agenda.

**Petición**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957"
}
```

**Respuesta**

```json
{
  "code": "CONFLICT",
  "message": "El slot no tiene cupos disponibles",
  "correlationId": "13",
  "details": {
    "slotId": "68902738-dfa3-4261-89ea-80ae03f7459f"
  },
  "timestamp": "2026-08-06T03:21:37.397Z",
  "path": "/scheduling/slots/68902738-dfa3-4261-89ea-80ae03f7459f/holds"
}
```

### Confirmar la reserva

`POST /scheduling/holds/3a8aae3b-b5e6-4a5f-9976-92a1150782d9/confirm` → **201**

**Petición**

```json
{
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
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
  "id": "48f8d84f-fccd-45ef-b959-d32e6833addd",
  "bookableSlotId": "68902738-dfa3-4261-89ea-80ae03f7459f",
  "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
  "remindersScheduled": 2
}
```

### Listar las citas del paciente

`GET /scheduling/bookings?patientProfileId=899900ff-bce8-4810-8cac-209bcf80d957` → **200**

> Exige al menos `patientProfileId` o `resourceId`. `startAt`/`endAt` vienen resueltos desde el slot. Las canceladas se excluyen salvo `includeCancelled=true`.

**Respuesta**

```json
{
  "items": [
    {
      "id": "48f8d84f-fccd-45ef-b959-d32e6833addd",
      "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
      "resourceId": "4a1f7911-b59a-4737-949b-3d776f94e98a",
      "bookableSlotId": "68902738-dfa3-4261-89ea-80ae03f7459f",
      "startAt": "2026-08-07T08:00:00.000Z",
      "endAt": "2026-08-07T08:30:00.000Z",
      "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
      "serviceConceptId": null,
      "bookingChannelConceptId": "9fc57505-f817-555f-a165-dd1b81db04b3",
      "confirmedAt": "2026-08-06T03:21:37.405Z",
      "checkedInAt": null,
      "reasonText": null,
      "createdAt": "2026-08-06T03:21:37.405Z"
    }
  ],
  "count": 1,
  "limit": 100,
  "truncated": false
}
```

### Check-in del paciente

`POST /scheduling/bookings/48f8d84f-fccd-45ef-b959-d32e6833addd/check-in` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "bookingId": "48f8d84f-fccd-45ef-b959-d32e6833addd",
  "checkedInAt": "2026-08-06T03:21:37.426Z"
}
```

### Reprogramar a otro hueco

`POST /scheduling/bookings/48f8d84f-fccd-45ef-b959-d32e6833addd/reschedule` → **200**

**Petición**

```json
{
  "toSlotId": "deae022f-2449-445a-b531-bc96c7a30548",
  "reasonText": "El paciente pidió más tarde"
}
```

**Respuesta**

```json
{
  "bookingId": "48f8d84f-fccd-45ef-b959-d32e6833addd",
  "fromSlotId": "68902738-dfa3-4261-89ea-80ae03f7459f",
  "toSlotId": "deae022f-2449-445a-b531-bc96c7a30548"
}
```

### Cancelar la cita

`POST /scheduling/bookings/48f8d84f-fccd-45ef-b959-d32e6833addd/cancel` → **200**

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
  "bookingId": "48f8d84f-fccd-45ef-b959-d32e6833addd",
  "capacityReleased": true
}
```

### Cancelar dos veces se rechaza

`POST /scheduling/bookings/48f8d84f-fccd-45ef-b959-d32e6833addd/cancel` → **409**

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
    "bookingId": "48f8d84f-fccd-45ef-b959-d32e6833addd"
  },
  "timestamp": "2026-08-06T03:21:37.466Z",
  "path": "/scheduling/bookings/48f8d84f-fccd-45ef-b959-d32e6833addd/cancel"
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
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "responsiblePractitionerId": "9d6f0a1e-3678-44da-a70d-3614fb936959"
}
```

**Respuesta**

```json
{
  "id": "215dead4-3005-4044-8031-2d058058cefe",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "status": "902abacd-a440-52e8-b370-6b5a7618f685",
  "startAt": "2026-08-06T03:21:37.476Z",
  "createdAt": "2026-08-06T03:21:37.476Z"
}
```

### Check-in del encuentro

`POST /clinical/encounters/check-in` → **201**

**Petición**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "episodeId": "215dead4-3005-4044-8031-2d058058cefe",
  "primaryPractitionerId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "reasonText": "Dolor abdominal"
}
```

**Respuesta**

```json
{
  "id": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "episodeId": "215dead4-3005-4044-8031-2d058058cefe",
  "status": "281daa85-6561-5e8b-9802-de6ac76114fa",
  "participantIds": [],
  "locationIds": [],
  "startAt": "2026-08-06T03:21:37.484Z",
  "endAt": null,
  "createdAt": "2026-08-06T03:21:37.484Z"
}
```

### Registrar condición

`POST /clinical/conditions` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
  "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679"
}
```

**Respuesta**

```json
{
  "id": "2228f270-779f-4eaf-845a-94584cb8a12c",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "clinicalStatus": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
  "verificationStatus": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
  "createdAt": "2026-08-06T03:21:37.495Z"
}
```

### Registrar alergia con su reacción

`POST /clinical/allergy-intolerances` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
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
  "id": "008bfe24-d46a-4a4b-9e9c-75cd3ba7e915",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "clinicalStatus": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
  "reactionIds": [
    "231d4b28-a298-4091-922f-c26a800888b6"
  ],
  "createdAt": "2026-08-06T03:21:37.507Z"
}
```

### Registrar observación

`POST /clinical/observations` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
  "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
  "valueDecimal": 37.8
}
```

**Respuesta**

```json
{
  "id": "45fa98b0-fcd4-4b9d-817b-4a49117209f1",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "status": "ecaf731a-1f81-5cb1-967a-ef5f888ba053",
  "componentIds": [],
  "rowVersion": 1,
  "createdAt": "2026-08-06T03:21:37.520Z"
}
```

### Prescribir (queda en borrador)

`POST /clinical/medication-requests` → **201**

**Petición**

```json
{
  "custodianTenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
  "medicationConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
  "prescriberProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "doseText": "500 mg",
  "frequencyText": "cada 8 horas",
  "quantityDecimal": 21
}
```

**Respuesta**

```json
{
  "id": "5cda6a35-3c76-4e43-bc41-026773d93c9a",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": null,
  "createdAt": "2026-08-06T03:21:37.531Z"
}
```

### Firmar la receta

`POST /clinical/medication-requests/5cda6a35-3c76-4e43-bc41-026773d93c9a/sign` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "5cda6a35-3c76-4e43-bc41-026773d93c9a",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "status": "e21a9c9a-ffd2-5bb4-8e60-beb7a10a8d8c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-06T03:21:37.541Z",
  "createdAt": "2026-08-06T03:21:37.531Z"
}
```

### Emitir la receta

`POST /clinical/medication-requests/5cda6a35-3c76-4e43-bc41-026773d93c9a/issue` → **200**

**Petición**

```json
{}
```

**Respuesta**

```json
{
  "id": "5cda6a35-3c76-4e43-bc41-026773d93c9a",
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "status": "cce628c0-3334-50cb-9176-652c14f6f10c",
  "replacesRequestId": null,
  "replacedByRequestId": null,
  "renewedFromRequestId": null,
  "signedAt": "2026-08-06T03:21:37.541Z",
  "createdAt": "2026-08-06T03:21:37.531Z"
}
```

### Emitirla de nuevo se rechaza

`POST /clinical/medication-requests/5cda6a35-3c76-4e43-bc41-026773d93c9a/issue` → **422**

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
    "requestId": "5cda6a35-3c76-4e43-bc41-026773d93c9a",
    "status": "cce628c0-3334-50cb-9176-652c14f6f10c"
  },
  "timestamp": "2026-08-06T03:21:37.565Z",
  "path": "/clinical/medication-requests/5cda6a35-3c76-4e43-bc41-026773d93c9a/issue"
}
```

### Leer el historial clínico del paciente

`GET /clinical/patients/899900ff-bce8-4810-8cac-209bcf80d957/summary` → **200**

> Los cinco bloques en una llamada. `truncated` declara cuáles quedaron recortados por `limit`: un historial incompleto no debe leerse como completo.

**Respuesta**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "conditions": [
    {
      "id": "2228f270-779f-4eaf-845a-94584cb8a12c",
      "codeConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "categoryConceptId": null,
      "clinicalStatusConceptId": "14d3c106-df9c-5c35-a8a0-30490dc3bb46",
      "verificationStatusConceptId": "04bfacc6-b432-5cf2-a066-0539c5d26adb",
      "severityConceptId": null,
      "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
      "onsetAt": null,
      "resolvedAt": null,
      "createdAt": "2026-08-06T03:21:37.495Z"
    }
  ],
  "allergies": [
    {
      "id": "008bfe24-d46a-4a4b-9e9c-75cd3ba7e915",
      "substanceConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "typeConceptId": null,
      "categoryConceptId": null,
      "criticalityConceptId": null,
      "clinicalStatusConceptId": "0f7460b1-8d25-5212-a412-6d523a8d4ed5",
      "createdAt": "2026-08-06T03:21:37.507Z"
    }
  ],
  "medicationRequests": [
    {
      "id": "5cda6a35-3c76-4e43-bc41-026773d93c9a",
      "medicationConceptId": "cefc3500-f5f2-49b5-94dd-89c6bd816679",
      "statusConceptId": "cce628c0-3334-50cb-9176-652c14f6f10c",
      "prescriberProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
      "doseText": "500 mg",
      "frequencyText": "cada 8 horas",
      "validFrom": null,
      "validTo": null,
      "signedAt": "2026-08-06T03:21:37.541Z",
      "issuedAt": "2026-08-06T03:21:37.553Z",
      "createdAt": "2026-08-06T03:21:37.531Z"
    }
  ],
  "observations": [
    {
      "id": "45fa98b0-fcd4-4b9d-817b-4a49117209f1",
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
      "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad"
    }
  ],
  "encounters": [
    {
      "id": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
      "episodeId": "215dead4-3005-4044-8031-2d058058cefe",
      "statusConceptId": "281daa85-6561-5e8b-9802-de6ac76114fa",
      "classConceptId": "0c28fd2d-9b44-5546-92de-f5046d166725",
      "primaryPractitionerId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
      "reasonText": "Dolor abdominal",
      "startAt": "2026-08-06T03:21:37.484Z",
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
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "authorProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
  "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
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
  "noteId": "e9e5f729-8296-481a-9ff9-2fa0e432b396",
  "versionId": "cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "1208a600-fa68-5864-bf45-0fa6908c0394",
  "versionStatusConceptId": "51f96bfa-d490-53c1-9f8b-e2ba4ae964bb"
}
```

### Firmar la versión

`POST /charts/notes/e9e5f729-8296-481a-9ff9-2fa0e432b396/versions/cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9/sign` → **201**

**Petición**

```json
{
  "signerProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959"
}
```

**Respuesta**

```json
{
  "noteId": "e9e5f729-8296-481a-9ff9-2fa0e432b396",
  "versionId": "cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
  "versionStatusConceptId": "87fc5b05-f5ad-5e83-8f35-2b72d50a5cef"
}
```

### Liberar la versión al portal del paciente

`POST /charts/notes/versions/cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9/release` → **201**

**Petición**

```json
{
  "policyVersion": "v1"
}
```

**Respuesta**

```json
{
  "versionId": "cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9",
  "releaseEventId": "84e6b864-dc33-485a-a105-9eadfa53b4e0",
  "patientReleaseStatusConceptId": "5b42233a-7dbe-5558-9c57-47d9fcef4ccb"
}
```

### Abrir un plan de cuidados

`POST /charts/care-plans` → **201**

**Petición**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "authorProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
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
  "id": "35ce863e-6c43-4376-ab50-8aa440cc0903",
  "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
  "activityCount": 1,
  "createdAt": "2026-08-06T03:21:37.624Z"
}
```

### Registrar un documento

`POST /charts/documents` → **201**

**Petición**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "tenantId": "1befcfea-44c0-563a-81cd-337ec6acc840",
  "title": "Informe de laboratorio",
  "authorText": "Laboratorio Central",
  "isExternal": true
}
```

**Respuesta**

```json
{
  "id": "b7d3b680-d709-41d1-814b-018bea0088b5",
  "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
  "fileCount": 0,
  "createdAt": "2026-08-06T03:21:37.635Z"
}
```

### Leer el expediente completo

`GET /charts/patients/899900ff-bce8-4810-8cac-209bcf80d957/chart` → **200**

> Notas (con el texto de su versión vigente), planes con sus actividades y documentos, en una llamada. `releasedToPatient` viene derivado.

**Respuesta**

```json
{
  "patientProfileId": "899900ff-bce8-4810-8cac-209bcf80d957",
  "notes": [
    {
      "noteId": "e9e5f729-8296-481a-9ff9-2fa0e432b396",
      "encounterId": "5ab5cd1a-c0ca-4bad-abd0-b375ce6d3aad",
      "noteTypeConceptId": "06b3e6b3-5154-5061-9620-9ae4a49bcc90",
      "lifecycleStatusConceptId": "861fa574-1d70-5762-9622-62740773a0ea",
      "currentVersionId": "cfe4cb85-7aaa-4d4b-a480-dd166f1e74c9",
      "versionNumber": 1,
      "authorProfileId": "9d6f0a1e-3678-44da-a70d-3614fb936959",
      "chiefComplaintText": "Dolor abdominal",
      "subjectiveText": "Refiere dolor de tres días",
      "objectiveText": "Abdomen blando, sin defensa",
      "assessmentText": "Gastroenteritis probable",
      "planText": "Hidratación y control en 48 h",
      "signedAt": "2026-08-06T03:21:37.606Z",
      "releasedToPatient": true,
      "createdAt": "2026-08-06T03:21:37.585Z"
    }
  ],
  "carePlans": [
    {
      "id": "35ce863e-6c43-4376-ab50-8aa440cc0903",
      "statusConceptId": "1d5da3aa-9426-5410-a484-404d0a038069",
      "intentConceptId": "afcb5210-52da-5e5b-b781-869c399da9c6",
      "goalText": "Recuperar hidratación",
      "startDate": null,
      "endDate": null,
      "activities": [
        {
          "id": "011d8a74-7992-4ee0-93e7-09118223fa85",
          "statusConceptId": "4dd65d40-e8b4-56f1-b001-dac4bcf9169b",
          "detailText": "Control en 48 h",
          "scheduledAt": null
        }
      ],
      "createdAt": "2026-08-06T03:21:37.624Z"
    }
  ],
  "documents": [
    {
      "id": "b7d3b680-d709-41d1-814b-018bea0088b5",
      "title": "Informe de laboratorio",
      "categoryConceptId": "b53e6248-fab7-5dc3-b1e6-2f7d0051ac78",
      "statusConceptId": "54c90a18-3102-5587-a84e-74200652f4b0",
      "authorText": "Laboratorio Central",
      "isExternal": true,
      "documentDate": null,
      "createdAt": "2026-08-06T03:21:37.635Z"
    }
  ],
  "limit": 50,
  "truncated": []
}
```

---
