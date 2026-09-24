import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
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
import { PracticeSites } from '../../practice/entities';
import { esEstado } from './profiles-affiliations.service';
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
// Misma licencia que las cuentas de actividad: se importan las ENTIDADES de
// `scheduling` y no su servicio, y lo único que se hace con ellas es contar
// filtrando por el perfil del propio actor. No sale ni una fila de agenda de
// nadie, y `profiles` no queda atado al módulo entero para responder «¿ya
// publicó horarios?».
import { BookableSlots, SchedulableResources } from '../../scheduling/entities';
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
  UpdateAffiliationDto,
  PractitionerProfileSummaryDto,
  PractitionerActivityDto,
  UpdateOwnPractitionerProfileDto,
  ListPractitionersResponseDto,
  ListSpecialtyCountsResponseDto,
  SetPractitionerPhotoDto,
  AddOwnCredentialDto,
  OwnCredentialResponseDto,
  UpdateOwnCredentialDto,
} from '../dto';
import { AttachableFileService } from '../../common/services';
import {
  AddressesRepository,
  ContactPointsRepository,
} from '../../common/repositories';
import { Identifiers } from '../../common/entities';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import { composeAccountDisplayName } from '../person-name';
import {
  replaceResidenceAddress,
  summarizeAddress,
  type AddressSummary,
} from '../../common/services/residence-address';
import { aplicarOcupacion, aplicarEmpresa } from '../person-work-fields';
import { ProfileOwnershipService } from './profile-ownership.service';
import { ProfilesAffiliationsService } from './profiles-affiliations.service';

/**
 * Casos de uso de la fuerza laboral de salud (regla GENERALIST): onboarding
 * (UC-05-03), autorización jurisdiccional (UC-05-04), verificación de credencial
 * (UC-05-05) y alta de especialidad (UC-05-06).
 *
 * Todas las escrituras son `em.transactional` con `flush` padre-antes-de-hijo,
 * porque las FK son columnas uuid planas y MikroORM no ordena inserts.
 */
/**
 * La actividad de un perfil sin cuenta vinculada, y el vacío con el que se
 * responde si el conteo no se pudo hacer. Cero es un dato legítimo acá: un
 * perfil dado de alta por la organización nunca escribió nada.
 */
/* --- los cuatro contactos que el registro del médico pide por separado ------
   Cada uno es una fila de `common.contact_points` identificada por su par
   sistema × uso. Viven como constantes con nombre para que la edición del
   perfil y el alta escriban exactamente el mismo par: si divergieran, el
   perfil leería un contacto que el alta guardó en otro lado. */

/** Correo personal: el que no sirve para entrar. */
const PAR_CORREO_PERSONAL = {
  systemConceptId: CONCEPTS.CONTACT_EMAIL,
  useConceptId: CONCEPTS.CONTACT_USE_HOME,
} as const;

/** Celular personal o privado. */
const PAR_CELULAR_PERSONAL = {
  systemConceptId: CONCEPTS.CONTACT_MOBILE,
  useConceptId: CONCEPTS.CONTACT_USE_HOME,
} as const;

/** Celular del lugar de trabajo. */
const PAR_CELULAR_TRABAJO = {
  systemConceptId: CONCEPTS.CONTACT_MOBILE,
  useConceptId: CONCEPTS.CONTACT_USE_WORK,
} as const;

/** Teléfono fijo del lugar de trabajo. */
const PAR_FIJO_TRABAJO = {
  systemConceptId: CONCEPTS.CONTACT_PHONE,
  useConceptId: CONCEPTS.CONTACT_USE_WORK,
} as const;

const SIN_ACTIVIDAD: PractitionerActivityDto = {
  encounters: 0,
  medicationRequests: 0,
  clinicalNotes: 0,
  documents: 0,
};

/**
 * Los estados de vínculo que la guía puede mostrar.
 *
 * `DECLARADO` entra a propósito: los hospitales públicos y las cajas del padrón
 * nunca van a registrarse en la plataforma, así que nadie va a aprobar a sus
 * médicos —esperar esa aprobación los dejaría sin sede para siempre—. Lo que no
 * entra es `PENDIENTE`: decir que alguien atiende en una organización que
 * todavía no lo aceptó es afirmar algo que la organización no dijo (TP-2).
 */
const ESTADOS_PUBLICABLES = [
  PROF.AFFILIATION_DECLARED,
  PROF.AFFILIATION_APPROVED,
] as const;

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
    // TP-2: con qué estado nace un vínculo y cuáles se le pueden mostrar a un
    // tercero se deciden en un solo lugar.
    private readonly affiliations: ProfilesAffiliationsService,
    private readonly attachableFiles: AttachableFileService,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
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

    // `true`: es la única lectura donde el correo y el teléfono salen. La
    // ficha que abre la guía usa el mismo DTO y NO los lleva.
    return this.buildSummary(em, link.personId, actor.id, true);
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

    // Tener el recurso no es tener agenda. El asistente crea el recurso en su
    // primer paso, así que darlo por «horarios publicados» daba por completa el
    // alta de alguien a quien todavía no se le puede pedir turno — que es
    // exactamente lo que este paso existe para evitar. Se cuentan todos los
    // cupos y no sólo los futuros: si vencieran, un alta ya terminada volvería
    // a mostrarse incompleta sola, y la agenda vencida es otro aviso, con su
    // propia superficie.
    const cupos =
      recursos.length === 0
        ? 0
        : await em.count(BookableSlots, {
            resourceId: { $in: recursos.map((recurso) => recurso.id) },
          });

    const tieneFoto =
      perfil.photoFileId !== undefined && perfil.photoFileId !== null;

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
        // `!== undefined` no alcanza: la columna es nullable y MikroORM la
        // hidrata como `null`, así que un profesional SIN foto daba el paso por
        // cumplido —«Tu foto: completado» con `photo_file_id` en NULL, visto en
        // pantalla—. Se comprueba la ausencia real, que son los dos valores.
        complete: tieneFoto,
        missing: tieneFoto ? [] : ['photo'],
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
        complete: cupos > 0,
        missing:
          cupos > 0
            ? []
            : recursos.length === 0
              ? ['published-schedule']
              : ['slots'],
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
   * ## La verificación se MUESTRA, no excluye (revierte la #12/#13)
   *
   * La guía filtraba por `PRACT_VERIF_VERIFIED` para no presentar como
   * elegible a quien no probó su matrícula. El argumento seguía en pie; el
   * problema fue el efecto: un perfil nace `PRACT_VERIF_PENDING` por diseño
   * —«registrarse es declarar una matrícula, no probarla»— y verificarlo exige
   * que una autoridad valide la licencia. Con el padrón cargado, eso dejaba la
   * guía **vacía** fuera de DEV: 835 de 836 profesionales pendientes, y la
   * pantalla entera sostenida por `DEV_VERIFICATION_BYPASS`. Una guía que sólo
   * existe en desarrollo no es una guía.
   *
   * Un padrón publica a quien existe; el sello distingue a quien además probó
   * su matrícula. Por eso cada fila viaja con `verified`, que es lo que la
   * tarjeta dibuja — exactamente el «badge informativo» que la nota anterior
   * ya proponía—. Excluir y no decirlo era la peor de las dos: el paciente no
   * veía la diferencia porque no veía a nadie.
   *
   * @param options - Filtro por especialidad, cursor y tope de página.
   * @returns Página de la guía con el cursor de la siguiente.
   */
  /**
   * Cuántos profesionales visibles ejerce cada especialidad (portada de la guía).
   *
   * Se apoya en los MISMOS dos filtros que {@link listPractitioners} —perfil
   * verificado, salvo bypass; especialidad vigente— y por eso el número de una
   * tarjeta es exactamente el largo de la lista que abre. Cualquier atajo que
   * los separe reintroduce el defecto de contar una cosa y mostrar otra.
   *
   * El cruce se hace en memoria y no en SQL a propósito: ningún repositorio del
   * proyecto usa agregaciones, y las dos lecturas que esto reemplaza son
   * **menos** trabajo que lo que hacía el front —paginar la guía entera sólo
   * para contar—.
   *
   * @returns Una fila por especialidad con gente, más el total sin repetir.
   */
  async countPractitionersBySpecialty(): Promise<ListSpecialtyCountsResponseDto> {
    const em = this.em.fork();

    // Mismo criterio que el listado —y esto es lo que sostiene el contrato de
    // que la tarjeta y la lista digan el mismo número—: sin filtro.
    const verificationStatusConceptId = undefined;

    const [visibleIds, pairs] = await Promise.all([
      this.practitionersRepo.findVisibleProfileIds(
        em,
        verificationStatusConceptId,
      ),
      this.specialtiesRepo.findCurrentSpecialtyPairs(em),
    ]);

    const visibles = new Set(visibleIds);
    // Por especialidad, los profesionales SIN repetir: una fila por cada
    // vigencia haría contar dos veces a quien la recertificó.
    const porEspecialidad = new Map<string, Set<string>>();
    for (const par of pairs) {
      if (!visibles.has(par.practitionerProfileId)) continue;
      const gente =
        porEspecialidad.get(par.specialtyConceptId) ?? new Set<string>();
      gente.add(par.practitionerProfileId);
      porEspecialidad.set(par.specialtyConceptId, gente);
    }

    // Los que no declaran ninguna especialidad vigente. Sin este número la
    // portada no puede ofrecerlos, y quien entra por especialidad no llega
    // jamás a un profesional que no tiene ninguna —que es como nace todo el
    // que se registra solo, médicos con cuenta incluidos—.
    const conEspecialidad = new Set(
      pairs
        .filter((par) => visibles.has(par.practitionerProfileId))
        .map((par) => par.practitionerProfileId),
    );
    const withoutSpecialtyCount = [...visibles].filter(
      (id) => !conEspecialidad.has(id),
    ).length;

    const items = [...porEspecialidad.entries()]
      .map(([specialtyConceptId, gente]) => ({
        specialtyConceptId,
        practitionerCount: gente.size,
      }))
      // De mayor a menor, y a igualdad por concepto para que el orden sea
      // estable entre llamadas: quien dibuja decide cómo mostrarlo, pero no
      // debería ver bailar las tarjetas.
      .sort(
        (a, b) =>
          b.practitionerCount - a.practitionerCount ||
          a.specialtyConceptId.localeCompare(b.specialtyConceptId),
      );

    return { items, practitionerTotal: visibles.size, withoutSpecialtyCount };
  }

  async listPractitioners(options: {
    /** Sólo perfiles que ejercen esta especialidad hoy. */
    specialtyConceptId?: string;
    /**
     * Sólo los que **no** declaran ninguna especialidad vigente.
     *
     * Es el complemento de `specialtyConceptId`, no un filtro más: sin él, un
     * profesional sin especialidad no es alcanzable desde una guía que se
     * recorre por especialidad — y así nace todo el que se registra solo.
     */
    withoutSpecialty?: boolean;
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
    if (options.withoutSpecialty === true) {
      const [visibles, pares] = await Promise.all([
        this.practitionersRepo.findVisibleProfileIds(em, undefined),
        this.specialtiesRepo.findCurrentSpecialtyPairs(em),
      ]);
      const conEspecialidad = new Set(
        pares.map((par) => par.practitionerProfileId),
      );
      profileIds = visibles.filter((id) => !conEspecialidad.has(id));
      if (profileIds.length === 0) {
        return { items: [], count: 0, limit: options.limit, nextCursor: null };
      }
    } else if (options.specialtyConceptId !== undefined) {
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

    // Sin filtro de verificación: la guía lista el padrón entero y cada fila
    // dice si está verificada. Ver el JSDoc del método.
    const verificationStatusConceptId = undefined;

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
    const [persons, specialties, affiliations] = await Promise.all([
      this.personsRepo.findByIds(em, pageIds),
      this.specialtiesRepo.findByPractitioners(em, pageIds),
      // Dónde atiende cada uno. En lote y no de a uno: pedirlas por fila serían
      // cincuenta consultas por página.
      this.affiliationsRepo.findByPractitioners(em, pageIds, [
        ...ESTADOS_PUBLICABLES,
      ]),
    ]);

    // Por profesional, sin repetir. El padrón trae la misma sede escrita de dos
    // formas para el mismo médico —«CLINICA DE LAS AMERICAS» y «CLINICA
    // METROPOLITANA DE LAS AMERICAS»—, así que esto deduplica lo idéntico y
    // nada más: colapsar variantes exigiría normalizar los nombres, que es otro
    // trabajo y no se hace a ciegas acá.
    const workplacesByProfile = new Map<string, string[]>();
    for (const afiliacion of affiliations) {
      const nombre = afiliacion.organizationName?.trim();
      if (!nombre) continue;
      const lugares =
        workplacesByProfile.get(afiliacion.practitionerProfileId) ?? [];
      if (!lugares.includes(nombre)) {
        lugares.push(nombre);
      }
      workplacesByProfile.set(afiliacion.practitionerProfileId, lugares);
    }

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
        // Resuelto acá y no en el front: comparar contra el uuid del concepto
        // exigiría llevarlo escrito en el cliente, que es el literal mágico
        // que este proyecto prohíbe.
        verified: row.verificationStatusConceptId === PROF.PRACT_VERIF_VERIFIED,
        acceptsNewPatients: row.acceptsNewPatients ?? false,
        telehealthAvailable: row.telehealthAvailable ?? false,
        specialties: specialtiesByProfile.get(row.profileId) ?? [],
        workplaces: workplacesByProfile.get(row.profileId) ?? [],
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
   * Deja vigente el teléfono nuevo y cierra el anterior.
   *
   * No se edita la fila: `common.contact_points` lleva vigencia, así que
   * cambiar el valor en su lugar borraría el historial de por dónde se lo pudo
   * contactar antes. Se cierra el vigente y se abre otro — mismos dueño,
   * sistema y uso que escribe el alta del profesional (`CONTACT_USE_WORK`: el
   * teléfono que declara es el de su consulta).
   *
   * Una cadena vacía cierra el vigente y no abre ninguno: es cómo se borra.
   */
  private async reemplazarTelefono(
    tx: EntityManager,
    personId: string,
    telefono: string,
    actorUserId: string,
    ahora: Date,
  ): Promise<void> {
    await this.reemplazarContacto(tx, personId, telefono, actorUserId, ahora, {
      systemConceptId: CONCEPTS.CONTACT_PHONE,
      useConceptId: CONCEPTS.CONTACT_USE_WORK,
    });
  }

  /**
   * Deja vigente el contacto nuevo de un par sistema × uso y cierra el anterior.
   *
   * Es {@link reemplazarTelefono} generalizado: desde que el alta pide correo y
   * celular personales además de los del trabajo, «el teléfono de esta persona»
   * dejó de ser uno solo. El uso entra en la búsqueda para que cambiar el
   * celular personal no cierre el de trabajo, que es lo que pasaría buscando
   * sólo por sistema.
   *
   * Una cadena vacía cierra el vigente y no abre ninguno: es cómo se borra.
   *
   * @param tx - Transacción activa.
   * @param personId - Persona dueña del contacto.
   * @param valor - Valor declarado; vacío borra.
   * @param actorUserId - Quién hace el cambio.
   * @param ahora - Instante del cambio, para la vigencia.
   * @param par - Sistema y uso que identifican al contacto.
   */
  private async reemplazarContacto(
    tx: EntityManager,
    personId: string,
    valor: string,
    actorUserId: string,
    ahora: Date,
    par: { systemConceptId: string; useConceptId: string },
  ): Promise<void> {
    const nuevo = valor.trim() === '' ? undefined : valor.trim();
    const vigente = await this.contactPointsRepo.findVigenteByOwnerSystemAndUse(
      tx,
      personId,
      par.systemConceptId,
      par.useConceptId,
    );

    if (nuevo === undefined) {
      if (vigente)
        this.contactPointsRepo.closeVigente(vigente, ahora, actorUserId);
      return;
    }
    if (vigente?.value === nuevo) return;
    if (vigente)
      this.contactPointsRepo.closeVigente(vigente, ahora, actorUserId);

    this.contactPointsRepo.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
      ownerId: personId,
      systemConceptId: par.systemConceptId,
      value: nuevo,
      useConceptId: par.useConceptId,
      actorUserId,
    });
  }

  /**
   * Corrige el domicilio: municipio, calle y coordenadas, lo que haya venido
   * en el `PATCH`. Cierra la fila vigente y abre otra —o no hace nada si, tras
   * mezclar con lo vigente, nada cambió—.
   *
   * ALV-009: antes sólo tocaba el municipio (`createResidenceAddress` del
   * alta no admite corregir); ahora delega en `replaceResidenceAddress`,
   * mismo criterio que ya tenía `ProfilesPatientsService.reemplazarDireccion`.
   */
  private async reemplazarDireccion(
    tx: EntityManager,
    personId: string,
    useConceptId: string,
    cambios: {
      municipalityConceptId?: string;
      lines?: string;
      /** `null` en las dos quita el punto. Ver `ReplaceResidenceAddressData`. */
      latitude?: number | null;
      longitude?: number | null;
    },
    actorUserId: string,
    ahora: Date,
  ): Promise<void> {
    await replaceResidenceAddress(
      this.addressesRepo,
      tx,
      this.catalogConceptsRepo,
      {
        personId,
        useConceptId,
        municipalityConceptId: cambios.municipalityConceptId,
        lines: cambios.lines,
        latitude: cambios.latitude,
        longitude: cambios.longitude,
        actorUserId,
      },
      ahora,
    );
  }

  /**
   * El documento de identidad y las dos direcciones de contacto (domicilio y
   * trabajo, con coordenadas si se declararon).
   *
   * El alta escribe estos datos y ninguno volvía en la ficha. Van juntos en una
   * lectura porque se piden a la vez y ninguno depende del otro; y devuelve un
   * objeto vacío en vez de fallar, para que la envoltura `sinTumbarLaFicha`
   * tenga algo neutro con lo que seguir.
   */
  private async leerDocumentoYDirecciones(
    em: EntityManager,
    personId: string,
  ): Promise<{
    nationalId?: string;
    issuerArea?: string;
    municipio?: string;
    homeAddress?: AddressSummary;
    workAddress?: AddressSummary;
  }> {
    const [documentos, domicilio, trabajo] = await Promise.all([
      em.find(Identifiers, { ownerId: personId, validTo: null }),
      this.addressesRepo.findVigenteByOwnerAndUse(
        em,
        personId,
        CONCEPTS.ADDR_USE_HOME,
      ),
      this.addressesRepo.findVigenteByOwnerAndUse(
        em,
        personId,
        CONCEPTS.ADDR_USE_WORK,
      ),
    ]);
    const documento = documentos.find(
      (d: Identifiers) => d.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    return {
      nationalId: documento?.value,
      issuerArea: documento?.issuerAdministrativeAreaConceptId,
      municipio: domicilio?.municipalityConceptId,
      homeAddress: summarizeAddress(domicilio),
      workAddress: summarizeAddress(trabajo),
    };
  }

  /**
   * Arma el summary de un perfil ya identificado.
   *
   * Compartido entre la lectura propia y la ajena: el contrato es el mismo y
   * lo único que cambia es cómo se resolvió `personId` (sesión o parámetro).
   *
   * ## El contacto no viaja en la ficha ajena
   *
   * `incluyeContacto` es el único punto donde las dos lecturas dejan de ser la
   * misma. El correo y el teléfono viven en `common.contact_points`, son datos
   * de la persona y no de los que una guía médica publica; se leen sólo cuando
   * quien pregunta es el titular. La ficha ajena ni siquiera los consulta —no
   * se envían y después se ocultan, que es la forma de que un día se escapen.
   *
   * @param em - Contexto de persistencia.
   * @param personId - El titular del perfil (= profileId del profesional).
   * @param subjectUserId - La cuenta cuya actividad se cuenta, si hay.
   * @param incluyeContacto - Si se leen correo y teléfono. Sólo la propia.
   * @returns El perfil completo.
   */
  private async buildSummary(
    em: EntityManager,
    personId: string,
    subjectUserId: string | undefined,
    incluyeContacto = false,
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
    // Cada pieza del perfil se lee **sin poder tumbar a las demás** (F-18,
    // 18/08/2026). La ficha de la Guía devolvía 500 —con código de soporte a la
    // vista del paciente— en cuanto una de estas seis lecturas fallaba sobre un
    // perfil pelado, que es justo como quedan los del seeder técnico: sin
    // credenciales, sin especialidad, sin foto. Un perfil incompleto es un
    // perfil que se muestra incompleto, no un error: la pantalla ya sabe pintar
    // vacíos dignos. Lo que no puede faltar —la persona y su perfil— sigue
    // cortando arriba con 404.
    const [
      specialties,
      credentials,
      licenses,
      languages,
      affiliations,
      activity,
      contactos,
      filiacion,
    ] = await Promise.all([
      this.sinTumbarLaFicha(
        () => this.specialtiesRepo.findAllByPractitioner(em, profileId),
        [],
        { profileId, pieza: 'especialidades' },
      ),
      this.sinTumbarLaFicha(
        () => this.credentialsRepo.findByPractitioner(em, profileId),
        [],
        { profileId, pieza: 'credenciales' },
      ),
      this.sinTumbarLaFicha(
        () => this.authorizationsRepo.findByPractitioner(em, profileId),
        [],
        { profileId, pieza: 'matrículas' },
      ),
      this.sinTumbarLaFicha(
        () => this.languagesRepo.findByPractitioner(em, profileId),
        [],
        { profileId, pieza: 'idiomas' },
      ),
      // TP-2: el titular ve su trayectoria entera —incluida la solicitud que
      // mandó y todavía nadie aceptó, que si no no sabría que la mandó—; quien
      // mira la ficha de un colega ve sólo los vínculos aprobados. Decir que
      // alguien trabaja en una clínica que no lo aceptó es afirmar algo falso,
      // y era lo que esta lectura hacía.
      //
      // Va envuelta como las otras cinco (F-18): las dos correcciones son
      // independientes —una elige QUÉ vínculos se ven, la otra impide que esa
      // lectura tumbe la ficha entera— y quedarse con una sola habría
      // reintroducido el defecto de la otra.
      this.sinTumbarLaFicha(
        () =>
          subjectUserId === undefined
            ? this.affiliations.visiblesDeTerceros(em, profileId)
            : this.affiliationsRepo.findByPractitioner(em, profileId),
        [],
        { profileId, pieza: 'afiliaciones' },
      ),
      subjectUserId === undefined
        ? Promise.resolve(SIN_ACTIVIDAD)
        : this.sinTumbarLaFicha(
            () => this.countActivity(em, subjectUserId),
            SIN_ACTIVIDAD,
            { profileId, pieza: 'actividad' },
          ),
      // El contacto: sólo en la lectura propia, y envuelto como las demás. Un
      // fallo leyendo `common.contact_points` deja el perfil sin correo, no
      // sin perfil.
      incluyeContacto
        ? this.sinTumbarLaFicha(
            () => this.contactPointsRepo.findVigentesByOwner(em, person.id),
            [],
            { profileId, pieza: 'contacto' },
          )
        : Promise.resolve([]),
      // El documento y las direcciones: sólo en la lectura propia y envueltos
      // como el resto. Un fallo acá deja la ficha sin esos datos, no sin ficha.
      incluyeContacto
        ? this.sinTumbarLaFicha(
            () => this.leerDocumentoYDirecciones(em, person.id),
            {},
            { profileId, pieza: 'filiación' },
          )
        : Promise.resolve(
            {} as Awaited<ReturnType<typeof this.leerDocumentoYDirecciones>>,
          ),
    ]);

    // El primero de cada sistema gana: el repositorio ya los devuelve por
    // `rank`, que es la columna que dice cuál es el preferido.
    const contacto = (sistema: string): string | undefined =>
      contactos.find((punto) => punto.systemConceptId === sistema)?.value;

    // Desde que el alta pide los contactos separados, el sistema no alcanza
    // para saber cuál es cuál: hay dos correos y dos celulares, y lo que los
    // distingue es el uso. Sin este par, el personal y el de trabajo se pisan.
    const contactoPorUso = (sistema: string, uso: string): string | undefined =>
      contactos.find(
        (punto) =>
          punto.systemConceptId === sistema && punto.useConceptId === uso,
      )?.value;

    return {
      profileId,
      personId: person.id,
      practitionerCode: practitioner.practitionerCode,
      displayName: person.displayName,
      professionalTitle: practitioner.professionalTitle,
      professionalBio: practitioner.professionalBio,
      photoFileId: practitioner.photoFileId,
      email: contacto(CONCEPTS.CONTACT_EMAIL),
      phone: contacto(CONCEPTS.CONTACT_PHONE),
      // Los cinco contactos del registro del médico. `email`/`phone` siguen
      // arriba tal cual para no romper a quien ya los lee.
      workEmail: contactoPorUso(
        CONCEPTS.CONTACT_EMAIL,
        CONCEPTS.CONTACT_USE_WORK,
      ),
      personalEmail: contactoPorUso(
        CONCEPTS.CONTACT_EMAIL,
        CONCEPTS.CONTACT_USE_HOME,
      ),
      mobilePhone: contactoPorUso(
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_USE_HOME,
      ),
      workMobilePhone: contactoPorUso(
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_USE_WORK,
      ),
      workLandline: contactoPorUso(
        CONCEPTS.CONTACT_PHONE,
        CONCEPTS.CONTACT_USE_WORK,
      ),
      // Las cuatro partes del nombre viajan además del compuesto: es lo único
      // con lo que se puede corregir un apellido sin adivinar dónde cortarlo.
      name: person.name,
      middleName: person.middleName,
      lastName: person.lastName,
      motherLastName: person.motherLastName,
      birthDate: person.birthDate,
      nationalId: filiacion.nationalId,
      issuerAdministrativeAreaConceptId: filiacion.issuerArea,
      residenceMunicipalityConceptId: filiacion.municipio,
      homeAddress: filiacion.homeAddress,
      workAddress: filiacion.workAddress,
      // Ocupación y empleador viven en `persons`, no en `filiacion` (que ya
      // resuelve solo `incluyeContacto`): sin este condicional saldrían
      // también en la ficha que ve un tercero, y son un dato personal como el
      // domicilio o el documento. `?? undefined` traduce la columna nula
      // —MikroORM la hidrata como `null`— a la ausencia que promete el
      // contrato: lo no declarado viaja ausente, no como `null` en el JSON.
      ...(incluyeContacto
        ? {
            occupationConceptId: person.occupationConceptId ?? undefined,
            occupationFreeText: person.occupationFreeText ?? undefined,
            workEmployerConceptId: person.workEmployerConceptId ?? undefined,
            workEmployerFreeText: person.workEmployerFreeText ?? undefined,
          }
        : {}),
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
        // El identificador permite que el titular vuelva a descargar el
        // diploma. No se incluye en la ficha de terceros: un UUID no es un
        // permiso de lectura y tampoco debe revelar vínculos a documentos.
        ...(incluyeContacto && credential.fileId
          ? { fileId: credential.fileId }
          : {}),
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

      // --- los datos personales, que viven en `persons` y no en el perfil ----
      const person = await this.personsRepo.findById(tx, link.personId);
      if (person) {
        const ahora = new Date();
        // Una cadena vacía BORRA el dato opcional: es lo que hace falta cuando
        // alguien descubre que no lleva segundo nombre ni apellido materno.
        if (dto.name !== undefined) person.name = dto.name;
        if (dto.middleName !== undefined) {
          person.middleName =
            dto.middleName === '' ? undefined : dto.middleName;
        }
        if (dto.lastName !== undefined) person.lastName = dto.lastName;
        if (dto.motherLastName !== undefined) {
          person.motherLastName =
            dto.motherLastName === '' ? undefined : dto.motherLastName;
        }
        // El nombre visible lo compone el backend: quien corrige su apellido
        // espera verlo corregido en su ficha, no la versión anterior.
        if (
          dto.name !== undefined ||
          dto.middleName !== undefined ||
          dto.lastName !== undefined ||
          dto.motherLastName !== undefined
        ) {
          person.displayName = composeAccountDisplayName({
            name: person.name,
            middleName: person.middleName,
            lastName: person.lastName,
            motherLastName: person.motherLastName,
          });
        }
        if (dto.birthDate !== undefined) {
          // `new Date(null)` es el 1/1/1970, no «sin fecha»: mandar `null` para
          // borrarla dejaba a la persona nacida en la época Unix. Se borra
          // igual que las partes opcionales del nombre, con `undefined`.
          person.birthDate = dto.birthDate
            ? new Date(dto.birthDate)
            : undefined;
        }
        // Ocupación y empleador: catálogo o texto libre, nunca los dos.
        // Mismas reglas y mismo ayudante que `PATCH /profiles/patients/me`
        // (`person-work-fields.ts`): las dos columnas viven en `persons`,
        // independientemente de qué perfil clínico traiga encima.
        aplicarOcupacion(person, dto);
        aplicarEmpresa(person, dto);
        touch(person, actor.id);

        if (dto.phone !== undefined) {
          await this.reemplazarTelefono(
            tx,
            person.id,
            dto.phone,
            actor.id,
            ahora,
          );
        }
        // Los cuatro contactos que el alta captura por separado. `phone` sigue
        // arriba —es la forma anterior— y escribe el mismo par que
        // `workMobilePhone` escribiría con el sistema viejo, así que enviar los
        // dos a la vez no tiene sentido: gana el que llegue segundo.
        for (const [valor, par] of [
          [dto.personalEmail, PAR_CORREO_PERSONAL],
          [dto.mobilePhone, PAR_CELULAR_PERSONAL],
          [dto.workMobilePhone, PAR_CELULAR_TRABAJO],
          [dto.workLandline, PAR_FIJO_TRABAJO],
        ] as const) {
          if (valor === undefined) continue;
          await this.reemplazarContacto(
            tx,
            person.id,
            valor,
            actor.id,
            ahora,
            par,
          );
        }
        if (
          dto.residenceMunicipalityConceptId !== undefined ||
          dto.homeAddressLines !== undefined ||
          // `null` también cuenta: quitar el punto es un cambio.
          dto.homeLatitude !== undefined ||
          dto.homeLongitude !== undefined
        ) {
          await this.reemplazarDireccion(
            tx,
            person.id,
            CONCEPTS.ADDR_USE_HOME,
            {
              municipalityConceptId: dto.residenceMunicipalityConceptId,
              lines: dto.homeAddressLines,
              latitude: dto.homeLatitude,
              longitude: dto.homeLongitude,
            },
            actor.id,
            ahora,
          );
        }
        if (
          dto.workAddressLines !== undefined ||
          dto.workLatitude !== undefined ||
          dto.workLongitude !== undefined
        ) {
          await this.reemplazarDireccion(
            tx,
            person.id,
            CONCEPTS.ADDR_USE_WORK,
            {
              lines: dto.workAddressLines,
              latitude: dto.workLatitude,
              longitude: dto.workLongitude,
            },
            actor.id,
            ahora,
          );
        }
      }

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

  /**
   * Ejecuta una lectura accesoria de la ficha y, si revienta, devuelve el vacío
   * en vez de propagar.
   *
   * Es deliberadamente estrecho: **sólo** para las piezas que la ficha muestra
   * como lista o como conteo. Nada de lo que decide si el perfil existe pasa
   * por acá — eso sigue siendo un 404 explícito. Se registra en `warn` con la
   * pieza y el perfil, porque un vacío silencioso que en realidad es un fallo
   * es peor que el 500 que reemplaza: el log es lo que lo hace visible.
   */
  private async sinTumbarLaFicha<T>(
    leer: () => Promise<T>,
    vacio: T,
    contexto: { profileId: string; pieza: string },
  ): Promise<T> {
    try {
      return await leer();
    } catch (error) {
      this.logger.warn(
        { ...contexto, err: error },
        'La ficha del profesional se devuelve sin esta pieza: la lectura falló',
      );
      return vacio;
    }
  }

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
      // Las dos son OPCIONALES: una ficha de directorio —el padrón de una
      // aseguradora, que dice quién atiende y dónde pero no publica matrículas—
      // se da de alta sin ellas. Crearlas con un número inventado sería peor que
      // no tenerlas: la ficha afirmaría una credencial que nadie declaró.
      const license =
        dto.licenseNumber === undefined
          ? undefined
          : this.authorizationsRepo.create(tx, {
              practitionerProfileId: personId,
              jurisdictionConceptId:
                dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
              licenseNumber: dto.licenseNumber,
              regulatoryAuthority: dto.regulatoryAuthority,
              stateConceptId: PROF.AUTH_PENDING,
              actorUserId: actor.id,
            });
      const credential =
        dto.credentialNumber === undefined
          ? undefined
          : this.credentialsRepo.create(tx, {
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
        // Ausentes cuando la ficha es de directorio: no hay matrícula que citar.
        licenseId: license?.id,
        credentialId: credential?.id,
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

      // Dentro de la MISMA transacción que la escritura: comprobar el archivo
      // contra un estado y escribir sobre otro no comprueba nada. `assertUsableBy`
      // es también lo que impide colgarse del archivo de otro. Mismo camino que
      // el título en `addOwnCredential`.
      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.authorization.add',
          },
          {
            subject: 'El archivo de la matrícula',
            notFound: 'El archivo de la matrícula no existe',
          },
        );
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
        fileId: dto.fileId,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: authorization.id,
        practitionerProfileId: profileId,
        licenseNumber: authorization.licenseNumber,
        state: authorization.stateConceptId,
        fileId: authorization.fileId,
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
      const credential = await this.credentialsRepo.findByIdForUpdate(
        tx,
        credentialId,
      );
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

  /**
   * Cambia cuál de las especialidades propias es la principal (UC-05-06·P).
   *
   * ## Por qué hace falta un camino aparte
   *
   * `isPrimary` sólo se podía fijar **al agregar** una especialidad, y el alta
   * de médico la elige en un `select` al registrarse. Cuando el editor del
   * perfil se adaptó al formulario del alta —pedido del propietario del
   * 2026-09-10— los dos interruptores sueltos de «Agregar una especialidad»
   * salieron con él, y con ellos la única forma de marcar una principal. Desde
   * entonces toda especialidad agregada después del alta entraba como
   * adicional y **no había pantalla para cambiarlo**; quedó anotado como
   * bloqueo en `mantra-core-health/docs/progress/BLOCKERS.md`.
   *
   * Es un gesto sobre algo que **ya existe** —«ésta pasa a ser la principal»—,
   * no una casilla más en un formulario de alta. Por eso vive acá y no en
   * `addSpecialty`.
   *
   * ## Autoservicio
   *
   * El sujeto sale de la sesión: el id de una especialidad ajena responde
   * `404`, igual que uno inexistente. Mismo criterio que el historial laboral.
   *
   * ## Idempotente
   *
   * Marcar como principal la que ya lo es no es un error ni una escritura:
   * devuelve la especialidad tal cual está. Dos clics seguidos en la misma
   * fila no tienen por qué fallar.
   *
   * @param specialtyId - La especialidad que pasa a ser la principal.
   * @param actor - El profesional titular.
   * @returns La especialidad, ya primaria.
   */
  async setOwnPrimarySpecialty(
    specialtyId: string,
    actor: AuthenticatedUser,
  ): Promise<SpecialtyResponseDto> {
    this.logger.info(
      {
        operation: 'profiles.specialty.setPrimary',
        specialtyId,
        actorId: actor.id,
      },
      'Setting primary specialty',
    );
    return this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );
      const specialty = await this.specialtiesRepo.findById(tx, specialtyId);
      // La ajena y la inexistente responden lo mismo: decir «existe pero no es
      // tuya» ya es contar algo del perfil de otro.
      if (!specialty || specialty.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Especialidad no encontrada', {
          specialtyId,
        });
      }

      // Una que ya no se ejerce no puede ser con la que uno se presenta. El
      // modelo lo deja pasar —`is_primary` no mira `valid_to`— así que la regla
      // vive acá, que es donde se decide.
      if (specialty.validTo) {
        throw new PreconditionFailedException(
          'Una especialidad que ya no ejercés no puede ser la principal',
          { specialtyId, validTo: specialty.validTo },
        );
      }

      if (specialty.isPrimary !== true) {
        const now = new Date();
        // Primero se baja la anterior: hay una sola vigente, y dejar dos
        // marcadas aunque sea por un instante rompe la lectura del perfil.
        await this.specialtiesRepo.demotePrimary(tx, profileId, now);
        specialty.isPrimary = true;
        touch(specialty, actor.id);
        await tx.flush();
      }

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
    return this.agregarAfiliacion(dto, actor, null);
  }

  /**
   * Registra un consultorio de un profesional que NO es quien llama.
   *
   * Existe para las fichas de directorio: los profesionales que las redes de
   * las aseguradoras publican no tienen cuenta —no traen correo— y por eso no
   * pueden declarar sus consultorios ellos mismos. Sin esto, un médico que
   * atiende en tres lugares se veía sin ninguno, o peor, había que cargarlo
   * tres veces para que se notara.
   *
   * Es la misma escritura que la propia: mismas reglas de duplicado, mismo
   * estado inicial y el mismo aviso a la organización cuando corresponde. Lo
   * único que cambia es de dónde sale el sujeto, y por eso pide rol
   * administrativo — sin eso sería una forma de escribirle el currículum a
   * cualquiera.
   */
  async addAffiliationFor(
    profileId: string,
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    return this.agregarAfiliacion(dto, actor, profileId);
  }

  /**
   * El cuerpo compartido por las dos altas de afiliación.
   *
   * @param perfilExplicito - `null` para tomar el perfil del actor.
   */
  private async agregarAfiliacion(
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
    perfilExplicito: string | null,
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
    const creado = await this.em.transactional(async (tx) => {
      const profileId =
        perfilExplicito ??
        (await this.ownership.requireOwnPractitionerProfileId(tx, actor));
      if (perfilExplicito !== null) {
        const existe = await this.practitionersRepo.findById(tx, profileId);
        if (!existe) {
          throw new ResourceNotFoundException('Profesional no encontrado', {
            profileId,
          });
        }
      }

      const organizationName = dto.organizationName.trim();
      // ALV-007: opcional. `null` explícito -no `undefined`- para que
      // `findSame` busque "sin cargo" y no "cualquier cargo" (ver el
      // comentario de `findSame` sobre por qué dos vínculos sin cargo no
      // chocan entre sí).
      const roleTitle = dto.roleTitle?.trim() || null;
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

      // TP-2: y pedir dos veces atender en la MISMA sede es lo mismo, aunque el
      // cargo o la fecha se escriban distinto. `findSame` compara institución,
      // cargo e inicio —sirve para no cargar dos veces la misma línea del
      // currículum—, y con eso solo, reenviar el formulario con una coma de
      // diferencia dejaba dos solicitudes para la misma sede en la bandeja de
      // la organización.
      if (dto.practiceSiteId) {
        const yaPedida = await this.affiliationsRepo.findByPractitionerAndSite(
          tx,
          profileId,
          dto.practiceSiteId,
        );
        if (yaPedida) {
          throw new ConflictException('Ya pediste vincularte a esa sede', {
            practiceSiteId: dto.practiceSiteId,
            statusConceptId: yaPedida.statusConceptId,
          });
        }
      }

      const affiliation = this.affiliationsRepo.create(tx, {
        practitionerProfileId: profileId,
        organizationName,
        roleTitle: roleTitle ?? undefined,
        practiceSiteId: dto.practiceSiteId,
        affiliationTypeConceptId:
          dto.affiliationTypeConceptId ?? PROF.AFFILIATION_TYPE_EMPLOYMENT,
        startDate,
        endDate,
        // TP-2: un vínculo a una sede ajena nace **pendiente**, no activo.
        //
        // Hasta acá, declarar una afiliación la daba por cierta en el acto:
        // cualquiera podía decirse parte de una clínica y el sistema lo
        // publicaba en su trayectoria y en su perfil, sin que nadie de esa
        // clínica se enterara siquiera. Sin sede sigue naciendo activa —eso es
        // historial laboral y no hay a quién pedirle permiso—, y con una sede
        // propia también, porque pedirse permiso a uno mismo no es una regla.
        statusConceptId: await this.affiliations.estadoInicial(
          tx,
          dto.practiceSiteId,
          actor,
        ),
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

    // El aviso a la organización va DESPUÉS de la transacción y sólo si el
    // vínculo quedó pendiente: un declarado no tiene a quién avisarle y un
    // aprobado ya está resuelto. Nunca lanza — el vínculo ya se creó, y que no
    // salga un aviso no puede deshacerlo.
    if (creado.statusKind === 'pendiente' && dto.practiceSiteId !== undefined) {
      await this.avisarDelPedido(dto.practiceSiteId, creado);
    }
    return creado;
  }

  /**
   * Corrige una afiliación del historial propio (UC-05-16·E).
   *
   * Las mismas dos reglas del alta, aplicadas al resultado de la mezcla y no
   * al parche suelto: un `endDate` nuevo se compara con el `startDate` que
   * quede, y el trío institución/cargo/inicio resultante no puede coincidir
   * con **otra** línea del mismo historial.
   *
   * La sede no se toca —el DTO no la trae— porque de ella depende el estado
   * del vínculo y ese estado lo decide la organización, no el editor.
   *
   * @param affiliationId - La línea a corregir.
   * @param dto - Los campos que cambian; lo omitido se conserva.
   * @param actor - El profesional titular del historial.
   * @returns La afiliación ya corregida.
   */
  async updateOwnAffiliation(
    affiliationId: string,
    dto: UpdateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    this.logger.info(
      {
        operation: 'profiles.affiliation.update',
        affiliationId,
        actorId: actor.id,
      },
      'Updating practitioner affiliation',
    );
    return this.em.transactional(async (tx) => {
      const affiliation = await this.propiaONada(tx, affiliationId, actor);

      const organizationName =
        dto.organizationName?.trim() ?? affiliation.organizationName;
      // Mismo criterio que el alta (línea ~1970): `''` colapsa a `null`, no se
      // conserva como cadena vacía — así una corrección que borra el cargo no
      // evade los dos índices únicos parciales de ALV-007 (`WHERE role_title
      // IS [NOT] NULL`), y el resultado calza con `findSame(string | null)`.
      const roleTitle =
        dto.roleTitle !== undefined
          ? dto.roleTitle.trim() || null
          : (affiliation.roleTitle ?? null);
      const startDate =
        dto.startDate !== undefined
          ? new Date(dto.startDate)
          : affiliation.startDate;
      // `endDate` distingue tres casos: ausente (se conserva), `null` (vuelve
      // a estar vigente) y una fecha (nuevo fin).
      const endDate =
        dto.endDate === undefined
          ? affiliation.endDate
          : dto.endDate === null
            ? undefined
            : new Date(dto.endDate);

      if (endDate && endDate < startDate) {
        throw new PreconditionFailedException(
          'El fin del vínculo no puede ser anterior a su inicio',
          { startDate, endDate },
        );
      }

      const igual = await this.affiliationsRepo.findSame(
        tx,
        affiliation.practitionerProfileId,
        organizationName,
        roleTitle ?? null,
        startDate,
      );
      if (igual && igual.id !== affiliation.id) {
        throw new ConflictException(
          'Ese vínculo ya está en el historial laboral',
          { organizationName, roleTitle, startDate },
        );
      }

      affiliation.organizationName = organizationName;
      // La entidad tipa la columna `nullable: true` como `string | undefined`
      // (mismo criterio que el alta, línea ~2005): `null` es «sin cargo» para
      // `findSame`/el DTO, `undefined` es lo que la propiedad ORM acepta.
      affiliation.roleTitle = roleTitle ?? undefined;
      affiliation.startDate = startDate;
      affiliation.endDate = endDate;
      if (dto.affiliationTypeConceptId !== undefined) {
        affiliation.affiliationTypeConceptId = dto.affiliationTypeConceptId;
      }
      touch(affiliation, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.affiliation.update', affiliationId },
        'Practitioner affiliation updated',
      );
      return toAffiliation(affiliation);
    });
  }

  /**
   * Quita una afiliación del historial propio (UC-05-16·B).
   *
   * Borrado físico: es una línea de currículum escrita por su dueño. Si el
   * vínculo estaba aprobado por una organización, la membresía que se concedió
   * al aprobarlo **no** se toca acá —eso es de la organización y se revoca
   * desde su bandeja—.
   *
   * @param affiliationId - La línea a quitar.
   * @param actor - El profesional titular del historial.
   */
  async removeOwnAffiliation(
    affiliationId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const affiliation = await this.propiaONada(tx, affiliationId, actor);
      this.affiliationsRepo.remove(tx, affiliation);
      await tx.flush();
      this.logger.info(
        {
          operation: 'profiles.affiliation.remove',
          affiliationId,
          actorId: actor.id,
          statusConceptId: affiliation.statusConceptId,
        },
        'Practitioner affiliation removed',
      );
    });
  }

  /**
   * La afiliación si es del profesional de la sesión; `404` si no.
   *
   * Un id ajeno y un id inexistente responden igual a propósito: distinguirlos
   * le diría a quien tantea ids cuáles existen.
   *
   * @param tx - La transacción del caso de uso.
   * @param affiliationId - La afiliación pedida.
   * @param actor - Quien la pide.
   * @returns La fila, garantizada propia.
   */
  private async propiaONada(
    tx: EntityManager,
    affiliationId: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerAffiliations> {
    const profileId = await this.ownership.requireOwnPractitionerProfileId(
      tx,
      actor,
    );
    const affiliation = await this.affiliationsRepo.findOwn(
      tx,
      affiliationId,
      profileId,
    );
    if (!affiliation) {
      throw new ResourceNotFoundException('Afiliación no encontrada', {
        affiliationId,
      });
    }
    return affiliation;
  }

  /**
   * Le cuenta a la organización que alguien pidió vincularse.
   *
   * La bandeja de solicitudes existe y nadie entra a mirarla por las dudas: sin
   * este aviso un pedido puede quedar semanas sin respuesta mientras el médico
   * espera del otro lado sin saber por qué.
   *
   * @param practiceSiteId - La sede a la que apunta el pedido.
   * @param afiliacion - El vínculo recién creado.
   */
  private async avisarDelPedido(
    practiceSiteId: string,
    afiliacion: AffiliationResponseDto,
  ): Promise<void> {
    const sede = await this.em.findOne(PracticeSites, { id: practiceSiteId });
    const tenantId = sede?.managingTenantId;
    if (tenantId === undefined || tenantId === null) return;

    await this.affiliations.avisarDelPedido(
      tenantId,
      afiliacion.id,
      afiliacion.practitionerProfileId,
    );
  }

  /**
   * Los cinco tipos que el modelo admite para una credencial académica.
   *
   * La FK acepta CUALQUIER concepto del catálogo, así que sin esta lista un
   * profesional podría declarar como «título» el concepto de un idioma o de un
   * estado de cita. Quién decide cuáles son tipos de credencial es la
   * enumeración `professional-credential-type`, la misma que siembra la app.
   */
  private static readonly TIPOS_DE_CREDENCIAL: readonly string[] = [
    PROF.CREDENTIAL_TYPE_DEGREE,
    PROF.CREDENTIAL_TYPE_DIPLOMA,
    PROF.CREDENTIAL_TYPE_MASTER,
    PROF.CREDENTIAL_TYPE_DOCTORATE,
    PROF.CREDENTIAL_TYPE_SPECIALTY,
  ];

  /**
   * Agrega un título propio a la formación, con su diploma adjunto.
   *
   * El registro de procesos pide «espacio para poder subir varios diplomados»
   * —y lo mismo para maestrías, doctorados y especialidades—, pero tanto el
   * alta administrativa como la de autorregistro creaban **una** credencial y
   * ahí terminaba: no había forma de agregar la segunda. Cada llamada agrega
   * una fila.
   *
   * Nace PENDIENTE a propósito: declarar un título no es haberlo acreditado, y
   * quien lo verifica es `POST /profiles/credentials/{id}/verify`, que exige
   * `SECURITY_ADMIN`. Si el alta lo diera por verificado, el sello del perfil
   * dejaría de significar algo.
   */
  async addOwnCredential(
    dto: AddOwnCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<OwnCredentialResponseDto> {
    if (
      !ProfilesPractitionersService.TIPOS_DE_CREDENCIAL.includes(
        dto.credentialTypeConceptId,
      )
    ) {
      throw new PreconditionFailedException(
        'Ese concepto no es un tipo de credencial profesional',
        { credentialTypeConceptId: dto.credentialTypeConceptId },
      );
    }

    this.logger.info(
      { operation: 'profiles.credential.addOwn', actorId: actor.id },
      'Adding own professional credential',
    );

    const creada = await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );

      // Dentro de la MISMA transacción que la escritura: comprobar el archivo
      // contra un estado y escribir sobre otro no comprueba nada. `assertUsableBy`
      // es también lo que impide colgarse del archivo de otro.
      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.credential.addOwn',
          },
          {
            subject: 'El archivo del título',
            notFound: 'El archivo del título no existe',
          },
        );
      }

      const credencial = this.credentialsRepo.create(tx, {
        practitionerProfileId: profileId,
        credentialTypeConceptId: dto.credentialTypeConceptId,
        number: dto.number.trim(),
        issuingInstitutionText: dto.issuingInstitutionText?.trim(),
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        fileId: dto.fileId,
        stateConceptId: PROF.CRED_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();
      return credencial;
    });

    return {
      id: creada.id,
      credentialTypeConceptId: creada.credentialTypeConceptId,
      number: creada.number,
      issuingInstitutionText: creada.issuingInstitutionText,
      issueDate: creada.issueDate,
      stateConceptId: creada.stateConceptId,
      fileId: creada.fileId,
      createdAt: creada.createdAt,
    };
  }

  /**
   * Corrige una credencial propia mientras siga pendiente de revisión.
   * Reutiliza el propietario resuelto desde la sesión y el control existente
   * del ciclo de vida/propiedad de archivos.
   */
  async updateOwnCredential(
    credentialId: string,
    dto: UpdateOwnCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (
      dto.credentialTypeConceptId !== undefined &&
      !ProfilesPractitionersService.TIPOS_DE_CREDENCIAL.includes(
        dto.credentialTypeConceptId,
      )
    ) {
      throw new PreconditionFailedException(
        'Ese concepto no es un tipo de credencial profesional',
        { credentialTypeConceptId: dto.credentialTypeConceptId },
      );
    }

    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );
      const credential = await this.credentialsRepo.findByIdForUpdate(
        tx,
        credentialId,
      );
      if (!credential || credential.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Título no encontrado', {
          credentialId,
        });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'Ese título ya fue verificado o rechazado; no se puede editar',
          { credentialId, stateConceptId: credential.stateConceptId },
        );
      }

      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.credential.updateOwn',
          },
          {
            subject: 'El archivo del título',
            notFound: 'El archivo del título no existe',
          },
        );
      }

      if (dto.credentialTypeConceptId !== undefined) {
        credential.credentialTypeConceptId = dto.credentialTypeConceptId;
      }
      if (dto.number !== undefined) credential.number = dto.number.trim();
      if (dto.issuingInstitutionText !== undefined) {
        credential.issuingInstitutionText = dto.issuingInstitutionText.trim();
      }
      if (dto.issueDate !== undefined) {
        credential.issueDate = new Date(dto.issueDate);
      }
      if (dto.fileId !== undefined) credential.fileId = dto.fileId;
      touch(credential, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'profiles.credential.updateOwn',
          credentialId,
          actorId: actor.id,
        },
        'Own professional credential updated',
      );
    });
  }

  /**
   * Retira un título propio cargado por error (ALV-009/formación).
   *
   * Sólo mientras está PENDIENTE: uno ya verificado o rechazado es un hecho
   * de la autoridad que lo revisó —`POST /profiles/credentials/{id}/verify`,
   * `SECURITY_ADMIN`—, no algo que el titular deshace borrándolo. Un id ajeno
   * y uno inexistente responden igual (`404`), mismo criterio que
   * `propiaONada` para las afiliaciones: no hay tabla `state=WITHDRAWN`, así
   * que es borrado físico, como el resto de las altas «solo se agrega» de
   * este perfil (matrícula, especialidad).
   *
   * @param credentialId - El título a retirar.
   * @param actor - El profesional titular.
   * @throws ResourceNotFoundException si no existe o es de otro profesional.
   * @throws PreconditionFailedException si ya no está pendiente.
   */
  async removeOwnCredential(
    credentialId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );
      const credencial = await this.credentialsRepo.findByIdForUpdate(
        tx,
        credentialId,
      );
      if (!credencial || credencial.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Título no encontrado', {
          credentialId,
        });
      }
      if (credencial.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'Ese título ya fue verificado o rechazado; no se puede retirar',
          { credentialId, stateConceptId: credencial.stateConceptId },
        );
      }

      this.credentialsRepo.remove(tx, credencial);
      await tx.flush();

      this.logger.info(
        {
          operation: 'profiles.credential.removeOwn',
          credentialId,
          actorId: actor.id,
        },
        'Own professional credential removed',
      );
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
    roleTitle: row.roleTitle ?? null,
    practiceSiteId: row.practiceSiteId ?? null,
    affiliationTypeConceptId: row.affiliationTypeConceptId ?? null,
    startDate: row.startDate,
    endDate: row.endDate ?? null,
    current: row.endDate === undefined || row.endDate === null,
    status: row.statusConceptId,
    statusKind: estadoLegible(row.statusConceptId),
    decisionReasonText: row.decisionReasonText ?? null,
    createdAt: row.createdAt,
  };
}

/**
 * Traduce el concepto de estado a algo que una pantalla pueda usar.
 *
 * Un solo lugar: cuando exista el value set de estados de vínculo, esto es lo
 * único que cambia.
 *
 * @param conceptId - El estado tal como está guardado.
 * @returns El caso conocido, o `desconocido` si no es ninguno.
 */
function estadoLegible(
  conceptId: string,
):
  | 'pendiente'
  | 'declarado'
  | 'aprobado'
  | 'rechazado'
  | 'revocado'
  | 'desconocido' {
  if (esEstado(conceptId, 'PENDIENTE')) return 'pendiente';
  if (esEstado(conceptId, 'DECLARADO')) return 'declarado';
  if (esEstado(conceptId, 'APROBADO')) return 'aprobado';
  if (esEstado(conceptId, 'RECHAZADO')) return 'rechazado';
  if (esEstado(conceptId, 'REVOCADO')) return 'revocado';
  return 'desconocido';
}
