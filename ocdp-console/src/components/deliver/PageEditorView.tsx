import { useState, useRef, useEffect, useCallback } from 'react';
import { useOCDP } from '../../store/OCDPStore';
import type { CanvasSlice, PageLayout, CampaignSchedule, UCPContentAsset, CustomerSegment, VisibilityRule, RuleCondition, RuleOperator, AccountType, CustomerLocation, PreviewContext } from '../../types/ocdp';
import { PALETTE_COMPONENTS, PALETTE_CATEGORIES, type PaletteComponent } from '../../store/ucpComponents';
import { FALLBACK_CONTENT_ASSETS } from '../../store/ucpAssets';

// ─── Slice renderer (preview in canvas) ──────────────────────────────────────

// Shared KYC canvas style helpers
const kycWrap = (style: React.CSSProperties): React.CSSProperties => ({ width: '100%', background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #E5E7EB', fontSize: 11, color: '#374151', ...style });

function KYCProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ padding: '8px 14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step {step} of {total}</span>
        <span style={{ fontSize: 10, color: '#DB0011', fontWeight: 700 }}>{Math.round((step / total) * 100)}%</span>
      </div>
      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginBottom: 10 }}>
        <div style={{ width: `${(step / total) * 100}%`, height: '100%', background: '#DB0011', borderRadius: 2 }} />
      </div>
    </div>
  );
}

function KYCSectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ padding: '0 14px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{title}</span>
      </div>
      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{subtitle}</div>
    </div>
  );
}

function KYCInputRow({ label, placeholder, filled }: { label: string; placeholder: string; filled?: boolean }) {
  return (
    <div style={{ padding: '0 14px 8px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{label}</div>
      <div style={{ border: `1px solid ${filled ? '#6B7280' : '#E5E7EB'}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, color: filled ? '#111' : '#9CA3AF', background: filled ? '#F9FAFB' : '#fff' }}>
        {placeholder}
      </div>
    </div>
  );
}

function KYCSelectRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '0 14px 8px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{label}</div>
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#9CA3AF', background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
        <span>{value}</span><span>▾</span>
      </div>
    </div>
  );
}

function KYCRadioRow({ options, selected }: { options: string[]; selected: string }) {
  return (
    <div style={{ padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {options.map(opt => (
        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', border: `1px solid ${opt === selected ? '#DB0011' : '#E5E7EB'}`, borderRadius: 6, background: opt === selected ? 'rgba(219,0,17,0.04)' : '#fff' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${opt === selected ? '#DB0011' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {opt === selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DB0011' }} />}
          </div>
          <span style={{ fontSize: 11, color: '#374151' }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

function KYCCTAButton({ label }: { label: string }) {
  return (
    <div style={{ padding: '4px 14px 14px' }}>
      <div style={{ background: '#DB0011', color: '#fff', borderRadius: 8, padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

// ─── QR scan icon — matches the classic 3-corner-finder QR pattern ────────────
function QRScanIcon({ color, size }: { color: string; size: number }) {
  // Each finder: outer border rect + inner filled square. Data area: 4×4 dot grid.
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg">
      {/* Top-left finder */}
      <rect x="1" y="1" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="3" y="3" width="3" height="3" rx="0.4" fill={color}/>
      {/* Top-right finder */}
      <rect x="12" y="1" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="14" y="3" width="3" height="3" rx="0.4" fill={color}/>
      {/* Bottom-left finder */}
      <rect x="1" y="12" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="3" y="14" width="3" height="3" rx="0.4" fill={color}/>
      {/* Data dots (bottom-right area) */}
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

function SlicePreview({ slice }: { slice: CanvasSlice }) {
  const p = slice.props as Record<string, unknown>;
  const base: React.CSSProperties = {
    width: '100%',
    background: slice.visible ? '#fff' : '#F9FAFB',
    opacity: slice.visible ? 1 : 0.5,
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
    fontSize: 11,
    color: '#374151',
  };

  switch (slice.type) {

    // ── KYC screens ──────────────────────────────────────────────────────────

    case 'KYC_NAME_DOB':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={1} total={11} />
          <KYCSectionTitle icon="👤" title="Personal Information" subtitle="Enter your full legal name as it appears on your ID" />
          <KYCInputRow label="First Name" placeholder="e.g. John" />
          <KYCInputRow label="Last Name"  placeholder="e.g. Smith" />
          <KYCInputRow label="Date of Birth" placeholder="DD / MM / YYYY" />
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_SINGLE_SELECT':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={2} total={11} />
          <KYCSectionTitle icon="🌍" title="Nationality" subtitle="Select your country of nationality" />
          <div style={{ padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { flag: '🇭🇰', label: 'Hong Kong (SAR)', hint: '→ HKID required' },
              { flag: '🇨🇳', label: 'Mainland China',  hint: '→ Mainland China ID' },
              { flag: '🌍', label: 'Other countries',  hint: '→ Passport' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                <span style={{ fontSize: 14 }}>{item.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#111', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>{item.hint}</div>
                </div>
                <span style={{ color: '#9CA3AF' }}>›</span>
              </div>
            ))}
          </div>
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_ID_CAPTURE':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={3} total={11} />
          <KYCSectionTitle icon="🪪" title="Identity Document" subtitle="HKID / Mainland ID / Passport (based on nationality)" />
          <div style={{ padding: '0 14px 8px', fontSize: 10, fontWeight: 600, color: '#374151' }}>Document Type</div>
          <KYCRadioRow options={['HKID Card', 'Mainland China ID', 'Passport']} selected="HKID Card" />
          <KYCInputRow label="HKID Number" placeholder="A 123456(7)" />
          <KYCInputRow label="Expiry Date"  placeholder="MM / YYYY" />
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_DOC_UPLOAD':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={4} total={11} />
          <KYCSectionTitle icon="📷" title="Upload Identity Document" subtitle="Take a clear photo of all 4 corners — no glare" />
          <div style={{ padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: 8, padding: 16, textAlign: 'center', background: '#F9FAFB' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📄</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Front of HKID</div>
              <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Tap to take photo or upload file</div>
            </div>
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: 8, padding: 16, textAlign: 'center', background: '#F9FAFB' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🔄</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Back of HKID</div>
              <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Tap to take photo or upload file</div>
            </div>
          </div>
          <KYCCTAButton label="Upload & Continue →" />
        </div>
      );

    case 'KYC_CONTACT':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={5} total={11} />
          <KYCSectionTitle icon="📞" title="Contact Details" subtitle="We'll use these to verify and contact you" />
          <KYCInputRow label="Email Address" placeholder="john.smith@email.com" />
          <div style={{ padding: '0 14px 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Mobile Number</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 56, border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 8px', fontSize: 11, background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 4, color: '#374151', flexShrink: 0 }}>
                🇭🇰 <span style={{ color: '#9CA3AF' }}>▾</span>
              </div>
              <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#9CA3AF', background: '#fff' }}>
                +852 XXXX XXXX
              </div>
            </div>
          </div>
          <div style={{ margin: '0 14px 10px', padding: '7px 10px', background: '#EFF6FF', borderRadius: 6, fontSize: 10, color: '#1E40AF' }}>
            📱 An OTP will be sent to verify your mobile number
          </div>
          <KYCCTAButton label="Send OTP →" />
        </div>
      );

    case 'KYC_ADDRESS':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={6} total={11} />
          <KYCSectionTitle icon="🏠" title="Residential Address" subtitle="Must be your current Hong Kong address" />
          <KYCInputRow label="Flat / Floor / Block" placeholder="e.g. Flat 12A, 8/F, Block 3" />
          <KYCInputRow label="Building / Estate Name" placeholder="e.g. Pacific Place" />
          <KYCSelectRow label="District" value="Select district…" />
          <div style={{ margin: '0 14px 10px', padding: '7px 10px', background: '#FEF3C7', borderRadius: 6, fontSize: 10, color: '#92400E' }}>
            🔍 Address must match your identity document
          </div>
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_EMPLOYMENT':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={7} total={11} />
          <KYCSectionTitle icon="💼" title="Employment & Income" subtitle="Required for account suitability assessment" />
          <div style={{ padding: '0 14px 4px', fontSize: 10, fontWeight: 600, color: '#374151' }}>Employment Status</div>
          <KYCRadioRow
            options={['Employed (full-time)', 'Self-employed', 'Student', 'Retired', 'Unemployed']}
            selected="Employed (full-time)"
          />
          <KYCSelectRow label="Annual Income (HKD)" value="HKD 500,001 – 1,000,000" />
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_SOURCE_OF_FUNDS':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={8} total={11} />
          <KYCSectionTitle icon="🏦" title="Source of Funds" subtitle="Regulatory requirement under HKMA guidelines" />
          <div style={{ padding: '0 14px 4px', fontSize: 10, fontWeight: 600, color: '#374151' }}>Primary Source of Funds</div>
          <KYCRadioRow
            options={['Salary / Employment income', 'Business income', 'Investment returns', 'Savings / Family support']}
            selected="Salary / Employment income"
          />
          <div style={{ padding: '0 14px 4px', fontSize: 10, fontWeight: 600, color: '#374151' }}>Purpose of Account</div>
          <KYCRadioRow
            options={['Daily banking', 'Savings & investments', 'Business transactions']}
            selected="Daily banking"
          />
          <KYCCTAButton label="Continue →" />
        </div>
      );

    case 'KYC_LIVENESS':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={9} total={11} />
          <KYCSectionTitle icon="😊" title="Selfie & Liveness Check" subtitle="Verify your identity in real-time" />
          <div style={{ padding: '0 14px 10px' }}>
            <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Face oval */}
              <div style={{ width: 100, height: 130, border: '3px solid rgba(219,0,17,0.8)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 40, opacity: 0.5 }}>👤</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Position your face inside the oval</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 4 }}>Keep still · Good lighting · No glasses</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: i===0?16:6, height: 6, borderRadius: 3, background: i===0?'#DB0011':'#E5E7EB' }} />)}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>Step 1 of 3</div>
          </div>
          <KYCCTAButton label="📸 Start Liveness Check" />
        </div>
      );

    case 'KYC_OPEN_BANKING':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={10} total={11} />
          <KYCSectionTitle icon="🔗" title="Connect Your Bank" subtitle="Instant identity verification via Open Banking" />
          <div style={{ padding: '0 14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏦</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 2 }}>Link an existing HK bank account</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 12 }}>Secure · read-only · HKMA regulated</div>
          </div>
          <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { name: 'HSBC Hong Kong',       color: '#DB0011' },
              { name: 'Hang Seng Bank',       color: '#00A650' },
              { name: 'Bank of China (HK)',   color: '#1D4ED8' },
              { name: 'Standard Chartered',   color: '#009B77' },
            ].map(bank => (
              <div key={bank.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: bank.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#374151', fontWeight: 500, flex: 1 }}>{bank.name}</span>
                <span style={{ color: '#9CA3AF' }}>›</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', padding: '0 14px 10px' }}>
            Or skip — manual verification takes 2–3 business days
          </div>
          <KYCCTAButton label="🔗 Connect Securely →" />
        </div>
      );

    case 'KYC_DECLARATION':
      return (
        <div style={kycWrap(base)}>
          <KYCProgressBar step={11} total={11} />
          <KYCSectionTitle icon="✍️" title="Legal Declarations" subtitle="Read carefully before signing" />
          <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'pep',   label: 'PEP Status',    text: 'I am not a Politically Exposed Person or related to one',                   checked: true  },
              { id: 'truth', label: 'Truthfulness',  text: 'All information provided is true, accurate and complete to the best of my knowledge', checked: true  },
              { id: 'fatca', label: 'FATCA / CRS',   text: 'I confirm my US person / tax residency status as declared',                 checked: false },
            ].map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', border: `1px solid ${item.checked ? '#DB0011' : '#E5E7EB'}`, borderRadius: 8, background: item.checked ? 'rgba(219,0,17,0.04)' : '#fff' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${item.checked ? '#DB0011' : '#D1D5DB'}`, background: item.checked ? '#DB0011' : '#fff', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', padding: '0 14px 10px' }}>
            By submitting you agree to our <span style={{ color: '#DB0011' }}>Terms & Privacy Policy</span>
          </div>
          <KYCCTAButton label="✅ Submit Application" />
        </div>
      );

    // ── Web KYC — compound steps (wider layout, multiple sections per page) ──

    case 'KYC_WEB_IDENTITY':
      return (
        <div style={kycWrap(base)}>
          {/* Step header */}
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🪪</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Your Identity</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 1 of 6</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '17%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          {/* Two-column layout */}
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {/* Left column: Personal info */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Personal Information</div>
              <KYCInputRow label="First Name"    placeholder="e.g. John" />
              <KYCInputRow label="Last Name"     placeholder="e.g. Smith" />
              <KYCInputRow label="Date of Birth" placeholder="DD / MM / YYYY" />
              <KYCSelectRow label="Nationality" value="Select country…" />
            </div>
            {/* Right column: ID document */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Identity Document</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Document Type</div>
              <KYCRadioRow options={['HKID Card', 'Mainland China ID', 'Passport']} selected="HKID Card" />
              <KYCInputRow label="Document Number" placeholder="A 123456(7)" />
              <KYCInputRow label="Expiry Date"     placeholder="MM / YYYY" />
            </div>
          </div>
          <KYCCTAButton label="Save & Continue →" />
        </div>
      );

    case 'KYC_WEB_UPLOAD_CONTACT':
      return (
        <div style={kycWrap(base)}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Document & Contact</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 2 of 6</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '33%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {/* Left: Upload zones */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Identity Document Upload</div>
              <div style={{ border: '2px dashed #E5E7EB', borderRadius: 8, padding: '14px 10px', textAlign: 'center', background: '#F9FAFB', marginBottom: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>📄</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Front of document</div>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Drag & drop or click to upload · JPG, PNG, PDF</div>
              </div>
              <div style={{ border: '2px dashed #E5E7EB', borderRadius: 8, padding: '14px 10px', textAlign: 'center', background: '#F9FAFB' }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>🔄</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Back of document</div>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Drag & drop or click to upload · JPG, PNG, PDF</div>
              </div>
            </div>
            {/* Right: Contact */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Contact Details</div>
              <KYCInputRow label="Email Address" placeholder="john.smith@email.com" />
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Mobile Number</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 60, border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 8px', fontSize: 11, background: '#F9FAFB', display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>🇭🇰 <span style={{ color: '#9CA3AF' }}>▾</span></div>
                  <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#9CA3AF' }}>+852 XXXX XXXX</div>
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: '#EFF6FF', borderRadius: 6, fontSize: 10, color: '#1E40AF' }}>
                📱 An OTP will be sent to verify your number
              </div>
            </div>
          </div>
          <KYCCTAButton label="Save & Continue →" />
        </div>
      );

    case 'KYC_WEB_BACKGROUND':
      return (
        <div style={kycWrap(base)}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>📝</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Background</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 3 of 6</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '50%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
            {/* Address */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Residential Address</div>
              <KYCInputRow label="Flat / Floor / Block" placeholder="e.g. Flat 12A, 8/F" />
              <KYCInputRow label="Building / Estate"    placeholder="e.g. Pacific Place" />
              <KYCSelectRow label="District" value="Select district…" />
            </div>
            {/* Employment */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Employment & Income</div>
              <KYCSelectRow label="Employment Status" value="Select status…" />
              <KYCSelectRow label="Annual Income (HKD)" value="Select band…" />
            </div>
            {/* Source of Funds */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Source of Funds</div>
              <KYCSelectRow label="Primary Source" value="Select source…" />
              <KYCSelectRow label="Account Purpose" value="Select purpose…" />
              <div style={{ padding: '7px 8px', background: '#FEF3C7', borderRadius: 6, fontSize: 9, color: '#92400E', marginTop: 4 }}>
                🔍 Required under HKMA AML guidelines
              </div>
            </div>
          </div>
          <KYCCTAButton label="Save & Continue →" />
        </div>
      );

    case 'KYC_WEB_LIVENESS':
      return (
        <div style={kycWrap(base)}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>😊</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Selfie & Liveness Check</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 4 of 6</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '67%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Camera viewfinder */}
            <div style={{ flex: 1, background: '#1A1A1A', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 120, height: 160, border: '3px solid rgba(219,0,17,0.8)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 48, opacity: 0.4 }}>👤</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>Position your face inside the oval</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Webcam · Good lighting · No glasses</div>
            </div>
            {/* Instructions */}
            <div style={{ width: 180, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 10 }}>How it works</div>
              {[
                { n: '1', t: 'Allow camera access', d: 'Your browser will ask for webcam permission' },
                { n: '2', t: 'Face the camera', d: 'Look straight into the camera in good light' },
                { n: '3', t: 'Follow prompts', d: 'Blink, turn left/right as instructed' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#DB0011', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{step.t}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{step.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <KYCCTAButton label="📸 Start Liveness Check" />
        </div>
      );

    case 'KYC_WEB_OPEN_BANKING':
      return (
        <div style={kycWrap(base)}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🔗</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Connect Your Bank</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 5 of 6</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '83%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 3 }}>Link an existing HK bank account for instant identity verification</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Secure · read-only access · HKMA regulated · disconnect any time</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { name: 'HSBC HK',            color: '#DB0011', abbr: 'H'  },
                { name: 'Hang Seng Bank',      color: '#00A650', abbr: 'HS' },
                { name: 'Bank of China',       color: '#1D4ED8', abbr: 'BC' },
                { name: 'Standard Chartered',  color: '#009B77', abbr: 'SC' },
                { name: 'Citibank HK',         color: '#0066B3', abbr: 'C'  },
                { name: 'DBS Bank',            color: '#E31837', abbr: 'D'  },
                { name: 'OCBC Wing Hang',      color: '#D8212D', abbr: 'OW' },
                { name: 'Other Banks',         color: '#6B7280', abbr: '+'  },
              ].map(bank => (
                <div key={bank.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 6px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{bank.abbr}</div>
                  <div style={{ fontSize: 9, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{bank.name}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>
              Or <span style={{ color: '#DB0011', cursor: 'pointer' }}>skip this step</span> — manual verification takes 2–3 business days
            </div>
          </div>
          <KYCCTAButton label="🔗 Connect Securely →" />
        </div>
      );

    case 'KYC_WEB_DECLARATION':
      return (
        <div style={kycWrap(base)}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>✍️</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Legal Declarations</span>
              </div>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>Step 6 of 6 — Final step</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
              <div style={{ width: '100%', height: '100%', background: '#DB0011', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {/* Left: declarations checklist */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Please confirm the following</div>
              {[
                { label: 'PEP Status',    text: 'I am not a Politically Exposed Person, nor closely associated with one',           checked: true  },
                { label: 'Truthfulness',  text: 'All information provided is true, complete and accurate to the best of my knowledge', checked: true  },
                { label: 'FATCA / CRS',  text: 'I confirm my US person / tax residency status as declared above',                    checked: false },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 10, padding: '8px 10px', border: `1px solid ${item.checked ? '#DB0011' : '#E5E7EB'}`, borderRadius: 8, marginBottom: 6, background: item.checked ? 'rgba(219,0,17,0.04)' : '#fff' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${item.checked ? '#DB0011' : '#D1D5DB'}`, background: item.checked ? '#DB0011' : '#fff', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: application summary */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DB0011', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Application Summary</div>
              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', fontSize: 10, border: '1px solid #E5E7EB' }}>
                {[
                  { label: 'Full Name',    value: 'John Smith' },
                  { label: 'Nationality', value: 'Hong Kong (SAR)' },
                  { label: 'ID Type',     value: 'HKID Card' },
                  { label: 'Contact',     value: 'john@email.com · +852 9XXX XXXX' },
                  { label: 'District',    value: 'Central & Western' },
                  { label: 'Employment',  value: 'Employed (full-time)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ color: '#9CA3AF' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#374151', textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, lineHeight: 1.5 }}>
                By submitting, you agree to our <span style={{ color: '#DB0011' }}>Terms & Conditions</span> and <span style={{ color: '#DB0011' }}>Privacy Policy</span>.
              </div>
            </div>
          </div>
          <KYCCTAButton label="✅ Submit Application" />
        </div>
      );

    // ── Existing non-KYC components ──────────────────────────────────────────

    case 'HEADER_NAV':
      return (
        <div style={{ ...base, background: '#DB0011', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>HSBC</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', flex: 1, fontSize: 11 }}>{String(p.title ?? 'Header')}</span>
          {p.showNotificationBell && <span style={{ color: '#fff' }}>🔔</span>}
          {p.showQRScanner && <QRScanIcon color="#fff" size={16} />}
        </div>
      );
    case 'AI_SEARCH_BAR':
      return (
        <div style={{ ...base, background: '#DB0011', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.enableQRScan !== false && (
            <QRScanIcon color="rgba(255,255,255,0.9)" size={15} />
          )}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>🔍</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{String(p.placeholder ?? '搜尋功能、產品')}</span>
          </div>
          {p.enableChatbot !== false && (
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>🤖</span>
          )}
          {p.enableMessageInbox !== false && (
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>✉️</span>
          )}
        </div>
      );
    case 'VIDEO_PLAYER':
      return (
        <div style={{ ...base, background: '#0A1628', overflow: 'hidden' }}>
          {p.videoUrl
            ? (
              <video
                src={String(p.videoUrl)}
                poster={p.thumbnailUrl ? String(p.thumbnailUrl) : undefined}
                controls
                style={{ width: '100%', display: 'block', maxHeight: 200 }}
              />
            ) : (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0F2040' }}>
                {p.thumbnailUrl
                  ? <img src={String(p.thumbnailUrl)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                  : null}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(219,0,17,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    <span style={{ fontSize: 14, marginLeft: 2, color: '#fff' }}>▶</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>Drop a video from Content panel</div>
                </div>
              </div>
            )}
          <div style={{ padding: '8px 12px 10px' }}>
            {p.title && <div style={{ fontWeight: 700, fontSize: 11, color: '#fff', marginBottom: 2 }}>{String(p.title)}</div>}
            {p.presenterName && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>
                {String(p.presenterName)}{p.presenterTitle ? ` · ${String(p.presenterTitle)}` : ''}
              </div>
            )}
          </div>
        </div>
      );
    case 'PROMO_BANNER':
      return (
        <div style={{ ...base, background: String(p.backgroundColor ?? '#E8F4FD'), overflow: 'hidden', position: 'relative', padding: p.imageUrl && !p.title ? 0 : '12px 14px' }}>
          {p.imageUrl && (
            <img src={String(p.imageUrl)} alt={String(p.altText ?? '')}
              style={{ width: '100%', display: 'block', objectFit: 'cover', height: p.title ? 60 : 72 }} />
          )}
          {p.title && (
            <div style={{ padding: p.imageUrl ? '8px 14px 12px' : undefined }}>
              {p.badgeText && <div style={{ display: 'inline-block', padding: '2px 8px', background: '#FED7AA', color: '#92400E', borderRadius: 12, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{String(p.badgeText)}</div>}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: String(p.textColor ?? '#111') }}>{String(p.title)}</div>
              {p.subtitle && <div style={{ fontSize: 10, marginBottom: 6, color: String(p.textColor ? p.textColor + 'CC' : '#555') }}>{String(p.subtitle)}</div>}
              {p.ctaLabel && <div style={{ display: 'inline-block', padding: '3px 10px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{String(p.ctaLabel)}</div>}
            </div>
          )}
        </div>
      );
    case 'QUICK_ACCESS':
      return (
        <div style={{ ...base, padding: '8px 12px', display: 'flex', gap: 12, justifyContent: 'center' }}>
          {['朝朝寶', '借錢', '轉帳', '帳戶'].map(label => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⭐</div>
              <span style={{ fontSize: 9, color: '#374151' }}>{label}</span>
            </div>
          ))}
        </div>
      );
    case 'FUNCTION_GRID':
      return (
        <div style={{ ...base, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {['💳', '↔️', '🏦', '📊', '🔐', '💵', '📞', '⚙️'].map((ic, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{ic}</div>
              <span style={{ fontSize: 8, color: '#6B7280' }}>Func</span>
            </div>
          ))}
        </div>
      );
    case 'AI_ASSISTANT':
      return (
        <div style={{ ...base, padding: '8px 14px', background: 'linear-gradient(90deg,#0F3057,#1A6B8A)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ color: '#fff', fontSize: 11 }}>{String(p.greeting ?? 'Hi, how can I help?')}</span>
        </div>
      );
    case 'FLASH_LOAN':
      return (
        <div style={{ ...base, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡💳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{String(p.productName ?? 'Flash Loan')}</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>Up to {String(p.currency ?? 'HKD')} {String(p.maxAmount ?? '500,000')}</div>
          </div>
          <div style={{ padding: '4px 10px', background: '#DB0011', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{String(p.ctaLabel ?? 'Apply')}</div>
        </div>
      );
    case 'WEALTH_SELECTION':
      return (
        <div style={{ ...base, padding: '10px 14px' }}>
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
    case 'FEATURED_RANKINGS':
      return (
        <div style={{ ...base, padding: '10px 14px' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🏆 {String(p.sectionTitle ?? 'Rankings')}</div>
          {['#1 Tech Growth ETF +18.2%', '#2 HK Blue Chip +7.4%', '#3 Bond Fund +4.1%'].map((item, i) => (
            <div key={i} style={{ fontSize: 10, padding: '3px 0', color: '#374151' }}>{item}</div>
          ))}
        </div>
      );
    case 'LIFE_DEALS':
      return (
        <div style={{ ...base, padding: '10px 14px' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🛍️ {String(p.sectionTitle ?? 'Life Deals')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['KFC', 'Luckin', 'DQ'].map(brand => (
              <div key={brand} style={{ width: 48, height: 40, background: '#F3F4F6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{brand}</div>
            ))}
          </div>
        </div>
      );
    case 'AD_BANNER':
      return (
        <div style={{ ...base, padding: '8px 14px', background: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>📢</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{String(p.title ?? 'Ad Banner')}</div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>{String(p.subtitle ?? '')}</div>
          </div>
          {p.dismissible && <span style={{ color: '#9CA3AF', fontSize: 14, cursor: 'pointer' }}>×</span>}
        </div>
      );
    case 'SPACER':
      return (
        <div style={{ ...base, height: Math.max(16, Number(p.height ?? 24)), background: 'repeating-linear-gradient(45deg,#F9FAFB,#F9FAFB 5px,#F3F4F6 5px,#F3F4F6 10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: '#9CA3AF' }}>Spacer {p.height ? `${p.height}px` : ''}</span>
        </div>
      );
    case 'MARKET_BRIEFING_TEXT':
      return (
        <div style={{ ...base, padding: '10px 12px', background: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 8 }}>{String(p.sectionTitle ?? 'Key takeaways')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(Array.isArray(p.bulletPoints) ? p.bulletPoints.slice(0, 3) : ['Market briefing text from UCP content']).map((pt: unknown, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ color: '#DB0011', fontWeight: 700, fontSize: 10, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{String(pt)}</span>
              </div>
            ))}
            {Array.isArray(p.bulletPoints) && p.bulletPoints.length > 3 && (
              <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>+{p.bulletPoints.length - 3} more…</div>
            )}
          </div>
          {p.disclaimer && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: '#F9FAFB', borderRadius: 4, fontSize: 8, color: '#9CA3AF', lineHeight: 1.4, borderLeft: '2px solid #E5E7EB' }}>
              {String(p.disclaimer).substring(0, 80)}…
            </div>
          )}
        </div>
      );
    case 'CONTACT_RM_CTA':
      return (
        <div style={{ ...base, padding: '12px 16px', background: String(p.backgroundColor ?? '#DB0011'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: String(p.textColor ?? '#FFFFFF') }}>{String(p.label ?? 'Contact Your RM')}</div>
          {p.subLabel && <div style={{ fontSize: 9, color: `${String(p.textColor ?? '#FFFFFF')}CC`, textAlign: 'center' }}>{String(p.subLabel)}</div>}
          {p.sticky && <div style={{ marginTop: 4, fontSize: 8, padding: '1px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontWeight: 600 }}>STICKY</div>}
        </div>
      );
    case 'DEPOSIT_RATE_TABLE': {
      const rates = Array.isArray(p.rates) ? p.rates as { term: string; rate: string }[] : [];
      return (
        <div style={{ ...base, padding: '10px 12px', background: '#fff', fontFamily: 'sans-serif' }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 4 }}>{String(p.sectionTitle ?? 'Time Deposit Rate:')}</div>
          {p.asAtDate && <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 6 }}>As at {String(p.asAtDate)}</div>}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F9FAFB', padding: '4px 8px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280' }}>Term</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#6B7280', textAlign: 'right' }}>Interest Rate (% p.a.)</span>
            </div>
            {rates.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '3px 8px', borderBottom: i < rates.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <span style={{ fontSize: 8, color: '#374151' }}>{r.term}</span>
                <span style={{ fontSize: 8, color: '#374151', textAlign: 'right', fontWeight: 600 }}>{r.rate}</span>
              </div>
            ))}
          </div>
          {p.footnote && <div style={{ fontSize: 8, color: '#6B7280' }}>{String(p.footnote)}</div>}
        </div>
      );
    }
    case 'DEPOSIT_OPEN_CTA':
      return (
        <div style={{ ...base, padding: '10px 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: String(p.backgroundColor ?? '#C41E3A'), borderRadius: 24, padding: '8px 32px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: String(p.textColor ?? '#FFFFFF'), width: '100%' }}>
            {String(p.label ?? 'Open a Deposit')}
          </div>
        </div>
      );
    case 'DEPOSIT_FAQ': {
      const faqs = Array.isArray(p.items) ? p.items as { id: string; question: string; answer: string }[] : [];
      return (
        <div style={{ ...base, padding: '10px 12px', background: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 8 }}>{String(p.sectionTitle ?? 'Frequently Asked Questions')}</div>
          {faqs.length === 0 && (
            <div style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>No FAQ items configured</div>
          )}
          {faqs.map((faq, i) => (
            <div key={faq.id ?? i} style={{ marginBottom: 6, border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
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
  }
}

// ─── UCP Sidebar — hook for fetching content assets & components ─────────────

// UCP console runs on localhost:3001 and proxies /api → localhost:4000 (BFF).
// OCDP vite dev server (localhost:3002) proxies /ucp-api → localhost:3001/api,
// so all UCP calls go through UCP's own server without CORS issues.
const UCP_BASE = '/ucp-api';
const UCP_HEADERS = { 'x-mock-staff-role': 'WEALTH-AUTHOR' };

type SidebarTab = 'components' | 'content';

interface UCPComponent {
  componentId: string;
  sliceType: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  configurable: string[];
  minHeight: number;
  singleton?: boolean;
}

interface UCPSidebarState {
  assets: UCPContentAsset[];
  assetsLoading: boolean;
  assetsError: string | null;
  components: UCPComponent[];
  componentsLoading: boolean;
  componentsError: string | null;
}

function useUCPSidebar(activeTab: SidebarTab) {
  const [state, setState] = useState<UCPSidebarState>({
    assets: [],
    assetsLoading: false,
    assetsError: null,
    components: [],
    componentsLoading: false,
    componentsError: null,
  });

  const fetchAssets = useCallback(async () => {
    setState(s => ({ ...s, assetsLoading: true, assetsError: null }));
    try {
      const res = await fetch(`${UCP_BASE}/v1/ucp/content-assets?status=ACTIVE`, {
        headers: UCP_HEADERS,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(s => ({ ...s, assets: data.assets ?? [], assetsLoading: false }));
    } catch {
      setState(s => ({ ...s, assets: FALLBACK_CONTENT_ASSETS, assetsLoading: false }));
    }
  }, []);

  const fetchComponents = useCallback(async () => {
    setState(s => ({ ...s, componentsLoading: true, componentsError: null }));
    try {
      const res = await fetch(`${UCP_BASE}/v1/ucp/components?status=ACTIVE`, {
        headers: UCP_HEADERS,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(s => ({ ...s, components: data.components ?? [], componentsLoading: false }));
    } catch {
      setState(s => ({ ...s, componentsLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'content') fetchAssets();
    if (activeTab === 'components') fetchComponents();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetchAssets: fetchAssets, refetchComponents: fetchComponents };
}

// ─── Content asset card (draggable, drops as pre-filled slice) ────────────────

const ASSET_TYPE_ICON: Record<string, string> = {
  VIDEO: '🎬', IMAGE: '🖼️', DOCUMENT: '📄', FILE: '📎',
};

function assetToSlice(asset: UCPContentAsset): { type: string; props: Record<string, unknown> } | null {
  if (asset.assetType === 'VIDEO') {
    return {
      type: 'VIDEO_PLAYER',
      props: {
        ucpAssetId: asset.assetId,
        title: asset.name,
        thumbnailUrl: asset.thumbnailUrl ?? '',
        videoUrl: asset.url,
        presenterName: asset.presenter ?? '',
        presenterTitle: asset.presenterTitle ?? '',
        autoplay: false,
        showCaption: true,
      },
    };
  }
  if (asset.assetType === 'IMAGE') {
    return {
      type: 'PROMO_BANNER',
      props: {
        title: asset.name,
        subtitle: asset.altText ?? '',
        imageUrl: asset.url,
        ctaLabel: 'Learn More',
        ctaDeepLink: '',
        backgroundColor: '#E8F4FD',
      },
    };
  }
  return null;
}

function ContentAssetItem({
  asset,
  onDragStart,
}: {
  asset: UCPContentAsset;
  onDragStart: () => void;
}) {
  const icon = ASSET_TYPE_ICON[asset.assetType] ?? '📎';
  const mappedSlice = assetToSlice(asset);
  const fmt = (bytes: number) =>
    bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  return (
    <div
      draggable={!!mappedSlice}
      onDragStart={mappedSlice ? onDragStart : undefined}
      title={mappedSlice ? `Drag to add as ${mappedSlice.type}` : 'No compatible slice for this asset type'}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px',
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
        cursor: mappedSlice ? 'grab' : 'default',
        userSelect: 'none', marginBottom: 4,
        opacity: mappedSlice ? 1 : 0.5,
      }}
    >
      {/* Thumbnail or icon */}
      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F3F4F6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        {asset.thumbnailUrl
          ? <img src={asset.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 8, padding: '1px 5px', background: '#EEF2FF', color: '#4338CA', borderRadius: 4, fontWeight: 600 }}>{asset.assetType}</span>
          <span style={{ fontSize: 8, color: '#9CA3AF' }}>{fmt(asset.sizeBytes)}</span>
        </div>
        {mappedSlice && (
          <div style={{ fontSize: 8, color: '#059669', marginTop: 2, fontWeight: 600 }}>→ {mappedSlice.type}</div>
        )}
      </div>
    </div>
  );
}

// ─── Palette item ─────────────────────────────────────────────────────────────

function PaletteItem({ comp, onDragStart }: { comp: PaletteComponent; onDragStart: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
        cursor: 'grab', userSelect: 'none', marginBottom: 4,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{comp.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.label}</div>
        <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{comp.category}</div>
      </div>
      {comp.singleton && <span style={{ fontSize: 8, padding: '1px 4px', background: '#FEF3C7', color: '#D97706', borderRadius: 3, fontWeight: 700 }}>1×</span>}
    </div>
  );
}

// ─── Canvas slice card ────────────────────────────────────────────────────────

function CanvasCard({
  slice, index, total,
  onRemove, onToggleVisible, onToggleLock,
  onMoveUp, onMoveDown,
  selected, onSelect, readOnly,
  onDropAsset,
}: {
  slice: CanvasSlice; index: number; total: number;
  onRemove: () => void; onToggleVisible: () => void; onToggleLock: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
  selected: boolean; onSelect: () => void; readOnly?: boolean;
  onDropAsset?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const isVideoSlice = slice.type === 'VIDEO_PLAYER';

  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onDragOver={(!readOnly && isVideoSlice && onDropAsset) ? e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); } : undefined}
      onDragLeave={isVideoSlice ? () => setDragOver(false) : undefined}
      onDrop={(!readOnly && isVideoSlice && onDropAsset) ? e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false);
        onDropAsset();
      } : undefined}
      style={{
        border: dragOver ? '2px solid #059669' : selected ? '2px solid #DB0011' : '2px solid transparent',
        borderRadius: 10, marginBottom: 8, cursor: 'pointer',
        background: '#fff',
        boxShadow: dragOver ? '0 0 0 3px rgba(5,150,105,0.15)' : selected ? '0 0 0 3px rgba(219,0,17,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'border-color 0.1s, box-shadow 0.1s',
      }}
    >
      {dragOver && isVideoSlice && (
        <div style={{ padding: '6px 10px', background: '#ECFDF5', borderRadius: '8px 8px 0 0', fontSize: 10, fontWeight: 600, color: '#059669', textAlign: 'center' }}>
          ↓ Drop to load video into this player
        </div>
      )}
      <SlicePreview slice={slice} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', borderRadius: '0 0 8px 8px' }}>
        <span style={{ fontSize: 10, color: '#6B7280', flex: 1, fontWeight: 600 }}>{slice.type}</span>
        {!readOnly && (
          <>
            <button title="Move up"    disabled={index === 0}         onClick={e => { e.stopPropagation(); onMoveUp(); }}    style={iconBtn(index === 0)}>↑</button>
            <button title="Move down"  disabled={index === total - 1} onClick={e => { e.stopPropagation(); onMoveDown(); }}  style={iconBtn(index === total - 1)}>↓</button>
            <button title={slice.visible ? 'Hide' : 'Show'} onClick={e => { e.stopPropagation(); onToggleVisible(); }} style={iconBtn(false)}>{slice.visible ? '👁' : '🚫'}</button>
            <button title={slice.locked  ? 'Unlock' : 'Lock'}  onClick={e => { e.stopPropagation(); onToggleLock(); }}   style={iconBtn(false)}>{slice.locked ? '🔒' : '🔓'}</button>
            <button title="Remove"     onClick={e => { e.stopPropagation(); onRemove(); }}     style={{ ...iconBtn(false), color: '#DC2626' }}>×</button>
          </>
        )}
        {readOnly && (
          <span style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>{slice.visible ? 'visible' : 'hidden'}</span>
        )}
      </div>
    </div>
  );
}

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
    fontSize: 11, padding: '2px 4px', color: disabled ? '#D1D5DB' : '#6B7280',
    borderRadius: 4, lineHeight: 1,
  };
}

// ─── Meta panel (right side) ──────────────────────────────────────────────────

function MetaPanel({
  page, isJourneyPage, readOnly,
  onSave, onChangeName, onChangeDesc,
  onToggleNativeTarget,
  campaignSchedule, onScheduleChange,
}: {
  page: PageLayout; isJourneyPage: boolean; readOnly?: boolean;
  onSave: () => void;
  onChangeName: (v: string) => void;
  onChangeDesc: (v: string) => void;
  onToggleNativeTarget: (t: 'ios' | 'android' | 'harmonynext' | 'web') => void;
  campaignSchedule?: CampaignSchedule;
  onScheduleChange: (s: CampaignSchedule | undefined) => void;
}) {
  const [tab, setTab] = useState<'meta' | 'campaign'>('meta');
  const isCampaign = page.pageType === 'CAMPAIGN';
  const inp: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        {(['meta', ...(isCampaign ? ['campaign'] : [])] as const).map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)} style={{
            padding: '8px 14px', fontSize: 11, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? '#DB0011' : '#6B7280', background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid #DB0011' : '2px solid transparent',
            cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {t === 'meta' ? 'Page Info' : 'Campaign Timer'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {tab === 'meta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Page Name">
              <input value={page.name} onChange={e => onChangeName(e.target.value)} style={inp} disabled={readOnly} />
            </Field>
            <Field label="Description">
              <textarea value={page.description ?? ''} onChange={e => onChangeDesc(e.target.value)} rows={3}
                style={{ ...inp, resize: 'vertical' }} disabled={readOnly} />
            </Field>
            <Field label="Page Type">
              <div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.pageType}</div>
            </Field>
            <Field label="Channel">
              <div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.channel}</div>
            </Field>
            {page.channel === 'SDUI' && (
              <Field label="Native Targets">
                {readOnly ? (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['ios', 'android', 'harmonynext', 'web'] as const).map(t => {
                      const on = (page.nativeTargets ?? []).includes(t);
                      return (
                        <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: on ? '#FEF3C7' : '#F3F4F6', color: on ? '#92400E' : '#9CA3AF' }}>
                          {t === 'ios' ? '🍎' : t === 'android' ? '🤖' : t === 'harmonynext' ? '🌸' : '🌐'} {t}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {([
                      { value: 'ios' as const,         icon: '🍎', label: 'iOS' },
                      { value: 'android' as const,     icon: '🤖', label: 'Android' },
                      { value: 'harmonynext' as const, icon: '🌸', label: 'HarmonyNext' },
                      { value: 'web' as const,         icon: '🌐', label: 'Web' },
                    ]).map(t => {
                      const on = (page.nativeTargets ?? []).includes(t.value);
                      const updated = on
                        ? (page.nativeTargets ?? []).filter(x => x !== t.value)
                        : [...(page.nativeTargets ?? []), t.value];
                      return (
                        <button key={t.value}
                          onClick={() => onToggleNativeTarget(t.value)}
                          style={{ flex: 1, padding: '5px 4px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                            border: on ? '2px solid #D97706' : '2px solid #E5E7EB',
                            background: on ? '#FEF3C7' : '#fff', transition: 'all 0.1s' }}>
                          <div style={{ fontSize: 13 }}>{t.icon}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: on ? '#92400E' : '#9CA3AF' }}>{t.label}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
            )}
            {!isJourneyPage && (
              <>
                <Field label="Market">
                  <div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.marketId}</div>
                </Field>
                <Field label="Biz Line">
                  <div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.bizLineId}</div>
                </Field>
              </>
            )}
            <Field label="Status">
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: page.authoringStatus === 'APPROVED' ? '#D1FAE5' : page.authoringStatus === 'REJECTED' ? '#FEE2E2' : '#F3F4F6',
                color: page.authoringStatus === 'APPROVED' ? '#059669' : page.authoringStatus === 'REJECTED' ? '#DC2626' : '#6B7280',
              }}>{page.authoringStatus}</span>
            </Field>
            {/* Channel-specific meta */}
            {page.channel === 'WEB_STANDARD' && (
              <>
                <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Web SEO</div>
                <Field label="URL Slug"><div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.webSlug ?? '—'}</div></Field>
                <Field label="Meta Title"><div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.webMetaTitle ?? '—'}</div></Field>
              </>
            )}
            {page.channel === 'WEB_WECHAT' && (
              <>
                <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WeChat</div>
                <Field label="Page URL"><div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.wechatPageUrl ?? '—'}</div></Field>
                <Field label="Share Title"><div style={{ padding: '6px 10px', background: '#F9FAFB', borderRadius: 7, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB' }}>{page.wechatShareTitle ?? '—'}</div></Field>
              </>
            )}
          </div>
        )}

        {tab === 'campaign' && isCampaign && (
          <CampaignTimerMeta schedule={campaignSchedule} onChange={onScheduleChange} />
        )}
      </div>

      {/* Save button */}
      <div style={{ padding: 14, borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
        {readOnly ? (
          <div style={{ padding: '9px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
            🔒 Read-only — no changes allowed
          </div>
        ) : (
          <button onClick={onSave} style={{ width: '100%', padding: '9px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            💾 Save Changes
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Slice Prop Editor ────────────────────────────────────────────────────────

interface PropField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'color' | 'url';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

type ListKey = 'items' | 'rows' | 'bulletPoints' | 'products' | 'deals';

const SLICE_PROP_FIELDS: Partial<Record<string, PropField[]>> = {
  HEADER_NAV: [
    { key: 'title',                label: 'Title',                  type: 'text',    placeholder: 'e.g. 搜尋' },
    { key: 'searchPlaceholder',    label: 'Search Placeholder',     type: 'text',    placeholder: 'e.g. 搜尋功能、產品' },
    { key: 'showNotificationBell', label: 'Show Notification Bell', type: 'boolean' },
    { key: 'showQRScanner',        label: 'Show QR Scanner',        type: 'boolean' },
  ],
  AI_SEARCH_BAR: [
    { key: 'placeholder',          label: 'Search Placeholder',     type: 'text',    placeholder: '搜尋功能、產品' },
    { key: 'enableSemanticSearch', label: 'Enable Semantic Search', type: 'boolean' },
    { key: 'enableQRScan',         label: 'Enable QR Scan',         type: 'boolean' },
    { key: 'enableChatbot',        label: 'Enable Chatbot',         type: 'boolean' },
    { key: 'enableMessageInbox',   label: 'Enable Message Inbox',   type: 'boolean' },
    { key: 'searchApiEndpoint',    label: 'Search API Endpoint',    type: 'url',     placeholder: '/api/v1/search/semantic' },
  ],
  QUICK_ACCESS: [
    { key: 'itemsCount',   label: 'Max Items',    type: 'number', placeholder: '4' },
    { key: 'columnsCount', label: 'Grid Columns', type: 'number', placeholder: '4' },
    { key: 'labelStyle',   label: 'Label Style',  type: 'select', options: [
      { value: 'below', label: 'Below icon' }, { value: 'hidden', label: 'Hidden' },
    ]},
  ],
  PROMO_BANNER: [
    { key: 'title',           label: 'Title',             type: 'text',     placeholder: '全新活動' },
    { key: 'subtitle',        label: 'Subtitle',          type: 'text',     placeholder: '點擊了解更多' },
    { key: 'ctaLabel',        label: 'CTA Label',         type: 'text',     placeholder: '立即參與' },
    { key: 'ctaDeepLink',     label: 'CTA Deep Link',     type: 'url',      placeholder: 'hsbc://...' },
    { key: 'imageUrl',        label: 'Image URL',         type: 'url',      placeholder: 'https://...' },
    { key: 'backgroundColor', label: 'Background Colour', type: 'color' },
  ],
  FUNCTION_GRID: [
    { key: 'gridColumns', label: 'Grid Columns', type: 'select', options: [
      { value: '4', label: '4 columns' }, { value: '5', label: '5 columns' }, { value: '3', label: '3 columns' },
    ]},
    { key: 'maxRows',    label: 'Max Rows',    type: 'number', placeholder: '2' },
    { key: 'showLabels', label: 'Show Labels', type: 'boolean' },
  ],
  AI_ASSISTANT: [
    { key: 'greeting',    label: 'Greeting Text',  type: 'textarea', placeholder: 'Hi，我是你的智能財富助理' },
    { key: 'avatarStyle', label: 'Avatar Style',   type: 'select',   options: [
      { value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'none', label: 'None' },
    ]},
    { key: 'expandable',  label: 'Expandable',     type: 'boolean' },
  ],
  AD_BANNER: [
    { key: 'title',         label: 'Title',         type: 'text',    placeholder: '精選推廣' },
    { key: 'subtitle',      label: 'Subtitle',      type: 'text',    placeholder: '' },
    { key: 'ctaLabel',      label: 'CTA Label',     type: 'text',    placeholder: '了解更多' },
    { key: 'imageUrl',      label: 'Image URL',     type: 'url',     placeholder: 'https://...' },
    { key: 'dismissible',   label: 'Dismissible',   type: 'boolean' },
    { key: 'animationType', label: 'Animation',     type: 'select',  options: [
      { value: 'slide', label: 'Slide in' }, { value: 'fade', label: 'Fade in' }, { value: 'none', label: 'None' },
    ]},
  ],
  FLASH_LOAN: [
    { key: 'productName', label: 'Product Name', type: 'text',   placeholder: '閃電貸' },
    { key: 'tagline',     label: 'Tagline',       type: 'text',   placeholder: '最高可借額度' },
    { key: 'maxAmount',   label: 'Max Amount',    type: 'text',   placeholder: '500,000' },
    { key: 'currency',    label: 'Currency',      type: 'select', options: [
      { value: 'HKD', label: 'HKD' }, { value: 'SGD', label: 'SGD' }, { value: 'GBP', label: 'GBP' }, { value: 'USD', label: 'USD' },
    ]},
    { key: 'ctaLabel',    label: 'CTA Label',     type: 'text',   placeholder: '獲取額度' },
  ],
  WEALTH_SELECTION: [
    { key: 'sectionTitle',  label: 'Section Title',  type: 'text',    placeholder: '財富精選' },
    { key: 'moreDeepLink',  label: 'More Deep Link', type: 'url',     placeholder: 'hsbc://...' },
    { key: 'gridColumns',   label: 'Grid Columns',   type: 'select',  options: [
      { value: '2', label: '2 columns' }, { value: '1', label: '1 column' }, { value: '3', label: '3 columns' },
    ]},
    { key: 'showRiskLabel', label: 'Show Risk Label', type: 'boolean' },
    { key: 'showYield',     label: 'Show Yield',      type: 'boolean' },
  ],
  FEATURED_RANKINGS: [
    { key: 'sectionTitle',    label: 'Section Title',     type: 'text',   placeholder: '特色榜單' },
    { key: 'moreDeepLink',    label: 'More Deep Link',    type: 'url',    placeholder: 'hsbc://...' },
    { key: 'rankingStyle',    label: 'Ranking Style',     type: 'select', options: [
      { value: 'numbered', label: 'Numbered list' }, { value: 'card', label: 'Card grid' },
    ]},
    { key: 'maxItems',        label: 'Max Items',         type: 'number', placeholder: '5' },
    { key: 'showPerformance', label: 'Show Performance %', type: 'boolean' },
  ],
  LIFE_DEALS: [
    { key: 'sectionTitle',     label: 'Section Title',     type: 'text',   placeholder: '生活特惠' },
    { key: 'moreDeepLink',     label: 'More Deep Link',    type: 'url',    placeholder: 'hsbc://...' },
    { key: 'dealColumns',      label: 'Deal Columns',      type: 'select', options: [
      { value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' },
    ]},
    { key: 'showMerchantLogo', label: 'Show Merchant Logo', type: 'boolean' },
    { key: 'showExpiryDate',   label: 'Show Expiry Date',   type: 'boolean' },
  ],
  SPACER: [
    { key: 'height',     label: 'Height (px)',       type: 'number',  placeholder: '24' },
    { key: 'responsive', label: 'Responsive Scaling', type: 'boolean' },
  ],
  VIDEO_PLAYER: [
    { key: 'ucpAssetId',     label: 'UCP Asset ID',      type: 'text',    placeholder: 'asset-008' },
    { key: 'videoUrl',       label: 'Video URL',         type: 'url',     placeholder: 'http://localhost:3001/media/fx-viewpoint.mov' },
    { key: 'thumbnailUrl',   label: 'Thumbnail URL',     type: 'url',     placeholder: 'https://placehold.co/1280x720/...' },
    { key: 'title',          label: 'Title',             type: 'text',    placeholder: 'FX Viewpoint — EUR & GBP' },
    { key: 'presenterName',  label: 'Presenter Name',    type: 'text',    placeholder: 'Jackie Wong' },
    { key: 'presenterTitle', label: 'Presenter Title',   type: 'text',    placeholder: 'FX Strategist, HSBC Global Research' },
    { key: 'autoplay',       label: 'Autoplay',          type: 'boolean' },
    { key: 'showCaption',    label: 'Show Caption',      type: 'boolean' },
  ],
  MARKET_BRIEFING_TEXT: [
    { key: 'sectionTitle', label: 'Section Title', type: 'text',     placeholder: 'Key takeaways' },
    { key: 'disclaimer',   label: 'Disclaimer',    type: 'textarea', placeholder: 'Past performance is not...' },
    { key: 'ucpContentId', label: 'UCP Content ID', type: 'text',   placeholder: 'ucp-content-...' },
  ],
  CONTACT_RM_CTA: [
    { key: 'label',           label: 'Button Label',       type: 'text',    placeholder: 'Contact Your RM' },
    { key: 'subLabel',        label: 'Sub Label',          type: 'text',    placeholder: 'Connect with your advisor' },
    { key: 'deepLink',        label: 'Deep Link',          type: 'url',     placeholder: 'hsbc://rm/contact' },
    { key: 'backgroundColor', label: 'Background Colour',  type: 'color' },
    { key: 'textColor',       label: 'Text Colour',        type: 'color' },
    { key: 'sticky',          label: 'Sticky (pinned)',    type: 'boolean' },
  ],
  DEPOSIT_RATE_TABLE: [
    { key: 'sectionTitle', label: 'Section Title', type: 'text',     placeholder: 'Time Deposit Rate:' },
    { key: 'asAtDate',     label: 'As At Date',    type: 'text',     placeholder: '5/22/2025' },
    { key: 'footnote',     label: 'Footnote',      type: 'textarea', placeholder: 'Time deposit minimum balance...' },
  ],
  DEPOSIT_OPEN_CTA: [
    { key: 'label',           label: 'Button Label',      type: 'text',  placeholder: 'Open a Deposit' },
    { key: 'deepLink',        label: 'Deep Link',         type: 'url',   placeholder: 'hsbc://deposit/open' },
    { key: 'backgroundColor', label: 'Background Colour', type: 'color' },
    { key: 'textColor',       label: 'Text Colour',       type: 'color' },
  ],
  DEPOSIT_FAQ: [
    { key: 'sectionTitle', label: 'Section Title', type: 'text', placeholder: 'Frequently Asked Questions' },
  ],
};

const SLICE_LABELS: Partial<Record<string, string>> = {
  HEADER_NAV: 'Header Navigation', AI_SEARCH_BAR: 'AI Search Bar', QUICK_ACCESS: 'Quick Access Buttons',
  PROMO_BANNER: 'Promo Banner', FUNCTION_GRID: 'Function Grid',
  AI_ASSISTANT: 'AI Assistant', AD_BANNER: 'Ad Banner',
  FLASH_LOAN: 'Flash Loan Card', WEALTH_SELECTION: 'Wealth Selection',
  FEATURED_RANKINGS: 'Featured Rankings', LIFE_DEALS: 'Life Deals',
  SPACER: 'Spacer',
  MARKET_BRIEFING_TEXT: 'Market Briefing Text',
  VIDEO_PLAYER: 'Video Player',
  CONTACT_RM_CTA: 'Contact Your RM',
  DEPOSIT_RATE_TABLE: 'Deposit Rate Table',
  DEPOSIT_OPEN_CTA: 'Button CTA',
  DEPOSIT_FAQ: 'General FAQ',
};

function PropFieldInput({ field, value, onChange }: {
  field: PropField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '5px 8px', borderRadius: 5,
    border: '1px solid #D1D5DB', background: '#fff', color: '#111',
    fontSize: 12, outline: 'none', fontFamily: 'var(--font-family)',
  };

  if (field.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: '#DB0011', width: 14, height: 14 }}
        />
        <span style={{ fontSize: 12, color: value ? '#111' : '#9CA3AF' }}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={String(value ?? '#000000')}
          onChange={e => onChange(e.target.value)}
          style={{ width: 32, height: 28, padding: 2, border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
        />
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder="#DB0011"
          style={{ ...inp, flex: 1 }}
        />
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        style={{ ...inp, cursor: 'pointer' }}
      >
        {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        style={{ ...inp, resize: 'vertical' }}
      />
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(value ?? '')}
      onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={field.placeholder}
      style={inp}
    />
  );
}

function BulletPointsEditor({ points, onChange }: {
  points: string[];
  onChange: (pts: string[]) => void;
}) {
  function update(i: number, v: string) { const n = [...points]; n[i] = v; onChange(n); }
  function remove(i: number) { onChange(points.filter((_, idx) => idx !== i)); }
  function add() { onChange([...points, '']); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {points.map((pt, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 12, marginTop: 6, color: '#DB0011', flexShrink: 0 }}>•</span>
          <textarea
            value={pt}
            onChange={e => update(i, e.target.value)}
            rows={2}
            style={{ flex: 1, padding: '4px 7px', border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none' }}
          />
          <button
            onClick={() => remove(i)}
            style={{ padding: '3px 6px', border: '1px solid #FECACA', borderRadius: 4, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={add}
        style={{ padding: '5px 10px', border: '1px dashed #D1D5DB', borderRadius: 6, background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
      >+ Add bullet</button>
    </div>
  );
}

interface GridItem { label: string; icon: string; deepLink: string; }
interface GridRow  { items: GridItem[]; }

function FunctionGridEditor({ rows, onChange }: {
  rows: GridRow[];
  onChange: (rows: GridRow[]) => void;
}) {
  function updateItem(ri: number, ii: number, key: keyof GridItem, val: string) {
    const r = rows.map((row, rIdx) => rIdx !== ri ? row : {
      ...row,
      items: row.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, [key]: val }),
    });
    onChange(r);
  }
  function removeItem(ri: number, ii: number) {
    const r = rows.map((row, rIdx) => rIdx !== ri ? row : { ...row, items: row.items.filter((_, iIdx) => iIdx !== ii) });
    onChange(r.filter(row => row.items.length > 0));
  }
  function addItem(ri: number) {
    const r = rows.map((row, rIdx) => rIdx !== ri ? row : { ...row, items: [...row.items, { label: 'New Item', icon: '🔗', deepLink: '' }] });
    onChange(r);
  }
  function addRow() { onChange([...rows, { items: [{ label: 'New Item', icon: '🔗', deepLink: '' }] }]); }

  const labelInp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '3px 6px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ border: '1px solid #E5E7EB', borderRadius: 7, padding: 8, background: '#F9FAFB' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>ROW {ri + 1}</div>
          {row.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 5 }}>
              <input value={item.icon} onChange={e => updateItem(ri, ii, 'icon', e.target.value)}
                style={{ ...labelInp, width: 34, textAlign: 'center' }} placeholder="🔗" />
              <input value={item.label} onChange={e => updateItem(ri, ii, 'label', e.target.value)}
                style={{ ...labelInp, flex: 1 }} placeholder="Label" />
              <input value={item.deepLink} onChange={e => updateItem(ri, ii, 'deepLink', e.target.value)}
                style={{ ...labelInp, flex: 1 }} placeholder="hsbc://..." />
              <button onClick={() => removeItem(ri, ii)}
                style={{ padding: '2px 5px', border: '1px solid #FECACA', borderRadius: 3, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 10 }}>✕</button>
            </div>
          ))}
          <button onClick={() => addItem(ri)}
            style={{ padding: '3px 8px', border: '1px dashed #D1D5DB', borderRadius: 4, background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
            + Add item
          </button>
        </div>
      ))}
      <button onClick={addRow}
        style={{ padding: '5px 10px', border: '1px dashed #D1D5DB', borderRadius: 6, background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
        + Add row
      </button>
    </div>
  );
}

interface QuickAccessItem { label: string; icon: string; deepLink: string; }

function QuickAccessEditor({ items, onChange }: {
  items: QuickAccessItem[];
  onChange: (items: QuickAccessItem[]) => void;
}) {
  function update(i: number, key: keyof QuickAccessItem, val: string) {
    onChange(items.map((it, idx) => idx !== i ? it : { ...it, [key]: val }));
  }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() { onChange([...items, { label: 'New', icon: '🔗', deepLink: '' }]); }

  const inp: React.CSSProperties = { boxSizing: 'border-box', padding: '3px 6px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input value={item.icon} onChange={e => update(i, 'icon', e.target.value)}
            style={{ ...inp, width: 34, textAlign: 'center' }} placeholder="⚡" />
          <input value={item.label} onChange={e => update(i, 'label', e.target.value)}
            style={{ ...inp, flex: 1 }} placeholder="Label" />
          <input value={item.deepLink} onChange={e => update(i, 'deepLink', e.target.value)}
            style={{ ...inp, flex: 1 }} placeholder="hsbc://..." />
          <button onClick={() => remove(i)}
            style={{ padding: '2px 5px', border: '1px solid #FECACA', borderRadius: 3, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 10 }}>✕</button>
        </div>
      ))}
      <button onClick={add}
        style={{ padding: '5px 10px', border: '1px dashed #D1D5DB', borderRadius: 6, background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
        + Add item
      </button>
    </div>
  );
}

interface DepositRateRow { term: string; rate: string; }

function DepositRateRowEditor({ rates, onChange }: {
  rates: DepositRateRow[];
  onChange: (rows: DepositRateRow[]) => void;
}) {
  const inp: React.CSSProperties = { padding: '3px 6px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none' };
  function update(i: number, key: keyof DepositRateRow, val: string) {
    onChange(rates.map((r, idx) => idx !== i ? r : { ...r, [key]: val }));
  }
  function remove(i: number) { onChange(rates.filter((_, idx) => idx !== i)); }
  function add() { onChange([...rates, { term: '', rate: '' }]); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: 4, paddingBottom: 4, borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Term</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Rate % p.a.</span>
        <span />
      </div>
      {rates.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: 4, alignItems: 'center' }}>
          <input value={row.term} onChange={e => update(i, 'term', e.target.value)}
            style={{ ...inp, width: '100%', boxSizing: 'border-box' }} placeholder="e.g. 3 Month Time Deposit" />
          <input value={row.rate} onChange={e => update(i, 'rate', e.target.value)}
            style={{ ...inp, width: '100%', boxSizing: 'border-box', textAlign: 'right' }} placeholder="0.65" />
          <button onClick={() => remove(i)}
            style={{ padding: '2px 5px', border: '1px solid #FECACA', borderRadius: 4, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 11 }}>✕</button>
        </div>
      ))}
      <button onClick={add}
        style={{ padding: '5px 10px', border: '1px dashed #D1D5DB', borderRadius: 6, background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
        + Add row
      </button>
    </div>
  );
}

interface FAQItem { id: string; question: string; answer: string; }

function DepositFAQEditor({ items, onChange }: {
  items: FAQItem[];
  onChange: (items: FAQItem[]) => void;
}) {
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '4px 7px', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none' };
  function update(i: number, key: keyof FAQItem, val: string) {
    onChange(items.map((it, idx) => idx !== i ? it : { ...it, [key]: val }));
  }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() { onChange([...items, { id: `faq-${Date.now()}`, question: '', answer: '' }]); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((faq, i) => (
        <div key={faq.id} style={{ border: '1px solid #E5E7EB', borderRadius: 7, padding: 8, background: '#F9FAFB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>FAQ {i + 1}</span>
            <button onClick={() => remove(i)}
              style={{ padding: '2px 6px', border: '1px solid #FECACA', borderRadius: 4, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 10 }}>✕ Remove</button>
          </div>
          <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>Question</div>
          <input value={faq.question} onChange={e => update(i, 'question', e.target.value)}
            style={{ ...inp, marginBottom: 6 }} placeholder="Enter question…" />
          <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>Answer</div>
          <textarea value={faq.answer} onChange={e => update(i, 'answer', e.target.value)}
            rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Enter answer…" />
        </div>
      ))}
      <button onClick={add}
        style={{ padding: '5px 10px', border: '1px dashed #D1D5DB', borderRadius: 6, background: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
        + Add FAQ
      </button>
    </div>
  );
}

function SlicePropEditor({ slice, readOnly, onPropChange, onDeselect }: {
  slice: CanvasSlice;
  readOnly: boolean;
  onPropChange: (key: string, value: unknown) => void;
  onDeselect: () => void;
}) {
  const fields = SLICE_PROP_FIELDS[slice.type] ?? [];
  const props = slice.props as Record<string, unknown>;
  const label = SLICE_LABELS[slice.type] ?? slice.type;

  const sectionHead: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginTop: 14, marginBottom: 6,
  };
  const fieldRow: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10,
  };
  const fieldLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#374151',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, background: '#F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{label}</div>
          <button
            onClick={onDeselect}
            title="Deselect"
            style={{ padding: '2px 6px', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 10, color: '#6B7280' }}
          >✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{slice.type}</div>
        {readOnly && (
          <div style={{ marginTop: 6, padding: '4px 8px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 5, fontSize: 10, color: '#C2410C', fontWeight: 600 }}>
            🔒 Read-only
          </div>
        )}
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* Standard fields */}
        {fields.length > 0 && (
          <>
            <div style={sectionHead}>Properties</div>
            {fields.map(f => (
              <div key={f.key} style={fieldRow}>
                <div style={fieldLabel}>{f.label}</div>
                {readOnly ? (
                  <div style={{ padding: '5px 8px', background: '#F3F4F6', borderRadius: 5, fontSize: 12, color: '#374151', border: '1px solid #E5E7EB', wordBreak: 'break-all' }}>
                    {String(props[f.key] ?? '—')}
                  </div>
                ) : (
                  <PropFieldInput field={f} value={props[f.key]} onChange={v => onPropChange(f.key, v)} />
                )}
              </div>
            ))}
          </>
        )}

        {/* List editors */}
        {slice.type === 'FUNCTION_GRID' && (
          <div style={fieldRow}>
            <div style={sectionHead}>Grid Items</div>
            {readOnly ? (
              <div style={{ fontSize: 11, color: '#6B7280' }}>{((props.rows as GridRow[]) ?? []).reduce((a, r) => a + r.items.length, 0)} item(s)</div>
            ) : (
              <FunctionGridEditor
                rows={(props.rows as GridRow[]) ?? []}
                onChange={rows => onPropChange('rows', rows)}
              />
            )}
          </div>
        )}

        {slice.type === 'QUICK_ACCESS' && (
          <div style={fieldRow}>
            <div style={sectionHead}>Quick Access Items</div>
            {readOnly ? (
              <div style={{ fontSize: 11, color: '#6B7280' }}>{((props.items as QuickAccessItem[]) ?? []).length} item(s)</div>
            ) : (
              <QuickAccessEditor
                items={(props.items as QuickAccessItem[]) ?? []}
                onChange={items => onPropChange('items', items)}
              />
            )}
          </div>
        )}

        {slice.type === 'MARKET_BRIEFING_TEXT' && (
          <div style={fieldRow}>
            <div style={sectionHead}>Bullet Points</div>
            {readOnly ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                {((props.bulletPoints as string[]) ?? []).map((bp, i) => <li key={i}>{bp}</li>)}
              </ul>
            ) : (
              <BulletPointsEditor
                points={(props.bulletPoints as string[]) ?? []}
                onChange={pts => onPropChange('bulletPoints', pts)}
              />
            )}
          </div>
        )}

        {slice.type === 'DEPOSIT_RATE_TABLE' && (
          <div style={fieldRow}>
            <div style={sectionHead}>Rate Rows</div>
            {readOnly ? (
              <div style={{ fontSize: 11, color: '#6B7280' }}>{((props.rates as DepositRateRow[]) ?? []).length} row(s)</div>
            ) : (
              <DepositRateRowEditor
                rates={(props.rates as DepositRateRow[]) ?? []}
                onChange={rows => onPropChange('rates', rows)}
              />
            )}
          </div>
        )}

        {slice.type === 'DEPOSIT_FAQ' && (
          <div style={fieldRow}>
            <div style={sectionHead}>FAQ Items</div>
            {readOnly ? (
              <div style={{ fontSize: 11, color: '#6B7280' }}>{((props.items as FAQItem[]) ?? []).length} item(s)</div>
            ) : (
              <DepositFAQEditor
                items={(props.items as FAQItem[]) ?? []}
                onChange={items => onPropChange('items', items)}
              />
            )}
          </div>
        )}

        {fields.length === 0 && slice.type !== 'FUNCTION_GRID' && slice.type !== 'QUICK_ACCESS' && slice.type !== 'MARKET_BRIEFING_TEXT' && slice.type !== 'DEPOSIT_RATE_TABLE' && slice.type !== 'DEPOSIT_FAQ' && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, padding: 20 }}>
            No editable properties for this component type.
          </div>
        )}

        {/* Instance ID (read-only debug) */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Instance ID</div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6B7280', wordBreak: 'break-all' }}>{slice.instanceId}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function CampaignTimerMeta({ schedule, onChange }: { schedule?: CampaignSchedule; onChange: (s: CampaignSchedule | undefined) => void }) {
  const [pub, setPub]   = useState(schedule?.publishAt  ? new Date(schedule.publishAt).toISOString().slice(0, 16)  : '');
  const [take, setTake] = useState(schedule?.takedownAt ? new Date(schedule.takedownAt).toISOString().slice(0, 16) : '');
  const inp: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box' };

  useEffect(() => {
    const newPub  = schedule?.publishAt  ? new Date(schedule.publishAt).toISOString().slice(0, 16)  : '';
    const newTake = schedule?.takedownAt ? new Date(schedule.takedownAt).toISOString().slice(0, 16) : '';
    setPub(p  => p !== newPub  ? newPub  : p);
    setTake(t => t !== newTake ? newTake : t);
  }, [schedule?.publishAt, schedule?.takedownAt]);

  function handlePublishChange(v: string) {
    setPub(v);
    if (v && take) {
      onChange({ publishAt: new Date(v).toISOString(), takedownAt: new Date(take).toISOString() });
    }
  }

  function handleTakedownChange(v: string) {
    setTake(v);
    if (pub && v) {
      onChange({ publishAt: new Date(pub).toISOString(), takedownAt: new Date(v).toISOString() });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: 12, background: '#FFF7F7', borderRadius: 8, fontSize: 11, color: '#9B1C1C', lineHeight: 1.5 }}>
        ⏱ Set publish and takedown times. The page auto-releases to production when the publish timer expires (after approval).
      </div>
      <Field label="Publish At">
        <input type="datetime-local" value={pub} onChange={e => handlePublishChange(e.target.value)} style={inp} />
      </Field>
      <Field label="Takedown At">
        <input type="datetime-local" value={take} onChange={e => handleTakedownChange(e.target.value)} style={inp} />
      </Field>
      {pub && take && (
        <button onClick={() => { setPub(''); setTake(''); onChange(undefined); }} style={{ padding: '6px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>
          Clear Schedule
        </button>
      )}
    </div>
  );
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

// ── Value catalogues ─────────────────────────────────────────────────────────

const SEGMENT_META: Record<CustomerSegment, { label: string; bg: string; text: string; border: string }> = {
  premier: { label: '🏆 Premier',   bg: '#FFF8E1', text: '#B45309', border: '#F59E0B' },
  jade:    { label: '🟢 Jade',      bg: '#F0FDF4', text: '#15803D', border: '#22C55E' },
  advance: { label: '🔵 Advance',   bg: '#EFF6FF', text: '#1D4ED8', border: '#3B82F6' },
  mass:    { label: '👤 Mass',      bg: '#F9FAFB', text: '#374151', border: '#9CA3AF' },
};

const ACCOUNT_META: Record<AccountType, { label: string; icon: string }> = {
  wealth_account:  { label: 'Wealth Account',    icon: '💰' },
  credit_card:     { label: 'Credit Card',       icon: '💳' },
  current_account: { label: 'Current Account',   icon: '🏦' },
  savings_account: { label: 'Savings Account',   icon: '🪙' },
  mortgage:        { label: 'Mortgage',           icon: '🏠' },
  time_deposit:    { label: 'Time Deposit',       icon: '⏳' },
};

const LOCATION_META: Record<CustomerLocation, { label: string; flag: string }> = {
  HK:             { label: 'Hong Kong',           flag: '🇭🇰' },
  mainland_china: { label: 'Mainland China',      flag: '🇨🇳' },
  macau:          { label: 'Macau',               flag: '🇲🇴' },
  singapore:      { label: 'Singapore',           flag: '🇸🇬' },
  uk:             { label: 'United Kingdom',      flag: '🇬🇧' },
  other:          { label: 'Other',               flag: '🌍' },
};

const SEGMENTS:  CustomerSegment[]  = ['premier', 'jade', 'advance', 'mass'];
const ACCT_TYPES: AccountType[]     = ['wealth_account', 'credit_card', 'current_account', 'savings_account', 'mortgage', 'time_deposit'];
const LOCATIONS:  CustomerLocation[] = ['HK', 'mainland_china', 'macau', 'singapore', 'uk', 'other'];

const FIELD_META = {
  customerSegment: { label: 'Customer Segment', icon: '👥' },
  accountType:     { label: 'Account Type',     icon: '💳' },
  customerLocation:{ label: 'Customer Location',icon: '🌍' },
} as const;

type ConditionField = keyof typeof FIELD_META;

function fieldValueLabel(field: ConditionField, value: string): string {
  if (field === 'customerSegment') return SEGMENT_META[value as CustomerSegment]?.label ?? value;
  if (field === 'accountType')     return `${ACCOUNT_META[value as AccountType]?.icon} ${ACCOUNT_META[value as AccountType]?.label}` ?? value;
  if (field === 'customerLocation') return `${LOCATION_META[value as CustomerLocation]?.flag} ${LOCATION_META[value as CustomerLocation]?.label}` ?? value;
  return value;
}

function valuesForField(field: ConditionField): { value: string; label: string }[] {
  if (field === 'customerSegment')  return SEGMENTS.map(v => ({ value: v, label: SEGMENT_META[v].label }));
  if (field === 'accountType')      return ACCT_TYPES.map(v => ({ value: v, label: `${ACCOUNT_META[v].icon} ${ACCOUNT_META[v].label}` }));
  if (field === 'customerLocation') return LOCATIONS.map(v => ({ value: v, label: `${LOCATION_META[v].flag} ${LOCATION_META[v].label}` }));
  return [];
}

function defaultValueForField(field: ConditionField): string {
  if (field === 'customerSegment')  return 'premier';
  if (field === 'accountType')      return 'wealth_account';
  if (field === 'customerLocation') return 'HK';
  return '';
}

// ── Evaluator ────────────────────────────────────────────────────────────────

export function evaluateSliceVisible(slice: CanvasSlice, ctx: PreviewContext | null): boolean {
  const rule = slice.visibilityRule;
  if (!rule || !ctx) return true;

  const evalOne = (cond: RuleCondition): boolean => {
    const fieldVal = ctx[cond.field as keyof PreviewContext] as string;
    const condVal  = cond.value;
    switch (cond.operator) {
      case 'is':      return Array.isArray(condVal) ? condVal.includes(fieldVal as never) : condVal === fieldVal;
      case 'is_not':  return Array.isArray(condVal) ? !condVal.includes(fieldVal as never) : condVal !== fieldVal;
      case 'in':      return Array.isArray(condVal) && condVal.includes(fieldVal as never);
      case 'not_in':  return Array.isArray(condVal) && !condVal.includes(fieldVal as never);
      default:        return true;
    }
  };

  const conditionsMet = rule.conditionLogic === 'OR'
    ? rule.conditions.some(evalOne)
    : rule.conditions.every(evalOne);

  return rule.action === 'show' ? conditionsMet : !conditionsMet;
}

// ── Preview-context matrix helper ─────────────────────────────────────────────
// Returns rows describing how the rule resolves across all values of one field,
// holding the other two from `ctx`.
type MatrixRow = { valueLabel: string; visible: boolean; bg: string; text: string; border: string };

function previewMatrixForField(
  slice: CanvasSlice,
  ctx: PreviewContext,
  field: ConditionField,
): MatrixRow[] {
  if (field === 'customerSegment') {
    return SEGMENTS.map(seg => {
      const testCtx = { ...ctx, customerSegment: seg };
      const visible = evaluateSliceVisible(slice, testCtx);
      const m = SEGMENT_META[seg];
      return { valueLabel: m.label, visible, bg: m.bg, text: m.text, border: m.border };
    });
  }
  if (field === 'accountType') {
    return ACCT_TYPES.map(at => {
      const testCtx = { ...ctx, accountType: at };
      const visible = evaluateSliceVisible(slice, testCtx);
      return { valueLabel: `${ACCOUNT_META[at].icon} ${ACCOUNT_META[at].label}`, visible, bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
    });
  }
  if (field === 'customerLocation') {
    return LOCATIONS.map(loc => {
      const testCtx = { ...ctx, customerLocation: loc };
      const visible = evaluateSliceVisible(slice, testCtx);
      return { valueLabel: `${LOCATION_META[loc].flag} ${LOCATION_META[loc].label}`, visible, bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
    });
  }
  return [];
}

// ── Rule Console Panel ────────────────────────────────────────────────────────

function RuleConsolePanel({
  slice,
  readOnly,
  onRuleChange,
  onDeselect,
  previewContext,
}: {
  slice: CanvasSlice;
  readOnly: boolean;
  onRuleChange: (rule: VisibilityRule | undefined) => void;
  onDeselect: () => void;
  previewContext: PreviewContext | null;
}) {
  const rule = slice.visibilityRule;
  const compLabel = SLICE_LABELS[slice.type] ?? slice.type;
  const hasRule = !!rule;

  const [condLabel, setCondLabel] = useState(rule?.label ?? '');
  // Which field is focused for the preview matrix
  const usedFields = rule ? [...new Set(rule.conditions.map(c => c.field as ConditionField))] : [];
  const [matrixField, setMatrixField] = useState<ConditionField>(usedFields[0] ?? 'customerSegment');

  // Keep matrixField in sync when rule conditions change
  const firstField = rule?.conditions[0]?.field as ConditionField | undefined;
  const prevFirstField = useRef<ConditionField | undefined>(undefined);
  if (firstField && firstField !== prevFirstField.current) {
    prevFirstField.current = firstField;
    if (!usedFields.includes(matrixField)) setMatrixField(firstField);
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB',
    borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-family)',
    outline: 'none', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = {
    ...inp, appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 24,
  };
  const sectionHead: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 6,
  };

  function addRule() {
    const r: VisibilityRule = {
      ruleId: `rule-${Date.now()}`,
      label: `Show ${compLabel} by segment`,
      conditions: [{ field: 'customerSegment', operator: 'is', value: 'premier' }],
      conditionLogic: 'AND',
      action: 'show',
    };
    setCondLabel(r.label);
    onRuleChange(r);
  }

  function patchRule(patch: Partial<VisibilityRule>) {
    if (!rule) return;
    onRuleChange({ ...rule, ...patch });
  }

  function patchCondition(idx: number, patch: Partial<RuleCondition>) {
    if (!rule) return;
    const conditions = rule.conditions.map((c, i) =>
      i === idx ? { ...c, ...patch } as RuleCondition : c
    );
    patchRule({ conditions });
  }

  function changeConditionField(idx: number, field: ConditionField) {
    if (!rule) return;
    const defVal = defaultValueForField(field);
    const newCond: RuleCondition = { field, operator: 'is', value: defVal } as RuleCondition;
    const conditions = rule.conditions.map((c, i) => i === idx ? newCond : c);
    patchRule({ conditions });
    setMatrixField(field);
  }

  function addCondition() {
    if (!rule) return;
    const field: ConditionField = 'customerSegment';
    patchRule({ conditions: [...rule.conditions, { field, operator: 'is', value: defaultValueForField(field) } as RuleCondition] });
  }

  function removeCondition(idx: number) {
    if (!rule || rule.conditions.length <= 1) return;
    patchRule({ conditions: rule.conditions.filter((_, i) => i !== idx) });
  }

  const matrixRows = rule && previewContext
    ? previewMatrixForField(slice, previewContext, matrixField)
    : null;

  // Human-readable summary of the rule
  function ruleSummary(): string {
    if (!rule) return '';
    const condStr = rule.conditions.map(c => {
      const valStr = Array.isArray(c.value)
        ? c.value.map(v => fieldValueLabel(c.field as ConditionField, v)).join(' / ')
        : fieldValueLabel(c.field as ConditionField, String(c.value));
      return `${FIELD_META[c.field as ConditionField].icon} ${valStr}`;
    }).join(` ${rule.conditionLogic} `);
    return `${rule.action === 'show' ? 'Show' : 'Hide'} when ${condStr}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, background: '#F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>🎯 Rules — {compLabel}</div>
          <button onClick={onDeselect} title="Deselect"
            style={{ padding: '2px 6px', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 10, color: '#6B7280' }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{slice.instanceId}</div>
        {readOnly && (
          <div style={{ marginTop: 6, padding: '4px 8px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 5, fontSize: 10, color: '#C2410C', fontWeight: 600 }}>
            🔒 Read-only
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {!hasRule ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>No visibility rule</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 16, lineHeight: 1.5 }}>
              This component shows to all users.<br />
              Add a rule to control visibility by segment, account type, or location.
            </div>
            {!readOnly && (
              <button onClick={addRule} style={{
                padding: '8px 16px', background: '#DB0011', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                + Add Visibility Rule
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Rule name */}
            <div style={{ marginBottom: 10 }}>
              <div style={sectionHead}>Rule Name</div>
              {readOnly
                ? <div style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{rule.label}</div>
                : <input value={condLabel} onChange={e => { setCondLabel(e.target.value); patchRule({ label: e.target.value }); }} style={inp} placeholder="Rule description..." />
              }
            </div>

            {/* Summary badge */}
            {!readOnly && (
              <div style={{ marginBottom: 10, padding: '5px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 10, color: '#1D4ED8', fontStyle: 'italic' }}>
                {ruleSummary()}
              </div>
            )}

            {/* Action */}
            <div style={{ marginBottom: 10 }}>
              <div style={sectionHead}>Action</div>
              {readOnly ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6,
                  fontWeight: 700, fontSize: 11,
                  background: rule.action === 'show' ? '#D1FAE5' : '#FEE2E2',
                  color: rule.action === 'show' ? '#059669' : '#DC2626',
                }}>
                  {rule.action === 'show' ? '👁 Show' : '🚫 Hide'} this component when conditions are met
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['show', 'hide'] as const).map(a => (
                    <button key={a} onClick={() => patchRule({ action: a })} style={{
                      flex: 1, padding: '6px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11,
                      border: `2px solid ${rule.action === a ? (a === 'show' ? '#059669' : '#DC2626') : '#E5E7EB'}`,
                      background: rule.action === a ? (a === 'show' ? '#D1FAE5' : '#FEE2E2') : '#fff',
                      color: rule.action === a ? (a === 'show' ? '#059669' : '#DC2626') : '#6B7280',
                    }}>
                      {a === 'show' ? '👁 Show' : '🚫 Hide'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conditions */}
            <div style={{ marginBottom: 10 }}>
              <div style={sectionHead}>Conditions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {rule.conditions.map((cond, idx) => {
                  const fieldKey = cond.field as ConditionField;
                  const values = valuesForField(fieldKey);
                  const currentVal = Array.isArray(cond.value) ? (cond.value as string[])[0] : String(cond.value);
                  return (
                    <div key={idx}>
                      {/* AND/OR badge between conditions */}
                      {idx > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                          {readOnly ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', padding: '1px 8px', background: '#F3F4F6', borderRadius: 4 }}>
                              {rule.conditionLogic}
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: 2 }}>
                              {(['AND', 'OR'] as const).map(logic => (
                                <button key={logic} onClick={() => patchRule({ conditionLogic: logic })} style={{
                                  padding: '1px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
                                  border: `1px solid ${rule.conditionLogic === logic ? '#6366F1' : '#E5E7EB'}`,
                                  background: rule.conditionLogic === logic ? '#EEF2FF' : '#fff',
                                  color: rule.conditionLogic === logic ? '#4338CA' : '#9CA3AF',
                                }}>
                                  {logic}
                                </button>
                              ))}
                            </div>
                          )}
                          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                        </div>
                      )}

                      {/* Condition card */}
                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>
                            {idx === 0 ? 'IF' : rule.conditionLogic}
                          </span>
                          {!readOnly && rule.conditions.length > 1 && (
                            <button onClick={() => removeCondition(idx)} style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              ✕
                            </button>
                          )}
                        </div>

                        {readOnly ? (
                          <div style={{ fontSize: 11, color: '#374151' }}>
                            <span style={{ fontWeight: 600 }}>{FIELD_META[fieldKey].icon} {FIELD_META[fieldKey].label}</span>
                            {' '}{cond.operator === 'is' ? 'is' : cond.operator === 'is_not' ? 'is not' : cond.operator}{' '}
                            <strong>{fieldValueLabel(fieldKey, currentVal)}</strong>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {/* Field picker */}
                            <select value={fieldKey} onChange={e => changeConditionField(idx, e.target.value as ConditionField)} style={sel}>
                              {(Object.keys(FIELD_META) as ConditionField[]).map(f => (
                                <option key={f} value={f}>{FIELD_META[f].icon} {FIELD_META[f].label}</option>
                              ))}
                            </select>
                            {/* Operator */}
                            <select value={cond.operator} onChange={e => patchCondition(idx, { operator: e.target.value as RuleOperator })} style={sel}>
                              <option value="is">is</option>
                              <option value="is_not">is not</option>
                            </select>
                            {/* Value */}
                            <select value={currentVal} onChange={e => patchCondition(idx, { value: e.target.value } as Partial<RuleCondition>)} style={sel}>
                              {values.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!readOnly && (
                <button onClick={addCondition} style={{
                  marginTop: 6, fontSize: 10, color: '#6B7280', background: 'none',
                  border: '1px dashed #D1D5DB', borderRadius: 6, cursor: 'pointer',
                  padding: '4px 10px', width: '100%',
                }}>
                  + Add condition
                </button>
              )}
            </div>

            {/* Preview matrix */}
            {previewContext && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={sectionHead}>Preview result</div>
                  {/* Field tab switcher for matrix */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(Object.keys(FIELD_META) as ConditionField[]).map(f => (
                      <button key={f} onClick={() => setMatrixField(f)} title={FIELD_META[f].label} style={{
                        padding: '1px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                        border: `1px solid ${matrixField === f ? '#6366F1' : '#E5E7EB'}`,
                        background: matrixField === f ? '#EEF2FF' : '#fff',
                        color: matrixField === f ? '#4338CA' : '#9CA3AF',
                      }}>
                        {FIELD_META[f].icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 5 }}>
                  Vary {FIELD_META[matrixField].label}, hold other context values fixed
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {matrixRows?.map(row => (
                    <div key={row.valueLabel} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '3px 8px', borderRadius: 5,
                      background: row.bg, border: `1px solid ${row.border}`,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: row.text }}>{row.valueLabel}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                        background: row.visible ? '#D1FAE5' : '#FEE2E2',
                        color: row.visible ? '#059669' : '#DC2626',
                      }}>
                        {row.visible ? '👁' : '🚫'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remove rule */}
            {!readOnly && (
              <button onClick={() => onRuleChange(undefined)} style={{
                width: '100%', padding: '7px', background: '#FFF', color: '#DC2626',
                border: '1px solid #FECACA', borderRadius: 7, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', marginTop: 4,
              }}>
                🗑 Remove Rule
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Preview Context Picker (toolbar popover) ──────────────────────────────────

function PreviewContextPicker({
  context,
  onChange,
}: {
  context: PreviewContext | null;
  onChange: (ctx: PreviewContext | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const draft: PreviewContext = context ?? {
    customerSegment: 'premier',
    accountType:     'wealth_account',
    customerLocation:'HK',
  };

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const active = context !== null;

  const selStyle: React.CSSProperties = {
    width: '100%', padding: '5px 8px', border: '1px solid #D1D5DB',
    borderRadius: 6, fontSize: 11, outline: 'none', boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 22,
  };

  const fieldLbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 10, fontWeight: 700,
          border: active ? '2px solid #6366F1' : '2px solid rgba(255,255,255,0.2)',
          background: active ? '#EEF2FF' : 'rgba(255,255,255,0.08)',
          color: active ? '#4338CA' : '#9CA3AF',
          transition: 'all 0.1s',
        }}
      >
        👤 Preview Context {active ? '●' : '○'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 999,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)', padding: 14, width: 230,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 10 }}>
            🎯 Simulate User Profile
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={fieldLbl}>👥 Customer Segment</label>
            <select value={draft.customerSegment} onChange={e => onChange({ ...draft, customerSegment: e.target.value as CustomerSegment })} style={selStyle}>
              {SEGMENTS.map(s => <option key={s} value={s}>{SEGMENT_META[s].label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={fieldLbl}>💳 Account Type</label>
            <select value={draft.accountType} onChange={e => onChange({ ...draft, accountType: e.target.value as AccountType })} style={selStyle}>
              {ACCT_TYPES.map(a => <option key={a} value={a}>{ACCOUNT_META[a].icon} {ACCOUNT_META[a].label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={fieldLbl}>🌍 Customer Location</label>
            <select value={draft.customerLocation} onChange={e => onChange({ ...draft, customerLocation: e.target.value as CustomerLocation })} style={selStyle}>
              {LOCATIONS.map(l => <option key={l} value={l}>{LOCATION_META[l].flag} {LOCATION_META[l].label}</option>)}
            </select>
          </div>

          {/* Active context summary */}
          {active && (
            <div style={{ marginBottom: 10, padding: '6px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 10, color: '#1D4ED8' }}>
              {SEGMENT_META[draft.customerSegment].label} · {ACCOUNT_META[draft.accountType].icon} {ACCOUNT_META[draft.accountType].label} · {LOCATION_META[draft.customerLocation].flag} {LOCATION_META[draft.customerLocation].label}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            {!active && (
              <button onClick={() => { onChange(draft); setOpen(false); }} style={{
                flex: 1, padding: '6px', background: '#6366F1', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                Apply Preview
              </button>
            )}
            {active && (
              <button onClick={() => { onChange(null); setOpen(false); }} style={{
                flex: 1, padding: '6px', background: '#FFF', color: '#DC2626',
                border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                Clear Preview
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main editor view ─────────────────────────────────────────────────────────

export function PageEditorView() {
  const { state, dispatch } = useOCDP();
  const { editorPageId, editorJourneyId, editorReadOnly, pages, journeyPages, previewContext } = state;

  // Resolve the page being edited (could be a regular page or a journey page)
  const regularPage = editorPageId ? pages.find(p => p.pageId === editorPageId) : null;
  const journeyPageEntry = editorPageId ? journeyPages.find(jp => jp.page.pageId === editorPageId) : null;
  const page: PageLayout | undefined = regularPage ?? journeyPageEntry?.page;
  const isJourneyPage = !!journeyPageEntry;

  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [paletteCat, setPaletteCat] = useState<string>('all');
  const [paletteSearch, setPaletteSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('components');
  const [contentSearch, setContentSearch] = useState('');
  const [rightTab, setRightTab] = useState<'props' | 'rules'>('props');
  const draggingComp = useRef<PaletteComponent | null>(null);
  const draggingAsset = useRef<UCPContentAsset | null>(null);

  const ucpSidebar = useUCPSidebar(sidebarTab);

  if (!page || !editorPageId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No page selected</div>
        </div>
      </div>
    );
  }

  const slices = page.slices;

  // Palette filtering
  const paletteFiltered = PALETTE_COMPONENTS.filter(c => {
    const catMatch = paletteCat === 'all' || c.category === paletteCat;
    const searchMatch = !paletteSearch || c.label.toLowerCase().includes(paletteSearch.toLowerCase()) || c.category.toLowerCase().includes(paletteSearch.toLowerCase());
    // Disable singletons already added
    return catMatch && searchMatch;
  });

  function addSlice(comp: PaletteComponent, atIndex?: number) {
    const defaultProps: Record<string, unknown> = {};
    if (comp.sliceType === 'HEADER_NAV') Object.assign(defaultProps, { title: 'Page Title', searchPlaceholder: 'Search...', showNotificationBell: true, showQRScanner: false });
    if (comp.sliceType === 'AI_SEARCH_BAR') Object.assign(defaultProps, { placeholder: '搜尋功能、產品', enableSemanticSearch: true, enableQRScan: true, enableChatbot: true, enableMessageInbox: true, searchApiEndpoint: '/api/v1/search/semantic' });
    if (comp.sliceType === 'PROMO_BANNER') Object.assign(defaultProps, { title: 'Promotion Title', subtitle: 'Subtitle text', ctaLabel: 'Learn More', ctaDeepLink: '', imageUrl: '', backgroundColor: '#E8F4FD' });
    if (comp.sliceType === 'AI_ASSISTANT') Object.assign(defaultProps, { greeting: 'Hi, how can I help you today?' });
    if (comp.sliceType === 'SPACER') Object.assign(defaultProps, { height: 24 });
    if (comp.sliceType === 'FLASH_LOAN') Object.assign(defaultProps, { productName: 'Flash Loan', tagline: 'Quick approval', maxAmount: '500,000', currency: 'HKD', ctaLabel: 'Apply Now' });
    if (comp.sliceType === 'WEALTH_SELECTION') Object.assign(defaultProps, { sectionTitle: 'Wealth Products', products: [], moreDeepLink: '' });
    if (comp.sliceType === 'FEATURED_RANKINGS') Object.assign(defaultProps, { sectionTitle: 'Top Funds', items: [], moreDeepLink: '' });
    if (comp.sliceType === 'LIFE_DEALS') Object.assign(defaultProps, { sectionTitle: 'Life Deals', deals: [], moreDeepLink: '' });
    if (comp.sliceType === 'AD_BANNER') Object.assign(defaultProps, { title: 'Special Offer', subtitle: '', imageUrl: '', dismissible: true });
    if (comp.sliceType === 'QUICK_ACCESS') Object.assign(defaultProps, { items: [] });
    if (comp.sliceType === 'FUNCTION_GRID') Object.assign(defaultProps, { rows: [] });
    if (comp.sliceType === 'MARKET_BRIEFING_TEXT') Object.assign(defaultProps, { ucpContentId: '', sectionTitle: 'Key takeaways', bulletPoints: [], disclaimer: '' });
    if (comp.sliceType === 'VIDEO_PLAYER') Object.assign(defaultProps, { ucpAssetId: '', title: '', presenterName: '', presenterTitle: '', autoplay: false, showCaption: true });
    if (comp.sliceType === 'CONTACT_RM_CTA') Object.assign(defaultProps, { label: 'Contact Your RM', subLabel: '', deepLink: 'hsbc://rm/contact', backgroundColor: '#DB0011', textColor: '#FFFFFF', sticky: true });
    if (comp.sliceType === 'DEPOSIT_RATE_TABLE') Object.assign(defaultProps, {
      sectionTitle: 'Time Deposit Rate:',
      asAtDate: '5/22/2025',
      rates: [
        { term: '3 Month Time Deposit',  rate: '0.65' },
        { term: '6 Month Time Deposit',  rate: '0.85' },
        { term: '12 Month Time Deposit', rate: '0.95' },
        { term: '24 Month Time Deposit', rate: '1.05' },
        { term: '36 Month Time Deposit', rate: '1.25' },
        { term: '60 Month Time Deposit', rate: '1.30' },
      ],
      footnote: 'Time deposit minimum balance for Personal Banking customers: RMB50',
    });
    if (comp.sliceType === 'DEPOSIT_OPEN_CTA') Object.assign(defaultProps, {
      label: 'Open a Deposit',
      deepLink: 'hsbc://deposit/open?currency=CNY',
      backgroundColor: '#C41E3A',
      textColor: '#FFFFFF',
    });
    if (comp.sliceType === 'DEPOSIT_FAQ') Object.assign(defaultProps, {
      sectionTitle: 'Frequently Asked Questions',
      items: [
        { id: 'faq-1', question: 'Can I withdraw my time deposit before it matures?', answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.' },
        { id: 'faq-2', question: 'What happens if I don\'t withdraw my money after maturity?', answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.' },
        { id: 'faq-3', question: 'How long can I keep a time deposit?', answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans.' },
        { id: 'faq-4', question: 'Why is the interest rate higher for time deposits than regular savings accounts?', answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.' },
      ],
    });

    const newSlice = { type: comp.sliceType, props: defaultProps, visible: true, locked: false };

    if (isJourneyPage) {
      dispatch({ type: 'ADD_JOURNEY_PAGE_SLICE', pageId: editorPageId, slice: newSlice });
    } else {
      dispatch({ type: 'ADD_SLICE', pageId: editorPageId, slice: newSlice });
    }
    // If dropped at specific index we'd need to reorder — simplify by appending then moving
    // atIndex handling: reorder after add
    void atIndex;
  }

  function addSliceFromAsset(asset: UCPContentAsset) {
    const mapped = assetToSlice(asset);
    if (!mapped) return;
    const newSlice = { type: mapped.type as CanvasSlice['type'], props: mapped.props, visible: true, locked: false };
    if (isJourneyPage) {
      dispatch({ type: 'ADD_JOURNEY_PAGE_SLICE', pageId: editorPageId, slice: newSlice });
    } else {
      dispatch({ type: 'ADD_SLICE', pageId: editorPageId, slice: newSlice });
    }
  }

  function patchVideoSliceFromAsset(instanceId: string) {
    const asset = draggingAsset.current;
    if (!asset || asset.assetType !== 'VIDEO') return;
    const patch: Record<string, unknown> = {
      ucpAssetId:    asset.assetId,
      title:         asset.name,
      videoUrl:      asset.url,
      thumbnailUrl:  asset.thumbnailUrl ?? '',
      presenterName: asset.presenter ?? '',
      presenterTitle: asset.presenterTitle ?? '',
    };
    const updated = slices.map(s =>
      s.instanceId !== instanceId ? s : { ...s, props: { ...s.props, ...patch } }
    );
    if (isJourneyPage) {
      dispatch({ type: 'REORDER_JOURNEY_PAGE_SLICES', pageId: editorPageId, slices: updated });
    } else {
      dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { slices: updated } });
    }
    dispatch({ type: 'SHOW_TOAST', message: `Video "${asset.name}" loaded into player`, toastType: 'success' });
    draggingAsset.current = null;
  }

  function removeSlice(instanceId: string) {
    if (isJourneyPage) {
      dispatch({ type: 'REMOVE_JOURNEY_PAGE_SLICE', pageId: editorPageId, instanceId });
    } else {
      dispatch({ type: 'REMOVE_SLICE', pageId: editorPageId, instanceId });
    }
    if (selectedSliceId === instanceId) setSelectedSliceId(null);
  }

  function toggleVisible(instanceId: string) {
    if (isJourneyPage) {
      dispatch({ type: 'TOGGLE_JOURNEY_PAGE_SLICE_VISIBLE', pageId: editorPageId, instanceId });
    } else {
      const slice = slices.find(s => s.instanceId === instanceId);
      if (slice) dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { slices: slices.map(s => s.instanceId === instanceId ? { ...s, visible: !s.visible } : s) } });
    }
  }

  function toggleLock(instanceId: string) {
    if (isJourneyPage) {
      dispatch({ type: 'TOGGLE_JOURNEY_PAGE_SLICE_LOCK', pageId: editorPageId, instanceId });
    } else {
      const slice = slices.find(s => s.instanceId === instanceId);
      if (slice) dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { slices: slices.map(s => s.instanceId === instanceId ? { ...s, locked: !s.locked } : s) } });
    }
  }

  function moveSlice(from: number, to: number) {
    if (to < 0 || to >= slices.length) return;
    const reordered = [...slices];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    if (isJourneyPage) {
      dispatch({ type: 'REORDER_JOURNEY_PAGE_SLICES', pageId: editorPageId, slices: reordered });
    } else {
      dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { slices: reordered } });
    }
  }

  function updateSliceProp(instanceId: string, key: string, value: unknown) {
    const updated = slices.map(s =>
      s.instanceId !== instanceId ? s : { ...s, props: { ...s.props, [key]: value } }
    );
    if (isJourneyPage) {
      dispatch({ type: 'REORDER_JOURNEY_PAGE_SLICES', pageId: editorPageId, slices: updated });
    } else {
      dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { slices: updated } });
    }
  }

  function saveChanges(name: string, description: string) {
    if (isJourneyPage) {
      dispatch({ type: 'EDIT_JOURNEY_PAGE', pageId: editorPageId, updates: { name, description } });
    } else {
      dispatch({ type: 'EDIT_PAGE', pageId: editorPageId, updates: { name, description } });
    }
    dispatch({ type: 'SHOW_TOAST', message: `"${name}" saved`, toastType: 'success' });
  }

  function updateSliceRule(instanceId: string, rule: VisibilityRule | undefined) {
    if (isJourneyPage) {
      dispatch({ type: 'SET_JOURNEY_SLICE_RULE', pageId: editorPageId, instanceId, rule });
    } else {
      dispatch({ type: 'SET_SLICE_RULE', pageId: editorPageId, instanceId, rule });
    }
  }

  function handleScheduleChange(schedule: CampaignSchedule | undefined) {
    if (!isJourneyPage) {
      dispatch({ type: 'SET_CAMPAIGN_SCHEDULE', pageId: editorPageId, schedule });
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface-bg)' }}>
      {/* Top bar */}
      <div style={{ height: 50, background: '#1A1A1A', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => dispatch({ type: 'CLOSE_PAGE_EDITOR' })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          ← {editorReadOnly ? 'Back' : 'Exit Editor'}
        </button>
        {editorReadOnly && (
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: '#D97706', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>
            👁 READ ONLY
          </span>
        )}
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isJourneyPage && <span style={{ color: '#9CA3AF', marginRight: 8 }}>Journey Step ›</span>}
          {page.name}
        </div>

        {/* Preview context picker */}
        <PreviewContextPicker
          context={previewContext}
          onChange={ctx => dispatch({ type: 'SET_PREVIEW_CONTEXT', context: ctx })}
        />

        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#D1D5DB', fontWeight: 700 }}>
          {page.authoringStatus}
        </span>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#DB0011', color: '#fff', fontWeight: 700 }}>
          {page.channel}
        </span>
      </div>

      {/* 3-pane body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: UCP Sidebar — Components / Content / UCP Components tabs */}
        <div style={{ width: 240, flexShrink: 0, background: 'var(--surface-panel)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {editorReadOnly && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,250,251,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textAlign: 'center', padding: '0 16px' }}>Read-only — revert to Draft to edit</span>
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
            {(
              [
                { id: 'components' as SidebarTab,     label: 'Components', icon: '🧩' },
                { id: 'content' as SidebarTab,        label: 'Content',    icon: '🎬' },
              ] as { id: SidebarTab; label: string; icon: string }[]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                style={{
                  flex: 1, padding: '9px 4px', border: 'none', background: 'none',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  color: sidebarTab === tab.id ? '#DB0011' : '#6B7280',
                  borderBottom: sidebarTab === tab.id ? '2px solid #DB0011' : '2px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Components (from UCP component registry) ──────────── */}
          {sidebarTab === 'components' && (
            <>
              <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                <input
                  value={paletteSearch}
                  onChange={e => setPaletteSearch(e.target.value)}
                  placeholder="Search components..."
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
                />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <CategoryPill id="all" label="All" active={paletteCat === 'all'} onClick={() => setPaletteCat('all')} />
                  {PALETTE_CATEGORIES.map(c => (
                    <CategoryPill key={c.id} id={c.id} label={c.icon} active={paletteCat === c.id} onClick={() => setPaletteCat(c.id)} />
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                {ucpSidebar.componentsLoading && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Loading from UCP…</div>
                  </div>
                )}
                {ucpSidebar.componentsError && (
                  <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 10, color: '#DC2626', textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ UCP Unavailable</div>
                    <div style={{ marginBottom: 6 }}>{ucpSidebar.componentsError}</div>
                    <button onClick={ucpSidebar.refetchComponents} style={{ padding: '4px 10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                  </div>
                )}
                {/* Merge: UCP components when loaded, fallback to local palette while loading */}
                {(() => {
                  const source: PaletteComponent[] = ucpSidebar.components.length > 0
                    ? ucpSidebar.components.map(c => ({
                        sliceType: c.sliceType as PaletteComponent['sliceType'],
                        label: c.label,
                        icon: c.icon,
                        category: c.category,
                        description: c.description,
                        singleton: c.singleton,
                        minHeight: c.minHeight,
                        configurable: c.configurable,
                      }))
                    : PALETTE_COMPONENTS;
                  const filtered = source.filter(c => {
                    const catMatch = paletteCat === 'all' || c.category === paletteCat;
                    const searchMatch = !paletteSearch || c.label.toLowerCase().includes(paletteSearch.toLowerCase()) || c.category.toLowerCase().includes(paletteSearch.toLowerCase());
                    return catMatch && searchMatch;
                  });
                  if (filtered.length === 0) return <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, padding: 16 }}>No components</div>;
                  return filtered.map(comp => {
                    const alreadyAdded = !!comp.singleton && slices.some(s => s.type === comp.sliceType);
                    return (
                      <div key={comp.sliceType} style={{ opacity: alreadyAdded ? 0.4 : 1, pointerEvents: alreadyAdded ? 'none' : 'auto' }}>
                        <PaletteItem
                          comp={comp}
                          onDragStart={() => { draggingComp.current = comp; draggingAsset.current = null; }}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-light)', fontSize: 10, color: '#9CA3AF', textAlign: 'center', flexShrink: 0 }}>
                {ucpSidebar.components.length > 0
                  ? `From UCP · ${ucpSidebar.components.length} component${ucpSidebar.components.length !== 1 ? 's' : ''}`
                  : 'Drag onto canvas to add'}
              </div>
            </>
          )}

          {/* ── Tab: Content (UCP asset library) ─────────────────────────── */}
          {sidebarTab === 'content' && (
            <>
              <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  <input
                    value={contentSearch}
                    onChange={e => setContentSearch(e.target.value)}
                    placeholder="Search content..."
                    style={{ flex: 1, padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-family)', outline: 'none' }}
                  />
                  <button
                    onClick={ucpSidebar.refetchAssets}
                    title="Refresh from UCP"
                    style={{ padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}
                  >↻</button>
                </div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>
                  From UCP · {ucpSidebar.assets.length} asset{ucpSidebar.assets.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                {ucpSidebar.assetsLoading && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Loading from UCP…</div>
                  </div>
                )}
                {ucpSidebar.assetsError && (
                  <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 10, color: '#DC2626', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ UCP Unavailable</div>
                    <div>{ucpSidebar.assetsError}</div>
                    <button onClick={ucpSidebar.refetchAssets} style={{ marginTop: 8, padding: '4px 10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                  </div>
                )}
                {!ucpSidebar.assetsLoading && !ucpSidebar.assetsError && (() => {
                  const q = contentSearch.trim().toLowerCase();
                  const filtered = ucpSidebar.assets.filter(a =>
                    !q || a.name.toLowerCase().includes(q) || (a.tags ?? []).some(t => t.includes(q))
                  );
                  if (filtered.length === 0) return (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, padding: 16 }}>No content found</div>
                  );
                  // Group by asset type
                  const groups: Record<string, UCPContentAsset[]> = {};
                  filtered.forEach(a => { (groups[a.assetType] ??= []).push(a); });
                  return Object.entries(groups).map(([type, items]) => (
                    <div key={type} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, paddingLeft: 2 }}>
                        {ASSET_TYPE_ICON[type] ?? '📎'} {type}
                      </div>
                      {items.map(asset => (
                        <ContentAssetItem
                          key={asset.assetId}
                          asset={asset}
                          onDragStart={() => { draggingAsset.current = asset; draggingComp.current = null; }}
                        />
                      ))}
                    </div>
                  ));
                })()}
              </div>

              <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-light)', fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
                Drag video / image onto canvas
              </div>
            </>
          )}

        </div>

        {/* CENTER: Canvas */}
        <div
          style={{ flex: 1, display: 'flex', justifyContent: 'center', background: '#E5E7EB', overflowY: 'auto', padding: '24px 24px 40px' }}
          onClick={() => setSelectedSliceId(null)}
          onDragOver={editorReadOnly ? undefined : e => { e.preventDefault(); setDragOverIndex(slices.length); }}
          onDrop={editorReadOnly ? undefined : e => {
            e.preventDefault();
            if (draggingComp.current) { addSlice(draggingComp.current); draggingComp.current = null; }
            else if (draggingAsset.current) { addSliceFromAsset(draggingAsset.current); draggingAsset.current = null; }
            setDragOverIndex(null);
          }}
          onDragLeave={editorReadOnly ? undefined : () => setDragOverIndex(null)}
        >
          {/* Device frame */}
          <div style={{ width: 375, flexShrink: 0 }}>
            {/* Device top bar */}
            <div style={{ background: '#1A1A1A', borderRadius: '20px 20px 0 0', height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 60, height: 5, background: '#444', borderRadius: 3 }} />
            </div>
            {/* Screen area */}
            <div
              style={{ background: '#F9FAFB', border: '4px solid #1A1A1A', borderTop: 'none', borderRadius: '0 0 20px 20px', minHeight: 600, padding: '0 0 20px 0' }}
            >
              {slices.length === 0 && dragOverIndex === null && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9CA3AF', gap: 8 }}>
                  <div style={{ fontSize: 32 }}>📱</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{editorReadOnly ? 'No components' : 'Empty canvas'}</div>
                  {!editorReadOnly && <div style={{ fontSize: 11 }}>Drag components from the left panel</div>}
                </div>
              )}
              {previewContext && (
                <div style={{ margin: '6px 8px 0', padding: '4px 10px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#4338CA', textAlign: 'center' }}>
                  👤 {SEGMENT_META[previewContext.customerSegment].label} · {ACCOUNT_META[previewContext.accountType].icon} {ACCOUNT_META[previewContext.accountType].label} · {LOCATION_META[previewContext.customerLocation].flag} {LOCATION_META[previewContext.customerLocation].label} — rule-hidden components are dimmed
                </div>
              )}
              {slices.map((slice, i) => {
                const ruleHidden = previewContext !== null && !evaluateSliceVisible(slice, previewContext);
                return (
                  <div key={slice.instanceId} style={{ padding: '0 0', opacity: ruleHidden ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                    {!editorReadOnly && dragOverIndex === i && (
                      <div style={{ height: 4, background: '#DB0011', margin: '2px 8px', borderRadius: 2 }} />
                    )}
                    {slice.visibilityRule && (
                      <div style={{
                        margin: '4px 8px 0', padding: '2px 8px', borderRadius: '4px 4px 0 0',
                        background: ruleHidden ? '#FEE2E2' : '#FFFBEB',
                        border: `1px solid ${ruleHidden ? '#FECACA' : '#FDE68A'}`,
                        borderBottom: 'none', fontSize: 9, fontWeight: 700,
                        color: ruleHidden ? '#DC2626' : '#B45309',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        🎯 Rule: {slice.visibilityRule.label}
                      </div>
                    )}
                    <CanvasCard
                      slice={slice} index={i} total={slices.length}
                      selected={selectedSliceId === slice.instanceId}
                      readOnly={editorReadOnly}
                      onSelect={() => { setSelectedSliceId(slice.instanceId); setRightTab('props'); }}
                      onRemove={() => removeSlice(slice.instanceId)}
                      onToggleVisible={() => toggleVisible(slice.instanceId)}
                      onToggleLock={() => toggleLock(slice.instanceId)}
                      onMoveUp={() => moveSlice(i, i - 1)}
                      onMoveDown={() => moveSlice(i, i + 1)}
                      onDropAsset={slice.type === 'VIDEO_PLAYER' ? () => patchVideoSliceFromAsset(slice.instanceId) : undefined}
                    />
                  </div>
                );
              })}
              {!editorReadOnly && dragOverIndex === slices.length && (
                <div style={{ height: 4, background: '#DB0011', margin: '2px 8px', borderRadius: 2 }} />
              )}
            </div>
            {/* Bottom bar */}
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>
              {previewContext
                ? `${slices.filter(s => evaluateSliceVisible(s, previewContext)).length} of ${slices.length} visible · ${page.channel}`
                : `${slices.length} component${slices.length !== 1 ? 's' : ''} · ${page.channel}`
              }
            </div>
          </div>
        </div>

        {/* RIGHT: Prop editor (when slice selected) or page meta panel */}
        <div style={{ width: 260, flexShrink: 0, background: 'var(--surface-panel)', borderLeft: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedSliceId && slices.find(s => s.instanceId === selectedSliceId) ? (
            <>
              {/* Props / Rules tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                {(['props', 'rules'] as const).map(t => {
                  const selectedSlice = slices.find(s => s.instanceId === selectedSliceId)!;
                  const hasRule = !!selectedSlice.visibilityRule;
                  return (
                    <button key={t} onClick={() => setRightTab(t)} style={{
                      flex: 1, padding: '8px 4px', border: 'none', background: 'none',
                      fontSize: 11, fontWeight: rightTab === t ? 700 : 500,
                      color: rightTab === t ? '#DB0011' : '#6B7280',
                      borderBottom: rightTab === t ? '2px solid #DB0011' : '2px solid transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {t === 'props' ? '⚙️ Properties' : (
                        <>🎯 Rules{hasRule && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DB0011', display: 'inline-block' }} />}</>
                      )}
                    </button>
                  );
                })}
              </div>
              {rightTab === 'props' ? (
                <SlicePropEditor
                  slice={slices.find(s => s.instanceId === selectedSliceId)!}
                  readOnly={editorReadOnly}
                  onPropChange={(key, value) => updateSliceProp(selectedSliceId, key, value)}
                  onDeselect={() => setSelectedSliceId(null)}
                />
              ) : (
                <RuleConsolePanel
                  slice={slices.find(s => s.instanceId === selectedSliceId)!}
                  readOnly={editorReadOnly}
                  onRuleChange={rule => updateSliceRule(selectedSliceId, rule)}
                  onDeselect={() => setSelectedSliceId(null)}
                  previewContext={previewContext}
                />
              )}
            </>
          ) : (
            <MetaPanelWrapper
              page={page}
              isJourneyPage={isJourneyPage}
              readOnly={editorReadOnly}
              onSave={saveChanges}
              onScheduleChange={handleScheduleChange}
              onToggleNativeTarget={(t) => {
                const cur = page.nativeTargets ?? [];
                const next = cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t];
                dispatch({ type: 'EDIT_PAGE', pageId: page.pageId, updates: { nativeTargets: next } });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryPill({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '2px 7px', fontSize: 10, fontWeight: active ? 700 : 500,
      background: active ? '#DB0011' : '#F3F4F6', color: active ? '#fff' : '#6B7280',
      border: 'none', borderRadius: 4, cursor: 'pointer',
    }}>
      {label}
    </button>
  );
}

// Wrapper that manages local name/desc edits before saving
function MetaPanelWrapper({
  page, isJourneyPage, readOnly, onSave, onScheduleChange, onToggleNativeTarget,
}: {
  page: PageLayout; isJourneyPage: boolean; readOnly?: boolean;
  onSave: (name: string, description: string) => void;
  onScheduleChange: (s: CampaignSchedule | undefined) => void;
  onToggleNativeTarget: (t: 'ios' | 'android' | 'harmonynext' | 'web') => void;
}) {
  const [name, setName] = useState(page.name);
  const [desc, setDesc] = useState(page.description ?? '');

  // Keep local state in sync if page changes (e.g. switching pages)
  const lastPageId = useRef(page.pageId);
  if (lastPageId.current !== page.pageId) {
    lastPageId.current = page.pageId;
    setName(page.name);
    setDesc(page.description ?? '');
  }

  return (
    <MetaPanel
      page={{ ...page, name, description: desc }}
      isJourneyPage={isJourneyPage}
      readOnly={readOnly}
      onSave={() => onSave(name, desc)}
      onChangeName={setName}
      onChangeDesc={setDesc}
      onToggleNativeTarget={onToggleNativeTarget}
      campaignSchedule={page.campaignSchedule}
      onScheduleChange={onScheduleChange}
    />
  );
}
