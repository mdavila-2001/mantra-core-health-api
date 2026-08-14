# Catálogo de flujos verificados para el frontend

Qué está **garantizado** de `profiles`, `scheduling` y `chart`/`clinical`: cada
endpoint de esta página se ejercitó con `curl` contra la API real, con la cuenta
de arranque y datos reales, y tiene una prueba de integración que lo fija.

No es la referencia del contrato —ésa es `openapi/openapi.json`— sino la lista de
lo que se comprobó que **funciona**, que no es lo mismo que lo que está
implementado. El bug de terminología (una expansión que jamás devolvió un miembro,
sin error) ya había mostrado que un endpoint con pruebas unitarias sobre mocks
puede estar roto de nacimiento.

- **Verificado el:** 2026-08-06, contra el stack de `docker-compose` poblado.
- **Pruebas que lo fijan:** `test/integration/scheduling-agenda.int-spec.ts`,
  `test/integration/patient-chart-read.int-spec.ts`,
  `test/integration/refresh-cookie.int-spec.ts`.

---

## Lo que estaba roto y se arregló

### 1. Publicar una plantilla de agenda devolvía 500

`POST /scheduling/resources/{id}/templates` fallaba **siempre**, con
`INTERNAL`. En el log:

```
ForeignKeyConstraintViolationException: insert or update on table "schedule_rules"
violates foreign key constraint "fk_schedule_rules_schedule_template_id"
 - detail: Key (schedule_template_id)=(…) is not present in table "schedule_templates".
```

Las FK del proyecto son **columnas sueltas** (`@Property`, no `@ManyToOne`), por
decisión de modelado. La consecuencia es que la unidad de trabajo de MikroORM no
conoce la dependencia padre→hijo y puede emitir el `INSERT` del hijo primero. El
resto del repositorio lo resuelve con un `flush()` intermedio, con este mismo
comentario:

```ts
// FK planas: persistir la cabecera antes de crear la versión que la referencia.
await tx.flush();
```

`scheduling` era **el único módulo sin un solo `flush()`** — 0 frente a 11 en
`clinical`, 4 en `chart` y 2 en `profiles`. Ninguna prueba unitaria podía
detectarlo: quien ordena los `INSERT` es el ORM, y con el repositorio mockeado no
hay ORM.

Arreglado en `scheduling-catalog.service.ts` (plantilla → franjas) y en
`scheduling-bookings.service.ts` (cita → recordatorios), que era el mismo fallo a
punto de aparecer en cuanto alguien confirmara una cita con recordatorios.

### 2. La agenda no se podía leer, así que no se podía reservar

De los **869 endpoints** de la API, sólo 43 son `GET`. En los cuatro módulos que
el interior del front va a consumir la cuenta era:

| Módulo | Rutas | Con `GET` |
| --- | --- | --- |
| `/profiles` | 13 | 1 — sólo `patients/me/summary`, y detrás del guard de identidad verificada |
| `/scheduling` | 20 | 2 — reglas de confirmación y un endpoint interno de worker |
| `/charts` | 12 | **0** |
| `/clinical` | 24 | 1 — políticas de firma |

El caso que lo resume: `POST /scheduling/slots/{id}/holds` exige un `slotId`, y
`POST /scheduling/templates/{id}/generate-slots` devuelve **sólo contadores**
(`created`, `skipped`). Ningún endpoint devolvía el id de un cupo. Reservar una
cita desde el portal era literalmente imposible sin entrar a la base de datos.

Igual el expediente: se podían crear notas, versionarlas, firmarlas, enmendarlas
y liberarlas al paciente, y **ninguna pantalla podía mostrarlas**.

Se añadieron las lecturas mínimas que sostienen J2, I1 e I2 (abajo).

### 3. `onlyAvailable=false` filtraba igual

Encontrado por la propia prueba de integración, en el código nuevo, antes de que
llegara al front. `Boolean('false')` es `true`, así que ni `@Type(() => Boolean)`
ni la conversión implícita del `ValidationPipe` sirven para un booleano de query.
Además, con `enableImplicitConversion` activo, un `@Transform` recibe el valor
**ya convertido**: hay que leer el crudo de `obj[key]`.

Vale para cualquier booleano de query que se añada en el futuro.

---

## Agenda — `scheduling`

### `GET /scheduling/resources`

Recursos agendables del tenant.

```bash
curl -s "$API/scheduling/resources?tenantId=$TENANT" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "items": [
    {
      "id": "68a1855c-758d-4042-a22f-15fee6f297b3",
      "name": "C21287",
      "resourceTypeConceptId": "a1df879c-4ac6-5a7e-8548-bc04207e92fa",
      "resourceRefType": "practitioner_profiles",
      "resourceRefId": "f9ff3780-709c-4644-b249-d98d88cd90aa",
      "practiceId": null,
      "timeZone": null,
      "capacity": 1,
      "stateConceptId": "38a1d301-f40d-5b17-a695-5e6d605f8b19"
    }
  ],
  "count": 1
}
```

Filtros: `practiceId`, `resourceType` (`PRACTITIONER|ROOM|EQUIPMENT`),
`includeInactive`.

### `GET /scheduling/slots` — **el que desbloquea reservar**

```bash
curl -s "$API/scheduling/slots?resourceId=$RESOURCE&from=2026-08-06T00:00:00Z&to=2026-08-20T00:00:00Z&onlyAvailable=true&limit=3" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "items": [
    {
      "id": "97f24ce5-bd45-494f-aec5-b3ecf181204b",
      "resourceId": "2ccc1c76-3ea7-4698-acab-3e3576756cbf",
      "scheduleTemplateId": "4c595da5-24e0-4894-86df-41b104eb5477",
      "startAt": "2026-08-06T08:00:00.000Z",
      "endAt": "2026-08-06T08:30:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "statusConceptId": "10960d55-a26d-51ab-98ef-48b1d64b306b",
      "serviceConceptId": null
    }
  ],
  "count": 3, "limit": 3, "truncated": true
}
```

- `id` es lo que se envía a `POST /scheduling/slots/{id}/holds`.
- `from`/`to` son **obligatorios** y la ventana no puede superar **92 días**
  (`422`); invertida, también `422`. Sin ventana la consulta barre una tabla que
  crece con cada generación.
- `onlyAvailable=true` deja sólo los abiertos con cupo: exactamente lo que el
  portal puede ofrecer.
- `truncated: true` significa «estrechá la ventana», no «no hay más».

### `GET /scheduling/bookings` y `GET /scheduling/bookings/{id}`

Filtros: `tenantId`, `patientProfileId`, `resourceId`, `statusConceptId`,
`from`/`to`. La ventana se aplica sobre el **instante del cupo**, no sobre
`created_at`: una agenda pregunta «qué citas hay esta semana», no «cuáles se
crearon esta semana».

`startAt`/`endAt` se resuelven desde el cupo porque la tabla de citas no guarda
el instante — sin eso, una lista de citas no se puede ni ordenar ni pintar.

El detalle añade los recordatorios y el **snapshot de cancelación** congelado al
confirmar (CAN-APT-001). Es lo que el front debe mostrar al ofrecer cancelar: la
política vigente puede haber cambiado desde que el paciente la aceptó.

```json
{
  "id": "b337de77-767a-45f9-9d7d-4bb9e3e0dd23",
  "patientProfileId": "0a1f726c-b452-4650-860e-937698b8a123",
  "bookableSlotId": "d2835c43-93f7-4e48-b1a6-7c02802bc602",
  "startAt": "2026-08-07T08:00:00.000Z",
  "endAt": "2026-08-07T08:30:00.000Z",
  "statusConceptId": "bf910452-1485-58ca-88dc-184b8b4b2935",
  "confirmedAt": "2026-08-06T03:09:09.747Z",
  "checkedInAt": null,
  "bookingPolicyId": null,
  "cancellationPolicySnapshot": {
    "timeZone": "America/La_Paz",
    "capturedAt": "2026-08-06T03:09:09.747Z",
    "cancellationWindowMinutes": 1440
  },
  "reminders": []
}
```

### Escritura de agenda — recorrido completo verificado

| Paso | Endpoint | Resultado |
| --- | --- | --- |
| Alta de recurso | `POST /scheduling/resources` | `201` |
| Política de reserva | `POST /scheduling/booking-policies` | `201`; código duplicado → `409` |
| Plantilla con franjas | `POST /scheduling/resources/{id}/templates` | `201` — **arreglado**, antes `500` |
| Materializar cupos | `POST /scheduling/templates/{id}/generate-slots` | `201`, `created: 32` |
| Reejecutar la ventana | idem | `created: 0, skipped: 32` — idempotente |
| Reserva temporal | `POST /scheduling/slots/{id}/holds` | `201`, `remainingCapacity: 0` |
| Segundo hold del mismo cupo | idem | `409` — anti-double-booking |
| Confirmar con recordatorios | `POST /scheduling/holds/{token}/confirm` | `201`, `remindersScheduled: 2` — **arreglado** |
| Reutilizar el hold consumido | idem | `409` |
| Check-in | `POST /scheduling/bookings/{id}/check-in` | `200` |
| Reprogramar | `POST /scheduling/bookings/{id}/reschedule` | `200` |
| Cancelar | `POST /scheduling/bookings/{id}/cancel` | `200`, `capacityReleased: true`, y el cupo vuelve a ofrecerse |

---

## Filiación — `profiles`

### `GET /profiles/patients/{profileId}` — la lectura de la F-01

```json
{
  "patientProfileId": "18f74644-a7f1-495b-8b95-be57a518863f",
  "personId": "18f74644-a7f1-495b-8b95-be57a518863f",
  "patientCode": "P1C-24538-11516",
  "masterPatientIndexCode": null,
  "displayName": "Paciente Cacería P1",
  "birthDate": "1990-05-14",
  "administrativeGenderConceptId": null,
  "vitalStatusConceptId": "4abd7a42-a25c-5b7d-9f07-e5e844fa903c",
  "aboGroupConceptId": null,
  "recordLinkageStatusConceptId": "bd3c490e-b866-5ff8-8699-3c0510fbefe1",
  "identityLinks": [],
  "relatedPersons": [],
  "createdAt": "2026-08-06T06:46:20.274Z"
}
```

Dos cosas que conviene saber antes de construir la pantalla:

- **`patientProfileId` y `personId` son el mismo valor.**
  `profiles.patient_profiles.profile_id` referencia directamente
  `profiles.persons(id)`. El alta (`POST /profiles/patients`) ya devuelve ambos
  iguales.
- **`birthDate` es una fecha, sin hora.** Serializarla como instante la
  desplazaría un día al cambiar de zona horaria.

`identityLinks` y `relatedPersons` van en la misma respuesta a propósito: los
contactos de emergencia y la representación legal son datos de seguridad
clínica, y quien atiende no debería encadenar otra petición para verlos.

Un `profileId` inexistente responde **404**, no una respuesta vacía.

### `GET /profiles/patients` — búsqueda

`query` (parcial sobre el nombre, sin distinguir mayúsculas), `patientCode`
(exacto), `limit` (máx. 100), `offset`.

`GET /profiles/patients/me/summary` **sigue funcionando igual**: `me` no es un
UUID, así que la ruta literal gana sobre `:profileId`. Hay una prueba que lo fija.

---

## Expediente — `chart`

### `GET /charts/patients/{patientProfileId}/notes`

Lista de la más reciente a la más antigua, con lo justo de la versión vigente
para pintarla: motivo de consulta, autor, número de versión y si está firmada.
Filtro por `encounterId`.

**No trae el cuerpo completo**: cinco campos de texto libre por cada nota del
historial convertirían la lista en una descarga.

### `GET /charts/notes/{noteId}`

La cabecera, el cuerpo SOAP de la versión vigente (`currentVersion`) y el índice
de todas las versiones.

```json
{
  "noteId": "e92ce01c-80a6-43d0-8f6d-923194ac212c",
  "currentVersionId": "5b36cba1-7d4f-43c5-b871-e4f059c72312",
  "currentVersionNumber": 1,
  "signedAt": null,
  "currentReleasedVersionId": null,
  "currentVersion": {
    "versionNumber": 1,
    "chiefComplaintText": "Dolor de cabeza",
    "subjectiveText": "Refiere cefalea",
    "objectiveText": "TA 120/80",
    "assessmentText": "Cefalea tensional",
    "planText": "Analgesico",
    "signedByProfileId": null,
    "signedAt": null
  },
  "versions": [ … ]
}
```

---

## Resumen clínico — `clinical`

### `GET /clinical/patients/{patientProfileId}/summary`

Problemas, alergias y medicación **vigentes**; con `includeInactive=true` añade
lo resuelto. Un paciente sin historia devuelve listas vacías y `200`, no un error.

`truncated` avisa si alguna lista llegó al tope de 200: un resumen recortado en
silencio se lee como completo, y en un expediente eso no es aceptable.

`criticalityConceptId` de cada alergia es el dato de seguridad clínica del
resumen — regla M34: en móvil se reordena, no se oculta.

### Escritura clínica — verificada

`POST /clinical/care-episodes` · `/clinical/encounters/check-in` ·
`/clinical/conditions` · `/clinical/allergy-intolerances` ·
`/clinical/observations` · `POST /charts/notes` ·
`POST /clinical/encounters/{id}/close` — todos `201`/`200` contra la API real.

Dos comportamientos que el front debe esperar y tratar como estado, no como fallo:

- Abrir un segundo episodio con uno activo → `409` «El paciente ya tiene un
  episodio activo».
- Registrar una alergia ya registrada → `409` «El paciente ya tiene una alergia
  activa a esa sustancia».
- Firmar una versión de nota exige `signerProfileId`.

---

## Sesión — entrega del refresh token

`AUTH_REFRESH_COOKIE_ENABLED` mueve el refresh token del cuerpo a una cookie
`httpOnly`. **Está apagada**, y con ella apagada nada cambia para el equipo.

Qué tendrá que hacer el front cuando se active, y el ajuste de CORS que exige,
está en [`src/common/auth/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/common/auth/README.md).

---

## Lo que sigue sin estar cubierto

Dicho explícitamente para que nadie lo dé por hecho:

- **La autorización de estas lecturas es por rol, no por pertenencia.** Un
  `PRACTITIONER` puede leer la filiación y el expediente de cualquier paciente
  del tenant; no se comprueba que exista una relación asistencial
  (`authz.care_relationships`). Es coherente con el resto de la API hoy, pero
  para un expediente clínico hace falta la comprobación por relación. **Tarjeta
  a Marcelo.**
- **`profiles.person_profiles` queda al margen.** `patient_profiles.profile_id`
  apunta a `persons(id)` y no a `person_profiles(id)`, que es la tabla que lleva
  `profile_type_concept_id`. No lo he tocado —es el modelo canónico quien
  decide—, pero conviene que quede escrito. **Tarjeta a Marcelo.**
- **Los workers de `identity_assurance` reintentan en bucle.** Durante toda la
  sesión, `POST /internal/identity/checks/{id}/results` respondió `422` «No
  existe un intento completado para registrar resultado» cada pocos segundos,
  sobre el mismo puñado de ids. No es de estos módulos, pero inunda el log y
  gasta base. **Tarjeta a Marcelo.**
- No se ejercitaron `charts/care-plans`, `charts/documents`,
  `charts/templates`, `clinical/service-requests`, `diagnostic-reports`,
  `procedures`, `immunizations` ni el ciclo de `medication-requests`
  (firmar/emitir/renovar). Quedan fuera del catálogo: **no** están garantizados.
