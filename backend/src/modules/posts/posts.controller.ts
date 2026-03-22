import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import type { UploadedImageFile } from '../upload/upload.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('coverImage'))
  create(
    @CurrentUser('sub') authorId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() coverImage?: UploadedImageFile,
  ) {
    return this.postsService.create(authorId, dto, coverImage);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(@CurrentUser('sub') userId?: string) {
    return this.postsService.getFeed(userId);
  }

  @Get()
  findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findOneBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('coverImage'))
  update(
    @Param('id') id: string,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') role: 'reader' | 'author' | 'admin',
    @Body() dto: UpdatePostDto,
    @UploadedFile() coverImage?: UploadedImageFile,
  ) {
    return this.postsService.update(id, actorId, role, dto, coverImage);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') role: 'reader' | 'author' | 'admin',
  ) {
    return this.postsService.remove(id, actorId, role);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(
    @Param('id') id: string,
    @CurrentUser('sub') authorId: string,
  ) {
    return this.postsService.publish(id, authorId);
  }
}
