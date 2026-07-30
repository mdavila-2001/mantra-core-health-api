import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContractClauses, EnterpriseDocumentFlow } from '../entities';

/**
 * Acceso de solo lectura al catálogo de cláusulas contractuales y al flujo de
 * documentos empresariales de `erp.*`.
 *
 * `erp.contract_clauses` es un catálogo de cláusulas por tenant (no cuelga de un
 * contrato concreto: la asociación vive en `contract_clause_instances`), por lo
 * que la consulta natural es por tenant. `erp.enterprise_document_flow` enlaza
 * un documento predecesor con su sucesor, de modo que se navega por cualquiera
 * de los dos extremos.
 */
@Injectable()
export class ErpContractsExtRepository {
  /**
   * Obtiene find clause by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find clause by id conforme al contrato `Promise<ContractClauses | null>`.
   */
  findClauseById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ContractClauses | null> {
    return em.findOne(ContractClauses, { id, tenantId });
  }

  /**
   * Cláusulas del catálogo de un tenant: `contract_clauses` no referencia un
   * contrato, se agrupa por tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de list by tenant conforme al contrato `Promise<ContractClauses[]>`.
   */
  listByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<ContractClauses[]> {
    return em.find(ContractClauses, { tenantId });
  }

  /**
   * Obtiene find document flow by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find document flow by id conforme al contrato `Promise<EnterpriseDocumentFlow | null>`.
   */
  findDocumentFlowById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<EnterpriseDocumentFlow | null> {
    return em.findOne(EnterpriseDocumentFlow, { id, tenantId });
  }

  /**
   * Enlaces cuyo predecesor es el documento indicado (documentos que descienden
   * de él).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param predecessorId - Identificador de predecessor.
   * @returns Resultado de list by predecessor conforme al contrato `Promise<EnterpriseDocumentFlow[]>`.
   */
  listByPredecessor(
    em: EntityManager,
    tenantId: string,
    predecessorId: string,
  ): Promise<EnterpriseDocumentFlow[]> {
    return em.find(EnterpriseDocumentFlow, { tenantId, predecessorId });
  }

  /**
   * Enlaces cuyo sucesor es el documento indicado (documentos de los que
   * proviene).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param successorId - Identificador de successor.
   * @returns Resultado de list by successor conforme al contrato `Promise<EnterpriseDocumentFlow[]>`.
   */
  listBySuccessor(
    em: EntityManager,
    tenantId: string,
    successorId: string,
  ): Promise<EnterpriseDocumentFlow[]> {
    return em.find(EnterpriseDocumentFlow, { tenantId, successorId });
  }
}
