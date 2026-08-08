import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SystemContextRepository } from '../repositories';
import {
  CreateEnumDefinitionDto,
  EnumDefinitionResponseDto,
  DraftEnumVersionDto,
  EnumVersionResponseDto,
  PublishEnumVersionResponseDto,
  CreateEnumBindingDto,
  EnumBindingResponseDto,
  ResolveEnumValueDto,
  ResolveEnumValueResponseDto,
  RetireEnumDefinitionDto,
  RetireEnumDefinitionResponseDto,
  ListDynamicEnumBindingsResponseDto,
  ReadDynamicEnumResponseDto,
  type ValidationMode,
} from '../dto';

const VALIDATION_MODE_CONCEPT: Readonly<Record<ValidationMode, string>> = {
  STRICT: CONCEPTS.VALIDATION_MODE_STRICT,
  LENIENT: CONCEPTS.VALIDATION_MODE_LENIENT,
};

/**
 * Enumeraciones dinámicas: definición, versiones con snapshot de opciones,
 * publicación, binding a campos, resolución en escritura y retiro gobernado
 * (UC-45-01 … 05, UC-45-11).
 *
 * El modelo prohíbe los tipos `ENUM` nativos de PostgreSQL
 * (`dynamic_postgresql_enums_allowed = false`): el conjunto permitido vive en
 * filas versionadas, y por eso cambiar los valores no exige un despliegue.
 */
@Injectable()
export class DynamicEnumsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contextRepo - Valor de context repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly contextRepo: SystemContextRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DynamicEnumsService.name);
  }

  /**
   * Lee la enumeración publicada que gobierna un campo, o la que tiene un código
   * dado, con sus opciones habilitadas.
   *
   * Es la contraparte de lectura de `resolveValue`: aquélla valida un valor que
   * ya se eligió; ésta entrega los valores entre los que elegir. Sin ella un
   * formulario no puede ofrecer ningún campo `*_concept_id`, porque sabe que el
   * campo sale de terminología pero no de qué conjunto, y el `$expand` exige un
   * uuid que no se publica en ninguna parte.
   *
   * Se busca por **ruta del campo** o por **código de enumeración**, nunca por
   * uuid: los dos son constantes del código fuente, así que un cliente puede
   * escribirlos sin que un re-seed se los invalide.
   *
   * @param selector - Campo destino o código de la enumeración.
   * @returns Enumeración con sus opciones, lista para poblar un selector.
   */
  async readEnum(selector: {
    /** Campo `esquema.tabla.columna` cuyo catálogo se pide. */
    target?: string;
    /** Código estable de la enumeración. */
    code?: string;
  }): Promise<ReadDynamicEnumResponseDto> {
    if (!selector.target && !selector.code) {
      throw new BadRequestException(
        'Indique el campo destino (`target`) o el código de la enumeración (`code`)',
      );
    }

    const em = this.em.fork();

    const definition = selector.target
      ? await this.definitionForTarget(em, selector.target)
      : await this.contextRepo.findEnumDefinitionByCode(em, selector.code!);

    if (!definition) {
      throw new ResourceNotFoundException('Enumeración no encontrada', {
        target: selector.target,
        code: selector.code,
      });
    }
    if (definition.statusConceptId === CONCEPTS.ENUM_DEF_RETIRED) {
      throw new ResourceNotFoundException('La enumeración está retirada', {
        code: definition.code,
      });
    }

    const version = await this.contextRepo.findPublishedEnumVersion(
      em,
      definition.id,
      CONCEPTS.ENUM_VERSION_PUBLISHED,
    );
    if (!version) {
      throw new PreconditionFailedException(
        'La enumeración no tiene versión publicada',
        { code: definition.code },
      );
    }

    // Sólo las habilitadas: una opción deshabilitada sigue siendo válida para lo
    // ya escrito, pero ofrecerla en un alta nueva reintroduciría un valor que la
    // administración retiró a propósito.
    const options = (
      await this.contextRepo.findEnumOptions(em, version.id)
    ).filter((option) => option.enabled);

    return {
      code: definition.code,
      name: definition.name,
      description: definition.description,
      definitionId: definition.id,
      valueSetId: definition.valueSetId,
      versionId: version.id,
      cacheToken: version.cacheToken,
      allowCustomValue: definition.allowCustomValue ?? false,
      options: options.map((option) => ({
        conceptId: option.conceptId,
        code: option.code,
        display: option.display,
        ordinal: option.ordinal,
        isDefault: option.isDefault ?? false,
      })),
    };
  }

  /**
   * Tabla de amarres `campo -> enumeración`, opcionalmente acotada.
   *
   * Permite descubrir qué campos de una tabla son de catálogo antes de pintar el
   * formulario, en una sola llamada, en vez de tantear campo por campo.
   *
   * @param filter - Acotación por esquema y tabla.
   * @returns Amarres activos con el código de su enumeración.
   */
  async listBindings(
    filter: {
      /** Esquema al que acotar. */
      schemaName?: string;
      /** Tabla a la que acotar. */
      entityName?: string;
    } = {},
  ): Promise<ListDynamicEnumBindingsResponseDto> {
    const em = this.em.fork();
    const bindings = await this.contextRepo.findActiveEnumBindings(
      em,
      CONCEPTS.ENUM_BINDING_ACTIVE,
      {
        targetSchemaName: filter.schemaName,
        targetEntityName: filter.entityName,
      },
    );

    const definitions = await this.contextRepo.findEnumDefinitionsByIds(em, [
      ...new Set(bindings.map((binding) => binding.dynamicEnumDefinitionId)),
    ]);

    const items = bindings.flatMap((binding) => {
      const definition = definitions.get(binding.dynamicEnumDefinitionId);
      // Un amarre cuya definición no existe es una fila huérfana: devolverlo con
      // el código en blanco haría que el cliente pidiera un catálogo inexistente.
      if (!definition) return [];
      return [
        {
          target: `${binding.targetSchemaName}.${binding.targetEntityName}.${binding.targetFieldName}`,
          targetSchemaName: binding.targetSchemaName,
          targetEntityName: binding.targetEntityName,
          targetFieldName: binding.targetFieldName,
          enumCode: definition.code,
          definitionId: definition.id,
          valueSetId: definition.valueSetId,
          required: binding.required ?? false,
          fallbackConceptId: binding.fallbackConceptId,
          validationModeConceptId: binding.validationModeConceptId,
        },
      ];
    });

    return { items, count: items.length };
  }

  /**
   * Definición que gobierna un campo `esquema.tabla.columna`.
   *
   * @param em - Contexto de persistencia.
   * @param target - Campo destino en notación de tres partes.
   * @returns La definición amarrada, o `null` si el campo no tiene ninguna.
   */
  private async definitionForTarget(
    em: EntityManager,
    target: string,
  ): Promise<Awaited<
    ReturnType<SystemContextRepository['findEnumDefinitionById']>
  > | null> {
    const parts = target.split('.');
    if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
      throw new BadRequestException(
        'El campo destino se escribe como `esquema.tabla.columna`',
      );
    }
    const binding = await this.contextRepo.findEnumBindingByTarget(
      em,
      parts[0],
      parts[1],
      parts[2],
      CONCEPTS.ENUM_BINDING_ACTIVE,
    );
    if (!binding) return null;
    return this.contextRepo.findEnumDefinitionById(
      em,
      binding.dynamicEnumDefinitionId,
    );
  }

  /** UC-45-01: definir la enumeración. Nace en borrador, sin versión todavía. */
  async createDefinition(
    dto: CreateEnumDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<EnumDefinitionResponseDto> {
    this.logger.info(
      { operation: 'system-context.enum.define', code: dto.code },
      'Defining dynamic enum',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.contextRepo.findEnumDefinitionByCode(
        tx,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una enumeración con ese código',
          { code: dto.code },
        );
      }

      const definition = this.contextRepo.createEnumDefinition(tx, {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        valueSetId: dto.valueSetId,
        scopeTypeConceptId: dto.scopeTypeConceptId,
        tenantId: dto.tenantId,
        countryConceptId: dto.countryConceptId,
        selectionModeConceptId: dto.selectionModeConceptId,
        allowTenantExtension: dto.allowTenantExtension ?? false,
        allowCustomValue: dto.allowCustomValue ?? false,
        statusConceptId: CONCEPTS.ENUM_DEF_DRAFT,
        actorUserId: actor.id,
      });

      return {
        id: definition.id,
        code: dto.code,
        statusConceptId: CONCEPTS.ENUM_DEF_DRAFT,
      };
    });
  }

  /**
   * UC-45-02: redactar una versión con su snapshot de opciones. Las opciones son
   * inmutables una vez escritas: es lo que permite que una escritura de hace un
   * año siga validando contra el conjunto que existía entonces.
   */
  async draftVersion(
    definitionId: string,
    dto: DraftEnumVersionDto,
    actor: AuthenticatedUser,
  ): Promise<EnumVersionResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.enum.draft',
        definitionId,
        options: dto.options.length,
      },
      'Drafting dynamic enum version',
    );

    this.assertOptionSet(dto, definitionId);

    return this.em.transactional(async (tx) => {
      // La definición se bloquea porque el número de versión sale de un máximo:
      // dos redacciones simultáneas producirían el mismo número.
      const definition = await this.contextRepo.findEnumDefinitionForUpdate(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Enumeración no encontrada', {
          definitionId,
        });
      }
      if (definition.statusConceptId === CONCEPTS.ENUM_DEF_RETIRED) {
        throw new PreconditionFailedException('La enumeración está retirada', {
          definitionId,
        });
      }

      const latest = await this.contextRepo.findLatestEnumVersion(
        tx,
        definitionId,
      );
      const versionNumber = (latest?.versionNumber ?? 0) + 1;

      const version = this.contextRepo.createEnumVersion(tx, {
        dynamicEnumDefinitionId: definitionId,
        versionNumber,
        valueSetVersionId: dto.valueSetVersionId,
        schemaVersion: dto.schemaVersion,
        statusConceptId: CONCEPTS.ENUM_VERSION_DRAFT,
        recordedByUserId: actor.id,
      });

      const optionIds = dto.options.map(
        (option, index) =>
          this.contextRepo.createEnumOption(tx, {
            dynamicEnumVersionId: version.id,
            conceptId: option.conceptId,
            code: option.code,
            display: option.display,
            ordinal: option.ordinal ?? index + 1,
            isDefault: option.isDefault ?? false,
            enabled: option.enabled ?? true,
            metadataJson: option.metadataJson,
            recordedByUserId: actor.id,
          }).id,
      );

      return {
        id: version.id,
        versionNumber,
        statusConceptId: CONCEPTS.ENUM_VERSION_DRAFT,
        optionIds,
      };
    });
  }

  /**
   * UC-45-03: publicar la versión. La anterior queda superseded en la misma
   * transacción y el token de caché cambia: sin eso, los consumidores seguirían
   * validando contra el conjunto viejo.
   */
  async publishVersion(
    definitionId: string,
    versionNumber: number,
    actor: AuthenticatedUser,
  ): Promise<PublishEnumVersionResponseDto> {
    this.logger.info(
      { operation: 'system-context.enum.publish', definitionId, versionNumber },
      'Publishing dynamic enum version',
    );

    return this.em.transactional(async (tx) => {
      const definition = await this.contextRepo.findEnumDefinitionForUpdate(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Enumeración no encontrada', {
          definitionId,
        });
      }
      if (definition.statusConceptId === CONCEPTS.ENUM_DEF_RETIRED) {
        throw new PreconditionFailedException('La enumeración está retirada', {
          definitionId,
        });
      }

      const version = await this.contextRepo.findEnumVersionForUpdate(
        tx,
        definitionId,
        versionNumber,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión de la enumeración no encontrada',
          {
            definitionId,
            versionNumber,
          },
        );
      }
      if (version.statusConceptId !== CONCEPTS.ENUM_VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión no está en borrador',
          {
            definitionId,
            versionNumber,
          },
        );
      }

      // Publicar una versión sin ninguna opción habilitada dejaría el campo sin
      // ningún valor escribible.
      const enabled = await this.contextRepo.countEnabledOptions(
        tx,
        version.id,
      );
      if (enabled === 0) {
        throw new PreconditionFailedException(
          'La versión no tiene ninguna opción habilitada',
          {
            definitionId,
            versionNumber,
          },
        );
      }

      const now = new Date();
      const previous = await this.contextRepo.findPublishedEnumVersionForUpdate(
        tx,
        definitionId,
        CONCEPTS.ENUM_VERSION_PUBLISHED,
      );
      if (previous) {
        previous.statusConceptId = CONCEPTS.ENUM_VERSION_SUPERSEDED;
        previous.effectiveTo = now;
      }

      version.statusConceptId = CONCEPTS.ENUM_VERSION_PUBLISHED;
      version.effectiveFrom = now;
      version.effectiveTo = undefined;
      version.cacheToken = this.cacheToken(definitionId, versionNumber, now);

      if (definition.statusConceptId === CONCEPTS.ENUM_DEF_DRAFT) {
        definition.statusConceptId = CONCEPTS.ENUM_DEF_ACTIVE;
      }
      touch(definition, actor.id);

      return {
        id: version.id,
        versionNumber,
        statusConceptId: CONCEPTS.ENUM_VERSION_PUBLISHED,
        cacheToken: version.cacheToken,
        supersededVersionId: previous?.id,
      };
    });
  }

  /** UC-45-04: vincular la enumeración a un campo destino. */
  async createBinding(
    definitionId: string,
    dto: CreateEnumBindingDto,
    actor: AuthenticatedUser,
  ): Promise<EnumBindingResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.enum.bind',
        definitionId,
        target: `${dto.targetSchemaName}.${dto.targetEntityName}.${dto.targetFieldName}`,
      },
      'Binding dynamic enum to field',
    );

    // En modo permisivo hay que saber a qué valor se cae; sin concepto de
    // reserva, "permisivo" sería simplemente "sin validar".
    if (dto.validationMode === 'LENIENT' && !dto.fallbackConceptId) {
      throw new PreconditionFailedException(
        'El modo permisivo exige un concepto de reserva',
        { definitionId },
      );
    }

    return this.em.transactional(async (tx) => {
      const definition = await this.contextRepo.findEnumDefinitionById(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Enumeración no encontrada', {
          definitionId,
        });
      }
      if (definition.statusConceptId === CONCEPTS.ENUM_DEF_RETIRED) {
        throw new PreconditionFailedException('La enumeración está retirada', {
          definitionId,
        });
      }

      const existing = await this.contextRepo.findEnumBindingByTarget(
        tx,
        dto.targetSchemaName,
        dto.targetEntityName,
        dto.targetFieldName,
        CONCEPTS.ENUM_BINDING_ACTIVE,
      );
      if (existing) {
        throw new ConflictException(
          'El campo ya está gobernado por otra enumeración',
          {
            target: `${dto.targetSchemaName}.${dto.targetEntityName}.${dto.targetFieldName}`,
            bindingId: existing.id,
          },
        );
      }

      const binding = this.contextRepo.createEnumBinding(tx, {
        dynamicEnumDefinitionId: definitionId,
        targetSchemaName: dto.targetSchemaName,
        targetEntityName: dto.targetEntityName,
        targetFieldName: dto.targetFieldName,
        systemContextId: dto.systemContextId,
        required: dto.required ?? false,
        fallbackConceptId: dto.fallbackConceptId,
        validationModeConceptId: VALIDATION_MODE_CONCEPT[dto.validationMode],
        statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: binding.id,
        dynamicEnumDefinitionId: definitionId,
        statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
      };
    });
  }

  /**
   * UC-45-05: resolver el valor propuesto para un campo. En modo estricto lo que
   * no está en el conjunto se rechaza; en permisivo se cae al concepto de
   * reserva. La respuesta lleva el `cacheToken` de la versión con la que se
   * resolvió, que es lo que memoiza el llamante.
   */
  async resolveValue(
    dto: ResolveEnumValueDto,
    actor: AuthenticatedUser,
  ): Promise<ResolveEnumValueResponseDto> {
    const target = `${dto.targetSchemaName}.${dto.targetEntityName}.${dto.targetFieldName}`;

    return this.em.transactional(async (tx) => {
      const binding = await this.contextRepo.findEnumBindingByTarget(
        tx,
        dto.targetSchemaName,
        dto.targetEntityName,
        dto.targetFieldName,
        CONCEPTS.ENUM_BINDING_ACTIVE,
      );
      if (!binding) {
        throw new ResourceNotFoundException(
          'El campo no tiene enumeración vinculada',
          { target },
        );
      }

      const version = await this.contextRepo.findPublishedEnumVersion(
        tx,
        binding.dynamicEnumDefinitionId,
        CONCEPTS.ENUM_VERSION_PUBLISHED,
      );
      if (!version) {
        throw new PreconditionFailedException(
          'La enumeración no tiene versión publicada',
          {
            target,
            definitionId: binding.dynamicEnumDefinitionId,
          },
        );
      }

      // El modo es opcional en el modelo; sin declarar se valida estricto, que
      // es lo único seguro: lo contrario dejaría pasar cualquier valor.
      const validationModeConceptId =
        binding.validationModeConceptId ?? CONCEPTS.VALIDATION_MODE_STRICT;
      const strict =
        validationModeConceptId === CONCEPTS.VALIDATION_MODE_STRICT;
      const cacheToken = version.cacheToken ?? '';
      const options = await this.contextRepo.findEnumOptions(tx, version.id);
      const enabled = options.filter((option) => option.enabled);

      if (!dto.conceptId && !dto.code) {
        // Campo obligatorio y sin valor: el conjunto no puede rellenarlo solo.
        if (binding.required) {
          return this.rejected(
            validationModeConceptId,
            cacheToken,
            'El campo es obligatorio y no llegó valor',
          );
        }
        return {
          accepted: true,
          usedFallback: false,
          validationModeConceptId,
          cacheToken,
        };
      }

      const match = enabled.find(
        (option) =>
          (dto.conceptId !== undefined && option.conceptId === dto.conceptId) ||
          (dto.code !== undefined && option.code === dto.code),
      );
      if (match) {
        return {
          accepted: true,
          resolvedConceptId: match.conceptId,
          resolvedCode: match.code,
          usedFallback: false,
          validationModeConceptId,
          cacheToken,
        };
      }

      if (strict) {
        this.logger.warn(
          {
            operation: 'system-context.enum.resolve',
            target,
            actorUserId: actor.id,
          },
          'Dynamic enum value rejected in strict mode',
        );
        return this.rejected(
          validationModeConceptId,
          cacheToken,
          'El valor no pertenece al conjunto publicado',
        );
      }

      return {
        accepted: true,
        resolvedConceptId: binding.fallbackConceptId,
        usedFallback: true,
        validationModeConceptId,
        cacheToken,
      };
    });
  }

  /**
   * UC-45-11: retirar la definición. Es un borrado lógico: nunca se elimina, y
   * sus bindings quedan deshabilitados en la misma transacción. Un binding
   * obligatorio sin reemplazo bloquea el retiro, porque dejaría un campo
   * exigido sin catálogo del que sacar el valor.
   */
  async retireDefinition(
    definitionId: string,
    dto: RetireEnumDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<RetireEnumDefinitionResponseDto> {
    this.logger.info(
      { operation: 'system-context.enum.retire', definitionId },
      'Retiring dynamic enum definition',
    );

    return this.em.transactional(async (tx) => {
      const definition = await this.contextRepo.findEnumDefinitionForUpdate(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Enumeración no encontrada', {
          definitionId,
        });
      }
      if (definition.statusConceptId === CONCEPTS.ENUM_DEF_RETIRED) {
        throw new ConflictException('La enumeración ya está retirada', {
          definitionId,
        });
      }

      const bindings = await this.contextRepo.findEnumBindingsForUpdate(
        tx,
        definitionId,
        CONCEPTS.ENUM_BINDING_ACTIVE,
      );
      const blocking = bindings.find((binding) => binding.required);
      if (blocking) {
        throw new PreconditionFailedException(
          'Hay un campo obligatorio vinculado; migra su enumeración antes de retirarla',
          { definitionId, bindingId: blocking.id },
        );
      }

      for (const binding of bindings) {
        binding.statusConceptId = CONCEPTS.ENUM_BINDING_DISABLED;
        touch(binding, actor.id);
      }

      definition.statusConceptId = CONCEPTS.ENUM_DEF_RETIRED;
      touch(definition, actor.id);

      this.logger.warn(
        {
          operation: 'system-context.enum.retire',
          definitionId,
          disabledBindings: bindings.length,
          reason: dto.reason,
        },
        'Dynamic enum definition retired',
      );

      return {
        id: definitionId,
        statusConceptId: CONCEPTS.ENUM_DEF_RETIRED,
        disabledBindings: bindings.length,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Ejecuta la operación rejected.
   *
   * @param validationModeConceptId - Identificador de validation mode concept.
   * @param cacheToken - Valor de cache token requerido por la operación.
   * @param reason - Valor de reason requerido por la operación.
   * @returns Resultado de rejected conforme al contrato `ResolveEnumValueResponseDto`.
   */
  private rejected(
    validationModeConceptId: string,
    cacheToken: string,
    reason: string,
  ): ResolveEnumValueResponseDto {
    return {
      accepted: false,
      usedFallback: false,
      validationModeConceptId,
      cacheToken,
      rejectionReason: reason,
    };
  }

  /**
   * Exactamente una opción por defecto y sin códigos ni conceptos repetidos.
   * Dos opciones por defecto dejarían indefinido con qué se rellena el campo, y
   * un código repetido haría ambigua la resolución por código.
   */
  private assertOptionSet(
    dto: DraftEnumVersionDto,
    definitionId: string,
  ): void {
    const defaults = dto.options.filter((option) => option.isDefault);
    if (defaults.length > 1) {
      throw new PreconditionFailedException(
        'Sólo una opción puede ser la de por defecto',
        {
          definitionId,
          defaults: defaults.length,
        },
      );
    }
    if (defaults.length === 1 && defaults[0].enabled === false) {
      throw new PreconditionFailedException(
        'La opción por defecto no puede estar deshabilitada',
        {
          definitionId,
          code: defaults[0].code,
        },
      );
    }

    const codes = new Set<string>();
    const concepts = new Set<string>();
    for (const option of dto.options) {
      if (codes.has(option.code)) {
        throw new PreconditionFailedException(
          'El código de opción está repetido',
          {
            definitionId,
            code: option.code,
          },
        );
      }
      if (concepts.has(option.conceptId)) {
        throw new PreconditionFailedException(
          'El concepto está repetido en las opciones',
          {
            definitionId,
            conceptId: option.conceptId,
          },
        );
      }
      codes.add(option.code);
      concepts.add(option.conceptId);
    }
  }

  /**
   * Token de invalidación de caché. Deriva de la identidad de la versión y del
   * instante de publicación, así que republicar produce un token distinto y los
   * consumidores no pueden servir el conjunto anterior por error.
   */
  private cacheToken(
    definitionId: string,
    versionNumber: number,
    publishedAt: Date,
  ): string {
    return createHash('sha256')
      .update(`${definitionId}:${versionNumber}:${publishedAt.toISOString()}`)
      .digest('hex')
      .slice(0, 32);
  }
}
