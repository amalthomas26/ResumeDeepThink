export type SectionType = 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'awards' | 'languages' | 'unknown';
export interface ContactInfo {
    readonly name: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly linkedinUrl: string | null;
    readonly portfolioUrl: string | null;
}
export interface ExperienceEntry {
    readonly title: string | null;
    readonly company: string | null;
    readonly startDate: string | null;
    readonly endDate: string | null;
    readonly bullets: string[];
}
export interface ResumeSection {
    readonly type: SectionType;
    readonly headerText: string;
    readonly content: string;
    readonly startLine: number;
    readonly endLine: number;
    readonly confidence: number;
}
export interface ParsedResume {
    readonly fullText: string;
    readonly sections: ResumeSection[];
    readonly contactInfo: ContactInfo;
    readonly experienceEntries: ExperienceEntry[];
    readonly skillsList: string[];
    readonly wordCount: number;
    readonly pageCount: number;
}
