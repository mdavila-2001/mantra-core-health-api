set names 'utf8';

create table "diagnostic_results" ("id" uuid not null, "order_id" varchar(64) not null, "file_url" varchar(500) not null, "checksum_sha256" varchar(64) not null, "technician_registration" varchar(50) not null, "critical_notes" text null, "uploaded_by_user_id" varchar(64) not null, "uploaded_at" timestamptz not null, primary key ("id"));
alter table "diagnostic_results" add constraint "diagnostic_results_order_id_unique" unique ("order_id");

create table "diagnostic_studies" ("id" uuid not null, "code" varchar(30) not null, "category" text not null, "name" varchar(200) not null, "preparation_instructions" text not null, "estimated_turnaround" varchar(100) not null, "price_bob" numeric(10,2) not null, "created_at" timestamptz not null, primary key ("id"));
alter table "diagnostic_studies" add constraint "diagnostic_studies_code_unique" unique ("code");
alter table "diagnostic_studies" add constraint "diagnostic_studies_category_check" check ("category" in ('LABORATORY', 'IMAGING', 'CARDIOLOGY'));

create table "dispensations" ("id" uuid not null, "prescription_id" varchar(64) not null, "pharmacy_branch_id" varchar(64) not null, "dispensed_by_user_id" varchar(64) not null, "total_amount_bob" numeric(10,2) not null, "dispensed_at" timestamptz not null, primary key ("id"));
alter table "dispensations" add constraint "dispensations_prescription_id_unique" unique ("prescription_id");

create table "invoices" ("id" uuid not null, "invoice_number" int not null, "emitter_nit" varchar(30) not null, "emitter_business_name" varchar(200) not null, "branch_office_code" int not null default 0, "point_of_sale_code" int not null default 0, "buyer_nit_ci" varchar(30) not null, "buyer_complement" varchar(5) null, "buyer_name" varchar(200) not null, "buyer_email" varchar(255) null, "payment_method_code" int not null, "items" jsonb not null, "total_amount" numeric(12,2) not null, "iva_credit_fiscal" numeric(12,2) not null, "cuf" varchar(100) not null, "cufd" varchar(100) not null, "qr_code_url" varchar(500) not null, "xml_content" text not null, "siat_status" varchar(20) not null default 'VALIDADA', "issued_at" timestamptz not null, primary key ("id"));
alter table "invoices" add constraint "invoices_cuf_unique" unique ("cuf");

create table "pharmacy_products" ("id" uuid not null, "generic_name" varchar(150) not null, "brand_name" varchar(150) null, "agemed_register" varchar(50) not null, "concentration" varchar(100) not null, "form" varchar(100) not null, "presentation" varchar(100) not null, "price_bob" numeric(10,2) not null, "requires_prescription" boolean not null default false, "stock" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "pharmacy_products" add constraint "pharmacy_products_agemed_register_unique" unique ("agemed_register");

create table "practitioner_fiscal_profiles" ("id" uuid not null, "nit" varchar(30) not null, "business_name" varchar(200) not null, "corporate_type" varchar(50) not null, "branch_number" int not null default 0, "documents" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "practitioner_fiscal_profiles" add constraint "practitioner_fiscal_profiles_nit_unique" unique ("nit");

create table "users" ("id" uuid not null, "national_id" varchar(30) not null, "complement" varchar(5) null, "email" varchar(255) null, "password_hash" varchar(255) not null, "roles" text[] not null, "tenant_id" varchar(64) null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "users" add constraint "users_national_id_unique" unique ("national_id");
alter table "users" add constraint "users_email_unique" unique ("email");
alter table "users" add constraint "users_roles_check" check ("roles" <@ array['PACIENTE'::text, 'MEDICO'::text, 'ODONTOLOGO'::text, 'SECRETARIA_MEDICA'::text, 'FARMACIA_OPERADOR'::text, 'LABORATORIO_OPERADOR'::text, 'IMAGENOLOGIA_OPERADOR'::text, 'DIRECTOR_MEDICO'::text, 'ADMIN_CLINICA'::text, 'SUPERADMIN'::text, 'PACIENTE'::text, 'MEDICO'::text, 'ODONTOLOGO'::text, 'SECRETARIA_MEDICA'::text, 'FARMACIA_OPERADOR'::text, 'LABORATORIO_OPERADOR'::text, 'IMAGENOLOGIA_OPERADOR'::text, 'DIRECTOR_MEDICO'::text, 'ADMIN_CLINICA'::text, 'SUPERADMIN'::text]);

create table "practitioners" ("id" uuid not null, "user_id" uuid null, "first_name" varchar(60) not null, "second_name" varchar(60) null, "third_name" varchar(60) null, "last_name" varchar(60) not null, "second_last_name" varchar(60) null, "national_id" varchar(20) not null, "department" varchar(5) not null, "professional_license" varchar(30) not null, "professional_college" varchar(100) not null, "specialties" text[] not null, "fiscal_profile_id" uuid null, "tenant_id" varchar(64) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "practitioners" add constraint "practitioners_user_id_unique" unique ("user_id");
alter table "practitioners" add constraint "practitioners_professional_license_unique" unique ("professional_license");
alter table "practitioners" add constraint "practitioners_fiscal_profile_id_unique" unique ("fiscal_profile_id");

create table "practitioner_offices" ("id" uuid not null, "practitioner_id" uuid not null, "clinic_name" varchar(150) not null, "street_address" varchar(255) not null, "latitude" numeric(10,7) null, "longitude" numeric(10,7) null, "phone" varchar(30) null, "room_number" varchar(50) null, primary key ("id"));

create table "blocked_slots" ("id" uuid not null, "practitioner_id" uuid not null, "office_id" uuid null, "start" timestamptz not null, "end" timestamptz not null, "reason" varchar(255) not null, "created_by" varchar(64) not null, "created_at" timestamptz not null, primary key ("id"));

create table "patients" ("id" uuid not null, "user_id" uuid null, "first_name" varchar(60) not null, "second_name" varchar(60) null, "third_name" varchar(60) null, "last_name" varchar(60) not null, "second_last_name" varchar(60) null, "national_id" varchar(20) not null, "complement" varchar(5) null, "department" varchar(5) not null, "birth_date" date not null, "gender" varchar(20) not null, "blood_type" varchar(5) null, "emergency_contact" jsonb null, "guardians" jsonb null, "addresses" jsonb null, "tenant_id" varchar(64) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "patients" add constraint "patients_user_id_unique" unique ("user_id");

create table "appointments" ("id" uuid not null, "patient_id" uuid not null, "practitioner_id" uuid not null, "office_id" uuid not null, "specialty" varchar(100) not null, "modality" text not null, "scheduled_start" timestamptz not null, "scheduled_end" timestamptz not null, "reason" varchar(500) not null, "notes" varchar(500) null, "status" text not null default 'CONFIRMED', "cancellation_reason" varchar(500) null, "created_by" varchar(64) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));
alter table "appointments" add constraint "appointments_modality_check" check ("modality" in ('IN_PERSON', 'TELEMEDICINE'));
alter table "appointments" add constraint "appointments_status_check" check ("status" in ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

create table "encounters" ("id" uuid not null, "patient_id" uuid not null, "practitioner_id" uuid not null, "appointment_id" uuid null, "chief_complaint" text not null, "history_of_present_illness" text not null, "vital_signs" jsonb not null, "calculated_bmi" numeric(5,2) not null, "physical_exam" text not null, "diagnoses" jsonb not null, "treatment_plan" text not null, "signed_by" varchar(64) not null, "created_at" timestamptz not null, primary key ("id"));
alter table "encounters" add constraint "encounters_appointment_id_unique" unique ("appointment_id");

create table "prescriptions" ("id" uuid not null, "code" varchar(30) not null, "encounter_id" uuid null, "patient_id" uuid not null, "practitioner_id" uuid not null, "items" jsonb not null, "diagnosis_cie10" varchar(255) not null, "valid_until" timestamptz not null, "status" text not null default 'ACTIVE', "dispensed_by_pharmacy_id" varchar(64) null, "dispensed_at" timestamptz null, "signed_by" varchar(64) not null, "created_at" timestamptz not null, primary key ("id"));
alter table "prescriptions" add constraint "prescriptions_code_unique" unique ("code");
alter table "prescriptions" add constraint "prescriptions_status_check" check ("status" in ('ACTIVE', 'DISPENSED', 'EXPIRED', 'CANCELLED'));

create table "clinical_orders" ("id" uuid not null, "order_number" varchar(30) not null, "encounter_id" uuid null, "patient_id" uuid not null, "practitioner_id" uuid not null, "type" text not null, "items" text[] not null, "clinical_justification" text not null, "diagnosis_cie10" varchar(255) null, "status" text not null default 'REQUESTED', "result_urls" text[] null, "result_uploaded_at" timestamptz null, "signed_by" varchar(64) not null, "created_at" timestamptz not null, primary key ("id"));
alter table "clinical_orders" add constraint "clinical_orders_order_number_unique" unique ("order_number");
alter table "clinical_orders" add constraint "clinical_orders_type_check" check ("type" in ('LABORATORY', 'IMAGING', 'PROCEDURE'));
alter table "clinical_orders" add constraint "clinical_orders_status_check" check ("status" in ('REQUESTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED'));

alter table "practitioners" add constraint "practitioners_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete set null;
alter table "practitioners" add constraint "practitioners_fiscal_profile_id_foreign" foreign key ("fiscal_profile_id") references "practitioner_fiscal_profiles" ("id") on delete set null;

alter table "practitioner_offices" add constraint "practitioner_offices_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");

alter table "blocked_slots" add constraint "blocked_slots_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");
alter table "blocked_slots" add constraint "blocked_slots_office_id_foreign" foreign key ("office_id") references "practitioner_offices" ("id") on delete set null;

alter table "patients" add constraint "patients_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete set null;

alter table "appointments" add constraint "appointments_patient_id_foreign" foreign key ("patient_id") references "patients" ("id");
alter table "appointments" add constraint "appointments_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");
alter table "appointments" add constraint "appointments_office_id_foreign" foreign key ("office_id") references "practitioner_offices" ("id");

alter table "encounters" add constraint "encounters_patient_id_foreign" foreign key ("patient_id") references "patients" ("id");
alter table "encounters" add constraint "encounters_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");
alter table "encounters" add constraint "encounters_appointment_id_foreign" foreign key ("appointment_id") references "appointments" ("id") on delete set null;

alter table "prescriptions" add constraint "prescriptions_encounter_id_foreign" foreign key ("encounter_id") references "encounters" ("id") on delete set null;
alter table "prescriptions" add constraint "prescriptions_patient_id_foreign" foreign key ("patient_id") references "patients" ("id");
alter table "prescriptions" add constraint "prescriptions_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");

alter table "clinical_orders" add constraint "clinical_orders_encounter_id_foreign" foreign key ("encounter_id") references "encounters" ("id") on delete set null;
alter table "clinical_orders" add constraint "clinical_orders_patient_id_foreign" foreign key ("patient_id") references "patients" ("id");
alter table "clinical_orders" add constraint "clinical_orders_practitioner_id_foreign" foreign key ("practitioner_id") references "practitioners" ("id");

[32m[39m
