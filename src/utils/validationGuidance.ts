import {
  ProcessingStatus,
  SmartSpectraErrorCode,
  ValidationCode,
} from '@smartspectra/node-sdk/renderer';
import type {
  SdkErrorInfo,
  SdkLifecycleState,
  ValidationGuidance,
} from '../types/vitals';

export function mapProcessingStatus(status: number): SdkLifecycleState {
  switch (status) {
    case ProcessingStatus.kIdle:
      return 'idle';
    case ProcessingStatus.kStarting:
      return 'starting';
    case ProcessingStatus.kRunning:
      return 'running';
    case ProcessingStatus.kStopping:
      return 'stopping';
    case ProcessingStatus.kError:
      return 'error';
    case ProcessingStatus.kUninitialized:
    default:
      return 'uninitialized';
  }
}

export function mapValidationStatus(
  code: number,
  timestampUs: number | null,
  sdkHint: string,
): ValidationGuidance {
  const hint = sdkHint?.trim();

  switch (code) {
    case ValidationCode.kOk:
      return {
        code,
        severity: 'optimal',
        title: 'Signal Conditions Optimal',
        guidance: hint || 'Face and lighting are well balanced for optical sensing.',
        lightingStatus: 'good',
        positioningStatus: 'centered',
        timestampUs,
      };
    case ValidationCode.kNoFaceFound:
      return {
        code,
        severity: 'blocked',
        title: 'Face Not Detected',
        guidance: hint || 'Position your face comfortably in front of the camera.',
        lightingStatus: 'unknown',
        positioningStatus: 'not-detected',
        timestampUs,
      };
    case ValidationCode.kMultipleFacesFound:
      return {
        code,
        severity: 'blocked',
        title: 'Multiple Faces in Frame',
        guidance: hint || 'Ensure only one person is centered in the camera view.',
        lightingStatus: 'unknown',
        positioningStatus: 'adjust',
        timestampUs,
      };
    case ValidationCode.kFaceNotCentered:
    case ValidationCode.kFaceTooHigh:
    case ValidationCode.kFaceTooLow:
    case ValidationCode.kFaceNotForward:
      return {
        code,
        severity: 'adjust',
        title: 'Adjust Face Alignment',
        guidance: hint || 'Center your face and look comfortably toward the camera.',
        lightingStatus: 'good',
        positioningStatus: 'adjust',
        timestampUs,
      };
    case ValidationCode.kFaceTooClose:
    case ValidationCode.kFaceTooFar:
    case ValidationCode.kFaceSizeOutOfRange:
      return {
        code,
        severity: 'adjust',
        title: code === ValidationCode.kFaceTooClose ? 'Slightly Too Close' : 'Move Slightly Closer',
        guidance:
          hint ||
          (code === ValidationCode.kFaceTooClose
            ? 'Move back slightly so your head and upper shoulders fit comfortably.'
            : 'Move a little closer to the camera for clearer optical capture.'),
        lightingStatus: 'good',
        positioningStatus: 'adjust',
        timestampUs,
      };
    case ValidationCode.kTooDark:
      return {
        code,
        severity: 'blocked',
        title: 'Insufficient Lighting',
        guidance: hint || 'Increase soft front-facing light so your face is evenly illuminated.',
        lightingStatus: 'too-dark',
        positioningStatus: 'centered',
        timestampUs,
      };
    case ValidationCode.kTooBright:
      return {
        code,
        severity: 'adjust',
        title: 'Lighting Too Bright',
        guidance: hint || 'Reduce harsh direct glare or backlighting behind you.',
        lightingStatus: 'too-bright',
        positioningStatus: 'centered',
        timestampUs,
      };
    case ValidationCode.kChestNotVisible:
      return {
        code,
        severity: 'adjust',
        title: 'Upper Torso Partially Outside Frame',
        guidance: hint || 'Angle the camera slightly so your upper chest is visible for breathing tracking.',
        lightingStatus: 'good',
        positioningStatus: 'adjust',
        timestampUs,
      };
    case ValidationCode.kCameraTuning:
      return {
        code,
        severity: 'adjust',
        title: 'Camera Exposure Settling',
        guidance: hint || 'Hold steady briefly while camera exposure stabilizes.',
        lightingStatus: 'unknown',
        positioningStatus: 'centered',
        timestampUs,
      };
    case ValidationCode.kFrameRateTooLow:
      return {
        code,
        severity: 'adjust',
        title: 'Low Camera Frame Rate',
        guidance: hint || 'Close heavy background video apps or brighten the room for faster shutter speed.',
        lightingStatus: 'unknown',
        positioningStatus: 'centered',
        timestampUs,
      };
    case ValidationCode.kExcessiveMotion:
      return {
        code,
        severity: 'adjust',
        title: 'Motion Detected',
        guidance: hint || 'Rest comfortably and minimize head or shoulder movement.',
        lightingStatus: 'good',
        positioningStatus: 'adjust',
        timestampUs,
      };
    default:
      return {
        code,
        severity: 'unknown',
        title: 'Calibrating Sensor',
        guidance: hint || 'Checking camera framing and illumination.',
        lightingStatus: 'unknown',
        positioningStatus: 'unknown',
        timestampUs,
      };
  }
}

export function mapSdkError(
  code: number,
  message: string,
  retryable: boolean,
): SdkErrorInfo {
  let recoveryHint = 'Verify your camera connection and try restarting the session.';

  switch (code) {
    case SmartSpectraErrorCode.kAuthenticationFailed:
      recoveryHint =
        'Your Presage SmartSpectra API key could not be authenticated. Check SMARTSPECTRA_API_KEY in your Electron environment or enter a valid session key.';
      break;
    case SmartSpectraErrorCode.kCreditExhausted:
      recoveryHint =
        'Your Presage SmartSpectra API credits appear exhausted. Verify your account quota in the Presage developer portal.';
      break;
    case SmartSpectraErrorCode.kNetworkError:
    case SmartSpectraErrorCode.kServerError:
      recoveryHint =
        'Network connection to Presage verification servers was interrupted. Check internet connectivity and retry.';
      break;
    case SmartSpectraErrorCode.kInputUnavailable:
      recoveryHint =
        'No active camera stream could be read. Ensure no other application is locking the camera.';
      break;
    case SmartSpectraErrorCode.kMetricNotAuthorized:
      recoveryHint =
        'One or more requested metrics are not authorized for this API key.';
      break;
    case SmartSpectraErrorCode.kSustainedLowFrameRate:
      recoveryHint =
        'Camera frame rate remained too low for reliable optical sensing. Improve room lighting and retry.';
      break;
    case SmartSpectraErrorCode.kConfigurationFailed:
      recoveryHint =
        'SDK configuration could not be applied. Restart the session to reinitialize.';
      break;
    default:
      break;
  }

  return {
    code,
    message: message || 'SmartSpectra SDK encountered an unexpected state.',
    retryable,
    recoveryHint,
  };
}
