import { detectLanguage } from '../language-detector.util';

describe('Language Detector Utility', () => {
  it('identifies standard English resumes as English with high confidence', () => {
    const englishResume = `
      John Doe
      Software Engineer
      john.doe@example.com | (555) 123-4567 | New York, NY
      
      Professional Summary
      Accomplished software engineer with 6 years of experience designing, building, and deploying
      scalable cloud microservices and high-throughput REST APIs. Proven track record of improving
      system reliability and mentoring junior engineers.
      
      Experience
      Senior Backend Developer | Acme Corp | Jan 2021 - Present
      - Led a distributed team of 5 engineers to re-architect payments pipeline using NestJS and PostgreSQL.
      - Increased throughput by 42% and reduced latency by 60ms for critical customer-facing transactions.
      - Integrated automated CI/CD pipelines with GitHub Actions and Docker.
      
      Education
      Bachelor of Science in Computer Science | State University | 2016 - 2020
      
      Skills
      TypeScript, Node.js, Python, PostgreSQL, Redis, Docker, Kubernetes, AWS, REST APIs, GraphQL
    `;

    const result = detectLanguage(englishResume);
    expect(result.isEnglish).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.warningMessage).toBeUndefined();
  });

  it('identifies Hindi / Devanagari script resumes and provides clear diagnostic notice', () => {
    const hindiResume = `
      अजय कुमार
      सॉफ्टवेयर इंजीनियर
      ईमेल: ajay@example.com
      
      अनुभव और कार्य विवरण:
      मैंने पिछले पाँच वर्षों से विभिन्न वेब अनुप्रयोगों और मोबाइल प्रणालियों का विकास किया है।
      हमारी टीम ने डेटाबेस प्रबंधन और क्लाउड अवसंरचना के लिए आधुनिक तकनीकों का उपयोग किया।
      
      शिक्षा:
      कंप्यूटर विज्ञान में स्नातक, दिल्ली विश्वविद्यालय
      
      कौशल:
      प्रोग्रामिंग, डेटा विश्लेषण, समस्या समाधान
    `;

    const result = detectLanguage(hindiResume);
    expect(result.isEnglish).toBe(false);
    expect(result.detectedLanguageOrScript).toContain('Devanagari');
    expect(result.warningMessage).toContain('Devanagari');
    expect(result.warningMessage).toContain('calibrated for English-language resumes');
  });

  it('identifies Arabic script resumes', () => {
    const arabicResume = `
      أحمد محمد
      مهندس برمجيات
      البريد الإلكتروني: ahmed@example.com
      
      الخبرة المهنية:
      أكثر من سبع سنوات في تطوير الأنظمة السحابية وقواعد البيانات وإدارة فرق العمل البرمجية.
      تطوير واجهات برمجة التطبيقات وتحسين كفاءة المعاملات المالية للعملاء.
      
      التعليم:
      بكالوريوس علوم الحاسب الآلي
    `;

    const result = detectLanguage(arabicResume);
    expect(result.isEnglish).toBe(false);
    expect(result.detectedLanguageOrScript).toContain('Arabic');
  });

  it('identifies Spanish resumes and flags them with language guidance', () => {
    const spanishResume = `
      Carlos Morales
      Desarrollador de Software
      carlos@example.com
      
      Resumen Profesional
      Profesional con más de cinco años de experiencia en el desarrollo de software y gestión
      de proyectos tecnológicos. Especializado en la creación de aplicaciones web escalables
      con tecnologías modernas.
      
      Experiencia Laboral
      Ingeniero de Sistemas | Soluciones Digitales | 2019 - Presente
      - Lideró el equipo de ingenieros en el desarrollo de la plataforma de comercio electrónico.
      - Implementación de microservicios con Node.js y bases de datos relacionales PostgreSQL.
      - Optimización de procesos con metodologías ágiles Scrum para la entrega continua de productos.
      
      Educacion y Formacion
      Licenciatura en Informática | Universidad de Madrid
      
      Habilidades y Competencias
      Programación web, bases de datos, liderazgo de equipos y resolución de problemas.
    `;

    const result = detectLanguage(spanishResume);
    expect(result.isEnglish).toBe(false);
    expect(result.detectedLanguageOrScript).toBe('Spanish');
    expect(result.warningMessage).toContain('Spanish');
  });

  it('handles short or empty text safely without crashing', () => {
    expect(detectLanguage('').isEnglish).toBe(true);
    expect(detectLanguage('   ').isEnglish).toBe(true);
    const shortText = 'Jane Smith\nSoftware Developer\njane@example.com';
    expect(detectLanguage(shortText).isEnglish).toBe(true);
  });
});
