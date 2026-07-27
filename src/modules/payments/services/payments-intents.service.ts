import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PaymentIntentsRepository,
  PaymentFlowRepository,
} from '../repositories';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  CreateFxLockDto,
  FxLockResponseDto,
  CreateRiskAssessmentDto,
  RiskAssessmentResponseDto,
  CreateSplitDto,
  SplitResponseDto,
  type PaymentPurpose,
  type RiskDecision,
} from '../dto';

const PURPOSE_CONCEPT: Readonly<Record<PaymentPurpose, string>> = {
  INVOICE: CONCEPTS.PAY_PURPOSE_INVOICE,
  DEBT: CONCEPTS.PAY_PURPOSE_DEBT,
  OTHER: CONCEPTS.PAY_PURPOSE_OTHER,
};

const CURRENCY_CONCEPT: Readonly<Record<'BOB' | 'USD', string>> = {
  BOB: CONCEPTS.CURRENCY_BOB,
  USD: CONCEPTS.CURRENCY_USD,
};

const RISK_DECISION_CONCEPT: Readonly<Record<RiskDecision, string>> = {
  APPROVE: CONCEPTS.RISK_APPROVE,
  REVIEW: CONCEPTS.RISK_REVIEW,
  DECLINE: CONCEPTS.RISK_DECLINE,
};

/** Umbrales del score que derivan el nivel de riesgo declarado por el modelo. */
const RISK_LEVEL_THRESHOLDS = { medium: 40, high: 70 } as const;

/**
 * Ciclo de vida de la intención de pago: creación idempotente, bloqueo de tipo
 * de cambio, evaluación de riesgo y reparto multi-party (UC-42-01/03/04/11).
 */
@Injectable()
export class PaymentsIntentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly intentsRepo: PaymentIntentsRepository,
    private readonly flowRepo: PaymentFlowRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsIntentsService.name);
  }

  /**
   * UC-42-01: crea la intención de pago.
   *
   * La clave de idempotencia se consulta antes de abrir la transacción para poder
   * devolver el intent existente con `reused=true` en vez de dejar que la UNIQUE
   * falle con un conflicto: un reintento del cliente no debe traducirse en un
   * segundo cobro ni en un error. La constraint sigue siendo la garantía última
   * frente a dos peticiones simultáneas.
   */
  async createIntent(
    dto: CreatePaymentIntentDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentIntentResponseDto> {
    this.logger.info(
      {
        operation: 'payments.intent.create',
        tenantId: dto.tenantId,
        gatewayId: dto.gatewayId,
      },
      'Creating payment intent',
    );

    const existing = await this.intentsRepo.findByIdempotencyKey(
      this.em,
      dto.tenantId,
      dto.idempotencyKey,
    );
    if (existing) {
      this.logger.info(
        {
          operation: 'payments.intent.create',
          intentId: existing.id,
          reused: true,
        },
        'Idempotent retry resolved to existing intent',
      );
      return this.toIntentResponse(existing, true);
    }

    return this.em.transactional(async (tx) => {
      const intent = this.intentsRepo.create(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        gatewayId: dto.gatewayId,
        gatewayConnectionId: dto.gatewayConnectionId,
        purposeConceptId: PURPOSE_CONCEPT[dto.purpose],
        invoiceId: dto.invoiceId,
        sourceRefType: dto.sourceRefType,
        sourceRefId: dto.sourceRefId,
        amount: dto.amount,
        currencyConceptId: CURRENCY_CONCEPT[dto.currency],
        idempotencyKey: dto.idempotencyKey,
        statusConceptId: CONCEPTS.PI_PENDING,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        actorUserId: actor.id,
      });
      return this.toIntentResponse(intent, false);
    });
  }

  /**
   * UC-42-03: fija la cotización con la que se cobrará en otra moneda.
   *
   * Solo se permite sobre un intent pendiente y sin otro bloqueo vigente: una vez
   * que el cobro está en proceso el importe ya se comunicó al gateway, y dos
   * bloqueos activos harían ambiguo qué cotización aplica.
   */
  async lockFxRate(
    intentId: string,
    dto: CreateFxLockDto,
    actor: AuthenticatedUser,
  ): Promise<FxLockResponseDto> {
    this.logger.info(
      { operation: 'payments.intent.fx-lock', intentId },
      'Locking FX rate',
    );

    if (dto.fromCurrency === dto.toCurrency) {
      throw new PreconditionFailedException(
        'El bloqueo de cambio exige monedas distintas',
        {
          currency: dto.fromCurrency,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) {
        throw new ResourceNotFoundException('Intención de pago no encontrada', {
          intentId,
        });
      }
      if (intent.statusConceptId !== CONCEPTS.PI_PENDING) {
        throw new PreconditionFailedException(
          'Solo se puede bloquear el cambio de una intención pendiente',
          { intentId },
        );
      }

      const active = await this.flowRepo.findActiveFxLock(
        tx,
        intentId,
        CONCEPTS.FX_ACTIVE,
      );
      if (active) {
        throw new ConflictException(
          'La intención ya tiene un bloqueo de cambio vigente',
          {
            intentId,
            fxLockId: active.id,
          },
        );
      }

      const lock = this.flowRepo.createFxLock(tx, {
        paymentIntentId: intentId,
        fromCurrencyConceptId: CURRENCY_CONCEPT[dto.fromCurrency],
        toCurrencyConceptId: CURRENCY_CONCEPT[dto.toCurrency],
        lockedRate: dto.lockedRate,
        providerRef: dto.providerRef,
        lockedAt: new Date(),
        expiresAt: new Date(dto.expiresAt),
        statusConceptId: CONCEPTS.FX_ACTIVE,
        actorUserId: actor.id,
      });

      // El intent pasa a expresarse en la moneda destino: es el importe que verá
      // el pagador y el que se enviará al gateway.
      const converted = this.multiply(intent.amount, dto.lockedRate);
      intent.amount = converted;
      intent.currencyConceptId = CURRENCY_CONCEPT[dto.toCurrency];
      touch(intent, actor.id);

      return {
        id: lock.id,
        paymentIntentId: intentId,
        lockedRate: dto.lockedRate,
        convertedAmount: converted,
      };
    });
  }

  /**
   * UC-42-04: registra la evaluación antifraude y 3-D Secure.
   *
   * Una decisión `DECLINE` deja el intent en `failed`: no tiene sentido conservarlo
   * cobrable cuando el motor de riesgo ya lo rechazó.
   */
  async assessRisk(
    intentId: string,
    dto: CreateRiskAssessmentDto,
    actor: AuthenticatedUser,
  ): Promise<RiskAssessmentResponseDto> {
    this.logger.info(
      { operation: 'payments.intent.risk', intentId, decision: dto.decision },
      'Recording risk assessment',
    );

    return this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) {
        throw new ResourceNotFoundException('Intención de pago no encontrada', {
          intentId,
        });
      }

      const riskLevel = this.deriveRiskLevel(dto.riskScore);
      const assessment = this.flowRepo.createRiskAssessment(tx, {
        paymentIntentId: intentId,
        riskScore: dto.riskScore,
        riskLevelConceptId: this.riskLevelConcept(riskLevel),
        decisionConceptId: RISK_DECISION_CONCEPT[dto.decision],
        providerRef: dto.providerRef,
        signalsJson: dto.signals,
        threeDsStatusConceptId: dto.threeDsAuthenticated
          ? CONCEPTS.THREEDS_AUTHENTICATED
          : CONCEPTS.THREEDS_NOT_ENROLLED,
        assessedAt: new Date(),
        actorUserId: actor.id,
      });

      if (dto.decision === 'DECLINE') {
        intent.statusConceptId = CONCEPTS.PI_FAILED;
        touch(intent, actor.id);
        this.logger.warn(
          { operation: 'payments.intent.risk', intentId },
          'Intent failed by risk decision',
        );
      }

      return {
        id: assessment.id,
        paymentIntentId: intentId,
        decision: dto.decision,
        riskLevel,
      };
    });
  }

  /**
   * UC-42-11: reparte el cobro entre cuentas conectadas.
   *
   * La suma de los repartos no puede exceder el importe del intent; el modelo lo
   * refuerza con un trigger, pero se valida aquí para devolver un error de dominio
   * en vez de un fallo de base.
   */
  async addSplit(
    intentId: string,
    dto: CreateSplitDto,
    actor: AuthenticatedUser,
  ): Promise<SplitResponseDto> {
    this.logger.info(
      { operation: 'payments.intent.split', intentId },
      'Adding payment split',
    );

    if (dto.splitType === 'AMOUNT' && !dto.amount) {
      throw new PreconditionFailedException(
        'Un reparto por importe exige `amount`',
        { intentId },
      );
    }
    if (dto.splitType === 'PERCENTAGE' && !dto.percentage) {
      throw new PreconditionFailedException(
        'Un reparto por porcentaje exige `percentage`',
        {
          intentId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) {
        throw new ResourceNotFoundException('Intención de pago no encontrada', {
          intentId,
        });
      }

      const amount =
        dto.splitType === 'AMOUNT'
          ? (dto.amount as string)
          : this.percentageOf(intent.amount, dto.percentage as string);

      const existing = await this.flowRepo.findSplitsByIntent(tx, intentId);
      const allocated = existing.reduce(
        (sum, s) => sum + Number(s.amount ?? 0),
        0,
      );
      if (allocated + Number(amount) > Number(intent.amount)) {
        throw new ConflictException(
          'Los repartos superan el importe de la intención',
          {
            intentId,
            intentAmount: intent.amount,
          },
        );
      }

      const split = this.flowRepo.createSplit(tx, {
        paymentIntentId: intentId,
        payeeConnectedAccountId: dto.payeeConnectedAccountId,
        splitTypeConceptId:
          dto.splitType === 'AMOUNT'
            ? CONCEPTS.SPLIT_TYPE_AMOUNT
            : CONCEPTS.SPLIT_TYPE_PERCENTAGE,
        amount,
        percentage: dto.percentage,
        currencyConceptId: intent.currencyConceptId,
        isPlatformFee: dto.isPlatformFee ?? false,
        destinationWalletId: dto.destinationWalletId,
        statusConceptId: CONCEPTS.SPLIT_PENDING,
        actorUserId: actor.id,
      });

      return {
        id: split.id,
        paymentIntentId: intentId,
        amount,
        isPlatformFee: dto.isPlatformFee ?? false,
      };
    });
  }

  private toIntentResponse(
    intent: {
      id: string;
      tenantId: string;
      amount: string;
      statusConceptId: string;
      idempotencyKey: string;
    },
    reused: boolean,
  ): PaymentIntentResponseDto {
    return {
      id: intent.id,
      tenantId: intent.tenantId,
      amount: intent.amount,
      statusConceptId: intent.statusConceptId,
      idempotencyKey: intent.idempotencyKey,
      reused,
    };
  }

  private deriveRiskLevel(score: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const value = Number(score);
    if (value >= RISK_LEVEL_THRESHOLDS.high) return 'HIGH';
    if (value >= RISK_LEVEL_THRESHOLDS.medium) return 'MEDIUM';
    return 'LOW';
  }

  private riskLevelConcept(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    if (level === 'HIGH') return CONCEPTS.RISK_HIGH;
    if (level === 'MEDIUM') return CONCEPTS.RISK_MEDIUM;
    return CONCEPTS.RISK_LOW;
  }

  /** Importes con 2 decimales: el modelo los persiste como `numeric`, no como float. */
  private multiply(amount: string, rate: string): string {
    return (Number(amount) * Number(rate)).toFixed(2);
  }

  private percentageOf(amount: string, percentage: string): string {
    return ((Number(amount) * Number(percentage)) / 100).toFixed(2);
  }
}
