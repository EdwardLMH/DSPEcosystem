import React, { useState, useCallback, useRef, useEffect } from 'react';
import { hive } from '../../tokens/hiveTokens';
import { COUNTRIES, HK_DISTRICTS, FUNDS_SOURCES, INCOME_BANDS,
         ACCOUNT_PURPOSES, OCCUPATIONS, Country } from '../../data/kycReferenceData';

// ─── Shared style helpers ─────────────────────────────────────────────────────

const font = hive.typography.fontFamily.primary;

function label(text: string, required?: boolean): React.ReactNode {
  return (
    <span style={{ display:'block', fontSize: hive.typography.fontSize.sm,
      fontWeight: hive.typography.fontWeight.semibold,
      color: hive.color.neutral[700], fontFamily: font, marginBottom: hive.spacing[1] }}>
      {text}{required && <span style={{ color: hive.color.semantic.error }}> *</span>}
    </span>
  );
}

function helpText(text: string) {
  return <span style={{ display:'block', fontSize: hive.typography.fontSize.xs,
    color: hive.color.neutral[500], fontFamily: font, marginTop: '2px' }}>{text}</span>;
}

function errorMsg(msg: string | null) {
  if (!msg) return null;
  return <span style={{ display:'block', fontSize: hive.typography.fontSize.xs,
    color: hive.color.semantic.error, fontFamily: font, marginTop: hive.spacing[1] }}>{msg}</span>;
}

const inputBase = (focused: boolean, hasError: boolean): React.CSSProperties => ({
  width: '100%', boxSizing: 'border-box',
  height: hive.component.input.height,
  padding: `0 ${hive.spacing[4]}`,
  fontSize: hive.typography.fontSize.base, fontFamily: font,
  border: `1px solid ${hasError ? hive.component.input.borderColorError
    : focused ? hive.component.input.borderColorFocus : hive.component.input.borderColor}`,
  borderRadius: hive.borderRadius.base,
  backgroundColor: hive.component.input.bgColor,
  outline: 'none',
  transition: `border-color ${hive.motion.duration.fast} ${hive.motion.easing.standard}`,
  boxShadow: focused ? `0 0 0 3px ${hive.color.brand.primaryLight}` : 'none',
});

const fieldWrap = (colSpan?: number): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column',
  ...(colSpan === 2 ? { gridColumn: '1 / -1' } : {}),
});

// ─── 1. Full Legal Name ───────────────────────────────────────────────────────

interface NameFieldProps {
  onAnswer: (id: string, v: string) => void;
  saved?: { firstName?: string; lastName?: string; middleName?: string };
  isMobile: boolean;
}
export function KYCFullNameField({ onAnswer, saved = {}, isMobile }: NameFieldProps) {
  const [first,  setFirst]  = useState(saved.firstName  ?? '');
  const [middle, setMiddle] = useState(saved.middleName ?? '');
  const [last,   setLast]   = useState(saved.lastName   ?? '');
  const [fErr,   setFErr]   = useState<string|null>(null);
  const [lErr,   setLErr]   = useState<string|null>(null);

  const validateFirst = (v: string) => !v.trim() ? 'First name is required' : null;
  const validateLast  = (v: string) => !v.trim() ? 'Last name is required'  : null;

  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: hive.spacing[4] }}>
      <div style={fieldWrap(isMobile ? 2 : 2)}>
        {label('First Name / Given Name', true)}
        <InputField value={first} placeholder="e.g. Tai Man"
          onChange={setFirst}
          onBlur={v => { setFErr(validateFirst(v)); if (!validateFirst(v)) onAnswer('q_first_name', v); }}
          error={fErr} />
        {helpText('As it appears on your official ID document')}
      </div>
      <div style={fieldWrap()}>
        {label('Middle Name')}
        <InputField value={middle} placeholder="(if applicable)"
          onChange={setMiddle} onBlur={v => onAnswer('q_middle_name', v)} />
      </div>
      <div style={fieldWrap()}>
        {label('Last Name / Surname', true)}
        <InputField value={last} placeholder="e.g. CHAN"
          onChange={setLast}
          onBlur={v => { setLErr(validateLast(v)); if (!validateLast(v)) onAnswer('q_last_name', v); }}
          error={lErr} />
      </div>
    </div>
  );
}

// ─── 2. Date of Birth ─────────────────────────────────────────────────────────

export function KYCDateOfBirth({ onAnswer, saved }: { onAnswer: (id:string,v:string)=>void; saved?:string }) {
  const [val, setVal] = useState(saved ?? '');
  const [err, setErr] = useState<string|null>(null);

  const validate = (v: string) => {
    if (!v) return 'Date of birth is required';
    const d = new Date(v);
    const age = (Date.now() - d.getTime()) / (365.25*24*3600*1000);
    if (age < 18)  return 'You must be at least 18 years old';
    if (age > 120) return 'Please enter a valid date of birth';
    return null;
  };

  return (
    <div style={fieldWrap(2)}>
      {label('Date of Birth', true)}
      <input type="date" value={val}
        max={new Date(Date.now() - 18*365.25*24*3600*1000).toISOString().split('T')[0]}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { const e = validate(val); setErr(e); if (!e) onAnswer('q_dob', val); }}
        style={{ ...inputBase(false, !!err), paddingRight: hive.spacing[3] }} />
      {helpText('Format: YYYY-MM-DD')}
      {errorMsg(err)}
    </div>
  );
}

// ─── 3. Nationality + Country select ─────────────────────────────────────────

interface NationalityProps {
  onAnswer: (id:string, v:string) => void;
  saved?: string;
  isMobile: boolean;
}
export function KYCNationalitySelect({ onAnswer, saved, isMobile }: NationalityProps) {
  const [val, setVal] = useState(saved ?? '');
  const [err, setErr] = useState<string|null>(null);

  return (
    <div style={fieldWrap()}>
      {label('Nationality', true)}
      {isMobile
        ? <NativeSelect value={val} options={COUNTRIES.map(c=>({ value:c.iso2, label:`${c.flag} ${c.name}` }))}
            placeholder="Select nationality"
            onChange={v => { setVal(v); setErr(!v ? 'Required' : null); onAnswer('q_nationality', v); }} />
        : <SearchableSelect value={val} options={COUNTRIES.map(c=>({ value:c.iso2, label:`${c.flag} ${c.name}` }))}
            placeholder="Search nationality..."
            onChange={v => { setVal(v); setErr(!v ? 'Required' : null); onAnswer('q_nationality', v); }} />
      }
      {errorMsg(err)}
    </div>
  );
}

// ─── 4. National ID / Unique Identifier ──────────────────────────────────────

const ID_TYPES = [
  { value:'HKID',       label:'HKID (Hong Kong)' },
  { value:'PASSPORT',   label:'Passport' },
  { value:'MAINLANDID', label:'Mainland China ID (居民身份証)' },
  { value:'NRIC',       label:'NRIC (Singapore)' },
  { value:'NIN',        label:'National Insurance Number (UK)' },
  { value:'SSN',        label:'Social Security Number (US)' },
  { value:'AADHAAR',    label:'Aadhaar Number (India)' },
  { value:'OTHER',      label:'Other National ID' },
];

const ID_PATTERNS: Record<string,{pattern:RegExp; hint:string; placeholder:string}> = {
  HKID:       { pattern:/^[A-Z]{1,2}[0-9]{6}\([0-9A]\)$/, hint:'Format: A123456(7)', placeholder:'A123456(7)' },
  PASSPORT:   { pattern:/^[A-Z0-9]{6,9}$/, hint:'6–9 alphanumeric characters', placeholder:'X12345678' },
  MAINLANDID: { pattern:/^[1-9]\d{16}[\dX]$/, hint:'18-digit China Resident ID', placeholder:'110101199001011234' },
  NRIC:       { pattern:/^[STFG]\d{7}[A-Z]$/, hint:'Format: S1234567D', placeholder:'S1234567D' },
  SSN:        { pattern:/^\d{3}-\d{2}-\d{4}$/, hint:'Format: 123-45-6789', placeholder:'123-45-6789' },
  AADHAAR:    { pattern:/^\d{4}\s\d{4}\s\d{4}$/, hint:'12-digit number', placeholder:'1234 5678 9012' },
  DEFAULT:    { pattern:/^.{5,30}$/, hint:'5–30 characters', placeholder:'Enter ID number' },
};

export function KYCUniqueIdentifier({ onAnswer, isMobile }: { onAnswer:(id:string,v:string)=>void; isMobile:boolean }) {
  const [idType, setIdType] = useState('');
  const [idNum,  setIdNum]  = useState('');
  const [err,    setErr]    = useState<string|null>(null);

  const meta = ID_PATTERNS[idType] ?? ID_PATTERNS.DEFAULT;

  const validate = (v: string) => {
    if (!v.trim()) return 'ID number is required';
    if (idType && !meta.pattern.test(v)) return `Invalid format. ${meta.hint}`;
    return null;
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: hive.spacing[4] }}>
      <div style={fieldWrap()}>
        {label('ID Type', true)}
        <NativeSelect value={idType} options={ID_TYPES} placeholder="Select ID type"
          onChange={v => { setIdType(v); setIdNum(''); onAnswer('q_id_type', v); }} />
      </div>
      {idType && (
        <div style={fieldWrap()}>
          {label('ID Number', true)}
          <InputField value={idNum} placeholder={meta.placeholder}
            onChange={setIdNum}
            onBlur={v => { const e = validate(v); setErr(e); if (!e) onAnswer('q_id_number', v); }}
            error={err} />
          {helpText(meta.hint)}
        </div>
      )}
    </div>
  );
}

// ─── 5. Phone with Country Code ───────────────────────────────────────────────

export function KYCPhoneField({ onAnswer, isMobile, saved }: {
  onAnswer:(id:string,v:string)=>void; isMobile:boolean; saved?:string }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [number,  setNumber]  = useState(saved ?? '');
  const [err,     setErr]     = useState<string|null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch]   = useState('');

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search));

  const validate = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return 'Phone number is required';
    if (digits.length !== country.phoneDigits) return `${country.name} numbers should be ${country.phoneDigits} digits`;
    return null;
  };

  return (
    <div style={fieldWrap(2)}>
      {label('Mobile Phone Number', true)}
      <div style={{ display:'flex', gap: hive.spacing[2] }}>
        {/* Country code picker */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <button type="button"
            onClick={() => setShowPicker(p => !p)}
            style={{ height: hive.component.input.height,
              padding: `0 ${hive.spacing[3]}`,
              border: `1px solid ${hive.component.input.borderColor}`,
              borderRadius: hive.borderRadius.base,
              backgroundColor: hive.color.neutral[50],
              cursor:'pointer', display:'flex', alignItems:'center', gap: hive.spacing[1],
              fontSize: hive.typography.fontSize.base, fontFamily: font,
              whiteSpace:'nowrap' }}>
            <span>{country.flag}</span>
            <span style={{ color: hive.color.neutral[700] }}>{country.dialCode}</span>
            <span style={{ fontSize:'10px', color: hive.color.neutral[400] }}>▼</span>
          </button>

          {showPicker && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:200,
              width: isMobile ? '90vw' : '320px',
              maxHeight:'280px', overflowY:'auto',
              backgroundColor: hive.color.brand.white,
              border: `1px solid ${hive.color.neutral[200]}`,
              borderRadius: hive.borderRadius.md,
              boxShadow: hive.shadow.lg }}>
              <div style={{ padding: hive.spacing[2], borderBottom:`1px solid ${hive.color.neutral[200]}` }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  style={{ width:'100%', padding:`${hive.spacing[2]} ${hive.spacing[3]}`,
                    border:`1px solid ${hive.color.neutral[300]}`,
                    borderRadius: hive.borderRadius.sm, fontSize: hive.typography.fontSize.sm,
                    fontFamily: font, outline:'none', boxSizing:'border-box' }} />
              </div>
              {filtered.map(c => (
                <button key={c.iso2} type="button"
                  onClick={() => { setCountry(c); setShowPicker(false); setSearch(''); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap: hive.spacing[3],
                    padding:`${hive.spacing[2]} ${hive.spacing[4]}`,
                    border:'none', background: c.iso2===country.iso2 ? hive.color.brand.primaryLight : 'transparent',
                    cursor:'pointer', fontSize: hive.typography.fontSize.sm, fontFamily: font,
                    color: hive.color.neutral[800], textAlign:'left' }}>
                  <span style={{ fontSize:'20px' }}>{c.flag}</span>
                  <span style={{ flex:1 }}>{c.name}</span>
                  <span style={{ color: hive.color.neutral[500] }}>{c.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number input */}
        <input type="tel" value={number} placeholder={`${country.phoneDigits} digits`}
          onChange={e => setNumber(e.target.value)}
          onBlur={() => {
            const e = validate(number);
            setErr(e);
            if (!e) onAnswer('q_phone', `${country.dialCode}${number}`);
          }}
          style={{ ...inputBase(false, !!err), flex:1 }} />
      </div>
      {helpText(`Enter local number without country code (${country.phoneDigits} digits for ${country.name})`)}
      {errorMsg(err)}
    </div>
  );
}

// ─── 6. Residential Address (format-aware) ────────────────────────────────────

interface AddressValue {
  flat?: string; floor?: string; block?: string;
  building?: string; street?: string; district?: string;
  city?: string; state?: string; postcode?: string; country: string;
}

export function KYCAddressBlock({ onAnswer, isMobile, savedCountry = 'HK' }: {
  onAnswer:(id:string,v:AddressValue)=>void; isMobile:boolean; savedCountry?:string }) {
  const [addr, setAddr] = useState<AddressValue>({ country: savedCountry });
  const country = COUNTRIES.find(c => c.iso2 === savedCountry) ?? COUNTRIES[0];

  const update = (field: keyof AddressValue, value: string) => {
    const next = { ...addr, [field]: value };
    setAddr(next);
    onAnswer('q_address', next);
  };

  const grid2 = { display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: hive.spacing[3] };

  // HK format: Flat/Floor/Block → Building → Street → District → HK
  if (country.addressFormat === 'HK') return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[3] }}>
      <AddressFormatBadge label="Hong Kong Address Format" />
      <div style={grid2}>
        <div>
          {label('Flat / Unit Number')}
          <InputField value={addr.flat??''} placeholder="e.g. Flat B" onChange={v=>update('flat',v)} />
        </div>
        <div>
          {label('Floor')}
          <InputField value={addr.floor??''} placeholder="e.g. 12/F" onChange={v=>update('floor',v)} />
        </div>
        <div>
          {label('Block')}
          <InputField value={addr.block??''} placeholder="e.g. Block 3" onChange={v=>update('block',v)} />
        </div>
        <div>
          {label('Building Name / Estate', true)}
          <InputField value={addr.building??''} placeholder="e.g. Taikoo Shing" onChange={v=>update('building',v)} />
        </div>
      </div>
      <div>
        {label('Street Address', true)}
        <InputField value={addr.street??''} placeholder="e.g. 28 Kings Road" onChange={v=>update('street',v)} />
      </div>
      <div>
        {label('District', true)}
        <NativeSelect value={addr.district??''} options={HK_DISTRICTS} placeholder="Select district"
          onChange={v=>update('district',v)} />
      </div>
      <div>
        {label('Region')}
        <NativeSelect value={addr.city??''} options={[
          { value:'HK_ISLAND', label:'Hong Kong Island (港島)' },
          { value:'KOWLOON',   label:'Kowloon (九龍)' },
          { value:'NEW_TERR',  label:'New Territories (新界)' },
          { value:'OUTLYING',  label:'Outlying Islands (離島)' },
        ]} placeholder="Select region" onChange={v=>update('city',v)} />
      </div>
    </div>
  );

  // CN format: Province → City → District → Street → Building → Unit
  if (country.addressFormat === 'CN') return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[3] }}>
      <AddressFormatBadge label="Mainland China Address Format" />
      <div style={grid2}>
        <div>
          {label('Province / Municipality', true)}
          <InputField value={addr.state??''} placeholder="e.g. 广东省" onChange={v=>update('state',v)} />
        </div>
        <div>
          {label('City', true)}
          <InputField value={addr.city??''} placeholder="e.g. 广州市" onChange={v=>update('city',v)} />
        </div>
        <div>
          {label('District', true)}
          <InputField value={addr.district??''} placeholder="e.g. 天河区" onChange={v=>update('district',v)} />
        </div>
        <div>
          {label('Postcode', true)}
          <InputField value={addr.postcode??''} placeholder="6 digits" onChange={v=>update('postcode',v)} />
        </div>
      </div>
      <div>
        {label('Street & Building', true)}
        <InputField value={addr.street??''} placeholder="e.g. 天河路385号" onChange={v=>update('street',v)} />
      </div>
      <div>
        {label('Unit / Room Number')}
        <InputField value={addr.flat??''} placeholder="e.g. 2602室" onChange={v=>update('flat',v)} />
      </div>
    </div>
  );

  // UK format
  if (country.addressFormat === 'UK') return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[3] }}>
      <AddressFormatBadge label="UK Address Format" />
      <div>
        {label('Address Line 1', true)}
        <InputField value={addr.flat??''} placeholder="House number and street" onChange={v=>update('flat',v)} />
      </div>
      <div>
        {label('Address Line 2')}
        <InputField value={addr.building??''} placeholder="Flat, apartment, etc." onChange={v=>update('building',v)} />
      </div>
      <div style={grid2}>
        <div>
          {label('Town / City', true)}
          <InputField value={addr.city??''} placeholder="e.g. London" onChange={v=>update('city',v)} />
        </div>
        <div>
          {label('Postcode', true)}
          <InputField value={addr.postcode??''} placeholder="e.g. SW1A 1AA" onChange={v=>update('postcode',v)} />
        </div>
      </div>
    </div>
  );

  // Generic / US / SG
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[3] }}>
      <AddressFormatBadge label={`${country.name} Address`} />
      <div>
        {label('Address Line 1', true)}
        <InputField value={addr.flat??''} placeholder="Street address" onChange={v=>update('flat',v)} />
      </div>
      <div>
        {label('Address Line 2')}
        <InputField value={addr.building??''} placeholder="Apt, suite, unit, etc." onChange={v=>update('building',v)} />
      </div>
      <div style={grid2}>
        <div>
          {label('City', true)}
          <InputField value={addr.city??''} placeholder="City" onChange={v=>update('city',v)} />
        </div>
        <div>
          {label('State / Province')}
          <InputField value={addr.state??''} placeholder="State" onChange={v=>update('state',v)} />
        </div>
        <div>
          {label('Postcode / ZIP', true)}
          <InputField value={addr.postcode??''} placeholder="Postcode" onChange={v=>update('postcode',v)} />
        </div>
      </div>
    </div>
  );
}

function AddressFormatBadge({ label: lbl }: { label: string }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap: hive.spacing[1],
      backgroundColor: hive.color.brand.primaryLight,
      border: `1px solid ${hive.color.brand.primary}`,
      borderRadius: hive.borderRadius.full,
      padding: `2px ${hive.spacing[3]}`,
      fontSize: hive.typography.fontSize.xs,
      color: hive.color.brand.primary, fontFamily: font, fontWeight: hive.typography.fontWeight.semibold }}>
      📍 {lbl}
    </div>
  );
}

// ─── 7. Document upload (ID + selfie) ────────────────────────────────────────

const DOC_TYPES_BY_NATIONALITY: Record<string, { value:string; label:string; hint:string }[]> = {
  HK: [
    { value:'HKID',     label:'Hong Kong Identity Card', hint:'Both sides required' },
    { value:'PASSPORT', label:'Passport',                hint:'Photo page required' },
    { value:'DRIVERS',  label:"Driver's Licence",        hint:'Front side required' },
  ],
  CN: [
    { value:'MAINLAND_ID', label:'Mainland China Resident ID (居民身份証)', hint:'Both sides required' },
    { value:'PASSPORT',    label:'Passport',                                hint:'Photo page required' },
  ],
  DEFAULT: [
    { value:'PASSPORT', label:'Passport',       hint:'Photo page required' },
    { value:'DRIVERS',  label:"Driver's Licence", hint:'Front side required' },
  ],
};

export function KYCDocumentCapture({ onAnswer, isMobile, nationality = 'HK' }: {
  onAnswer:(id:string,v:any)=>void; isMobile:boolean; nationality?: string }) {
  const docTypes = DOC_TYPES_BY_NATIONALITY[nationality] ?? DOC_TYPES_BY_NATIONALITY.DEFAULT;
  const [docType, setDocType] = useState('');
  const [frontImg, setFrontImg] = useState<string|null>(null);
  const [backImg,  setBackImg]  = useState<string|null>(null);
  const needsBack = docType === 'HKID' || docType === 'MAINLAND_ID';

  // Reset selection when the available doc types change (e.g. nationality changed)
  useEffect(() => {
    setDocType('');
    setFrontImg(null);
    setBackImg(null);
  }, [nationality]);

  const handleFile = (side: 'front'|'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === 'front') setFrontImg(url);
    else setBackImg(url);
    onAnswer(`q_doc_${side}`, { docType, file: file.name, size: file.size });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[5] }}>
      <div>
        {label('Document Type', true)}
        <NativeSelect value={docType} options={docTypes.map(d => ({ value:d.value, label:d.label }))}
          placeholder="Select document type" onChange={setDocType} />
      </div>

      {docType && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: hive.spacing[4] }}>
          <UploadZone label="Front / Photo Page" preview={frontImg}
            hint={docTypes.find(d => d.value===docType)?.hint ?? ''}
            onChange={handleFile('front')} isMobile={isMobile} />
          {needsBack && (
            <UploadZone label="Back Side" preview={backImg}
              hint="Required for this document type" onChange={handleFile('back')} isMobile={isMobile} />
          )}
        </div>
      )}

      {(frontImg || backImg) && (
        <DocQualityChecklist />
      )}
    </div>
  );
}

function UploadZone({ label: lbl, preview, hint, onChange, isMobile }: {
  label:string; preview:string|null; hint:string;
  onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void; isMobile:boolean }) {
  return (
    <div>
      {label(lbl, true)}
      {helpText(hint)}
      <label style={{ display:'block', marginTop: hive.spacing[2],
        border: preview ? 'none' : `2px dashed ${hive.color.neutral[300]}`,
        borderRadius: hive.borderRadius.lg, cursor:'pointer',
        overflow:'hidden', backgroundColor: hive.color.neutral[50] }}>
        {preview
          ? <div style={{ position:'relative' }}>
              <img src={preview} alt="Document preview"
                style={{ width:'100%', maxHeight:'200px', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', bottom: hive.spacing[2], right: hive.spacing[2],
                backgroundColor:'rgba(0,0,0,0.6)', color:'#fff', fontSize: hive.typography.fontSize.xs,
                padding:`${hive.spacing[1]} ${hive.spacing[2]}`, borderRadius: hive.borderRadius.sm,
                fontFamily: font }}>
                ✓ Captured — tap to retake
              </div>
            </div>
          : <div style={{ padding: isMobile ? hive.spacing[8] : hive.spacing[10],
              display:'flex', flexDirection:'column', alignItems:'center', gap: hive.spacing[2] }}>
              <div style={{ fontSize:'40px' }}>📷</div>
              <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
                fontSize: hive.typography.fontSize.base, color: hive.color.neutral[700] }}>
                {isMobile ? 'Take photo or upload' : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: hive.typography.fontSize.xs, color: hive.color.neutral[400], fontFamily: font }}>
                JPG, PNG or PDF · Max 10MB
              </div>
            </div>
        }
        <input type="file" accept="image/*,.pdf" capture={isMobile ? 'environment' : undefined}
          onChange={onChange} style={{ display:'none' }} />
      </label>
    </div>
  );
}

function DocQualityChecklist() {
  const checks = [
    'All four corners of the document are visible',
    'Text is clear and readable — no blurring',
    'No glare or shadows covering important details',
    'Document is not expired',
  ];
  return (
    <div style={{ backgroundColor: hive.color.semantic.successLight,
      border: `1px solid ${hive.color.semantic.success}`,
      borderRadius: hive.borderRadius.md, padding: hive.spacing[4] }}>
      <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
        fontSize: hive.typography.fontSize.sm, color: hive.color.semantic.success,
        marginBottom: hive.spacing[2] }}>
        ✓ Document quality checklist
      </div>
      {checks.map(c => (
        <div key={c} style={{ display:'flex', gap: hive.spacing[2], fontSize: hive.typography.fontSize.xs,
          fontFamily: font, color: hive.color.neutral[700], marginBottom: '4px' }}>
          <span style={{ color: hive.color.semantic.success, flexShrink:0 }}>✓</span> {c}
        </div>
      ))}
    </div>
  );
}

// ─── 8. Liveness / Selfie ────────────────────────────────────────────────────

export function KYCLivenessCapture({ onAnswer, isMobile }: {
  onAnswer:(id:string,v:any)=>void; isMobile:boolean }) {
  const [step, setStep] = useState<'instructions'|'capture'|'processing'|'done'>('instructions');
  const [selfie, setSelfie] = useState<string|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setStep('capture');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert('Camera access required for liveness check. Please allow camera access and try again.');
      setStep('instructions');
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setSelfie(canvas.toDataURL('image/jpeg', 0.9));
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setStep('processing');
    setTimeout(() => { setStep('done'); onAnswer('q_liveness', { status:'PASSED' }); }, 2500);
  };

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${hive.color.neutral[200]}`, borderRadius: hive.borderRadius.lg,
    overflow:'hidden', backgroundColor: hive.color.brand.white, boxShadow: hive.shadow.sm,
  };

  if (step === 'instructions') return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[4] }}>
      <div style={{ backgroundColor: hive.color.semantic.infoLight,
        border:`1px solid ${hive.color.semantic.info}`,
        borderRadius: hive.borderRadius.md, padding: hive.spacing[4] }}>
        <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
          color: hive.color.semantic.info, fontSize: hive.typography.fontSize.sm, marginBottom: hive.spacing[2] }}>
          Liveness Detection — Identity Verification
        </div>
        <p style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[700],
          margin:0, lineHeight: hive.typography.lineHeight.normal }}>
          We need to verify that you are a real person and match your ID document.
          This process takes approximately 30 seconds.
        </p>
      </div>
      {[
        ['😊', 'Face the camera', 'Position your face in the oval guide. Ensure good lighting.'],
        ['👁', 'Follow the prompts', 'You may be asked to blink, turn your head, or smile.'],
        ['📸', 'Stay still', 'Hold steady while we capture your image for matching.'],
      ].map(([icon, title, desc]) => (
        <div key={title} style={{ ...cardStyle, padding: hive.spacing[4], display:'flex', gap: hive.spacing[4] }}>
          <span style={{ fontSize:'28px', flexShrink:0 }}>{icon}</span>
          <div>
            <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
              fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[800] }}>{title}</div>
            <div style={{ fontFamily: font, fontSize: hive.typography.fontSize.xs,
              color: hive.color.neutral[600], marginTop:'2px' }}>{desc}</div>
          </div>
        </div>
      ))}
      <button onClick={startCamera} style={{ ...primaryBtnStyle() }}>Begin Liveness Check</button>
    </div>
  );

  if (step === 'capture') return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[3] }}>
      <div style={{ position:'relative', borderRadius: hive.borderRadius.lg, overflow:'hidden',
        backgroundColor:'#000', aspectRatio:'4/3' }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} />
        {/* Oval face guide */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          pointerEvents:'none' }}>
          <div style={{ width:'55%', aspectRatio:'3/4',
            border:`3px solid ${hive.color.brand.primary}`,
            borderRadius:'50%', opacity:0.8 }} />
        </div>
        <div style={{ position:'absolute', bottom: hive.spacing[4], left:0, right:0, textAlign:'center',
          color:'#fff', fontFamily: font, fontSize: hive.typography.fontSize.sm,
          textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}>
          Position your face in the oval
        </div>
      </div>
      <button onClick={capture} style={{ ...primaryBtnStyle() }}>📸 Capture</button>
    </div>
  );

  if (step === 'processing') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: hive.spacing[4],
      padding: hive.spacing[8] }}>
      {selfie && <img src={selfie} alt="Selfie"
        style={{ width:'120px', height:'120px', objectFit:'cover', borderRadius:'50%',
          border:`3px solid ${hive.color.brand.primary}` }} />}
      <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
        color: hive.color.neutral[800], fontSize: hive.typography.fontSize.lg }}>
        Verifying your identity…
      </div>
      <div style={{ width:'100%', maxWidth:'300px', height:'4px',
        backgroundColor: hive.color.neutral[200], borderRadius: hive.borderRadius.full,
        overflow:'hidden' }}>
        <div style={{ height:'100%', backgroundColor: hive.color.brand.primary,
          borderRadius: hive.borderRadius.full, animation:'progress-fill 2.5s ease forwards' }} />
      </div>
      <p style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm,
        color: hive.color.neutral[500], textAlign:'center', margin:0 }}>
        Matching against your ID document using facial recognition…
      </p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: hive.spacing[3],
      padding: hive.spacing[6], backgroundColor: hive.color.semantic.successLight,
      borderRadius: hive.borderRadius.lg, border:`1px solid ${hive.color.semantic.success}` }}>
      <div style={{ fontSize:'48px' }}>✅</div>
      <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
        color: hive.color.semantic.success, fontSize: hive.typography.fontSize.lg }}>
        Liveness Check Passed
      </div>
      <p style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm,
        color: hive.color.neutral[700], textAlign:'center', margin:0 }}>
        Your identity has been verified successfully. Facial match confidence: 98.4%
      </p>
    </div>
  );
}

// ─── 9. Open Banking consent ──────────────────────────────────────────────────

const HK_BANKS = [
  { value:'HSBC_HK',   label:'HSBC Hong Kong' },
  { value:'BOC_HK',    label:'Bank of China (Hong Kong)' },
  { value:'HANG_SENG', label:'Hang Seng Bank' },
  { value:'SCB_HK',    label:'Standard Chartered Hong Kong' },
  { value:'CITI_HK',   label:'Citibank Hong Kong' },
  { value:'DBS_HK',    label:'DBS Bank Hong Kong' },
  { value:'BEA',       label:'Bank of East Asia' },
];

export function KYCOpenBankingConsent({ onAnswer, isMobile }: {
  onAnswer:(id:string,v:any)=>void; isMobile:boolean }) {
  const [bank, setBank] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const bankLabel = HK_BANKS.find(b => b.value === bank)?.label ?? 'your bank';

  const connectBank = () => {
    if (!bank) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      onAnswer('q_ob_consent', { bank, consentToken: `tok_${Date.now()}` });
    }, 1500);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[5] }}>
      <div style={{ backgroundColor: hive.color.semantic.infoLight,
        border:`1px solid ${hive.color.semantic.info}`,
        borderRadius: hive.borderRadius.md, padding: hive.spacing[4] }}>
        <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
          color: hive.color.semantic.info, fontSize: hive.typography.fontSize.sm, marginBottom: hive.spacing[1] }}>
          🔒 Open Banking — Secure Account Connection
        </div>
        <p style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm,
          color: hive.color.neutral[700], margin:0, lineHeight: hive.typography.lineHeight.normal }}>
          We use Open Banking (HKMA regulated) to verify your identity.
          Your credentials are never shared with HSBC.
        </p>
      </div>

      {/* Bank selector */}
      <div>
        {label('Your current bank', true)}
        <NativeSelect value={bank} placeholder="Select your bank"
          options={HK_BANKS}
          onChange={setBank} />
      </div>

      {connected
        ? <div style={{ display:'flex', alignItems:'center', gap: hive.spacing[3],
            backgroundColor: hive.color.semantic.successLight,
            border:`1px solid ${hive.color.semantic.success}`,
            borderRadius: hive.borderRadius.md, padding: hive.spacing[4] }}>
            <span style={{ fontSize:'28px' }}>🏦</span>
            <div>
              <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
                color: hive.color.semantic.success, fontSize: hive.typography.fontSize.sm }}>
                Bank Connected Successfully
              </div>
              <div style={{ fontFamily: font, fontSize: hive.typography.fontSize.xs,
                color: hive.color.neutral[600], marginTop:'2px' }}>
                Account ownership verified · Consent token issued · 90-day access
              </div>
            </div>
          </div>
        : <button onClick={connectBank} disabled={!bank || connecting}
            style={{ width:'100%', height: hive.component.button.height,
              backgroundColor: !bank || connecting ? hive.color.neutral[300] : hive.color.brand.primary,
              color: hive.color.brand.white, border:'none', borderRadius: hive.borderRadius.base,
              fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
              fontSize: hive.typography.fontSize.base, cursor: !bank ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap: hive.spacing[2] }}>
            🔒 {connecting ? 'Connecting…' : `Connect to ${bankLabel} securely`}
          </button>
      }

      <p style={{ fontFamily: font, fontSize: hive.typography.fontSize.xs,
        color: hive.color.neutral[400], textAlign:'center', margin:0 }}>
        Powered by Open Banking · Regulated by the HKMA
      </p>
    </div>
  );
}

// ─── 10. Source of Wealth & Funds ────────────────────────────────────────────

const EMPLOYMENT_STATUSES = [
  { value: 'EMPLOYED',       label: 'Employed (full-time or part-time)' },
  { value: 'SELF_EMPLOYED',  label: 'Self-employed' },
  { value: 'BUSINESS_OWNER', label: 'Business owner' },
  { value: 'RETIRED',        label: 'Retired' },
  { value: 'STUDENT',        label: 'Student' },
  { value: 'HOMEMAKER',      label: 'Homemaker' },
  { value: 'UNEMPLOYED',     label: 'Unemployed' },
];

export function KYCSourceOfWealth({ onAnswer, isMobile }: {
  onAnswer:(id:string,v:string)=>void; isMobile:boolean }) {

  const [employment,   setEmployment]   = useState('');
  const [occupation,   setOccupation]   = useState('');
  const [income,       setIncome]       = useState('');
  const [fundsSource,  setFundsSource]  = useState('');
  const [purpose,      setPurpose]      = useState('');
  const [detail,       setDetail]       = useState('');
  const [empErr,  setEmpErr]  = useState<string|null>(null);
  const [occErr,  setOccErr]  = useState<string|null>(null);
  const [incErr,  setIncErr]  = useState<string|null>(null);
  const [funErr,  setFunErr]  = useState<string|null>(null);
  const [purErr,  setPurErr]  = useState<string|null>(null);

  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: hive.spacing[4],
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[6] }}>

      {/* ── Employment ──────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[1] }}>
        <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
          fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[500],
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: hive.spacing[2] }}>
          Employment
        </div>
        <div style={grid2}>
          <div style={fieldWrap()}>
            {label('Employment Status', true)}
            <NativeSelect
              value={employment}
              options={EMPLOYMENT_STATUSES}
              placeholder="Select employment status"
              onChange={v => {
                setEmployment(v);
                setEmpErr(v ? null : 'Please select your employment status');
                onAnswer('q_employment_status', v);
              }} />
            {errorMsg(empErr)}
          </div>
          <div style={fieldWrap()}>
            {label('Occupation / Industry', true)}
            <NativeSelect
              value={occupation}
              options={OCCUPATIONS}
              placeholder="Select occupation"
              onChange={v => {
                setOccupation(v);
                setOccErr(v ? null : 'Please select your occupation');
                onAnswer('q_occupation', v);
              }} />
            {errorMsg(occErr)}
          </div>
        </div>
        <div style={fieldWrap()}>
          {label('Annual Income (HKD)', true)}
          <NativeSelect
            value={income}
            options={INCOME_BANDS}
            placeholder="Select income range"
            onChange={v => {
              setIncome(v);
              setIncErr(v ? null : 'Please select your income range');
              onAnswer('q_annual_income', v);
            }} />
          {errorMsg(incErr)}
        </div>
      </div>

      {/* ── Source of Funds ─────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[1] }}>
        <div style={{ fontFamily: font, fontWeight: hive.typography.fontWeight.semibold,
          fontSize: hive.typography.fontSize.sm, color: hive.color.neutral[500],
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: hive.spacing[2] }}>
          Source of Funds
        </div>
        <div style={fieldWrap(2)}>
          {label('Primary Source of Funds', true)}
          <NativeSelect
            value={fundsSource}
            options={FUNDS_SOURCES}
            placeholder="Select source of funds"
            onChange={v => {
              setFundsSource(v);
              setFunErr(v ? null : 'Please select your source of funds');
              onAnswer('q_source_of_funds', v);
            }} />
          {errorMsg(funErr)}
        </div>
        <div style={fieldWrap(2)}>
          {label('Purpose of Account', true)}
          <NativeSelect
            value={purpose}
            options={ACCOUNT_PURPOSES}
            placeholder="Select purpose"
            onChange={v => {
              setPurpose(v);
              setPurErr(v ? null : 'Please select the account purpose');
              onAnswer('q_account_purpose', v);
            }} />
          {errorMsg(purErr)}
        </div>
        <div style={fieldWrap(2)}>
          {label('Additional Details')}
          <textarea
            rows={isMobile ? 3 : 4}
            value={detail}
            placeholder="Please provide any additional context about your source of funds or intended use of this account (optional)"
            style={{ width:'100%', boxSizing:'border-box', padding: hive.spacing[3],
              fontSize: hive.typography.fontSize.base, fontFamily: font,
              border:`1px solid ${hive.component.input.borderColor}`,
              borderRadius: hive.borderRadius.base, resize:'vertical', outline:'none',
              lineHeight: hive.typography.lineHeight.normal, color: hive.color.neutral[800] }}
            onChange={e => {
              setDetail(e.target.value);
              onAnswer('q_funds_detail', e.target.value);
            }} />
        </div>
      </div>

    </div>
  );
}

// ─── 11. Declaration / Legal ──────────────────────────────────────────────────

export function KYCDeclarationBlock({ onAnswer, isMobile }: {
  onAnswer:(id:string,v:boolean)=>void; isMobile:boolean }) {
  const [agreed, setAgreed] = useState(false);
  const [fatca,  setFatca]  = useState(false);
  const [pep,    setPep]    = useState<string>('');

  const declarations = [
    { id:'decl_truthful',  text:'All information provided in this application is true, accurate and complete to the best of my knowledge.', required:true, value:agreed, set:setAgreed },
    { id:'decl_fatca', text:'I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency). If you are a US person, please declare below.', required:true, value:fatca, set:setFatca },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[5] }}>
      {/* PEP check */}
      <div style={{ border:`1px solid ${hive.color.neutral[200]}`,
        borderRadius: hive.borderRadius.md, padding: hive.spacing[4] }}>
        {label('Politically Exposed Person (PEP) Status', true)}
        {helpText('A PEP is someone who holds or has held a prominent public position in the last 12 months')}
        <div style={{ display:'flex', flexDirection:'column', gap: hive.spacing[2], marginTop: hive.spacing[3] }}>
          {[
            { value:'NO',     text:'I am not a PEP and not related to a PEP' },
            { value:'YES',    text:'I am a PEP or closely related to a PEP' },
            { value:'FORMER', text:'I was a PEP more than 12 months ago' },
          ].map(opt => (
            <label key={opt.value} style={{ display:'flex', alignItems:'flex-start', gap: hive.spacing[3],
              cursor:'pointer', padding: hive.spacing[3],
              backgroundColor: pep===opt.value ? hive.color.brand.primaryLight : 'transparent',
              borderRadius: hive.borderRadius.sm, border:`1px solid ${pep===opt.value ? hive.color.brand.primary : 'transparent'}` }}>
              <input type="radio" name="pep" value={opt.value}
                checked={pep===opt.value}
                onChange={() => { setPep(opt.value); onAnswer('q_pep_status', opt.value as any); }}
                style={{ marginTop:'2px', accentColor: hive.color.brand.primary }} />
              <span style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm,
                color: hive.color.neutral[700] }}>{opt.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Legal declarations */}
      {declarations.map(d => (
        <label key={d.id}
          style={{ display:'flex', gap: hive.spacing[3], alignItems:'flex-start',
            cursor:'pointer', padding: hive.spacing[4],
            border:`1px solid ${d.value ? hive.color.semantic.success : hive.color.neutral[200]}`,
            borderRadius: hive.borderRadius.md,
            backgroundColor: d.value ? hive.color.semantic.successLight : hive.color.neutral[50] }}>
          <input type="checkbox" checked={d.value}
            onChange={() => { d.set(!d.value as any); onAnswer(d.id, !d.value as any); }}
            style={{ width:'18px', height:'18px', flexShrink:0, marginTop:'2px',
              accentColor: hive.color.semantic.success }} />
          <span style={{ fontFamily: font, fontSize: hive.typography.fontSize.sm,
            color: hive.color.neutral[700], lineHeight: hive.typography.lineHeight.normal }}>
            {d.text}
          </span>
        </label>
      ))}

      <div style={{ backgroundColor: hive.color.neutral[100],
        borderRadius: hive.borderRadius.md, padding: hive.spacing[4],
        fontSize: hive.typography.fontSize.xs, color: hive.color.neutral[600],
        fontFamily: font, lineHeight: hive.typography.lineHeight.relaxed }}>
        By submitting this application you consent to HSBC processing your personal data
        in accordance with the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC's
        Privacy Notice. Your data will be used for account opening, identity verification,
        and regulatory compliance purposes.
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function InputField({ value, placeholder, onChange, onBlur, error, type = 'text' }: {
  value: string; placeholder?: string; error?: string | null;
  onChange: (v: string) => void; onBlur?: (v: string) => void; type?: string; }) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={e => { setFocused(false); onBlur?.(e.target.value); }}
        style={inputBase(focused, !!error)} />
      {errorMsg(error ?? null)}
    </>
  );
}

function NativeSelect({ value, options, placeholder, onChange }: {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined;

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase(focused, false),
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23595959' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `right ${hive.spacing[4]} center`,
        paddingRight: hive.spacing[10],
        cursor: 'pointer',
        // Show placeholder colour only when nothing is selected
        color: hasValue ? hive.color.neutral[800] : hive.color.neutral[400],
      }}>
      {/* Placeholder option — NOT disabled so React controlled select works correctly */}
      {placeholder && (
        <option value="" style={{ color: hive.color.neutral[400] }}>
          {placeholder}
        </option>
      )}
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ color: hive.color.neutral[800] }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SearchableSelect({ value, options, placeholder, onChange }: {
  value: string; options:{value:string;label:string}[];
  placeholder?: string; onChange:(v:string)=>void; }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div onClick={() => setOpen(p => !p)}
        style={{ ...inputBase(open, false), display:'flex', alignItems:'center',
          cursor:'pointer', userSelect:'none' }}>
        <span style={{ flex:1, color: value ? hive.color.neutral[800] : hive.color.neutral[400] }}>
          {selectedLabel || placeholder}
        </span>
        <span style={{ fontSize:'10px', color: hive.color.neutral[400], marginLeft: hive.spacing[2] }}>▼</span>
      </div>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100,
          backgroundColor: hive.color.brand.white,
          border:`1px solid ${hive.color.neutral[200]}`,
          borderRadius: hive.borderRadius.md, boxShadow: hive.shadow.lg,
          maxHeight:'260px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding: hive.spacing[2], borderBottom:`1px solid ${hive.color.neutral[200]}` }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              style={{ width:'100%', boxSizing:'border-box',
                padding:`${hive.spacing[2]} ${hive.spacing[3]}`,
                border:`1px solid ${hive.color.neutral[200]}`,
                borderRadius: hive.borderRadius.sm,
                fontSize: hive.typography.fontSize.sm, fontFamily: font, outline:'none' }} />
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                style={{ padding:`${hive.spacing[2]} ${hive.spacing[4]}`, cursor:'pointer',
                  fontSize: hive.typography.fontSize.sm, fontFamily: font,
                  color: hive.color.neutral[800],
                  backgroundColor: o.value===value ? hive.color.brand.primaryLight : 'transparent',
                  fontWeight: o.value===value ? hive.typography.fontWeight.semibold : hive.typography.fontWeight.regular }}>
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: hive.spacing[4], color: hive.color.neutral[400],
                fontSize: hive.typography.fontSize.sm, fontFamily: font, textAlign:'center' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function primaryBtnStyle(): React.CSSProperties {
  return {
    height: hive.component.button.height,
    width: '100%',
    backgroundColor: hive.color.brand.primary,
    color: hive.color.brand.white,
    border: 'none',
    borderRadius: hive.component.button.borderRadius,
    fontSize: hive.typography.fontSize.base,
    fontWeight: hive.typography.fontWeight.semibold,
    fontFamily: font,
    cursor: 'pointer',
    transition: `background-color ${hive.motion.duration.fast} ${hive.motion.easing.standard}`,
  };
}
