import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedAdminInterface } from '../interfaces/index.js';

/** Lấy admin đã xác thực mà guard gắn vào request. */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdminInterface =>
    context.switchToHttp().getRequest().admin,
);
