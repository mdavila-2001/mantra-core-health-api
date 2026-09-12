import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/repositories';
import { PublicProfilesRepository } from '../repositories';

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
 * Si ninguna resuelve, **no se avisa y no se falla**: hay perfiles públicos de
 * organización que ninguna cuenta encarna, y un mensaje a uno de ellos sigue
 * siendo un mensaje válido que su destinatario verá al abrir su bandeja.
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessageNotificationsService.name);
  }

  /**
   * Avisa a los demás participantes de un mensaje nuevo.
   *
   * @param conversationId - Hilo donde se envió.
   * @param remitenteProfileId - Quién escribió; a ése no se le avisa.
   * @param destinatarioProfileIds - Los demás participantes activos.
   * @param actorUserId - Cuenta que envió.
   */
  async mensajeNuevo(
    conversationId: string,
    remitenteProfileId: string,
    destinatarioProfileIds: readonly string[],
    // Opcional desde F4.7: la respuesta automática la manda el sistema en
    // nombre de alguien que no tiene sesión abierta, así que no hay usuario
    // que anotar como autor.
    actorUserId: string | undefined,
  ): Promise<void> {
    try {
      const em = this.em.fork();
      const remitente = await this.profilesRepo.findById(
        em,
        remitenteProfileId,
      );
      // El nombre de quien escribe es lo único que hace útil el aviso: «Mensaje
      // nuevo» a secas obliga a abrir el hilo para saber si vale la pena.
      const deQuien = remitente?.displayName ?? 'Alguien';

      for (const destinatario of destinatarioProfileIds) {
        const recipientUserId = await this.cuentaDe(em, destinatario);
        if (!recipientUserId) continue;

        await this.notifications.emitInApp({
          recipientUserId,
          category: 'MESSAGES',
          subject: `${deQuien} te escribió`,
          bodyText: 'Tenés un mensaje nuevo.',
          destination: { type: 'CONVERSATION', id: conversationId },
          // Diez mensajes seguidos en el mismo hilo son un campanazo, no diez.
          // La clave incluye al destinatario: si no, el rebote de uno taparía
          // el aviso del otro en una conversación de tres.
          debounceKey: `conversation:${conversationId}:${recipientUserId}`,
          actorUserId,
        });
      }
    } catch (error) {
      this.logger.error(
        { operation: 'community.message.notify', conversationId, err: error },
        'No se pudo avisar del mensaje nuevo; el mensaje ya quedó guardado',
      );
    }
  }

  /**
   * La cuenta que encarna un perfil público, o `null` si ninguna lo encarna.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - Perfil público destinatario.
   * @returns El id de usuario, o `null`.
   */
  private async cuentaDe(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const profile = await this.profilesRepo.findById(em, profileId);
    if (!profile) return null;

    const link = await this.accountLinks.findActiveByPerson(
      em,
      profile.targetId,
    );
    return link?.userId ?? profile.createdByUserId ?? null;
  }
}
