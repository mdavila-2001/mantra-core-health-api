import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS, ErrorCode, runWithTenant } from '../../../common';
import { AutomationErrorReason } from '../automation.error-reasons';
import { RecordAutomationService } from './record-automation.service';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const WORKFLOW_RUN_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant dado, como lo
 * hace `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const AGENT_RUN_ID = '11111111-1111-1111-1111-111111111111';
const AUTOMATION_ID = '22222222-2222-2222-2222-222222222222';
const AGENT_ID = '33333333-3333-3333-3333-333333333333';
const SERVICE_USER_ID = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runsRepo = {
    findAgentRunForUpdate: mockFn(async () => ({
      id: AGENT_RUN_ID,
      agentId: AGENT_ID,
      workflowRunId: WORKFLOW_RUN_ID,
      statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
    })),
    findWorkflowRunById: mockFn(async () => ({
      id: WORKFLOW_RUN_ID,
      tenantId: TENANT_A,
    })),
    findMaxSequenceNo: mockFn(async () => 2),
    createAgentRunStep: mockFn((_tx: any, data: any) => ({
      id: 'step-3',
      ...data,
    })),
  };
  const agentsRepo = {
    findAgentById: mockFn(async () => ({
      id: AGENT_ID,
      tenantId: TENANT_A,
      actsAsUserId: SERVICE_USER_ID,
    })),
  };
  const governanceRepo = {
    findRecordAutomationForUpdate: mockFn(async () => automation()),
  };
  const targetRepo = {
    writeRecord: mockFn(async () => ({ id: 'registro-1', written: true })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const raw = new RecordAutomationService(
    em as any,
    runsRepo as any,
    agentsRepo as any,
    governanceRepo as any,
    targetRepo,
    outbox as any,
    logger as any,
  );
  const service = inTenant(raw, TENANT_A);
  return {
    service,
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    em,
    tx,
    runsRepo,
    agentsRepo,
    governanceRepo,
    targetRepo,
    outbox,
    logger,
  };
}

/**
 * Ejecuta la operación automation.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de automation.
 */
function automation(overrides: any = {}) {
  return {
    id: AUTOMATION_ID,
    tenantId: TENANT_A,
    targetResourceType: 'crm.leads',
    writeModeConceptId: CONCEPTS.AUTO_WRITE_MODE_DIRECT,
    fieldMappingJson: {
      patient_id: { from: 'patient.id', required: true },
      note_text: { from: 'note' },
      source_code: { value: 'AGENT' },
    },
    dedupeKeyExpr: 'patient_id, source_code',
    isActive: true,
    updatedAt: new Date(),
    ...overrides,
  };
}

const DTO = {
  payloadJson: { patient: { id: 'p-1' }, note: 'texto' },
} as any;

describe('RecordAutomationService', () => {
  describe('executeRecordAutomation (UC-48-13)', () => {
    it('traduce el payload a columnas siguiendo el mapeo', async () => {
      const d = build();

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      const columns = d.targetRepo.writeRecord.mock.calls[0][2];
      expect(columns.patient_id).toBe('p-1');
      expect(columns.note_text).toBe('texto');
      expect(columns.source_code).toBe('AGENT');
    });

    it('atribuye la escritura a la identidad de servicio del agente', async () => {
      const d = build();

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      const columns = d.targetRepo.writeRecord.mock.calls[0][2];
      expect(columns.created_by_user_id).toBe(SERVICE_USER_ID);
      expect(columns.updated_by_user_id).toBe(SERVICE_USER_ID);
    });

    it('la atribución no la puede pisar el mapeo', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({
          fieldMappingJson: {
            patient_id: { from: 'patient.id' },
            created_by_user_id: { value: 'usuario-falsificado' },
          },
        }),
      );

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(d.targetRepo.writeRecord.mock.calls[0][2].created_by_user_id).toBe(
        SERVICE_USER_ID,
      );
    });

    it('parte la clave de deduplicación en columnas', async () => {
      const d = build();

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(d.targetRepo.writeRecord.mock.calls[0][3]).toEqual([
        'patient_id',
        'source_code',
      ]);
    });

    it('el modo borrador no toca el destino', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ writeModeConceptId: CONCEPTS.AUTO_WRITE_MODE_DRAFT }),
      );

      const result = await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(result.draft).toBe(true);
      expect(d.targetRepo.writeRecord).not.toHaveBeenCalled();
    });

    it('el modo upsert exige clave de deduplicación', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({
          writeModeConceptId: CONCEPTS.AUTO_WRITE_MODE_UPSERT,
          dedupeKeyExpr: undefined,
        }),
      );

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toThrow(/clave de deduplicación/);
    });

    it('registra el paso de traza aunque la deduplicación no escriba nada', async () => {
      const d = build();
      d.targetRepo.writeRecord.mockResolvedValue({ written: false });

      const result = await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(result.written).toBe(false);
      expect(result.agentRunStepId).toBe('step-3');
      expect(d.runsRepo.createAgentRunStep).toHaveBeenCalled();
    });

    it('reutiliza el paso indicado en vez de crear otro', async () => {
      const d = build();

      const result = await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        { ...DTO, agentRunStepId: 'step-existente' },
        actor,
      );

      expect(result.agentRunStepId).toBe('step-existente');
      expect(d.runsRepo.createAgentRunStep).not.toHaveBeenCalled();
    });

    it('rechaza escribir con el run en pausa', async () => {
      const d = build();
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue({
        id: AGENT_RUN_ID,
        agentId: AGENT_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_PAUSED,
      });

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toThrow(/no está en marcha/);
    });

    it('rechaza una automatización inactiva', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ isActive: false }),
      );

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toThrow(/no está activa/);
    });

    it('rechaza una automatización de otro agente', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ agentId: 'otro-agente' }),
      );

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toThrow(/pertenece a otro agente/);
    });

    it('rechaza escribir si el agente no tiene identidad de servicio', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({
        id: AGENT_ID,
        tenantId: TENANT_A,
      });

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toThrow(/identidad de servicio/);
    });

    describe('mapeo de campos', () => {
      it('falla cerrado si no hay mapeo declarado', async () => {
        const d = build();
        d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
          automation({ fieldMappingJson: undefined }),
        );

        await expect(
          d.service.executeRecordAutomation(
            AGENT_RUN_ID,
            AUTOMATION_ID,
            DTO,
            actor,
          ),
        ).rejects.toThrow(/no declara mapeo/);
      });

      it('falla cerrado ante una regla sin `from` ni `value`', async () => {
        const d = build();
        d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
          automation({ fieldMappingJson: { patient_id: { alias: 'x' } } }),
        );

        await expect(
          d.service.executeRecordAutomation(
            AGENT_RUN_ID,
            AUTOMATION_ID,
            DTO,
            actor,
          ),
        ).rejects.toThrow(/`from` o `value`/);
      });

      it('rechaza cuando falta un campo obligatorio', async () => {
        const d = build();

        await expect(
          d.service.executeRecordAutomation(
            AGENT_RUN_ID,
            AUTOMATION_ID,
            { payloadJson: { note: 'texto' } } as any,
            actor,
          ),
        ).rejects.toThrow(/campo obligatorio/);
      });

      it('omite un campo opcional que no llega', async () => {
        const d = build();

        await d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          { payloadJson: { patient: { id: 'p-1' } } },
          actor,
        );

        expect(d.targetRepo.writeRecord.mock.calls[0][2]).not.toHaveProperty(
          'note_text',
        );
      });
    });

    describe('validación', () => {
      it('rechaza cuando falta una columna exigida por la validación', async () => {
        const d = build();
        d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
          automation({ validationJson: { required: ['note_text'] } }),
        );

        await expect(
          d.service.executeRecordAutomation(
            AGENT_RUN_ID,
            AUTOMATION_ID,
            { payloadJson: { patient: { id: 'p-1' } } } as any,
            actor,
          ),
        ).rejects.toThrow(/exige un campo/);
      });

      it('ignora claves de validación que no entiende', async () => {
        const d = build();
        d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
          automation({ validationJson: { regex: { note_text: '^.+$' } } }),
        );

        await expect(
          d.service.executeRecordAutomation(
            AGENT_RUN_ID,
            AUTOMATION_ID,
            DTO,
            actor,
          ),
        ).resolves.toBeDefined();
      });
    });
  });
  describe('alcance de tenant (AUTO-01)', () => {
    /**
     * Captura el rechazo para inspeccionar status, reason y details.
     *
     * @param promise - Operación que debe fallar.
     * @returns La excepción lanzada.
     */
    async function rejection(promise: Promise<unknown>): Promise<any> {
      try {
        await promise;
      } catch (error) {
        return error;
      }
      throw new Error('Se esperaba un rechazo');
    }

    /**
     * Verifica que no hubo ninguna escritura ni rastro.
     *
     * @param d - Doble del servicio.
     */
    function expectNothingWritten(d: ReturnType<typeof build>) {
      expect(d.targetRepo.writeRecord).not.toHaveBeenCalled();
      expect(d.runsRepo.createAgentRunStep).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    }

    it('correcto: el runtime de A escribe con su automatización y la traza lleva la identidad de servicio de A', async () => {
      const d = build();

      const result = await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(result.written).toBe(true);
      expect(d.targetRepo.writeRecord.mock.calls[0][2].created_by_user_id).toBe(
        SERVICE_USER_ID,
      );
      expect(d.outbox.publishDomainEvent.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
    });

    it('el run de agente de A ejecutado desde B responde como inexistente', async () => {
      const d = build();
      const absent = build();
      absent.runsRepo.findAgentRunForUpdate.mockResolvedValue(null);

      const foreign = await rejection(
        d.asTenantB.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      );
      const missing = await rejection(
        absent.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      );

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(AutomationErrorReason.AGENT_RUN_NOT_FOUND);
      expect(foreign.details).toBeUndefined();
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expectNothingWritten(d);
    });

    it('el agente de B tras un run de A no escribe (el run entero es ajeno)', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({
        id: AGENT_ID,
        tenantId: TENANT_B,
        actsAsUserId: SERVICE_USER_ID,
      });

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: AutomationErrorReason.AGENT_RUN_NOT_FOUND,
      });
      expectNothingWritten(d);
    });

    it('el workflow run de B colgando de un run de A tampoco se escribe', async () => {
      const d = build();
      d.runsRepo.findWorkflowRunById.mockResolvedValue({
        id: WORKFLOW_RUN_ID,
        tenantId: TENANT_B,
      });

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: AutomationErrorReason.AGENT_RUN_NOT_FOUND,
      });
      expectNothingWritten(d);
    });

    it('la automatización de B no la ejecuta el runtime de A: igual que una inexistente', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ tenantId: TENANT_B }),
      );
      const absent = build();
      absent.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        null,
      );

      const foreign = await rejection(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      );
      const missing = await rejection(
        absent.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      );

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        AutomationErrorReason.RECORD_AUTOMATION_NOT_FOUND,
      );
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expectNothingWritten(d);
    });

    it('una automatización ajena e inactiva no delata su estado', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ tenantId: TENANT_B, isActive: false }),
      );

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: AutomationErrorReason.RECORD_AUTOMATION_NOT_FOUND,
      });
    });

    it('sin tenant en el contexto no escribe nada (denegar por defecto)', async () => {
      const d = build();

      const error = await rejection(
        d.raw.executeRecordAutomation(AGENT_RUN_ID, AUTOMATION_ID, DTO, actor),
      );

      expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
      expect(d.runsRepo.findAgentRunForUpdate).not.toHaveBeenCalled();
      expectNothingWritten(d);
    });

    it('un mapeo que declara tenant_id no puede escribir en otra organización', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({
          fieldMappingJson: {
            patient_id: { from: 'patient.id' },
            tenant_id: { from: 'tenantAjeno' },
          },
        }),
      );

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        { payloadJson: { patient: { id: 'p-1' }, tenantAjeno: TENANT_B } },
        actor,
      );

      expect(d.targetRepo.writeRecord.mock.calls[0][2].tenant_id).toBe(
        TENANT_A,
      );
    });

    it('un mapeo que no declara tenant_id igualmente escribe la fila en el tenant de la automatización', async () => {
      const d = build();

      await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        { payloadJson: { patient: { id: 'p-1' }, tenantAjeno: TENANT_B } },
        actor,
      );

      expect(d.targetRepo.writeRecord.mock.calls[0][2].tenant_id).toBe(
        TENANT_A,
      );
    });
  });

  describe('configuración del destino (AUTO-02)', () => {
    it('un destino `clinical` se rechaza antes de ejecutar, incluso en borrador', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({
          targetResourceType: 'clinical.encounters',
          writeModeConceptId: CONCEPTS.AUTO_WRITE_MODE_DRAFT,
        }),
      );

      await expect(
        d.service.executeRecordAutomation(
          AGENT_RUN_ID,
          AUTOMATION_ID,
          DTO,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCode.VALIDATION_FAILED,
        reason: AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
      });
      expect(d.targetRepo.writeRecord).not.toHaveBeenCalled();
      expect(d.runsRepo.createAgentRunStep).not.toHaveBeenCalled();
    });

    it('un destino sin dos segmentos responde 400 con reason catalogado, no 500', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ targetResourceType: 'leads' }),
      );

      const error: any = await d.service
        .executeRecordAutomation(AGENT_RUN_ID, AUTOMATION_ID, DTO, actor)
        .catch((e: unknown) => e);

      expect(error.getStatus()).toBe(400);
      expect(error.reason).toBe(
        AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
      );
      expect(d.targetRepo.writeRecord).not.toHaveBeenCalled();
    });

    it('un mapeo vacío responde 400 AUTOMATION_RECORD_MAPPING_EMPTY y no escribe', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({ fieldMappingJson: {} }),
      );

      const error: any = await d.service
        .executeRecordAutomation(AGENT_RUN_ID, AUTOMATION_ID, DTO, actor)
        .catch((e: unknown) => e);

      expect(error.getStatus()).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.reason).toBe(
        AutomationErrorReason.AUTOMATION_RECORD_MAPPING_EMPTY,
      );
      expect(d.targetRepo.writeRecord).not.toHaveBeenCalled();
      expect(d.runsRepo.createAgentRunStep).not.toHaveBeenCalled();
    });

    it('el destino permitido con dedupe sin columnas actualizables devuelve written=false', async () => {
      const d = build();
      d.governanceRepo.findRecordAutomationForUpdate.mockResolvedValue(
        automation({
          writeModeConceptId: CONCEPTS.AUTO_WRITE_MODE_UPSERT,
          fieldMappingJson: { patient_id: { from: 'patient.id' } },
          dedupeKeyExpr: 'patient_id, created_by_user_id, updated_by_user_id',
        }),
      );
      d.targetRepo.writeRecord.mockResolvedValue({ written: false });

      const result = await d.service.executeRecordAutomation(
        AGENT_RUN_ID,
        AUTOMATION_ID,
        DTO,
        actor,
      );

      expect(result.written).toBe(false);
      expect(d.targetRepo.writeRecord.mock.calls[0][4]).toBe(true);
    });
  });
});
