# Reporte — Persistir firma/sello desde el registro

- Fecha: 2026-10-03. [Plan](./PLAN.md).
- Rama: marcelo/feat-firma-sello-registro; base API dev 55b92f0a.
- Evidencia: VERIFIED para el camino HTTP de firma/sello y persistencia; no E2E de navegador ni verde global.
- Avance conjunto de los dos repos: 9 / 9 microtareas (100%); entrega de código y verificaciones dirigidas.

## Completado

| ID | Resultado | Comando | Salida literal |
|---|---|---|---|
| H1.S1.M1 | Precarga limitada de imagen privada | Jest dirigido | `Test Suites: 5 passed, 5 total` |
| H1.S1.M2 | Reclamar y vincular referencias; rechazos | mismo runner | `Tests: 159 passed, 159 total` |
| H1.S1.M3 | Compilar API | `docker build --target build -t alovida-signature-api-build:dev .` | salida 0; `#15 DONE 12.2s` |
| H1.S1.M4 | Patch canónico idempotente | psql ON_ERROR_STOP dos veces y consulta information_schema | `seal_file_id\|uuid\|YES`; `signature_file_id\|uuid\|YES` |
| H1.S2.M1 | Formulario precarga y envía UUID | Vitest dirigido frontend | `Test Files 2 passed (2)` |
| H1.S2.M2 | Reintento sin duplicar carga confirmada | mismo runner frontend | `Tests 157 passed (157)` |
| H1.S3.M1 | HTTP real y bytes persistidos; rollback | `yarn test:integration --runInBand test/integration/practitioner-signature-registration.int-spec.ts` | `Tests: 2 passed, 2 total`; salida 0 |

| H1.S2.M3 | Frontend productivo compila | `yarn build --configuration production` | salida 0; `Application bundle generation complete. [169.088 seconds]` |
| H1.S3.M2 | PRs publicados hacia dev | `gh pr view --json url,baseRefName` | API #549; frontend #907; base dev |

ESLint dirigido de API y revisión del diff: salida 0. [Evidencia](./evidencia/VALIDACION.txt).

## A medias

- Regresión heredada de integración general: tres fallos reproducidos en el código original de dev (dos casos de domicilio y uno de alta asistida). El nuevo flujo no elimina ni modifica esas pruebas. No se afirma que toda la suite pase.

## No hecho

- Merge, despliegue y aplicación del patch en AloVida Dev; no se modifica la base del servicio.
- E2E del formulario desplegado en navegador y estampado de PDF.
- Limpieza automática de precargas abandonadas: deuda existente del flujo anónimo de archivos.

## Contrato y coordinación

`POST /iam/auth/upload-registration-signature-image` recibe multipart `file`, PNG/JPEG/WebP de máximo 2 MB por firma binaria. Precarga sin dueño, IMAGE/PHI, con límite de solicitudes. `POST /iam/auth/register-practitioner` acepta signatureFileId/sealFileId UUID opcionales; reclama las imágenes y guarda referencias en la misma transacción del alta.

La API real no recibe los campos base64 del simulador. El frontend los mantiene en memoria para previsualizar y reintentar. Un fallo de subida no continúa al registro. Después del login se consultan los activos del perfil y se descargan mediante la ruta autenticada existente; la lectura pública devuelve 404.

El modelo ya incorporó el patch en PR #44. Se copia sin cambios a database/SQL/patches de la API. Antes de activar el frontend se aplica el patch y se despliega la API. La reversión del código conserva las columnas nullable; no borrar archivos ni columnas con datos.

## PRs y estado remoto

- API: https://github.com/mdavila-2001/mantra-core-health-api/pull/549
- Frontend: https://github.com/mdavila-2001/mantra-core-health/pull/907
- Ambos listos para revisión, sin conflictos al publicar; CI remoto pendiente. Orden: patch → API → frontend.
- Las bases temporales PostgreSQL y MongoDB se eliminaron; no queda un contenedor temporal de verificación.
