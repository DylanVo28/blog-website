import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('posts/:postId/questions')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @CurrentUser('sub') askerId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(postId, askerId, dto);
  }

  @Get('posts/:postId/questions')
  list(@Param('postId') postId: string) {
    return this.questionsService.listByPost(postId);
  }

  @Post('questions/:id/answer')
  @UseGuards(JwtAuthGuard)
  answer(
    @Param('id') questionId: string,
    @CurrentUser('sub') answeredBy: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.questionsService.answer(questionId, answeredBy, dto);
  }

  @Get('questions/my-questions')
  @UseGuards(JwtAuthGuard)
  getMyQuestions(@CurrentUser('sub') userId: string) {
    return this.questionsService.listMyQuestions(userId);
  }

  @Get('questions/pending')
  @UseGuards(JwtAuthGuard)
  getPendingQuestions(@CurrentUser('sub') authorId: string) {
    return this.questionsService.listPendingForAuthor(authorId);
  }
}
