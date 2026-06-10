import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// ป้องกัน REST API ของบอร์ดด้วยรหัสผ่านร่วม (header: x-board-key)
// ไม่ตั้ง BOARD_PASSWORD = ปิด auth (โหมด dev) — webhook/health ไม่ใช้ guard นี้
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
