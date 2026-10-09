import { CloseSlotsUseCase } from './close-slots.use-case';
import { CreateBookingPolicyUseCase } from './create-booking-policy.use-case';
import { CreateExceptionUseCase } from './create-exception.use-case';
import { CreateResourceUseCase } from './create-resource.use-case';
import { CreateTemplateUseCase } from './create-template.use-case';
import { GenerateSlotsUseCase } from './generate-slots.use-case';
import { GetResourceAgendaUseCase } from './get-resource-agenda.use-case';
import { ListCatalogLookupsUseCase } from './list-catalog-lookups.use-case';
import { ListExceptionsUseCase } from './list-exceptions.use-case';
import { ListTemplatesUseCase } from './list-templates.use-case';
import { ReactivateTemplateUseCase } from './reactivate-template.use-case';
import { RemoveExceptionUseCase } from './remove-exception.use-case';
import { RetireTemplateUseCase } from './retire-template.use-case';
import { ShiftSlotsUseCase } from './shift-slots.use-case';
import { UpdateExceptionUseCase } from './update-exception.use-case';
import { UpdateTemplateUseCase } from './update-template.use-case';

/** Un caso de uso por operación del catálogo; el módulo los registra como providers. */
export const catalogUseCases = [
  CloseSlotsUseCase,
  CreateBookingPolicyUseCase,
  CreateExceptionUseCase,
  CreateResourceUseCase,
  CreateTemplateUseCase,
  GenerateSlotsUseCase,
  GetResourceAgendaUseCase,
  ListCatalogLookupsUseCase,
  ListExceptionsUseCase,
  ListTemplatesUseCase,
  ReactivateTemplateUseCase,
  RemoveExceptionUseCase,
  RetireTemplateUseCase,
  ShiftSlotsUseCase,
  UpdateExceptionUseCase,
  UpdateTemplateUseCase,
];
