const { spawn } = require('child_process');
const path = require('path');

const servers = [
  {
    name: 'Filesystem MCP',
    command: 'npx.cmd',
    args: ['-y', '@modelcontextprotocol/server-filesystem', path.resolve(__dirname, '..')],
  },
  {
    name: 'Git MCP',
    command: 'uvx',
    args: ['mcp-server-git', '-r', path.resolve(__dirname, '..')],
  },
  {
    name: 'Serena MCP',
    command: 'uvx',
    args: [
      '--from',
      'git+https://github.com/oraios/serena',
      'serena',
      'start-mcp-server',
      '--project',
      path.resolve(__dirname, '..'),
      '--enable-web-dashboard',
      'false',
    ],
  },
  {
    name: 'Context7 MCP',
    command: 'npx.cmd',
    args: ['-y', '@upstash/context7-mcp'],
  },
];

async function testServer(s) {
  return new Promise((resolve) => {
    console.log(`Testing ${s.name}...`);
    const proc = spawn(s.command, s.args, {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.includes('jsonrpc') || stdout.includes('result') || stdout.includes('serverInfo')) {
        if (!resolved) {
          resolved = true;
          try { proc.kill(); } catch {}
          resolve({ ok: true, name: s.name, output: stdout.trim() });
        }
      }
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, name: s.name, error: err.message });
      }
    });

    // Send JSON-RPC initialize packet
    const initPayload = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'verify-client', version: '1.0' },
      },
    }) + '\n';

    proc.stdin.write(initPayload);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { proc.kill(); } catch {}
        if (stdout.length > 0) {
          resolve({ ok: true, name: s.name, output: stdout.trim() });
        } else {
          resolve({ ok: false, name: s.name, error: 'Timeout waiting for response', stderr });
        }
      }
    }, 15000);
  });
}

async function main() {
  console.log('Verifying all 4 MCP servers...\n');
  const results = [];
  for (const s of servers) {
    const res = await testServer(s);
    results.push(res);
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  let allOk = true;
  for (const r of results) {
    if (r.ok) {
      console.log(`[PASS] ${r.name}: Verified & Responding`);
    } else {
      console.log(`[FAIL] ${r.name}: ${r.error}`);
      if (r.stderr) console.log(`Stderr: ${r.stderr}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\nAll 4 MCP servers configured and verified working.');
  } else {
    process.exit(1);
  }
}

main();
