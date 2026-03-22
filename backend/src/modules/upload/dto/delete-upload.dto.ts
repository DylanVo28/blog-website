import { IsString, IsUrl, MaxLength } from 'class-validator';

export class DeleteUploadDto {
  @IsString()
  @IsUrl({
    require_tld: false,
  })
  @MaxLength(2048)
  url!: string;
}
