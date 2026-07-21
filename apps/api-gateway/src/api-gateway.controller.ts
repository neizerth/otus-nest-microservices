import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { CORRELATION_HEADER } from '@app/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller()
export class ApiGatewayController {
  constructor(private readonly gateway: ApiGatewayService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Post('users')
  createUser(
    @Body() body: { email: string; name: string },
    @Headers(CORRELATION_HEADER) correlationId: string,
  ) {
    return this.gateway.createUser({ ...body, correlationId });
  }

  @Get('users/:id')
  getUser(
    @Param('id') id: string,
    @Headers(CORRELATION_HEADER) correlationId: string,
  ) {
    return this.gateway.getUser(id, correlationId);
  }

  @Get('users/:id/events')
  getUserEvents(
    @Param('id') id: string,
    @Headers(CORRELATION_HEADER) correlationId: string,
  ) {
    return this.gateway.getUserEvents(id, correlationId);
  }

  @Post('hash')
  generateHash(
    @Body() body: { id: number; data: string },
    @Headers(CORRELATION_HEADER) correlationId: string,
  ) {
    return this.gateway.generateHash({ ...body, correlationId });
  }
}
