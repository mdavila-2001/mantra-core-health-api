import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  FormInstancesRepository,
  FieldValuesRepository,
} from '../repositories';
import { OpenInstanceDto, FormInstanceResponseDto, OkResultDto } from '../dto';
import { FORMS } from '../forms.concepts';
import { Encounters } from '../../clinical/entities';

/**
 * Ciclo de vida de la instancia de formulario: apertura para un recurso
 * (UC-09-07) y cierre con proyección (UC-09-11). Al cerrar, los valores
 * preliminares de la instancia pasan a `final`.
 */
@Injectable()
export class FormsInstancesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param instancesRepo - Valor de instances repo requerido por la operación.
   * @param valuesRepo - Valor de values repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly instancesRepo: FormInstancesRepository,
    private readonly valuesRepo: FieldValuesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsInstancesService.name);
  }

  /**
   * De qué es el recurso sobre el que se abre la instancia, cuando el cliente
   * no lo dice.
   *
   * Lo resuelve el servidor y no el cliente a propósito: el tipo es un
   * `concept_id`, y un frontend que lo mandara tendría que llevar ese uuid
   * escrito —que es justo lo que la regla de terminología prohíbe—. Acá el dato
   * se sabe sin adivinar: si el `resourceId` es un encuentro, la instancia es
   * de un encuentro.
   *
   * El default histórico era paciente por ser el único tipo declarado, así que
   * las fichas por especialidad —que se abren SOBRE la consulta— quedaban
   * diciendo algo que no eran.
   */
  private async tipoDelRecurso(
    tx: EntityManager,
    resourceId: string,
  ): Promise<string> {
    const encuentro = await tx.findOne(Encounters, { id: resourceId });
    return encuentro === null
      ? FORMS.RESOURCE_TYPE_PATIENT
      : FORMS.RESOURCE_TYPE_ENCOUNTER;
  }

  /** UC-09-07: abre una instancia de formulario para un recurso. */
  async openInstance(
    dto: OpenInstanceDto,
    actor: AuthenticatedUser,
  ): Promise<FormInstanceResponseDto> {
    this.logger.info(
      { operation: 'forms.instance.open', resourceId: dto.resourceId },
      'Opening form instance',
    );
    return this.em.transactional(async (tx) => {
      const resourceTypeConceptId =
        dto.resourceTypeConceptId ??
        (await this.tipoDelRecurso(tx, dto.resourceId));
      const schemaVersion = dto.schemaVersion ?? 1;

      // El duplicado se busca por recurso y versión, SIN el tipo: un mismo
      // encuentro no puede tener dos instancias de la misma versión aunque una
      // vieja quedara tipada como paciente (era el default silencioso antes de
      // que existiera `RESOURCE_TYPE_ENCOUNTER`). Con el tipo en la clave, el
      // 409 se saltearía justo en las bases que ya tienen esas filas.
      const dup = await this.instancesRepo.findByResourceAndVersion(
        tx,
        dto.resourceId,
        schemaVersion,
      );
      if (dup) {
        throw new ConflictException(
          'Ya existe una instancia para el recurso y versión',
          {
            resourceId: dto.resourceId,
            schemaVersion,
          },
        );
      }

      const instance = this.instancesRepo.create(tx, {
        resourceTypeConceptId,
        resourceId: dto.resourceId,
        tenantContextId: dto.tenantContextId,
        schemaVersion,
        stateConceptId: FORMS.INSTANCE_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'forms.instance.open', instanceId: instance.id },
        'Form instance opened',
      );
      return {
        id: instance.id,
        schemaVersion: instance.schemaVersion,
        state: instance.stateConceptId!,
      };
    });
  }

  /** UC-09-11: cierra la instancia y finaliza sus valores preliminares. */
  async closeInstance(
    instanceId: string,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    this.logger.info(
      { operation: 'forms.instance.close', instanceId },
      'Closing form instance',
    );
    return this.em.transactional(async (tx) => {
      const instance = await this.instancesRepo.findById(tx, instanceId);
      if (!instance)
        throw new ResourceNotFoundException('Instancia no encontrada', {
          instanceId,
        });
      if (instance.stateConceptId !== FORMS.INSTANCE_OPEN) {
        throw new PreconditionFailedException('La instancia no está abierta', {
          instanceId,
        });
      }

      const preliminaries = await this.valuesRepo.findPreliminaryByInstance(
        tx,
        instanceId,
        FORMS.VALUE_PRELIMINARY,
      );
      for (const value of preliminaries) {
        value.valueStatusConceptId = FORMS.VALUE_FINAL;
        touch(value, actor.id);
      }

      instance.stateConceptId = FORMS.INSTANCE_CLOSED;
      instance.closedAt = new Date();
      touch(instance, actor.id);

      this.logger.info(
        {
          operation: 'forms.instance.close',
          instanceId,
          finalized: preliminaries.length,
        },
        'Form instance closed',
      );
      return { ok: true };
    });
  }
}
