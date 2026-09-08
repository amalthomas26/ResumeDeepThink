export declare class FileValidatorService {
    private readonly logger;
    validate(file: Express.Multer.File): {
        type: 'pdf' | 'docx';
    };
    private detectFileType;
    private getExtension;
}
