import { PackageClassifierEnhanced, PackageType, ScopeType } from './package-classifier-enhanced.util';

describe('PackageClassifierEnhanced', () => {
  describe('classify', () => {
    it('should classify data-only package with high confidence', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 10,
      });

      expect(result.packageType).toBe(PackageType.DATA_ONLY);
      expect(result.scopeType).toBe(ScopeType.LOCAL);
      expect(result.confidenceLevel).toBe('high');
      expect(result.capabilities.dataScore).toBeGreaterThan(50);
    });

    it('should classify all-inclusive unlimited package', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: true,
        hasSms: true,
        isUnlimited: true,
        countries: ['US', 'CA'],
        dataAmount: -1,
        voiceMinutes: -1,
        smsCount: -1,
      });

      expect(result.packageType).toBe(PackageType.DATA_WITH_ALL_UNLIMITED);
      expect(result.scopeType).toBe(ScopeType.REGIONAL);
    });

    it('should classify data with call package', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['GB'],
        dataAmount: 5,
        voiceMinutes: 500,
      });

      expect(result.packageType).toBe(PackageType.DATA_WITH_CALL);
      expect(result.capabilities.voiceScore).toBeGreaterThan(50);
    });

    it('should classify global scope for 16+ countries', () => {
      const countries = Array.from({ length: 20 }, (_, i) => `C${i}`);
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries,
      });

      expect(result.scopeType).toBe(ScopeType.GLOBAL);
    });

    it('should extract FUP with confidence scoring', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
        description: 'Unlimited data with fair usage policy. Speeds reduce to 512 Mbps after 2GB daily usage.',
      });

      expect(result.fup.detected).toBe(true);
      expect(result.fup.confidence).toBe(1);
      expect(result.fup.throttleAfterGb).toBe(2);
      expect(result.fup.throttleSpeedMbps).toBe(512);
      expect(result.fup.warnings.length).toBeGreaterThan(0);
    });

    it('should handle uncertain FUP detection', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
        description: 'Unlimited data with deprioritization after heavy usage.',
      });

      expect(result.fup.detected).toBe(true);
      expect(result.fup.confidence).toBe(0.5);
    });

    it('should not detect FUP for metered packages', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 5,
        description: 'Standard 5GB data package.',
      });

      expect(result.fup.detected).toBe(false);
      expect(result.fup.confidence).toBe(1);
    });

    it('should assess confidence level based on data completeness', () => {
      const highConfidence = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: true,
        hasSms: true,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 10,
        voiceMinutes: 500,
        smsCount: 100,
        description: 'Complete package with all details',
      });

      expect(highConfidence.confidenceLevel).toBe('high');

      const lowConfidence = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: true,
        hasSms: true,
        isUnlimited: false,
        countries: ['US'],
      });

      expect(lowConfidence.confidenceLevel).toBe('low');
    });

    it('should handle edge case: voice without minutes', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 5,
        voiceMinutes: undefined,
      });

      expect(result.packageType).toBe(PackageType.DATA_WITH_CALL);
      expect(result.confidenceLevel).toBe('medium');
    });

    it('should extract multiple FUP warnings', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
        description: 'Unlimited with fair usage policy. Throttled to 256 Mbps after 5GB daily usage.',
      });

      expect(result.fup.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.fup.throttleAfterGb).toBe(5);
      expect(result.fup.throttleSpeedMbps).toBe(256);
    });

    it('should classify text-only package', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: false,
        hasVoice: false,
        hasSms: true,
        isUnlimited: false,
        countries: ['US'],
        smsCount: 500,
      });

      expect(result.packageType).toBe(PackageType.TEXT_ONLY);
    });

    it('should classify voice-only package', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: false,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        voiceMinutes: 1000,
      });

      expect(result.packageType).toBe(PackageType.VOICE_ONLY);
    });

    it('should handle regional scope with multiple countries in same region', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['DE', 'FR', 'IT', 'ES'],
      });

      expect(result.scopeType).toBe(ScopeType.REGIONAL);
    });

    it('should handle multi-country scope with countries from different regions', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['US', 'JP', 'AU'],
      });

      expect(result.scopeType).toBe(ScopeType.MULTI_COUNTRY);
    });
  });

  describe('capability scoring', () => {
    it('should score data capability based on amount', () => {
      const unlimited = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
      });

      const large = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 10,
      });

      const small = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        dataAmount: 0.5,
      });

      expect(unlimited.capabilities.dataScore).toBe(100);
      expect(large.capabilities.dataScore).toBeGreaterThan(small.capabilities.dataScore);
    });

    it('should score voice capability based on minutes', () => {
      const high = PackageClassifierEnhanced.classify({
        hasData: false,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        voiceMinutes: 1000,
      });

      const low = PackageClassifierEnhanced.classify({
        hasData: false,
        hasVoice: true,
        hasSms: false,
        isUnlimited: false,
        countries: ['US'],
        voiceMinutes: 50,
      });

      expect(high.capabilities.voiceScore).toBeGreaterThan(low.capabilities.voiceScore);
    });
  });

  describe('FUP extraction edge cases', () => {
    it('should handle empty description', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
        description: '',
      });

      expect(result.fup.warnings.length).toBe(0);
    });

    it('should handle null description', () => {
      const result = PackageClassifierEnhanced.classify({
        hasData: true,
        hasVoice: false,
        hasSms: false,
        isUnlimited: true,
        countries: ['US'],
        description: undefined,
      });

      expect(result.fup.warnings.length).toBe(0);
    });

    it('should extract throttle threshold from various formats', () => {
      const formats = [
        'after 2GB daily usage',
        'beyond 5GB',
        'exceeds 10GB',
        'over 1GB',
      ];

      for (const format of formats) {
        const result = PackageClassifierEnhanced.classify({
          hasData: true,
          hasVoice: false,
          hasSms: false,
          isUnlimited: true,
          countries: ['US'],
          description: `Unlimited with fair usage. ${format}`,
        });

        expect(result.fup.throttleAfterGb).toBeDefined();
      }
    });

    it('should extract speed limits in various formats', () => {
      const speeds = ['512 Mbps', '256 Mbps', '128 Mbps'];

      for (const speed of speeds) {
        const result = PackageClassifierEnhanced.classify({
          hasData: true,
          hasVoice: false,
          hasSms: false,
          isUnlimited: true,
          countries: ['US'],
          description: `Unlimited with fair usage. Throttled to ${speed}`,
        });

        expect(result.fup.throttleSpeedMbps).toBeDefined();
      }
    });
  });
});
