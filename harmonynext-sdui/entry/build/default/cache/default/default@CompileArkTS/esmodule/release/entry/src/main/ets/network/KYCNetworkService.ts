import http from "@ohos:net.http";
import type { StartSessionResponse, SDUIScreenPayload, SubmitRequest, SubmitResponse } from '../models/SDUIModels';
const BASE_URL = 'http://10.0.2.2:4000/api/v1';
async function doRequest<m39>(n39: http.RequestMethod, o39: string, p39: Record<string, string>, q39?: string): Promise<m39> {
    const r39 = http.createHttp();
    const s39: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    Object.keys(p39).forEach((u39: string) => {
        s39[u39] = p39[u39];
    });
    const t39 = await r39.request(BASE_URL + o39, {
        method: n39,
        header: s39,
        extraData: q39
    });
    r39.destroy();
    if (typeof t39.result === 'string') {
        return JSON.parse(t39.result) as m39;
    }
    throw new Error(`HTTP ${t39.responseCode}: unexpected response`);
}
export async function startSession(l39: string): Promise<StartSessionResponse> {
    return doRequest<StartSessionResponse>(http.RequestMethod.POST, '/kyc/sessions/start', { 'x-platform': l39 }, JSON.stringify({ journeyType: 'PERSONAL_ACCOUNT_OPENING', market: 'HK' }));
}
export async function resume(j39: string, k39: string): Promise<SDUIScreenPayload> {
    return doRequest<SDUIScreenPayload>(http.RequestMethod.GET, `/kyc/sessions/${j39}/resume`, { 'x-platform': k39, 'x-sdui-version': '2.3' });
}
export async function getStep(g39: string, h39: string, i39: string): Promise<SDUIScreenPayload> {
    return doRequest<SDUIScreenPayload>(http.RequestMethod.GET, `/kyc/sessions/${g39}/steps/${h39}`, { 'x-platform': i39, 'x-sdui-version': '2.3' });
}
export async function submitStep(d39: string, e39: string, f39: SubmitRequest): Promise<SubmitResponse> {
    return doRequest<SubmitResponse>(http.RequestMethod.POST, `/kyc/sessions/${d39}/steps/${e39}/submit`, {}, JSON.stringify(f39));
}
