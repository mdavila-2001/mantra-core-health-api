import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { VisitorsRepository } from '../repositories';
import { PharmaLabAccessService } from '../services/pharma-lab-access.service';

const PHARMA_LAB_OPEN_TO_KEY = 'pharmaLabOpenTo';

/**
 * Roles que pueden usar la ruta sobre **cualquier** laboratorio, sin ser de él.
 *
 * Es la excepción, no la regla: hoy sólo el reporte de farmacovigilancia, que
 * cualquier médico tiene que poder enviar al laboratorio del medicamento que
 * sospecha, sea o no de su red.
 *
 * @param roles - Roles con acceso abierto a la ruta.
 * @returns El decorador.
 */
export const PharmaLabOpenTo = (...roles: string[]) =>
  SetMetadata(PHARMA_LAB_OPEN_TO_KEY, roles);

/**
 * Exige que quien opera sobre `/…/:pharmaLabId/…` sea de ese laboratorio.
 *
 * `RolesGuard` sólo mira el rol: sin esto, el `REGULATORY_AFFAIRS` o el
 * `PHARMACOVIGILANCE_OFFICER` de un laboratorio leía y escribía el catálogo,
 * los documentos regulatorios y los reportes de farmacovigilancia de cualquier
 * otro con sólo cambiar el id de la ruta.
 *
 * Pasa, en este orden:
 * 1. la ruta no trae `:pharmaLabId` (no es de su incumbencia);
 * 2. el actor tiene un rol de {@link PharmaLabOpenTo} en esa ruta;
 * 3. administra el laboratorio (`requireAdministeredLab`: red entera, miembro
 *    de su organización o personal activo);
 * 4. es visitador médico operativo **de ese** laboratorio — sólo llega a una
 *    ruta si `RolesGuard` ya admitió `MEDICAL_VISITOR` en ella.
 *
 * Si no, 404: no confirma que el laboratorio exista.
 */
@Injectable()
export class PharmaLabScopeGuard implements CanActivate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Lector de metadata de la ruta.
   * @param em - Contexto de persistencia; se usa un fork por petición.
   * @param access - Reglas de acceso del módulo.
   * @param visitorsRepo - Fichas de visitadores.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly em: EntityManager,
    private readonly access: PharmaLabAccessService,
    private readonly visitorsRepo: VisitorsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const pharmaLabId = (request.params as Record<string, string> | undefined)
      ?.pharmaLabId;
    const actor = request.user;
    if (!pharmaLabId || !actor) return true;

    const openTo =
      this.reflector.getAllAndOverride<string[]>(PHARMA_LAB_OPEN_TO_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (openTo.some((role) => actor.roles.includes(role))) return true;

    const em = this.em.fork();
    try {
      await this.access.requireAdministeredLab(em, pharmaLabId, actor);
      return true;
    } catch (error) {
      if (!(error instanceof ResourceNotFoundException)) throw error;
    }

    if (actor.roles.includes('MEDICAL_VISITOR')) {
      const visitor = await this.visitorsRepo.findVisitorByUser(em, actor.id);
      if (visitor?.pharmaLabId === pharmaLabId) {
        await this.access.requireVisitorOperable(em, visitor);
        return true;
      }
    }

    throw new ResourceNotFoundException('Laboratorio no encontrado', {
      pharmaLabId,
    });
  }
}
