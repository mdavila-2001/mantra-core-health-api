import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AttachableFileService } from '../../common/services';
import { AdministrativeAreaCatalogService } from './administrative-area-catalog.service';
import {
  requiereCriterioDeBusqueda,
  resolvePatientSearchScope,
} from './patient-search-scope';
import { findCurrentIdentityAssertionForPerson } from '../../identity_assurance/repositories/identity-assertions.repository';
import {
  AddressesRepository,
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import {
  createResidenceAddress,
  createWorkAddress,
} from '../../common/services/residence-address';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import {
  BIRTH_SEX_CODE_BY_CONCEPT,
  BIRTH_SEX_CONCEPT_BY_CODE,
  PROF,
} from '../profiles.concepts';
import { composePersonDisplayName } from '../person-name';
import type { Persons, PatientProfiles } from '../entities';
import {
  PersonsRepository,
  PersonProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PatientIdentityLinksRepository,
  PatientMergeEventsRepository,
  RelatedPersonsRepository,
  PatientPortalProxiesRepository,
} from '../repositories';
import {
  CreatePatientDto,
  PatientProfileResponseDto,
  LinkAccountDto,
  AccountLinkResponseDto,
  AddIdentityLinkDto,
  IdentityLinkResponseDto,
  MergePatientsDto,
  ReverseMergeDto,
  MergeEventResponseDto,
  ListMergeEventsQueryDto,
  ListMergeEventsResponseDto,
  MERGE_EVENTS_DEFAULT_LIMIT,
  AddRelatedPersonDto,
  RelatedPersonResponseDto,
  GrantPortalProxyDto,
  PortalProxyResponseDto,
  DeceasePersonDto,
  DeceaseResponseDto,
  PatientSummaryResponseDto,
  SearchPatientsResponseDto,
  PatientDetailResponseDto,
  OwnPatientProfileResponseDto,
  OwnAddressDto,
  OwnCoverageDto,
  OwnGuardianDto,
  UpdateOwnPatientProfileDto,
  SetOwnPatientPhotoDto,
} from '../dto';
import { Addresses, Identifiers } from '../../common/entities';
import { INS } from '../../insurance/insurance.concepts';
import { createDeclaredCoverage } from '../../insurance/services/declared-coverage';
import {
  CatalogRepository,
  CoverageRepository,
} from '../../insurance/repositories';
import { createGuardianRelatedPerson } from './guardian-related-person';
// `isPublic` no es columna: el modelo todavía no persiste el tipo de pagador
// (deuda declarada en el alta, PR #258), así que se deriva del catálogo
// sembrado — mismo criterio que usa el propio alta al aceptarlos.
import {
  isPublicCarrierId,
  type InsuranceSector,
} from '../../../common/seed/bolivia-insurance.catalog';
import { ProfileOwnershipService } from './profile-ownership.service';
import {
  textoOpcional,
  aplicarOcupacion,
  aplicarEmpresa,
} from '../person-work-fields';

/**
 * Deja fuera de la respuesta los campos sin valor.
 *
 * El contrato de las lecturas propias dice que lo opcional viaja **ausente, no
 * `null`**, y hace falta traducir: el ORM hidrata una columna `NULL` como `null`,
 * así que devolver la entidad tal cual pondría un `null` donde el contrato
 * promete que no hay nada. La distinción importa: `null` se lee como «este dato
 * está vacío» y la ausencia como «esta persona no lo declaró», y un formulario
 * que los confunde pinta un campo borrado donde nunca hubo uno.
 *
 * @param respuesta - La respuesta armada, con sus huecos.
 * @returns La misma respuesta sin las claves nulas ni indefinidas.
 */
function sinCamposAusentes<T extends object>(respuesta: T): T {
  return Object.fromEntries(
    Object.entries(respuesta).filter(
      ([, valor]) => valor !== null && valor !== undefined,
    ),
  ) as T;
}

/**
 * Una columna `numeric` mapeada como string, de vuelta a número.
 *
 * `common.addresses.latitude`/`longitude` viajan como texto en la entidad
 * —ver {@link createResidenceAddress}— y el DTO del `PATCH` los recibe como
 * número. Comparar «lo que ya había» contra «lo que llegó» exige que los dos
 * lados hablen el mismo tipo.
 *
 * @param valor - El texto de la columna, o `undefined` si no hay fila vigente.
 * @returns El número, o `undefined`.
 */
function numeroDeColumna(valor: string | undefined): number | undefined {
  return valor === undefined ? undefined : Number(valor);
}

/** Las cuatro partes del nombre, que son las que recomponen `display_name`. */
const PARTES_DEL_NOMBRE = [
  'name',
  'middleName',
  'lastName',
  'motherLastName',
] as const satisfies readonly (keyof UpdateOwnPatientProfileDto)[];

/**
 * Los campos del cuerpo que se escriben en `profiles.persons`.
 *
 * Las partes del nombre salen de {@link PARTES_DEL_NOMBRE} en vez de repetirse:
 * dos listas de campos acaban divergiendo, y la que se olvide de una hará que
 * editar ese campo no marque la fila como modificada —o al revés—.
 *
 * El teléfono y el domicilio quedan **fuera** a propósito: no viven en esta
 * tabla, y sus filas llevan su propia auditoría al crearse o cerrarse.
 */
const CAMPOS_DE_LA_PERSONA = [
  ...PARTES_DEL_NOMBRE,
  'birthDate',
  'sexAtBirth',
  'occupationConceptId',
  'occupationFreeText',
  'workEmployerConceptId',
  'workEmployerFreeText',
] as const satisfies readonly (keyof UpdateOwnPatientProfileDto)[];

/**
 * Si el cuerpo declara alguno de los campos indicados.
 *
 * Se pregunta por la **presencia** del campo y no por si el valor cambió: un
 * `PATCH` que reenvía el mismo apellido sigue siendo una declaración de cómo se
 * llama la persona.
 *
 * @param dto - Los campos que llegaron en el cuerpo.
 * @param campos - Los campos por los que se pregunta.
 * @returns `true` si el cuerpo trae al menos uno.
 */
function declaraAlguno(
  dto: UpdateOwnPatientProfileDto,
  campos: readonly (keyof UpdateOwnPatientProfileDto)[],
): boolean {
  return campos.some((campo) => dto[campo] !== undefined);
}

/**
 * Si la edición toca alguna de las cuatro partes del nombre.
 *
 * Decide si hay que recomponer el nombre visible.
 *
 * @param dto - Los campos que llegaron en el cuerpo.
 * @returns `true` si el cuerpo declara alguna parte del nombre.
 */
function cambiaAlgunaParteDelNombre(dto: UpdateOwnPatientProfileDto): boolean {
  return declaraAlguno(dto, PARTES_DEL_NOMBRE);
}

/**
 * Si la edición escribe algo en `profiles.persons`.
 *
 * Decide si la fila de la persona se marca como modificada. Un `PATCH` que no
 * trae ninguno de estos campos —el cuerpo vacío, o uno que sólo cambia el
 * teléfono o el domicilio— **no la toca**: mover `updated_at`,
 * `updated_by_user_id` y `row_version` sin haber cambiado ni una columna
 * convierte la auditoría en ruido y hace fallar por conflicto de versión a
 * quien tuviera la fila leída.
 *
 * @param dto - Los campos que llegaron en el cuerpo.
 * @returns `true` si el cuerpo declara algún campo de la persona.
 */
function cambiaLaPersona(dto: UpdateOwnPatientProfileDto): boolean {
  return declaraAlguno(dto, CAMPOS_DE_LA_PERSONA);
}

/**
 * Casos de uso del ciclo de vida de personas y pacientes: alta (UC-05-01),
 * vinculación de cuenta de portal (UC-05-02), vínculos de identidad MPI
 * (UC-05-07), fusión y reversión (UC-05-08/09), personas relacionadas (UC-05-10),
 * proxies de portal (UC-05-11) y defunción/anonimización (UC-05-12).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, porque las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
/**
 * Una fila de `common.addresses` como la ve el perfil.
 *
 * Devuelve `undefined` —y no un objeto vacío— cuando no hay dirección: la
 * pantalla distingue «no la declaró» de «la declaró sin datos», y un objeto con
 * todo ausente pintaría una tarjeta vacía.
 */
function aDireccion(fila?: Addresses | null): OwnAddressDto | undefined {
  if (!fila) return undefined;
  return {
    ...(fila.lines === undefined ? {} : { lines: fila.lines }),
    ...(fila.city === undefined ? {} : { city: fila.city }),
    ...(fila.municipalityConceptId === undefined
      ? {}
      : { municipalityConceptId: fila.municipalityConceptId }),
    // Las coordenadas viajan juntas o no viajan: media coordenada no ubica nada.
    //
    // Se compara con `== null` y no con `=== undefined`: la columna es nullable y
    // la base devuelve **null**, que no es `undefined`. Con la comparación
    // estricta el ternario tomaba la rama de «sí hay coordenadas» y emitía
    // `Number(null)` — que es **0**. Una dirección sin ubicar salía en el mapa
    // en el golfo de Guinea. Se vio con una dirección de trabajo cargada sin GPS.
    ...(fila.latitude == null || fila.longitude == null
      ? {}
      : { latitude: Number(fila.latitude), longitude: Number(fila.longitude) }),
  };
}

@Injectable()
export class ProfilesPatientsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personsRepo - Valor de persons repo requerido por la operación.
   * @param personProfilesRepo - Valor de person profiles repo requerido por la operación.
   * @param patientProfilesRepo - Valor de patient profiles repo requerido por la operación.
   * @param accountLinksRepo - Valor de account links repo requerido por la operación.
   * @param identityLinksRepo - Valor de identity links repo requerido por la operación.
   * @param mergeEventsRepo - Valor de merge events repo requerido por la operación.
   * @param relatedPersonsRepo - Valor de related persons repo requerido por la operación.
   * @param portalProxiesRepo - Valor de portal proxies repo requerido por la operación.
   * @param contactPointsRepo - Teléfono del paciente (`common.contact_points`).
   * @param addressesRepo - Domicilio del paciente (`common.addresses`).
   * @param attachableFiles - La regla compartida de qué archivo se puede referenciar.
   * @param insuranceCatalogRepo - Catálogo de planes de salud (`insurance.insurance_plans`).
   * @param coverageRepo - Coberturas declaradas (`insurance.patient_coverages`).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly identityLinksRepo: PatientIdentityLinksRepository,
    private readonly mergeEventsRepo: PatientMergeEventsRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
    private readonly portalProxiesRepo: PatientPortalProxiesRepository,
    // El teléfono y el domicilio del paciente no viven en `profiles`: son un
    // punto de contacto y una dirección de `common`, y el módulo ya los exporta
    // para que quien da de alta a la persona los escriba en su transacción.
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly ownership: ProfileOwnershipService,
    private readonly attachableFiles: AttachableFileService,
    // Quién decide si un uuid es un departamento boliviano. La FK acepta
    // cualquier concepto del catálogo, así que la regla es de dominio.
    private readonly administrativeAreas: AdministrativeAreaCatalogService,
    // El seguro declarado por autoservicio (PATCH) usa los mismos dos
    // repositorios que ya usa el alta: catálogo de planes y coberturas.
    private readonly insuranceCatalogRepo: CatalogRepository,
    private readonly coverageRepo: CoverageRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProfilesPatientsService.name);
  }

  /** UC-05-01: alta de persona + perfil de paciente en una sola transacción. */
  async registerPatient(
    dto: CreatePatientDto,
    actor: AuthenticatedUser,
  ): Promise<PatientProfileResponseDto> {
    this.logger.info(
      { operation: 'profiles.patient.create', actorId: actor.id },
      'Registering patient',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.patientProfilesRepo.findByPatientCode(
        tx,
        dto.patientCode,
      );
      if (clash) {
        this.logger.warn(
          {
            operation: 'profiles.patient.create',
            reason: 'patient-code-in-use',
          },
          'Rejected patient creation: patient_code already exists',
        );
        throw new ConflictException('El patient_code ya está en uso', {
          patientCode: dto.patientCode,
        });
      }

      const person = this.personsRepo.create(tx, {
        personStatusConceptId: PROF.PERSON_ACTIVE,
        vitalStatusConceptId: PROF.VITAL_ALIVE,
        displayName: dto.displayName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        administrativeGenderConceptId: dto.administrativeGenderConceptId,
        sexAtBirthConceptId: dto.sexAtBirthConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      // person_profiles clasifica a la persona (uq_person_profiles_person_type),
      // pero NO es el destino de la FK del subtipo: patient_profiles.profile_id
      // referencia profiles.persons(id), así que el perfil de paciente usa person.id.
      this.personProfilesRepo.create(tx, {
        personId: person.id,
        profileTypeConceptId: PROF.PROFILE_TYPE_PATIENT,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      const patient = this.patientProfilesRepo.create(tx, {
        profileId: person.id,
        patientCode: dto.patientCode,
        masterPatientIndexCode: dto.masterPatientIndexCode,
        recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.patient.create', profileId: patient.profileId },
        'Patient registered',
      );
      return {
        profileId: patient.profileId,
        personId: person.id,
        patientCode: patient.patientCode,
        recordLinkageStatus: patient.recordLinkageStatusConceptId!,
        createdAt: patient.createdAt,
      };
    });
  }

  /**
   * Resumen del propio paciente, verificada su identidad o no.
   *
   * Verificarse es un trámite posterior e independiente del alta, así que el
   * titular ve desde el primer día lo que él mismo declaró al registrarse. Lo
   * único que la verificación habilita es el **código de paciente**: mientras no
   * haya aserción vigente, `patientCode` no viaja —ausente, no `null`— y
   * `identityVerified` dice por qué. Es el servidor quien decide qué ve cada
   * sesión; el cliente no oculta campos por su cuenta.
   *
   * No es la ficha médica: es filiación, nunca dato clínico.
   *
   * @param actor - Usuario autenticado.
   * @returns Datos básicos del paciente.
   * @throws PreconditionFailedException si la cuenta no tiene persona vinculada.
   * @throws ResourceNotFoundException si la persona no tiene perfil de paciente.
   */
  async getOwnSummary(
    actor: AuthenticatedUser,
  ): Promise<PatientSummaryResponseDto> {
    const em = this.em.fork();
    const { person, patient } = await this.resolveOwnPatient(em, actor);

    const identityVerified = Boolean(
      await findCurrentIdentityAssertionForPerson(em, person.id),
    );

    return {
      personId: person.id,
      patientProfileId: patient.profileId,
      identityVerified,
      displayName: person.displayName,
      birthDate: person.birthDate,
      personStatus: person.personStatusConceptId,
      // Ausente mientras no esté verificado: quien no puede verlo tampoco tiene
      // que distinguir «no lo tiene» de «todavía no puede verlo».
      ...(identityVerified ? { patientCode: patient.patientCode } : {}),
    };
  }

  /**
   * El propio perfil del paciente, con las partes del nombre y el contacto.
   *
   * Es la lectura que sostiene la pantalla de «mis datos»: {@link getOwnSummary}
   * devuelve el nombre ya compuesto, y con eso un formulario no puede corregir un
   * apellido —no hay forma de saber dónde termina uno y empieza el otro—. Acá
   * viajan las cuatro partes, la fecha de nacimiento, el sexo al nacer como
   * código, el teléfono vigente y el municipio del domicilio vigente: exactamente
   * el conjunto que la persona declaró al registrarse y el mismo que puede
   * editar con `PATCH`.
   *
   * No trae nada clínico ni de terceros: es filiación propia.
   *
   * @param actor - Usuario autenticado, que es también el sujeto.
   * @returns El perfil propio, con los campos no declarados ausentes.
   * @throws PreconditionFailedException si la cuenta no tiene persona vinculada.
   * @throws ResourceNotFoundException si la persona no tiene perfil de paciente.
   */
  async getOwnProfile(
    actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    const em = this.em.fork();
    const { person, patient } = await this.resolveOwnPatient(em, actor);

    // Las tres lecturas son independientes entre sí y ninguna depende del
    // resultado de otra: encadenarlas sólo sumaría latencia.
    // Todas son independientes entre sí: se piden juntas porque encadenarlas
    // sólo sumaría latencia a una pantalla que se abre en cada visita.
    const [
      assertion,
      telefono,
      domicilio,
      trabajo,
      correo,
      identificadores,
      coberturas,
      tutores,
    ] = await Promise.all([
      findCurrentIdentityAssertionForPerson(em, person.id),
      this.contactPointsRepo.findVigenteByOwnerAndSystem(
        em,
        person.id,
        CONCEPTS.CONTACT_PHONE,
      ),
      this.addressesRepo.findVigenteByOwnerAndUse(
        em,
        person.id,
        CONCEPTS.ADDR_USE_HOME,
      ),
      this.addressesRepo.findVigenteByOwnerAndUse(
        em,
        person.id,
        CONCEPTS.ADDR_USE_WORK,
      ),
      this.contactPointsRepo.findVigenteByOwnerAndSystem(
        em,
        person.id,
        CONCEPTS.CONTACT_EMAIL,
      ),
      this.leerIdentificadores(em, person.id),
      this.leerCoberturas(em, patient.profileId),
      this.leerTutores(em, patient.profileId),
    ]);
    const identityVerified = Boolean(assertion);

    return sinCamposAusentes({
      personId: person.id,
      patientProfileId: patient.profileId,
      name: person.name,
      middleName: person.middleName,
      lastName: person.lastName,
      motherLastName: person.motherLastName,
      displayName: person.displayName,
      birthDate: person.birthDate,
      // El camino inverso del alta: la columna guarda el concepto y el
      // formulario habla en códigos. Un concepto que no esté en el mapa —una
      // fila anterior a este catálogo— llega ausente en vez de como un uuid
      // suelto que el cliente no sabría interpretar.
      sexAtBirth: person.sexAtBirthConceptId
        ? BIRTH_SEX_CODE_BY_CONCEPT[person.sexAtBirthConceptId]
        : undefined,
      // Las dos formas de declarar la ocupación viajan juntas y sólo una tiene
      // valor: el formulario no puede pintar el desplegable con el texto libre,
      // y quien eligió del catálogo veía su ocupación vacía mientras acá sólo
      // salía el texto.
      occupationConceptId: person.occupationConceptId,
      occupationFreeText: person.occupationFreeText,
      // Mismo criterio que la ocupación, para la empresa.
      workEmployerConceptId: person.workEmployerConceptId,
      workEmployerFreeText: person.workEmployerFreeText,
      phone: telefono?.value,
      photoFileId: person.photoFileId,
      residenceMunicipalityConceptId: domicilio?.municipalityConceptId,
      identityVerified,
      // Mismo criterio que el resumen: ausente mientras no esté verificado.
      ...(identityVerified ? { patientCode: patient.patientCode } : {}),
      nationalId: identificadores.nationalId,
      issuerAdministrativeAreaConceptId: identificadores.issuerArea,
      taxId: identificadores.taxId,
      taxHolderName: identificadores.taxHolderName,
      email: correo?.value,
      homeAddress: aDireccion(domicilio),
      workAddress: aDireccion(trabajo),
      // Listas siempre presentes, aunque vengan vacías: quien las pinta
      // distingue «no declaró ninguna» de «esta respuesta no las trae».
      coverages: coberturas,
      guardians: tutores,
    });
  }

  /**
   * Edita los datos que el paciente dio al registrarse.
   *
   * ## El hueco que cierra
   *
   * El auto-registro escribía la filiación una sola vez y nadie podía volver a
   * tocarla. Un apellido mal tipeado, un teléfono que cambió o una mudanza
   * quedaban así para siempre, salvo que alguien escribiera en la base. El
   * titular es quien mejor conoce estos datos y era el único que no podía
   * corregirlos.
   *
   * ## Qué se toca y qué no
   *
   * El sujeto sale de la sesión —vía `person_account_links`, nunca de un claim
   * del token—, así que no hay forma de editar el de otro. Y lo editable es lo
   * que la persona **declara** sobre sí misma: nombre, nacimiento, sexo al
   * nacer, ocupación, teléfono y municipio. El documento de identidad, el correo,
   * la contraseña, el código de paciente y los estados quedan fuera: tienen su
   * propio circuito, y moverlos por autoservicio convertiría el perfil en una
   * declaración jurada de uno mismo.
   *
   * `PATCH`: lo que no viene no se toca. Un cuerpo vacío es válido y devuelve el
   * perfil sin cambios.
   *
   * ## Por qué el teléfono y el domicilio no se pisan
   *
   * Porque son historia. Por el número anterior se llamó a esta persona y en la
   * dirección anterior vivía: sobrescribir la fila dejaría al sistema afirmando
   * que nunca existieron. Se les pone fin de vigencia y se crea la nueva, que es
   * lo que ya hacen el resto de los datos con vigencia del modelo.
   *
   * @param dto - Los campos a cambiar.
   * @param actor - La sesión, que es también el sujeto.
   * @returns El perfil completo releído, ya actualizado.
   * @throws PreconditionFailedException si la cuenta no tiene persona vinculada.
   * @throws ResourceNotFoundException si la persona no tiene perfil de paciente.
   */
  async updateOwnProfile(
    dto: UpdateOwnPatientProfileDto,
    actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    this.logger.info(
      { operation: 'profiles.patient.updateOwn', actorId: actor.id },
      'Updating own patient profile',
    );

    await this.em.transactional(async (tx) => {
      // `patient.profileId` hace falta para el tutor y el seguro declarado,
      // que cuelgan del PERFIL de paciente, no de la persona.
      const { person, patient } = await this.resolveOwnPatient(tx, actor);
      const ahora = new Date();

      // Campo por campo y con `!== undefined`: un `??` trataría `''` como «no
      // vino», y el segundo nombre o el apellido materno son justamente los
      // campos que alguien vacía cuando descubre que no tiene.
      //
      // `name` y `lastName` se asignan tal cual: el DTO les exige `@MinLength(1)`,
      // así que no se pueden vaciar por acá. Los otros dos sí, y por eso pasan
      // por {@link textoOpcional}, que traduce el blanco a `NULL`.
      if (dto.name !== undefined) person.name = dto.name;
      if (dto.middleName !== undefined) {
        person.middleName = textoOpcional(dto.middleName);
      }
      if (dto.lastName !== undefined) person.lastName = dto.lastName;
      if (dto.motherLastName !== undefined) {
        person.motherLastName = textoOpcional(dto.motherLastName);
      }
      if (cambiaAlgunaParteDelNombre(dto)) {
        this.recomponerDisplayName(person);
      }

      if (dto.birthDate !== undefined) {
        // `new Date(null)` es el 1/1/1970, no «sin fecha»: mandar `null` para
        // borrarla dejaba a la persona nacida en la época Unix. Es el mismo
        // defecto que se corrigió en el perfil del profesional; vivía también acá.
        person.birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
      }
      if (dto.sexAtBirth !== undefined) {
        // El mismo mapeo del alta: el formulario manda un código y la columna
        // guarda el concepto.
        person.sexAtBirthConceptId = BIRTH_SEX_CONCEPT_BY_CODE[dto.sexAtBirth];
      }
      // Las dos columnas de la ocupación se deciden juntas: ver
      // {@link aplicarOcupacion}, porque cuál gana depende de la otra.
      aplicarOcupacion(person, dto);
      // Misma regla, para la empresa: ver {@link aplicarEmpresa}.
      aplicarEmpresa(person, dto);
      // Sólo si de verdad se escribió algo en la fila: ver {@link cambiaLaPersona}.
      if (cambiaLaPersona(dto)) {
        touch(person, actor.id);
      }

      if (dto.phone !== undefined) {
        await this.reemplazarTelefono(
          tx,
          person.id,
          dto.phone,
          actor.id,
          ahora,
        );
      }

      // El NIT y las dos direcciones: se declaraban al registrarse y después no
      // había forma de corregirlos. El perfil los mostraba y el editor no los
      // ofrecía, que es la peor combinación —ves el dato viejo y no podés tocarlo—.
      // La razón social viaja CON el NIT: son el mismo hecho —a nombre de quién
      // factura esta persona—, y separarlos permitiría dejar una razón social
      // colgada de un NIT que ya no existe. Si sólo llega una de las dos, la
      // otra se conserva de la fila vigente.
      if (dto.taxId !== undefined || dto.taxHolderName !== undefined) {
        await this.reemplazarNit(
          tx,
          person.id,
          dto.taxId,
          dto.taxHolderName,
          actor.id,
          ahora,
        );
      }

      // Domicilio: municipio, calle y GPS fundidos en una sola escritura — ver
      // {@link reemplazarDireccion}. Se llama sólo si el cuerpo trae al menos
      // uno de los tres, para no tocar la fila por nada.
      if (
        dto.residenceMunicipalityConceptId !== undefined ||
        dto.homeAddressLines !== undefined ||
        (dto.homeLatitude !== undefined && dto.homeLongitude !== undefined)
      ) {
        await this.reemplazarDireccion(
          tx,
          person.id,
          CONCEPTS.ADDR_USE_HOME,
          {
            municipio: dto.residenceMunicipalityConceptId,
            lines: dto.homeAddressLines,
            latitude: dto.homeLatitude,
            longitude: dto.homeLongitude,
          },
          actor.id,
          ahora,
        );
      }
      // Trabajo: mismo criterio, con su propio municipio.
      if (
        dto.workMunicipalityConceptId !== undefined ||
        dto.workAddressLines !== undefined ||
        (dto.workLatitude !== undefined && dto.workLongitude !== undefined)
      ) {
        await this.reemplazarDireccion(
          tx,
          person.id,
          CONCEPTS.ADDR_USE_WORK,
          {
            municipio: dto.workMunicipalityConceptId,
            lines: dto.workAddressLines,
            latitude: dto.workLatitude,
            longitude: dto.workLongitude,
          },
          actor.id,
          ahora,
        );
      }

      // El departamento que emitió el documento: metadato de la fila vigente
      // `ID_TYPE_NATIONAL`, no del número en sí — ver el JSDoc del campo en el
      // DTO sobre por qué esto NO toca la identidad de login.
      if (dto.issuerAdministrativeAreaConceptId !== undefined) {
        await this.reemplazarExpedicion(
          tx,
          person.id,
          dto.issuerAdministrativeAreaConceptId,
          actor.id,
        );
      }

      // El tutor o persona autorizada: ver el JSDoc de
      // `guardianName` en el DTO sobre por qué esto declara o corrige, y nunca
      // quita.
      if (
        dto.guardianName !== undefined ||
        dto.guardianPhone !== undefined ||
        dto.guardianRelationshipConceptId !== undefined
      ) {
        await this.reemplazarTutor(tx, patient.profileId, dto, actor.id);
      }

      // El seguro declarado: sólo agrega si el sector no tenía ninguno — ver
      // el JSDoc de `privateInsurancePlanId` en el DTO.
      if (dto.privateInsurancePlanId) {
        await this.declararCobertura(
          tx,
          patient.profileId,
          person.id,
          dto.privateInsurancePlanId,
          'private',
          1,
          actor.id,
        );
      }
      if (dto.publicInsurancePlanId) {
        await this.declararCobertura(
          tx,
          patient.profileId,
          person.id,
          dto.publicInsurancePlanId,
          'public',
          2,
          actor.id,
        );
      }

      await tx.flush();
    });

    // Se relee entero en vez de armar la respuesta con lo que se acaba de
    // escribir: así quien edita ve lo mismo que vería al recargar, incluido el
    // `displayName` recompuesto y el teléfono que quedó vigente.
    return this.getOwnProfile(actor);
  }

  /**
   * Fija la foto de perfil de la persona.
   *
   * Escribe `profiles.persons.photo_file_id`, no una columna de
   * `patient_profiles`: la foto es de la **persona**, igual que decidió
   * v4.0.11 al declarar la columna —identifica a quien entra por la puerta
   * cualquiera sea su rol—. Un médico que además tenga un vínculo de paciente
   * activo comparte la misma foto en los dos perfiles, y es lo esperado, no
   * un cruce accidental.
   *
   * ## La tensión que esto no resuelve
   *
   * El perfil profesional tiene su propia
   * `profiles.health_practitioner_profiles.photo_file_id`
   * ({@link ProfilesPractitionersService.setPractitionerPhoto}), y encima
   * `community.public_profiles.avatar_file_id` es una tercera columna para la
   * vitrina pública. Las tres coexisten hoy sin sincronizarse: este método no
   * las unifica ni escribe en cascada —eso acoplaría tres dominios distintos
   * detrás de un solo botón—. Si el día de mañana se decide que
   * `health_practitioner_profiles` deje de tener su propia foto, la salida
   * natural es que su lectura haga *fallback* a esta columna, no que este
   * método escriba en las otras.
   *
   * @param dto - El archivo ya subido que pasa a ser la foto.
   * @param actor - La sesión, que es también el sujeto.
   * @returns El perfil completo releído, ya con su foto.
   * @throws PreconditionFailedException si la cuenta no tiene persona
   *   vinculada, o si el archivo está borrado, sin versión vigente,
   *   infectado o no es una imagen.
   * @throws ResourceNotFoundException si la persona no tiene perfil de
   *   paciente, o si el archivo no existe o no es del titular.
   */
  async setOwnPhoto(
    dto: SetOwnPatientPhotoDto,
    actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    this.logger.info(
      { operation: 'profiles.patient.setOwnPhoto', actorId: actor.id },
      'Setting own patient photo',
    );

    await this.em.transactional(async (tx) => {
      const { person } = await this.resolveOwnPatient(tx, actor);
      // Dentro de la misma transacción que la escritura: comprobar contra un
      // estado y escribir sobre otro no comprueba nada.
      await this.attachableFiles.assertUsableBy(
        tx,
        dto.fileId,
        actor,
        {
          allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.IMAGE,
          operation: 'profiles.patient.setOwnPhoto',
        },
        {
          subject: 'El archivo de la foto',
          notFound: 'El archivo de la foto no existe',
        },
      );
      person.photoFileId = dto.fileId;
      touch(person, actor.id);
      await tx.flush();
    });

    return this.getOwnProfile(actor);
  }

  /**
   * Quita la foto de perfil de la persona.
   *
   * Deja `photo_file_id` en nulo y no toca el archivo: quitar la foto de la
   * ficha es una decisión de presentación, borrar un archivo del
   * almacenamiento es otra cosa y tiene su propio camino. Es idempotente
   * —quitar la foto de un perfil que ya no la tiene no es un error—.
   *
   * @param actor - La sesión, que es también el sujeto.
   * @returns El perfil completo releído, ya sin foto.
   * @throws PreconditionFailedException si la cuenta no tiene persona
   *   vinculada.
   * @throws ResourceNotFoundException si la persona no tiene perfil de
   *   paciente.
   */
  async removeOwnPhoto(
    actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    this.logger.info(
      { operation: 'profiles.patient.removeOwnPhoto', actorId: actor.id },
      'Removing own patient photo',
    );

    await this.em.transactional(async (tx) => {
      const { person } = await this.resolveOwnPatient(tx, actor);
      person.photoFileId = undefined;
      touch(person, actor.id);
      await tx.flush();
    });

    return this.getOwnProfile(actor);
  }

  /**
   * Documento, departamento emisor y NIT, de una sola lectura.
   *
   * Los tres viven en `common.identifiers` distinguidos por tipo, así que
   * pedirlos por separado serían tres viajes por la misma fila-vecina.
   */
  private async leerIdentificadores(
    em: EntityManager,
    personId: string,
  ): Promise<{
    nationalId?: string;
    issuerArea?: string;
    taxId?: string;
    taxHolderName?: string;
  }> {
    const filas = await em.find(Identifiers, {
      ownerId: personId,
      validTo: null,
    });
    const documento = filas.find(
      (f) => f.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    const fiscal = filas.find((f) => f.typeConceptId === CONCEPTS.ID_TYPE_TAX);
    return {
      nationalId: documento?.value,
      issuerArea: documento?.issuerAdministrativeAreaConceptId,
      taxId: fiscal?.value,
      taxHolderName: fiscal?.holderName,
    };
  }

  /**
   * Los seguros declarados, con la aseguradora y el plan EN PALABRAS.
   *
   * Se resuelven acá y no en la pantalla porque son dos catálogos más que el
   * cliente tendría que pedir para pintar una línea de texto.
   *
   * `isPublic` se deriva del catálogo sembrado y no de una columna: el modelo
   * todavía no persiste el tipo de pagador —deuda declarada en el DTO del alta
   * (PR #258)—, así que una aseguradora cargada por otra vía cae en «privada»
   * hasta que eso exista.
   */
  private async leerCoberturas(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<OwnCoverageDto[]> {
    const filas = await em.getConnection().execute<
      {
        carrier_id: string;
        carrier_name: string;
        plan_name: string | null;
        member_identifier: string | null;
        verification_status_concept_id: string | null;
        insurance_plan_id: string;
        coverage_order: number | null;
      }[]
    >(
      // El vínculo pasa por `insurance_products`: un plan cuelga de un producto
      // y el producto de la aseguradora. Saltarse el intermedio fallaba con
      // «column pl.insurance_carrier_id does not exist».
      `select ca.id         as carrier_id,
              ca.legal_name as carrier_name,
              pl.name       as plan_name,
              c.member_identifier,
              c.verification_status_concept_id,
              c.insurance_plan_id,
              c.coverage_order
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
         join insurance.insurance_carriers ca on ca.id = pr.insurance_carrier_id
        where c.patient_profile_id = ?
        order by c.coverage_order nulls last`,
      [patientProfileId],
    );
    return filas.map((f) => ({
      carrierName: f.carrier_name,
      ...(f.plan_name === null ? {} : { planName: f.plan_name }),
      isPublic: isPublicCarrierId(f.carrier_id),
      ...(f.member_identifier === null
        ? {}
        : { memberIdentifier: f.member_identifier }),
      verified: f.verification_status_concept_id === INS.VERIFY_VERIFIED,
      // El uuid del plan, para que el editor del perfil preseleccione el mismo
      // `<select>` que ofreció el alta — ver el JSDoc de `planId` en el DTO.
      planId: f.insurance_plan_id,
      coverageOrder: f.coverage_order ?? 0,
    }));
  }

  /** Tutores y personas autorizadas, con su nombre y su teléfono. */
  private async leerTutores(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<OwnGuardianDto[]> {
    const filas = await em.getConnection().execute<
      {
        display_name: string | null;
        relationship_concept_id: string | null;
        is_emergency_contact: boolean;
        is_legal_guardian: boolean;
        phone: string | null;
      }[]
    >(
      `select p.display_name,
              r.relationship_concept_id,
              r.is_emergency_contact,
              r.is_legal_guardian,
              (select cp.value from common.contact_points cp
                where cp.owner_id = r.person_id
                  and cp.system_concept_id = ?
                  and cp.valid_to is null
                order by cp.rank nulls last limit 1) as phone
         from profiles.related_persons r
         join profiles.persons p on p.id = r.person_id
        where r.patient_profile_id = ?`,
      [CONCEPTS.CONTACT_PHONE, patientProfileId],
    );
    return filas.map((f) => ({
      ...(f.display_name === null ? {} : { displayName: f.display_name }),
      ...(f.relationship_concept_id === null
        ? {}
        : { relationshipConceptId: f.relationship_concept_id }),
      isEmergencyContact: f.is_emergency_contact,
      isLegalGuardian: f.is_legal_guardian,
      ...(f.phone === null ? {} : { phone: f.phone }),
    }));
  }

  /**
   * Resuelve a qué paciente corresponde una sesión.
   *
   * El sujeto sale **siempre** de `person_account_links` y nunca de un claim del
   * token: `pid` es un dato de identificación que no participa de ninguna
   * decisión, y usarlo acá lo convertiría en una credencial. Este es el mismo
   * camino que recorre el resumen propio, extraído para que las tres lecturas
   * propias no puedan divergir en a quién consideran el titular.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Usuario autenticado.
   * @returns La persona y su perfil de paciente.
   * @throws PreconditionFailedException si la cuenta no tiene persona vinculada.
   * @throws ResourceNotFoundException si la persona no tiene perfil de paciente.
   */
  private async resolveOwnPatient(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<{
    /** La persona titular de la cuenta. */
    person: Persons;
    /** Su perfil de paciente. */
    patient: PatientProfiles;
  }> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }

    const person = await this.personsRepo.findById(em, link.personId);
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!person || !patient) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        personId: link.personId,
      });
    }

    return { person, patient };
  }

  /**
   * Recompone el nombre para mostrar con la misma regla del alta.
   *
   * `displayName` es derivado, no editable: quien corrige su apellido espera
   * verlo corregido en toda pantalla que lo muestre, y dejarlo intacto haría que
   * el perfil dijera una cosa y el nombre visible otra.
   *
   * Si la persona se quedara sin ninguna parte del nombre, conserva el que
   * tenía: es el caso de quien se registró con la forma anterior —sólo
   * `displayName`— y edita otro campo. Vaciarle el nombre visible sería un
   * efecto colateral que nadie pidió.
   *
   * @param person - La persona con las partes ya actualizadas.
   */
  private recomponerDisplayName(person: Persons): void {
    const recompuesto = composePersonDisplayName(person);
    if (recompuesto !== undefined) {
      person.displayName = recompuesto;
    }
  }

  /**
   * Deja vigente el teléfono indicado, cerrando el anterior.
   *
   * Si el número es el que ya estaba vigente no escribe nada: crear una fila
   * idéntica ensuciaría el historial con un cambio que no ocurrió.
   *
   * En blanco significa **quitar** el teléfono: se cierra el vigente y no nace
   * ninguno. Quedarse sin teléfono es un dato —ya no hay por dónde llamar a esta
   * persona—, y escribir una fila con el valor vacío lo contaría como si tuviera
   * uno.
   *
   * @param tx - Transacción de la edición.
   * @param personId - Dueño del punto de contacto.
   * @param telefono - El número nuevo, o en blanco para quedarse sin teléfono.
   * @param actorUserId - Quién edita.
   * @param ahora - Instante de la edición, fin de vigencia del anterior.
   */
  private async reemplazarTelefono(
    tx: EntityManager,
    personId: string,
    telefono: string,
    actorUserId: string,
    ahora: Date,
  ): Promise<void> {
    const nuevo = textoOpcional(telefono);
    const vigente = await this.contactPointsRepo.findVigenteByOwnerAndSystem(
      tx,
      personId,
      CONCEPTS.CONTACT_PHONE,
    );

    if (nuevo === undefined) {
      if (vigente) {
        this.contactPointsRepo.closeVigente(vigente, ahora, actorUserId);
      }
      return;
    }
    if (vigente?.value === nuevo) return;

    if (vigente) {
      this.contactPointsRepo.closeVigente(vigente, ahora, actorUserId);
    }
    // Mismo dueño, mismo sistema y mismo uso que escribe el alta: el número
    // cambió, no la clase de contacto que es.
    this.contactPointsRepo.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
      ownerId: personId,
      systemConceptId: CONCEPTS.CONTACT_PHONE,
      value: nuevo,
      useConceptId: CONCEPTS.CONTACT_USE_HOME,
      actorUserId,
    });
  }

  /**
   * Deja vigente el domicilio del municipio indicado, cerrando el anterior.
   *
   * La dirección nueva la arma el mismo ayudante que usa el alta, que es quien
   * deriva el departamento del código del INE y valida el municipio contra el
   * catálogo: duplicar esa regla acá abriría la puerta a que las dos vías
   * escribieran direcciones distintas para el mismo municipio.
   *
   * @param tx - Transacción de la edición.
   * @param personId - Dueño de la dirección.
   * @param municipalityConceptId - El municipio nuevo.
   * @param actorUserId - Quién edita.
   * @param ahora - Instante de la edición, fin de vigencia de la anterior.
   */
  /**
   * Deja vigente una dirección —domicilio o trabajo— que **funde** lo que llega
   * en el `PATCH` con lo que ya había, en vez de exigir el par completo.
   *
   * ## Por qué existe, y qué reemplaza
   *
   * Antes había dos funciones: una para el municipio
   * (`reemplazarDomicilio`, sólo domicilio) y otra para el texto
   * (`reemplazarTextoDeDireccion`, domicilio y trabajo). Cambiar sólo el
   * municipio **perdía** la calle y el GPS que ya estaban cargados —creaba la
   * fila nueva con nada más que el municipio—, porque cada función sólo sabía
   * de su propio campo. Fundir los tres en una sola escritura es lo que evita
   * that alguien que corrige el municipio se quede sin la calle que ya había
   * escrito.
   *
   * ## Por qué cierra y vuelve a crear, y no edita la fila
   *
   * `common.addresses` lleva `valid_to`: mudarse no debe borrar dónde vivía la
   * persona cuando la atendieron. Se cierra la vigente y se abre otra con el
   * estado fundido — mismo criterio que ya regía acá.
   *
   * ## Por qué usa `createResidenceAddress`/`createWorkAddress` y no un `create`
   * directo
   *
   * Esas funciones son las mismas que usa el alta: derivan el departamento del
   * municipio, copian el nombre de la ciudad y usan `CONCEPTS.COUNTRY_BO` — el
   * código anterior escribía `CONCEPTS.COUNTRY_BOLIVIA`, que **no existe** en
   * `CONCEPT_DEFS` (la constante real es `COUNTRY_BO`); como el mapa está
   * tipado `Record<string, ConceptDef>`, TypeScript no lo marcaba, y en
   * runtime la fila se habría escrito con `country_concept_id: undefined` —
   * columna no-nulable— para cualquiera que mudara la calle de trabajo sin
   * tener antes una dirección de trabajo vigente. Pasar por el helper
   * compartido cierra ese hueco de raíz en vez de corregir el literal acá.
   *
   * @param tx - Transacción activa.
   * @param personId - Persona dueña de la dirección.
   * @param usoConceptId - `ADDR_USE_HOME` o `ADDR_USE_WORK`.
   * @param cambios - Lo que el cuerpo trae de esta dirección. `undefined` en
   *   cualquiera de los tres es «no vino en este cuerpo», no «se borra»: acá se
   *   completa con lo que ya estaba vigente. Sólo `lines` tiene una forma
   *   explícita de vaciarse —cadena vacía—, porque es el único cuya ausencia
   *   total tiene sentido (una dirección sin calle, con sólo el municipio,
   *   sigue siendo un dato).
   * @param actorUserId - Quién edita.
   * @param ahora - Instante de la edición, fin de vigencia de la anterior.
   */
  private async reemplazarDireccion(
    tx: EntityManager,
    personId: string,
    usoConceptId: string,
    cambios: {
      municipio?: string;
      lines?: string;
      latitude?: number;
      longitude?: number;
    },
    actorUserId: string,
    ahora: Date,
  ): Promise<void> {
    const vigente = await this.addressesRepo.findVigenteByOwnerAndUse(
      tx,
      personId,
      usoConceptId,
    );

    const municipio = cambios.municipio ?? vigente?.municipalityConceptId;
    const lines =
      cambios.lines === undefined
        ? vigente?.lines
        : cambios.lines.trim() === ''
          ? undefined
          : cambios.lines.trim();
    const tieneGps =
      cambios.latitude !== undefined && cambios.longitude !== undefined;
    const latitude = tieneGps
      ? cambios.latitude
      : numeroDeColumna(vigente?.latitude);
    const longitude = tieneGps
      ? cambios.longitude
      : numeroDeColumna(vigente?.longitude);

    const sinCambios =
      (vigente?.municipalityConceptId ?? undefined) === municipio &&
      (vigente?.lines ?? undefined) === lines &&
      numeroDeColumna(vigente?.latitude) === latitude &&
      numeroDeColumna(vigente?.longitude) === longitude;
    if (sinCambios) return;

    if (vigente) {
      this.addressesRepo.closeVigente(vigente, ahora, actorUserId);
    }

    const escribir =
      usoConceptId === CONCEPTS.ADDR_USE_WORK
        ? createWorkAddress
        : createResidenceAddress;
    await escribir(this.addressesRepo, tx, this.catalogConceptsRepo, {
      personId,
      municipalityConceptId: municipio,
      lines,
      latitude,
      longitude,
      actorUserId,
    });
  }

  /**
   * El NIT de facturación, que vive en `common.identifiers` como un tipo más.
   *
   * Se cierra el vigente y se abre otro en vez de sobrescribir el valor: la
   * tabla lleva `valid_to`, y una factura emitida con el NIT anterior tiene que
   * seguir explicándose. Cadena vacía cierra sin abrir: es quedarse sin NIT.
   */
  private async reemplazarNit(
    tx: EntityManager,
    personId: string,
    nit: string | undefined,
    razonSocial: string | undefined,
    actorUserId: string,
    ahora: Date,
  ): Promise<void> {
    const filas = await tx.find(Identifiers, {
      ownerId: personId,
      validTo: null,
    });
    const vigente = filas.find((f) => f.typeConceptId === CONCEPTS.ID_TYPE_TAX);
    // Lo que no llegó se conserva de la fila vigente: editar sólo la razón
    // social no puede borrar el NIT, ni al revés.
    const numero = (nit ?? vigente?.value ?? '').trim();
    const titular = (razonSocial ?? vigente?.holderName ?? '').trim();
    if (vigente?.value === numero && (vigente?.holderName ?? '') === titular) {
      return;
    }

    if (vigente) {
      vigente.validTo = ahora;
      touch(vigente, actorUserId);
    }
    // Sin número no hay identificador que abrir: una razón social sola no es un
    // NIT, y guardarla suelta dejaría una fila fiscal sin valor.
    if (numero === '') return;

    this.identifiersRepo.create(tx, {
      ownerId: personId,
      ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
      typeConceptId: CONCEPTS.ID_TYPE_TAX,
      value: numero,
      holderName: titular === '' ? undefined : titular,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId,
    });
  }

  /**
   * Corrige el departamento que emitió el documento, sin tocar el número.
   *
   * Edita la fila vigente `ID_TYPE_NATIONAL` **en el lugar** — a diferencia del
   * NIT o el teléfono, esto no cierra y reabre: el documento con el que la
   * cuenta entra sigue siendo el mismo, sólo se corrige de qué departamento es.
   * Cerrar y reabrir la fila habría exigido repetir el número, que este
   * `PATCH` no recibe ni debe recibir.
   *
   * No hace nada si la persona no tiene documento vigente: no hay a qué
   * departamento atarlo (mismo caso que el alta, donde la expedición viaja
   * siempre junto al documento).
   *
   * @param tx - Transacción activa.
   * @param personId - Persona dueña del documento.
   * @param issuerAdministrativeAreaConceptId - El departamento nuevo.
   * @param actorUserId - Quién edita.
   */
  private async reemplazarExpedicion(
    tx: EntityManager,
    personId: string,
    issuerAdministrativeAreaConceptId: string,
    actorUserId: string,
  ): Promise<void> {
    const filas = await tx.find(Identifiers, {
      ownerId: personId,
      validTo: null,
    });
    const documento = filas.find(
      (f) => f.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    if (!documento) return;
    if (
      documento.issuerAdministrativeAreaConceptId ===
      issuerAdministrativeAreaConceptId
    ) {
      return;
    }

    documento.issuerAdministrativeAreaConceptId =
      issuerAdministrativeAreaConceptId;
    touch(documento, actorUserId);
  }

  /**
   * Declara o corrige al tutor o persona autorizada (registro · PACIENTE §1.7).
   *
   * ## Por qué corrige en el lugar y no cierra y recrea
   *
   * `profiles.related_persons` no lleva `valid_to` como `contact_points` o
   * `addresses`: sólo tiene `RELATED_ACTIVE`. Cerrar la fila del tutor
   * declarado y abrir una nueva —el patrón que sí sirve para teléfono y
   * dirección— dejaría DOS filas activas sin un estado que distinga cuál es la
   * vigente, porque ese estado no existe. Corregir el nombre, el teléfono y el
   * parentesco de la misma fila declarada evita ese problema sin inventar un
   * concepto que el modelo no declara (regla 00.1/00.4 del proyecto).
   *
   * ## Por qué usa {@link findActiveDeclaredGuardian} y no `findActiveGuardian`
   *
   * Ver el JSDoc de ese método: el tutor declarado por autoservicio nace con
   * `isLegalGuardian: false`, así que `findActiveGuardian` —que filtra por
   * `true`— nunca lo encuentra.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Perfil de paciente que declara al tutor.
   * @param dto - Los campos del tutor que llegaron en el cuerpo.
   * @param actorUserId - Quién edita.
   */
  private async reemplazarTutor(
    tx: EntityManager,
    patientProfileId: string,
    dto: UpdateOwnPatientProfileDto,
    actorUserId: string,
  ): Promise<void> {
    const declarado = await this.relatedPersonsRepo.findActiveDeclaredGuardian(
      tx,
      patientProfileId,
    );

    if (!declarado) {
      // Nadie declarado todavía: se crea con el mismo helper del alta.
      await createGuardianRelatedPerson(
        {
          persons: this.personsRepo,
          relatedPersons: this.relatedPersonsRepo,
          contactPoints: this.contactPointsRepo,
        },
        tx,
        {
          patientProfileId,
          name: dto.guardianName,
          phone: dto.guardianPhone,
          relationshipConceptId: dto.guardianRelationshipConceptId,
          actorUserId,
        },
      );
      return;
    }

    if (dto.guardianRelationshipConceptId !== undefined) {
      declarado.relationshipConceptId = dto.guardianRelationshipConceptId;
      touch(declarado, actorUserId);
    }

    if (dto.guardianName) {
      const persona = await this.personsRepo.findById(tx, declarado.personId);
      if (persona) {
        persona.displayName = dto.guardianName;
        touch(persona, actorUserId);
      }
    }

    if (dto.guardianPhone) {
      const vigente = await this.contactPointsRepo.findVigenteByOwnerAndSystem(
        tx,
        declarado.personId,
        CONCEPTS.CONTACT_PHONE,
      );
      if (vigente?.value !== dto.guardianPhone) {
        if (vigente) {
          this.contactPointsRepo.closeVigente(vigente, new Date(), actorUserId);
        }
        this.contactPointsRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
          ownerId: declarado.personId,
          systemConceptId: CONCEPTS.CONTACT_PHONE,
          value: dto.guardianPhone,
          useConceptId: CONCEPTS.CONTACT_USE_HOME,
          actorUserId,
        });
      }
    }
  }

  /**
   * Declara el seguro que el paciente dice tener, en un sector que no tenía
   * declarado todavía (registro · PACIENTE §1.13-§1.14).
   *
   * **No reemplaza una cobertura ya declarada.** `insurance.patient_coverages`
   * no tiene una baja modelada —sólo `COVERAGE_ACTIVE`—, así que si el paciente
   * ya tenía una del mismo sector (orden 1 o 2), esta función no hace nada: ni
   * la pisa, ni la duplica, ni inventa un estado de baja que el modelo no
   * declara. Cambiar de aseguradora por autoservicio queda fuera de este
   * `PATCH` hasta que exista esa baja.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Perfil de paciente que declara la cobertura.
   * @param personId - Persona dueña del documento, para el número de afiliado
   *   provisional.
   * @param insurancePlanId - Plan elegido.
   * @param sector - `'private'` o `'public'`, según el campo que lo trajo.
   * @param coverageOrder - 1 para la privada, 2 para la pública.
   * @param actorUserId - Quién declara.
   */
  private async declararCobertura(
    tx: EntityManager,
    patientProfileId: string,
    personId: string,
    insurancePlanId: string,
    sector: InsuranceSector,
    coverageOrder: number,
    actorUserId: string,
  ): Promise<void> {
    const yaDeclarada = await this.coverageRepo.findActiveByPatientAndOrder(
      tx,
      patientProfileId,
      coverageOrder,
    );
    if (yaDeclarada) return;

    const { nationalId } = await this.leerIdentificadores(tx, personId);
    // No debería pasar —el alta exige documento—, pero sin él no hay número de
    // afiliado provisional que anotar, y declarar sin identificador dejaría
    // una fila que nadie puede buscar después.
    if (!nationalId) return;

    await createDeclaredCoverage(
      { catalog: this.insuranceCatalogRepo, coverage: this.coverageRepo },
      tx,
      {
        patientProfileId,
        insurancePlanId,
        expectedSector: sector,
        coverageOrder,
        memberIdentifier: nationalId,
        actorUserId,
      },
    );
  }

  /**
   * UC-05-13: listado paginado de pacientes para el personal administrativo.
   *
   * Es la cara de lectura que faltaba del módulo: hasta ahora sólo se podían
   * dar de alta pacientes y consultarse a sí mismo el titular, así que ninguna
   * pantalla podía mostrar "los pacientes" ni encontrar el `profileId` que el
   * resto del contrato exige. Sin esto, dar de alta un paciente y después
   * agendarle una cita eran dos operaciones que sólo se podían encadenar si
   * quien las hacía se guardaba el id devuelto en el momento del alta.
   *
   * Devuelve datos de filiación, nunca clínicos.
   *
   * @param options - Texto de búsqueda, cursor de continuación y tope de página.
   * @returns Página de pacientes con el cursor de la siguiente.
   */
  async searchPatients(
    options: {
      /** Texto libre sobre código de paciente y nombre. */
      query?: string;
      /**
       * Documento de identidad exacto. Junto con
       * {@link issuerAdministrativeAreaConceptId} es el camino que abre
       * AC-07-1/AC-07-2: encontrar a alguien aunque su código o su nombre no
       * contengan el texto buscado.
       */
      nationalId?: string;
      /** Departamento que expidió el documento (`VS_BO_DEPARTMENT`). */
      issuerAdministrativeAreaConceptId?: string;
      /** Cursor opaco devuelto por la página anterior. */
      cursor?: string;
      /** Tope de filas de la página. */
      limit: number;
    },
    actor: AuthenticatedUser,
  ): Promise<SearchPatientsResponseDto> {
    // P-07-10: el padrón ya no está acotado por actividad (ver
    // `patient-search-scope.ts`), así que sin este freno un rol clínico sin
    // texto ni documento recibiría la primera página del padrón entero — es
    // enumeración, no búsqueda. `SECURITY_ADMIN`/`SUPERADMIN` administran el
    // padrón y siguen listando sin criterio, como siempre.
    if (
      requiereCriterioDeBusqueda(actor) &&
      !options.query &&
      !options.nationalId
    ) {
      throw new PreconditionFailedException(
        'Buscá por nombre, código o documento: no se puede listar el padrón completo de pacientes',
      );
    }

    const em = this.em.fork();

    if (options.issuerAdministrativeAreaConceptId) {
      await this.administrativeAreas.assertIsAdministrativeArea(
        em,
        options.issuerAdministrativeAreaConceptId,
      );
    }

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterPatientCode =
      typeof after?.patientCode === 'string' ? after.patientCode : undefined;

    // Se pide una fila de más para saber si hay página siguiente sin pagar un
    // COUNT sobre toda la tabla en cada página.
    const rows = await this.patientProfilesRepo.searchPage(
      em,
      {
        query: options.query,
        nationalId: options.nationalId,
        issuerAdministrativeAreaConceptId:
          options.issuerAdministrativeAreaConceptId,
        scope: resolvePatientSearchScope(actor),
        afterPatientCode,
      },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const persons = await this.personsRepo.findByIds(
      em,
      page.map((row) => row.profileId),
    );

    const items = page.map((row) => {
      const person = persons.get(row.profileId);
      return {
        profileId: row.profileId,
        personId: row.profileId,
        patientCode: row.patientCode,
        displayName: person?.displayName,
        birthDate: person?.birthDate,
        personStatusConceptId: person?.personStatusConceptId,
        deceased: Boolean(person?.deceasedAt),
      };
    });

    const last = page.at(-1);
    return {
      items,
      count: items.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ patientCode: last.patientCode })
          : null,
    };
  }

  /**
   * UC-05-14: ficha de filiación de un paciente (F-01).
   *
   * Reúne `persons` + `patient_profiles` + contactos activos, que es lo que la
   * pantalla de filiación necesita para pintarse completa. No trae nada
   * clínico: eso se lee de `clinical` y `chart`, que responden a otro rol.
   *
   * @param profileId - Perfil de paciente a leer.
   * @returns Ficha completa de filiación.
   * @throws ResourceNotFoundException si el perfil no existe.
   */
  async getPatientById(profileId: string): Promise<PatientDetailResponseDto> {
    const em = this.em.fork();

    const patient = await this.patientProfilesRepo.findById(em, profileId);
    if (!patient) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        profileId,
      });
    }
    // `person_profiles.id` es el mismo uuid que `patient_profiles.profile_id`
    // (1:1), y ese id es a su vez el de la persona: por eso se busca la persona
    // por el propio `profileId` y no hace falta un salto más.
    const person = await this.personsRepo.findById(em, patient.profileId);
    if (!person) {
      // Un perfil sin persona es una FK rota, no un "no encontrado" del
      // cliente: se registra para que no pase inadvertido.
      this.logger.error(
        { operation: 'profiles.patient.read', profileId },
        'Perfil de paciente sin persona en el catálogo',
      );
      throw new ResourceNotFoundException('Paciente no encontrado', {
        profileId,
      });
    }

    const related = await this.relatedPersonsRepo.findActiveByPatient(
      em,
      profileId,
    );
    // El nombre del contacto vive en `persons`, no en el vínculo: se resuelve
    // en bloque. Un contacto de emergencia sin nombre no sirve de nada, que es
    // justo lo que quedaría si esto se dejara sin resolver.
    const relatedPersons = await this.personsRepo.findByIds(
      em,
      related.map((row) => row.personId),
    );

    return {
      profileId: patient.profileId,
      personId: person.id,
      patientCode: patient.patientCode,
      masterPatientIndexCode: patient.masterPatientIndexCode,
      displayName: person.displayName,
      birthDate: person.birthDate,
      administrativeGenderConceptId: person.administrativeGenderConceptId,
      sexAtBirthConceptId: person.sexAtBirthConceptId,
      genderIdentityConceptId: person.genderIdentityConceptId,
      nationalityConceptId: person.nationalityConceptId,
      preferredLanguageConceptId: person.preferredLanguageConceptId,
      personStatusConceptId: person.personStatusConceptId,
      vitalStatusConceptId: person.vitalStatusConceptId,
      deceasedAt: person.deceasedAt,
      aboGroupConceptId: patient.aboGroupConceptId,
      rhFactorConceptId: patient.rhFactorConceptId,
      insuranceStatusConceptId: patient.insuranceStatusConceptId,
      clinicalLanguageConceptId: patient.clinicalLanguageConceptId,
      recordLinkageStatusConceptId: patient.recordLinkageStatusConceptId,
      relatedPersons: related.map((row) => ({
        id: row.id,
        displayName: relatedPersons.get(row.personId)?.displayName,
        relationshipConceptId: row.relationshipConceptId,
        isEmergencyContact: row.isEmergencyContact,
        isLegalGuardian: row.isLegalGuardian,
      })),
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  /** UC-05-02: vincula una cuenta de portal a la persona (supersede el vínculo previo). */
  async linkAccount(
    personId: string,
    dto: LinkAccountDto,
    actor: AuthenticatedUser,
  ): Promise<AccountLinkResponseDto> {
    this.logger.info(
      { operation: 'profiles.account.link', personId },
      'Linking portal account',
    );
    return this.em.transactional(async (tx) => {
      const person = await this.personsRepo.findById(tx, personId);
      if (!person)
        throw new ResourceNotFoundException('Persona no encontrada', {
          personId,
        });
      if (person.personStatusConceptId !== PROF.PERSON_ACTIVE) {
        throw new PreconditionFailedException('La persona no está activa', {
          personId,
        });
      }

      const now = new Date();
      // Respeta uq_person_account_links_active_user: solo un vínculo activo por usuario.
      await this.accountLinksRepo.supersedeActiveForUser(tx, dto.userId, now);

      const link = this.accountLinksRepo.create(tx, {
        personId,
        userId: dto.userId,
        linkTypeConceptId: dto.linkTypeConceptId ?? PROF.ACCOUNT_LINK_SELF,
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: link.id,
        personId,
        userId: dto.userId,
        status: link.statusConceptId,
        validFrom: link.validFrom,
      };
    });
  }

  /** UC-05-07: vincula (upsert) una identidad externa de paciente y marca el registro como linked. */
  async addIdentityLink(
    profileId: string,
    dto: AddIdentityLinkDto,
    actor: AuthenticatedUser,
  ): Promise<IdentityLinkResponseDto> {
    this.logger.info(
      { operation: 'profiles.identity.link', profileId },
      'Adding patient identity link',
    );
    return this.em.transactional(async (tx) => {
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient)
        throw new ResourceNotFoundException('Paciente no encontrado', {
          profileId,
        });

      const verificationStatus = dto.verified
        ? PROF.IDENTITY_VERIFIED
        : PROF.IDENTITY_UNVERIFIED;
      const existing = await this.identityLinksRepo.findBySource(
        tx,
        dto.sourceTenantId,
        dto.sourceSystemUri,
        dto.sourcePatientIdentifier,
      );

      let linkId: string;
      let created: boolean;
      if (existing) {
        // ON CONFLICT → conserva la mayor confianza y actualiza verificación.
        existing.confidenceScore = String(dto.confidenceScore);
        existing.verificationStatusConceptId = verificationStatus;
        existing.verifiedByUserId = dto.verified ? actor.id : undefined;
        existing.verifiedAt = dto.verified ? new Date() : undefined;
        touch(existing, actor.id);
        linkId = existing.id;
        created = false;
      } else {
        const link = this.identityLinksRepo.create(tx, {
          patientProfileId: profileId,
          sourceTenantId: dto.sourceTenantId,
          sourcePatientIdentifier: dto.sourcePatientIdentifier,
          sourceSystemUri: dto.sourceSystemUri,
          linkTypeConceptId: dto.linkTypeConceptId ?? PROF.IDENTITY_LINK_MPI,
          confidenceScore: String(dto.confidenceScore),
          verificationStatusConceptId: verificationStatus,
          verifiedByUserId: dto.verified ? actor.id : undefined,
          verifiedAt: dto.verified ? new Date() : undefined,
          actorUserId: actor.id,
        });
        await tx.flush();
        linkId = link.id;
        created = true;
      }

      patient.recordLinkageStatusConceptId = PROF.LINKAGE_LINKED;
      touch(patient, actor.id);
      await tx.flush();

      return {
        id: linkId,
        patientProfileId: profileId,
        verificationStatus,
        created,
      };
    });
  }

  /** UC-05-08: fusiona un paciente perdedor sobre el sobreviviente (evento IMMUTABLE + reasignación). */
  async mergePatients(
    dto: MergePatientsDto,
    actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    this.logger.info(
      {
        operation: 'profiles.patient.merge',
        surviving: dto.survivingPatientProfileId,
        merged: dto.mergedPatientProfileId,
      },
      'Merging patients',
    );
    return this.em.transactional(async (tx) => {
      if (dto.survivingPatientProfileId === dto.mergedPatientProfileId) {
        throw new PreconditionFailedException(
          'No se puede fusionar un paciente consigo mismo',
          {
            profileId: dto.survivingPatientProfileId,
          },
        );
      }
      const surviving = await this.patientProfilesRepo.findById(
        tx,
        dto.survivingPatientProfileId,
      );
      if (!surviving) {
        throw new ResourceNotFoundException(
          'Paciente sobreviviente no encontrado',
          {
            profileId: dto.survivingPatientProfileId,
          },
        );
      }
      const merged = await this.patientProfilesRepo.findById(
        tx,
        dto.mergedPatientProfileId,
      );
      if (!merged) {
        throw new ResourceNotFoundException(
          'Paciente a fusionar no encontrado',
          {
            profileId: dto.mergedPatientProfileId,
          },
        );
      }
      if (merged.recordLinkageStatusConceptId === PROF.LINKAGE_MERGED) {
        throw new ConflictException('El paciente ya fue fusionado', {
          profileId: dto.mergedPatientProfileId,
        });
      }

      const now = new Date();
      const event = this.mergeEventsRepo.create(tx, {
        survivingPatientProfileId: dto.survivingPatientProfileId,
        mergedPatientProfileId: dto.mergedPatientProfileId,
        reasonConceptId: dto.reasonConceptId ?? PROF.MERGE_REASON_DUPLICATE,
        decisionStatusConceptId: PROF.MERGE_APPROVED,
        approvedByUserId: actor.id,
        recordedAt: now,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // Estado del paciente perdedor.
      merged.recordLinkageStatusConceptId = PROF.LINKAGE_MERGED;
      touch(merged, actor.id);

      // patient_profiles.profile_id ES persons.id (FK a profiles.persons), así que
      // el id de perfil del perdedor identifica directamente a su persona.
      const mergedPerson = await this.personsRepo.findById(
        tx,
        merged.profileId,
      );
      if (mergedPerson) {
        mergedPerson.mergeSurvivorPersonId = surviving.profileId;
        mergedPerson.personStatusConceptId = PROF.PERSON_MERGED;
        touch(mergedPerson, actor.id);
      }

      // Reasigna referencias del perdedor al sobreviviente.
      await this.identityLinksRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await this.relatedPersonsRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await this.portalProxiesRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await tx.flush();

      return this.toEventDto(event);
    });
  }

  /**
   * UC-05-09·L: los eventos de fusión, para poder revertir uno más tarde.
   *
   * `reverseMerge` exige el `eventId`, y hasta ahora ese identificador sólo
   * existía en la respuesta del `POST` que lo creaba: en cuanto esa respuesta se
   * perdía de vista, unir dos historias clínicas dejaba de tener vuelta atrás
   * desde la aplicación. Esta lectura es lo que convierte «revertir» en algo que
   * se puede hacer al día siguiente.
   *
   * @param query - Paciente involucrado y tope, ambos opcionales.
   * @returns Los eventos, del más reciente al más antiguo.
   */
  async listMergeEvents(
    query: ListMergeEventsQueryDto,
  ): Promise<ListMergeEventsResponseDto> {
    const limit = query.limit ?? MERGE_EVENTS_DEFAULT_LIMIT;
    const em = this.em.fork();
    const rows = await this.mergeEventsRepo.findEvents(
      em,
      query.patientProfileId === undefined
        ? {}
        : { patientProfileId: query.patientProfileId },
      limit,
    );

    return {
      items: rows.map((event) => ({
        id: event.id,
        survivingPatientProfileId: event.survivingPatientProfileId,
        mergedPatientProfileId: event.mergedPatientProfileId,
        decisionStatus: event.decisionStatusConceptId,
        ...(event.reversalOfEventId === undefined
          ? {}
          : { reversalOfEventId: event.reversalOfEventId }),
        recordedAt: event.recordedAt,
      })),
      count: rows.length,
      limit,
    };
  }

  /** UC-05-09: revierte una fusión previa aprobada (nuevo evento IMMUTABLE de reversión). */
  async reverseMerge(
    eventId: string,
    dto: ReverseMergeDto,
    actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    this.logger.info(
      { operation: 'profiles.patient.merge.reverse', eventId },
      'Reversing patient merge',
    );
    return this.em.transactional(async (tx) => {
      const original = await this.mergeEventsRepo.findById(tx, eventId);
      if (!original)
        throw new ResourceNotFoundException('Evento de fusión no encontrado', {
          eventId,
        });
      if (original.decisionStatusConceptId !== PROF.MERGE_APPROVED) {
        throw new PreconditionFailedException(
          'Solo se puede revertir una fusión aprobada',
          {
            eventId,
          },
        );
      }
      const alreadyReversed = await this.mergeEventsRepo.findByReversalOf(
        tx,
        eventId,
      );
      if (alreadyReversed) {
        throw new ConflictException('La fusión ya fue revertida', { eventId });
      }

      const now = new Date();
      const reversal = this.mergeEventsRepo.create(tx, {
        survivingPatientProfileId: original.survivingPatientProfileId,
        mergedPatientProfileId: original.mergedPatientProfileId,
        reasonConceptId: dto.reasonConceptId ?? original.reasonConceptId,
        decisionStatusConceptId: PROF.MERGE_REVERSED,
        approvedByUserId: actor.id,
        reversalOfEventId: eventId,
        recordedAt: now,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // Restaura el estado del paciente y la persona del perdedor.
      const merged = await this.patientProfilesRepo.findById(
        tx,
        original.mergedPatientProfileId,
      );
      if (merged) {
        merged.recordLinkageStatusConceptId = PROF.LINKAGE_LINKED;
        touch(merged, actor.id);
        const mergedPerson = await this.personsRepo.findById(
          tx,
          merged.profileId,
        );
        if (mergedPerson) {
          mergedPerson.mergeSurvivorPersonId = undefined;
          mergedPerson.personStatusConceptId = PROF.PERSON_ACTIVE;
          touch(mergedPerson, actor.id);
        }
      }
      await tx.flush();

      return this.toEventDto(reversal);
    });
  }

  /** UC-05-10: registra una persona relacionada / contacto de emergencia del paciente. */
  async addRelatedPerson(
    profileId: string,
    dto: AddRelatedPersonDto,
    actor: AuthenticatedUser,
  ): Promise<RelatedPersonResponseDto> {
    this.logger.info(
      { operation: 'profiles.related.add', profileId },
      'Adding related person',
    );
    return this.em.transactional(async (tx) => {
      // El titular administra lo suyo: sin esto, un profesional auto-registrado no
      // podía crear la matrícula que su propia verificación exige.
      await this.ownership.assertOwnsPatientProfile(tx, profileId, actor);
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient)
        throw new ResourceNotFoundException('Paciente no encontrado', {
          profileId,
        });

      if (dto.isLegalGuardian) {
        const guardian = await this.relatedPersonsRepo.findActiveGuardian(
          tx,
          profileId,
        );
        if (guardian) {
          throw new ConflictException(
            'El paciente ya tiene un tutor legal activo',
            { profileId },
          );
        }
      }

      let personId = dto.personId;
      if (personId) {
        const existing = await this.personsRepo.findById(tx, personId);
        if (!existing) {
          throw new ResourceNotFoundException(
            'Persona relacionada no encontrada',
            { personId },
          );
        }
      } else {
        const person = this.personsRepo.create(tx, {
          personStatusConceptId: PROF.PERSON_ACTIVE,
          vitalStatusConceptId: PROF.VITAL_ALIVE,
          displayName: dto.displayName,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          actorUserId: actor.id,
        });
        await tx.flush();
        personId = person.id;
      }

      const related = this.relatedPersonsRepo.create(tx, {
        patientProfileId: profileId,
        personId,
        relationshipConceptId:
          dto.relationshipConceptId ?? PROF.RELATIONSHIP_GUARDIAN,
        isEmergencyContact: dto.isEmergencyContact ?? false,
        isLegalGuardian: dto.isLegalGuardian ?? false,
        statusConceptId: PROF.RELATED_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: related.id,
        patientProfileId: profileId,
        personId,
        status: related.statusConceptId,
        createdAt: related.createdAt,
      };
    });
  }

  /** UC-05-11: otorga un proxy de portal a un representante (revoca el proxy previo del mismo usuario). */
  async grantPortalProxy(
    profileId: string,
    dto: GrantPortalProxyDto,
    actor: AuthenticatedUser,
  ): Promise<PortalProxyResponseDto> {
    this.logger.info(
      { operation: 'profiles.proxy.grant', profileId },
      'Granting portal proxy',
    );
    return this.em.transactional(async (tx) => {
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient)
        throw new ResourceNotFoundException('Paciente no encontrado', {
          profileId,
        });

      if (dto.relatedPersonId) {
        const related = await this.relatedPersonsRepo.findById(
          tx,
          dto.relatedPersonId,
        );
        if (!related || related.patientProfileId !== profileId) {
          throw new PreconditionFailedException(
            'La persona relacionada no pertenece al paciente',
            { relatedPersonId: dto.relatedPersonId },
          );
        }
      }

      const now = new Date();
      await this.portalProxiesRepo.revokeActiveForProxyUser(
        tx,
        profileId,
        dto.proxyUserId,
        now,
      );

      const proxy = this.portalProxiesRepo.create(tx, {
        patientProfileId: profileId,
        proxyUserId: dto.proxyUserId,
        relatedPersonId: dto.relatedPersonId,
        scopeValueSetId: dto.scopeValueSetId,
        legalBasisRecordId: dto.legalBasisRecordId,
        statusConceptId: PROF.PROXY_ACTIVE,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : now,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: proxy.id,
        patientProfileId: profileId,
        proxyUserId: dto.proxyUserId,
        status: proxy.statusConceptId,
        createdAt: proxy.createdAt,
      };
    });
  }

  /** UC-05-12: registra defunción y revoca los accesos activos de la persona. */
  async decease(
    personId: string,
    dto: DeceasePersonDto,
    actor: AuthenticatedUser,
  ): Promise<DeceaseResponseDto> {
    this.logger.info(
      { operation: 'profiles.person.decease', personId },
      'Recording decease',
    );
    return this.em.transactional(async (tx) => {
      const person = await this.personsRepo.findById(tx, personId);
      if (!person)
        throw new ResourceNotFoundException('Persona no encontrada', {
          personId,
        });
      if (person.vitalStatusConceptId === PROF.VITAL_DECEASED) {
        throw new ConflictException(
          'La persona ya está registrada como fallecida',
          { personId },
        );
      }

      const now = new Date();
      person.vitalStatusConceptId = PROF.VITAL_DECEASED;
      person.deceasedAt = dto.deceasedAt ? new Date(dto.deceasedAt) : now;
      person.personStatusConceptId = PROF.PERSON_INACTIVE;
      if (dto.anonymize) {
        person.anonymizedAt = now;
        person.displayName = 'ANONYMIZED';
      }
      touch(person, actor.id);

      const revokedAccountLinks =
        await this.accountLinksRepo.revokeActiveForPerson(tx, personId, now);

      // patient_profiles.profile_id ES persons.id: los proxies del posible perfil
      // de paciente de esta persona se revocan usando su propio id (0 si no es paciente).
      const revokedProxies =
        await this.portalProxiesRepo.revokeActiveForPatient(tx, personId, now);
      await tx.flush();

      return {
        id: person.id,
        vitalStatus: person.vitalStatusConceptId,
        personStatus: person.personStatusConceptId,
        deceasedAt: person.deceasedAt,
        revokedAccountLinks,
        revokedProxies,
      };
    });
  }

  /**
   * Transforma to event dto.
   *
   * @param event - Valor de event requerido por la operación.
   * @returns Resultado de to event dto conforme al contrato `MergeEventResponseDto`.
   */
  private toEventDto(event: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Identificador asociado a surviving patient profile.
     */
    survivingPatientProfileId: string;
    /**
     * Identificador asociado a merged patient profile.
     */
    mergedPatientProfileId: string;
    /**
     * Identificador asociado a decision status concept.
     */
    decisionStatusConceptId: string;
    /**
     * Identificador asociado a reversal of event.
     */
    reversalOfEventId?: string;
    /**
     * Valor de recorded at mantenido por la instancia.
     */
    recordedAt: Date;
  }): MergeEventResponseDto {
    return {
      id: event.id,
      survivingPatientProfileId: event.survivingPatientProfileId,
      mergedPatientProfileId: event.mergedPatientProfileId,
      decisionStatus: event.decisionStatusConceptId,
      reversalOfEventId: event.reversalOfEventId,
      recordedAt: event.recordedAt,
    };
  }
}
