import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { ClinicalReadService } from '../services';

/**
 * Métodos que escriben en el expediente y traen al paciente en el cuerpo.
 *
 * Son los tres que nombra `AC-SEC-01`. `DELETE` queda fuera a propósito y no
 * por olvido: hoy ninguna ruta de escritura del expediente lo usa, y ampliar el
 * conjunto sin una ruta que lo justifique sería decidir por la fuente. Si algún
 * día aparece un `DELETE` con paciente en el cuerpo, se agrega acá y se prueba.
 */
const METODOS_MUTANTES: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Saca el paciente del cuerpo crudo de la petición, o `undefined`.
 *
 * El guard corre **antes** del `ValidationPipe` global (`src/main.ts`), así que
 * lo que se ve acá es lo que mandó el cliente: sin whitelist, sin transformar y
 * sin validar. De ahí la única regla: **sólo un string no vacío cuenta**. Un
 * `patientProfileId` que llegue como array (`['ajeno', 'propio']`), objeto o
 * número no se convierte a texto para preguntar por él — coercionarlo dejaría
 * que el cliente eligiera qué historia se evalúa.
 *
 * Descartar un valor así no abre un hueco, y está comprobado, no supuesto: los
 * DTO de escritura del expediente declaran `@IsUUID()` sobre este campo, y el pipe
 * —`whitelist`, `forbidNonWhitelisted`, `transform` con
 * `enableImplicitConversion`— rechaza con 400 cualquier array, objeto, número,
 * booleano, `null` o string vacío. Ninguno de esos valores llega nunca al
 * handler, así que un cuerpo malformado no escribe en el expediente por mucho
 * que el guard lo haya ignorado.
 */
function pacienteDelCuerpo(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const valor = (body as Record<string, unknown>).patientProfileId;
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

/**
 * FT-07-R08 (CAN-AUTH-001): la puerta única del expediente clínico.
 *
 * Delega la decisión entera en
 * {@link ClinicalReadService.assertPuedeLeerHistoria}, que ya resuelve, en este
 * orden: `SUPERADMIN` pasa; el paciente lee sólo la propia historia
 * (`assertOwnRecord`); quien atiende pasa con un turno de HOY con esa persona
 * o —sin turno— con una relación asistencial/acceso clínico vigente que el
 * paciente autorizó explícitamente (PDP de `authz`, FT-07-R05/R06/R07).
 *
 * Antes `ClinicalReadController`/`ChartReadController` dejaban pasar a
 * cualquier `CLINICIAN`/`PRACTITIONER` autenticado con solo pegar un
 * `patientProfileId` — el propio código lo documentaba como deuda pendiente.
 * Ambos controladores comparten este guard (`ClinicalModule` lo exporta) para
 * no mantener la misma pregunta de autorización resuelta dos veces.
 *
 * ## SEC-01: por qué también mira el cuerpo
 *
 * El guard sólo leía `request.params`, y las escrituras del expediente no
 * llevan al paciente en la ruta sino en el cuerpo (`POST /clinical/conditions`,
 * `POST /charts/notes`…). Aun montándolo, esas rutas caían en el `return true`
 * de «no es de la incumbencia de este guard»: cualquier `CLINICIAN` autenticado
 * escribía en la historia de quien quisiera mandando un `patientProfileId`
 * ajeno. La política ya existía y ya estaba probada; lo que faltaba era el
 * cableado.
 *
 * La lectura no cambia: en `GET` se mira exactamente lo mismo que antes —la
 * ruta— y no se interpreta cuerpo alguno. Los dos controladores de lectura que
 * cuelgan de este guard se comportan igual que ayer.
 *
 * ## Qué NO hace, y por qué
 *
 * No carga recursos. Las rutas de comando cuyo paciente sólo se conoce cargando
 * la receta, la nota o la observación (`medication-requests/:id/sign`,
 * `notes/:noteId/versions`…) **no** quedan cubiertas: resolverlas exigiría
 * meter repositorios de dos módulos dentro de un guard y una consulta extra por
 * petición. Es deuda de seguridad abierta y trazada (GAP-3 del discovery de
 * SEC-01), no un caso olvidado. Por eso el guard se monta **handler a handler**
 * sobre las rutas cuyo paciente ya viaja en la petición, y no a nivel de clase:
 * una ruta no debe parecer protegida cuando el guard va a terminar dejándola
 * pasar sin evaluar nada.
 *
 * Tampoco gobierna el arranque de la atención —`POST /clinical/care-episodes` y
 * `POST /clinical/encounters/check-in`—, aunque traigan el paciente en el
 * cuerpo: esta política exige un turno o una relación **previos**, y esas dos
 * operaciones son las que los fundan. Residual propio y abierto
 * (`BOOTSTRAP_ACCESS_RESIDUAL`), explicado en `ClinicalEncountersController`.
 */
@Injectable()
export class ClinicalRecordAccessGuard implements CanActivate {
  constructor(private readonly readService: ClinicalReadService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    const parametro = request.params?.patientProfileId;
    const deLaRuta = Array.isArray(parametro) ? parametro[0] : parametro;

    // El cuerpo sólo se mira en los métodos que escriben. Un `GET` se sigue
    // decidiendo con la ruta y nada más.
    const delCuerpo = METODOS_MUTANTES.has(request.method)
      ? pacienteDelCuerpo(request.body)
      : undefined;

    // Ruta primero, cuerpo después, y sin repetir: cuando los dos traen el
    // mismo paciente se pregunta una sola vez —preguntar dos veces por la misma
    // persona duplica la consulta de autorización sin cambiar la respuesta—.
    // Cuando traen personas distintas se evalúan las dos: la petición toca dos
    // historias, y el permiso sobre una no es permiso sobre la otra. No hace
    // falta inventar un error de «discrepancia»: si el actor no puede con
    // alguna de las dos, la política ya responde lo que corresponde.
    const aEvaluar: string[] = [];
    for (const candidato of [deLaRuta, delCuerpo]) {
      if (candidato && !aEvaluar.includes(candidato)) aEvaluar.push(candidato);
    }

    if (!actor || aEvaluar.length === 0) {
      // Sin sujeto o sin paciente identificable en la petición: no es de la
      // incumbencia de este guard — `JwtAuthGuard`/`RolesGuard` ya se ocuparon,
      // o el handler no aplica.
      return true;
    }

    for (const patientProfileId of aEvaluar) {
      // Lanza `ForbiddenException` si no corresponde; NestJS la propaga tal
      // cual. Secuencial y no en paralelo: el primer paciente que el actor no
      // puede tocar corta la petición sin lanzar la consulta del segundo.
      await this.readService.assertPuedeLeerHistoria(patientProfileId, actor);
    }
    return true;
  }
}
