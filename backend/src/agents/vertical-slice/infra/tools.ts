import { Tool, ToolRegistry } from '../contracts';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

interface FileWriteInput {
  path: string;
  content: string;
}

/**
 * Small in-memory tool registry. Duplicate names are rejected so a tool
 * cannot be silently replaced during agent execution.
 */
export class SimpleToolRegistry implements ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): void {
    if (!tool.name.trim()) throw new Error('Tool name is required');
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): string[] {
    return [...this.tools.keys()];
  }
}

/** Writes files only inside the configured workspace root. */
export class FileWriteTool implements Tool {
  readonly name = 'file.write';
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async run(input: unknown): Promise<{ path: string; bytes: number }> {
    if (!input || typeof input !== 'object') {
      throw new Error('file.write expects an object input');
    }

    const { path, content } = input as Partial<FileWriteInput>;
    if (typeof path !== 'string' || !path.trim() || isAbsolute(path)) {
      throw new Error('file.write path must be a non-empty relative path');
    }
    if (typeof content !== 'string') {
      throw new Error('file.write content must be a string');
    }

    const target = resolve(this.root, path);
    const rel = relative(this.root, target);
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      throw new Error('file.write path escapes the workspace root');
    }

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
    return { path: target, bytes: Buffer.byteLength(content, 'utf8') };
  }
}

export interface ShellRunInput {
  cmd: string;
  args?: string[];
}

export interface ShellRunResult {
  code: number | null;
  out: string;
  err: string;
  timedOut: boolean;
}

/**
 * Executes a command without a shell, with an explicit command allowlist,
 * timeout and bounded output. This is NOT an OS-level sandbox: only use it
 * with a disposable workspace and trusted commands until a real sandbox
 * backend is integrated.
 */
export class ShellTool implements Tool {
  readonly name = 'shell.run';
  private readonly cwd: string;
  private readonly allowedCommands: Set<string>;

  constructor(
    cwd: string,
    private readonly timeoutMs = 30_000,
    allowedCommands: string[] = ['node'],
    private readonly maxOutputBytes = 1024 * 1024,
  ) {
    this.cwd = resolve(cwd);
    this.allowedCommands = new Set(allowedCommands);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error('ShellTool timeoutMs must be a positive number');
    }
  }

  async run(input: unknown): Promise<ShellRunResult> {
    if (!input || typeof input !== 'object') {
      throw new Error('shell.run expects an object input');
    }

    const { cmd, args = [] } = input as Partial<ShellRunInput>;
    if (typeof cmd !== 'string' || !this.allowedCommands.has(cmd)) {
      throw new Error(`Command is not allowed: ${String(cmd)}`);
    }
    if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
      throw new Error('shell.run args must be an array of strings');
    }

    return new Promise<ShellRunResult>((resolvePromise, rejectPromise) => {
      const child = spawn(cmd, args, {
        cwd: this.cwd,
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let out = '';
      let err = '';
      let outputBytes = 0;
      let timedOut = false;
      let settled = false;

      const append = (target: 'out' | 'err', chunk: Buffer): void => {
        if (outputBytes >= this.maxOutputBytes) return;
        const remaining = this.maxOutputBytes - outputBytes;
        const accepted = chunk.subarray(0, remaining);
        outputBytes += accepted.length;
        if (target === 'out') out += accepted.toString('utf8');
        else err += accepted.toString('utf8');
      };

      child.stdout.on('data', (chunk: Buffer) => append('out', chunk));
      child.stderr.on('data', (chunk: Buffer) => append('err', chunk));

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, this.timeoutMs);

      child.once('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        rejectPromise(error);
      });

      child.once('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolvePromise({ code, out, err, timedOut });
      });
    });
  }
}
