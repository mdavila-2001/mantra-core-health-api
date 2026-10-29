import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch } from '../../../../common';
import {
  HealthPractitionerProfilesRepository,
  PersonAccountLinksRepository,
} from '../../infrastructure/repositories';
import { PROF } from '../../profiles.concepts';
import {
  PUBLIC_VERIFICATION_SEAL_PORT,
  type PublicVerificationSealPort,
} from '../ports/public-verification-seal.port';
import {
  PRACTITIONER_CONTEXT_PORT,
  type PractitionerContextPort,
} from '../ports/practitioner-context.port';

/** Qué cambió en el perfil al proyectar. */
export interface ProjectionResult {
  /** El perfil existe y se proyectó. */
  readonly projected: boolean;
  /** Se concedió (o ya tenía) el rol asistencial. */
  readonly roleGranted: boolean;
}

/**
 * **El único escritor de `PRACT_VERIF_*`** (v4.2.67).
 *
 * El estado de verificación del perfil profesional es una *proyección* de la
 * admisión vigente: la fuente de verdad es `practitioner_admissions` y su
 * bitácora. Antes había tres escritores independientes (la verificación de
 * credenciales CV-20, el efecto de M27 al activar una matrícula y el alta
 * asistida), cada uno con sus propias reglas y ninguno con cuatro ojos; un
 * `SECURITY_ADMIN` verificaba a un médico por la puerta de atrás. Ahora los
 * únicos que llaman a este servicio son los casos de uso de
 * `PractitionerAdmissionsService`, dentro de la misma transacción que la
 * transición de la admisión.
 *
 * Una prueba arquitectónica (`practitioner-verification-single-writer.spec.ts`)
 * falla si cualquier otro archivo asigna `verificationStatusConceptId` de un
 * perfil profesional.
 *
 * Además mantiene el sello público de `community` en sintonía: se concede al
 * verificar, con vencimiento, y se baja al suspender, expirar o rechazar.
 */
@Injectable()
export class PractitionerVerificationProjector {
  constructor(
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    @Inject(PUBLIC_VERIFICATION_SEAL_PORT)
    private readonly seal: PublicVerificationSealPort,
    @Inject(PRACTITIONER_CONTEXT_PORT)
    private readonly practitionerContext: PractitionerContextPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerVerificationProjector.name);
  }

  /**
   * El perfil queda verificado: habilitado para ejercer, aceptando pacientes
   * nuevos, con el rol asistencial y con el sello público hasta `validTo`.
   *
   * @param tx - Transacción de la admisión.
   * @param practitionerProfileId - Perfil profesional.
   * @param actorUserId - Quien resolvió.
   * @param admissionId - Admisión que lo respalda (evidencia del sello).
   * @param validTo - Último instante de vigencia (fin de día en La Paz).
   */
  async projectVerified(
    tx: EntityManager,
    practitionerProfileId: string,
    actorUserId: string,
    admissionId: string,
    validTo: Date,
  ): Promise<ProjectionResult> {
    const practitioner = await this.practitionersRepo.findById(
      tx,
      practitionerProfileId,
    );
    if (!practitioner) return { projected: false, roleGranted: false };

    practitioner.verificationStatusConceptId = PROF.PRACT_VERIF_VERIFIED;
    practitioner.practiceStatusConceptId = PROF.PRACTICE_ACTIVE;
    practitioner.acceptsNewPatients = true;
    touch(practitioner, actorUserId);

    // Habilitado para ejercer y sin rol con el que hacerlo no sirve a nadie. Se
    // concede `PRACTITIONER`; los roles más específicos (cirujano,
    // anestesiólogo…) siguen siendo decisión explícita de un administrador.
    let roleGranted = false;
    const link = await this.accountLinksRepo.findActiveByPerson(
      tx,
      practitionerProfileId,
    );
    if (link) {
      roleGranted = await this.practitionerContext.ensurePractitionerRole(
        tx,
        link.userId,
        actorUserId,
      );
      if (!roleGranted) {
        // No se rompe una verificación correcta, pero tampoco se oculta.
        this.logger.warn(
          {
            operation: 'profiles.admission.project-verified',
            practitionerProfileId,
            roleCode: 'PRACTITIONER',
          },
          'Profesional verificado sin rol asistencial: el rol no existe o no es asignable',
        );
      }
    }

    await this.seal.grant(tx, {
      practitionerProfileId,
      actorUserId,
      evidenceRef: `admission:${admissionId}`,
      validTo,
    });
    return { projected: true, roleGranted };
  }

  /**
   * El perfil deja de estar verificado (suspensión, vencimiento, rechazo,
   * reenvío): vuelve a pendiente, deja de aceptar pacientes nuevos y baja el
   * sello público.
   *
   * @param tx - Transacción de la admisión.
   * @param practitionerProfileId - Perfil profesional.
   * @param actorUserId - Quien lo decidió (o la cuenta de sistema).
   * @param badgeReason - `EXPIRED` si venció por fecha; `REVOKED` en otro caso.
   */
  async projectNotVerified(
    tx: EntityManager,
    practitionerProfileId: string,
    actorUserId: string,
    badgeReason: 'REVOKED' | 'EXPIRED' = 'REVOKED',
  ): Promise<ProjectionResult> {
    const practitioner = await this.practitionersRepo.findById(
      tx,
      practitionerProfileId,
    );
    if (!practitioner) return { projected: false, roleGranted: false };

    if (
      practitioner.verificationStatusConceptId === PROF.PRACT_VERIF_VERIFIED
    ) {
      practitioner.verificationStatusConceptId = PROF.PRACT_VERIF_PENDING;
      practitioner.acceptsNewPatients = false;
      touch(practitioner, actorUserId);
    }
    await this.seal.revoke(tx, practitionerProfileId, actorUserId, badgeReason);
    return { projected: true, roleGranted: false };
  }
}
