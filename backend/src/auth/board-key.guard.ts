import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// Protects the board REST API with a shared password (header: x-board-key).
// If BOARD_PASSWORD is not set, auth is disabled (dev mode). webhook/health bypass this guard.
@Injectable()
export class BoardKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const password = process.env.BOARD_PASSWORD;
    if (!password) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.headers['x-board-key'] === password) return true;
    throw new UnauthorizedException('invalid board key');
  }
}
