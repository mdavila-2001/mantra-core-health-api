import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  InformationalMaterials,
  MaterialApprovals,
  MaterialAssets,
  PharmaProducts,
} from '../entities';

/** Acceso a datos del catálogo de medicamentos y del material informativo. */
@Injectable()
export class CatalogRepository {
  /**
   * Obtiene un medicamento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del producto.
   * @returns El producto, o `null` si no existe.
   */
  findProduct(em: EntityManager, id: string): Promise<PharmaProducts | null> {
    return em.findOne(PharmaProducts, { id });
  }

  /**
   * Obtiene varios medicamentos por identificador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores.
   * @returns Los productos encontrados.
   */
  findProductsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PharmaProducts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PharmaProducts, { id: { $in: [...ids] } });
  }

  /**
   * Lista el catálogo de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Productos ordenados por nombre comercial.
   */
  listProducts(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<PharmaProducts[]> {
    return em.find(
      PharmaProducts,
      { pharmaLabId },
      { orderBy: { tradeName: 'asc' } },
    );
  }

  /**
   * Crea un medicamento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createProduct(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmaProducts {
    return em.create(
      PharmaProducts,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene un material informativo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del material.
   * @returns El material, o `null` si no existe.
   */
  findMaterial(
    em: EntityManager,
    id: string,
  ): Promise<InformationalMaterials | null> {
    return em.findOne(InformationalMaterials, { id });
  }

  /**
   * Obtiene varios materiales por identificador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores.
   * @returns Los materiales encontrados.
   */
  findMaterialsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<InformationalMaterials[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(InformationalMaterials, { id: { $in: [...ids] } });
  }

  /**
   * Lista el material informativo de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Materiales del más reciente al más antiguo.
   */
  listMaterials(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<InformationalMaterials[]> {
    return em.find(
      InformationalMaterials,
      { pharmaLabId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Crea un material informativo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createMaterial(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InformationalMaterials {
    return em.create(
      InformationalMaterials,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Añade un adjunto a un material.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createAsset(
    em: EntityManager,
    data: Record<string, unknown>,
  ): MaterialAssets {
    return em.create(
      MaterialAssets,
      {
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista los adjuntos de un material.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param informationalMaterialId - Material.
   * @returns Adjuntos del material.
   */
  listAssets(
    em: EntityManager,
    informationalMaterialId: string,
  ): Promise<MaterialAssets[]> {
    return em.find(MaterialAssets, { informationalMaterialId });
  }

  /**
   * Sella una decisión de revisión interna.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la decisión.
   * @returns La entidad creada, aún sin `flush`.
   */
  createApproval(
    em: EntityManager,
    data: Record<string, unknown>,
  ): MaterialApprovals {
    const now = new Date();
    return em.create(
      MaterialApprovals,
      {
        decidedAt: now,
        createdAt: now,
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista el historial de revisiones de un material.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param informationalMaterialId - Material.
   * @returns Decisiones de la más reciente a la más antigua.
   */
  listApprovals(
    em: EntityManager,
    informationalMaterialId: string,
  ): Promise<MaterialApprovals[]> {
    return em.find(
      MaterialApprovals,
      { informationalMaterialId },
      { orderBy: { decidedAt: 'desc' } },
    );
  }
}
