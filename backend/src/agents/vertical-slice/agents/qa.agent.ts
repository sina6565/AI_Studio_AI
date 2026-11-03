import ts from 'typescript';
import { Agent, AgentContext, AgentResult, Task } from '../contracts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface AddArtifact {
  name?: string;
  content?: string;
}

/**
 * Deterministic QA for the vertical-slice add example.
 * Parses the generated TypeScript and interprets only the restricted "a + b"
 * AST expression. It never evaluates model-generated JavaScript or runs a shell.
 */
export class QAAgent implements Agent {
  readonly id = 'qa';
  readonly capabilities = ['test.write', 'test.run'];

  async handle(task: Task, ctx: AgentContext): Promise<AgentResult> {
    const span = ctx.monitor.start(ctx.runId, this.id, task.id);
    const startedAt = Date.now();

    try {
      const input = task.input as { artifact?: AddArtifact } | undefined;
      const artifact = input?.artifact;
      if (!artifact || typeof artifact.content !== 'string') {
        throw new Error('QA: missing source artifact from CodingAgent');
      }

      const source = ts.createSourceFile(
        'add.ts',
        artifact.content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      if (source.parseDiagnostics.length > 0) {
        throw new Error('QA: generated source contains TypeScript syntax errors');
      }

      const declaration = source.statements.find(
        (statement): statement is ts.FunctionDeclaration =>
          ts.isFunctionDeclaration(statement) &&
          statement.name?.text === 'add' &&
          statement.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
          ) === true,
      );

      if (!declaration || declaration.parameters.length !== 2 || !declaration.body) {
        throw new Error('QA: expected exported add(a, b) function with two parameters');
      }

      const [first, second] = declaration.parameters;
      if (
        !first.name || !ts.isIdentifier(first.name) || first.name.text !== 'a' ||
        !second.name || !ts.isIdentifier(second.name) || second.name.text !== 'b'
      ) {
        throw new Error('QA: expected parameters named a and b');
      }

      const statements = declaration.body.statements;
      if (statements.length !== 1 || !ts.isReturnStatement(statements[0])) {
        throw new Error('QA: add must contain exactly one return statement');
      }

      const expression = statements[0].expression;
      if (
        !expression ||
        !ts.isBinaryExpression(expression) ||
        expression.operatorToken.kind !== ts.SyntaxKind.PlusToken ||
        !ts.isIdentifier(expression.left) || expression.left.text !== 'a' ||
        !ts.isIdentifier(expression.right) || expression.right.text !== 'b'
      ) {
        throw new Error('QA: add must return the exact expression a + b');
      }

      // Interpret the accepted AST expression using fixed numeric test inputs.
      const cases = [
        { a: 2, b: 3, expected: 5 },
        { a: -1, b: 1, expected: 0 },
        { a: 0, b: 0, expected: 0 },
        { a: 12.5, b: 0.5, expected: 13 },
      ];
      const results = cases.map(({ a, b, expected }) => {
        const actual = a + b;
        return { a, b, expected, actual, passed: actual === expected };
      });
      const passed = results.every((result) => result.passed);

      const report = [
        '// Deterministic QA cases for src/add.ts',
        ...results.map(
          ({ a, b, expected, actual, passed: casePassed }) =>
            `// ${casePassed ? 'PASS' : 'FAIL'}: add(${a}, ${b}) = ${actual}; expected ${expected}`,
        ),
        `// QA_${passed ? 'PASS' : 'FAIL'}`,
      ].join('\n') + '\n';

      const fileTool = ctx.tools.get('file.write');
      if (!fileTool) throw new Error('QA: file.write tool is not registered');
      await fileTool.run({ path: 'src/add.qa.txt', content: report });

      span.end({ ok: passed, ms: Date.now() - startedAt });
      return {
        ok: passed,
        output: {
          passed,
          method: 'restricted-typescript-ast-validation',
          cases: results,
          report: 'src/add.qa.txt',
        },
        artifacts: [{
          id: 'add.qa',
          name: 'src/add.qa.txt',
          kind: 'text',
          content: report,
        }],
        logs: results.map(
          (result) =>
            `add(${result.a}, ${result.b}) => ${result.actual} [${result.passed ? 'PASS' : 'FAIL'}]`,
        ),
      };
    } catch (error) {
      const message = errorMessage(error);
      span.end({ ok: false, ms: Date.now() - startedAt, error: message });
      ctx.log(`QAAgent failed: ${message}`);
      return { ok: false, output: { passed: false, error: message } };
    }
  }
}
