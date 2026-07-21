import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API Gateway listening on http://127.0.0.1:${port}`);
}

void bootstrap();
