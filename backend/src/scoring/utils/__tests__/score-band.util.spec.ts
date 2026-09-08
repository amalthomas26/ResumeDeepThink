import { getScoreBand } from '../score-band.util';

describe('getScoreBand', () => {
  it('should return "strong" for 85-100', () => {
    expect(getScoreBand(85).band).toBe('strong');
    expect(getScoreBand(100).band).toBe('strong');
    expect(getScoreBand(92).band).toBe('strong');
  });

  it('should return "workable" for 65-84', () => {
    expect(getScoreBand(65).band).toBe('workable');
    expect(getScoreBand(84).band).toBe('workable');
    expect(getScoreBand(75).band).toBe('workable');
  });

  it('should return "at-risk" for 40-64', () => {
    expect(getScoreBand(40).band).toBe('at-risk');
    expect(getScoreBand(64).band).toBe('at-risk');
    expect(getScoreBand(50).band).toBe('at-risk');
  });

  it('should return "high-risk" for 0-39', () => {
    expect(getScoreBand(0).band).toBe('high-risk');
    expect(getScoreBand(39).band).toBe('high-risk');
    expect(getScoreBand(20).band).toBe('high-risk');
  });

  it('should include human-readable labels', () => {
    expect(getScoreBand(90).label).toContain('minor polish');
    expect(getScoreBand(70).label).toContain('fixable gaps');
    expect(getScoreBand(50).label).toContain('mis-parsed');
    expect(getScoreBand(10).label).toContain('rewrite needed');
  });

  it('should handle boundary values correctly', () => {
    expect(getScoreBand(85).band).toBe('strong');
    expect(getScoreBand(84).band).toBe('workable');
    expect(getScoreBand(65).band).toBe('workable');
    expect(getScoreBand(64).band).toBe('at-risk');
    expect(getScoreBand(40).band).toBe('at-risk');
    expect(getScoreBand(39).band).toBe('high-risk');
  });

  it('should throw for out-of-range scores', () => {
    expect(() => getScoreBand(-1)).toThrow(RangeError);
    expect(() => getScoreBand(101)).toThrow(RangeError);
  });
});
