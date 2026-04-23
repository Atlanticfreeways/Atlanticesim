export enum Region {
  EUROPE = 'EUROPE',
  NORTH_AMERICA = 'NORTH_AMERICA',
  SOUTH_AMERICA = 'SOUTH_AMERICA',
  ASIA_PACIFIC = 'ASIA_PACIFIC',
  MIDDLE_EAST = 'MIDDLE_EAST',
  AFRICA = 'AFRICA',
  OCEANIA = 'OCEANIA',
  CARIBBEAN = 'CARIBBEAN',
  CENTRAL_AMERICA = 'CENTRAL_AMERICA',
}

const COUNTRY_REGION_MAP: Record<string, Region> = {
  // Europe
  AL: Region.EUROPE, AD: Region.EUROPE, AT: Region.EUROPE, BY: Region.EUROPE,
  BE: Region.EUROPE, BA: Region.EUROPE, BG: Region.EUROPE, HR: Region.EUROPE,
  CY: Region.EUROPE, CZ: Region.EUROPE, DK: Region.EUROPE, EE: Region.EUROPE,
  FI: Region.EUROPE, FR: Region.EUROPE, DE: Region.EUROPE, GR: Region.EUROPE,
  HU: Region.EUROPE, IS: Region.EUROPE, IE: Region.EUROPE, IT: Region.EUROPE,
  XK: Region.EUROPE, LV: Region.EUROPE, LI: Region.EUROPE, LT: Region.EUROPE,
  LU: Region.EUROPE, MT: Region.EUROPE, MD: Region.EUROPE, MC: Region.EUROPE,
  ME: Region.EUROPE, NL: Region.EUROPE, MK: Region.EUROPE, NO: Region.EUROPE,
  PL: Region.EUROPE, PT: Region.EUROPE, RO: Region.EUROPE, RU: Region.EUROPE,
  SM: Region.EUROPE, RS: Region.EUROPE, SK: Region.EUROPE, SI: Region.EUROPE,
  ES: Region.EUROPE, SE: Region.EUROPE, CH: Region.EUROPE, UA: Region.EUROPE,
  GB: Region.EUROPE, VA: Region.EUROPE,

  // North America
  US: Region.NORTH_AMERICA, CA: Region.NORTH_AMERICA, MX: Region.NORTH_AMERICA,

  // Central America
  BZ: Region.CENTRAL_AMERICA, CR: Region.CENTRAL_AMERICA, SV: Region.CENTRAL_AMERICA,
  GT: Region.CENTRAL_AMERICA, HN: Region.CENTRAL_AMERICA, NI: Region.CENTRAL_AMERICA,
  PA: Region.CENTRAL_AMERICA,

  // Caribbean
  AG: Region.CARIBBEAN, BS: Region.CARIBBEAN, BB: Region.CARIBBEAN, CU: Region.CARIBBEAN,
  DM: Region.CARIBBEAN, DO: Region.CARIBBEAN, GD: Region.CARIBBEAN, HT: Region.CARIBBEAN,
  JM: Region.CARIBBEAN, KN: Region.CARIBBEAN, LC: Region.CARIBBEAN, VC: Region.CARIBBEAN,
  TT: Region.CARIBBEAN, PR: Region.CARIBBEAN, VI: Region.CARIBBEAN,

  // South America
  AR: Region.SOUTH_AMERICA, BO: Region.SOUTH_AMERICA, BR: Region.SOUTH_AMERICA,
  CL: Region.SOUTH_AMERICA, CO: Region.SOUTH_AMERICA, EC: Region.SOUTH_AMERICA,
  GY: Region.SOUTH_AMERICA, PY: Region.SOUTH_AMERICA, PE: Region.SOUTH_AMERICA,
  SR: Region.SOUTH_AMERICA, UY: Region.SOUTH_AMERICA, VE: Region.SOUTH_AMERICA,

  // Asia Pacific
  AF: Region.ASIA_PACIFIC, BD: Region.ASIA_PACIFIC, BT: Region.ASIA_PACIFIC,
  BN: Region.ASIA_PACIFIC, KH: Region.ASIA_PACIFIC, CN: Region.ASIA_PACIFIC,
  IN: Region.ASIA_PACIFIC, ID: Region.ASIA_PACIFIC, JP: Region.ASIA_PACIFIC,
  KZ: Region.ASIA_PACIFIC, KR: Region.ASIA_PACIFIC, KG: Region.ASIA_PACIFIC,
  LA: Region.ASIA_PACIFIC, MY: Region.ASIA_PACIFIC, MV: Region.ASIA_PACIFIC,
  MN: Region.ASIA_PACIFIC, MM: Region.ASIA_PACIFIC, NP: Region.ASIA_PACIFIC,
  PK: Region.ASIA_PACIFIC, PH: Region.ASIA_PACIFIC, SG: Region.ASIA_PACIFIC,
  LK: Region.ASIA_PACIFIC, TW: Region.ASIA_PACIFIC, TJ: Region.ASIA_PACIFIC,
  TH: Region.ASIA_PACIFIC, TL: Region.ASIA_PACIFIC, TM: Region.ASIA_PACIFIC,
  UZ: Region.ASIA_PACIFIC, VN: Region.ASIA_PACIFIC, HK: Region.ASIA_PACIFIC,
  MO: Region.ASIA_PACIFIC,

  // Middle East
  BH: Region.MIDDLE_EAST, EG: Region.MIDDLE_EAST, IR: Region.MIDDLE_EAST,
  IQ: Region.MIDDLE_EAST, IL: Region.MIDDLE_EAST, JO: Region.MIDDLE_EAST,
  KW: Region.MIDDLE_EAST, LB: Region.MIDDLE_EAST, OM: Region.MIDDLE_EAST,
  PS: Region.MIDDLE_EAST, QA: Region.MIDDLE_EAST, SA: Region.MIDDLE_EAST,
  SY: Region.MIDDLE_EAST, TR: Region.MIDDLE_EAST, AE: Region.MIDDLE_EAST,
  YE: Region.MIDDLE_EAST,

  // Africa
  DZ: Region.AFRICA, AO: Region.AFRICA, BJ: Region.AFRICA, BW: Region.AFRICA,
  BF: Region.AFRICA, BI: Region.AFRICA, CM: Region.AFRICA, CV: Region.AFRICA,
  CF: Region.AFRICA, TD: Region.AFRICA, KM: Region.AFRICA, CG: Region.AFRICA,
  CD: Region.AFRICA, CI: Region.AFRICA, DJ: Region.AFRICA, GQ: Region.AFRICA,
  ER: Region.AFRICA, SZ: Region.AFRICA, ET: Region.AFRICA, GA: Region.AFRICA,
  GM: Region.AFRICA, GH: Region.AFRICA, GN: Region.AFRICA, GW: Region.AFRICA,
  KE: Region.AFRICA, LS: Region.AFRICA, LR: Region.AFRICA, LY: Region.AFRICA,
  MG: Region.AFRICA, MW: Region.AFRICA, ML: Region.AFRICA, MR: Region.AFRICA,
  MU: Region.AFRICA, MA: Region.AFRICA, MZ: Region.AFRICA, NA: Region.AFRICA,
  NE: Region.AFRICA, NG: Region.AFRICA, RW: Region.AFRICA, ST: Region.AFRICA,
  SN: Region.AFRICA, SC: Region.AFRICA, SL: Region.AFRICA, SO: Region.AFRICA,
  ZA: Region.AFRICA, SS: Region.AFRICA, SD: Region.AFRICA, TZ: Region.AFRICA,
  TG: Region.AFRICA, TN: Region.AFRICA, UG: Region.AFRICA, ZM: Region.AFRICA,
  ZW: Region.AFRICA,

  // Oceania
  AU: Region.OCEANIA, FJ: Region.OCEANIA, NZ: Region.OCEANIA, PG: Region.OCEANIA,
  WS: Region.OCEANIA, SB: Region.OCEANIA, TO: Region.OCEANIA, VU: Region.OCEANIA,
  GU: Region.OCEANIA, NC: Region.OCEANIA, PF: Region.OCEANIA,
};

export function getRegion(iso: string): Region | undefined {
  return COUNTRY_REGION_MAP[iso.toUpperCase()];
}

export function getUniqueRegions(countries: string[]): Region[] {
  const regions = new Set<Region>();
  for (const iso of countries) {
    const region = getRegion(iso);
    if (region) regions.add(region);
  }
  return [...regions];
}
