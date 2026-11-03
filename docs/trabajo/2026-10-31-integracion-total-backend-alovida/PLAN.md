# PLAN MAESTRO DE INTEGRACIÓN TOTAL — AloVida Backend v2.0.0

**Fecha:** 2026-10-31  
**Repositorio Principal:** `C:\Alovida\alovida-backend`  
**Repositorio Espejo:** `C:\Alovida\mantra-core-health-api`  
**Estado:** APROBADO PARA EJECUCIÓN  
**Objetivo:** Completar e integrar el 100% de los flujos clínicos, operativos, regulatorios y administrativos del backend de AloVida antes de proceder con el despliegue a producción.

---

## 1. Contexto y Arquitectura

El nuevo monolito modular en NestJS cuenta con:
- Arquitectura Zero-Trust RBAC.
- Catálogo de ocupaciones bolivianas versión `2026.11.0`.
- Modelo relacional de 15 entidades en MikroORM v7 con PostgreSQL 16 y RLS.
- Autenticación con Argon2id y rotación de tokens JWT.
- 89 pruebas unitarias pasando al 100%.

Para cerrar el ciclo previo al despliegue, se requiere dotar al sistema de:
1. **Almacenamiento de objetos en MinIO / S3** con URLs pre-firmadas para eliminar persistencia local de PDFs y datos PHI en el host.
2. **Ficha médica avanzada** con semáforo de triaje de signos vitales, autocompletado CIE-10 y sellado verificable de receta médica.
3. **Flujo de recepción de escritorio** con check-in de pacientes, métricas de sala de espera y prevención de colisión de consultorios físicos (boxes).
4. **Cadena de suministro de farmacia** con trazabilidad de lotes y vencimientos FEFO (*First Expired, First Out*).
5. **Cuadre diario de caja** y anulación de facturas SIAT según normativa del SIN.
6. **Módulo de notificaciones** para citas y entrega de estudios.

---

## 2. Hitos de Implementación

### Hito 1 (H1) — Almacenamiento Seguro S3 / MinIO (`modules/storage`)
- Generación de módulo `modules/storage` con Nest CLI.
- Servicio `StorageService` para generar **Presigned URLs** seguras de subida (`PUT`) con expiración de 15 min y descarga (`GET`) con expiración de 1 hora.
- Clasificación por buckets:
  - `alovida-prescriptions`: Recetas médicas selladas.
  - `alovida-diagnostics`: Informes de laboratorio e imagenología.
  - `alovida-documents`: Documentación legal (SEPREC, SEDES, CI).
- Cálculo y verificación de checksum SHA-256 para no repudio.
- Controlador `StorageController` y DTOs (`request-upload-url.dto.ts`).
- Tests unitarios `.spec.ts`.

### Hito 2 (H2) — Ficha Clínica Avanzada, Semáforo de Triaje y CIE-10 (`modules/clinical`)
- **Semáforo de Triaje:** Algoritmo clínico clasificador de signos vitales:
  - `NORMAL` (Verde)
  - `ATENCION` (Amarillo: prehipertensión, febrícula, taquicardia leve)
  - `URGENTE` (Naranja: crisis hipertensiva estadio 1, fiebre > 38.5°C, $SpO_2 < 93\%$)
  - `CRITICO` (Rojo: hipotensión severa, desaturación $SpO_2 < 90\%$, taquicardia > 140 lpm)
- **Catálogo de Búsqueda CIE-10:** Servicio de búsqueda rápida por código o descripción diagnóstica para consultas.
- **Sellado Criptográfico de Receta Médica:** Generación de token de verificación y URL/QR público para autenticidad sin login obligatorio.
- **Trazabilidad de Órdenes Diagnósticas:** Ciclo de estados `REQUESTED` $\rightarrow$ `SAMPLE_COLLECTED` $\rightarrow$ `IN_ANALYSIS` $\rightarrow$ `RESULTS_UPLOADED` $\rightarrow$ `VALIDATED`.
- Tests unitarios `.spec.ts`.

### Hito 3 (H3) — Recepción, Check-in y Gestión de Sala de Espera (`modules/appointments`)
- **Check-in de Paciente:** Endpoint `POST /appointments/:id/check-in` que registra la hora de llegada a recepción.
- **Métricas de Sala de Espera:** Cálculo de minutos transcurridos en espera y tiempo de atención médica real.
- **Control de Conflicto de Box Físico:** Validación para impedir que dos médicos reserven el mismo consultorio físico o box al mismo tiempo.
- Tests unitarios `.spec.ts`.

### Hito 4 (H4) — Cadena de Suministro Farmacéutica (Lotes FEFO) y Cuadre de Caja (`modules/pharmacy`, `modules/billing`)
- **Control de Lotes Farmacéuticos:** Modelo y endpoints para ingreso de lotes con número de lote (`batchNumber`) y fecha de caducidad (`expirationDate`).
- **Dispensación con Prioridad FEFO:** Algoritmo que despacha automáticamente las unidades del lote más próximo a vencer.
- **Arqueo y Cierre Diario de Caja:** Endpoint `POST /billing/cash-register/close` con desglose de totales por método de pago (Efectivo, Tarjeta, QR) y listado de facturas emitidas en el turno.
- Tests unitarios `.spec.ts`.

### Hito 5 (H5) — Anulación de Facturas SIAT & Adaptador de Notificaciones (`modules/billing`, `modules/notifications`)
- **Anulación SIAT:** Endpoint `POST /billing/invoices/:id/cancel` con código oficial de motivo del catálogo SIN (1: Factura mal emitida, 2: Datos incorrectos, etc.).
- **Módulo Notifications:** `NotificationsService` para despacho transaccional de eventos:
  - Confirmación de cita agendada.
  - Recordatorio 24 horas antes.
  - Aviso de receta emitida con enlace de consulta.
  - Aviso de resultado diagnóstico disponible.
- Tests unitarios `.spec.ts`.

### Hito 6 (H6) — Verificación Integral End-to-End y Documentación
- Ejecución completa de la suite de pruebas unitarias (>100 tests PASS).
- Compilación limpia con TypeScript estricto.
- Actualización de OpenAPI / Swagger en `/api/docs`.
- Generación de `REPORTE.md` con evidencia y salidas de comandos.

---

## 3. Criterios de Aceptación (Dado / Cuando / Entonces)

### CA-1: Almacenamiento Presigned S3/MinIO
- **Dado** un técnico de laboratorio con un informe PDF listo,
- **Cuando** solicita una URL de subida a `POST /storage/upload-url`,
- **Entonces** recibe una Presigned URL segura de MinIO/S3 con expiración de 15 minutos y ruta normalizada bajo `diagnostics/<uuid>.pdf`.

### CA-2: Semáforo de Triaje en Consulta Médica
- **Dado** el registro de signos vitales con presión 170/105 mmHg y saturación de 89%,
- **Cuando** el médico o enfermera guarda la anamnesis en `POST /clinical/encounters`,
- **Entonces** la respuesta incluye `triageRiskLevel: 'CRITICO'` y alertas clínicas descriptivas para la pantalla de escritorio.

### CA-3: Recepción y Tiempo de Espera
- **Dado** un paciente con cita agendada a las 10:00 que se presenta a recepción a las 09:45,
- **When** la secretaria ejecuta `POST /appointments/:id/check-in`,
- **Then** la cita pasa a estado `CHECKED_IN`, registrando la hora exacta de recepción para el panel de turnos del consultorio.

### CA-4: Despacho FEFO en Farmacia
- **Dado** dos lotes del medicamento Amoxicilina en stock (Lote A vence en 2 meses, Lote B vence en 12 meses),
- **Cuando** se dispensa una receta médica,
- **Entonces** el sistema descuenta prioritariamente del Lote A garantizando la normativa sanitaria AGEMED.

### CA-5: Anulación de Factura SIAT
- **Dado** una factura emitida previamente con estado `VALIDADA`,
- **Cuando** se solicita su anulación con motivo válido del SIN a `POST /billing/invoices/:id/cancel`,
- **Entonces** la factura pasa a estado `ANULADA` y se registra el motivo tributario correspondiente.

---

## 4. Definición de Hecho (DoD)

- [ ] Todos los módulos y servicios generados con comandos de Nest CLI (`nest g ...`).
- [ ] Módulo `storage` con Presigned URLs implementado y probado.
- [ ] Semáforo de triaje y catálogo CIE-10 integrados en `clinical`.
- [ ] Check-in y control de boxes físicos integrados en `appointments`.
- [ ] Lotes FEFO y arqueo de caja implementados en `pharmacy` y `billing`.
- [ ] Anulación SIAT y notificaciones implementadas.
- [ ] `yarn build` exitoso con código 0.
- [ ] `yarn test` con >100 tests pasando al 100%.
- [ ] Evidencia guardada en `docs/trabajo/2026-10-31-integracion-total-backend-alovida/evidencia/`.
- [ ] `REPORTE.md` final generado.

