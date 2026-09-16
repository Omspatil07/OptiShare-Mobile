/**
 * OptiShare Transfer Pipeline — Public API
 */

// Constants
export {
  PIPELINE_CONFIG,
  PipelineErrorCode,
  PipelineStageId,
  PipelineStatus,
} from './constants/pipelineConstants';

// Types
export type {
  IPipelineStage,
  PipelineFileMetadata,
  PipelineProgress,
  ReceiverPipelineConfig,
  ReceiverResult,
  SenderPipelineConfig,
} from './types/pipelineTypes';

// Sender Stages
export {
  SenderChunkingStage,
  type SenderChunkingInput,
  type SenderChunkingOutput,
} from './stages/sender/SenderChunkingStage';
export {
  SenderEncryptionStage,
  type SenderEncryptionInput,
  type SenderEncryptionOutput,
} from './stages/sender/SenderEncryptionStage';
export {
  SenderFountainStage,
  type SenderFountainInput,
  type SenderFountainOutput,
} from './stages/sender/SenderFountainStage';
export {
  SenderFramingStage,
  type SenderFramingInput,
  type SenderFramingOutput,
} from './stages/sender/SenderFramingStage';

// Receiver Stages
export {
  ReceiverValidationStage,
  type ReceiverValidationConfig,
  type ValidationOutput,
} from './stages/receiver/ReceiverValidationStage';
export {
  ReceiverFountainStage,
  type FountainProgressStatus,
  type ReceiverFountainOutput,
} from './stages/receiver/ReceiverFountainStage';
export {
  ReceiverDecryptionStage,
  type ReceiverDecryptionInput,
  type ReceiverDecryptionOutput,
} from './stages/receiver/ReceiverDecryptionStage';
export {
  ReceiverReconstructionStage,
  type ReceiverReconstructionInput,
  type ReceiverReconstructionOutput,
} from './stages/receiver/ReceiverReconstructionStage';

// Pipeline Orchestrators
export { SenderPipeline } from './sender/SenderPipeline';
export { ReceiverPipeline } from './receiver/ReceiverPipeline';

// Core Facade & Coordinator
export {
  type LoopbackTransferOptions,
  TransferPipelineCoordinator,
} from './core/TransferPipelineCoordinator';
