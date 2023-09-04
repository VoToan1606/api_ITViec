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
import { ResumesService } from "./resumes.service";
import { CreateResumeDto } from "./dto/create-resume.dto";
import { UpdateResumeDto } from "./dto/update-resume.dto";

import { ResponseMessage, User } from "src/decorators/customize";
import { IUser } from "src/auth/interfaces/user.interface";

@Controller("resumes")
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @ResponseMessage("Create a new resume")
  @Post()
  create(@Body() createResumeDto: CreateResumeDto, @User() user: IUser) {
    return this.resumesService.create(createResumeDto, user);
  }
  @ResponseMessage("fetch resume with paginate")
  @Get()
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") pageSize: string,
    @Query() queryParams: string
  ) {
    return this.resumesService.findAll(currentPage, pageSize, queryParams);
  }

  @ResponseMessage("fetch resume by id")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.resumesService.findOne(id);
  }

  @ResponseMessage("update a resume ")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body("status") status: string,
    @User() user: IUser
  ) {
    return this.resumesService.update(id, status, user);
  }

  @ResponseMessage("delete a resume")
  @Delete(":id")
  remove(@Param("id") id: string, @User() user: IUser) {
    return this.resumesService.remove(id, user);
  }

  @Post("by-user")
  findAllResumeuser(@User() user: IUser) {
    return this.resumesService.handleFindAllResumeByUser(user);
  }
}
