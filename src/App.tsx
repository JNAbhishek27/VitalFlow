import { useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { useVitalFlowSession } from './hooks/useVitalFlowSession';
import { ConsentSetupScreen } from './pages/ConsentSetupScreen';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { MeasurementScreen } from './pages/MeasurementScreen';
import { PrivacyPage } from './pages/PrivacyPage';
import { SessionSummaryScreen } from './pages/SessionSummaryScreen';
import { WelcomeScreen } from './pages/WelcomeScreen';
import type { AppScreen } from './types/vitals';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const session = useVitalFlowSession();

  const handleNavigate = async (target: AppScreen) => {
    if (screen === 'measurement' && target !== 'measurement') {
      await session.stopSessionAndSummarize();
    } else if (screen === 'consent' && target !== 'consent' && target !== 'measurement') {
      await session.cancelSetup();
    }
    setScreen(target);
  };

  const handlePrimaryHeaderAction = async () => {
    if (screen === 'measurement') {
      await session.stopSessionAndSummarize();
      setScreen('summary');
      return;
    }
    if (screen === 'consent') {
      await session.cancelSetup();
    }
    setScreen('consent');
  };

  const handleStartExperience = () => {
    session.clearSessionData();
    setScreen('consent');
  };

  const handleBeginMeasurement = () => {
    session.beginMeasurement();
    setScreen('measurement');
  };

  const handleStopMeasurement = async () => {
    await session.stopSessionAndSummarize();
    setScreen('summary');
  };

  const handleClearSession = () => {
    session.clearSessionData();
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100">
      <HeaderNav
        activeScreen={screen}
        isSessionActive={screen === 'measurement'}
        onNavigate={(target) => {
          void handleNavigate(target);
        }}
        onPrimaryAction={() => {
          void handlePrimaryHeaderAction();
        }}
      />

      {screen === 'welcome' && (
        <WelcomeScreen
          isElectron={session.isElectron}
          onStartExperience={handleStartExperience}
          onNavigate={(target) => {
            void handleNavigate(target);
          }}
        />
      )}

      {screen === 'consent' && (
        <ConsentSetupScreen
          isElectron={session.isElectron}
          electronInfo={session.electronInfo}
          onRefreshElectronInfo={session.refreshElectronInfo}
          telemetryEnabled={session.telemetryEnabled}
          onToggleTelemetry={session.setTelemetryEnabled}
          cameraStream={session.cameraStream}
          cameraStatus={session.cameraStatus}
          cameraMessage={session.cameraMessage}
          sdkStatus={session.sdkStatus}
          validationGuidance={session.validationGuidance}
          errorInfo={session.errorInfo}
          dataSourceMode={session.dataSourceMode}
          onInitializeSetup={session.initializeSetup}
          onBeginMeasurement={handleBeginMeasurement}
          onCancelSetup={session.cancelSetup}
          onNavigate={(target) => {
            void handleNavigate(target);
          }}
        />
      )}

      {screen === 'measurement' && (
        <MeasurementScreen
          dataSourceMode={session.dataSourceMode}
          environmentTheme={session.environmentTheme}
          onChangeEnvironment={session.setEnvironmentTheme}
          cameraStream={session.cameraStream}
          cameraStatus={session.cameraStatus}
          cameraMessage={session.cameraMessage}
          sdkStatus={session.sdkStatus}
          validationGuidance={session.validationGuidance}
          rawMetrics={session.rawMetrics}
          errorInfo={session.errorInfo}
          elapsedSeconds={session.elapsedSeconds}
          processor={session.processorRef.current}
          onStopSession={() => {
            void handleStopMeasurement();
          }}
          onRestartSession={() => {
            void session.restartMeasurement();
          }}
        />
      )}

      {screen === 'summary' && (
        <SessionSummaryScreen
          summary={session.sessionSummary}
          onClearSession={handleClearSession}
          onStartNewSession={handleStartExperience}
        />
      )}

      {screen === 'privacy' && (
        <PrivacyPage
          telemetryEnabled={session.telemetryEnabled}
          onToggleTelemetry={session.setTelemetryEnabled}
          onClearSession={handleClearSession}
          onNavigate={(target) => {
            void handleNavigate(target);
          }}
        />
      )}

      {screen === 'how-it-works' && (
        <HowItWorksPage
          onNavigate={(target) => {
            void handleNavigate(target);
          }}
          onStartExperience={handleStartExperience}
        />
      )}
    </div>
  );
}
