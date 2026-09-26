import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../../common';
import type { NotificationDestination } from '../notifications.contract';

/**
 * `notification:new` — nació una fila en la bandeja in-app de este usuario.
 *
 * Viaja lo mismo que ya devuelve `GET /notifications/me` para un ítem: el
 * front no tiene que aprender una segunda forma para el mismo dato.
 */
export interface GatewayNotificationPayload {
  id: string;
  category: string | null;
  subject: string | null;
  bodyText: string | null;
  destination: NotificationDestination | null;
  availableAt: string;
}

/** `client.data` de un socket ya autenticado en este gateway. */
interface GatewaySocketData {
  userId?: string;
}

/**
 * Empuje en tiempo real de la campana (carril P1, AG-22).
 *
 * Vive en el namespace por defecto — el mismo que ya usa
 * `CommunityMessagingGateway` para el chat — a propósito: el front de la
 * campana ya abre ese socket para la mensajería (AG-29), y sumar una segunda
 * conexión sólo para esto hubiera sido otro *handshake*, otro *upgrade* de
 * nginx y otro token que vencer. Socket.io permite más de un gateway de Nest
 * escuchando la misma conexión: cada uno se suscribe a `connection` del mismo
 * namespace y no compite por los eventos del otro (éste no declara
 * `@SubscribeMessage`, sólo une la sala del usuario).
 *
 * Es **sólo emisor**: no valida nada de negocio (eso ya lo hizo el caso de uso
 * que llamó a `emitInApp`, dentro de su propia transacción) y no persiste
 * nada — perder la conexión no pierde el aviso, que ya vive en
 * `messaging.in_app_notifications` y lo sirve `GET /notifications/me` cuando
 * el sondeo de respaldo pregunte.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: false } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly wsAuth: WsJwtGuard,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsGateway.name);
  }

  /**
   * Autentica y une el socket a `user:{id}`, para no repetir el trabajo cada
   * vez que este usuario recibe un aviso. Igual que en
   * `CommunityMessagingGateway`: un token inválido corta la conexión acá y no
   * en cada evento.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.wsAuth.authenticate(client);
      (client.data as GatewaySocketData).userId = user.id;
      await client.join(this.salaDeUsuario(user.id));
    } catch {
      // `CommunityMessagingGateway` ya desconecta un socket sin token válido;
      // no se repite acá para no cerrar dos veces la misma conexión.
    }
  }

  /**
   * Avisa a `user:{id}` que tiene una notificación nueva. Se llama **después**
   * de que `emitInApp` confirmó el commit — nunca desde dentro de la
   * transacción — y no lanza: un socket caído no puede tumbar el caso de uso
   * que generó el aviso, que es justo la garantía que ya da `emitInApp`.
   */
  notifyUser(
    recipientUserId: string,
    notification: GatewayNotificationPayload,
  ): void {
    try {
      this.server
        ?.to(this.salaDeUsuario(recipientUserId))
        .emit('notification:new', notification);
    } catch (error) {
      this.logger.warn(
        {
          operation: 'messaging.notification.push',
          recipientUserId,
          err: error,
        },
        'No se pudo empujar notification:new; el sondeo de respaldo la sirve igual',
      );
    }
  }

  private salaDeUsuario(userId: string): string {
    return `user:${userId}`;
  }
}
