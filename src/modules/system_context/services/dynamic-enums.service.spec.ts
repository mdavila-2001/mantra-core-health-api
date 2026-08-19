import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DynamicEnumsService } from './dynamic-enums.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['TERMINOLOGY_ENGINEER'] };
const DEFINITION = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const VALUE_SET = '33333333-3333-3333-3333-333333333333';
const CONCEPT_A = '44444444-4444-4444-4444-444444444444';
const CONCEPT_B = '55555555-5555-5555-5555-555555555555';
const FALLBACK = '66666666-6666-6666-6666-666666666666';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  // Las lecturas no abren transacción: usan un fork del contexto.
  em.fork = mockFn(() => em);
  let optionSeq = 0;
  const contextRepo = {
    createEnumDefinition: mockFn(() => ({ id: DEFINITION })),
    findEnumDefinitionById: mockFn(),
    findEnumDefinitionForUpdate: mockFn(),
    findEnumDefinitionByCode: mockFn(() => Promise.resolve(null)),
    createEnumVersion: mockFn(() => ({ id: VERSION })),
    findEnumVersion: mockFn(),
    findEnumVersionForUpdate: mockFn(),
    findLatestEnumVersion: mockFn(() => Promise.resolve(null)),
    findPublishedEnumVersionForUpdate: mockFn(() => Promise.resolve(null)),
    findPublishedEnumVersion: mockFn(),
    createEnumOption: mockFn(() => ({ id: `option-${++optionSeq}` })),
    findEnumOptions: mockFn(() => Promise.resolve([])),
    countEnabledOptions: mockFn(() => Promise.resolve(1)),
    createEnumBinding: mockFn(() => ({ id: 'binding-1' })),
    findEnumBindingByTarget: mockFn(() => Promise.resolve(null)),
    findEnumBindingsForUpdate: mockFn(() => Promise.resolve([])),
    findActiveEnumBindings: mockFn(() => Promise.resolve([])),
    findEnumDefinitionsByIds: mockFn(() => Promise.resolve(new Map())),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DynamicEnumsService(
    em as any,
    contextRepo as any,
    logger as any,
  );
  return { service, tx, contextRepo, logger };
}

/**
 * Ejecuta la operación draft definition.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de draft definition conforme al contrato `any`.
 */
function draftDefinition(overrides: Record<string, unknown> = {}): any {
  return {
    id: DEFINITION,
    code: 'triage-level',
    statusConceptId: CONCEPTS.ENUM_DEF_DRAFT,
    ...overrides,
  };
}

/** La versión de value set que la versión de la enumeración congela. */
const VALUE_SET_VERSION = '11111111-1111-4111-8111-111111111111';

const OPTIONS = [
  { conceptId: CONCEPT_A, code: 'RED', display: 'Rojo', isDefault: true },
  { conceptId: CONCEPT_B, code: 'GREEN', display: 'Verde' },
];

describe('DynamicEnumsService', () => {
  describe('createDefinition (UC-45-01)', () => {
    const dto: any = {
      code: 'triage-level',
      name: 'Nivel de triaje',
      valueSetId: VALUE_SET,
      scopeTypeConceptId: CONCEPT_A,
      selectionModeConceptId: CONCEPT_B,
    };

    it('defines the enum in draft', async () => {
      const d = build();

      const res = await d.service.createDefinition(dto, actor);

      expect(res).toEqual({
        id: DEFINITION,
        code: 'triage-level',
        statusConceptId: CONCEPTS.ENUM_DEF_DRAFT,
      });
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createDefinition(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('draftVersion (UC-45-02)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param definition - Valor de definition requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, definition = draftDefinition()) {
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(definition);
      return definition;
    }

    it('drafts version 1 with its option snapshot', async () => {
      const d = build();
      wire(d);

      const res = await d.service.draftVersion(
        DEFINITION,
        { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS },
        actor,
      );

      expect(res).toEqual({
        id: VERSION,
        versionNumber: 1,
        statusConceptId: CONCEPTS.ENUM_VERSION_DRAFT,
        optionIds: ['option-1', 'option-2'],
      });
    });

    it('numbers the ordinals from the array order when they are not given', async () => {
      const d = build();
      wire(d);

      await d.service.draftVersion(DEFINITION, { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS }, actor);

      expect(d.contextRepo.createEnumOption).toHaveBeenNthCalledWith(
        2,
        d.tx,
        expect.objectContaining({ code: 'GREEN', ordinal: 2, enabled: true }),
      );
    });

    /**
     * La versión se escribe antes que sus opciones. Las opciones guardan el id
     * de su versión como columna suelta, así que el ORM no ve la dependencia:
     * sin el flush, Postgres rechaza los INSERT con
     * `fk_dynamic_enum_options_dynamic_enum_version_id` y redactar una versión
     * por API era imposible (F-19, 18/08/2026).
     */
    it('flushes the version before creating its options', async () => {
      const d = build();
      wire(d);
      const orden: string[] = [];
      d.tx.flush.mockImplementation(() => {
        orden.push('flush');
        return Promise.resolve();
      });
      const crearOpcion = d.contextRepo.createEnumOption.getMockImplementation();
      d.contextRepo.createEnumOption.mockImplementation((...args: unknown[]) => {
        orden.push('option');
        return crearOpcion?.(...args) ?? { id: 'o-1' };
      });

      await d.service.draftVersion(DEFINITION, { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS }, actor);

      expect(orden[0]).toBe('flush');
      expect(orden).toContain('option');
    });

    it('continues the numbering from the latest version', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findLatestEnumVersion.mockResolvedValue({
        versionNumber: 4,
      });

      const res = await d.service.draftVersion(
        DEFINITION,
        { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS },
        actor,
      );

      expect(res.versionNumber).toBe(5);
    });

    it('rejects two default options', async () => {
      const d = build();

      await expect(
        d.service.draftVersion(
          DEFINITION,
          {
            options: [{ ...OPTIONS[0] }, { ...OPTIONS[1], isDefault: true }],
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a disabled default option', async () => {
      const d = build();

      await expect(
        d.service.draftVersion(
          DEFINITION,
          { options: [{ ...OPTIONS[0], enabled: false }] } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a repeated option code', async () => {
      const d = build();

      await expect(
        d.service.draftVersion(
          DEFINITION,
          { options: [OPTIONS[0], { ...OPTIONS[1], code: 'RED' }] } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a repeated concept', async () => {
      const d = build();

      await expect(
        d.service.draftVersion(
          DEFINITION,
          {
            options: [OPTIONS[0], { ...OPTIONS[1], conceptId: CONCEPT_A }],
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses drafting on a retired definition', async () => {
      const d = build();
      wire(d, draftDefinition({ statusConceptId: CONCEPTS.ENUM_DEF_RETIRED }));

      await expect(
        d.service.draftVersion(
          DEFINITION,
          { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the definition does not exist', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.draftVersion(
          DEFINITION,
          { valueSetVersionId: VALUE_SET_VERSION, schemaVersion: '1.0.0', options: OPTIONS } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishVersion (UC-45-03)', () => {
    /**
     * Ejecuta la operación draft version.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de draft version conforme al contrato `any`.
     */
    function draftVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        versionNumber: 2,
        statusConceptId: CONCEPTS.ENUM_VERSION_DRAFT,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param definition - Valor de definition requerido por la operación.
     * @param version - Valor de version requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      definition = draftDefinition(),
      version = draftVersion(),
    ) {
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(definition);
      d.contextRepo.findEnumVersionForUpdate.mockResolvedValue(version);
      return { definition, version };
    }

    it('publishes the version, mints a cache token and activates the definition', async () => {
      const d = build();
      const { definition, version } = wire(d);

      const res = await d.service.publishVersion(DEFINITION, 2, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.ENUM_VERSION_PUBLISHED);
      expect(res.cacheToken).toEqual(expect.any(String));
      expect(res.cacheToken).toHaveLength(32);
      expect(version.effectiveFrom).toBeInstanceOf(Date);
      expect(definition.statusConceptId).toBe(CONCEPTS.ENUM_DEF_ACTIVE);
    });

    it('supersedes the previously published version', async () => {
      const d = build();
      wire(d);
      const previous: any = {
        id: 'version-prev',
        statusConceptId: CONCEPTS.ENUM_VERSION_PUBLISHED,
        effectiveTo: undefined,
      };
      d.contextRepo.findPublishedEnumVersionForUpdate.mockResolvedValue(
        previous,
      );

      const res = await d.service.publishVersion(DEFINITION, 2, actor);

      expect(res.supersededVersionId).toBe('version-prev');
      expect(previous.statusConceptId).toBe(CONCEPTS.ENUM_VERSION_SUPERSEDED);
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('refuses publishing a version with no enabled option', async () => {
      const d = build();
      wire(d);
      d.contextRepo.countEnabledOptions.mockResolvedValue(0);

      await expect(
        d.service.publishVersion(DEFINITION, 2, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses publishing a version that is not a draft', async () => {
      const d = build();
      wire(
        d,
        draftDefinition(),
        draftVersion({ statusConceptId: CONCEPTS.ENUM_VERSION_PUBLISHED }),
      );

      await expect(
        d.service.publishVersion(DEFINITION, 2, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(
        draftDefinition(),
      );
      d.contextRepo.findEnumVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.publishVersion(DEFINITION, 2, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createBinding (UC-45-04)', () => {
    const dto: any = {
      targetSchemaName: 'clinical',
      targetEntityName: 'encounters',
      targetFieldName: 'triage_level_concept_id',
      validationMode: 'STRICT',
    };

    it('binds the enum to the field', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionById.mockResolvedValue(draftDefinition());

      const res = await d.service.createBinding(DEFINITION, dto, actor);

      expect(res).toEqual({
        id: 'binding-1',
        dynamicEnumDefinitionId: DEFINITION,
        statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
      });
      expect(d.contextRepo.createEnumBinding).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
        }),
      );
    });

    it('demands a fallback concept in lenient mode', async () => {
      const d = build();

      await expect(
        d.service.createBinding(
          DEFINITION,
          { ...dto, validationMode: 'LENIENT' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts lenient mode with a fallback', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionById.mockResolvedValue(draftDefinition());

      const res = await d.service.createBinding(
        DEFINITION,
        { ...dto, validationMode: 'LENIENT', fallbackConceptId: FALLBACK },
        actor,
      );

      expect(res.id).toBe('binding-1');
    });

    it('rejects a field already governed by another enum', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionById.mockResolvedValue(draftDefinition());
      d.contextRepo.findEnumBindingByTarget.mockResolvedValue({
        id: 'binding-prev',
      });

      await expect(
        d.service.createBinding(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses binding a retired definition', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionById.mockResolvedValue(
        draftDefinition({ statusConceptId: CONCEPTS.ENUM_DEF_RETIRED }),
      );

      await expect(
        d.service.createBinding(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the definition does not exist', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionById.mockResolvedValue(null);

      await expect(
        d.service.createBinding(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('resolveValue (UC-45-05)', () => {
    const dto: any = {
      targetSchemaName: 'clinical',
      targetEntityName: 'encounters',
      targetFieldName: 'triage_level_concept_id',
      conceptId: CONCEPT_A,
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param binding - Valor de binding requerido por la operación.
     * @param options - Valor de options requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      binding: Record<string, unknown> = {},
      options: any[] = [{ conceptId: CONCEPT_A, code: 'RED', enabled: true }],
    ) {
      d.contextRepo.findEnumBindingByTarget.mockResolvedValue({
        id: 'binding-1',
        dynamicEnumDefinitionId: DEFINITION,
        validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
        required: false,
        ...binding,
      });
      d.contextRepo.findPublishedEnumVersion.mockResolvedValue({
        id: VERSION,
        cacheToken: 'token-1',
      });
      d.contextRepo.findEnumOptions.mockResolvedValue(options);
    }

    it('accepts a value that belongs to the published set', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveValue(dto, actor);

      expect(res).toEqual({
        accepted: true,
        resolvedConceptId: CONCEPT_A,
        resolvedCode: 'RED',
        usedFallback: false,
        validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
        cacheToken: 'token-1',
      });
    });

    it('resolves by code as well as by concept', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveValue(
        { ...dto, conceptId: undefined, code: 'RED' },
        actor,
      );

      expect(res.resolvedConceptId).toBe(CONCEPT_A);
    });

    it('rejects a value outside the set in strict mode', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveValue(
        { ...dto, conceptId: CONCEPT_B },
        actor,
      );

      expect(res.accepted).toBe(false);
      expect(res.rejectionReason).toBeDefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('ignores a disabled option', async () => {
      const d = build();
      wire(d, {}, [{ conceptId: CONCEPT_A, code: 'RED', enabled: false }]);

      const res = await d.service.resolveValue(dto, actor);

      expect(res.accepted).toBe(false);
    });

    it('falls back in lenient mode', async () => {
      const d = build();
      wire(d, {
        validationModeConceptId: CONCEPTS.VALIDATION_MODE_LENIENT,
        fallbackConceptId: FALLBACK,
      });

      const res = await d.service.resolveValue(
        { ...dto, conceptId: CONCEPT_B },
        actor,
      );

      expect(res.accepted).toBe(true);
      expect(res.usedFallback).toBe(true);
      expect(res.resolvedConceptId).toBe(FALLBACK);
    });

    it('validates strictly when the binding declares no mode', async () => {
      const d = build();
      wire(d, { validationModeConceptId: undefined });

      const res = await d.service.resolveValue(
        { ...dto, conceptId: CONCEPT_B },
        actor,
      );

      expect(res.accepted).toBe(false);
      expect(res.validationModeConceptId).toBe(CONCEPTS.VALIDATION_MODE_STRICT);
    });

    it('accepts an empty value on an optional field', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveValue(
        { ...dto, conceptId: undefined },
        actor,
      );

      expect(res.accepted).toBe(true);
      expect(res.resolvedConceptId).toBeUndefined();
    });

    it('rejects an empty value on a required field', async () => {
      const d = build();
      wire(d, { required: true });

      const res = await d.service.resolveValue(
        { ...dto, conceptId: undefined },
        actor,
      );

      expect(res.accepted).toBe(false);
    });

    it('fails when the field has no binding', async () => {
      const d = build();
      d.contextRepo.findEnumBindingByTarget.mockResolvedValue(null);

      await expect(
        d.service.resolveValue(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses resolving with no published version', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findPublishedEnumVersion.mockResolvedValue(null);

      await expect(
        d.service.resolveValue(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retireDefinition (UC-45-11)', () => {
    const dto: any = { reason: 'sustituida por el catálogo nacional' };

    it('retires the definition and disables its bindings', async () => {
      const d = build();
      const definition = draftDefinition({
        statusConceptId: CONCEPTS.ENUM_DEF_ACTIVE,
      });
      const binding: any = {
        id: 'binding-1',
        required: false,
        statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
      };
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(definition);
      d.contextRepo.findEnumBindingsForUpdate.mockResolvedValue([binding]);

      const res = await d.service.retireDefinition(DEFINITION, dto, actor);

      expect(res).toEqual({
        id: DEFINITION,
        statusConceptId: CONCEPTS.ENUM_DEF_RETIRED,
        disabledBindings: 1,
      });
      expect(definition.statusConceptId).toBe(CONCEPTS.ENUM_DEF_RETIRED);
      expect(binding.statusConceptId).toBe(CONCEPTS.ENUM_BINDING_DISABLED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses retiring while a required field depends on it', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(
        draftDefinition({ statusConceptId: CONCEPTS.ENUM_DEF_ACTIVE }),
      );
      d.contextRepo.findEnumBindingsForUpdate.mockResolvedValue([
        { id: 'binding-1', required: true },
      ]);

      await expect(
        d.service.retireDefinition(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses retiring twice', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(
        draftDefinition({ statusConceptId: CONCEPTS.ENUM_DEF_RETIRED }),
      );

      await expect(
        d.service.retireDefinition(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the definition does not exist', async () => {
      const d = build();
      d.contextRepo.findEnumDefinitionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.retireDefinition(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});

describe('DynamicEnumsService.readEnum', () => {
  const publishedVersion = {
    id: VERSION,
    dynamicEnumDefinitionId: DEFINITION,
    cacheToken: 'token-1',
  };
  const activeDefinition = {
    id: DEFINITION,
    code: 'administrative-gender',
    name: 'Género administrativo',
    description: 'Género administrativo de la persona',
    valueSetId: VALUE_SET,
    allowCustomValue: false,
    statusConceptId: CONCEPTS.ENUM_DEF_ACTIVE,
  };

  it('resolves the enumeration from the target field, without any uuid', async () => {
    const d = build();
    d.contextRepo.findEnumBindingByTarget.mockResolvedValue({
      dynamicEnumDefinitionId: DEFINITION,
    });
    d.contextRepo.findEnumDefinitionById.mockResolvedValue(activeDefinition);
    d.contextRepo.findPublishedEnumVersion.mockResolvedValue(publishedVersion);
    d.contextRepo.findEnumOptions.mockResolvedValue([
      {
        conceptId: CONCEPT_A,
        code: 'GENDER_MALE',
        display: 'Masculino',
        ordinal: 0,
        isDefault: true,
        enabled: true,
      },
      {
        conceptId: CONCEPT_B,
        code: 'GENDER_FEMALE',
        display: 'Femenino',
        ordinal: 1,
        enabled: true,
      },
    ]);

    const result = await d.service.readEnum({
      target: 'profiles.persons.administrative_gender_concept_id',
    });

    expect(d.contextRepo.findEnumBindingByTarget).toHaveBeenCalledWith(
      expect.anything(),
      'profiles',
      'persons',
      'administrative_gender_concept_id',
      CONCEPTS.ENUM_BINDING_ACTIVE,
    );
    expect(result.code).toBe('administrative-gender');
    expect(result.valueSetId).toBe(VALUE_SET);
    expect(result.cacheToken).toBe('token-1');
    expect(result.options).toEqual([
      {
        conceptId: CONCEPT_A,
        code: 'GENDER_MALE',
        display: 'Masculino',
        ordinal: 0,
        isDefault: true,
      },
      {
        conceptId: CONCEPT_B,
        code: 'GENDER_FEMALE',
        display: 'Femenino',
        ordinal: 1,
        isDefault: false,
      },
    ]);
  });

  it('resolves the enumeration from its stable code', async () => {
    const d = build();
    d.contextRepo.findEnumDefinitionByCode.mockResolvedValue(activeDefinition);
    d.contextRepo.findPublishedEnumVersion.mockResolvedValue(publishedVersion);
    d.contextRepo.findEnumOptions.mockResolvedValue([]);

    const result = await d.service.readEnum({ code: 'administrative-gender' });

    expect(result.definitionId).toBe(DEFINITION);
    expect(d.contextRepo.findEnumBindingByTarget).not.toHaveBeenCalled();
  });

  it('hides disabled options: offering them would reintroduce a retired value', async () => {
    const d = build();
    d.contextRepo.findEnumDefinitionByCode.mockResolvedValue(activeDefinition);
    d.contextRepo.findPublishedEnumVersion.mockResolvedValue(publishedVersion);
    d.contextRepo.findEnumOptions.mockResolvedValue([
      { conceptId: CONCEPT_A, code: 'A', display: 'A', enabled: true },
      { conceptId: CONCEPT_B, code: 'B', display: 'B', enabled: false },
    ]);

    const result = await d.service.readEnum({ code: 'administrative-gender' });

    expect(result.options.map((option) => option.conceptId)).toEqual([
      CONCEPT_A,
    ]);
  });

  it('rejects a target that is not written as schema.table.column', async () => {
    const d = build();

    await expect(
      d.service.readEnum({ target: 'persons.gender' }),
    ).rejects.toThrow();
  });

  it('requires either a target or a code', async () => {
    const d = build();

    await expect(d.service.readEnum({})).rejects.toThrow();
  });

  it('fails when the field has no enumeration bound to it', async () => {
    const d = build();
    d.contextRepo.findEnumBindingByTarget.mockResolvedValue(null);

    await expect(
      d.service.readEnum({ target: 'profiles.persons.unbound_concept_id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('does not serve a retired enumeration', async () => {
    const d = build();
    d.contextRepo.findEnumDefinitionByCode.mockResolvedValue({
      ...activeDefinition,
      statusConceptId: CONCEPTS.ENUM_DEF_RETIRED,
    });

    await expect(
      d.service.readEnum({ code: 'administrative-gender' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('fails when the enumeration has no published version', async () => {
    const d = build();
    d.contextRepo.findEnumDefinitionByCode.mockResolvedValue(activeDefinition);
    d.contextRepo.findPublishedEnumVersion.mockResolvedValue(null);

    await expect(
      d.service.readEnum({ code: 'administrative-gender' }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});

describe('DynamicEnumsService.listBindings', () => {
  it('returns the target path already composed, with its enumeration code', async () => {
    const d = build();
    d.contextRepo.findActiveEnumBindings.mockResolvedValue([
      {
        dynamicEnumDefinitionId: DEFINITION,
        targetSchemaName: 'profiles',
        targetEntityName: 'persons',
        targetFieldName: 'administrative_gender_concept_id',
        required: true,
        fallbackConceptId: FALLBACK,
        validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
      },
    ]);
    d.contextRepo.findEnumDefinitionsByIds.mockResolvedValue(
      new Map([
        [
          DEFINITION,
          {
            id: DEFINITION,
            code: 'administrative-gender',
            valueSetId: VALUE_SET,
          },
        ],
      ]),
    );

    const result = await d.service.listBindings({ schemaName: 'profiles' });

    expect(result.count).toBe(1);
    expect(result.items[0]).toEqual({
      target: 'profiles.persons.administrative_gender_concept_id',
      targetSchemaName: 'profiles',
      targetEntityName: 'persons',
      targetFieldName: 'administrative_gender_concept_id',
      enumCode: 'administrative-gender',
      definitionId: DEFINITION,
      valueSetId: VALUE_SET,
      required: true,
      fallbackConceptId: FALLBACK,
      validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
    });
  });

  it('drops a binding whose definition no longer exists instead of naming a catalog that is not there', async () => {
    const d = build();
    d.contextRepo.findActiveEnumBindings.mockResolvedValue([
      {
        dynamicEnumDefinitionId: DEFINITION,
        targetSchemaName: 'profiles',
        targetEntityName: 'persons',
        targetFieldName: 'administrative_gender_concept_id',
      },
    ]);
    d.contextRepo.findEnumDefinitionsByIds.mockResolvedValue(new Map());

    const result = await d.service.listBindings();

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
  });
});
