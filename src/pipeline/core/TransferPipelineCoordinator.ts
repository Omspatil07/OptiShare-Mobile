/**
 * OptiShare Transfer Pipeline Coordinator
 *
 * Coordinates end-to-end sender and receiver pipelines, provides factory methods,
 * and includes a comprehensive loopback simulation engine for testing, diagnostics, and benchmarking.
 */

import { ReceiverPipeline } from '../receiver/ReceiverPipeline';
import { SenderPipeline } from '../sender/SenderPipeline';
import type {
  ReceiverPipelineConfig,
  ReceiverResult,
  SenderPipelineConfig,
} from '../types/pipelineTypes';

export interface LoopbackTransferOptions {
  readonly fileName: string;
  readonly fileData: Uint8Array;
  readonly mimeType?: string;
  readonly cryptoKey?: CryptoKey | null;
  readonly aad?: Uint8Array;
  readonly symbolSize?: number;
  readonly lossRate?: number;
  readonly corruptionRate?: number;
  readonly redundancyFactor?: number;
  readonly saveDirectory?: string;
}

export class TransferPipelineCoordinator {
  /**
   * Factory to create an initialized SenderPipeline instance.
   */
  public static async createSender(config: SenderPipelineConfig): Promise<SenderPipeline> {
    const sender = new SenderPipeline(config);
    await sender.initialize();
    return sender;
  }

  /**
   * Factory to create a ReceiverPipeline instance.
   */
  public static createReceiver(config: ReceiverPipelineConfig = {}): ReceiverPipeline {
    return new ReceiverPipeline(config);
  }

  /**
   * Runs an end-to-end loopback transfer between Sender and Receiver pipelines in memory.
   * Can simulate lossy optical channels (e.g. 25% dropped frames) or corrupted packets.
   */
  public static async runLoopbackTransfer(
    options: LoopbackTransferOptions,
  ): Promise<ReceiverResult> {
    const {
      fileName,
      fileData,
      mimeType,
      cryptoKey,
      aad,
      symbolSize,
      lossRate = 0,
      corruptionRate = 0,
      redundancyFactor = 1.6,
      saveDirectory,
    } = options;

    return new Promise<ReceiverResult>((resolve, reject) => {
      let resolved = false;

      const receiver = this.createReceiver({
        cryptoKey,
        aad,
        saveDirectory,
        onComplete: (result) => {
          if (!resolved) {
            resolved = true;
            sender.reset();
            receiver.reset();
            resolve(result);
          }
        },
        onError: (err, _code) => {
          if (!resolved) {
            resolved = true;
            sender.reset();
            receiver.reset();
            reject(err);
          }
        },
      });

      let sender: SenderPipeline;

      this.createSender({
        fileName,
        fileData,
        mimeType,
        cryptoKey,
        aad,
        symbolSize,
        redundancyFactor,
        onError: (err, _code) => {
          if (!resolved) {
            resolved = true;
            receiver.reset();
            reject(err);
          }
        },
      })
        .then((createdSender) => {
          sender = createdSender;

          // Dispatch frames step by step through simulated channel
          const maxSteps = sender.framesTotal * 3;
          let stepCount = 0;

          const pump = async () => {
            while (!resolved && stepCount < maxSteps) {
              stepCount++;
              const frame = sender.step();
              if (!frame) {
                break;
              }

              // Frame 0 (metadata) should rarely be dropped in loopback or is re-announced
              const isMetadata = stepCount === 1;

              // Channel simulation: packet loss
              if (!isMetadata && lossRate > 0 && Math.random() < lossRate) {
                continue; // Packet dropped by optical channel
              }

              // Channel simulation: packet corruption
              let transmittedFrame = frame;
              if (!isMetadata && corruptionRate > 0 && Math.random() < corruptionRate) {
                transmittedFrame = new Uint8Array(frame);
                // Invert one byte
                const corruptIdx = Math.floor(Math.random() * transmittedFrame.length);
                // eslint-disable-next-line no-bitwise
                transmittedFrame[corruptIdx] = (transmittedFrame[corruptIdx] ?? 0) ^ 0xff;
              }

              await receiver.ingestFrame(transmittedFrame);

              if (resolved) {
                return;
              }
            }

            if (!resolved) {
              reject(
                new Error(
                  `Loopback transfer timed out or ran out of frames after ${stepCount} steps.`,
                ),
              );
            }
          };

          pump().catch(reject);
        })
        .catch(reject);
    });
  }
}
