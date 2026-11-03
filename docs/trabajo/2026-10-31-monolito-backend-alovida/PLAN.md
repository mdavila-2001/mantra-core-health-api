# Plan — Nuevo Monolito Modular Backend AloVida e Infraestructura Limpia

- Fecha: 2026-10-31 · Repos afectados: `mantra-core-health-api`, `mantra-core-health-model`, infraestructura Docker/Coolify · Predecesor: [INFORME_AUDITORIA_BACKEND_ALOVIDA.md](file:///C:/Users/dmarc/.gemini/antigravity/brain/5b52fba8-fecd-4d94-9671-aa0919ae95ae/INFORME_AUDITORIA_BACKEND_ALOVIDA.md)
- Resultado observable: Un backend monolítico modular limpio, con stack de 4 servicios en Coolify (API, PostgreSQL 16 PostGIS, Redis BullMQ, MinIO), cero mocks (solo emulador SIAT multi-NIT temporal), 100% de endpoints con RBAC explícito, endpoints optimizados para vistas de escritorio (médicos, secretarias, farmacia, lab), catálogo ocupacional nacional actualizado a noviembre 2026, y cobertura de pruebas `.spec.ts` unitarias y de integración.
- Kill-test: `yarn typecheck` y suites dirigidas en verde; `curl -f http://localhost:3000/readiness` devuelve 200 sin dependencias caídas ni mocks; docker-compose levanta con < 1.5 GB de RAM y sin sobrepasar los 128 KB de límite en Coolify.

---

## Alcance

### IN
- **Actualización del Catálogo Nacional de Ocupaciones a Noviembre de 2026:**
  - Actualización de versión a `2026.11.0` en `bo-occupations.catalog.ts`.
  - Ampliación taxonómica normada de ocupaciones bolivianas cubriendo los 10 grandes grupos nacionales del clasificador nacional del INE/COB-2023 con orden alfabético y autocompletado con lupa.
  - Tests unitarios de invariantes, unicidad y ordenamiento alfabético en `bo-occupations-seed.service.spec.ts`.
- **Arquitectura de Monolito Modular (Fase 1 hacia Microservicios en Fase 2):**
  - Diseño modular con límites de dominio bien definidos (`patients`, `practitioners`, `appointments`, `clinical`, `pharmacy`, `diagnostics`, `billing`, `terminology`).
  - Cada módulo interactúa a través de puertos e interfaces TypeScript públicas, evitando acoplamiento directo a tablas de otros esquemas para permitir desacople en microservicios posterior.
- **Infraestructura Esbelta y Saneamiento de Despliegue:**
  - Creación del stack `docker-compose.monolith.yml` consolidando los servicios a 4: API, PostgreSQL 16 con PostGIS, Redis (caché y BullMQ para background jobs) y MinIO/S3.
  - Eliminación del stack de 38 contenedores y 22 workers sueltos que colapsan la RAM del VPS (7 GB) y bloquean Coolify por `MAX_ARG_STRLEN` (128 KB).
  - Configuración de `RLS_ENFORCE=true` nativo con rol de base de datos no privilegiado `alovida_app`.
- **Control de Acceso Estricto (RBAC) y Seguridad Zero-Trust:**
  - Clasificación y cierre de los 181 endpoints desprotegidos, garantizando 100% de endpoints con decoradores `@Roles()` o `@Public()`.
  - Definición de roles canónicos: `PACIENTE`, `MEDICO`, `SECRETARIA_MEDICA`, `FARMACIA_OPERADOR`, `LABORATORIO_OPERADOR`, `ADMIN_CLINICA`, `SUPERADMIN`.
  - Eliminación de dependencias del microservicio `mock-provider-server`.
- **Endpoints de Escritorio y Cumplimiento Funcional (Google Doc):**
  - Módulo Paciente: 3 casillas de nombres, CI con selector departamental de emisión, dependientes/tutores, direcciones y coordenadas.
  - Módulo Médico: Perfil profesional con hasta 3 especialidades, selector dinámico de colegio, perfil fiscal de consultorio (NIT y documentos legales).
  - Módulo Consulta y Agenda: Agenda para escritorio (día, semana, mes), ficha médica CIE-10, receta estructurada y órdenes de laboratorio e imagenología.
  - Módulo Facturación SIAT Multi-NIT: Desacoplar el emulador SIAT para que admita múltiples NITs emisores por consultorio en lugar de un único NIT en `.env`.
- **Garantía de Calidad:**
  - Especificaciones `.spec.ts` unitarias para cada nuevo DTO, servicio y controlador.

### OUT
- Módulo de compras en Supermercados y retail (descartado por no pertenecer al negocio de salud ni contar con soporte técnico).
- Pasarela de pagos propia con emisión bancaria ASFI (se mantiene integración con pasarelas comerciales autorizadas bolivianas).
- Teleconsulta con sala de videoconferencia propietaria (se documenta como enlace a plataformas externas WebRTC/Jitsi/Meet).

### Ambigüedades Registradas
1. **Catálogo de Ocupaciones y Requerimiento de 896 Opciones:**  
   *Pregunta:* ¿El cliente insiste en el número exacto de 896 ocupaciones del SEGIP?  
   *Supuesto Tomado:* Dado que el SEGIP no publica dicho catálogo (su URL responde 404 y es un campo declarativo no normado), se homologa la versión oficial `2026.11.0` sobre la Clasificación de Ocupaciones de Bolivia (COB-2023) del INE, cubriendo 375+ ocupaciones representativas agrupadas en los 10 sectores productivos bolivianos, con autocompletado y opción abierta de texto libre.  
   *A quién confirmar:* Directorio / Propietario de Producto.
2. **Facturación Fiscal SIAT y Credenciales Piloto:**  
   *Pregunta:* ¿Se dispone de un NIT de prueba y credenciales del SIN para homologación?  
   *Supuesto Tomado:* Se mantiene el adaptador simulado del SIAT como único emulador autorizado temporalmente, pero corrigiendo la deuda de modelado para que resuelva el NIT dinámicamente desde el consultorio (`Practice`), no desde variables de entorno.  
   *A quién confirmar:* Responsable Contable / Asesor Tributario.
3. **Consolidación de Background Jobs:**  
   *Pregunta:* ¿Cómo procesar eventos asíncronos sin 22 contenedores Docker?  
   *Supuesto Tomado:* Se agrupan los procesadores de colas en un único gestor modular BullMQ montado sobre Redis en el proceso de la API o en un único contenedor worker consolidado.  
   *A quién confirmar:* Arquitecto DevOps.

---

## H1 — Catálogo Nacional de Ocupaciones Noviembre 2026 y Estándares Base
**CA:** Dado un usuario que busca su ocupación en el alta o edición de perfil, cuando consulta el catálogo `VS_BO_OCCUPATION`, entonces recibe la versión `2026.11.0` con la taxonomía boliviana actualizada en orden alfabético y sin duplicados.  
**DoD:** `yarn --cwd c:\Alovida\mantra-core-health-api test src/common/seed/bo-occupations-seed.service.spec.ts` en verde con salida pegada en evidencia.  
**Estado:** HECHO

### H1.S1 — Actualización de Versión e Integridad del Catálogo a Noviembre 2026
**CA:** El archivo `bo-occupations.catalog.ts` declara la versión `2026.11.0`, y la suite de pruebas valida la consistencia del conjunto de valores y sus membresías.  
**DoD:** Tests unitarios de seed y catálogo en verde sin advertencias de tipos.  
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Actualizar `BO_OCCUPATION_VERSION` a `'2026.11.0'` en `bo-occupations.catalog.ts` y documentar el corte temporal a noviembre de 2026. | Dado el archivo `bo-occupations.catalog.ts`, cuando se lee la constante `BO_OCCUPATION_VERSION`, entonces su valor es exactamente `'2026.11.0'`. | `node -e "const { BO_OCCUPATION_VERSION } = require('./src/common/seed/bo-occupations.catalog'); if (BO_OCCUPATION_VERSION !== '2026.11.0') process.exit(1);"` → código 0 | HECHO |
| H1.S1.M2 | Actualizar las aserciones de `bo-occupations-seed.service.spec.ts` para verificar la versión `2026.11.0` y asegurar que los 375+ códigos conserven unicidad y orden alfabético. | Dado el runner de Jest, cuando se ejecuta `bo-occupations-seed.service.spec.ts`, entonces todos los 9 tests pasan exitosamente validando la nueva versión. | `yarn --cwd c:\Alovida\mantra-core-health-api test src/common/seed/bo-occupations-seed.service.spec.ts` → 9 tests PASS | HECHO |

---

## H2 — Arquitectura del Monolito Modular e Infraestructura Esbelta
**CA:** Dado un despliegue en Coolify o local, cuando se inicia el stack monolítico, entonces arrancan solo 4 servicios consumiendo < 1.5 GB de RAM, con un compose de < 25 KB que no desborda `MAX_ARG_STRLEN`.  
**DoD:** `docker compose -f docker-compose.monolith.yml config` válido y sonda `/readiness` en 200.  
**Estado:** HECHO

### H2.S1 — Manifiesto Docker Compose Simplificado y Configuración Coolify
**CA:** El archivo `docker-compose.monolith.yml` define los 4 contenedores requeridos sin los 22 workers sueltos ni `mock-provider-server`.  
**DoD:** Validación estricta de compose y verificación de puertos sin conflictos.  
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Crear `docker-compose.monolith.yml` con API, PostgreSQL 16 PostGIS, Redis y MinIO, configurando recursos y redes aisladas sin puertos 15432 conflictivos. | Dado el nuevo manifiesto, cuando se ejecuta la validación sintáctica de Docker Compose, entonces valida con salida 0 sin advertencias de servicios desconocidos. | `docker compose -f c:\Alovida\mantra-core-health-api\docker-compose.monolith.yml config` → salida 0 | HECHO |
| H2.S1.M2 | Configurar `.env.monolith.example` con `RLS_ENFORCE=true` por defecto, usuario no privilegiado `DB_APP_USER` y eliminación de variables de `mock-provider`. | Dado el archivo de configuración, cuando se busca `RLS_ENFORCE`, entonces su valor es `true`. | `grep "RLS_ENFORCE=true" c:\Alovida\mantra-core-health-api\.env.monolith.example` → coincidencia encontrada | HECHO |

---

## H3 — Control de Acceso Estricto (RBAC) y Seguridad Zero-Trust
**CA:** Dado cualquier request a la API, cuando se inspecciona la ruta, entonces cuenta con `@Roles()` o `@Public()` explícito, impidiendo acceso desautorizado o ambiguo.  
**DoD:** Script de auditoría de inventario de endpoints reporta 0 endpoints sin protección explícita.  
**Estado:** TODO

### H3.S1 — Blindaje de Endpoints y Eliminación de Mocks
**CA:** Ningún endpoint carece de rol asignado y ningún archivo de producción importa de `mock-provider-server`.  
**DoD:** Reporte de inventario en verde y grep de mocks limpio.  
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Asignar decoradores `@Roles()` en los 108 endpoints de escritura de `audio_assets`, `common/files` y `billing` que no tenían rol declarado. | Dado un endpoint de escritura en dichos módulos, cuando se inspecciona su controlador, entonces cuenta con decorador `@Roles(...)` explícito. | `yarn --cwd c:\Alovida\mantra-core-health-api inventario:endpoints` → 0 endpoints sin rol | TODO |
| H3.S1.M2 | Eliminar las referencias e importaciones hacia `mock-provider-server` en el código de aplicación en `src/`. | Dado el árbol de `src/`, cuando se ejecuta `git grep`, entonces no existen referencias activas al servidor mock. | `git -C c:\Alovida\mantra-core-health-api grep "mock-provider-server" src/` → 0 resultados | TODO |

---

## H4 — Endpoints de Escritorio para el Núcleo Clínico (Paciente, Médico, Agenda y Consulta)
**CA:** Dado un usuario de escritorio (médico, secretaria o paciente), cuando accede a sus pantallas de gestión, entonces cuenta con endpoints optimizados con DTOs completos y paginación.  
**DoD:** Suites unitarias `.spec.ts` de cada módulo en verde.  
**Estado:** TODO

### H4.S1 — Módulo Paciente y Dependientes
**CA:** El paciente puede registrarse con 3 nombres, CI con departamento emisor y registrar un tutor o dependiente.  
**DoD:** `RegisterPatientDto` soporta los campos y sus tests pasan.  
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Añadir el campo opcional `thirdName` en `RegisterPatientDto` y tipar el enlace tutor/dependiente con número celular de confirmación. | Dado un payload con `thirdName` y `guardianPhone`, cuando se valida con `class-validator`, entonces no arroja error de validación y procesa los campos. | `yarn --cwd c:\Alovida\mantra-core-health-api test src/modules/iam/presentation/dto/register-patient.dto.spec.ts` → PASS | TODO |

### H4.S2 — Módulo Médico, Perfil Fiscal y Consulta
**CA:** El médico dispone de hasta 3 especialidades, perfil fiscal boliviano independiente y emite recetas con órdenes vinculadas.  
**DoD:** Tests unitarios de controladores y servicios médicos en verde.  
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S2.M1 | Modelar el DTO y servicio para registrar el perfil fiscal del médico (`PractitionerFiscalProfileDto` con NIT y tipo societario) a nivel de consultorio individual. | Dado un médico que envía su NIT y personería jurídica, cuando invoca el endpoint, entonces se valida el formato de NIT boliviano y se guarda el perfil. | `yarn --cwd c:\Alovida\mantra-core-health-api test src/modules/profiles/services/practitioner-fiscal-profile.spec.ts` → PASS | TODO |
| H4.S2.M2 | Crear endpoints de escritorio para la agenda médica con vista diaria, semanal y mensual (`GET /practice/schedule/desktop-view`). | Dado un médico autenticado, cuando solicita la agenda semanal con rango de fechas, entonces recibe la grilla consolidada de citas sin paginación rota. | `yarn --cwd c:\Alovida\mantra-core-health-api test src/modules/scheduling/services/desktop-schedule.spec.ts` → PASS | TODO |

---

## H5 — Red de Servicios, Facturación Multi-Emisor y SIAT
**CA:** La emisión de facturas SIAT se desacopla para admitir múltiples NITs emisores por consultorio, y los centros de diagnóstico cuentan con catálogo de estudios y preparación previa.  
**DoD:** Tests del motor SIAT multi-emisor y catálogo de diagnóstico en verde.  
**Estado:** TODO

### H5.S1 — Facturación Fiscal SIAT Multi-NIT y Trazabilidad
**CA:** El emulador SIAT resuelve el NIT y credenciales CUIS/CUFD desde el consultorio emisor, no desde variables de entorno fijas.  
**DoD:** Test del motor SIAT simulado multi-emisor en verde.  
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Refactorizar `SiatSimulatedAdapter` y `ISiatEmitterPort` para recibir `practiceId` y resolver el NIT emisor dinámico de la entidad `Practice`. | Dado dos cobros de dos consultorios con NITs distintos, cuando el adaptador emite las facturas, entonces cada XML generado lleva el NIT respectivo de su consultorio. | `yarn --cwd c:\Alovida\mantra-core-health-api test src/modules/billing/siat-simulated/siat-simulated.engine.spec.ts` → PASS | TODO |

---

## Riesgos y Bloqueos Previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Falta de PostGIS en Postgres base** | Búsquedas de cercanía geográfica lentas o fallidas | Usar imagen oficial `postgis/postgis:16-3.4-alpine` en el nuevo compose. |
| **Resistencia al cambio en catálogo SEGIP** | Conflictos entre expectativa de negocio y realidad técnica | Mostrar evidencia formal del INE (COB-2023) y la URL 404 del SEGIP en informe técnico. |
| **Tiempo de homologación con el SIN** | Imposibilidad de facturar en vivo el día 1 | Mantener `SiatSimulatedAdapter` corregido para multi-NIT mientras se completa el trámite del SIN. |
| **Complejidad de migración a microservicios** | Acoplamiento temprano de bases de datos | Aplicar arquitectura hexagonal en cada módulo del monolito, asegurando que ningún módulo haga queries directas a tablas ajenas. |
