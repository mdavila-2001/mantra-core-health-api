import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { Persons } from '../../profiles/entities';
import { AUTHZ } from '../authz.concepts';
import {
  CareRelationshipsRepository,
  ClinicalAccessGrantsRepository,
} from '../repositories';
import { AuthzCareRelationshipsService } from './authz-care-relationships.service';
import { AuthzClinicalService } from './authz-clinical.service';
import type {
  AccessState,
  AuthzStatusResultDto,
  MyCareRelationshipDto,
  MyClinicalAccessGrantDto,
  MyClinicalAccessResponseDto,
} from '../dto';

/**
 * «Quién ve mi historia» (BR-20): el titular lista quién tiene acceso a su
 * historia y lo revoca.
 *
 * ## Titularidad
 *
 * La persona sale de la cuenta (`person_account_links`), nunca de un id del
 * cuerpo. Revocar la relación o el acceso de otro paciente es **404**: no se
 * revela que existe. La revocación reutiliza los casos de uso de siempre
 * (`revokeCareRelationship`, `revokeClinicalAccess`), que cambian el estado y
 * cierran la vigencia sin borrar la fila y dejan la traza de auditoría; lo que
 * cambia acá es *quién* puede pedirlas y sobre qué.
 */
@Injectable()
export class AuthzMeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param accountLinksRepo - Vínculo cuenta↔persona.
   * @param patientProfilesRepo - Perfil de paciente de la persona.
   * @param careRepo - Relaciones asistenciales.
   * @param grantsRepo - Accesos clínicos.
   * @param careService - Caso de uso de revocación de la relación.
   * @param clinicalService - Caso de uso de revocación del acceso.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly careRepo: CareRelationshipsRepository,
    private readonly grantsRepo: ClinicalAccessGrantsRepository,
    private readonly careService: AuthzCareRelationshipsService,
    private readonly clinicalService: AuthzClinicalService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzMeService.name);
  }

  /**
   * Relaciones asistenciales y accesos clínicos sobre la historia del titular.
   *
   * @param actor - Usuario autenticado (el paciente).
   * @returns Las dos listas; vacías si la cuenta no tiene perfil de paciente.
   */
  async listMyAccess(
    actor: AuthenticatedUser,
  ): Promise<MyClinicalAccessResponseDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) return { careRelationships: [], grants: [] };

    const now = new Date();
    const [relations, grants] = await Promise.all([
      this.careRepo.findAllByPatient(em, patientProfileId),
      this.grantsRepo.findAllByPatient(em, patientProfileId),
    ]);

    const practitionerNames = await this.namesByPersonId(
      em,
      relations.map((row) => row.practitionerProfileId),
    );
    const careRelationships: MyCareRelationshipDto[] = relations.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      practitionerProfileId: row.practitionerProfileId,
      practitionerName: practitionerNames.get(row.practitionerProfileId),
      state: this.state(row.statusConceptId, row.validTo, now),
      validFrom: row.validFrom,
      validTo: row.validTo,
      purposeConceptId: row.purposeConceptId,
    }));

    const grantedNames = await this.namesByUserId(
      em,
      grants.map((row) => row.grantedUserId),
    );
    const mappedGrants: MyClinicalAccessGrantDto[] = grants.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      grantedUserId: row.grantedUserId,
      grantedName: grantedNames.get(row.grantedUserId),
      isEmergency: row.reasonConceptId === AUTHZ.PURPOSE_EMERGENCY,
      state: this.state(row.stateConceptId, row.validTo, now),
      validFrom: row.validFrom,
      validTo: row.validTo,
      reasonConceptId: row.reasonConceptId,
      accessLevelConceptId: row.accessLevelConceptId,
    }));

    return { careRelationships, grants: mappedGrants };
  }

  /**
   * Revoca una relación asistencial propia.
   *
   * @param actor - Usuario autenticado (el titular).
   * @param relationshipId - Relación a revocar.
   * @returns `{ ok, affected }` del caso de uso.
   * @throws ResourceNotFoundException (404) si no existe o es de otro paciente.
   */
  async revokeMyCareRelationship(
    actor: AuthenticatedUser,
    relationshipId: string,
  ): Promise<AuthzStatusResultDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    const relation = patientProfileId
      ? await this.careRepo.findById(em, relationshipId)
      : null;
    if (!relation || relation.patientProfileId !== patientProfileId) {
      this.logDenied(
        'authz.me.care-relationship.revoke.denied',
        relationshipId,
      );
      throw new ResourceNotFoundException(
        'Relación asistencial no encontrada',
        { id: relationshipId },
      );
    }
    if (relation.statusConceptId === CONCEPTS.STATE_PENDING) {
      // Una solicitud pendiente se responde (rechaza), no se revoca.
      throw new PreconditionFailedException(
        'La solicitud sigue pendiente: respóndala en lugar de revocarla',
        { id: relationshipId },
      );
    }
    return this.careService.revokeCareRelationship(relationshipId, actor);
  }

  /**
   * Revoca un acceso clínico propio (incluido uno de emergencia).
   *
   * @param actor - Usuario autenticado (el titular).
   * @param grantId - Acceso a revocar.
   * @returns `{ ok, affected }` del caso de uso.
   * @throws ResourceNotFoundException (404) si no existe o es de otro paciente.
   */
  async revokeMyClinicalGrant(
    actor: AuthenticatedUser,
    grantId: string,
  ): Promise<AuthzStatusResultDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    const grant = patientProfileId
      ? await this.grantsRepo.findById(em, grantId)
      : null;
    if (!grant || grant.patientProfileId !== patientProfileId) {
      this.logDenied('authz.me.clinical-grant.revoke.denied', grantId);
      throw new ResourceNotFoundException('Acceso clínico no encontrado', {
        grantId,
      });
    }
    return this.clinicalService.revokeClinicalAccess(grantId, actor);
  }

  /**
   * Estado legible con la vigencia ya considerada.
   *
   * @param statusConceptId - Concepto de estado guardado.
   * @param validTo - Fin de vigencia, si tiene.
   * @param now - Instante de la consulta.
   * @returns El estado legible.
   */
  private state(
    statusConceptId: string,
    validTo: Date | undefined,
    now: Date,
  ): AccessState {
    if (statusConceptId === CONCEPTS.STATE_REVOKED) return 'REVOKED';
    if (statusConceptId === CONCEPTS.STATE_EXPIRED) return 'EXPIRED';
    if (statusConceptId === CONCEPTS.STATE_ACTIVE) {
      return validTo !== undefined && validTo <= now ? 'EXPIRED' : 'ACTIVE';
    }
    return 'OTHER';
  }

  /**
   * Perfil de paciente del titular.
   *
   * @param em - Contexto de persistencia.
   * @param actor - Usuario autenticado.
   * @returns El `patient_profile_id`, o `undefined` si no hay.
   */
  private async ownPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return undefined;
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    return patient?.profileId;
  }

  /**
   * Nombre a mostrar de cada persona.
   *
   * @param em - Contexto de persistencia.
   * @param personIds - Personas a resolver.
   * @returns Mapa `personId -> nombre`.
   */
  private async namesByPersonId(
    em: EntityManager,
    personIds: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(personIds)];
    if (unique.length === 0) return new Map();
    const rows = await em.find(Persons, { id: { $in: unique } });
    return new Map(
      rows.flatMap((row) => {
        const name =
          row.displayName ?? [row.name, row.lastName].filter(Boolean).join(' ');
        return name ? [[row.id, name] as const] : [];
      }),
    );
  }

  /**
   * Nombre a mostrar de cada usuario, por su persona vinculada.
   *
   * @param em - Contexto de persistencia.
   * @param userIds - Usuarios a resolver.
   * @returns Mapa `userId -> nombre`.
   */
  private async namesByUserId(
    em: EntityManager,
    userIds: string[],
  ): Promise<Map<string, string>> {
    const byUser = new Map<string, string>();
    for (const userId of new Set(userIds)) {
      const link = await this.accountLinksRepo.findActiveByUser(em, userId);
      if (link) byUser.set(userId, link.personId);
    }
    const names = await this.namesByPersonId(em, [...byUser.values()]);
    return new Map(
      [...byUser].flatMap(([userId, personId]) => {
        const name = names.get(personId);
        return name ? [[userId, name] as const] : [];
      }),
    );
  }

  /**
   * Deja constancia de un intento sobre lo de otro; no es ruido.
   *
   * @param operation - Operación denegada.
   * @param id - Identificador pedido.
   */
  private logDenied(operation: string, id: string): void {
    this.logger.warn({ operation, id }, 'Intento sobre un acceso ajeno');
  }
}
