// Country data: dial codes, ISO codes, name, phone digit lengths, address formats
export interface Country {
  iso2: string;
  iso3: string;
  name: string;
  dialCode: string;
  flag: string;
  phoneDigits: number; // expected local number length
  addressFormat: 'HK' | 'CN' | 'SG' | 'UK' | 'US' | 'GENERIC';
}

export const COUNTRIES: Country[] = [
  { iso2:'HK', iso3:'HKG', name:'Hong Kong SAR',      dialCode:'+852', flag:'🇭🇰', phoneDigits:8,  addressFormat:'HK' },
  { iso2:'CN', iso3:'CHN', name:'Mainland China',      dialCode:'+86',  flag:'🇨🇳', phoneDigits:11, addressFormat:'CN' },
  { iso2:'SG', iso3:'SGP', name:'Singapore',           dialCode:'+65',  flag:'🇸🇬', phoneDigits:8,  addressFormat:'SG' },
  { iso2:'GB', iso3:'GBR', name:'United Kingdom',      dialCode:'+44',  flag:'🇬🇧', phoneDigits:10, addressFormat:'UK' },
  { iso2:'US', iso3:'USA', name:'United States',       dialCode:'+1',   flag:'🇺🇸', phoneDigits:10, addressFormat:'US' },
  { iso2:'AU', iso3:'AUS', name:'Australia',           dialCode:'+61',  flag:'🇦🇺', phoneDigits:9,  addressFormat:'GENERIC' },
  { iso2:'CA', iso3:'CAN', name:'Canada',              dialCode:'+1',   flag:'🇨🇦', phoneDigits:10, addressFormat:'GENERIC' },
  { iso2:'IN', iso3:'IND', name:'India',               dialCode:'+91',  flag:'🇮🇳', phoneDigits:10, addressFormat:'GENERIC' },
  { iso2:'JP', iso3:'JPN', name:'Japan',               dialCode:'+81',  flag:'🇯🇵', phoneDigits:10, addressFormat:'GENERIC' },
  { iso2:'MY', iso3:'MYS', name:'Malaysia',            dialCode:'+60',  flag:'🇲🇾', phoneDigits:9,  addressFormat:'GENERIC' },
  { iso2:'TW', iso3:'TWN', name:'Taiwan',              dialCode:'+886', flag:'🇹🇼', phoneDigits:9,  addressFormat:'GENERIC' },
  { iso2:'KR', iso3:'KOR', name:'South Korea',         dialCode:'+82',  flag:'🇰🇷', phoneDigits:10, addressFormat:'GENERIC' },
  { iso2:'DE', iso3:'DEU', name:'Germany',             dialCode:'+49',  flag:'🇩🇪', phoneDigits:11, addressFormat:'GENERIC' },
  { iso2:'FR', iso3:'FRA', name:'France',              dialCode:'+33',  flag:'🇫🇷', phoneDigits:9,  addressFormat:'GENERIC' },
  { iso2:'AE', iso3:'ARE', name:'United Arab Emirates',dialCode:'+971', flag:'🇦🇪', phoneDigits:9,  addressFormat:'GENERIC' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // HK

export function findCountry(iso2: string): Country {
  return COUNTRIES.find(c => c.iso2 === iso2) ?? DEFAULT_COUNTRY;
}

// HK Districts for address
export const HK_DISTRICTS = [
  { value: 'CENTRAL_WESTERN', label: 'Central & Western (中西區)' },
  { value: 'EASTERN',         label: 'Eastern (東區)' },
  { value: 'SOUTHERN',        label: 'Southern (南區)' },
  { value: 'WAN_CHAI',        label: 'Wan Chai (灣仔)' },
  { value: 'KOWLOON_CITY',    label: 'Kowloon City (九龍城)' },
  { value: 'KWUN_TONG',       label: 'Kwun Tong (觀塘)' },
  { value: 'SHAM_SHUI_PO',    label: 'Sham Shui Po (深水埗)' },
  { value: 'WONG_TAI_SIN',    label: 'Wong Tai Sin (黃大仙)' },
  { value: 'YAU_TSIM_MONG',   label: 'Yau Tsim Mong (油尖旺)' },
  { value: 'ISLANDS',         label: 'Islands (離島)' },
  { value: 'KWAI_TSING',      label: 'Kwai Tsing (葵青)' },
  { value: 'NORTH',           label: 'North (北區)' },
  { value: 'SAI_KUNG',        label: 'Sai Kung (西貢)' },
  { value: 'SHA_TIN',         label: 'Sha Tin (沙田)' },
  { value: 'TAI_PO',          label: 'Tai Po (大埔)' },
  { value: 'TSUEN_WAN',       label: 'Tsuen Wan (荃灣)' },
  { value: 'TUEN_MUN',        label: 'Tuen Mun (屯門)' },
  { value: 'YUEN_LONG',       label: 'Yuen Long (元朗)' },
];

// Occupation categories
export const OCCUPATIONS = [
  { value: 'BANKING_FINANCE',    label: 'Banking & Finance' },
  { value: 'ACCOUNTING',         label: 'Accounting & Auditing' },
  { value: 'LEGAL',              label: 'Legal & Compliance' },
  { value: 'MEDICAL',            label: 'Medical & Healthcare' },
  { value: 'ENGINEERING',        label: 'Engineering & Technology' },
  { value: 'EDUCATION',          label: 'Education' },
  { value: 'REAL_ESTATE',        label: 'Real Estate' },
  { value: 'RETAIL_HOSPITALITY', label: 'Retail & Hospitality' },
  { value: 'GOVERNMENT',         label: 'Government & Public Sector' },
  { value: 'SELF_EMPLOYED',      label: 'Self-employed / Freelance' },
  { value: 'BUSINESS_OWNER',     label: 'Business Owner' },
  { value: 'INVESTMENT',         label: 'Investment & Asset Management' },
  { value: 'RETIRED',            label: 'Retired' },
  { value: 'STUDENT',            label: 'Student' },
  { value: 'HOMEMAKER',          label: 'Homemaker' },
  { value: 'OTHER',              label: 'Other' },
];

// Source of funds
export const FUNDS_SOURCES = [
  { value: 'EMPLOYMENT',   label: 'Employment / Salary' },
  { value: 'BUSINESS',     label: 'Business Income' },
  { value: 'INVESTMENT',   label: 'Investment Returns' },
  { value: 'INHERITANCE',  label: 'Inheritance / Gift' },
  { value: 'PROPERTY',     label: 'Property Sale' },
  { value: 'PENSION',      label: 'Pension / Retirement Fund' },
  { value: 'SAVINGS',      label: 'Accumulated Savings' },
  { value: 'OTHER',        label: 'Other' },
];

// Annual income bands
export const INCOME_BANDS = [
  { value: 'BELOW_150K',  label: 'Below HKD 150,000' },
  { value: '150K_300K',   label: 'HKD 150,000 – 300,000' },
  { value: '300K_600K',   label: 'HKD 300,000 – 600,000' },
  { value: '600K_1M',     label: 'HKD 600,000 – 1,000,000' },
  { value: '1M_3M',       label: 'HKD 1,000,000 – 3,000,000' },
  { value: 'ABOVE_3M',    label: 'Above HKD 3,000,000' },
];

// Account purpose
export const ACCOUNT_PURPOSES = [
  { value: 'EVERYDAY_BANKING',   label: 'Everyday banking & payments' },
  { value: 'SAVINGS',            label: 'Savings & deposits' },
  { value: 'INVESTMENT',         label: 'Investment & wealth management' },
  { value: 'SALARY_RECEIPT',     label: 'Salary / income receipt' },
  { value: 'BUSINESS_PAYMENTS',  label: 'Business transactions & payments' },
  { value: 'INTERNATIONAL_TRANSFER', label: 'International money transfers' },
  { value: 'MORTGAGE',           label: 'Mortgage repayments' },
];
