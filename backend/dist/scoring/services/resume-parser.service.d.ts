import { ParsedResume } from '../interfaces/parsed-resume.interface';
export declare class ResumeParserService {
    parse(text: string, pageCount: number): ParsedResume;
    private parseSections;
    private parseContactInfo;
    private extractName;
    private parseExperienceEntries;
    private extractDates;
    private extractTitleCompany;
    private parseSkillsList;
}
