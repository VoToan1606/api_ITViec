import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseFilePipeBuilder,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { CreateFileDto } from "./dto/create-file.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public, ResponseMessage } from "src/decorators/customize";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @ResponseMessage("upload single file")
  @UseInterceptors(FileInterceptor("fileUpload"))
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(jpg|image\/jpeg|png|image\/png|pdf|application\/pdf)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024, //1mb
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: Express.Multer.File
  ) {
    return {
      fileName: file.filename,
    };
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.filesService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.filesService.remove(+id);
  }
}
