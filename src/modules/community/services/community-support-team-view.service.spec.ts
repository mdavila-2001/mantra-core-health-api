import { jest } from '@jest/globals';
import { CommunitySupportTeamViewService } from './community-support-team-view.service';
import { COMM } from '../community.concepts';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(assignments: any[] = []) {
  const profiles = { findById: mockFn() };
  const inbox = {
    userNames: mockFn().mockResolvedValue(
      new Map([['user-ana', 'Ana Gutiérrez']]),
    ),
    findAssignments: mockFn().mockResolvedValue(assignments),
  };
  const service = new CommunitySupportTeamViewService(
    profiles as any,
    inbox as any,
  );
  return { service, profiles, inbox, em: {} as any };
}

const teamMessage = (over: Record<string, unknown> = {}): any => ({
  id: 'm-1',
  senderProfileId: 'pp-perez',
  // El mensaje guarda al doctor (su perfil profesional); el remitente es su perfil público.
  onBehalfOfProfileId: 'prof-perez',
  authoredByUserId: 'user-ana',
  disclosureShown: true,
  ...over,
});

describe('CommunitySupportTeamViewService', () => {
  describe('reader', () => {
    it('un perfil de doctor lee como doctor, con su perfil profesional', async () => {
      const d = build();
      d.profiles.findById.mockResolvedValue({
        targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
        targetId: 'prof-perez',
      });
      expect(await d.service.reader(d.em, 'pp-perez')).toEqual({
        profileId: 'pp-perez',
        practitionerProfileId: 'prof-perez',
      });
    });

    it('un perfil de paciente no es doctor', async () => {
      const d = build();
      d.profiles.findById.mockResolvedValue({
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
        targetId: 'user-paciente',
      });
      expect(await d.service.reader(d.em, 'pp-paciente')).toEqual({
        profileId: 'pp-paciente',
      });
    });
  });

  describe('annotate', () => {
    it('el paciente ve que respondió el equipo si el doctor lo dejó visible, pero nunca quién', async () => {
      const d = build();
      const out = await d.service.annotate(d.em, { profileId: 'pp-paciente' }, [
        teamMessage(),
      ]);
      expect(out.get('m-1')).toEqual({ repliedByTeam: true });
      expect(JSON.stringify([...out.values()])).not.toContain('Ana');
      // Ni siquiera se busca el nombre de la autora.
      expect(d.inbox.userNames).not.toHaveBeenCalled();
    });

    it('con HIDE el paciente no ve nada del equipo', async () => {
      const d = build();
      const out = await d.service.annotate(d.em, { profileId: 'pp-paciente' }, [
        teamMessage({ disclosureShown: false }),
      ]);
      expect(out.size).toBe(0);
    });

    it('el doctor dueño del perfil ve además quién escribió', async () => {
      const d = build();
      const out = await d.service.annotate(
        d.em,
        { profileId: 'pp-perez', practitionerProfileId: 'prof-perez' },
        [teamMessage()],
      );
      expect(out.get('m-1')).toEqual({
        repliedByTeam: true,
        teamAuthorName: 'Ana Gutiérrez',
      });
    });

    it('con HIDE el doctor igual ve quién escribió, sin la leyenda', async () => {
      const d = build();
      const out = await d.service.annotate(
        d.em,
        { profileId: 'pp-perez', practitionerProfileId: 'prof-perez' },
        [teamMessage({ disclosureShown: false })],
      );
      expect(out.get('m-1')).toEqual({ teamAuthorName: 'Ana Gutiérrez' });
    });

    it('otro doctor no ve la autora de mensajes que no son de su perfil', async () => {
      const d = build();
      const out = await d.service.annotate(
        d.em,
        { profileId: 'pp-rojas', practitionerProfileId: 'prof-rojas' },
        [teamMessage()],
      );
      expect(out.get('m-1')).toEqual({ repliedByTeam: true });
    });

    it('un mensaje común no lleva marcas', async () => {
      const d = build();
      const out = await d.service.annotate(
        d.em,
        { profileId: 'pp-perez', practitionerProfileId: 'prof-perez' },
        [{ id: 'm-2', senderProfileId: 'pp-paciente' } as any],
      );
      expect(out.size).toBe(0);
    });
  });

  describe('awaitingDoctor', () => {
    const waiting = {
      conversationId: 'c-1',
      practitionerProfileId: 'prof-perez',
      statusConceptId: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
    };

    it('solo el doctor ve lo que su equipo le derivó', async () => {
      const d = build([
        waiting,
        {
          ...waiting,
          conversationId: 'c-2',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
        },
        {
          ...waiting,
          conversationId: 'c-3',
          practitionerProfileId: 'prof-rojas',
        },
      ]);
      const ids = await d.service.awaitingDoctor(
        d.em,
        { profileId: 'pp-perez', practitionerProfileId: 'prof-perez' },
        ['c-1', 'c-2', 'c-3'],
      );
      expect([...ids]).toEqual(['c-1']);
    });

    it('el paciente nunca ve el estado de la bandeja: ni siquiera se consulta', async () => {
      const d = build([waiting]);
      const ids = await d.service.awaitingDoctor(
        d.em,
        { profileId: 'pp-paciente' },
        ['c-1'],
      );
      expect(ids.size).toBe(0);
      expect(d.inbox.findAssignments).not.toHaveBeenCalled();
    });
  });
});
