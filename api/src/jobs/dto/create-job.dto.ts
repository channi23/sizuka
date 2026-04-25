import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @MinLength(50)
  jd_raw: string;
}
