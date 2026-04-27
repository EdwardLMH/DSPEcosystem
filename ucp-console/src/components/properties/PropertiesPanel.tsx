import React, { useCallback } from 'react';
import { useUCP } from '../../store/UCPStore';
import { SLICE_DEFINITIONS } from '../../utils/sliceDefinitions';
import { CanvasSlice } from '../../types/ucp';
import { Button } from '../shared/Button';

// ─── Field Components ─────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const style: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    padding: '7px 10px',
    fontSize: 13,
    color: 'var(--text-primary)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    resize: 'vertical' as const,
    fontFamily: 'var(--font-family)',
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={style}
        onFocus={e => (e.target.style.borderColor = 'var(--hsbc-red)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      onFocus={e => (e.target.style.borderColor = 'var(--hsbc-red)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
    />
  );
}

function NumberInput({ value, onChange, min, max, label }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: '100%', border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-md)',
        padding: '7px 10px', fontSize: 13, color: 'var(--text-primary)', background: '#fff',
        outline: 'none', boxSizing: 'border-box' as const,
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--hsbc-red)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
    />
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--hsbc-red)' : '#D1D5DB',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function ImageUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value && (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          <img src={value} alt="preview" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff',
              border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer',
            }}
          >Remove</button>
        </div>
      )}
      <label style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        border: '1.5px dashed var(--border-mid)', borderRadius: 'var(--radius-md)',
        padding: '10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--hsbc-red)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-mid)')}
      >
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        📁 {value ? 'Replace image' : 'Upload image'}
      </label>
      <TextInput value={value} onChange={onChange} placeholder="…or paste image URL" />
    </div>
  );
}

function ColorPickerField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="color"
        value={value || '#E8F4FD'}
        onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 30, border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
      />
      <TextInput value={value} onChange={onChange} placeholder="#E8F4FD" />
    </div>
  );
}

// ─── List editor for array fields ─────────────────────────────────────────────

function ListItem({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 10, marginBottom: 8, background: 'var(--surface-hover)', position: 'relative' }}>
      {children}
      <button onClick={onRemove} style={{ position: 'absolute', top: 6, right: 6, background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  );
}

// ─── Slice-specific editors ────────────────────────────────────────────────────

function HeaderNavEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <>
      <FieldGroup label="Search Placeholder"><TextInput value={props.searchPlaceholder ?? ''} onChange={v => onChange({ searchPlaceholder: v })} /></FieldGroup>
      <FieldGroup label="Options">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleField label="Show Notification Bell" checked={props.showNotificationBell ?? true} onChange={v => onChange({ showNotificationBell: v })} />
          <ToggleField label="Show QR Scanner" checked={props.showQRScanner ?? true} onChange={v => onChange({ showQRScanner: v })} />
        </div>
      </FieldGroup>
    </>
  );
}

function QuickAccessEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  const items: any[] = props.items ?? [];
  const updateItem = (i: number, field: string, val: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ items: next });
  };
  const removeItem = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const addItem = () => onChange({ items: [...items, { id: String(Date.now()), icon: '⭐', label: 'New Item', deepLink: 'hsbc://' }] });

  return (
    <>
      <FieldGroup label="Quick Access Items">
        {items.map((item: any, i: number) => (
          <ListItem key={item.id} onRemove={() => removeItem(i)}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: '0 0 60px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Icon</div>
                <TextInput value={item.icon} onChange={v => updateItem(i, 'icon', v)} placeholder="emoji/URL" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Label</div>
                <TextInput value={item.label} onChange={v => updateItem(i, 'label', v)} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Deep Link</div>
              <TextInput value={item.deepLink} onChange={v => updateItem(i, 'deepLink', v)} placeholder="hsbc://" />
            </div>
          </ListItem>
        ))}
        <Button size="sm" variant="secondary" icon="＋" onClick={addItem} fullWidth>Add Item</Button>
      </FieldGroup>
    </>
  );
}

function PromoBannerEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <>
      <FieldGroup label="Title"><TextInput value={props.title ?? ''} onChange={v => onChange({ title: v })} /></FieldGroup>
      <FieldGroup label="Subtitle"><TextInput value={props.subtitle ?? ''} onChange={v => onChange({ subtitle: v })} /></FieldGroup>
      <FieldGroup label="Badge Text (optional)"><TextInput value={props.badgeText ?? ''} onChange={v => onChange({ badgeText: v })} placeholder="每月10日開啓" /></FieldGroup>
      <FieldGroup label="CTA Label"><TextInput value={props.ctaLabel ?? ''} onChange={v => onChange({ ctaLabel: v })} /></FieldGroup>
      <FieldGroup label="CTA Deep Link"><TextInput value={props.ctaDeepLink ?? ''} onChange={v => onChange({ ctaDeepLink: v })} placeholder="hsbc://campaign/…" /></FieldGroup>
      <FieldGroup label="Background Colour"><ColorPickerField value={props.backgroundColor ?? '#E8F4FD'} onChange={v => onChange({ backgroundColor: v })} /></FieldGroup>
      <FieldGroup label="Banner Image"><ImageUploadField value={props.imageUrl ?? ''} onChange={v => onChange({ imageUrl: v })} /></FieldGroup>
    </>
  );
}

function AdBannerEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <>
      <FieldGroup label="Title"><TextInput value={props.title ?? ''} onChange={v => onChange({ title: v })} /></FieldGroup>
      <FieldGroup label="Subtitle (optional)"><TextInput value={props.subtitle ?? ''} onChange={v => onChange({ subtitle: v })} /></FieldGroup>
      <FieldGroup label="CTA Label"><TextInput value={props.ctaLabel ?? ''} onChange={v => onChange({ ctaLabel: v })} /></FieldGroup>
      <FieldGroup label="CTA Deep Link"><TextInput value={props.ctaDeepLink ?? ''} onChange={v => onChange({ ctaDeepLink: v })} placeholder="hsbc://…" /></FieldGroup>
      <FieldGroup label="Ad Image"><ImageUploadField value={props.imageUrl ?? ''} onChange={v => onChange({ imageUrl: v })} /></FieldGroup>
      <FieldGroup label="Valid Until (optional)"><TextInput value={props.validUntil ?? ''} onChange={v => onChange({ validUntil: v })} placeholder="2025-12-31" /></FieldGroup>
      <FieldGroup label="Options">
        <ToggleField label="Dismissible" checked={props.dismissible ?? true} onChange={v => onChange({ dismissible: v })} />
      </FieldGroup>
    </>
  );
}

function FunctionGridEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  const rows: any[][] = props.rows ?? [[]];

  const updateItem = (ri: number, ci: number, field: string, val: string) => {
    const next = rows.map((row, r) =>
      r === ri ? row.map((it, c) => c === ci ? { ...it, [field]: val } : it) : row
    );
    onChange({ rows: next });
  };

  const removeItem = (ri: number, ci: number) => {
    const next = rows.map((row, r) =>
      r === ri ? row.filter((_, c) => c !== ci) : row
    ).filter(row => row.length > 0);
    onChange({ rows: next.length ? next : [[]] });
  };

  const addItem = (ri: number) => {
    const next = rows.map((row, r) =>
      r === ri ? [...row, { id: String(Date.now()), icon: '⭐', label: '新功能', deepLink: 'hsbc://' }] : row
    );
    onChange({ rows: next });
  };

  const addRow = () => onChange({ rows: [...rows, [{ id: String(Date.now()), icon: '⭐', label: '新功能', deepLink: 'hsbc://' }]] });

  return (
    <FieldGroup label="Grid Rows">
      {rows.map((row, ri) => (
        <div key={ri} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Row {ri + 1}</div>
          {row.map((item: any, ci: number) => (
            <ListItem key={item.id} onRemove={() => removeItem(ri, ci)}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: '0 0 50px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Icon</div>
                  <TextInput value={item.icon} onChange={v => updateItem(ri, ci, 'icon', v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Label</div>
                  <TextInput value={item.label} onChange={v => updateItem(ri, ci, 'label', v)} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Deep Link</div>
                <TextInput value={item.deepLink} onChange={v => updateItem(ri, ci, 'deepLink', v)} placeholder="hsbc://" />
              </div>
            </ListItem>
          ))}
          <Button size="sm" variant="ghost" icon="＋" onClick={() => addItem(ri)}>Add item to row {ri + 1}</Button>
        </div>
      ))}
      <Button size="sm" variant="secondary" icon="＋" onClick={addRow} fullWidth>Add Row</Button>
    </FieldGroup>
  );
}

function FlashLoanEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <>
      <FieldGroup label="Product Name"><TextInput value={props.productName ?? ''} onChange={v => onChange({ productName: v })} /></FieldGroup>
      <FieldGroup label="Tagline"><TextInput value={props.tagline ?? ''} onChange={v => onChange({ tagline: v })} /></FieldGroup>
      <FieldGroup label="Max Amount"><NumberInput value={props.maxAmount ?? 300000} onChange={v => onChange({ maxAmount: v })} min={1000} /></FieldGroup>
      <FieldGroup label="Currency"><TextInput value={props.currency ?? 'HKD'} onChange={v => onChange({ currency: v })} /></FieldGroup>
      <FieldGroup label="CTA Label"><TextInput value={props.ctaLabel ?? ''} onChange={v => onChange({ ctaLabel: v })} /></FieldGroup>
      <FieldGroup label="CTA Deep Link"><TextInput value={props.ctaDeepLink ?? ''} onChange={v => onChange({ ctaDeepLink: v })} placeholder="hsbc://loan/…" /></FieldGroup>
    </>
  );
}

function WealthProductEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  const products: any[] = props.products ?? [];

  const updateProduct = (i: number, field: string, val: any) => {
    const next = products.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange({ products: next });
  };
  const removeProduct = (i: number) => onChange({ products: products.filter((_, idx) => idx !== i) });
  const addProduct = () => onChange({ products: [...products, { id: String(Date.now()), productName: '新產品', tag: '', yield7Day: '2.80%', riskLevel: 'R1', redemption: 'T+1', ctaLabel: '查看', ctaDeepLink: 'hsbc://wealth/', highlighted: false }] });

  return (
    <>
      <FieldGroup label="Section Title"><TextInput value={props.sectionTitle ?? ''} onChange={v => onChange({ sectionTitle: v })} /></FieldGroup>
      <FieldGroup label="More Deep Link"><TextInput value={props.moreDeepLink ?? ''} onChange={v => onChange({ moreDeepLink: v })} placeholder="hsbc://wealth/all" /></FieldGroup>
      <FieldGroup label="Products">
        {products.map((p: any, i: number) => (
          <ListItem key={p.id} onRemove={() => removeProduct(i)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <TextInput value={p.productName} onChange={v => updateProduct(i, 'productName', v)} placeholder="Product name" />
              <div style={{ display: 'flex', gap: 6 }}>
                <TextInput value={p.yield7Day ?? ''} onChange={v => updateProduct(i, 'yield7Day', v)} placeholder="7-day yield" />
                <TextInput value={p.riskLevel ?? ''} onChange={v => updateProduct(i, 'riskLevel', v)} placeholder="Risk level" />
              </div>
              <TextInput value={p.ctaDeepLink ?? ''} onChange={v => updateProduct(i, 'ctaDeepLink', v)} placeholder="hsbc://…" />
              <ToggleField label="Highlighted (red CTA)" checked={p.highlighted ?? false} onChange={v => updateProduct(i, 'highlighted', v)} />
            </div>
          </ListItem>
        ))}
        <Button size="sm" variant="secondary" icon="＋" onClick={addProduct} fullWidth>Add Product</Button>
      </FieldGroup>
    </>
  );
}

function RankingsEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  const items: any[] = props.items ?? [];
  const updateItem = (i: number, field: string, val: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ items: next });
  };
  const removeItem = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const addItem = () => onChange({ items: [...items, { id: String(Date.now()), icon: '🥇', badge: '新榜單', title: '新標題', description: '描述', ctaDeepLink: 'hsbc://rankings/' }] });

  return (
    <>
      <FieldGroup label="Section Title"><TextInput value={props.sectionTitle ?? ''} onChange={v => onChange({ sectionTitle: v })} /></FieldGroup>
      <FieldGroup label="Ranking Items">
        {items.map((item: any, i: number) => (
          <ListItem key={item.id} onRemove={() => removeItem(i)}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
              <div style={{ flex: '0 0 50px' }}><TextInput value={item.icon} onChange={v => updateItem(i, 'icon', v)} placeholder="emoji" /></div>
              <TextInput value={item.badge} onChange={v => updateItem(i, 'badge', v)} placeholder="Badge text" />
            </div>
            <TextInput value={item.title} onChange={v => updateItem(i, 'title', v)} placeholder="Title" />
            <div style={{ marginTop: 5 }}>
              <TextInput value={item.description} onChange={v => updateItem(i, 'description', v)} placeholder="Description" />
            </div>
          </ListItem>
        ))}
        <Button size="sm" variant="secondary" icon="＋" onClick={addItem} fullWidth>Add Ranking</Button>
      </FieldGroup>
    </>
  );
}

function LifeDealsEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  const deals: any[] = props.deals ?? [];
  const updateDeal = (i: number, field: string, val: string) => {
    const next = deals.map((d, idx) => idx === i ? { ...d, [field]: val } : d);
    onChange({ deals: next });
  };
  const removeDeal = (i: number) => onChange({ deals: deals.filter((_, idx) => idx !== i) });
  const addDeal = () => onChange({ deals: [...deals, { id: String(Date.now()), brandName: '新商家', logoUrl: '', tag: '優惠', ctaDeepLink: 'hsbc://deals/' }] });

  return (
    <>
      <FieldGroup label="Section Title"><TextInput value={props.sectionTitle ?? ''} onChange={v => onChange({ sectionTitle: v })} /></FieldGroup>
      <FieldGroup label="Deals">
        {deals.map((d: any, i: number) => (
          <ListItem key={d.id} onRemove={() => removeDeal(i)}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
              <TextInput value={d.brandName} onChange={v => updateDeal(i, 'brandName', v)} placeholder="Brand name" />
              <TextInput value={d.tag} onChange={v => updateDeal(i, 'tag', v)} placeholder="Tag" />
            </div>
            <div style={{ marginBottom: 5 }}><ImageUploadField value={d.logoUrl ?? ''} onChange={v => updateDeal(i, 'logoUrl', v)} /></div>
            <TextInput value={d.ctaDeepLink} onChange={v => updateDeal(i, 'ctaDeepLink', v)} placeholder="hsbc://deals/…" />
          </ListItem>
        ))}
        <Button size="sm" variant="secondary" icon="＋" onClick={addDeal} fullWidth>Add Deal</Button>
      </FieldGroup>
    </>
  );
}

function SpacerEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <FieldGroup label="Height (px)">
      <NumberInput value={props.height ?? 16} onChange={v => onChange({ height: v })} min={4} max={200} />
    </FieldGroup>
  );
}

function AIAssistantEditor({ props, onChange }: { props: any; onChange: (p: any) => void }) {
  return (
    <>
      <FieldGroup label="Greeting Text"><TextInput value={props.greeting ?? ''} onChange={v => onChange({ greeting: v })} /></FieldGroup>
      <FieldGroup label="Avatar Image (optional)"><ImageUploadField value={props.avatarUrl ?? ''} onChange={v => onChange({ avatarUrl: v })} /></FieldGroup>
    </>
  );
}

// ─── Main Properties Panel ────────────────────────────────────────────────────

export function PropertiesPanel() {
  const { state, dispatch } = useUCP();
  const { selectedInstanceId, layout } = state;

  const slice = layout.slices.find(s => s.instanceId === selectedInstanceId) as CanvasSlice | undefined;

  const updateProps = useCallback((partial: any) => {
    if (!slice) return;
    dispatch({ type: 'UPDATE_SLICE_PROPS', instanceId: slice.instanceId, props: partial });
  }, [slice, dispatch]);

  if (!slice) {
    return (
      <aside style={{
        width: 280,
        flexShrink: 0,
        background: 'var(--surface-panel)',
        borderLeft: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🖱️</div>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>No component selected</div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>Click a component on the canvas to edit its properties</div>
      </aside>
    );
  }

  const def = SLICE_DEFINITIONS[slice.type];
  const p = slice.props as any;

  function renderEditor() {
    switch (slice!.type) {
      case 'HEADER_NAV':       return <HeaderNavEditor    props={p} onChange={updateProps} />;
      case 'QUICK_ACCESS':     return <QuickAccessEditor  props={p} onChange={updateProps} />;
      case 'PROMO_BANNER':     return <PromoBannerEditor  props={p} onChange={updateProps} />;
      case 'FUNCTION_GRID':    return <FunctionGridEditor props={p} onChange={updateProps} />;
      case 'AI_ASSISTANT':     return <AIAssistantEditor  props={p} onChange={updateProps} />;
      case 'AD_BANNER':        return <AdBannerEditor     props={p} onChange={updateProps} />;
      case 'FLASH_LOAN':       return <FlashLoanEditor    props={p} onChange={updateProps} />;
      case 'WEALTH_SELECTION': return <WealthProductEditor props={p} onChange={updateProps} />;
      case 'FEATURED_RANKINGS':return <RankingsEditor     props={p} onChange={updateProps} />;
      case 'LIFE_DEALS':       return <LifeDealsEditor    props={p} onChange={updateProps} />;
      case 'SPACER':           return <SpacerEditor       props={p} onChange={updateProps} />;
      default: return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No editable properties</div>;
    }
  }

  return (
    <aside style={{
      width: 280,
      flexShrink: 0,
      background: 'var(--surface-panel)',
      borderLeft: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--surface-hover)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{def?.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{def?.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              {slice.instanceId.slice(0, 14)}…
            </div>
          </div>
        </div>

        {/* Visibility & Lock */}
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <Button
            size="sm"
            variant={slice.visible ? 'secondary' : 'ghost'}
            icon={slice.visible ? '👁' : '🙈'}
            onClick={() => dispatch({ type: 'TOGGLE_SLICE_VISIBLE', instanceId: slice.instanceId })}
          >
            {slice.visible ? 'Visible' : 'Hidden'}
          </Button>
          <Button
            size="sm"
            variant={slice.locked ? 'secondary' : 'ghost'}
            icon={slice.locked ? '🔒' : '🔓'}
            onClick={() => dispatch({ type: 'TOGGLE_SLICE_LOCK', instanceId: slice.instanceId })}
          >
            {slice.locked ? 'Locked' : 'Unlocked'}
          </Button>
        </div>
      </div>

      {/* Editor fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {renderEditor()}
      </div>

      {/* Delete footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
        <Button
          variant="danger"
          size="sm"
          icon="🗑"
          fullWidth
          onClick={() => dispatch({ type: 'REMOVE_SLICE', instanceId: slice.instanceId })}
        >
          Remove Component
        </Button>
      </div>
    </aside>
  );
}
