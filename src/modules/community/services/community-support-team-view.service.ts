import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { COMM } from '../community.concepts';
import type { DirectMessages } from '../entities';
import { PublicProfilesRepository } from '../repositories/public-profiles.repository';
import { SupportInboxRepository } from '../repositories/support-inbox.repository';

/** Quién lee la conversación: si es el doctor dueño del perfil, con su perfil profesional. */
export interface TeamViewReader {
  /** Perfil público con el que se lee (ya verificado como propio). */
  readonly profileId: string;
  /** Perfil profesional, solo si quien lee es el doctor. */
  readonly practitionerProfileId?: string;
}

/** Lo que se agrega a un mensaje según quién lo lee. */
export interface TeamMessageView {
  /** El paciente ve «respondido por su equipo»: es lo que el doctor decidió mostrar. */
  readonly repliedByTeam?: true;
  /** Quién escribió de verdad: solo el doctor dueño del perfil lo ve. */
  readonly teamAuthorName?: string;
}

/**
 * Cómo se ve, desde el chat de siempre, lo que respondió el equipo de apoyo en
 * nombre del doctor.
 *
 *  - el **paciente** ve al doctor como remitente y, si el doctor lo dejó visible,
 *    `repliedByTeam`; nunca el nombre de quien escribió;
 *  - el **doctor** dueño del perfil ve además `teamAuthorName`;
 *  - solo el doctor ve `awaitingDoctor` en una conversación que su equipo le derivó.
 *
 * La autora real y el estado de la bandeja jamás salen en la lectura de otra
 * persona ni por websocket: este servicio es el único punto que los agrega.
 */
@Injectable()
export class CommunitySupportTeamViewService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param profiles - Perfiles públicos.
   * @param inbox - Datos de la bandeja (nombres y asignaciones).
   */
  constructor(
    private readonly profiles: PublicProfilesRepository,
    private readonly inbox: SupportInboxRepository,
  ) {}

  /**
   * Resuelve si quien lee con ese perfil es un doctor.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - Perfil público ya verificado como propio.
   * @returns El lector.
   */
  async reader(em: EntityManager, profileId: string): Promise<TeamViewReader> {
    const profile = await this.profiles.findById(em, profileId);
    return profile?.targetTypeConceptId === COMM.PROFILE_TARGET_PRACTITIONER
      ? { profileId, practitionerProfileId: profile.targetId }
      : { profileId };
  }

  /**
   * Marcas de equipo de un conjunto de mensajes para este lector.
   *
   * @param em - Contexto de persistencia.
   * @param reader - Quién lee.
   * @param messages - Mensajes de la página.
   * @returns Mapa `mensaje → marcas`; los mensajes sin marcas no figuran.
   */
  async annotate(
    em: EntityManager,
    reader: TeamViewReader,
    messages: readonly DirectMessages[],
  ): Promise<Map<string, TeamMessageView>> {
    const onBehalf = messages.filter((m) => !!m.onBehalfOfProfileId);
    const out = new Map<string, TeamMessageView>();
    if (onBehalf.length === 0) return out;
    const ownedByReader = (m: DirectMessages): boolean =>
      !!reader.practitionerProfileId &&
      m.onBehalfOfProfileId === reader.practitionerProfileId &&
      !!m.authoredByUserId;
    const authorIds = onBehalf
      .filter(ownedByReader)
      .map((m) => m.authoredByUserId)
      .filter((id): id is string => !!id);
    const names =
      authorIds.length > 0
        ? await this.inbox.userNames(em, authorIds)
        : new Map<string, string>();
    for (const message of onBehalf) {
      const teamAuthorName =
        ownedByReader(message) && message.authoredByUserId
          ? names.get(message.authoredByUserId)
          : undefined;
      const view: TeamMessageView = {
        ...(message.disclosureShown ? { repliedByTeam: true as const } : {}),
        ...(teamAuthorName ? { teamAuthorName } : {}),
      };
      if (view.repliedByTeam || view.teamAuthorName) {
        out.set(message.id, view);
      }
    }
    return out;
  }

  /**
   * Conversaciones que el equipo le derivó al doctor que lee. Para cualquier
   * otro lector no hay ninguna: el paciente no ve el estado de la bandeja.
   *
   * @param em - Contexto de persistencia.
   * @param reader - Quién lee.
   * @param conversationIds - Conversaciones de la bandeja del lector.
   * @returns Ids de las derivadas al doctor.
   */
  async awaitingDoctor(
    em: EntityManager,
    reader: TeamViewReader,
    conversationIds: readonly string[],
  ): Promise<Set<string>> {
    if (!reader.practitionerProfileId || conversationIds.length === 0) {
      return new Set();
    }
    const rows = await this.inbox.findAssignments(em, conversationIds);
    return new Set(
      rows
        .filter(
          (a) =>
            a.practitionerProfileId === reader.practitionerProfileId &&
            a.statusConceptId === COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
        )
        .map((a) => a.conversationId),
    );
  }
}
