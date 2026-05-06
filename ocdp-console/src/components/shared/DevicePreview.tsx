import { useState } from 'react';
import React from 'react';
import type { Channel, CanvasSlice } from '../../types/ocdp';

// ─── Device catalogue ─────────────────────────────────────────────────────────

interface DeviceSpec {
  id: string;
  label: string;
  brand: string;
  os: 'iOS' | 'Android' | 'HarmonyOS' | 'Web' | 'WeChat';
  width: number;   // CSS px – device frame inner width
  height: number;  // CSS px – device frame inner height
  radius: number;  // border-radius of device frame
  statusBar: string; // background of status bar
  notchStyle: 'pill' | 'island' | 'punch' | 'none';
  frameColor: string;
}

const SDUI_DEVICES: DeviceSpec[] = [
  { id: 'iphone17',        label: 'iPhone 17',          brand: 'Apple',   os: 'iOS',       width: 200, height: 400, radius: 38, statusBar: '#000', notchStyle: 'pill',   frameColor: '#2A2A2A' },
  { id: 'iphone17pro',     label: 'iPhone 17 Pro',      brand: 'Apple',   os: 'iOS',       width: 200, height: 400, radius: 38, statusBar: '#000', notchStyle: 'island', frameColor: '#4A3728' },
  { id: 'samsung_s25u',    label: 'Samsung Galaxy S25 Ultra', brand: 'Samsung', os: 'Android', width: 196, height: 410, radius: 32, statusBar: '#1A1A1A', notchStyle: 'punch', frameColor: '#1C1C1E' },
  { id: 'huawei_mate80',   label: 'Huawei Mate 80',     brand: 'Huawei',  os: 'HarmonyOS', width: 196, height: 410, radius: 34, statusBar: '#000', notchStyle: 'punch', frameColor: '#1D2D3E' },
  { id: 'huawei_pura90',   label: 'Huawei Pura 90',     brand: 'Huawei',  os: 'HarmonyOS', width: 196, height: 400, radius: 38, statusBar: '#0D0D0D', notchStyle: 'pill', frameColor: '#2E1B47' },
  { id: 'xiaomi_17ultra',  label: 'Xiaomi 17 Ultra',    brand: 'Xiaomi',  os: 'Android',   width: 196, height: 412, radius: 30, statusBar: '#111', notchStyle: 'punch', frameColor: '#1A1A2E' },
];

const WEB_DEVICE: DeviceSpec = {
  id: 'web', label: 'Web Browser', brand: 'Web', os: 'Web',
  width: 580, height: 360, radius: 8, statusBar: '#E8E8E8', notchStyle: 'none', frameColor: '#D1D5DB',
};

const WECHAT_DEVICES = [
  { id: 'wechat_browser', label: 'WeChat In-App Browser' },
  { id: 'wechat_card',    label: 'Service Account Card'  },
];

const OS_COLOR: Record<DeviceSpec['os'], string> = {
  iOS:       '#007AFF',
  Android:   '#3DDC84',
  HarmonyOS: '#CF0A2C',
  Web:       '#1D4ED8',
  WeChat:    '#07C160',
};

// ─── KYC screen designs (one per step type) ───────────────────────────────────

const s8 = { fontSize: 8 } as const;
const s7b: React.CSSProperties = { fontSize: 7, fontWeight: 700 };
const s9: React.CSSProperties = { fontSize: 9 };
const s9b: React.CSSProperties = { fontSize: 9, fontWeight: 700 };
const s10b: React.CSSProperties = { fontSize: 10, fontWeight: 700 };
const red = '#DB0011';
const muted = '#9CA3AF';
const border = '#E5E7EB';
const surface = '#F9FAFB';

function ProgressDots({ total, active }: { total: number; active: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === active ? 14 : 5, height: 5, borderRadius: 3, background: i === active ? red : border, transition: 'width 0.2s' }} />
      ))}
    </div>
  );
}

function KYCHeader({ title, subtitle, step, total }: { title: string; subtitle?: string; step: number; total: number }) {
  const pct = Math.round(((step) / total) * 100);
  return (
    <div style={{ padding: '8px 10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ ...s8, color: muted }}>Step {step} of {total}</span>
        <span style={{ ...s8, color: red, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 3, background: border, borderRadius: 2, marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: red, borderRadius: 2 }} />
      </div>
      <div style={{ ...s10b, color: '#111', marginBottom: subtitle ? 2 : 8 }}>{title}</div>
      {subtitle && <div style={{ ...s8, color: muted, marginBottom: 8 }}>{subtitle}</div>}
    </div>
  );
}

function Field({ label, placeholder, value }: { label: string; placeholder?: string; value?: string }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ ...s7b, color: '#374151', marginBottom: 2 }}>{label}</div>
      <div style={{ border: `1px solid ${value ? '#6B7280' : border}`, borderRadius: 5, padding: '4px 7px', fontSize: 8, color: value ? '#111' : muted, background: '#fff', minHeight: 20 }}>
        {value ?? placeholder ?? ''}
      </div>
    </div>
  );
}

function SelectField({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ ...s7b, color: '#374151', marginBottom: 2 }}>{label}</div>
      <div style={{ border: `1px solid ${border}`, borderRadius: 5, padding: '4px 7px', fontSize: 8, color: value ? '#111' : muted, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
        <span>{value ?? placeholder ?? 'Select…'}</span>
        <span style={{ color: muted }}>▾</span>
      </div>
    </div>
  );
}

function RadioGroup({ label, options, selected }: { label: string; options: string[]; selected?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ ...s7b, color: '#374151', marginBottom: 4 }}>{label}</div>
      {options.map(opt => (
        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', border: `1px solid ${opt === selected ? red : border}`, borderRadius: 5, marginBottom: 3, background: opt === selected ? 'rgba(219,0,17,0.04)' : '#fff' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${opt === selected ? red : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {opt === selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: red }} />}
          </div>
          <span style={{ ...s8, color: '#374151' }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

function PrimaryBtn({ label }: { label: string }) {
  return (
    <div style={{ background: red, color: '#fff', borderRadius: 6, padding: '6px 0', textAlign: 'center', ...s9b, marginTop: 4 }}>{label}</div>
  );
}

// ─── Individual KYC step screen renderers ─────────────────────────────────────

function KYCNameDobScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Personal Information" subtitle="Enter your legal name as on your ID" step={1} total={11} />
      <Field label="First Name" placeholder="e.g. John" />
      <Field label="Last Name" placeholder="e.g. Smith" />
      <Field label="Date of Birth" placeholder="DD / MM / YYYY" />
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCNationalityScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Nationality" subtitle="Select your country of nationality" step={2} total={11} />
      <div style={{ ...s7b, color: '#374151', marginBottom: 4 }}>Country of Nationality</div>
      {[
        { code: '🇭🇰', label: 'Hong Kong (SAR)', hint: '→ HKID required' },
        { code: '🇨🇳', label: 'Mainland China',  hint: '→ Mainland ID' },
        { code: '🌍', label: 'Other countries',  hint: '→ Passport' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', border: `1px solid ${border}`, borderRadius: 5, marginBottom: 3, background: '#fff' }}>
          <span style={{ fontSize: 10 }}>{item.code}</span>
          <div style={{ flex: 1 }}>
            <div style={{ ...s8, color: '#111' }}>{item.label}</div>
            <div style={{ fontSize: 7, color: muted }}>{item.hint}</div>
          </div>
          <span style={{ color: muted, fontSize: 9 }}>›</span>
        </div>
      ))}
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCIDCaptureScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Identity Document" subtitle="HKID / Mainland ID / Passport" step={3} total={11} />
      <div style={{ ...s7b, color: '#374151', marginBottom: 4 }}>Document Type</div>
      {['HKID Card', 'Mainland China ID', 'Passport'].map((doc, i) => (
        <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', border: `1px solid ${i === 0 ? red : border}`, borderRadius: 5, marginBottom: 3, background: i === 0 ? 'rgba(219,0,17,0.04)' : '#fff' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${i === 0 ? red : border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {i === 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: red }} />}
          </div>
          <span style={{ ...s8, color: '#374151' }}>{doc}</span>
        </div>
      ))}
      <Field label="HKID Number" placeholder="A 123456(7)" />
      <Field label="Expiry Date" placeholder="MM / YYYY" />
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCDocUploadScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Upload Identity Document" subtitle="Take a clear photo of your HKID" step={4} total={11} />
      <div style={{ border: `2px dashed ${border}`, borderRadius: 8, padding: '12px 8px', textAlign: 'center', marginBottom: 7, background: surface }}>
        <div style={{ fontSize: 18, marginBottom: 4 }}>📷</div>
        <div style={{ ...s9b, color: '#374151', marginBottom: 2 }}>Front of HKID</div>
        <div style={{ ...s8, color: muted }}>Tap to take photo or upload</div>
      </div>
      <div style={{ border: `2px dashed ${border}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center', marginBottom: 7, background: surface }}>
        <div style={{ fontSize: 16, marginBottom: 3 }}>🔄</div>
        <div style={{ ...s9b, color: '#374151', marginBottom: 1 }}>Back of HKID</div>
        <div style={{ ...s8, color: muted }}>Tap to take photo or upload</div>
      </div>
      <div style={{ ...s8, color: muted, textAlign: 'center', marginBottom: 6 }}>Ensure all 4 corners are visible · no glare</div>
      <PrimaryBtn label="Upload & Continue →" />
    </div>
  );
}

function KYCContactScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Contact Details" subtitle="We'll use these to verify your account" step={5} total={11} />
      <Field label="Email Address" placeholder="john.smith@email.com" />
      <div style={{ marginBottom: 7 }}>
        <div style={{ ...s7b, color: '#374151', marginBottom: 2 }}>Mobile Number</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ border: `1px solid ${border}`, borderRadius: 5, padding: '4px 6px', fontSize: 8, color: '#111', background: '#fff', width: 36, display: 'flex', alignItems: 'center', gap: 2 }}>
            <span>🇭🇰</span><span style={{ color: muted }}>▾</span>
          </div>
          <div style={{ flex: 1, border: `1px solid ${border}`, borderRadius: 5, padding: '4px 7px', fontSize: 8, color: muted, background: '#fff' }}>+852 XXXX XXXX</div>
        </div>
      </div>
      <div style={{ padding: '6px 8px', background: '#EFF6FF', borderRadius: 5, marginBottom: 8 }}>
        <div style={{ ...s8, color: '#1E40AF' }}>📱 An OTP will be sent to verify your number</div>
      </div>
      <PrimaryBtn label="Send OTP →" />
    </div>
  );
}

function KYCAddressScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Residential Address" subtitle="Must be your current Hong Kong address" step={6} total={11} />
      <Field label="Flat / Floor / Block" placeholder="e.g. Flat 12A, 8/F, Block 3" />
      <Field label="Building / Estate Name" placeholder="e.g. Pacific Place" />
      <SelectField label="District" placeholder="Select district…" />
      <div style={{ padding: '5px 7px', background: '#FEF3C7', borderRadius: 5, marginBottom: 7 }}>
        <div style={{ ...s8, color: '#92400E' }}>🔍 Address must match your ID document</div>
      </div>
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCEmploymentScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Employment & Income" subtitle="Required for account suitability assessment" step={7} total={11} />
      <RadioGroup
        label="Employment Status"
        options={['Employed (full-time)', 'Self-employed', 'Student', 'Retired', 'Unemployed']}
        selected="Employed (full-time)"
      />
      <SelectField label="Annual Income (HKD)" value="HKD 500,001 – 1,000,000" />
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCSourceOfFundsScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Source of Funds" subtitle="Regulatory requirement under HKMA guidelines" step={8} total={11} />
      <RadioGroup
        label="Primary Source of Funds"
        options={['Salary / Employment income', 'Business income', 'Investment returns', 'Savings / Family support']}
        selected="Salary / Employment income"
      />
      <RadioGroup
        label="Purpose of Account"
        options={['Daily banking', 'Savings & investments', 'Business transactions']}
        selected="Daily banking"
      />
      <PrimaryBtn label="Continue →" />
    </div>
  );
}

function KYCLivenessScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Selfie & Liveness Check" subtitle="Verify your identity in real-time" step={9} total={11} />
      <div style={{ position: 'relative', width: '100%', paddingBottom: '85%', borderRadius: 10, overflow: 'hidden', marginBottom: 7, background: '#1A1A1A' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Face oval guide */}
          <div style={{ width: 70, height: 90, border: '2px solid rgba(219,0,17,0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, background: 'rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 30, opacity: 0.6 }}>👤</span>
          </div>
          <div style={{ ...s8, color: 'rgba(255,255,255,0.8)', textAlign: 'center', padding: '0 16px' }}>Position your face inside the oval</div>
        </div>
        {/* Corner brackets */}
        {[{top:6,left:6},{top:6,right:6},{bottom:6,left:6},{bottom:6,right:6}].map((pos,i)=>
          <div key={i} style={{ position:'absolute', width:12, height:12, borderColor:red, borderStyle:'solid', borderWidth: '2px 0 0 2px', ...pos, transform: i===1?'scaleX(-1)':i===2?'scaleY(-1)':i===3?'scale(-1,-1)':'none' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <ProgressDots total={3} active={0} />
      </div>
      <div style={{ ...s8, color: muted, textAlign: 'center', marginBottom: 8 }}>Step 1 of 3 · Look straight · Good lighting</div>
      <PrimaryBtn label="📸 Start Liveness Check" />
    </div>
  );
}

function KYCOpenBankingScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Connect Your Bank" subtitle="Instant identity verification via Open Banking" step={10} total={11} />
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>🏦</div>
        <div style={{ ...s9b, color: '#111', marginBottom: 3 }}>Link an existing HK bank account</div>
        <div style={{ ...s8, color: muted }}>Secure · read-only access · HKMA regulated</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {[
          { name: 'HSBC HK',        icon: '🔴' },
          { name: 'Hang Seng Bank', icon: '🟢' },
          { name: 'Bank of China',  icon: '🔵' },
          { name: 'Standard Chartered', icon: '🟡' },
        ].map(bank => (
          <div key={bank.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', border: `1px solid ${border}`, borderRadius: 6, background: '#fff' }}>
            <span style={{ fontSize: 12 }}>{bank.icon}</span>
            <span style={{ ...s9, color: '#111', flex: 1 }}>{bank.name}</span>
            <span style={{ color: muted, fontSize: 9 }}>›</span>
          </div>
        ))}
      </div>
      <div style={{ ...s8, color: muted, textAlign: 'center', marginBottom: 6 }}>Or skip — manual verification takes 2–3 days</div>
      <PrimaryBtn label="🔗 Connect Securely →" />
    </div>
  );
}

function KYCDeclarationScreen() {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <KYCHeader title="Legal Declarations" subtitle="Read carefully before signing" step={11} total={11} />
      {[
        { id: 'pep',   label: 'PEP Status',    text: 'I am not a Politically Exposed Person or related to one',                     checked: true  },
        { id: 'truth', label: 'Truthfulness',  text: 'All information provided is true, accurate and complete',                     checked: true  },
        { id: 'fatca', label: 'FATCA / CRS',   text: 'I confirm my US person / tax residency status as declared above',             checked: false },
      ].map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 6, padding: '5px 7px', border: `1px solid ${item.checked ? red : border}`, borderRadius: 5, marginBottom: 4, background: item.checked ? 'rgba(219,0,17,0.04)' : '#fff' }}>
          <div style={{ width: 11, height: 11, borderRadius: 3, border: `2px solid ${item.checked ? red : border}`, background: item.checked ? red : '#fff', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.checked && <span style={{ color: '#fff', fontSize: 7, fontWeight: 900 }}>✓</span>}
          </div>
          <div>
            <div style={{ ...s7b, color: '#374151', marginBottom: 1 }}>{item.label}</div>
            <div style={{ fontSize: 7, color: muted, lineHeight: 1.4 }}>{item.text}</div>
          </div>
        </div>
      ))}
      <div style={{ ...s8, color: muted, textAlign: 'center', marginBottom: 7, marginTop: 2 }}>By submitting, you agree to our <span style={{ color: red }}>Terms & Privacy Policy</span></div>
      <PrimaryBtn label="✅ Submit Application" />
    </div>
  );
}

// ─── Web KYC screen designs (compound, wider layout) ─────────────────────────

function WebStepHeader({ step, total, icon, title }: { step: number; total: number; icon: string; title: string }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ padding: '10px 14px 6px', borderBottom: `1px solid ${border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ ...s10b, color: '#111' }}>{title}</span>
        </div>
        <span style={{ ...s8, color: muted }}>Step {step} of {total}</span>
      </div>
      <div style={{ height: 3, background: border, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: red, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function WebSection({ title }: { title: string }) {
  return <div style={{ ...s8, color: red, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>{title}</div>;
}

function WebInputMini({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ fontSize: 7, fontWeight: 600, color: '#374151', marginBottom: 1 }}>{label}</div>
      <div style={{ border: `1px solid ${border}`, borderRadius: 4, padding: '3px 6px', fontSize: 7, color: muted, background: '#fff' }}>{placeholder ?? ''}</div>
    </div>
  );
}

function WebSelectMini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ fontSize: 7, fontWeight: 600, color: '#374151', marginBottom: 1 }}>{label}</div>
      <div style={{ border: `1px solid ${border}`, borderRadius: 4, padding: '3px 6px', fontSize: 7, color: muted, background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
        <span>{value}</span><span>▾</span>
      </div>
    </div>
  );
}

function WebCTA({ label }: { label: string }) {
  return <div style={{ background: red, color: '#fff', borderRadius: 5, padding: '5px 0', textAlign: 'center', ...s8, fontWeight: 700, margin: '4px 10px 8px' }}>{label}</div>;
}

function KYCWebIdentityScreen() {
  return (
    <div>
      <WebStepHeader step={1} total={6} icon="🪪" title="Your Identity" />
      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <div>
          <WebSection title="Personal Info" />
          <WebInputMini label="First Name" placeholder="John" />
          <WebInputMini label="Last Name"  placeholder="Smith" />
          <WebInputMini label="Date of Birth" placeholder="DD / MM / YYYY" />
          <WebSelectMini label="Nationality" value="Select country…" />
        </div>
        <div>
          <WebSection title="Identity Document" />
          <WebSelectMini label="Document Type" value="HKID Card" />
          <WebInputMini label="Document Number" placeholder="A 123456(7)" />
          <WebInputMini label="Expiry Date" placeholder="MM / YYYY" />
        </div>
      </div>
      <WebCTA label="Save & Continue →" />
    </div>
  );
}

function KYCWebUploadContactScreen() {
  return (
    <div>
      <WebStepHeader step={2} total={6} icon="📋" title="Document & Contact" />
      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <div>
          <WebSection title="Upload Document" />
          <div style={{ border: `2px dashed ${border}`, borderRadius: 6, padding: '8px', textAlign: 'center', background: '#F9FAFB', marginBottom: 5 }}>
            <div style={{ fontSize: 12 }}>📄</div>
            <div style={{ fontSize: 7, fontWeight: 600, color: '#374151' }}>Front of document</div>
            <div style={{ fontSize: 6, color: muted }}>Drag & drop or click</div>
          </div>
          <div style={{ border: `2px dashed ${border}`, borderRadius: 6, padding: '8px', textAlign: 'center', background: '#F9FAFB' }}>
            <div style={{ fontSize: 12 }}>🔄</div>
            <div style={{ fontSize: 7, fontWeight: 600, color: '#374151' }}>Back of document</div>
            <div style={{ fontSize: 6, color: muted }}>Drag & drop or click</div>
          </div>
        </div>
        <div>
          <WebSection title="Contact Details" />
          <WebInputMini label="Email" placeholder="john@email.com" />
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 7, fontWeight: 600, color: '#374151', marginBottom: 1 }}>Mobile</div>
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ border: `1px solid ${border}`, borderRadius: 4, padding: '3px 5px', fontSize: 7, background: '#F9FAFB' }}>🇭🇰 ▾</div>
              <div style={{ flex: 1, border: `1px solid ${border}`, borderRadius: 4, padding: '3px 5px', fontSize: 7, color: muted }}>+852 XXXX</div>
            </div>
          </div>
          <div style={{ padding: '4px 6px', background: '#EFF6FF', borderRadius: 4, fontSize: 6, color: '#1E40AF' }}>📱 OTP will be sent to verify</div>
        </div>
      </div>
      <WebCTA label="Save & Continue →" />
    </div>
  );
}

function KYCWebBackgroundScreen() {
  return (
    <div>
      <WebStepHeader step={3} total={6} icon="📝" title="Background" />
      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
        <div>
          <WebSection title="Address" />
          <WebInputMini label="Flat / Floor" placeholder="Flat 12A, 8/F" />
          <WebInputMini label="Building"    placeholder="Pacific Place" />
          <WebSelectMini label="District" value="Select…" />
        </div>
        <div>
          <WebSection title="Employment" />
          <WebSelectMini label="Status" value="Select…" />
          <WebSelectMini label="Annual Income" value="Select…" />
        </div>
        <div>
          <WebSection title="Source of Funds" />
          <WebSelectMini label="Primary Source" value="Select…" />
          <WebSelectMini label="Account Purpose" value="Select…" />
          <div style={{ padding: '4px 5px', background: '#FEF3C7', borderRadius: 4, fontSize: 6, color: '#92400E', marginTop: 3 }}>🔍 HKMA AML requirement</div>
        </div>
      </div>
      <WebCTA label="Save & Continue →" />
    </div>
  );
}

function KYCWebLivenessScreen() {
  return (
    <div>
      <WebStepHeader step={4} total={6} icon="😊" title="Selfie & Liveness Check" />
      <div style={{ padding: '8px 10px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#1A1A1A', borderRadius: 8, padding: '16px 10px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 80, border: '2px solid rgba(219,0,17,0.8)', borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, opacity: 0.4 }}>👤</span>
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)' }}>Position face inside oval</div>
          <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Webcam · Good lighting</div>
        </div>
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ ...s7b, color: '#111', marginBottom: 6 }}>How it works</div>
          {[
            { n: '1', t: 'Allow camera' },
            { n: '2', t: 'Face forward' },
            { n: '3', t: 'Follow prompts' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: red, color: '#fff', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
              <span style={{ fontSize: 7, color: '#374151' }}>{s.t}</span>
            </div>
          ))}
        </div>
      </div>
      <WebCTA label="📸 Start Liveness Check" />
    </div>
  );
}

function KYCWebOpenBankingScreen() {
  return (
    <div>
      <WebStepHeader step={5} total={6} icon="🔗" title="Connect Your Bank" />
      <div style={{ padding: '8px 10px 4px', textAlign: 'center' }}>
        <div style={{ ...s9b, color: '#111', marginBottom: 2 }}>Link an existing HK bank for instant verification</div>
        <div style={{ fontSize: 7, color: muted, marginBottom: 8 }}>Secure · read-only · HKMA regulated</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 6 }}>
          {[
            { a: 'H',  c: '#DB0011', n: 'HSBC HK' },
            { a: 'HS', c: '#00A650', n: 'Hang Seng' },
            { a: 'BC', c: '#1D4ED8', n: 'BOC HK' },
            { a: 'SC', c: '#009B77', n: 'StanChart' },
            { a: 'C',  c: '#0066B3', n: 'Citibank' },
            { a: 'D',  c: '#E31837', n: 'DBS' },
            { a: 'OW', c: '#D8212D', n: 'OCBC' },
            { a: '+',  c: '#6B7280', n: 'Others' },
          ].map(b => (
            <div key={b.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 2px', border: `1px solid ${border}`, borderRadius: 5 }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: b.c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 7, fontWeight: 700 }}>{b.a}</div>
              <span style={{ fontSize: 6, color: '#374151', textAlign: 'center' }}>{b.n}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 7, color: muted }}>Or <span style={{ color: red }}>skip</span> — manual takes 2–3 days</div>
      </div>
      <WebCTA label="🔗 Connect Securely →" />
    </div>
  );
}

function KYCWebDeclarationScreen() {
  return (
    <div>
      <WebStepHeader step={6} total={6} icon="✍️" title="Legal Declarations — Final Step" />
      <div style={{ padding: '8px 10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <div>
          <WebSection title="Please confirm" />
          {[
            { label: 'PEP Status',   text: 'I am not a Politically Exposed Person', checked: true },
            { label: 'Truthfulness', text: 'All information is true and complete',   checked: true },
            { label: 'FATCA / CRS', text: 'I confirm my tax residency status',       checked: false },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 5, padding: '5px 6px', border: `1px solid ${item.checked ? red : border}`, borderRadius: 5, marginBottom: 4, background: item.checked ? 'rgba(219,0,17,0.04)' : '#fff' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, border: `2px solid ${item.checked ? red : '#D1D5DB'}`, background: item.checked ? red : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.checked && <span style={{ color: '#fff', fontSize: 7, fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ ...s7b, color: '#374151' }}>{item.label}</div>
                <div style={{ fontSize: 6, color: muted }}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <WebSection title="Application Summary" />
          <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 8px', border: `1px solid ${border}` }}>
            {[
              ['Name',       'John Smith'],
              ['Nationality','Hong Kong'],
              ['ID',         'HKID Card'],
              ['Email',      'john@email.com'],
              ['District',   'Central & Western'],
              ['Employment', 'Employed'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, padding: '2px 0', borderBottom: `1px solid ${border}` }}>
                <span style={{ color: muted }}>{l}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 6, color: muted, marginTop: 4 }}>By submitting you agree to our <span style={{ color: red }}>Terms & Privacy Policy</span></div>
        </div>
      </div>
      <WebCTA label="✅ Submit Application" />
    </div>
  );
}

const KYC_SCREENS: Record<string, () => React.ReactElement> = {
  KYC_NAME_DOB:         KYCNameDobScreen,
  KYC_SINGLE_SELECT:    KYCNationalityScreen,
  KYC_ID_CAPTURE:       KYCIDCaptureScreen,
  KYC_DOC_UPLOAD:       KYCDocUploadScreen,
  KYC_CONTACT:          KYCContactScreen,
  KYC_ADDRESS:          KYCAddressScreen,
  KYC_EMPLOYMENT:       KYCEmploymentScreen,
  KYC_SOURCE_OF_FUNDS:  KYCSourceOfFundsScreen,
  KYC_LIVENESS:         KYCLivenessScreen,
  KYC_OPEN_BANKING:     KYCOpenBankingScreen,
  KYC_DECLARATION:      KYCDeclarationScreen,
  // Web compound steps
  KYC_WEB_IDENTITY:        KYCWebIdentityScreen,
  KYC_WEB_UPLOAD_CONTACT:  KYCWebUploadContactScreen,
  KYC_WEB_BACKGROUND:      KYCWebBackgroundScreen,
  KYC_WEB_LIVENESS:        KYCWebLivenessScreen,
  KYC_WEB_OPEN_BANKING:    KYCWebOpenBankingScreen,
  KYC_WEB_DECLARATION:     KYCWebDeclarationScreen,
};

// ─── QR scan icon — matches the classic 3-corner-finder QR pattern ────────────
function QRScanIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="3" y="3" width="3" height="3" rx="0.4" fill={color}/>
      <rect x="12" y="1" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="14" y="3" width="3" height="3" rx="0.4" fill={color}/>
      <rect x="1" y="12" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="3" y="14" width="3" height="3" rx="0.4" fill={color}/>
      <rect x="12" y="12" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="15" y="12" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="18" y="12" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="12" y="15" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="18" y="15" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="15" y="18" width="2" height="2" rx="0.3" fill={color}/>
      <rect x="18" y="18" width="2" height="2" rx="0.3" fill={color}/>
    </svg>
  );
}

// ─── Slice content renderer ────────────────────────────────────────────────────

function SliceRow({ type, props }: { type: string; props?: Record<string, unknown> }) {
  const KYCScreen = KYC_SCREENS[type];
  if (KYCScreen) {
    return (
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <KYCScreen />
      </div>
    );
  }

  const p = props ?? {};

  if (type === 'AI_SEARCH_BAR') {
    return (
      <div style={{ background: '#DB0011', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {p.enableQRScan && (
          <QRScanIcon color="rgba(255,255,255,0.9)" size={14} />
        )}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9 }}>{String(p.placeholder ?? '搜尋功能、產品')}</span>
        </div>
        {p.enableChatbot && (
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>🤖</span>
        )}
        {p.enableMessageInbox && (
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✉️</span>
        )}
      </div>
    );
  }

  if (type === 'HEADER_NAV') {
    return (
      <div style={{ background: '#DB0011', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>HSBC</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', flex: 1, fontSize: 11 }}>{String(p.title ?? 'Header')}</span>
        {p.showNotificationBell && <span style={{ color: '#fff' }}>🔔</span>}
        {p.showQRScanner && <QRScanIcon color="#fff" size={14} />}
      </div>
    );
  }

  if (type === 'PROMO_BANNER') {
    return (
      <div style={{ background: String(p.backgroundColor ?? '#E8F4FD'), flexShrink: 0, padding: p.imageUrl && !p.title ? 0 : '12px 14px' }}>
        {p.imageUrl && (
          <img src={String(p.imageUrl)} alt={String(p.altText ?? '')}
            style={{ width: '100%', display: 'block', objectFit: 'cover', height: p.title ? 60 : 72 }} />
        )}
        {p.title && (
          <div style={{ padding: p.imageUrl ? '8px 14px 12px' : undefined }}>
            {p.badgeText && <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, background: '#DB0011', color: '#fff', borderRadius: 3, padding: '1px 6px', marginBottom: 4 }}>{String(p.badgeText)}</div>}
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{String(p.title)}</div>
            {p.subtitle && <div style={{ fontSize: 10, marginBottom: 6, color: '#555' }}>{String(p.subtitle)}</div>}
            {p.ctaLabel && <div style={{ display: 'inline-block', padding: '3px 10px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{String(p.ctaLabel)}</div>}
          </div>
        )}
      </div>
    );
  }

  if (type === 'QUICK_ACCESS') {
    return (
      <div style={{ padding: '8px 12px', display: 'flex', gap: 12, justifyContent: 'center', background: '#fff', flexShrink: 0 }}>
        {['朝朝寶', '借錢', '轉帳', '帳戶'].map(label => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⭐</div>
            <span style={{ fontSize: 9, color: '#374151' }}>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'FUNCTION_GRID') {
    return (
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, background: '#fff', flexShrink: 0 }}>
        {['💳', '↔️', '🏦', '📊', '🔐', '💵', '📞', '⚙️'].map((ic, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{ic}</div>
            <span style={{ fontSize: 8, color: '#6B7280' }}>Func</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'AI_ASSISTANT') {
    return (
      <div style={{ padding: '8px 14px', background: 'linear-gradient(90deg,#0F3057,#1A6B8A)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <span style={{ color: '#fff', fontSize: 11 }}>{String(p.greeting ?? 'Hi, how can I help?')}</span>
      </div>
    );
  }

  if (type === 'FLASH_LOAN') {
    return (
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>⚡💳</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{String(p.productName ?? 'Flash Loan')}</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>Up to {String(p.currency ?? 'HKD')} {String(p.maxAmount ?? '500,000')}</div>
        </div>
        <div style={{ padding: '4px 10px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{String(p.ctaLabel ?? 'Apply')}</div>
      </div>
    );
  }

  if (type === 'WEALTH_SELECTION') {
    return (
      <div style={{ padding: '10px 14px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{String(p.sectionTitle ?? 'Wealth Selection')}</div>
        {[{ name: '7-Day Wealth', yield: '3.85%', risk: 'Low' }, { name: 'Growth Fund', yield: '12.4%', risk: 'Med' }].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F3F4F6', fontSize: 10 }}>
            <span>{item.name}</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>{item.yield}</span>
            <span style={{ color: '#6B7280' }}>{item.risk}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'FEATURED_RANKINGS') {
    return (
      <div style={{ padding: '10px 14px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🏆 {String(p.sectionTitle ?? 'Rankings')}</div>
        {['#1 Tech Growth ETF +18.2%', '#2 HK Blue Chip +7.4%', '#3 Bond Fund +4.1%'].map((item, i) => (
          <div key={i} style={{ fontSize: 10, padding: '3px 0', color: '#374151' }}>{item}</div>
        ))}
      </div>
    );
  }

  if (type === 'LIFE_DEALS') {
    return (
      <div style={{ padding: '10px 14px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🛍️ {String(p.sectionTitle ?? 'Life Deals')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['KFC', 'Luckin', 'DQ'].map(brand => (
            <div key={brand} style={{ width: 48, height: 40, background: '#F3F4F6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{brand}</div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'AD_BANNER') {
    return (
      <div style={{ padding: '8px 14px', background: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>📢</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{String(p.title ?? 'Ad Banner')}</div>
          <div style={{ fontSize: 9, color: '#6B7280' }}>{String(p.subtitle ?? '')}</div>
        </div>
        {p.dismissible && <span style={{ color: '#9CA3AF', fontSize: 14 }}>×</span>}
      </div>
    );
  }

  if (type === 'MARKET_BRIEFING_TEXT') {
    return (
      <div style={{ padding: '10px 12px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 8 }}>{String(p.sectionTitle ?? 'Key takeaways')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(Array.isArray(p.bulletPoints) ? (p.bulletPoints as unknown[]).slice(0, 3) : ['Market briefing text from UCP content']).map((pt: unknown, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color: '#DB0011', fontWeight: 700, fontSize: 10, flexShrink: 0, marginTop: 1 }}>•</span>
              <span style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{String(pt)}</span>
            </div>
          ))}
          {Array.isArray(p.bulletPoints) && (p.bulletPoints as unknown[]).length > 3 && (
            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>+{(p.bulletPoints as unknown[]).length - 3} more…</div>
          )}
        </div>
        {p.disclaimer && (
          <div style={{ marginTop: 8, padding: '6px 8px', background: '#F9FAFB', borderRadius: 4, fontSize: 8, color: '#9CA3AF', lineHeight: 1.4, borderLeft: '2px solid #E5E7EB' }}>
            {String(p.disclaimer).substring(0, 80)}…
          </div>
        )}
      </div>
    );
  }

  if (type === 'VIDEO_PLAYER') {
    return (
      <div style={{ background: '#0A1628', flexShrink: 0, overflow: 'hidden' }}>
        {/* 16:9 thumbnail area */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0F2040' }}>
          {p.thumbnailUrl
            ? <img src={String(p.thumbnailUrl)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            : null}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(219,0,17,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <span style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</span>
            </div>
            {!p.thumbnailUrl && <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)' }}>🎬 Tap to play</span>}
          </div>
        </div>
        {/* Caption bar */}
        <div style={{ padding: '6px 10px 8px' }}>
          {p.title && (
            <div style={{ fontWeight: 700, fontSize: 9, color: '#fff', marginBottom: 2, lineHeight: 1.3 }}>
              {String(p.title)}
            </div>
          )}
          {p.presenterName && (
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>
              {String(p.presenterName)}{p.presenterTitle ? ` · ${String(p.presenterTitle)}` : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'CONTACT_RM_CTA') {
    return (
      <div style={{ padding: '12px 16px', background: String(p.backgroundColor ?? '#DB0011'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: String(p.textColor ?? '#FFFFFF') }}>{String(p.label ?? 'Contact Your RM')}</div>
        {p.subLabel && <div style={{ fontSize: 9, color: `${String(p.textColor ?? '#FFFFFF')}CC`, textAlign: 'center' }}>{String(p.subLabel)}</div>}
        {p.sticky && <div style={{ marginTop: 4, fontSize: 8, padding: '1px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontWeight: 600 }}>STICKY</div>}
      </div>
    );
  }

  if (type === 'SPACER') {
    return (
      <div style={{ height: Math.max(16, Number(p.height ?? 24)), background: 'repeating-linear-gradient(45deg,#F9FAFB,#F9FAFB 5px,#F3F4F6 5px,#F3F4F6 10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: '#9CA3AF' }}>Spacer {p.height ? `${p.height}px` : ''}</span>
      </div>
    );
  }

  if (type === 'DEPOSIT_RATE_TABLE') {
    const rates = Array.isArray(p.rates) ? p.rates as { term: string; rate: string }[] : [];
    return (
      <div style={{ padding: '10px 12px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 4 }}>{String(p.sectionTitle ?? 'Time Deposit Rate:')}</div>
        {p.asAtDate && <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 6 }}>As at {String(p.asAtDate)}</div>}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F9FAFB', padding: '4px 8px', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280' }}>Term</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280', textAlign: 'right' }}>Interest Rate (% p.a.)</span>
          </div>
          {rates.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '3px 8px', borderBottom: i < rates.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
              <span style={{ fontSize: 8, color: '#374151' }}>{r.term}</span>
              <span style={{ fontSize: 8, color: '#374151', textAlign: 'right', fontWeight: 600 }}>{r.rate}%</span>
            </div>
          ))}
        </div>
        {p.footnote && <div style={{ fontSize: 8, color: '#6B7280' }}>{String(p.footnote)}</div>}
      </div>
    );
  }

  if (type === 'DEPOSIT_OPEN_CTA') {
    return (
      <div style={{ padding: '12px 16px', background: String(p.backgroundColor ?? '#C41E3A'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: String(p.textColor ?? '#FFFFFF') }}>{String(p.label ?? 'Open a Deposit')}</div>
      </div>
    );
  }

  if (type === 'DEPOSIT_FAQ') {
    const faqs = Array.isArray(p.items) ? p.items as { id: string; question: string; answer: string }[] : [];
    return (
      <div style={{ padding: '10px 12px', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 8 }}>{String(p.sectionTitle ?? 'Frequently Asked Questions')}</div>
        {faqs.map((faq, i) => (
          <div key={faq.id ?? i} style={{ marginBottom: 5, border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '5px 8px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{faq.question}</span>
              <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>›</span>
            </div>
            <div style={{ padding: '4px 8px', background: '#fff', fontSize: 8, color: '#6B7280', lineHeight: 1.4 }}>
              {faq.answer.length > 80 ? faq.answer.substring(0, 80) + '…' : faq.answer}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: '#F3F4F6', height: 36, display: 'flex', alignItems: 'center', paddingLeft: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{type}</span>
    </div>
  );
}

// ─── Notch ────────────────────────────────────────────────────────────────────

function Notch({ style, statusColor }: { style: DeviceSpec['notchStyle']; statusColor: string }) {
  if (style === 'none') return null;
  if (style === 'island') {
    return (
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 22, background: '#000', borderRadius: 14, zIndex: 10 }} />
    );
  }
  if (style === 'pill') {
    return (
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 56, height: 14, background: '#000', borderRadius: 8, zIndex: 10 }} />
    );
  }
  // punch-hole
  return (
    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: '#000', borderRadius: '50%', zIndex: 10 }} />
  );
}

// ─── Phone frame ─────────────────────────────────────────────────────────────

function PhoneFrame({ device, slices }: { device: DeviceSpec; slices: CanvasSlice[] }) {
  const visibleSlices = slices.filter(s => s.visible);
  return (
    <div style={{
      width: device.width + 16,
      height: device.height + 20,
      background: device.frameColor,
      borderRadius: device.radius + 8,
      padding: '8px 8px 12px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Screen */}
      <div style={{
        width: device.width,
        height: device.height,
        background: '#fff',
        borderRadius: device.radius - 4,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{ background: device.statusBar, height: 28, display: 'flex', alignItems: 'flex-end', paddingBottom: 4, paddingLeft: 10, paddingRight: 10, flexShrink: 0, position: 'relative' }}>
          <Notch style={device.notchStyle} statusColor={device.statusBar} />
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>9:41</span>
          <span style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>●●● 5G</span>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleSlices.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#9CA3AF', fontSize: 9 }}>No components added</div>
          ) : (
            visibleSlices.map(s => <SliceRow key={s.instanceId} type={s.type} props={s.props as Record<string, unknown>} />)
          )}
        </div>

        {/* Bottom home indicator */}
        <div style={{ background: device.statusBar === '#000' ? '#000' : '#fff', height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 3, background: device.statusBar === '#000' ? '#555' : '#D1D5DB', borderRadius: 2 }} />
        </div>
      </div>

      {/* Camera bump */}
      <div style={{ position: 'absolute', top: 14, right: -6, width: 8, height: 40, background: device.frameColor, borderRadius: '0 4px 4px 0', boxShadow: '2px 0 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ─── Web browser frame ────────────────────────────────────────────────────────

function WebBrowserFrame({ slices, webSlug }: { slices: CanvasSlice[]; webSlug?: string }) {
  const visibleSlices = slices.filter(s => s.visible);
  return (
    <div style={{
      width: 580,
      background: '#fff',
      borderRadius: 10,
      border: '1px solid #D1D5DB',
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      overflow: 'hidden',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#F3F4F6', padding: '8px 12px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FC615D' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FDBC40' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C749' }} />
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#6B7280', border: '1px solid #E5E7EB', fontFamily: 'monospace' }}>
            🔒 www.hsbc.com.hk{webSlug ?? '/wealth-hub'}
          </div>
          <span style={{ fontSize: 12 }}>⟳</span>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 6 }}>
          {['Home', 'Accounts', 'Wealth', 'Cards', 'More'].map(tab => (
            <div key={tab} style={{ padding: '4px 12px', fontSize: 10, color: tab === 'Wealth' ? '#DB0011' : '#6B7280', fontWeight: tab === 'Wealth' ? 700 : 400, borderBottom: tab === 'Wealth' ? '2px solid #DB0011' : '2px solid transparent', cursor: 'pointer' }}>{tab}</div>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ background: '#fff', height: 280, overflowY: 'auto' }}>
        {/* HSBC web header */}
        <div style={{ background: '#DB0011', height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>HSBC</span>
          {['Accounts', 'Wealth', 'Cards', 'Borrowing', 'Insurance'].map(item => (
            <span key={item} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, cursor: 'pointer' }}>{item}</span>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>🔔</span>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '2px 8px', fontSize: 10, color: '#fff' }}>Premier</div>
          </div>
        </div>

        {/* Page slices rendered as wider blocks */}
        <div style={{ padding: '12px 16px' }}>
          {visibleSlices.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#9CA3AF', fontSize: 12 }}>No components — add slices in the page editor</div>
          ) : (
            visibleSlices.map(s => (
              <div key={s.instanceId} style={{ marginBottom: 8 }}>
                <SliceRow type={s.type} props={s.props as Record<string, unknown>} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browser status bar */}
      <div style={{ background: '#F9FAFB', padding: '3px 12px', borderTop: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 9, color: '#9CA3AF' }}>✓ Secure connection · HSBC Holdings plc</span>
      </div>
    </div>
  );
}

// ─── WeChat in-app browser ────────────────────────────────────────────────────

function WeChatBrowserFrame({ slices, pageName }: { slices: CanvasSlice[]; pageName: string }) {
  const visibleSlices = slices.filter(s => s.visible);
  return (
    <div style={{ width: 220, height: 420, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', border: '1px solid #E5E7EB' }}>
      {/* WeChat top bar */}
      <div style={{ background: '#EDEDED', height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#333' }}>‹</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pageName}</span>
        <span style={{ fontSize: 12, color: '#333' }}>···</span>
      </div>

      {/* Address bar */}
      <div style={{ background: '#F7F7F7', padding: '4px 10px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ background: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#07C160', fontSize: 9 }}>🔒</span>
          www.hsbc.com.hk
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', height: 320 }}>
        {/* HSBC header - mobile web */}
        <div style={{ background: '#DB0011', height: 36, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>HSBC</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: 8 }}>≡</span>
        </div>

        {visibleSlices.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: '#9CA3AF', fontSize: 9 }}>No slices configured</div>
        ) : (
          visibleSlices.map(s => <SliceRow key={s.instanceId} type={s.type} props={s.props as Record<string, unknown>} />)
        )}
      </div>

      {/* WeChat bottom bar */}
      <div style={{ background: '#EDEDED', height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 16px' }}>
        <span style={{ fontSize: 14, color: '#333' }}>‹</span>
        <span style={{ fontSize: 14, color: '#333' }}>›</span>
        <span style={{ fontSize: 10, color: '#07C160', fontWeight: 700 }}>分享</span>
        <span style={{ fontSize: 12, color: '#333' }}>···</span>
      </div>
    </div>
  );
}

// ─── WeChat service account message card ─────────────────────────────────────

function WeChatServiceAccountCard({ pageName, description }: { pageName: string; description?: string }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ width: 300, fontFamily: '-apple-system, "PingFang SC", sans-serif' }}>
      {/* Service account header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 6, background: '#DB0011', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>H</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>HSBC HK</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Service Account · {timeStr}</div>
        </div>
      </div>

      {/* Message card */}
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB' }}>
        {/* Card image/hero area */}
        <div style={{ background: 'linear-gradient(135deg, #DB0011 0%, #8B0009 100%)', height: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>HSBC Premier</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{pageName}</span>
        </div>

        {/* Card body */}
        <div style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 10px', lineHeight: 1.5 }}>
            {description ?? 'Explore our exclusive wealth management services tailored for your financial goals.'}
          </p>
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>hsbc.com.hk</span>
            <span style={{ fontSize: 11, color: '#07C160', fontWeight: 600 }}>查看详情 ›</span>
          </div>
        </div>
      </div>

      {/* Notification preview */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: '#F7F7F7', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Push Notification Preview</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#DB0011', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>H</span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>HSBC HK</div>
            <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{pageName} — {description?.substring(0, 40) ?? 'Tap to view your personalised wealth content'}{description && description.length > 40 ? '…' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface DevicePreviewProps {
  channel: Channel;
  slices: CanvasSlice[];
  pageName: string;
  description?: string;
  webSlug?: string;
}

export function DevicePreview({ channel, slices, pageName, description, webSlug }: DevicePreviewProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    if (channel === 'SDUI') return SDUI_DEVICES[0].id;
    if (channel === 'WEB_STANDARD') return 'web';
    return 'wechat_browser';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Device picker */}
      {channel === 'SDUI' && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Device</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SDUI_DEVICES.map(d => (
              <button key={d.id} onClick={() => setSelectedDeviceId(d.id)} style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: selectedDeviceId === d.id ? '#1A1A1A' : '#F3F4F6',
                color: selectedDeviceId === d.id ? '#fff' : '#374151',
                border: selectedDeviceId === d.id ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                transition: 'all 0.12s',
              }}>
                {d.label}
              </button>
            ))}
          </div>
          {(() => {
            const dev = SDUI_DEVICES.find(d => d.id === selectedDeviceId)!;
            return (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${OS_COLOR[dev.os]}18`, color: OS_COLOR[dev.os], fontWeight: 700 }}>{dev.os}</span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{dev.brand}</span>
              </div>
            );
          })()}
        </div>
      )}

      {channel === 'WEB_WECHAT' && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>View</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {WECHAT_DEVICES.map(d => (
              <button key={d.id} onClick={() => setSelectedDeviceId(d.id)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: selectedDeviceId === d.id ? '#07C160' : '#F3F4F6',
                color: selectedDeviceId === d.id ? '#fff' : '#374151',
                border: selectedDeviceId === d.id ? '1px solid #07C160' : '1px solid #E5E7EB',
              }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
        {channel === 'SDUI' && (() => {
          const dev = SDUI_DEVICES.find(d => d.id === selectedDeviceId) ?? SDUI_DEVICES[0];
          return <PhoneFrame device={dev} slices={slices} />;
        })()}

        {channel === 'WEB_STANDARD' && (
          <WebBrowserFrame slices={slices} webSlug={webSlug} />
        )}

        {channel === 'WEB_WECHAT' && selectedDeviceId === 'wechat_browser' && (
          <WeChatBrowserFrame slices={slices} pageName={pageName} />
        )}

        {channel === 'WEB_WECHAT' && selectedDeviceId === 'wechat_card' && (
          <WeChatServiceAccountCard pageName={pageName} description={description} />
        )}
      </div>
    </div>
  );
}
