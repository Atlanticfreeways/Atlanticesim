import { Controller, Get, Put, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { DataRetentionService } from './data-retention.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private dataRetention: DataRetentionService,
  ) {}

  @ApiOperation({ summary: 'Get user profile' })
  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @ApiOperation({ summary: 'GDPR — Export all user data (Art. 20)' })
  @Get('data-export')
  async exportData(@Request() req) {
    return this.dataRetention.exportUserData(req.user.userId);
  }

  @ApiOperation({ summary: 'GDPR — Request data erasure (Art. 17)' })
  @Delete('data-erasure')
  async eraseData(@Request() req) {
    return this.dataRetention.eraseUserData(req.user.userId);
  }
}
