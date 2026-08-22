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
@Injectable()
export class PharmaLabAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orgRepo - Repositorio del laboratorio y su personal.
   * @param visitorsRepo - Repositorio de visitadores.
   */
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
