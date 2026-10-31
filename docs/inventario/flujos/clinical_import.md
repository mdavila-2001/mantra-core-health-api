<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `clinical_import`

- **Procesos:** 1 · **Máquinas de estado:** 1
- **Operaciones:** 8 (7 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [clinical_import](../endpoints/clinical_import.md)

## Proceso: clinical_import

- **Código:** `clinical_import` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 8
- **Actores:** SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:ClinicalImportController` | Operaciones de ClinicalImportController que el README no asigna a un caso de uso | GET /admin/clinical-imports | SECURITY_ADMIN | BAJO | 0 |
|  |  | POST /admin/clinical-imports | SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /admin/clinical-imports/{id} | SECURITY_ADMIN | BAJO | 0 |
|  |  | POST /admin/clinical-imports/{id}/confirm | SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /admin/clinical-imports/{id}/loaded | SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /admin/clinical-imports/{id}/report | SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /admin/clinical-imports/catalog | SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /admin/clinical-imports/import-template | SECURITY_ADMIN | BAJO | 0 |

### Diagrama — etapas `ctrl:ClinicalImportController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  subgraph s0["ctrl:ClinicalImportController · Operaciones de ClinicalImportController que el…"]
    o1["GET /admin/clinical-imports"]:::op
    o3["POST /admin/clinical-imports"]:::op
    o4["GET /admin/clinical-imports/{id}"]:::op
    o5["POST /admin/clinical-imports/{id}/confirm"]:::op
    o6["GET /admin/clinical-imports/{id}/loaded"]:::op
    o7["GET /admin/clinical-imports/{id}/report"]:::op
    o8["GET /admin/clinical-imports/catalog"]:::op
    o9["GET /admin/clinical-imports/import-template"]:::op
  end
  a2 --> o1
  a2 --> o3
  a2 --> o4
  a2 --> o5
  a2 --> o6
  a2 --> o7
  a2 --> o8
  a2 --> o9
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Máquinas de estado

### Máquina de estados `TRANSITIONS`

Declarada en `src/modules/clinical_import/clinical-import.state.ts:12`. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.

```mermaid
stateDiagram-v2
  [*] --> VALIDADO
  [*] --> RECHAZADO
  VALIDADO --> EN_COLA
  EN_COLA --> PROCESANDO
  PROCESANDO --> COMPLETADO
  PROCESANDO --> FALLIDO
  COMPLETADO --> [*]
  FALLIDO --> [*]
  RECHAZADO --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| PATCH /insurance-campaigns/{id}/status | sin destino nombrado | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus |
| PATCH /insurance/campaigns/{id}/status | sin destino nombrado | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus |
| POST /admissions/{id}/claim | sin destino nombrado | PractitionerAdmissionsService.claim → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/decision | sin destino nombrado | PractitionerAdmissionsService.decide → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/reassign | sin destino nombrado | PractitionerAdmissionsService.reassign → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/reinstate | sin destino nombrado | PractitionerAdmissionsService.reinstate → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/release | sin destino nombrado | PractitionerAdmissionsService.release → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/request-info | sin destino nombrado | PractitionerAdmissionsService.requestInfo → PractitionerAdmissionsService.assertTransition |
| POST /admissions/{id}/suspend | sin destino nombrado | PractitionerAdmissionsService.suspend → PractitionerAdmissionsService.assertTransition |
| POST /admissions/expire-sweep | sin destino nombrado | PractitionerAdmissionsService.expireSweep → PractitionerAdmissionsService.sweepLocked |
| POST /profiles/practitioners/me/admission/resubmit | sin destino nombrado | PractitionerAdmissionsService.resubmit → PractitionerAdmissionsService.assertTransition |
| POST /profiles/practitioners/me/admission/withdraw | sin destino nombrado | PractitionerAdmissionsService.withdraw → PractitionerAdmissionsService.assertTransition |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/clinical-imports



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!Number.isInteger(n) || n ‹ 1 || n › 100"}:::decision
  n2 --> n3
  n4(["500 INTERNAL {HttpStatus.BAD_REQUEST}"]):::error
  n3 -->|"sí"| n4
  n5(("200 Responde con éxito")):::ok
  n3 -->|"no"| n5
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /admin/clinical-imports

Valida y previsualiza. No escribe nada en ninguna historia clínica.

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND; ImportError: PAYLOAD_TOO_LARGE |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Transacción: guarded(…)"]:::transaccion
  n2 --> n3
  n4{"file === undefined"}:::decision
  n3 --> n4
  n5(["500 INTERNAL BAD_REQUEST"]):::error
  n4 -->|"sí"| n5
  n6["Llama a ClinicalImportService.create"]:::llamada
  n4 -->|"no"| n6
  n7{"spec === undefined"}:::decision
  n6 --> n7
  n8(["500 INTERNAL NOT_FOUND"]):::error
  n7 -->|"sí"| n8
  n9{"field !== null"}:::decision
  n7 -->|"no"| n9
  n10(["500 INTERNAL BAD_REQUEST"]):::error
  n9 -->|"sí"| n10
  n11{"input.bytes.length › LIMITS.maxBytes"}:::decision
  n9 -->|"no"| n11
  n12(["500 INTERNAL PAYLOAD_TOO_LARGE"]):::error
  n11 -->|"sí"| n12
  n13{"parsed.rows.length › LIMITS.maxRows"}:::decision
  n11 -->|"no"| n13
  n14(["500 INTERNAL PAYLOAD_TOO_LARGE"]):::error
  n13 -->|"sí"| n14
  n15(("201 Responde con éxito")):::ok
  n13 -->|"no"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/clinical-imports/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ClinicalImportService.get"]:::llamada
  n2 --> n3
  n4["Llama a ClinicalImportService.require"]:::llamada
  n3 --> n4
  n5{"batch === null"}:::decision
  n4 --> n5
  n6(["500 INTERNAL NOT_FOUND"]):::error
  n5 -->|"sí"| n6
  n7(("200 Responde con éxito")):::ok
  n5 -->|"no"| n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /admin/clinical-imports/{id}/confirm



| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND; ImportError: CONFLICT |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ClinicalImportService.confirm"]:::llamada
  n2 --> n3
  n4{"key === undefined || key === '' || key.length › LIMITS.maxIdempotencyKeyLength || !IDEMPOTENCY_KEY.test(key)"}:::decision
  n3 --> n4
  n5(["500 INTERNAL BAD_REQUEST"]):::error
  n4 -->|"sí"| n5
  n6["Llama a ClinicalImportService.require"]:::llamada
  n4 -->|"no"| n6
  n7{"batch === null"}:::decision
  n6 --> n7
  n8(["500 INTERNAL NOT_FOUND"]):::error
  n7 -->|"sí"| n8
  n9{"batch.confirmationKey !== undefined"}:::decision
  n7 -->|"no"| n9
  n10(["500 INTERNAL CONFLICT"]):::error
  n9 -->|"sí"| n10
  n11{"others.some((o) =› o.confirmationKey === key)"}:::decision
  n9 -->|"no"| n11
  n12(["500 INTERNAL CONFLICT"]):::error
  n11 -->|"sí"| n12
  n13{"field !== null"}:::decision
  n11 -->|"no"| n13
  n14(["500 INTERNAL CONFLICT"]):::error
  n13 -->|"sí"| n14
  n15{"batch.view.status !== 'VALIDADO'"}:::decision
  n13 -->|"no"| n15
  n16(["500 INTERNAL CONFLICT"]):::error
  n15 -->|"sí"| n16
  n17{"!moved"}:::decision
  n15 -->|"no"| n17
  n18["Llama a ClinicalImportService.require"]:::llamada
  n17 -->|"sí"| n18
  n19{"batch === null"}:::decision
  n18 --> n19
  n20(["500 INTERNAL NOT_FOUND"]):::error
  n19 -->|"sí"| n20
  n21(["500 INTERNAL CONFLICT"]):::error
  n19 -->|"no"| n21
  n22["Llama a ClinicalImportService.require"]:::llamada
  n17 -->|"no"| n22
  n23{"batch === null"}:::decision
  n22 --> n23
  n24(["500 INTERNAL NOT_FOUND"]):::error
  n23 -->|"sí"| n24
  n25(("202 Responde con éxito")):::ok
  n23 -->|"no"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /admin/clinical-imports/{id}/loaded

Qué agregó el lote y dónde: sólo identificadores. Leerlo queda auditado.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND; ImportError: CONFLICT |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ClinicalImportService.loaded"]:::llamada
  n2 --> n3
  n4["Llama a ClinicalImportService.require"]:::llamada
  n3 --> n4
  n5{"batch === null"}:::decision
  n4 --> n5
  n6(["500 INTERNAL NOT_FOUND"]):::error
  n5 -->|"sí"| n6
  n7{"!isFinished(batch.view.status)"}:::decision
  n5 -->|"no"| n7
  n8(["500 INTERNAL CONFLICT"]):::error
  n7 -->|"sí"| n8
  n9(("200 Responde con éxito")):::ok
  n7 -->|"no"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /admin/clinical-imports/{id}/report

El informe: sólo fila, resultado y motivo. Leerlo queda auditado.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: NOT_FOUND; ImportError: CONFLICT |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ClinicalImportService.report"]:::llamada
  n2 --> n3
  n4["Llama a ClinicalImportService.require"]:::llamada
  n3 --> n4
  n5{"batch === null"}:::decision
  n4 --> n5
  n6(["500 INTERNAL NOT_FOUND"]):::error
  n5 -->|"sí"| n6
  n7{"!isFinished(batch.view.status)"}:::decision
  n5 -->|"no"| n7
  n8(["500 INTERNAL CONFLICT"]):::error
  n7 -->|"sí"| n8
  n9(("200 Responde con éxito")):::ok
  n7 -->|"no"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. GET /admin/clinical-imports/import-template

T1: la plantilla del tipo, en CSV o JSON, generada del mismo esquema que valida.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportError: BAD_REQUEST; ImportError: NOT_FOUND |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ClinicalImportService.template"]:::llamada
  n2 --> n3
  n4{"format !== 'csv' && format !== 'json'"}:::decision
  n3 --> n4
  n5(["500 INTERNAL BAD_REQUEST"]):::error
  n4 -->|"sí"| n5
  n6{"file === null"}:::decision
  n4 -->|"no"| n6
  n7(["500 INTERNAL NOT_FOUND"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /admin/clinical-imports/catalog | 200, 401, 403, 429 | 0 |
