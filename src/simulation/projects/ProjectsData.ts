// ============================================================================
// NOVA OS — HARSH'S PORTFOLIO PROJECTS DATA
// Authentic technical specifications, benchmark metrics, and execution models
// ============================================================================

import type { WorkloadType } from '../types';

export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  category: 'AI / Computer Vision' | 'Machine Learning' | 'Embedded / IoT' | 'Algorithms' | 'Systems / Web';
  tagline: string;
  summary: string;
  stack: string[];
  metrics: { label: string; value: string }[];
  processName: string;
  workloadType: WorkloadType;
  memoryMb: number;
  priority: number;
  githubUrl: string;
  files: { name: string; content: string }[];
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    slug: 'deepfake-engine',
    title: 'Multi-Modal DeepFake Forensic Engine',
    category: 'AI / Computer Vision',
    tagline: 'Dual-domain spatial & frequency forensic video artifact detector',
    summary:
      'Engineered a multi-stream neural network combining Vision Transformers (ViT-B/16) and 2D Discrete Fast Fourier Transform (FFT) frequency analysis to detect synthetic face manipulation across FaceForensics++ and Celeb-DF v2 datasets.',
    stack: ['PyTorch', 'Vision Transformer (ViT)', 'FastAPI', 'OpenCV', 'FFT', 'CUDA'],
    metrics: [
      { label: 'Detection AUC', value: '94.8%' },
      { label: 'Inference Latency', value: '18ms / frame' },
      { label: 'Generalization Score', value: '91.2%' },
    ],
    processName: 'deepfake-detector',
    workloadType: 'CPU_BOUND',
    memoryMb: 192,
    priority: 15,
    githubUrl: 'https://github.com/harshvshah12/deepfake-detection-engine',
    files: [
      {
        name: 'README.md',
        content: `# Multi-Modal DeepFake Forensic Engine
Dual-stream spatial-frequency neural network.
- Vision Transformer ViT-B/16 spatial feature extraction
- 2D Discrete FFT azimuthal average high-frequency spectrum analysis
- Evaluated on FaceForensics++ and Celeb-DF v2 with 94.8% AUC score.`,
      },
      {
        name: 'model.py',
        content: `import torch
import torch.nn as nn
from torchvision.models import vit_b_16

class DeepFakeForensicDetector(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.spatial_backbone = vit_b_16(weights='DEFAULT')
        self.freq_conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((14, 14))
        )
        self.classifier = nn.Linear(768 + (32 * 14 * 14), num_classes)

    def forward(self, x_rgb, x_fft):
        feat_rgb = self.spatial_backbone(x_rgb)
        feat_fft = torch.flatten(self.freq_conv(x_fft), 1)
        fused = torch.cat([feat_rgb, feat_fft], dim=1)
        return self.classifier(fused)
`,
      },
    ],
  },
  {
    id: 'proj-2',
    slug: 'dynamic-hotel-pricing',
    title: 'Dynamic Hotel Room Pricing Engine',
    category: 'Machine Learning',
    tagline: 'Real-time revenue management and price elasticity forecasting',
    summary:
      'Predictive machine learning pipeline modeling booking lead-time distributions, cancellation hazards, seasonality shifts, and competitor pricing to output dynamic RevPAR-maximizing room rates.',
    stack: ['Python', 'XGBoost', 'LightGBM', 'Scikit-Learn', 'Pandas', 'FastAPI'],
    metrics: [
      { label: 'RevPAR Increase', value: '+14.2%' },
      { label: 'MAPE Error', value: '4.6%' },
      { label: 'Daily Predictions', value: '50,000+' },
    ],
    processName: 'pricing-optimizer',
    workloadType: 'MIXED',
    memoryMb: 128,
    priority: 30,
    githubUrl: 'https://github.com/harshvshah12/dynamic-hotel-pricing',
    files: [
      {
        name: 'README.md',
        content: `# Dynamic Hotel Room Pricing Optimization
High-throughput pricing engine using gradient boosted decision trees.
Optimizes revenue per available room (RevPAR) based on demand curves and cancellation hazard modeling.`,
      },
      {
        name: 'pricing_pipeline.py',
        content: `import xgboost as xgb
import numpy as np

def calculate_optimal_price(base_rate, demand_index, competitor_median, elasticity=-1.4):
    demand_multiplier = 1.0 + (demand_index - 0.5) * 0.4
    comp_multiplier = (competitor_median / base_rate) ** 0.3
    optimized_price = base_rate * demand_multiplier * comp_multiplier
    return round(float(np.clip(optimized_price, base_rate * 0.7, base_rate * 2.2)), 2)
`,
      },
    ],
  },
  {
    id: 'proj-3',
    slug: 'parksense',
    title: 'ParkSense: Smart Parking IoT & Vision System',
    category: 'Embedded / IoT',
    tagline: 'Edge computer vision parking occupancy telemetry with MQTT',
    summary:
      'Autonomous smart parking architecture deploying lightweight YOLOv8 edge inference on RTSP camera feeds and ultrasonic sensor nodes via ESP32 microcontrollers, streaming live slot state over MQTT.',
    stack: ['YOLOv8', 'ESP32', 'FreeRTOS', 'MQTT', 'Node.js', 'React'],
    metrics: [
      { label: 'Slot Accuracy', value: '98.5%' },
      { label: 'State Latency', value: '<250ms' },
      { label: 'Nodes Managed', value: '64 slots' },
    ],
    processName: 'parksense-daemon',
    workloadType: 'IO_BOUND',
    memoryMb: 80,
    priority: 25,
    githubUrl: 'https://github.com/harshvshah12/parksense',
    files: [
      {
        name: 'README.md',
        content: `# ParkSense Smart Parking Architecture
Combines edge YOLOv8 vision detection with ESP32 MQTT ultrasonic sensor mesh.
Sub-250ms occupancy status broadcasting to mobile dashboard.`,
      },
    ],
  },
  {
    id: 'proj-4',
    slug: 'gesture-recognition',
    title: 'ESP32-CAM TinyML Hand Gesture Recognition',
    category: 'Embedded / IoT',
    tagline: 'Sub-50ms edge CNN gesture classification on microcontrollers',
    summary:
      'Quantized int8 convolutional neural network running on dual-core ESP32-CAM (SRAM 520KB + 4MB PSRAM) to recognize 5 dynamic hand gestures without cloud connectivity.',
    stack: ['TensorFlow Lite Micro', 'ESP32-CAM', 'C++', 'Edge Impulse', 'Arduino Core'],
    metrics: [
      { label: 'Model Footprint', value: '184 KB' },
      { label: 'Inference Speed', value: '42 ms / frame' },
      { label: 'Accuracy', value: '93.7%' },
    ],
    processName: 'esp32-tinyml',
    workloadType: 'CPU_BOUND',
    memoryMb: 64,
    priority: 20,
    githubUrl: 'https://github.com/harshvshah12/esp32-cam-gesture-recognition',
    files: [
      {
        name: 'README.md',
        content: `# ESP32-CAM TinyML Hand Gesture Recognizer
Sub-50ms edge inference running int8 quantized CNNs directly on bare-metal ESP32 microcontrollers.`,
      },
    ],
  },
  {
    id: 'proj-5',
    slug: 'maze-visualizer',
    title: 'DAA Shortest Path & Graph Traversal Visualizer',
    category: 'Algorithms',
    tagline: 'Interactive step-by-step algorithm laboratory with weighted heuristics',
    summary:
      'Educational graph theory visualizer demonstrating Dijkstra, A* (Manhattan/Euclidean), Bidirectional BFS, and recursive backtracker maze generation with frame-accurate step stepping.',
    stack: ['TypeScript', 'React', 'HTML5 Canvas', 'Data Structures & Algorithms'],
    metrics: [
      { label: 'Algorithms Simulated', value: '7' },
      { label: 'Grid Resolution', value: '60 × 30' },
      { label: 'FPS Target', value: '60 FPS' },
    ],
    processName: 'maze-solver',
    workloadType: 'MEMORY_INTENSIVE',
    memoryMb: 96,
    priority: 35,
    githubUrl: 'https://github.com/harshvshah12/maze-algorithm-visualizer',
    files: [
      {
        name: 'README.md',
        content: `# DAA Graph Traversal & Maze Visualizer
Step-by-step educational algorithm laboratory implementing Dijkstra, A-Star, Greedy Best-First, and BFS.`,
      },
    ],
  },
  {
    id: 'proj-6',
    slug: 'vegapod',
    title: 'VegaPod Hyperloop Telemetry & Control Suite',
    category: 'Systems / Web',
    tagline: 'Telemetry telemetry bus, sensor fusion, and emergency braking logic',
    summary:
      'Mission-critical high-frequency telemetry dashboard built for student hyperloop prototype, decoding CAN bus frames and visualizing pneumatic braking, levitation air gaps, and battery thermals in real-time.',
    stack: ['Next.js', 'Rust', 'WebSockets', 'CAN Bus', 'Chart.js', 'Tailwind'],
    metrics: [
      { label: 'Sampling Rate', value: '100 Hz' },
      { label: 'Packet Drop Rate', value: '0.00%' },
      { label: 'Emergency Trip Time', value: '<12 ms' },
    ],
    processName: 'vegapod-telemetry',
    workloadType: 'MIXED',
    memoryMb: 110,
    priority: 18,
    githubUrl: 'https://github.com/harshvshah12/vegapod-hyperloop',
    files: [
      {
        name: 'README.md',
        content: `# VegaPod Hyperloop Telemetry & Control Suite
High-frequency vehicle telemetry bus decoding CAN messages and rendering live telemetry.`,
      },
    ],
  },
  {
    id: 'proj-7',
    slug: 'connectsphere',
    title: 'ConnectSphere Enterprise Workspace Platform',
    category: 'Systems / Web',
    tagline: 'Real-time collaborative workspace with operational transformation',
    summary:
      'Full-stack collaborative enterprise messaging and document editing platform featuring CRDT conflict resolution, live cursor tracking, end-to-end encrypted rooms, and team audio channels.',
    stack: ['Next.js 14', 'TypeScript', 'WebSockets', 'Supabase', 'PostgreSQL', 'Tailwind'],
    metrics: [
      { label: 'Concurrent Peers', value: '1,000+' },
      { label: 'Sync Latency', value: '<35ms' },
      { label: 'Uptime SLA', value: '99.9%' },
    ],
    processName: 'connectsphere-srv',
    workloadType: 'IO_BOUND',
    memoryMb: 140,
    priority: 28,
    githubUrl: 'https://github.com/harshvshah12/connectsphere',
    files: [
      {
        name: 'README.md',
        content: `# ConnectSphere Enterprise Workspace Platform
Enterprise collaboration system with real-time CRDT document synchronization and team channels.`,
      },
    ],
  },
  {
    id: 'proj-8',
    slug: 'nova-os',
    title: 'NOVA OS: Academic Virtual Operating System',
    category: 'Systems / Web',
    tagline: 'Deterministic Linux-inspired operating system and virtual computer simulation',
    summary:
      'A full-scale virtual computer laboratory featuring 4KB paged virtual memory, multi-algorithm schedulers (FCFS, SJF, SRTF, RR, MLFQ), Dijkstra synchronization primitives, Banker algorithm deadlock prevention, and Bash terminal.',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Vitest', 'Playwright'],
    metrics: [
      { label: 'Subsystems', value: '14 Subsystems' },
      { label: 'Unit Tests', value: '31+ Passing' },
      { label: 'Determinism', value: '100% Seeded PRNG' },
    ],
    processName: 'nova-kernel',
    workloadType: 'MIXED',
    memoryMb: 256,
    priority: 1,
    githubUrl: 'https://github.com/harshvshah12/nova-os',
    files: [
      {
        name: 'README.md',
        content: `# NOVA OS
A Full-Scale, Linux-Inspired Operating System Simulation & Academic Laboratory.`,
      },
    ],
  },
];
