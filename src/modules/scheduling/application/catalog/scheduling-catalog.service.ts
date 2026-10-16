import { CloseSlotsUseCase } from './use-cases/close-slots.use-case';
import { CreateBookingPolicyUseCase } from './use-cases/create-booking-policy.use-case';
import { CreateExceptionUseCase } from './use-cases/create-exception.use-case';
import { CreateResourceUseCase } from './use-cases/create-resource.use-case';
import { CreateTemplateUseCase } from './use-cases/create-template.use-case';
import { GenerateSlotsUseCase } from './use-cases/generate-slots.use-case';
import { GetResourceAgendaUseCase } from './use-cases/get-resource-agenda.use-case';
import { Injectable } from '@nestjs/common';
import { ListCatalogLookupsUseCase } from './use-cases/list-catalog-lookups.use-case';
import { ListExceptionsUseCase } from './use-cases/list-exceptions.use-case';
import { ListTemplatesUseCase } from './use-cases/list-templates.use-case';
import { ReactivateTemplateUseCase } from './use-cases/reactivate-template.use-case';
import { RemoveExceptionUseCase } from './use-cases/remove-exception.use-case';
import { RetireTemplateUseCase } from './use-cases/retire-template.use-case';
import { ShiftSlotsUseCase } from './use-cases/shift-slots.use-case';
import { UpdateExceptionUseCase } from './use-cases/update-exception.use-case';
import { UpdateTemplateUseCase } from './use-cases/update-template.use-case';

/**
 * Fachada del catálogo de agenda: recursos, políticas, plantillas, cupos y
 * excepciones. Conserva la API pública que usan los controllers y delega cada
 * operación en su caso de uso (`use-cases/`); no tiene reglas propias.
 */
@Injectable()
export class SchedulingCatalogService {
  constructor(
    private readonly createResourceUseCase: CreateResourceUseCase,
    private readonly createBookingPolicy: CreateBookingPolicyUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly reactivateTemplateUseCase: ReactivateTemplateUseCase,
    private readonly retireTemplateUseCase: RetireTemplateUseCase,
    private readonly generateSlotsUseCase: GenerateSlotsUseCase,
    private readonly closeSlotsUseCase: CloseSlotsUseCase,
    private readonly shiftSlotsUseCase: ShiftSlotsUseCase,
    private readonly createExceptionUseCase: CreateExceptionUseCase,
    private readonly updateExceptionUseCase: UpdateExceptionUseCase,
    private readonly removeExceptionUseCase: RemoveExceptionUseCase,
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly listExceptionsUseCase: ListExceptionsUseCase,
    private readonly getResourceAgendaUseCase: GetResourceAgendaUseCase,
    private readonly lookups: ListCatalogLookupsUseCase,
  ) {}

  createResource(...args: Parameters<CreateResourceUseCase['execute']>) {
    return this.createResourceUseCase.execute(...args);
  }

  createPolicy(...args: Parameters<CreateBookingPolicyUseCase['execute']>) {
    return this.createBookingPolicy.execute(...args);
  }

  createTemplate(...args: Parameters<CreateTemplateUseCase['execute']>) {
    return this.createTemplateUseCase.execute(...args);
  }

  updateTemplate(...args: Parameters<UpdateTemplateUseCase['execute']>) {
    return this.updateTemplateUseCase.execute(...args);
  }

  reactivateTemplate(
    ...args: Parameters<ReactivateTemplateUseCase['execute']>
  ) {
    return this.reactivateTemplateUseCase.execute(...args);
  }

  retireTemplate(...args: Parameters<RetireTemplateUseCase['execute']>) {
    return this.retireTemplateUseCase.execute(...args);
  }

  generateSlots(...args: Parameters<GenerateSlotsUseCase['execute']>) {
    return this.generateSlotsUseCase.execute(...args);
  }

  closeSlots(...args: Parameters<CloseSlotsUseCase['execute']>) {
    return this.closeSlotsUseCase.execute(...args);
  }

  shiftSlots(...args: Parameters<ShiftSlotsUseCase['execute']>) {
    return this.shiftSlotsUseCase.execute(...args);
  }

  createException(...args: Parameters<CreateExceptionUseCase['execute']>) {
    return this.createExceptionUseCase.execute(...args);
  }

  updateException(...args: Parameters<UpdateExceptionUseCase['execute']>) {
    return this.updateExceptionUseCase.execute(...args);
  }

  removeException(...args: Parameters<RemoveExceptionUseCase['execute']>) {
    return this.removeExceptionUseCase.execute(...args);
  }

  listTemplates(...args: Parameters<ListTemplatesUseCase['execute']>) {
    return this.listTemplatesUseCase.execute(...args);
  }

  listExceptions(...args: Parameters<ListExceptionsUseCase['execute']>) {
    return this.listExceptionsUseCase.execute(...args);
  }

  getResourceAgenda(...args: Parameters<GetResourceAgendaUseCase['execute']>) {
    return this.getResourceAgendaUseCase.execute(...args);
  }

  listActivityTypes(
    ...args: Parameters<ListCatalogLookupsUseCase['activityTypes']>
  ) {
    return this.lookups.activityTypes(...args);
  }

  listExceptionTypes(
    ...args: Parameters<ListCatalogLookupsUseCase['exceptionTypes']>
  ) {
    return this.lookups.exceptionTypes(...args);
  }
}
