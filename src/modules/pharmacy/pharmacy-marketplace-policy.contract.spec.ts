import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PHARM } from './pharmacy.concepts';

/**
 * The marketplace read policy compares the pharmacy state against concept ids
 * written as literals in the SQL patch. Those ids are derived (UUIDv5 of the
 * concept key), so this spec ties the literals to `PHARM.*`: if the key or the
 * derivation ever changes, the patch has to change with it, or the patient sees
 * no pharmacy at all, which is what the old code-based comparison caused.
 */
const PATCH = join(
  process.cwd(),
  'database/SQL/patches/2026-11-04_farmacias_mercado_por_id.sql',
);

describe('pharmacies_marketplace_read compares by concept id', () => {
  const sql = readFileSync(PATCH, 'utf8');
  const start = sql.indexOf('CREATE POLICY pharmacies_marketplace_read');
  // Only the policy statement, up to its closing `);`.
  const policy = sql.slice(start, sql.indexOf(');', start) + 2);

  it('uses the id of pharmacy:PHARMACY_ACTIVE for the status', () => {
    expect(policy).toContain(
      `status_concept_id = '${PHARM.PHARMACY_ACTIVE}'::uuid`,
    );
  });

  it('uses the id of pharmacy:VERIFICATION_VERIFIED for the verification', () => {
    expect(policy).toContain(
      `verification_status_concept_id = '${PHARM.VERIFICATION_VERIFIED}'::uuid`,
    );
  });

  it('no longer depends on the concept code text', () => {
    expect(policy).not.toMatch(/\bc\.code\b|catalog_concepts c/);
  });
});
