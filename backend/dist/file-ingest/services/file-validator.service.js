"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FileValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidatorService = void 0;
const common_1 = require("@nestjs/common");
const MAGIC_BYTES = [
    { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
    {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx',
        bytes: [0x50, 0x4b, 0x03, 0x04],
    },
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
let FileValidatorService = FileValidatorService_1 = class FileValidatorService {
    logger = new common_1.Logger(FileValidatorService_1.name);
    validate(file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('No file uploaded. Please select a PDF or DOCX resume.');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
                'Maximum allowed size is 5MB. Resumes are text-dominant and should be well under this limit.');
        }
        const ext = this.getExtension(file.originalname);
        if (ext !== 'pdf' && ext !== 'docx') {
            throw new common_1.BadRequestException(`Unsupported file type ".${ext}". Only PDF and DOCX files are accepted.`);
        }
        const detectedType = this.detectFileType(file.buffer);
        if (!detectedType) {
            throw new common_1.BadRequestException('This file does not appear to be a valid PDF or DOCX. ' +
                'It may be a renamed image, a corrupted file, or an unsupported format. ' +
                'Please upload a genuine PDF or DOCX resume.');
        }
        if (ext !== detectedType) {
            this.logger.warn(`Extension/content mismatch: .${ext} but detected as ${detectedType}`);
        }
        return { type: detectedType };
    }
    detectFileType(buffer) {
        if (buffer.length < 4)
            return null;
        for (const entry of MAGIC_BYTES) {
            const matches = entry.bytes.every((byte, i) => buffer[i] === byte);
            if (matches) {
                return entry.ext;
            }
        }
        return null;
    }
    getExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }
};
exports.FileValidatorService = FileValidatorService;
exports.FileValidatorService = FileValidatorService = FileValidatorService_1 = __decorate([
    (0, common_1.Injectable)()
], FileValidatorService);
//# sourceMappingURL=file-validator.service.js.map