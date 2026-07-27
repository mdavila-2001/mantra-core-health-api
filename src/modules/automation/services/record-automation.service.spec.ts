import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { RecordAutomationService } from './record-automation.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const AGENT_RUN_ID = '11111111-1111-1111-1111-111111111111';
const AUTOMATION_ID = '22222222-2222-2222-2222-222222222222';
const AGENT_ID = '33333333-3333-3333-3333-333333333333';
const SERVICE_USER_ID = '44444444-4444-4444-4444-444444444444';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runsRepo = {
    findAgentRunForUpdate: mockFn(async () => ({
      id: AGENT_RUN_ID,
      agentId: AGENT_ID,
      statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
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

  const service = new RecordAutomationService(
    em as any,
    runsRepo as any,
    agentsRepo as any,
    governanceRepo as any,
    targetRepo,
    outbox as any,
    logger as any,
  );
  return {
    service,
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

function automation(overrides: any = {}) {
  return {
    id: AUTOMATION_ID,
    targetResourceType: 'clinical.encounters',
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
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });

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
});
