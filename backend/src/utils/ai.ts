import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// 1. Analyze Job Description against Resume
export interface JDAnalysisResult {
  matchScore: number;
  missingSkills: string[];
  improvementSuggestions: string[];
  matchSummary: string;
}

export async function analyzeJobDescription(jd: string, resume: string): Promise<JDAnalysisResult> {
  if (!genAI) {
    return getMockAnalysis(jd, resume);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) optimizer and career coach.
      Compare the following Job Description and Resume.
      
      Job Description:
      ${jd}
      
      Resume:
      ${resume}
      
      Analyze the alignment and respond strictly with a JSON object. Do not include any markdown backticks.
      The JSON object must have this shape:
      {
        "matchScore": number (0 to 100 representing how well the resume matches the JD),
        "missingSkills": string[] (array of important skills present in the JD but missing or weak in the resume),
        "improvementSuggestions": string[] (actionable suggestions to tailor the resume for this specific JD),
        "matchSummary": string (a concise 3-4 sentence overview of the candidate's alignment, strengths, and primary gaps)
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Safely parse JSON
    const parsed = JSON.parse(text);
    return {
      matchScore: Number(parsed.matchScore) || 50,
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
      matchSummary: parsed.matchSummary || 'Could not generate summary.'
    };
  } catch (error) {
    console.error('Gemini API JD analysis failed, falling back to mock:', error);
    return getMockAnalysis(jd, resume);
  }
}

// 2. Generate Outreach Copy
export interface OutreachParams {
  type: 'cover_letter' | 'cold_email' | 'linkedin_message';
  companyName: string;
  jobTitle: string;
  jd: string;
  resume: string;
  senderName: string;
}

export async function generateOutreach(params: OutreachParams): Promise<string> {
  if (!genAI) {
    return getMockOutreach(params);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let typeInstructions = '';
    if (params.type === 'cover_letter') {
      typeInstructions = 'a professional, compelling Cover Letter (about 300 words). Make it engaging, structure it with introduction, body detailing matches, and a call-to-action.';
    } else if (params.type === 'cold_email') {
      typeInstructions = 'a short, catchy Cold Email. Include a Subject Line at the top, and keep the body clean, concise, and focused on scheduling a brief chat or explaining how my skills can help their team.';
    } else {
      typeInstructions = 'a highly concise LinkedIn Outreach Message (under 300 characters or 75 words). It must fit within character limits, be conversational, and end with a clear, polite question.';
    }

    const prompt = `
      You are an expert career agent. Write ${typeInstructions} based on the details below.
      
      Job Title: ${params.jobTitle}
      Company Name: ${params.companyName}
      Sender Name (User): ${params.senderName}
      
      Job Description:
      ${params.jd}
      
      Sender's Resume Content:
      ${params.resume}
      
      Ensure you tailor the writing to match the requirements of the job description with the candidate's achievements. Write it in first person. Do not output any notes, instructions, or meta-commentary, just output the generated document directly.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API outreach generation failed, falling back to mock:', error);
    return getMockOutreach(params);
  }
}

// Mock fallbacks to make local testing seamless without requiring API keys.
function getMockAnalysis(jd: string, resume: string): JDAnalysisResult {
  const jdLower = jd.toLowerCase();
  const resumeLower = resume.toLowerCase();
  
  // Extract some common skill matches and differences
  const possibleSkills = ['react', 'node', 'express', 'postgresql', 'typescript', 'python', 'java', 'docker', 'aws', 'prisma', 'graphql', 'mongodb', 'git', 'testing', 'ci/cd', 'tailwind'];
  
  const matched: string[] = [];
  const missing: string[] = [];
  
  possibleSkills.forEach(skill => {
    const inJD = jdLower.includes(skill);
    const inResume = resumeLower.includes(skill);
    
    if (inJD && inResume) {
      matched.push(skill.toUpperCase());
    } else if (inJD && !inResume) {
      missing.push(skill.toUpperCase());
    }
  });

  // Default fallback if we can't find anything
  if (missing.length === 0) {
    missing.push('SYSTEM ARCHITECTURE', 'TEST-DRIVEN DEVELOPMENT (TDD)', 'CI/CD PIPELINES');
  }
  if (matched.length === 0) {
    matched.push('TYPESCRIPT', 'REACT', 'GIT');
  }

  // Calculate a mock score based on matches
  const matchRatio = matched.length / (matched.length + missing.length || 1);
  const score = Math.round(55 + (matchRatio * 35)); // Range 55 to 90

  return {
    matchScore: score,
    missingSkills: missing,
    improvementSuggestions: [
      `Add explicit mentions of ${missing.slice(0, 2).join(' and ')} in your projects or professional summary.`,
      `Quantify your achievements using the Google X-Y-Z formula (e.g. Accomplished [X] as measured by [Y], by doing [Z]).`,
      `Align your job titles and core headers directly with the keywords in the Job Description.`,
      `Add a designated "Technical Skills" section highlighting the core keywords: ${matched.join(', ')}.`
    ],
    matchSummary: `Your profile has a solid baseline alignment with the role, matching on core frontend competencies like ${matched.slice(0, 3).join(', ')}. However, the job description places emphasis on backend scaling and deployment tools (${missing.slice(0, 3).join(', ')}) which are not prominently described in your resume. Tailoring your project section will increase your chances of passing ATS screening.`
  };
}

function getMockOutreach(params: OutreachParams): string {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const company = params.companyName || 'Target Company';
  const role = params.jobTitle || 'Software Engineer';
  const sender = params.senderName || 'Job Seeker';

  if (params.type === 'cover_letter') {
    return `${sender}
San Francisco, CA
${params.senderName.toLowerCase().replace(' ', '')}@email.com

${dateStr}

Hiring Team
${company}

Subject: Application for ${role} Role

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${role} position at ${company}. With my background in building responsive web applications and full-stack solutions, I am confident that my technical skills and proactive problem-solving approach align perfectly with the goals of your engineering team.

After reviewing the job description, I was particularly drawn to your focus on engineering excellence and scaling user experiences. In my previous work, I successfully engineered full-stack features using TypeScript, React, and modern databases, which resulted in a 25% improvement in load times and a 15% increase in user engagement. I am excited to bring this same drive for optimization to ${company}.

Specifically, I have hands-on experience in:
• Developing highly modular frontend components with React, Tailwind, and TypeScript.
• Structuring clean and robust API layers using Node.js, Express, and Prisma ORM.
• Collaborating in agile teams and maintaining rigorous version controls.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience and passion can add value to your team at ${company}.

Sincerely,

${sender}`;
  } else if (params.type === 'cold_email') {
    return `Subject: Passionate Full-Stack Engineer interested in ${role} openings at ${company}

Hi Hiring Team at ${company},

I hope this email finds you well.

My name is ${sender}, and I am a Full-Stack Software Engineer. I've been following ${company}'s recent growth in the industry, particularly your work on user-centric web platforms, and was incredibly impressed by your product's design and engineering standards.

I noticed you are currently looking for a ${role}. Given my experience building full-stack applications with TypeScript, React, and Express, I wanted to reach out and introduce myself. In my projects, I've prioritized building high-performance, accessible, and clean solutions that align with the requirements for this role.

I have attached my resume for your review. Would you be open to a 10-minute introductory call next week to discuss how my skill set might support your current engineering initiatives?

Thank you for your time and consideration.

Best regards,

${sender}
${params.senderName.toLowerCase().replace(' ', '')}@email.com
LinkedIn: linkedin.com/in/${params.senderName.toLowerCase().replace(' ', '')}`;
  } else {
    // LinkedIn Message (short)
    return `Hi Hiring Team, I hope you're doing well! I'm ${sender}, a Full-Stack developer. I saw your opening for ${role} at ${company} and felt my background with TypeScript, React, and Node.js aligns perfectly. I'd love to connect and briefly chat about how I can contribute to your team. Thanks!`;
  }
}
