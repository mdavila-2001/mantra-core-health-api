import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  roleAuthorizesInTenant,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import {
  assertResourceInTenant,
  type ResourceScopeFailure,
} from '../../../common/tenant/resource-scope';
import { ErpErrorReason } from '../erp.error-reasons';
import {
  ErpContractsRepository,
  ErpOperationsRepository,
} from '../repositories';
import type {
  BusinessPartners,
  BusinessPartnerBankAccounts,
  Contracts,
  Employees,
  LeaseContracts,
  PurchaseOrders,
  PurchaseRequisitions,
} from '../entities';

/** El 404 uniforme de cualquier recurso ERP fuera de alcance. */
const NOT_FOUND = (message: string): ResourceScopeFailure => ({
  message,
  reason: ErpErrorReason.ERP_RESOURCE_NOT_FOUND,
});

/** El 404 uniforme de las ausencias y del empleado al que pertenecen. */
export const TIME_OFF_NOT_FOUND: ResourceScopeFailure = {
  message: 'Solicitud de ausencia no encontrada',
  reason: ErpErrorReason.ERP_TIME_OFF_NOT_FOUND,
};

/**
 * Resuelve por UUID los recursos ERP acotados al tenant activo.
 *
 * Socios, contratos, requisiciones y órdenes guardan `tenant_id` y se buscan
 * por `id + tenant` en la misma consulta —también la que bloquea la fila—; el
 * resultado se vuelve a comprobar con `assertResourceInTenant`. Los recursos
 * sin columna propia lo heredan: la cuenta bancaria de su socio, el
 * arrendamiento de su contrato y el empleado o la factura de su práctica.
 *
 * Lo ajeno responde exactamente igual que lo inexistente (`404`, mismo mensaje
 * y `reason`, sin `details`), y el tenant sale siempre del contexto verificado,
 * nunca del cuerpo.
 */
@Injectable()
export class ErpScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param contractsRepo - Socios, cuentas, contratos y arrendamientos.
   * @param operationsRepo - Empleados, órdenes, prácticas y facturas.
   */
  constructor(
    private readonly contractsRepo: ErpContractsRepository,
    private readonly operationsRepo: ErpOperationsRepository,
  ) {}

  /**
   * Tenant propietario de un alta: el del contexto.
   *
   * @param bodyTenantId - Tenant declarado por el cliente, si lo hubo.
   * @returns El tenant activo, única fuente de verdad.
   * @throws ResourceNotFoundException si el cuerpo declara otro tenant.
   */
  activeTenantFor(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      throw this.notFound(NOT_FOUND('Recurso no encontrado'));
    }
    return tenantId;
  }

  /**
   * Carga un socio de negocio del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del socio.
   * @param message - Mensaje del 404 (el mismo para lo ajeno y lo inexistente).
   * @returns El socio, ya acotado al tenant.
   */
  async partner(
    tx: EntityManager,
    id: string,
    message = 'Socio de negocio no encontrado',
  ): Promise<BusinessPartners> {
    const tenantId = requireTenantId();
    const partner = await this.contractsRepo.findPartnerById(tx, id, tenantId);
    return assertResourceInTenant(
      partner,
      partner?.tenantId,
      tenantId,
      NOT_FOUND(message),
    );
  }

  /**
   * Carga la cuenta bancaria de un socio del tenant activo.
   *
   * La cuenta se bloquea solo después de comprobar que el socio es propio. Una
   * cuenta que existe pero es de otro socio del mismo tenant se informa como
   * precondición (lo decide el llamador con `ownerPartnerId`); una de un socio
   * ajeno responde igual que una inexistente.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param accountId - UUID de la cuenta.
   * @returns La cuenta bloqueada y el socio dueño dentro del tenant, si lo hay.
   */
  async bankAccountForUpdate(
    tx: EntityManager,
    accountId: string,
  ): Promise<{
    account: BusinessPartnerBankAccounts;
    owner: BusinessPartners;
  }> {
    const tenantId = requireTenantId();
    const found = await this.contractsRepo.findBankAccountById(tx, accountId);
    const owner = found
      ? await this.contractsRepo.findPartnerById(
          tx,
          found.businessPartnerId,
          tenantId,
        )
      : null;
    const failure = NOT_FOUND('Cuenta bancaria no encontrada');
    assertResourceInTenant(found, owner?.tenantId, tenantId, failure);
    // Recién con el socio comprobado se bloquea la fila.
    const account = await this.contractsRepo.findBankAccountForUpdate(
      tx,
      accountId,
    );
    return {
      account: assertResourceInTenant(
        account,
        owner?.tenantId,
        tenantId,
        failure,
      ),
      owner: owner as BusinessPartners,
    };
  }

  /**
   * Carga un contrato del tenant activo, bloqueado.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del contrato.
   * @returns El contrato, ya acotado al tenant.
   */
  async contractForUpdate(tx: EntityManager, id: string): Promise<Contracts> {
    const tenantId = requireTenantId();
    const contract = await this.contractsRepo.findContractByIdForUpdate(
      tx,
      id,
      tenantId,
    );
    return assertResourceInTenant(
      contract,
      contract?.tenantId,
      tenantId,
      NOT_FOUND('Contrato no encontrado'),
    );
  }

  /**
   * Comprueba que un contrato referenciado por el cuerpo es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del contrato.
   * @returns El contrato, ya acotado al tenant.
   */
  async contract(tx: EntityManager, id: string): Promise<Contracts> {
    const tenantId = requireTenantId();
    const contract = await this.contractsRepo.findContractById(
      tx,
      id,
      tenantId,
    );
    return assertResourceInTenant(
      contract,
      contract?.tenantId,
      tenantId,
      NOT_FOUND('Contrato no encontrado'),
    );
  }

  /**
   * Carga un arrendamiento cuyo contrato es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del arrendamiento.
   * @returns El arrendamiento, ya acotado al tenant.
   */
  async leaseContract(tx: EntityManager, id: string): Promise<LeaseContracts> {
    const tenantId = requireTenantId();
    const lease = await this.contractsRepo.findLeaseContractById(tx, id);
    const contract = lease
      ? await this.contractsRepo.findContractById(
          tx,
          lease.contractId,
          tenantId,
        )
      : null;
    return assertResourceInTenant(
      lease,
      contract?.tenantId,
      tenantId,
      NOT_FOUND('Arrendamiento no encontrado'),
    );
  }

  /**
   * Carga una orden de compra del tenant activo, bloqueada.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la orden.
   * @returns La orden, ya acotada al tenant.
   */
  async purchaseOrderForUpdate(
    tx: EntityManager,
    id: string,
  ): Promise<PurchaseOrders> {
    const tenantId = requireTenantId();
    const order = await this.operationsRepo.findPurchaseOrderForUpdate(
      tx,
      id,
      tenantId,
    );
    return assertResourceInTenant(
      order,
      order?.tenantId,
      tenantId,
      NOT_FOUND('Orden de compra no encontrada'),
    );
  }

  /**
   * Comprueba que una requisición referenciada por el cuerpo es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la requisición.
   * @returns La requisición, ya acotada al tenant.
   */
  async requisition(
    tx: EntityManager,
    id: string,
  ): Promise<PurchaseRequisitions> {
    const tenantId = requireTenantId();
    const requisition = await this.contractsRepo.findRequisitionById(
      tx,
      id,
      tenantId,
    );
    return assertResourceInTenant(
      requisition,
      requisition?.tenantId,
      tenantId,
      NOT_FOUND('Requisición no encontrada'),
    );
  }

  /**
   * Comprueba que una práctica es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la práctica.
   */
  async practice(tx: EntityManager, id: string): Promise<void> {
    const tenantId = requireTenantId();
    const practice = await this.operationsRepo.findPracticeById(tx, id);
    assertResourceInTenant(
      practice,
      practice?.tenantId,
      tenantId,
      NOT_FOUND('Práctica no encontrada'),
    );
  }

  /**
   * Carga una factura (`billing.bills`) cuya práctica es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la factura.
   */
  async bill(tx: EntityManager, id: string): Promise<void> {
    const tenantId = requireTenantId();
    const bill = await this.operationsRepo.findBillById(tx, id);
    const practice = bill
      ? await this.operationsRepo.findPracticeById(tx, bill.practiceId)
      : null;
    assertResourceInTenant(
      bill,
      practice?.tenantId,
      tenantId,
      NOT_FOUND('Factura no encontrada'),
    );
  }

  /**
   * Carga un empleado cuya práctica es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del empleado.
   * @param failure - 404 a usar; por defecto el de recurso ERP no encontrado.
   * @returns El empleado, ya acotado al tenant.
   */
  async employee(
    tx: EntityManager,
    id: string,
    failure: ResourceScopeFailure = NOT_FOUND('Empleado no encontrado'),
  ): Promise<Employees> {
    const tenantId = requireTenantId();
    const employee = await this.operationsRepo.findEmployeeById(tx, id);
    const practice = employee
      ? await this.operationsRepo.findPracticeById(tx, employee.practiceId)
      : null;
    return assertResourceInTenant(
      employee,
      practice?.tenantId,
      tenantId,
      failure,
    );
  }

  /**
   * ¿Opera el actor como RR. HH. o administración en el tenant activo?
   *
   * `ERP_ADMIN` y `HR_ADMIN` autorizados en el tenant (y `SUPERADMIN`) operan
   * sobre cualquier empleado de la organización; cualquier otro actor —un
   * `EMPLOYEE`, o un rol administrativo acotado a otro tenant— solo opera sobre
   * sí mismo. Se deniega por defecto.
   *
   * @param actor - Quien opera.
   * @returns `true` si puede operar sobre empleados ajenos.
   */
  isHrOrAdmin(actor: AuthenticatedUser): boolean {
    if (actor.roles.includes('SUPERADMIN')) return true;
    const tenantId = requireTenantId();
    return (
      roleAuthorizesInTenant(actor, 'ERP_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'HR_ADMIN', tenantId)
    );
  }

  /**
   * Exige que el empleado sea el propio actor cuando no opera como RR. HH.
   *
   * @param employee - Empleado ya acotado al tenant.
   * @param actor - Quien opera.
   * @throws InsufficientRoleException (`403`) si el empleado es otra persona.
   */
  assertSelfOrHr(employee: Employees, actor: AuthenticatedUser): void {
    if (this.isHrOrAdmin(actor)) return;
    if (!employee.personUserId || employee.personUserId !== actor.id) {
      throw new InsufficientRoleException(
        'Solo puede operar sobre su propio registro de empleado',
        undefined,
        ErpErrorReason.ERP_EMPLOYEE_SELF_ONLY,
      );
    }
  }

  /** Construye el 404 uniforme. */
  private notFound(failure: ResourceScopeFailure): ResourceNotFoundException {
    return new ResourceNotFoundException(
      failure.message,
      undefined,
      failure.reason,
    );
  }
}
