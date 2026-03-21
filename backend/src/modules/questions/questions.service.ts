import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DEFAULT_QUESTION_FEE } from '../../common/constants';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  create(postId: string, askerId: string, dto: CreateQuestionDto) {
    const deadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    return {
      id: randomUUID(),
      postId,
      askerId,
      fee: dto.fee ?? DEFAULT_QUESTION_FEE,
      deadlineAt: deadlineAt.toISOString(),
      status: 'pending',
      ...dto,
    };
  }

  listByPost(postId: string) {
    return {
      postId,
      items: [],
    };
  }

  answer(questionId: string, answeredBy: string, dto: AnswerQuestionDto) {
    return {
      id: questionId,
      answeredBy,
      status: 'answered',
      answeredAt: new Date().toISOString(),
      ...dto,
    };
  }

  listMyQuestions(userId: string) {
    return {
      userId,
      items: [],
    };
  }

  listPendingForAuthor(authorId: string) {
    return {
      authorId,
      items: [],
      message: 'Pending queue scaffolded for Phase 3 wallet workflow.',
    };
  }
}
