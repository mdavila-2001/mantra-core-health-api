# Capacidades

> Fase 9. Cada fila es verificable: módulos reales, conteo real de operaciones (ver
> [catálogo de módulos](../modules/index.md) para el detalle por módulo).

| Capacidad | Módulos que la implementan | Ejemplo de operación real |
|---|---|---|
| Gestión de identidad y sesión | `iam`, `auth_providers`, `identity_assurance` | `POST /iam/auth/login`, verificación de identidad |
| Autorización clínica y administrativa | `authz` | Evaluación de decisión PDP, políticas ABAC, break-the-glass |
| Consentimiento y bases legales | `consent` | Captura/retiro de consentimiento, autorizaciones HIPAA |
| Acceso delegado | `delegated_access` | Delegación de acceso a un tercero (apoderado, colega) |
| Registro clínico | `clinical`, `clinical_ext` | Encuentros, equipos de cuidado, referidos, órdenes |
| Diagnóstico | `diagnostics`, `diagnostic_units` | Resultados diagnósticos, unidades de medida clínicas |
| Procedimientos y quirófano | `procedures_perioperative` | Periop C-13/C-14: credencial profesional cerrada, firma de receta |
| Farmacia | `pharmacy`, `pharmacy_inventory` | Catálogo de productos, inventario, órdenes de compra, recepción de mercancía |
| Agenda y citas | `scheduling` | Slots, holds anti-double-booking, lista de espera, recordatorios |
| Operación de práctica | `practice`, `directory`, `organization_extensions`, `geo` | Sitios, membresías, geolocalización de recursos |
| Facturación | `billing` | Facturas, dunning (cobranza), políticas de facturación |
| Contabilidad | `accounting` | Plan de cuentas, devengos, activos, cierre fiscal |
| Pagos | `payments` | Intents de pago idempotentes, wallets |
| Seguros | `insurance` | Backbone de aseguradoras, coberturas |
| ERP / cadena de suministro | `erp` | Contratos, órdenes de compra, recepción de mercancía |
| Auditoría | `audit` | Historial versionado, protección WORM, mayor módulo del sistema (123 entidades) |
| Terminología clínica | `terminology` | Catálogo de conceptos gobernado (ver [glosario](glossary.md)) |
| CRM y marketing | `crm`, `marketing`, `ads`, `promotions` | Gestión de relación con pacientes/clientes, campañas |
| Comunidad y educación | `community`, `education` | Reseñas, contenido educativo, autoría de cursos |
| Mensajería y eventos | `messaging` | Outbox transaccional, colas, entregas, notificaciones |
| Integraciones externas | `integrations`, `integration_contracts` | Webhooks entrantes/salientes, rotación de credenciales |
| Almacenamiento de objetos y documentos | `object_storage`, `document_store` | Archivos, DICOM, documentos no relacionales (MongoDB) |
| Analítica y datos | `read_models`, `lakehouse`, `time_series`, `polyglot_storage`, `search_platform` | Proyecciones de lectura, series de tiempo, búsqueda |
| IA aplicada | `vector_rag`, `graph_intelligence` | RAG sobre colecciones clínicas, análisis de grafo |
| Automatización y workflow | `automation`, `workflow` | Reglas de automatización, orquestación de procesos |
| Reporting | `reporting` | Generación periódica de reportes |
| Calidad | `qa_lab` | Laboratorio de calidad/pruebas de negocio |
| Operación de plataforma | `platform_ops`, `system_ops`, `system_context`, `cross_store_consistency` | Salud del sistema, reconciliación entre almacenes |
| Trazabilidad de comportamiento | `tracking`, `telemetry` | Sesiones de seguimiento, telemetría |
| Runtime compartido | `common`, `redis_runtime` | Infraestructura transversal — sin controllers de negocio propios |

Ver [contexto de negocio](business-context.md) para por qué existen estos bloques, y
[flujos críticos](critical-workflows.md) para cómo se combinan en un caso de uso real de punta a
punta.
