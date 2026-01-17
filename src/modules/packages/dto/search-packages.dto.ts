import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPackagesDto {
    @ApiPropertyOptional({ description: 'Comma-separated list of country codes (2 letters)' })
    @IsOptional()
    @IsString()
    // Validate that it's a comma-separated list of 2-letter codes or a single code
    // Regex: ^[A-Z]{2}(,[A-Z]{2})*$
    // However, often users send lowercase. Transformation handles case? No, we should probably allow lower case and transform.
    // Let's rely on transform: true globally? Not sure if it lowercases strings.
    // Let's just validate pattern roughly or handle transformation in controller if needed.
    // Simpler: Just IsString for now, complicate regex later if needed.
    countries?: string;

    @ApiPropertyOptional({ description: 'Minimum data amount in MB' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minData?: number;

    @ApiPropertyOptional({ description: 'Maximum price in USD' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasVoice?: boolean;
}
