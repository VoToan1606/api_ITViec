import { BadGatewayException, Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { IUser } from "./interfaces/user.interface";
import { RegisterUserDto } from "src/users/dto/create-user.dto";
import { ConfigService } from "@nestjs/config";
import ms from "ms";
import { Response } from "express";
import { RolesService } from "src/roles/roles.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly rolesService: RolesService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUserByUserName(username);
    if (user && this.usersService.isValidUser(pass, user.password)) {
      const userRole = user.role as unknown as { _id: string; name: string };
      const temp = await this.rolesService.findOne(userRole._id);

      const objUser = {
        ...user.toObject(),
        permissions: temp?.permissions ?? [],
      };

      return objUser;
    }

    return null;
  }

  // async login(user: any) {
  //   const payload = { username: user.email, sub: user._id };
  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }
  async login(user: IUser, response: Response) {
    const { _id, name, email, role, permissions } = user;
    const payload = {
      sub: "token login",
      iss: "from server",
      _id,
      name,
      email,
      role,
    };
    const refesh_token = this.createRefeshToken(payload);
    //save refresh_token
    await this.usersService.updateUserToken(refesh_token, _id);
    //save cokie
    response.cookie("refresh_token", refesh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>("JWT_REFRESH_TOKEN_EXPIRESIN")),
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
      },
    };
  }

  createRefeshToken(payload: any) {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRECT"),
      expiresIn:
        ms(this.configService.get<string>("JWT_REFRESH_TOKEN_EXPIRESIN")) /
        1000,
    });
    return refresh_token;
  }

  async createUserRegister(createUserDto: RegisterUserDto) {
    const user = await this.usersService.register(createUserDto);
    return {
      _id: user.id,
      createdAt: new Date(),
    };
  }

  async processNewToken(refreshToken: string, response: Response) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRECT"),
      });
      const user = await this.usersService.findUserByRefreshToken(refreshToken);
      if (!user) {
        throw new BadGatewayException(
          "Refresh Token khong hop le. vui long login"
        );
      }
      const { _id, name, email, role } = user;
      const payload = {
        sub: "token refresh",
        iss: "from server",
        _id,
        name,
        email,
        role,
      };
      const refesh_token = this.createRefeshToken(payload);
      //save refresh_token
      await this.usersService.updateUserToken(refesh_token, _id.toString());

      const userRole = user.role as unknown as { _id: string; name: string };
      const temp = await this.rolesService.findOne(userRole._id);
      //delete cokie
      response.clearCookie("refresh_token");
      //save cokie
      response.cookie("refresh_token", refesh_token, {
        httpOnly: true,
        maxAge: ms(
          this.configService.get<string>("JWT_REFRESH_TOKEN_EXPIRESIN")
        ),
      });
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id,
          name,
          email,
          role,
          permissions: temp?.permissions ?? [],
        },
      };
    } catch (error) {
      throw new BadGatewayException(
        "Refresh Token khong hop le. vui long login"
      );
    }
  }

  async processLogoutUser(response: Response, user: IUser) {
    await this.usersService.updateUserToken("", user._id);
    response.clearCookie("refresh_token");

    return "ok";
  }
}
