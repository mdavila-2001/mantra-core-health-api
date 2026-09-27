import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import type { Namespace, Socket } from 'socket.io';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  WsJwtGuard,
  type AuthenticatedUser,
} from '../../../common';
// Import directo del archivo, no del barrel `../services`: mismo cuidado que
// `CommunityMessagingGateway` para no cerrar ciclos de import.
import {
  VirtualEncountersService,
  type SignalingParticipant,
} from '../services/virtual-encounters.service';

/** Namespace socket.io de la teleconsulta. */
export const TELECONSULT_NAMESPACE = '/teleconsult';

/** Consulta 1:1: médico y paciente. Un tercer socket no entra. */
export const TELECONSULT_ROOM_CAPACITY = 2;

/**
 * Tope de una descripción SDP. Una oferta de audio+video de un navegador ronda
 * 3-10 KB; 32 KB deja margen para simulcast sin permitir que un cliente use
 * el relay para mover volumen arbitrario.
 */
export const MAX_SDP_LENGTH = 32 * 1024;

/** Tope de la línea `candidate:` de un candidato ICE. */
export const MAX_CANDIDATE_LENGTH = 2048;

/** Códigos de error que ve el cliente (ack y evento `error`). */
export type TeleconsultErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_PAYLOAD'
  | 'NOT_FOUND'
  | 'NOT_A_PARTICIPANT'
  | 'SESSION_CLOSED'
  | 'ROOM_FULL'
  | 'NOT_IN_ROOM'
  | 'INTERNAL';

/** Respuesta (ack) de cada evento del cliente. */
export type TeleconsultAck =
  | {
      ok: true;
      virtualEncounterId: string;
      role?: SignalingParticipant['role'];
      peers?: number;
    }
  // Sin campo `event`: Nest interpreta un retorno `{ event, data }` como
  // «emitir ese evento» en vez de responder el ack.
  | { ok: false; code: TeleconsultErrorCode };

/** Lo que el cliente manda en `join`/`leave`. */
export interface TeleconsultRoomBody {
  virtualEncounterId?: unknown;
}

/** Lo que el cliente manda en `offer`/`answer`. */
export interface TeleconsultDescriptionBody extends TeleconsultRoomBody {
  sdp?: unknown;
}

/** Candidato ICE tal como lo serializa `RTCIceCandidate.toJSON()`. */
export interface TeleconsultCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/** Lo que el cliente manda en `ice-candidate`. */
export interface TeleconsultCandidateBody extends TeleconsultRoomBody {
  candidate?: unknown;
}

/** `client.data` de un socket de este namespace. */
interface TeleconsultSocketData {
  user?: AuthenticatedUser;
  /** Sesiones a las que este socket se unió, con su papel. */
  sesiones?: Map<string, SignalingParticipant['role']>;
}

/**
 * Señalización WebRTC de la teleconsulta (namespace `/teleconsult`).
 *
 * El servidor **no toca medios**: sólo reenvía, entre los dos participantes
 * de una sesión virtual, la negociación (`offer`/`answer`) y los candidatos
 * ICE. El audio y el video van de navegador a navegador (o por el TURN que
 * entregue `GET /virtual-encounters/:id/ice-servers`).
 *
 * - Autenticación: middleware del namespace, **antes** de que exista la
 *   conexión — el mismo patrón que `CommunityMessagingGateway.afterInit`
 *   (commit efaf5129), por la misma carrera entre `connection` y un
 *   `handleConnection` asíncrono.
 * - Autorización: `VirtualEncountersService.assertSignalingParticipant`, la
 *   misma regla que `PATCH /virtual-encounters/:id/join`.
 * - Sala `teleconsult:<virtualEncounterId>`, máximo
 *   {@link TELECONSULT_ROOM_CAPACITY} sockets.
 * - Relay sólo desde un socket que ya se unió a esa sala, y sólo hacia los
 *   **demás** de la sala.
 *
 * Logs: ids (usuario, sesión, socket) y códigos. Nunca SDP ni candidatos:
 * llevan direcciones IP de los extremos.
 */
@Injectable()
@WebSocketGateway({ namespace: TELECONSULT_NAMESPACE, cors: { origin: false } })
export class TeleconsultGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Namespace;

  /**
   * @param wsAuth - Verifica el token del handshake.
   * @param virtualEncounters - Autorización sobre la sesión virtual.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly wsAuth: WsJwtGuard,
    private readonly virtualEncounters: VirtualEncountersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TeleconsultGateway.name);
  }

  /**
   * Autentica en el *handshake*: un socket sin token válido nunca llega a
   * `connection` (el cliente ve `connect_error`).
   */
  afterInit(server: Namespace): void {
    server.use((client: Socket, next: (err?: Error) => void) => {
      this.wsAuth
        .authenticate(client)
        .then((user) => {
          (client.data as TeleconsultSocketData).user = user;
          next();
        })
        .catch(() => next(new Error('Token inválido o expirado')));
    });
  }

  /** Avisa `peer-left` en cada sala que el socket ocupaba. */
  handleDisconnect(client: Socket): void {
    const sesiones = (client.data as TeleconsultSocketData).sesiones;
    if (!sesiones) return;
    for (const virtualEncounterId of sesiones.keys()) {
      this.avisarSalida(client, virtualEncounterId, 'disconnect');
    }
    sesiones.clear();
  }

  /** Une el socket a la sala de la sesión, si participa y hay lugar. */
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TeleconsultRoomBody,
  ): Promise<TeleconsultAck> {
    const user = this.usuarioDe(client);
    if (!user) return this.fallar(client, 'join', 'UNAUTHENTICATED');
    const virtualEncounterId = this.idDeSesion(body);
    if (!virtualEncounterId)
      return this.fallar(client, 'join', 'INVALID_PAYLOAD');

    const sala = this.sala(virtualEncounterId);
    const data = client.data as TeleconsultSocketData;
    const yaUnido = data.sesiones?.get(virtualEncounterId);
    if (yaUnido && client.rooms.has(sala)) {
      return {
        ok: true,
        virtualEncounterId,
        role: yaUnido,
        peers: this.ocupacion(sala) - 1,
      };
    }

    let participante: SignalingParticipant;
    try {
      participante = await this.virtualEncounters.assertSignalingParticipant(
        virtualEncounterId,
        user,
      );
    } catch (error) {
      const code = this.codigoDe(error);
      this.logger.warn(
        {
          operation: 'clinical_ext.teleconsult.join',
          virtualEncounterId,
          userId: user.id,
          code,
        },
        'Teleconsult join rejected',
      );
      return this.fallar(client, 'join', code);
    }

    // Sin `await` entre la lectura de la ocupación y el `join`: con el
    // adaptador en memoria el alta en la sala es síncrona, así que dos
    // `join` concurrentes no pueden pasar ambos el tope.
    const ocupacion = this.ocupacion(sala);
    if (ocupacion >= TELECONSULT_ROOM_CAPACITY) {
      this.logger.warn(
        {
          operation: 'clinical_ext.teleconsult.join',
          virtualEncounterId,
          userId: user.id,
          code: 'ROOM_FULL',
        },
        'Teleconsult room full',
      );
      return this.fallar(client, 'join', 'ROOM_FULL');
    }
    void client.join(sala);
    data.sesiones ??= new Map();
    data.sesiones.set(virtualEncounterId, participante.role);

    client.to(sala).emit('peer-joined', {
      virtualEncounterId,
      peerId: client.id,
      role: participante.role,
    });
    this.logger.info(
      {
        operation: 'clinical_ext.teleconsult.join',
        virtualEncounterId,
        userId: user.id,
        socketId: client.id,
        role: participante.role,
      },
      'Teleconsult participant joined',
    );
    return {
      ok: true,
      virtualEncounterId,
      role: participante.role,
      peers: ocupacion,
    };
  }

  /** Sale de la sala y avisa a quien quede. */
  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TeleconsultRoomBody,
  ): Promise<TeleconsultAck> {
    const virtualEncounterId = this.idDeSesion(body);
    if (!virtualEncounterId)
      return this.fallar(client, 'leave', 'INVALID_PAYLOAD');
    const sesiones = (client.data as TeleconsultSocketData).sesiones;
    if (!sesiones?.has(virtualEncounterId)) {
      return this.fallar(client, 'leave', 'NOT_IN_ROOM');
    }
    await client.leave(this.sala(virtualEncounterId));
    sesiones.delete(virtualEncounterId);
    this.avisarSalida(client, virtualEncounterId, 'leave');
    return { ok: true, virtualEncounterId };
  }

  /** Reenvía la oferta SDP al otro participante. */
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TeleconsultDescriptionBody,
  ): TeleconsultAck {
    return this.reenviarDescripcion(client, 'offer', body);
  }

  /** Reenvía la respuesta SDP al otro participante. */
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TeleconsultDescriptionBody,
  ): TeleconsultAck {
    return this.reenviarDescripcion(client, 'answer', body);
  }

  /** Reenvía un candidato ICE al otro participante. */
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TeleconsultCandidateBody,
  ): TeleconsultAck {
    const virtualEncounterId = this.idDeSesion(body);
    const candidate = this.candidatoValido(body?.candidate);
    if (!virtualEncounterId || !candidate) {
      return this.fallar(client, 'ice-candidate', 'INVALID_PAYLOAD');
    }
    if (!this.unidoA(client, virtualEncounterId)) {
      return this.fallar(client, 'ice-candidate', 'NOT_IN_ROOM');
    }
    client.to(this.sala(virtualEncounterId)).emit('ice-candidate', {
      virtualEncounterId,
      from: client.id,
      candidate,
    });
    return { ok: true, virtualEncounterId };
  }

  private reenviarDescripcion(
    client: Socket,
    event: 'offer' | 'answer',
    body: TeleconsultDescriptionBody,
  ): TeleconsultAck {
    const virtualEncounterId = this.idDeSesion(body);
    const sdp = body?.sdp;
    if (
      !virtualEncounterId ||
      typeof sdp !== 'string' ||
      sdp.length === 0 ||
      sdp.length > MAX_SDP_LENGTH
    ) {
      return this.fallar(client, event, 'INVALID_PAYLOAD');
    }
    if (!this.unidoA(client, virtualEncounterId)) {
      return this.fallar(client, event, 'NOT_IN_ROOM');
    }
    client
      .to(this.sala(virtualEncounterId))
      .emit(event, { virtualEncounterId, from: client.id, sdp });
    return { ok: true, virtualEncounterId };
  }

  /** Normaliza un candidato ICE; `undefined` si no cumple la forma. */
  private candidatoValido(valor: unknown): TeleconsultCandidate | undefined {
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor))
      return undefined;
    const c = valor as Record<string, unknown>;
    if (
      typeof c.candidate !== 'string' ||
      c.candidate.length > MAX_CANDIDATE_LENGTH
    )
      return undefined;
    const sdpMid = c.sdpMid;
    if (
      sdpMid !== undefined &&
      sdpMid !== null &&
      (typeof sdpMid !== 'string' || sdpMid.length > 64)
    )
      return undefined;
    const indice = c.sdpMLineIndex;
    if (
      indice !== undefined &&
      indice !== null &&
      (typeof indice !== 'number' ||
        !Number.isInteger(indice) ||
        indice < 0 ||
        indice > 1024)
    )
      return undefined;
    const ufrag = c.usernameFragment;
    if (
      ufrag !== undefined &&
      ufrag !== null &&
      (typeof ufrag !== 'string' || ufrag.length > 256)
    )
      return undefined;
    return {
      candidate: c.candidate,
      sdpMid: sdpMid ?? null,
      sdpMLineIndex: indice ?? null,
      usernameFragment: ufrag ?? null,
    };
  }

  private avisarSalida(
    client: Socket,
    virtualEncounterId: string,
    motivo: 'leave' | 'disconnect',
  ): void {
    try {
      this.server
        .to(this.sala(virtualEncounterId))
        .except(client.id)
        .emit('peer-left', { virtualEncounterId, peerId: client.id });
    } catch (error) {
      this.logger.warn(
        { operation: 'clinical_ext.teleconsult.leave', err: error },
        'No se pudo avisar peer-left',
      );
    }
    this.logger.info(
      {
        operation: 'clinical_ext.teleconsult.leave',
        virtualEncounterId,
        userId: this.usuarioDe(client)?.id,
        socketId: client.id,
        motivo,
      },
      'Teleconsult participant left',
    );
  }

  private unidoA(client: Socket, virtualEncounterId: string): boolean {
    return (
      client.rooms.has(this.sala(virtualEncounterId)) &&
      ((client.data as TeleconsultSocketData).sesiones?.has(
        virtualEncounterId,
      ) ??
        false)
    );
  }

  private fallar(
    client: Socket,
    event: string,
    code: TeleconsultErrorCode,
  ): TeleconsultAck {
    client.emit('error', { code, event });
    return { ok: false, code };
  }

  private codigoDe(error: unknown): TeleconsultErrorCode {
    if (error instanceof ResourceNotFoundException) return 'NOT_FOUND';
    if (error instanceof ForbiddenException) return 'NOT_A_PARTICIPANT';
    if (error instanceof PreconditionFailedException) return 'SESSION_CLOSED';
    return 'INTERNAL';
  }

  private idDeSesion(
    body: TeleconsultRoomBody | undefined,
  ): string | undefined {
    const id = body?.virtualEncounterId;
    return typeof id === 'string' && isUUID(id) ? id : undefined;
  }

  private ocupacion(sala: string): number {
    return this.server.adapter.rooms.get(sala)?.size ?? 0;
  }

  private usuarioDe(client: Socket): AuthenticatedUser | undefined {
    return (client.data as TeleconsultSocketData).user;
  }

  private sala(virtualEncounterId: string): string {
    return `teleconsult:${virtualEncounterId}`;
  }
}
