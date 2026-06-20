import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const frontRoot = resolve(testDir, '../../..');
const workflowsDir = resolve(frontRoot, '.github/workflows');

function readWorkflow(name: string): string {
  return readFileSync(resolve(workflowsDir, name), 'utf-8');
}

describe('front/.github/workflows/ci.yml', () => {
  const workflow = readWorkflow('ci.yml');

  it('triggers on pull_request targeting staging and main', () => {
    expect(workflow).toMatch(
      /on:\s*\n\s*pull_request:\s*\n\s*branches:\s*\[staging, main\]/,
    );
  });

  it('runs pnpm audit --prod --audit-level=high after install and before lint/test/build', () => {
    const installIndex = workflow.indexOf('name: Install dependencies');
    const auditIndex = workflow.indexOf('pnpm audit --prod --audit-level=high');
    const lintIndex = workflow.indexOf('name: Lint');
    const testIndex = workflow.indexOf('name: Test');
    const buildIndex = workflow.indexOf('name: Build (placeholder API URL, no deploy)');

    [installIndex, auditIndex, lintIndex, testIndex, buildIndex].forEach((index) =>
      expect(index).toBeGreaterThan(-1),
    );

    expect(auditIndex).toBeGreaterThan(installIndex);
    expect(auditIndex).toBeLessThan(lintIndex);
    expect(auditIndex).toBeLessThan(testIndex);
    expect(auditIndex).toBeLessThan(buildIndex);
  });

  it('builds with a non-secret placeholder VITE_API_BASE_URL', () => {
    expect(workflow).toMatch(
      /VITE_API_BASE_URL: https:\/\/ci-build-placeholder\.invalid/,
    );
  });

  it('does not deploy anything', () => {
    expect(workflow).not.toMatch(/firebase deploy|azcopy/i);
  });
});

describe('front/.github/workflows/deploy-staging.yml', () => {
  const workflow = readWorkflow('deploy-staging.yml');

  it('triggers on push to staging', () => {
    expect(workflow).toMatch(/on:\s*\n\s*push:\s*\n\s*branches:\s*\[staging\]/);
  });

  it('runs pnpm audit --prod --audit-level=high after install and before lint/test/build', () => {
    const installIndex = workflow.indexOf('name: Install dependencies');
    const auditIndex = workflow.indexOf('pnpm audit --prod --audit-level=high');
    const lintIndex = workflow.indexOf('name: Lint');
    const testIndex = workflow.indexOf('name: Test');
    const buildIndex = workflow.indexOf('name: Build (staging)');

    [installIndex, auditIndex, lintIndex, testIndex, buildIndex].forEach((index) =>
      expect(index).toBeGreaterThan(-1),
    );

    expect(auditIndex).toBeGreaterThan(installIndex);
    expect(auditIndex).toBeLessThan(lintIndex);
    expect(auditIndex).toBeLessThan(testIndex);
    expect(auditIndex).toBeLessThan(buildIndex);
  });

  it('checks required secrets before building', () => {
    const checkIndex = workflow.indexOf('name: Check required secrets');
    const buildIndex = workflow.indexOf('name: Build (staging)');

    expect(checkIndex).toBeGreaterThan(-1);
    expect(checkIndex).toBeLessThan(buildIndex);
    expect(workflow).toMatch(/AZ_STORAGE_ACCOUNT_STAGING/);
    expect(workflow).toMatch(/AZ_STORAGE_KEY_STAGING/);
    expect(workflow).toMatch(/VITE_API_BASE_URL_STAGING/);
  });

  it('uploads the build to the $web container via azcopy', () => {
    const buildIndex = workflow.indexOf('name: Build (staging)');
    const uploadIndex = workflow.indexOf('azcopy copy "dist/*"');

    expect(uploadIndex).toBeGreaterThan(buildIndex);
    expect(workflow).toMatch(/\$web/);
  });
});

describe('front/.github/workflows/deploy-prod.yml', () => {
  const workflow = readWorkflow('deploy-prod.yml');

  it('triggers on push to main', () => {
    expect(workflow).toMatch(/on:\s*\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  });

  it('runs pnpm audit --prod --audit-level=high after install and before lint/test/build', () => {
    const installIndex = workflow.indexOf('name: Install dependencies');
    const auditIndex = workflow.indexOf('pnpm audit --prod --audit-level=high');
    const lintIndex = workflow.indexOf('name: Lint');
    const testIndex = workflow.indexOf('name: Test');
    const buildIndex = workflow.indexOf('name: Build (prod)');

    [installIndex, auditIndex, lintIndex, testIndex, buildIndex].forEach((index) =>
      expect(index).toBeGreaterThan(-1),
    );

    expect(auditIndex).toBeGreaterThan(installIndex);
    expect(auditIndex).toBeLessThan(lintIndex);
    expect(auditIndex).toBeLessThan(testIndex);
    expect(auditIndex).toBeLessThan(buildIndex);
  });

  it('aborts the build if VITE_API_BASE_URL is empty or points to localhost', () => {
    expect(workflow).toMatch(/VITE_API_BASE_URL is empty/);
    expect(workflow).toMatch(/contains localhost, aborting/);
  });

  it('authenticates to Firebase and deploys hosting after build', () => {
    const buildIndex = workflow.indexOf('name: Build (prod)');
    const authIndex = workflow.indexOf('name: Firebase Auth');
    const deployIndex = workflow.indexOf('name: Deploy to Firebase Hosting');

    expect(buildIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeGreaterThan(buildIndex);
    expect(deployIndex).toBeGreaterThan(authIndex);
    expect(workflow).toMatch(/firebase deploy --project challenge-cardegall-xxxx --only hosting/);
  });
});

describe.each(['.env.staging.example', '.env.production.example'])(
  'front/%s',
  (filename) => {
    const content = readFileSync(resolve(frontRoot, filename), 'utf-8');

    it('defines VITE_API_BASE_URL pointing to an https URL', () => {
      expect(content).toMatch(/^VITE_API_BASE_URL=https:\/\//m);
    });
  },
);

describe('front/firebase.json', () => {
  const config = JSON.parse(readFileSync(resolve(frontRoot, 'firebase.json'), 'utf-8'));

  it('serves the Vite build output with an SPA rewrite', () => {
    expect(config.hosting.public).toBe('dist');
    expect(config.hosting.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '**', destination: '/index.html' }),
      ]),
    );
  });
});

describe('front/.firebaserc', () => {
  const config = JSON.parse(readFileSync(resolve(frontRoot, '.firebaserc'), 'utf-8'));

  it('declares a default Firebase project for challenge-cardegall', () => {
    expect(config.projects.default).toMatch(/^challenge-cardegall/);
  });
});
