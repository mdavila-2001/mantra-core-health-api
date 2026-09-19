import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { MedicalVisitors, PharmaLabs } from '../entities';
import { OrganizationRepository, VisitorsRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';

/**
 * Puerta única por la que pasan todas las operaciones del carril que dependen de
 * una vinculación viva.
 *
 * Existe como servicio propio, y no como una comprobación repetida en cada caso
 * de uso, porque la **regla principal del visitador** (spec 5736-5738) es
 * exactamente esto: el visitador existe funcionalmente solo mientras mantenga
 * vinculación activa con un laboratorio activo. Una regla que hay que recordar
 * escribir en once servicios distintos es una regla que en algún momento no se
 * escribe.
 */

/** Roles que, con alcance global, administran todos los laboratorios. */
const CROSS_LAB_ROLES: readonly string[] = ['PLATFORM_ADMIN', 'BUSINESS_ADMIN'];
@Injectable()
export class PharmaLabAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orgRepo - Repositorio del laboratorio y su personal.
   * @param visitorsRepo - Repositorio de visitadores.
   */
  /**
   * ¿Administra el actor todos los laboratorios de la red?
   *
   * Sólo `SUPERADMIN` y `PLATFORM_ADMIN`/`BUSINESS_ADMIN` con alcance global.
   * Un código concedido dentro de un tenant (MCH-001, `scopedRoles`) no cuenta,
   * igual que en `RolesGuard`.
   *
   * @param actor - Usuario autenticado.
   * @returns `true` si puede operar sobre cualquier laboratorio.
   */
  administersAllLabs(actor: AuthenticatedUser): boolean {
    if (actor.roles.includes('SUPERADMIN')) return true;
    return CROSS_LAB_ROLES.some(
      (role) =>
        actor.roles.includes(role) &&
        !Object.values(actor.scopedRoles ?? {}).some((codes) =>
          codes.includes(role),
        ),
    );
  }

  /**
   * Exige que el actor administre la organización dada.
   *
   * @param actor - Usuario autenticado.
   * @param tenantId - Organización del laboratorio.
   * @param pharmaLabId - Laboratorio, para el detalle del error.
   * @throws ResourceNotFoundException si no la administra: responder 404 y no
   *   403 evita confirmar que el laboratorio existe.
   */
  assertAdministers(
    actor: AuthenticatedUser,
    tenantId: string,
    pharmaLabId?: string,
  ): void {
    if (this.administersAllLabs(actor)) return;
    if ((actor.tenantIds ?? []).includes(tenantId)) return;
    throw new ResourceNotFoundException('Laboratorio no encontrado', {
      pharmaLabId,
    });
  }

  /**
   * Resuelve un laboratorio que el actor administra.
   *
   * Antes las rutas de `/pharma-labs/:pharmaLabId` sólo buscaban el
   * laboratorio: el administrador de uno podía editar el perfil, el personal y
   * los permisos de cualquier otro con sólo conocer su id.
   *
   * @param tx - Transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param actor - Usuario autenticado.
   * @param options - `active: true` exige además que esté activo.
   * @returns El laboratorio.
   */
  async requireAdministeredLab(
    tx: EntityManager,
    pharmaLabId: string,
    actor: AuthenticatedUser,
    options: { active?: boolean } = {},
  ): Promise<PharmaLabs> {
    const lab = await this.requireLab(tx, pharmaLabId);
    this.assertAdministers(actor, lab.tenantId, pharmaLabId);
    if (options.active) return this.requireActiveLab(tx, pharmaLabId);
    return lab;
  }

  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly visitorsRepo: VisitorsRepository,
  ) {}

  /**
   * Resuelve un laboratorio activo por identificador.
   *
   * @param tx - Transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns El laboratorio.
   * @throws ResourceNotFoundException si no existe.
   * @throws PreconditionFailedException si no está activo.
   */
  async requireActiveLab(
    tx: EntityManager,
    pharmaLabId: string,
  ): Promise<PharmaLabs> {
    const lab = await this.orgRepo.findLab(tx, pharmaLabId);
    if (!lab) {
      throw new ResourceNotFoundException('Laboratorio no encontrado', {
        pharmaLabId,
      });
    }
    if (lab.statusConceptId !== PHL.LAB_ACTIVE) {
      throw new PreconditionFailedException('El laboratorio no está activo', {
        pharmaLabId,
      });
    }
    return lab;
  }

  /**
   * Resuelve un laboratorio por identificador sin exigir que esté activo.
   *
   * Lo usan las lecturas y las operaciones administrativas que deben seguir
   * funcionando con un laboratorio suspendido —consultar la auditoría de un
   * laboratorio cerrado es justamente cuando más falta hace—.
   *
   * @param tx - Transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns El laboratorio.
   * @throws ResourceNotFoundException si no existe.
   */
  async requireLab(
    tx: EntityManager,
    pharmaLabId: string,
  ): Promise<PharmaLabs> {
    const lab = await this.orgRepo.findLab(tx, pharmaLabId);
    if (!lab) {
      throw new ResourceNotFoundException('Laboratorio no encontrado', {
        pharmaLabId,
      });
    }
    return lab;
  }

  /**
   * Resuelve el visitador que corresponde a la sesión y comprueba que puede
   * operar: vinculación activa y laboratorio activo.
   *
   * @param tx - Transacción activa.
   * @param actor - Usuario autenticado.
   * @returns El visitador y su laboratorio.
   * @throws ResourceNotFoundException si la cuenta no es de un visitador.
   * @throws PreconditionFailedException si la vinculación o el laboratorio no
   *   están activos.
   */
  async requireOperatingVisitor(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<{
    /** Ficha del visitador que ejecuta la operación. */
    visitor: MedicalVisitors;
    /** Laboratorio del que depende. */
    lab: PharmaLabs;
  }> {
    const visitor = await this.visitorsRepo.findVisitorByUser(tx, actor.id);
    if (!visitor) {
      throw new ResourceNotFoundException(
        'La cuenta no corresponde a un visitador médico',
        { userId: actor.id },
      );
    }
    return {
      visitor,
      lab: await this.requireVisitorOperable(tx, visitor),
    };
  }

  /**
   * Comprueba que un visitador concreto puede operar.
   *
   * @param tx - Transacción activa.
   * @param visitor - Ficha del visitador.
   * @returns El laboratorio activo del que depende.
   * @throws PreconditionFailedException si la vinculación está terminada o
   *   suspendida, o si el laboratorio no está activo.
   */
  async requireVisitorOperable(
    tx: EntityManager,
    visitor: MedicalVisitors,
  ): Promise<PharmaLabs> {
    if (visitor.statusConceptId !== PHL.LINK_ACTIVE) {
      throw new PreconditionFailedException(
        'El visitador no tiene una vinculación activa con un laboratorio',
        { medicalVisitorId: visitor.id },
      );
    }
    const lab = await this.orgRepo.findLab(tx, visitor.pharmaLabId);
    if (!lab || lab.statusConceptId !== PHL.LAB_ACTIVE) {
      throw new PreconditionFailedException(
        'El laboratorio del visitador no está activo',
        { medicalVisitorId: visitor.id, pharmaLabId: visitor.pharmaLabId },
      );
    }
    return lab;
  }

  /**
   * Resuelve un visitador por identificador dentro de un laboratorio.
   *
   * @param tx - Transacción activa.
   * @param pharmaLabId - Laboratorio esperado.
   * @param medicalVisitorId - Visitador.
   * @returns El visitador.
   * @throws ResourceNotFoundException si no existe o pertenece a otro laboratorio.
   */
  async requireVisitorOfLab(
    tx: EntityManager,
    pharmaLabId: string,
    medicalVisitorId: string,
  ): Promise<MedicalVisitors> {
    const visitor = await this.visitorsRepo.findVisitor(tx, medicalVisitorId);
    if (!visitor || visitor.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Visitador no encontrado en el laboratorio',
        { pharmaLabId, medicalVisitorId },
      );
    }
    return visitor;
  }
}
