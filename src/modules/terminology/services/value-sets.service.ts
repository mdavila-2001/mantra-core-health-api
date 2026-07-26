import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  type AuthenticatedUser,
} from '../../../common';
import { ValueSetsRepository } from '../repositories';
import { type CreateValueSetDto, type ValueSetResponseDto } from '../dto';

/** Versión inicial que recibe todo conjunto de valores recién creado. */
const INITIAL_VALUE_SET_VERSION = '1.0.0';

/**
 * Reglas de negocio para el alta de conjuntos de valores (UC-03-07).
 *
 * Crea los tres niveles (conjunto → versión → reglas) en una transacción. Como
 * las FK son columnas `uuid` planas (no relaciones del ORM), MikroORM no ordena
 * los inserts: hay que `flush` tras el conjunto y tras la versión antes de crear
 * lo que los referencia.
 */
@Injectable()
export class ValueSetsService {
  constructor(
    private readonly em: EntityManager,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ValueSetsService.name);
  }

  /** UC-03-07: crea un conjunto de valores con su versión inicial y sus reglas. */
  async createValueSet(
    dto: CreateValueSetDto,
    actor: AuthenticatedUser,
  ): Promise<ValueSetResponseDto> {
    this.logger.info(
      { operation: 'terminology.value-set.create', internalCode: dto.internalCode },
      'Creando conjunto de valores',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.valueSetsRepo.findByInternalCode(tx, dto.internalCode);
      if (duplicate) {
        this.logger.warn(
          { operation: 'terminology.value-set.create', internalCode: dto.internalCode },
          'Código interno de conjunto de valores duplicado',
        );
        throw new ConflictException('Ya existe un conjunto de valores con ese código interno', {
          internalCode: dto.internalCode,
        });
      }

      // Nivel 1: conjunto de valores.
      const valueSet = this.valueSetsRepo.createValueSet(tx, {
        internalCode: dto.internalCode,
        name: dto.name,
        canonicalUrl: dto.canonicalUrl,
        stateConceptId: CONCEPTS.TERM_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Nivel 2: versión inicial (referencia al conjunto ya persistido).
      const version = this.valueSetsRepo.createVersion(tx, {
        valueSetId: valueSet.id,
        version: INITIAL_VALUE_SET_VERSION,
        isDefault: true,
        stateConceptId: CONCEPTS.TERM_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Nivel 3: reglas (referencian la versión ya persistida).
      const rules = dto.rules ?? [];
      for (const rule of rules) {
        const operatorConceptId =
          rule.operator === 'IS_A' ? CONCEPTS.VS_OP_IS_A : rule.operator === 'IN' ? CONCEPTS.VS_OP_IN : undefined;
        this.valueSetsRepo.createRule(tx, {
          valueSetVersionId: version.id,
          codeSystemId: rule.codeSystemId,
          operatorConceptId,
          property: rule.property,
          value: rule.value,
          included: rule.included ?? true,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        { operation: 'terminology.value-set.create', valueSetId: valueSet.id, rulesCount: rules.length },
        'Conjunto de valores creado',
      );
      return { id: valueSet.id, versionId: version.id, rulesCount: rules.length };
    });
  }
}
