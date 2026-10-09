import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  CATALOG_ADMIN_ROLES,
  canonicalRefType,
} from '../../../domain/catalog/catalog-concepts';
import { CreateResourceDto } from '../../../presentation/dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PractitionerAffiliationGateService } from '../../affiliation/practitioner-affiliation-gate.service';

/**
 * Quién puede administrar qué en el catálogo de agenda: crear recursos, tocar un
 * recurso ajeno o una organización ajena, y el vínculo con la organización.
 */
@Injectable()
export class CatalogAccess {
  constructor(
    private readonly affiliations: PractitionerAffiliationGateService,
  ) {}

  /** Días del rango que caen en el día de la semana de la regla. */
  /** Si el actor administra agendas ajenas por oficio. */
  isCatalogAdmin(actor: AuthenticatedUser): boolean {
    return actor.roles.some((role) => CATALOG_ADMIN_ROLES.includes(role));
  }

  assertMayCreateResource(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): void {
    if (this.isCatalogAdmin(actor)) return;

    const isOwnProfile =
      dto.resourceType === 'PRACTITIONER' &&
      PRACTITIONER_PROFILE_TABLES.includes(
        canonicalRefType(dto.resourceRefType),
      ) &&
      actor.practitionerProfileId !== undefined &&
      dto.resourceRefId === actor.practitionerProfileId;
    if (!isOwnProfile) {
      throw new ForbiddenException(
        'Un profesional solo puede publicar su propia agenda: el recurso debe ' +
          'apuntar a su perfil profesional.',
      );
    }
    this.assertActorTenant(dto.tenantId, actor);
  }

  async assertAffiliationWithOrganization(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isCatalogAdmin(actor)) return;

    const verdict = await this.affiliations.evaluate(tenantId, actor);

    // `ausente` NO es una negativa: significa que nadie dijo nada sobre esta
    // organización. Quien llega hasta acá ya pasó el aislamiento de tenant, o
    // sea que la organización es suya — y la membresía ya lo autorizó.
    //
    // Tratarlo como negativa era un defecto con consecuencia visible: un médico
    // que declaraba trabajar en un hospital perdía la capacidad de publicar en
    // **su propio consultorio**, porque su único vínculo con sede apuntaba a
    // otra organización. Se encontró ejecutándolo, no leyéndolo.
    if (
      verdict === 'sin-vinculos' ||
      verdict === 'aprobado' ||
      verdict === 'ausente'
    ) {
      return;
    }

    throw new PreconditionFailedException(
      verdict === 'pendiente'
        ? 'Su vínculo con esta organización todavía está pendiente de ' +
            'aprobación. Cuando la acepten va a poder publicar su agenda acá.'
        : 'Su vínculo con esta organización no está vigente, así que no puede ' +
            'publicar agenda acá. Hable con ellos para reactivarlo.',
      { tenantId, vinculo: verdict },
    );
  }

  /**
   * Si el actor administra este recurso. Es {@link assertActorResource} sin
   * lanzar, para los casos en que «no» no es un error sino menos detalle.
   */
  mayAdministerResource(
    resource: { resourceRefType: string; resourceRefId: string },
    actor: AuthenticatedUser,
  ): boolean {
    try {
      this.assertActorResource(resource, actor);
      return true;
    } catch {
      return false;
    }
  }

  assertActorResource(
    resource: { resourceRefType: string; resourceRefId: string },
    actor: AuthenticatedUser,
  ): void {
    if (this.isCatalogAdmin(actor)) return;

    const isOwnAgenda =
      actor.practitionerProfileId !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);
    if (!isOwnAgenda) {
      throw new ForbiddenException(
        'Esta agenda es de otro profesional: solo la administra quien atiende ' +
          'en ella.',
      );
    }
  }

  /**
   * El tenant del payload tiene que ser uno del actor.
   *
   * Para un administrador no aplica (opera cualquier tenant); para el
   * autoservicio evita dos males: publicar en un tenant ajeno, y publicarse en
   * uno del que no es miembro — donde su agenda existiría pero jamás se
   * listaría, que es una forma silenciosa de no existir.
   */
  assertActorTenant(tenantId: string, actor: AuthenticatedUser): void {
    if (this.isCatalogAdmin(actor)) return;
    if (!actor.tenantIds?.includes(tenantId)) {
      throw new ForbiddenException(
        'El tenant indicado no es uno de los del actor.',
      );
    }
  }
}
