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

/**
 * Un concepto de `VS_BO_DEPARTMENT`, el que siembra `BoGeographySeedService`
 * para Santa Cruz. Va literal y no importado del seeder: la prueba comprueba
 * que el servicio pasa el uuid tal cual llega, no que sepa derivarlo.
 */
const DEPARTAMENTO_SANTA_CRUZ = '51fcbf8e-b4ea-5ba9-8aec-0df7be617c69';

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
    const specialtiesRepo = { create: fn() };
    // Da por buena cualquier especialidad: la validación de catálogo tiene su
    // propio spec; acá lo que se prueba es el flujo del alta.
    const specialtyCatalog = {
      assertIsMedicalSpecialty: fn().mockResolvedValue(undefined),
    };
    const accountLinksRepo = { create: fn() };
    const identifiersRepo = { create: fn() };
    const contactPointsRepo = { create: fn() };
    const addressesRepo = { create: fn() };
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
    const fileUploadService = {
      upload: fn().mockResolvedValue({ id: 'file-foto-123' }),
    };

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
      specialtiesRepo as never,
      specialtyCatalog as never,
      authorizationsRepo as never,
      professionalCredentialsRepo as never,
      languagesRepo as never,
      accountLinksRepo as never,
      identifiersRepo as never,
      contactPointsRepo as never,
      addressesRepo as never,
      tenantMembershipsRepo as never,
      effectiveRoles as never,
      notificationsService as never,
      logger as never,
      new TracingService(),
      fileUploadService as never,
    );
    return {
      service,
      effectiveRoles,
      specialtiesRepo,
      specialtyCatalog,
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
      fileUploadService,
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

  /**
   * Las especialidades EN el alta — registro del cliente, módulo Médico §1.4.2.
   *
   * Hasta acá el alta no las aceptaba: la pantalla decía «se elige después» y
   * la mayoría no volvía. Lo que estas pruebas fijan: que viajan en la misma
   * transacción, que la primera es la principal, que cada una pasa por el
   * catálogo (la FK acepta cualquier concepto; el value set decide), y que
   * repetir una no crea dos filas.
   */
  describe('las especialidades del alta', () => {
    it('crea una fila por especialidad, la primera como principal', async () => {
      const d = build();

      await d.service.registerPractitioner({
        ...dto,
        specialtyConceptIds: ['esp-cardio', 'esp-neuro'],
      });

      const filas = d.specialtiesRepo.create.mock.calls.map(
        (c: unknown[]) => c[1] as Record<string, unknown>,
      );
      expect(filas).toHaveLength(2);
      expect(filas[0]).toMatchObject({
        specialtyConceptId: 'esp-cardio',
        isPrimary: true,
      });
      expect(filas[1]).toMatchObject({
        specialtyConceptId: 'esp-neuro',
        isPrimary: false,
      });
    });

    it('cada concepto pasa por el catálogo: el formato uuid no alcanza', async () => {
      const d = build();

      await d.service.registerPractitioner({
        ...dto,
        specialtyConceptIds: ['esp-cardio'],
      });

      expect(d.specialtyCatalog.assertIsMedicalSpecialty).toHaveBeenCalledWith(
        expect.anything(),
        'esp-cardio',
      );
    });

    it('si el catálogo rechaza una, el alta entera no ocurre', async () => {
      // Misma transacción a propósito: una cuenta creada con una especialidad
      // inválida a medias sería peor que el rechazo completo.
      const d = build();
      d.specialtyCatalog.assertIsMedicalSpecialty.mockRejectedValue(
        new Error('no es una especialidad'),
      );

      await expect(
        d.service.registerPractitioner({
          ...dto,
          specialtyConceptIds: ['no-es-especialidad'],
        }),
      ).rejects.toThrow('no es una especialidad');
    });

    it('repetir una especialidad declara una, no dos', async () => {
      const d = build();

      await d.service.registerPractitioner({
        ...dto,
        specialtyConceptIds: ['esp-cardio', 'esp-cardio'],
      });

      expect(d.specialtiesRepo.create.mock.calls).toHaveLength(1);
    });

    it('sin especialidades el alta sigue igual que siempre', async () => {
      const d = build();

      await d.service.registerPractitioner(dto);

      expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
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

  it('persists the occupation concept on the person', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      occupationConceptId: '49e29a9b-2651-5ca1-b0db-6e6b528a3014',
    });

    expect(d.personsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        occupationConceptId: '49e29a9b-2651-5ca1-b0db-6e6b528a3014',
        occupationFreeText: undefined,
      }),
    );
  });

  it('persists free text occupation when no catalog concept is provided', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      occupationFreeText: 'Médico Investigador Independiente',
    });

    expect(d.personsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        occupationConceptId: undefined,
        occupationFreeText: 'Médico Investigador Independiente',
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

  it('guarda los cinco contactos del registro, cada uno con su sistema y su uso', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      personalEmail: 'ana.rojas@gmail.com',
      mobilePhone: '+591 70011111',
      workMobilePhone: '+591 70022222',
      workLandline: '+591 3 3456789',
    });

    const esperados = [
      // El correo de trabajo es además la identidad de login.
      [CONCEPTS.CONTACT_EMAIL, CONCEPTS.CONTACT_USE_WORK, dto.email],
      [
        CONCEPTS.CONTACT_EMAIL,
        CONCEPTS.CONTACT_USE_HOME,
        'ana.rojas@gmail.com',
      ],
      [CONCEPTS.CONTACT_MOBILE, CONCEPTS.CONTACT_USE_HOME, '+591 70011111'],
      [CONCEPTS.CONTACT_MOBILE, CONCEPTS.CONTACT_USE_WORK, '+591 70022222'],
      [CONCEPTS.CONTACT_PHONE, CONCEPTS.CONTACT_USE_WORK, '+591 3 3456789'],
    ] as const;

    for (const [systemConceptId, useConceptId, value] of esperados) {
      expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ systemConceptId, useConceptId, value }),
      );
    }
    expect(d.contactPointsRepo.create).toHaveBeenCalledTimes(esperados.length);
  });

  it('el celular personal y el de trabajo no se pisan entre sí', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      mobilePhone: '+591 70011111',
      workMobilePhone: '+591 70022222',
    });

    const celulares = d.contactPointsRepo.create.mock.calls
      .map(
        ([, fila]: [unknown, { systemConceptId: string; value: string }]) =>
          fila,
      )
      .filter(
        (fila: { systemConceptId: string }) =>
          fila.systemConceptId === CONCEPTS.CONTACT_MOBILE,
      );

    expect(celulares).toHaveLength(2);
    expect(
      new Set(celulares.map((fila: { value: string }) => fila.value)),
    ).toEqual(new Set(['+591 70011111', '+591 70022222']));
  });

  it('el teléfono de la forma anterior sigue cayendo donde el fijo de trabajo', async () => {
    const d = build();

    await d.service.registerPractitioner({ ...dto, phone: '+591 3 3456789' });

    expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        systemConceptId: CONCEPTS.CONTACT_PHONE,
        useConceptId: CONCEPTS.CONTACT_USE_WORK,
        value: '+591 3 3456789',
      }),
    );
  });

  it('cuando llegan el campo nuevo y el anterior, manda el nuevo', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      phone: '+591 3 1111111',
      workLandline: '+591 3 2222222',
    });

    const fijos = d.contactPointsRepo.create.mock.calls
      .map(
        ([, fila]: [unknown, { systemConceptId: string; value: string }]) =>
          fila,
      )
      .filter(
        (fila: { systemConceptId: string }) =>
          fila.systemConceptId === CONCEPTS.CONTACT_PHONE,
      );

    expect(fijos).toHaveLength(1);
    expect(fijos[0].value).toBe('+591 3 2222222');
  });

  it('ata el departamento emisor al identificador, no a la persona', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      nationalId: '4821993',
      issuerAdministrativeAreaConceptId: DEPARTAMENTO_SANTA_CRUZ,
    });

    expect(d.identifiersRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        value: '4821993',
        issuerAdministrativeAreaConceptId: DEPARTAMENTO_SANTA_CRUZ,
      }),
    );
  });

  it('guarda la fecha de inscripción como validez de la matrícula', async () => {
    const d = build();

    await d.service.registerPractitioner({
      ...dto,
      licenseIssueDate: '2019-03-14',
    });

    expect(d.authorizationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        validFrom: new Date('2019-03-14'),
        // La fecha no adelanta la verificación: sigue PENDIENTE.
        stateConceptId: PROF.AUTH_PENDING,
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

  describe('foto de perfil durante el registro', () => {
    // Cabecera JPEG válida para que sniffMimeType la reconozca como IMAGE
    const FOTO_JPEG_B64 =
      'data:image/jpeg;base64,' +
      Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
      ]).toString('base64');

    it('procesa y vincula la foto de perfil en base64 cuando se envía', async () => {
      const d = build();

      const result = await d.service.registerPractitioner({
        ...dto,
        profilePhotoBase64: FOTO_JPEG_B64,
      });

      expect(d.fileUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          mimetype: 'image/jpeg',
        }),
        {
          category: 'IMAGE',
          sensitivity: 'NORMAL',
        },
        expect.objectContaining({
          id: 'user-1',
          roles: ['PRACTITIONER'],
        }),
      );

      expect(d.personsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          photoFileId: 'file-foto-123',
        }),
      );

      expect(d.practitionersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          photoFileId: 'file-foto-123',
        }),
      );

      expect(result.photoFileId).toBe('file-foto-123');
    });

    it('omite la subida y el identificador de foto cuando no se envía foto', async () => {
      const d = build();

      const result = await d.service.registerPractitioner(dto);

      expect(d.fileUploadService.upload).not.toHaveBeenCalled();
      expect(d.personsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          photoFileId: undefined,
        }),
      );
      expect(d.practitionersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          photoFileId: undefined,
        }),
      );
      expect(result.photoFileId).toBeUndefined();
    });

    it('si el servicio de subida falla, el registro concluye sin bloquear', async () => {
      const d = build();
      d.fileUploadService.upload.mockRejectedValue(new Error('storage full'));

      const result = await d.service.registerPractitioner({
        ...dto,
        profilePhotoBase64: FOTO_JPEG_B64,
      });

      expect(result.userId).toBe('user-1');
      expect(result.photoFileId).toBeUndefined();
      expect(d.personsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          photoFileId: undefined,
        }),
      );
    });
  });
});
