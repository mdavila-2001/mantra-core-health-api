# TASK PROMPT: Subtarea 1.4 — Departamento de Emisión de Documento de Identidad Obligatorio (`VS_BO_DEPARTMENT`)

> **MODO DE EJECUCIÓN:** Este prompt está diseñado para ejecutarse en **Modo Planificación (Planning Mode)**.
> El agente/asistente debe iniciar en fase de investigación, generar un `implementation_plan.md` exhaustivo, esperar la aprobación explícita del usuario, ejecutar los cambios con rigor atómico, verificar la solución mediante pruebas unitarias e integración, y documentar el resultado final en `walkthrough.md`.

---

## 1. Contexto de Negocio y Justificación Técnica

En el Estado Plurinacional de Bolivia, el Servicio General de Identificación Personal (SEGIP) emite Cédulas de Identidad (CI) cuyos números numéricos frecuentemente colisionan entre departamentos (por ejemplo, existe un carnet 4567890 expedido en La Paz y otro idéntico expedido en Santa Cruz a dos ciudadanos completamente distintos). La diferenciación legal y unívoca radica en la extensión departamental (`LP`, `SC`, `CB`, `OR`, `PT`, `TJ`, `CH`, `BE`, `PA`).

### El cambio en Frontend (`mantra-core-health`, rama `mockup`)
En el frontend, a través del **PR #390** (commits `b300adeb` y `b5baada2`: *"fix(alta paciente): el departamento de emisión se ve —y es— obligatorio"*), el formulario de registro de paciente marcó el selector de departamento emisor como un campo estrictamente obligatorio (`Validators.required`).

### La brecha técnica en Backend (`mantra-core-health-api`)
Actualmente, el backend presenta tres deficiencias en el manejo de este identificador:
1. **En Pacientes (`RegisterPatientDto`):** `issuerAdministrativeAreaConceptId` está decorado con `@IsOptional()`. Si un cliente o atacante omite la propiedad, la API responde `201 Created` y guarda `issuer_administrative_area_concept_id = NULL` en `common.identifiers`, introduciendo registros de identidad incompletos y ambiguos.
2. **En Profesionales (`RegisterPractitionerDto`):** Aunque el acceso del profesional se realiza mediante correo electrónico, el campo `nationalId` es opcional; sin embargo, si el profesional declara su documento de identidad, `issuerAdministrativeAreaConceptId` debe exigirse obligatoriamente mediante validación condicional (`@ValidateIf`).
3. **Validación Semántica del Catálogo (`VS_BO_DEPARTMENT`):** En la base de datos PostgreSQL, la clave foránea de `common.identifiers.issuer_administrative_area_concept_id` apunta genéricamente a la tabla `terminology.catalog_concepts`. Por tanto, a nivel de base de datos se aceptaría cualquier UUID arbitrario (como una especialidad médica o una categoría de insumos). Se requiere validar semánticamente que el concepto pertenezca al value set `VS_BO_DEPARTMENT`.
4. **Infraestructura Existente:** El servicio `AdministrativeAreaCatalogService` (`src/modules/profiles/services/administrative-area-catalog.service.ts`) **ya existe y ya está exportado** por `ProfilesModule` (el cual es importado por `IamModule`). Este servicio expone el método:
   ```typescript
   await this.administrativeAreas.assertIsAdministrativeArea(tx, conceptId);
   ```
   el cual comprueba pertenencia contra `VS_BO_DEPARTMENT` y lanza `PreconditionFailedException (422)` si el concepto es ajeno al catálogo.

---

## 2. Flujo de Git y Procedimiento de Entrega

Debes ejecutar estrictamente el siguiente flujo de trabajo en la terminal del proyecto:

1. **Preparación y verificación del espacio de trabajo:**
   - Asegurarse de estar en el repositorio backend: `d:\Trabajos Secundarios\Mantra Core Technologies\mantra-core-health-api`.
   - Confirmar que el árbol de trabajo esté limpio:
     ```bash
     git status
     ```
   - Sincronizar y situarse en la rama base `dev`:
     ```bash
     git fetch origin dev
     git checkout dev
     git pull origin dev
     ```

2. **Creación de la rama de trabajo con nomenclatura obligatoria:**
   - **Formato exigido:** `(nombre-del-dev)/(feature-o-fix)-(dato-de-la-tarea)`
   - *Ejemplo:* Si tu usuario/identificador es `marcelo`, la rama debe llamarse:
     ```bash
     git checkout -b <tu-nombre>/feat-departamento-emision-obligatorio
     ```
     *(ejemplo: `marcelo/feat-departamento-emision-obligatorio`)*

3. **Estrategia de Commits Atómicos y Convencionales:**
   - Realizar commits incrementales respetando la convención:
     - `feat(iam): hacer obligatorio el departamento emisor de documento en alta de paciente`
     - `feat(iam): validar condicionalmente departamento emisor en alta de profesional`
     - `feat(iam): validar semantica de issuerAdministrativeAreaConceptId contra VS_BO_DEPARTMENT`
     - `test(iam): agregar pruebas unitarias e integracion para departamento emisor`

4. **Publicación y Apertura de Pull Request:**
   - Pushear la rama al remoto `origin`:
     ```bash
     git push -u origin <tu-nombre>/feat-departamento-emision-obligatorio
     ```
   - Crear el Pull Request hacia la rama `dev` mediante el GitHub CLI (`gh`), configurando el título descriptivo, el resumen de cambios y asignando como revisores a `jsaldias39` y `PabloArauzCaballero`:
     ```bash
     gh pr create --base dev --title "feat(iam): departamento de emision obligatorio y validado en autorregistros (PR #390 front)" --body "## Resumen de Cambios
     - RegisterPatientDto: issuerAdministrativeAreaConceptId es ahora obligatorio (@IsUUID, sin @IsOptional).
     - RegisterPractitionerDto: issuerAdministrativeAreaConceptId es condicionalmente obligatorio cuando se aporta nationalId (@ValidateIf).
     - IamPatientSelfRegistrationService e IamPractitionerSelfRegistrationService inyectan AdministrativeAreaCatalogService y validan que el concepto pertenezca al catálogo VS_BO_DEPARTMENT.
     - Pruebas unitarias e integración en verde con garantía de cobertura de errores 400 y 422.
     - Garantiza paridad estricta con el PR #390 del frontend (mockup) y previene colisiones de cédulas bolivianas." --reviewer jsaldias39,PabloArauzCaballero
     ```

---

## 3. Requerimientos Técnicos y Archivos a Modificar

### A. DTO de Registro de Paciente
- **Archivo:** `src/modules/iam/dto/register-patient.dto.ts`
- **Modificación:**
  - Retirar el decorador `@IsOptional()`.
  - Reemplazar `@ApiPropertyOptional` por `@ApiProperty`.
  ```typescript
  /**
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`): la
   * terminación LP/CB/SC/... que evita confundir cédulas homónimas de
   * departamentos distintos (backlog T-01, PR #390 front).
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Departamento emisor del documento (catálogo VS_BO_DEPARTMENT)',
    example: 'b567d1a2-4567-4e89-b123-456789abcdef',
  })
  @IsUUID()
  issuerAdministrativeAreaConceptId!: string;
  ```

### B. DTO de Registro de Profesional
- **Archivo:** `src/modules/iam/dto/register-practitioner.dto.ts`
- **Modificación:**
  - Añadir validación condicional mediante `@ValidateIf`: si `nationalId` está presente y no está vacío, `issuerAdministrativeAreaConceptId` es obligatorio.
  ```typescript
  /**
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`).
   * Obligatorio si se aporta nationalId: una cédula sin departamento de
   * emisión no previene homónimos (PR #390 front).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Departamento emisor del documento (catálogo VS_BO_DEPARTMENT). Obligatorio si se declara nationalId.',
  })
  @ValidateIf(
    (dto: RegisterPractitionerDto) =>
      dto.nationalId !== undefined && dto.nationalId.trim() !== '',
  )
  @IsUUID('4', {
    message:
      'El departamento emisor del documento debe ser un UUID válido si se declara nationalId',
  })
  issuerAdministrativeAreaConceptId?: string;
  ```

### C. Servicio de Auto-Registro de Paciente
- **Archivo:** `src/modules/iam/services/iam-patient-self-registration.service.ts`
- **Modificación:**
  - Inyectar `AdministrativeAreaCatalogService` en el constructor de la clase.
  - Dentro de `this.em.transactional(async (tx) => { ... })`, antes de invocar `this.identifiersRepo.create(...)` para el documento de identidad nacional:
  ```typescript
  // Validar semánticamente que el departamento pertenece al catálogo VS_BO_DEPARTMENT
  await this.administrativeAreas.assertIsAdministrativeArea(
    tx,
    dto.issuerAdministrativeAreaConceptId,
  );
  ```

### D. Servicio de Auto-Registro de Profesional
- **Archivo:** `src/modules/iam/services/iam-practitioner-self-registration.service.ts`
- **Modificación:**
  - Inyectar `AdministrativeAreaCatalogService` en el constructor.
  - En la sección donde se evalúa `if (dto.nationalId) { ... }` (alrededor de la línea 600):
  ```typescript
  if (dto.nationalId) {
    if (dto.issuerAdministrativeAreaConceptId) {
      await this.administrativeAreas.assertIsAdministrativeArea(
        tx,
        dto.issuerAdministrativeAreaConceptId,
      );
    }
    this.identifiersRepo.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PRACTITIONER,
      ownerId: person.id,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: dto.nationalId,
      useConceptId: CONCEPTS.USE_OFFICIAL,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      issuerAdministrativeAreaConceptId:
        dto.issuerAdministrativeAreaConceptId,
      actorUserId: user.id,
    });
  }
  ```

---

## 4. Criterios de Aceptación (BDD: GIVEN / WHEN / THEN)

### Escenario 1: Alta exitosa de paciente con departamento emisor de `VS_BO_DEPARTMENT`
- **GIVEN** un payload de registro de paciente válido que contiene `nationalId: "6543210"` e `issuerAdministrativeAreaConceptId` con el UUID del departamento de Santa Cruz (`geo:bo:department:SC`).
- **WHEN** se envía la petición `POST /iam/auth/register-patient`.
- **THEN** la API responde con código `201 Created`.
- **AND** en la tabla `common.identifiers` se crea el registro con `type_concept_id = ID_TYPE_NATIONAL` e `issuer_administrative_area_concept_id` igual al UUID de Santa Cruz.

### Escenario 2: Rechazo con 400 por omisión de departamento emisor en alta de paciente
- **GIVEN** un payload de registro de paciente que aporta `nationalId: "6543210"` pero omite la propiedad `issuerAdministrativeAreaConceptId`.
- **WHEN** se envía la petición `POST /iam/auth/register-patient`.
- **THEN** la API rechaza inmediatamente con `400 Bad Request`, cuerpo `{ "code": "VALIDATION_FAILED" }` indicando que `issuerAdministrativeAreaConceptId` debe ser un UUID.
- **AND** no se crea ninguna cuenta ni transacción en la base de datos.

### Escenario 3: Rechazo con 422 por concepto no perteneciente a `VS_BO_DEPARTMENT`
- **GIVEN** un payload de registro de paciente que envía en `issuerAdministrativeAreaConceptId` un UUID válido en formato, pero correspondiente a un concepto de ocupación o especialidad médica.
- **WHEN** se envía la petición `POST /iam/auth/register-patient`.
- **THEN** la API rechaza con `422 Unprocessable Entity` (o `PreconditionFailedException`) con el mensaje:
  `"El departamento no pertenece al catálogo de departamentos de Bolivia"`.
- **AND** la transacción se revierte en su totalidad.

### Escenario 4: Alta exitosa de profesional con documento y departamento emisor válido
- **GIVEN** un payload de registro de profesional con `email`, `password`, `nationalId: "7890123"` y un UUID de `issuerAdministrativeAreaConceptId` correspondiente a Cochabamba.
- **WHEN** se envía la petición `POST /iam/auth/register-practitioner`.
- **THEN** la API responde con código `201 Created` y asocia el identificador oficial a la persona del profesional.

### Escenario 5: Rechazo con 400 en profesional si aporta `nationalId` pero omite el departamento
- **GIVEN** un payload de registro de profesional con `nationalId: "7890123"` pero sin `issuerAdministrativeAreaConceptId`.
- **WHEN** se envía la petición `POST /iam/auth/register-practitioner`.
- **THEN** la API responde con `400 Bad Request` indicando que el departamento emisor es requerido cuando se envía el documento.

### Escenario 6: Alta exitosa de profesional sin documento de identidad
- **GIVEN** un payload de registro de profesional que omite tanto `nationalId` como `issuerAdministrativeAreaConceptId`.
- **WHEN** se envía la petición `POST /iam/auth/register-practitioner`.
- **THEN** la API responde `201 Created` (el profesional se crea correctamente sin identificador oficial de tipo CI).

---

## 5. Garantía de Calidad (QA Requirements) & Definition of Done (DoD)

### Matriz de Pruebas Obligatoria:

1. **Pruebas Unitarias de Servicios IAM:**
   - `src/modules/iam/services/iam-patient-self-registration.service.spec.ts`:
     - Test unitario verificando que el servicio invoca `administrativeAreas.assertIsAdministrativeArea(tx, dto.issuerAdministrativeAreaConceptId)`.
     - Test unitario simulando que `assertIsAdministrativeArea` lanza `PreconditionFailedException` y verificando que la excepción burbujea sin persistir el usuario.
   - `src/modules/iam/services/iam-practitioner-self-registration.service.spec.ts`:
     - Test verificando que cuando `dto.nationalId` está presente, se valida el departamento emisor.
     - Test verificando que cuando `dto.nationalId` está ausente, no se invoca la validación de departamento emisor.

2. **Pruebas de Validación de DTOs (Unitarias / ValidationPipe):**
   - Verificar que `RegisterPatientDto` arroja error de validación cuando `issuerAdministrativeAreaConceptId` es `undefined`, `null` o una cadena vacía `""`.
   - Verificar que `RegisterPractitionerDto` pasa validación sin `nationalId` ni `issuerAdministrativeAreaConceptId`.
   - Verificar que `RegisterPractitionerDto` falla validación con `nationalId: "123"` e `issuerAdministrativeAreaConceptId: undefined`.

3. **Pruebas de Integración (E2E / Controller / Database):**
   - En `test/integration/patient-registration.int-spec.ts` (o archivo de integración equivalente):
     - Asegurar que los fixtures de prueba envíen un UUID válido sembrado en `VS_BO_DEPARTMENT` para que los tests de registro de paciente existentes no fallen.
     - Agregar caso de prueba con HTTP 422 para concepto de departamento inválido.

4. **Verificación Estática y de Tipos (Zero Regressions):**
   - Ejecutar `yarn typecheck` (o `npx tsc --noEmit`) asegurando 0 errores de compilación TypeScript.
   - Ejecutar `yarn lint` asegurando 0 violaciones de estilo ESLint / Prettier.
   - Ejecutar `yarn test` asegurando que toda la suite de pruebas unitarias pase al 100%.

### Definition of Done (DoD) Checklist:
- [ ] `RegisterPatientDto` tiene `issuerAdministrativeAreaConceptId` como campo obligatorio decorado con `@ApiProperty` y `@IsUUID()`.
- [ ] `RegisterPractitionerDto` valida condicionalmente `issuerAdministrativeAreaConceptId` con `@ValidateIf`.
- [ ] `IamPatientSelfRegistrationService` valida la pertenencia al catálogo con `assertIsAdministrativeArea`.
- [ ] `IamPractitionerSelfRegistrationService` valida la pertenencia al catálogo cuando se declara `nationalId`.
- [ ] Las pruebas unitarias cubren los casos de éxito, omisión y catálogo inválido.
- [ ] Los tests de integración existentes adaptados a la obligatoriedad del campo pasan en verde.
- [ ] Compilación TypeScript y linter limpios (`yarn typecheck`, `yarn lint`).
- [ ] Rama creada desde `dev` con la nomenclatura `(nombre-del-dev)/(feature-o-fix)-(dato-de-la-tarea)`.
- [ ] Commits atómicos y convencionales realizados.
- [ ] Push a `origin` y Pull Request abierto hacia `dev` con revisores `jsaldias39` y `PabloArauzCaballero`.
