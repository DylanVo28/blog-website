import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser('sub') authorId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(authorId, dto);
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
  update(
    @Param('id') id: string,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') role: 'reader' | 'author' | 'admin',
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, actorId, role, dto);
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
