import '@smartspectra/node-sdk/preload';
import { contextBridge, ipcRenderer } from 'electron';

export interface VitalFlowRuntimeInfo {
  isElectron: boolean;
  hasEnvApiKey: boolean;
  hasSessionApiKey: boolean;
  hasActiveApiKey: boolean;
  cameraConsentGranted: boolean;
  nodeVersion: string;
  electronVersion: string;
  sdkVersion: string;
}

contextBridge.exposeInMainWorld('__vitalflowElectron', {
  isElectron: true,
  getRuntimeInfo: (): Promise<VitalFlowRuntimeInfo> =>
    ipcRenderer.invoke('vitalflow:get-runtime-info'),
  authorizeCamera: (granted: boolean): Promise<boolean> =>
    ipcRenderer.invoke('vitalflow:authorize-camera', granted),
  setSessionApiKey: (key: string): Promise<boolean> =>
    ipcRenderer.invoke('vitalflow:set-session-api-key', key),
  clearSessionApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke('vitalflow:clear-session-api-key'),
  getSdkApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke('vitalflow:get-sdk-api-key'),
});
