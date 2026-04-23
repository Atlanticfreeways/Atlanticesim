import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPackagesDto {
    @ApiPropertyOptional({ description: 'Comma-separated country codes' })
    @IsOptional()
    @IsString()
    countries?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    region?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minData?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxData?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    packageType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    scopeType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isUnlimited?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasVoice?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasSms?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional({ enum: ['price', 'data', 'duration'] })
    @IsOptional()
    @IsString()
    sortBy?: 'price' | 'data' | 'duration';

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;
}
