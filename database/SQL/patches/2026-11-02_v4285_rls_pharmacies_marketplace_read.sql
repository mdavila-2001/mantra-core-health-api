-- Migration patch: Allow marketplace read of active and verified pharmacies under RLS.
-- Addresses empty pharmacy directory for patients and public endpoints where
-- tenant_isolation limits visibility to own tenant.

BEGIN;

DROP POLICY IF EXISTS pharmacies_marketplace_read ON pharmacy.pharmacies;
CREATE POLICY pharmacies_marketplace_read ON pharmacy.pharmacies
  FOR SELECT
  USING (
    status_concept_id = '7e2446c4-6707-5455-8168-87b28bcfd292'
    AND verification_status_concept_id = '25f8508d-c0eb-5c18-8c0d-7fd4268c8b3c'
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'pharmacy' AND tablename = 'pharmacies'
      AND policyname = 'pharmacies_marketplace_read'
  ) THEN
    RAISE EXCEPTION 'pharmacies_marketplace_read was not created';
  END IF;
END $$;

COMMIT;
