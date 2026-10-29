import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';

import { deterministicId, SEED } from '../constants/concepts';
import { runWithTenant } from '../tenant/tenant-context';
import { PublicProfiles } from '../../modules/community/entities';
import { CommunitySocialService } from '../../modules/community/services';

/** Datos de la vitrina de un profesional sembrado. */
export interface PractitionerShowcaseInput {
  /** Cuenta del profesional (`iam.users.id`). */
  userId: string;
  /** Perfil profesional, que es el sujeto de la vitrina. */
  practitionerProfileId: string;
  /** Nombre visible. */
  displayName: string;
  /** Correo de la cuenta; solo deriva el enlace público estable. */
  email: string;
  /** Titular de una línea (ocupación o especialidad), si se conoce. */
  headline?: string;
}

/** `Juan Pérez` → `juan-perez`; vacío si no queda ninguna letra. */
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
 * Crea la vitrina pública de un profesional sembrado, sin iniciar sesión como
 * él.
 *
 * Es el mismo caso de uso que `PUT /community/profiles/me`
 * (`CommunitySocialService.upsertOwnProfile`): el sujeto sale del actor, así que
 * se lo invoca con la identidad del profesional en proceso. Eso reemplaza el
 * login de cada médico que hacían los scripts anteriores.
 *
 * El enlace público es determinista (`<nombre>-<sufijo estable>`), por lo que
 * una organización o un enlace compartido sirven igual en todos los entornos.
 * La presentación dice que la información profesional viene del padrón público y
 * no la verificó el profesional.
 */
@Injectable()
export class PractitionerShowcaseSeed {
  /**
   * @param orm - Acceso al `EntityManager` para comprobar si ya hay vitrina.
   * @param social - Caso de uso de la vitrina propia.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly social: CommunitySocialService,
  ) {}

  /**
   * Deja al profesional con vitrina pública.
   *
   * @returns `true` si la creó en esta pasada; `false` si ya la tenía.
   */
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
}
