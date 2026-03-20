const request = require('supertest');
const app = require('../index');

// Mock the litmus client so tests don't require a real LitmusChaos instance
jest.mock('../litmus/client', () => ({
  listWorkflows: jest.fn(),
  listWorkflowRuns: jest.fn(),
  runChaosWorkflow: jest.fn(),
  stopWorkflowRuns: jest.fn(),
  getWorkflowRun: jest.fn(),
}));

const litmus = require('../litmus/client');

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/experiments/templates', () => {
  it('returns the pre-defined templates list', async () => {
    const res = await request(app).get('/api/experiments/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.length).toBeGreaterThan(0);
    const ids = res.body.templates.map((t) => t.id);
    expect(ids).toContain('pod-delete');
    expect(ids).toContain('cpu-hog');
  });
});

describe('GET /api/experiments', () => {
  it('returns workflows from litmus', async () => {
    const mockWorkflows = [{ workflowID: 'wf-1', workflowName: 'Test Workflow' }];
    litmus.listWorkflows.mockResolvedValueOnce(mockWorkflows);
    const res = await request(app).get('/api/experiments');
    expect(res.status).toBe(200);
    expect(res.body.workflows).toEqual(mockWorkflows);
  });

  it('returns 502 when litmus call fails', async () => {
    litmus.listWorkflows.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/api/experiments');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Failed to fetch workflows');
  });
});

describe('POST /api/experiments/:workflowID/run', () => {
  it('triggers a workflow run', async () => {
    litmus.runChaosWorkflow.mockResolvedValueOnce({
      workflowRunID: 'run-123',
      message: 'Workflow run request received',
    });
    const res = await request(app).post('/api/experiments/wf-1/run');
    expect(res.status).toBe(200);
    expect(res.body.workflowRunID).toBe('run-123');
  });

  it('returns 502 when trigger fails', async () => {
    litmus.runChaosWorkflow.mockRejectedValueOnce(new Error('Not found'));
    const res = await request(app).post('/api/experiments/wf-bad/run');
    expect(res.status).toBe(502);
  });
});

describe('GET /api/experiments/runs', () => {
  it('returns workflow runs', async () => {
    const mockData = {
      totalNoOfWorkflowRuns: 1,
      workflowRuns: [{ workflowRunID: 'run-1', phase: 'Succeeded' }],
    };
    litmus.listWorkflowRuns.mockResolvedValueOnce(mockData);
    const res = await request(app).get('/api/experiments/runs');
    expect(res.status).toBe(200);
    expect(res.body.workflowRuns[0].workflowRunID).toBe('run-1');
  });
});

describe('POST /api/experiments/abort', () => {
  it('aborts active workflow runs discovered automatically', async () => {
    litmus.listWorkflowRuns.mockResolvedValueOnce({
      workflowRuns: [
        { workflowRunID: 'run-1', phase: 'Running' },
        { workflowRunID: 'run-2', phase: 'Succeeded' },
        { workflowRunID: 'run-3', phase: 'Awaited' },
      ],
    });
    litmus.stopWorkflowRuns.mockResolvedValueOnce(true);
    const res = await request(app).post('/api/experiments/abort');
    expect(res.status).toBe(200);
    expect(res.body.aborted).toBe(2);
  });

  it('reports no active runs when nothing is running', async () => {
    litmus.listWorkflowRuns.mockResolvedValueOnce({
      workflowRuns: [{ workflowRunID: 'run-1', phase: 'Succeeded' }],
    });
    const res = await request(app).post('/api/experiments/abort');
    expect(res.status).toBe(200);
    expect(res.body.aborted).toBe(0);
  });

  it('aborts specific runIDs when provided in body', async () => {
    litmus.stopWorkflowRuns.mockResolvedValueOnce(true);
    const res = await request(app)
      .post('/api/experiments/abort')
      .send({ runIDs: ['run-1', 'run-2'] });
    expect(res.status).toBe(200);
    expect(res.body.aborted).toBe(2);
  });
});

describe('404 fallback', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});
