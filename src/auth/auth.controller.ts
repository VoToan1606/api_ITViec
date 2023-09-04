import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Res,
  Get,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public, ResponseMessage, User } from "src/decorators/customize";
import { LocalAuthGuard } from "./passport/local-auth.guard";
import { IUser } from "./interfaces/user.interface";
import { RegisterUserDto } from "src/users/dto/create-user.dto";
import { Response } from "express";
import { RolesService } from "src/roles/roles.service";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly rolesService: RolesService
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.login(user, response);
  }
  @Public()
  @ResponseMessage("Register a new user")
  @Post("register")
  create(@Body() createUserDto: RegisterUserDto) {
    return this.authService.createUserRegister(createUserDto);
  }

  // @ResponseMessage("Register a new user")
  @Get("account")
  async getAccount(@User() user: IUser) {
    const temp = (await this.rolesService.findOne(user.role._id)) as any;
    user.permissions = temp.permissions;
    return { user };
  }
  @Public()
  @ResponseMessage("get user by refresh token")
  @Post("refresh")
  handleRefreshToken(
    @Req() request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies["refresh_token"];
    return this.authService.processNewToken(refreshToken, response);
  }

  @ResponseMessage("logout user")
  @Post("logout")
  handleLogoutUser(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.processLogoutUser(response, user);
  }
}
