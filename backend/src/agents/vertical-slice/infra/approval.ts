import { ApprovalManager } from '../contracts';

/**
 * MVP approval policy.
 *
 * Non-sensitive actions pass by default. Sensitive actions are denied unless
 * the operator explicitly enables SINA_AUTO_APPROVE=1 for this process.
 * Never set that environment variable in production or CI.
 */
export class PolicyApproval implements ApprovalManager {
  private readonly sensitive: Set<string>;

  constructor(sensitive: Iterable<string> = ['shell.run']) {
    this.sensitive = new Set(sensitive);
  }

  async require(action: string, _payload: unknown): Promise<boolean> {
    if (!action.trim()) {
      console.warn('[approval] blocked empty action name');
      return false;
    }

    if (!this.sensitive.has(action)) {
      return true;
    }

    if (process.env.SINA_AUTO_APPROVE === '1') {
      console.warn(`[approval] explicitly auto-approved sensitive action "${action}"`);
      return true;
    }

    console.warn(
      `[approval] blocked sensitive action "${action}" — explicit approval is required`,
    );
    return false;
  }
}
