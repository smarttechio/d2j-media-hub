import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import {
  isSupabaseConfigured,
  loadStateFromSupabase,
  saveStateToSupabase,
} from "./supabase";

export type ArticleStatus = "Draft" | "Submitted for Review" | "Approved" | "Published" | "Unpublished";
export type VerificationType = "V" | "S" | "D"; // Verified source, Source checked, Demo content
export type ArtTheme = "campus" | "library" | "quran" | "community" | "biz" | "well";

export type ArticleBlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "gallery"
  | "quote"
  | "video";

export interface ArticleContentBlock {
  id: string;
  type: ArticleBlockType;
  text?: string;
  imageUrl?: string;
  imageCaption?: string;
  secondImageUrl?: string;
  secondImageCaption?: string;
  videoUrl?: string;
  quoteAttribution?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string; // e.g., 'news', 'campus', 'islam', 'education', 'business', 'health', 'lifestyle', 'opinion', 'multimedia', 'events'
  tags: string[];
  summary: string;
  body: string[];
  contentBlocks?: ArticleContentBlock[];
  authorId: string;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  artTheme: ArtTheme;
  featuredImage?: string;
  featuredVideo?: string;
  imageCaption?: string;
  verification: VerificationType;
  sourceName?: string;
  sourceUrl?: string;
  status: ArticleStatus;
  featured?: boolean;
  breaking?: boolean;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  correctionNote?: string;
  lastEditedBy?: string;
  lastEditedById?: string;
  approvedBy?: string;
  approvedById?: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  authorName: string;
  authorEmail?: string;
  locationOrCampus?: string;
  content: string;
  createdAt: string;
  status: "Approved" | "Pending" | "Hidden";
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  topics: string[];
}

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarInitials: string;
  verifiedCredentials?: string;
}

export type OpportunityStatus = "Draft" | "Source Verification" | "Published" | "Expired/Archived";

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  provider: string;
  type: "Scholarship" | "Internship" | "Fellowship" | "Graduate Opportunity" | "Career Guide" | "Programme";
  summary: string;
  eligibility: string;
  benefits: string;
  deadline: string;
  officialUrl: string;
  sourceName: string;
  openClosedStatus: "Upcoming" | "Open" | "Closed" | "Closed (deadline unconfirmed)";
  lastVerified: string;
  notes: string;
  workflowStatus: OpportunityStatus;
}

export type ScholarQAStatus =
  | "Private Submission"
  | "Editorial Screening"
  | "Scholar Review"
  | "Approved Public Answer"
  | "Published"
  | "Declined";

export interface ScholarQuestion {
  id: string;
  slug: string;
  topic: string;
  subject: string;
  questionText: string;
  publicQuestionSummary?: string;
  displayName?: string;
  email?: string;
  anonymousPreference: boolean;
  consentGiven: boolean;
  submittedAt: string;
  status: ScholarQAStatus;
  answerText?: string[];
  references?: string[];
  scholarReviewerName?: string;
  scholarCredentials?: string;
  editorApproverName?: string;
  reviewedAt?: string;
  publishedAt?: string;
  isDemo?: boolean;
}

export type StorySubmissionStatus =
  | "Submitted"
  | "Editorial Review"
  | "Accepted"
  | "Rejected"
  | "Prepared for Publication";

export interface StorySubmission {
  id: string;
  contributorName: string;
  email: string;
  institution?: string;
  location?: string;
  phone?: string;
  category: string;
  headline: string;
  summary: string;
  body: string;
  preferredByline?: string;
  sourceLinks?: string;
  attachments: { name: string; size: number; url?: string }[];
  consentGiven: boolean;
  submittedAt: string;
  status: StorySubmissionStatus;
  editorNotes?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  enquiryType: string;
  organisation?: string;
  subject?: string;
  articleUrl?: string;
  message: string;
  submittedAt: string;
  status: "New" | "Reviewed" | "Resolved";
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  caption: string;
  credit: string;
  uploadedAt: string;
  uploadedBy: string;
}

export type UserRole = "SUPER_ADMIN" | "ADMINISTRATOR" | "EDITOR" | "CONTRIBUTOR" | "SCHOLAR";

export type DashboardPermission =
  | "overview"
  | "articles"
  | "publish_articles"
  | "categories"
  | "authors"
  | "opportunities"
  | "ask-scholar"
  | "approved-answers"
  | "story-submissions"
  | "contacts"
  | "media"
  | "users"
  | "admin-reviews"
  | "analytics"
  | "advertisements"
  | "seo-performance"
  | "settings";

export const ALL_DASHBOARD_PERMISSIONS: DashboardPermission[] = [
  "overview",
  "articles",
  "publish_articles",
  "categories",
  "authors",
  "opportunities",
  "ask-scholar",
  "approved-answers",
  "story-submissions",
  "contacts",
  "media",
  "users",
  "admin-reviews",
  "analytics",
  "advertisements",
  "seo-performance",
  "settings",
];

export function getDefaultPermissionsForRole(role: UserRole): DashboardPermission[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [...ALL_DASHBOARD_PERMISSIONS];
    case "ADMINISTRATOR":
      return [
        "overview",
        "articles",
        "publish_articles",
        "categories",
        "authors",
        "opportunities",
        "ask-scholar",
        "approved-answers",
        "story-submissions",
        "contacts",
        "media",
        "admin-reviews",
        "analytics",
        "advertisements",
        "seo-performance",
        "settings",
      ];
    case "EDITOR":
      return [
        "overview",
        "articles",
        "publish_articles",
        "categories",
        "authors",
        "opportunities",
        "ask-scholar",
        "approved-answers",
        "story-submissions",
        "contacts",
        "media",
        "analytics",
        "seo-performance",
      ];
    case "SCHOLAR":
      return ["overview", "ask-scholar", "approved-answers"];
    case "CONTRIBUTOR":
    default:
      return ["overview", "articles", "media"];
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  passwordHash: string;
  active: boolean;
  isSuperAdmin?: boolean;
  permissions?: DashboardPermission[];
  allowedCategories?: string[];
  createdBy?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AdminActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType:
    | "article"
    | "opportunity"
    | "scholar_qa"
    | "story_submission"
    | "contact"
    | "comment"
    | "user"
    | "category"
    | "author"
    | "media"
    | "advertisement"
    | "settings";
  targetId?: string;
  targetTitle: string;
  statusChange?: string;
  details?: string;
  superAdminReviewStatus?: "Pending Review" | "Approved" | "Needs Revision";
  superAdminReviewNote?: string;
  reviewedBySuperAdmin?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type AdPlacement =
  | "homepage_header"
  | "homepage_between_sections"
  | "article_top"
  | "in_article"
  | "article_bottom"
  | "desktop_sidebar"
  | "category_page"
  | "mobile_responsive";

export type AdStatus = "Active" | "Paused" | "Expired" | "Rejected";
export type AdPaymentStatus = "Paid" | "Pending" | "Part-Paid" | "Complimentary";

export interface Advertisement {
  id: string;
  title: string;
  advertiserName: string;
  bannerUrl: string;
  destinationUrl: string;
  placement: AdPlacement;
  dimensions: "728x90" | "970x90" | "300x250" | "300x600" | "320x100";
  labelType: "Advertisement" | "Sponsored";
  targetCategories: string[]; // ['ALL'] or specific category slugs
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AdStatus;
  priceNgn: number;
  paymentStatus: AdPaymentStatus;
  impressions: number;
  clicks: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAnalyticsRollup {
  date: string; // YYYY-MM-DD
  pageViews: number;
  uniqueVisitors: number;
  articleViews: Record<string, number>;
  sources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  countries: Record<string, number>;
  totalEngagementSeconds: number;
  engagedSessions: number;
}

export interface SiteSettings {
  siteName: string;
  shortName: string;
  tagline: string;
  breakingNewsEnabled: boolean;
  breakingNewsText: string;
  breakingNewsUrl: string;
  newsletterProviderConfigured: boolean;
  newsletterProviderName: string;
  officialEmail: string;
  businessEmail: string;
  officeLocation: string;
  socialLinks: {
    facebook: string;
    x: string;
    whatsapp: string;
  };
  showPublicArticleViews?: boolean;
  ga4MeasurementId?: string;
  adsenseEnabled?: boolean;
  adsenseClientId?: string;
}

export interface DatabaseSchema {
  articles: Article[];
  deletedArticleIds?: string[];
  categories: Category[];
  authors: Author[];
  opportunities: Opportunity[];
  scholarQuestions: ScholarQuestion[];
  storySubmissions: StorySubmission[];
  contactSubmissions: ContactSubmission[];
  comments?: ArticleComment[];
  media: MediaItem[];
  users: User[];
  activityLogs?: AdminActivityLog[];
  advertisements?: Advertisement[];
  analyticsRollups?: DailyAnalyticsRollup[];
  settings: SiteSettings;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_d2j_salt_2026").digest("hex");
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

const DEFAULT_CATEGORIES: Category[] = [
  {
    slug: "news",
    name: "News",
    description: "Reporting on Nigerian Muslim communities, education, youth and international Muslim affairs.",
    topics: ["All", "Nigeria", "Education policy", "Youth and community", "International", "JAMB", "MSSN"],
  },
  {
    slug: "campus",
    name: "Campus and Student Life",
    description: "The voice of Muslim students in Nigerian universities, polytechnics and colleges: campus news, achievements, opportunities and student voices.",
    topics: ["All", "Campus News", "Student Achievements", "Scholarships", "Internships", "Campus Organisations", "Student Voices", "Events", "MSSN", "Study tips"],
  },
  {
    slug: "islam",
    name: "Islamic Knowledge",
    description: "Educational articles, study guides and reflections for Muslim students and young people. Religious guidance appears only after scholarly review.",
    topics: ["All", "Qur’an and Tafsir", "Hadith and Sunnah", "Islamic History", "Faith and Spirituality", "Worship and Daily Practice", "Character and Ethics", "Family and Society"],
  },
  {
    slug: "education",
    name: "Education and Careers",
    description: "Study, skills, scholarship guidance and career development for students and graduates.",
    topics: ["All", "Careers", "Skills", "Scholarship guidance", "Internship opportunities", "Academic development"],
  },
  {
    slug: "business",
    name: "Business and Economy",
    description: "Economic developments, Muslim-owned businesses, entrepreneurship, halal finance and budgeting.",
    topics: ["All", "Money", "Entrepreneurship", "Islamic Finance", "Halal Business"],
  },
  {
    slug: "health",
    name: "Health and Well-being",
    description: "Physical and mental health, student stress management, nutrition and evidence-based well-being.",
    topics: ["All", "Well-being", "Student Health", "Nutrition", "Mental Health"],
  },
  {
    slug: "politics",
    name: "Politics and Society",
    description: "Nigerian politics, public policy, civic education, youth participation and governance.",
    topics: ["All", "Governance", "Civic Education", "Public Policy", "Student Union"],
  },
  {
    slug: "lifestyle",
    name: "Fashion, Food and Lifestyle",
    description: "Modest fashion, halal food, affordable student meals, culture and positive youth lifestyle.",
    topics: ["All", "Fashion", "Food", "Culture", "Student Living"],
  },
  {
    slug: "opinion",
    name: "Opinion and Features",
    description: "Signed commentary, student experiences, long-form features and human-interest reporting. Clearly labelled as opinion.",
    topics: ["All", "Opinion", "Features", "Student Perspectives"],
  },
  {
    slug: "multimedia",
    name: "Multimedia",
    description: "Short reminders, recorded lectures, scholar interviews, podcasts and campus video reports.",
    topics: ["All", "Videos", "Podcasts", "Lectures"],
  },
  {
    slug: "events",
    name: "Community Events",
    description: "Lectures, conferences, campus programmes, youth camps and Muslim organisation announcements.",
    topics: ["All", "Conferences", "Youth Camps", "Seminars"],
  },
];

const DEFAULT_AUTHORS: Author[] = [
  {
    id: "auth-1",
    name: "D2J Editorial Desk",
    role: "Editorial Summary Team",
    bio: "The D-Path to Jannah Media Hub editorial desk produces verified source summaries and original reporting focused on Nigerian Muslim communities and students.",
    avatarInitials: "D",
    verifiedCredentials: "Official D2J Editorial Team",
  },
  {
    id: "auth-lukman-raimi",
    name: "Lukman Raimi, PhD, LL.M, MNIM",
    role: "Educational Administrator, Public Speaker & Lecturer",
    bio: "Dr. Lukman Raimi is an educational administrator, public speaker, former deputy Imam at two higher education institutions, and lecturer with over 30 years of cumulative academic and leadership experience.",
    avatarInitials: "L",
    verifiedCredentials: "PhD, LL.M, MNIM — Educational Administrator & Lecturer",
  },
  {
    id: "auth-2",
    name: "Demo Author",
    role: "Staff Writer (Demo)",
    bio: "Sample author profile used on demonstration layout articles until live editorial bylines are assigned.",
    avatarInitials: "S",
  },
];

const DEMO_BODY = [
  "This is demo content written to test layout and reading comfort. It describes no real event, person or organisation.",
  "Students often balance study, work and community commitments. A well-planned programme can bring study skills, digital skills and mentoring together in one place, and give younger students a clear picture of what to expect on campus.",
  "On the live site, every story carries a named source, a publication date, a verification badge and clear editorial attribution.",
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art-1795602609830",
    slug: "three-markazud-dawah-members-excel-as-pcn-inducts-139-oau-pharmacy-graduates",
    title: "Three Markazud-Da’wah Members Excel As PCN Inducts 139 OAU Pharmacy Graduates",
    category: "campus",
    tags: [
      "Campus News",
      "Student Achievements",
      "Campus Organisations",
      "OAU Ile-Ife",
      "Markazud-Da’wah",
      "Pharmacy Council of Nigeria",
    ],
    summary:
      "Three members of Markazud-Da’wah Wa Thaqafatil-Islamiyyah have distinguished themselves academically as the Pharmacy Council of Nigeria (PCN) inducted 139 pharmacy graduates of Obafemi Awolowo University (OAU), Ile-Ife, Osun State, into the pharmacy profession.",
    body: [
      "The induction ceremony, held on Tuesday at the university campus in Ile-Ife, marked a significant milestone in the academic and professional journeys of the graduates as they formally joined the pharmacy profession.",
      "The three outstanding graduates are Tayo Sofiyyah, Eniola Jamiu and Abojututu Khadijah, who have all played active leadership roles in Markazud-Da’wah, an Islamic organisation known for its religious, educational and social activities.",
      "Tayo Sofiyyah, a former Female Coordinator of the organisation, and Eniola Jamiu, a former Deputy Coordinator, both graduated with distinctions, demonstrating exceptional academic performance throughout their pharmacy studies.",
      "Similarly, Abojututu Khadijah, who previously served as Chairman of the Sisters Awareness Programme (SAP), a committee under Markazud-Da’wah, successfully completed her pharmacy programme with a pass.",
      "Their academic accomplishments have been described as a source of pride and encouragement to members of the organisation, particularly young Muslim students, as they demonstrate the importance of combining religious commitment, leadership responsibilities and academic excellence.",
      "Their successful induction into the pharmacy profession marks the beginning of a new chapter in their careers, with expectations that they will contribute meaningfully to healthcare delivery and pharmaceutical practice in Nigeria.",
    ],
    contentBlocks: [
      {
        id: "blk-1795601588108-1g36",
        type: "paragraph",
        text: "The induction ceremony, held on Tuesday at the university campus in Ile-Ife, marked a significant milestone in the academic and professional journeys of the graduates as they formally joined the pharmacy profession.\n\nThe three outstanding graduates are Tayo Sofiyyah, Eniola Jamiu and Abojututu Khadijah, who have all played active leadership roles in Markazud-Da’wah, an Islamic organisation known for its religious, educational and social activities.",
      },
      {
        id: "blk-1795602424877-zd9o",
        type: "paragraph",
        text: "Tayo Sofiyyah, a former Female Coordinator of the organisation, and Eniola Jamiu, a former Deputy Coordinator, both graduated with distinctions, demonstrating exceptional academic performance throughout their pharmacy studies.\n\nSimilarly, Abojututu Khadijah, who previously served as Chairman of the Sisters Awareness Programme (SAP), a committee under Markazud-Da’wah, successfully completed her pharmacy programme with a pass.",
      },
      {
        id: "blk-1795602536268-xihq",
        type: "paragraph",
        text: "Their academic accomplishments have been described as a source of pride and encouragement to members of the organisation, particularly young Muslim students, as they demonstrate the importance of combining religious commitment, leadership responsibilities and academic excellence.\n\nTheir successful induction into the pharmacy profession marks the beginning of a new chapter in their careers, with expectations that they will contribute meaningfully to healthcare delivery and pharmaceutical practice in Nigeria.",
      },
    ],
    featuredImage: "/uploads/markazud-dawah-oau-pharmacy-graduates.jpg",
    imageCaption:
      "Three Markazud-Da’wah Wa Thaqafatil-Islamiyyah members — Tayo Sofiyyah, Eniola Jamiu, and Abojututu Khadijah — inducted into the pharmacy profession at Obafemi Awolowo University (OAU), Ile-Ife.",
    authorId: "usr-sodiq",
    authorName: "Sodiq Lawal",
    publishedAt: "2026-11-25",
    updatedAt: "2026-11-25",
    artTheme: "campus",
    verification: "V",
    sourceName: "Markazud-Da’wah Wa Thaqafatil-Islamiyyah / OAU Campus Desk",
    status: "Published",
    featured: true,
    breaking: true,
    views: 245,
  },
  {
    id: "art-from-fear-to-eloquence-lukman-raimi",
    slug: "from-fear-to-eloquence-eight-practical-strategies-for-overcoming-public-speaking-anxiety-and-building-confidence",
    title:
      "From Fear to Eloquence: Eight Practical Strategies for Overcoming Public Speaking Anxiety and Building Confidence",
    category: "education",
    tags: [
      "Public Speaking",
      "Glossophobia",
      "Effective Communication",
      "Confidence Building",
      "Leadership Development",
      "Personal Development",
      "Professional Development",
      "Communication Skills",
      "Academic Leadership",
      "Spiritual Intelligence",
      "Emotional Intelligence",
      "Lifelong Learning",
    ],
    summary:
      "Drawing on over 30 years of cumulative experience as an educational administrator, public speaker, former deputy Imam and lecturer, Dr. Lukman Raimi shares eight practical and spiritual strategies for overcoming glossophobia (public speaking anxiety) and communicating with confidence.",
    body: [
      "By Lukman Raimi, PhD, LL.M, MNIM",
      "As an educational administrator, public speaker, former deputy Imam at two higher education institutions, and lecturer with a cumulative experience spanning over 30 years, I have come to appreciate that effective public speaking is not necessarily an innate talent but a competence developed through continuous learning, deliberate practice and emotional self-regulation.",
      "Public speaking anxiety, commonly referred to as glossophobia, is a challenge experienced by many individuals, irrespective of their educational qualifications, professional accomplishments or intellectual capabilities. Even experienced speakers experience nervousness before addressing an audience.",
      "Drawing on my diverse experiences, I wish to share the eight practical strategies with individuals who experience anxiety or phobia associated with public speaking.",
      "1. Seek Divine Assistance and Spiritual Composure: As a Muslim, I begin by seeking divine assistance, clarity of thought, eloquence and confidence. Spiritual preparation complements intellectual preparation and provides a sense of reassurance and emotional stability.",
      "How: At corporate, academic and secular events, I silently recite the supplication of Prophet Musa (AS):",
      "“My Lord, expand for me my chest, ease for me my task, and untie the knot from my tongue so that they may understand my speech.” (Qur’an 20:25–28).",
      "At Islamic events, I openly commence with Bismillahir-Rahmanir-Rahim, followed by the traditional Khutbatul Hajah. By the time I conclude the opening supplication, much of the initial nervousness has subsided. (Hahaha!)",
      "2. Reframe Nervousness as Positive Energy: A racing heartbeat, sweaty palms and heightened alertness are natural physiological responses to stressful situations. Rather than interpreting these reactions as signs of weakness or impending failure, regard them as indications of readiness and excitement.",
      "How: Replace negative thoughts such as “I am going to fail” with positive affirmations such as “I am prepared, knowledgeable and capable of delivering a meaningful presentation.” I can do it!",
      "3. Prepare Thoroughly Without Excessive Memorisation: Adequate preparation enhances intellectual confidence and reduces uncertainty. However, memorising an entire speech word for word may increase anxiety when a speaker forgets a particular sentence.",
      "How: Develop a structured outline comprising your introduction, key arguments, supporting examples and conclusion. Use brief notes or keywords to guide your presentation while maintaining flexibility and spontaneity.",
      "4. Engage in Deliberate and Consistent Practice: Public speaking is a competence strengthened through repeated exposure and experiential learning. Regular practice gradually reduces apprehension and improves articulation, composure and delivery.",
      "How: Rehearse aloud while standing, practise before a mirror, record yourself using your mobile phone and seek constructive feedback from trusted colleagues, friends or family members. Progress gradually from small audiences to larger gatherings.",
      "5. Regulate Your Breathing: Controlled breathing helps regulate physiological arousal, reduce anxiety and maintain emotional stability before and during presentations.",
      "How: Practise the box-breathing technique: inhale for four seconds, hold for four seconds, exhale for four seconds and hold for another four seconds. Repeat several times if comfortable. Alternatively, breathe slowly with a slightly longer exhalation.",
      "6. Release Physical and Muscular Tension: Anxiety often manifests through muscular stiffness, trembling hands and restricted body movements. Physical relaxation can improve composure and facilitate natural delivery.",
      "How: Before your presentation, take a short walk, stretch gently, relax your shoulders and engage in light physical movements. Adopt an upright but relaxed posture when addressing your audience.",
      "7. Prioritise the Audience and the Message: Excessive self-consciousness frequently intensifies public speaking anxiety. Effective communication requires shifting attention from personal insecurities to the value of the knowledge being communicated.",
      "How: Ask yourself: What knowledge am I sharing? What problem am I addressing? How will my audience benefit from this presentation? Maintain natural eye contact and concentrate on communicating value rather than seeking personal perfection.",
      "8. Embrace Strategic Pauses and Silence: Silence is not necessarily an indication of incompetence or inadequate preparation. Strategic pauses are powerful rhetorical devices that enhance clarity, emphasis, audience engagement and comprehension.",
      "How: Pause briefly after communicating an important point, before introducing a new argument or thought. Avoid filling every moment of silence with unnecessary expressions such as “um,” “actually” or “you know.”",
      "Concluding Reflection",
      "The ultimate objective of public speaking is not perfection but effective communication, knowledge dissemination and meaningful audience engagement. Confidence is not necessarily a prerequisite for public speaking; it is often an outcome of consistent practice, adequate preparation and repeated exposure.",
      "Do not wait until fear disappears before accepting speaking opportunities. Start small, embrace constructive criticism, learn from your mistakes and progressively expand your comfort zone. Where anxiety is severe or persistent, professional psychological support may also be beneficial.",
      "Great public speakers are not necessarily born; they are developed through spiritual composure, intellectual preparation, deliberate practice, perseverance and purposeful engagement.",
      "#PublicSpeaking #Glossophobia #EffectiveCommunication #ConfidenceBuilding #LeadershipDevelopment #PersonalDevelopment #ProfessionalDevelopment #CommunicationSkills #AcademicLeadership #SpiritualIntelligence #EmotionalIntelligence #lifelonglearninglifetimeknowledge #lifelonglearning",
    ],
    contentBlocks: [
      {
        id: "blk-ffe-byline",
        type: "paragraph",
        text: "**Lukman Raimi, PhD, LL.M, MNIM**",
      },
      {
        id: "blk-ffe-intro-1",
        type: "paragraph",
        text: "As an educational administrator, public speaker, former deputy Imam at two higher education institutions, and lecturer with a cumulative experience spanning over 30 years, I have come to appreciate that effective public speaking is not necessarily an innate talent but a competence developed through continuous learning, deliberate practice and emotional self-regulation.",
      },
      {
        id: "blk-ffe-intro-2",
        type: "paragraph",
        text: "Public speaking anxiety, commonly referred to as glossophobia, is a challenge experienced by many individuals, irrespective of their educational qualifications, professional accomplishments or intellectual capabilities. Even experienced speakers experience nervousness before addressing an audience.",
      },
      {
        id: "blk-ffe-intro-3",
        type: "paragraph",
        text: "Drawing on my diverse experiences, I wish to share the eight practical strategies with individuals who experience anxiety or phobia associated with public speaking.",
      },
      {
        id: "blk-ffe-1",
        type: "heading",
        text: "1. Seek Divine Assistance and Spiritual Composure",
      },
      {
        id: "blk-ffe-1-p1",
        type: "paragraph",
        text: "As a Muslim, I begin by seeking divine assistance, clarity of thought, eloquence and confidence. Spiritual preparation complements intellectual preparation and provides a sense of reassurance and emotional stability.",
      },
      {
        id: "blk-ffe-1-p2",
        type: "paragraph",
        text: "**How:** At corporate, academic and secular events, I silently recite the supplication of Prophet Musa (AS):",
      },
      {
        id: "blk-ffe-1-q",
        type: "quote",
        text: "“My Lord, expand for me my chest, ease for me my task, and untie the knot from my tongue so that they may understand my speech.” (Qur’an 20:25–28).",
        quoteAttribution: "Qur’an 20:25–28",
      },
      {
        id: "blk-ffe-1-p3",
        type: "paragraph",
        text: "At Islamic events, I openly commence with Bismillahir-Rahmanir-Rahim, followed by the traditional Khutbatul Hajah. By the time I conclude the opening supplication, much of the initial nervousness has subsided. (Hahaha!)",
      },
      {
        id: "blk-ffe-2",
        type: "heading",
        text: "2. Reframe Nervousness as Positive Energy",
      },
      {
        id: "blk-ffe-2-p1",
        type: "paragraph",
        text: "A racing heartbeat, sweaty palms and heightened alertness are natural physiological responses to stressful situations. Rather than interpreting these reactions as signs of weakness or impending failure, regard them as indications of readiness and excitement.",
      },
      {
        id: "blk-ffe-2-p2",
        type: "paragraph",
        text: "**How:** Replace negative thoughts such as “I am going to fail” with positive affirmations such as “I am prepared, knowledgeable and capable of delivering a meaningful presentation.” I can do it!",
      },
      {
        id: "blk-ffe-3",
        type: "heading",
        text: "3. Prepare Thoroughly Without Excessive Memorisation",
      },
      {
        id: "blk-ffe-3-p1",
        type: "paragraph",
        text: "Adequate preparation enhances intellectual confidence and reduces uncertainty. However, memorising an entire speech word for word may increase anxiety when a speaker forgets a particular sentence.",
      },
      {
        id: "blk-ffe-3-p2",
        type: "paragraph",
        text: "**How:** Develop a structured outline comprising your introduction, key arguments, supporting examples and conclusion. Use brief notes or keywords to guide your presentation while maintaining flexibility and spontaneity.",
      },
      {
        id: "blk-ffe-4",
        type: "heading",
        text: "4. Engage in Deliberate and Consistent Practice",
      },
      {
        id: "blk-ffe-4-p1",
        type: "paragraph",
        text: "Public speaking is a competence strengthened through repeated exposure and experiential learning. Regular practice gradually reduces apprehension and improves articulation, composure and delivery.",
      },
      {
        id: "blk-ffe-4-p2",
        type: "paragraph",
        text: "**How:** Rehearse aloud while standing, practise before a mirror, record yourself using your mobile phone and seek constructive feedback from trusted colleagues, friends or family members. Progress gradually from small audiences to larger gatherings.",
      },
      {
        id: "blk-ffe-5",
        type: "heading",
        text: "5. Regulate Your Breathing",
      },
      {
        id: "blk-ffe-5-p1",
        type: "paragraph",
        text: "Controlled breathing helps regulate physiological arousal, reduce anxiety and maintain emotional stability before and during presentations.",
      },
      {
        id: "blk-ffe-5-p2",
        type: "paragraph",
        text: "**How:** Practise the box-breathing technique: inhale for four seconds, hold for four seconds, exhale for four seconds and hold for another four seconds. Repeat several times if comfortable. Alternatively, breathe slowly with a slightly longer exhalation.",
      },
      {
        id: "blk-ffe-6",
        type: "heading",
        text: "6. Release Physical and Muscular Tension",
      },
      {
        id: "blk-ffe-6-p1",
        type: "paragraph",
        text: "Anxiety often manifests through muscular stiffness, trembling hands and restricted body movements. Physical relaxation can improve composure and facilitate natural delivery.",
      },
      {
        id: "blk-ffe-6-p2",
        type: "paragraph",
        text: "**How:** Before your presentation, take a short walk, stretch gently, relax your shoulders and engage in light physical movements. Adopt an upright but relaxed posture when addressing your audience.",
      },
      {
        id: "blk-ffe-7",
        type: "heading",
        text: "7. Prioritise the Audience and the Message",
      },
      {
        id: "blk-ffe-7-p1",
        type: "paragraph",
        text: "Excessive self-consciousness frequently intensifies public speaking anxiety. Effective communication requires shifting attention from personal insecurities to the value of the knowledge being communicated.",
      },
      {
        id: "blk-ffe-7-p2",
        type: "paragraph",
        text: "**How:** Ask yourself: What knowledge am I sharing? What problem am I addressing? How will my audience benefit from this presentation? Maintain natural eye contact and concentrate on communicating value rather than seeking personal perfection.",
      },
      {
        id: "blk-ffe-8",
        type: "heading",
        text: "8. Embrace Strategic Pauses and Silence",
      },
      {
        id: "blk-ffe-8-p1",
        type: "paragraph",
        text: "Silence is not necessarily an indication of incompetence or inadequate preparation. Strategic pauses are powerful rhetorical devices that enhance clarity, emphasis, audience engagement and comprehension.",
      },
      {
        id: "blk-ffe-8-p2",
        type: "paragraph",
        text: "**How:** Pause briefly after communicating an important point, before introducing a new argument or thought. Avoid filling every moment of silence with unnecessary expressions such as “um,” “actually” or “you know.”",
      },
      {
        id: "blk-ffe-conc-h",
        type: "heading",
        text: "Concluding Reflection",
      },
      {
        id: "blk-ffe-conc-1",
        type: "paragraph",
        text: "The ultimate objective of public speaking is not perfection but effective communication, knowledge dissemination and meaningful audience engagement. Confidence is not necessarily a prerequisite for public speaking; it is often an outcome of consistent practice, adequate preparation and repeated exposure.",
      },
      {
        id: "blk-ffe-conc-2",
        type: "paragraph",
        text: "Do not wait until fear disappears before accepting speaking opportunities. Start small, embrace constructive criticism, learn from your mistakes and progressively expand your comfort zone. Where anxiety is severe or persistent, professional psychological support may also be beneficial.",
      },
      {
        id: "blk-ffe-conc-3",
        type: "paragraph",
        text: "Great public speakers are not necessarily born; they are developed through spiritual composure, intellectual preparation, deliberate practice, perseverance and purposeful engagement.",
      },
      {
        id: "blk-ffe-tags",
        type: "paragraph",
        text: "#PublicSpeaking #Glossophobia #EffectiveCommunication #ConfidenceBuilding #LeadershipDevelopment #PersonalDevelopment #ProfessionalDevelopment #CommunicationSkills #AcademicLeadership #SpiritualIntelligence #EmotionalIntelligence #lifelonglearninglifetimeknowledge #lifelonglearning",
      },
    ],
    featuredImage: "/uploads/from-fear-to-eloquence-public-speaking-strategies.jpg",
    imageCaption:
      "From Fear to Eloquence: Eight Practical Strategies for Overcoming Public Speaking Anxiety and Building Confidence — By Lukman Raimi, PhD, LL.M, MNIM (D-Path to Jannah Media Hub).",
    authorId: "auth-lukman-raimi",
    authorName: "Lukman Raimi, PhD, LL.M, MNIM",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    artTheme: "campus",
    verification: "V",
    sourceName: "Lukman Raimi, PhD, LL.M, MNIM",
    status: "Published",
    featured: true,
    breaking: true,
    views: 315,
  },
  {
    id: "art-sb-cmp-2026-results",
    slug: "sb-releases-2026-cmp-results-as-kwara-male-candidate-emerges-overall-best-winner-5752",
    title: "SB Releases 2026 CMP Results As Kwara Male Candidate Emerges Overall Best Winner",
    category: "education",
    tags: [
      "Standard Bearers",
      "Career Mentorship Programme",
      "Scholarships",
      "Student Achievements",
      "Campus News",
      "Kwara State",
    ],
    summary:
      "The Standard Bearers Islamic Organization (SB), in collaboration with The Future Scholars (TFS), has released the results of its 2026 Career Mentorship Programme (CMP) scholarship examination, with Popoola Ridwan from the Kwara Centre emerging as overall best performer with 86 per cent.",
    body: [
      "The Standard Bearers Islamic Organization (SB), in collaboration with The Future Scholars (TFS), has officially released the results of its 2026 Career Mentorship Programme (CMP) scholarship examination, with a male candidate from Kwara State emerging as the overall best performer.",
      "The National Chairman of the Career Mentorship Programme, Mr Gidado Habib Olalekan, announced the release of the results on Monday, disclosing that Popoola Ridwan, who participated in the examination at the Kwara Centre, emerged as the overall best candidate with an impressive score of 86 per cent.",
      "Habib, while announcing the results, said a total of 417 students participated in the examination across centres in Abuja, Kwara, Kano, Ondo and Osun States.",
      "Giving a breakdown of the performance, he disclosed that 54 candidates scored 50 per cent and above, comprising 36 candidates who scored between 50 and 59 per cent, 15 candidates who recorded between 60 and 69 per cent, and three candidates who scored between 70 and 100 per cent.",
      "He, however, noted that 277 candidates scored below 40 per cent, indicating the need for sustained efforts to improve students’ academic performance.",
      "The CMP National Chairman advised candidates to check their individual results using their respective CMP registration numbers: [CHECK YOUR RESULT / VIEW RESULT PDF](https://drive.google.com/file/d/1iIgpYeM_ZpTGwqK3O1xXdrqL3Ux2JGgj/view?usp=drive_link).",
      "He explained that the examination, which assessed candidates in Mathematics and English Language, was designed to identify academically promising Muslim students and provide deserving candidates with scholarship opportunities.",
      "According to him, the programme remains part of the organisation’s commitment to promoting academic excellence, encouraging healthy intellectual competition and supporting the educational development of Muslim students.",
      "The examination was conducted through a Computer-Based Test (CBT) format, with questions prepared in line with the academic standards of the West African Examinations Council (WAEC) and the expected learning capacity of Senior Secondary School Three (SS3) students.",
      "Recall that speaking during the examination exercise, Habib had described the conduct of the test as smooth and hitch-free, expressing satisfaction with the preparedness and comportment of the participating candidates.",
      "He had also emphasised that the Career Mentorship Programme was designed not only to reward outstanding academic performance but also to develop students’ intellectual abilities and prepare them for future academic and career challenges and also support students through extramural classes.",
    ],
    contentBlocks: [
      {
        id: "blk-cmp-1",
        type: "paragraph",
        text: "The Standard Bearers Islamic Organization (SB), in collaboration with The Future Scholars (TFS), has officially released the results of its 2026 Career Mentorship Programme (CMP) scholarship examination, with a male candidate from Kwara State emerging as the overall best performer.",
      },
      {
        id: "blk-cmp-2",
        type: "paragraph",
        text: "The National Chairman of the Career Mentorship Programme, Mr Gidado Habib Olalekan, announced the release of the results on Monday, disclosing that Popoola Ridwan, who participated in the examination at the Kwara Centre, emerged as the overall best candidate with an impressive score of 86 per cent.",
      },
      {
        id: "blk-cmp-img-1",
        type: "image",
        text: "",
        imageUrl: "/uploads/sb-cmp-2026-cbt-exam.jpg",
        imageCaption:
          "Candidates taking the 2026 Standard Bearers Career Mentorship Programme (CMP) Computer-Based Test (CBT) scholarship examination.",
      },
      {
        id: "blk-cmp-3",
        type: "paragraph",
        text: "Habib, while announcing the results, said a total of 417 students participated in the examination across centres in Abuja, Kwara, Kano, Ondo and Osun States.",
      },
      {
        id: "blk-cmp-4",
        type: "paragraph",
        text: "Giving a breakdown of the performance, he disclosed that 54 candidates scored 50 per cent and above, comprising 36 candidates who scored between 50 and 59 per cent, 15 candidates who recorded between 60 and 69 per cent, and three candidates who scored between 70 and 100 per cent.",
      },
      {
        id: "blk-cmp-5",
        type: "paragraph",
        text: "He, however, noted that 277 candidates scored below 40 per cent, indicating the need for sustained efforts to improve students’ academic performance.",
      },
      {
        id: "blk-cmp-6",
        type: "paragraph",
        text: "The CMP National Chairman advised candidates to check their individual results using their respective CMP registration numbers: [CHECK YOUR RESULT / VIEW RESULT PDF](https://drive.google.com/file/d/1iIgpYeM_ZpTGwqK3O1xXdrqL3Ux2JGgj/view?usp=drive_link)",
      },
      {
        id: "blk-cmp-7",
        type: "paragraph",
        text: "He explained that the examination, which assessed candidates in Mathematics and English Language, was designed to identify academically promising Muslim students and provide deserving candidates with scholarship opportunities.",
      },
      {
        id: "blk-cmp-8",
        type: "paragraph",
        text: "According to him, the programme remains part of the organisation’s commitment to promoting academic excellence, encouraging healthy intellectual competition and supporting the educational development of Muslim students.",
      },
      {
        id: "blk-cmp-9",
        type: "paragraph",
        text: "The examination was conducted through a Computer-Based Test (CBT) format, with questions prepared in line with the academic standards of the West African Examinations Council (WAEC) and the expected learning capacity of Senior Secondary School Three (SS3) students.",
      },
      {
        id: "blk-cmp-10",
        type: "paragraph",
        text: "Recall that speaking during the examination exercise, Habib had described the conduct of the test as smooth and hitch-free, expressing satisfaction with the preparedness and comportment of the participating candidates.",
      },
      {
        id: "blk-cmp-11",
        type: "paragraph",
        text: "He had also emphasised that the Career Mentorship Programme was designed not only to reward outstanding academic performance but also to develop students’ intellectual abilities and prepare them for future academic and career challenges and also support students through extramural classes.",
      },
      {
        id: "blk-cmp-12",
        type: "paragraph",
        text: "[CHECK YOUR RESULT / VIEW RESULT PDF](https://drive.google.com/file/d/1iIgpYeM_ZpTGwqK3O1xXdrqL3Ux2JGgj/view?usp=drive_link)",
      },
    ],
    featuredImage: "/uploads/sb-cmp-2026-cbt-exam.jpg",
    imageCaption:
      "Candidates sitting for the 2026 Standard Bearers Career Mentorship Programme (CMP) Computer-Based Test (CBT) scholarship examination — Photo: D2J Campus Desk.",
    authorId: "usr-habeeb",
    authorName: "D2J Editorial Desk",
    publishedAt: "2026-11-19",
    updatedAt: "2026-11-19",
    artTheme: "campus",
    verification: "V",
    sourceName: "CHECK YOUR RESULT / VIEW RESULT PDF",
    sourceUrl: "https://drive.google.com/file/d/1iIgpYeM_ZpTGwqK3O1xXdrqL3Ux2JGgj/view?usp=drive_link",
    status: "Published",
    featured: true,
    breaking: true,
    views: 410,
  },
  {
    id: "art-back-to-campus-avoid-distractions-2026",
    slug: "back-to-campus-how-to-avoid-distractions-and-actually-pass-this-semester",
    title: "Back To Campus: How To Avoid Distractions And Actually Pass This Semester",
    category: "campus",
    tags: [
      "Back to Campus",
      "Study tips",
      "Campus News",
      "Student Voices",
      "Academic Excellence",
      "Muslim Students",
    ],
    summary:
      "Every semester starts with big plans and ends with exam-week panic for many students. As campuses reopen across Nigeria, Dr. Mogaji Ibrahim shares five practical and spiritual principles to beat digital distractions and excel this semester.",
    body: [
      "Hostels are filling up again. Lecture halls are buzzing. The “I’m back to school” pictures are everywhere on Status and Instagram. A new academic session has started — and with it, a new chance.",
      "But let’s be honest: every semester starts with big plans and ends with the same story for many students: “I will start reading next week.” Next week becomes test week. Test week becomes exam week. Exam week becomes panic.",
      "If you are resuming this semester, dpathtojannah media is reminding you of one simple truth: distraction is now the biggest exam you will write before your actual exams.",
      "It’s not just parties and outings anymore. It’s the 3 hours you planned to read that turned into 3 hours of scrolling TikTok, X, and Instagram Reels. It’s the group chat that never sleeps. The “just one episode” that became a whole season. The talking stage that became a full-time job. The side hustle that swallowed your lecture time. Nobody will come and drag you to class. In higher institution, freedom is plenty — and that freedom is the test.",
      "As a Muslim student, your academics are not separate from your Deen. Seeking knowledge is ibadah when your intention is right. Allah says in Surah Al-Asr: “By time, indeed, mankind is in loss, except those who have believed and done righteous deeds…” — Qur’an 103:1-3. Time is your capital. Once this semester’s time is gone, it is gone.",
      "The Prophet (peace be upon him) also advised us to take advantage of “your youth before your old age, your health before your sickness, your free time before your busyness…” That free time you have in week 1 and week 2? That is the free time the hadith is talking about.",
      "1. Fix Your Niyyah First: Don’t just resume to “pass.” Resume to seek knowledge to benefit yourself, your family, your Ummah, and to please Allah. When the intention is clear, discipline becomes easier.",
      "2. Have A Simple Reading Plan, Not A Perfect One: You don’t need a 10-hour timetable you will abandon by Wednesday. Start with 2 focused hours daily — no phone, no music, just you and your books. Consistency beats intensity.",
      "3. Put Your Phone On A Leash: Your phone is not your enemy, but it needs boundaries. Use “Do Not Disturb” during reading. Keep TikTok, X and WhatsApp away for the first 1 hour of study. If you must use your phone, use it to learn — not to escape.",
      "4. Choose Your Circle Wisely: Show us your friends, and we can predict your CGPA. Move with people who go to class, who read, who pray on time, who remind you of your goals. If your circle only calls you for cruise, it will cost you.",
      "5. Balance Deen + Books: Don’t use “I’m busy with school” to abandon Salah, and don’t use “I’m busy with Deen activities” to abandon your books. The best Muslim student is the one who prays on time and submits assignments on time. Both are amanah.",
      "Freshers: This is your foundation. The cruise can wait. Learn your campus, join MSSN and other good associations, know your lecturers, and start strong. First semester CGPA is very hard to correct later.",
      "Finalists: This is not the time to relax. Project, SIWES/IT report, final exams — they all need you now. Finish strong so you don’t carry regret into NYSC and life after school.",
      "Every semester gives you two options: You will either be distracted now and stressed later, or disciplined now and at peace later. Resumption is not just about returning to campus. It is about returning to purpose.",
      "So, as you unpack your bags this week, unpack your goals too. What is your target CGPA this semester? What is your reading plan? What distraction are you dropping? Tell us in the comments. Let’s hold ourselves accountable. May Allah grant every student knowledge that benefits, focus, and success in this new session. Ameen.",
    ],
    contentBlocks: [
      {
        id: "blk-btc-1",
        type: "paragraph",
        text: "Hostels are filling up again. Lecture halls are buzzing. The “I’m back to school” pictures are everywhere on Status and Instagram.",
      },
      {
        id: "blk-btc-2",
        type: "paragraph",
        text: "A new academic session has started — and with it, a new chance.",
      },
      {
        id: "blk-btc-3",
        type: "paragraph",
        text: "But let’s be honest: every semester starts with big plans and ends with the same story for many students: “I will start reading next week.” Next week becomes test week. Test week becomes exam week. Exam week becomes panic.",
      },
      {
        id: "blk-btc-4",
        type: "paragraph",
        text: "If you are resuming this semester, dpathtojannah media is reminding you of one simple truth: distraction is now the biggest exam you will write before your actual exams.",
      },
      {
        id: "blk-btc-5",
        type: "heading",
        text: "The Distractions Are Real",
      },
      {
        id: "blk-btc-6",
        type: "paragraph",
        text: "It’s not just parties and outings anymore. It’s the 3 hours you planned to read that turned into 3 hours of scrolling TikTok, X, and Instagram Reels.",
      },
      {
        id: "blk-btc-7",
        type: "paragraph",
        text: "It’s the group chat that never sleeps. The “just one episode” that became a whole season. The talking stage that became a full-time job. The side hustle that swallowed your lecture time.",
      },
      {
        id: "blk-btc-8",
        type: "paragraph",
        text: "Nobody will come and drag you to class. In higher institution, freedom is plenty — and that freedom is the test.",
      },
      {
        id: "blk-btc-9",
        type: "heading",
        text: "For The Muslim Student, It’s Deeper",
      },
      {
        id: "blk-btc-10",
        type: "paragraph",
        text: "As a Muslim student, your academics are not separate from your Deen. Seeking knowledge is ibadah when your intention is right.",
      },
      {
        id: "blk-btc-11",
        type: "quote",
        text: "By time, indeed, mankind is in loss, except those who have believed and done righteous deeds…",
        quoteAttribution: "Qur’an 103:1–3 (Surah Al-Asr)",
      },
      {
        id: "blk-btc-12",
        type: "paragraph",
        text: "Time is your capital. Once this semester’s time is gone, it is gone.",
      },
      {
        id: "blk-btc-13",
        type: "paragraph",
        text: "The Prophet (peace be upon him) also advised us to take advantage of “your youth before your old age, your health before your sickness, your free time before your busyness…” That free time you have in week 1 and week 2? That is the free time the hadith is talking about.",
      },
      {
        id: "blk-btc-14",
        type: "heading",
        text: "5 Ways To Stay Serious This Semester",
      },
      {
        id: "blk-btc-15",
        type: "paragraph",
        text: "1. Fix Your Niyyah First — Don’t just resume to “pass.” Resume to seek knowledge to benefit yourself, your family, your Ummah, and to please Allah. When the intention is clear, discipline becomes easier.",
      },
      {
        id: "blk-btc-16",
        type: "paragraph",
        text: "2. Have A Simple Reading Plan, Not A Perfect One — You don’t need a 10-hour timetable you will abandon by Wednesday. Start with 2 focused hours daily — no phone, no music, just you and your books. Consistency beats intensity.",
      },
      {
        id: "blk-btc-17",
        type: "paragraph",
        text: "3. Put Your Phone On A Leash — Your phone is not your enemy, but it needs boundaries. Use “Do Not Disturb” during reading. Keep TikTok, X and WhatsApp away for the first 1 hour of study. If you must use your phone, use it to learn — not to escape.",
      },
      {
        id: "blk-btc-18",
        type: "paragraph",
        text: "4. Choose Your Circle Wisely — Show us your friends, and we can predict your CGPA. Move with people who go to class, who read, who pray on time, who remind you of your goals. If your circle only calls you for cruise, it will cost you.",
      },
      {
        id: "blk-btc-19",
        type: "paragraph",
        text: "5. Balance Deen + Books — Don’t use “I’m busy with school” to abandon Salah, and don’t use “I’m busy with Deen activities” to abandon your books. The best Muslim student is the one who prays on time and submits assignments on time. Both are amanah.",
      },
      {
        id: "blk-btc-20",
        type: "heading",
        text: "A Word To Freshers And Finalists",
      },
      {
        id: "blk-btc-21",
        type: "paragraph",
        text: "Freshers: This is your foundation. The cruise can wait. Learn your campus, join MSSN and other good associations, know your lecturers, and start strong. First semester CGPA is very hard to correct later.",
      },
      {
        id: "blk-btc-22",
        type: "paragraph",
        text: "Finalists: This is not the time to relax. Project, SIWES/IT report, final exams — they all need you now. Finish strong so you don’t carry regret into NYSC and life after school.",
      },
      {
        id: "blk-btc-23",
        type: "heading",
        text: "The Bottom Line",
      },
      {
        id: "blk-btc-24",
        type: "paragraph",
        text: "Every semester gives you two options: You will either be distracted now and stressed later, or disciplined now and at peace later. Resumption is not just about returning to campus. It is about returning to purpose.",
      },
      {
        id: "blk-btc-25",
        type: "paragraph",
        text: "So, as you unpack your bags this week, unpack your goals too. What is your target CGPA this semester? What is your reading plan? What distraction are you dropping? Tell us in the comments. Let’s hold ourselves accountable.",
      },
      {
        id: "blk-btc-26",
        type: "paragraph",
        text: "May Allah grant every student knowledge that benefits, focus, and success in this new session. Ameen.",
      },
    ],
    imageCaption:
      "Back to Campus: Balancing Deen, Focus, and Academic Excellence — By Dr. Mogaji Ibrahim | Campus Desk.",
    authorId: "usr-khaleel",
    authorName: "Dr. Mogaji Ibrahim | Campus Desk",
    publishedAt: "2026-11-18",
    updatedAt: "2026-11-18",
    artTheme: "library",
    verification: "V",
    sourceName: "D-Path to Jannah Campus Desk",
    status: "Published",
    featured: true,
    views: 310,
  },
  {
    id: "art-ui-unilag-jamb-masters-2026",
    slug: "for-masters-ui-or-unilag-the-question-that-broke-nigerian-twitter",
    title: "For Masters, UI or UNILAG? The Question That Broke Nigerian Twitter",
    category: "campus",
    tags: [
      "UI",
      "UNILAG",
      "UNILORIN",
      "JAMB",
      "Masters",
      "Campus News",
      "Nigerian Students",
    ],
    summary:
      "It started as a simple question from a prospective postgraduate student on X—'For masters, UI or Unilag?'—and ended as a full-blown war of words and grammar between UI, UNILAG, UNILORIN, and JAMB.",
    body: [
      "It started as a simple question from a prospective postgraduate student. It ended as a full-blown “war of words” — and grammar — between three of Nigeria’s biggest education brands.",
      "On Monday, an X user, Opeyemi Asake, asked Nigerians a question many final-year students and fresh graduates are quietly asking themselves: “For masters, UI or Unilag?” That was all it took.",
      "The University of Ibadan (UI) replied in full “sermon mode”: “Dear Opeyemi, we say unto you, Do not be deceived, for some will mention schools that are not UI. But verily verily, we say unto you, there’s only one First and the Best University in Nigeria and in the World, Our Very own University of ibadan or others.” Yes — “University of ibadan” — with a small ‘i’. And that small ‘i’ became the whole gist.",
      "The University of Lagos (UNILAG) did not waste time. It went straight for the lowercase: “Not to say much, but we worry for anyone who places their Masters education in the hands of a university that writes the name of a city in lowercase. To each their own.” Ouch!",
      "UI was not having it. It reminded UNILAG of its own history — the controversial 2012 renaming saga: “Spelling tips from the school that got renamed on live TV and needed a court to get its name back.”",
      "At this point, Nigerian X was already in chaos — with users pointing out grammatical errors in both schools’ posts. University of Ilorin (UNILORIN) then entered the debate with a classic: “Dear @ibadanuni and @UniLagNigeria, please sheath the sword! There's no need for friendly fire when the real secret to a peaceful Master’s degree is an uninterrupted academic calendar 😉 @opeyemi_Nitemi, come to where excellence meets predictability. It's #BetterByFar here!”",
      "Just when it looked like UI and UNILAG would carry the day, the Joint Admissions and Matriculation Board (JAMB) stepped in with the line that has now gone viral: “Capital letter, small letter, whatever the CASE, this Master’s conversation wouldn’t exist without us.” Mic. Dropped. Because, let’s be honest — no JAMB, no admission. No admission, no Master’s debate.",
      "For Muslim students on campus — from MSSN UI and MSSN UNILAG to MSSN UNI ILORIN and beyond — the exchange has become more than just banter. It’s a reminder of something we see every day in our student associations, fellowships, and WhatsApp groups: rivalry is fun, but adab matters.",
      "You can defend your school, hype your alma mater, and still keep it clean — no insults, no tribal jabs, no crossing the line. As one student put it online: “UI and UNILAG fought with grammar. JAMB fought with fact. That’s how to argue.”",
      "And for those still asking “UI or UNILAG or Better by Far for Masters?” — the real answer, as many Muslim graduates will tell you, is not just about the name on the certificate. It’s about your intention (niyyah), your course, and where Allah has written ease for you. Small letter or capital letter, Ibadan or Lagos — choose with istikhara, do your research, and pray for barakah in the journey.",
      "Which side are you on, Team UI, Team UNILAG, or UNI ILORIN? And do you agree with JAMB’s final blow? Drop your take in the comments. Keep it halal, keep it Islamic.",
    ],
    contentBlocks: [
      {
        id: "blk-ui-1",
        type: "paragraph",
        text: "It started as a simple question from a prospective postgraduate student. It ended as a full-blown “war of words” — and grammar — between three of Nigeria’s biggest education brands.",
      },
      {
        id: "blk-1794982363394-5p7p",
        type: "image",
        text: "",
        imageUrl: "/uploads/ui-unilag-masters-block-1.jpg",
        imageCaption: "",
      },
      {
        id: "blk-ui-2",
        type: "paragraph",
        text: "On Monday, an X user, Opeyemi Asake, asked Nigerians a question many final-year students and fresh graduates are quietly asking themselves:",
      },
      {
        id: "blk-ui-3",
        type: "quote",
        text: "For masters, UI or Unilag?",
        quoteAttribution: "Opeyemi Asake (@opeyemi_Nitemi)",
      },
      {
        id: "blk-ui-4",
        type: "paragraph",
        text: "That was all it took.",
      },
      {
        id: "blk-ui-5",
        type: "heading",
        text: "UI Fires First — With Scripture-Like Style",
      },
      {
        id: "blk-ui-6",
        type: "paragraph",
        text: "The University of Ibadan (UI) replied in full “sermon mode”:",
      },
      {
        id: "blk-1794982416921-tp1c",
        type: "image",
        text: "",
        imageUrl: "/uploads/ui-unilag-masters-block-2.jpg",
        imageCaption: "",
      },
      {
        id: "blk-ui-7",
        type: "quote",
        text: "Dear Opeyemi, we say unto you, Do not be deceived, for some will mention schools that are not UI. But verily verily, we say unto you, there’s only one First and the Best University in Nigeria and in the World, Our Very own University of ibadan or others.",
        quoteAttribution: "University of Ibadan (@ibadanuni)",
      },
      {
        id: "blk-ui-8",
        type: "paragraph",
        text: "Yes — “University of ibadan” — with a small ‘i’. And that small ‘i’ became the whole gist.",
      },
      {
        id: "blk-ui-9",
        type: "heading",
        text: "UNILAG Claps Back — Over Grammar",
      },
      {
        id: "blk-1794982450817-agrf",
        type: "image",
        text: "",
        imageUrl: "/uploads/ui-unilag-masters-block-3.jpg",
        imageCaption: "",
      },
      {
        id: "blk-ui-10",
        type: "paragraph",
        text: "The University of Lagos (UNILAG) did not waste time. It went straight for the lowercase:",
      },
      {
        id: "blk-ui-11",
        type: "quote",
        text: "Not to say much, but we worry for anyone who places their Masters education in the hands of a university that writes the name of a city in lowercase. To each their own.",
        quoteAttribution: "University of Lagos (@UniLagNigeria)",
      },
      {
        id: "blk-ui-12",
        type: "paragraph",
        text: "Ouch!",
      },
      {
        id: "blk-ui-13",
        type: "heading",
        text: "UI Returns Fire — “Renamed on Live TV”",
      },
      {
        id: "blk-ui-14",
        type: "paragraph",
        text: "UI was not having it. It reminded UNILAG of its own history — the controversial 2012 renaming saga:",
      },
      {
        id: "blk-ui-15",
        type: "quote",
        text: "Spelling tips from the school that got renamed on live TV and needed a court to get its name back.",
        quoteAttribution: "University of Ibadan (@ibadanuni)",
      },
      {
        id: "blk-ui-16",
        type: "paragraph",
        text: "At this point, Nigerian X was already in chaos — with users pointing out grammatical errors in both schools’ posts. Uni Ilorin now entered the debate with a classic:",
      },
      {
        id: "blk-ui-17",
        type: "quote",
        text: "Dear @ibadanuni and @UniLagNigeria, please sheath the sword! There's no need for friendly fire when the real secret to a peaceful Master’s degree is an uninterrupted academic calendar 😉 @opeyemi_Nitemi, come to where excellence meets predictability. It's #BetterByFar here!",
        quoteAttribution: "University of Ilorin (UNILORIN)",
      },
      {
        id: "blk-ui-18",
        type: "heading",
        text: "Then JAMB Entered — And Won The Internet",
      },
      {
        id: "blk-ui-19",
        type: "paragraph",
        text: "Just when it looked like UI and UNILAG would carry the day, the Joint Admissions and Matriculation Board (JAMB) stepped in with the line that has now gone viral:",
      },
      {
        id: "blk-ui-20",
        type: "quote",
        text: "Capital letter, small letter, whatever the CASE, this Master’s conversation wouldn’t exist without us.",
        quoteAttribution: "Joint Admissions and Matriculation Board (JAMB)",
      },
      {
        id: "blk-ui-21",
        type: "paragraph",
        text: "Mic. Dropped. Because, let’s be honest — no JAMB, no admission. No admission, no Master’s debate.",
      },
      {
        id: "blk-ui-22",
        type: "heading",
        text: "Why Campus Muslims Are Loving This",
      },
      {
        id: "blk-ui-23",
        type: "paragraph",
        text: "For Muslim students on campus — from MSSN UI and MSSN UNILAG to MSSN UNI ILORIN and beyond — the exchange has become more than just banter. It’s a reminder of something we see every day in our student associations, fellowships, and WhatsApp groups: rivalry is fun, but adab matters.",
      },
      {
        id: "blk-ui-24",
        type: "paragraph",
        text: "You can defend your school, hype your alma mater, and still keep it clean — no insults, no tribal jabs, no crossing the line. As one student put it online: “UI and UNILAG fought with grammar. JAMB fought with fact. That’s how to argue.”",
      },
      {
        id: "blk-ui-25",
        type: "paragraph",
        text: "And for those still asking “UI or UNILAG or Better by Far for Masters?” — the real answer, as many Muslim graduates will tell you, is not just about the name on the certificate. It’s about your intention (niyyah), your course, and where Allah has written ease for you.",
      },
      {
        id: "blk-ui-26",
        type: "paragraph",
        text: "Small letter or capital letter, Ibadan or Lagos — choose with istikhara, do your research, and pray for barakah in the journey.",
      },
      {
        id: "blk-ui-27",
        type: "paragraph",
        text: "Which side are you on, Team UI, Team UNILAG or UNI ILORIN? And do you agree with JAMB’s final blow? Drop your take in the comments. Keep it halal, keep it Islamic.",
      },
    ],
    featuredImage: "/uploads/ui-unilag-masters-featured.jpg",
    imageCaption:
      "Campus & Postgraduate Debate: UI, UNILAG, UNILORIN, and JAMB — Illustration: D2J Campus Desk.",
    authorId: "usr-sodiq",
    authorName: "D2J Campus Desk",
    publishedAt: "2026-11-18",
    updatedAt: "2026-11-18",
    artTheme: "campus",
    verification: "V",
    sourceName: "D2J Campus Desk",
    status: "Published",
    featured: true,
    views: 385,
  },
  {
    id: "art-sb-hic-2026",
    slug: "standard-bearers-islamic-organization-opens-registration-for-2026-holiday-islamic-course-in-ile-ife",
    title: "Standard Bearers Islamic Organization opens registration for 2026 Holiday Islamic Course in Ile-Ife",
    category: "campus",
    tags: [
      "Standard Bearers",
      "SB HIC 2026",
      "Osun State",
      "Campus News",
      "Events",
      "Islamic Education",
    ],
    summary:
      "Standard Bearers Islamic Organization (SB), Osun State, has opened registration for its 2026 Holiday Islamic Course (SB HIC) scheduled for 24–28 December 2026 at Oduduwa College, Ile-Ife, under the theme 'Upholding the Standard'.",
    body: [
      "The Standard Bearers Islamic Organization (SB), Osun State, has officially opened delegate registration for the 2026 edition of its annual Holiday Islamic Course (SB HIC), scheduled to hold from Thursday, 24 December to Monday, 28 December 2026 at Oduduwa College, Ile-Ife, Osun State.",
      "Anchored on the theme 'Upholding the Standard,' the five-day residential camp brings together junior and senior secondary school students, school leavers, undergraduates, and young graduates for intensive spiritual renewal, Qur'anic literacy, digital skills training, career mentorship, and athletics. According to the official camp portal, more than 450 delegates across 19 zones in Osun State and neighbouring states—including Osogbo, Ile-Ife, Ilesa, Abuja, Kano, Ondo, Ekiti, and Kwara—have already registered.",
      "To ensure age-appropriate instruction and mentorship, the 2026 Holiday Islamic Course automatically assigns participants to one of three structured classes based on their educational level: the Lower Class (JSS1 to JSS3) focusing on the fundamentals of Islamic belief and character; the Upper Class (SS1 to SSS3) preparing senior secondary students for higher education and moral resilience; and the Dawah Class for school leavers, undergraduates, and graduates navigating university life, careers, and community leadership.",
      "Each day at SB HIC 2026 is structured around nine core pillars: congregational Tahajjud prayers at 4:00 AM, the five daily obligatory prayers, morning Mu'aayasha and Riyadoh fitness sessions at 6:20 AM (featuring Hisnul Muslim adhkar memorisation), Solaatul Duhaa and Tilawat-ul-Qur'an at 10:31 AM, transformative lectures and Tafsir, IT and digital safety workshops, a Single Seminar Panel on contemporary youth identity and career growth, Qur'anic Musabaqoh and quiz competitions, and outdoor sports.",
      "Confirmed faculty and spiritual guides for the 2026 session include Sheikh Dhikrullah Shafi'i (Eminent Scholar and Spiritual Director), Sheikh Abdulkabir Hamzah (Tafseer Expert and OTM Chief Imam), Ustadh Rasheed Hashim (Digital Safety Counselor), and Sheikh Isa Akindede (Spiritual Guide and Qur'an Scholar).",
      "Registration covers five days of accommodation, feeding, camp materials, and welfare at Oduduwa College, Ile-Ife. The Early Bird rate is ₦8,650 (inclusive of a ₦150 payment gateway charge) and remains open until 30 November 2026. From 1 December 2026 through the start of camp, the standard flat rate of ₦12,150 applies.",
      "Organisers have also provided a two-instalment payment option—requiring completion on or before 30 November 2026 to retain the Early Bird discount—as well as bulk group ticket purchases for schools, zones, and sponsors via the official portal at camp.sbosun.org.ng.",
    ],
    contentBlocks: [
      {
        id: "blk-sb-1",
        type: "paragraph",
        text: "The Standard Bearers Islamic Organization (SB), Osun State, has officially opened delegate registration for the 2026 edition of its annual Holiday Islamic Course (SB HIC), scheduled to hold from Thursday, 24 December to Monday, 28 December 2026 at Oduduwa College, Ile-Ife, Osun State.",
      },
      {
        id: "blk-sb-2",
        type: "paragraph",
        text: "Anchored on the theme 'Upholding the Standard,' the five-day residential camp brings together junior and senior secondary school students, school leavers, undergraduates, and young graduates for intensive spiritual renewal, Qur'anic literacy, digital skills training, career mentorship, and athletics. According to the official camp portal, more than 450 delegates across 19 zones in Osun State and neighbouring states—including Osogbo, Ile-Ife, Ilesa, Abuja, Kano, Ondo, Ekiti, and Kwara—have already registered.",
      },
      {
        id: "blk-sb-3",
        type: "heading",
        text: "Three Structured Learning Classes Across Academic Levels",
      },
      {
        id: "blk-sb-4",
        type: "paragraph",
        text: "To ensure age-appropriate instruction and mentorship, the 2026 Holiday Islamic Course automatically assigns participants to one of three structured classes based on their educational level: the Lower Class (JSS1 to JSS3) focusing on the fundamentals of Islamic belief and character; the Upper Class (SS1 to SSS3) preparing senior secondary students for higher education and moral resilience; and the Dawah Class for school leavers, undergraduates, and graduates navigating university life, careers, and community leadership.",
      },
      {
        id: "blk-sb-5",
        type: "gallery",
        imageUrl: "https://camp.sbosun.org.ng/assets/images/highlights/feature_6_1.jpg",
        imageCaption: "Hands-on IT and digital skills workshop during the Holiday Islamic Course.",
        secondImageUrl: "https://camp.sbosun.org.ng/assets/images/highlights/feature_6_2.jpg",
        secondImageCaption: "Delegates learning cyber ethics, digital safety, and practical computing skills.",
      },
      {
        id: "blk-sb-6",
        type: "heading",
        text: "Daily Spiritual Routine, Digital Literacy, and Scholarly Faculty",
      },
      {
        id: "blk-sb-7",
        type: "paragraph",
        text: "Each day at SB HIC 2026 is structured around nine core pillars: congregational Tahajjud prayers at 4:00 AM, the five daily obligatory prayers, morning Mu'aayasha and Riyadoh fitness sessions at 6:20 AM (featuring Hisnul Muslim adhkar memorisation), Solaatul Duhaa and Tilawat-ul-Qur'an at 10:31 AM, transformative lectures and Tafsir, IT and digital safety workshops, a Single Seminar Panel on contemporary youth identity and career growth, Qur'anic Musabaqoh and quiz competitions, and outdoor sports.",
      },
      {
        id: "blk-sb-8",
        type: "paragraph",
        text: "Confirmed faculty and spiritual guides for the 2026 session include Sheikh Dhikrullah Shafi'i (Eminent Scholar and Spiritual Director), Sheikh Abdulkabir Hamzah (Tafseer Expert and OTM Chief Imam), Ustadh Rasheed Hashim (Digital Safety Counselor), and Sheikh Isa Akindede (Spiritual Guide and Qur'an Scholar).",
      },
      {
        id: "blk-sb-9",
        type: "gallery",
        imageUrl: "https://camp.sbosun.org.ng/assets/images/sports/sports_1.jpg",
        imageCaption: "Delegates competing in the annual Camp Football Cup tournament.",
        secondImageUrl: "https://camp.sbosun.org.ng/assets/images/highlights/feature_9_1.jpg",
        secondImageCaption: "Interactive seminar panel addressing morality, digital ethics, and career development.",
      },
      {
        id: "blk-sb-10",
        type: "heading",
        text: "Registration Fees, Early Bird Deadline, and Instalment Plan",
      },
      {
        id: "blk-sb-11",
        type: "paragraph",
        text: "Registration covers five days of accommodation, feeding, camp materials, and welfare at Oduduwa College, Ile-Ife. The Early Bird rate is ₦8,650 (inclusive of a ₦150 payment gateway charge) and remains open until 30 November 2026. From 1 December 2026 through the start of camp, the standard flat rate of ₦12,150 applies.",
      },
      {
        id: "blk-sb-12",
        type: "paragraph",
        text: "Organisers have also provided a two-instalment payment option—requiring completion on or before 30 November 2026 to retain the Early Bird discount—as well as bulk group ticket purchases for schools, zones, and sponsors via the official portal at camp.sbosun.org.ng.",
      },
    ],
    featuredImage: "https://camp.sbosun.org.ng/assets/images/highlights/feature_5_2.jpg",
    imageCaption:
      "Delegates and scholars at the Standard Bearers Islamic Organization Holiday Islamic Course (SB HIC) — Photo: SB Osun State Camp Portal.",
    authorId: "auth-1",
    authorName: "D2J Editorial Desk",
    publishedAt: "2026-11-09",
    updatedAt: "2026-11-09",
    artTheme: "community",
    verification: "V",
    sourceName: "Standard Bearers Islamic Organization, Osun State",
    sourceUrl: "https://camp.sbosun.org.ng/index.php?r=home",
    status: "Published",
    featured: true,
    breaking: true,
    views: 540,
  },
  {
    id: "art-1",
    slug: "mssn-lagos-new-leadership",
    title: "MSSN Lagos names new leadership and outlines priorities for students",
    category: "campus",
    tags: ["MSSN", "Student leadership", "NELFUND", "Campus News"],
    summary:
      "The Lagos area unit of the Muslim Students’ Society of Nigeria has inaugurated new leaders under Dr Ajibola Salami, who said the focus would be educational advancement, youth empowerment, moral development, leadership training and mentorship.",
    body: [
      "Voice of Nigeria reported on 24 June 2026 that the Lagos State Area unit of the Muslim Students’ Society of Nigeria (MSSN) held a press briefing after inaugurating its new leadership. The new Amir, Dr Ajibola Salami, said the team would concentrate on educational advancement, youth empowerment, moral development, leadership training, mentorship, and protecting the rights and welfare of Muslim students in Lagos State.",
      "On education, the society welcomed the Federal Government’s Nigerian Education Loan Fund (NELFUND) and asked authorities to invest more in educational infrastructure, research, innovation, scholarships and bursaries, noting that many young Nigerians struggle to access quality education.",
      "The briefing also covered national security and the 2027 elections. This summary focuses on the education and student-welfare points, so read the full report at the source for the complete statement.",
    ],
    authorId: "auth-1",
    authorName: "D2J Media Hub (summary)",
    publishedAt: "2026-06-24",
    updatedAt: "2026-10-25",
    artTheme: "community",
    verification: "V",
    sourceName: "Voice of Nigeria",
    sourceUrl: "https://von.gov.ng/stakeholders-seek-capital-punishment-for-convicted-terrorists/",
    status: "Published",
    featured: true,
    breaking: true,
    views: 420,
  },
  {
    id: "art-2",
    slug: "mssn-lagos-jamb-registrar",
    title: "Muslim students’ body urges new JAMB registrar to prioritise transparency and integrity",
    category: "news",
    tags: ["JAMB", "MSSN", "Education policy", "Nigeria"],
    summary:
      "The Lagos chapter of the Muslim Students’ Society of Nigeria has urged Prof Segun Aina, the new registrar of the Joint Admissions and Matriculation Board, to build on the work of his predecessor, Prof Ishaq Oloyede.",
    body: [
      "The Gazette reported on 4 August 2026 that MSSN Lagos issued a statement urging the new JAMB registrar, Prof Segun Aina, to keep improving examination processes, with transparency and integrity as priorities.",
      "The society also acknowledged the service of Prof Ishaq Oloyede, saying his work had advanced educational assessment and strengthened confidence in Nigeria’s admissions system. This is our summary of a third-party report. See the source for the full statement.",
    ],
    authorId: "auth-1",
    authorName: "D2J Media Hub (summary)",
    publishedAt: "2026-08-04",
    updatedAt: "2026-10-25",
    artTheme: "library",
    verification: "S",
    sourceName: "The Gazette",
    sourceUrl: "https://gazettengr.com/muslim-students-urge-new-jamb-registrar-to-build-on-oloyedes-legacy/",
    status: "Published",
    featured: true,
    views: 315,
  },
  {
    id: "art-3",
    slug: "d-study-habits",
    title: "Demo: Study habits that help during examination periods",
    category: "campus",
    tags: ["Study tips", "Campus News"],
    summary: "A demo story layout about planning revision and staying consistent through a heavy semester.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-12",
    updatedAt: "2026-01-12",
    artTheme: "well",
    verification: "D",
    status: "Published",
    featured: true,
    views: 198,
  },
  {
    id: "art-4",
    slug: "d-library",
    title: "Demo: Using the library well during a busy semester",
    category: "campus",
    tags: ["Study tips", "Campus News"],
    summary: "A demo story layout about finding quiet study spaces and organising research materials.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-11",
    updatedAt: "2026-01-11",
    artTheme: "library",
    verification: "D",
    status: "Published",
    views: 142,
  },
  {
    id: "art-5",
    slug: "d-society",
    title: "Demo: What a campus society can offer new students",
    category: "campus",
    tags: ["Societies", "Campus Organisations", "Student Achievements"],
    summary: "A demo story layout about peer mentorship, orientation programmes and student leadership.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-10",
    updatedAt: "2026-01-10",
    artTheme: "campus",
    verification: "D",
    status: "Published",
    views: 175,
  },
  {
    id: "art-6",
    slug: "d-quran-plan",
    title: "Demo: A study plan for reading the Qur’an with understanding",
    category: "islam",
    tags: ["Qur’an and Tafsir"],
    summary: "A demo article layout. It quotes no verses and makes no rulings.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-09",
    updatedAt: "2026-01-09",
    artTheme: "quran",
    verification: "D",
    status: "Published",
    featured: true,
    views: 260,
  },
  {
    id: "art-7",
    slug: "d-hadith-sources",
    title: "Demo: Why sources matter when learning from Hadith collections",
    category: "islam",
    tags: ["Hadith and Sunnah"],
    summary: "A demo article layout about checking classical sources and learning with qualified teachers.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-08",
    updatedAt: "2026-01-08",
    artTheme: "quran",
    verification: "D",
    status: "Published",
    views: 154,
  },
  {
    id: "art-8",
    slug: "d-ramadan",
    title: "Demo: Preparing for Ramadan as a student",
    category: "islam",
    tags: ["Worship and Daily Practice"],
    summary: "A demo article layout about planning ahead around lectures and exams.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-07",
    updatedAt: "2026-01-07",
    artTheme: "library",
    verification: "D",
    status: "Published",
    views: 130,
  },
  {
    id: "art-9",
    slug: "d-cv",
    title: "Demo: A first CV for students with little experience",
    category: "education",
    tags: ["Careers", "Academic development"],
    summary: "A demo guide layout on highlighting coursework, society roles and volunteering.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-06",
    updatedAt: "2026-01-06",
    artTheme: "biz",
    verification: "D",
    status: "Published",
    views: 210,
  },
  {
    id: "art-10",
    slug: "d-digital-skills",
    title: "Demo: Digital skills worth learning before graduation",
    category: "education",
    tags: ["Skills", "Careers"],
    summary: "A demo guide layout covering data literacy, clear writing and design basics.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-05",
    updatedAt: "2026-01-05",
    artTheme: "biz",
    verification: "D",
    status: "Published",
    views: 185,
  },
  {
    id: "art-11",
    slug: "d-budget",
    title: "Demo: Budgeting on a student allowance",
    category: "business",
    tags: ["Money"],
    summary: "A demo article layout on tracking weekly expenses and saving on campus.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-04",
    updatedAt: "2026-01-04",
    artTheme: "biz",
    verification: "D",
    status: "Published",
    views: 118,
  },
  {
    id: "art-12",
    slug: "d-ethical-biz",
    title: "Demo: Starting a small ethical business as a student",
    category: "business",
    tags: ["Entrepreneurship", "Halal Business"],
    summary: "A demo article layout on halal side businesses that fit around university timetables.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-03",
    updatedAt: "2026-01-03",
    artTheme: "biz",
    verification: "D",
    status: "Published",
    views: 140,
  },
  {
    id: "art-13",
    slug: "d-wellbeing",
    title: "Demo: Looking after your well-being during exams",
    category: "health",
    tags: ["Well-being", "Student Health"],
    summary: "A demo article layout on sleep, regular meals and managing exam stress.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-02",
    updatedAt: "2026-01-02",
    artTheme: "well",
    verification: "D",
    status: "Published",
    views: 165,
  },
  {
    id: "art-14",
    slug: "d-style",
    title: "Demo: Modest style on a budget",
    category: "lifestyle",
    tags: ["Fashion", "Student Living"],
    summary: "A demo article layout on practical, modest wardrobe planning for students.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2026-01-01",
    updatedAt: "2026-01-01",
    artTheme: "well",
    verification: "D",
    status: "Published",
    views: 95,
  },
  {
    id: "art-15",
    slug: "d-opinion",
    title: "Demo opinion: What student media can do better",
    category: "opinion",
    tags: ["Opinion", "Student Voices"],
    summary: "A demo opinion layout. Opinion is always clearly labelled and separate from news reporting.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2025-12-31",
    updatedAt: "2025-12-31",
    artTheme: "campus",
    verification: "D",
    status: "Published",
    views: 112,
  },
  {
    id: "art-16",
    slug: "d-community",
    title: "Demo: Planning a neighbourhood clean-up with youth volunteers",
    category: "news",
    tags: ["Youth and community", "Nigeria"],
    summary: "A demo story layout showing community reporting.",
    body: DEMO_BODY,
    authorId: "auth-2",
    authorName: "Demo author",
    publishedAt: "2025-12-30",
    updatedAt: "2025-12-30",
    artTheme: "community",
    verification: "D",
    status: "Published",
    views: 104,
  },
  {
    id: "art-draft-1",
    slug: "unpublished-draft-test",
    title: "Unpublished Draft: Campus correspondents training handbook",
    category: "campus",
    tags: ["Campus News"],
    summary: "Internal draft article for testing editorial workflow and access restrictions.",
    body: ["This draft must never appear in public pages, category archives or search results."],
    authorId: "auth-1",
    authorName: "D2J Editorial Desk",
    publishedAt: "2026-10-26",
    updatedAt: "2026-10-26",
    artTheme: "campus",
    verification: "D",
    status: "Draft",
    views: 0,
  },
];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    slug: "chevening-2027-28",
    title: "Chevening Scholarships 2027/28",
    provider: "UK Government (Foreign, Commonwealth and Development Office)",
    type: "Scholarship",
    summary: "A UK-government-funded scholarship for study in the UK.",
    eligibility: "Set by Chevening. Check the official eligibility criteria and your country page before applying.",
    benefits: "See the official site for exactly what is covered.",
    deadline: "6 October 2026, 11:00 UTC (12:00 noon in Nigeria). Applications are now closed.",
    officialUrl: "https://chevening.org/application-timeline",
    sourceName: "Chevening Official Website",
    openClosedStatus: "Closed",
    lastVerified: "25 October 2026",
    notes:
      "According to Chevening’s published timeline, applications opened on 4 August 2026 and closed on 6 October 2026. Dates for the next cycle have not been checked.",
    workflowStatus: "Published",
  },
  {
    id: "opp-2",
    slug: "commonwealth-masters-2027-28",
    title: "Commonwealth Master’s Scholarships 2027/28",
    provider: "Commonwealth Scholarship Commission in the UK",
    type: "Scholarship",
    summary:
      "UK government scholarships for full-time taught master’s study in the UK, for candidates from eligible low and middle income Commonwealth countries.",
    eligibility:
      "Candidates apply through a nominating body. The CSC does not accept direct applications for these scholarships.",
    benefits: "See the official page for what the award covers.",
    deadline: "Not confirmed in the official text we checked. Third-party sources report 20 October 2026 at 16:00 BST, which has passed.",
    officialUrl: "https://cscuk.fcdo.gov.uk/masters",
    sourceName: "Commonwealth Scholarship Commission",
    openClosedStatus: "Closed (deadline unconfirmed)",
    lastVerified: "25 October 2026",
    notes:
      "The official page confirms applications for 2027/28 opened and that outcomes are expected by July 2027. Nominating agencies can set earlier deadlines. Check the official page for the current status.",
    workflowStatus: "Published",
  },
  {
    id: "opp-3",
    slug: "commonwealth-shared-2027-28",
    title: "Commonwealth Shared Scholarships 2027/28",
    provider: "Commonwealth Scholarship Commission in the UK",
    type: "Scholarship",
    summary: "Scholarships for study in the UK beginning in September or October 2027.",
    eligibility:
      "Only applicants from the eligible countries listed on the official page can apply. Check whether your country is listed. Candidates must also apply and secure admission to a UK university course.",
    benefits: "See the official page for what is covered.",
    deadline: "Applications open on Tuesday 10 November 2026. The closing date was not shown in the text we checked.",
    officialUrl: "https://cscuk.fcdo.gov.uk/shared",
    sourceName: "Commonwealth Scholarship Commission",
    openClosedStatus: "Upcoming",
    lastVerified: "25 October 2026",
    notes: "Applications are made through CSC Central and cannot be edited after submitting.",
    workflowStatus: "Published",
  },
];

const DEFAULT_QAS: ScholarQuestion[] = [
  {
    id: "qa-1",
    slug: "where-should-a-beginner-start-with-quran-study",
    topic: "Qur’an and Tafsir",
    subject: "Demo question: Where should a beginner start with Qur’an study?",
    questionText: "Sample question text with personal details removed.",
    publicQuestionSummary: "Placeholder answer summary. A reviewed response from a qualified scholar will appear here.",
    anonymousPreference: true,
    consentGiven: true,
    submittedAt: "2026-01-15",
    status: "Published",
    answerText: [
      "Placeholder response, not a ruling. Reviewed scholarly content will replace this. This demonstration record contains no real fatwa, verse, Hadith or citation.",
      "Longer answers use short paragraphs, subheadings and lists in the same reading column as articles.",
    ],
    references: ["[Reference 1, checked by the reviewer]", "[Reference 2, checked by the reviewer]"],
    scholarReviewerName: "[Name and verified credentials, when supplied]",
    editorApproverName: "[Editor, date]",
    reviewedAt: "2026-01-18",
    publishedAt: "2026-01-20",
    isDemo: true,
  },
  {
    id: "qa-2",
    slug: "how-can-i-stay-consistent-with-daily-worship-during-exams",
    topic: "Worship and Daily Practice",
    subject: "Demo question: How can I stay consistent with daily worship during exams?",
    questionText: "Sample question text with personal details removed.",
    publicQuestionSummary: "Placeholder answer summary. A reviewed response will appear here.",
    anonymousPreference: true,
    consentGiven: true,
    submittedAt: "2026-01-14",
    status: "Published",
    answerText: [
      "Placeholder response, not a ruling. Reviewed scholarly content will replace this. This demonstration record contains no real fatwa, verse, Hadith or citation.",
    ],
    references: ["[References checked by the reviewer]"],
    scholarReviewerName: "[Name and verified credentials, when supplied]",
    editorApproverName: "[Editor, date]",
    reviewedAt: "2026-01-16",
    publishedAt: "2026-01-17",
    isDemo: true,
  },
  {
    id: "qa-3",
    slug: "how-do-i-choose-a-reliable-islamic-study-resource",
    topic: "Faith and Spirituality",
    subject: "Demo question: How do I choose a reliable Islamic study resource?",
    questionText: "Sample question text with personal details removed.",
    publicQuestionSummary: "Placeholder answer summary. A reviewed response will appear here.",
    anonymousPreference: true,
    consentGiven: true,
    submittedAt: "2026-01-10",
    status: "Published",
    answerText: [
      "Placeholder response, not a ruling. Reviewed scholarly content will replace this. This demonstration record contains no real fatwa, verse, Hadith or citation.",
    ],
    references: ["[References checked by the reviewer]"],
    scholarReviewerName: "[Name and verified credentials, when supplied]",
    editorApproverName: "[Editor, date]",
    reviewedAt: "2026-01-12",
    publishedAt: "2026-01-13",
    isDemo: true,
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: "usr-admin",
    name: "D-Path to Jannah Super Admin",
    email: process.env.D2J_ADMIN_EMAIL || "admin@dpathtojannah.com",
    role: "SUPER_ADMIN",
    title: "Super Administrator",
    passwordHash: hashPassword(process.env.D2J_ADMIN_PASSWORD || "Dpath1Admin2026!"),
    active: true,
    isSuperAdmin: true,
    permissions: getDefaultPermissionsForRole("SUPER_ADMIN"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-sodiq",
    name: "Sodiq Lawal",
    email: "lawalsodiq915@gmail.com",
    role: "ADMINISTRATOR",
    title: "Managing Editor",
    passwordHash: hashPassword("Sodiq1995!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("ADMINISTRATOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-yahaya",
    name: "Mr. Yahaya Badru",
    email: "abiodunbadru4u@gmail.com",
    role: "ADMINISTRATOR",
    title: "Managing Editor",
    passwordHash: hashPassword("Dpath002Admin2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("ADMINISTRATOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-qudus",
    name: "Qudus Ojomo",
    email: "ojomoabiola@gmail.com",
    role: "ADMINISTRATOR",
    title: "Managing Editor",
    passwordHash: hashPassword("Dpath003Admin2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("ADMINISTRATOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-habeeb",
    name: "Habeeb Gidado",
    email: "gidadohabib1@gmail.com",
    role: "ADMINISTRATOR",
    title: "Managing Editor",
    passwordHash: hashPassword("Dpath003Admin2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("ADMINISTRATOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-khaleel",
    name: "Ibraheem Mogaji",
    email: "khaleeltasnan@gmail.com",
    role: "EDITOR",
    title: "Editor",
    passwordHash: hashPassword("Dpath001Admin2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("EDITOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-editor",
    name: "Editorial Lead",
    email: process.env.D2J_EDITOR_EMAIL || "editor@d2jmediahub.local",
    role: "EDITOR",
    title: "Editor-in-Chief",
    passwordHash: hashPassword(process.env.D2J_EDITOR_PASSWORD || "D2J_Editor_Secure_2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("EDITOR"),
    allowedCategories: ["ALL"],
  },
  {
    id: "usr-contrib",
    name: "Campus Correspondent",
    email: process.env.D2J_CONTRIBUTOR_EMAIL || "contributor@d2jmediahub.local",
    role: "CONTRIBUTOR",
    title: "Student Reporter",
    passwordHash: hashPassword(process.env.D2J_CONTRIBUTOR_PASSWORD || "D2J_Contrib_Secure_2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("CONTRIBUTOR"),
    allowedCategories: ["campus", "news"],
  },
  {
    id: "usr-scholar",
    name: "Scholar Reviewer",
    email: process.env.D2J_SCHOLAR_EMAIL || "scholar@d2jmediahub.local",
    role: "SCHOLAR",
    title: "Specialist Islamic Reviewer",
    passwordHash: hashPassword(process.env.D2J_SCHOLAR_PASSWORD || "D2J_Scholar_Secure_2026!"),
    active: true,
    isSuperAdmin: false,
    permissions: getDefaultPermissionsForRole("SCHOLAR"),
    allowedCategories: ["islam"],
  },
];

const DEFAULT_ACTIVITY_LOGS: AdminActivityLog[] = [
  {
    id: "log-seed-1",
    actorId: "usr-admin",
    actorName: "D2J Super Administrator",
    actorEmail: "admin@d2jmediahub.local",
    actorRole: "SUPER_ADMIN",
    action: "Published Article",
    targetType: "article",
    targetId: "art-1",
    targetTitle: "MSSN Lagos names new leadership and outlines priorities for students",
    statusChange: "Approved → Published",
    details: "Verified primary Voice of Nigeria source report and published to Campus & News desk.",
    superAdminReviewStatus: "Approved",
    superAdminReviewNote: "Source link and verification badge confirmed.",
    reviewedBySuperAdmin: "D2J Super Administrator",
    reviewedAt: "2026-10-28",
    createdAt: "2026-10-28T10:15:00Z",
  },
  {
    id: "log-seed-2",
    actorId: "usr-editor",
    actorName: "Editorial Lead",
    actorEmail: "editor@d2jmediahub.local",
    actorRole: "EDITOR",
    action: "Verified & Published Opportunity",
    targetType: "opportunity",
    targetId: "opp-1",
    targetTitle: "PTDF Overseas Postgraduate Scholarship Scheme",
    statusChange: "Source Verification → Published",
    details: "Checked official PTDF scholarship portal URL and eligibility criteria.",
    superAdminReviewStatus: "Pending Review",
    createdAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "log-seed-3",
    actorId: "usr-scholar",
    actorName: "Scholar Reviewer",
    actorEmail: "scholar@d2jmediahub.local",
    actorRole: "SCHOLAR",
    action: "Reviewed Ask a Scholar Question",
    targetType: "scholar_qa",
    targetId: "qa-1",
    targetTitle: "Balancing university examinations with daily obligatory prayers",
    statusChange: "Scholar Review → Approved Public Answer",
    details: "Reviewed fiqh references and prepared public educational summary for editorial sign-off.",
    superAdminReviewStatus: "Pending Review",
    createdAt: "2026-10-28T16:45:00Z",
  },
];

const DEFAULT_COMMENTS: ArticleComment[] = [
  {
    id: "cmt-seed-1",
    articleId: "art-1",
    articleSlug: "mssn-lagos-names-new-leadership-and-outlines-priorities-for-students",
    articleTitle: "MSSN Lagos names new leadership and outlines priorities for students",
    authorName: "Abdullah Lawal",
    locationOrCampus: "UNILAG Chapter",
    content:
      "Barakallahu feekum to the outgoing and incoming executives. Focusing on academic tutorials and welfare support on campus is exactly what students need right now.",
    createdAt: "2026-10-28T11:30:00Z",
    status: "Approved",
  },
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "D-Path to Jannah Media Hub",
  shortName: "D2J Media Hub",
  tagline: "Voice in propagation of the truth",
  breakingNewsEnabled: true,
  breakingNewsText:
    "Standard Bearers Islamic Organization opens registration for 2026 Holiday Islamic Course (24–28 Dec, Ile-Ife)",
  breakingNewsUrl:
    "/news/campus/standard-bearers-islamic-organization-opens-registration-for-2026-holiday-islamic-course-in-ile-ife",
  newsletterProviderConfigured: false,
  newsletterProviderName: "Pending Provider Configuration",
  officialEmail: "[Official email address, to be supplied]",
  businessEmail: "[Business enquiries contact, to be supplied]",
  officeLocation: "[Office location, only if officially supplied]",
  socialLinks: {
    facebook: "#",
    x: "#",
    whatsapp: "#",
  },
};

const TMP_DB_PATH = path.join(os.tmpdir(), "d2j-media-hub-db.json");
let memoryDbCache: DatabaseSchema | null = null;
let lastSupabaseSyncAt = 0;

function normalizeDatabaseSchema(parsed: DatabaseSchema): DatabaseSchema {
  if (!Array.isArray(parsed.deletedArticleIds)) {
    parsed.deletedArticleIds = [];
  }
  if (Array.isArray(parsed.authors)) {
    const lukmanAuthor = DEFAULT_AUTHORS.find((a) => a.id === "auth-lukman-raimi");
    if (lukmanAuthor && !parsed.authors.some((a) => a.id === "auth-lukman-raimi")) {
      parsed.authors.push({ ...lukmanAuthor });
    }
  }
  if (Array.isArray(parsed.articles)) {
    for (const seedId of [
      "art-1795602609830",
      "art-from-fear-to-eloquence-lukman-raimi",
      "art-sb-cmp-2026-results",
      "art-back-to-campus-avoid-distractions-2026",
      "art-ui-unilag-jamb-masters-2026",
      "art-sb-hic-2026",
    ]) {
      const seedArt = DEFAULT_ARTICLES.find((a) => a.id === seedId);
      if (!seedArt) continue;
      const existingArt = parsed.articles.find((a) => a.id === seedId);
      if (!existingArt && !parsed.deletedArticleIds.includes(seedId)) {
        parsed.articles = [seedArt, ...parsed.articles];
      } else if (existingArt && seedId === "art-1795602609830") {
        existingArt.slug = seedArt.slug;
        existingArt.featured = true;
        if (!existingArt.featuredImage || existingArt.featuredImage.startsWith("data:image/")) {
          existingArt.featuredImage = seedArt.featuredImage;
        }
      } else if (existingArt && seedId === "art-sb-cmp-2026-results") {
        existingArt.slug = seedArt.slug;
        existingArt.category = seedArt.category;
        if (!existingArt.featuredImage) {
          existingArt.featuredImage = seedArt.featuredImage;
        }
        if (!existingArt.sourceUrl) {
          existingArt.sourceUrl = seedArt.sourceUrl;
          existingArt.sourceName = seedArt.sourceName;
          existingArt.contentBlocks = seedArt.contentBlocks;
          existingArt.body = seedArt.body;
        }
      } else if (existingArt && seedId === "art-ui-unilag-jamb-masters-2026") {
        if (!existingArt.featuredImage) {
          existingArt.featuredImage = seedArt.featuredImage;
        }
        const hasImgBlock = (existingArt.contentBlocks || []).some((b) => Boolean(b.imageUrl));
        if (!hasImgBlock) {
          existingArt.contentBlocks = seedArt.contentBlocks;
        }
      }
    }
    // Unpublish all demo articles (verification === "D" or Demo: prefix)
    parsed.articles = parsed.articles.map((a) => {
      if (a.verification === "D" || /^demo(\s+opinion)?:/i.test(a.title || "")) {
        return { ...a, status: "Draft", featured: false };
      }
      return a;
    });
    if (parsed.deletedArticleIds.length > 0) {
      const delSet = new Set(parsed.deletedArticleIds);
      parsed.articles = parsed.articles.filter((a) => !delSet.has(a.id));
    }
    // Deduplicate older auto-suffixed duplicate of From Fear to Eloquence (art-1795521295139)
    parsed.articles = parsed.articles.filter((a) => a.id !== "art-1795521295139");
  }
  if (Array.isArray(parsed.scholarQuestions)) {
    parsed.scholarQuestions = parsed.scholarQuestions.map((q) => {
      if (q.isDemo || /^demo\s+question:/i.test(q.subject || "")) {
        return { ...q, status: "Editorial Screening" };
      }
      return q;
    });
  }
  if (Array.isArray(parsed.users)) {
    const oldAdminHash = hashPassword("D2J_Admin_Secure_2026!");
    parsed.users = parsed.users.map((u) => {
      const isSuper = Boolean(u.isSuperAdmin || u.id === "usr-admin" || u.role === "SUPER_ADMIN");
      const effectiveRole: UserRole = isSuper && u.id === "usr-admin" ? "SUPER_ADMIN" : u.role;
      const updatedEmail =
        u.id === "usr-admin" &&
        (u.email === "admin@d2jmediahub.local" || u.email === "lawalsodiq915@gmail.com")
          ? (process.env.D2J_ADMIN_EMAIL || "admin@dpathtojannah.com").toLowerCase().trim()
          : u.email;
      const updatedHash =
        u.id === "usr-admin" && u.passwordHash === oldAdminHash
          ? hashPassword(process.env.D2J_ADMIN_PASSWORD || "Dpath1Admin2026!")
          : u.passwordHash;
      return {
        ...u,
        email: updatedEmail,
        passwordHash: updatedHash,
        role: effectiveRole,
        isSuperAdmin: isSuper,
        permissions:
          Array.isArray(u.permissions) && u.permissions.length > 0
            ? u.permissions
            : getDefaultPermissionsForRole(effectiveRole),
        allowedCategories:
          Array.isArray(u.allowedCategories) && u.allowedCategories.length > 0
            ? u.allowedCategories
            : ["ALL"],
      };
    });
    const requiredStaffIds = ["usr-sodiq", "usr-yahaya", "usr-qudus", "usr-habeeb", "usr-khaleel"];
    for (const staffId of requiredStaffIds) {
      const seedUser = DEFAULT_USERS.find((u) => u.id === staffId);
      if (!seedUser) continue;
      const existing = parsed.users.find(
        (u) => u.email.toLowerCase() === seedUser.email.toLowerCase() || u.id === seedUser.id
      );
      if (!existing) {
        parsed.users.push({ ...seedUser });
      }
    }
  }
  if (!Array.isArray(parsed.activityLogs)) {
    parsed.activityLogs = DEFAULT_ACTIVITY_LOGS;
  }
  if (!Array.isArray(parsed.comments)) {
    parsed.comments = DEFAULT_COMMENTS;
  }
  if (!Array.isArray(parsed.advertisements)) {
    parsed.advertisements = [];
  } else {
    const todayIso = new Date().toISOString().slice(0, 10);
    parsed.advertisements = parsed.advertisements.map((ad) => {
      if (ad.status === "Active" && ad.endDate && ad.endDate < todayIso) {
        return { ...ad, status: "Expired" };
      }
      return ad;
    });
  }
  if (!Array.isArray(parsed.analyticsRollups)) {
    parsed.analyticsRollups = [];
  }
  if (parsed.settings && parsed.settings.showPublicArticleViews === undefined) {
    parsed.settings.showPublicArticleViews = true;
  }
  if (parsed.settings && parsed.settings.adsenseEnabled === undefined) {
    parsed.settings.adsenseEnabled = false;
  }
  if (
    parsed.settings &&
    (parsed.settings.breakingNewsUrl === "/news/campus/mssn-lagos-new-leadership" ||
      parsed.settings.breakingNewsUrl ===
        "/news/campus/mssn-lagos-names-new-leadership-and-outlines-priorities-for-students" ||
      parsed.settings.breakingNewsText ===
        "MSSN Lagos names new leadership and outlines priorities for students")
  ) {
    parsed.settings.breakingNewsText =
      "Standard Bearers Islamic Organization opens registration for 2026 Holiday Islamic Course (24–28 Dec, Ile-Ife)";
    parsed.settings.breakingNewsUrl =
      "/news/campus/standard-bearers-islamic-organization-opens-registration-for-2026-holiday-islamic-course-in-ile-ife";
  }
  return parsed;
}

export function readDb(): DatabaseSchema {
  if (memoryDbCache && isSupabaseConfigured() && Date.now() - lastSupabaseSyncAt < 10000) {
    return memoryDbCache;
  }

  // If running on a read-only serverless filesystem where TMP_DB_PATH was already written, read from TMP_DB_PATH first
  const activePath = fs.existsSync(TMP_DB_PATH) ? TMP_DB_PATH : DB_PATH;

  if (!fs.existsSync(activePath)) {
    const initial: DatabaseSchema = normalizeDatabaseSchema({
      articles: DEFAULT_ARTICLES,
      categories: DEFAULT_CATEGORIES,
      authors: DEFAULT_AUTHORS,
      opportunities: DEFAULT_OPPORTUNITIES,
      scholarQuestions: DEFAULT_QAS,
      storySubmissions: [],
      contactSubmissions: [],
      media: [
        {
          id: "med-1",
          filename: "logo.webp",
          url: "/logo.webp",
          caption: "Official D2J Media Hub Logo",
          credit: "D-Path to Jannah Media Hub",
          uploadedAt: "2026-10-25",
          uploadedBy: "System",
        },
      ],
      users: DEFAULT_USERS,
      activityLogs: DEFAULT_ACTIVITY_LOGS,
      settings: DEFAULT_SETTINGS,
    });
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(activePath, "utf8");
    const parsed = normalizeDatabaseSchema(JSON.parse(raw) as DatabaseSchema);
    memoryDbCache = parsed;
    return parsed;
  } catch {
    const fallback = normalizeDatabaseSchema({
      articles: DEFAULT_ARTICLES,
      categories: DEFAULT_CATEGORIES,
      authors: DEFAULT_AUTHORS,
      opportunities: DEFAULT_OPPORTUNITIES,
      scholarQuestions: DEFAULT_QAS,
      storySubmissions: [],
      contactSubmissions: [],
      media: [],
      users: DEFAULT_USERS,
      activityLogs: DEFAULT_ACTIVITY_LOGS,
      settings: DEFAULT_SETTINGS,
    });
    memoryDbCache = fallback;
    return fallback;
  }
}

/**
 * Synchronises in-memory & local cache from Supabase PostgreSQL when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
 * Safe to call in async Route Handlers and Server Components before `readDb()`.
 */
export async function ensureDbSynced(): Promise<DatabaseSchema> {
  const localFallback = readDb();
  if (!isSupabaseConfigured()) {
    return localFallback;
  }
  try {
    const remoteState = await loadStateFromSupabase(localFallback);
    if (remoteState) {
      const normalized = normalizeDatabaseSchema(remoteState);
      memoryDbCache = normalized;
      lastSupabaseSyncAt = Date.now();
      writeLocalCacheOnly(normalized);
      return normalized;
    }
  } catch {
    // Fallback to local state if network fails
  }
  return localFallback;
}

function writeLocalCacheOnly(data: DatabaseSchema): void {
  const serialized = JSON.stringify(data, null, 2);
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, serialized, "utf8");
  } catch {
    try {
      fs.writeFileSync(TMP_DB_PATH, serialized, "utf8");
    } catch {
      // Ignore if tmp is also unavailable
    }
  }
}

export function writeDb(data: DatabaseSchema): void {
  const normalized = normalizeDatabaseSchema(data);
  memoryDbCache = normalized;
  lastSupabaseSyncAt = Date.now();
  writeLocalCacheOnly(normalized);
  if (isSupabaseConfigured()) {
    void saveStateToSupabase(normalized, false);
  }
}

export async function writeDbAsync(
  data: DatabaseSchema
): Promise<{ persistedToCloud: boolean; cloudConfigured: boolean }> {
  const normalized = normalizeDatabaseSchema(data);
  memoryDbCache = normalized;
  lastSupabaseSyncAt = Date.now();
  writeLocalCacheOnly(normalized);
  const cloudConfigured = isSupabaseConfigured();
  if (cloudConfigured) {
    const ok = await saveStateToSupabase(normalized, false);
    return { persistedToCloud: ok, cloudConfigured: true };
  }
  return { persistedToCloud: false, cloudConfigured: false };
}

// Public-safe query helpers (NEVER return drafts, demo content, or private submissions)
export function getPublishedArticles(category?: string): Article[] {
  const db = readDb();
  const list = db.articles.filter((a) => a.status === "Published" && a.verification !== "D");
  const filtered = category ? list.filter((a) => a.category === category) : list;
  return filtered.sort((a, b) => {
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

export function getPublishedArticleBySlug(slug: string): Article | undefined {
  const db = readDb();
  const exact = db.articles.find(
    (a) => a.slug === slug && a.status === "Published" && a.verification !== "D"
  );
  if (exact) return exact;
  // Also allow matching without or with trailing 4-digit timestamp suffix or hyphenated da-wah vs dawah
  const normalizeSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/-\d{4}$/, "")
      .replace(/da-wah/g, "dawah");
  const targetNorm = normalizeSlug(slug);
  return db.articles.find(
    (a) =>
      a.status === "Published" &&
      a.verification !== "D" &&
      normalizeSlug(a.slug) === targetNorm
  );
}

export function getApprovedCommentsForArticle(articleId: string, articleSlug?: string): ArticleComment[] {
  const db = readDb();
  const list = Array.isArray(db.comments) ? db.comments : [];
  return list
    .filter(
      (c) =>
        c.status === "Approved" &&
        (c.articleId === articleId || (articleSlug && c.articleSlug === articleSlug))
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getPublishedOpportunities(): Opportunity[] {
  const db = readDb();
  return db.opportunities.filter((o) => o.workflowStatus === "Published");
}

export function getPublishedOpportunityBySlug(slug: string): Opportunity | undefined {
  const db = readDb();
  return db.opportunities.find((o) => o.slug === slug && o.workflowStatus === "Published");
}

export function getPublishedScholarAnswers(): ScholarQuestion[] {
  const db = readDb();
  return db.scholarQuestions
    .filter((q) => q.status === "Published" && !q.isDemo)
    .map((q) => ({
      ...q,
      // Strip private contact info from public responses
      email: undefined,
      displayName: q.anonymousPreference ? undefined : q.displayName,
    }));
}

export function getPublishedScholarAnswerBySlug(slug: string): ScholarQuestion | undefined {
  const answers = getPublishedScholarAnswers();
  return answers.find((q) => q.slug === slug || q.id === slug);
}

export function getCategories(): Category[] {
  return readDb().categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return readDb().categories.find((c) => c.slug === slug);
}

export function getSiteSettings(): SiteSettings {
  return readDb().settings;
}

export function getActiveAdvertisements(
  placement?: AdPlacement,
  categorySlug?: string
): Advertisement[] {
  const db = readDb();
  const list = Array.isArray(db.advertisements) ? db.advertisements : [];
  const todayIso = new Date().toISOString().slice(0, 10);
  return list.filter((ad) => {
    if (ad.status !== "Active") return false;
    if (ad.startDate && ad.startDate > todayIso) return false;
    if (ad.endDate && ad.endDate < todayIso) return false;
    if (placement && ad.placement !== placement) return false;
    if (
      categorySlug &&
      Array.isArray(ad.targetCategories) &&
      ad.targetCategories.length > 0 &&
      !ad.targetCategories.includes("ALL") &&
      !ad.targetCategories.includes(categorySlug)
    ) {
      return false;
    }
    return true;
  });
}

export const getDb = readDb;
export const saveDb = writeDb;

