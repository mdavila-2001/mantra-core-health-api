export {
  CreateResourceDto,
  ResourceResponseDto,
  CreateBookingPolicyDto,
  BookingPolicyResponseDto,
  ScheduleRuleDto,
  CreateTemplateDto,
  TemplateResponseDto,
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
  CreateExceptionDto,
  ExceptionResponseDto,
  RESOURCE_TYPES,
} from './scheduling-catalog.dto';
export type { ResourceType, ExceptionType } from './scheduling-catalog.dto';

export {
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  BookingResponseDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  WorkerBatchResultDto,
  WorkerBatchDto,
  BOOKING_CHANNELS,
} from './scheduling-bookings.dto';
export type { BookingChannel } from './scheduling-bookings.dto';
