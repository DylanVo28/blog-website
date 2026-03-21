import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
  ) {
    return this.usersService.getCurrentUser(userId, email);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateCurrentUser(userId, dto, email);
  }

  @Get(':id/posts')
  getUserPosts(@Param('id') userId: string) {
    return this.usersService.listUserPosts(userId);
  }

  @Get(':id/stats')
  getUserStats(@Param('id') userId: string) {
    return this.usersService.getUserStats(userId);
  }

  @Get(':id')
  getPublicProfile(@Param('id') userId: string) {
    return this.usersService.findPublicProfile(userId);
  }
}
