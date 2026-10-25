-- 2026-10-24 · Contabilidad simple del doctor (P49).
--
-- La contabilidad llana del consultorio: cuentas con su clase, gastos/activos/deudas
-- (el tipo ES una cuenta de la clase que corresponde) y transacciones debe/haber.
-- NO genera asientos ni toca accounting.journal_transactions (PENDIENTES-BACKEND P49 §3).
-- Las cuentas generales se siembran por práctica desde la API, al primer acceso.
-- Idempotente: se puede aplicar N veces.

CREATE TABLE IF NOT EXISTS "accounting"."practitioner_simple_accounts" (
    "id" uuid NOT NULL,
    "practice_id" uuid NOT NULL,
    "code" varchar NOT NULL,
    "name" varchar NOT NULL,
    "account_class" varchar NOT NULL,
    "seeded" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_practitioner_simple_accounts" PRIMARY KEY ("id"),
    CONSTRAINT "uq_practitioner_simple_accounts_practice_code" UNIQUE ("practice_id", "code"),
    CONSTRAINT "ck_practitioner_simple_accounts_class" CHECK ("account_class" IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'))
);

CREATE TABLE IF NOT EXISTS "accounting"."practitioner_simple_records" (
    "id" uuid NOT NULL,
    "practice_id" uuid NOT NULL,
    "kind" varchar NOT NULL,
    "record_date" date NOT NULL,
    "account_id" uuid NOT NULL,
    "description" varchar NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_practitioner_simple_records" PRIMARY KEY ("id"),
    CONSTRAINT "ck_practitioner_simple_records_kind" CHECK ("kind" IN ('EXPENSE', 'ASSET', 'DEBT')),
    CONSTRAINT "ck_practitioner_simple_records_amount" CHECK ("amount" > 0)
);

CREATE TABLE IF NOT EXISTS "accounting"."practitioner_simple_transactions" (
    "id" uuid NOT NULL,
    "practice_id" uuid NOT NULL,
    "transaction_date" date NOT NULL,
    "description" varchar NOT NULL,
    "debit_account_id" uuid NOT NULL,
    "credit_account_id" uuid NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_practitioner_simple_transactions" PRIMARY KEY ("id"),
    CONSTRAINT "ck_practitioner_simple_transactions_distinct" CHECK ("debit_account_id" <> "credit_account_id"),
    CONSTRAINT "ck_practitioner_simple_transactions_amount" CHECK ("amount" > 0)
);

DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_records"
        ADD CONSTRAINT "fk_practitioner_simple_records_account_id" FOREIGN KEY ("account_id")
        REFERENCES "accounting"."practitioner_simple_accounts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_transactions"
        ADD CONSTRAINT "fk_practitioner_simple_transactions_debit_account_id" FOREIGN KEY ("debit_account_id")
        REFERENCES "accounting"."practitioner_simple_accounts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_transactions"
        ADD CONSTRAINT "fk_practitioner_simple_transactions_credit_account_id" FOREIGN KEY ("credit_account_id")
        REFERENCES "accounting"."practitioner_simple_accounts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: practice.practices (requiere schema practice)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_accounts"
        ADD CONSTRAINT "fk_practitioner_simple_accounts_practice_id" FOREIGN KEY ("practice_id")
        REFERENCES "practice"."practices" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_accounts"
        ADD CONSTRAINT "fk_practitioner_simple_accounts_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_accounts"
        ADD CONSTRAINT "fk_practitioner_simple_accounts_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: practice.practices (requiere schema practice)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_records"
        ADD CONSTRAINT "fk_practitioner_simple_records_practice_id" FOREIGN KEY ("practice_id")
        REFERENCES "practice"."practices" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_records"
        ADD CONSTRAINT "fk_practitioner_simple_records_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_records"
        ADD CONSTRAINT "fk_practitioner_simple_records_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: practice.practices (requiere schema practice)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_transactions"
        ADD CONSTRAINT "fk_practitioner_simple_transactions_practice_id" FOREIGN KEY ("practice_id")
        REFERENCES "practice"."practices" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_transactions"
        ADD CONSTRAINT "fk_practitioner_simple_transactions_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "accounting"."practitioner_simple_transactions"
        ADD CONSTRAINT "fk_practitioner_simple_transactions_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_accounts_practice_id" ON "accounting"."practitioner_simple_accounts" ("practice_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_accounts_created_by_user_id" ON "accounting"."practitioner_simple_accounts" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_accounts_updated_by_user_id" ON "accounting"."practitioner_simple_accounts" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_records_practice_id" ON "accounting"."practitioner_simple_records" ("practice_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_records_account_id" ON "accounting"."practitioner_simple_records" ("account_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_records_created_by_user_id" ON "accounting"."practitioner_simple_records" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_records_updated_by_user_id" ON "accounting"."practitioner_simple_records" ("updated_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_transactions_practice_id" ON "accounting"."practitioner_simple_transactions" ("practice_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_transactions_debit_account_id" ON "accounting"."practitioner_simple_transactions" ("debit_account_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_transactions_credit_account_id" ON "accounting"."practitioner_simple_transactions" ("credit_account_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_transactions_created_by_user_id" ON "accounting"."practitioner_simple_transactions" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_simple_transactions_updated_by_user_id" ON "accounting"."practitioner_simple_transactions" ("updated_by_user_id");
