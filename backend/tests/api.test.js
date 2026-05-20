// Simple integration test for DocuFlow API
// Run with: node tests/api.test.js
// Requires the server to be running on localhost:3001

const BASE_URL = 'http://localhost:3001/api';

let aliceId = null;
let bobId = null;
let docId = null;
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function req(method, path, body, userId) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {})
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('\nDocuFlow API Tests\n');

  console.log('1. Auth');
  await test('login with valid credentials', async () => {
    const { status, data } = await req('POST', '/auth/login', { email: 'alice@docuflow.dev', password: 'password123' });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.user?.id, 'Expected user id');
    aliceId = data.user.id;
  });

  await test('login with invalid credentials returns 401', async () => {
    const { status } = await req('POST', '/auth/login', { email: 'alice@docuflow.dev', password: 'wrongpass' });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test('login as bob', async () => {
    const { status, data } = await req('POST', '/auth/login', { email: 'bob@docuflow.dev', password: 'password123' });
    assert(status === 200);
    bobId = data.user.id;
  });

  console.log('\n2. Documents');
  await test('create a document', async () => {
    const { status, data } = await req('POST', '/documents', { title: 'Test Doc', content: '{}' }, aliceId);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.id, 'Expected document id');
    docId = data.id;
  });

  await test('fetch documents list', async () => {
    const { status, data } = await req('GET', '/documents', null, aliceId);
    assert(status === 200);
    assert(Array.isArray(data.owned), 'Expected owned array');
    assert(data.owned.length > 0, 'Expected at least one document');
  });

  await test('get document by id', async () => {
    const { status, data } = await req('GET', `/documents/${docId}`, null, aliceId);
    assert(status === 200);
    assert(data.id === docId);
  });

  await test('update document title', async () => {
    const { status, data } = await req('PUT', `/documents/${docId}`, { title: 'Updated Title' }, aliceId);
    assert(status === 200);
    assert(data.title === 'Updated Title', `Expected "Updated Title", got "${data.title}"`);
  });

  await test('bob cannot access alice document without share', async () => {
    const { status } = await req('GET', `/documents/${docId}`, null, bobId);
    assert(status === 403, `Expected 403, got ${status}`);
  });

  console.log('\n3. Sharing');
  await test('share document with bob', async () => {
    const { status, data } = await req('POST', '/share', {
      documentId: docId,
      sharedWithEmail: 'bob@docuflow.dev',
      permission: 'edit'
    }, aliceId);
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert(data.success);
  });

  await test('bob can now access shared document', async () => {
    const { status, data } = await req('GET', `/documents/${docId}`, null, bobId);
    assert(status === 200);
    assert(data.role === 'edit');
  });

  await test('shared doc appears in bob document list', async () => {
    const { status, data } = await req('GET', '/documents', null, bobId);
    assert(status === 200);
    assert(data.shared.some(d => d.id === docId), 'Expected shared doc in bob list');
  });

  await test('remove share', async () => {
    const { status } = await req('DELETE', `/share/${docId}/${bobId}`, null, aliceId);
    assert(status === 200);
  });

  await test('bob loses access after share removed', async () => {
    const { status } = await req('GET', `/documents/${docId}`, null, bobId);
    assert(status === 403);
  });

  console.log('\n4. Cleanup');
  await test('delete document', async () => {
    const { status } = await req('DELETE', `/documents/${docId}`, null, aliceId);
    assert(status === 200);
  });

  console.log(`\n${'─'.repeat(30)}`);
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
