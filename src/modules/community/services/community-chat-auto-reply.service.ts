import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS, touch, type AuthenticatedUser } from '../../../common';
// Directo y no por el barrel: mismo ciclo barrel↔barrel que documenta
// `community-messaging.service.ts`.
import { CommunityVisibilityService } from './community-visibility.service';
import { ChatAutoReplies, ConversationParticipants } from '../entities';
import type { ChatAutoReplyDto, UpsertChatAutoReplyDto } from '../dto';

/**
 * La respuesta automática por inactividad (F4.7).
 *
 * ## Qué resuelve
 *
 * «Si alguien me escribe y hace N minutos que no aparezco, contestale esto —y
 * no más de una vez cada M horas por conversación.» Es lo que pidió el
 * propietario, y hasta ahora sólo existía en el navegador
 * (`ChatAutoReply` del frontend, sobre `localStorage`), con un límite que no se
 * podía disimular: **no salía con la aplicación cerrada**.
 *
 * ## Por qué la decisión vive acá y no en el cliente
 *
 * Porque el mensaje entrante llega al servidor aunque el titular no tenga
 * ninguna pestaña abierta. Un contestador que exige tener el navegador abierto
 * no es un contestador; es un recordatorio.
 *
 * ## Qué NO hace
 *
 * No manda el mensaje: devuelve **el texto a mandar, o `null`**. Quien lo manda
 * es `CommunityMessagingService`, por el mismo camino que cualquier otro
 * mensaje del perfil — la respuesta automática es un mensaje normal, no una
 * clase aparte, y la otra persona tiene que poder contestarla.
 */
@Injectable()
export class CommunityChatAutoReplyService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param visibility - Que el perfil que se configura sea del actor.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly visibility: CommunityVisibilityService,
  ) {}

  /**
   * La configuración de un perfil, o `null` si nunca la tocó.
   *
   * @param profileId - El perfil público.
   * @param actor - Quién pregunta; tiene que ser suyo.
   */
  async get(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<ChatAutoReplyDto | null> {
    const em = this.em.fork();
    await this.visibility.assertActsAsProfile(em, profileId, actor);
    const fila = await em.findOne(ChatAutoReplies, {
      publicProfileId: profileId,
    });
    return fila ? aDto(fila) : null;
  }

  /**
   * Crea o reemplaza la configuración de un perfil.
   *
   * Idempotente: hay **una sola fila por perfil**, así que quien configura no
   * tiene que saber si ya existía.
   *
   * @param profileId - El perfil público que se configura.
   * @param dto - La configuración completa.
   * @param actor - Quién configura; tiene que ser suyo.
   */
  async upsert(
    profileId: string,
    dto: UpsertChatAutoReplyDto,
    actor: AuthenticatedUser,
  ): Promise<ChatAutoReplyDto> {
    return this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, profileId, actor);

      const existente = await tx.findOne(ChatAutoReplies, {
        publicProfileId: profileId,
      });
      const fila = existente ?? new ChatAutoReplies();
      if (!existente) {
        fila.publicProfileId = profileId;
        fila.createdAt = new Date();
        fila.statusConceptId = CONCEPTS.STATE_ACTIVE;
      }

      fila.isActive = dto.isActive;
      fila.inactivityMinutes = dto.inactivityMinutes;
      fila.bodyText = dto.bodyText.trim();
      fila.cooldownHours = dto.cooldownHours;
      fila.onlyOutsideBusinessHours = dto.onlyOutsideBusinessHours;
      // La franja sólo se guarda si se va a usar: dejar un horario colgado de
      // una opción apagada es un dato que miente la próxima vez que se
      // encienda.
      fila.businessHoursFrom = dto.onlyOutsideBusinessHours
        ? normalizarHora(dto.businessHoursFrom)
        : undefined;
      fila.businessHoursTo = dto.onlyOutsideBusinessHours
        ? normalizarHora(dto.businessHoursTo)
        : undefined;

      touch(fila, actor.id);
      if (!existente) {
        tx.persist(fila);
      }
      await tx.flush();
      return aDto(fila);
    });
  }

  /**
   * Qué contestar automáticamente a un mensaje entrante, o `null`.
   *
   * ## La regla, entera
   *
   * Contesta si la configuración está encendida **y** el destinatario lleva al
   * menos `inactivity_minutes` sin actividad **y** a esa conversación no se le
   * avisó en las últimas `cooldown_hours` **y**, si pidió franja horaria,
   * estamos fuera de ella.
   *
   * ## Qué cuenta como «actividad» del destinatario
   *
   * Cuándo leyó por última vez **cualquiera** de sus conversaciones. No hay una
   * columna «última vez conectado» en el modelo, y no hacía falta inventarla:
   * marcar leído es exactamente lo que hace alguien que está mirando el chat, y
   * es lo que el propio hilo ya escribe al abrirse.
   *
   * Sin ninguna lectura registrada **no se supone ausencia**: una cuenta nueva
   * no tiene historial, y contestarle sola a su primer mensaje sería contestar
   * por alguien que quizá está mirando la pantalla.
   *
   * @param em - La transacción del mensaje entrante.
   * @param conversationId - Dónde llegó.
   * @param recipientProfileId - A quién le llegó.
   * @param ahora - En qué instante se evalúa. Se pide para que una prueba
   *   pueda pararlo y para que las cuatro condiciones midan el mismo momento.
   * @returns El texto a mandar, o `null` si no corresponde.
   */
  async textoParaResponder(
    em: EntityManager,
    conversationId: string,
    recipientProfileId: string,
    ahora: Date = new Date(),
  ): Promise<string | null> {
    const config = await em.findOne(ChatAutoReplies, {
      publicProfileId: recipientProfileId,
    });
    if (!config?.isActive) {
      return null;
    }

    const participacion = await em.findOne(ConversationParticipants, {
      conversationId,
      participantProfileId: recipientProfileId,
    });
    if (!participacion) {
      return null;
    }

    const ausente = await this.estuvoAusente(
      em,
      config,
      recipientProfileId,
      ahora,
    );
    if (!ausente) {
      return null;
    }

    const ultimoAviso = participacion.lastAutoReplyAt;
    if (
      ultimoAviso &&
      ahora.getTime() - ultimoAviso.getTime() < config.cooldownHours * 3_600_000
    ) {
      return null;
    }

    if (config.onlyOutsideBusinessHours && dentroDeLaFranja(config, ahora)) {
      return null;
    }

    // La marca se pone acá, dentro de la misma transacción del mensaje
    // entrante: si el envío falla, tampoco queda anotado el aviso.
    participacion.lastAutoReplyAt = ahora;

    return config.bodyText;
  }

  /**
   * `true` si el destinatario lleva sin aparecer al menos lo configurado.
   *
   * Se mide contra la última conversación que marcó leída, sea cual sea.
   */
  private async estuvoAusente(
    em: EntityManager,
    config: ChatAutoReplies,
    recipientProfileId: string,
    ahora: Date,
  ): Promise<boolean> {
    const ultima = await em.findOne(
      ConversationParticipants,
      { participantProfileId: recipientProfileId },
      { orderBy: { updatedAt: 'DESC' } },
    );
    if (!ultima?.updatedAt) {
      return false;
    }
    const inactividad = ahora.getTime() - ultima.updatedAt.getTime();
    return inactividad >= config.inactivityMinutes * 60_000;
  }
}

/** `HH:MM:SS` → `HH:MM`; `undefined` se queda como está. */
function normalizarHora(valor: string | undefined): string | undefined {
  return valor === undefined ? undefined : valor.slice(0, 5);
}

/**
 * `true` si el instante cae dentro de la franja de atención.
 *
 * Una franja que termina antes de empezar —`22:00` a `06:00`— es la de quien
 * atiende de noche y cruza la medianoche: se resuelve como la unión de los dos
 * tramos, no como un rango vacío.
 */
function dentroDeLaFranja(config: ChatAutoReplies, ahora: Date): boolean {
  const desde = enMinutos(config.businessHoursFrom);
  const hasta = enMinutos(config.businessHoursTo);
  if (desde === null || hasta === null) {
    // Pidió franja y no la declaró: no hay horario que respetar, así que la
    // condición no bloquea nada.
    return false;
  }
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  return desde <= hasta
    ? minutos >= desde && minutos < hasta
    : minutos >= desde || minutos < hasta;
}

function enMinutos(hhmm: string | undefined): number | null {
  if (!hhmm) {
    return null;
  }
  const [horas, min] = hhmm.split(':').map(Number);
  return Number.isFinite(horas) && Number.isFinite(min)
    ? horas * 60 + min
    : null;
}

function aDto(fila: ChatAutoReplies): ChatAutoReplyDto {
  return {
    id: fila.id,
    publicProfileId: fila.publicProfileId,
    isActive: fila.isActive,
    inactivityMinutes: fila.inactivityMinutes,
    bodyText: fila.bodyText,
    cooldownHours: fila.cooldownHours,
    onlyOutsideBusinessHours: fila.onlyOutsideBusinessHours,
    businessHoursFrom: fila.businessHoursFrom ?? null,
    businessHoursTo: fila.businessHoursTo ?? null,
    updatedAt: fila.updatedAt,
  };
}
