import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IdentifiersRepository } from '../../common/repositories';
import { NotificationsService } from '../../messaging/services';
import { normalizeSearchText } from '../../terminology/repositories/glossary-search.sql';
import type {
  DependentCandidateDto,
  DependentLinkRequestDecisionDto,
  DependentLinkRequestSentDto,
  IncomingDependentLinkRequestDto,
  RequestDependentLinkDto,
} from '../dto';
import type { Persons } from '../entities';
import { composePersonDisplayName } from '../person-name';
import { PROF } from '../profiles.concepts';
import {
  PatientPortalProxiesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PersonsRepository,
  RelatedPersonsRepository,
  type PendingRequestRow,
  type RepresentableCandidateRow,
} from '../repositories';

/** La cuenta autenticada, resuelta a su persona y su perfil de paciente. */
interface PacientePropio {
  /** La persona titular de la cuenta. */
  readonly person: Persons;
  /** Su perfil de paciente (`profile_id` es `persons.id`). */
  readonly patientProfileId: string;
}

/**
 * Solicitudes para representar a quien **ya tiene cuenta**.
 *
 * ## Por qué no hay tabla propia
 *
 * La solicitud es un apoderamiento de portal (`profiles.patient_portal_proxies`)
 * que nace en `PROXY_PENDING` y la persona lo lleva a `PROXY_ACTIVE` o a
 * `PROXY_REJECTED`. Es la misma fila que después sostiene la representación, y
 * el mismo patrón que `authz.care_relationships` con su estado pendiente. Una
 * tabla aparte duplicaría la pareja «quién representa a quién» y obligaría a
 * copiarla al aceptar.
 *
 * Es seguro porque **toda** lectura de permiso —`findActiveByProxyUser`,
 * `findActiveByProxyUserAndPatient`, el listado de dependientes— filtra por
 * `PROXY_ACTIVE` y por vigencia: una fila pendiente o rechazada no abre ninguna
 * historia ni habilita ningún turno.
 *
 * ## Qué es distinto del alta de un dependiente
 *
 * `registerOwnDependent` crea a una persona que no tiene cuenta —un hijo— y el
 * titular se declara su tutor. Acá la otra persona ya es titular de sí misma,
 * así que el vínculo lo decide ella: hasta que acepta no existe parentesco
 * (`related_persons`) ni representación.
 */
@Injectable()
export class DependentLinkRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia raíz.
   * @param identifiersRepo - Documentos de identidad (`common.identifiers`).
   * @param accountLinksRepo - Vínculo persona–cuenta.
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param personsRepo - Personas.
   * @param relatedPersonsRepo - Parentescos.
   * @param portalProxiesRepo - Apoderamientos de portal, que son las solicitudes.
   * @param notifications - Canal in-app (M35); `emitInApp` no lanza.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
    private readonly portalProxiesRepo: PatientPortalProxiesRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DependentLinkRequestsService.name);
  }

  /**
   * Pide representar a quien tiene cuenta con ese documento.
   *
   * No crea el vínculo: deja la solicitud pendiente y le avisa a esa cuenta.
   *
   * @param dto - El documento de la persona.
   * @param actor - La cuenta que pide representar.
   * @returns La solicitud, en `PENDING`.
   * @throws ForbiddenException si la cuenta no tiene perfil de paciente.
   * @throws PreconditionFailedException (422) si el documento es el propio.
   * @throws ResourceNotFoundException si no hay cuenta de paciente con ese documento.
   * @throws ConflictException si ya la representa o ya hay una solicitud pendiente.
   */
  async request(
    dto: RequestDependentLinkDto,
    actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestSentDto> {
    const resultado = await this.em.transactional(async (tx) => {
      const titular = await this.pacientePropio(tx, actor);
      if (!titular) {
        throw new ForbiddenException('Esta cuenta no tiene perfil de paciente');
      }

      // Una sola vía por pedido (el DTO lo exige): el documento escrito o el
      // perfil elegido de la búsqueda por nombre. Las dos terminan en la misma
      // regla de «cuenta de paciente activa» y en las mismas reglas de abajo.
      const { cuenta, paciente } =
        dto.patientProfileId === undefined
          ? await this.destinatarioPorDocumento(
              tx,
              (dto.nationalId ?? '').trim(),
              titular,
              actor,
            )
          : await this.destinatarioPorPerfil(
              tx,
              dto.patientProfileId,
              titular,
              actor,
            );

      const ahora = new Date();
      const vigente =
        await this.portalProxiesRepo.findActiveByProxyUserAndPatient(
          tx,
          actor.id,
          paciente.profileId,
          ahora,
        );
      if (vigente) {
        throw new ConflictException('Esa persona ya es su dependiente.');
      }
      const pendiente =
        await this.portalProxiesRepo.findPendingByProxyUserAndPatient(
          tx,
          actor.id,
          paciente.profileId,
        );
      if (pendiente) {
        throw new ConflictException(
          'Ya le envió una solicitud a esa persona. Falta que la acepte.',
        );
      }

      const solicitud = this.portalProxiesRepo.create(tx, {
        patientProfileId: paciente.profileId,
        proxyUserId: actor.id,
        scopeValueSetId: SEED.patientPortalProxyScopeValueSetId,
        // La única base legal de representación sembrada. Ver «No cubierto»
        // del PR: una base de consentimiento propia necesita su propio
        // propósito de tratamiento, porque la unicidad de
        // `processing_legal_bases` la leería como versión nueva de ésta.
        legalBasisRecordId: SEED.guardianProxyLegalBasisId,
        statusConceptId: PROF.PROXY_PENDING,
        // Sin `validFrom`: la vigencia empieza cuando la persona acepta.
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: solicitud.id,
        destinatario: cuenta.userId,
        quienPide: nombreDe(titular.person),
      };
    });

    this.logger.info(
      { operation: 'profiles.dependent-link.request', requestId: resultado.id },
      'Dependent link requested',
    );

    await this.notifications.emitInApp({
      recipientUserId: resultado.destinatario,
      category: 'CLINICAL',
      subject: 'Le quieren registrar como dependiente',
      bodyText: `${resultado.quienPide} pide registrarse como su dependiente. Si acepta, va a poder pedirle citas y ver su historia clínica.`,
      destination: { type: 'DEPENDENT_LINK_REQUEST', id: resultado.id },
      debounceKey: `dependent-link:${resultado.id}:requested`,
      actorUserId: actor.id,
    });

    return { id: resultado.id, status: 'PENDING' };
  }

  /**
   * Las solicitudes que esperan respuesta de esta cuenta.
   *
   * Una cuenta sin perfil de paciente no tiene a nadie pidiéndole nada: vacío,
   * no un error, igual que el listado de dependientes.
   *
   * @param actor - La cuenta a la que se lo pidieron.
   * @returns Las pendientes, de la más reciente a la más vieja.
   */
  async listIncoming(
    actor: AuthenticatedUser,
  ): Promise<IncomingDependentLinkRequestDto[]> {
    const em = this.em.fork();
    const yo = await this.pacientePropio(em, actor);
    if (!yo) return [];
    const filas = await this.portalProxiesRepo.listPendingForPatient(
      em,
      yo.patientProfileId,
    );
    return filas.map((fila) => aIncoming(fila));
  }

  /**
   * Cuentas cuyo nombre coincide con lo escrito, para elegir a quién pedirle
   * que deje representarla.
   *
   * Poco expuesta a propósito, porque es una búsqueda de personas: nada por
   * debajo de {@link MIN_LETTERS_TO_SEARCH} letras, a lo sumo
   * {@link MAX_CANDIDATES} filas, el CI enmascarado, y sin el propio titular ni
   * quien ya lo representa o ya recibió su pedido. Cada candidata es una cuenta
   * de paciente activa: un dependiente sin cuenta no puede aceptar.
   *
   * @param query - Parte del nombre de la persona.
   * @param actor - La cuenta que busca.
   * @returns Las candidatas; vacío si el texto es corto o nadie coincide.
   * @throws ForbiddenException si la cuenta no tiene perfil de paciente.
   */
  async findCandidates(
    query: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<DependentCandidateDto[]> {
    const em = this.em.fork();
    const titular = await this.pacientePropio(em, actor);
    if (!titular) {
      throw new ForbiddenException('Esta cuenta no tiene perfil de paciente');
    }

    const tokens = searchTokens(query ?? '');
    // «Ma» da medio padrón: la longitud se mide sobre lo que se escribió, no
    // sobre cuántas palabras salieron.
    if (tokens.join('').length < MIN_LETTERS_TO_SEARCH) return [];

    const filas = await this.portalProxiesRepo.searchRepresentableByName(em, {
      ownerPersonId: titular.person.id,
      proxyUserId: actor.id,
      tokens,
      now: new Date(),
      limit: MAX_CANDIDATES,
    });
    return filas.map((fila) => aCandidato(fila));
  }

  /**
   * Acepta: quien lo pidió pasa a representar a esta cuenta.
   *
   * Escribe el parentesco que faltaba y activa el apoderamiento en la misma
   * transacción. El parentesco queda como «Otro» y **sin tutela**: nadie lo
   * declaró —el pedido sólo trae el documento— y una persona adulta que acepta
   * ser representada no está bajo tutela de nadie.
   *
   * @param requestId - La solicitud.
   * @param actor - La cuenta a la que se lo pidieron.
   * @returns La solicitud, en `ACCEPTED`.
   * @throws ResourceNotFoundException si no existe o no es de esta cuenta.
   * @throws ConflictException si ya fue respondida, si quien pidió ya la
   *   representa por otra vía, o si su cuenta ya no está activa.
   */
  async accept(
    requestId: string,
    actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestDecisionDto> {
    const { solicitante, yo } = await this.em.transactional(async (tx) => {
      const { solicitud, yo } = await this.solicitudPendiente(
        tx,
        requestId,
        actor,
      );
      const ahora = new Date();

      const yaLaRepresenta =
        await this.portalProxiesRepo.findActiveByProxyUserAndPatient(
          tx,
          solicitud.proxyUserId,
          yo.patientProfileId,
          ahora,
        );
      if (yaLaRepresenta) {
        throw new ConflictException(
          'Esa persona ya le representa. Puede rechazar esta solicitud.',
        );
      }

      const vinculo = await this.accountLinksRepo.findActiveByUser(
        tx,
        solicitud.proxyUserId,
      );
      if (!vinculo) {
        throw new ConflictException(
          'La cuenta que lo pidió ya no está activa. Puede rechazar esta solicitud.',
        );
      }

      // Cuelga de quien acepta y nombra a quien pidió, como toda fila de esta
      // tabla: «la persona relacionada con este paciente es fulano».
      const parentesco = this.relatedPersonsRepo.create(tx, {
        patientProfileId: yo.patientProfileId,
        personId: vinculo.personId,
        relationshipConceptId: PROF.RELATIONSHIP_OTHER,
        isEmergencyContact: false,
        isLegalGuardian: false,
        statusConceptId: PROF.RELATED_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      solicitud.relatedPersonId = parentesco.id;
      solicitud.statusConceptId = PROF.PROXY_ACTIVE;
      solicitud.validFrom = ahora;
      touch(solicitud, actor.id, ahora);
      await tx.flush();

      return { solicitante: solicitud.proxyUserId, yo };
    });

    this.logger.info(
      { operation: 'profiles.dependent-link.accept', requestId },
      'Dependent link accepted',
    );
    await this.avisarRespuesta(requestId, solicitante, yo, 'ACCEPTED');
    return { id: requestId, status: 'ACCEPTED' };
  }

  /**
   * Rechaza: no se crea ningún vínculo.
   *
   * @param requestId - La solicitud.
   * @param actor - La cuenta a la que se lo pidieron.
   * @returns La solicitud, en `REJECTED`.
   * @throws ResourceNotFoundException si no existe o no es de esta cuenta.
   * @throws ConflictException si ya fue respondida.
   */
  async reject(
    requestId: string,
    actor: AuthenticatedUser,
  ): Promise<DependentLinkRequestDecisionDto> {
    const { solicitante, yo } = await this.em.transactional(async (tx) => {
      const { solicitud, yo } = await this.solicitudPendiente(
        tx,
        requestId,
        actor,
      );
      const ahora = new Date();
      solicitud.statusConceptId = PROF.PROXY_REJECTED;
      // Cerrada la ventana: una fila rechazada no tiene vigencia que abrir.
      solicitud.validTo = ahora;
      touch(solicitud, actor.id, ahora);
      await tx.flush();
      return { solicitante: solicitud.proxyUserId, yo };
    });

    this.logger.info(
      { operation: 'profiles.dependent-link.reject', requestId },
      'Dependent link rejected',
    );
    await this.avisarRespuesta(requestId, solicitante, yo, 'REJECTED');
    return { id: requestId, status: 'REJECTED' };
  }

  /**
   * La cuenta de paciente que tiene ese documento.
   *
   * @param em - Transacción activa.
   * @param documento - El CI ya sin espacios.
   * @param titular - Quien pide.
   * @param actor - La cuenta que pide.
   * @returns La cuenta y el perfil de paciente del destinatario.
   * @throws PreconditionFailedException (422) si el documento es el propio.
   * @throws ResourceNotFoundException si no hay cuenta de paciente con él.
   */
  private async destinatarioPorDocumento(
    em: EntityManager,
    documento: string,
    titular: PacientePropio,
    actor: AuthenticatedUser,
  ) {
    const identificador = await this.identifiersRepo.findActiveDuplicate(em, {
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: documento,
    });
    // El documento propio se contesta antes que «no existe»: quien escribe
    // su CI por error merece saber qué hizo, y no hay nada que ocultarle.
    if (identificador?.ownerId === titular.person.id) {
      throw new PreconditionFailedException(
        'Ese CI es el suyo: no puede registrarse como su propio dependiente.',
      );
    }

    // «No hay cuenta» cubre tres casos a propósito —nadie tiene ese CI, lo
    // tiene alguien sin cuenta (un dependiente de otro), o alguien sin perfil
    // de paciente—: distinguirlos le diría al que pregunta más de lo que le
    // corresponde saber de un tercero.
    const noHayCuenta = () =>
      new ResourceNotFoundException(
        'No hay ninguna cuenta registrada con ese CI.',
      );
    if (!identificador) throw noHayCuenta();
    const cuenta = await this.accountLinksRepo.findActiveByPerson(
      em,
      identificador.ownerId,
    );
    const paciente = await this.patientProfilesRepo.findById(
      em,
      identificador.ownerId,
    );
    if (!cuenta || !paciente) throw noHayCuenta();
    if (cuenta.userId === actor.id) {
      throw new PreconditionFailedException(
        'Ese CI es el suyo: no puede registrarse como su propio dependiente.',
      );
    }
    return { cuenta, paciente };
  }

  /**
   * La cuenta de paciente del perfil que el titular eligió de los candidatos.
   *
   * Un perfil que no es de una cuenta de paciente activa —nunca existió, es de
   * un dependiente sin cuenta, o su cuenta se dio de baja— responde lo mismo
   * que un uuid inventado: nada de lo que el cliente mande confirma que un
   * perfil existe.
   *
   * @param em - Transacción activa.
   * @param patientProfileId - El perfil elegido.
   * @param titular - Quien pide.
   * @param actor - La cuenta que pide.
   * @returns La cuenta y el perfil de paciente del destinatario.
   * @throws PreconditionFailedException (422) si el perfil es el propio.
   * @throws ResourceNotFoundException si no es de una cuenta de paciente activa.
   */
  private async destinatarioPorPerfil(
    em: EntityManager,
    patientProfileId: string,
    titular: PacientePropio,
    actor: AuthenticatedUser,
  ) {
    const propio = () =>
      new PreconditionFailedException(
        'Esa persona es usted: no puede registrarse como su propio dependiente.',
      );
    if (patientProfileId === titular.patientProfileId) throw propio();

    const cuenta = await this.accountLinksRepo.findActiveByPerson(
      em,
      patientProfileId,
    );
    const paciente = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!cuenta || !paciente) {
      throw new ResourceNotFoundException(
        'Esa persona ya no tiene una cuenta registrada.',
      );
    }
    if (cuenta.userId === actor.id) throw propio();
    return { cuenta, paciente };
  }

  /**
   * La solicitud, sólo si es de esta cuenta y sigue pendiente.
   *
   * Una solicitud ajena responde lo mismo que una inexistente: confirmar que
   * existe le diría a un tercero que alguien pidió representar a otra persona.
   *
   * @param em - Transacción activa.
   * @param requestId - La solicitud.
   * @param actor - La cuenta que responde.
   * @returns La fila y la cuenta resuelta a su paciente.
   */
  private async solicitudPendiente(
    em: EntityManager,
    requestId: string,
    actor: AuthenticatedUser,
  ) {
    const yo = await this.pacientePropio(em, actor);
    const solicitud = await this.portalProxiesRepo.findById(em, requestId);
    const esSuya =
      yo !== null &&
      solicitud !== null &&
      solicitud.patientProfileId === yo.patientProfileId &&
      // Un apoderamiento que esta misma cuenta ejerce no es una solicitud que
      // le hicieron: no se puede «aceptar» a sí misma.
      solicitud.proxyUserId !== actor.id;
    if (!esSuya) {
      throw new ResourceNotFoundException('Solicitud no encontrada', {
        requestId,
      });
    }
    if (solicitud.statusConceptId !== PROF.PROXY_PENDING) {
      throw new ConflictException('Esa solicitud ya fue respondida.', {
        requestId,
      });
    }
    return { solicitud, yo };
  }

  /**
   * La cuenta autenticada como paciente, o `null` si no lo es.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Usuario autenticado.
   * @returns Su persona y su perfil de paciente, o `null`.
   */
  private async pacientePropio(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<PacientePropio | null> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return null;
    const person = await this.personsRepo.findById(em, link.personId);
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!person || !patient) return null;
    return { person, patientProfileId: patient.profileId };
  }

  /**
   * Le avisa a quien pidió qué decidió la otra persona. No lanza.
   *
   * @param requestId - La solicitud.
   * @param destinatario - La cuenta que la pidió.
   * @param yo - Quien respondió.
   * @param decision - Lo que decidió.
   */
  private async avisarRespuesta(
    requestId: string,
    destinatario: string,
    yo: PacientePropio,
    decision: 'ACCEPTED' | 'REJECTED',
  ): Promise<void> {
    const quien = nombreDe(yo.person);
    const acepto = decision === 'ACCEPTED';
    await this.notifications.emitInApp({
      recipientUserId: destinatario,
      category: 'CLINICAL',
      subject: acepto
        ? `${quien} aceptó ser su dependiente`
        : `${quien} rechazó ser su dependiente`,
      bodyText: acepto
        ? 'Ya aparece en su lista de dependientes.'
        : 'No se creó ningún vínculo.',
      destination: { type: 'DEPENDENT_LINK_REQUEST', id: requestId },
      debounceKey: `dependent-link:${requestId}:${decision.toLowerCase()}`,
    });
  }
}

/** Cuántas letras hacen falta para buscar personas por nombre. */
const MIN_LETTERS_TO_SEARCH = 3;

/** Cuántas candidatas devuelve como máximo la búsqueda por nombre. */
const MAX_CANDIDATES = 8;

/**
 * Las palabras de una búsqueda: sin tildes, en minúsculas y sólo con letras y
 * dígitos, que es lo que garantiza que ningún comodín llegue a la consulta.
 *
 * @param text - Lo que escribió la persona.
 * @returns Las palabras, sin vacías.
 */
function searchTokens(text: string): string[] {
  return normalizeSearchText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palabra) => palabra !== '');
}

/**
 * El documento con sólo las últimas cifras a la vista.
 *
 * @param documento - El documento completo.
 * @returns `••••` más las últimas tres, o `•••` si es demasiado corto.
 */
function maskNationalId(documento: string): string {
  return documento.length <= 3 ? '•••' : `••••${documento.slice(-3)}`;
}

/**
 * Traduce una fila de candidata al contrato del cliente.
 *
 * @param fila - Lo que devolvió la consulta.
 * @returns La candidata, con el documento enmascarado si lo declaró.
 */
function aCandidato(fila: RepresentableCandidateRow): DependentCandidateDto {
  return {
    patientProfileId: fila.patient_profile_id,
    displayName:
      fila.display_name ??
      composePersonDisplayName({
        name: fila.name ?? undefined,
        middleName: fila.middle_name ?? undefined,
        lastName: fila.last_name ?? undefined,
        motherLastName: fila.mother_last_name ?? undefined,
      }) ??
      '',
    ...(fila.national_id === null || fila.national_id === ''
      ? {}
      : { maskedNationalId: maskNationalId(fila.national_id) }),
  };
}

/**
 * El nombre visible de una persona, con la misma regla del alta.
 *
 * @param person - La persona.
 * @returns Su nombre, o «Alguien» si no tiene ninguna parte cargada.
 */
function nombreDe(person: Persons): string {
  return person.displayName ?? composePersonDisplayName(person) ?? 'Alguien';
}

/**
 * Traduce una fila pendiente al contrato del cliente.
 *
 * @param fila - Lo que devolvió la consulta.
 * @returns La solicitud tal como la ve quien tiene que responderla.
 */
function aIncoming(fila: PendingRequestRow): IncomingDependentLinkRequestDto {
  const creada =
    fila.created_at instanceof Date
      ? fila.created_at
      : new Date(fila.created_at);
  return {
    id: fila.id,
    requesterDisplayName:
      fila.display_name ??
      composePersonDisplayName({
        name: fila.name ?? undefined,
        middleName: fila.middle_name ?? undefined,
        lastName: fila.last_name ?? undefined,
        motherLastName: fila.mother_last_name ?? undefined,
      }) ??
      '',
    createdAt: creada.toISOString(),
  };
}
