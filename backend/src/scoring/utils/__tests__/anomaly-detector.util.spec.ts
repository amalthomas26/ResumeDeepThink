import { detectMultiResumeAnomaly } from '../anomaly-detector.util';
import { ParsedResume } from '../../interfaces/parsed-resume.interface';

describe('Anomaly Detector Utility (Multi-Resume Merges)', () => {
  const makeParsedResume = (overrides: Partial<ParsedResume> = {}): ParsedResume => ({
    fullText: 'Resume text here with normal length and content.',
    sections: [
      {
        type: 'summary',
        headerText: 'Summary',
        content: 'Experienced engineer with expertise in web and mobile systems.',
        startLine: 0,
        endLine: 2,
        confidence: 1.0,
      },
      {
        type: 'experience',
        headerText: 'Experience',
        content: 'Senior Developer at Tech Corp from 2020 to 2023. Built cloud services and scaled databases.',
        startLine: 3,
        endLine: 10,
        confidence: 1.0,
      },
      {
        type: 'education',
        headerText: 'Education',
        content: 'BS in Computer Science from State University.',
        startLine: 11,
        endLine: 13,
        confidence: 1.0,
      },
      {
        type: 'skills',
        headerText: 'Skills',
        content: 'TypeScript, React, Node.js, SQL, AWS, Docker.',
        startLine: 14,
        endLine: 16,
        confidence: 1.0,
      },
    ],
    contactInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-123-4567',
      linkedinUrl: null,
      portfolioUrl: null,
    },
    experienceEntries: [],
    skillsList: ['TypeScript', 'React'],
    wordCount: 450,
    pageCount: 1,
    ...overrides,
  });

  it('passes normal single-candidate resumes with no anomaly', () => {
    const resume = makeParsedResume();
    const result = detectMultiResumeAnomaly(resume);
    expect(result.isMultiResume).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('detects a multi-resume document with duplicate Experience sections and excessive word count', () => {
    const longExperienceContent = 'Built microservices and distributed databases. '.repeat(40);
    const multiResume = makeParsedResume({
      wordCount: 1950,
      pageCount: 4,
      fullText: `
        First Candidate
        alice@example.com
        Experience
        ${longExperienceContent}
        
        Second Candidate
        bob@example.com
        Experience
        ${longExperienceContent}
      `,
      sections: [
        {
          type: 'experience',
          headerText: 'Work Experience',
          content: longExperienceContent,
          startLine: 3,
          endLine: 20,
          confidence: 0.9,
        },
        {
          type: 'experience',
          headerText: 'Professional Experience',
          content: longExperienceContent,
          startLine: 40,
          endLine: 60,
          confidence: 0.9,
        },
      ],
    });

    const result = detectMultiResumeAnomaly(multiResume);
    expect(result.isMultiResume).toBe(true);
    expect(result.reason).toContain('multi-resume merge');
    expect(result.reason).toContain('duplicate section blocks');
  });

  it('detects multi-resume when multiple candidate emails exist in an oversized document', () => {
    const multiResume = makeParsedResume({
      wordCount: 1850,
      pageCount: 4,
      fullText: `
        Candidate One: alice.smith@corporate.org
        Work history and projects...
        Candidate Two: bob.jones@differentfirm.com
        Another separate work history...
      `,
      sections: [
        {
          type: 'experience',
          headerText: 'Experience',
          content: 'Work history details here for Alice.'.repeat(20),
          startLine: 2,
          endLine: 20,
          confidence: 0.9,
        },
        {
          type: 'education',
          headerText: 'Education',
          content: 'College degree details for Bob.'.repeat(20),
          startLine: 25,
          endLine: 40,
          confidence: 0.9,
        },
      ],
    });

    const result = detectMultiResumeAnomaly(multiResume);
    expect(result.isMultiResume).toBe(true);
    expect(result.reason).toContain('multiple distinct contact emails');
  });
});
