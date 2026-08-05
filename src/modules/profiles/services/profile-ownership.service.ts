import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../repositories';

/** Roles de plataforma que administran cualquier perfil. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * Decide si el actor es el titular del perfil sobre el que quiere operar.
 *
 * El autoservicio del profesional estaba roto de una forma concreta y comprobable: para pedir la
 * verificación de su matrícula, `POST /identity/me/practitioner/license-verification` exige un
 * `jurisdictionAuthorizationId`; pero crear esa autorización
 * (`POST /profiles/practitioners/{id}/jurisdiction-authorizations`) exigía el rol **global**
 * `SECURITY_ADMIN`. Un médico que se auto-registraba no podía llegar nunca a verificarse sin que
 * un administrador de la plataforma le creara la fila a mano — el circuito no cerraba.
 *
 * Lo mismo, en menor escala, con la especialidad del profesional y con el familiar responsable de
 * un paciente: datos del propio titular que el titular no podía cargar.
 *
 * El criterio es el mismo que en `TenantAdministrationService` para las organizaciones: quien es
 * dueño de algo lo administra, y la plataforma conserva su llave maestra. Lo que no cambia es que
 * nadie toca el perfil de otro — la comprobación resuelve la persona desde el vínculo activo de
 * la cuenta, no desde un parámetro que el cliente pueda declarar.
 */
@Injectable()
export class ProfileOwnershipService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param accountLinksRepo - Vínculo cuenta ↔ persona, de donde sale el titular real.
   * @param practitionersRepo - Perfiles profesionales.
   * @param patientsRepo - Perfiles de paciente.
   */
  constructor(
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly patientsRepo: PatientProfilesRepository,
  ) {}

  /** `true` si el actor tiene un rol de plataforma. */
  private isPlatform(actor: AuthenticatedUser): boolean {
    const roles = actor.roles ?? [];
    return PLATFORM_ROLES.some((role) => roles.includes(role));
  }

  /**
   * Persona vinculada a la cuenta del actor, o `null` si no tiene ninguna.
   *
   * Se resuelve por el vínculo activo y no por nada que venga en la petición: si el cliente
   * pudiera declarar de qué persona es dueño, la comprobación no comprobaría nada.
   */
  private async personOf(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string | null> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    return link?.personId ?? null;
  }

  /**
   * `true` si ese perfil pertenece a la persona vinculada al actor.
   *
   * `profile_id` es FK a `profiles.persons(id)`: el perfil clínico se identifica por la persona,
   * no por una fila intermedia. La comparación es directa contra la persona que resuelve el
   * vínculo activo de la cuenta — nunca contra algo que venga en la petición, que no probaría nada.
   */
  private async belongsToActor(
    em: EntityManager,
    profilePersonId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const personId = await this.personOf(em, actor);
    return Boolean(personId) && profilePersonId === personId;
  }

  /**
   * Exige que el actor sea el profesional dueño del perfil, o plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Perfil profesional sobre el que se opera.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si no es el titular ni plataforma.
   */
  async assertOwnsPractitionerProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isPlatform(actor)) return;
    const profile = await this.practitionersRepo.findById(em, profileId);
    if (profile && (await this.belongsToActor(em, profile.profileId, actor)))
      return;
    throw new ForbiddenException(
      'Sólo el titular del perfil profesional o la plataforma pueden modificarlo',
    );
  }

  /**
   * Exige que el actor sea el paciente dueño del perfil, o plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Perfil de paciente sobre el que se opera.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si no es el titular ni plataforma.
   */
  async assertOwnsPatientProfile(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isPlatform(actor)) return;
    const profile = await this.patientsRepo.findById(em, profileId);
    if (profile && (await this.belongsToActor(em, profile.profileId, actor)))
      return;
    throw new ForbiddenException(
      'Sólo el titular del perfil o la plataforma pueden modificarlo',
    );
  }
}
