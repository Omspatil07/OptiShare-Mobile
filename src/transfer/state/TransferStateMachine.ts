/**
 * OptiShare Transfer State Machine
 *
 * Implements a strict, deterministic Finite State Machine (FSM)
 * governing optical transfer session lifecycle.
 */

import { TransferEngineState } from '../constants/transferConstants';
import type { ITransferStateMachineListener } from '../types/transferTypes';

export class TransferStateMachine {
  private _currentState: TransferEngineState = TransferEngineState.IDLE;
  private _lastState: TransferEngineState = TransferEngineState.IDLE;
  private _reason: string | null = null;
  private _lastTransitionTimeMs: number = Date.now();
  private readonly listeners: Set<ITransferStateMachineListener> = new Set();

  private static readonly VALID_TRANSITIONS: Record<
    TransferEngineState,
    ReadonlySet<TransferEngineState>
  > = {
    [TransferEngineState.IDLE]: new Set([
      TransferEngineState.PREPARING,
      TransferEngineState.HANDSHAKING,
      TransferEngineState.FAILED,
    ]),
    [TransferEngineState.PREPARING]: new Set([
      TransferEngineState.HANDSHAKING,
      TransferEngineState.TRANSFERRING,
      TransferEngineState.PAUSED,
      TransferEngineState.CANCELLED,
      TransferEngineState.FAILED,
    ]),
    [TransferEngineState.HANDSHAKING]: new Set([
      TransferEngineState.TRANSFERRING,
      TransferEngineState.PAUSED,
      TransferEngineState.CANCELLED,
      TransferEngineState.FAILED,
    ]),
    [TransferEngineState.TRANSFERRING]: new Set([
      TransferEngineState.PAUSED,
      TransferEngineState.FINALIZING,
      TransferEngineState.COMPLETED,
      TransferEngineState.CANCELLED,
      TransferEngineState.FAILED,
    ]),
    [TransferEngineState.PAUSED]: new Set([
      TransferEngineState.TRANSFERRING,
      TransferEngineState.CANCELLED,
      TransferEngineState.FAILED,
    ]),
    [TransferEngineState.FINALIZING]: new Set([
      TransferEngineState.COMPLETED,
      TransferEngineState.FAILED,
      TransferEngineState.CANCELLED,
    ]),
    [TransferEngineState.COMPLETED]: new Set([TransferEngineState.IDLE]),
    [TransferEngineState.CANCELLED]: new Set([TransferEngineState.IDLE]),
    [TransferEngineState.FAILED]: new Set([TransferEngineState.IDLE]),
  };

  constructor(initialState: TransferEngineState = TransferEngineState.IDLE) {
    this._currentState = initialState;
    this._lastState = initialState;
    this._lastTransitionTimeMs = Date.now();
  }

  public get currentState(): TransferEngineState {
    return this._currentState;
  }

  public get lastState(): TransferEngineState {
    return this._lastState;
  }

  public get lastTransitionTimeMs(): number {
    return this._lastTransitionTimeMs;
  }

  public get reason(): string | null {
    return this._reason;
  }

  public get isTerminal(): boolean {
    return (
      this._currentState === TransferEngineState.COMPLETED ||
      this._currentState === TransferEngineState.CANCELLED ||
      this._currentState === TransferEngineState.FAILED
    );
  }

  public get isActive(): boolean {
    return (
      this._currentState === TransferEngineState.PREPARING ||
      this._currentState === TransferEngineState.HANDSHAKING ||
      this._currentState === TransferEngineState.TRANSFERRING ||
      this._currentState === TransferEngineState.PAUSED ||
      this._currentState === TransferEngineState.FINALIZING
    );
  }

  /**
   * Checks whether transition to the target state is allowed from current state.
   */
  public canTransition(targetState: TransferEngineState): boolean {
    const validTargets = TransferStateMachine.VALID_TRANSITIONS[this._currentState];
    return validTargets ? validTargets.has(targetState) : false;
  }

  /**
   * Executes a state transition. Throws if transition is invalid.
   */
  public transition(targetState: TransferEngineState, reason?: string): void {
    if (!this.canTransition(targetState)) {
      throw new Error(
        `Invalid transfer state transition from ${this._currentState} to ${targetState}${
          reason ? ` (${reason})` : ''
        }`,
      );
    }

    const fromState = this._currentState;
    this._lastState = fromState;
    this._currentState = targetState;
    this._reason = reason ?? null;
    this._lastTransitionTimeMs = Date.now();

    this.notifyListeners(fromState, targetState, reason);
  }

  /**
   * Resets the state machine back to IDLE.
   */
  public reset(): void {
    const fromState = this._currentState;
    this._currentState = TransferEngineState.IDLE;
    this._lastState = fromState;
    this._reason = null;
    this._lastTransitionTimeMs = Date.now();
    this.notifyListeners(fromState, TransferEngineState.IDLE, 'State machine reset');
  }

  public addListener(listener: ITransferStateMachineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public removeListener(listener: ITransferStateMachineListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(
    from: TransferEngineState,
    to: TransferEngineState,
    reason?: string,
  ): void {
    for (const listener of this.listeners) {
      try {
        listener.onStateChange(from, to, reason);
      } catch (err) {
        // Prevent listener errors from breaking state machine execution
        console.error('Error in TransferStateMachine listener:', err);
      }
    }
  }
}
