import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  HealthPractitionerProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import { CareRelationshipsRepository } from '../../authz/repositories';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';

/**
 * Política clínica profesional–paciente de las lecturas de `diagnostics` que
 * muestran datos de una persona a quien atiende (DIAG-02).
 *
 * Acotar por tenant no basta: dentro de una organización, un profesional solo
 * debe ver los estudios de los pacientes con quienes tiene un vínculo. El
 * vínculo es una **relación asistencial** (`authz.care_relationships`) ACTIVA,
 * dentro de su ventana `valid_from`/`valid_to` y sin acotar a un propósito
 * distinto — el mismo criterio con el que `clinical` decide la lectura de la
 * historia —. El profesional se resuelve en el servidor (cuenta → persona →
 * perfil profesional), no por el claim `hpid`, que es identificación y no
 * permiso.
 *
 * Sin vínculo responde `404` con el mismo mensaje y `reason` que un paciente
 * inexistente: distinguirlos le diría a un tercero qué personas existen.
 * `SUPERADMIN` global conserva el comodín que ya tiene `RolesGuard`; uno
 * acotado en `scopedRoles` no, porque el paciente no es de ningún tenant.
 */
@Injectable()
export class DiagnosticsPatientAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia; se usa un fork por consulta.
   * @param accountLinksRepo - Vínculo cuenta ↔ persona.
   * @param practitionerProfilesRepo - Perfil profesional de esa persona.
   * @param careRepo - Relaciones asistenciales.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly careRepo: CareRelationshipsRepository,
  ) {}

  /**
   * Exige que el actor pueda ver los datos clínicos del paciente.
   *
   * @param patientProfileId - Paciente cuyos datos se piden.
   * @param actor - Quien lee.
   * @throws ResourceNotFoundException si el actor no tiene vínculo vigente.
   */
  async assertCanReadPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    // Los estudios de una persona no son de ninguna organización: el comodín
    // es del `SUPERADMIN` global; el acotado en `scopedRoles` sigue la regla
    // de quien atiende (#1241).
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) return;

    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const practitioner = link
      ? await this.practitionerProfilesRepo.findById(em, link.personId)
      : null;

    if (practitioner) {
      const now = Date.now();
      const relations = await this.careRepo.findActiveForPractitionerPatient(
        em,
        practitioner.profileId,
        patientProfileId,
      );
      const linked = relations.some(
        (relation) =>
          !relation.purposeConceptId &&
          relation.validFrom.getTime() <= now &&
          (!relation.validTo || relation.validTo.getTime() > now),
      );
      if (linked) return;
    }

    throw new ResourceNotFoundException(
      'Paciente no encontrado',
      undefined,
      DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
    );
  }
}
