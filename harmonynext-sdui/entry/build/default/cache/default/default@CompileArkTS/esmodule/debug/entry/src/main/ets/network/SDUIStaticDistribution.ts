import http from "@ohos:net.http";
import preferences from "@ohos:data.preferences";
import fileio from "@ohos:fileio";
import cryptoFramework from "@ohos:security.cryptoFramework";
import util from "@ohos:util";
// ─── Configuration ────────────────────────────────────────────────────────────
const CDN_BASE = 'https://cdn.hsbc.com/sdui';
const APP_ID = 'hsbcmobile';
const PLATFORM = 'harmonynext';
const PREFS_STORE = 'sdui_static';
const VERSION_PREFIX = 'sdui_version_';
const SELF_PICK_PRE = 'selfPick_';
// ─── Manifest types ───────────────────────────────────────────────────────────
interface SDUIManifest {
    schemaVersion: string;
    generatedAt: string;
    screens: Record<string, SDUIScreenEntry>;
    selfPickForceUpdate: boolean;
}
interface SDUIScreenEntry {
    version: string;
    etag: string;
    sizeBytes: number;
}
interface SelfPickEntry {
    items: Record<string, string>[];
    savedAt: string;
}
interface ResolveResult {
    json: string | null;
    isStale: boolean;
}
// ─── SDUIStaticDistribution ───────────────────────────────────────────────────
export class SDUIStaticDistribution {
    private userId: string;
    private cacheDir: string; // absolute path to writable cache directory
    private context: Context;
    constructor(context: Context, userId: string) {
        this.context = context;
        this.userId = userId;
        this.cacheDir = context.cacheDir + '/SDUI';
        // Ensure cache directory exists
        try {
            fileio.mkdirSync(this.cacheDir);
        }
        catch (_e) { /* already exists */ }
    }
    // ── Public API ─────────────────────────────────────────────────────────────
    /**
     * Resolves the best available SDUI JSON string for screenId.
     * Returns { json, isStale } — isStale=true when served from local/bundled.
     */
    async resolve(screenId: string): Promise<ResolveResult> {
        // Step 1 — try CDN manifest
        const manifest = await this.fetchManifest();
        if (manifest !== null) {
            const entry = manifest.screens[screenId];
            if (entry !== undefined) {
                const storedVersion = await this.readVersion(screenId);
                if (storedVersion === entry.version) {
                    const local = this.loadLocalFile(screenId);
                    if (local !== null) {
                        const r: ResolveResult = { json: local, isStale: false };
                        return r;
                    }
                }
                // Version changed or no local file — download from CDN
                const downloaded = await this.downloadScreen(screenId, entry.version, entry.etag);
                if (downloaded !== null) {
                    this.persistLocalFile(screenId, downloaded);
                    await this.writeVersion(screenId, entry.version);
                    const r: ResolveResult = { json: downloaded, isStale: false };
                    return r;
                }
                // Download failed — keep existing local copy
                console.warn(`[SDUI] CDN download failed for screen '${screenId}' v${entry.version}`);
            }
        }
        // Step 3 — CDN unreachable or no entry
        const local = this.loadLocalFile(screenId);
        if (local !== null) {
            const r: ResolveResult = { json: local, isStale: true };
            return r;
        }
        // Last resort — bundled rawfile baseline
        const bundled = this.loadBundledBaseline(screenId);
        const r: ResolveResult = { json: bundled, isStale: true };
        return r;
    }
    /**
     * Returns resolved self-pick items for the SELF_PICK_ENTRY_POINTS slice.
     * Clears and returns remote defaults when forceUpdate is true.
     */
    async resolvedSelfPickItems(screenId: string, remoteDefaults: Record<string, string>[], forceUpdate: boolean): Promise<Record<string, string>[]> {
        const key = `${SELF_PICK_PRE}${this.userId}_${screenId}`;
        const store = await this.openPrefs();
        if (forceUpdate) {
            store.delete(key);
            await store.flush();
            return remoteDefaults;
        }
        const raw = store.getSync(key, '') as string;
        if (!raw)
            return remoteDefaults;
        try {
            const entry: SelfPickEntry = JSON.parse(raw) as SelfPickEntry;
            return entry.items ?? remoteDefaults;
        }
        catch (e) {
            return remoteDefaults;
        }
    }
    /** Persists customer self-pick ordering to preferences store. */
    async saveCustomerSelfPick(screenId: string, items: Record<string, string>[]): Promise<void> {
        const key = `${SELF_PICK_PRE}${this.userId}_${screenId}`;
        const entry: SelfPickEntry = { items, savedAt: new Date().toISOString() };
        const store = await this.openPrefs();
        store.putSync(key, JSON.stringify(entry));
        await store.flush();
    }
    // ── Manifest ───────────────────────────────────────────────────────────────
    private async fetchManifest(): Promise<SDUIManifest | null> {
        const client = http.createHttp();
        try {
            const resp = await client.request(`${CDN_BASE}/${APP_ID}/${PLATFORM}/manifest.json`, { method: http.RequestMethod.GET, connectTimeout: 8000, readTimeout: 8000 });
            if (resp.responseCode !== 200)
                return null;
            return JSON.parse(resp.result as string) as SDUIManifest;
        }
        catch (e) {
            return null;
        }
        finally {
            client.destroy();
        }
    }
    // ── CDN Download ───────────────────────────────────────────────────────────
    private async downloadScreen(screenId: string, version: string, etag: string): Promise<string | null> {
        const client = http.createHttp();
        try {
            const resp = await client.request(`${CDN_BASE}/${APP_ID}/${PLATFORM}/${screenId}/${version}.json`, { method: http.RequestMethod.GET, connectTimeout: 15000, readTimeout: 15000 });
            if (resp.responseCode !== 200)
                return null;
            const body = resp.result as string;
            const stripped = etag.replace(/"/g, '');
            const computed = await this.sha256Hex(body);
            if (computed.toLowerCase() !== stripped.toLowerCase()) {
                console.error(`[SDUI] Integrity fail for '${screenId}': expected ${stripped}, got ${computed}`);
                return null;
            }
            return body;
        }
        catch (e) {
            return null;
        }
        finally {
            client.destroy();
        }
    }
    // ── Local File Cache (fileio) ──────────────────────────────────────────────
    private localFilePath(screenId: string): string {
        return `${this.cacheDir}/${screenId}.json`;
    }
    private loadLocalFile(screenId: string): string | null {
        try {
            const fd = fileio.openSync(this.localFilePath(screenId), 0o0); // O_RDONLY
            const stat = fileio.fstatSync(fd);
            const buf = new ArrayBuffer(stat.size);
            fileio.readSync(fd, buf);
            fileio.closeSync(fd);
            return String.fromCharCode(...new Uint8Array(buf));
        }
        catch (e) {
            return null;
        }
    }
    private persistLocalFile(screenId: string, json: string): void {
        try {
            const encoder = new util.TextEncoder();
            const bytes = encoder.encodeInto(json);
            const fd = fileio.openSync(this.localFilePath(screenId), 0o102, 0o666); // O_CREAT|O_WRONLY
            fileio.writeSync(fd, bytes.buffer);
            fileio.closeSync(fd);
        }
        catch (e) { /* ignore write failure */ }
    }
    // ── Preferences (version store) ────────────────────────────────────────────
    private async openPrefs(): Promise<preferences.Preferences> {
        return preferences.getPreferences(this.context, PREFS_STORE);
    }
    private async readVersion(screenId: string): Promise<string | null> {
        const store = await this.openPrefs();
        const val = store.getSync(VERSION_PREFIX + screenId, '') as string;
        return val || null;
    }
    private async writeVersion(screenId: string, version: string): Promise<void> {
        const store = await this.openPrefs();
        store.putSync(VERSION_PREFIX + screenId, version);
        await store.flush();
    }
    // ── Bundled Baseline (rawfile) ─────────────────────────────────────────────
    private loadBundledBaseline(screenId: string): string | null {
        try {
            // Baseline files stored as: resources/rawfile/sdui_baseline_{screenId}.json
            const rm = this.context.resourceManager;
            const name = `sdui_baseline_${screenId.replace(/-/g, '_')}.json`;
            const buf = rm.getRawFileContentSync(name);
            return String.fromCharCode(...buf);
        }
        catch (e) {
            return null;
        }
    }
    // ── SHA-256 ────────────────────────────────────────────────────────────────
    private async sha256Hex(text: string): Promise<string> {
        try {
            const md = cryptoFramework.createMd('SHA256');
            const enc = new util.TextEncoder();
            await md.update({ data: enc.encodeInto(text) });
            const digest = await md.digest();
            const bytes = new Uint8Array(digest.data);
            return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        }
        catch (e) {
            return '';
        }
    }
}
