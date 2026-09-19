import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  ChartCarePlansController,
  ChartDocumentsController,
  ChartNotesController,
  ChartReadController,
} from '../../chart/controllers';
import {
  ClinicalEncountersController,
  ClinicalObservationsController,
  ClinicalOrdersController,
  ClinicalReadController,
  ClinicalRecordsController,
} from '../controllers';
import { ClinicalRecordAccessGuard } from './clinical-record-access.guard';

/**
 * SEC-01 · el montaje efectivo del guard, escrito como contrato.
 *
 * Un spec que instancia el controlador con `new` y llama al método **no** puede
 * afirmar que una ruta está protegida: Nest nunca ejecuta el guard en ese
 * camino. Lo que sí es comprobable sin levantar la aplicación es la metadata
 * que `@UseGuards` deja sobre cada handler, que es exactamente lo que Nest lee
 * en tiempo de arranque para armar la cadena. Por eso se lee
 * `GUARDS_METADATA` —la constante real de Nest, no el string `'__guards__'`—
 * sobre el descriptor de cada método, igual que el resto del repo hace con
 * `ROLES_KEY`.
 *
 * Las ausencias se comprueban igual que las presencias, y a propósito. La
 * trampa de SEC-01 no es olvidar un `@UseGuards`: es ponerlo donde el guard no
 * puede decidir nada —rutas cuyo paciente sólo se conoce cargando la receta o
 * la nota— y quedarse con la sensación de haber cerrado el agujero. Si alguien
 * «completa» el montaje sobre esas rutas, este spec falla y obliga a resolver
 * GAP-3 de verdad en lugar de maquillarlo.
 */
const guardsDe = (controller: unknown, handler: string): unknown[] =>
  (Reflect.getMetadata(
    GUARDS_METADATA,
    Object.getOwnPropertyDescriptor(
      (controller as { prototype: object }).prototype,
      handler,
    )!.value,
  ) as unknown[]) ?? [];

const guardsDeLaClase = (controller: unknown): unknown[] =>
  (Reflect.getMetadata(GUARDS_METADATA, controller as object) as unknown[]) ??
  [];

/** Los 12 handlers cuyo `patientProfileId` viaja en la petición. */
const HANDLERS_PROTEGIDOS: ReadonlyArray<readonly [unknown, string, string]> = [
  [ClinicalRecordsController, 'createCondition', 'POST /clinical/conditions'],
  [
    ClinicalRecordsController,
    'createAllergy',
    'POST /clinical/allergy-intolerances',
  ],
  [
    ClinicalRecordsController,
    'prescribeMedication',
    'POST /clinical/medication-requests',
  ],
  [
    ClinicalRecordsController,
    'administerMedication',
    'POST /clinical/medication-records',
  ],
  [ClinicalRecordsController, 'createProcedure', 'POST /clinical/procedures'],
  [
    ClinicalRecordsController,
    'createImmunization',
    'POST /clinical/immunizations',
  ],
  [ClinicalObservationsController, 'record', 'POST /clinical/observations'],
  [
    ClinicalOrdersController,
    'createServiceRequest',
    'POST /clinical/service-requests',
  ],
  [
    ClinicalOrdersController,
    'createDiagnosticReport',
    'POST /clinical/diagnostic-reports',
  ],
  [ChartNotesController, 'createNote', 'POST /charts/notes'],
  [ChartCarePlansController, 'createCarePlan', 'POST /charts/care-plans'],
  [ChartDocumentsController, 'createDocument', 'POST /charts/documents'],
];

/**
 * Las dos rutas del arranque de la atención. Traen `patientProfileId` en el
 * cuerpo —el guard **podría** evaluarlas— y aun así no lo llevan.
 *
 * `assertPuedeLeerHistoria` abre por turno de HOY o relación vigente, y estas
 * dos operaciones son parte del acto que **funda** esa relación: pedirles
 * autorización previa cierra el círculo «necesito acceso para ejecutar la
 * operación que crea el acceso». Montar el guard acá sería reutilizar una
 * política con la semántica equivocada y, de paso, dejar dos rutas con aspecto
 * de resueltas.
 *
 * Están en esta lista, y no simplemente ausentes del inventario, justamente
 * para que la exclusión sea una decisión visible y no un descuido:
 * `BOOTSTRAP_ACCESS_RESIDUAL` sigue **abierto**, y estas rutas **no están
 * protegidas** por paciente.
 */
const HANDLERS_BOOTSTRAP_SIN_GUARD: ReadonlyArray<
  readonly [unknown, string, string]
> = [
  [
    ClinicalEncountersController,
    'openEpisode',
    'POST /clinical/care-episodes · BOOTSTRAP_ACCESS_RESIDUAL',
  ],
  [
    ClinicalEncountersController,
    'checkIn',
    'POST /clinical/encounters/check-in · BOOTSTRAP_ACCESS_RESIDUAL',
  ],
];

/**
 * Rutas mutantes que NO deben llevar el guard, con el motivo por el que no.
 *
 * Estas rutas conocen a su paciente sólo después de cargar el recurso, y el
 * guard no carga recursos: montarlo ahí lo haría devolver `true` sin evaluar
 * nada. Eran el GAP-3 de SEC-01; desde MCH-007 las autoriza cada servicio con
 * `ClinicalReadService.assertPuedeEscribirHistoria`, y cada spec de servicio
 * prueba que sin permiso no escriben. `checkDuplicateStudy` es otro motivo distinto — no persiste y ya pasa
 * por la misma política dentro de su servicio.
 */
const HANDLERS_SIN_GUARD: ReadonlyArray<readonly [unknown, string, string]> = [
  [
    ClinicalRecordsController,
    'changeConditionStatus',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'attachFileToCondition',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'editMedicationDraft',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'signMedicationRequest',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'issueMedicationRequest',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'invalidateMedicationRequest',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'replaceMedicationRequest',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'renewMedicationRequest',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalRecordsController,
    'attachFileToProcedure',
    'MCH-007: lo autoriza el servicio',
  ],
  [ClinicalEncountersController, 'close', 'MCH-007: lo autoriza el servicio'],
  [ClinicalObservationsController, 'amend', 'MCH-007: lo autoriza el servicio'],
  [
    ClinicalOrdersController,
    'releaseDiagnosticReport',
    'MCH-007: lo autoriza el servicio',
  ],
  [ChartNotesController, 'addVersion', 'MCH-007: lo autoriza el servicio'],
  [ChartNotesController, 'signVersion', 'MCH-007: lo autoriza el servicio'],
  [ChartNotesController, 'cosignVersion', 'MCH-007: lo autoriza el servicio'],
  [ChartNotesController, 'amendNote', 'MCH-007: lo autoriza el servicio'],
  [ChartNotesController, 'releaseVersion', 'MCH-007: lo autoriza el servicio'],
  [ChartNotesController, 'withholdVersion', 'MCH-007: lo autoriza el servicio'],
  [
    ChartNotesController,
    'recordExamFindings',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ChartCarePlansController,
    'updateActivity',
    'MCH-007: lo autoriza el servicio',
  ],
  [
    ClinicalOrdersController,
    'checkDuplicateStudy',
    'ya evalúa la política en ServiceRequestsService.checkDuplicate',
  ],
];

describe('SEC-01 · montaje de ClinicalRecordAccessGuard', () => {
  it.each(HANDLERS_PROTEGIDOS)(
    'protege %p.%s (%s)',
    (controller, handler, _ruta) => {
      expect(guardsDe(controller, handler)).toContain(
        ClinicalRecordAccessGuard,
      );
    },
  );

  it('cubre exactamente los 12 handlers del CORE de SEC-01', () => {
    expect(HANDLERS_PROTEGIDOS).toHaveLength(12);
  });

  it.each(HANDLERS_BOOTSTRAP_SIN_GUARD)(
    'deja fuera %p.%s, sin fingir que está resuelta (%s)',
    (controller, handler, _motivo) => {
      expect(guardsDe(controller, handler)).not.toContain(
        ClinicalRecordAccessGuard,
      );
    },
  );

  it.each(HANDLERS_SIN_GUARD)(
    'no finge proteger %p.%s (%s)',
    (controller, handler, _motivo) => {
      expect(guardsDe(controller, handler)).not.toContain(
        ClinicalRecordAccessGuard,
      );
    },
  );

  it('monta handler a handler, nunca sobre la clase, en los controladores de escritura', () => {
    // A nivel de clase el guard alcanzaría también a las rutas por id y las
    // dejaría con aspecto de protegidas por él.
    for (const controller of [
      ClinicalRecordsController,
      ClinicalEncountersController,
      ClinicalObservationsController,
      ClinicalOrdersController,
      ChartNotesController,
      ChartCarePlansController,
      ChartDocumentsController,
    ]) {
      expect(guardsDeLaClase(controller)).not.toContain(
        ClinicalRecordAccessGuard,
      );
    }
  });

  it('deja intacto el montaje de clase de los dos controladores de lectura', () => {
    // FT-07-R08 ya los protegía por clase, y ahí sí corresponde: su única ruta
    // lleva `:patientProfileId`. SEC-01 no los toca.
    expect(guardsDeLaClase(ClinicalReadController)).toContain(
      ClinicalRecordAccessGuard,
    );
    expect(guardsDeLaClase(ChartReadController)).toContain(
      ClinicalRecordAccessGuard,
    );
  });
});
