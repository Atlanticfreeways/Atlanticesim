# Package Classification System - Quick Reference

## Classification Truth Tables

### PackageType Classification

| hasData | hasVoice | hasSms | isUnlimited | → PackageType |
|---------|----------|--------|-------------|---------------|
| ✓ | ✗ | ✗ | any | DATA_ONLY |
| ✗ | ✓ | ✗ | any | VOICE_ONLY |
| ✗ | ✗ | ✓ | any | TEXT_ONLY |
| ✓ | ✗ | ✓ | any | DATA_WITH_TEXT |
| ✓ | ✓ | ✗ | any | DATA_WITH_CALL |
| ✗ | ✓ | ✓ | any | TEXT_WITH_CALL |
| ✓ | ✓ | ✓ | ✗ | ALL_INCLUSIVE |
| ✓ | ✓ | ✓ | ✓ | DATA_WITH_ALL_UNLIMITED |

### ScopeType Classification

| Countries | Unique Regions | → ScopeType |
|-----------|----------------|-------------|
| 0-1 | any | LOCAL |
| 2-15 | 1 | REGIONAL |
| 2-15 | 2+ | MULTI_COUNTRY |
| 16+ | any | GLOBAL |

## Usage Examples

### In Adapters

```typescript
import { PackageClassifier } from '../../../common/utils/package-classifier.util';

// Example 1: eSIM Go (has allowances array)
const hasData = bundle.allowances?.some(a => a.type === 'DATA') ?? bundle.dataAmount > 0;
const hasVoice = bundle.allowances?.some(a => a.type === 'VOICE') ?? false;
const hasSms = bundle.allowances?.some(a => a.type === 'SMS') ?? false;
const isUnlimited = bundle.unlimited === true;
const countries = bundle.countries?.map(c => c.iso) || [];

const { packageType, scopeType } = PackageClassifier.classify({
  hasData, hasVoice, hasSms, isUnlimited, countries,
});

// Example 2: Airalo (data-only provider)
const { packageType, scopeType } = PackageClassifier.classify({
  hasData: true,
  hasVoice: false,
  hasSms: false,
  isUnlimited: apiPkg.type === 'unlimited',
  countries: apiPkg.operator?.countries?.map(c => c.slug) ?? [apiPkg.slug],
});

// Example 3: Generic provider with voice/SMS fields
const { packageType, scopeType } = PackageClassifier.classify({
  hasData: (plan.data_amount || 0) > 0,
  hasVoice: (plan.voice_minutes ?? 0) > 0,
  hasSms: (plan.sms_count ?? 0) > 0,
  isUnlimited: plan.is_unlimited === true,
  countries: plan.coverage_countries || [],
});
```

### In Search Queries

```typescript
// Search for regional data-only packages in Europe
const packages = await prisma.package.findMany({
  where: {
    packageType: 'DATA_ONLY',
    scopeType: 'REGIONAL',
    countries: { has: 'FR' }, // France
    isActive: true,
  },
});

// Search for all-inclusive global packages
const packages = await prisma.package.findMany({
  where: {
    packageType: { in: ['ALL_INCLUSIVE', 'DATA_WITH_ALL_UNLIMITED'] },
    scopeType: 'GLOBAL',
    isActive: true,
  },
});
```

### In Smart Routing

```typescript
// Find optimal provider for a specific package type and region
const provider = await prisma.provider.findFirst({
  where: {
    isActive: true,
    supportedPackageTypes: { has: 'DATA_WITH_CALL' },
    preferredRegions: { has: 'EUROPE' },
  },
  orderBy: [
    { priority: 'asc' },  // Lower priority = higher preference
  ],
});
```

## Region Mapping

### Regions
- **EUROPE**: 44 countries (FR, DE, IT, ES, GB, etc.)
- **NORTH_AMERICA**: 3 countries (US, CA, MX)
- **SOUTH_AMERICA**: 12 countries (BR, AR, CL, CO, etc.)
- **ASIA_PACIFIC**: 30+ countries (JP, KR, CN, IN, SG, AU, etc.)
- **MIDDLE_EAST**: 16 countries (AE, SA, IL, TR, etc.)
- **AFRICA**: 54 countries (ZA, NG, KE, EG, etc.)
- **OCEANIA**: 11 countries (AU, NZ, FJ, etc.)
- **CARIBBEAN**: 15 countries (JM, BS, BB, etc.)
- **CENTRAL_AMERICA**: 7 countries (CR, PA, GT, etc.)

### Helper Functions

```typescript
import { getRegion, getUniqueRegions } from '../../../common/utils/country-regions';

// Get region for a single country
const region = getRegion('FR'); // Returns Region.EUROPE

// Get unique regions from country list
const regions = getUniqueRegions(['FR', 'DE', 'IT']); // Returns [Region.EUROPE]
const regions = getUniqueRegions(['US', 'FR', 'JP']); // Returns [Region.NORTH_AMERICA, Region.EUROPE, Region.ASIA_PACIFIC]
```

## Database Schema

### Provider Model
```prisma
model Provider {
  priority              Int               @default(100)
  supportedPackageTypes PackageType[]
  preferredRegions      String[]
  // ... other fields
}
```

### Package Model
```prisma
model Package {
  packageType  PackageType @default(DATA_ONLY)
  scopeType    ScopeType   @default(LOCAL)
  lastSyncedAt DateTime?
  // ... other fields
  
  @@index([packageType, scopeType])
}
```

## Testing

```typescript
import { PackageClassifier, PackageType, ScopeType } from './package-classifier.util';

// Test PackageType
const result = PackageClassifier.classify({
  hasData: true,
  hasVoice: true,
  hasSms: true,
  isUnlimited: true,
  countries: ['FR', 'DE', 'IT'],
});

expect(result.packageType).toBe(PackageType.DATA_WITH_ALL_UNLIMITED);
expect(result.scopeType).toBe(ScopeType.REGIONAL);
```

## Common Patterns

### Pattern 1: Provider-Specific Signal Extraction
Each provider has different field names. Extract signals consistently:

```typescript
// eSIM Go: allowances array
const hasVoice = bundle.allowances?.some(a => a.type === 'VOICE') ?? false;

// Maya Mobile: direct fields
const hasVoice = (plan.voice_minutes ?? 0) > 0;

// Airalo: always false (data-only)
const hasVoice = false;
```

### Pattern 2: Handling Unlimited Packages
```typescript
const isUnlimited = 
  bundle.unlimited === true ||
  bundle.is_unlimited === true ||
  apiPkg.type === 'unlimited';
```

### Pattern 3: Country Array Normalization
```typescript
// eSIM Go
const countries = bundle.countries?.map(c => c.iso) || [];

// Airalo
const countries = apiPkg.operator?.countries?.map(c => c.slug) ?? [apiPkg.slug];

// Generic
const countries = plan.coverage_countries || [];
```

## Migration Checklist

When adding a new provider adapter:

1. ✅ Import `PackageClassifier`
2. ✅ Extract signals: `hasData`, `hasVoice`, `hasSms`, `isUnlimited`, `countries[]`
3. ✅ Call `PackageClassifier.classify()`
4. ✅ Include `packageType`, `scopeType` in package metadata
5. ✅ Include `voiceMinutes`, `smsCount` if available
6. ✅ Add `@WithCircuitBreaker()` to API methods
7. ✅ Write unit tests for classification logic

---

**See Also:**
- `docs/PHASE_11_PACKAGE_CLASSIFICATION.md` - Full specification
- `docs/PHASE_11_PROGRESS.md` - Implementation progress
- `src/common/utils/package-classifier.util.spec.ts` - Test examples
