import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SurveysTemplatesController,
  SurveysAssignmentsController,
  SurveysPatientController,
} from './controllers';
import {
  SurveysTemplatesService,
  SurveysAssignmentsService,
  SurveysResponsesService,
} from './services';
import {
  TemplatesRepository,
  AssignmentsRepository,
  InvitationsRepository,
  ResponsesRepository,
} from './repositories';

/**
 * Módulo Surveys: cuestionarios y encuestas de satisfacción end-to-end.
 *
 * Cubre la autoría del instrumento (plantilla, versión inmutable, preguntas con
 * tipo y obligatoriedad, vigencia), su reparto (asignación a consulta o
 * servicio, invitación contra una atención completada) y las respuestas
 * privadas del paciente con su lectura por el profesional dueño.
 *
 * **No es lo mismo que `community.polls` ni que `forms`.** Las primeras son
 * encuestas sociales de una publicación; el segundo es un motor EAV para
 * extender entidades con campos a medida. Ninguno modela un instrumento
 * dirigido a un destinatario con ventana de respuesta y respuestas privadas,
 * que es exactamente lo que ALOVIDA pide y lo que hay acá.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    SurveysTemplatesController,
    SurveysAssignmentsController,
    SurveysPatientController,
  ],
  providers: [
    // Repositorios
    TemplatesRepository,
    AssignmentsRepository,
    InvitationsRepository,
    ResponsesRepository,
    // Servicios
    SurveysTemplatesService,
    SurveysAssignmentsService,
    SurveysResponsesService,
  ],
  // `billing` los reutiliza para auto-crear la encuesta de satisfacción por
  // defecto de un servicio médico nuevo (FT-31), en la misma transacción que
  // lo da de alta — no vale la pena un segundo viaje HTTP a este módulo para
  // algo que puede ser una escritura más dentro de la misma.
  exports: [TemplatesRepository, AssignmentsRepository],
})
export class SurveysModule {}
