import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
  isArray,
} from "class-validator";
import mongoose from "mongoose";

class JobObjectDTO {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateJobDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  location: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @IsNotEmpty()
  salary: number;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => JobObjectDTO)
  company: JobObjectDTO;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  level: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;

  //   @IsNotEmpty()
  //   isActive: boolean;
}
