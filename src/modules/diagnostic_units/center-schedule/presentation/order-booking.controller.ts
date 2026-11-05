import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { BookOrderUseCase } from '../application/book-order.use-case';
import { CancelOrderBookingUseCase } from '../application/cancel-order-booking.use-case';
import { GetBookingOptionsUseCase } from '../application/get-booking-options.use-case';
import { OrderBookingOptionsDto } from './dto/booking-options.dto';
import { BookOrderDto, OrderAppointmentDto } from './dto/order-booking.dto';

/**
 * Booking a laboratory or imaging study from the doctor's order. Hangs from
 * `/diagnostic-results/me` like the rest of the patient portal: no patient id
 * in the path, the person comes from the session (account → person).
 * Four segments, so it never collides with `me/:reportId/*`.
 */
@ApiTags('diagnostics-patient-results')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('diagnostic-results')
export class OrderBookingController {
  constructor(
    private readonly options: GetBookingOptionsUseCase,
    private readonly booker: BookOrderUseCase,
    private readonly canceller: CancelOrderBookingUseCase,
  ) {}

  @Get('me/orders/:orderId/booking-options')
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_ORDER',
    patient: 'actor',
    resourceId: 'param:orderId',
  })
  @ApiOperation({ summary: 'Centers that perform the study of my order' })
  @ApiOkResponse({ type: OrderBookingOptionsDto })
  bookingOptions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<OrderBookingOptionsDto> {
    return this.options.execute(actor, orderId);
  }

  @Post('me/orders/:orderId/booking')
  @HttpCode(HttpStatus.CREATED)
  @Audited({
    action: 'DIAGNOSTIC_ORDER_BOOKED',
    entity: 'appointment_booking',
    entityId: 'param:orderId',
  })
  @ApiOperation({ summary: 'Book my order at a center, confirmed' })
  @ApiCreatedResponse({ type: OrderAppointmentDto })
  @ApiConflictResponse({
    description:
      '`details.slotTaken`: the start filled up meanwhile; without it, the order already has an appointment.',
  })
  book(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: BookOrderDto,
  ): Promise<OrderAppointmentDto> {
    return this.booker.execute(actor, orderId, dto);
  }

  @Delete('me/orders/:orderId/booking')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audited({
    action: 'DIAGNOSTIC_ORDER_BOOKING_CANCELLED',
    entity: 'appointment_booking',
    entityId: 'param:orderId',
  })
  @ApiOperation({ summary: 'Cancel the appointment of my order' })
  @ApiNoContentResponse()
  cancel(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<void> {
    return this.canceller.execute(actor, orderId);
  }
}
