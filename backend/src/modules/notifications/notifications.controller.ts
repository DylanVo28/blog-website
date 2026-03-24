import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listMine(@CurrentUser('sub') userId: string) {
    return this.notificationsService.listMine(userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('sub') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markRead(userId, notificationId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
