import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { ResponseMessage, User } from "src/decorators/customize";
import { IUser } from "src/auth/interfaces/user.interface";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ResponseMessage("Create a role")
  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    return this.rolesService.create(createRoleDto, user);
  }

  @ResponseMessage("Fetch role with paginate")
  @Get()
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") pageSize: string,
    @Query() queryParams: string
  ) {
    return this.rolesService.findAll(+currentPage, +pageSize, queryParams);
  }

  @ResponseMessage("Fetch role by id")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @ResponseMessage("Update a role")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: IUser
  ) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @ResponseMessage("Delete a role")
  @Delete(":id")
  remove(@Param("id") id: string, @User() user: IUser) {
    return this.rolesService.remove(id, user);
  }
}
