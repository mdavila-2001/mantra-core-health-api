import { EntityManager } from '@mikro-orm/postgresql';
import { Test } from '@nestjs/testing';
import { AuthzEffectiveRolesService } from '../../authz/services/authz-effective-roles.service';
import { MikroOrmUiVisibilityStore } from './mikro-orm-ui-visibility.store';
import { UiVisibilityStore } from './ui-visibility.store';

/**
 * El inyector de Nest resuelve el store con las dependencias que declara su constructor.
 *
 * Si `EntityManager` se importa como `type`, el import se borra al compilar y Nest ve el
 * primer parámetro como `Function`: la API no arranca («Nest can't resolve dependencies of
 * the MikroOrmUiVisibilityStore (?, AuthzEffectiveRolesService)»).
 */
describe('MikroOrmUiVisibilityStore · inyección', () => {
  it('Nest lo construye con EntityManager y AuthzEffectiveRolesService', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: UiVisibilityStore, useClass: MikroOrmUiVisibilityStore },
        { provide: EntityManager, useValue: {} },
        { provide: AuthzEffectiveRolesService, useValue: {} },
      ],
    }).compile();

    expect(moduleRef.get(UiVisibilityStore)).toBeInstanceOf(
      MikroOrmUiVisibilityStore,
    );
  });
});
