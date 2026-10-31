import { jest } from '@jest/globals';
import { CommunitySupportReplyService } from './community-support-reply.service';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-hospital';
const TARGET = {
  conversationId: 'conv-1',
  doctorPublicProfileId: 'pp-perez',
  practitionerProfileId: 'prof-perez',
  tenantId: TENANT,
  actorUserId: 'user-ana',
};

function build(
  opts: {
    assignment?: any;
    openTexts?: string[];
    sender?: any;
    inInbox?: boolean;
  } = {},
) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const created: any[] = [];
  const repo = {
    findConversation: mockFn().mockResolvedValue(
      opts.inInbox === false ? null : { conversationId: 'conv-1' },
    ),
    findAssignmentForUpdate: mockFn().mockResolvedValue(
      opts.assignment ?? null,
    ),
    openPatientTexts: mockFn().mockResolvedValue(opts.openTexts ?? []),
    userNames: mockFn().mockResolvedValue(new Map([['otra', 'Bea Soto']])),
    createAssignment: mockFn((_: unknown, data: any) => {
      const row = { id: 'as-1', ...data };
      created.push(row);
      return row;
    }),
  };
  const profiles = {
    findById: mockFn().mockResolvedValue(
      opts.sender ?? {
        id: 'pp-paciente',
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
        targetId: 'user-paciente',
      },
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CommunitySupportReplyService(
    repo as any,
    profiles as any,
    logger as any,
  );
  return { service, tx: tx as any, repo, profiles, created };
}

describe('CommunitySupportReplyService', () => {
  describe('guardReply', () => {
    it('una conversación libre sin mensajes clínicos pendientes se puede responder', async () => {
      const d = build({ openTexts: ['¿Pueden cambiarme la cita?'] });
      await expect(d.service.guardReply(d.tx, TARGET)).resolves.toBeUndefined();
      expect(d.repo.openPatientTexts).toHaveBeenCalledWith(
        d.tx,
        'conv-1',
        'pp-perez',
      );
    });

    it('B-c: una conversación que no está en la bandeja de ese doctor y organización no se responde (404), aunque su perfil participe', async () => {
      const d = build({ inInbox: false });
      await expect(d.service.guardReply(d.tx, TARGET)).rejects.toMatchObject({
        status: 404,
        reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
      });
      expect(d.repo.findConversation).toHaveBeenCalledWith(d.tx, 'conv-1', [
        { tenantId: TENANT, practitionerProfileId: 'prof-perez' },
      ]);
      expect(d.repo.findAssignmentForUpdate).not.toHaveBeenCalled();
    });

    it('409 con el nombre de quien la tiene', async () => {
      const d = build({
        assignment: {
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'otra',
        },
      });
      await expect(d.service.guardReply(d.tx, TARGET)).rejects.toMatchObject({
        status: 409,
        reason: CommunityErrorReason.CONVERSATION_HELD_BY_OTHER,
        details: { assignedToName: 'Bea Soto', conversationId: 'conv-1' },
      });
    });

    it('422 CLINICAL_REQUIRES_DERIVATION si hay un mensaje clínico sin responder y no se derivó', async () => {
      const d = build({
        assignment: {
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'user-ana',
        },
        openTexts: ['Tengo fiebre y mucho dolor de pecho'],
      });
      await expect(d.service.guardReply(d.tx, TARGET)).rejects.toMatchObject({
        status: 422,
        reason: CommunityErrorReason.CLINICAL_REQUIRES_DERIVATION,
        details: { reason: 'CLINICAL_REQUIRES_DERIVATION' },
      });
    });

    it('una conversación ya derivada al doctor se puede seguir respondiendo (lo administrativo)', async () => {
      const d = build({
        assignment: {
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
          assignedUserId: 'user-ana',
        },
        openTexts: ['Tengo fiebre'],
      });
      await expect(d.service.guardReply(d.tx, TARGET)).resolves.toBeUndefined();
    });

    it('bloquea la fila de asignación mientras dura la transacción', async () => {
      const d = build();
      await d.service.guardReply(d.tx, TARGET);
      expect(d.repo.findAssignmentForUpdate).toHaveBeenCalledWith(
        d.tx,
        'conv-1',
      );
    });
  });

  describe('recordReply', () => {
    it('sin asignación previa la crea a nombre de quien respondió', async () => {
      const d = build();
      await d.service.recordReply(d.tx, TARGET);
      expect(d.created[0]).toMatchObject({
        tenantId: TENANT,
        conversationId: 'conv-1',
        practitionerProfileId: 'prof-perez',
        assignedUserId: 'user-ana',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      });
      expect(d.created[0].slaDueAt).toBeUndefined();
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('una resuelta o libre queda tomada por quien respondió y sin plazo vencido', async () => {
      const row: any = {
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
        assignedUserId: 'otra',
        slaDueAt: new Date(0),
        updatedAt: new Date(0),
      };
      const d = build({ assignment: row });
      await d.service.recordReply(d.tx, TARGET);
      expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_TAKEN);
      expect(row.assignedUserId).toBe('user-ana');
      expect(row.slaDueAt).toBeNull();
    });

    it('una derivada al doctor sigue derivada', async () => {
      const row: any = {
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
        assignedUserId: 'user-ana',
        updatedAt: new Date(0),
      };
      const d = build({ assignment: row });
      await d.service.recordReply(d.tx, TARGET);
      expect(row.statusConceptId).toBe(
        COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
      );
    });
  });

  describe('reopenIfResolved (laguna 4)', () => {
    const resolved = (): any => ({
      tenantId: TENANT,
      practitionerProfileId: 'prof-perez',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
      assignedUserId: 'user-ana',
      slaDueAt: new Date(0),
      updatedAt: new Date(0),
    });

    it('cuando el paciente escribe, una resuelta pasa a NEW, sin dueña', async () => {
      const row = resolved();
      const d = build({ assignment: row });
      const reopened = await d.service.reopenIfResolved(
        d.tx,
        'conv-1',
        'pp-paciente',
      );
      expect(reopened).toBe(true);
      expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_NEW);
      expect(row.assignedUserId).toBeNull();
      expect(row.slaDueAt).toBeNull();
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('si escribe el doctor no se reabre', async () => {
      const row = resolved();
      const d = build({
        assignment: row,
        sender: {
          id: 'pp-perez',
          targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
          targetId: 'prof-perez',
        },
      });
      expect(await d.service.reopenIfResolved(d.tx, 'conv-1', 'pp-perez')).toBe(
        false,
      );
      expect(row.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_RESOLVED);
    });

    it('una conversación que no está resuelta, o sin asignación, no cambia', async () => {
      const taken: any = {
        ...resolved(),
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      };
      const a = build({ assignment: taken });
      expect(
        await a.service.reopenIfResolved(a.tx, 'conv-1', 'pp-paciente'),
      ).toBe(false);
      expect(taken.statusConceptId).toBe(COMM.CONVERSATION_ASSIGNMENT_TAKEN);
      const b = build();
      expect(
        await b.service.reopenIfResolved(b.tx, 'conv-1', 'pp-paciente'),
      ).toBe(false);
      // Sin asignación ni siquiera se busca al remitente.
      expect(b.profiles.findById).not.toHaveBeenCalled();
    });
  });
});
