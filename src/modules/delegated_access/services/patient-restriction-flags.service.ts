import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  PATIENT_RESTRICTION_FLAGS,
  type PatientRestrictionFlagCode,
  type PatientRestrictionFlagsResponseDto,
  type PutRestrictionFlagsDto,
} from '../dto';
import type { PatientRestrictionFlags } from '../entities';
import {
  AccessDecisionLogRepository,
  PatientRestrictionFlagsRepository,
  isPatientLinkedToTenant,
} from '../repositories';
import { sha256Hex } from '../domain';
import { DelegationScopeService } from './delegation-scope.service';
import { mapGovernanceDbError } from './governance-db-errors';
import { governanceError } from './governance-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';

const CONCEPT_BY_FLAG: Readonly<Record<PatientRestrictionFlagCode, string>> = {
  VIP: DELEG.PATIENT_FLAG_VIP,
  CONFIDENTIAL: DELEG.PATIENT_FLAG_CONFIDENTIAL,
  STAFF_RELATIVE: DELEG.PATIENT_FLAG_STAFF_RELATIVE,
  PROTECTED: DELEG.PATIENT_FLAG_PROTECTED,
};

const REASON_MIN = 10;

/**
 * Banderas que restringen a un paciente ante el personal de apoyo (`VIP`,
 * `CONFIDENTIAL`, `STAFF_RELATIVE`, `PROTECTED`; CONTRATO-GOBIERNO §3.4 y H16).
 * Las condiciones `patients.exclude` / `patients.flags` las leen en cada decisión.
 *
 * Lo escribe `SECURITY_ADMIN` o el doctor del paciente (solo su equipo
 * asistencial; un paciente ajeno responde 404 uniforme). `PUT` reemplaza el
 * conjunto: lo que no viene se retira (nunca se borra) y lo cambiado se retira y
 * se vuelve a crear, para conservar el historial.
 */
@Injectable()
export class PatientRestrictionFlagsService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Banderas de pacientes.
   * @param scope - Organización activa verificada.
   * @param stepUp - Paso extra (segundo factor reciente) para retirar o aflojar una restricción.
   * @param decisionLog - Bitácora WORM: deja constancia (código, largo y huella del motivo) de cada retiro.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PatientRestrictionFlagsRepository,
    private readonly scope: DelegationScopeService,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly decisionLog: AccessDecisionLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientRestrictionFlagsService.name);
  }

  /**
   * Banderas vigentes de un paciente.
   *
   * @param patientProfileId - Paciente.
   * @param actor - Quien consulta.
   * @returns Las banderas activas.
   */
  async get(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<PatientRestrictionFlagsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    await this.assertAccess(tx, tenantId, patientProfileId, actor);
    return this.view(
      patientProfileId,
      await this.activeRows(tx, tenantId, patientProfileId),
    );
  }

  /**
   * Reemplaza el conjunto de banderas del paciente.
   *
   * @param patientProfileId - Paciente.
   * @param dto - Banderas con su motivo y fin.
   * @param actor - Quien las fija.
   * @returns Las banderas resultantes.
   */
  async put(
    patientProfileId: string,
    dto: PutRestrictionFlagsDto,
    actor: AuthenticatedUser,
  ): Promise<PatientRestrictionFlagsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    this.validate(dto);
    this.logger.info(
      {
        operation: 'delegated_access.patient_flags.put',
        tenantId,
        actorId: actor.id,
        count: dto.flags.length,
      },
      'Replacing patient restriction flags',
    );
    return this.em.transactional(async (tx) => {
      await this.assertAccess(tx, tenantId, patientProfileId, actor);
      const now = new Date();
      const wanted = new Map(dto.flags.map((f) => [f.flag, f]));
      const toCreate: typeof dto.flags = [];
      let revoked = 0;
      // B-B9: retirar o aflojar una restricción es más grave que ponerla.
      const current = new Map<
        PatientRestrictionFlagCode,
        PatientRestrictionFlags | null
      >();
      const loosened: PatientRestrictionFlagCode[] = [];
      for (const code of PATIENT_RESTRICTION_FLAGS) {
        const found = await this.repo.findActive(
          tx,
          tenantId,
          patientProfileId,
          CONCEPT_BY_FLAG[code],
        );
        current.set(code, found);
        const wish = wanted.get(code);
        if (found && (!wish || this.loosens(found, wish))) loosened.push(code);
      }
      if (loosened.length > 0) {
        await this.authorizeLoosening(
          tx,
          tenantId,
          patientProfileId,
          actor,
          dto.removalReason,
          loosened,
          now,
        );
      }
      for (const code of PATIENT_RESTRICTION_FLAGS) {
        const existing = current.get(code) ?? null;
        const next = wanted.get(code);
        if (!next) {
          if (existing) {
            this.repo.revoke(existing, actor.id, now);
            revoked += 1;
          }
          continue;
        }
        const sameEnd =
          (existing?.validTo?.getTime() ?? null) ===
          (next.validTo ? new Date(next.validTo).getTime() : null);
        if (existing && existing.reasonText === next.reason.trim() && sameEnd)
          continue;
        if (existing) {
          this.repo.revoke(existing, actor.id, now);
          revoked += 1;
        }
        toCreate.push(next);
      }
      // Primero se retira lo cambiado: el índice único admite una vigente por bandera.
      if (revoked > 0) await this.flush(tx);
      for (const next of toCreate) {
        this.repo.create(tx, {
          tenantId,
          patientProfileId,
          flagConceptId: CONCEPT_BY_FLAG[next.flag],
          reasonText: next.reason.trim(),
          validFrom: now,
          validTo: next.validTo ? new Date(next.validTo) : undefined,
          actorUserId: actor.id,
        });
      }
      if (toCreate.length > 0 || revoked === 0) await this.flush(tx);
      return this.view(
        patientProfileId,
        await this.activeRows(tx, tenantId, patientProfileId),
      );
    });
  }

  /**
   * ¿El cambio AFLOJA la restricción? Acortar su fin (o ponérselo a una que no lo
   * tenía) la afloja; alargarla o quitarle el fin la endurece. Retirarla del todo
   * se decide fuera, con `!wish`.
   */
  private loosens(
    existing: PatientRestrictionFlags,
    wish: { validTo?: string },
  ): boolean {
    if (!wish.validTo) return false;
    if (!existing.validTo) return true;
    return new Date(wish.validTo).getTime() < existing.validTo.getTime();
  }

  /**
   * B-B9: retirar o aflojar banderas (que pueden haber puesto otras personas, p. ej.
   * la administración) exige, en este orden: ser `SECURITY_ADMIN` de la organización
   * o el doctor TITULAR del paciente (no cualquiera del equipo); un motivo (≥ 10
   * caracteres); y un paso extra reciente. Lo hecho queda en la bitácora WORM con el
   * código, el largo y la huella del motivo, nunca el texto (puede traer datos del
   * paciente).
   */
  private async authorizeLoosening(
    tx: EntityManager,
    tenantId: string,
    patientProfileId: string,
    actor: AuthenticatedUser,
    removalReason: string | undefined,
    flags: readonly PatientRestrictionFlagCode[],
    now: Date,
  ): Promise<void> {
    const admin =
      roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined);
    if (
      !admin &&
      !(await this.isHolderDoctor(tx, tenantId, patientProfileId, actor))
    ) {
      throw governanceError(
        Reason.RESTRICTION_FLAG_REMOVAL_FORBIDDEN,
        'Solo el doctor titular del paciente o la administración de seguridad pueden retirar o aflojar una restricción.',
      );
    }
    const reason = (removalReason ?? '').trim();
    if (reason.length < REASON_MIN) {
      throw governanceError(
        Reason.RESTRICTION_FLAG_INVALID,
        `Para retirar o aflojar una restricción escriba el motivo (al menos ${REASON_MIN} caracteres, sin datos clínicos).`,
      );
    }
    await this.stepUp.assertFresh(tx, actor);
    await this.decisionLog.appendNow(tx, {
      tenantId,
      userId: actor.id,
      permissionCode: 'patients.restriction_flags.remove',
      effectConceptId: DELEG.DECISION_EFFECT_PERMIT,
      reasonCode: 'PATIENT_RESTRICTION_FLAG_REMOVED',
      patientProfileId,
      detail: {
        flags: [...flags],
        // El motivo es texto libre: el asiento guarda solo su largo y su huella.
        reasonLength: reason.length,
        reasonSha256: sha256Hex(reason),
      },
      recordedAt: now,
      recordedByUserId: actor.id,
    });
  }

  /** El doctor TITULAR: su médico principal vigente que además tiene un rol en ESTA organización. */
  private async isHolderDoctor(
    tx: EntityManager,
    tenantId: string,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (!actor.practitionerProfileId) return false;
    const rows = await tx.execute<{ ok: number }[]>(
      `select 1 as ok from profiles.patient_primary_practitioners m
        where m.patient_profile_id = ? and m.practitioner_profile_id = ?
          and m.valid_from <= now() and (m.valid_to is null or m.valid_to > now())
          and exists (select 1 from practice.practitioner_role_assignments r
                        join practice.practices p on p.id = r.practice_id
                       where r.practitioner_profile_id = m.practitioner_profile_id
                         and p.tenant_id = ?
                         and r.status_concept_id = ?
                         and (r.valid_to is null or r.valid_to > now()))
        limit 1`,
      [
        patientProfileId,
        actor.practitionerProfileId,
        tenantId,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    return rows.length > 0;
  }

  private validate(dto: PutRestrictionFlagsDto): void {
    const seen = new Set<string>();
    const now = Date.now();
    for (const flag of dto.flags) {
      const invalid = (message: string): never => {
        throw governanceError(Reason.RESTRICTION_FLAG_INVALID, message, {
          flag: flag.flag,
        });
      };
      if (seen.has(flag.flag)) invalid('Una bandera no puede repetirse.');
      seen.add(flag.flag);
      if ((flag.reason ?? '').trim().length < REASON_MIN) {
        invalid(`El motivo debe tener al menos ${REASON_MIN} caracteres.`);
      }
      if (flag.validTo && new Date(flag.validTo).getTime() <= now) {
        invalid('El fin de la restricción debe ser una fecha futura.');
      }
    }
  }

  /** Banderas con estado activo del paciente (una consulta por bandera, son cuatro). */
  private async activeRows(
    tx: EntityManager,
    tenantId: string,
    patientProfileId: string,
  ): Promise<PatientRestrictionFlags[]> {
    const rows: PatientRestrictionFlags[] = [];
    for (const code of PATIENT_RESTRICTION_FLAGS) {
      const row = await this.repo.findActive(
        tx,
        tenantId,
        patientProfileId,
        CONCEPT_BY_FLAG[code],
      );
      if (row && row.statusConceptId === CONCEPTS.STATE_ACTIVE) rows.push(row);
    }
    return rows;
  }

  private view(
    patientProfileId: string,
    rows: readonly PatientRestrictionFlags[],
  ): PatientRestrictionFlagsResponseDto {
    const codeOf = new Map(
      Object.entries(CONCEPT_BY_FLAG).map(([code, id]) => [
        id,
        code as PatientRestrictionFlagCode,
      ]),
    );
    return {
      patientProfileId,
      flags: rows
        .map((row) => ({
          flag: codeOf.get(row.flagConceptId) as PatientRestrictionFlagCode,
          reason: row.reasonText,
          validFrom: row.validFrom,
          ...(row.validTo ? { validTo: row.validTo } : {}),
        }))
        .filter((f) => !!f.flag),
    };
  }

  /**
   * El paciente existe y quien llama es administración o el doctor de su equipo;
   * si no, 404 uniforme. SEG A-M6: la administración tampoco entra a ciegas a
   * cualquier UUID: el paciente tiene que tener relación con ESTA organización
   * (cita, representación, equipo asistencial, banderas previas o registrado por
   * su personal). Antes `SECURITY_ADMIN` de cualquier organización distinguía
   * «existe» (200) de «no existe» (404): un oráculo de UUID de pacientes.
   */
  private async assertAccess(
    tx: EntityManager,
    tenantId: string,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const exists = await tx.execute<{ ok: number }[]>(
      'select 1 as ok from profiles.patient_profiles where profile_id = ? limit 1',
      [patientProfileId],
    );
    if (exists.length === 0) throw this.notFound();
    // La administración de plataforma opera entre organizaciones por oficio.
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) return;
    if (roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId)) {
      if (!(await isPatientLinkedToTenant(tx, tenantId, patientProfileId))) {
        throw this.notFound();
      }
      return;
    }
    if (!actor.practitionerProfileId) throw this.notFound();
    const team = await tx.execute<{ ok: number }[]>(
      `select 1 as ok from (
         select r.practitioner_profile_id from authz.care_relationships r
          where r.tenant_id = ? and r.patient_profile_id = ? and r.practitioner_profile_id = ?
            and r.status_concept_id = ? and r.valid_from <= now()
            and (r.valid_to is null or r.valid_to > now())
         union
         select m.practitioner_profile_id from profiles.patient_primary_practitioners m
          where m.patient_profile_id = ? and m.practitioner_profile_id = ?
            and m.valid_from <= now() and (m.valid_to is null or m.valid_to > now())
       ) x limit 1`,
      [
        tenantId,
        patientProfileId,
        actor.practitionerProfileId,
        CONCEPTS.STATE_ACTIVE,
        patientProfileId,
        actor.practitionerProfileId,
      ],
    );
    if (team.length === 0) throw this.notFound();
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Paciente no encontrado',
      undefined,
      Reason.DELEGATED_PATIENT_NOT_FOUND,
    );
  }

  private async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (err) {
      throw mapGovernanceDbError(err) ?? err;
    }
  }
}
