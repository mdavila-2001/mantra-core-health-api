import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import {
  PatientPortalProxiesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../repositories';

/**
 * Quién puede actuar por un paciente: él mismo, o quien lo representa.
 *
 * ## Por qué existe, y por qué fuera de `ProfilesPatientsService`
 *
 * La pregunta «¿este usuario puede pedir turno / leer la historia de este
 * paciente?» la hacen tres módulos —agenda, clínica y el propio portal— y hasta
 * ahora cada uno la respondía por su cuenta y con criterios distintos: agenda no
 * la hacía en absoluto, clínica comparaba contra el vínculo de la cuenta, y el
 * portal resolvía siempre el sujeto desde la sesión. Con dependientes la
 * respuesta deja de ser «es el mismo» y pasa a depender de una fila que hay que
 * ir a buscar, así que vive en un solo lugar.
 *
 * Es una clase **sin estado**: todo lo que sabe lo lee por el `EntityManager`
 * de la llamada. Eso es lo que permite proveerla suelta en `ClinicalModule`, que
 * no puede importar `ProfilesModule` sin cerrar un ciclo —`profiles` ya lee
 * entidades de `clinical`—, con el mismo criterio con que ese módulo provee
 * sueltos los repositorios de perfiles.
 *
 * ## Lo que NO decide
 *
 * Los roles. Que el personal de agenda opere sobre cualquier paciente, o que
 * `SUPERADMIN` pase por encima de todo, son reglas de cada módulo y siguen en
 * cada módulo: acá sólo se responde por la titularidad y la representación.
 */
@Injectable()
export class PatientRepresentationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia; se bifurca cuando la llamada no trae uno.
   * @param accountLinksRepo - Vínculo cuenta ↔ persona, de donde sale el titular real.
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param portalProxiesRepo - Apoderamientos de portal.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly portalProxiesRepo: PatientPortalProxiesRepository,
  ) {}

  /**
   * ¿Es ese paciente el propio titular de la cuenta?
   *
   * Se resuelve **siempre** por `person_account_links` y nunca por el claim
   * `pid` del token: `pid` es un dato de identificación que no participa de
   * ninguna decisión, y usarlo como criterio de permiso lo convertiría en una
   * credencial. Es el mismo camino que recorren las lecturas propias del portal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - El paciente en cuestión.
   * @param actor - Quien pide.
   * @returns `true` si la cuenta es la de ese paciente.
   */
  private async isOwnPatient(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return false;
    const patient = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    return patient !== null && patient.profileId === link.personId;
  }

  /**
   * ¿Puede esta cuenta actuar por ese paciente, sea por ser él o por representarlo?
   *
   * @param patientProfileId - El paciente sobre el que se quiere actuar.
   * @param actor - Quien pide.
   * @param em - Transacción activa, si la hay; si no, se bifurca una lectura.
   * @returns `true` si es el titular o tiene apoderamiento vigente.
   */
  async representsPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    em?: EntityManager,
  ): Promise<boolean> {
    const contexto = em ?? this.em.fork();
    if (await this.isOwnPatient(contexto, patientProfileId, actor)) return true;
    const proxy = await this.portalProxiesRepo.findActiveByProxyUserAndPatient(
      contexto,
      actor.id,
      patientProfileId,
      new Date(),
    );
    return proxy !== null;
  }

  /**
   * Los pacientes que esta cuenta representa, sin contar el suyo.
   *
   * Existe para las lecturas que proyectan una página entera: preguntar por cada
   * fila convertiría un listado de cien citas en cien consultas. Devuelve un
   * conjunto para que el consumidor pueda decidir fila a fila sin volver a la base.
   *
   * @param userId - La cuenta que representa.
   * @param em - Transacción activa, si la hay.
   * @returns Los perfiles de paciente que representa, vigentes hoy.
   */
  async findActiveProxiedPatientIds(
    userId: string,
    em?: EntityManager,
  ): Promise<Set<string>> {
    const contexto = em ?? this.em.fork();
    const proxies = await this.portalProxiesRepo.findActiveByProxyUser(
      contexto,
      userId,
      new Date(),
    );
    return new Set(proxies.map((proxy) => proxy.patientProfileId));
  }

  /**
   * Exige poder actuar por ese paciente.
   *
   * El rechazo es **el mismo** para quien no tiene apoderamiento, para quien
   * apunta a un paciente ajeno y para quien inventa un uuid: distinguirlos
   * confirmaría la existencia de un paciente a quien sólo probó suerte.
   *
   * @param patientProfileId - El paciente sobre el que se quiere actuar.
   * @param actor - Quien pide.
   * @param em - Transacción activa, si la hay.
   * @throws ForbiddenException si no es el titular ni su representante.
   */
  async assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    em?: EntityManager,
  ): Promise<void> {
    if (await this.representsPatient(patientProfileId, actor, em)) return;
    throw new ForbiddenException(
      'No cuenta con autorización de tutoría sobre el paciente indicado',
    );
  }
}
