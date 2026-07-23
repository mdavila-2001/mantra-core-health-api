import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log(`
  __  __             _             ____                  _____           _ 
 |  \\/  | __ _ _ __ | |_ _ __ __ _/ ___|___  _ __ ___   |_   _|__  ___| |__  
 | |\\/| |/ _\` | '_ \\| __| '__/ _\` | |   / _ \\| '__/ _ \\    | |/ _ \\/ __| '_ \\
 | |  | | (_| | | | | |_| | | (_| | |__| (_) | | |  __/    | |  __/ (__| | | |
 |_|  |_|\\__,_|_| |_|\\__|_|  \\__,_|\\____\\___/|_|  \\___|    |_|\\___|\\___|_| |_|
 =============================================================================
  MANTRA CORE TECHNOLOGIES - REDESA HEALTH API
 =============================================================================
  `);
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
