import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';
import { IamPractitionerSelfRegistrationService } from './iam-practitioner-self-registration.service';
import { TracingService } from '../../../observability';
import { CONCEPTS, ConflictException, SEED } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { DIR } from '../../directory/directory.concepts';
import type { RegisterPractitionerDto } from '../dto';

const dto: RegisterPractitionerDto = {
  email: 'dra.rojas@sanrafael.bo',
  password: 'password123',
  name: 'Ana',
  middleName: 'Lucía',
  lastName: 'Rojas',
  motherLastName: 'Paz',
  licenseNumber: 'MP-45821',
  credentialNumber: 'TIT-99310',
};

describe('IamPractitionerSelfRegistrationService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = { flush: fn().mockResolvedValue(undefined) };
    const em = {
      transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    const tokenService = {
      issueRefreshToken: fn(() => ({ raw: 'raw-token', hash: 'hashed' })),
    };
    const usersRepo = { create: fn(() => ({ id: 'user-1' })) };
    const credentialsRepo = {
      findLivePasswordBySubject: fn().mockResolvedValue(null),
      createPassword: fn(),
      // El alta administrativa reserva el login sin secreto: la contraseña la
      // fija el titular al consumir el token de activación.
      createPendingPassword: fn(),
    };
    const rolesRepo = { create: fn() };
    const emailVerificationsRepo = { create: fn() };
    const eventsRepo = { record: fn() };
    const personsRepo = { create: fn(() => ({ id: 'person-1' })) };
    const personProfilesRepo = { create: fn() };
    const practitionersRepo = {
      findByCode: fn().mockResolvedValue(null),
      create: fn((_tx: unknown, data: { practitionerCode: string }) => ({
        profileId: 'person-1',
        practitionerCode: data.practitionerCode,
      })),
    };
    const authorizationsRepo = { create: fn(() => ({ id: 'license-1' })) };
    const professionalCredentialsRepo = {
      create: fn(() => ({ id: 'cred-1' })),
    };
    const languagesRepo = { create: fn() };
    const accountLinksRepo = { create: fn() };
    const identifiersRepo = { create: fn() };
    const contactPointsRepo = { create: fn() };
    const tenantMembershipsRepo = { create: fn() };
    const notificationsService = {
      createRequest: fn().mockResolvedValue({ id: 'notif-1' }),
    };
    // Por defecto concede: el caso interesante es el alta administrativa que sí
    // pide roles; el autorregistro nunca llega a llamarlo.
    const effectiveRoles = { ensureRoleByCode: fn().mockResolvedValue(true) };

    // El repositorio de activaciones sólo se usa en el alta administrativa: en
    // el autorregistro la cuenta nace activa y no hay token que emitir.
    const activationsRepo = { create: fn() };

    const service = new IamPractitionerSelfRegistrationService(
      em as never,
      tokenService as never,
      activationsRepo as never,
      usersRepo as never,
      credentialsRepo as never,
      rolesRepo as never,
      emailVerificationsRepo as never,
      eventsRepo as never,
      personsRepo as never,
      personProfilesRepo as never,
      practitionersRepo as never,
      authorizationsRepo as never,
      professionalCredentialsRepo as never,
      languagesRepo as never,
      accountLinksRepo as never,
      identifiersRepo as never,
      contactPointsRepo as never,
      tenantMembershipsRepo as never,
      effectiveRoles as never,
      notificationsService as never,
      logger as never,
      new TracingService(),
    );
    return {
      service,
      effectiveRoles,
      tx,
      usersRepo,
      credentialsRepo,
      rolesRepo,
      personsRepo,
      practitionersRepo,
      authorizationsRepo,
      professionalCredentialsRepo,
      accountLinksRepo,
      identifiersRepo,
      contactPointsRepo,
      tenantMembershipsRepo,
      notificationsService,
      activationsRepo,
    };
  }

  /**
   * P6: el alta administrativa. Comparte el registro CTI atómico con el
   * autorregistro —es la misma alta— y se diferencia sólo en quién está
   * delante: la cuenta nace PENDIENTE con un token en vez de ACTIVA con
   * contraseña, porque un administrador no puede elegir la clave de otro.
   */
  /**
   * Sin el rol, el claim `roles` del token sólo trae `USER` y el profesional
   * recibe 403 en su propia agenda: `GET /scheduling/resources` exige
   * `PRACTITIONER`. Es el mismo agujero que tuvo `PATIENT`.
   */
  it('concede PRACTITIONER: sin él su agenda le responde 403', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    const concedidos = d.rolesRepo.create.mock.calls.map(
      (c: unknown[]) => (c[1] as { roleConceptId: string }).roleConceptId,
    );
    expect(concedidos).toContain(ROLE_CONCEPT_BY_CODE.PRACTITIONER);
    expect(concedidos).toContain(ROLE_CONCEPT_BY_CODE.USER);
  });

  /**
   * `CLINICIAN` abre el expediente de un paciente, que es PHI. La matrícula
   * nace `PENDING`: declararla no es probarla, así que ese rol lo concede un
   * administrador y no el propio registro.
   */
  it('NO concede CLINICIAN: eso abre PHI y lo decide un administrador', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    const concedidos = d.rolesRepo.create.mock.calls.map(
      (c: unknown[]) => (c[1] as { roleConceptId: string }).roleConceptId,
    );
    expect(concedidos).not.toContain(ROLE_CONCEPT_BY_CODE.CLINICIAN);
  });

  describe('assistedRegisterPractitioner (P6)', () => {
    const admin = { id: 'admin-1' } as never;
    const dtoAsistido = { ...dto, reason: 'Alta de plantel' } as never;

    it('no crea contraseña: reserva el login y emite un token de activación', async () => {
      const d = build();

      const res = await d.service.assistedRegisterPractitioner(
        dtoAsistido,
        admin,
      );

      expect(d.credentialsRepo.createPassword).not.toHaveBeenCalled();
      expect(d.credentialsRepo.createPendingPassword).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ externalSubject: dto.email }),
      );
      expect(res.activationToken).toBeDefined();
      expect(res.activationExpiresAt).toBeInstanceOf(Date);
    });

    it('guarda el motivo del alta: es la trazabilidad C-18', async () => {
      const d = build();

      await d.service.assistedRegisterPractitioner(dtoAsistido, admin);

      expect(d.activationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          reason: 'Alta de plantel',
          actorUserId: 'admin-1',
        }),
      );
    });

    /** Registrar a alguien no lo habilita a ejercer, lo cargue quien lo cargue. */
    it('la matrícula sigue naciendo PENDIENTE', async () => {
      const d = build();

      const res = await d.service.assistedRegisterPractitioner(
        dtoAsistido,
        admin,
      );

      expect(res.verificationStatus).toBe('PENDING');
    });

    it('el autorregistro no emite token de activación', async () => {
      const d = build();

      await d.service.registerPractitioner(dto);

      expect(d.activationsRepo.create).not.toHaveBeenCalled();
      expect(d.credentialsRepo.createPassword).toHaveBeenCalled();
    });
  });

  it('creates the account, the person and the practitioner profile in one call', async () => {
    const d = build();

    const result = await d.service.registerPractitioner(dto);

    expect(result).toMatchObject({
      userId: 'user-1',
      personId: 'person-1',
      practitionerProfileId: 'person-1',
      licenseId: 'license-1',
      verificationStatus: 'PENDING',
      emailVerificationSent: true,
    });
    expect(result.practitionerCode).toMatch(/^PRC-/);
  });

  it('uses the email as the login subject', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    expect(d.credentialsRepo.createPassword).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ externalSubject: dto.email }),
    );
  });

  it('leaves licence, credential and profile PENDING: registering is not being licensed', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    // Si esto se relajara, cualquiera podría figurar como profesional habilitado
    // rellenando un formulario. Verificar la matrícula es un acto de la plataforma.
    expect(d.practitionersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        acceptsNewPatients: false,
      }),
    );
    expect(d.authorizationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ stateConceptId: PROF.AUTH_PENDING }),
    );
    expect(d.professionalCredentialsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ stateConceptId: PROF.CRED_PENDING }),
    );
  });

  it('gives the account a tenant membership so it is usable beyond login', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    // Sin esta fila, TenantContextInterceptor responde 403 a todo request
    // posterior y la cuenta recién creada queda inservible.
    expect(d.tenantMembershipsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        userId: 'user-1',
        tenantId: SEED.tenantId,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      }),
    );
  });

  it('persists the name in parts and composes the display name once', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    // La persona guarda las piezas; el compuesto se deriva de ellas.
    expect(d.personsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        name: 'Ana',
        middleName: 'Lucía',
        lastName: 'Rojas',
        motherLastName: 'Paz',
        displayName: 'Ana Lucía Rojas Paz',
      }),
    );
    // La cuenta vive en otro esquema: si no recibiera el mismo valor, las dos
    // filas podrían divergir.
    expect(d.usersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ displayName: 'Ana Lucía Rojas Paz' }),
    );
  });

  it('keeps honouring displayName for clients that still send it', async () => {
    const d = build();

    await d.service.registerPractitioner({
      email: dto.email,
      password: dto.password,
      licenseNumber: dto.licenseNumber,
      credentialNumber: dto.credentialNumber,
      displayName: 'Dra. Ana Rojas',
    });

    // Quien mandó la forma anterior tiene que ver exactamente lo que mandó.
    expect(d.usersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ displayName: 'Dra. Ana Rojas' }),
    );
    expect(d.personsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        displayName: 'Dra. Ana Rojas',
        name: undefined,
        lastName: undefined,
      }),
    );
  });

  it('translates the gender and birth-sex codes into terminology concepts', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      gender: 'FEMALE',
      sexAtBirth: 'FEMALE',
      birthDate: '1985-04-12',
    });

    expect(d.personsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        administrativeGenderConceptId: PROF.GENDER_FEMALE,
        sexAtBirthConceptId: PROF.BIRTH_SEX_FEMALE,
        birthDate: new Date('1985-04-12'),
      }),
    );
  });

  it('stores the phone as a contact point and the document as an identifier', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      phone: '+591 70012345',
      nationalId: '4821993',
    });

    expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        systemConceptId: CONCEPTS.CONTACT_PHONE,
        value: '+591 70012345',
      }),
    );
    expect(d.identifiersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        value: '4821993',
      }),
    );
  });

  it('omits the identifier when no document is supplied', async () => {
    const d = build();

    await d.service.registerPractitioner(dto);

    expect(d.identifiersRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an email that already has a live credential', async () => {
    const d = build();
    d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue({
      id: 'cred-existing',
    });

    await expect(d.service.registerPractitioner(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(d.usersRepo.create).not.toHaveBeenCalled();
  });

  it('registers the practitioner even if the verification email cannot be queued', async () => {
    const d = build();
    d.notificationsService.createRequest.mockRejectedValue(
      new Error('messaging down'),
    );

    const result = await d.service.registerPractitioner(dto);

    // El correo se encola fuera de la transacción justamente para esto: un fallo
    // de mensajería no puede deshacer un alta que ya es válida.
    expect(result.userId).toBe('user-1');
    expect(result.emailVerificationSent).toBe(false);
  });
});
