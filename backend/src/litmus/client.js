const { GraphQLClient, gql } = require('graphql-request');

const LITMUS_ENDPOINT =
  process.env.LITMUS_ENDPOINT || 'http://litmus-server-service:9002/query';
const LITMUS_TOKEN = process.env.LITMUS_TOKEN || '';

function getClient() {
  return new GraphQLClient(LITMUS_ENDPOINT, {
    headers: LITMUS_TOKEN ? { Authorization: `Bearer ${LITMUS_TOKEN}` } : {},
  });
}

const LIST_WORKFLOWS = gql`
  query ListWorkflows($projectID: ID!) {
    listWorkflows(request: { projectID: $projectID }) {
      workflows {
        workflowID
        workflowName
        workflowDescription
        cronSyntax
        workflowType
        isCustomWorkflow
        tags
        createdAt
        updatedAt
      }
    }
  }
`;

const LIST_WORKFLOW_RUNS = gql`
  query ListWorkflowRuns($projectID: ID!) {
    listWorkflowRuns(request: { projectID: $projectID }) {
      totalNoOfWorkflowRuns
      workflowRuns {
        workflowRunID
        workflowID
        workflowName
        phase
        resiliencyScore
        totalExperiments
        experimentsPassed
        experimentsFailed
        executionData
        createdAt
        updatedAt
      }
    }
  }
`;

const RUN_CHAOS_WORKFLOW = gql`
  mutation RunChaosWorkflow($projectID: ID!, $workflowID: ID!) {
    runChaosWorkflow(projectID: $projectID, workflowID: $workflowID) {
      workflowRunID
      message
    }
  }
`;

const STOP_WORKFLOW_RUNS = gql`
  mutation StopWorkflowRuns($projectID: ID!, $workflowRunIDs: [ID!]) {
    stopWorkflowRuns(
      projectID: $projectID
      workflowRunIDs: $workflowRunIDs
    )
  }
`;

const GET_WORKFLOW_RUN = gql`
  query GetWorkflowRun($projectID: ID!, $workflowRunID: ID!) {
    getWorkflowRun(projectID: $projectID, workflowRunID: $workflowRunID) {
      workflowRunID
      workflowID
      workflowName
      phase
      resiliencyScore
      totalExperiments
      experimentsPassed
      experimentsFailed
      executionData
      createdAt
      updatedAt
    }
  }
`;

async function listWorkflows(projectID) {
  const client = getClient();
  const data = await client.request(LIST_WORKFLOWS, { projectID });
  return data.listWorkflows.workflows;
}

async function listWorkflowRuns(projectID) {
  const client = getClient();
  const data = await client.request(LIST_WORKFLOW_RUNS, { projectID });
  return data.listWorkflowRuns;
}

async function runChaosWorkflow(projectID, workflowID) {
  const client = getClient();
  const data = await client.request(RUN_CHAOS_WORKFLOW, {
    projectID,
    workflowID,
  });
  return data.runChaosWorkflow;
}

async function stopWorkflowRuns(projectID, workflowRunIDs) {
  const client = getClient();
  const data = await client.request(STOP_WORKFLOW_RUNS, {
    projectID,
    workflowRunIDs,
  });
  return data.stopWorkflowRuns;
}

async function getWorkflowRun(projectID, workflowRunID) {
  const client = getClient();
  const data = await client.request(GET_WORKFLOW_RUN, {
    projectID,
    workflowRunID,
  });
  return data.getWorkflowRun;
}

module.exports = {
  listWorkflows,
  listWorkflowRuns,
  runChaosWorkflow,
  stopWorkflowRuns,
  getWorkflowRun,
};
