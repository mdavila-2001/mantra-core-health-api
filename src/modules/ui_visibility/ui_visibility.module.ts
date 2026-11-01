import { Module } from '@nestjs/common';
import { AuthzModule } from '../authz/authz.module';
import { AdminUiVisibilityController } from './controllers/admin-ui-visibility.controller';
import { MeUiVisibilityController } from './controllers/me-ui-visibility.controller';
import { MikroOrmUiVisibilityStore } from './repositories/mikro-orm-ui-visibility.store';
import { UiVisibilityStore } from './repositories/ui-visibility.store';
import { UiVisibilityAdminService } from './services/ui-visibility-admin.service';
import { UiVisibilityMeService } from './services/ui-visibility-me.service';

/**
 * Visibilidad de la interfaz: catálogo de elementos, reglas SHOW/HIDE por sujeto y la
 * resolución por persona. La visibilidad NO autoriza (CONTRATO.md). Dueño de
 * `authz.ui_visibility_elements` y `authz.ui_visibility_rules`.
 */
@Module({
  imports: [AuthzModule],
  controllers: [AdminUiVisibilityController, MeUiVisibilityController],
  providers: [
    { provide: UiVisibilityStore, useClass: MikroOrmUiVisibilityStore },
    UiVisibilityAdminService,
    UiVisibilityMeService,
  ],
})
export class UiVisibilityModule {}
