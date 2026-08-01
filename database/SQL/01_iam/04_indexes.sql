-- SALUD v4.0.1 · módulo 01 · schema iam
-- Generado de diagram_01_iam.puml — NO editar a mano.


CREATE INDEX IF NOT EXISTS "ix_users_status_concept_id" ON "iam"."users" ("status_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_preferred_language_concept_id" ON "iam"."users" ("preferred_language_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_residence_country_concept_id" ON "iam"."users" ("residence_country_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_data_residency_region_concept_id" ON "iam"."users" ("data_residency_region_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_mfa_status_concept_id" ON "iam"."users" ("mfa_status_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_legal_basis_concept_id" ON "iam"."users" ("legal_basis_concept_id");

CREATE INDEX IF NOT EXISTS "ix_users_created_by_user_id" ON "iam"."users" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_users_updated_by_user_id" ON "iam"."users" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_user_id" ON "iam"."authentication_credentials" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_method_concept_id" ON "iam"."authentication_credentials" ("method_concept_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_hash_algorithm_concept_id" ON "iam"."authentication_credentials" ("hash_algorithm_concept_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_state_concept_id" ON "iam"."authentication_credentials" ("state_concept_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_created_by_user_id" ON "iam"."authentication_credentials" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_authentication_credentials_updated_by_user_id" ON "iam"."authentication_credentials" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_mfa_factors_user_id" ON "iam"."mfa_factors" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_mfa_factors_factor_type_concept_id" ON "iam"."mfa_factors" ("factor_type_concept_id");

CREATE INDEX IF NOT EXISTS "ix_mfa_factors_state_concept_id" ON "iam"."mfa_factors" ("state_concept_id");

CREATE INDEX IF NOT EXISTS "ix_mfa_factors_created_by_user_id" ON "iam"."mfa_factors" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_mfa_factors_updated_by_user_id" ON "iam"."mfa_factors" ("updated_by_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_devices_device_fingerprint" ON "iam"."devices" ("device_fingerprint");

CREATE INDEX IF NOT EXISTS "ix_devices_user_id" ON "iam"."devices" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_devices_platform_concept_id" ON "iam"."devices" ("platform_concept_id");

CREATE INDEX IF NOT EXISTS "ix_devices_created_by_user_id" ON "iam"."devices" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_devices_updated_by_user_id" ON "iam"."devices" ("updated_by_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_sessions_token_id" ON "iam"."sessions" ("token_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_user_id" ON "iam"."sessions" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_device_id" ON "iam"."sessions" ("device_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_state_concept_id" ON "iam"."sessions" ("state_concept_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_created_by_user_id" ON "iam"."sessions" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_updated_by_user_id" ON "iam"."sessions" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_sessions_user_state_expiry" ON "iam"."sessions" ("user_id", "state_concept_id", "expires_at");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_refresh_tokens_token_hash" ON "iam"."refresh_tokens" ("token_hash");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_session_id" ON "iam"."refresh_tokens" ("session_id");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_state_concept_id" ON "iam"."refresh_tokens" ("state_concept_id");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_replaced_by_id" ON "iam"."refresh_tokens" ("replaced_by_id");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_created_by_user_id" ON "iam"."refresh_tokens" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_updated_by_user_id" ON "iam"."refresh_tokens" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_refresh_tokens_session_state" ON "iam"."refresh_tokens" ("session_id", "state_concept_id", "expires_at");

CREATE INDEX IF NOT EXISTS "ix_user_global_roles_user_id" ON "iam"."user_global_roles" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_user_global_roles_role_concept_id" ON "iam"."user_global_roles" ("role_concept_id");

CREATE INDEX IF NOT EXISTS "ix_user_global_roles_state_concept_id" ON "iam"."user_global_roles" ("state_concept_id");

CREATE INDEX IF NOT EXISTS "ix_user_global_roles_created_by_user_id" ON "iam"."user_global_roles" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_user_global_roles_updated_by_user_id" ON "iam"."user_global_roles" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_security_events_user_id" ON "iam"."security_events" ("user_id");

CREATE INDEX IF NOT EXISTS "ix_security_events_event_type_concept_id" ON "iam"."security_events" ("event_type_concept_id");

CREATE INDEX IF NOT EXISTS "ix_security_events_outcome_concept_id" ON "iam"."security_events" ("outcome_concept_id");

CREATE INDEX IF NOT EXISTS "ix_security_events_recorded_by_user_id" ON "iam"."security_events" ("recorded_by_user_id");

CREATE INDEX IF NOT EXISTS "brin_security_events_recorded_at" ON "iam"."security_events" USING brin ("recorded_at") WITH (pages_per_range=128);
