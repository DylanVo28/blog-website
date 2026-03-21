import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboard() {
    return {
      users: 0,
      posts: 0,
      questions: 0,
      revenue: 0,
    };
  }

  listTransactions() {
    return {
      items: [],
    };
  }

  listWithdrawals() {
    return {
      items: [],
    };
  }

  approveWithdrawal(withdrawalId: string, adminId: string) {
    return {
      withdrawalId,
      adminId,
      status: 'approved',
    };
  }

  rejectWithdrawal(withdrawalId: string, adminId: string) {
    return {
      withdrawalId,
      adminId,
      status: 'rejected',
    };
  }

  listUsers() {
    return {
      items: [],
    };
  }

  banUser(userId: string, adminId: string) {
    return {
      userId,
      adminId,
      banned: true,
    };
  }
}
