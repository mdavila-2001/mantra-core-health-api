import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DELEG } from '../delegated_access.concepts';
import {
  evaluateJoinerChecklist,
  onboardingGate,
  type ChecklistItem,
} from '../domain';
import { LifecycleRepository, type EngagementRecord } from '../repositories';
import { STATUS } from './concept-maps';
import { JoinerFactsReader } from './lifecycle-joiner-facts';
import { readChecklist } from './lifecycle.service';
import { LifecycleSettingsReader } from './support-lifecycle-settings';

/** Veredicto de la compuerta de ingreso para un vínculo. */
export interface OnboardingVerdict {
  /** Falta algún ítem obligatorio: la política responde `ONBOARDING_INCOMPLETE`. */
  readonly incomplete: boolean;
  /** Códigos de los ítems obligatorios que faltan. */
  readonly pending: readonly string[];
}

const OPEN: OnboardingVerdict = { incomplete: false, pending: [] };

/**
 * Compuerta de ingreso (D-03, §6.1 «Compuerta»): alimenta
 * `EngagementFacts.onboardingIncomplete` de la política. Solo rige para vínculos
 * creados desde `onboardingRequiredSince`; los anteriores no se cortan. Es el
 * camino caliente de cada decisión: un vínculo con `onboarding_completed_at` (o
 * no activo) no cuesta ninguna consulta; el resto lee los ajustes (en caché), el
 * caso de ingreso y los hechos de identidad y dos pasos. El compromiso de
 * confidencialidad sale de la lista guardada: es lo único que no se deduce.
 */
@Injectable()
export class SupportOnboardingGate {
  /**
   * @param lifecycle - Casos de ciclo de vida.
   * @param settings - Ajustes de gobierno de la organización.
   * @param facts - Hechos que la lista deduce sola.
   */
  constructor(
    private readonly lifecycle: LifecycleRepository,
    private readonly settings: LifecycleSettingsReader,
    private readonly facts: JoinerFactsReader,
  ) {}

  /**
   * Veredicto de cada vínculo.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param records - Vínculos de la decisión.
   * @param now - Reloj.
   * @returns Un veredicto por id de vínculo.
   */
  async gatesFor(
    em: EntityManager,
    records: readonly EngagementRecord[],
    now: Date = new Date(),
  ): Promise<Map<string, OnboardingVerdict>> {
    const out = new Map<string, OnboardingVerdict>();
    for (const record of records) {
      out.set(record.assignment.id, await this.gateOf(em, record, now));
    }
    return out;
  }

  private async gateOf(
    em: EntityManager,
    record: EngagementRecord,
    now: Date,
  ): Promise<OnboardingVerdict> {
    const a = record.assignment;
    if (a.statusConceptId !== STATUS.ACTIVE || a.onboardingCompletedAt) {
      return OPEN;
    }
    const settings = await this.settings.forTenant(em, record.tenantId, now);
    const createdAt = a.createdAt ?? now;
    if (!settings.onboardingRequired) return OPEN;
    if (
      settings.onboardingRequiredSince &&
      createdAt.getTime() < settings.onboardingRequiredSince.getTime()
    ) {
      return OPEN;
    }
    const kase = await this.lifecycle.findOpenCase(
      em,
      a.id,
      DELEG.LIFECYCLE_JOINER,
    );
    const ack = kase
      ? readChecklist(kase.checklistJson).find(
          (i) => i.code === 'CONFIDENTIALITY_ACK',
        )
      : undefined;
    const [platformIdentityVerified, mfaEnrolled] = await Promise.all([
      a.identityVerifiedAt
        ? Promise.resolve(true)
        : this.facts.platformIdentityVerified(em, record.userId),
      this.facts.mfaEnrolled(em, record.userId),
    ]);
    const checklist: ChecklistItem[] = evaluateJoinerChecklist({
      now,
      platformIdentityVerified,
      identityVerifiedAt: a.identityVerifiedAt ?? null,
      confidentialityAckAt:
        ack?.status === 'DONE' ? (ack.completedAt ?? now) : null,
      mfaEnrolled,
      requireMfa: settings.requireMfa,
      supervisorUserId: a.supervisorUserId ?? null,
      scopeBlocked: false,
      nextRecertificationAt: a.nextRecertificationAt ?? null,
      doctorAcceptancesPending: 0,
      doctorAcceptancesTotal: 0,
    });
    const gate = onboardingGate({
      settings: {
        onboardingRequired: settings.onboardingRequired,
        onboardingRequiredSince: settings.onboardingRequiredSince,
      },
      engagementCreatedAt: createdAt,
      onboardingCompletedAt: a.onboardingCompletedAt ?? null,
      checklist,
      now,
    });
    return { incomplete: gate.incomplete, pending: gate.pending };
  }
}
