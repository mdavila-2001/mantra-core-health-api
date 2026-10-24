import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  verifySignature,
} from '../../../common';
import { IntegrationsSecretsService } from './integrations-secrets.service';
import {
  ProviderConnectionsRepository,
  InboundMessagesRepository,
} from '../repositories';
import { InboundWebhookDto, InboundMessageResponseDto } from '../dto';
import { INTEG } from '../integrations.concepts';

/**
 * Caso de uso de recepción de webhooks entrantes (UC-12-09).
 *
 * Endpoint público (el gateway externo no porta token de usuario): el tenant se
 * identifica por la conexión y la autenticidad por la firma HMAC, que se verifica
 * aquí (fail-closed) contra el secreto de la credencial activa de la conexión antes
 * de persistir nada. La idempotencia por (connection_id, signature) de-duplica
 * reentregas del proveedor de forma atómica (lock transaccional + índice único).
 */
@Injectable()
export class IntegrationsWebhooksService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param connectionsRepo - Valor de connections repo requerido por la operación.
   * @param inboundRepo - Valor de inbound repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly connectionsRepo: ProviderConnectionsRepository,
    private readonly inboundRepo: InboundMessagesRepository,
    private readonly secrets: IntegrationsSecretsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationsWebhooksService.name);
  }

  /** UC-12-09: registra un mensaje entrante con ACK rápido (procesamiento diferido). */
  async receiveInbound(
    dto: InboundWebhookDto,
  ): Promise<InboundMessageResponseDto> {
    this.logger.info(
      {
        operation: 'integrations.webhook.inbound',
        connectionId: dto.connectionId,
      },
      'Receiving inbound webhook',
    );
    try {
      return await this.persistInbound(dto);
    } catch (error) {
      // Respaldo del índice único (connection_id, signature): si dos entregas
      // llegaron a insertar a la vez, la segunda pierde la carrera y responde
      // como duplicado de la primera, ya confirmada.
      if (
        error instanceof UniqueConstraintViolationException &&
        dto.signature
      ) {
        const existing = await this.inboundRepo.findByConnectionAndSignature(
          this.em.fork(),
          dto.connectionId,
          dto.signature,
        );
        if (existing) {
          return {
            id: existing.id,
            status: existing.statusConceptId,
            duplicate: true,
          };
        }
      }
      throw error;
    }
  }

  /** Verificación, de-duplicación atómica e inserción dentro de una transacción. */
  private persistInbound(
    dto: InboundWebhookDto,
  ): Promise<InboundMessageResponseDto> {
    return this.em.transactional(async (tx) => {
      const connection = await this.connectionsRepo.findById(
        tx,
        dto.connectionId,
      );
      if (!connection) {
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionId: dto.connectionId,
        });
      }

      // Verificación de firma HMAC ANTES de persistir (fail-closed): sin firma
      // válida contra un secreto activo de la conexión (el de su credencial
      // vigente; dos durante una rotación) no se admite el webhook.
      const secrets = await this.secrets.resolveActiveSecrets(
        tx,
        connection.id,
      );
      const rawBody = canonicalJson(dto.payloadJson);
      if (
        !secrets.some((secret) =>
          verifySignature(secret, rawBody, dto.signature),
        )
      ) {
        throw new UnauthorizedException('Firma del webhook inválida', {
          connectionId: dto.connectionId,
        });
      }

      // De-duplicación de reentregas por firma dentro de la conexión. El lock
      // transaccional por (conexión, firma) serializa las entregas simultáneas:
      // la segunda espera el commit de la primera y ya la encuentra. El índice
      // único de la base es el respaldo si el lock se saltara.
      if (dto.signature) {
        await tx.execute(
          'select pg_advisory_xact_lock(hashtextextended(?, 0))',
          [`integrations.inbound:${dto.connectionId}:${dto.signature}`],
        );
        const existing = await this.inboundRepo.findByConnectionAndSignature(
          tx,
          dto.connectionId,
          dto.signature,
        );
        if (existing) {
          this.logger.info(
            {
              operation: 'integrations.webhook.inbound',
              messageId: existing.id,
              duplicate: true,
            },
            'De-duplicated inbound webhook',
          );
          return {
            id: existing.id,
            status: existing.statusConceptId,
            duplicate: true,
          };
        }
      }

      const message = this.inboundRepo.create(tx, {
        connectionId: dto.connectionId,
        payloadJson: dto.payloadJson,
        statusConceptId: INTEG.INBOUND_RECEIVED,
        payloadVersion: 1,
        endpointId: dto.endpointId,
        correlationId: dto.correlationId,
        signature: dto.signature,
        receivedAt: new Date(),
      });
      await tx.flush();

      return {
        id: message.id,
        status: message.statusConceptId,
        duplicate: false,
      };
    });
  }
}
