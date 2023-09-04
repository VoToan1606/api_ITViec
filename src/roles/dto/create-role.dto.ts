import { ArrayMinSize, IsMongoId, IsNotEmpty } from "class-validator";
import { ObjectId } from "mongodb";
export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  isActive: boolean;

  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  permissions: ObjectId[];
}
