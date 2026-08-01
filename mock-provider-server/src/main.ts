import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadEnv } from './common/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mantra REDESA — Mock Provider Server')
    .setDescription(
      'Emulador de proveedores externos (mensajería, borrado cross-store, embeddings) ' +
        'para probar los workers de mantra-core-health-redesa-api sin credenciales reales.',
    )
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'x-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.port);
  Logger.log(
    `mock-provider-server escuchando en :${env.port} (docs en /docs)`,
    'Bootstrap',
  );

  // Con la tasa de rechazo en 0 -el valor por defecto- este emulador acepta
  // TODA verificación: el documento de identidad de un paciente y la matrícula
  // de un médico salen ACCEPTED por igual. Es lo correcto para probar el camino
  // feliz, y es exactamente lo que no debe pasar inadvertido: sin este aviso,
  // un backend conectado aquí parece verificar identidades cuando en realidad
  // no comprueba nada.
  if (env.identityVerificationRejectionRate === 0) {
    Logger.warn(
      'VERIFICACIÓN AUTOMÁTICA ACTIVA: tasa de rechazo 0, se ACEPTA toda ' +
        'verificación de identidad y de matrícula profesional. Para simular ' +
        'rechazos, definir IDENTITY_VERIFICATION_REJECTION_RATE (0..1).',
      'Bootstrap',
    );
  }
}

void bootstrap();
