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

export interface ClassificationInput {
  hasData: boolean;
  hasVoice: boolean;
  hasSms: boolean;
  isUnlimited: boolean;
  countries: string[];
}

export interface ClassificationResult {
  packageType: PackageType;
  scopeType: ScopeType;
}

export class PackageClassifier {
  static classify(input: ClassificationInput): ClassificationResult {
    return {
      packageType: this.resolvePackageType(input),
      scopeType: this.resolveScopeType(input.countries),
    };
  }

  private static resolvePackageType(input: ClassificationInput): PackageType {
    const { hasData, hasVoice, hasSms, isUnlimited } = input;

    if (hasData && hasVoice && hasSms) {
      return isUnlimited ? PackageType.DATA_WITH_ALL_UNLIMITED : PackageType.ALL_INCLUSIVE;
    }
    if (hasData && hasVoice) return PackageType.DATA_WITH_CALL;
    if (hasData && hasSms) return PackageType.DATA_WITH_TEXT;
    if (hasVoice && hasSms) return PackageType.TEXT_WITH_CALL;
    if (hasVoice) return PackageType.VOICE_ONLY;
    if (hasSms) return PackageType.TEXT_ONLY;
    return PackageType.DATA_ONLY;
  }

  private static resolveScopeType(countries: string[]): ScopeType {
    if (!countries || countries.length === 0) return ScopeType.LOCAL;
    if (countries.length === 1) return ScopeType.LOCAL;
    if (countries.length >= 16) return ScopeType.GLOBAL;

    const uniqueRegions = getUniqueRegions(countries);
    return uniqueRegions.length <= 1 ? ScopeType.REGIONAL : ScopeType.MULTI_COUNTRY;
  }
}
