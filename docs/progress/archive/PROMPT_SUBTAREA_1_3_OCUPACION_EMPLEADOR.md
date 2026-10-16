# TASK PROMPT: Subtarea 1.3 — Catálogo Real de Ocupaciones y Empleadores con Soporte de Texto Libre («Otra»)

## 1. Contexto de Negocio y Justificación Técnica
En el frontend (`mantra-core-health`, rama `mockup`), a través del PR #392 (commits `db69fe30` y `3f9a62c7`), se corrigió el enlace con los catálogos oficiales de Bolivia:
- Ocupaciones: `VS_BO_OCCUPATION` (`occupation:bo:DOCENTE`, `occupation:bo:INGENIERO`, etc.).
- Empleadores: `VS_BO_EMPLOYER` (`employer:bo:...`).
- Salidas libres: cuando el usuario selecciona `occupation:bo:OTRA` o `employer:bo:OTRA`, la interfaz desbloquea los campos de texto libre `occupationFreeText` y `workEmployerFreeText`.

**La brecha actual en el backend (`mantra-core-health-api`):**
1. **Asimetría entre Paciente y Profesional:** `RegisterPatientDto`, `UpdateOwnPatientProfileDto` y `ProfilesPatientsService` ya manejan `occupationConceptId`, `occupationFreeText`, `workEmployerConceptId` y `workEmployerFreeText`. Sin embargo, en el ámbito profesional:
   - `RegisterPractitionerDto` tiene `occupationConceptId` y `occupationFreeText`, pero **carece de `workEmployerConceptId` y `workEmployerFreeText`**. Además, `IamPractitionerSelfRegistrationService` no los persiste en la entidad `Persons`.
   - `UpdateOwnPractitionerProfileDto` (`PATCH /profiles/practitioners/me`) **no tiene ninguno de los cuatro campos**, impidiendo que un médico pueda actualizar su ocupación o empresa una vez registrado.
   - `PractitionerProfileSummaryDto` (`GET /profiles/practitioners/me/summary`) **no expone ninguno de los cuatro campos** en la lectura del perfil profesional.
   - `ProfilesPractitionersService.updateOwnPractitionerProfile` no sincroniza estos campos en `Persons`.
2. **Regla de Exclusión Mutua:** Cuando se selecciona una opción de catálogo, el texto libre debe anularse (`NULL` o `undefined`). Si se escribe texto libre por no existir en el catálogo, el concepto del catálogo debe anularse. Enviar una cadena vacía `""` en un `PATCH` debe borrar el valor actual.

---

## 2. Flujo de Git y Procedimiento de Entrega
Debes ejecutar estrictamente el siguiente flujo de trabajo:
1. **Preparar el espacio de trabajo:**
   - Asegurarte de estar en el repositorio `mantra-core-health-api`.
   - Verificar que el estado del repositorio esté limpio (`git status`).
   - Sincronizar con la rama `dev`:
     ```bash
     git fetch origin dev
     git checkout dev
     git pull origin dev
     ```
2. **Crear rama con la nomenclatura obligatoria:**
   - Nomenclatura requerida: `(dev)/(feature-o-fix)-(dato-de-la-tarea)`
     ```bash
     git checkout -b dev/feat-ocupacion-empleador-texto-libre
     ```
3. **Commits convencionales:**
   - Realizar commits limpios y explicativos:
     - `feat(profiles): soportar ocupacion y empleador con texto libre en perfil profesional`
     - `feat(iam): agregar workEmployer en registro de profesional`
     - `test(profiles): agregar pruebas para alternancia entre catalogo y texto libre`
4. **Push y Pull Request:**
   - Pushear al remoto `origin`:
     ```bash
     git push -u origin dev/feat-ocupacion-empleador-texto-libre
     ```
   - Crear el Pull Request hacia `dev` mediante `gh pr create` asignando a los revisores indicados:
     ```bash
     gh pr create --base dev --title "feat(profiles): paridad de catalogo de ocupaciones y empleadores con texto libre (P19/P20 follow-up)" --body "## Resumen de Cambios
     - Se añaden workEmployerConceptId y workEmployerFreeText a RegisterPractitionerDto e IamPractitionerSelfRegistrationService.
     - Se añaden occupationConceptId, occupationFreeText, workEmployerConceptId y workEmployerFreeText a UpdateOwnPractitionerProfileDto y PractitionerProfileSummaryDto.
     - ProfilesPractitionersService actualiza y limpia los campos en persons con regla de mutua exclusión.
     - Pruebas unitarias e integración en verde.
     - Garantiza paridad con el PR #392 del frontend." --reviewer jsaldias39,PabloArauzCaballero
     ```

---

## 3. Requerimientos Técnicos y Archivos Afectados

### A. DTO de Registro de Profesional
- **Archivo:** `src/modules/iam/dto/register-practitioner.dto.ts`
- **Cambios requeridos:**
  - Importar `EMPLOYER_FREE_TEXT_MAX_LENGTH` de `./register-patient.dto`.
  - Añadir en `RegisterPractitionerDto`:
    ```typescript
    /** Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER). */
    @ApiPropertyOptional({
      format: 'uuid',
      description: 'Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER)',
    })
    @IsOptional()
    @IsUUID()
    workEmployerConceptId?: string;

    /** Empresa en texto libre, para cuando no está en el catálogo. */
    @ApiPropertyOptional({
      maxLength: EMPLOYER_FREE_TEXT_MAX_LENGTH,
      description: 'Empresa en texto libre, para cuando no está en el catálogo',
    })
    @IsOptional()
    @IsString()
    @MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)
    workEmployerFreeText?: string;
    ```

### B. Servicio de Registro de Profesional
- **Archivo:** `src/modules/iam/services/iam-practitioner-self-registration.service.ts`
- **Cambios requeridos:**
  - En la creación de `person` con `this.personsRepo.create(tx, { ... })`:
    - Persistir `workEmployerConceptId` y `workEmployerFreeText` aplicando la exclusión mutua:
      ```typescript
      workEmployerConceptId: dto.workEmployerConceptId,
      workEmployerFreeText: dto.workEmployerConceptId
        ? undefined
        : dto.workEmployerFreeText,
      ```

### C. DTOs de Actualización y Lectura de Perfil Profesional
- **Archivos:**
  - `src/modules/profiles/dto/update-practitioner-profile.dto.ts`
  - `src/modules/profiles/dto/read-practitioner-profile.dto.ts`
- **Cambios en `UpdateOwnPractitionerProfileDto`:**
  - Añadir `occupationConceptId?: string` (con `@ValidateIf((d) => d.occupationConceptId !== '')`).
  - Añadir `occupationFreeText?: string`.
  - Añadir `workEmployerConceptId?: string` (con `@ValidateIf((d) => d.workEmployerConceptId !== '')`).
  - Añadir `workEmployerFreeText?: string`.
- **Cambios en `PractitionerProfileSummaryDto`:**
  - Exponer `occupationConceptId?: string`, `occupationFreeText?: string`, `workEmployerConceptId?: string`, `workEmployerFreeText?: string`.

### D. Servicio de Perfil Profesional
- **Archivo:** `src/modules/profiles/services/profiles-practitioners.service.ts`
- **Cambios requeridos:**
  - En `updateOwnPractitionerProfile`:
    - Actualizar `person.occupationConceptId` y `person.occupationFreeText`:
      - Si viene `occupationConceptId` (no vacío), asignar `occupationConceptId` y limpiar `occupationFreeText = undefined`.
      - Si viene `occupationFreeText` (no vacío) y no viene concepto, asignar `occupationFreeText` y limpiar `occupationConceptId = undefined`.
      - Si viene `''`, limpiar el campo correspondiente.
    - Aplicar la misma lógica para `workEmployerConceptId` y `workEmployerFreeText`.
  - En `getOwnPractitionerProfile`:
    - Incluir estos 4 campos en la proyección del DTO de retorno desde la entidad `Persons`.

---

## 4. Criterios de Aceptación (BDD: GIVEN / WHEN / THEN)

### Escenario 1: Alta de profesional con empresa en texto libre («Otra empresa»)
- **GIVEN** un registro médico con `workEmployerFreeText: "Consultores Médicos Asociados S.R.L."` y sin `workEmployerConceptId`.
- **WHEN** se envía `POST /iam/auth/register-practitioner`.
- **THEN** la API responde `201 Created`.
- **AND** en `profiles.persons` se almacena `work_employer_free_text = 'Consultores Médicos Asociados S.R.L.'` y `work_employer_concept_id = NULL`.

### Escenario 2: Médico actualiza su perfil cambiando a ocupación de catálogo
- **GIVEN** un médico con `occupationFreeText: "Médico rural"`.
- **WHEN** envía `PATCH /profiles/practitioners/me` con `{ "occupationConceptId": "<UUID_DOCENTE>" }`.
- **THEN** la API responde `200 OK`.
- **AND** en `profiles.persons` se actualiza `occupation_concept_id = <UUID_DOCENTE>` y se limpia `occupation_free_text = NULL`.
- **AND** el posterior `GET /profiles/practitioners/me/summary` devuelve `occupationConceptId: "<UUID_DOCENTE>"` y no contiene `occupationFreeText`.

### Escenario 3: Médico borra su ocupación y empleador enviando cadena vacía
- **GIVEN** un médico con ocupación y empleador registrados.
- **WHEN** envía `PATCH /profiles/practitioners/me` con `{ "occupationConceptId": "", "workEmployerFreeText": "" }`.
- **THEN** la API responde `200 OK`.
- **AND** ambos campos quedan en `NULL` en la base de datos sin disparar errores de validación UUID.

---

## 5. Garantía de Calidad (QA Requirements) & Definition of Done (DoD)

### Definition of Done (DoD):
- [ ] `RegisterPractitionerDto` valida `workEmployerConceptId` y `workEmployerFreeText`.
- [ ] `UpdateOwnPractitionerProfileDto` valida los cuatro campos permitiendo cadena vacía para borrado explícito.
- [ ] `PractitionerProfileSummaryDto` expone los cuatro campos en la lectura propia.
- [ ] `ProfilesPractitionersService` implementa la lógica de exclusión mutua y persistencia en `persons`.
- [ ] Pruebas unitarias en:
  - `src/modules/iam/services/iam-practitioner-self-registration.service.spec.ts`
  - `src/modules/profiles/services/profiles-practitioners.service.spec.ts`
- [ ] Verificaciones estáticas y de compilación en verde:
  - `yarn typecheck` (o `npx tsc --noEmit`)
  - `yarn lint`
  - `yarn test`
- [ ] Rama con nomenclatura `dev/feat-ocupacion-empleador-texto-libre` pusheada a `origin` y PR creado apuntando a `dev` con revisores `jsaldias39` y `PabloArauzCaballero`.
