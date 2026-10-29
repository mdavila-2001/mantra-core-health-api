import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { from, mergeMap, type Observable } from 'rxjs';
import { requireTenantId } from '../../../common';
import {
  PractitionerScopeService,
  collectPractitionerRefs,
} from './practitioner-scope.service';

/**
 * Antes de ejecutar cualquier ruta de quirófanos o del caso quirúrgico, comprueba que todos
 * los ids de profesional que trae el cuerpo son de la organización activa.
 *
 * Es un solo punto para todo el módulo: cirujano, anestesiólogo, equipo, quien firma cada fase
 * del check-list, autor del reporte, coordinador, dueño de un bloque… Corre después del
 * contexto de tenant (que es global) y antes de la validación del DTO, por eso sólo mira ids
 * con forma de UUID. Los servicios de F4 vuelven a comprobar los suyos (defensa en
 * profundidad), porque otro módulo podría llamarlos sin pasar por HTTP.
 */
@Injectable()
export class PractitionerRefsInterceptor implements NestInterceptor {
  /**
   * @param em - Contexto de lectura.
   * @param scope - Pertenencia de un profesional al tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PractitionerScopeService,
  ) {}

  /** @inheritdoc */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<{ body?: unknown }>();
    const refs = collectPractitionerRefs(request.body);
    if (refs.length === 0) return next.handle();
    return from(
      this.scope.assertInTenant(this.em, requireTenantId(), refs),
    ).pipe(mergeMap(() => next.handle()));
  }
}
