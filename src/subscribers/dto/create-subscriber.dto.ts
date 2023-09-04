import { IsNotEmpty } from "class-validator";

export class CreateSubscriberDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  skills: string[];
}
