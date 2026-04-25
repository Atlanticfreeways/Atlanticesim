import { PackageClassifier } from './package-classifier.util';

describe('PackageClassifier — Adapter Integration Verification', () => {
  describe('Airalo-style packages', () => {
    it('should classify local data-only package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: ['FR'],
      });
      expect(result.packageType).toBe('DATA_ONLY');
      expect(result.scopeType).toBe('LOCAL');
    });
  });

  describe('eSIM Go-style packages', () => {
    it('should classify multi-country data package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'UY', 'PY', 'BO', 'VE', 'GY', 'SR', 'GF'],
      });
      expect(result.packageType).toBe('DATA_ONLY');
      expect(result.scopeType).toBe('GLOBAL');
    });
  });

  describe('Maya Mobile-style packages', () => {
    it('should classify voice+data package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: true, hasSms: false, isUnlimited: false,
        countries: ['US'],
      });
      expect(result.packageType).toBe('DATA_WITH_CALL');
      expect(result.scopeType).toBe('LOCAL');
    });
  });

  describe('Breeze-style packages', () => {
    it('should classify regional multi-country package', () => {
      // 3 countries in same region (North America)
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: ['US', 'CA', 'MX'],
      });
      expect(result.packageType).toBe('DATA_ONLY');
      expect(result.scopeType).toBe('REGIONAL');
    });
  });

  describe('eSIMCard-style packages', () => {
    it('should classify all-inclusive package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: true, hasSms: true, isUnlimited: false,
        countries: ['GB'],
      });
      expect(result.packageType).toBe('ALL_INCLUSIVE');
      expect(result.scopeType).toBe('LOCAL');
    });
  });

  describe('Holafly-style packages', () => {
    it('should classify unlimited data package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: true,
        countries: ['FR', 'DE', 'IT', 'ES'],
      });
      expect(result.packageType).toBe('DATA_WITH_ALL_UNLIMITED');
      expect(result.scopeType).toBe('REGIONAL');
    });
  });

  describe('edge cases', () => {
    it('should handle empty countries as LOCAL', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: false, isUnlimited: false,
        countries: [],
      });
      expect(result.scopeType).toBe('LOCAL');
    });

    it('should classify text-only package', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: false, hasSms: true, isUnlimited: false,
        countries: ['JP'],
      });
      expect(result.packageType).toBe('TEXT_ONLY');
    });

    it('should classify voice-only package', () => {
      const result = PackageClassifier.classify({
        hasData: false, hasVoice: true, hasSms: false, isUnlimited: false,
        countries: ['JP'],
      });
      expect(result.packageType).toBe('VOICE_ONLY');
    });

    it('should classify data+sms package', () => {
      const result = PackageClassifier.classify({
        hasData: true, hasVoice: false, hasSms: true, isUnlimited: false,
        countries: ['DE'],
      });
      expect(result.packageType).toBe('DATA_WITH_TEXT');
    });
  });
});
