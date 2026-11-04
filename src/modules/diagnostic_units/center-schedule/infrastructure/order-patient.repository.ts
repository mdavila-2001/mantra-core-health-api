import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import {
  PatientProfiles,
  PersonAccountLinks,
} from '../../../profiles/entities';
import { PROF } from '../../../profiles/profiles.concepts';
import { CLIN } from '../../../clinical/clinical.concepts';
import {
  DIAG,
  DIAGNOSTIC_CATEGORIES,
} from '../../../diagnostics/diagnostics.concepts';

export interface OrderRow {
  id: string;
  patient_profile_id: string;
  code_concept_id: string;
  category_concept_id: string | null;
  modality_concept_id: string | null;
  /** Center the order was routed to; only that center can work it. */
  performer_tenant_id: string | null;
  code_display: string | null;
  code_code: string | null;
}

/**
 * Who the session's patient is and the orders it may book. Kept here, with the
 * entities instead of `ProfilesModule`, because `profiles → directory →
 * diagnostic_units` would close an import cycle.
 */
@Injectable()
export class OrderPatientRepository {
  /**
   * The session holder's patient profile, resolved exactly as
   * `DiagnosticsPatientResultsService` does (account → person → patient).
   */
  async ownPatientProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const link = await em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) return null;
    const patient = await em.findOne(PatientProfiles, {
      profileId: link.personId,
    });
    return patient?.profileId ?? null;
  }

  /**
   * An active laboratory or imaging order, with its study's terminology.
   * Revoked, completed or on-hold orders cannot be booked.
   */
  async findDiagnosticOrder(
    em: EntityManager,
    orderId: string,
  ): Promise<OrderRow | null> {
    const [row] = await em.execute<OrderRow[]>(
      `SELECT sr.id, sr.patient_profile_id, sr.code_concept_id, sr.category_concept_id,
              sr.modality_concept_id, sr.performer_tenant_id, c.display AS code_display, c.code AS code_code
         FROM clinical.service_requests sr
         LEFT JOIN terminology.catalog_concepts c ON c.id = sr.code_concept_id
        WHERE sr.id = ? AND sr.category_concept_id = ANY(?::uuid[])
          AND sr.status_concept_id = ?`,
      [
        orderId,
        `{${DIAGNOSTIC_CATEGORIES.join(',')}}`,
        CLIN.SERVICE_REQUEST_ACTIVE,
      ],
      'all',
    );
    return row ?? null;
  }

  /** Serializes bookings of one order across centers. */
  async lockOrder(em: EntityManager, orderId: string): Promise<void> {
    await em.execute(
      'SELECT id FROM clinical.service_requests WHERE id = ? FOR UPDATE',
      [orderId],
    );
  }

  /** Whether the order already has a result released to the patient. */
  async hasReleasedResult(
    em: EntityManager,
    orderId: string,
  ): Promise<boolean> {
    const [row] = await em.execute<{ released: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
           FROM clinical.diagnostic_reports r
           JOIN diagnostics.diagnostic_report_versions v ON v.diagnostic_report_id = r.id
           JOIN LATERAL (
             SELECT e.patient_visibility_concept_id
               FROM diagnostics.diagnostic_release_events e
              WHERE e.diagnostic_report_version_id = v.id
              ORDER BY e.recorded_at DESC LIMIT 1) last ON true
          WHERE r.service_request_id = ? AND last.patient_visibility_concept_id = ?
       ) AS released`,
      [orderId, DIAG.VISIBILITY_PATIENT_VISIBLE],
      'all',
    );
    return row?.released === true;
  }

  /** The patient's preferred current address coordinates, if any. */
  async homeOf(
    em: EntityManager,
    personId: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const [row] = await em.execute<
      { latitude: string | null; longitude: string | null }[]
    >(
      `SELECT latitude::text AS latitude, longitude::text AS longitude
         FROM common.addresses
        WHERE owner_type_concept_id = ? AND owner_id = ?
          AND (valid_to IS NULL OR valid_to >= current_date)
          AND latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY is_preferred DESC NULLS LAST, created_at DESC
        LIMIT 1`,
      [CONCEPTS.OWNER_PERSON, personId],
      'all',
    );
    if (!row?.latitude || !row.longitude) return null;
    return { lat: Number(row.latitude), lng: Number(row.longitude) };
  }
}
