import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { ClinicalRecordAccessGuard } from '../guards/clinical-record-access.guard';
import { ClinicalOrdersController } from './clinical-orders.controller';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const serviceRequestsService = { create: mockFn() };
  const diagnosticReportsService = { create: mockFn(), release: mockFn() };
  const requisitionsService = { create: mockFn() };
  const serviceRequestReadService = { getById: mockFn() };
  const controller = new ClinicalOrdersController(
    serviceRequestsService as any,
    diagnosticReportsService as any,
    requisitionsService as any,
    serviceRequestReadService as any,
  );
  return {
    controller,
    serviceRequestsService,
    diagnosticReportsService,
    requisitionsService,
    serviceRequestReadService,
  };
}

describe('ClinicalOrdersController', () => {
  it('delegates createServiceRequest (UC-08-05)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createServiceRequest(dto, actor);
    expect(d.serviceRequestsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createRequisition (C4) with the trimmed Idempotency-Key', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', items: [] };
    await d.controller.createRequisition(dto as any, actor, '  key-1 ');
    expect(d.requisitionsService.create).toHaveBeenCalledWith(
      dto,
      actor,
      'key-1',
    );
  });

  it('passes no key when the Idempotency-Key header is blank', async () => {
    const d = build();
    await d.controller.createRequisition({} as any, actor, '   ');
    expect(d.requisitionsService.create).toHaveBeenCalledWith(
      {},
      actor,
      undefined,
    );
  });

  it('delegates getServiceRequest (C5)', async () => {
    const d = build();
    await d.controller.getServiceRequest('id-1', actor);
    expect(d.serviceRequestReadService.getById).toHaveBeenCalledWith(
      'id-1',
      actor,
    );
  });

  it('delegates createDiagnosticReport (UC-08-06)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createDiagnosticReport(dto, actor);
    expect(d.diagnosticReportsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates releaseDiagnosticReport (UC-08-07)', async () => {
    const d = build();
    await d.controller.releaseDiagnosticReport('dr1', {}, actor);
    expect(d.diagnosticReportsService.release).toHaveBeenCalledWith(
      'dr1',
      {},
      actor,
    );
  });
});

/**
 * Matriz negativa del alta con región 3D / tipo de hueso: agregar campos al
 * cuerpo no cambia quién puede crear la orden. Los guards son los reales; sólo
 * el servicio de lectura del expediente es un doble (su política tiene spec propio).
 */
describe('POST /clinical/service-requests · autorización con la región 3D', () => {
  const handler = (ClinicalOrdersController.prototype as any)
    .createServiceRequest;
  const withRegion = {
    custodianTenantId: 't1',
    patientProfileId: 'p-ajeno',
    codeConceptId: 'c1',
    bodySiteConceptId: 's1',
    bodyStructureUberon: 'UBERON:0002398',
    bodyMeshId: 'BP44',
    boneTypeConceptId: 'b1',
  };

  function rolesContext(user: unknown) {
    return {
      getHandler: () => handler,
      getClass: () => ClinicalOrdersController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as any;
  }
  const rolesGuard = new RolesGuard(new Reflector());

  it('rol insuficiente (paciente, administrativo): 403', () => {
    for (const roles of [['PATIENT'], ['RECEPTIONIST'], []]) {
      expect(() =>
        rolesGuard.canActivate(rolesContext({ id: 'u', roles })),
      ).toThrow(ForbiddenException);
    }
  });

  it('sin sujeto autenticado no pasa el guard de roles', () => {
    expect(() => rolesGuard.canActivate(rolesContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('un clínico o profesional con rol sí pasa a la política del expediente', () => {
    for (const role of ['CLINICIAN', 'PRACTITIONER']) {
      expect(
        rolesGuard.canActivate(rolesContext({ id: 'u', roles: [role] })),
      ).toBe(true);
    }
  });

  it('paciente ajeno o de otro tenant: el guard del expediente responde 403 aunque el cuerpo traiga la región', async () => {
    const readService = {
      assertCanWriteHistory: mockFn().mockRejectedValue(
        new ForbiddenException(),
      ),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any, {} as any);
    const request = {
      user: { id: 'u', roles: ['PRACTITIONER'] },
      params: {},
      method: 'POST',
      body: withRegion,
    };
    await expect(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => request }),
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(readService.assertCanWriteHistory).toHaveBeenCalledWith(
      'p-ajeno',
      request.user,
    );
  });
});
