import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

class BanUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('transactions')
  getTransactions() {
    return this.adminService.listTransactions();
  }

  @Get('withdrawals')
  getWithdrawals() {
    return this.adminService.listWithdrawals();
  }

  @Patch('withdrawals/:id/approve')
  approveWithdrawal(
    @Param('id') withdrawalId: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.approveWithdrawal(withdrawalId, adminId);
  }

  @Patch('withdrawals/:id/reject')
  rejectWithdrawal(
    @Param('id') withdrawalId: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.adminService.rejectWithdrawal(withdrawalId, adminId);
  }

  @Get('users')
  getUsers() {
    return this.adminService.listUsers();
  }

  @Post('users/:id/ban')
  banUser(
    @Param('id') userId: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(userId, adminId, dto.reason);
  }
}
