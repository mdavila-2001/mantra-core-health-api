# PLAN DE TRABAJO — Persistencia Relacional y Migraciones con MikroORM (AloVida Backend v2.0.0)

**Fecha:** 2026-10-31  
**Repositorio:** `C:\Alovida\alovida-backend`  
**Objetivo:** Implementar la capa de datos relacional para PostgreSQL 16 con PostGIS usando MikroORM v7, tipado estricto, entidades modulares de salud, soporte de Row-Level Security (RLS) y migraciones SQL versionadas.

---

## 1. Contexto & Arquitectura

En la fase anterior se implementó la arquitectura modular en memoria con 72 tests unitarios pasando. Ahora se implementará la capa de persistencia real utilizando **MikroORM** (`@mikro-orm/postgresql` + `@mikro-orm/migrations`), cumpliendo con:
- Separación de privilegios de BD: `alovida_admin` (DDL para migraciones) vs `alovida_app` (DML para la API en runtime).
- Claves primarias UUID v4 nativas en PostgreSQL.
- Tipos JSONB para estructuras especializadas (signos vitales, coordenadas GPS, ítems de prescripción).
- Soporte para aislamiento multi-tenant mediante Row-Level Security (RLS) con `tenant_id`.

---

## 2. Hitos de Implementación

### H1 — Configuración e Instalación de MikroORM
- Instalar dependencias `@mikro-orm/migrations`.
- Configurar `mikro-orm.config.ts` con soporte ESM, discovery de entidades, migraciones y extensiones PostgreSQL (uuid-ossp, postgis).
- Integrar `MikroOrmModule.forRootAsync()` en `AppModule` con variables de entorno validadas.

### H2 — Entidades Core, Identidad, Pacientes y Profesionales
- `User`: Credenciales, roles de salud boliviana, tenant, estado activo.
- `Patient`: 3 nombres, CI con extensión departamental (SC, LP, etc.), contacto de emergencia, tutores/dependientes, dirección.
- `Practitioner`: Matrícula MinSalud, colegio profesional, especialidades.
- `PractitionerOffice`: Consultorio con lat/lng GPS y datos de contacto.
- `PractitionerFiscalProfile`: NIT emisor, razón social, personería jurídica (8 tipos bolivianos), número de sucursal.

### H3 — Entidades de Agenda y Atención Clínica
- `Appointment`: Turnos médicos, modalidad (presencial/telemedicina), colisiones y estados de cita.
- `BlockedSlot`: Bloqueo de agenda médica (quirófanos, congresos).
- `Encounter`: Consulta médica, signos vitales, cálculo automático de IMC, examen físico y CIE-10.
- `Prescription`: Receta médica con código trazable `REC-YYYYMM-XXXX`, ítems farmacológicos y caducidad de 30 días.
- `ClinicalOrder`: Solicitud diagnóstica (laboratorio o imagenología).

### H4 — Entidades de Farmacia, Diagnósticos y Facturación SIAT
- `PharmacyProduct`: Registro sanitario AGEMED, nombre genérico/comercial, forma, concentración, stock, precio en BOB.
- `DiagnosticStudy`: Catálogo con instrucciones de ayuno y preparación pre-analítica.
- `DiagnosticResult`: URL de informe PDF firmado, checksum SHA-256 para integridad y matrícula del bioquímico/radiólogo.
- `Invoice` & `InvoiceItem`: Facturación electrónica SIAT con Multi-NIT emisor, CUF algorítmico, CUFD, XML estructurado y QR del SIN.

### H5 — Repositorios y Servicios con Persistencia Real
- Integrar `EntityRepository` de MikroORM en los servicios (`PatientsService`, `PractitionersService`, `AppointmentsService`, `ClinicalService`, `PharmacyService`, `DiagnosticsService`, `BillingService`).
- Mantener compatibilidad total y pasar la suite de pruebas unitarias y de integración.

### H6 — Migración Inicial DDL y Script RLS PostgreSQL
- Generar la primera migración oficial con el CLI de MikroORM (`yarn mikro-orm migration:create`).
- Script SQL con directivas `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` y políticas de aislamiento para `tenant_id`.

---

## 3. Criterios de Aceptación (Dado / Cuando / Entonces)

### CA-1: Configuración de MikroORM y Descubrimiento de Entidades
- **Dado** el archivo de configuración `mikro-orm.config.ts`,
- **Cuando** se ejecuta `yarn mikro-orm schema:show` o `yarn build`,
- **Entonces** MikroORM carga sin errores de importación ESM y descubre todas las entidades registradas.

### CA-2: Consistencia y Tipado de Entidades Relacionales
- **Dado** el modelo de datos de salud boliviano,
- **Cuando** se compila el proyecto con TypeScript estricto,
- **Entonces** no existen errores de tipo `TS2322`, `TS1272` o incompatibilidades de clave foránea.

### CA-3: Generación de Migración DDL y Validación de RLS
- **Dado** el conjunto de entidades mapeadas,
- **Cuando** se ejecuta el generador de migraciones de MikroORM,
- **Entonces** se genera un archivo de migración SQL sintácticamente correcto para PostgreSQL 16 con tipos UUID, timestamp con zona horaria e índices de búsqueda rápida (NIT, CI, matrícula médica, CUF).

### CA-4: Ejecución Exitosa de Tests
- **Dado** el backend con las nuevas entidades y servicios,
- **Cuando** se ejecuta `yarn test`,
- **Entonces** el 100% de las suites de prueba pasan sin fallas.

---

## 4. Definición de Hecho (DoD)
- [ ] `@mikro-orm/migrations` instalado.
- [ ] `mikro-orm.config.ts` creado y configurado.
- [ ] Entidades creadas en sus respectivos módulos (`entities/`).
- [ ] `yarn build` exitoso con código 0.
- [ ] `yarn test` exitoso con código 0.
- [ ] Migración inicial SQL generada o script DDL verificado.
- [ ] Evidencia guardada en `docs/trabajo/2026-10-31-persistencia-mikroorm-alovida/evidencia/`.
- [ ] `REPORTE.md` completado con salida de comandos.
