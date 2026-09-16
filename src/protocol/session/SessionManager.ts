/**
 * OptiShare Optical Transfer Protocol (OTP) Session Manager
 */

import { TransferSession } from './TransferSession';
import type { FileMetadata } from '../models/FileMetadata';
import type { SessionEvents } from '../types/protocolTypes';
import { generateSessionId } from '../utils/protocolUtils';

export class SessionManager {
  private static instance: SessionManager | null = null;
  private activeSession: TransferSession | null = null;

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initializes a new sender transfer session.
   *
   * @param metadata File metadata to transmit.
   * @param events Optional lifecycle event listeners.
   * @returns Active TransferSession instance.
   */
  public createSenderSession(metadata: FileMetadata, events: SessionEvents = {}): TransferSession {
    this.endActiveSession();

    const sessionId = generateSessionId();
    const session = new TransferSession(sessionId, 'sender', events);
    session.setMetadata(metadata);
    this.activeSession = session;
    return session;
  }

  /**
   * Initializes a new receiver transfer session.
   *
   * @param sessionId Session ID (or 0 if listening for initial handshake/file info).
   * @param events Optional lifecycle event listeners.
   * @returns Active TransferSession instance.
   */
  public createReceiverSession(sessionId = 0, events: SessionEvents = {}): TransferSession {
    this.endActiveSession();

    const sid = sessionId !== 0 ? sessionId : generateSessionId();
    const session = new TransferSession(sid, 'receiver', events);
    this.activeSession = session;
    return session;
  }

  /**
   * Gets current active session.
   */
  public getActiveSession(): TransferSession | null {
    return this.activeSession;
  }

  /**
   * Terminates and cleans up the active session.
   */
  public endActiveSession(): void {
    if (this.activeSession) {
      this.activeSession.destroy();
      this.activeSession = null;
    }
  }

  /**
   * Resets the singleton manager.
   */
  public static reset(): void {
    if (SessionManager.instance) {
      SessionManager.instance.endActiveSession();
      SessionManager.instance = null;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
