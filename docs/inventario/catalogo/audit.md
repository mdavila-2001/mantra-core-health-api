<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `audit`

- **Tablas:** 142 · **Columnas:** 1442 (64 con descripción: 4.4 %) · **Índices:** 762
- **Dominio:** Auditoría y Reporting
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [accounts_history](#accounts_history) | Preserva versiones o estados históricos de accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [ad_accounts_history](#ad_accounts_history) | Preserva versiones o estados históricos de ad accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [ad_creatives_history](#ad_creatives_history) | Preserva versiones o estados históricos de ad creatives para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [ad_experiments_history](#ad_experiments_history) | Preserva versiones o estados históricos de ad experiments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [ad_sets_history](#ad_sets_history) | Preserva versiones o estados históricos de ad sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [ads_history](#ads_history) | Preserva versiones o estados históricos de ads para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [agent_versions_history](#agent_versions_history) | Preserva versiones o estados históricos de agent versions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [agents_history](#agents_history) | Preserva versiones o estados históricos de agents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [allergy_intolerances_history](#allergy_intolerances_history) | Preserva versiones o estados históricos de allergy intolerances para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [analytics_governance_log](#analytics_governance_log) | Registra cambios de gobierno analítico para conservar trazabilidad de decisiones que afectan el uso secundario de datos de salud. | 9 | 5 | 4 | COINCIDE |
| [appointment_bookings_history](#appointment_bookings_history) | Preserva versiones o estados históricos de appointment bookings para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 50 | COINCIDE |
| [assets_history](#assets_history) | Preserva versiones o estados históricos de assets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [audit_log](#audit_log) | Conserva eventos de auditoría de acciones del sistema para reconstruir quién realizó operaciones y cuándo. | 17 | 10 | 216 | DIVERGE |
| [automated_rules_history](#automated_rules_history) | Preserva versiones o estados históricos de automated rules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [bills_history](#bills_history) | Preserva versiones o estados históricos de bills para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [booking_policies_history](#booking_policies_history) | Preserva versiones o estados históricos de booking policies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [campaigns_history](#campaigns_history) | Preserva versiones o estados históricos de campaigns para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [care_plans_history](#care_plans_history) | Preserva versiones o estados históricos de care plans para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [care_space_blocks_history](#care_space_blocks_history) | Preserva versiones o estados históricos de los bloqueos de espacios para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [care_space_category_periods_history](#care_space_category_periods_history) | Preserva versiones o estados históricos de los períodos de categoría de cama para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [care_spaces_history](#care_spaces_history) | Preserva versiones o estados históricos de care spaces para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 11 | 6 | 3 | COINCIDE |
| [care_teams_history](#care_teams_history) | Preserva versiones o estados históricos de care teams para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [catalog_products_history](#catalog_products_history) | Preserva versiones o estados históricos de catalog products para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [cds_rules_history](#cds_rules_history) | Preserva versiones o estados históricos de cds rules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [certificates_history](#certificates_history) | Preserva versiones o estados históricos de certificates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [charge_captures_history](#charge_captures_history) | Preserva versiones o estados históricos de los cargos devengados por uso de espacio para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [cleaning_orders_history](#cleaning_orders_history) | Preserva versiones o estados históricos de las órdenes de limpieza de espacios para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [clinical_alerts_history](#clinical_alerts_history) | Preserva versiones o estados históricos de clinical alerts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [clinical_note_headers_history](#clinical_note_headers_history) | Preserva versiones o estados históricos de clinical note headers para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [clinical_units_history](#clinical_units_history) | Preserva versiones o estados históricos de clinical units para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 11 | 6 | 3 | COINCIDE |
| [comments_history](#comments_history) | Preserva versiones o estados históricos de comments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [conditions_history](#conditions_history) | Preserva versiones o estados históricos de conditions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 13 | COINCIDE |
| [connected_accounts_history](#connected_accounts_history) | Preserva versiones o estados históricos de connected accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [consents_history](#consents_history) | Preserva versiones o estados históricos de consents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [contacts_history](#contacts_history) | Preserva versiones o estados históricos de contacts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [contracts_history](#contracts_history) | Preserva versiones o estados históricos de contracts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [conversations_history](#conversations_history) | Preserva versiones o estados históricos de conversations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [coupons_history](#coupons_history) | Preserva versiones o estados históricos de coupons para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [course_versions_history](#course_versions_history) | Preserva versiones o estados históricos de course versions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [courses_history](#courses_history) | Preserva versiones o estados históricos de courses para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [crm_accounts_history](#crm_accounts_history) | Preserva versiones o estados históricos de crm accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [custom_audiences_history](#custom_audiences_history) | Preserva versiones o estados históricos de custom audiences para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [custom_conversions_history](#custom_conversions_history) | Preserva versiones o estados históricos de custom conversions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [data_access_log](#data_access_log) | Registra accesos a datos para respaldar trazabilidad de consultas y revisiones de privacidad. | 11 | 9 | 16 | COINCIDE |
| [delegated_access_audit_log](#delegated_access_audit_log) | Conserva evidencia de acciones realizadas mediante acceso delegado para identificar actor, alcance y contexto. | 10 | 9 | 1 | COINCIDE |
| [departments_history](#departments_history) | Preserva versiones o estados históricos de departments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [diagnostic_reports_history](#diagnostic_reports_history) | Preserva versiones o estados históricos de diagnostic reports para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [diagnostic_study_prices_history](#diagnostic_study_prices_history) | Preserva versiones o estados históricos de diagnostic study prices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [document_records_history](#document_records_history) | Preserva versiones o estados históricos de document records para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [dsar_requests](#dsar_requests) | Gestiona solicitudes de derechos de titulares sobre sus datos, incluida su atención y resolución en el sistema médico. | 13 | 7 | 6 | COINCIDE |
| [employment_records_history](#employment_records_history) | Preserva versiones o estados históricos de employment records para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [encounter_locations_history](#encounter_locations_history) | Preserva versiones o estados históricos de las ubicaciones y camas asignadas a un encuentro para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [enrollments_history](#enrollments_history) | Preserva versiones o estados históricos de enrollments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [event_subscriptions_history](#event_subscriptions_history) | Preserva versiones o estados históricos de event subscriptions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [federated_identities_history](#federated_identities_history) | Preserva versiones o estados históricos de federated identities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [groups_history](#groups_history) | Preserva versiones o estados históricos de groups para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [guardrail_policies_history](#guardrail_policies_history) | Preserva versiones o estados históricos de guardrail policies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [health_practitioner_profiles_history](#health_practitioner_profiles_history) | Preserva versiones o estados históricos de health practitioner profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [identity_providers_history](#identity_providers_history) | Preserva versiones o estados históricos de identity providers para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [identity_verification_access_log](#identity_verification_access_log) | Registra accesos a evidencia y resultados de verificación de identidad para proteger ese proceso sensible. | 9 | 8 | 1 | COINCIDE |
| [imaging_studies_history](#imaging_studies_history) | Preserva versiones o estados históricos de imaging studies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [inbound_messages_history](#inbound_messages_history) | Preserva versiones o estados históricos de inbound messages para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [informational_materials_history](#informational_materials_history) | Conserva revisiones de materiales informativos de productos farmacéuticos, con número de revisión y operación auditada, para reconstruir cambios en contenido entregado a profesionales de salud. | 10 | 5 | 0 | COINCIDE |
| [insurance_claims_history](#insurance_claims_history) | Preserva versiones o estados históricos de insurance claims para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [insurance_decision_access_log](#insurance_decision_access_log) | Traza accesos a decisiones de cobertura y adjudicación para apoyar revisión y rendición de cuentas. | 10 | 10 | 1 | COINCIDE |
| [insurance_products_history](#insurance_products_history) | sin propósito | 10 | 5 | 0 | SIN_ENTIDAD |
| [integration_endpoints_history](#integration_endpoints_history) | Preserva versiones o estados históricos de integration endpoints para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [invoices_history](#invoices_history) | Preserva versiones o estados históricos de invoices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [journal_transactions_history](#journal_transactions_history) | Preserva versiones o estados históricos de journal transactions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [journeys_history](#journeys_history) | Preserva versiones o estados históricos de journeys para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [jurisdiction_authorizations_history](#jurisdiction_authorizations_history) | Preserva versiones o estados históricos de jurisdiction authorizations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 1 | COINCIDE |
| [liabilities_history](#liabilities_history) | Preserva versiones o estados históricos de liabilities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [loyalty_memberships_history](#loyalty_memberships_history) | Preserva versiones o estados históricos de loyalty memberships para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [loyalty_programs_history](#loyalty_programs_history) | Preserva versiones o estados históricos de loyalty programs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [marketing_campaigns_history](#marketing_campaigns_history) | Preserva versiones o estados históricos de marketing campaigns para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [medical_visitors_history](#medical_visitors_history) | Conserva revisiones de los representantes médicos y sus operaciones auditadas, dando trazabilidad a quién gestiona visitas y materiales ante profesionales de salud. | 10 | 5 | 0 | COINCIDE |
| [medication_requests_history](#medication_requests_history) | Preserva versiones o estados históricos de medication requests para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 21 | COINCIDE |
| [message_retries_history](#message_retries_history) | Preserva versiones o estados históricos de message retries para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [message_templates_history](#message_templates_history) | Preserva versiones o estados históricos de message templates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [moderation_decisions_history](#moderation_decisions_history) | Preserva versiones o estados históricos de moderation decisions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 1 | COINCIDE |
| [moderation_events](#moderation_events) | Mantiene eventos de moderación de contenido para reconstruir revisiones y acciones de seguridad comunitaria. | 9 | 5 | 1 | COINCIDE |
| [operating_room_block_series_history](#operating_room_block_series_history) | Preserva versiones o estados históricos de las series de bloques quirúrgicos para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [operating_room_blocks_history](#operating_room_blocks_history) | Preserva versiones o estados históricos de los bloques quirúrgicos asignados a servicios o cirujanos para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [opportunities_history](#opportunities_history) | Preserva versiones o estados históricos de opportunities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [order_sets_history](#order_sets_history) | Preserva versiones o estados históricos de order sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [organization_affiliations_history](#organization_affiliations_history) | Preserva versiones o estados históricos de organization affiliations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [outbound_messages_history](#outbound_messages_history) | Preserva versiones o estados históricos de outbound messages para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [partnership_agreements_history](#partnership_agreements_history) | Preserva versiones o estados históricos de partnership agreements para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [partnerships_history](#partnerships_history) | Preserva versiones o estados históricos de partnerships para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [patient_content_access_log](#patient_content_access_log) | Traza accesos al contenido clínico o personal del paciente para apoyar supervisión de privacidad. | 12 | 8 | 1 | COINCIDE |
| [patient_identity_links_history](#patient_identity_links_history) | Preserva versiones o estados históricos de patient identity links para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [patient_profiles_history](#patient_profiles_history) | Preserva versiones o estados históricos de patient profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [payment_intents_history](#payment_intents_history) | Preserva versiones o estados históricos de payment intents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [payment_mandates_history](#payment_mandates_history) | Preserva versiones o estados históricos de payment mandates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [payment_methods_history](#payment_methods_history) | Preserva versiones o estados históricos de payment methods para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [payment_transactions_history](#payment_transactions_history) | Preserva versiones o estados históricos de payment transactions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [payouts_history](#payouts_history) | Preserva versiones o estados históricos de payouts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [pharma_lab_staff_history](#pharma_lab_staff_history) | Registra revisiones del personal de laboratorios farmacéuticos con operación y número de revisión, para auditar cambios de roles que intervienen en actividades de promoción médica. | 10 | 5 | 0 | COINCIDE |
| [pharma_labs_history](#pharma_labs_history) | Mantiene el historial versionado de los laboratorios farmacéuticos y la operación que originó cada revisión, para auditar sus datos institucionales. | 10 | 5 | 0 | COINCIDE |
| [pharma_products_history](#pharma_products_history) | Mantiene revisiones auditables de productos farmacéuticos, vinculadas a su producto y operación, para reconstruir cambios de información del producto. | 10 | 5 | 0 | COINCIDE |
| [pharmacovigilance_reports_history](#pharmacovigilance_reports_history) | Registra revisiones de reportes de farmacovigilancia junto con su operación, para seguir cambios en casos de seguridad asociados a productos farmacéuticos. | 10 | 5 | 0 | COINCIDE |
| [pharmacy_inventory_access_log](#pharmacy_inventory_access_log) | Registra accesos al inventario de farmacia para auditar consultas y operaciones sobre existencias sanitarias. | 10 | 7 | 1 | COINCIDE |
| [pharmacy_product_prices_history](#pharmacy_product_prices_history) | Preserva versiones o estados históricos de pharmacy product prices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [placement_incidents_history](#placement_incidents_history) | Preserva versiones o estados históricos de las excepciones de ubicación de pacientes para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [positions_history](#positions_history) | Preserva versiones o estados históricos de positions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [practice_sites_history](#practice_sites_history) | Preserva versiones o estados históricos de practice sites para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 11 | 6 | 0 | COINCIDE |
| [practices_history](#practices_history) | Preserva versiones o estados históricos de practices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [practitioner_role_assignments_history](#practitioner_role_assignments_history) | Preserva versiones o estados históricos de practitioner role assignments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [procedure_cases_history](#procedure_cases_history) | sin propósito | 10 | 5 | 0 | SIN_ENTIDAD |
| [product_catalogs_history](#product_catalogs_history) | Preserva versiones o estados históricos de product catalogs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [product_sets_history](#product_sets_history) | Preserva versiones o estados históricos de product sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [professional_credentials_history](#professional_credentials_history) | Preserva versiones o estados históricos de professional credentials para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [promotions_history](#promotions_history) | Preserva versiones o estados históricos de promotions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [provider_channel_configs_history](#provider_channel_configs_history) | Preserva versiones o estados históricos de provider channel configs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [provider_connections_history](#provider_connections_history) | Preserva versiones o estados históricos de provider connections para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [provider_protocol_configs_history](#provider_protocol_configs_history) | Preserva versiones o estados históricos de provider protocol configs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [provider_tenant_bindings_history](#provider_tenant_bindings_history) | Preserva versiones o estados históricos de provider tenant bindings para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [public_profiles_history](#public_profiles_history) | Preserva versiones o estados históricos de public profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [record_automations_history](#record_automations_history) | Preserva versiones o estados históricos de record automations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [referral_programs_history](#referral_programs_history) | Preserva versiones o estados históricos de referral programs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [referrals_history](#referrals_history) | Preserva versiones o estados históricos de referrals para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [regulatory_documents_history](#regulatory_documents_history) | Conserva revisiones de documentos regulatorios y sus operaciones, para reconstruir cambios en documentación de cumplimiento de laboratorios y productos farmacéuticos. | 10 | 5 | 0 | COINCIDE |
| [report_definitions_history](#report_definitions_history) | Preserva versiones o estados históricos de report definitions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [report_schedules_history](#report_schedules_history) | Preserva versiones o estados históricos de report schedules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [schedule_templates_history](#schedule_templates_history) | Preserva versiones o estados históricos de schedule templates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [segments_history](#segments_history) | Preserva versiones o estados históricos de segments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [service_reviews_history](#service_reviews_history) | Preserva versiones o estados históricos de service reviews para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [shipments_history](#shipments_history) | Preserva versiones o estados históricos de shipments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [social_posts_history](#social_posts_history) | Preserva versiones o estados históricos de social posts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [space_tariffs_history](#space_tariffs_history) | Preserva versiones o estados históricos de las tarifas por uso de espacio para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia). | 11 | 6 | 0 | COINCIDE |
| [subscription_plans_history](#subscription_plans_history) | Preserva versiones o estados históricos de subscription plans para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [subscriptions_history](#subscriptions_history) | Preserva versiones o estados históricos de subscriptions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [tenants_history](#tenants_history) | Preserva versiones o estados históricos de tenants para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 6 | 0 | COINCIDE |
| [test_cases_history](#test_cases_history) | Preserva versiones o estados históricos de test cases para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [test_suites_history](#test_suites_history) | Preserva versiones o estados históricos de test suites para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [topics_history](#topics_history) | Preserva versiones o estados históricos de topics para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [trackable_subjects_history](#trackable_subjects_history) | Preserva versiones o estados históricos de trackable subjects para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [users_history](#users_history) | Preserva versiones o estados históricos de users para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [verified_badges_history](#verified_badges_history) | Preserva versiones o estados históricos de verified badges para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 12 | COINCIDE |
| [visit_requests_history](#visit_requests_history) | Conserva revisiones de solicitudes de visita médica y su operación, para auditar cambios en la coordinación entre representantes y profesionales de salud. | 10 | 5 | 0 | COINCIDE |
| [wallets_history](#wallets_history) | Preserva versiones o estados históricos de wallets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |
| [workflows_history](#workflows_history) | Preserva versiones o estados históricos de workflows para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico. | 10 | 5 | 0 | COINCIDE |

### Tablas sin relaciones dentro del schema

`audit.accounts_history` · `audit.ad_accounts_history` · `audit.ad_creatives_history` · `audit.ad_experiments_history` · `audit.ad_sets_history` · `audit.ads_history` · `audit.agent_versions_history` · `audit.agents_history` · `audit.allergy_intolerances_history` · `audit.analytics_governance_log` · `audit.appointment_bookings_history` · `audit.assets_history` · `audit.audit_log` · `audit.automated_rules_history` · `audit.bills_history` · `audit.booking_policies_history` · `audit.campaigns_history` · `audit.care_plans_history` · `audit.care_space_blocks_history` · `audit.care_space_category_periods_history` · `audit.care_spaces_history` · `audit.care_teams_history` · `audit.catalog_products_history` · `audit.cds_rules_history` · `audit.certificates_history` · `audit.charge_captures_history` · `audit.cleaning_orders_history` · `audit.clinical_alerts_history` · `audit.clinical_note_headers_history` · `audit.clinical_units_history` · `audit.comments_history` · `audit.conditions_history` · `audit.connected_accounts_history` · `audit.consents_history` · `audit.contacts_history` · `audit.contracts_history` · `audit.conversations_history` · `audit.coupons_history` · `audit.course_versions_history` · `audit.courses_history` · `audit.crm_accounts_history` · `audit.custom_audiences_history` · `audit.custom_conversions_history` · `audit.data_access_log` · `audit.delegated_access_audit_log` · `audit.departments_history` · `audit.diagnostic_reports_history` · `audit.diagnostic_study_prices_history` · `audit.document_records_history` · `audit.dsar_requests` · `audit.employment_records_history` · `audit.encounter_locations_history` · `audit.enrollments_history` · `audit.event_subscriptions_history` · `audit.federated_identities_history` · `audit.groups_history` · `audit.guardrail_policies_history` · `audit.health_practitioner_profiles_history` · `audit.identity_providers_history` · `audit.identity_verification_access_log` · `audit.imaging_studies_history` · `audit.inbound_messages_history` · `audit.informational_materials_history` · `audit.insurance_claims_history` · `audit.insurance_decision_access_log` · `audit.insurance_products_history` · `audit.integration_endpoints_history` · `audit.invoices_history` · `audit.journal_transactions_history` · `audit.journeys_history` · `audit.jurisdiction_authorizations_history` · `audit.liabilities_history` · `audit.loyalty_memberships_history` · `audit.loyalty_programs_history` · `audit.marketing_campaigns_history` · `audit.medical_visitors_history` · `audit.medication_requests_history` · `audit.message_retries_history` · `audit.message_templates_history` · `audit.moderation_decisions_history` · `audit.moderation_events` · `audit.operating_room_block_series_history` · `audit.operating_room_blocks_history` · `audit.opportunities_history` · `audit.order_sets_history` · `audit.organization_affiliations_history` · `audit.outbound_messages_history` · `audit.partnership_agreements_history` · `audit.partnerships_history` · `audit.patient_content_access_log` · `audit.patient_identity_links_history` · `audit.patient_profiles_history` · `audit.payment_intents_history` · `audit.payment_mandates_history` · `audit.payment_methods_history` · `audit.payment_transactions_history` · `audit.payouts_history` · `audit.pharma_lab_staff_history` · `audit.pharma_labs_history` · `audit.pharma_products_history` · `audit.pharmacovigilance_reports_history` · `audit.pharmacy_inventory_access_log` · `audit.pharmacy_product_prices_history` · `audit.placement_incidents_history` · `audit.positions_history` · `audit.practice_sites_history` · `audit.practices_history` · `audit.practitioner_role_assignments_history` · `audit.procedure_cases_history` · `audit.product_catalogs_history` · `audit.product_sets_history` · `audit.professional_credentials_history` · `audit.promotions_history` · `audit.provider_channel_configs_history` · `audit.provider_connections_history` · `audit.provider_protocol_configs_history` · `audit.provider_tenant_bindings_history` · `audit.public_profiles_history` · `audit.record_automations_history` · `audit.referral_programs_history` · `audit.referrals_history` · `audit.regulatory_documents_history` · `audit.report_definitions_history` · `audit.report_schedules_history` · `audit.schedule_templates_history` · `audit.segments_history` · `audit.service_reviews_history` · `audit.shipments_history` · `audit.social_posts_history` · `audit.space_tariffs_history` · `audit.subscription_plans_history` · `audit.subscriptions_history` · `audit.tenants_history` · `audit.test_cases_history` · `audit.test_suites_history` · `audit.topics_history` · `audit.trackable_subjects_history` · `audit.users_history` · `audit.verified_badges_history` · `audit.visit_requests_history` · `audit.wallets_history` · `audit.workflows_history`

## Fichas

### accounts_history

#### Vista general

Preserva versiones o estados históricos de accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: accounts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AccountsHistory` — `src/modules/audit/entities/accounts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `account_id` | `uuid` | Clave foránea → accounting.accounts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | account_id | accounting.accounts (id) | fk_accounts_history_account_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_accounts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_accounts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_accounts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_accounts_history_account_id` | no | account_id | Soporta la clave foránea fk_accounts_history_account_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_accounts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_accounts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_accounts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_accounts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_accounts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_accounts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_accounts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### ad_accounts_history

#### Vista general

Preserva versiones o estados históricos de ad accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: ad_accounts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AdAccountsHistory` — `src/modules/audit/entities/ad_accounts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `ad_account_id` | `uuid` | Clave foránea → ads.ad_accounts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | ad_account_id | ads.ad_accounts (id) | fk_ad_accounts_history_ad_account_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_ad_accounts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_ad_accounts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_ad_accounts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_ad_accounts_history_ad_account_id` | no | ad_account_id | Soporta la clave foránea fk_ad_accounts_history_ad_account_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_accounts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_ad_accounts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_accounts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_ad_accounts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_accounts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_ad_accounts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_ad_accounts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### ad_creatives_history

#### Vista general

Preserva versiones o estados históricos de ad creatives para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: ad_creatives_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AdCreativesHistory` — `src/modules/audit/entities/ad_creatives_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `ad_creative_id` | `uuid` | Clave foránea → ads.ad_creatives.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | ad_creative_id | ads.ad_creatives (id) | fk_ad_creatives_history_ad_creative_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_ad_creatives_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_ad_creatives_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_ad_creatives_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_ad_creatives_history_ad_creative_id` | no | ad_creative_id | Soporta la clave foránea fk_ad_creatives_history_ad_creative_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_creatives_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_ad_creatives_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_creatives_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_ad_creatives_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_creatives_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_ad_creatives_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_ad_creatives_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### ad_experiments_history

#### Vista general

Preserva versiones o estados históricos de ad experiments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: ad_experiments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AdExperimentsHistory` — `src/modules/audit/entities/ad_experiments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `ad_experiments_id` | `uuid` | Clave foránea → ads.ad_experiments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/ad_experiments_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | ad_experiments_id | ads.ad_experiments (id) | fk_ad_experiments_history_ad_experiments_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_ad_experiments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_ad_experiments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_ad_experiments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_ad_experiments_history_ad_experiments_id` | no | ad_experiments_id | Soporta la clave foránea fk_ad_experiments_history_ad_experiments_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_experiments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_ad_experiments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_experiments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_ad_experiments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_experiments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_ad_experiments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_ad_experiments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### ad_sets_history

#### Vista general

Preserva versiones o estados históricos de ad sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: ad_sets_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AdSetsHistory` — `src/modules/audit/entities/ad_sets_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `ad_set_id` | `uuid` | Clave foránea → ads.ad_sets.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | ad_set_id | ads.ad_sets (id) | fk_ad_sets_history_ad_set_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_ad_sets_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_ad_sets_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_ad_sets_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_ad_sets_history_ad_set_id` | no | ad_set_id | Soporta la clave foránea fk_ad_sets_history_ad_set_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_sets_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_ad_sets_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_sets_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_ad_sets_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ad_sets_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_ad_sets_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_ad_sets_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### ads_history

#### Vista general

Preserva versiones o estados históricos de ads para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: ads_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AdsHistory` — `src/modules/audit/entities/ads_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `ad_id` | `uuid` | Clave foránea → ads.ads.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | ad_id | ads.ads (id) | fk_ads_history_ad_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_ads_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_ads_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_ads_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_ads_history_ad_id` | no | ad_id | Soporta la clave foránea fk_ads_history_ad_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ads_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_ads_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ads_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_ads_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_ads_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_ads_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_ads_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### agent_versions_history

#### Vista general

Preserva versiones o estados históricos de agent versions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: agent_versions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AgentVersionsHistory` — `src/modules/audit/entities/agent_versions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `agent_versions_id` | `uuid` | Clave foránea → automation.agent_versions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/agent_versions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | agent_versions_id | automation.agent_versions (id) | fk_agent_versions_history_agent_versions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_agent_versions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_agent_versions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_agent_versions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_agent_versions_history_agent_versions_id` | no | agent_versions_id | Soporta la clave foránea fk_agent_versions_history_agent_versions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agent_versions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_agent_versions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agent_versions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_agent_versions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agent_versions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_agent_versions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_agent_versions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### agents_history

#### Vista general

Preserva versiones o estados históricos de agents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: agents_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AgentsHistory` — `src/modules/audit/entities/agents_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `agents_id` | `uuid` | Clave foránea → automation.agents.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/agents_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | agents_id | automation.agents (id) | fk_agents_history_agents_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_agents_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_agents_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_agents_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_agents_history_agents_id` | no | agents_id | Soporta la clave foránea fk_agents_history_agents_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agents_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_agents_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agents_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_agents_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_agents_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_agents_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_agents_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### allergy_intolerances_history

#### Vista general

Preserva versiones o estados históricos de allergy intolerances para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: allergy_intolerances_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AllergyIntolerancesHistory` — `src/modules/audit/entities/allergy_intolerances_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `allergy_intolerance_id` | `uuid` | Clave foránea → clinical.allergy_intolerances.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | allergy_intolerance_id | clinical.allergy_intolerances (id) | fk_allergy_intolerances_history_allergy_intolerance_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_allergy_intolerances_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_allergy_intolerances_history_allergy_intolerance_id` | no | allergy_intolerance_id | Soporta la clave foránea fk_allergy_intolerances_history_allergy_intolerance_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_allergy_intolerances_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_allergy_intolerances_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_allergy_intolerances_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_allergy_intolerances_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### analytics_governance_log

#### Vista general

Registra cambios de gobierno analítico para conservar trazabilidad de decisiones que afectan el uso secundario de datos de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: analytics_governance_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AnalyticsGovernanceLog` — `src/modules/audit/entities/analytics_governance_log.entity.ts`
- **Resumen:** 9 columnas · 5 índices · 4 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/analytics_governance_log.entity.ts:12`)_ | coincide |
| 2 | `actor_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `purpose_definition_id` | `uuid` | Clave foránea → telemetry.tracking_purpose_definitions.id; Opcional | _sin dato_ | coincide |
| 5 | `export_reference` | `varchar` | Opcional | _sin dato_ | coincide |
| 6 | `affected_subject_count` | `bigint` | Opcional | _sin dato_ | coincide |
| 7 | `query_hash` | `varchar` | Opcional | _sin dato_ | coincide |
| 8 | `approval_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | actor_user_id | iam.users (id) | fk_analytics_governance_log_actor_user_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_analytics_governance_log_action_concept_id |
| hacia | purpose_definition_id | telemetry.tracking_purpose_definitions (id) | fk_analytics_governance_log_purpose_definition_id |
| hacia | approval_status_concept_id | terminology.catalog_concepts (id) | fk_analytics_governance_log_approval_status_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_analytics_governance_log_actor_user_id` | no | actor_user_id | Soporta la clave foránea fk_analytics_governance_log_actor_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_analytics_governance_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_analytics_governance_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_analytics_governance_log_purpose_definition_id` | no | purpose_definition_id | Soporta la clave foránea fk_analytics_governance_log_purpose_definition_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_analytics_governance_log_approval_status_concept_id` | no | approval_status_concept_id | Soporta la clave foránea fk_analytics_governance_log_approval_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_analytics_governance_log_occurred_at` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /compliance/audit-export | CREA | DIRECTA |
| POST /compliance/audit-export | LEE | DIRECTA |
| POST /moderation/decisions | CREA | DIRECTA |
| POST /privacy/dsar | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### appointment_bookings_history

#### Vista general

Preserva versiones o estados históricos de appointment bookings para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: appointment_bookings_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AppointmentBookingsHistory` — `src/modules/audit/entities/appointment_bookings_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 50 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `appointment_booking_id` | `uuid` | Clave foránea → scheduling.appointment_bookings.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | appointment_booking_id | scheduling.appointment_bookings (id) | fk_appointment_bookings_history_appointment_booking_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_appointment_bookings_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_appointment_bookings_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_appointment_bookings_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_appointment_bookings_history_appointment_booking_id` | no | appointment_booking_id | Soporta la clave foránea fk_appointment_bookings_history_appointment_booking_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointment_bookings_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_appointment_bookings_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointment_bookings_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_appointment_bookings_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointment_bookings_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_appointment_bookings_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_appointment_bookings_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_appointment_bookings_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/appointments/direct | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/appointments/direct | CREA | POR_REGISTRO |
| POST /scheduling/appointments/direct | LEE | POR_REGISTRO |
| POST /scheduling/appointments/walk-in | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/appointments/walk-in | CREA | POR_REGISTRO |
| POST /scheduling/appointments/walk-in | LEE | POR_REGISTRO |
| GET /scheduling/bookings | LEE | POR_REGISTRO |
| GET /scheduling/bookings/{id} | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/accept | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/accept | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/accept | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/cancel | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/cancel | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/cancel | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/check-in | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/check-in | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/check-in | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/complete | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/complete | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/complete | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/delay | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/delay | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/delay | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/propose-schedule | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/propose-schedule | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/propose-schedule | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reject | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reject | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reject | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/request-info | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/request-info | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/request-info | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reschedule | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reschedule | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/reschedule | LEE | POR_REGISTRO |
| POST /scheduling/bookings/{id}/start | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/start | CREA | POR_REGISTRO |
| POST /scheduling/bookings/{id}/start | LEE | POR_REGISTRO |
| POST /scheduling/resources/{id}/close-slots | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/resources/{id}/close-slots | CREA | POR_REGISTRO |
| POST /scheduling/resources/{id}/close-slots | LEE | POR_REGISTRO |
| POST /scheduling/resources/{id}/delay | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/resources/{id}/delay | CREA | POR_REGISTRO |
| POST /scheduling/resources/{id}/delay | LEE | POR_REGISTRO |
| POST /scheduling/resources/{id}/exceptions | ACTUALIZA | POR_REGISTRO |
| POST /scheduling/resources/{id}/exceptions | CREA | POR_REGISTRO |
| POST /scheduling/resources/{id}/exceptions | LEE | POR_REGISTRO |
| DELETE /scheduling/templates/{id} | ACTUALIZA | POR_REGISTRO |
| DELETE /scheduling/templates/{id} | CREA | POR_REGISTRO |
| DELETE /scheduling/templates/{id} | LEE | POR_REGISTRO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### assets_history

#### Vista general

Preserva versiones o estados históricos de assets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: assets_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AssetsHistory` — `src/modules/audit/entities/assets_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `asset_id` | `uuid` | Clave foránea → accounting.assets.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | asset_id | accounting.assets (id) | fk_assets_history_asset_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_assets_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_assets_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_assets_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_assets_history_asset_id` | no | asset_id | Soporta la clave foránea fk_assets_history_asset_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_assets_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_assets_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_assets_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_assets_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_assets_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_assets_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_assets_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### audit_log

#### Vista general

Conserva eventos de auditoría de acciones del sistema para reconstruir quién realizó operaciones y cuándo.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: audit_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AuditLog` — `src/modules/audit/entities/audit_log.entity.ts`
- **Resumen:** 17 columnas · 10 índices · 7 FK salientes · 0 entrantes · 216 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/audit_log.entity.ts:12`)_ | coincide |
| 2 | `user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Opcional | _sin dato_ | coincide |
| 4 | `branch_id` | `uuid` | Clave foránea → directory.branches.id; Opcional | _sin dato_ | coincide |
| 5 | `action` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `entity` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `entity_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 8 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `ip` | `inet` | Opcional | _sin dato_ | coincide |
| 10 | `device_id` | `uuid` | Clave foránea → iam.devices.id; Opcional | _sin dato_ | coincide |
| 11 | `session_id` | `uuid` | Clave foránea → iam.sessions.id; Opcional | + v4.2.49 (CAN-AUDIT-001 / C-19): los tres campos de la auditoria canonica que faltaban. session_id ata la fila a la sesion (iam.sessions) que actuo; correlation_id ata las lecturas y escrituras de una misma operacion (p. ej. el conjunto que habilito una sesion de emergencia, authz.break_glass_sessions); actor_role_snapshot CONGELA el rol con el que actuo el usuario: la auditoria posterior lee el rol que autorizo el acto, no el actual. Los tres nullable: las filas anteriores no los tienen y la tabla es WORM (no se pueden completar). _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_10_audit.puml:31`)_ | **AUSENTE_EN_ORM** |
| 12 | `correlation_id` | `uuid` | Opcional | _sin dato_ | **AUSENTE_EN_ORM** |
| 13 | `actor_role_snapshot` | `varchar` | Opcional | _sin dato_ | **AUSENTE_EN_ORM** |
| 14 | `previous_hash` | `varchar` | Opcional | _sin dato_ | coincide |
| 15 | `record_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 16 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 17 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | user_id | iam.users (id) | fk_audit_log_user_id |
| hacia | tenant_id | directory.tenants (id) | fk_audit_log_tenant_id |
| hacia | branch_id | directory.branches (id) | fk_audit_log_branch_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_audit_log_outcome_concept_id |
| hacia | device_id | iam.devices (id) | fk_audit_log_device_id |
| hacia | session_id | iam.sessions (id) | fk_audit_log_session_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_audit_log_recorded_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_audit_log_user_id` | no | user_id | Soporta la clave foránea fk_audit_log_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_tenant_id` | no | tenant_id | Soporta la clave foránea fk_audit_log_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_audit_log_branch_id` | no | branch_id | Soporta la clave foránea fk_audit_log_branch_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_audit_log_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_device_id` | no | device_id | Soporta la clave foránea fk_audit_log_device_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_session_id` | no | session_id | Soporta la clave foránea fk_audit_log_session_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_correlation_id` | no | correlation_id donde WHERE correlation_id IS NOT NULL | Índice parcial: sólo indexa las filas donde WHERE correlation_id IS NOT NULL _(ESTRUCTURAL)_ |
| `ix_audit_log_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_audit_log_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audit_log_tenant_id_recorded_at` | no | tenant_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_audit_log_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «recorded_at», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /accounting/journal-transactions | CREA | DIRECTA |
| POST /accounting/journal-transactions | LEE | DIRECTA |
| POST /accounting/journal-transactions/{id}/classify | CREA | DIRECTA |
| POST /accounting/journal-transactions/{id}/classify | LEE | DIRECTA |
| POST /accounting/journal-transactions/{id}/post | CREA | DIRECTA |
| POST /accounting/journal-transactions/{id}/post | LEE | DIRECTA |
| POST /accounting/journal-transactions/{id}/reverse | CREA | DIRECTA |
| POST /accounting/journal-transactions/{id}/reverse | LEE | DIRECTA |
| PATCH /accounting/practitioner/assets/{id}/automation | CREA | DIRECTA |
| PATCH /accounting/practitioner/assets/{id}/automation | LEE | DIRECTA |
| PATCH /accounting/practitioner/liabilities/{id}/automation | CREA | DIRECTA |
| PATCH /accounting/practitioner/liabilities/{id}/automation | LEE | DIRECTA |
| POST /audit/anomaly/scan | CREA | DIRECTA |
| POST /audit/anomaly/scan | LEE | DIRECTA |
| POST /audit/data-access | CREA | DIRECTA |
| POST /audit/data-access | LEE | DIRECTA |
| POST /audit/events | CREA | DIRECTA |
| POST /audit/events | LEE | DIRECTA |
| GET /audit/history/{entity}/{id} | CREA | DIRECTA |
| GET /audit/history/{entity}/{id} | LEE | DIRECTA |
| POST /audit/integrity/verify | CREA | DIRECTA |
| POST /audit/integrity/verify | LEE | DIRECTA |
| GET /audit/log | LEE | POR_SQL |
| POST /audit/retention/apply | CREA | DIRECTA |
| POST /audit/retention/apply | LEE | DIRECTA |
| POST /audit/third-party-access | CREA | DIRECTA |
| POST /audit/third-party-access | LEE | DIRECTA |
| POST /compliance/audit-export | CREA | DIRECTA |
| POST /compliance/audit-export | LEE | DIRECTA |
| POST /moderation/decisions | CREA | DIRECTA |
| POST /moderation/decisions | LEE | DIRECTA |
| POST /privacy/dsar | CREA | DIRECTA |
| POST /privacy/dsar | LEE | DIRECTA |
| PATCH /privacy/dsar/{id} | CREA | DIRECTA |
| PATCH /privacy/dsar/{id} | LEE | DIRECTA |
| GET /authz/access-reviews | LEE | POR_SQL |
| GET /authz/access-reviews/due | LEE | POR_SQL |
| POST /authz/care-relationships/{id}/respond | CREA | DIRECTA |
| POST /authz/care-relationships/{id}/respond | LEE | DIRECTA |
| POST /authz/care-relationships/request | CREA | DIRECTA |
| POST /authz/care-relationships/request | LEE | DIRECTA |
| DELETE /authz/clinical-access-grants/{grantId} | CREA | DIRECTA |
| DELETE /authz/clinical-access-grants/{grantId} | LEE | DIRECTA |
| POST /authz/me/clinical-access-grants/{grantId}/revoke | CREA | DIRECTA |
| POST /authz/me/clinical-access-grants/{grantId}/revoke | LEE | DIRECTA |
| POST /authz/patients/{patientProfileId}/break-the-glass | CREA | DIRECTA |
| POST /authz/patients/{patientProfileId}/break-the-glass | LEE | DIRECTA |
| POST /authz/patients/{patientProfileId}/clinical-access-grants | CREA | DIRECTA |
| POST /authz/patients/{patientProfileId}/clinical-access-grants | LEE | DIRECTA |
| GET /authz/users/{userId}/access-map | LEE | POR_SQL |
| POST /authz/users/{userId}/access-reviews | CREA | DIRECTA |
| POST /authz/users/{userId}/access-reviews | LEE | DIRECTA |
| GET /admin/bulk-imports/{id} | CREA | DIRECTA |
| GET /admin/bulk-imports/{id} | LEE | DIRECTA |
| POST /admin/bulk-imports/{id}/confirm | CREA | DIRECTA |
| POST /admin/bulk-imports/{id}/confirm | LEE | DIRECTA |
| GET /admin/bulk-imports/{id}/report | CREA | DIRECTA |
| GET /admin/bulk-imports/{id}/report | LEE | DIRECTA |
| POST /clinical/conditions | CREA | DIRECTA |
| POST /clinical/conditions | LEE | DIRECTA |
| POST /clinical/conditions/{id}/change-status | CREA | DIRECTA |
| POST /clinical/conditions/{id}/change-status | LEE | DIRECTA |
| POST /clinical/conditions/{id}/verification | CREA | DIRECTA |
| POST /clinical/conditions/{id}/verification | LEE | DIRECTA |
| POST /clinical/encounters/check-in | CREA | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/invalidate | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/invalidate | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/issue | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/issue | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/renew | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/renew | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/replace | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/replace | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/sign | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/sign | LEE | DIRECTA |
| POST /consent/consents/{id}/withdraw | CREA | DIRECTA |
| POST /consent/consents/{id}/withdraw | LEE | DIRECTA |
| POST /consent/me/consents/{id}/withdraw | CREA | DIRECTA |
| POST /consent/me/consents/{id}/withdraw | LEE | DIRECTA |
| POST /consent/practitioner-access-requests | CREA | DIRECTA |
| POST /consent/practitioner-access-requests | LEE | DIRECTA |
| POST /consent/practitioner-access-requests/{id}/decision | CREA | DIRECTA |
| POST /consent/practitioner-access-requests/{id}/decision | LEE | DIRECTA |
| GET /admin/governance/jobs | LEE | POR_SQL |
| GET /insurance-campaigns | CREA | DIRECTA |
| GET /insurance-campaigns | LEE | DIRECTA |
| POST /insurance-campaigns | CREA | DIRECTA |
| POST /insurance-campaigns | LEE | DIRECTA |
| GET /insurance-campaigns/{id} | CREA | DIRECTA |
| GET /insurance-campaigns/{id} | LEE | DIRECTA |
| PATCH /insurance-campaigns/{id} | CREA | DIRECTA |
| PATCH /insurance-campaigns/{id} | LEE | DIRECTA |
| PATCH /insurance-campaigns/{id}/status | CREA | DIRECTA |
| PATCH /insurance-campaigns/{id}/status | LEE | DIRECTA |
| GET /insurance-campaigns/my-benefits | CREA | DIRECTA |
| GET /insurance-campaigns/my-benefits | LEE | DIRECTA |
| GET /insurance-campaigns/patient/{patientProfileId} | CREA | DIRECTA |
| GET /insurance-campaigns/patient/{patientProfileId} | LEE | DIRECTA |
| GET /insurance/campaigns | CREA | DIRECTA |
| GET /insurance/campaigns | LEE | DIRECTA |
| POST /insurance/campaigns | CREA | DIRECTA |
| POST /insurance/campaigns | LEE | DIRECTA |
| GET /insurance/campaigns/{id} | CREA | DIRECTA |
| GET /insurance/campaigns/{id} | LEE | DIRECTA |
| PATCH /insurance/campaigns/{id} | CREA | DIRECTA |
| PATCH /insurance/campaigns/{id} | LEE | DIRECTA |
| PATCH /insurance/campaigns/{id}/status | CREA | DIRECTA |
| PATCH /insurance/campaigns/{id}/status | LEE | DIRECTA |
| GET /insurance/campaigns/my-benefits | CREA | DIRECTA |
| GET /insurance/campaigns/my-benefits | LEE | DIRECTA |
| GET /insurance/campaigns/patient/{patientProfileId} | CREA | DIRECTA |
| GET /insurance/campaigns/patient/{patientProfileId} | LEE | DIRECTA |
| GET /insurance/portability/certificates/{certificateId}/json | CREA | DIRECTA |
| GET /insurance/portability/certificates/{certificateId}/json | LEE | DIRECTA |
| GET /insurance/portability/certificates/{certificateId}/pdf | CREA | DIRECTA |
| GET /insurance/portability/certificates/{certificateId}/pdf | LEE | DIRECTA |
| POST /insurance/portability/export | CREA | DIRECTA |
| POST /insurance/portability/export | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | CREA | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | CREA | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |
| POST /pharma-labs | CREA | DIRECTA |
| POST /pharma-labs | LEE | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId} | CREA | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId} | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/cost-allocations | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/cost-allocations | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors | LEE | DIRECTA |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products | CREA | DIRECTA |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink | LEE | DIRECTA |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties | CREA | DIRECTA |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/products | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/products | LEE | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId}/products/{productId} | CREA | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId}/products/{productId} | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/products/{productId}/status | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/products/{productId}/status | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/staff | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/staff | LEE | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions | CREA | DIRECTA |
| PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink | LEE | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision | CREA | DIRECTA |
| POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision | LEE | DIRECTA |
| POST /pharma-labs/visitor-posts | CREA | DIRECTA |
| POST /pharma-labs/visitor-posts | LEE | DIRECTA |
| POST /visit-agenda/blocks | CREA | DIRECTA |
| POST /visit-agenda/blocks | LEE | DIRECTA |
| POST /visit-agenda/blocks/{blockId}/lift | CREA | DIRECTA |
| POST /visit-agenda/blocks/{blockId}/lift | LEE | DIRECTA |
| PUT /visit-agenda/me | CREA | DIRECTA |
| PUT /visit-agenda/me | LEE | DIRECTA |
| POST /visit-records | CREA | DIRECTA |
| POST /visit-records | LEE | DIRECTA |
| POST /visit-records/{visitRecordId}/confirm | CREA | DIRECTA |
| POST /visit-records/{visitRecordId}/confirm | LEE | DIRECTA |
| POST /visit-records/{visitRecordId}/rating | CREA | DIRECTA |
| POST /visit-records/{visitRecordId}/rating | LEE | DIRECTA |
| POST /visit-requests | CREA | DIRECTA |
| POST /visit-requests | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/accept | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/accept | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/cancel | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/cancel | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/propose-time | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/propose-time | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/reject | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/reject | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/request-info | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/request-info | LEE | DIRECTA |
| POST /visit-requests/{visitRequestId}/reschedule | CREA | DIRECTA |
| POST /visit-requests/{visitRequestId}/reschedule | LEE | DIRECTA |
| POST /visit-surveys/labs/{pharmaLabId} | CREA | DIRECTA |
| POST /visit-surveys/labs/{pharmaLabId} | LEE | DIRECTA |
| POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close | CREA | DIRECTA |
| POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close | LEE | DIRECTA |
| POST /visit-surveys/responses/{responseId} | CREA | DIRECTA |
| POST /visit-surveys/responses/{responseId} | LEE | DIRECTA |
| GET /pharmacy/pharmacies/{id}/summary | LEE | POR_SQL |
| POST /dental-procedures | CREA | DIRECTA |
| POST /dental-procedures | LEE | DIRECTA |
| POST /procedure-cases/{id}/confirm | CREA | DIRECTA |
| POST /procedure-cases/{id}/confirm | LEE | DIRECTA |
| POST /procedure-cases/{id}/diagnoses | CREA | DIRECTA |
| POST /procedure-cases/{id}/diagnoses | LEE | DIRECTA |
| POST /procedure-cases/{id}/team-members/{memberId}/respond | CREA | DIRECTA |
| POST /procedure-cases/{id}/team-members/{memberId}/respond | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### automated_rules_history

#### Vista general

Preserva versiones o estados históricos de automated rules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: automated_rules_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `AutomatedRulesHistory` — `src/modules/audit/entities/automated_rules_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `automated_rules_id` | `uuid` | Clave foránea → ads.automated_rules.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/automated_rules_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | automated_rules_id | ads.automated_rules (id) | fk_automated_rules_history_automated_rules_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_automated_rules_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_automated_rules_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_automated_rules_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_automated_rules_history_automated_rules_id` | no | automated_rules_id | Soporta la clave foránea fk_automated_rules_history_automated_rules_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_automated_rules_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_automated_rules_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_automated_rules_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_automated_rules_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_automated_rules_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_automated_rules_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_automated_rules_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### bills_history

#### Vista general

Preserva versiones o estados históricos de bills para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: bills_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `BillsHistory` — `src/modules/audit/entities/bills_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `bill_id` | `uuid` | Clave foránea → billing.bills.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | bill_id | billing.bills (id) | fk_bills_history_bill_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_bills_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_bills_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_bills_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_bills_history_bill_id` | no | bill_id | Soporta la clave foránea fk_bills_history_bill_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_bills_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_bills_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_bills_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_bills_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_bills_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_bills_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_bills_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### booking_policies_history

#### Vista general

Preserva versiones o estados históricos de booking policies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: booking_policies_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `BookingPoliciesHistory` — `src/modules/audit/entities/booking_policies_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `booking_policy_id` | `uuid` | Clave foránea → scheduling.booking_policies.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | booking_policy_id | scheduling.booking_policies (id) | fk_booking_policies_history_booking_policy_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_booking_policies_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_booking_policies_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_booking_policies_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_booking_policies_history_booking_policy_id` | no | booking_policy_id | Soporta la clave foránea fk_booking_policies_history_booking_policy_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_booking_policies_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_booking_policies_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_booking_policies_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_booking_policies_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_booking_policies_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_booking_policies_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_booking_policies_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### campaigns_history

#### Vista general

Preserva versiones o estados históricos de campaigns para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: campaigns_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CampaignsHistory` — `src/modules/audit/entities/campaigns_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `campaign_id` | `uuid` | Clave foránea → ads.campaigns.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | campaign_id | ads.campaigns (id) | fk_campaigns_history_campaign_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_campaigns_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_campaigns_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_campaigns_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_campaigns_history_campaign_id` | no | campaign_id | Soporta la clave foránea fk_campaigns_history_campaign_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_campaigns_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_campaigns_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_campaigns_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_campaigns_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_campaigns_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_campaigns_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_campaigns_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_plans_history

#### Vista general

Preserva versiones o estados históricos de care plans para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: care_plans_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CarePlansHistory` — `src/modules/audit/entities/care_plans_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `care_plan_id` | `uuid` | Clave foránea → chart.care_plans.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | care_plan_id | chart.care_plans (id) | fk_care_plans_history_care_plan_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_care_plans_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_care_plans_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_care_plans_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_plans_history_care_plan_id` | no | care_plan_id | Soporta la clave foránea fk_care_plans_history_care_plan_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_plans_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_care_plans_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_plans_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_care_plans_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_plans_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_care_plans_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_care_plans_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_space_blocks_history

#### Vista general

Preserva versiones o estados históricos de los bloqueos de espacios para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: care_space_blocks_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CareSpaceBlocksHistory` — `src/modules/audit/entities/care_space_blocks_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `care_space_block_id` | `uuid` | Clave foránea → practice.care_space_blocks.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | care_space_block_id | practice.care_space_blocks (id) | fk_care_space_blocks_history_care_space_block_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_care_space_blocks_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_care_space_blocks_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_care_space_blocks_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_care_space_blocks_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_space_blocks_history_care_space_block_id` | no | care_space_block_id | Soporta la clave foránea fk_care_space_blocks_history_care_space_block_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_blocks_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_care_space_blocks_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_blocks_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_care_space_blocks_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_blocks_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_care_space_blocks_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_blocks_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_care_space_blocks_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_care_space_blocks_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_space_category_periods_history

#### Vista general

Preserva versiones o estados históricos de los períodos de categoría de cama para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: care_space_category_periods_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CareSpaceCategoryPeriodsHistory` — `src/modules/audit/entities/care_space_category_periods_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `care_space_category_period_id` | `uuid` | Clave foránea → practice.care_space_category_periods.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | care_space_category_period_id | practice.care_space_category_periods (id) | fk_care_space_category_periods_history_care_space_cate_9048acce |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_care_space_category_periods_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_care_space_category_periods_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_care_space_category_periods_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_care_space_category_periods_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_space_category_periods_history_care_space_cate_fc6e2c97` | no | care_space_category_period_id | Soporta la clave foránea fk_care_space_category_periods_history_care_space_cate_9048acce: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_category_periods_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_care_space_category_periods_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_category_periods_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_care_space_category_periods_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_category_periods_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_care_space_category_periods_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_space_category_periods_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_care_space_category_periods_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_care_space_category_periods_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_spaces_history

#### Vista general

Preserva versiones o estados históricos de care spaces para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: care_spaces_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CareSpacesHistory` — `src/modules/audit/entities/care_spaces_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | + v4.2.67b (seguridad): el tenant de la fila de origen, para que el RLS tenant_isolation cubra también la historia (data_snapshot es la foto completa de la fila). Solo inserción: mantra_app tiene SELECT, INSERT y UPDATE de valid_to (cierre SCD-2); ver el patch 2026-10-29_infraestructura_f1b_seguridad.sql. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_10_audit.puml:273`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | care_space_id | practice.care_spaces (id) | fk_care_spaces_history_care_space_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_care_spaces_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_care_spaces_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_care_spaces_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_care_spaces_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_spaces_history_care_space_id` | no | care_space_id | Soporta la clave foránea fk_care_spaces_history_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_spaces_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_care_spaces_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_spaces_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_care_spaces_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_spaces_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_care_spaces_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_spaces_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_care_spaces_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_care_spaces_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /care-spaces/{id}/lifecycle | ACTUALIZA | POR_REGISTRO |
| POST /care-spaces/{id}/lifecycle | CREA | POR_REGISTRO |
| POST /care-spaces/{id}/lifecycle | LEE | POR_REGISTRO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_teams_history

#### Vista general

Preserva versiones o estados históricos de care teams para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: care_teams_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CareTeamsHistory` — `src/modules/audit/entities/care_teams_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `care_team_id` | `uuid` | Clave foránea → clinical_ext.care_teams.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | care_team_id | clinical_ext.care_teams (id) | fk_care_teams_history_care_team_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_care_teams_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_care_teams_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_care_teams_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_teams_history_care_team_id` | no | care_team_id | Soporta la clave foránea fk_care_teams_history_care_team_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_teams_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_care_teams_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_teams_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_care_teams_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_teams_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_care_teams_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_care_teams_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### catalog_products_history

#### Vista general

Preserva versiones o estados históricos de catalog products para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: catalog_products_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CatalogProductsHistory` — `src/modules/audit/entities/catalog_products_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `catalog_products_id` | `uuid` | Clave foránea → ads.catalog_products.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/catalog_products_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | catalog_products_id | ads.catalog_products (id) | fk_catalog_products_history_catalog_products_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_catalog_products_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_catalog_products_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_catalog_products_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_catalog_products_history_catalog_products_id` | no | catalog_products_id | Soporta la clave foránea fk_catalog_products_history_catalog_products_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_catalog_products_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_catalog_products_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_catalog_products_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_catalog_products_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_catalog_products_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_catalog_products_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_catalog_products_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### cds_rules_history

#### Vista general

Preserva versiones o estados históricos de cds rules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: cds_rules_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CdsRulesHistory` — `src/modules/audit/entities/cds_rules_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `cds_rule_id` | `uuid` | Clave foránea → clinical_ext.cds_rules.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | cds_rule_id | clinical_ext.cds_rules (id) | fk_cds_rules_history_cds_rule_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_cds_rules_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_cds_rules_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_cds_rules_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_cds_rules_history_cds_rule_id` | no | cds_rule_id | Soporta la clave foránea fk_cds_rules_history_cds_rule_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cds_rules_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_cds_rules_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cds_rules_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_cds_rules_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cds_rules_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_cds_rules_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_cds_rules_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### certificates_history

#### Vista general

Preserva versiones o estados históricos de certificates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: certificates_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CertificatesHistory` — `src/modules/audit/entities/certificates_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `certificates_id` | `uuid` | Clave foránea → education.certificates.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/certificates_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | certificates_id | education.certificates (id) | fk_certificates_history_certificates_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_certificates_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_certificates_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_certificates_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_certificates_history_certificates_id` | no | certificates_id | Soporta la clave foránea fk_certificates_history_certificates_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_certificates_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_certificates_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_certificates_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_certificates_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_certificates_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_certificates_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_certificates_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### charge_captures_history

#### Vista general

Preserva versiones o estados históricos de los cargos devengados por uso de espacio para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: charge_captures_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ChargeCapturesHistory` — `src/modules/audit/entities/charge_captures_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `charge_capture_id` | `uuid` | Clave foránea → billing.charge_captures.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | charge_capture_id | billing.charge_captures (id) | fk_charge_captures_history_charge_capture_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_charge_captures_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_charge_captures_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_charge_captures_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_charge_captures_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_charge_captures_history_charge_capture_id` | no | charge_capture_id | Soporta la clave foránea fk_charge_captures_history_charge_capture_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_charge_captures_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_charge_captures_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_charge_captures_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_charge_captures_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_charge_captures_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_charge_captures_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_charge_captures_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_charge_captures_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_charge_captures_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### cleaning_orders_history

#### Vista general

Preserva versiones o estados históricos de las órdenes de limpieza de espacios para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: cleaning_orders_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CleaningOrdersHistory` — `src/modules/audit/entities/cleaning_orders_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `cleaning_order_id` | `uuid` | Clave foránea → practice.cleaning_orders.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | cleaning_order_id | practice.cleaning_orders (id) | fk_cleaning_orders_history_cleaning_order_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_cleaning_orders_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_cleaning_orders_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_cleaning_orders_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_cleaning_orders_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_cleaning_orders_history_cleaning_order_id` | no | cleaning_order_id | Soporta la clave foránea fk_cleaning_orders_history_cleaning_order_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cleaning_orders_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_cleaning_orders_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cleaning_orders_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_cleaning_orders_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cleaning_orders_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_cleaning_orders_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_cleaning_orders_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_cleaning_orders_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_cleaning_orders_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### clinical_alerts_history

#### Vista general

Preserva versiones o estados históricos de clinical alerts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: clinical_alerts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ClinicalAlertsHistory` — `src/modules/audit/entities/clinical_alerts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `clinical_alert_id` | `uuid` | Clave foránea → clinical_ext.clinical_alerts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | clinical_alert_id | clinical_ext.clinical_alerts (id) | fk_clinical_alerts_history_clinical_alert_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_clinical_alerts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_clinical_alerts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_clinical_alerts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_clinical_alerts_history_clinical_alert_id` | no | clinical_alert_id | Soporta la clave foránea fk_clinical_alerts_history_clinical_alert_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_alerts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_clinical_alerts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_alerts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_clinical_alerts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_alerts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_clinical_alerts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_clinical_alerts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### clinical_note_headers_history

#### Vista general

Preserva versiones o estados históricos de clinical note headers para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: clinical_note_headers_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ClinicalNoteHeadersHistory` — `src/modules/audit/entities/clinical_note_headers_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `clinical_note_header_id` | `uuid` | Clave foránea → chart.clinical_note_headers.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | clinical_note_header_id | chart.clinical_note_headers (id) | fk_clinical_note_headers_history_clinical_note_header_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_clinical_note_headers_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_clinical_note_headers_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_clinical_note_headers_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_clinical_note_headers_history_clinical_note_header_id` | no | clinical_note_header_id | Soporta la clave foránea fk_clinical_note_headers_history_clinical_note_header_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_note_headers_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_clinical_note_headers_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_note_headers_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_clinical_note_headers_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_note_headers_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_clinical_note_headers_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_clinical_note_headers_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### clinical_units_history

#### Vista general

Preserva versiones o estados históricos de clinical units para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: clinical_units_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ClinicalUnitsHistory` — `src/modules/audit/entities/clinical_units_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `clinical_unit_id` | `uuid` | Clave foránea → practice.clinical_units.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | + v4.2.67b (seguridad): el tenant de la fila de origen, para que el RLS tenant_isolation cubra también la historia (data_snapshot es la foto completa de la fila). Solo inserción: mantra_app tiene SELECT, INSERT y UPDATE de valid_to (cierre SCD-2); ver el patch 2026-10-29_infraestructura_f1b_seguridad.sql. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_10_audit.puml:255`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | clinical_unit_id | practice.clinical_units (id) | fk_clinical_units_history_clinical_unit_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_clinical_units_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_clinical_units_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_clinical_units_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_clinical_units_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_clinical_units_history_clinical_unit_id` | no | clinical_unit_id | Soporta la clave foránea fk_clinical_units_history_clinical_unit_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_units_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_clinical_units_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_units_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_clinical_units_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_units_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_clinical_units_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_clinical_units_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_clinical_units_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_clinical_units_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical-units/{id}/lifecycle | ACTUALIZA | POR_REGISTRO |
| POST /clinical-units/{id}/lifecycle | CREA | POR_REGISTRO |
| POST /clinical-units/{id}/lifecycle | LEE | POR_REGISTRO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### comments_history

#### Vista general

Preserva versiones o estados históricos de comments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: comments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CommentsHistory` — `src/modules/audit/entities/comments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `comments_id` | `uuid` | Clave foránea → community.comments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/comments_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | comments_id | community.comments (id) | fk_comments_history_comments_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_comments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_comments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_comments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_comments_history_comments_id` | no | comments_id | Soporta la clave foránea fk_comments_history_comments_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_comments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_comments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_comments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_comments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_comments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_comments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_comments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### conditions_history

#### Vista general

Preserva versiones o estados históricos de conditions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: conditions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ConditionsHistory` — `src/modules/audit/entities/conditions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 13 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `condition_id` | `uuid` | Clave foránea → clinical.conditions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | condition_id | clinical.conditions (id) | fk_conditions_history_condition_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_conditions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_conditions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_conditions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_conditions_history_condition_id` | no | condition_id | Soporta la clave foránea fk_conditions_history_condition_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_conditions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_conditions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_conditions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_conditions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/conditions | ACTUALIZA | POR_REGISTRO |
| POST /clinical/conditions | CREA | POR_REGISTRO |
| POST /clinical/conditions | LEE | POR_REGISTRO |
| POST /clinical/conditions/{id}/change-status | ACTUALIZA | POR_REGISTRO |
| POST /clinical/conditions/{id}/change-status | CREA | POR_REGISTRO |
| POST /clinical/conditions/{id}/change-status | LEE | POR_REGISTRO |
| POST /clinical/conditions/{id}/verification | ACTUALIZA | POR_REGISTRO |
| POST /clinical/conditions/{id}/verification | CREA | POR_REGISTRO |
| POST /clinical/conditions/{id}/verification | LEE | POR_REGISTRO |
| GET /clinical/patients/{patientProfileId}/summary | LEE | POR_REGISTRO |
| POST /procedure-cases/{id}/diagnoses | ACTUALIZA | POR_REGISTRO |
| POST /procedure-cases/{id}/diagnoses | CREA | POR_REGISTRO |
| POST /procedure-cases/{id}/diagnoses | LEE | POR_REGISTRO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### connected_accounts_history

#### Vista general

Preserva versiones o estados históricos de connected accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: connected_accounts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ConnectedAccountsHistory` — `src/modules/audit/entities/connected_accounts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `connected_accounts_id` | `uuid` | Clave foránea → payments.connected_accounts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/connected_accounts_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | connected_accounts_id | payments.connected_accounts (id) | fk_connected_accounts_history_connected_accounts_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_connected_accounts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_connected_accounts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_connected_accounts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_connected_accounts_history_connected_accounts_id` | no | connected_accounts_id | Soporta la clave foránea fk_connected_accounts_history_connected_accounts_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_connected_accounts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_connected_accounts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_connected_accounts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_connected_accounts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_connected_accounts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_connected_accounts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_connected_accounts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### consents_history

#### Vista general

Preserva versiones o estados históricos de consents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: consents_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ConsentsHistory` — `src/modules/audit/entities/consents_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `consent_id` | `uuid` | Clave foránea → consent.consents.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | consent_id | consent.consents (id) | fk_consents_history_consent_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_consents_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_consents_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_consents_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_consents_history_consent_id` | no | consent_id | Soporta la clave foránea fk_consents_history_consent_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_consents_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_consents_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_consents_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_consents_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_consents_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_consents_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_consents_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_consents_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### contacts_history

#### Vista general

Preserva versiones o estados históricos de contacts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: contacts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ContactsHistory` — `src/modules/audit/entities/contacts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `contacts_id` | `uuid` | Clave foránea → crm.contacts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/contacts_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | contacts_id | crm.contacts (id) | fk_contacts_history_contacts_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_contacts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_contacts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_contacts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_contacts_history_contacts_id` | no | contacts_id | Soporta la clave foránea fk_contacts_history_contacts_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contacts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_contacts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contacts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_contacts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contacts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_contacts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_contacts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### contracts_history

#### Vista general

Preserva versiones o estados históricos de contracts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: contracts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ContractsHistory` — `src/modules/audit/entities/contracts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `contract_id` | `uuid` | Clave foránea → erp.contracts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | contract_id | erp.contracts (id) | fk_contracts_history_contract_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_contracts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_contracts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_contracts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_contracts_history_contract_id` | no | contract_id | Soporta la clave foránea fk_contracts_history_contract_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contracts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_contracts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contracts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_contracts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_contracts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_contracts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_contracts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### conversations_history

#### Vista general

Preserva versiones o estados históricos de conversations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: conversations_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ConversationsHistory` — `src/modules/audit/entities/conversations_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `conversations_id` | `uuid` | Clave foránea → community.conversations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/conversations_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | conversations_id | community.conversations (id) | fk_conversations_history_conversations_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_conversations_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_conversations_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_conversations_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_conversations_history_conversations_id` | no | conversations_id | Soporta la clave foránea fk_conversations_history_conversations_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conversations_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_conversations_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conversations_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_conversations_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conversations_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_conversations_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_conversations_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### coupons_history

#### Vista general

Preserva versiones o estados históricos de coupons para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: coupons_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CouponsHistory` — `src/modules/audit/entities/coupons_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `coupons_id` | `uuid` | Clave foránea → promotions.coupons.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/coupons_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | coupons_id | promotions.coupons (id) | fk_coupons_history_coupons_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_coupons_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_coupons_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_coupons_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_coupons_history_coupons_id` | no | coupons_id | Soporta la clave foránea fk_coupons_history_coupons_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_coupons_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_coupons_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_coupons_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_coupons_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_coupons_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_coupons_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_coupons_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### course_versions_history

#### Vista general

Preserva versiones o estados históricos de course versions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: course_versions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CourseVersionsHistory` — `src/modules/audit/entities/course_versions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `course_versions_id` | `uuid` | Clave foránea → education.course_versions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/course_versions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | course_versions_id | education.course_versions (id) | fk_course_versions_history_course_versions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_course_versions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_course_versions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_course_versions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_course_versions_history_course_versions_id` | no | course_versions_id | Soporta la clave foránea fk_course_versions_history_course_versions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_course_versions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_course_versions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_course_versions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_course_versions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_course_versions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_course_versions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_course_versions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### courses_history

#### Vista general

Preserva versiones o estados históricos de courses para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: courses_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CoursesHistory` — `src/modules/audit/entities/courses_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `courses_id` | `uuid` | Clave foránea → education.courses.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/courses_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | courses_id | education.courses (id) | fk_courses_history_courses_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_courses_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_courses_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_courses_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_courses_history_courses_id` | no | courses_id | Soporta la clave foránea fk_courses_history_courses_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_courses_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_courses_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_courses_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_courses_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_courses_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_courses_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_courses_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### crm_accounts_history

#### Vista general

Preserva versiones o estados históricos de crm accounts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: crm_accounts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CrmAccountsHistory` — `src/modules/audit/entities/crm_accounts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `crm_accounts_id` | `uuid` | Clave foránea → crm.crm_accounts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/crm_accounts_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | crm_accounts_id | crm.crm_accounts (id) | fk_crm_accounts_history_crm_accounts_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_crm_accounts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_crm_accounts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_crm_accounts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_crm_accounts_history_crm_accounts_id` | no | crm_accounts_id | Soporta la clave foránea fk_crm_accounts_history_crm_accounts_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_crm_accounts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_crm_accounts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_crm_accounts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_crm_accounts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_crm_accounts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_crm_accounts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_crm_accounts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### custom_audiences_history

#### Vista general

Preserva versiones o estados históricos de custom audiences para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: custom_audiences_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CustomAudiencesHistory` — `src/modules/audit/entities/custom_audiences_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `custom_audience_id` | `uuid` | Clave foránea → ads.custom_audiences.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | custom_audience_id | ads.custom_audiences (id) | fk_custom_audiences_history_custom_audience_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_custom_audiences_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_custom_audiences_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_custom_audiences_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_custom_audiences_history_custom_audience_id` | no | custom_audience_id | Soporta la clave foránea fk_custom_audiences_history_custom_audience_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_audiences_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_custom_audiences_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_audiences_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_custom_audiences_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_audiences_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_custom_audiences_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_custom_audiences_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### custom_conversions_history

#### Vista general

Preserva versiones o estados históricos de custom conversions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: custom_conversions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `CustomConversionsHistory` — `src/modules/audit/entities/custom_conversions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `custom_conversions_id` | `uuid` | Clave foránea → ads.custom_conversions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/custom_conversions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | custom_conversions_id | ads.custom_conversions (id) | fk_custom_conversions_history_custom_conversions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_custom_conversions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_custom_conversions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_custom_conversions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_custom_conversions_history_custom_conversions_id` | no | custom_conversions_id | Soporta la clave foránea fk_custom_conversions_history_custom_conversions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_conversions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_custom_conversions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_conversions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_custom_conversions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_custom_conversions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_custom_conversions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_custom_conversions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### data_access_log

#### Vista general

Registra accesos a datos para respaldar trazabilidad de consultas y revisiones de privacidad.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: data_access_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DataAccessLog` — `src/modules/audit/entities/data_access_log.entity.ts`
- **Resumen:** 11 columnas · 9 índices · 6 FK salientes · 0 entrantes · 16 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/data_access_log.entity.ts:12`)_ | coincide |
| 2 | `user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 4 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Opcional | _sin dato_ | coincide |
| 5 | `purpose` | `varchar` | Opcional | _sin dato_ | coincide |
| 6 | `legal_basis_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `resource_type` | `varchar` | Opcional | _sin dato_ | coincide |
| 8 | `resource_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 9 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | user_id | iam.users (id) | fk_data_access_log_user_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_data_access_log_patient_profile_id |
| hacia | tenant_id | directory.tenants (id) | fk_data_access_log_tenant_id |
| hacia | legal_basis_concept_id | terminology.catalog_concepts (id) | fk_data_access_log_legal_basis_concept_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_data_access_log_action_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_data_access_log_recorded_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_data_access_log_user_id` | no | user_id | Soporta la clave foránea fk_data_access_log_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «user_id», la primera columna del índice _(CONSULTA)_ |
| `ix_data_access_log_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_data_access_log_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_data_access_log_tenant_id` | no | tenant_id | Soporta la clave foránea fk_data_access_log_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_data_access_log_legal_basis_concept_id` | no | legal_basis_concept_id | Soporta la clave foránea fk_data_access_log_legal_basis_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_data_access_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_data_access_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_data_access_log_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_data_access_log_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_data_access_log_tenant_id_recorded_at` | no | tenant_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_data_access_log_patient_profile_id_recorded_at` | no | tenant_id, patient_profile_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_data_access_log_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «recorded_at», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/anomaly/scan | LEE | DIRECTA |
| GET /audit/data-access | LEE | POR_SQL |
| POST /audit/data-access | CREA | DIRECTA |
| GET /audit/data-access/summary | LEE | POR_SQL |
| GET /audit/history/{entity}/{id} | CREA | DIRECTA |
| GET /audit/me/data-access | LEE | POR_SQL |
| POST /audit/retention/apply | BORRA | DIRECTA |
| POST /authz/patients/{patientProfileId}/break-the-glass | CREA | DIRECTA |
| GET /charts/me/documents | CREA | DIRECTA |
| GET /charts/me/documents/{documentId}/files/{fileId}/content | CREA | DIRECTA |
| GET /charts/me/notes | CREA | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | CREA | DIRECTA |
| POST /insurance/patients/conversation | CREA | DIRECTA |
| POST /insurance/patients/search | CREA | DIRECTA |
| POST /insurance/portability/export | CREA | DIRECTA |
| GET /pharmacy/prescription-shares/{token} | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### delegated_access_audit_log

#### Vista general

Conserva evidencia de acciones realizadas mediante acceso delegado para identificar actor, alcance y contexto.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: delegated_access_audit_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DelegatedAccessAuditLog` — `src/modules/audit/entities/delegated_access_audit_log.entity.ts`
- **Resumen:** 10 columnas · 9 índices · 7 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/delegated_access_audit_log.entity.ts:12`)_ | coincide |
| 2 | `delegate_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `delegating_practitioner_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `delegated_assignment_id` | `uuid` | Clave foránea → delegated_access.practitioner_delegate_assignments.id; Opcional | _sin dato_ | coincide |
| 5 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 6 | `resource_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `resource_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 8 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | delegate_user_id | iam.users (id) | fk_delegated_access_audit_log_delegate_user_id |
| hacia | delegating_practitioner_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_delegated_access_audit_log_delegating_practitioner__652b7b85 |
| hacia | delegated_assignment_id | delegated_access.practitioner_delegate_assignments (id) | fk_delegated_access_audit_log_delegated_assignment_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_delegated_access_audit_log_patient_profile_id |
| hacia | resource_type_concept_id | terminology.catalog_concepts (id) | fk_delegated_access_audit_log_resource_type_concept_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_delegated_access_audit_log_action_concept_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_delegated_access_audit_log_outcome_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_delegated_access_audit_log_delegate_user_id` | no | delegate_user_id | Soporta la clave foránea fk_delegated_access_audit_log_delegate_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_delegating_practitioner__a08f34c4` | no | delegating_practitioner_profile_id | Soporta la clave foránea fk_delegated_access_audit_log_delegating_practitioner__652b7b85: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_delegated_assignment_id` | no | delegated_assignment_id | Soporta la clave foránea fk_delegated_access_audit_log_delegated_assignment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_delegated_access_audit_log_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_resource_type_concept_id` | no | resource_type_concept_id | Soporta la clave foránea fk_delegated_access_audit_log_resource_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_delegated_access_audit_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_delegated_access_audit_log_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_delegated_access_audit_log_patient_profile_id_occurred_at` | no | patient_profile_id, ("occurred_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_delegated_access_audit_log_occurred_at` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/third-party-access | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### departments_history

#### Vista general

Preserva versiones o estados históricos de departments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: departments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DepartmentsHistory` — `src/modules/audit/entities/departments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `department_id` | `uuid` | Clave foránea → erp.departments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | department_id | erp.departments (id) | fk_departments_history_department_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_departments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_departments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_departments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_departments_history_department_id` | no | department_id | Soporta la clave foránea fk_departments_history_department_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_departments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_departments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_departments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_departments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_departments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_departments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_departments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### diagnostic_reports_history

#### Vista general

Preserva versiones o estados históricos de diagnostic reports para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: diagnostic_reports_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DiagnosticReportsHistory` — `src/modules/audit/entities/diagnostic_reports_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `diagnostic_report_id` | `uuid` | Clave foránea → clinical.diagnostic_reports.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | diagnostic_report_id | clinical.diagnostic_reports (id) | fk_diagnostic_reports_history_diagnostic_report_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_diagnostic_reports_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_diagnostic_reports_history_diagnostic_report_id` | no | diagnostic_report_id | Soporta la clave foránea fk_diagnostic_reports_history_diagnostic_report_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_diagnostic_reports_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_diagnostic_reports_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_diagnostic_reports_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_diagnostic_reports_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### diagnostic_study_prices_history

#### Vista general

Preserva versiones o estados históricos de diagnostic study prices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: diagnostic_study_prices_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DiagnosticStudyPricesHistory` — `src/modules/audit/entities/diagnostic_study_prices_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `diagnostic_study_price_id` | `uuid` | Clave foránea → diagnostic_units.diagnostic_study_prices.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | diagnostic_study_price_id | diagnostic_units.diagnostic_study_prices (id) | fk_diagnostic_study_prices_history_diagnostic_study_price_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_study_prices_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_diagnostic_study_prices_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_study_prices_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_diagnostic_study_prices_history_diagnostic_study_price_id` | no | diagnostic_study_price_id | Soporta la clave foránea fk_diagnostic_study_prices_history_diagnostic_study_price_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_study_prices_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_diagnostic_study_prices_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_study_prices_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_diagnostic_study_prices_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_study_prices_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_diagnostic_study_prices_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_diagnostic_study_prices_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_diagnostic_study_prices_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### document_records_history

#### Vista general

Preserva versiones o estados históricos de document records para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: document_records_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DocumentRecordsHistory` — `src/modules/audit/entities/document_records_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `document_record_id` | `uuid` | Clave foránea → chart.document_records.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | document_record_id | chart.document_records (id) | fk_document_records_history_document_record_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_document_records_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_document_records_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_document_records_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_document_records_history_document_record_id` | no | document_record_id | Soporta la clave foránea fk_document_records_history_document_record_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_document_records_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_document_records_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_document_records_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_document_records_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_document_records_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_document_records_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_document_records_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### dsar_requests

#### Vista general

Gestiona solicitudes de derechos de titulares sobre sus datos, incluida su atención y resolución en el sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: dsar_requests`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `DsarRequests` — `src/modules/audit/entities/dsar_requests.entity.ts`
- **Resumen:** 13 columnas · 7 índices · 7 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/dsar_requests.entity.ts:12`)_ | coincide |
| 2 | `user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `jurisdiction_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `completed_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 8 | `result_file_id` | `uuid` | Clave foránea → common.files.id; Opcional | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/audit/entities/dsar_requests.entity.ts:68`)_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/audit/entities/dsar_requests.entity.ts:74`)_ | coincide |
| 11 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/dsar_requests.entity.ts:92`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | user_id | iam.users (id) | fk_dsar_requests_user_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_dsar_requests_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_dsar_requests_status_concept_id |
| hacia | jurisdiction_concept_id | terminology.catalog_concepts (id) | fk_dsar_requests_jurisdiction_concept_id |
| hacia | result_file_id | common.files (id) | fk_dsar_requests_result_file_id |
| hacia | created_by_user_id | iam.users (id) | fk_dsar_requests_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_dsar_requests_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_dsar_requests_user_id` | no | user_id | Soporta la clave foránea fk_dsar_requests_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_dsar_requests_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_dsar_requests_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_jurisdiction_concept_id` | no | jurisdiction_concept_id | Soporta la clave foránea fk_dsar_requests_jurisdiction_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_result_file_id` | no | result_file_id | Soporta la clave foránea fk_dsar_requests_result_file_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_dsar_requests_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_dsar_requests_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_dsar_requests_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /privacy/dsar | LEE | POR_SQL |
| POST /privacy/dsar | CREA | DIRECTA |
| GET /privacy/dsar/{id} | LEE | POR_SQL |
| PATCH /privacy/dsar/{id} | ACTUALIZA | POR_TIPO |
| PATCH /privacy/dsar/{id} | LEE | DIRECTA |
| POST /insurance/portability/export | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### employment_records_history

#### Vista general

Preserva versiones o estados históricos de employment records para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: employment_records_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `EmploymentRecordsHistory` — `src/modules/audit/entities/employment_records_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `employment_record_id` | `uuid` | Clave foránea → erp.employment_records.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | employment_record_id | erp.employment_records (id) | fk_employment_records_history_employment_record_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_employment_records_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_employment_records_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_employment_records_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_employment_records_history_employment_record_id` | no | employment_record_id | Soporta la clave foránea fk_employment_records_history_employment_record_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_employment_records_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_employment_records_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_employment_records_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_employment_records_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_employment_records_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_employment_records_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_employment_records_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### encounter_locations_history

#### Vista general

Preserva versiones o estados históricos de las ubicaciones y camas asignadas a un encuentro para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: encounter_locations_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `EncounterLocationsHistory` — `src/modules/audit/entities/encounter_locations_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `encounter_location_id` | `uuid` | Clave foránea → clinical.encounter_locations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_location_id | clinical.encounter_locations (id) | fk_encounter_locations_history_encounter_location_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_encounter_locations_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_encounter_locations_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_encounter_locations_history_encounter_location_id` | no | encounter_location_id | Soporta la clave foránea fk_encounter_locations_history_encounter_location_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_encounter_locations_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_encounter_locations_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_encounter_locations_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_encounter_locations_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_encounter_locations_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### enrollments_history

#### Vista general

Preserva versiones o estados históricos de enrollments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: enrollments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `EnrollmentsHistory` — `src/modules/audit/entities/enrollments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `enrollments_id` | `uuid` | Clave foránea → education.enrollments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/enrollments_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | enrollments_id | education.enrollments (id) | fk_enrollments_history_enrollments_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_enrollments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_enrollments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_enrollments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_enrollments_history_enrollments_id` | no | enrollments_id | Soporta la clave foránea fk_enrollments_history_enrollments_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_enrollments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_enrollments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_enrollments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_enrollments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_enrollments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_enrollments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_enrollments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### event_subscriptions_history

#### Vista general

Preserva versiones o estados históricos de event subscriptions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: event_subscriptions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `EventSubscriptionsHistory` — `src/modules/audit/entities/event_subscriptions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `event_subscription_id` | `uuid` | Clave foránea → messaging.event_subscriptions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | event_subscription_id | messaging.event_subscriptions (id) | fk_event_subscriptions_history_event_subscription_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_event_subscriptions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_event_subscriptions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_event_subscriptions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_event_subscriptions_history_event_subscription_id` | no | event_subscription_id | Soporta la clave foránea fk_event_subscriptions_history_event_subscription_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_event_subscriptions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_event_subscriptions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_event_subscriptions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_event_subscriptions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_event_subscriptions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_event_subscriptions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_event_subscriptions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### federated_identities_history

#### Vista general

Preserva versiones o estados históricos de federated identities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: federated_identities_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `FederatedIdentitiesHistory` — `src/modules/audit/entities/federated_identities_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `federated_identity_id` | `uuid` | Clave foránea → auth_providers.federated_identities.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | federated_identity_id | auth_providers.federated_identities (id) | fk_federated_identities_history_federated_identity_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_federated_identities_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_federated_identities_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_federated_identities_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_federated_identities_history_federated_identity_id` | no | federated_identity_id | Soporta la clave foránea fk_federated_identities_history_federated_identity_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_federated_identities_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_federated_identities_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_federated_identities_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_federated_identities_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_federated_identities_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_federated_identities_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_federated_identities_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### groups_history

#### Vista general

Preserva versiones o estados históricos de groups para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: groups_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `GroupsHistory` — `src/modules/audit/entities/groups_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `groups_id` | `uuid` | Clave foránea → community.groups.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/groups_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | groups_id | community.groups (id) | fk_groups_history_groups_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_groups_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_groups_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_groups_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_groups_history_groups_id` | no | groups_id | Soporta la clave foránea fk_groups_history_groups_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_groups_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_groups_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_groups_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_groups_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_groups_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_groups_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_groups_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### guardrail_policies_history

#### Vista general

Preserva versiones o estados históricos de guardrail policies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: guardrail_policies_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `GuardrailPoliciesHistory` — `src/modules/audit/entities/guardrail_policies_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `guardrail_policies_id` | `uuid` | Clave foránea → automation.guardrail_policies.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/guardrail_policies_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | guardrail_policies_id | automation.guardrail_policies (id) | fk_guardrail_policies_history_guardrail_policies_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_guardrail_policies_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_guardrail_policies_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_guardrail_policies_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_guardrail_policies_history_guardrail_policies_id` | no | guardrail_policies_id | Soporta la clave foránea fk_guardrail_policies_history_guardrail_policies_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_guardrail_policies_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_guardrail_policies_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_guardrail_policies_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_guardrail_policies_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_guardrail_policies_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_guardrail_policies_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_guardrail_policies_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### health_practitioner_profiles_history

#### Vista general

Preserva versiones o estados históricos de health practitioner profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: health_practitioner_profiles_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `HealthPractitionerProfilesHistory` — `src/modules/audit/entities/health_practitioner_profiles_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `health_practitioner_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | health_practitioner_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_health_practitioner_profiles_history_health_practit_b2903f37 |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_health_practitioner_profiles_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_health_practitioner_profiles_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_health_practitioner_profiles_history_change_reason__8785974d |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_health_practitioner_profiles_history_health_practit_622f20f2` | no | health_practitioner_profile_id | Soporta la clave foránea fk_health_practitioner_profiles_history_health_practit_b2903f37: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_health_practitioner_profiles_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_health_practitioner_profiles_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_health_practitioner_profiles_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_health_practitioner_profiles_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_health_practitioner_profiles_history_change_reason__55227d17` | no | change_reason_concept_id | Soporta la clave foránea fk_health_practitioner_profiles_history_change_reason__8785974d: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_health_practitioner_profiles_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### identity_providers_history

#### Vista general

Preserva versiones o estados históricos de identity providers para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: identity_providers_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `IdentityProvidersHistory` — `src/modules/audit/entities/identity_providers_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `identity_provider_id` | `uuid` | Clave foránea → auth_providers.identity_providers.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | identity_provider_id | auth_providers.identity_providers (id) | fk_identity_providers_history_identity_provider_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_identity_providers_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_identity_providers_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_identity_providers_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_identity_providers_history_identity_provider_id` | no | identity_provider_id | Soporta la clave foránea fk_identity_providers_history_identity_provider_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_providers_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_identity_providers_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_providers_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_identity_providers_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_providers_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_identity_providers_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_identity_providers_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### identity_verification_access_log

#### Vista general

Registra accesos a evidencia y resultados de verificación de identidad para proteger ese proceso sensible.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: identity_verification_access_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `IdentityVerificationAccessLog` — `src/modules/audit/entities/identity_verification_access_log.entity.ts`
- **Resumen:** 9 columnas · 8 índices · 7 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/identity_verification_access_log.entity.ts:12`)_ | coincide |
| 2 | `verification_case_id` | `uuid` | Clave foránea → identity_assurance.identity_verification_cases.id; Obligatoria | _sin dato_ | coincide |
| 3 | `actor_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 4 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `evidence_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `data_disclosed_value_set_id` | `uuid` | Clave foránea → terminology.value_sets.id; Opcional | _sin dato_ | coincide |
| 7 | `purpose_of_use_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | verification_case_id | identity_assurance.identity_verification_cases (id) | fk_identity_verification_access_log_verification_case_id |
| hacia | actor_user_id | iam.users (id) | fk_identity_verification_access_log_actor_user_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_identity_verification_access_log_action_concept_id |
| hacia | evidence_type_concept_id | terminology.catalog_concepts (id) | fk_identity_verification_access_log_evidence_type_concept_id |
| hacia | data_disclosed_value_set_id | terminology.value_sets (id) | fk_identity_verification_access_log_data_disclosed_value_set_id |
| hacia | purpose_of_use_concept_id | terminology.catalog_concepts (id) | fk_identity_verification_access_log_purpose_of_use_concept_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_identity_verification_access_log_outcome_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_identity_verification_access_log_verification_case_id` | no | verification_case_id | Soporta la clave foránea fk_identity_verification_access_log_verification_case_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_actor_user_id` | no | actor_user_id | Soporta la clave foránea fk_identity_verification_access_log_actor_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_identity_verification_access_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_evidence_type_concept_id` | no | evidence_type_concept_id | Soporta la clave foránea fk_identity_verification_access_log_evidence_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_data_disclosed_value_set_id` | no | data_disclosed_value_set_id | Soporta la clave foránea fk_identity_verification_access_log_data_disclosed_value_set_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_purpose_of_use_concept_id` | no | purpose_of_use_concept_id | Soporta la clave foránea fk_identity_verification_access_log_purpose_of_use_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_identity_verification_access_log_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_identity_verification_access_log_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_identity_verification_access_log_occurred_at` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/third-party-access | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### imaging_studies_history

#### Vista general

Preserva versiones o estados históricos de imaging studies para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: imaging_studies_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ImagingStudiesHistory` — `src/modules/audit/entities/imaging_studies_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `imaging_study_id` | `uuid` | Clave foránea → diagnostics.imaging_studies.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | imaging_study_id | diagnostics.imaging_studies (id) | fk_imaging_studies_history_imaging_study_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_imaging_studies_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_imaging_studies_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_imaging_studies_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_imaging_studies_history_imaging_study_id` | no | imaging_study_id | Soporta la clave foránea fk_imaging_studies_history_imaging_study_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_imaging_studies_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_imaging_studies_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_imaging_studies_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_imaging_studies_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_imaging_studies_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_imaging_studies_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_imaging_studies_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### inbound_messages_history

#### Vista general

Preserva versiones o estados históricos de inbound messages para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: inbound_messages_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `InboundMessagesHistory` — `src/modules/audit/entities/inbound_messages_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `inbound_message_id` | `uuid` | Clave foránea → integrations.inbound_messages.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | inbound_message_id | integrations.inbound_messages (id) | fk_inbound_messages_history_inbound_message_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_inbound_messages_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_inbound_messages_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_inbound_messages_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_inbound_messages_history_inbound_message_id` | no | inbound_message_id | Soporta la clave foránea fk_inbound_messages_history_inbound_message_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inbound_messages_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_inbound_messages_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inbound_messages_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_inbound_messages_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inbound_messages_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_inbound_messages_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_inbound_messages_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### informational_materials_history

#### Vista general

Conserva revisiones de materiales informativos de productos farmacéuticos, con número de revisión y operación auditada, para reconstruir cambios en contenido entregado a profesionales de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3222: entity informational_materials_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `InformationalMaterialsHistory` — `src/modules/audit/entities/informational_materials_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `informational_material_id` | `uuid` | Clave foránea → pharma_lab.informational_materials.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/informational_materials_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | informational_material_id | pharma_lab.informational_materials (id) | fk_informational_materials_history_informational_material_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_informational_materials_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_informational_materials_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_informational_materials_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_informational_materials_history_informational_material_id` | no | informational_material_id | Soporta la clave foránea fk_informational_materials_history_informational_material_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_informational_materials_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_informational_materials_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_informational_materials_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_informational_materials_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_informational_materials_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_informational_materials_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_informational_materials_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### insurance_claims_history

#### Vista general

Preserva versiones o estados históricos de insurance claims para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: insurance_claims_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `InsuranceClaimsHistory` — `src/modules/audit/entities/insurance_claims_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `insurance_claim_id` | `uuid` | Clave foránea → insurance.insurance_claims.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | insurance_claim_id | insurance.insurance_claims (id) | fk_insurance_claims_history_insurance_claim_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_insurance_claims_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_insurance_claims_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_insurance_claims_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_insurance_claims_history_insurance_claim_id` | no | insurance_claim_id | Soporta la clave foránea fk_insurance_claims_history_insurance_claim_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_claims_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_insurance_claims_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_claims_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_insurance_claims_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_claims_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_insurance_claims_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_insurance_claims_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### insurance_decision_access_log

#### Vista general

Traza accesos a decisiones de cobertura y adjudicación para apoyar revisión y rendición de cuentas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: insurance_decision_access_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `InsuranceDecisionAccessLog` — `src/modules/audit/entities/insurance_decision_access_log.entity.ts`
- **Resumen:** 10 columnas · 10 índices · 8 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/insurance_decision_access_log.entity.ts:12`)_ | coincide |
| 2 | `insurance_carrier_id` | `uuid` | Clave foránea → insurance.insurance_carriers.id; Obligatoria | _sin dato_ | coincide |
| 3 | `actor_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 4 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 5 | `claim_id` | `uuid` | Clave foránea → insurance.insurance_claims.id; Opcional | _sin dato_ | coincide |
| 6 | `authorization_request_id` | `uuid` | Clave foránea → insurance.prior_authorization_requests.id; Opcional | _sin dato_ | coincide |
| 7 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `purpose_of_use_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | insurance_carrier_id | insurance.insurance_carriers (id) | fk_insurance_decision_access_log_insurance_carrier_id |
| hacia | actor_user_id | iam.users (id) | fk_insurance_decision_access_log_actor_user_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_insurance_decision_access_log_patient_profile_id |
| hacia | claim_id | insurance.insurance_claims (id) | fk_insurance_decision_access_log_claim_id |
| hacia | authorization_request_id | insurance.prior_authorization_requests (id) | fk_insurance_decision_access_log_authorization_request_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_insurance_decision_access_log_action_concept_id |
| hacia | purpose_of_use_concept_id | terminology.catalog_concepts (id) | fk_insurance_decision_access_log_purpose_of_use_concept_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_insurance_decision_access_log_outcome_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_insurance_decision_access_log_insurance_carrier_id` | no | insurance_carrier_id | Soporta la clave foránea fk_insurance_decision_access_log_insurance_carrier_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_actor_user_id` | no | actor_user_id | Soporta la clave foránea fk_insurance_decision_access_log_actor_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_insurance_decision_access_log_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_claim_id` | no | claim_id | Soporta la clave foránea fk_insurance_decision_access_log_claim_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_authorization_request_id` | no | authorization_request_id | Soporta la clave foránea fk_insurance_decision_access_log_authorization_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_insurance_decision_access_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_purpose_of_use_concept_id` | no | purpose_of_use_concept_id | Soporta la clave foránea fk_insurance_decision_access_log_purpose_of_use_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_insurance_decision_access_log_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_decision_access_log_patient_profile_id_occurred_at` | no | patient_profile_id, ("occurred_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_insurance_decision_access_log_occurred_at` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/third-party-access | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### insurance_products_history

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `insurance_product_id` | `uuid` | Clave foránea → insurance.insurance_products.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | insurance_product_id | insurance.insurance_products (id) | fk_insurance_products_history_insurance_product_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_insurance_products_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_insurance_products_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_insurance_products_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_insurance_products_history_insurance_product_id` | no | insurance_product_id | Soporta la clave foránea fk_insurance_products_history_insurance_product_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_products_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_insurance_products_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_products_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_insurance_products_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_insurance_products_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_insurance_products_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_insurance_products_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### integration_endpoints_history

#### Vista general

Preserva versiones o estados históricos de integration endpoints para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: integration_endpoints_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `IntegrationEndpointsHistory` — `src/modules/audit/entities/integration_endpoints_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `integration_endpoint_id` | `uuid` | Clave foránea → integrations.integration_endpoints.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | integration_endpoint_id | integrations.integration_endpoints (id) | fk_integration_endpoints_history_integration_endpoint_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_integration_endpoints_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_integration_endpoints_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_integration_endpoints_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_integration_endpoints_history_integration_endpoint_id` | no | integration_endpoint_id | Soporta la clave foránea fk_integration_endpoints_history_integration_endpoint_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_integration_endpoints_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_integration_endpoints_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_integration_endpoints_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_integration_endpoints_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_integration_endpoints_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_integration_endpoints_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_integration_endpoints_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### invoices_history

#### Vista general

Preserva versiones o estados históricos de invoices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: invoices_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `InvoicesHistory` — `src/modules/audit/entities/invoices_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `invoice_id` | `uuid` | Clave foránea → billing.invoices.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | invoice_id | billing.invoices (id) | fk_invoices_history_invoice_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_invoices_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_invoices_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_invoices_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_invoices_history_invoice_id` | no | invoice_id | Soporta la clave foránea fk_invoices_history_invoice_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_invoices_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_invoices_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_invoices_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_invoices_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_invoices_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_invoices_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_invoices_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### journal_transactions_history

#### Vista general

Preserva versiones o estados históricos de journal transactions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: journal_transactions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `JournalTransactionsHistory` — `src/modules/audit/entities/journal_transactions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `journal_transaction_id` | `uuid` | Clave foránea → accounting.journal_transactions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | journal_transaction_id | accounting.journal_transactions (id) | fk_journal_transactions_history_journal_transaction_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_journal_transactions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_journal_transactions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_journal_transactions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_journal_transactions_history_journal_transaction_id` | no | journal_transaction_id | Soporta la clave foránea fk_journal_transactions_history_journal_transaction_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journal_transactions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_journal_transactions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journal_transactions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_journal_transactions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journal_transactions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_journal_transactions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_journal_transactions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### journeys_history

#### Vista general

Preserva versiones o estados históricos de journeys para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: journeys_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `JourneysHistory` — `src/modules/audit/entities/journeys_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `journeys_id` | `uuid` | Clave foránea → marketing.journeys.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/journeys_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | journeys_id | marketing.journeys (id) | fk_journeys_history_journeys_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_journeys_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_journeys_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_journeys_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_journeys_history_journeys_id` | no | journeys_id | Soporta la clave foránea fk_journeys_history_journeys_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journeys_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_journeys_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journeys_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_journeys_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_journeys_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_journeys_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_journeys_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### jurisdiction_authorizations_history

#### Vista general

Preserva versiones o estados históricos de jurisdiction authorizations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: jurisdiction_authorizations_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `JurisdictionAuthorizationsHistory` — `src/modules/audit/entities/jurisdiction_authorizations_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `jurisdiction_authorization_id` | `uuid` | Clave foránea → profiles.jurisdiction_authorizations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | jurisdiction_authorization_id | profiles.jurisdiction_authorizations (id) | fk_jurisdiction_authorizations_history_jurisdiction_au_5b12cb5b |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_jurisdiction_authorizations_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_jurisdiction_authorizations_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_jurisdiction_authorizations_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_jurisdiction_authorizations_history_jurisdiction_au_831b1b79` | no | jurisdiction_authorization_id | Soporta la clave foránea fk_jurisdiction_authorizations_history_jurisdiction_au_5b12cb5b: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «jurisdiction_authorization_id», la primera columna del índice _(CONSULTA)_ |
| `ix_jurisdiction_authorizations_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_jurisdiction_authorizations_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_jurisdiction_authorizations_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_jurisdiction_authorizations_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_jurisdiction_authorizations_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_jurisdiction_authorizations_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_jurisdiction_authorizations_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_jurisdiction_authorizations_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| DELETE /profiles/practitioners/me/jurisdiction-authorizations/{licenseId} | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### liabilities_history

#### Vista general

Preserva versiones o estados históricos de liabilities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: liabilities_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `LiabilitiesHistory` — `src/modules/audit/entities/liabilities_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `liability_id` | `uuid` | Clave foránea → accounting.liabilities.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | liability_id | accounting.liabilities (id) | fk_liabilities_history_liability_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_liabilities_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_liabilities_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_liabilities_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_liabilities_history_liability_id` | no | liability_id | Soporta la clave foránea fk_liabilities_history_liability_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_liabilities_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_liabilities_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_liabilities_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_liabilities_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_liabilities_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_liabilities_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_liabilities_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### loyalty_memberships_history

#### Vista general

Preserva versiones o estados históricos de loyalty memberships para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: loyalty_memberships_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `LoyaltyMembershipsHistory` — `src/modules/audit/entities/loyalty_memberships_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `loyalty_memberships_id` | `uuid` | Clave foránea → promotions.loyalty_memberships.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/loyalty_memberships_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | loyalty_memberships_id | promotions.loyalty_memberships (id) | fk_loyalty_memberships_history_loyalty_memberships_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_loyalty_memberships_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_loyalty_memberships_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_loyalty_memberships_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_loyalty_memberships_history_loyalty_memberships_id` | no | loyalty_memberships_id | Soporta la clave foránea fk_loyalty_memberships_history_loyalty_memberships_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_memberships_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_loyalty_memberships_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_memberships_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_loyalty_memberships_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_memberships_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_loyalty_memberships_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_loyalty_memberships_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_loyalty_memberships_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### loyalty_programs_history

#### Vista general

Preserva versiones o estados históricos de loyalty programs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: loyalty_programs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `LoyaltyProgramsHistory` — `src/modules/audit/entities/loyalty_programs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `loyalty_programs_id` | `uuid` | Clave foránea → promotions.loyalty_programs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/loyalty_programs_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | loyalty_programs_id | promotions.loyalty_programs (id) | fk_loyalty_programs_history_loyalty_programs_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_loyalty_programs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_loyalty_programs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_loyalty_programs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_loyalty_programs_history_loyalty_programs_id` | no | loyalty_programs_id | Soporta la clave foránea fk_loyalty_programs_history_loyalty_programs_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_programs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_loyalty_programs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_programs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_loyalty_programs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_loyalty_programs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_loyalty_programs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_loyalty_programs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### marketing_campaigns_history

#### Vista general

Preserva versiones o estados históricos de marketing campaigns para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: marketing_campaigns_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `MarketingCampaignsHistory` — `src/modules/audit/entities/marketing_campaigns_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `marketing_campaigns_id` | `uuid` | Clave foránea → marketing.marketing_campaigns.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/marketing_campaigns_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | marketing_campaigns_id | marketing.marketing_campaigns (id) | fk_marketing_campaigns_history_marketing_campaigns_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_marketing_campaigns_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_marketing_campaigns_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_marketing_campaigns_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_marketing_campaigns_history_marketing_campaigns_id` | no | marketing_campaigns_id | Soporta la clave foránea fk_marketing_campaigns_history_marketing_campaigns_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_marketing_campaigns_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_marketing_campaigns_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_marketing_campaigns_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_marketing_campaigns_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_marketing_campaigns_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_marketing_campaigns_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_marketing_campaigns_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### medical_visitors_history

#### Vista general

Conserva revisiones de los representantes médicos y sus operaciones auditadas, dando trazabilidad a quién gestiona visitas y materiales ante profesionales de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3235: entity medical_visitors_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `MedicalVisitorsHistory` — `src/modules/audit/entities/medical_visitors_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `medical_visitor_id` | `uuid` | Clave foránea → pharma_lab.medical_visitors.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/medical_visitors_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | medical_visitor_id | pharma_lab.medical_visitors (id) | fk_medical_visitors_history_medical_visitor_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_medical_visitors_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_medical_visitors_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_medical_visitors_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_medical_visitors_history_medical_visitor_id` | no | medical_visitor_id | Soporta la clave foránea fk_medical_visitors_history_medical_visitor_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medical_visitors_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_medical_visitors_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medical_visitors_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_medical_visitors_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medical_visitors_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_medical_visitors_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_medical_visitors_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### medication_requests_history

#### Vista general

Preserva versiones o estados históricos de medication requests para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: medication_requests_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `MedicationRequestsHistory` — `src/modules/audit/entities/medication_requests_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 21 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `medication_request_id` | `uuid` | Clave foránea → clinical.medication_requests.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | medication_request_id | clinical.medication_requests (id) | fk_medication_requests_history_medication_request_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_medication_requests_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_medication_requests_history_medication_request_id` | no | medication_request_id | Soporta la clave foránea fk_medication_requests_history_medication_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_medication_requests_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_medication_requests_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_medication_requests_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_medication_requests_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/medication-requests | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests | CREA | POR_REGISTRO |
| POST /clinical/medication-requests | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/edit | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/edit | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/edit | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/invalidate | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/invalidate | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/invalidate | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/issue | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/issue | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/issue | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/renew | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/renew | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/renew | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/replace | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/replace | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/replace | LEE | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/sign | ACTUALIZA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/sign | CREA | POR_REGISTRO |
| POST /clinical/medication-requests/{id}/sign | LEE | POR_REGISTRO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### message_retries_history

#### Vista general

Preserva versiones o estados históricos de message retries para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: message_retries_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `MessageRetriesHistory` — `src/modules/audit/entities/message_retries_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `message_retry_id` | `uuid` | Clave foránea → integrations.message_retries.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | message_retry_id | integrations.message_retries (id) | fk_message_retries_history_message_retry_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_message_retries_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_message_retries_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_message_retries_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_message_retries_history_message_retry_id` | no | message_retry_id | Soporta la clave foránea fk_message_retries_history_message_retry_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_retries_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_message_retries_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_retries_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_message_retries_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_retries_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_message_retries_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_message_retries_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### message_templates_history

#### Vista general

Preserva versiones o estados históricos de message templates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: message_templates_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `MessageTemplatesHistory` — `src/modules/audit/entities/message_templates_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `message_template_id` | `uuid` | Clave foránea → messaging.message_templates.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | message_template_id | messaging.message_templates (id) | fk_message_templates_history_message_template_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_message_templates_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_message_templates_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_message_templates_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_message_templates_history_message_template_id` | no | message_template_id | Soporta la clave foránea fk_message_templates_history_message_template_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_templates_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_message_templates_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_templates_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_message_templates_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_message_templates_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_message_templates_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_message_templates_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### moderation_decisions_history

#### Vista general

Preserva versiones o estados históricos de moderation decisions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: moderation_decisions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ModerationDecisionsHistory` — `src/modules/audit/entities/moderation_decisions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `moderation_decisions_id` | `uuid` | Clave foránea → community.moderation_decisions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/moderation_decisions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | moderation_decisions_id | community.moderation_decisions (id) | fk_moderation_decisions_history_moderation_decisions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_moderation_decisions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_moderation_decisions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_moderation_decisions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_moderation_decisions_history_moderation_decisions_id` | no | moderation_decisions_id | Soporta la clave foránea fk_moderation_decisions_history_moderation_decisions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_decisions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_moderation_decisions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_decisions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_moderation_decisions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_decisions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_moderation_decisions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_moderation_decisions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /moderation/decisions | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### moderation_events

#### Vista general

Mantiene eventos de moderación de contenido para reconstruir revisiones y acciones de seguridad comunitaria.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: moderation_events`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ModerationEvents` — `src/modules/audit/entities/moderation_events.entity.ts`
- **Resumen:** 9 columnas · 5 índices · 4 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/moderation_events.entity.ts:12`)_ | coincide |
| 2 | `target_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `target_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `policy_version` | `varchar` | Opcional | _sin dato_ | coincide |
| 7 | `evidence_json` | `jsonb` | Opcional | _sin dato_ | coincide |
| 8 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | target_type_concept_id | terminology.catalog_concepts (id) | fk_moderation_events_target_type_concept_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_moderation_events_action_concept_id |
| hacia | reason_concept_id | terminology.catalog_concepts (id) | fk_moderation_events_reason_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_moderation_events_recorded_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_moderation_events_target_type_concept_id` | no | target_type_concept_id | Soporta la clave foránea fk_moderation_events_target_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_events_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_moderation_events_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_events_reason_concept_id` | no | reason_concept_id | Soporta la clave foránea fk_moderation_events_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_moderation_events_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_moderation_events_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_moderation_events_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /moderation/decisions | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### operating_room_block_series_history

#### Vista general

Preserva versiones o estados históricos de las series de bloques quirúrgicos para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: operating_room_block_series_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OperatingRoomBlockSeriesHistory` — `src/modules/audit/entities/operating_room_block_series_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `operating_room_block_series_id` | `uuid` | Clave foránea → procedures_perioperative.operating_room_block_series.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | operating_room_block_series_id | procedures_perioperative.operating_room_block_series (id) | fk_operating_room_block_series_history_operating_room__9ea3a62d |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_operating_room_block_series_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_operating_room_block_series_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_operating_room_block_series_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_operating_room_block_series_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_operating_room_block_series_history_operating_room__bd611718` | no | operating_room_block_series_id | Soporta la clave foránea fk_operating_room_block_series_history_operating_room__9ea3a62d: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_block_series_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_operating_room_block_series_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_block_series_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_operating_room_block_series_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_block_series_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_operating_room_block_series_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_block_series_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_operating_room_block_series_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_operating_room_block_series_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### operating_room_blocks_history

#### Vista general

Preserva versiones o estados históricos de los bloques quirúrgicos asignados a servicios o cirujanos para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: operating_room_blocks_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OperatingRoomBlocksHistory` — `src/modules/audit/entities/operating_room_blocks_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `operating_room_block_id` | `uuid` | Clave foránea → procedures_perioperative.operating_room_blocks.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | operating_room_block_id | procedures_perioperative.operating_room_blocks (id) | fk_operating_room_blocks_history_operating_room_block_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_operating_room_blocks_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_operating_room_blocks_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_operating_room_blocks_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_operating_room_blocks_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_operating_room_blocks_history_operating_room_block_id` | no | operating_room_block_id | Soporta la clave foránea fk_operating_room_blocks_history_operating_room_block_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_blocks_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_operating_room_blocks_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_blocks_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_operating_room_blocks_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_blocks_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_operating_room_blocks_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_operating_room_blocks_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_operating_room_blocks_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_operating_room_blocks_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### opportunities_history

#### Vista general

Preserva versiones o estados históricos de opportunities para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: opportunities_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OpportunitiesHistory` — `src/modules/audit/entities/opportunities_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `opportunities_id` | `uuid` | Clave foránea → crm.opportunities.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/opportunities_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | opportunities_id | crm.opportunities (id) | fk_opportunities_history_opportunities_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_opportunities_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_opportunities_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_opportunities_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_opportunities_history_opportunities_id` | no | opportunities_id | Soporta la clave foránea fk_opportunities_history_opportunities_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_opportunities_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_opportunities_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_opportunities_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_opportunities_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_opportunities_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_opportunities_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_opportunities_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### order_sets_history

#### Vista general

Preserva versiones o estados históricos de order sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: order_sets_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OrderSetsHistory` — `src/modules/audit/entities/order_sets_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `order_set_id` | `uuid` | Clave foránea → clinical_ext.order_sets.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | order_set_id | clinical_ext.order_sets (id) | fk_order_sets_history_order_set_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_order_sets_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_order_sets_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_order_sets_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_order_sets_history_order_set_id` | no | order_set_id | Soporta la clave foránea fk_order_sets_history_order_set_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_order_sets_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_order_sets_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_order_sets_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_order_sets_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_order_sets_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_order_sets_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_order_sets_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### organization_affiliations_history

#### Vista general

Preserva versiones o estados históricos de organization affiliations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: organization_affiliations_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OrganizationAffiliationsHistory` — `src/modules/audit/entities/organization_affiliations_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `organization_affiliation_id` | `uuid` | Clave foránea → organization_extensions.organization_affiliations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | organization_affiliation_id | organization_extensions.organization_affiliations (id) | fk_organization_affiliations_history_organization_affi_000fda2f |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_organization_affiliations_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_organization_affiliations_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_organization_affiliations_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_organization_affiliations_history_organization_affi_157652c3` | no | organization_affiliation_id | Soporta la clave foránea fk_organization_affiliations_history_organization_affi_000fda2f: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_organization_affiliations_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_organization_affiliations_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_organization_affiliations_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_organization_affiliations_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_organization_affiliations_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_organization_affiliations_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_organization_affiliations_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### outbound_messages_history

#### Vista general

Preserva versiones o estados históricos de outbound messages para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: outbound_messages_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `OutboundMessagesHistory` — `src/modules/audit/entities/outbound_messages_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `outbound_message_id` | `uuid` | Clave foránea → integrations.outbound_messages.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | outbound_message_id | integrations.outbound_messages (id) | fk_outbound_messages_history_outbound_message_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_outbound_messages_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_outbound_messages_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_outbound_messages_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_outbound_messages_history_outbound_message_id` | no | outbound_message_id | Soporta la clave foránea fk_outbound_messages_history_outbound_message_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_outbound_messages_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_outbound_messages_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_outbound_messages_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_outbound_messages_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_outbound_messages_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_outbound_messages_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_outbound_messages_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### partnership_agreements_history

#### Vista general

Preserva versiones o estados históricos de partnership agreements para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: partnership_agreements_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PartnershipAgreementsHistory` — `src/modules/audit/entities/partnership_agreements_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `partnership_agreements_id` | `uuid` | Clave foránea → crm.partnership_agreements.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/partnership_agreements_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | partnership_agreements_id | crm.partnership_agreements (id) | fk_partnership_agreements_history_partnership_agreements_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_partnership_agreements_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_partnership_agreements_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_partnership_agreements_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_partnership_agreements_history_partnership_agreements_id` | no | partnership_agreements_id | Soporta la clave foránea fk_partnership_agreements_history_partnership_agreements_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnership_agreements_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_partnership_agreements_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnership_agreements_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_partnership_agreements_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnership_agreements_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_partnership_agreements_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_partnership_agreements_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_partnership_agreements_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### partnerships_history

#### Vista general

Preserva versiones o estados históricos de partnerships para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: partnerships_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PartnershipsHistory` — `src/modules/audit/entities/partnerships_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `partnerships_id` | `uuid` | Clave foránea → crm.partnerships.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/partnerships_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | partnerships_id | crm.partnerships (id) | fk_partnerships_history_partnerships_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_partnerships_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_partnerships_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_partnerships_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_partnerships_history_partnerships_id` | no | partnerships_id | Soporta la clave foránea fk_partnerships_history_partnerships_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnerships_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_partnerships_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnerships_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_partnerships_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_partnerships_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_partnerships_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_partnerships_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### patient_content_access_log

#### Vista general

Traza accesos al contenido clínico o personal del paciente para apoyar supervisión de privacidad.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: patient_content_access_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PatientContentAccessLog` — `src/modules/audit/entities/patient_content_access_log.entity.ts`
- **Resumen:** 12 columnas · 8 índices · 6 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/patient_content_access_log.entity.ts:12`)_ | coincide |
| 2 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `resource_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `resource_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `resource_version_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 6 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `purpose_of_use_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `decision_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `policy_version` | `varchar` | Opcional | _sin dato_ | coincide |
| 10 | `request_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 11 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 12 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_patient_content_access_log_patient_profile_id |
| hacia | resource_type_concept_id | terminology.catalog_concepts (id) | fk_patient_content_access_log_resource_type_concept_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_patient_content_access_log_action_concept_id |
| hacia | purpose_of_use_concept_id | terminology.catalog_concepts (id) | fk_patient_content_access_log_purpose_of_use_concept_id |
| hacia | decision_concept_id | terminology.catalog_concepts (id) | fk_patient_content_access_log_decision_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_patient_content_access_log_recorded_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_patient_content_access_log_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_patient_content_access_log_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_resource_type_concept_id` | no | resource_type_concept_id | Soporta la clave foránea fk_patient_content_access_log_resource_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_patient_content_access_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_purpose_of_use_concept_id` | no | purpose_of_use_concept_id | Soporta la clave foránea fk_patient_content_access_log_purpose_of_use_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_decision_concept_id` | no | decision_concept_id | Soporta la clave foránea fk_patient_content_access_log_decision_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_patient_content_access_log_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_content_access_log_patient_profile_id_recorded_at` | no | patient_profile_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_patient_content_access_log_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/data-access | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### patient_identity_links_history

#### Vista general

Preserva versiones o estados históricos de patient identity links para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: patient_identity_links_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PatientIdentityLinksHistory` — `src/modules/audit/entities/patient_identity_links_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `patient_identity_link_id` | `uuid` | Clave foránea → profiles.patient_identity_links.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | patient_identity_link_id | profiles.patient_identity_links (id) | fk_patient_identity_links_history_patient_identity_link_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_patient_identity_links_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_patient_identity_links_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_patient_identity_links_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_patient_identity_links_history_patient_identity_link_id` | no | patient_identity_link_id | Soporta la clave foránea fk_patient_identity_links_history_patient_identity_link_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_identity_links_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_patient_identity_links_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_identity_links_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_patient_identity_links_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_identity_links_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_patient_identity_links_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_patient_identity_links_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### patient_profiles_history

#### Vista general

Preserva versiones o estados históricos de patient profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: patient_profiles_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PatientProfilesHistory` — `src/modules/audit/entities/patient_profiles_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_patient_profiles_history_patient_profile_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_patient_profiles_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_patient_profiles_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_patient_profiles_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_patient_profiles_history_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_patient_profiles_history_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_profiles_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_patient_profiles_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_profiles_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_patient_profiles_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_profiles_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_patient_profiles_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_profiles_history_patient_profile_id_recorded_at` | no | patient_profile_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_patient_profiles_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### payment_intents_history

#### Vista general

Preserva versiones o estados históricos de payment intents para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: payment_intents_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PaymentIntentsHistory` — `src/modules/audit/entities/payment_intents_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `payment_intent_id` | `uuid` | Clave foránea → payments.payment_intents.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | payment_intent_id | payments.payment_intents (id) | fk_payment_intents_history_payment_intent_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_payment_intents_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_payment_intents_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_payment_intents_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_payment_intents_history_payment_intent_id` | no | payment_intent_id | Soporta la clave foránea fk_payment_intents_history_payment_intent_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_intents_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_payment_intents_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_intents_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_payment_intents_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_intents_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_payment_intents_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_payment_intents_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### payment_mandates_history

#### Vista general

Preserva versiones o estados históricos de payment mandates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: payment_mandates_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PaymentMandatesHistory` — `src/modules/audit/entities/payment_mandates_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `payment_mandates_id` | `uuid` | Clave foránea → payments.payment_mandates.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/payment_mandates_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | payment_mandates_id | payments.payment_mandates (id) | fk_payment_mandates_history_payment_mandates_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_payment_mandates_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_payment_mandates_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_payment_mandates_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_payment_mandates_history_payment_mandates_id` | no | payment_mandates_id | Soporta la clave foránea fk_payment_mandates_history_payment_mandates_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_mandates_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_payment_mandates_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_mandates_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_payment_mandates_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_mandates_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_payment_mandates_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_payment_mandates_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### payment_methods_history

#### Vista general

Preserva versiones o estados históricos de payment methods para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: payment_methods_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PaymentMethodsHistory` — `src/modules/audit/entities/payment_methods_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `payment_method_id` | `uuid` | Clave foránea → payments.payment_methods.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | payment_method_id | payments.payment_methods (id) | fk_payment_methods_history_payment_method_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_payment_methods_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_payment_methods_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_payment_methods_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_payment_methods_history_payment_method_id` | no | payment_method_id | Soporta la clave foránea fk_payment_methods_history_payment_method_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_methods_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_payment_methods_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_methods_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_payment_methods_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_methods_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_payment_methods_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_payment_methods_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### payment_transactions_history

#### Vista general

Preserva versiones o estados históricos de payment transactions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: payment_transactions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PaymentTransactionsHistory` — `src/modules/audit/entities/payment_transactions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `payment_transaction_id` | `uuid` | Clave foránea → payments.payment_transactions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | payment_transaction_id | payments.payment_transactions (id) | fk_payment_transactions_history_payment_transaction_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_payment_transactions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_payment_transactions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_payment_transactions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_payment_transactions_history_payment_transaction_id` | no | payment_transaction_id | Soporta la clave foránea fk_payment_transactions_history_payment_transaction_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_transactions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_payment_transactions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_transactions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_payment_transactions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payment_transactions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_payment_transactions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_payment_transactions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### payouts_history

#### Vista general

Preserva versiones o estados históricos de payouts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: payouts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PayoutsHistory` — `src/modules/audit/entities/payouts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `payout_id` | `uuid` | Clave foránea → payments.payouts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | payout_id | payments.payouts (id) | fk_payouts_history_payout_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_payouts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_payouts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_payouts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_payouts_history_payout_id` | no | payout_id | Soporta la clave foránea fk_payouts_history_payout_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payouts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_payouts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payouts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_payouts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_payouts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_payouts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_payouts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharma_lab_staff_history

#### Vista general

Registra revisiones del personal de laboratorios farmacéuticos con operación y número de revisión, para auditar cambios de roles que intervienen en actividades de promoción médica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3274: entity pharma_lab_staff_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmaLabStaffHistory` — `src/modules/audit/entities/pharma_lab_staff_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `pharma_lab_staff_id` | `uuid` | Clave foránea → pharma_lab.pharma_lab_staff.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/pharma_lab_staff_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharma_lab_staff_id | pharma_lab.pharma_lab_staff (id) | fk_pharma_lab_staff_history_pharma_lab_staff_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_pharma_lab_staff_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_pharma_lab_staff_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_pharma_lab_staff_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharma_lab_staff_history_pharma_lab_staff_id` | no | pharma_lab_staff_id | Soporta la clave foránea fk_pharma_lab_staff_history_pharma_lab_staff_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_lab_staff_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_pharma_lab_staff_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_lab_staff_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_pharma_lab_staff_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_lab_staff_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_pharma_lab_staff_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_pharma_lab_staff_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharma_labs_history

#### Vista general

Mantiene el historial versionado de los laboratorios farmacéuticos y la operación que originó cada revisión, para auditar sus datos institucionales.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3261: entity pharma_labs_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmaLabsHistory` — `src/modules/audit/entities/pharma_labs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `pharma_lab_id` | `uuid` | Clave foránea → pharma_lab.pharma_labs.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/pharma_labs_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharma_lab_id | pharma_lab.pharma_labs (id) | fk_pharma_labs_history_pharma_lab_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_pharma_labs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_pharma_labs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_pharma_labs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharma_labs_history_pharma_lab_id` | no | pharma_lab_id | Soporta la clave foránea fk_pharma_labs_history_pharma_lab_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_labs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_pharma_labs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_labs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_pharma_labs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_labs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_pharma_labs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_pharma_labs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharma_products_history

#### Vista general

Mantiene revisiones auditables de productos farmacéuticos, vinculadas a su producto y operación, para reconstruir cambios de información del producto.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3287: entity pharma_products_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmaProductsHistory` — `src/modules/audit/entities/pharma_products_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `pharma_product_id` | `uuid` | Clave foránea → pharma_lab.pharma_products.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/pharma_products_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharma_product_id | pharma_lab.pharma_products (id) | fk_pharma_products_history_pharma_product_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_pharma_products_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_pharma_products_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_pharma_products_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharma_products_history_pharma_product_id` | no | pharma_product_id | Soporta la clave foránea fk_pharma_products_history_pharma_product_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_products_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_pharma_products_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_products_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_pharma_products_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharma_products_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_pharma_products_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_pharma_products_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharmacovigilance_reports_history

#### Vista general

Registra revisiones de reportes de farmacovigilancia junto con su operación, para seguir cambios en casos de seguridad asociados a productos farmacéuticos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3248: entity pharmacovigilance_reports_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmacovigilanceReportsHistory` — `src/modules/audit/entities/pharmacovigilance_reports_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `pharmacovigilance_report_id` | `uuid` | Clave foránea → pharma_lab.pharmacovigilance_reports.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/pharmacovigilance_reports_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharmacovigilance_report_id | pharma_lab.pharmacovigilance_reports (id) | fk_pharmacovigilance_reports_history_pharmacovigilance_696f10eb |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_pharmacovigilance_reports_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_pharmacovigilance_reports_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_pharmacovigilance_reports_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharmacovigilance_reports_history_pharmacovigilance_60e5dded` | no | pharmacovigilance_report_id | Soporta la clave foránea fk_pharmacovigilance_reports_history_pharmacovigilance_696f10eb: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacovigilance_reports_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_pharmacovigilance_reports_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacovigilance_reports_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_pharmacovigilance_reports_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacovigilance_reports_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_pharmacovigilance_reports_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_pharmacovigilance_reports_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharmacy_inventory_access_log

#### Vista general

Registra accesos al inventario de farmacia para auditar consultas y operaciones sobre existencias sanitarias.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: pharmacy_inventory_access_log`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmacyInventoryAccessLog` — `src/modules/audit/entities/pharmacy_inventory_access_log.entity.ts`
- **Resumen:** 10 columnas · 7 índices · 6 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/audit/entities/pharmacy_inventory_access_log.entity.ts:12`)_ | coincide |
| 2 | `pharmacy_id` | `uuid` | Clave foránea → pharmacy.pharmacies.id; Obligatoria | _sin dato_ | coincide |
| 3 | `actor_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 4 | `action_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `target_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `target_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 7 | `purpose_of_use_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `occurred_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 10 | `correlation_id` | `uuid` | Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharmacy_id | pharmacy.pharmacies (id) | fk_pharmacy_inventory_access_log_pharmacy_id |
| hacia | actor_user_id | iam.users (id) | fk_pharmacy_inventory_access_log_actor_user_id |
| hacia | action_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_inventory_access_log_action_concept_id |
| hacia | target_type_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_inventory_access_log_target_type_concept_id |
| hacia | purpose_of_use_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_inventory_access_log_purpose_of_use_concept_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_inventory_access_log_outcome_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharmacy_inventory_access_log_pharmacy_id` | no | pharmacy_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_pharmacy_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_inventory_access_log_actor_user_id` | no | actor_user_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_actor_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_inventory_access_log_action_concept_id` | no | action_concept_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_action_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_inventory_access_log_target_type_concept_id` | no | target_type_concept_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_target_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_inventory_access_log_purpose_of_use_concept_id` | no | purpose_of_use_concept_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_purpose_of_use_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_inventory_access_log_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_pharmacy_inventory_access_log_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_pharmacy_inventory_access_log_occurred_at` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audit/third-party-access | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### pharmacy_product_prices_history

#### Vista general

Preserva versiones o estados históricos de pharmacy product prices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: pharmacy_product_prices_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PharmacyProductPricesHistory` — `src/modules/audit/entities/pharmacy_product_prices_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `pharmacy_product_price_id` | `uuid` | Clave foránea → pharmacy.pharmacy_product_prices.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | pharmacy_product_price_id | pharmacy.pharmacy_product_prices (id) | fk_pharmacy_product_prices_history_pharmacy_product_price_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_product_prices_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_pharmacy_product_prices_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_pharmacy_product_prices_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_pharmacy_product_prices_history_pharmacy_product_price_id` | no | pharmacy_product_price_id | Soporta la clave foránea fk_pharmacy_product_prices_history_pharmacy_product_price_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_product_prices_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_pharmacy_product_prices_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_product_prices_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_pharmacy_product_prices_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_pharmacy_product_prices_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_pharmacy_product_prices_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_pharmacy_product_prices_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_pharmacy_product_prices_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### placement_incidents_history

#### Vista general

Preserva versiones o estados históricos de las excepciones de ubicación de pacientes para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: placement_incidents_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PlacementIncidentsHistory` — `src/modules/audit/entities/placement_incidents_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `placement_incident_id` | `uuid` | Clave foránea → clinical.placement_incidents.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | placement_incident_id | clinical.placement_incidents (id) | fk_placement_incidents_history_placement_incident_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_placement_incidents_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_placement_incidents_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_placement_incidents_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_placement_incidents_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_placement_incidents_history_placement_incident_id` | no | placement_incident_id | Soporta la clave foránea fk_placement_incidents_history_placement_incident_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_placement_incidents_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_placement_incidents_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_placement_incidents_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_placement_incidents_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_placement_incidents_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### positions_history

#### Vista general

Preserva versiones o estados históricos de positions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: positions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PositionsHistory` — `src/modules/audit/entities/positions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `position_id` | `uuid` | Clave foránea → erp.positions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | position_id | erp.positions (id) | fk_positions_history_position_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_positions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_positions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_positions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_positions_history_position_id` | no | position_id | Soporta la clave foránea fk_positions_history_position_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_positions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_positions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_positions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_positions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_positions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_positions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_positions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### practice_sites_history

#### Vista general

Preserva versiones o estados históricos de practice sites para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: practice_sites_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PracticeSitesHistory` — `src/modules/audit/entities/practice_sites_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | + v4.2.67b (seguridad): el tenant de la fila de origen, para que el RLS tenant_isolation cubra también la historia (data_snapshot es la foto completa de la fila). Solo inserción: mantra_app tiene SELECT, INSERT y UPDATE de valid_to (cierre SCD-2); ver el patch 2026-10-29_infraestructura_f1b_seguridad.sql. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_10_audit.puml:237`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | practice_site_id | practice.practice_sites (id) | fk_practice_sites_history_practice_site_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_practice_sites_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_practice_sites_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_practice_sites_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_practice_sites_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_practice_sites_history_practice_site_id` | no | practice_site_id | Soporta la clave foránea fk_practice_sites_history_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practice_sites_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_practice_sites_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practice_sites_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_practice_sites_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practice_sites_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_practice_sites_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practice_sites_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_practice_sites_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_practice_sites_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### practices_history

#### Vista general

Preserva versiones o estados históricos de practices para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: practices_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PracticesHistory` — `src/modules/audit/entities/practices_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `practice_id` | `uuid` | Clave foránea → practice.practices.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | practice_id | practice.practices (id) | fk_practices_history_practice_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_practices_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_practices_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_practices_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_practices_history_practice_id` | no | practice_id | Soporta la clave foránea fk_practices_history_practice_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practices_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_practices_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practices_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_practices_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practices_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_practices_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_practices_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### practitioner_role_assignments_history

#### Vista general

Preserva versiones o estados históricos de practitioner role assignments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: practitioner_role_assignments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PractitionerRoleAssignmentsHistory` — `src/modules/audit/entities/practitioner_role_assignments_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `practitioner_role_assignment_id` | `uuid` | Clave foránea → practice.practitioner_role_assignments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | practitioner_role_assignment_id | practice.practitioner_role_assignments (id) | fk_practitioner_role_assignments_history_practitioner__baff3e62 |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_practitioner_role_assignments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_practitioner_role_assignments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_practitioner_role_assignments_history_change_reason_a26f251f |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_practitioner_role_assignments_history_practitioner__3c54201b` | no | practitioner_role_assignment_id | Soporta la clave foránea fk_practitioner_role_assignments_history_practitioner__baff3e62: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practitioner_role_assignments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_practitioner_role_assignments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practitioner_role_assignments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_practitioner_role_assignments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_practitioner_role_assignments_history_change_reason_fd6e8399` | no | change_reason_concept_id | Soporta la clave foránea fk_practitioner_role_assignments_history_change_reason_a26f251f: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_practitioner_role_assignments_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_practitioner_role_assignments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### procedure_cases_history

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `procedure_case_id` | `uuid` | Clave foránea → procedures_perioperative.procedure_cases.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | procedure_case_id | procedures_perioperative.procedure_cases (id) | fk_procedure_cases_history_procedure_case_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_procedure_cases_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_procedure_cases_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_procedure_cases_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_procedure_cases_history_procedure_case_id` | no | procedure_case_id | Soporta la clave foránea fk_procedure_cases_history_procedure_case_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedure_cases_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_procedure_cases_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedure_cases_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_procedure_cases_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedure_cases_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_procedure_cases_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_procedure_cases_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### product_catalogs_history

#### Vista general

Preserva versiones o estados históricos de product catalogs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: product_catalogs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProductCatalogsHistory` — `src/modules/audit/entities/product_catalogs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `product_catalogs_id` | `uuid` | Clave foránea → ads.product_catalogs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/product_catalogs_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | product_catalogs_id | ads.product_catalogs (id) | fk_product_catalogs_history_product_catalogs_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_product_catalogs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_product_catalogs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_product_catalogs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_product_catalogs_history_product_catalogs_id` | no | product_catalogs_id | Soporta la clave foránea fk_product_catalogs_history_product_catalogs_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_catalogs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_product_catalogs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_catalogs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_product_catalogs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_catalogs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_product_catalogs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_product_catalogs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### product_sets_history

#### Vista general

Preserva versiones o estados históricos de product sets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: product_sets_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProductSetsHistory` — `src/modules/audit/entities/product_sets_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `product_sets_id` | `uuid` | Clave foránea → ads.product_sets.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/product_sets_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | product_sets_id | ads.product_sets (id) | fk_product_sets_history_product_sets_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_product_sets_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_product_sets_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_product_sets_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_product_sets_history_product_sets_id` | no | product_sets_id | Soporta la clave foránea fk_product_sets_history_product_sets_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_sets_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_product_sets_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_sets_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_product_sets_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_product_sets_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_product_sets_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_product_sets_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### professional_credentials_history

#### Vista general

Preserva versiones o estados históricos de professional credentials para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: professional_credentials_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProfessionalCredentialsHistory` — `src/modules/audit/entities/professional_credentials_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `professional_credential_id` | `uuid` | Clave foránea → profiles.professional_credentials.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | professional_credential_id | profiles.professional_credentials (id) | fk_professional_credentials_history_professional_credential_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_professional_credentials_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_professional_credentials_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_professional_credentials_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_professional_credentials_history_professional_credential_id` | no | professional_credential_id | Soporta la clave foránea fk_professional_credentials_history_professional_credential_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_professional_credentials_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_professional_credentials_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_professional_credentials_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_professional_credentials_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_professional_credentials_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_professional_credentials_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_professional_credentials_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### promotions_history

#### Vista general

Preserva versiones o estados históricos de promotions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: promotions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PromotionsHistory` — `src/modules/audit/entities/promotions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `promotions_id` | `uuid` | Clave foránea → promotions.promotions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/promotions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | promotions_id | promotions.promotions (id) | fk_promotions_history_promotions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_promotions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_promotions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_promotions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_promotions_history_promotions_id` | no | promotions_id | Soporta la clave foránea fk_promotions_history_promotions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_promotions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_promotions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_promotions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_promotions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_promotions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_promotions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_promotions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### provider_channel_configs_history

#### Vista general

Preserva versiones o estados históricos de provider channel configs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: provider_channel_configs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProviderChannelConfigsHistory` — `src/modules/audit/entities/provider_channel_configs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `provider_channel_config_id` | `uuid` | Clave foránea → messaging.provider_channel_configs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | provider_channel_config_id | messaging.provider_channel_configs (id) | fk_provider_channel_configs_history_provider_channel_config_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_provider_channel_configs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_provider_channel_configs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_provider_channel_configs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_provider_channel_configs_history_provider_channel_config_id` | no | provider_channel_config_id | Soporta la clave foránea fk_provider_channel_configs_history_provider_channel_config_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_channel_configs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_provider_channel_configs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_channel_configs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_provider_channel_configs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_channel_configs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_provider_channel_configs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_provider_channel_configs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### provider_connections_history

#### Vista general

Preserva versiones o estados históricos de provider connections para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: provider_connections_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProviderConnectionsHistory` — `src/modules/audit/entities/provider_connections_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `provider_connection_id` | `uuid` | Clave foránea → integrations.provider_connections.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | provider_connection_id | integrations.provider_connections (id) | fk_provider_connections_history_provider_connection_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_provider_connections_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_provider_connections_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_provider_connections_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_provider_connections_history_provider_connection_id` | no | provider_connection_id | Soporta la clave foránea fk_provider_connections_history_provider_connection_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_connections_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_provider_connections_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_connections_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_provider_connections_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_connections_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_provider_connections_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_provider_connections_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### provider_protocol_configs_history

#### Vista general

Preserva versiones o estados históricos de provider protocol configs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: provider_protocol_configs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProviderProtocolConfigsHistory` — `src/modules/audit/entities/provider_protocol_configs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `provider_protocol_config_id` | `uuid` | Clave foránea → auth_providers.provider_protocol_configs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | provider_protocol_config_id | auth_providers.provider_protocol_configs (id) | fk_provider_protocol_configs_history_provider_protocol_e11b566a |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_provider_protocol_configs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_provider_protocol_configs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_provider_protocol_configs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_provider_protocol_configs_history_provider_protocol_c117b009` | no | provider_protocol_config_id | Soporta la clave foránea fk_provider_protocol_configs_history_provider_protocol_e11b566a: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_protocol_configs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_provider_protocol_configs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_protocol_configs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_provider_protocol_configs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_protocol_configs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_provider_protocol_configs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_provider_protocol_configs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### provider_tenant_bindings_history

#### Vista general

Preserva versiones o estados históricos de provider tenant bindings para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: provider_tenant_bindings_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ProviderTenantBindingsHistory` — `src/modules/audit/entities/provider_tenant_bindings_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `provider_tenant_binding_id` | `uuid` | Clave foránea → auth_providers.provider_tenant_bindings.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | provider_tenant_binding_id | auth_providers.provider_tenant_bindings (id) | fk_provider_tenant_bindings_history_provider_tenant_binding_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_provider_tenant_bindings_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_provider_tenant_bindings_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_provider_tenant_bindings_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_provider_tenant_bindings_history_provider_tenant_binding_id` | no | provider_tenant_binding_id | Soporta la clave foránea fk_provider_tenant_bindings_history_provider_tenant_binding_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_tenant_bindings_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_provider_tenant_bindings_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_tenant_bindings_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_provider_tenant_bindings_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_provider_tenant_bindings_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_provider_tenant_bindings_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_provider_tenant_bindings_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### public_profiles_history

#### Vista general

Preserva versiones o estados históricos de public profiles para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: public_profiles_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `PublicProfilesHistory` — `src/modules/audit/entities/public_profiles_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `public_profile_id` | `uuid` | Clave foránea → community.public_profiles.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | public_profile_id | community.public_profiles (id) | fk_public_profiles_history_public_profile_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_public_profiles_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_public_profiles_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_public_profiles_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_public_profiles_history_public_profile_id` | no | public_profile_id | Soporta la clave foránea fk_public_profiles_history_public_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_public_profiles_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_public_profiles_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_public_profiles_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_public_profiles_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_public_profiles_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_public_profiles_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_public_profiles_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### record_automations_history

#### Vista general

Preserva versiones o estados históricos de record automations para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: record_automations_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `RecordAutomationsHistory` — `src/modules/audit/entities/record_automations_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `record_automations_id` | `uuid` | Clave foránea → automation.record_automations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/record_automations_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | record_automations_id | automation.record_automations (id) | fk_record_automations_history_record_automations_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_record_automations_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_record_automations_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_record_automations_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_record_automations_history_record_automations_id` | no | record_automations_id | Soporta la clave foránea fk_record_automations_history_record_automations_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_record_automations_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_record_automations_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_record_automations_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_record_automations_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_record_automations_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_record_automations_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_record_automations_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### referral_programs_history

#### Vista general

Preserva versiones o estados históricos de referral programs para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: referral_programs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ReferralProgramsHistory` — `src/modules/audit/entities/referral_programs_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `referral_programs_id` | `uuid` | Clave foránea → promotions.referral_programs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/referral_programs_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | referral_programs_id | promotions.referral_programs (id) | fk_referral_programs_history_referral_programs_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_referral_programs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_referral_programs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_referral_programs_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_referral_programs_history_referral_programs_id` | no | referral_programs_id | Soporta la clave foránea fk_referral_programs_history_referral_programs_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referral_programs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_referral_programs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referral_programs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_referral_programs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referral_programs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_referral_programs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_referral_programs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### referrals_history

#### Vista general

Preserva versiones o estados históricos de referrals para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: referrals_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ReferralsHistory` — `src/modules/audit/entities/referrals_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `referral_id` | `uuid` | Clave foránea → clinical_ext.referrals.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | referral_id | clinical_ext.referrals (id) | fk_referrals_history_referral_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_referrals_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_referrals_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_referrals_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_referrals_history_referral_id` | no | referral_id | Soporta la clave foránea fk_referrals_history_referral_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referrals_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_referrals_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referrals_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_referrals_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_referrals_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_referrals_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_referrals_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### regulatory_documents_history

#### Vista general

Conserva revisiones de documentos regulatorios y sus operaciones, para reconstruir cambios en documentación de cumplimiento de laboratorios y productos farmacéuticos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3300: entity regulatory_documents_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `RegulatoryDocumentsHistory` — `src/modules/audit/entities/regulatory_documents_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `regulatory_document_id` | `uuid` | Clave foránea → pharma_lab.regulatory_documents.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/regulatory_documents_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | regulatory_document_id | pharma_lab.regulatory_documents (id) | fk_regulatory_documents_history_regulatory_document_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_regulatory_documents_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_regulatory_documents_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_regulatory_documents_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_regulatory_documents_history_regulatory_document_id` | no | regulatory_document_id | Soporta la clave foránea fk_regulatory_documents_history_regulatory_document_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_regulatory_documents_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_regulatory_documents_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_regulatory_documents_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_regulatory_documents_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_regulatory_documents_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_regulatory_documents_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_regulatory_documents_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### report_definitions_history

#### Vista general

Preserva versiones o estados históricos de report definitions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: report_definitions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ReportDefinitionsHistory` — `src/modules/audit/entities/report_definitions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `report_definition_id` | `uuid` | Clave foránea → reporting.report_definitions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | report_definition_id | reporting.report_definitions (id) | fk_report_definitions_history_report_definition_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_report_definitions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_report_definitions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_report_definitions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_report_definitions_history_report_definition_id` | no | report_definition_id | Soporta la clave foránea fk_report_definitions_history_report_definition_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_definitions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_report_definitions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_definitions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_report_definitions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_definitions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_report_definitions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_report_definitions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### report_schedules_history

#### Vista general

Preserva versiones o estados históricos de report schedules para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: report_schedules_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ReportSchedulesHistory` — `src/modules/audit/entities/report_schedules_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `report_schedule_id` | `uuid` | Clave foránea → reporting.report_schedules.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | report_schedule_id | reporting.report_schedules (id) | fk_report_schedules_history_report_schedule_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_report_schedules_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_report_schedules_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_report_schedules_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_report_schedules_history_report_schedule_id` | no | report_schedule_id | Soporta la clave foránea fk_report_schedules_history_report_schedule_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_schedules_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_report_schedules_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_schedules_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_report_schedules_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_report_schedules_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_report_schedules_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_report_schedules_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_report_schedules_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### schedule_templates_history

#### Vista general

Preserva versiones o estados históricos de schedule templates para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: schedule_templates_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ScheduleTemplatesHistory` — `src/modules/audit/entities/schedule_templates_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `schedule_template_id` | `uuid` | Clave foránea → scheduling.schedule_templates.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | schedule_template_id | scheduling.schedule_templates (id) | fk_schedule_templates_history_schedule_template_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_schedule_templates_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_schedule_templates_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_schedule_templates_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_schedule_templates_history_schedule_template_id` | no | schedule_template_id | Soporta la clave foránea fk_schedule_templates_history_schedule_template_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_schedule_templates_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_schedule_templates_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_schedule_templates_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_schedule_templates_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_schedule_templates_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_schedule_templates_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_schedule_templates_history_effective_period` | no | (tstzrange(valid_from, valid_to, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |
| `brin_schedule_templates_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### segments_history

#### Vista general

Preserva versiones o estados históricos de segments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: segments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `SegmentsHistory` — `src/modules/audit/entities/segments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `segments_id` | `uuid` | Clave foránea → accounting.segments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/segments_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | segments_id | accounting.segments (id) | fk_segments_history_segments_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_segments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_segments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_segments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_segments_history_segments_id` | no | segments_id | Soporta la clave foránea fk_segments_history_segments_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_segments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_segments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_segments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_segments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_segments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_segments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_segments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### service_reviews_history

#### Vista general

Preserva versiones o estados históricos de service reviews para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: service_reviews_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ServiceReviewsHistory` — `src/modules/audit/entities/service_reviews_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `service_review_id` | `uuid` | Clave foránea → community.service_reviews.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | service_review_id | community.service_reviews (id) | fk_service_reviews_history_service_review_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_service_reviews_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_service_reviews_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_service_reviews_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_service_reviews_history_service_review_id` | no | service_review_id | Soporta la clave foránea fk_service_reviews_history_service_review_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_reviews_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_service_reviews_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_reviews_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_service_reviews_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_reviews_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_service_reviews_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_service_reviews_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### shipments_history

#### Vista general

Preserva versiones o estados históricos de shipments para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: shipments_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `ShipmentsHistory` — `src/modules/audit/entities/shipments_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `shipment_id` | `uuid` | Clave foránea → tracking.shipments.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | shipment_id | tracking.shipments (id) | fk_shipments_history_shipment_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_shipments_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_shipments_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_shipments_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_shipments_history_shipment_id` | no | shipment_id | Soporta la clave foránea fk_shipments_history_shipment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_shipments_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_shipments_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_shipments_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_shipments_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_shipments_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_shipments_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_shipments_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### social_posts_history

#### Vista general

Preserva versiones o estados históricos de social posts para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: social_posts_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `SocialPostsHistory` — `src/modules/audit/entities/social_posts_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `social_post_id` | `uuid` | Clave foránea → community.social_posts.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | social_post_id | community.social_posts (id) | fk_social_posts_history_social_post_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_social_posts_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_social_posts_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_social_posts_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_social_posts_history_social_post_id` | no | social_post_id | Soporta la clave foránea fk_social_posts_history_social_post_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_posts_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_social_posts_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_posts_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_social_posts_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_posts_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_social_posts_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_social_posts_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### space_tariffs_history

#### Vista general

Preserva versiones o estados históricos de las tarifas por uso de espacio para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico (sólo inserción y cierre de vigencia).

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: space_tariffs_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `SpaceTariffsHistory` — `src/modules/audit/entities/space_tariffs_history.entity.ts`
- **Resumen:** 11 columnas · 6 índices · 5 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `space_tariff_id` | `uuid` | Clave foránea → billing.space_tariffs.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | space_tariff_id | billing.space_tariffs (id) | fk_space_tariffs_history_space_tariff_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_space_tariffs_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_space_tariffs_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_space_tariffs_history_change_reason_concept_id |
| hacia | tenant_id | directory.tenants (id) | fk_space_tariffs_history_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_space_tariffs_history_space_tariff_id` | no | space_tariff_id | Soporta la clave foránea fk_space_tariffs_history_space_tariff_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_space_tariffs_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_space_tariffs_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_space_tariffs_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_space_tariffs_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_space_tariffs_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_space_tariffs_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_space_tariffs_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_space_tariffs_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_space_tariffs_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### subscription_plans_history

#### Vista general

Preserva versiones o estados históricos de subscription plans para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: subscription_plans_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `SubscriptionPlansHistory` — `src/modules/audit/entities/subscription_plans_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `subscription_plans_id` | `uuid` | Clave foránea → payments.subscription_plans.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/subscription_plans_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | subscription_plans_id | payments.subscription_plans (id) | fk_subscription_plans_history_subscription_plans_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_subscription_plans_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_subscription_plans_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_subscription_plans_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_subscription_plans_history_subscription_plans_id` | no | subscription_plans_id | Soporta la clave foránea fk_subscription_plans_history_subscription_plans_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscription_plans_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_subscription_plans_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscription_plans_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_subscription_plans_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscription_plans_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_subscription_plans_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_subscription_plans_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### subscriptions_history

#### Vista general

Preserva versiones o estados históricos de subscriptions para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: subscriptions_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `SubscriptionsHistory` — `src/modules/audit/entities/subscriptions_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `subscriptions_id` | `uuid` | Clave foránea → payments.subscriptions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/subscriptions_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | subscriptions_id | payments.subscriptions (id) | fk_subscriptions_history_subscriptions_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_subscriptions_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_subscriptions_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_subscriptions_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_subscriptions_history_subscriptions_id` | no | subscriptions_id | Soporta la clave foránea fk_subscriptions_history_subscriptions_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscriptions_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_subscriptions_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscriptions_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_subscriptions_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_subscriptions_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_subscriptions_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_subscriptions_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### tenants_history

#### Vista general

Preserva versiones o estados históricos de tenants para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: tenants_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `TenantsHistory` — `src/modules/audit/entities/tenants_history.entity.ts`
- **Resumen:** 10 columnas · 6 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | tenant_id | directory.tenants (id) | fk_tenants_history_tenant_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_tenants_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_tenants_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_tenants_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_tenants_history_tenant_id` | no | tenant_id | Soporta la clave foránea fk_tenants_history_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_tenants_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_tenants_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_tenants_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_tenants_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_tenants_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_tenants_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_tenants_history_tenant_id_recorded_at` | no | tenant_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_tenants_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### test_cases_history

#### Vista general

Preserva versiones o estados históricos de test cases para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: test_cases_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `TestCasesHistory` — `src/modules/audit/entities/test_cases_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `test_case_id` | `uuid` | Clave foránea → qa_lab.test_cases.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | test_case_id | qa_lab.test_cases (id) | fk_test_cases_history_test_case_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_test_cases_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_test_cases_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_test_cases_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_test_cases_history_test_case_id` | no | test_case_id | Soporta la clave foránea fk_test_cases_history_test_case_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_cases_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_test_cases_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_cases_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_test_cases_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_cases_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_test_cases_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_test_cases_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### test_suites_history

#### Vista general

Preserva versiones o estados históricos de test suites para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: test_suites_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `TestSuitesHistory` — `src/modules/audit/entities/test_suites_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `test_suite_id` | `uuid` | Clave foránea → qa_lab.test_suites.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | test_suite_id | qa_lab.test_suites (id) | fk_test_suites_history_test_suite_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_test_suites_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_test_suites_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_test_suites_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_test_suites_history_test_suite_id` | no | test_suite_id | Soporta la clave foránea fk_test_suites_history_test_suite_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_suites_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_test_suites_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_suites_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_test_suites_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_test_suites_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_test_suites_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_test_suites_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### topics_history

#### Vista general

Preserva versiones o estados históricos de topics para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: topics_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `TopicsHistory` — `src/modules/audit/entities/topics_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `topics_id` | `uuid` | Clave foránea → community.topics.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/topics_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | topics_id | community.topics (id) | fk_topics_history_topics_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_topics_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_topics_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_topics_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_topics_history_topics_id` | no | topics_id | Soporta la clave foránea fk_topics_history_topics_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_topics_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_topics_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_topics_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_topics_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_topics_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_topics_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_topics_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### trackable_subjects_history

#### Vista general

Preserva versiones o estados históricos de trackable subjects para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: trackable_subjects_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `TrackableSubjectsHistory` — `src/modules/audit/entities/trackable_subjects_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `trackable_subject_id` | `uuid` | Clave foránea → tracking.trackable_subjects.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | trackable_subject_id | tracking.trackable_subjects (id) | fk_trackable_subjects_history_trackable_subject_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_trackable_subjects_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_trackable_subjects_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_trackable_subjects_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_trackable_subjects_history_trackable_subject_id` | no | trackable_subject_id | Soporta la clave foránea fk_trackable_subjects_history_trackable_subject_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_trackable_subjects_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_trackable_subjects_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_trackable_subjects_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_trackable_subjects_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_trackable_subjects_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_trackable_subjects_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_trackable_subjects_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### users_history

#### Vista general

Preserva versiones o estados históricos de users para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: users_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `UsersHistory` — `src/modules/audit/entities/users_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | user_id | iam.users (id) | fk_users_history_user_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_users_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_users_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_users_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_users_history_user_id` | no | user_id | Soporta la clave foránea fk_users_history_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_users_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_users_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_users_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_users_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_users_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_users_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_users_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### verified_badges_history

#### Vista general

Preserva versiones o estados históricos de verified badges para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: verified_badges_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `VerifiedBadgesHistory` — `src/modules/audit/entities/verified_badges_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 12 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `verified_badges_id` | `uuid` | Clave foránea → community.verified_badges.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/verified_badges_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | verified_badges_id | community.verified_badges (id) | fk_verified_badges_history_verified_badges_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_verified_badges_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_verified_badges_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_verified_badges_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_verified_badges_history_verified_badges_id` | no | verified_badges_id | Soporta la clave foránea fk_verified_badges_history_verified_badges_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_verified_badges_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_verified_badges_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_verified_badges_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_verified_badges_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_verified_badges_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_verified_badges_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_verified_badges_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/community/verification/badges | CREA | DIRECTA |
| POST /internal/community/verification/badges/{targetId}/revoke | CREA | DIRECTA |
| POST /internal/community/verification/badges/expire-sweep | CREA | DIRECTA |
| POST /identity/assertions/{id}/revoke | CREA | DIRECTA |
| POST /identity/checks/{id}/results | CREA | DIRECTA |
| POST /identity/manual-review/{id}/decision | CREA | DIRECTA |
| POST /identity/verification-cases/expire-sweep | CREA | DIRECTA |
| POST /internal/identity/checks/{id}/results | CREA | DIRECTA |
| POST /admissions/{id}/decision | CREA | DIRECTA |
| POST /admissions/{id}/reinstate | CREA | DIRECTA |
| POST /admissions/{id}/suspend | CREA | DIRECTA |
| POST /admissions/expire-sweep | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### visit_requests_history

#### Vista general

Conserva revisiones de solicitudes de visita médica y su operación, para auditar cambios en la coordinación entre representantes y profesionales de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml:3313: entity visit_requests_history <<HISTORY>> {`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `VisitRequestsHistory` — `src/modules/audit/entities/visit_requests_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `visit_request_id` | `uuid` | Clave foránea → pharma_lab.visit_requests.id; Obligatoria | Identificador del agregado versionado. _(JSDOC_ENTIDAD, `src/modules/audit/entities/visit_requests_history.entity.ts:23`)_ | coincide |
| 3 | `revision_no` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | visit_request_id | pharma_lab.visit_requests (id) | fk_visit_requests_history_visit_request_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_visit_requests_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_visit_requests_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_visit_requests_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_visit_requests_history_visit_request_id` | no | visit_request_id | Soporta la clave foránea fk_visit_requests_history_visit_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_visit_requests_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_visit_requests_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_visit_requests_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_visit_requests_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_visit_requests_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_visit_requests_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_visit_requests_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### wallets_history

#### Vista general

Preserva versiones o estados históricos de wallets para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: wallets_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `WalletsHistory` — `src/modules/audit/entities/wallets_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `wallets_id` | `uuid` | Clave foránea → payments.wallets.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/wallets_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | wallets_id | payments.wallets (id) | fk_wallets_history_wallets_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_wallets_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_wallets_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_wallets_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_wallets_history_wallets_id` | no | wallets_id | Soporta la clave foránea fk_wallets_history_wallets_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_wallets_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_wallets_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_wallets_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_wallets_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_wallets_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_wallets_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_wallets_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### workflows_history

#### Vista general

Preserva versiones o estados históricos de workflows para reconstruir cambios, atribuirlos y sostener auditoría del sistema médico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_10_audit.puml: workflows_history`
- **Dominio:** Auditoría y Reporting · **Diagrama:** `Mantra Core Health Context/modules/diagram_10_audit.puml` · **DDL:** `SQL/10_audit/02_tables.sql`
- **Entidad del ORM:** `WorkflowsHistory` — `src/modules/audit/entities/workflows_history.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 4 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `history_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `workflows_id` | `uuid` | Clave foránea → automation.workflows.id; Obligatoria | _sin dato_ | coincide |
| 3 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/audit/entities/workflows_history.entity.ts:24`)_ | coincide |
| 4 | `operation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 6 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `data_snapshot` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `changed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `change_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | workflows_id | automation.workflows (id) | fk_workflows_history_workflows_id |
| hacia | operation_concept_id | terminology.catalog_concepts (id) | fk_workflows_history_operation_concept_id |
| hacia | changed_by_user_id | iam.users (id) | fk_workflows_history_changed_by_user_id |
| hacia | change_reason_concept_id | terminology.catalog_concepts (id) | fk_workflows_history_change_reason_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_workflows_history_workflows_id` | no | workflows_id | Soporta la clave foránea fk_workflows_history_workflows_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_workflows_history_operation_concept_id` | no | operation_concept_id | Soporta la clave foránea fk_workflows_history_operation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_workflows_history_changed_by_user_id` | no | changed_by_user_id | Soporta la clave foránea fk_workflows_history_changed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_workflows_history_change_reason_concept_id` | no | change_reason_concept_id | Soporta la clave foránea fk_workflows_history_change_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `brin_workflows_history_recorded_at` | no | recorded_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/audit/README.md:93` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

