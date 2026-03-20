/**
 * Pre-defined chaos experiment catalogue.
 * Each entry contains metadata and a function that generates the
 * Argo Workflow YAML submitted to LitmusChaos.
 */

function buildWorkflowManifest(id, namespace, appLabel, duration) {
  return `apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: ${id}-
  namespace: litmus
  labels:
    subject: "${id}_${namespace}"
spec:
  entrypoint: argowf-chaos
  serviceAccountName: argo-chaos
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
  templates:
    - name: argowf-chaos
      steps:
        - - name: install-chaos-faults
            template: install-chaos-faults
        - - name: run-chaos
            template: run-chaos
        - - name: cleanup-chaos-resources
            template: cleanup-chaos-resources

    - name: install-chaos-faults
      inputs:
        artifacts:
          - name: ${id}
            path: /tmp/${id}.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosExperiment
                metadata:
                  name: ${id}
                  namespace: litmus
                  labels:
                    name: ${id}
                    app.kubernetes.io/part-of: litmus
                    app.kubernetes.io/component: chaosexperiment
      container:
        image: litmuschaos/k8s:ci
        command: [sh, -c]
        args: ["kubectl apply -f /tmp/${id}.yaml -n litmus"]

    - name: run-chaos
      inputs:
        artifacts:
          - name: chaosengine
            path: /tmp/chaosengine.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosEngine
                metadata:
                  name: ${id}-engine
                  namespace: ${namespace}
                  labels:
                    workflow_run_id: "{{workflow.uid}}"
                spec:
                  appinfo:
                    appns: ${namespace}
                    applabel: "${appLabel}"
                    appkind: deployment
                  engineState: active
                  chaosServiceAccount: litmus-admin
                  experiments:
                    - name: ${id}
                      spec:
                        components:
                          env:
                            - name: TOTAL_CHAOS_DURATION
                              value: "${duration}"
                            - name: CHAOS_INTERVAL
                              value: "10"
                            - name: FORCE
                              value: "false"
      container:
        image: litmuschaos/litmus-checker:ci
        args: ["-file=/tmp/chaosengine.yaml", "-saveName=/tmp/engine-name"]

    - name: cleanup-chaos-resources
      container:
        image: litmuschaos/k8s:ci
        command: [sh, -c]
        args: ["kubectl delete chaosengine -l workflow_run_id={{workflow.uid}} -n ${namespace} || true"]
`;
}

const EXPERIMENTS = [
  {
    id: 'pod-delete',
    name: 'Pod Delete',
    description: 'Randomly deletes pods to validate self-healing and restart policies.',
    category: 'pod',
    riskLevel: 'medium',
    icon: '💥',
    defaultDuration: 30,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'pod-cpu-hog',
    name: 'CPU Hog',
    description: 'Consumes CPU resources on target pods to test throttling and autoscaling.',
    category: 'pod',
    riskLevel: 'high',
    icon: '🔥',
    defaultDuration: 60,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'pod-memory-hog',
    name: 'Memory Hog',
    description: 'Exhausts memory on target pods to test OOM handling and eviction.',
    category: 'pod',
    riskLevel: 'high',
    icon: '🐏',
    defaultDuration: 60,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'container-kill',
    name: 'Container Kill',
    description: 'Kills containers inside pods to verify restart behaviour and liveness probes.',
    category: 'pod',
    riskLevel: 'medium',
    icon: '☠️',
    defaultDuration: 30,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'pod-network-latency',
    name: 'Network Latency',
    description: 'Injects network delay to expose timeout and retry configuration issues.',
    category: 'network',
    riskLevel: 'low',
    icon: '🌐',
    defaultDuration: 60,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'pod-network-loss',
    name: 'Network Loss',
    description: 'Drops a percentage of packets to simulate intermittent connectivity.',
    category: 'network',
    riskLevel: 'medium',
    icon: '📡',
    defaultDuration: 60,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'disk-fill',
    name: 'Disk Fill',
    description: 'Fills ephemeral storage to test disk-pressure handling and eviction.',
    category: 'storage',
    riskLevel: 'high',
    icon: '💾',
    defaultDuration: 30,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
  {
    id: 'node-cpu-hog',
    name: 'Node CPU Hog',
    description: 'Stresses CPU across an entire node to test cluster-level autoscaling.',
    category: 'node',
    riskLevel: 'high',
    icon: '⚡',
    defaultDuration: 60,
    defaultNamespace: 'default',
    defaultAppLabel: 'app=nginx',
  },
];

module.exports = { EXPERIMENTS, buildWorkflowManifest };
