export {
  RunOutboxRelayDto,
  RelayedMessageDto,
  OutboxRelayResponseDto,
  DispatchEventDto,
  DispatchedSubscriberDto,
  DispatchEventResponseDto,
  AckEventDeliveryDto,
  EventDeliveryResponseDto,
  EnqueueJobDto,
  JobResponseDto,
  ClaimJobsDto,
  ClaimedJobDto,
  ClaimJobsResponseDto,
  CompleteJobDto,
  FailJobDto,
  FailJobResponseDto,
  RedriveDeadLetterDto,
  RedriveResponseDto,
  CreateNotificationRequestDto,
  NotificationRequestResponseDto,
  PendingNotificationRequestDto,
  PendingNotificationsResponseDto,
  DeliverNotificationDto,
  DeliverNotificationResponseDto,
  ProviderReceiptDto,
  ProviderReceiptResponseDto,
  InAppReadResponseDto,
} from './messaging.dto';
export type {
  EventAckOutcome,
  ReceiptType,
  DeliveryAttemptOutcome,
} from './messaging.dto';

/* --- Carril P1 · la bandeja in-app -----------------------------------------
   En archivo aparte (`in-app.dto.ts`) y no al final de `messaging.dto.ts`
   porque son la cara del **usuario final**, no la del worker ni la del
   proveedor: mezclarlas volvía a esconder cuál de las lecturas de
   notificaciones es la que alimenta la campana, que es exactamente lo que el
   relevamiento de P1 tuvo que desenredar. */
export {
  MyNotificationsQueryDto,
  NotificationDestinationDto,
  InAppNotificationDto,
  InAppNotificationPageDto,
  MarkAllInAppReadResponseDto,
  QuietHoursDto,
  CategoryPreferenceDto,
  UpdateMyPreferencesDto,
  MyPreferencesDto,
} from './in-app.dto';
