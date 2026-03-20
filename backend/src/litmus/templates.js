/**
 * Pre-defined chaos experiment templates.
 * These map a friendly name to the LitmusChaos experiment kind and a default
 * workflow YAML that can be submitted when no matching workflow already exists
 * in the project.
 */
const EXPERIMENT_TEMPLATES = [
  {
    id: 'pod-delete',
    name: 'Pod Delete',
    description: 'Randomly deletes pods to test auto-healing and high availability.',
    icon: '💥',
    category: 'pod',
    severity: 'medium',
    defaultNamespace: 'default',
  },
  {
    id: 'cpu-hog',
    name: 'CPU Hog',
    description: 'Consumes CPU resources to simulate resource starvation scenarios.',
    icon: '🔥',
    category: 'stress',
    severity: 'high',
    defaultNamespace: 'default',
  },
  {
    id: 'memory-hog',
    name: 'Memory Hog',
    description: 'Consumes memory to test application behavior under memory pressure.',
    icon: '🧠',
    category: 'stress',
    severity: 'high',
    defaultNamespace: 'default',
  },
  {
    id: 'network-chaos',
    name: 'Network Chaos',
    description: 'Introduces network latency and packet loss to test fault tolerance.',
    icon: '🌐',
    category: 'network',
    severity: 'medium',
    defaultNamespace: 'default',
  },
  {
    id: 'disk-fill',
    name: 'Disk Fill',
    description: 'Fills up disk space to simulate disk exhaustion scenarios.',
    icon: '💾',
    category: 'io',
    severity: 'high',
    defaultNamespace: 'default',
  },
  {
    id: 'node-drain',
    name: 'Node Drain',
    description: 'Drains a node to test workload rescheduling capabilities.',
    icon: '🖥️',
    category: 'node',
    severity: 'critical',
    defaultNamespace: 'default',
  },
  {
    id: 'container-kill',
    name: 'Container Kill',
    description: 'Kills a container to test container restart policies.',
    icon: '🪓',
    category: 'pod',
    severity: 'medium',
    defaultNamespace: 'default',
  },
  {
    id: 'pod-network-latency',
    name: 'Pod Network Latency',
    description: 'Injects network latency at the pod level to test timeout handling.',
    icon: '⏱️',
    category: 'network',
    severity: 'low',
    defaultNamespace: 'default',
  },
];

module.exports = { EXPERIMENT_TEMPLATES };
