import { PackageClassifier, PackageType, ScopeType } from './package-classifier.util';

describe('PackageClassifier', () => {
  describe('PackageType classification', () => {
    it('should classify DATA_ONLY when only data is present', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.DATA_ONLY);
    });

    it('should classify VOICE_ONLY', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: true, hasSms: false, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.VOICE_ONLY);
    });

    it('should classify TEXT_ONLY', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: false, hasSms: true, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.TEXT_ONLY);
    });

    it('should classify DATA_WITH_TEXT', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: true, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.DATA_WITH_TEXT);
    });

    it('should classify DATA_WITH_CALL', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: true, hasSms: false, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.DATA_WITH_CALL);
    });

    it('should classify TEXT_WITH_CALL', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: true, hasSms: true, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.TEXT_WITH_CALL);
    });

    it('should classify ALL_INCLUSIVE when all present but not unlimited', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: true, hasSms: true, isUnlimited: false, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.ALL_INCLUSIVE);
    });

    it('should classify DATA_WITH_ALL_UNLIMITED when all present and unlimited', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: true, hasSms: true, isUnlimited: true, countries: ['US'],
      });
      expect(result.packageType).toBe(PackageType.DATA_WITH_ALL_UNLIMITED);
    });

    it('should default to DATA_ONLY when nothing is present', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: false, hasSms: false, isUnlimited: false, countries: [],
      });
      expect(result.packageType).toBe(PackageType.DATA_ONLY);
    });
  });

  describe('ScopeType classification', () => {
    it('should classify LOCAL for single country', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false, countries: ['US'],
      });
      expect(result.scopeType).toBe(ScopeType.LOCAL);
    });

    it('should classify LOCAL for empty countries', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false, countries: [],
      });
      expect(result.scopeType).toBe(ScopeType.LOCAL);
    });

    it('should classify REGIONAL for multiple countries in same region', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: ['FR', 'DE', 'IT', 'ES'],
      });
      expect(result.scopeType).toBe(ScopeType.REGIONAL);
    });

    it('should classify MULTI_COUNTRY for countries across regions (under 16)', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: ['US', 'FR', 'JP'],
      });
      expect(result.scopeType).toBe(ScopeType.MULTI_COUNTRY);
    });

    it('should classify GLOBAL for 16+ countries', () => {
      const countries = [
        'US', 'CA', 'MX', 'BR', 'AR', 'GB', 'FR', 'DE',
        'IT', 'ES', 'JP', 'KR', 'AU', 'IN', 'ZA', 'NG',
      ];
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false, countries,
      });
      expect(result.scopeType).toBe(ScopeType.GLOBAL);
    });
  });
});
