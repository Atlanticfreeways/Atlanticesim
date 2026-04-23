import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageDailyResponseDto {
  @ApiProperty() date: string;
  @ApiProperty() dataUsedMB: number;
  @ApiProperty() snapshots: number;
}

export class DepletionPredictionDto {
  @ApiProperty() metric: 'data' | 'voice' | 'sms';
  @ApiPropertyOptional() predictedExhaustionDate: Date | null;
  @ApiProperty() velocityPerHour: number;
  @ApiProperty() percentUsed: number;
  @ApiProperty() isWarning: boolean;
}

export class UsageSummaryResponseDto {
  @ApiProperty() esimId: string;
  @ApiProperty() dataUsed: number;
  @ApiProperty() dataTotal: number;
  @ApiPropertyOptional() validUntil: Date;
  @ApiProperty() status: string;
  @ApiProperty({ type: [DepletionPredictionDto] }) predictions: DepletionPredictionDto[];
}
