import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';

import { deterministicId, SEED } from '../constants/concepts';
import { runWithTenant } from '../tenant/tenant-context';
import { PublicProfiles } from '../../modules/community/entities';
import { CommunitySocialService } from '../../modules/community/services';

/** Showcase metadata for a seeded practitioner profile. */
export interface PractitionerShowcaseInput {
  /** User UUID (`iam.users.id`). */
  userId: string;
  /** Practitioner profile UUID. */
  practitionerProfileId: string;
  /** Presentation display name. */
  displayName: string;
  /** Email used to derive deterministic public slug. */
  email: string;
  /** Optional headline summarizing occupation or specialty. */
  headline?: string;
}

/** Formats text into URL-safe slug, fallback to empty string if no valid characters. */
function slugOf(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Idempotently provisions public showcase profiles for seeded practitioners and patients.
 * Uses deterministic slugs and invokes profile projection services directly.
 */
@Injectable()
export class PractitionerShowcaseSeed {
  constructor(
    private readonly orm: MikroORM,
    private readonly social: CommunitySocialService,
  ) {}

  /** Ensures public showcase exists for practitioner. Returns true if created. */
  async ensure(input: PractitionerShowcaseInput): Promise<boolean> {
    const em = this.orm.em.fork();
    const existing = await em.findOne(PublicProfiles, {
      targetId: input.practitionerProfileId,
    });
    if (existing) return false;

    const suffix = deterministicId(`seed:showcase:${input.email}`).slice(0, 6);
    const slug = `${slugOf(input.displayName) || 'profesional'}-${suffix}`;
    await runWithTenant(SEED.tenantId, () =>
      this.social.upsertOwnProfile(
        {
          tenantId: SEED.tenantId,
          slug,
          displayName: input.displayName.slice(0, 200),
          headline: input.headline?.slice(0, 200),
          biography:
            'Información profesional tomada de un padrón público. ' +
            'No fue verificada por el profesional.',
          acceptsReviews: true,
          visibility: 'PUBLIC',
        },
        {
          id: input.userId,
          roles: ['PRACTITIONER'],
          practitionerProfileId: input.practitionerProfileId,
        },
      ),
    );
    return true;
  }

  /** Ensures public showcase exists for patient messaging. Returns true if created. */
  async ensurePatient(input: {
    userId: string;
    displayName: string;
    email: string;
    headline?: string;
  }): Promise<boolean> {
    const em = this.orm.em.fork();
    const existing = await em.findOne(PublicProfiles, { targetId: input.userId });
    if (existing) return false;

    const suffix = deterministicId(`seed:showcase:${input.email}`).slice(0, 6);
    const slug = `${slugOf(input.displayName) || 'paciente'}-${suffix}`;
    await runWithTenant(SEED.tenantId, () =>
      this.social.upsertOwnProfile(
        {
          tenantId: SEED.tenantId,
          slug,
          displayName: input.displayName.slice(0, 200),
          headline: input.headline?.slice(0, 200) || 'Paciente',
          biography: 'Perfil de paciente en AloVida.',
          acceptsReviews: false,
          visibility: 'PUBLIC',
        },
        { id: input.userId, roles: ['PATIENT'] },
      ),
    );
    return true;
  }
}
