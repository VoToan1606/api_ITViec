import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from "src/decorators/customize";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    // You can throw an exception based on either "info" or "err" arguments
    // const req = context.switchToHttp().getRequest();
    const [req] = context.getArgs();
    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSION,
      [context.getHandler(), context.getClass()]
    );
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          "Token khong hop le hoac chua truyen token qua bear token"
        )
      );
    }
    const permissions = user?.permissions ?? [];
    const path = req?.route?.path as string;
    const method = req?.method;

    let isExist = permissions.find((permission) => {
      return permission?.apiPath === path && permission?.method === method;
    });

    if (path.startsWith("/api/v1/auth")) isExist = true;

    if (!isExist && !isSkipPermission) {
      throw new HttpException(
        "ban khong co quyen truy cap",
        HttpStatus.FORBIDDEN
      );
    }
    return user;
  }
}
