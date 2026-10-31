import { jest } from '@jest/globals';
import {
  CLINICAL_CONTENT_HIDDEN_TEXT,
  CommunitySupportInboxService,
  PREVIEW_METADATA_ONLY_TEXT,
} from './community-support-inbox.service';
import { runWithTenant, CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const TENANT = 'tenant-hospital';
const DOCTOR = 'prof-perez';

/** Una fila de bandeja con la forma que devuelve el repositorio. */
const conversation = (overrides: Record<string, unknown> = {}) => {
  const row = {
    conversationId: 'conv-1',
    tenantId: TENANT,
    practitionerProfileId: DOCTOR,
    doctorPublicProfileId: 'pp-perez',
    lastMessageAt: new Date('2026-10-30T10:00:00Z'),
    lastPatientMessage: '¿Pueden cambiarme la cita del jueves?',
    lastPatientMessageAt: new Date('2026-10-30T10:00:00Z'),
    patientPublicProfileId: 'pp-paciente',
    patientUserId: 'user-paciente',
    patientName: 'María Quispe',
    ...overrides,
  };
  return {
    // Lo sin responder del paciente: por defecto, su último mensaje.
    unansweredPatientTexts: row.lastPatientMessage
      ? [row.lastPatientMessage]
      : [],
    ...row,
  };
};

/** Construye el servicio con repositorio y política en doble. */
function build(
  opts: {
    conversations?: any[];
    assignment?: any;
    replyable?: { tenantId: string; practitionerProfileId: string }[];
    assigneeAllowed?: boolean;
    replyAllowed?: boolean;
    liveTenants?: string[];
    /** SEG A-A3: conversaciones que la política NO deja leer (condición o paciente excluido). */
    hiddenConversations?: string[];
    /** SEG A-A4: ¿quien escribe es paciente de la agenda del doctor (tiene cita con él)? Por defecto sí. */
    agendaPatient?: boolean;
  } = {},
) {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn().mockReturnValue(tx),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const created: any[] = [];
  const repo = {
    findByDoctors: mockFn().mockResolvedValue(
      opts.conversations ?? [conversation()],
    ),
    findConversation: mockFn((_: unknown, __: string, pairs?: any[]) => {
      const found = (opts.conversations ?? [conversation()])[0] ?? null;
      // La consulta real solo devuelve conversaciones de los doctores permitidos.
      if (!found || !pairs) return Promise.resolve(found);
      return Promise.resolve(
        pairs.some(
          (p) =>
            p.tenantId === found.tenantId &&
            p.practitionerProfileId === found.practitionerProfileId,
        )
          ? found
          : null,
      );
    }),
    findAssignments: mockFn().mockResolvedValue(
      opts.assignment ? [opts.assignment] : [],
    ),
    findAssignmentForUpdate: mockFn().mockResolvedValue(
      opts.assignment ?? null,
    ),
    createAssignment: mockFn((_: unknown, data: any) => {
      const row = { id: 'as-1', ...data };
      created.push(row);
      return row;
    }),
    createNote: mockFn((_: unknown, data: any) => ({
      id: 'n-1',
      createdAt: new Date(),
      ...data,
    })),
    findNotes: mockFn().mockResolvedValue([]),
    findMessages: mockFn().mockResolvedValue([]),
    findTemplates: mockFn().mockResolvedValue([]),
    findTemplate: mockFn(),
    createTemplate: mockFn((_: unknown, data: any) => ({
      id: 't-1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      categoryConceptId: data.categoryConceptId,
      title: data.title,
      bodyText: data.bodyText,
      rowVersion: 1,
    })),
    userNames: mockFn().mockResolvedValue(
      new Map([
        ['user-ana', 'Ana Gutiérrez'],
        ['otra', 'Bea Soto'],
        ['user-otra', 'Bea Soto'],
      ]),
    ),
    doctorInfo: mockFn().mockResolvedValue(
      new Map([
        [DOCTOR, { displayName: 'Andrés Pérez', specialty: 'Cardiología' }],
        [
          'prof-rojas',
          { displayName: 'Valeria Rojas', specialty: 'Ginecología' },
        ],
      ]),
    ),
    tenantNames: mockFn().mockResolvedValue(
      new Map([[TENANT, 'Hospital Piloto Mantra']]),
    ),
    patientContext: mockFn().mockResolvedValue({
      patientProfileId: 'pat-1',
      reasonText: 'Control de rutina',
    }),
    clinicalAccessState: mockFn().mockResolvedValue('NONE'),
    patientProfilesOfUsers: mockFn().mockResolvedValue(
      new Map([['user-paciente', 'pat-1']]),
    ),
    agendaPatientKeys: mockFn().mockResolvedValue(
      opts.agendaPatient === false ? new Set() : new Set([`${DOCTOR}:pat-1`]),
    ),
  };
  const accessLog = { record: mockFn() };
  const visible = opts.replyable ?? [
    { tenantId: TENANT, practitionerProfileId: DOCTOR },
  ];
  const policy = {
    liveEngagementTenants: mockFn().mockResolvedValue(
      opts.liveTenants ?? (visible.length === 0 ? [] : [TENANT]),
    ),
    inboxDoctorsOfTenant: mockFn((_user: string, tenantId: string) =>
      Promise.resolve(
        visible
          .filter((p) => p.tenantId === tenantId)
          .map((p) => ({
            ...p,
            roleAssignmentId: `role-${p.practitionerProfileId}`,
            replyAllowed: opts.replyAllowed ?? true,
            ...(opts.replyAllowed === false
              ? { replyBlockedReason: 'REPLY_NOT_ALLOWED_BY_DOCTOR' }
              : {}),
            disclosureShown: true,
            delegateAssignmentId: 'del-1',
          })),
      ),
    ),
    replyersOfDoctor: mockFn().mockResolvedValue(['user-ana', 'user-otra']),
    isDoctorOfTenant: mockFn().mockResolvedValue(true),
    canReplyOnBehalf: mockFn().mockResolvedValue({
      allowed: opts.assigneeAllowed ?? true,
      reason: 'X',
    }),
    decideInboxConversations: mockFn(
      (_user: string, _tenant: string, items: { key: string }[]) =>
        Promise.resolve(
          new Map(
            items.map((i) => [
              i.key,
              !(opts.hiddenConversations ?? []).includes(i.key),
            ]),
          ),
        ),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CommunitySupportInboxService(
    em as any,
    repo as any,
    policy as any,
    logger as any,
    accessLog as any,
  );
  return { service, repo, policy, created, accessLog, tx };
}

describe('CommunitySupportInboxService', () => {
  describe('listInbox', () => {
    it('sirve las conversaciones de los doctores en cuyo nombre la persona puede responder', async () => {
      const d = build();
      const res = await d.service.listInbox({}, ANA);
      expect(res.count).toBe(1);
      expect(res.items[0]).toMatchObject({
        conversationId: 'conv-1',
        tenantId: TENANT,
        status: 'NEW',
        clinicalSuspected: false,
      });
      expect(d.repo.findByDoctors).toHaveBeenCalledWith(
        expect.anything(),
        [{ tenantId: TENANT, practitionerProfileId: DOCTOR }],
        expect.any(Number),
      );
    });

    it('aislamiento: sin doctores autorizados no consulta conversaciones', async () => {
      const d = build({ replyable: [] });
      const res = await d.service.listInbox({}, ANA);
      expect(res.items).toEqual([]);
      expect(d.repo.findByDoctors).not.toHaveBeenCalled();
    });

    it('marca como sospechosa de clínica la conversación cuyo último mensaje del paciente lo parece', async () => {
      const d = build({
        conversations: [
          conversation({ lastPatientMessage: 'Tengo mucho dolor de pecho' }),
        ],
      });
      const res = await d.service.listInbox({}, ANA);
      expect(res.items[0].clinicalSuspected).toBe(true);
    });

    it('N10: el último mensaje clínico del paciente no se previsualiza en la lista', async () => {
      const d = build({
        conversations: [
          conversation({ lastPatientMessage: 'Tengo mucho dolor de pecho' }),
        ],
      });
      const [item] = (await d.service.listInbox({}, ANA)).items;
      expect(item.lastPatientMessage).toBe(CLINICAL_CONTENT_HIDDEN_TEXT);
      expect(item.lastMessagePreview).toBe(CLINICAL_CONTENT_HIDDEN_TEXT);
      expect(JSON.stringify(item)).not.toContain('dolor de pecho');
      expect(item.clinicalSuspected).toBe(true);
    });

    it('filtra por doctor y por estado', async () => {
      const d = build({
        replyable: [
          { tenantId: TENANT, practitionerProfileId: DOCTOR },
          { tenantId: TENANT, practitionerProfileId: 'prof-rojas' },
        ],
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'otra',
        },
      });
      await d.service.listInbox({ doctor: 'prof-rojas' }, ANA);
      expect(d.repo.findByDoctors.mock.calls[0][1]).toEqual([
        { tenantId: TENANT, practitionerProfileId: 'prof-rojas' },
      ]);
      const taken = await d.service.listInbox({ status: 'TAKEN' }, ANA);
      expect(taken.count).toBe(1);
      const waiting = await d.service.listInbox(
        { status: 'WAITING_DOCTOR' },
        ANA,
      );
      expect(waiting.count).toBe(0);
    });
  });

  describe('applyAssignment', () => {
    it('tomar una conversación nueva la deja a nombre de quien la toma, con plazo', async () => {
      const d = build();
      const res = await d.service.applyAssignment(
        'conv-1',
        { action: 'TAKE' } as any,
        ANA,
      );
      expect(res).toMatchObject({
        status: 'TAKEN',
        assignedUserId: 'user-ana',
        referredToDoctor: false,
      });
      expect(res.slaDueAt).toBeInstanceOf(Date);
      expect(d.created[0]).toMatchObject({
        tenantId: TENANT,
        practitionerProfileId: DOCTOR,
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      });
    });

    it('tomar una conversación cuyo último mensaje parece clínico la deriva al doctor', async () => {
      const d = build({
        conversations: [
          conversation({
            lastPatientMessage: 'Me salió una erupción y tengo fiebre',
          }),
        ],
      });
      const res = await d.service.applyAssignment(
        'conv-1',
        { action: 'TAKE' } as any,
        ANA,
      );
      expect(res.status).toBe('WAITING_DOCTOR');
      expect(res.referredToDoctor).toBe(true);
    });

    it('una conversación tomada por otra persona no se toma: 409', async () => {
      const d = build({
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'otra',
        },
      });
      await expect(
        d.service.applyAssignment('conv-1', { action: 'TAKE' } as any, ANA),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_ALREADY_TAKEN,
      });
    });

    it('aislamiento: una conversación de un doctor que la persona no cubre responde como inexistente', async () => {
      const d = build({ replyable: [] });
      await expect(
        d.service.applyAssignment('conv-1', { action: 'TAKE' } as any, ANA),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
      });
      expect(d.repo.createAssignment).not.toHaveBeenCalled();
    });

    it('asignar exige que la otra persona también pueda responder por ese doctor en esa organización', async () => {
      const d = build({ assigneeAllowed: false });
      await expect(
        d.service.applyAssignment(
          'conv-1',
          { action: 'ASSIGN', assignedUserId: 'user-otra' } as any,
          ANA,
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_ASSIGNEE_NOT_ELIGIBLE,
      });
      expect(d.policy.canReplyOnBehalf).toHaveBeenCalledWith(
        'user-otra',
        DOCTOR,
        expect.anything(),
        TENANT,
      );
    });

    it('un salto de estado inválido se rechaza', async () => {
      const d = build({
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'user-ana',
          slaDueAt: new Date(),
        },
      });
      await expect(
        d.service.applyAssignment(
          'conv-1',
          { action: 'SET_STATUS', status: 'NEW' } as any,
          ANA,
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_INVALID_TRANSITION,
      });
    });

    it('resolver una conversación tomada cambia su estado', async () => {
      const assignment: any = {
        conversationId: 'conv-1',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
        assignedUserId: 'user-ana',
        slaDueAt: new Date(),
        updatedAt: new Date(0),
      };
      const d = build({ assignment });
      const res = await d.service.applyAssignment(
        'conv-1',
        { action: 'SET_STATUS', status: 'RESOLVED' } as any,
        ANA,
      );
      expect(res.status).toBe('RESOLVED');
      expect(assignment.statusConceptId).toBe(
        COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
      );
    });
  });

  describe('notas internas', () => {
    it('la nota queda con la organización de la conversación y la autora real', async () => {
      const d = build();
      const note = await d.service.addNote(
        'conv-1',
        { bodyText: 'Llamar al paciente mañana' },
        ANA,
      );
      expect(note.authorUserId).toBe('user-ana');
      expect(d.repo.createNote.mock.calls[0][1]).toMatchObject({
        tenantId: TENANT,
        conversationId: 'conv-1',
      });
    });

    it('aislamiento: sin acceso a la conversación no se leen ni se escriben notas', async () => {
      const d = build({ replyable: [] });
      await expect(d.service.listNotes('conv-1', ANA)).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
      });
      await expect(
        d.service.addNote('conv-1', { bodyText: 'x' }, ANA),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
      });
    });
  });

  describe('respuestas preparadas', () => {
    it('una respuesta con contenido clínico no se crea', async () => {
      const d = build();
      await expect(
        runWithTenant(TENANT, () =>
          d.service.createTemplate(
            {
              category: 'GENERAL',
              title: 'Dosis',
              bodyText: 'Puede subir la dosis de insulina',
            } as any,
            ANA,
          ),
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.SUPPORT_CLINICAL_CONTENT,
      });
      expect(d.repo.createTemplate).not.toHaveBeenCalled();
    });

    it('una administrativa se crea en la organización activa', async () => {
      const d = build();
      const res = await runWithTenant(TENANT, () =>
        d.service.createTemplate(
          {
            category: 'SCHEDULING',
            title: 'Cambio de cita',
            bodyText: 'Con gusto reprogramamos su cita.',
          } as any,
          ANA,
        ),
      );
      expect(res.category).toBe('SCHEDULING');
      expect(d.repo.createTemplate.mock.calls[0][1].tenantId).toBe(TENANT);
    });

    it('la persona sin doctores autorizados en la organización no lee sus respuestas', async () => {
      const d = build({ replyable: [] });
      await expect(
        d.service.templatesForPerson(TENANT, ANA),
      ).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe('forma de la bandeja (lagunas 1 y 2)', () => {
    it('cada ítem trae la organización, el doctor, el paciente, el plazo y si es clínico', async () => {
      const d = build({
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          assignedUserId: 'user-ana',
          slaDueAt: new Date('2026-10-31T10:00:00Z'),
        },
      });
      const res = await d.service.listInbox({ tenantId: TENANT }, ANA);
      expect(res.items[0]).toMatchObject({
        conversationId: 'conv-1',
        organizationId: TENANT,
        tenantId: TENANT,
        organizationName: 'Hospital Piloto Mantra',
        practitionerProfileId: DOCTOR,
        practitionerName: 'Andrés Pérez',
        patientLabel: 'María Quispe',
        status: 'TAKEN',
        assignedUserId: 'user-ana',
        assignedToName: 'Ana Gutiérrez',
        assignedToMe: true,
        isClinical: false,
        clinicalSuspected: false,
        lastMessagePreview: '¿Pueden cambiarme la cita del jueves?',
      });
      expect(res.items[0].slaDueAt).toEqual(new Date('2026-10-31T10:00:00Z'));
    });

    it('doctors[] trae el rol del doctor como id, y va en el orden estable de la agenda', async () => {
      const d = build({
        replyable: [
          { tenantId: TENANT, practitionerProfileId: DOCTOR },
          { tenantId: TENANT, practitionerProfileId: 'prof-rojas' },
        ],
      });
      const res = await d.service.listInbox({ tenantId: TENANT }, ANA);
      expect(res.doctors).toEqual([
        {
          id: 'role-prof-perez',
          practitionerProfileId: DOCTOR,
          name: 'Andrés Pérez',
          displayName: 'Andrés Pérez',
          specialty: 'Cardiología',
        },
        {
          id: 'role-prof-rojas',
          practitionerProfileId: 'prof-rojas',
          name: 'Valeria Rojas',
          displayName: 'Valeria Rojas',
          specialty: 'Ginecología',
        },
      ]);
    });

    it('un mensaje clínico que el doctor ya respondió no deja la conversación como clínica', async () => {
      const d = build({
        conversations: [
          conversation({
            lastPatientMessage: 'Tengo mucho dolor de pecho',
            unansweredPatientTexts: [],
          }),
        ],
      });
      const res = await d.service.listInbox({}, ANA);
      expect(res.items[0].isClinical).toBe(false);
      expect(res.items[0].clinicalSuspected).toBe(false);
    });

    it('una resuelta no tiene plazo y una sin asignación lo cuenta desde el mensaje del paciente', async () => {
      const resolved = build({
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
          slaDueAt: new Date(),
        },
      });
      expect(
        (await resolved.service.listInbox({}, ANA)).items[0].slaDueAt,
      ).toBe(undefined);
      const fresh = build();
      const item = (await fresh.service.listInbox({}, ANA)).items[0];
      expect(item.slaDueAt?.toISOString()).toBe('2026-10-31T10:00:00.000Z');
    });

    it('con organización pedida: sin vínculo vivo 403, y con vínculo pero sin doctores 403 con el motivo', async () => {
      const none = build({ replyable: [], liveTenants: [] });
      await expect(
        none.service.listInbox({ tenantId: TENANT }, ANA),
      ).rejects.toMatchObject({
        status: 403,
        reason: CommunityErrorReason.SUPPORT_INBOX_NO_ENGAGEMENT,
      });
      const noDoctors = build({ replyable: [], liveTenants: [TENANT] });
      await expect(
        noDoctors.service.listInbox({ tenantId: TENANT }, ANA),
      ).rejects.toMatchObject({
        status: 403,
        reason: CommunityErrorReason.SUPPORT_INBOX_NO_REPLY_PERMISSION,
      });
      expect(noDoctors.repo.findByDoctors).not.toHaveBeenCalled();
    });

    it('la política se consulta solo para las organizaciones con vínculo vivo', async () => {
      const d = build({ liveTenants: [TENANT] });
      await d.service.listInbox({}, ANA);
      expect(d.policy.inboxDoctorsOfTenant).toHaveBeenCalledTimes(1);
      expect(d.policy.inboxDoctorsOfTenant).toHaveBeenCalledWith(
        'user-ana',
        TENANT,
        expect.anything(),
      );
    });
  });

  describe('getConversation (laguna 2)', () => {
    const messages = [
      {
        id: 'm1',
        senderProfileId: 'pp-paciente',
        bodyText: 'Tengo fiebre desde ayer',
        sentAt: new Date('2026-10-30T08:00:00Z'),
        disclosureShown: false,
      },
      {
        id: 'm2',
        senderProfileId: 'pp-perez',
        bodyText: 'Le confirmamos el jueves a las 15:30.',
        sentAt: new Date('2026-10-30T09:00:00Z'),
        authoredByUserId: 'user-ana',
        onBehalfOfProfileId: 'pp-perez',
        disclosureShown: true,
      },
    ];

    it('devuelve mensajes con la autora real, notas, quién puede asignarse y el contexto del paciente', async () => {
      const d = build();
      d.repo.findMessages.mockResolvedValue(messages);
      d.repo.findNotes.mockResolvedValue([
        {
          id: 'n2',
          conversationId: 'conv-1',
          authorUserId: 'user-ana',
          bodyText: 'Llamar mañana',
          createdAt: new Date('2026-10-30T11:00:00Z'),
        },
        {
          id: 'n1',
          conversationId: 'conv-1',
          authorUserId: 'otra',
          bodyText: 'Primera nota',
          createdAt: new Date('2026-10-30T10:00:00Z'),
        },
      ]);
      const res = await d.service.getConversation(
        'conv-1',
        { tenantId: TENANT },
        ANA,
      );
      expect(res).toMatchObject({
        conversationId: 'conv-1',
        organizationName: 'Hospital Piloto Mantra',
        practitionerName: 'Andrés Pérez',
        practitionerSpecialty: 'Cardiología',
        patientLabel: 'María Quispe',
        replyDisclosure: 'SHOW',
        replyAllowed: true,
        isClinical: false,
      });
      expect(
        res.messages.map((m) => [m.from, m.authoredByName, m.disclosureShown]),
      ).toEqual([
        ['PATIENT', undefined, undefined],
        ['DOCTOR_SIDE', 'Ana Gutiérrez', true],
      ]);
      expect(res.messages[0].isClinical).toBe(true);
      expect(res.messages[1].isClinical).toBe(false);
      expect(res.notes.map((n) => n.authorName)).toEqual([
        'Bea Soto',
        'Ana Gutiérrez',
      ]);
      expect(res.assignableTo).toEqual([
        { userId: 'user-ana', name: 'Ana Gutiérrez' },
        { userId: 'user-otra', name: 'Bea Soto' },
      ]);
      expect(res.patientContext).toMatchObject({
        reasonLabel: 'Control de rutina',
        clinicalAccess: 'NONE',
        delegateId: 'del-1',
        patientProfileId: 'pat-1',
      });
      expect(res.patientContext.requestedPermissionId).toEqual(
        expect.any(String),
      );
    });

    describe('N10: el texto clínico solo se lee con acceso clínico temporal aprobado', () => {
      const thread = [
        {
          id: 'p-clinico',
          senderProfileId: 'pp-paciente',
          bodyText: 'Tengo fiebre desde ayer',
          sentAt: new Date('2026-10-30T08:00:00Z'),
          disclosureShown: false,
        },
        {
          id: 'p-admin',
          senderProfileId: 'pp-paciente',
          bodyText: '¿Pueden cambiarme la cita del jueves?',
          sentAt: new Date('2026-10-30T08:30:00Z'),
          disclosureShown: false,
        },
        {
          id: 'd-propio',
          senderProfileId: 'pp-perez',
          bodyText: 'Su resultado de laboratorio salió alterado.',
          sentAt: new Date('2026-10-30T08:45:00Z'),
          authoredByUserId: 'user-doctor',
          disclosureShown: false,
        },
        {
          id: 'd-equipo',
          senderProfileId: 'pp-perez',
          bodyText: 'Le confirmamos el jueves a las 15:30.',
          sentAt: new Date('2026-10-30T09:00:00Z'),
          authoredByUserId: 'user-ana',
          onBehalfOfProfileId: 'pp-perez',
          disclosureShown: true,
        },
      ];
      const byId = (res: any, id: string) =>
        res.messages[
          ['p-clinico', 'p-admin', 'd-propio', 'd-equipo'].indexOf(id)
        ];

      it('sin acceso (NONE) o pendiente se oculta lo del doctor y lo marcado clínico, con isClinical=true y sin el texto', async () => {
        for (const state of ['NONE', 'PENDING']) {
          const d = build();
          d.repo.findMessages.mockResolvedValue(thread);
          d.repo.clinicalAccessState.mockResolvedValue(state);
          const res = await d.service.getConversation('conv-1', {}, ANA);
          for (const id of ['p-clinico', 'd-propio']) {
            expect(byId(res, id)).toMatchObject({
              bodyText: CLINICAL_CONTENT_HIDDEN_TEXT,
              isClinical: true,
              contentHidden: true,
            });
          }
          const wire = JSON.stringify(res.messages);
          expect(wire).not.toContain('fiebre');
          expect(wire).not.toContain('laboratorio');
          // Lo administrativo y lo que escribió el equipo sí se lee.
          expect(byId(res, 'p-admin')).toMatchObject({
            bodyText: '¿Pueden cambiarme la cita del jueves?',
            isClinical: false,
          });
          expect(byId(res, 'p-admin').contentHidden).toBeUndefined();
          expect(byId(res, 'd-equipo').bodyText).toBe(
            'Le confirmamos el jueves a las 15:30.',
          );
        }
      });

      it('con el acceso temporal APPROVED vigente se muestran completos', async () => {
        const d = build();
        d.repo.findMessages.mockResolvedValue(thread);
        d.repo.clinicalAccessState.mockResolvedValue('APPROVED');
        const res = await d.service.getConversation('conv-1', {}, ANA);
        expect(byId(res, 'p-clinico')).toMatchObject({
          bodyText: 'Tengo fiebre desde ayer',
          isClinical: true,
        });
        expect(byId(res, 'd-propio').bodyText).toBe(
          'Su resultado de laboratorio salió alterado.',
        );
        expect(res.messages.some((m: any) => m.contentHidden)).toBe(false);
      });

      it('sin paciente identificado no hay acceso clínico posible: todo lo clínico queda oculto', async () => {
        const d = build();
        d.repo.patientContext.mockResolvedValue({});
        d.repo.findMessages.mockResolvedValue(thread);
        const res = await d.service.getConversation('conv-1', {}, ANA);
        expect(d.repo.clinicalAccessState).not.toHaveBeenCalled();
        expect(byId(res, 'd-propio').bodyText).toBe(
          CLINICAL_CONTENT_HIDDEN_TEXT,
        );
      });
    });

    describe('SEG V-2: el texto del paciente solo se lee bajo la misma señal que la vista previa', () => {
      const thread = [
        {
          id: 'p-admin',
          senderProfileId: 'pp-paciente',
          bodyText: '¿Pueden cambiarme la cita del jueves?',
          sentAt: new Date('2026-10-30T08:30:00Z'),
          disclosureShown: false,
        },
        {
          id: 'p-disfrazado',
          senderProfileId: 'pp-paciente',
          // «cáncer» con espacio de ancho cero y «с» cirílica: la heurística
          // ya lo detecta, pero la barrera no puede depender de ella.
          bodyText: 'Tengo c\u00e1n\u200bcer y no se lo he dicho a nadie',
          sentAt: new Date('2026-10-30T08:40:00Z'),
          disclosureShown: false,
        },
        {
          id: 'p-inedito',
          senderProfileId: 'pp-paciente',
          // Algo que ninguna lista de palabras conoce.
          bodyText:
            'Mi hijo nació con una condición rara y toma pastillas azules',
          sentAt: new Date('2026-10-30T08:50:00Z'),
          disclosureShown: false,
        },
        {
          id: 'd-equipo',
          senderProfileId: 'pp-perez',
          bodyText: 'Le confirmamos el jueves a las 15:30.',
          sentAt: new Date('2026-10-30T09:00:00Z'),
          authoredByUserId: 'user-ana',
          onBehalfOfProfileId: 'pp-perez',
          disclosureShown: true,
        },
      ];

      it('quien escribe NO es paciente de la agenda: ningún texto suyo sale (aunque la heurística no lo marque)', async () => {
        const d = build({ agendaPatient: false });
        d.repo.findMessages.mockResolvedValue(thread);
        const res = await d.service.getConversation('conv-1', {}, ANA);
        for (const m of res.messages.slice(0, 3)) {
          expect(m).toMatchObject({
            bodyText: CLINICAL_CONTENT_HIDDEN_TEXT,
            contentHidden: true,
          });
        }
        const wire = JSON.stringify(res.messages);
        expect(wire).not.toContain('cambiarme la cita');
        expect(wire).not.toContain('pastillas azules');
        expect(wire).not.toContain('no se lo he dicho');
        // Lo que escribió el equipo sí se lee; los metadatos siguen.
        expect(res.messages[3].bodyText).toBe(
          'Le confirmamos el jueves a las 15:30.',
        );
        expect(res).toMatchObject({
          conversationId: 'conv-1',
          patientLabel: 'María Quispe',
        });
      });

      it('cambiar el estado a TAKEN o RESOLVED tampoco abre el texto', async () => {
        for (const statusConceptId of [
          COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
        ]) {
          const d = build({
            agendaPatient: false,
            assignment: {
              conversationId: 'conv-1',
              statusConceptId,
              assignedUserId: 'user-ana',
            },
          });
          d.repo.findMessages.mockResolvedValue(thread);
          const res = await d.service.getConversation('conv-1', {}, ANA);
          expect(res.messages[0].bodyText).toBe(CLINICAL_CONTENT_HIDDEN_TEXT);
        }
      });

      it('con el acceso clínico temporal APPROVED (lo aprueba el doctor) se lee completo aunque no sea paciente de la agenda', async () => {
        const d = build({ agendaPatient: false });
        d.repo.findMessages.mockResolvedValue(thread);
        d.repo.clinicalAccessState.mockResolvedValue('APPROVED');
        const res = await d.service.getConversation('conv-1', {}, ANA);
        expect(res.messages[0].bodyText).toBe(
          '¿Pueden cambiarme la cita del jueves?',
        );
        expect(res.messages.some((m: any) => m.contentHidden)).toBe(false);
      });

      it('paciente de la agenda: lo administrativo se lee y lo que la heurística marca sigue oculto', async () => {
        const d = build({ agendaPatient: true });
        d.repo.findMessages.mockResolvedValue(thread);
        const res = await d.service.getConversation('conv-1', {}, ANA);
        expect(res.messages[0].bodyText).toBe(
          '¿Pueden cambiarme la cita del jueves?',
        );
        expect(res.messages[1]).toMatchObject({
          bodyText: CLINICAL_CONTENT_HIDDEN_TEXT,
          contentHidden: true,
        });
      });
    });

    it('si el doctor no le permitió responder lo dice, con permiso y aceptación como motivo', async () => {
      const d = build({ replyAllowed: false });
      const res = await d.service.getConversation('conv-1', {}, ANA);
      expect(res.replyAllowed).toBe(false);
      expect(res.replyBlockedReason).toMatch(/no le autorizó/);
    });

    it('el estado del acceso clínico sale de la delegación y el paciente', async () => {
      const d = build();
      d.repo.clinicalAccessState.mockResolvedValue('PENDING');
      const res = await d.service.getConversation('conv-1', {}, ANA);
      expect(d.repo.clinicalAccessState).toHaveBeenCalledWith(
        expect.anything(),
        'del-1',
        'pat-1',
      );
      expect(res.patientContext.clinicalAccess).toBe('PENDING');
    });

    it('sin acceso responde 404 y no consulta ni lee mensajes', async () => {
      const d = build({ replyable: [], liveTenants: [] });
      await expect(
        d.service.getConversation('conv-1', { tenantId: TENANT }, ANA),
      ).rejects.toMatchObject({
        status: 404,
        reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
      });
      expect(d.repo.findMessages).not.toHaveBeenCalled();
    });

    it('una conversación de un doctor que la persona no atiende responde como inexistente', async () => {
      const d = build({
        replyable: [{ tenantId: TENANT, practitionerProfileId: 'prof-rojas' }],
      });
      await expect(
        d.service.getConversation('conv-1', {}, ANA),
      ).rejects.toMatchObject({ status: 404 });
      expect(d.repo.findMessages).not.toHaveBeenCalled();
    });
  });

  describe('asignación (laguna 5)', () => {
    it('con el estado final y sin assignedUserId asigna a quien pide', async () => {
      const d = build();
      const res = await d.service.applyAssignment(
        'conv-1',
        { practitionerProfileId: DOCTOR, status: 'TAKEN' } as any,
        ANA,
      );
      expect(res).toMatchObject({
        status: 'TAKEN',
        assignedUserId: 'user-ana',
        assignedToName: 'Ana Gutiérrez',
        referredToDoctor: false,
      });
      expect(d.created[0]).toMatchObject({
        assignedUserId: 'user-ana',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      });
      expect(d.policy.canReplyOnBehalf).not.toHaveBeenCalled();
    });

    it('409 con el nombre de quien la tiene, en las dos formas de pedirlo', async () => {
      const held = {
        conversationId: 'conv-1',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
        assignedUserId: 'otra',
      };
      for (const dto of [
        { status: 'RESOLVED' },
        { status: 'TAKEN' },
        { action: 'SET_STATUS', status: 'RESOLVED' },
        { action: 'ASSIGN' },
      ]) {
        const d = build({ assignment: { ...held } });
        await expect(
          d.service.applyAssignment('conv-1', dto as any, ANA),
        ).rejects.toMatchObject({
          status: 409,
          reason: CommunityErrorReason.CONVERSATION_ALREADY_TAKEN,
          details: { assignedToName: 'Bea Soto' },
        });
      }
    });

    it('una derivada al doctor que tiene otra persona tampoco se toma', async () => {
      const d = build({
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
          assignedUserId: 'otra',
        },
      });
      await expect(
        d.service.applyAssignment('conv-1', { action: 'TAKE' } as any, ANA),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('una resuelta no retiene a nadie: se retoma aunque la haya tenido otra persona', async () => {
      const assignment: any = {
        conversationId: 'conv-1',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
        assignedUserId: 'otra',
        slaDueAt: new Date(0),
        updatedAt: new Date(0),
      };
      const d = build({ assignment });
      const res = await d.service.applyAssignment(
        'conv-1',
        { status: 'TAKEN' } as any,
        ANA,
      );
      expect(res.assignedUserId).toBe('user-ana');
      // Reabrir da un plazo nuevo: el vencido de antes no se arrastra.
      expect(assignment.slaDueAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('422 si se asigna a quien no puede atender a ese doctor', async () => {
      const d = build({ assigneeAllowed: false });
      await expect(
        d.service.applyAssignment(
          'conv-1',
          { status: 'TAKEN', assignedUserId: 'user-otra' } as any,
          ANA,
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: CommunityErrorReason.CONVERSATION_ASSIGNEE_NOT_ELIGIBLE,
      });
      expect(d.repo.createAssignment).not.toHaveBeenCalled();
    });

    it('asignar a otra persona que sí puede la deja a su nombre', async () => {
      const d = build();
      const res = await d.service.applyAssignment(
        'conv-1',
        { status: 'TAKEN', assignedUserId: 'user-otra' } as any,
        ANA,
      );
      expect(res).toMatchObject({
        assignedUserId: 'user-otra',
        assignedToName: 'Bea Soto',
      });
    });

    it('ASSIGN sin assignedUserId asigna a quien pide', async () => {
      const d = build();
      const res = await d.service.applyAssignment(
        'conv-1',
        { action: 'ASSIGN' } as any,
        ANA,
      );
      expect(res.assignedUserId).toBe('user-ana');
    });

    it('soltar la conversación (NEW) quita a su dueña; resolver y derivar los hace quien la tiene', async () => {
      const mine: any = () => ({
        conversationId: 'conv-1',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_TAKEN,
        assignedUserId: 'user-ana',
        slaDueAt: new Date(),
        updatedAt: new Date(0),
      });
      const released = build({ assignment: mine() });
      const r1 = await released.service.applyAssignment(
        'conv-1',
        { status: 'NEW' } as any,
        ANA,
      );
      expect(r1).toMatchObject({ status: 'NEW', assignedUserId: undefined });
      const referred = build({ assignment: mine() });
      const r2 = await referred.service.applyAssignment(
        'conv-1',
        { status: 'WAITING_DOCTOR' } as any,
        ANA,
      );
      expect(r2).toMatchObject({
        status: 'WAITING_DOCTOR',
        assignedUserId: 'user-ana',
      });
    });

    it('quien la toma en el mismo gesto puede derivarla o resolverla sin dueña previa', async () => {
      const d = build();
      const res = await d.service.applyAssignment(
        'conv-1',
        { status: 'WAITING_DOCTOR' } as any,
        ANA,
      );
      expect(res).toMatchObject({
        status: 'WAITING_DOCTOR',
        assignedUserId: 'user-ana',
        referredToDoctor: false,
      });
    });

    it('con el estado final no deriva por su cuenta: con la acción TAKE sí, si hay un mensaje clínico pendiente', async () => {
      const clinical = conversation({
        lastPatientMessage: 'Me salió una erupción y tengo fiebre',
      });
      const byStatus = build({ conversations: [clinical] });
      expect(
        (
          await byStatus.service.applyAssignment(
            'conv-1',
            { status: 'TAKEN' } as any,
            ANA,
          )
        ).status,
      ).toBe('TAKEN');
      const byAction = build({ conversations: [clinical] });
      expect(
        (
          await byAction.service.applyAssignment(
            'conv-1',
            { action: 'TAKE' } as any,
            ANA,
          )
        ).status,
      ).toBe('WAITING_DOCTOR');
    });

    it('un doctor que no es el de la conversación se rechaza (422)', async () => {
      const d = build();
      await expect(
        d.service.applyAssignment(
          'conv-1',
          { practitionerProfileId: 'prof-rojas', status: 'TAKEN' } as any,
          ANA,
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: CommunityErrorReason.CONVERSATION_PRACTITIONER_MISMATCH,
      });
    });

    it('sin acción ni estado se pide uno (422)', async () => {
      const d = build();
      await expect(
        d.service.applyAssignment('conv-1', {} as any, ANA),
      ).rejects.toMatchObject({
        status: 422,
        reason: CommunityErrorReason.CONVERSATION_STATUS_REQUIRED,
      });
    });

    it('una resuelta no pasa a derivada ni a nueva por el estado final', async () => {
      for (const status of ['WAITING_DOCTOR', 'NEW']) {
        const d = build({
          assignment: {
            conversationId: 'conv-1',
            statusConceptId: COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
          },
        });
        await expect(
          d.service.applyAssignment('conv-1', { status } as any, ANA),
        ).rejects.toMatchObject({
          reason: CommunityErrorReason.CONVERSATION_INVALID_TRANSITION,
        });
      }
    });
  });

  describe('respuestas preparadas: versión y contenido (laguna 9)', () => {
    const existing = (over: Record<string, unknown> = {}): any => ({
      id: 't-1',
      tenantId: TENANT,
      title: 'Cambio de cita',
      bodyText: 'Con gusto reprogramamos su cita.',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      categoryConceptId: COMM.REPLY_TEMPLATE_CATEGORY_SCHEDULING,
      rowVersion: 3,
      updatedAt: new Date(0),
      ...over,
    });

    it('un título clínico tampoco se admite', async () => {
      const d = build();
      await expect(
        runWithTenant(TENANT, () =>
          d.service.createTemplate(
            {
              category: 'GENERAL',
              title: 'Receta de insulina',
              bodyText: 'Con gusto le ayudamos.',
            } as any,
            ANA,
          ),
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.SUPPORT_CLINICAL_CONTENT,
      });
    });

    it('el doctor dueño debe ser de la organización', async () => {
      const d = build();
      d.policy.isDoctorOfTenant.mockResolvedValue(false);
      await expect(
        runWithTenant(TENANT, () =>
          d.service.createTemplate(
            {
              category: 'GENERAL',
              title: 'Hola',
              bodyText: 'Con gusto le ayudamos.',
              practitionerProfileId: 'prof-de-otra-org',
            } as any,
            ANA,
          ),
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.REPLY_TEMPLATE_PRACTITIONER_INVALID,
      });
      expect(d.repo.createTemplate).not.toHaveBeenCalled();
    });

    it('la respuesta expone su versión', async () => {
      const d = build();
      const created = await runWithTenant(TENANT, () =>
        d.service.createTemplate(
          { category: 'GENERAL', title: 'Hola', bodyText: 'Con gusto.' } as any,
          ANA,
        ),
      );
      expect(created.version).toBe(1);
    });

    it('editar sobre una versión que ya cambió se rechaza (409) y no pisa nada', async () => {
      const d = build();
      const row = existing();
      d.repo.findTemplate.mockResolvedValue(row);
      await expect(
        runWithTenant(TENANT, () =>
          d.service.updateTemplate(
            't-1',
            { bodyText: 'Otro texto', expectedVersion: 2 } as any,
            ANA,
          ),
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: CommunityErrorReason.REPLY_TEMPLATE_STALE,
        details: { currentVersion: 3 },
      });
      expect(row.bodyText).toBe('Con gusto reprogramamos su cita.');
    });

    it('con la versión vigente la edición pasa', async () => {
      const d = build();
      const row = existing();
      d.repo.findTemplate.mockResolvedValue(row);
      const res = await runWithTenant(TENANT, () =>
        d.service.updateTemplate(
          't-1',
          { bodyText: 'Con gusto la movemos.', expectedVersion: 3 } as any,
          ANA,
        ),
      );
      expect(res.bodyText).toBe('Con gusto la movemos.');
    });

    it('se revisa lo que quedaría guardado: un título clínico en el PATCH se rechaza', async () => {
      const d = build();
      d.repo.findTemplate.mockResolvedValue(existing());
      await expect(
        runWithTenant(TENANT, () =>
          d.service.updateTemplate(
            't-1',
            { title: 'Dosis de insulina' } as any,
            ANA,
          ),
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.SUPPORT_CLINICAL_CONTENT,
      });
    });

    it('una de otra organización responde como inexistente', async () => {
      const d = build();
      d.repo.findTemplate.mockResolvedValue(existing({ tenantId: 'otra-org' }));
      await expect(
        runWithTenant(TENANT, () =>
          d.service.updateTemplate('t-1', { title: 'Hola' } as any, ANA),
        ),
      ).rejects.toMatchObject({
        reason: CommunityErrorReason.REPLY_TEMPLATE_NOT_FOUND,
      });
    });

    it('retirarla y reactivarla cambia su estado', async () => {
      const d = build();
      const row = existing();
      d.repo.findTemplate.mockResolvedValue(row);
      const retired = await runWithTenant(TENANT, () =>
        d.service.updateTemplate('t-1', { retired: true } as any, ANA),
      );
      expect(retired.retired).toBe(true);
      const back = await runWithTenant(TENANT, () =>
        d.service.updateTemplate('t-1', { retired: false } as any, ANA),
      );
      expect(back.retired).toBe(false);
    });
  });
});

describe('SEG A-A3: la lectura de la bandeja aplica las condiciones y las exclusiones de paciente', () => {
  it('listInbox oculta la conversación que la política deniega (paciente VIP/confidencial o condición no cumplida)', async () => {
    const d = build({
      conversations: [
        conversation({ conversationId: 'conv-vip' }),
        conversation({
          conversationId: 'conv-ok',
          patientUserId: 'user-paciente',
        }),
      ],
      hiddenConversations: ['conv-vip'],
    });
    const res = await d.service.listInbox({}, ANA);
    expect(res.items.map((i) => i.conversationId)).toEqual(['conv-ok']);
    expect(res.count).toBe(1);
    // La política recibe el paciente de cada conversación (para banderas, edad, cobertura).
    expect(d.policy.decideInboxConversations).toHaveBeenCalledWith(
      'user-ana',
      TENANT,
      expect.arrayContaining([
        expect.objectContaining({
          key: 'conv-vip',
          practitionerProfileId: DOCTOR,
          patientProfileId: 'pat-1',
        }),
      ]),
      expect.anything(),
    );
  });

  it('getConversation de una conversación denegada responde 404 uniforme y no lee mensajes ni notas', async () => {
    const d = build({ hiddenConversations: ['conv-1'] });
    await expect(
      d.service.getConversation('conv-1', {}, ANA),
    ).rejects.toMatchObject({
      reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
    });
    expect(d.repo.findMessages).not.toHaveBeenCalled();
    expect(d.repo.findNotes).not.toHaveBeenCalled();
  });

  it('getConversation sella un asiento de acceso por paciente (quién leyó la conversación del paciente X)', async () => {
    const d = build();
    await d.service.getConversation('conv-1', {}, ANA);
    expect(d.accessLog.record).toHaveBeenCalledTimes(1);
    expect(d.accessLog.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-ana',
        patientProfileId: 'pat-1',
        tenantId: TENANT,
        resourceType: 'SUPPORT_INBOX',
      }),
    );
    // Sin contenido: ni texto de mensajes ni nombre del paciente en el asiento.
    expect(JSON.stringify(d.accessLog.record.mock.calls)).not.toMatch(
      /María|biopsia|cita del jueves/,
    );
  });

  it('tomar o anotar una conversación denegada tampoco se puede: 404 uniforme y sin efectos', async () => {
    const d = build({ hiddenConversations: ['conv-1'] });
    await expect(
      d.service.applyAssignment('conv-1', { action: 'TAKE' } as any, ANA),
    ).rejects.toMatchObject({
      reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
    });
    expect(d.repo.createAssignment).not.toHaveBeenCalled();
    await expect(
      d.service.addNote('conv-1', { bodyText: 'nota' } as any, ANA),
    ).rejects.toMatchObject({
      reason: CommunityErrorReason.CONVERSATION_NOT_FOUND,
    });
    expect(d.repo.createNote).not.toHaveBeenCalled();
  });

  it('una conversación denegada no deja asiento de lectura', async () => {
    const d = build({ hiddenConversations: ['conv-1'] });
    await d.service.getConversation('conv-1', {}, ANA).catch(() => undefined);
    expect(d.accessLog.record).not.toHaveBeenCalled();
  });
});

describe('SEG A-A4: vista previa solo metadatos para el personal de apoyo', () => {
  it('de un desconocido (sin cita con el doctor) la lista no muestra el texto', async () => {
    const d = build({ agendaPatient: false });
    const [item] = (await d.service.listInbox({}, ANA)).items;
    expect(item.lastPatientMessage).toBeUndefined();
    expect(item.lastMessagePreview).toBe(PREVIEW_METADATA_ONLY_TEXT);
    expect(item.previewHidden).toBe(true);
    expect(JSON.stringify(item)).not.toContain('cambiarme la cita');
    // Los metadatos siguen: quién, cuándo, plazo, estado.
    expect(item).toMatchObject({
      conversationId: 'conv-1',
      patientLabel: 'María Quispe',
      status: 'NEW',
    });
  });

  it('del propio paciente de la agenda y sin contenido clínico se muestra', async () => {
    const d = build({ agendaPatient: true });
    const [item] = (await d.service.listInbox({}, ANA)).items;
    expect(item.lastMessagePreview).toBe(
      '¿Pueden cambiarme la cita del jueves?',
    );
    expect(item.previewHidden).toBeFalsy();
  });

  it('SEG V-2: tomar o resolver no desbloquea la vista previa: lo fija el propio apoyo, no es una señal fiable', async () => {
    // PoC: la persona de apoyo hacía `POST …/assignment {"status":"RESOLVED"}`
    // (o ASSIGN / TAKE sobre algo no marcado clínico) y la lista empezaba a
    // mostrar el texto. Ahora solo lo habilita algo que el apoyo no controla.
    for (const statusConceptId of [
      COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
    ]) {
      const d = build({
        agendaPatient: false,
        assignment: {
          conversationId: 'conv-1',
          statusConceptId,
          assignedUserId: 'user-ana',
        },
      });
      const [item] = (await d.service.listInbox({}, ANA)).items;
      expect(item.previewHidden).toBe(true);
      expect(item.lastPatientMessage).toBeUndefined();
      expect(item.lastMessagePreview).toBe(PREVIEW_METADATA_ONLY_TEXT);
      expect(JSON.stringify(item)).not.toContain('cambiarme la cita');
    }
  });

  it('SEG V-2: la persona de apoyo no puede abrir la vista previa cambiando el estado (TAKE, ASSIGN, RESOLVED)', async () => {
    for (const dto of [
      { action: 'TAKE' },
      { action: 'ASSIGN' },
      { status: 'RESOLVED' },
      { status: 'TAKEN' },
    ]) {
      const d = build({ agendaPatient: false });
      await d.service.applyAssignment('conv-1', dto as any, ANA);
      const written = d.created[0];
      // Con el estado que el apoyo acaba de fijar, la lista sigue sin texto.
      const after = build({
        agendaPatient: false,
        assignment: {
          conversationId: 'conv-1',
          statusConceptId: written.statusConceptId,
          assignedUserId: 'user-ana',
        },
      });
      const [item] = (await after.service.listInbox({}, ANA)).items;
      expect(item.previewHidden).toBe(true);
    }
  });

  it('una derivada al doctor (WAITING_DOCTOR) no cuenta como administrativa', async () => {
    const d = build({
      agendaPatient: false,
      assignment: {
        conversationId: 'conv-1',
        statusConceptId: COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
        assignedUserId: 'user-ana',
      },
    });
    const [item] = (await d.service.listInbox({}, ANA)).items;
    expect(item.previewHidden).toBe(true);
  });

  it('un mensaje clínico no se previsualiza ni siendo paciente de la agenda (marcador clínico)', async () => {
    const d = build({
      agendaPatient: true,
      conversations: [
        conversation({
          lastPatientMessage:
            'Doctor, mi biopsia salió con células anormales, tengo miedo del cáncer',
        }),
      ],
    });
    const [item] = (await d.service.listInbox({}, ANA)).items;
    expect(item.lastMessagePreview).toBe(CLINICAL_CONTENT_HIDDEN_TEXT);
    expect(JSON.stringify(item)).not.toContain('biopsia');
  });
});
