import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  VerificationBypassService,
  decodeKeysetCursor,
  encodeKeysetCursor,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
// Verificar la matrícula es lo que habilita a ejercer; el rol con el que se
// ejerce lo custodia `authz`.
import { AuthzEffectiveRolesService } from '../../authz/services';
import {
  MAX_SPECIALTIES_PER_PRACTITIONER,
  MedicalSpecialtyCatalogService,
} from './medical-specialty-catalog.service';
// Lectura de SÓLO CONTEO sobre otros módulos, para la actividad del perfil.
// Se importan las entidades y no sus servicios a propósito: lo único que se
// hace con ellas es `em.count(...)` filtrando por el usuario que creó la fila,
// así que no se trae ni una fila y no hay dato clínico de nadie cruzando el
// límite del módulo. Depender de los servicios de `clinical` y `chart` para
// contar cuatro números ataría `profiles` a dos módulos enteros.
import { ClinicalNoteHeaders, DocumentRecords } from '../../chart/entities';
import { Encounters, MedicationRequests } from '../../clinical/entities';
import { PROF } from '../profiles.concepts';
import type { OnboardingStepDto, PractitionerOnboardingDto } from '../dto';
import {
  PersonsRepository,
  PersonProfilesRepository,
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  ProfessionalCredentialsRepository,
  PractitionerSpecialtiesRepository,
  PractitionerLanguagesRepository,
  PractitionerAffiliationsRepository,
  PersonAccountLinksRepository,
} from '../repositories';
import { PractitionerAffiliations } from '../entities';
import { SchedulableResources } from '../../scheduling/entities';
import {
  CreatePractitionerDto,
  PractitionerResponseDto,
  CreateJurisdictionAuthorizationDto,
  JurisdictionAuthorizationResponseDto,
  VerifyCredentialDto,
  CredentialResponseDto,
  AddSpecialtyDto,
  SpecialtyResponseDto,
  CreateAffiliationDto,
  AffiliationResponseDto,
  ListAffiliationsResponseDto,
  PractitionerProfileSummaryDto,
  PractitionerActivityDto,
  UpdateOwnPractitionerProfileDto,
  ListPractitionersResponseDto,
  SetPractitionerPhotoDto,
} from '../dto';
import { AttachableFileService } from '../../common/services';
import { ProfileOwnershipService } from './profile-ownership.service';

/**
 * Casos de uso de la fuerza laboral de salud (regla GENERALIST): onboarding
 * (UC-05-03), autorización jurisdiccional (UC-05-04), verificación de credencial
 * (UC-05-05) y alta de especialidad (UC-05-06).
 *
 * Todas las escrituras son `em.transactional` con `flush` padre-antes-de-hijo,
 * porque las FK son columnas uuid planas y MikroORM no ordena inserts.
 */
@Injectable()
export class ProfilesPractitionersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personsRepo - Valor de persons repo requerido por la operación.
   * @param personProfilesRepo - Valor de person profiles repo requerido por la operación.
   * @param practitionersRepo - Valor de practitioners repo requerido por la operación.
   * @param authorizationsRepo - Valor de authorizations repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param specialtiesRepo - Valor de specialties repo requerido por la operación.
   * @param languagesRepo - Valor de languages repo requerido por la operación.
   * @param affiliationsRepo - Historial laboral (afiliaciones institucionales).
   * @param attachableFiles - La regla compartida de qué archivo se puede referenciar.
   * @param accountLinksRepo - Vínculo persona-cuenta del titular del perfil.
   * @param effectiveRoles - Concesión de roles asistenciales (`authz`).
   * @param verificationBypass - Bypass DEV/TEST del filtro de verificación (corrección #12).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly credentialsRepo: ProfessionalCredentialsRepository,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly languagesRepo: PractitionerLanguagesRepository,
    private readonly affiliationsRepo: PractitionerAffiliationsRepository,
    private readonly ownership: ProfileOwnershipService,
    private readonly attachableFiles: AttachableFileService,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly effectiveRoles: AuthzEffectiveRolesService,
    private readonly verificationBypass: VerificationBypassService,
    private readonly specialtyCatalog: MedicalSpecialtyCatalogService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProfilesPractitionersService.name);
  }

  /**
   * El perfil profesional propio — la lectura que le faltaba al módulo.
   *
   * ## Qué arregla
   *
   * `profiles` tenía cuatro escrituras de fuerza laboral y ninguna lectura, así
   * que la única pantalla de «mi perfil» que existía llamaba a
   * `GET /profiles/patients/me/summary`. A un profesional eso le responde 404
   * —no tiene perfil de paciente— o 403 si además no verificó su identidad: la
   * pantalla de perfil de un médico no funcionaba, y no por un defecto de la
   * pantalla sino porque no había endpoint que la sirviera.
   *
   * Todo lo que se devuelve acá ya se escribía desde el primer día: la
   * biografía, las especialidades, los idiomas, las credenciales y las
   * matrículas estaban en la base sin forma de volver a leerse.
   *
   * ## El sujeto sale de la sesión
   *
   * No recibe identificador: se resuelve por el vínculo persona-cuenta del
   * actor, igual que el resumen del paciente. El perfil de un colega se pide
   * por `getPractitionerSummary` (la ficha de la guía, R2-1) — mismo contrato,
   * distinto origen del sujeto.
   *
   * ## Las cuentas de actividad
   *
   * Se leen contra `clinical` y `chart` filtrando por el usuario que creó cada
   * registro. Es una lectura de sólo contar y de sólo lo propio: no sale ni un
   * dato clínico del expediente de nadie, y por eso puede vivir acá sin abrir un
   * camino lateral a información de pacientes.
   *
   * @param actor - La sesión que consulta, que es también el sujeto.
   * @returns Su perfil profesional con trayectoria y actividad.
   */
  async getOwnPractitionerProfile(
    actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    const em = this.em.fork();

    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }

    return this.buildSummary(em, link.personId, actor.id);
  }

  /**
   * En qué punto del alta está el profesional de la sesión.
   *
   * ## Por qué se calcula y no se guarda
   *
   * El asistente necesita saber «por dónde iba», y la tentación es una columna
   * `onboarding_step`. No hace falta y sería peor: crearía un segundo estado
   * que puede contradecir al primero —alguien carga su foto desde el perfil y
   * el contador sigue diciendo que le falta— y obligaría a migrar a todos los
   * profesionales que ya existen.
   *
   * Derivándolo de los datos, retomar sale gratis y los profesionales de antes
   * aparecen completos sin tocar una fila.
   *
   * @param actor - Usuario autenticado.
   * @returns Las cinco etapas y la primera incompleta.
   */
  async getOwnOnboarding(
    actor: AuthenticatedUser,
  ): Promise<PractitionerOnboardingDto> {
    const em = this.em.fork();

    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }
    const perfil = await this.practitionersRepo.findById(em, link.personId);
    if (!perfil) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil profesional',
        { personId: link.personId },
      );
    }
    const practitionerProfileId = perfil.profileId;

    const [matriculas, especialidades, afiliaciones, recursos] =
      await Promise.all([
        this.authorizationsRepo.findByPractitioner(em, practitionerProfileId),
        this.specialtiesRepo.findAllByPractitioner(em, practitionerProfileId),
        em.find(PractitionerAffiliations, { practitionerProfileId }),
        // La agenda propia: el recurso de scheduling que apunta a este perfil.
        // Se mira desde acá y no se le pide al otro módulo porque es una
        // pregunta de este —«¿ya publicó?»— y `resource_ref_id` es su vínculo.
        em.find(SchedulableResources, { resourceRefId: practitionerProfileId }),
      ]);

    const faltaEnDatos: string[] = [];
    if (!matriculas.some((fila) => fila.licenseNumber.trim() !== '')) {
      faltaEnDatos.push('license-number');
    }
    if (especialidades.length === 0) faltaEnDatos.push('specialty');

    const pasos: OnboardingStepDto[] = [
      {
        key: 'professional-data',
        complete: faltaEnDatos.length === 0,
        missing: faltaEnDatos,
      },
      {
        key: 'photo',
        complete: perfil.photoFileId !== undefined,
        missing: perfil.photoFileId === undefined ? ['photo'] : [],
      },
      {
        // Vale una afiliación **o** una agenda propia: un profesional que
        // atiende en su propio consultorio no está afiliado a nadie, y pedirle
        // una afiliación lo dejaría trabado en un paso que no le corresponde.
        key: 'organizations',
        complete: afiliaciones.length > 0 || recursos.length > 0,
        missing:
          afiliaciones.length > 0 || recursos.length > 0 ? [] : ['affiliation'],
      },
      {
        key: 'schedule',
        complete: recursos.length > 0,
        missing: recursos.length > 0 ? [] : ['published-schedule'],
      },
    ];

    // La revisión no pide nada propio: está cumplida cuando lo están las cuatro
    // anteriores. Se declara igual para que la pantalla dibuje cinco pasos.
    const previosCompletos = pasos.every((paso) => paso.complete);
    pasos.push({
      key: 'review',
      complete: previosCompletos,
      missing: previosCompletos ? [] : ['previous-steps'],
    });

    const primerIncompleto = pasos.find((paso) => !paso.complete);

    this.logger.info(
      {
        operation: 'profiles.practitioner.onboarding',
        firstIncomplete: primerIncompleto?.key ?? 'done',
      },
      'Calculando el avance del alta del profesional',
    );

    return {
      practitionerProfileId,
      steps: pasos,
      firstIncomplete: primerIncompleto?.key ?? 'done',
    };
  }

  /**
   * La guía de profesionales (carril R2-1): el listado que no existía.
   *
   * `profiles` tenía listado de pacientes y ninguna forma de listar
   * profesionales — la guía telefónica que el cliente pidió no se podía
   * construir. Devuelve lo que una fila de guía necesita: nombre,
   * especialidades (para agrupar), disponibilidad y el id con el que se abre
   * la ficha. Datos profesionales de presentación, nunca PHI.
   *
   * ## Paginación y orden
   *
   * Keyset por `practitioner_code`, igual que el listado de pacientes: la
   * pantalla junta las páginas y agrupa por especialidad, así que el orden de
   * transporte sólo necesita ser estable y sin huecos. El filtro por
   * especialidad considera únicamente las vigentes: presentar a alguien por
   * una especialidad que dejó de ejercer es decir algo falso.
   *
   * ## Filtro de verificación (corrección #12/#13)
   *
   * Fuera del bypass DEV/TEST, la guía solo lista profesionales con
   * `verificationStatusConceptId = PRACT_VERIF_VERIFIED`: presentar a un
   * paciente un profesional no verificado como si fuera elegible sería el
   * mismo tipo de dato falso que una especialidad ya abandonada. Con el
   * bypass activo (`VerificationBypassService.isActive()`), el filtro se
   * suprime — los sembrados/registrados sin verificar deben poder probarse
   * de punta a punta en DEV/TEST — pero el estado sigue viajando en cada
   * fila (`verificationStatusConceptId`) como badge informativo, nunca como
   * criterio de exclusión adicional.
   *
   * @param options - Filtro por especialidad, cursor y tope de página.
   * @returns Página de la guía con el cursor de la siguiente.
   */
  async listPractitioners(options: {
    /** Sólo perfiles que ejercen esta especialidad hoy. */
    specialtyConceptId?: string;
    /** Cursor opaco devuelto por la página anterior. */
    cursor?: string;
    /** Tope de filas de la página. */
    limit: number;
  }): Promise<ListPractitionersResponseDto> {
    const em = this.em.fork();

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterCode =
      typeof after?.practitionerCode === 'string'
        ? after.practitionerCode
        : undefined;

    let profileIds: readonly string[] | undefined;
    if (options.specialtyConceptId !== undefined) {
      profileIds = await this.specialtiesRepo.findProfileIdsBySpecialty(
        em,
        options.specialtyConceptId,
      );
      if (profileIds.length === 0) {
        // Se corta acá: un `$in` vacío se traduce a `in (null)` y devolvería
        // cero filas igual, pero pagando la consulta y sin decir por qué.
        return { items: [], count: 0, limit: options.limit, nextCursor: null };
      }
    }

    const verificationStatusConceptId = this.verificationBypass.isActive()
      ? undefined
      : PROF.PRACT_VERIF_VERIFIED;

    // Una fila de más para saber si hay página siguiente sin pagar un COUNT
    // sobre toda la tabla en cada página.
    const rows = await this.practitionersRepo.listPage(
      em,
      { afterCode, profileIds, verificationStatusConceptId },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const pageIds = page.map((row) => row.profileId);
    const [persons, specialties] = await Promise.all([
      this.personsRepo.findByIds(em, pageIds),
      this.specialtiesRepo.findByPractitioners(em, pageIds),
    ]);

    const specialtiesByProfile = new Map<
      string,
      { specialtyConceptId: string; isPrimary: boolean }[]
    >();
    for (const specialty of specialties) {
      // La guía presenta lo que se ejerce HOY: una especialidad cerrada es
      // trayectoria (vive en el summary), no un encabezado bajo el que buscar
      // médico.
      if (specialty.validTo !== undefined && specialty.validTo !== null) {
        continue;
      }
      const list =
        specialtiesByProfile.get(specialty.practitionerProfileId) ?? [];
      list.push({
        specialtyConceptId: specialty.specialtyConceptId,
        isPrimary: specialty.isPrimary ?? false,
      });
      specialtiesByProfile.set(specialty.practitionerProfileId, list);
    }

    const items = page.map((row) => {
      const person = persons.get(row.profileId);
      return {
        profileId: row.profileId,
        practitionerCode: row.practitionerCode,
        displayName: person?.displayName,
        professionalTitle: row.professionalTitle,
        photoFileId: row.photoFileId,
        verificationStatusConceptId: row.verificationStatusConceptId,
        acceptsNewPatients: row.acceptsNewPatients ?? false,
        telehealthAvailable: row.telehealthAvailable ?? false,
        specialties: specialtiesByProfile.get(row.profileId) ?? [],
      };
    });

    const last = page.at(-1);
    return {
      items,
      count: items.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ practitionerCode: last.practitionerCode })
          : null,
    };
  }

  /**
   * El perfil profesional de un colega — la ficha que abre la guía (R2-1).
   *
   * Mismo shape que `me/summary` a propósito: es el mismo contrato, cambia de
   * dónde sale el sujeto. La guía de profesionales pinta este resultado con la
   * misma vista con la que el doctor ve el suyo, y dos formas distintas
   * significarían dos perfiles de doctor en el producto.
   *
   * Son datos profesionales de presentación —trayectoria, credenciales,
   * idiomas—, no PHI: lo que una guía médica publica de cada profesional. La
   * actividad se cuenta contra la cuenta del titular del perfil consultado
   * (no la de quien mira), y si el perfil no tiene cuenta vinculada queda en
   * cero — cero registros ES la actividad de un perfil sin cuenta.
   *
   * @param profileId - El profesional consultado.
   * @returns Su perfil, con el mismo contrato que el propio.
   */
  async getPractitionerSummary(
    profileId: string,
  ): Promise<PractitionerProfileSummaryDto> {
    const em = this.em.fork();
    // La cuenta del TITULAR, para contar su actividad. Puede no existir: un
    // perfil dado de alta por la organización sin autoregistro no tiene
    // vínculo, y eso no lo saca de la guía.
    const link = await this.accountLinksRepo.findActiveByPerson(em, profileId);
    return this.buildSummary(em, profileId, link?.userId);
  }

  /**
   * Arma el summary de un perfil ya identificado.
   *
   * Compartido entre la lectura propia y la ajena: el contrato es el mismo y
   * lo único que cambia es cómo se resolvió `personId` (sesión o parámetro).
   *
   * @param em - Contexto de persistencia.
   * @param personId - El titular del perfil (= profileId del profesional).
   * @param subjectUserId - La cuenta cuya actividad se cuenta, si hay.
   * @returns El perfil completo.
   */
  private async buildSummary(
    em: EntityManager,
    personId: string,
    subjectUserId: string | undefined,
  ): Promise<PractitionerProfileSummaryDto> {
    const person = await this.personsRepo.findById(em, personId);
    const practitioner = await this.practitionersRepo.findById(em, personId);
    if (!person || !practitioner) {
      // 404 y no 403: la cuenta existe y la sesión es válida, lo que no hay es
      // un perfil profesional a su nombre. Decirlo como «prohibido» mandaría a
      // pedir permisos a quien lo que necesita es que lo den de alta.
      throw new ResourceNotFoundException('Perfil profesional no encontrado', {
        personId,
      });
    }

    const profileId = practitioner.profileId;
    const [
      specialties,
      credentials,
      licenses,
      languages,
      affiliations,
      activity,
    ] = await Promise.all([
      this.specialtiesRepo.findAllByPractitioner(em, profileId),
      this.credentialsRepo.findByPractitioner(em, profileId),
      this.authorizationsRepo.findByPractitioner(em, profileId),
      this.languagesRepo.findByPractitioner(em, profileId),
      this.affiliationsRepo.findByPractitioner(em, profileId),
      subjectUserId === undefined
        ? Promise.resolve({
            encounters: 0,
            medicationRequests: 0,
            clinicalNotes: 0,
            documents: 0,
          })
        : this.countActivity(em, subjectUserId),
    ]);

    return {
      profileId,
      personId: person.id,
      practitionerCode: practitioner.practitionerCode,
      displayName: person.displayName,
      professionalTitle: practitioner.professionalTitle,
      professionalBio: practitioner.professionalBio,
      photoFileId: practitioner.photoFileId,
      practitionerCategoryConceptId: practitioner.practitionerCategoryConceptId,
      verificationStatusConceptId: practitioner.verificationStatusConceptId,
      practiceStatusConceptId: practitioner.practiceStatusConceptId,
      acceptsNewPatients: practitioner.acceptsNewPatients ?? false,
      telehealthAvailable: practitioner.telehealthAvailable ?? false,
      specialties: specialties.map((specialty) => ({
        id: specialty.id,
        specialtyConceptId: specialty.specialtyConceptId,
        isPrimary: specialty.isPrimary ?? false,
        boardCertified: specialty.boardCertified ?? false,
        practiceScopeText: specialty.practiceScopeText,
        verificationStatusConceptId: specialty.verificationStatusConceptId,
        validFrom: specialty.validFrom,
        validTo: specialty.validTo,
      })),
      credentials: credentials.map((credential) => ({
        id: credential.id,
        credentialTypeConceptId: credential.credentialTypeConceptId,
        number: credential.number,
        issuingInstitutionText: credential.issuingInstitutionText,
        issueDate: credential.issueDate,
        expiryDate: credential.expiryDate,
        stateConceptId: credential.stateConceptId,
        verifiedAt: credential.verifiedAt,
        verificationSourceUri: credential.verificationSourceUri,
      })),
      licenses: licenses.map((license) => ({
        id: license.id,
        jurisdictionConceptId: license.jurisdictionConceptId,
        licenseNumber: license.licenseNumber,
        regulatoryAuthority: license.regulatoryAuthority,
        stateConceptId: license.stateConceptId,
        validFrom: license.validFrom,
        validTo: license.validTo,
      })),
      languages: languages.map((language) => ({
        languageConceptId: language.languageConceptId,
        proficiencyConceptId: language.proficiencyConceptId,
        clinicalInterpretationAllowed:
          language.clinicalInterpretationAllowed ?? false,
      })),
      affiliations: affiliations.map((row) => toAffiliation(row)),
      activity,
      createdAt: practitioner.createdAt,
    };
  }

  /**
   * Edita el propio perfil profesional — lo que faltaba para poder configurarlo.
   *
   * El alta escribía estos campos una sola vez y no había forma de volver a
   * tocarlos: un profesional no podía corregir su título, escribir su
   * presentación ni declarar que dejó de tomar pacientes sin que alguien
   * escribiera en la base.
   *
   * ## Sólo lo propio, y sólo la presentación
   *
   * El sujeto sale de la sesión, así que no hay forma de editar el de otro. Y
   * los campos editables son deliberadamente los de **presentación**: el estado
   * de verificación, el de práctica y las credenciales los mueve el trámite que
   * corresponde. Dejarlos acá convertiría el perfil en una declaración jurada de
   * uno mismo, que es exactamente lo contrario de lo que una matrícula
   * verificada significa.
   *
   * `PATCH`: lo que no viene no se toca. Un `''` sí borra — es una decisión de
   * quien edita, distinta de omitir el campo.
   *
   * @param dto - Los campos a cambiar.
   * @param actor - La sesión, que es también el sujeto.
   * @returns El perfil completo, ya actualizado.
   */
  async updateOwnPractitionerProfile(
    dto: UpdateOwnPractitionerProfileDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    this.logger.info(
      { operation: 'profiles.practitioner.updateOwn', actorId: actor.id },
      'Updating own practitioner profile',
    );

    await this.em.transactional(async (tx) => {
      const link = await this.accountLinksRepo.findActiveByUser(tx, actor.id);
      if (!link) {
        throw new PreconditionFailedException(
          'La cuenta no tiene una persona vinculada',
        );
      }
      const practitioner = await this.practitionersRepo.findById(
        tx,
        link.personId,
      );
      if (!practitioner) {
        throw new ResourceNotFoundException(
          'Perfil profesional no encontrado',
          {
            personId: link.personId,
          },
        );
      }

      // Campo por campo y con `!== undefined`: un `??` trataría `''` y `false`
      // como «no vino», y son justamente los dos valores que alguien manda
      // cuando quiere borrar su biografía o declarar que ya no toma pacientes.
      if (dto.professionalTitle !== undefined) {
        practitioner.professionalTitle = dto.professionalTitle;
      }
      if (dto.professionalBio !== undefined) {
        practitioner.professionalBio = dto.professionalBio;
      }
      if (dto.acceptsNewPatients !== undefined) {
        practitioner.acceptsNewPatients = dto.acceptsNewPatients;
      }
      if (dto.telehealthAvailable !== undefined) {
        practitioner.telehealthAvailable = dto.telehealthAvailable;
      }
      touch(practitioner, actor.id);
      await tx.flush();
    });

    // Se relee entero en vez de armar la respuesta con lo que se acaba de
    // escribir: así quien edita ve lo mismo que va a ver al recargar, incluidas
    // las colecciones y la actividad, que esta operación no toca.
    return this.getOwnPractitionerProfile(actor);
  }

  /**
   * Fija la foto del perfil profesional.
   *
   * ## El hueco que cierra
   *
   * `health_practitioner_profiles.photo_file_id` se **leía** —la ficha del
   * profesional y el listado de la guía lo devuelven— y no lo escribía nadie:
   * la columna existía, la FK existía, y no había forma de llenarla desde la
   * API. Un profesional no podía ponerse una foto.
   *
   * ## Qué se comprueba, y por qué cada cosa
   *
   * - **Quién pide.** El titular del perfil o la plataforma
   *   ({@link ProfileOwnershipService.assertOwnsPractitionerProfile}). La foto
   *   es la cara de quien ejerce: ponerle a un colega la imagen que uno elija
   *   es suplantación con otro nombre.
   * - **De quién es el archivo.** La misma regla que usa el muro social para la
   *   media de una publicación ({@link AttachableFileService}): sin ella, el
   *   `fileId` sería un uuid que el cliente declara, y cualquiera podría
   *   apuntar la foto de su perfil al documento de identidad de otra persona
   *   —que después se sirve a quien abra la ficha—.
   * - **Que sea una imagen.** El límite es el `mime_type` que quedó registrado
   *   al subir, deducido de los bytes y no del encabezado del cliente. Un PDF
   *   subido como `DOCUMENT` pasa las dos comprobaciones anteriores y no es una
   *   foto.
   *
   * ## Reemplazo
   *
   * Se cambia la referencia y nada más: el archivo anterior sigue vivo en
   * `common.files`, con sus versiones y sus vínculos. Borrarlo desde acá dejaría
   * colgado a cualquier otro uso del mismo archivo —el borrado de archivos tiene
   * su propio camino, con su borrado lógico—. Un `photo_file_id` que apunta a
   * una fila que ya no está sería justamente la referencia corrupta que el
   * contrato del carril prohíbe.
   *
   * @param profileId - Perfil profesional cuya foto se fija.
   * @param dto - El archivo ya subido que pasa a ser la foto.
   * @param actor - Quien pide la operación.
   * @returns El perfil releído, ya con su foto.
   * @throws ForbiddenException si no es el titular ni plataforma, o si el
   *   archivo lo subió otra persona.
   * @throws ResourceNotFoundException si el perfil o el archivo no existen.
   * @throws PreconditionFailedException si el archivo está borrado, sin versión
   *   vigente, infectado o no es una imagen.
   */
  async setPractitionerPhoto(
    profileId: string,
    dto: SetPractitionerPhotoDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    this.logger.info(
      {
        operation: 'profiles.practitioner.setPhoto',
        profileId,
        actorId: actor.id,
      },
      'Setting practitioner profile photo',
    );

    await this.em.transactional(async (tx) => {
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }
      // Dentro de la misma transacción que la escritura: comprobar contra un
      // estado y escribir sobre otro no comprueba nada.
      await this.attachableFiles.assertUsableBy(
        tx,
        dto.fileId,
        actor,
        {
          allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.IMAGE,
          operation: 'profiles.practitioner.setPhoto',
        },
        {
          subject: 'El archivo de la foto',
          notFound: 'El archivo de la foto no existe',
        },
      );
      practitioner.photoFileId = dto.fileId;
      touch(practitioner, actor.id);
      await tx.flush();
    });

    return this.getPractitionerSummary(profileId);
  }

  /**
   * Quita la foto del perfil profesional.
   *
   * Deja `photo_file_id` en nulo y no toca el archivo: quitar la foto de la
   * ficha es una decisión de presentación, borrar un archivo del almacenamiento
   * es otra cosa y tiene su propio camino. Es idempotente —quitar la foto de un
   * perfil que no tiene se responde igual—, porque el resultado que el cliente
   * pidió es el que queda.
   *
   * @param profileId - Perfil profesional cuya foto se quita.
   * @param actor - Quien pide la operación.
   * @returns El perfil releído, ya sin foto.
   * @throws ForbiddenException si no es el titular ni plataforma.
   * @throws ResourceNotFoundException si el perfil no existe.
   */
  async removePractitionerPhoto(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    this.logger.info(
      {
        operation: 'profiles.practitioner.removePhoto',
        profileId,
        actorId: actor.id,
      },
      'Removing practitioner profile photo',
    );

    await this.em.transactional(async (tx) => {
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }
      practitioner.photoFileId = undefined;
      touch(practitioner, actor.id);
      await tx.flush();
    });

    return this.getPractitionerSummary(profileId);
  }

  /**
   * Cuenta lo que el profesional dejó asentado, por el usuario que lo creó.
   *
   * Cuatro `count` y ni un `find`: no se trae ninguna fila, así que ningún dato
   * clínico de ningún paciente pasa por acá. Es lo que hace que este conteo sea
   * seguro de exponer en un perfil.
   *
   * @param em - Contexto de persistencia.
   * @param userId - La cuenta cuya actividad se cuenta.
   * @returns Las cuatro cifras de actividad.
   */
  private async countActivity(
    em: EntityManager,
    userId: string,
  ): Promise<PractitionerActivityDto> {
    const [encounters, medicationRequests, clinicalNotes, documents] =
      await Promise.all([
        em.count(Encounters, { createdByUserId: userId }),
        em.count(MedicationRequests, { createdByUserId: userId }),
        em.count(ClinicalNoteHeaders, { createdByUserId: userId }),
        em.count(DocumentRecords, { createdByUserId: userId }),
      ]);
    return { encounters, medicationRequests, clinicalNotes, documents };
  }

  /** UC-05-03: onboarding de profesional con su primera licencia y credencial de soporte. */
  async onboardPractitioner(
    dto: CreatePractitionerDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerResponseDto> {
    this.logger.info(
      { operation: 'profiles.practitioner.onboard', actorId: actor.id },
      'Onboarding practitioner',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.practitionersRepo.findByCode(
        tx,
        dto.practitionerCode,
      );
      if (clash) {
        throw new ConflictException('El practitioner_code ya está en uso', {
          practitionerCode: dto.practitionerCode,
        });
      }

      // Persona: reutilizar la indicada o crear una nueva.
      let personId = dto.personId;
      if (personId) {
        const existing = await this.personsRepo.findById(tx, personId);
        if (!existing)
          throw new ResourceNotFoundException('Persona no encontrada', {
            personId,
          });
      } else {
        const person = this.personsRepo.create(tx, {
          personStatusConceptId: PROF.PERSON_ACTIVE,
          vitalStatusConceptId: PROF.VITAL_ALIVE,
          displayName: dto.displayName,
          actorUserId: actor.id,
        });
        await tx.flush();
        personId = person.id;
      }

      // person_profiles clasifica a la persona (uq_person_profiles_person_type),
      // pero NO es el destino de la FK del subtipo: health_practitioner_profiles.profile_id
      // referencia profiles.persons(id), así que el perfil profesional usa person.id.
      this.personProfilesRepo.create(tx, {
        personId,
        profileTypeConceptId: PROF.PROFILE_TYPE_PRACTITIONER,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      const practitioner = this.practitionersRepo.create(tx, {
        profileId: personId,
        practitionerCode: dto.practitionerCode,
        practitionerCategoryConceptId:
          dto.practitionerCategoryConceptId ?? PROF.PRACT_CATEGORY_GENERAL,
        professionalTitle: dto.professionalTitle,
        professionalBio: dto.professionalBio,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        // Por defecto `false`: el alta arranca en onboarding y nadie debería
        // figurar como disponible antes de estar habilitado. Declararlo sí se
        // puede — sin eso, la única forma de dar de alta a alguien que sí toma
        // pacientes era escribir en la base a mano.
        acceptsNewPatients: dto.acceptsNewPatients ?? false,
        telehealthAvailable: dto.telehealthAvailable ?? false,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Licencia inicial (UC-05-04) + credencial de soporte (verificable UC-05-05).
      const license = this.authorizationsRepo.create(tx, {
        practitionerProfileId: personId,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        stateConceptId: PROF.AUTH_PENDING,
        actorUserId: actor.id,
      });
      const credential = this.credentialsRepo.create(tx, {
        practitionerProfileId: personId,
        credentialTypeConceptId:
          dto.credentialTypeConceptId ?? PROF.CREDENTIAL_TYPE_DEGREE,
        number: dto.credentialNumber,
        // Dónde y cuándo se cursó. Las dos columnas existían y ninguna
        // escritura las llenaba: la formación se guardaba sin decir de dónde
        // salía, que es justamente lo que la hace legible en un perfil.
        issuingInstitutionText: dto.credentialIssuingInstitutionText,
        issueDate:
          dto.credentialIssueDate === undefined
            ? undefined
            : new Date(dto.credentialIssueDate),
        stateConceptId: PROF.CRED_PENDING,
        actorUserId: actor.id,
      });
      this.languagesRepo.create(tx, {
        practitionerProfileId: personId,
        languageConceptId: dto.languageConceptId ?? PROF.LANGUAGE_SPANISH,
        proficiencyConceptId: PROF.LANG_PROFICIENCY_NATIVE,
        clinicalInterpretationAllowed: true,
        actorUserId: actor.id,
      });
      await this.declareSpecialties(
        tx,
        personId,
        dto.specialtyConceptIds ?? [],
        actor,
      );
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.practitioner.onboard', profileId: personId },
        'Practitioner onboarded',
      );
      return {
        profileId: practitioner.profileId,
        personId,
        practitionerCode: practitioner.practitionerCode,
        verificationStatus: practitioner.verificationStatusConceptId,
        practiceStatus: practitioner.practiceStatusConceptId,
        licenseId: license.id,
        credentialId: credential.id,
        createdAt: practitioner.createdAt,
      };
    });
  }

  /** UC-05-04: registra/renueva una autorización jurisdiccional (licencia). */
  async addJurisdictionAuthorization(
    profileId: string,
    dto: CreateJurisdictionAuthorizationDto,
    actor: AuthenticatedUser,
  ): Promise<JurisdictionAuthorizationResponseDto> {
    this.logger.info(
      { operation: 'profiles.authorization.add', profileId },
      'Adding jurisdiction authorization',
    );
    return this.em.transactional(async (tx) => {
      // El titular administra lo suyo: sin esto, un profesional auto-registrado no
      // podía crear la matrícula que su propia verificación exige.
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }

      const authorization = this.authorizationsRepo.create(tx, {
        practitionerProfileId: profileId,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        practiceScopeConceptId: dto.practiceScopeConceptId,
        stateConceptId: PROF.AUTH_ACTIVE,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: authorization.id,
        practitionerProfileId: profileId,
        licenseNumber: authorization.licenseNumber,
        state: authorization.stateConceptId,
        createdAt: authorization.createdAt,
      };
    });
  }

  /** UC-05-05: verifica (o rechaza) una credencial; recomputa el estado del profesional. */
  async verifyCredential(
    credentialId: string,
    dto: VerifyCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<CredentialResponseDto> {
    // Verificar una matrícula sin declarar contra QUÉ se verificó no es una
    // verificación: es una afirmación. Y de esta credencial depende que el
    // profesional quede habilitado para ejercer, así que la fuente consultada
    // -el registro del colegio médico, la resolución de la autoridad- es el
    // único rastro que permite auditar después si la habilitación era legítima.
    //
    // Rechazar sí puede ir sin fuente: se rechaza por defectos de forma del
    // propio documento, sin necesidad de consultar a nadie. Mismo criterio
    // asimétrico que `OutboxService.ackDelivery`, donde solo el acuse fallido
    // está obligado a declarar qué falló.
    if (dto.decision === 'VERIFIED' && !dto.verificationSourceUri?.trim()) {
      throw new PreconditionFailedException(
        'Una credencial verificada debe declarar la fuente consultada',
        { credentialId },
      );
    }

    this.logger.info(
      { operation: 'profiles.credential.verify', credentialId },
      'Verifying credential',
    );
    return this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findById(tx, credentialId);
      if (!credential) {
        throw new ResourceNotFoundException('Credencial no encontrada', {
          credentialId,
        });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'La credencial no está pendiente de verificación',
          {
            credentialId,
          },
        );
      }

      const now = new Date();
      const verified = dto.decision === 'VERIFIED';
      credential.stateConceptId = verified
        ? PROF.CRED_VERIFIED
        : PROF.CRED_REJECTED;
      credential.verifiedByUserId = actor.id;
      credential.verifiedAt = now;
      if (dto.verificationSourceUri)
        credential.verificationSourceUri = dto.verificationSourceUri;
      touch(credential, actor.id);

      // Si al verificar no quedan credenciales pendientes, habilita el perfil.
      let practitionerVerified = false;
      if (verified) {
        const pending = await this.credentialsRepo.countInStateExcept(
          tx,
          credential.practitionerProfileId,
          PROF.CRED_PENDING,
          credentialId,
        );
        if (pending === 0) {
          const practitioner = await this.practitionersRepo.findById(
            tx,
            credential.practitionerProfileId,
          );
          if (practitioner) {
            practitioner.verificationStatusConceptId =
              PROF.PRACT_VERIF_VERIFIED;
            practitioner.practiceStatusConceptId = PROF.PRACTICE_ACTIVE;
            practitioner.acceptsNewPatients = true;
            touch(practitioner, actor.id);
            practitionerVerified = true;

            // Habilitado para ejercer y sin rol con el que hacerlo es un estado
            // que no sirve a nadie: hasta aquí, el profesional recién verificado
            // seguía recibiendo 403 en todo endpoint clínico porque su token
            // sólo llevaba `USER`. Se le concede `PRACTITIONER`, que es
            // exactamente lo que la verificación acaba de acreditar; los roles
            // más específicos (`SURGEON`, `ANESTHESIOLOGIST`…) siguen siendo
            // decisión explícita de un administrador, porque la matrícula no
            // dice en qué equipo trabaja.
            //
            // Es fail-closed: el rol llega tras una verificación con fuente
            // declarada, no por el mero hecho de registrarse.
            const link = await this.accountLinksRepo.findActiveByPerson(
              tx,
              credential.practitionerProfileId,
            );
            if (link) {
              const granted = await this.effectiveRoles.ensureRoleByCode(
                tx,
                link.userId,
                'PRACTITIONER',
                { tenantId: getCurrentTenantId(), actorUserId: actor.id },
              );
              if (!granted) {
                // No se rompe la verificación —que es correcta— pero tampoco se
                // oculta: sin el catálogo de roles sembrado, el profesional
                // quedará verificado y sin poder ejercer.
                this.logger.warn(
                  {
                    operation: 'profiles.credential.verify',
                    practitionerProfileId: credential.practitionerProfileId,
                    roleCode: 'PRACTITIONER',
                  },
                  'Profesional verificado sin rol asistencial: el rol no existe o no es asignable',
                );
              }
            }
          }
        }
      }
      await tx.flush();

      return {
        id: credential.id,
        state: credential.stateConceptId,
        verifiedAt: credential.verifiedAt,
        practitionerVerified,
      };
    });
  }

  /** UC-05-06: agrega una especialidad con credencial de soporte verificada. */
  /**
   * Deja declaradas las especialidades que vinieron con el alta.
   *
   * Va **dentro de la transacción del registro** y no como llamadas sueltas
   * después: es la regla 11 del modelo —el alta de un profesional es atómica—,
   * y además es lo único que permite elegir la especialidad al registrarse, que
   * es cuando la persona la tiene presente. Si una no pertenece al catálogo, el
   * alta entera se rechaza: registrar a medias a un profesional con una
   * especialidad inventada es peor que pedirle que la corrija.
   *
   * La primera de la lista queda como principal. No hay «cuál es la principal»
   * en el alta a propósito: quien se registra ordena sus especialidades, y la
   * primera es la que da la respuesta obvia a «¿de qué sos?».
   *
   * @param tx - La transacción del alta.
   * @param profileId - El perfil profesional recién creado.
   * @param specialtyConceptIds - Los conceptos declarados, ya sin repetidos.
   * @param actor - Quién registra, para la autoría de las filas.
   */
  private async declareSpecialties(
    tx: EntityManager,
    profileId: string,
    specialtyConceptIds: readonly string[],
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (specialtyConceptIds.length === 0) return;

    const unicas = [...new Set(specialtyConceptIds)];
    if (unicas.length > MAX_SPECIALTIES_PER_PRACTITIONER) {
      throw new PreconditionFailedException(
        `Un profesional puede declarar hasta ${MAX_SPECIALTIES_PER_PRACTITIONER} especialidades`,
        { declaradas: unicas.length },
      );
    }

    const ahora = new Date();
    for (const [orden, specialtyConceptId] of unicas.entries()) {
      await this.specialtyCatalog.assertIsMedicalSpecialty(
        tx,
        specialtyConceptId,
      );
      this.specialtiesRepo.create(tx, {
        practitionerProfileId: profileId,
        specialtyConceptId,
        isPrimary: orden === 0,
        boardCertified: false,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        validFrom: ahora,
        actorUserId: actor.id,
      });
    }
  }

  async addSpecialty(
    profileId: string,
    dto: AddSpecialtyDto,
    actor: AuthenticatedUser,
  ): Promise<SpecialtyResponseDto> {
    this.logger.info(
      { operation: 'profiles.specialty.add', profileId },
      'Adding specialty',
    );
    return this.em.transactional(async (tx) => {
      // El titular administra lo suyo: sin esto, un profesional auto-registrado no
      // podía crear la matrícula que su propia verificación exige.
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }

      if (dto.supportingCredentialId) {
        const credential = await this.credentialsRepo.findById(
          tx,
          dto.supportingCredentialId,
        );
        if (!credential || credential.practitionerProfileId !== profileId) {
          throw new PreconditionFailedException(
            'La credencial de soporte no pertenece al profesional',
            { supportingCredentialId: dto.supportingCredentialId },
          );
        }
        if (credential.stateConceptId !== PROF.CRED_VERIFIED) {
          throw new PreconditionFailedException(
            'La credencial de soporte no está verificada',
            {
              supportingCredentialId: dto.supportingCredentialId,
            },
          );
        }
      }

      // Omitir la especialidad ya no cae en «medicina general»: ese concepto
      // venía de un catálogo paralelo de la API que NINGUNA fila usa, así que
      // el default escribía en silencio una especialidad fuera del catálogo del
      // modelo. Si no se dice cuál, no hay especialidad que registrar.
      const specialtyConceptId = dto.specialtyConceptId;
      if (specialtyConceptId === undefined) {
        throw new PreconditionFailedException('Falta indicar la especialidad', {
          profileId,
        });
      }
      await this.specialtyCatalog.assertIsMedicalSpecialty(
        tx,
        specialtyConceptId,
      );

      // El tope es del registro del cliente, y se cuenta sobre las VIGENTES:
      // una especialidad dada de baja no debería ocupar un lugar para siempre.
      const vigentes = await this.specialtiesRepo.findAllByPractitioner(
        tx,
        profileId,
      );
      const activas = vigentes.filter((especialidad) => !especialidad.validTo);
      if (activas.length >= MAX_SPECIALTIES_PER_PRACTITIONER) {
        throw new PreconditionFailedException(
          `Un profesional puede declarar hasta ${MAX_SPECIALTIES_PER_PRACTITIONER} especialidades`,
          { profileId, activas: activas.length },
        );
      }

      const duplicate = await this.specialtiesRepo.findActive(
        tx,
        profileId,
        specialtyConceptId,
      );
      if (duplicate) {
        throw new ConflictException(
          'El profesional ya tiene esa especialidad activa',
          {
            profileId,
            specialtyConceptId,
          },
        );
      }

      const now = new Date();
      if (dto.isPrimary) {
        await this.specialtiesRepo.demotePrimary(tx, profileId, now);
      }

      const specialty = this.specialtiesRepo.create(tx, {
        practitionerProfileId: profileId,
        specialtyConceptId,
        supportingCredentialId: dto.supportingCredentialId,
        specialtyRoleConceptId: dto.specialtyRoleConceptId,
        isPrimary: dto.isPrimary ?? false,
        boardCertified: dto.boardCertified ?? false,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        validFrom: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: specialty.id,
        specialtyConceptId: specialty.specialtyConceptId,
        isPrimary: specialty.isPrimary ?? false,
        verificationStatus: specialty.verificationStatusConceptId,
        createdAt: specialty.createdAt,
      };
    });
  }

  /* -- UC-05-16: historial laboral del profesional -------------------------- */

  /**
   * El historial laboral propio (UC-05-16·L).
   *
   * Autoservicio: el sujeto sale de la sesión. El módulo ya sabía dónde se
   * **formó** el profesional (`professional_credentials`) y qué puede
   * **ejercer** (licencias y especialidades), pero no dónde **trabajó**, que es
   * lo que el cliente pidió por nombre —«hospitales o entidades médicas»—.
   *
   * @param actor - Quien consulta su propio historial.
   * @returns Sus afiliaciones, de la más reciente a la más antigua.
   */
  async listOwnAffiliations(
    actor: AuthenticatedUser,
  ): Promise<ListAffiliationsResponseDto> {
    const em = this.em.fork();
    const profileId = await this.ownership.requireOwnPractitionerProfileId(
      em,
      actor,
    );
    const rows = await this.affiliationsRepo.findByPractitioner(em, profileId);
    const items = rows.map((row) => toAffiliation(row));
    return { items, count: items.length };
  }

  /**
   * Agrega una afiliación institucional al historial propio (UC-05-16).
   *
   * Dos reglas, y ninguna es de prudencia genérica:
   *
   * - **El fin no puede preceder al inicio.** Un período invertido no es un dato
   *   dudoso, es un dato imposible, y ordenar el currículum por fecha lo
   *   colocaría en cualquier lado.
   * - **Misma institución, mismo cargo y mismo inicio responde `409`.** Volver a
   *   trabajar en el mismo hospital años después es cierto y se registra; lo que
   *   se rechaza es el doble envío del formulario, que se distingue por empezar
   *   el mismo día.
   *
   * Lo que **no** se valida es que la institución exista en la plataforma: la
   * mayoría no está, y exigirlo convertiría un dato de currículum en un alta de
   * organizaciones.
   *
   * @param dto - Institución, cargo y período.
   * @param actor - El profesional titular del historial.
   * @returns La afiliación registrada.
   */
  async addOwnAffiliation(
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (endDate && endDate < startDate) {
      throw new PreconditionFailedException(
        'El fin del vínculo no puede ser anterior a su inicio',
        { startDate: dto.startDate, endDate: dto.endDate },
      );
    }

    this.logger.info(
      { operation: 'profiles.affiliation.add', actorId: actor.id },
      'Adding practitioner affiliation',
    );
    return this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );

      const organizationName = dto.organizationName.trim();
      const roleTitle = dto.roleTitle.trim();
      const duplicate = await this.affiliationsRepo.findSame(
        tx,
        profileId,
        organizationName,
        roleTitle,
        startDate,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ese vínculo ya está en el historial laboral',
          { organizationName, roleTitle, startDate: dto.startDate },
        );
      }

      const affiliation = this.affiliationsRepo.create(tx, {
        practitionerProfileId: profileId,
        organizationName,
        roleTitle,
        departmentText: dto.departmentText?.trim() || undefined,
        practiceSiteId: dto.practiceSiteId,
        affiliationTypeConceptId:
          dto.affiliationTypeConceptId ?? PROF.AFFILIATION_TYPE_EMPLOYMENT,
        startDate,
        endDate,
        statusConceptId: PROF.AFFILIATION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'profiles.affiliation.add',
          affiliationId: affiliation.id,
        },
        'Practitioner affiliation added',
      );
      return toAffiliation(affiliation);
    });
  }
}

/**
 * Proyecta la fila al contrato de lectura.
 *
 * `current` se deriva acá y no se guarda: una columna «sigue trabajando ahí»
 * sería un dato que envejece solo y que habría que recalcular cada vez que
 * alguien cierra un período. La fecha ya lo dice.
 */
function toAffiliation(row: PractitionerAffiliations): AffiliationResponseDto {
  return {
    id: row.id,
    practitionerProfileId: row.practitionerProfileId,
    organizationName: row.organizationName,
    roleTitle: row.roleTitle,
    departmentText: row.departmentText ?? null,
    practiceSiteId: row.practiceSiteId ?? null,
    affiliationTypeConceptId: row.affiliationTypeConceptId ?? null,
    startDate: row.startDate,
    endDate: row.endDate ?? null,
    current: row.endDate === undefined || row.endDate === null,
    status: row.statusConceptId,
    createdAt: row.createdAt,
  };
}
