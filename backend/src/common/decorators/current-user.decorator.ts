import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRole } from '../constants';

export interface CurrentUserData {
  sub: string;
  email: string;
  role: AppRole;
}

export const CurrentUser = createParamDecorator(
  (property: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;

    return property ? user?.[property] : user;
  },
);
