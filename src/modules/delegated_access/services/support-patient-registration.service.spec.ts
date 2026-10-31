import { jest } from '@jest/globals';
import {
  PATIENT_PORTAL_INVITATION_EVENT,
  SupportPatientRegistrationService,
} from './support-patient-registration.service';
import { FOREIGN_PATIENT_LABEL } from './support-patient-view';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const TENANT = 'tenant-hospital';

/** Vínculo vigente cuyo único permiso trae las acciones indicadas. */
const facts = (actions: string[]): any[] => [
  {
    engagementId: 'eng-1',
    active: true,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    acceptances: [],
    grants: [
      {
        grantId: 'g1',
        targetKind: 'ALL',
        expansionMode: 'DYNAMIC',
        active: true,
        actions,
      },
    ],
  },
];

/** Cuerpo de un adulto con documento, teléfono y fecha de nacimiento. */
const ADULT = {
  tenantId: TENANT,
  name: 'Lucía',
  lastName: 'Mamani',
  motherLastName: 'Quispe',
  document: '7654321',
  birthDate: '1990-05-17',
  phone: '+591 71234567',
};

/** Un menor, con su madre como representante. */
const MINOR = {
  ...ADULT,
  name: 'Martín',
  lastName: 'Rocha',
  motherLastName: 'Antelo',
  document: '8888888',
  birthDate: '2018-03-02',
  guardian: {
    name: 'Sandra Antelo Vaca',
    document: '4444444',
    phone: '+591 70000001',
    relationship: 'Madre',
  },
};

/** Un candidato a duplicado, con valores por defecto de «otra organización». */
const candidate = (overrides: Record<string, unknown> = {}) => ({
  profileId: 'pat-ajeno',
  displayName: 'Lucía Mamani Quispe',
  birthDate: '1990-05-17',
  nationalId: '7654321',
  phone: '+591 71234567',
  basis: ['NAME_AND_BIRTH_DATE'],
  linkedToTenant: false,
  ...overrides,
});

function build(
  options: {
    actions?: string[];
    candidates?: unknown[];
    account?: { userId: string; displayName: string } | null;
    /** `false`: la persona no tiene ningún vínculo en la organización del cuerpo. */
    linked?: boolean;
    probe?: Record<string, unknown>;
  } = {},
) {
  // Simula el contexto de RLS de la transacción para ver en qué contexto se sella.
  const ctx = { system: 'false', tenant: '' };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn((sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return Promise.resolve([{ sc: ctx.system, tid: ctx.tenant }]);
      }
      if (sql.includes("'app.system_context', 'true'")) ctx.system = 'true';
      else if (sql.includes("'app.system_context', 'false'"))
        ctx.system = 'false';
      else if (sql.includes("'app.system_context', ?"))
        ctx.system = String(params![0]);
      else if (sql.includes("'app.current_tenant_id', ?"))
        ctx.tenant = String(params![0]);
      else if (sql.includes("'app.current_tenant_id', ''")) ctx.tenant = '';
      return Promise.resolve([]);
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const policy = {
    loadFacts: mockFn().mockResolvedValue(
      facts(options.actions ?? ['patient.register']),
    ),
  };
  const engagements = {
    findEngagements: mockFn().mockResolvedValue(
      options.linked === false ? [] : [{ assignment: { id: 'e' } }],
    ),
  };
  const patients = {
    findDuplicateCandidates: mockFn().mockResolvedValue(
      options.candidates ?? [],
    ),
    findRepresentatives: mockFn().mockResolvedValue(new Map()),
    lockDocument: mockFn().mockResolvedValue(undefined),
    // Ya no se busca la cuenta del representante: el registro no la usa.
    findAccountByNationalId: mockFn().mockResolvedValue(
      options.account === undefined ? null : options.account,
    ),
  };
  const persons = {
    create: mockFn((_: any, data: any) => ({
      id: `person-${persons.create.mock.calls.length}`,
      ...data,
    })),
  };
  const personProfiles = { create: mockFn() };
  const patientProfiles = {
    create: mockFn((_: any, data: any) => ({ ...data })),
  };
  const identifiers = {
    findActiveNationalIdDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const contactPoints = { create: mockFn() };
  const relatedPersons = {
    create: mockFn((_: any, data: any) => ({ id: 'rel-1', ...data })),
  };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  // Lo que el contador de consultas (fuera de la transacción) responde al intento.
  const probes = {
    hit: mockFn().mockResolvedValue({
      allowed: true,
      firstOverflow: false,
      ...(options.probe ?? {}),
    }),
  };
  const sealContext: string[] = [];
  const audit = {
    record: mockFn(async () => {
      sealContext.push(ctx.system);
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SupportPatientRegistrationService(
    em as any,
    policy as any,
    engagements as any,
    patients as any,
    persons as any,
    personProfiles as any,
    patientProfiles as any,
    identifiers as any,
    contactPoints as any,
    relatedPersons as any,
    outbox as any,
    audit as any,
    probes as any,
    logger as any,
  );
  return {
    service,
    policy,
    tx,
    patients,
    persons,
    identifiers,
    contactPoints,
    relatedPersons,
    outbox,
    audit,
    probes,
    logger,
    em,
    ctx,
    sealContext,
  };
}

/** Acciones selladas en la cadena de auditoría. */
const sealed = (d: ReturnType<typeof build>): string[] =>
  d.audit.record.mock.calls.map(([, , entry]: any[]) => entry.action);

/** Organizaciones en cuya cadena se selló algo (`undefined`: partición propia, sin tenant). */
const sealedTenants = (d: ReturnType<typeof build>): unknown[] =>
  d.audit.record.mock.calls.map(([, , entry]: any[]) => entry.tenantId);

describe('SupportPatientRegistrationService', () => {
  it('sin patient.register responde 403 y deja la negativa sellada en la organización', async () => {
    const d = build({ actions: ['schedule.view'] });
    await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
      reason: Reason.SUPPORT_PATIENT_REGISTER_DENIED,
      status: 403,
    });
    expect(d.persons.create).not.toHaveBeenCalled();
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({
        action: 'SUPPORT_PATIENT_REGISTER_DENIED',
        tenantId: TENANT,
        success: false,
      }),
    );
  });

  describe('N5: el rechazo de quien no tiene vínculo no se sella en la organización del cuerpo', () => {
    it('sin ningún vínculo en la organización: 403 y el asiento va a la partición propia (sin tenant), nunca a la organización indicada', async () => {
      const d = build({ linked: false });
      await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_REGISTER_DENIED,
        status: 403,
      });
      expect(d.persons.create).not.toHaveBeenCalled();
      expect(sealed(d)).toEqual(['SUPPORT_PATIENT_REGISTER_DENIED']);
      expect(sealedTenants(d)).toEqual([undefined]);
      expect(d.audit.record).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('con una organización que no existe responde 403 igual y sella igual en la partición propia (no hay clave foránea que violar)', async () => {
      const d = build({ linked: false });
      await expect(
        d.service.register({ ...ADULT, tenantId: 'tenant-inventada' }, ANA),
      ).rejects.toMatchObject({ status: 403 });
      expect(sealedTenants(d)).toEqual([undefined]);
    });

    it('con vínculo pero sin patient.register el rechazo SÍ es de la organización (es su personal)', async () => {
      const d = build({ actions: ['schedule.view'] });
      await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
        status: 403,
      });
      expect(sealedTenants(d)).toEqual([TENANT]);
    });

    it('un vínculo que ya no rige (suspendido o vencido) cuenta como sin vínculo', async () => {
      const d = build();
      d.policy.loadFacts.mockResolvedValue([
        { ...facts(['patient.register'])[0], active: false },
      ]);
      await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
        status: 403,
      });
      expect(sealedTenants(d)).toEqual([undefined]);
    });

    it('con RLS, el sello propio abre el contexto de sistema solo mientras se escribe y devuelve el contexto de la organización', async () => {
      const before = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const d = build({ linked: false });
        await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
          status: 403,
        });
        // En el instante del sello rige el contexto de sistema (fila sin tenant)...
        expect(d.sealContext).toEqual(['true']);
        // ...y al terminar la transacción no queda abierto.
        expect(d.ctx.system).toBe('false');
      } finally {
        if (before === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = before;
      }
    });

    it('lo que sí es de la organización (el alta) se sella en ella', async () => {
      const d = build();
      await d.service.register(ADULT, ANA);
      expect(new Set(sealedTenants(d))).toEqual(new Set([TENANT]));
    });
  });

  it('adulto sin parecidos: CREATED con datos mínimos (documento y teléfono tapados) y sellado', async () => {
    const d = build();
    const res = await d.service.register(ADULT, ANA);
    expect(res.outcome).toBe('CREATED');
    expect(res.invitationSent).toBe(false);
    // Lo escribió el mostrador: nadie verificó la identidad.
    expect(res.identityVerified).toBe(false);
    expect(res.patient).toMatchObject({
      displayName: 'Lucía Mamani Quispe',
      documentMasked: '***321',
      phoneMasked: '7******7',
      isMinor: false,
    });
    expect(JSON.stringify(res)).not.toContain('7654321');
    // Reutiliza el alta compartida: persona, documento y teléfono del paciente.
    expect(d.identifiers.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: '7654321' }),
    );
    expect(d.contactPoints.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: '+591 71234567' }),
    );
    expect(sealed(d)).toContain('SUPPORT_PATIENT_REGISTERED');
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({
        action: 'SUPPORT_PATIENT_REGISTERED',
        tenantId: TENANT,
        success: true,
        entity: 'patient',
      }),
    );
  });

  it('acepta `org` y `nationalId` como alias de `tenantId` y `document`', async () => {
    const d = build();
    const { tenantId, document, ...rest } = ADULT;
    const res = await d.service.register(
      { ...rest, org: tenantId, nationalId: document },
      ANA,
    );
    expect(res.outcome).toBe('CREATED');
    expect(d.patients.findDuplicateCandidates).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: TENANT, nationalId: '7654321' }),
    );
  });

  it('una fecha de nacimiento que no existe responde 400', async () => {
    const d = build();
    await expect(
      d.service.register({ ...ADULT, birthDate: '1990-02-31' }, ANA),
    ).rejects.toMatchObject({ status: 400 });
  });

  describe('posibles duplicados', () => {
    it('de OTRA organización: POSSIBLE_DUPLICATES sin perfil, nombre, edad ni documento del registro ajeno', async () => {
      const d = build({ candidates: [candidate()] });
      const res = await d.service.register(ADULT, ANA);
      expect(res.outcome).toBe('POSSIBLE_DUPLICATES');
      expect(res.patient).toBeUndefined();
      expect(res.duplicates).toHaveLength(1);
      const [dup] = res.duplicates!;
      expect(dup).toMatchObject({
        displayName: FOREIGN_PATIENT_LABEL,
        linkedToOrganization: false,
        matchedBy: ['NAME_AND_BIRTH_DATE'],
        // Lo tapado es lo que quien registra escribió, no el registro ajeno.
        documentMasked: '***321',
      });
      expect(dup.profileId).toBeUndefined();
      expect(dup.patientProfileId).toBeUndefined();
      expect(dup.phoneMasked).toBeUndefined();
      const serialized = JSON.stringify(res);
      expect(serialized).not.toContain('pat-ajeno');
      expect(serialized).not.toContain('Lucía Mamani Quispe');
      // Y no se creó nada.
      expect(d.persons.create).not.toHaveBeenCalled();
      expect(sealed(d)).toContain('SUPPORT_PATIENT_REGISTER_DUPLICATES');
    });

    it('de la organización: sale con perfil y lo mínimo, y se sella a quién se le mostró', async () => {
      const d = build({
        candidates: [
          candidate({
            profileId: 'pat-propio',
            linkedToTenant: true,
            basis: ['DOCUMENT'],
          }),
        ],
      });
      const res = await d.service.register(ADULT, ANA);
      expect(res.outcome).toBe('POSSIBLE_DUPLICATES');
      expect(res.duplicates![0]).toMatchObject({
        profileId: 'pat-propio',
        patientProfileId: 'pat-propio',
        displayName: 'Lucía Mamani Quispe',
        documentMasked: '***321',
        phoneMasked: '7******7',
        linkedToOrganization: true,
        matchedBy: ['DOCUMENT'],
      });
      expect(d.audit.record).toHaveBeenCalledWith(
        expect.anything(),
        ANA,
        expect.objectContaining({
          action: 'SUPPORT_PATIENT_SEARCH_MATCH',
          entityId: 'pat-propio',
          tenantId: TENANT,
        }),
      );
    });

    it('con acknowledgeDuplicates crea igual cuando el parecido no es el mismo documento', async () => {
      const d = build({ candidates: [candidate()] });
      const res = await d.service.register(
        { ...ADULT, acknowledgeDuplicates: true },
        ANA,
      );
      expect(res.outcome).toBe('CREATED');
      expect(d.persons.create).toHaveBeenCalled();
    });

    it('un documento ya registrado no se duplica ni con acknowledgeDuplicates: 409', async () => {
      const d = build({ candidates: [candidate({ basis: ['DOCUMENT'] })] });
      await expect(
        d.service.register({ ...ADULT, acknowledgeDuplicates: true }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_DOCUMENT_REGISTERED,
        status: 409,
      });
      expect(d.persons.create).not.toHaveBeenCalled();
    });
  });

  describe('menores', () => {
    it('un menor sin representante responde 422 y no crea nada', async () => {
      const d = build();
      const { guardian: _guardian, ...sinRepresentante } = MINOR;
      await expect(
        d.service.register(sinRepresentante, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_GUARDIAN_REQUIRED,
        status: 422,
      });
      expect(d.persons.create).not.toHaveBeenCalled();
    });

    const PENDING = { recorded: true, status: 'PENDING_VERIFICATION' };

    describe('N1: el alta del mostrador no crea representación legal', () => {
      it('con la madre ya usuaria (mismo documento y nombre): solo persona relacionada, pendiente de verificación', async () => {
        const d = build({
          account: { userId: 'user-sandra', displayName: 'Sandra Antelo Vaca' },
        });
        const res = await d.service.register(MINOR, ANA);
        expect(res.outcome).toBe('CREATED');
        expect(res.guardian).toEqual(PENDING);
        expect(res.patient).toMatchObject({ isMinor: true });
        expect(res.patient!.representatives).toEqual([
          { id: 'rel-1', name: 'Sandra Antelo Vaca', relationship: 'Madre' },
        ]);
        // La fila de persona relacionada nunca es tutela legal.
        expect(d.relatedPersons.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ isLegalGuardian: false }),
        );
        expect(sealed(d)).toContain(
          'SUPPORT_PATIENT_GUARDIAN_PENDING_VERIFICATION',
        );
        expect(sealed(d)).not.toContain('SUPPORT_PATIENT_GUARDIAN_LINKED');
      });

      it('no consulta ninguna cuenta por el documento del representante (no hay representación que enlazar)', async () => {
        const d = build({
          account: { userId: 'user-sandra', displayName: 'Sandra Antelo Vaca' },
        });
        await d.service.register(MINOR, ANA);
        expect(d.patients.findAccountByNationalId).not.toHaveBeenCalled();
      });

      it('la respuesta es uniforme: con cuenta, sin cuenta o con otro nombre no se distingue (sin oráculo de existencia de cuenta)', async () => {
        const answers: string[] = [];
        for (const account of [
          { userId: 'user-sandra', displayName: 'Sandra Antelo Vaca' },
          null,
          { userId: 'user-otra', displayName: 'Carmen Flores Rojas' },
        ]) {
          const d = build({ account });
          const res = await d.service.register(MINOR, ANA);
          answers.push(JSON.stringify({ ...res, patient: undefined }));
        }
        expect(new Set(answers).size).toBe(1);
      });

      it('la respuesta ya no trae guardianLink ni nombra una representación legal', async () => {
        const d = build({
          account: { userId: 'user-sandra', displayName: 'Sandra Antelo Vaca' },
        });
        const res = await d.service.register(MINOR, ANA);
        const text = JSON.stringify(res);
        expect(res).not.toHaveProperty('guardianLink');
        expect(text).not.toContain('guardianLink');
        expect(text).not.toContain('LEGAL_REPRESENTATION');
        expect(text).not.toContain('user-sandra');
      });

      it('el documento del representante no se guarda ni se usa', async () => {
        const d = build({ account: null });
        const res = await d.service.register(MINOR, ANA);
        expect(res.guardian).toEqual(PENDING);
        expect(d.relatedPersons.create).toHaveBeenCalled();
        const identifierValues = d.identifiers.create.mock.calls.map(
          ([, data]: any[]) => data.value,
        );
        expect(identifierValues).toEqual(['8888888']);
        expect(JSON.stringify(res)).not.toContain('4444444');
      });

      it.each(['Padre', 'Tutor legal', 'Abuela autorizada', 'Tío'])(
        '«%s»: mismo resultado, ninguna representación legal',
        async (relationship) => {
          const d = build({
            account: {
              userId: 'user-sandra',
              displayName: 'Sandra Antelo Vaca',
            },
          });
          const res = await d.service.register(
            { ...MINOR, guardian: { ...MINOR.guardian, relationship } },
            ANA,
          );
          expect(res.guardian).toEqual(PENDING);
          expect(d.patients.findAccountByNationalId).not.toHaveBeenCalled();
        },
      );

      it('un adulto no trae representante', async () => {
        const d = build();
        const res = await d.service.register(ADULT, ANA);
        expect(res.guardian).toBeUndefined();
        expect(sealed(d)).not.toContain(
          'SUPPORT_PATIENT_GUARDIAN_PENDING_VERIFICATION',
        );
      });
    });
  });

  describe('N3: identidades sin verificar', () => {
    it('normaliza el documento (mayúsculas, sin puntos, guiones, espacios ni ceros de relleno) al comparar y al guardar', async () => {
      const d = build();
      await d.service.register({ ...ADULT, document: ' 0.765-43 21 ' }, ANA);
      expect(d.patients.findDuplicateCandidates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nationalId: '7654321' }),
      );
      expect(d.identifiers.findActiveNationalIdDuplicate).toHaveBeenCalledWith(
        expect.anything(),
        '7654321',
      );
      expect(d.identifiers.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ value: '7654321' }),
      );
    });

    it('N3: si el índice único rechaza la segunda alta simultánea (23505) responde 409 SUPPORT_PATIENT_DOCUMENT_REGISTERED y sella el rechazo en la partición propia', async () => {
      const d = build();
      // La carrera: la comprobación de parecidos no vio nada y la alta chocó
      // con el índice al insertar el documento.
      d.identifiers.findActiveNationalIdDuplicate.mockResolvedValue(null);
      d.tx.flush
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'uq_identifiers_national_id_normalized',
          }),
        );
      await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_DOCUMENT_REGISTERED,
        status: 409,
      });
      expect(sealed(d)).toContain('SUPPORT_PATIENT_REGISTER_REJECTED');
      expect(sealed(d)).not.toContain('SUPPORT_PATIENT_REGISTERED');
      // La alta rechazada no deja teléfono ni invitación.
      expect(d.contactPoints.create).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('con complemento en minúsculas guarda la forma canónica en mayúsculas', async () => {
      const d = build();
      await d.service.register({ ...ADULT, document: '7654321-1a' }, ANA);
      expect(d.identifiers.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ value: '76543211A' }),
      );
    });

    it('una variante del documento ya registrado no se duplica ni con acknowledgeDuplicates: 409', async () => {
      const d = build({ candidates: [candidate({ basis: ['DOCUMENT'] })] });
      await expect(
        d.service.register(
          { ...ADULT, document: '07654321', acknowledgeDuplicates: true },
          ANA,
        ),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_DOCUMENT_REGISTERED,
        status: 409,
      });
      // Se buscó con la forma normalizada, no con lo escrito.
      expect(d.patients.findDuplicateCandidates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nationalId: '7654321' }),
      );
      expect(d.persons.create).not.toHaveBeenCalled();
    });

    it('toma un cerrojo por documento normalizado ANTES de buscar parecidos (dos altas simultáneas no pasan las dos)', async () => {
      const d = build();
      await d.service.register({ ...ADULT, document: '07654321' }, ANA);
      expect(d.patients.lockDocument).toHaveBeenCalledWith(
        expect.anything(),
        '7654321',
      );
      expect(d.patients.lockDocument.mock.invocationCallOrder[0]).toBeLessThan(
        d.patients.findDuplicateCandidates.mock.invocationCallOrder[0],
      );
    });

    it.each(['-----', '00000', '. . . . .'])(
      'un documento sin contenido («%s») responde 400 y no crea nada',
      async (document) => {
        const d = build();
        await expect(
          d.service.register({ ...ADULT, document }, ANA),
        ).rejects.toMatchObject({ status: 400 });
        expect(d.persons.create).not.toHaveBeenCalled();
      },
    );

    it('el perfil creado queda sin verificar: la respuesta lo dice', async () => {
      const d = build();
      const res = await d.service.register(ADULT, ANA);
      expect(res.identityVerified).toBe(false);
    });
  });

  describe('invitación al portal', () => {
    it('inviteToPortal publica el hecho con solo ids (nunca el documento ni el teléfono) y sella la invitación', async () => {
      const d = build();
      const res = await d.service.register(
        { ...ADULT, inviteToPortal: true },
        ANA,
      );
      expect(res.invitationSent).toBe(true);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
      const [, event] = d.outbox.publishDomainEvent.mock.calls[0];
      expect(event).toMatchObject({
        tenantId: TENANT,
        eventType: PATIENT_PORTAL_INVITATION_EVENT,
        aggregateType: 'patient_profile',
      });
      expect(Object.keys(event.payloadJson).sort()).toEqual([
        'patientProfileId',
        'requestedByUserId',
        'tenantId',
      ]);
      expect(sealed(d)).toContain('SUPPORT_PATIENT_PORTAL_INVITED');
    });

    it('B-g: el outbox lleva solo ids; ni documento, ni teléfono, ni nombres, ni datos del representante', async () => {
      const d = build();
      const res = await d.service.register(
        { ...MINOR, inviteToPortal: true },
        ANA,
      );
      expect(res.invitationSent).toBe(true);
      const [, event] = d.outbox.publishDomainEvent.mock.calls[0];
      const text = JSON.stringify(event);
      for (const secret of [
        '8888888',
        '4444444',
        '70000001',
        '71234567',
        'Martín',
        'Rocha',
        'Antelo',
        'Sandra',
        '2018-03-02',
      ]) {
        expect(text).not.toContain(secret);
      }
      // Todo valor del payload es un id conocido: el paciente, la organización o quien pidió.
      expect(Object.values(event.payloadJson).sort()).toEqual(
        [res.patient!.patientProfileId, TENANT, ANA.id].sort(),
      );
      expect(event.aggregateId).toBe(res.patient!.patientProfileId);
    });

    it('sin inviteToPortal no se publica nada', async () => {
      const d = build();
      const res = await d.service.register(ADULT, ANA);
      expect(res.invitationSent).toBe(false);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('si hay parecidos y aún no se aceptan, tampoco se invita a nadie', async () => {
      const d = build({ candidates: [candidate()] });
      await d.service.register({ ...ADULT, inviteToPortal: true }, ANA);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('N4: tope de consultas (contador propio, antes y fuera de la transacción)', () => {
    it('cuenta el intento con la persona y la IP antes de abrir la transacción de negocio', async () => {
      const d = build();
      await d.service.register(ADULT, ANA, '203.0.113.9');
      expect(d.probes.hit).toHaveBeenCalledTimes(1);
      expect(d.probes.hit).toHaveBeenCalledWith('user-ana', '203.0.113.9');
      expect(d.probes.hit.mock.invocationCallOrder[0]).toBeLessThan(
        d.em.transactional.mock.invocationCallOrder[0],
      );
    });

    it('al superar el tope responde 429 sin tocar vínculos, parecidos ni escribir nada', async () => {
      const d = build({
        probe: {
          allowed: false,
          firstOverflow: false,
          exceeded: { scope: 'PERSON', window: 'MINUTE' },
        },
      });
      await expect(d.service.register(ADULT, ANA)).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_SEARCH_THROTTLED,
        status: 429,
        details: expect.objectContaining({
          limit: 'PER_MINUTE',
          scope: 'PERSON',
        }),
      });
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.patients.findDuplicateCandidates).not.toHaveBeenCalled();
      expect(d.persons.create).not.toHaveBeenCalled();
    });

    it('el tope diario y el de IP responden igual, con su alcance', async () => {
      const d = build({
        probe: {
          allowed: false,
          firstOverflow: false,
          exceeded: { scope: 'IP', window: 'DAY' },
        },
      });
      await expect(
        d.service.register(ADULT, ANA, '198.51.100.1'),
      ).rejects.toMatchObject({
        status: 429,
        details: expect.objectContaining({ limit: 'PER_DAY', scope: 'IP' }),
      });
    });

    it('el primer rechazo de la racha deja un sello en la partición propia (sin tenant); los siguientes no', async () => {
      const first = build({
        probe: {
          allowed: false,
          firstOverflow: true,
          exceeded: { scope: 'PERSON', window: 'MINUTE' },
        },
      });
      await expect(first.service.register(ADULT, ANA)).rejects.toMatchObject({
        status: 429,
      });
      expect(sealed(first)).toEqual(['SUPPORT_PATIENT_REGISTER_THROTTLED']);
      expect(sealedTenants(first)).toEqual([undefined]);

      const next = build({
        probe: {
          allowed: false,
          firstOverflow: false,
          exceeded: { scope: 'PERSON', window: 'MINUTE' },
        },
      });
      await expect(next.service.register(ADULT, ANA)).rejects.toMatchObject({
        status: 429,
      });
      expect(next.audit.record).not.toHaveBeenCalled();
    });

    it('un intento que acaba en excepción dentro de la transacción ya quedó contado', async () => {
      const d = build();
      d.patients.findDuplicateCandidates.mockRejectedValue(new Error('boom'));
      await expect(d.service.register(ADULT, ANA)).rejects.toThrow('boom');
      expect(d.probes.hit).toHaveBeenCalledTimes(1);
    });

    it('el 409 de documento ya registrado cuenta como un intento más', async () => {
      const d = build({ candidates: [candidate({ basis: ['DOCUMENT'] })] });
      await expect(
        d.service.register({ ...ADULT, acknowledgeDuplicates: true }, ANA),
      ).rejects.toMatchObject({ status: 409 });
      expect(d.probes.hit).toHaveBeenCalledTimes(1);
    });

    it('el rechazo por falta de permiso y la entrada inválida también cuentan', async () => {
      const denied = build({ actions: ['schedule.view'] });
      await expect(denied.service.register(ADULT, ANA)).rejects.toMatchObject({
        status: 403,
      });
      expect(denied.probes.hit).toHaveBeenCalledTimes(1);
      const invalid = build();
      await expect(
        invalid.service.register({ ...ADULT, birthDate: '1990-02-31' }, ANA),
      ).rejects.toMatchObject({ status: 400 });
      expect(invalid.probes.hit).toHaveBeenCalledTimes(1);
    });
  });

  describe('aislamiento por fila (RLS)', () => {
    const before = process.env.RLS_ENFORCE;
    afterEach(() => {
      if (before === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = before;
    });

    it('con RLS entra a la organización del cuerpo antes de leer vínculos y sellar', async () => {
      process.env.RLS_ENFORCE = 'true';
      const d = build();
      await d.service.register(ADULT, ANA);
      const calls = d.tx.execute.mock.calls.map(([sql, params]: any[]) => [
        sql,
        params,
      ]);
      expect(calls).toEqual(
        expect.arrayContaining([
          [expect.stringContaining('app.current_tenant_id'), [TENANT]],
        ]),
      );
      // Y deja el contexto como estaba al terminar.
      const last = calls[calls.length - 1];
      expect(last[0]).toContain('app.current_tenant_id');
    });

    it('sin RLS no toca el contexto', async () => {
      delete process.env.RLS_ENFORCE;
      const d = build();
      await d.service.register(ADULT, ANA);
      expect(d.tx.execute).not.toHaveBeenCalled();
    });
  });
});
