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
}

export interface DatabaseSchema {
  articles: Article[];
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
    name: "D2J Super Administrator",
    email: process.env.D2J_ADMIN_EMAIL || "admin@d2jmediahub.local",
    role: "SUPER_ADMIN",
    title: "Super Administrator",
    passwordHash: hashPassword(process.env.D2J_ADMIN_PASSWORD || "D2J_Admin_Secure_2026!"),
    active: true,
    isSuperAdmin: true,
    permissions: getDefaultPermissionsForRole("SUPER_ADMIN"),
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
  breakingNewsText: "MSSN Lagos names new leadership and outlines priorities for students",
  breakingNewsUrl: "/news/campus/mssn-lagos-names-new-leadership-and-outlines-priorities-for-students",
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
  if (Array.isArray(parsed.users)) {
    const defaultAdminHash = hashPassword("D2J_Admin_Secure_2026!");
    parsed.users = parsed.users.map((u) => {
      const isSuper = Boolean(u.isSuperAdmin || u.id === "usr-admin" || u.role === "SUPER_ADMIN");
      const effectiveRole: UserRole = isSuper && u.id === "usr-admin" ? "SUPER_ADMIN" : u.role;
      const updatedEmail =
        u.id === "usr-admin" &&
        u.email === "admin@d2jmediahub.local" &&
        process.env.D2J_ADMIN_EMAIL
          ? process.env.D2J_ADMIN_EMAIL.toLowerCase().trim()
          : u.email;
      const updatedHash =
        u.id === "usr-admin" &&
        u.passwordHash === defaultAdminHash &&
        process.env.D2J_ADMIN_PASSWORD
          ? hashPassword(process.env.D2J_ADMIN_PASSWORD)
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
  }
  if (!Array.isArray(parsed.activityLogs)) {
    parsed.activityLogs = DEFAULT_ACTIVITY_LOGS;
  }
  if (!Array.isArray(parsed.comments)) {
    parsed.comments = DEFAULT_COMMENTS;
  }
  if (
    parsed.settings &&
    parsed.settings.breakingNewsUrl === "/news/campus/mssn-lagos-new-leadership"
  ) {
    parsed.settings.breakingNewsUrl =
      "/news/campus/mssn-lagos-names-new-leadership-and-outlines-priorities-for-students";
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

export async function writeDbAsync(data: DatabaseSchema): Promise<void> {
  const normalized = normalizeDatabaseSchema(data);
  memoryDbCache = normalized;
  lastSupabaseSyncAt = Date.now();
  writeLocalCacheOnly(normalized);
  if (isSupabaseConfigured()) {
    await saveStateToSupabase(normalized, false);
  }
}

// Public-safe query helpers (NEVER return drafts or private submissions)
export function getPublishedArticles(category?: string): Article[] {
  const db = readDb();
  const list = db.articles.filter((a) => a.status === "Published");
  const filtered = category ? list.filter((a) => a.category === category) : list;
  return filtered.sort((a, b) => {
    const vDiff = Number(b.verification !== "D") - Number(a.verification !== "D");
    if (vDiff !== 0) return vDiff;
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

export function getPublishedArticleBySlug(slug: string): Article | undefined {
  const db = readDb();
  return db.articles.find((a) => a.slug === slug && a.status === "Published");
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
    .filter((q) => q.status === "Published")
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

export const getDb = readDb;
export const saveDb = writeDb;

