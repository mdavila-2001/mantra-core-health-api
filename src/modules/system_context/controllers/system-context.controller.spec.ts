import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { SystemContextController } from './system-context.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

/** ¿El handler lleva la marca `@Public()` que honra `JwtAuthGuard`? */
function esPublica(metodo: string): boolean | undefined {
  return Reflect.getMetadata(
    IS_PUBLIC_KEY,
    (SystemContextController.prototype as never as Record<string, object>)[
      metodo
    ],
  );
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const enumsService = {
    createDefinition: mockFn(),
    draftVersion: mockFn(),
    publishVersion: mockFn(),
    createBinding: mockFn(),
    resolveValue: mockFn(),
    retireDefinition: mockFn(),
    readEnum: mockFn(),
    listBindings: mockFn(),
  };
  const contextsService = {
    createContext: mockFn(),
    refreshContext: mockFn(),
    activateVersion: mockFn(),
    createBinding: mockFn(),
    rollbackContext: mockFn(),
  };
  return {
    controller: new SystemContextController(
      enumsService as any,
      contextsService as any,
    ),
    enumsService,
    contextsService,
  };
}

describe('SystemContextController', () => {
  it('delegates defining the enum (UC-45-01)', async () => {
    const d = build();
    const dto = { code: 'x' } as any;
    d.enumsService.createDefinition.mockResolvedValue({ id: ID });

    await d.controller.createEnumDefinition(dto, actor);

    expect(d.enumsService.createDefinition).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates drafting the version with the route id (UC-45-02)', async () => {
    const d = build();
    const dto = { options: [] } as any;
    d.enumsService.draftVersion.mockResolvedValue({ id: ID });

    await d.controller.draftEnumVersion(ID, dto, actor);

    expect(d.enumsService.draftVersion).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates publishing with the definition and version number (UC-45-03)', async () => {
    const d = build();
    d.enumsService.publishVersion.mockResolvedValue({ id: ID });

    await d.controller.publishEnumVersion(ID, 3, actor);

    expect(d.enumsService.publishVersion).toHaveBeenCalledWith(ID, 3, actor);
  });

  it('delegates the enum binding (UC-45-04)', async () => {
    const d = build();
    const dto = { targetFieldName: 'f' } as any;
    d.enumsService.createBinding.mockResolvedValue({ id: ID });

    await d.controller.createEnumBinding(ID, dto, actor);

    expect(d.enumsService.createBinding).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the value resolution (UC-45-05)', async () => {
    const d = build();
    const dto = { targetFieldName: 'f' } as any;
    d.enumsService.resolveValue.mockResolvedValue({ accepted: true });

    await d.controller.resolveEnumValue(dto, actor);

    expect(d.enumsService.resolveValue).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates retiring the definition (UC-45-11)', async () => {
    const d = build();
    const dto = { reason: 'x' } as any;
    d.enumsService.retireDefinition.mockResolvedValue({ id: ID });

    await d.controller.retireEnumDefinition(ID, dto, actor);

    expect(d.enumsService.retireDefinition).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates creating the context (UC-45-06)', async () => {
    const d = build();
    const dto = { code: 'x', contextJson: {} } as any;
    d.contextsService.createContext.mockResolvedValue({ id: ID });

    await d.controller.createContext(dto, actor);

    expect(d.contextsService.createContext).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the refresh with the route id (UC-45-07)', async () => {
    const d = build();
    const dto = { idempotencyKey: 'k', contextJson: {} } as any;
    d.contextsService.refreshContext.mockResolvedValue({ runId: ID });

    await d.controller.refreshContext(ID, dto, actor);

    expect(d.contextsService.refreshContext).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates activating with the context and version number (UC-45-09)', async () => {
    const d = build();
    const dto = {} as any;
    d.contextsService.activateVersion.mockResolvedValue({ id: ID });

    await d.controller.activateContextVersion(ID, 2, dto, actor);

    expect(d.contextsService.activateVersion).toHaveBeenCalledWith(
      ID,
      2,
      dto,
      actor,
    );
  });

  it('delegates the context binding (UC-45-10)', async () => {
    const d = build();
    const dto = { consumerId: ID } as any;
    d.contextsService.createBinding.mockResolvedValue({ id: ID });

    await d.controller.createContextBinding(ID, dto, actor);

    expect(d.contextsService.createBinding).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the rollback (UC-45-12)', async () => {
    const d = build();
    const dto = { targetVersionNumber: 2, reason: 'x' } as any;
    d.contextsService.rollbackContext.mockResolvedValue({ id: ID });

    await d.controller.rollbackContext(ID, dto, actor);

    expect(d.contextsService.rollbackContext).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});

describe('SystemContextController — lectura del catálogo', () => {
  it('readEnum propaga el campo destino tal como llega', async () => {
    const d = build();
    d.enumsService.readEnum.mockResolvedValue({ options: [] });

    await d.controller.readEnum(
      'profiles.persons.administrative_gender_concept_id',
    );

    expect(d.enumsService.readEnum).toHaveBeenCalledWith({
      target: 'profiles.persons.administrative_gender_concept_id',
      code: undefined,
    });
  });

  it('readEnum admite pedir la enumeración por su código estable', async () => {
    const d = build();
    d.enumsService.readEnum.mockResolvedValue({ options: [] });

    await d.controller.readEnum(undefined, 'sex-at-birth');

    expect(d.enumsService.readEnum).toHaveBeenCalledWith({
      target: undefined,
      code: 'sex-at-birth',
    });
  });

  it('listEnumBindings devuelve toda la tabla cuando no se acota', async () => {
    const d = build();
    d.enumsService.listBindings.mockResolvedValue({ items: [], count: 0 });

    await d.controller.listEnumBindings();

    expect(d.enumsService.listBindings).toHaveBeenCalledWith({
      schemaName: undefined,
      entityName: undefined,
    });
  });

  it('listEnumBindings acota por esquema y tabla', async () => {
    const d = build();
    d.enumsService.listBindings.mockResolvedValue({ items: [], count: 0 });

    await d.controller.listEnumBindings('profiles', 'persons');

    expect(d.enumsService.listBindings).toHaveBeenCalledWith({
      schemaName: 'profiles',
      entityName: 'persons',
    });
  });
});

describe('SystemContextController — quién puede leer el catálogo', () => {
  it('readEnum es pública: el alta anónima de paciente la consume sin sesión', () => {
    // Sin la marca el guard global responde 401 y el desplegable del registro
    // nace vacío. No se afloja el guard: se declara la excepción en el handler.
    expect(esPublica('readEnum')).toBe(true);
  });

  it('listEnumBindings sigue exigiendo sesión', () => {
    // Descubrir qué columnas son de catálogo no lo necesita ningún anónimo.
    expect(esPublica('listEnumBindings')).toBeUndefined();
  });

  it.each([
    'createEnumDefinition',
    'draftEnumVersion',
    'publishEnumVersion',
    'createEnumBinding',
    'resolveEnumValue',
    'retireEnumDefinition',
  ])('la escritura %s no es pública', (metodo) => {
    expect(esPublica(metodo)).toBeUndefined();
  });
});
