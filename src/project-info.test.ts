import { describe, expect, it } from 'vitest';
import { projectInfo } from './project-info';

describe('Skill Time Bank project contract', () => {
  it('keeps locale and direction aligned', () => {
    expect(projectInfo.slug).toBe('skill-time-bank');
    expect(projectInfo.direction).toBe(projectInfo.locale.startsWith('fa') ? 'rtl' : 'ltr');
    expect(projectInfo.firstTask.length).toBeGreaterThan(8);
  });
});
