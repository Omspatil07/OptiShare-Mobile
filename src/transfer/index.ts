/**
 * OptiShare Transfer Engine — Public API
 */

// Constants
export {
  TRANSFER_CONFIG,
  TransferEngineState,
  TransferErrorCode,
  TransferMode,
  TransferRole,
} from './constants/transferConstants';

// Types
export type {
  ITransferStateMachineListener,
  TransferEngineOptions,
  TransferMetricsSnapshot,
  TransferReceiverOptions,
  TransferSenderOptions,
  TransferSessionInfo,
} from './types/transferTypes';

// State Machine
export { TransferStateMachine } from './state/TransferStateMachine';

// Metrics
export { TransferMetrics } from './metrics/TransferMetrics';

// Sender Pipeline
export { FrameDispatcher } from './sender/FrameDispatcher';
export type { FrameSupplier } from './sender/FrameDispatcher';
export { TransferSender } from './sender/TransferSender';

// Receiver Pipeline
export { FrameProcessor } from './receiver/FrameProcessor';
export type { ProcessedFrame } from './receiver/FrameProcessor';
export { TransferReceiver } from './receiver/TransferReceiver';

// Core Facade
export { TransferEngine, transferEngine } from './core/TransferEngine';
