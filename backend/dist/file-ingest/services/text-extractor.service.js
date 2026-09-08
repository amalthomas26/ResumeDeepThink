"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var TextExtractorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractorService = void 0;
const common_1 = require("@nestjs/common");
const { PDFParse, PasswordException } = require('pdf-parse');
const mammoth = __importStar(require("mammoth"));
const MIN_CHARS_PER_PAGE = 50;
const ENCODING_ISSUE_THRESHOLD = 0.05;
let TextExtractorService = TextExtractorService_1 = class TextExtractorService {
    logger = new common_1.Logger(TextExtractorService_1.name);
    async extractFromPdf(buffer) {
        let parser;
        try {
            parser = new PDFParse({ data: buffer });
            await parser.load();
            const textResult = await parser.getText();
            const infoResult = await parser.getInfo().catch(() => null);
            const text = textResult.text || '';
            const pageCount = textResult.total || textResult.pages?.length || 1;
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            const charsPerPage = text.length / pageCount;
            const isImageOnly = charsPerPage < MIN_CHARS_PER_PAGE;
            const hasEncodingIssues = this.detectEncodingIssues(text);
            return {
                text,
                pageCount,
                wordCount,
                isImageOnly,
                hasEncodingIssues,
                metadata: {
                    title: infoResult?.info?.Title || undefined,
                    author: infoResult?.info?.Author || undefined,
                },
            };
        }
        catch (error) {
            if ((PasswordException && error instanceof PasswordException) ||
                (error instanceof Error && /password|encrypted/i.test(error.message))) {
                throw new Error('This file appears to be password-protected. Please remove the password protection and re-upload.');
            }
            throw error;
        }
        finally {
            if (parser) {
                await parser.destroy().catch(() => { });
            }
        }
    }
    async extractFromDocx(buffer) {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value || '';
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (result.messages.length > 0) {
            this.logger.warn(`DOCX extraction warnings: ${result.messages.map((m) => m.message).join('; ')}`);
        }
        const estimatedPages = Math.max(1, Math.ceil(wordCount / 350));
        return {
            text,
            pageCount: estimatedPages,
            wordCount,
            isImageOnly: false,
            hasEncodingIssues: this.detectEncodingIssues(text),
            metadata: {},
        };
    }
    detectEncodingIssues(text) {
        if (text.length === 0)
            return false;
        let issueCount = 0;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code === 0xfffd)
                issueCount++;
            else if (code < 32 && code !== 9 && code !== 10 && code !== 13)
                issueCount++;
        }
        return issueCount / text.length > ENCODING_ISSUE_THRESHOLD;
    }
};
exports.TextExtractorService = TextExtractorService;
exports.TextExtractorService = TextExtractorService = TextExtractorService_1 = __decorate([
    (0, common_1.Injectable)()
], TextExtractorService);
//# sourceMappingURL=text-extractor.service.js.map