import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { AgentCatalogService } from './agent-catalog.service';

const actor = { id: 'user-1', roles: ['AUTOMATION_ENGINEER'] } as any;
const AGENT_ID = '11111111-1111-1111-1111-111111111111';
const VERSION_ID = '22222222-2222-2222-2222-222222222222';
const TOOL_ID = '33333333-3333-3333-3333-333333333333';
const POLICY_ID = '44444444-4444-4444-4444-444444444444';
const SERVICE_USER_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const agentsRepo = {
    findAgentByCode: mockFn(async () => null),
    findAgentById: mockFn(async () => null),
    findAgentForUpdate: mockFn(async () => null),
    createAgent: mockFn((_tx: any, data: any) => ({ id: AGENT_ID, ...data })),
    createAgentVersion: mockFn((_tx: any, data: any) => ({
      id: VERSION_ID,
      ...data,
    })),
    findVersionById: mockFn(async () => null),
    findMaxVersion: mockFn(async () => 0),
    findToolByCode: mockFn(async () => null),
    findToolById: mockFn(async () => null),
    createTool: mockFn((_tx: any, data: any) => ({ id: TOOL_ID, ...data })),
    findBinding: mockFn(async () => null),
    createBinding: mockFn((_tx: any, data: any) => ({
      id: 'binding-1',
      ...data,
    })),
    findMemoryForUpdate: mockFn(async () => null),
    createMemory: mockFn((_tx: any, data: any) => ({
      id: 'memory-1',
      ...data,
    })),
  };
  const governanceRepo = {
    findGuardrailPolicyByCode: mockFn(async () => null),
    findGuardrailPolicyById: mockFn(async () => null),
    createGuardrailPolicy: mockFn((_tx: any, data: any) => ({
      id: POLICY_ID,
      ...data,
    })),
    findAgentGuardrail: mockFn(async () => null),
    createAgentGuardrail: mockFn((_tx: any, data: any) => ({
      id: 'attach-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new AgentCatalogService(
    em as any,
    agentsRepo as any,
    governanceRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, agentsRepo, governanceRepo, outbox, logger };
}

const REGISTER_DTO = {
  code: 'triage-bot',
  name: 'Triage bot',
  agentTypeConceptId: CONCEPTS.AUTO_AGENT_TYPE_ASSISTANT,
  autonomyLevelConceptId: CONCEPTS.AUTO_AUTONOMY_SUGGEST_ONLY,
  promptTemplate: 'Eres...',
} as any;

describe('AgentCatalogService', () => {
  describe('registerAgent (UC-48-01)', () => {
    it('crea agente y versión 1, los dos en borrador', async () => {
      const d = build();

      const result = await d.service.registerAgent(REGISTER_DTO, actor);

      expect(d.agentsRepo.createAgent.mock.calls[0][1].stateConceptId).toBe(
        CONCEPTS.AUTO_AGENT_DRAFT,
      );
      const version = d.agentsRepo.createAgentVersion.mock.calls[0][1];
      expect(version.version).toBe(1);
      expect(version.statusConceptId).toBe(CONCEPTS.AUTO_VERSION_DRAFT);
      expect(result.agentVersionId).toBe(VERSION_ID);
    });

    it('exige identidad de servicio a un agente que actúa', async () => {
      const d = build();

      await expect(
        d.service.registerAgent(
          {
            ...REGISTER_DTO,
            autonomyLevelConceptId: CONCEPTS.AUTO_AUTONOMY_AUTONOMOUS,
          },
          actor,
        ),
      ).rejects.toThrow(/identidad de servicio/);
    });

    it('acepta un agente autónomo con identidad de servicio', async () => {
      const d = build();

      await expect(
        d.service.registerAgent(
          {
            ...REGISTER_DTO,
            autonomyLevelConceptId: CONCEPTS.AUTO_AUTONOMY_AUTONOMOUS,
            actsAsUserId: SERVICE_USER_ID,
          },
          actor,
        ),
      ).resolves.toBeDefined();
    });

    it('rechaza un código de agente repetido', async () => {
      const d = build();
      d.agentsRepo.findAgentByCode.mockResolvedValue({ id: 'otro' });

      await expect(
        d.service.registerAgent(REGISTER_DTO, actor),
      ).rejects.toThrow(/Ya existe un agente/);
    });
  });

  describe('publishAgentVersion (UC-48-02)', () => {
    it('publica una versión en borrador y activa el agente', async () => {
      const d = build();
      const agent = {
        id: AGENT_ID,
        stateConceptId: CONCEPTS.AUTO_AGENT_DRAFT,
        currentVersion: 1,
        updatedAt: new Date(),
      };
      const version = {
        id: VERSION_ID,
        agentId: AGENT_ID,
        version: 1,
        statusConceptId: CONCEPTS.AUTO_VERSION_DRAFT,
        updatedAt: new Date(),
      };
      d.agentsRepo.findAgentForUpdate.mockResolvedValue(agent);
      d.agentsRepo.findVersionById.mockResolvedValue(version);

      const result = await d.service.publishAgentVersion(
        AGENT_ID,
        { agentVersionId: VERSION_ID },
        actor,
      );

      expect(version.statusConceptId).toBe(CONCEPTS.AUTO_VERSION_PUBLISHED);
      expect(agent.stateConceptId).toBe(CONCEPTS.AUTO_AGENT_ACTIVE);
      expect(result.currentVersion).toBe(1);
    });

    it('crea la siguiente versión cuando no se indica una existente', async () => {
      const d = build();
      d.agentsRepo.findAgentForUpdate.mockResolvedValue({
        id: AGENT_ID,
        stateConceptId: CONCEPTS.AUTO_AGENT_ACTIVE,
        currentVersion: 2,
        updatedAt: new Date(),
      });
      d.agentsRepo.findMaxVersion.mockResolvedValue(2);

      await d.service.publishAgentVersion(
        AGENT_ID,
        { promptTemplate: 'nuevo' },
        actor,
      );

      const created = d.agentsRepo.createAgentVersion.mock.calls[0][1];
      expect(created.version).toBe(3);
      expect(created.statusConceptId).toBe(CONCEPTS.AUTO_VERSION_PUBLISHED);
    });

    it('exige plantilla para crear una versión nueva', async () => {
      const d = build();
      d.agentsRepo.findAgentForUpdate.mockResolvedValue({
        id: AGENT_ID,
        stateConceptId: CONCEPTS.AUTO_AGENT_ACTIVE,
        currentVersion: 1,
        updatedAt: new Date(),
      });

      await expect(
        d.service.publishAgentVersion(AGENT_ID, {} as any, actor),
      ).rejects.toThrow(/plantilla de prompt/);
    });

    it('rechaza publicar una versión que ya no está en borrador', async () => {
      const d = build();
      d.agentsRepo.findAgentForUpdate.mockResolvedValue({
        id: AGENT_ID,
        stateConceptId: CONCEPTS.AUTO_AGENT_ACTIVE,
        currentVersion: 1,
        updatedAt: new Date(),
      });
      d.agentsRepo.findVersionById.mockResolvedValue({
        id: VERSION_ID,
        agentId: AGENT_ID,
        statusConceptId: CONCEPTS.AUTO_VERSION_PUBLISHED,
      });

      await expect(
        d.service.publishAgentVersion(
          AGENT_ID,
          { agentVersionId: VERSION_ID } as any,
          actor,
        ),
      ).rejects.toThrow(/ya no está en borrador/);
    });
  });

  describe('registerTool (UC-48-03)', () => {
    const DTO = {
      code: 'create-encounter',
      name: 'Crear encuentro',
      toolTypeConceptId: CONCEPTS.AUTO_TOOL_TYPE_RECORD_WRITE,
      isWrite: true,
      requiresApproval: true,
    } as any;

    it('registra la herramienta activa con sus dos banderas', async () => {
      const d = build();

      const result = await d.service.registerTool(DTO, actor);

      expect(result.isWrite).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(d.agentsRepo.createTool.mock.calls[0][1].stateConceptId).toBe(
        CONCEPTS.AUTO_TOOL_ACTIVE,
      );
    });

    it('exige endpoint de integración a una herramienta HTTP', async () => {
      const d = build();

      await expect(
        d.service.registerTool(
          { ...DTO, toolTypeConceptId: CONCEPTS.AUTO_TOOL_TYPE_HTTP_CALL },
          actor,
        ),
      ).rejects.toThrow(/endpoint de integración/);
    });

    it('rechaza un código de herramienta repetido', async () => {
      const d = build();
      d.agentsRepo.findToolByCode.mockResolvedValue({ id: 'otra' });

      await expect(d.service.registerTool(DTO, actor)).rejects.toThrow(
        /Ya existe una herramienta/,
      );
    });
  });

  describe('bindTools (UC-48-04)', () => {
    const DTO = {
      bindings: [
        {
          agentToolId: TOOL_ID,
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
        },
      ],
    } as any;

    /**
     * Ejecuta la operación with version and tool.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with version and tool.
     */
    function withVersionAndTool(d: ReturnType<typeof build>) {
      d.agentsRepo.findVersionById.mockResolvedValue({
        id: VERSION_ID,
        agentId: AGENT_ID,
      });
      d.agentsRepo.findToolById.mockResolvedValue({
        id: TOOL_ID,
        stateConceptId: CONCEPTS.AUTO_TOOL_ACTIVE,
      });
    }

    it('enlaza la herramienta a la versión', async () => {
      const d = build();
      withVersionAndTool(d);

      const result = await d.service.bindTools(
        AGENT_ID,
        VERSION_ID,
        DTO,
        actor,
      );

      expect(result.bindingIds).toHaveLength(1);
    });

    it('rechaza enlazar una herramienta deshabilitada', async () => {
      const d = build();
      withVersionAndTool(d);
      d.agentsRepo.findToolById.mockResolvedValue({
        id: TOOL_ID,
        stateConceptId: CONCEPTS.AUTO_TOOL_DISABLED,
      });

      await expect(
        d.service.bindTools(AGENT_ID, VERSION_ID, DTO, actor),
      ).rejects.toThrow(/no está activa/);
    });

    it('rechaza la misma herramienta dos veces en el lote', async () => {
      const d = build();
      withVersionAndTool(d);

      await expect(
        d.service.bindTools(
          AGENT_ID,
          VERSION_ID,
          {
            bindings: [
              {
                agentToolId: TOOL_ID,
                permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
              },
              {
                agentToolId: TOOL_ID,
                permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_DENY,
              },
            ],
          } as any,
          actor,
        ),
      ).rejects.toThrow(/dos veces en el lote/);
    });

    it('rechaza un enlace que ya existe', async () => {
      const d = build();
      withVersionAndTool(d);
      d.agentsRepo.findBinding.mockResolvedValue({ id: 'binding-previo' });

      await expect(
        d.service.bindTools(AGENT_ID, VERSION_ID, DTO, actor),
      ).rejects.toThrow(/ya está enlazada/);
    });

    it('rechaza una versión que no es del agente', async () => {
      const d = build();
      d.agentsRepo.findVersionById.mockResolvedValue({
        id: VERSION_ID,
        agentId: 'otro-agente',
      });

      await expect(
        d.service.bindTools(AGENT_ID, VERSION_ID, DTO, actor),
      ).rejects.toThrow(/no existe para ese agente/);
    });
  });

  describe('defineGuardrail (UC-48-05)', () => {
    const DTO = {
      code: 'phi-block',
      name: 'Bloqueo de PHI',
      policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_CONTENT,
      enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_BLOCK,
    } as any;

    it('crea la política activa', async () => {
      const d = build();

      const result = await d.service.defineGuardrail(DTO, actor);

      expect(result.isActive).toBe(true);
    });

    it('exige tope a una política de coste', async () => {
      const d = build();

      await expect(
        d.service.defineGuardrail(
          { ...DTO, policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_COST },
          actor,
        ),
      ).rejects.toThrow(/tope/);
    });

    it('exige tratamiento declarado a una política de PHI', async () => {
      const d = build();

      await expect(
        d.service.defineGuardrail(
          { ...DTO, policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_PHI },
          actor,
        ),
      ).rejects.toThrow(/cómo se tratan/);
    });
  });

  describe('attachGuardrail (UC-48-05)', () => {
    const DTO = { guardrailPolicyId: POLICY_ID } as any;

    /**
     * Ejecuta la operación with agent and policy.
     *
     * @param d - Valor de d requerido por la operación.
     * @param isActive - Valor de is active requerido por la operación.
     * @returns Resultado de with agent and policy.
     */
    function withAgentAndPolicy(d: ReturnType<typeof build>, isActive = true) {
      d.agentsRepo.findAgentForUpdate.mockResolvedValue({
        id: AGENT_ID,
        updatedAt: new Date(),
      });
      d.governanceRepo.findGuardrailPolicyById.mockResolvedValue({
        id: POLICY_ID,
        code: 'phi-block',
        isActive,
      });
    }

    it('adjunta la política habilitada por defecto', async () => {
      const d = build();
      withAgentAndPolicy(d);

      const result = await d.service.attachGuardrail(AGENT_ID, DTO, actor);

      expect(result.isEnabled).toBe(true);
    });

    it('rechaza adjuntar una política inactiva', async () => {
      const d = build();
      withAgentAndPolicy(d, false);

      await expect(
        d.service.attachGuardrail(AGENT_ID, DTO, actor),
      ).rejects.toThrow(/no está activa/);
    });

    it('rechaza adjuntar la misma política dos veces', async () => {
      const d = build();
      withAgentAndPolicy(d);
      d.governanceRepo.findAgentGuardrail.mockResolvedValue({
        id: 'ya-adjunta',
      });

      await expect(
        d.service.attachGuardrail(AGENT_ID, DTO, actor),
      ).rejects.toThrow(/ya está adjunta/);
    });
  });

  describe('upsertMemory (UC-48-12)', () => {
    const DTO = {
      scopeConceptId: CONCEPTS.AUTO_MEMORY_SCOPE_ENTITY,
      scopeRefId: '66666666-6666-6666-6666-666666666666',
      memoryTypeConceptId: CONCEPTS.AUTO_MEMORY_TYPE_FACT,
      contentText: 'El paciente prefiere la mañana',
    } as any;

    it('crea la memoria cuando no existía', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });

      const result = await d.service.upsertMemory(AGENT_ID, DTO, actor);

      expect(result.updated).toBe(false);
      expect(d.agentsRepo.createMemory).toHaveBeenCalled();
    });

    it('actualiza la existente en vez de crear otra', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });
      const existing = {
        id: 'memory-previa',
        contentText: 'viejo',
        statusConceptId: CONCEPTS.AUTO_MEMORY_EXPIRED,
        updatedAt: new Date(),
      };
      d.agentsRepo.findMemoryForUpdate.mockResolvedValue(existing);

      const result = await d.service.upsertMemory(AGENT_ID, DTO, actor);

      expect(result.updated).toBe(true);
      expect(existing.contentText).toBe('El paciente prefiere la mañana');
      expect(existing.statusConceptId).toBe(CONCEPTS.AUTO_MEMORY_ACTIVE);
      expect(d.agentsRepo.createMemory).not.toHaveBeenCalled();
    });

    it('exige referencia fuera del ámbito global', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });

      await expect(
        d.service.upsertMemory(
          AGENT_ID,
          { ...DTO, scopeRefId: undefined },
          actor,
        ),
      ).rejects.toThrow(/a qué se refiere/);
    });

    it('acepta el ámbito global sin referencia', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });

      await expect(
        d.service.upsertMemory(
          AGENT_ID,
          {
            ...DTO,
            scopeConceptId: CONCEPTS.AUTO_MEMORY_SCOPE_GLOBAL,
            scopeRefId: undefined,
          },
          actor,
        ),
      ).resolves.toBeDefined();
    });
  });
});
