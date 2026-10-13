# Plan — Verificación de identidad full stack

- Fecha: 2026-10-13 · Repos afectados: `wt-movil-pr` (Flutter), `wt-api-pr` (NestJS), `wt-e2e` (Angular) · Predecesor: `TRASPASO-CODEX.md` §8
- Resultado observable: la persona completa, en orden, foto frontal del documento, foto posterior y prueba de vida; la API guarda el expediente y el portal administrativo muestra el caso y sus evidencias a personal autorizado.
- Kill-test: enviar un caso real de punta a punta y comprobar que el portal administrativo, tras recargar, muestra sus tres evidencias y el estado persistido; el titular no puede leer otro caso y un admin de otro tenant no puede acceder a él.

## Alcance

- IN: app móvil, flujo web equivalente, API, almacenamiento de evidencias, liveness mediante proveedor acordado, portal administrativo, permisos, auditoría, estados, expiración/retención, ilustraciones guía originales de AloVida y verificación de punta a punta.
- OUT: copiar marca, pantallas o ilustraciones propietarias de un tercero; emitir un veredicto de identidad desde el cliente; usar imágenes guía como evidencia; guardar datos biométricos en logs o analytics; publicar build o desplegar.
- Ambigüedades registradas:
  - No se indicó qué producto de referencia se quiere igualar. Supuesto: reproducir exactamente el orden y la claridad funcional pedidos, con diseño e ilustraciones originales AloVida. Para comparar una referencia visual concreta, Pablo debe aportar enlace o capturas con autorización de uso.
  - No se indicó proveedor de liveness. Supuesto: integrar un SDK/proveedor real detrás de un adaptador del backend; no se declarará «prueba de vida» a una selfie estática. El proveedor, el costo, la región de procesamiento y la retención deben confirmarse antes de habilitar producción.
  - Se asume que «portal administrativo» significa el portal web Angular existente; la app Flutter administrativa queda fuera salvo que Pablo confirme que también debe administrar casos desde móvil.

## Estado inicial observado

- Flutter ya pide frente, reverso y selfie paso a paso, pero permite galería también para la selfie y combina las tres capturas en una sola imagen antes de enviarlas.
- Angular permite subir un único archivo de identidad (imagen o PDF); no presenta los tres pasos.
- API NestJS ya tiene `identity_assurance`, persistencia de casos/evidencias, revisión manual y endpoints administrativos.
- Angular ya tiene cola y pantallas administrativas de `identity_assurance`, además de una vista de casos del titular. El contrato visible no representa frente, reverso y resultado de liveness como evidencias separadas del flujo solicitado.
- La revisión backend del 2026-10-05 documenta falta de aislamiento tenant/sujeto en operaciones administrativas de casos y evidencia. Resolver y probar esa brecha es requisito previo a exponer evidencias en el portal.

## H1 — Contrato seguro y proveedor de liveness
**CA:** Dado un titular autenticado, cuando inicia la verificación, entonces la API crea un único caso asociado al titular y tenant correctos, exige consentimiento y acepta evidencia tipada sin confiar en el cliente para resolver el resultado.
**DoD:** `corepack yarn test src/modules/identity_assurance --runInBand --silent` y pruebas de integración con dos tenants, archivos y consentimiento; todos los intentos cruzados responden 404/403 sin escrituras ni metadatos ajenos.
**Estado:** TODO

### H1.S1 — Revisar y cerrar el alcance de acceso
**CA:** Dado un admin de tenant A, cuando consulta o modifica un caso, evidencia, check o autoridad del tenant B, entonces no obtiene datos y no produce cambios.
**DoD:** pruebas de integración con usuarios/tenants/archivos reales de test; consultas SQL posteriores demuestran cero escrituras cruzadas.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Atar caso, sujeto, archivo, consentimiento y autoridad al tenant/sujeto validado por servidor. | Un UUID ajeno no permite lectura ni mutación. | Suite dirigida de `identity_assurance` + integración cross-tenant → cero accesos cruzados. | TODO |
| H1.S1.M2 | Definir contrato versionado de evidencia por tipo y orden requerido. | Un caso distingue `DOCUMENT_FRONT`, `DOCUMENT_BACK` y `LIVENESS`; faltantes no pasan a revisión completa. | Spec de DTO/contrato + pruebas de validación → tipos y secuencia rechazados/aceptados según contrato. | TODO |
| H1.S1.M3 | Seleccionar proveedor, SDK, región, tratamiento y retención de liveness. | El flujo usa un proveedor aprobado y deja constancia de consentimiento y versión del proveedor. | Revisión de integración y configuración → entorno de prueba produce un resultado verificable del proveedor. | TODO |
| H1.S1.M4 | Definir ciclo de vida, acceso y borrado de evidencias con auditoría. | Cada lectura/descarga queda auditada y el vencimiento sigue política aprobada. | Pruebas de acceso, auditoría y ciclo de vida → evidencia accesible solo según política y rol. | TODO |

## H2 — Captura guiada móvil y web
**CA:** Dado un titular que inicia el trámite, cuando avanza, entonces ve y completa frente, reverso y liveness en ese orden, con revisión/reintento y estado claro de envío.
**DoD:** suites Flutter y Angular dirigidas; recorrido visual en dispositivos/anchos cubiertos, claro y oscuro, con evidencia de cada estado.
**Estado:** TODO

### H2.S1 — Flutter
**CA:** Cada captura se guarda como evidencia independiente del caso; frente y reverso permiten cámara o archivo si la política lo admite; liveness abre la cámara/proveedor y nunca se acepta desde galería.
**DoD:** `flutter analyze` y tests dirigidos al flujo; integration test ejecuta los tres pasos, reintentos, cancelación y envío.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Ajustar el wizard a tres etapas nombradas y obligatorias. | No se puede enviar con una etapa omitida y el orden es frente → reverso → liveness. | `flutter test <spec dirigido>` → pasos y bloqueo de avance cubiertos. | TODO |
| H2.S1.M2 | Crear guía visual original para frente y reverso con ilustraciones vectoriales de encuadre. | Cada guía muestra el lado esperado, orientación, luz y reflejos sin usar datos de una persona real. | Capturas del simulador en claro/oscuro y revisión de accesibilidad. | TODO |
| H2.S1.M3 | Integrar captura de liveness con el SDK aprobado y estados de permiso, cancelación y reintento. | El servidor solo recibe un resultado verificable del proveedor; selfie de galería no completa el paso. | Test del adaptador + integration test con sandbox del proveedor. | TODO |
| H2.S1.M4 | Separar carga y progreso de cada evidencia y recuperar fallos sin perder pasos válidos. | Reintentar una carga no duplica el caso ni borra capturas ya aceptadas. | Tests de idempotencia/reintento y recorrido móvil. | TODO |

### H2.S2 — Angular
**CA:** La experiencia web ofrece los mismos tres pasos, contenidos, estados y reglas que móvil, ajustados a cámara/navegador.
**DoD:** `yarn ng test --watch=false --include=<spec>` y Playwright real contra API; capturas 390 y 1440, claro y oscuro.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S2.M1 | Reemplazar el formulario de un archivo por el flujo de tres evidencias. | Frente, reverso y liveness se completan en orden con estados equivalentes a Flutter. | Spec Angular y Playwright → tres tipos de evidencia viajan por contrato. | TODO |
| H2.S2.M2 | Adaptar guías vectoriales originales y controles responsivos/accesibles. | Cada paso tiene instrucciones visibles, lector de pantalla, foco y alternativa de reintento. | Playwright 390/1440 en ambos temas + axe sin violaciones nuevas. | TODO |

## H3 — Persistencia e integración backend
**CA:** Dado el envío completo, cuando la API confirma, entonces caso, archivos tipados, resultado de liveness, consentimientos y cambios de estado quedan persistidos y pueden reconstruirse tras una nueva sesión.
**DoD:** integración API → PostgreSQL y almacenamiento de archivos; consulta SQL y lectura autenticada confirman el mismo caso después de recarga.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Ampliar el contrato existente para las tres evidencias sin romper autoservicio vigente. | API registra referencias separadas y rechaza un tipo duplicado o una secuencia incompleta. | Tests Nest y contrato OpenAPI → errores/resultado esperados. | TODO |
| H3.S1.M2 | Recibir resultado firmado/validable de liveness por canal servidor-servidor. | El cliente no puede marcar liveness aprobado mediante un booleano o score propio. | Test de falsificación/firmas y prueba sandbox → resultado inválido rechazado. | TODO |
| H3.S1.M3 | Guardar evidencias como archivos protegidos y relacionarlas al caso. | Cada archivo conserva su tipo, fecha, consentimiento y política; no se combinan en una imagen. | Integración con almacén + SQL → tres referencias correctas y acceso denegado sin rol. | TODO |
| H3.S1.M4 | Mantener idempotencia, auditoría, retención y expiración de punta a punta. | Repetir una solicitud no crea casos/evidencias duplicados; las acciones quedan auditadas. | Tests de repetición y ciclo de vida → un caso y eventos auditados esperados. | TODO |

## H4 — Portal administrativo
**CA:** Dado un revisor autorizado, cuando abre la cola y un caso, entonces ve sujeto minimizado, estado, frente, reverso, estado/veredicto de liveness y acciones de decisión; tras aprobar/rechazar, titular y portal muestran el estado persistido.
**DoD:** Playwright con admin autorizado y no autorizado; evidencia de red/SQL/recarga confirma UI → API → persistencia → UI.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Extender la cola con estado, antigüedad, tipo de trámite y filtros útiles. | La lista se alimenta de la API y oculta sujetos fuera del alcance del revisor. | Spec de cliente + Playwright contra API → filtro y permisos correctos. | TODO |
| H4.S1.M2 | Crear detalle de caso con previsualización autenticada de frente/reverso y resultado de liveness. | El binario no aparece en URL, logs ni respuestas de la cola; descarga/preview genera auditoría. | E2E de preview/descarga y acceso sin permiso → permitido/denegado como corresponde. | TODO |
| H4.S1.M3 | Resolver revisión manual con decisión y motivo obligatorio cuando corresponda. | Aprobación/rechazo actualiza el caso y la vista del titular después de recargar. | E2E de decisión + consulta SQL + recarga en ambas vistas. | TODO |
| H4.S1.M4 | Restringir detalle y acciones a roles autorizados con aislamiento por tenant. | Un rol ordinario o un admin de otro tenant no puede abrir ni decidir el expediente. | Playwright/API con al menos dos actores y dos tenants → 403/404 y cero cambios. | TODO |

## H5 — Cierre de flujo y evidencia
**CA:** Una persona puede completar el flujo desde la app, el portal administrativo recibe el mismo expediente, el revisor lo resuelve y el titular ve la resolución final.
**DoD:** recorrido de extremo a extremo real con sandbox del proveedor, SQL antes/después, capturas y reporte; gates dirigidos de los tres repos.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Probar camino feliz, permiso denegado, evidencia inválida, cancelación y reintento. | Cada estado muestra una acción siguiente comprensible y coincide con la API. | `flutter test`, `yarn ng test --watch=false --include=<spec>`, suites Nest dirigidas. | TODO |
| H5.S1.M2 | Verificar persistencia y permisos de punta a punta. | La recarga conserva caso/estado y no expone datos a actores ajenos. | E2E + SQL de caso sintético → valores esperados; cero PHI en salidas. | TODO |
| H5.S1.M3 | Entregar capturas de guías, tres etapas, cola y detalle administrativo. | Evidencia muestra claro/oscuro y estados principales sin datos personales reales. | Revisar artefactos de Playwright/simulador y `REPORTE.md`. | TODO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La API actual permite operaciones administrativas por UUID sin comprobar tenant/sujeto, según la revisión existente. | Exposición o cambio de evidencia/casos ajenos. | H1 es bloqueo de salida; resolver aislamiento antes de mostrar archivos. |
| No hay proveedor de liveness confirmado. | No se puede afirmar que una selfie represente presencia viva. | Elegir proveedor y sandbox; bloquear la salida de liveness hasta su validación. |
| El flujo Flutter actual combina tres fotos y Angular acepta una evidencia. | El revisor no puede inspeccionar cada pieza como evidencia independiente. | Migrar contrato con compatibilidad y migración definida, sin falsificar estados históricos. |
| Datos biométricos y documento de identidad son altamente sensibles. | Riesgo de exposición, retención excesiva o uso secundario. | Consentimiento explícito, acceso mínimo, auditoría, cifrado, política aprobada y no usar imágenes reales en pruebas/capturas. |
| La referencia visual externa no fue identificada. | «Idéntico al 100%» no es verificable. | Usar experiencia original AloVida con los requisitos exactos; incorporar referencia autorizada si Pablo la aporta. |
