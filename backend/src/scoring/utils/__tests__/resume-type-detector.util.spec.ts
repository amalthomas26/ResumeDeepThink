import { detectResumeType } from '../resume-type-detector.util';
import { ParsedResume } from '../../interfaces/parsed-resume.interface';
import { loadFixture, FIXTURES } from '../../test-utils/fixture-loader';

const makeResume = (fullText: string): ParsedResume => ({
  fullText,
  sections: [],
  contactInfo: { name: null, email: null, phone: null, linkedinUrl: null, portfolioUrl: null },
  experienceEntries: [],
  skillsList: [],
  wordCount: fullText.split(/\s+/).length,
  pageCount: 1,
});

describe('detectResumeType', () => {
  it('should detect a tech resume', () => {
    const text = loadFixture(FIXTURES.CLEAN);
    const result = detectResumeType(makeResume(text));
    expect(result).toBe('tech');
  });

  it('should detect a finance resume', () => {
    const financeText = `
      Senior Financial Analyst at BigBank Corp
      - Performed variance analysis and reconciliation of P&L statements
      - Managed budgeting and forecasting using SAP and advanced Excel
      - Prepared GST and TDS returns ensuring compliance
      - Reduced month-end close time by 30%
      Skills: Excel, SAP, Tally, Financial Modeling, Audit, Compliance
    `;
    const result = detectResumeType(makeResume(financeText));
    expect(result).toBe('finance');
  });

  it('should detect a support resume', () => {
    const supportText = `
      Customer Support Manager at HelpDesk Inc
      - Managed Zendesk implementation improving CSAT from 78% to 92%
      - Reduced first response time by 45% through process optimization
      - Trained team of 15 support agents on Freshdesk and Intercom
      - Maintained 95% SLA compliance across 500+ tickets per month
      Skills: Zendesk, Freshdesk, Salesforce Service Cloud, CSAT, NPS
    `;
    const result = detectResumeType(makeResume(supportText));
    expect(result).toBe('support');
  });

  it('should return general for ambiguous content', () => {
    const genericText = 'Hello world, this is a basic document with no specific keywords.';
    const result = detectResumeType(makeResume(genericText));
    expect(result).toBe('general');
  });
});
