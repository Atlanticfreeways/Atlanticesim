import { getUniqueRegions } from './country-regions';

export enum PackageType {
  DATA_ONLY = 'DATA_ONLY',
  VOICE_ONLY = 'VOICE_ONLY',
  TEXT_ONLY = 'TEXT_ONLY',
  DATA_WITH_TEXT = 'DATA_WITH_TEXT',
  DATA_WITH_CALL = 'DATA_WITH_CALL',
  TEXT_WITH_CALL = 'TEXT_WITH_CALL',
  ALL_INCLUSIVE = 'ALL_INCLUSIVE',
  DATA_WITH_ALL_UNLIMITED = 'DATA_WITH_ALL_UNLIMITED',
}

export enum ScopeType {
  LOCAL = 'LOCAL',
  REGIONAL = 'REGIONAL',
  MULTI_COUNTRY = 'MULTI_COUNTRY',
  GLOBAL = 'GLOBAL',
}

export interface CapabilityScore {
  dataScore: number;
  voiceScore: number;
  smsScore: number;
}

export interface FUPExtraction {
  detected: boolean;
  confidence: 0 | 0.5 | 1;
  source: 'api_field' | 'description' | 'inferred';
  warnings: string[];
  throttleAfterGb?: number;
  throttleSpeedMbps?: number;
}

export interface ClassificationInput {
  hasData: boolean;
  hasVoice: boolean;
  hasSms: boolean;
  isUnlimited: boolean;
  countries: string[];
  dataAmount?: number;
  voiceMinutes?: number;
  smsCount?: number;
  description?: string;
  provider?: string;
}

export interface ClassificationResult {
  packageType: PackageType;
  scopeType: ScopeType;
  capabilities: CapabilityScore;
  fup: FUPExtraction;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export class PackageClassifierEnhanced {
  private static readonly FUP_KEYWORDS = {
    throttle: ['throttle', 'deprioritize', 'deprioritised', 'reduced speed', 'speed reduction'],
    fairUsage: ['fair usage', 'fup', 'fair use policy', 'usage policy'],
    speedLimit: ['512 mbps', '256 mbps', '128 mbps', 'speed limit', 'limited to'],
    threshold: ['after', 'beyond', 'exceeds', 'over', 'more than', '2gb', '5gb', '10gb'],
  };

  static classify(input: ClassificationInput): ClassificationResult {
    const capabilities = this.scoreCapabilities(input);
    const packageType = this.resolvePackageType(capabilities, input.isUnlimited);
    const scopeType = this.resolveScopeType(input.countries);
    const fup = this.extractFUP(input);
    const confidenceLevel = this.assessConfidence(input, capabilities);

    return {
      packageType,
      scopeType,
      capabilities,
      fup,
      confidenceLevel,
    };
  }

  private static scoreCapabilities(input: ClassificationInput): CapabilityScore {
    const dataScore = this.calculateDataScore(input);
    const voiceScore = this.calculateVoiceScore(input);
    const smsScore = this.calculateSmsScore(input);

    return { dataScore, voiceScore, smsScore };
  }

  private static calculateDataScore(input: ClassificationInput): number {
    if (!input.hasData) return 0;
    if (input.isUnlimited) return 100;
    if (!input.dataAmount) return 50;
    if (input.dataAmount >= 10) return 100;
    if (input.dataAmount >= 5) return 80;
    if (input.dataAmount >= 1) return 60;
    return 30;
  }

  private static calculateVoiceScore(input: ClassificationInput): number {
    if (!input.hasVoice) return 0;
    if (!input.voiceMinutes) return 50;
    if (input.voiceMinutes >= 1000) return 100;
    if (input.voiceMinutes >= 500) return 80;
    if (input.voiceMinutes >= 100) return 60;
    return 30;
  }

  private static calculateSmsScore(input: ClassificationInput): number {
    if (!input.hasSms) return 0;
    if (!input.smsCount) return 50;
    if (input.smsCount >= 1000) return 100;
    if (input.smsCount >= 500) return 80;
    if (input.smsCount >= 100) return 60;
    return 30;
  }

  private static resolvePackageType(
    capabilities: CapabilityScore,
    isUnlimited: boolean,
  ): PackageType {
    const { dataScore, voiceScore, smsScore } = capabilities;
    const threshold = 50;

    if (isUnlimited) {
      if (dataScore > threshold && voiceScore > threshold && smsScore > threshold) {
        return PackageType.DATA_WITH_ALL_UNLIMITED;
      }
      if (dataScore > threshold) return PackageType.DATA_ONLY;
    }

    if (dataScore > threshold && voiceScore > threshold && smsScore > threshold) {
      return PackageType.ALL_INCLUSIVE;
    }
    if (dataScore > threshold && voiceScore > threshold) return PackageType.DATA_WITH_CALL;
    if (dataScore > threshold && smsScore > threshold) return PackageType.DATA_WITH_TEXT;
    if (voiceScore > threshold && smsScore > threshold) return PackageType.TEXT_WITH_CALL;
    if (voiceScore > threshold) return PackageType.VOICE_ONLY;
    if (smsScore > threshold) return PackageType.TEXT_ONLY;

    return PackageType.DATA_ONLY;
  }

  private static resolveScopeType(countries: string[]): ScopeType {
    if (!countries || countries.length === 0) return ScopeType.LOCAL;
    if (countries.length === 1) return ScopeType.LOCAL;
    if (countries.length >= 16) return ScopeType.GLOBAL;

    const uniqueRegions = getUniqueRegions(countries);
    return uniqueRegions.length <= 1 ? ScopeType.REGIONAL : ScopeType.MULTI_COUNTRY;
  }

  private static extractFUP(input: ClassificationInput): FUPExtraction {
    const description = (input.description || '').toLowerCase();

    // Check for explicit FUP indicators
    const hasFUPKeyword = this.FUP_KEYWORDS.fairUsage.some((kw) =>
      description.includes(kw),
    );

    if (!hasFUPKeyword && !input.isUnlimited) {
      return {
        detected: false,
        confidence: 1,
        source: 'inferred',
        warnings: [],
      };
    }

    const warnings: string[] = [];
    let throttleAfterGb: number | undefined;
    let throttleSpeedMbps: number | undefined;

    // Extract throttle threshold
    const thresholdMatch = description.match(/(\d+)\s*gb/i);
    if (thresholdMatch) {
      throttleAfterGb = parseInt(thresholdMatch[1], 10);
      warnings.push(`Speeds may reduce after ${throttleAfterGb}GB daily usage`);
    }

    // Extract speed limit
    const speedMatch = description.match(/(\d+)\s*mbps/i);
    if (speedMatch) {
      throttleSpeedMbps = parseInt(speedMatch[1], 10);
      warnings.push(`Throttled speed: ${throttleSpeedMbps} Mbps`);
    }

    // Check for throttle keywords
    const hasThrottleKeyword = this.FUP_KEYWORDS.throttle.some((kw) =>
      description.includes(kw),
    );

    if (hasThrottleKeyword && !warnings.length) {
      warnings.push('Fair Usage Policy applies - speeds may be reduced');
    }

    return {
      detected: hasFUPKeyword || hasThrottleKeyword,
      confidence: hasFUPKeyword ? 1 : 0.5,
      source: hasFUPKeyword ? 'description' : 'inferred',
      warnings,
      throttleAfterGb,
      throttleSpeedMbps,
    };
  }

  private static assessConfidence(
    input: ClassificationInput,
    capabilities: CapabilityScore,
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // High confidence if explicit fields present
    if (input.dataAmount !== undefined) score += 30;
    if (input.voiceMinutes !== undefined) score += 20;
    if (input.smsCount !== undefined) score += 20;
    if (input.description) score += 15;

    // Reduce confidence if ambiguous
    if (input.hasData && !input.dataAmount) score -= 10;
    if (input.hasVoice && !input.voiceMinutes) score -= 10;
    if (input.hasSms && !input.smsCount) score -= 10;

    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }
}
