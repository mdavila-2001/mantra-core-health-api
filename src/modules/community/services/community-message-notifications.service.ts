import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/infrastructure/repositories';
import { PublicProfilesRepository } from '../repositories';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';

/**
 * Carril P2 · «tenés un mensaje nuevo».
 *
 * Es el enganche de P2 con el contrato de P1, y vive en un servicio aparte por
 * lo mismo que su gemelo de `clinical`: lo que hace falta para avisar —resolver
 * a qué cuenta pertenece un perfil público, redactar el texto, elegir el
 * destino— no tiene nada que ver con guardar un mensaje, y meterlo dentro de
 * `CommunityMessagingService` ensuciaría el caso de uso que sí importa.
 *
 * ## El vínculo perfil → cuenta no existe como tabla
 *
 * `CommunityVisibilityService` ya lo dice: **no hay tabla que ate `iam.users`
 * con `community.public_profiles`**. El vínculo es polimórfico —`target_id` es
 * el perfil profesional (`hpid`) o la propia cuenta (`sub`)—, así que la
 * resolución se hace en ese orden:
 *
 * 1. `target_id` como persona, vía `person_account_links` (cubre el perfil
 *    profesional y el de paciente, que se identifican por su persona);
 * 2. `created_by_user_id`, que cubre el perfil que alguien creó para sí.
 *
 * Si ninguna resuelve, **no se avisa y no se falla**.
 *
 * La vitrina de una **organización** (farmacia o clínica) no la encarna ninguna
 * cuenta: la atiende su personal. A ésa se le avisa a cada miembro activo que
 * atiende la bandeja (`CommunityOrganizationStaffService.attendantUserIds`) y
 * **nunca** a `created_by_user_id`, que en una vitrina proyectada al verificar
 * el tenant es el administrador de plataforma que la verificó.
 *
 * ## No lanza
 *
 * Un fallo al avisar no puede deshacer un mensaje ya guardado. Es la misma
 * promesa del contrato de P1, sostenida en el sitio donde se llama.
 */
@Injectable()
export class CommunityMessageNotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia, para resolver la cuenta destinataria.
   * @param notifications - Emisor in-app (contrato de P1).
   * @param profilesRepo - Perfiles públicos.
   * @param accountLinks - Vínculo entre una persona y su cuenta.
   * @param logger - Logger estructurado.
   * @param organizationStaff - Quién atiende la bandeja de una organización.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
    private readonly organizationStaff: CommunityOrganizationStaffService,
  ) {
    this.logger.setContext(CommunityMessageNotificationsService.name);
  }

  /**
   * Avisa a los demás participantes de un mensaje nuevo.
   *
   * @param conversationId - Hilo donde se envió.
   * @param senderProfileId - Quién escribió; a ése no se le avisa.
   * @param recipientProfileIds - Los demás participantes activos.
   * @param actorUserId - Cuenta que envió.
   */
  async newMessage(
    conversationId: string,
    senderProfileId: string,
    recipientProfileIds: readonly string[],
    // Opcional desde F4.7: la respuesta automática la manda el sistema en
    // nombre de alguien que no tiene sesión abierta, así que no hay usuario
    // que anotar como autor.
    actorUserId: string | undefined,
  ): Promise<void> {
    try {
      const em = this.em.fork();
      const sender = await this.profilesRepo.findById(em, senderProfileId);
      // El nombre de quien escribe es lo único que hace útil el aviso: «Mensaje
      // nuevo» a secas obliga a abrir el hilo para saber si vale la pena.
      const ofWhom = sender?.displayName ?? 'Alguien';

      for (const recipient of recipientProfileIds) {
        for (const recipientUserId of await this.accounts(em, recipient)) {
          // Quien escribió como la organización no se avisa a sí mismo.
          if (recipientUserId === actorUserId) continue;
          await this.notifications.emitInApp({
            recipientUserId,
            category: 'MESSAGES',
            subject: `${ofWhom} le escribió`,
            bodyText: 'Tiene un mensaje nuevo.',
            destination: { type: 'CONVERSATION', id: conversationId },
            // Diez mensajes seguidos en el mismo hilo son un campanazo, no diez.
            // La clave incluye al destinatario: si no, el rebote de uno taparía
            // el aviso del otro en una conversación de tres.
            debounceKey: `conversation:${conversationId}:${recipientUserId}`,
            actorUserId,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        { operation: 'community.message.notify', conversationId, err: error },
        'No se pudo avisar del mensaje nuevo; el mensaje ya quedó guardado',
      );
    }
  }

  /**
   * Las cuentas a avisar por un perfil público: la que lo encarna, o el
   * personal que atiende la bandeja si es la vitrina de una organización.
   * Vacía si nadie lo encarna.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - Perfil público destinatario.
   * @returns Los ids de usuario.
   */
  private async accounts(
    em: EntityManager,
    profileId: string,
  ): Promise<string[]> {
    const profile = await this.profilesRepo.findById(em, profileId);
    if (!profile) return [];

    if (this.organizationStaff.isOrganizationProfile(profile)) {
      return this.organizationStaff.attendantUserIds(em, profile);
    }

    const link = await this.accountLinks.findActiveByPerson(
      em,
      profile.targetId,
    );
    const userId = link?.userId ?? profile.createdByUserId ?? null;
    return userId ? [userId] : [];
  }
}
