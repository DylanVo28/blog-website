import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiQuestionDto } from './dto/ai-question.dto';
import { AiService } from './ai.service';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ai/ask')
  ask(@Body() dto: AiQuestionDto) {
    return this.aiService.ask(dto);
  }

  @Post('authors/documents')
  @UseGuards(JwtAuthGuard)
  uploadDocument(
    @CurrentUser('sub') authorId: string,
    @Body('fileName') fileName: string,
    @Body('content') content = '',
  ) {
    return this.aiService.uploadAuthorDocument(authorId, fileName, content);
  }

  @Get('authors/documents')
  @UseGuards(JwtAuthGuard)
  listDocuments(@CurrentUser('sub') authorId: string) {
    return this.aiService.listAuthorDocuments(authorId);
  }

  @Delete('authors/documents/:id')
  @UseGuards(JwtAuthGuard)
  deleteDocument(
    @CurrentUser('sub') authorId: string,
    @Param('id') documentId: string,
  ) {
    return this.aiService.deleteAuthorDocument(authorId, documentId);
  }
}
