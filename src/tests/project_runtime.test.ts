// ============================================================================
// NOVA OS — PORTFOLIO PROJECT RUNTIME TESTS
// Tests for combined simulation launch, PID reuse, verified URL resolution,
// deterministic workloads, and execution boundaries
// ============================================================================

import { describe, it, expect } from 'vitest';
import { PORTFOLIO_PROJECTS } from '../simulation/projects/ProjectsData';
import { ProcessManager } from '../simulation/processes/ProcessManager';
import { WorkloadGenerator } from '../simulation/processes/WorkloadGenerator';
import { EventBus } from '../simulation/runtime/EventBus';

describe('NOVA OS — Portfolio Project Runtime & Launch Integrity', () => {
  it('All projects have verified repositories and truthful launch URLs without invented domains', () => {
    for (const proj of PORTFOLIO_PROJECTS) {
      expect(proj.id).toBeDefined();
      expect(proj.title).toBeDefined();
      expect(proj.githubUrl).toMatch(/^https:\/\/github\.com\/harshvshah12\//);
      expect(['live', 'repository', 'local']).toContain(proj.launchType);

      if (proj.launchType === 'live') {
        expect(proj.liveUrl).toBeDefined();
        expect(proj.launchUrl).toBe(proj.liveUrl);
        // Verified domains only: Vercel projects owned by Harsh Shah
        expect(proj.launchUrl).toMatch(/^https:\/\/[a-z0-9-]+\.vercel\.app/);
      } else if (proj.launchType === 'repository') {
        expect(proj.launchUrl).toBe(proj.githubUrl);
      }

      // Memory footprint and priority must be positive and bounded
      expect(proj.memoryMb).toBeGreaterThan(0);
      expect(proj.memoryMb).toBeLessThanOrEqual(512);
      expect(proj.priority).toBeGreaterThan(0);
      expect(proj.simulationProfile.workloadType).toBe(proj.workloadType);
    }
  });

  it('Start simulation creates an authentic NOVA process with correct PCB, state, and instructions', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);

    const deepfakeProj = PORTFOLIO_PROJECTS.find((p) => p.slug === 'deepfake-engine')!;
    expect(deepfakeProj).toBeDefined();

    const proc = pm.createProcess(
      deepfakeProj.processName,
      deepfakeProj.processName,
      deepfakeProj.workloadType,
      {
        priority: deepfakeProj.priority,
        virtualPagesCount: Math.ceil((deepfakeProj.memoryMb * 1024) / 4),
      }
    );

    expect(proc.getPid()).toBeGreaterThan(0);
    expect(proc.getName()).toBe('deepfake-detector');
    expect(proc.getState()).toBe('READY');

    const pcb = proc.getPcb();
    expect(pcb.priority).toBe(15);
    expect(pcb.workloadType).toBe('CPU_BOUND');
    expect(pcb.instructions.length).toBeGreaterThan(0);

    // Deepfake workload should contain ViT and FFT instructions
    const descriptions = pcb.instructions.map((i) => i.description ?? '');
    expect(descriptions.some((d) => d.includes('ViT') || d.includes('transformer'))).toBe(true);
    expect(descriptions.some((d) => d.includes('FFT'))).toBe(true);
  });

  it('Reusing an already-running simulation process does NOT duplicate PIDs', () => {
    const bus = new EventBus();
    const pm = new ProcessManager(bus);

    const pricingProj = PORTFOLIO_PROJECTS.find((p) => p.slug === 'dynamic-hotel-pricing')!;

    // First launch
    const proc1 = pm.createProcess(
      pricingProj.processName,
      pricingProj.processName,
      pricingProj.workloadType,
      { priority: pricingProj.priority }
    );
    const pid1 = proc1.getPid();

    // Emulate Hub logic: check active processes first
    const activeProcesses = pm.getActiveProcesses();
    const existing = activeProcesses.find((p) => p.getName() === pricingProj.processName);
    expect(existing).toBeDefined();
    expect(existing?.getPid()).toBe(pid1);

    // If existing, we reuse rather than calling createProcess
    const proc2 = existing ?? pm.createProcess(pricingProj.processName, pricingProj.processName);
    expect(proc2.getPid()).toBe(pid1);

    // Verify there is only 1 process running with this name
    const matching = pm.getActiveProcesses().filter((p) => p.getName() === pricingProj.processName);
    expect(matching.length).toBe(1);
  });

  it('WorkloadGenerator generates deterministic project-specific instruction streams', () => {
    const deepfake = WorkloadGenerator.createProjectWorkload('deepfake-detector');
    expect(deepfake).not.toBeNull();
    expect(deepfake![0].description).toContain('ViT');

    const hasDesc = (insts: { description?: string }[] | null, substr: string) =>
      insts !== null && insts.some((i) => (i.description ?? '').includes(substr));

    const pricing = WorkloadGenerator.createProjectWorkload('pricing-optimizer');
    expect(hasDesc(pricing, 'XGBoost')).toBe(true);

    const vegapod = WorkloadGenerator.createProjectWorkload('vegapod-telemetry');
    expect(hasDesc(vegapod, 'CAN bus')).toBe(true);

    const musically = WorkloadGenerator.createProjectWorkload('musically-player');
    expect(hasDesc(musically, 'FFT')).toBe(true);

    const fraud = WorkloadGenerator.createProjectWorkload('fraud-sentinel');
    expect(hasDesc(fraud, 'Isolation Forest')).toBe(true);

    const parksense = WorkloadGenerator.createProjectWorkload('parksense-daemon');
    expect(hasDesc(parksense, 'YOLOv8')).toBe(true);

    const gesture = WorkloadGenerator.createProjectWorkload('esp32-tinyml');
    expect(hasDesc(gesture, 'int8 quantized')).toBe(true);

    const maze = WorkloadGenerator.createProjectWorkload('maze-solver');
    expect(hasDesc(maze, 'A*')).toBe(true);
  });
});
