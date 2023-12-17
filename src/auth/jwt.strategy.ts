import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IUser } from "./interfaces/user.interface";
import { RolesService } from "src/roles/roles.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private rolesService: RolesService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_TOKEN_SECRECT"),
    });
  }

  async validate(payload: IUser) {
    const { _id, name, email, role } = payload;
    const temp = await this.rolesService.findOne(role._id);
    return {
      _id,
      name,
      email,
      role,
      permissions: temp?.permissions || [],
    };
  }
}
