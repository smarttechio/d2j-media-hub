import { NextRequest, NextResponse } from 'next/server';
import {
  readDb,
  writeDb,
  hashPassword,
  Article,
  ArticleStatus,
  Opportunity,
  ScholarQAStatus,
  StorySubmissionStatus,
  UserRole,
  DashboardPermission,
  getDefaultPermissionsForRole,
  AdminActivityLog,
  DatabaseSchema,
} from '@/lib/db';
import {
  getCurrentSession,
  canPublishContent,
  canManageUsers,
  canReviewOtherAdmins,
  canReviewScholarQuestions,
  SessionPayload,
} from '@/lib/auth';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function appendActivityLog(
  db: DatabaseSchema,
  session: SessionPayload,
  entry: Omit<
    AdminActivityLog,
    'id' | 'actorId' | 'actorName' | 'actorEmail' | 'actorRole' | 'createdAt'
  >
) {
  if (!Array.isArray(db.activityLogs)) {
    db.activityLogs = [];
  }
  const newLog: AdminActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: session.userId,
    actorName: session.name,
    actorEmail: session.email,
    actorRole: session.role,
    createdAt: new Date().toISOString(),
    superAdminReviewStatus: session.isSuperAdmin ? 'Approved' : 'Pending Review',
    ...entry,
  };
  db.activityLogs.unshift(newLog);
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised editorial access.' }, { status: 401 });
  }

  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash: _ph, ...u }) => u);
  const canSeeUsers =
    canManageUsers(session.role, session.permissions) ||
    canReviewOtherAdmins(session.role, session.permissions);

  return NextResponse.json({
    session,
    articles: db.articles,
    categories: db.categories,
    authors: db.authors,
    opportunities: db.opportunities,
    scholarQuestions: db.scholarQuestions,
    storySubmissions: db.storySubmissions,
    contactSubmissions: db.contactSubmissions,
    media: db.media,
    users: canSeeUsers ? safeUsers : [],
    activityLogs: canReviewOtherAdmins(session.role, session.permissions)
      ? db.activityLogs || []
      : (db.activityLogs || []).filter((l) => l.actorId === session.userId),
    settings: db.settings,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised editorial access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;
    const db = readDb();

    // 1. CREATE OR UPDATE ARTICLE
    if (action === 'save_article') {
      const {
        id,
        title,
        summary,
        category,
        tags,
        authorName,
        artTheme,
        featuredImage,
        featuredVideo,
        imageCaption,
        bodyParagraphs,
        status,
        verification,
        sourceName,
        sourceUrl,
        correctionNote,
        seoTitle,
        seoDescription,
      } = payload;

      // Enforce RBAC: Contributors cannot set status to Approved or Published unless granted publish_articles
      let requestedStatus: ArticleStatus = status || 'Draft';
      if (!canPublishContent(session.role, session.permissions)) {
        if (requestedStatus === 'Approved' || requestedStatus === 'Published') {
          requestedStatus = 'Submitted for Review';
        }
      }

      // Enforce Category Scope if the Super Admin restricted this user to specific categories
      const allowedCats = session.allowedCategories || ['ALL'];
      if (
        !session.isSuperAdmin &&
        session.role !== 'SUPER_ADMIN' &&
        !allowedCats.includes('ALL') &&
        category &&
        !allowedCats.includes(category)
      ) {
        return NextResponse.json(
          {
            error: `Your account is only authorised to manage articles in: ${allowedCats.join(', ')}.`,
          },
          { status: 403 }
        );
      }

      const existingIdx = id ? db.articles.findIndex((a) => a.id === id) : -1;
      const nowDate = new Date().toISOString().slice(0, 10);

      if (existingIdx >= 0) {
        const current = db.articles[existingIdx];
        const prevStatus = current.status;
        db.articles[existingIdx] = {
          ...current,
          title: title ?? current.title,
          slug: title ? slugify(title) : current.slug,
          summary: summary ?? current.summary,
          category: category ?? current.category,
          tags: Array.isArray(tags) ? tags : current.tags,
          authorName: authorName ?? current.authorName,
          artTheme: artTheme ?? current.artTheme,
          featuredImage:
            featuredImage !== undefined ? featuredImage || undefined : current.featuredImage,
          featuredVideo:
            featuredVideo !== undefined ? featuredVideo || undefined : current.featuredVideo,
          imageCaption: imageCaption ?? current.imageCaption,
          body: Array.isArray(bodyParagraphs) ? bodyParagraphs : current.body,
          status: requestedStatus,
          verification: verification ?? current.verification,
          sourceName: sourceName ?? current.sourceName,
          sourceUrl: sourceUrl ?? current.sourceUrl,
          correctionNote: correctionNote ?? current.correctionNote,
          seoTitle: seoTitle ?? current.seoTitle,
          seoDescription: seoDescription ?? current.seoDescription,
          updatedAt: nowDate,
          lastEditedBy: session.name,
          lastEditedById: session.userId,
          approvedBy:
            requestedStatus === 'Approved' || requestedStatus === 'Published'
              ? session.name
              : current.approvedBy,
          approvedById:
            requestedStatus === 'Approved' || requestedStatus === 'Published'
              ? session.userId
              : current.approvedById,
          publishedAt:
            requestedStatus === 'Published' && current.status !== 'Published'
              ? nowDate
              : current.publishedAt,
        };

        appendActivityLog(db, session, {
          action: 'Edited Article',
          targetType: 'article',
          targetId: current.id,
          targetTitle: db.articles[existingIdx].title,
          statusChange:
            prevStatus !== requestedStatus
              ? `${prevStatus} → ${requestedStatus}`
              : requestedStatus,
          details: `Category: ${db.articles[existingIdx].category} · Verification: ${db.articles[existingIdx].verification}`,
        });
      } else {
        const newArticle: Article = {
          id: `art-${Date.now()}`,
          slug: `${slugify(title || 'untitled-article')}-${Date.now().toString().slice(-4)}`,
          title: String(title || 'Untitled Article'),
          summary: String(summary || ''),
          body:
            Array.isArray(bodyParagraphs) && bodyParagraphs.length > 0
              ? bodyParagraphs
              : ['Draft paragraph.'],
          category: String(category || 'news'),
          tags: Array.isArray(tags) ? tags : ['News'],
          authorId: session.userId,
          authorName: String(authorName || session.name),
          publishedAt: nowDate,
          updatedAt: nowDate,
          artTheme: artTheme || 'campus',
          featuredImage: featuredImage || undefined,
          featuredVideo: featuredVideo || undefined,
          imageCaption: String(imageCaption || 'Editorial illustration — D2J Media Hub.'),
          verification: verification || 'V',
          status: requestedStatus,
          views: 1,
          sourceName: sourceName || undefined,
          sourceUrl: sourceUrl || undefined,
          correctionNote: correctionNote || undefined,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          lastEditedBy: session.name,
          lastEditedById: session.userId,
          approvedBy:
            requestedStatus === 'Approved' || requestedStatus === 'Published'
              ? session.name
              : undefined,
          approvedById:
            requestedStatus === 'Approved' || requestedStatus === 'Published'
              ? session.userId
              : undefined,
        };
        db.articles.unshift(newArticle);

        appendActivityLog(db, session, {
          action: 'Created New Article',
          targetType: 'article',
          targetId: newArticle.id,
          targetTitle: newArticle.title,
          statusChange: `New → ${requestedStatus}`,
          details: `Category: ${newArticle.category} · Byline: ${newArticle.authorName}`,
        });
      }

      writeDb(db);
      return NextResponse.json({
        ok: true,
        articles: db.articles,
        activityLogs: db.activityLogs,
      });
    }

    // 2. TRANSITION ARTICLE WORKFLOW STATUS
    if (action === 'update_article_status') {
      const { id, status } = payload as { id: string; status: ArticleStatus };
      if (
        (status === 'Approved' || status === 'Published') &&
        !canPublishContent(session.role, session.permissions)
      ) {
        return NextResponse.json(
          { error: 'Only Editors and Administrators can approve or publish articles.' },
          { status: 403 }
        );
      }
      const art = db.articles.find((a) => a.id === id);
      if (!art) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
      const prevStatus = art.status;
      art.status = status;
      art.updatedAt = new Date().toISOString().slice(0, 10);
      art.lastEditedBy = session.name;
      art.lastEditedById = session.userId;
      if (status === 'Approved' || status === 'Published') {
        art.approvedBy = session.name;
        art.approvedById = session.userId;
      }
      if (status === 'Published') {
        art.publishedAt = art.updatedAt;
      }

      appendActivityLog(db, session, {
        action: `Changed Article Status to ${status}`,
        targetType: 'article',
        targetId: art.id,
        targetTitle: art.title,
        statusChange: `${prevStatus} → ${status}`,
        details: `Category: ${art.category}`,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        articles: db.articles,
        activityLogs: db.activityLogs,
      });
    }

    // 3. DELETE ARTICLE (Admin/Editor only)
    if (action === 'delete_article') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete articles.' },
          { status: 403 }
        );
      }
      const target = db.articles.find((a) => a.id === payload.id);
      db.articles = db.articles.filter((a) => a.id !== payload.id);

      if (target) {
        appendActivityLog(db, session, {
          action: 'Deleted Article',
          targetType: 'article',
          targetId: target.id,
          targetTitle: target.title,
          statusChange: `${target.status} → Deleted`,
          details: `Category: ${target.category}`,
        });
      }

      writeDb(db);
      return NextResponse.json({
        ok: true,
        articles: db.articles,
        activityLogs: db.activityLogs,
      });
    }

    // 4. CREATE OR UPDATE OPPORTUNITY
    if (action === 'save_opportunity') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Only Editors and Administrators can manage verified opportunities.' },
          { status: 403 }
        );
      }
      const {
        id,
        title,
        provider,
        type,
        summary,
        eligibility,
        benefits,
        deadline,
        officialUrl,
        sourceName,
        openClosedStatus,
        lastVerified,
        notes,
        workflowStatus,
      } = payload;

      const existingIdx = id ? db.opportunities.findIndex((o) => o.id === id) : -1;
      if (existingIdx >= 0) {
        const cur = db.opportunities[existingIdx];
        db.opportunities[existingIdx] = {
          ...cur,
          title: title ?? cur.title,
          provider: provider ?? cur.provider,
          type: type ?? cur.type,
          summary: summary ?? cur.summary,
          eligibility: eligibility ? String(eligibility) : cur.eligibility,
          benefits: benefits ? String(benefits) : cur.benefits,
          deadline: deadline ?? cur.deadline,
          officialUrl: officialUrl ?? cur.officialUrl,
          sourceName: sourceName ?? cur.sourceName,
          openClosedStatus: openClosedStatus ?? cur.openClosedStatus,
          lastVerified: lastVerified ?? cur.lastVerified,
          notes: notes ?? cur.notes,
          workflowStatus: workflowStatus ?? cur.workflowStatus,
        };

        appendActivityLog(db, session, {
          action: 'Updated Opportunity',
          targetType: 'opportunity',
          targetId: cur.id,
          targetTitle: db.opportunities[existingIdx].title,
          statusChange: db.opportunities[existingIdx].workflowStatus,
          details: `Provider: ${db.opportunities[existingIdx].provider}`,
        });
      } else {
        const newOpp: Opportunity = {
          id: `opp-${Date.now()}`,
          slug: `${slugify(title || 'opportunity')}-${Date.now().toString().slice(-4)}`,
          title: String(title || 'New Opportunity'),
          provider: String(provider || ''),
          type: type || 'Scholarship',
          summary: String(summary || ''),
          eligibility: String(eligibility || 'See official portal for eligibility criteria.'),
          benefits: String(benefits || 'See official portal for funding benefits.'),
          deadline: String(deadline || 'Check official website'),
          officialUrl: String(officialUrl || 'https://'),
          sourceName: String(sourceName || provider || 'Official Portal'),
          openClosedStatus: openClosedStatus || 'Open',
          lastVerified: String(lastVerified || new Date().toISOString().slice(0, 10)),
          notes: String(notes || 'Verified against official source.'),
          workflowStatus: workflowStatus || 'Draft',
        };
        db.opportunities.unshift(newOpp);

        appendActivityLog(db, session, {
          action: 'Created Opportunity',
          targetType: 'opportunity',
          targetId: newOpp.id,
          targetTitle: newOpp.title,
          statusChange: `New → ${newOpp.workflowStatus}`,
          details: `Provider: ${newOpp.provider}`,
        });
      }
      writeDb(db);
      return NextResponse.json({
        ok: true,
        opportunities: db.opportunities,
        activityLogs: db.activityLogs,
      });
    }

    // 5. ASK A SCHOLAR REVIEW & WORKFLOW
    if (action === 'update_scholar_qa') {
      if (!canReviewScholarQuestions(session.role, session.permissions)) {
        return NextResponse.json(
          {
            error:
              'Only Scholars, Editors, and Administrators can review Ask a Scholar submissions.',
          },
          { status: 403 }
        );
      }
      const {
        id,
        status,
        publicQuestionSummary,
        answerParagraphs,
        references,
        scholarReviewerName,
        scholarCredentials,
      } = payload as {
        id: string;
        status: ScholarQAStatus;
        publicQuestionSummary?: string;
        answerParagraphs?: string[];
        references?: string[];
        scholarReviewerName?: string;
        scholarCredentials?: string;
      };

      // Scholars can move to Scholar Review or Approved Public Answer, but final Published status requires Editor/Admin
      if (status === 'Published' && !canPublishContent(session.role, session.permissions)) {
        return NextResponse.json(
          {
            error:
              'Only Editors or Administrators can publish an approved scholarly answer to the public site.',
          },
          { status: 403 }
        );
      }

      const qa = db.scholarQuestions.find((q) => q.id === id);
      if (!qa) return NextResponse.json({ error: 'Scholar question not found.' }, { status: 404 });

      const prevStatus = qa.status;
      qa.status = status;
      if (publicQuestionSummary !== undefined) qa.publicQuestionSummary = publicQuestionSummary;
      if (Array.isArray(answerParagraphs)) qa.answerText = answerParagraphs;
      if (Array.isArray(references)) qa.references = references;
      if (scholarReviewerName !== undefined) qa.scholarReviewerName = scholarReviewerName;
      if (scholarCredentials !== undefined) qa.scholarCredentials = scholarCredentials;
      qa.reviewedAt = new Date().toISOString().slice(0, 10);
      if (status === 'Published') {
        qa.editorApproverName = session.name;
        qa.publishedAt = qa.reviewedAt;
      }

      appendActivityLog(db, session, {
        action: 'Reviewed Ask a Scholar Question',
        targetType: 'scholar_qa',
        targetId: qa.id,
        targetTitle: qa.subject,
        statusChange: `${prevStatus} → ${status}`,
        details: `Topic: ${qa.topic} · Reviewer: ${qa.scholarReviewerName || session.name}`,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        scholarQuestions: db.scholarQuestions,
        activityLogs: db.activityLogs,
      });
    }

    // 6. STORY SUBMISSION REVIEW & PROMOTION TO ARTICLE DRAFT
    if (action === 'update_story_submission') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Only Editors and Administrators can review story submissions.' },
          { status: 403 }
        );
      }
      const { id, status, editorNotes, convertToDraft } = payload as {
        id: string;
        status: StorySubmissionStatus;
        editorNotes?: string;
        convertToDraft?: boolean;
      };
      const sub = db.storySubmissions.find((s) => s.id === id);
      if (!sub) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });

      const prevStatus = sub.status;
      sub.status = status;
      if (editorNotes !== undefined) sub.editorNotes = editorNotes;

      if (convertToDraft) {
        const nowDate = new Date().toISOString().slice(0, 10);
        const draftArt: Article = {
          id: `art-${Date.now()}`,
          slug: `${slugify(sub.headline)}-${Date.now().toString().slice(-4)}`,
          title: sub.headline,
          summary: sub.summary,
          body: sub.body.split(/\n\n+/).filter(Boolean),
          category: sub.category.toLowerCase().includes('campus') ? 'campus' : 'news',
          tags: [sub.category, sub.institution || 'Community'].filter(Boolean),
          authorId: 'contributor-sub',
          authorName: sub.preferredByline || sub.contributorName,
          publishedAt: nowDate,
          updatedAt: nowDate,
          artTheme: sub.category.toLowerCase().includes('campus') ? 'campus' : 'community',
          imageCaption: `Submitted by ${sub.contributorName}`,
          verification: 'S',
          status: 'Draft',
          views: 0,
          sourceName: sub.sourceLinks || undefined,
          lastEditedBy: session.name,
          lastEditedById: session.userId,
        };
        db.articles.unshift(draftArt);
        sub.status = 'Prepared for Publication';
      }

      appendActivityLog(db, session, {
        action: convertToDraft
          ? 'Promoted Story Submission to Article Draft'
          : 'Reviewed Story Submission',
        targetType: 'story_submission',
        targetId: sub.id,
        targetTitle: sub.headline,
        statusChange: `${prevStatus} → ${sub.status}`,
        details: `Contributor: ${sub.contributorName}`,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        storySubmissions: db.storySubmissions,
        articles: db.articles,
        activityLogs: db.activityLogs,
      });
    }

    // 7. CONTACT SUBMISSION STATUS UPDATE
    if (action === 'update_contact_status') {
      const { id, status } = payload as { id: string; status: 'New' | 'Reviewed' | 'Resolved' };
      const msg = db.contactSubmissions.find((c) => c.id === id);
      if (!msg) return NextResponse.json({ error: 'Contact message not found.' }, { status: 404 });
      const prevStatus = msg.status;
      msg.status = status;

      appendActivityLog(db, session, {
        action: 'Updated Contact / Correction Enquiry',
        targetType: 'contact',
        targetId: msg.id,
        targetTitle: msg.subject || msg.enquiryType,
        statusChange: `${prevStatus} → ${status}`,
        details: `From: ${msg.name} (${msg.email})`,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        contactSubmissions: db.contactSubmissions,
        activityLogs: db.activityLogs,
      });
    }

    // 8. SAVE CATEGORY OR AUTHOR OR MEDIA
    if (action === 'save_category') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });
      }
      const { slug, name, description, topics } = payload;
      const existing = db.categories.find((c) => c.slug === slug);
      if (existing) {
        existing.name = name || existing.name;
        existing.description = description || existing.description;
        if (Array.isArray(topics)) existing.topics = topics;
      } else {
        db.categories.push({
          slug: slugify(slug || name),
          name: String(name),
          description: String(description || ''),
          topics: Array.isArray(topics) ? topics : ['All'],
        });
      }

      appendActivityLog(db, session, {
        action: existing ? 'Updated Category' : 'Created Category',
        targetType: 'category',
        targetTitle: String(name || slug),
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        categories: db.categories,
        activityLogs: db.activityLogs,
      });
    }

    if (action === 'save_author') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });
      }
      const { id, name, role, bio } = payload;
      const existing = id ? db.authors.find((a) => a.id === id) : undefined;
      if (existing) {
        existing.name = name || existing.name;
        existing.role = role || existing.role;
        existing.bio = bio || existing.bio;
      } else {
        const initials = String(name || 'D2J')
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        db.authors.push({
          id: `auth-${Date.now()}`,
          name: String(name),
          role: String(role || 'Staff Writer'),
          bio: String(bio || ''),
          avatarInitials: initials || 'DJ',
        });
      }

      appendActivityLog(db, session, {
        action: existing ? 'Updated Author Profile' : 'Added Author Profile',
        targetType: 'author',
        targetTitle: String(name),
        details: `Role: ${role}`,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        authors: db.authors,
        activityLogs: db.activityLogs,
      });
    }

    if (action === 'save_media') {
      const { filename, url, caption, credit } = payload;
      db.media.unshift({
        id: `med-${Date.now()}`,
        filename: String(filename || 'asset.webp'),
        url: String(url || '/logo.webp'),
        caption: String(caption || ''),
        credit: String(credit || 'D2J Media Hub'),
        uploadedAt: new Date().toISOString().slice(0, 10),
        uploadedBy: session.name,
      });

      appendActivityLog(db, session, {
        action: 'Registered Media Asset',
        targetType: 'media',
        targetTitle: String(filename || url),
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        media: db.media,
        activityLogs: db.activityLogs,
      });
    }

    // 9. USER & ADMIN ROLE / PERMISSION MANAGEMENT (SUPER ADMIN / USER MANAGER)
    if (action === 'save_user') {
      if (!canManageUsers(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Only Super Administrators and authorised User Managers can manage accounts.' },
          { status: 403 }
        );
      }
      const {
        id,
        name,
        email,
        role,
        title,
        password,
        active,
        permissions,
        allowedCategories,
      } = payload as {
        id?: string;
        name: string;
        email: string;
        role: UserRole;
        title: string;
        password?: string;
        active?: boolean;
        permissions?: DashboardPermission[];
        allowedCategories?: string[];
      };

      // Only a Super Admin can grant SUPER_ADMIN role
      const targetRole: UserRole =
        role === 'SUPER_ADMIN' && !session.isSuperAdmin ? 'ADMINISTRATOR' : role;

      const existing = id ? db.users.find((u) => u.id === id) : undefined;
      if (existing) {
        // Protect primary Super Admin (usr-admin) from being deactivated or demoted by non-super-admin
        if (existing.id === 'usr-admin' && !session.isSuperAdmin) {
          return NextResponse.json(
            { error: 'Only the primary Super Administrator can modify the Super Admin account.' },
            { status: 403 }
          );
        }
        const prevRole = existing.role;
        existing.name = name ?? existing.name;
        existing.email = email ? email.toLowerCase().trim() : existing.email;
        existing.role = existing.id === 'usr-admin' ? 'SUPER_ADMIN' : targetRole ?? existing.role;
        existing.isSuperAdmin = existing.id === 'usr-admin' || existing.role === 'SUPER_ADMIN';
        existing.title = title ?? existing.title;
        if (active !== undefined && existing.id !== 'usr-admin') {
          existing.active = active;
        }
        if (Array.isArray(permissions) && permissions.length > 0) {
          existing.permissions =
            existing.id === 'usr-admin'
              ? getDefaultPermissionsForRole('SUPER_ADMIN')
              : permissions;
        }
        if (Array.isArray(allowedCategories) && allowedCategories.length > 0) {
          existing.allowedCategories = allowedCategories;
        }
        if (password && password.trim().length >= 8) {
          existing.passwordHash = hashPassword(password.trim());
        }

        appendActivityLog(db, session, {
          action: 'Updated Admin / Staff Account & Permissions',
          targetType: 'user',
          targetId: existing.id,
          targetTitle: `${existing.name} (${existing.email})`,
          statusChange:
            prevRole !== existing.role
              ? `${prevRole} → ${existing.role}`
              : `${existing.role} (${existing.active ? 'Active' : 'Suspended'})`,
          details: `Access modules: ${(existing.permissions || []).join(', ')}`,
        });
      } else {
        const cleanEmail = String(email || '')
          .toLowerCase()
          .trim();
        if (!cleanEmail) {
          return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }
        if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
          return NextResponse.json(
            { error: 'An account with this email already exists.' },
            { status: 400 }
          );
        }

        const effectiveRole: UserRole = targetRole || 'CONTRIBUTOR';
        const effectivePerms =
          Array.isArray(permissions) && permissions.length > 0
            ? permissions
            : getDefaultPermissionsForRole(effectiveRole);

        const newUser = {
          id: `usr-${Date.now()}`,
          name: String(name),
          email: cleanEmail,
          role: effectiveRole,
          title: String(title || 'Staff Member'),
          passwordHash: hashPassword(password || 'D2J_TempPass_2026!'),
          active: active !== false,
          isSuperAdmin: effectiveRole === 'SUPER_ADMIN',
          permissions: effectivePerms,
          allowedCategories:
            Array.isArray(allowedCategories) && allowedCategories.length > 0
              ? allowedCategories
              : ['ALL'],
          createdBy: session.name,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        db.users.push(newUser);

        appendActivityLog(db, session, {
          action: 'Added New Admin / Staff Account',
          targetType: 'user',
          targetId: newUser.id,
          targetTitle: `${newUser.name} (${newUser.email})`,
          statusChange: `Assigned Role: ${newUser.role}`,
          details: `Access modules: ${effectivePerms.join(', ')}`,
        });
      }

      writeDb(db);
      const safeUsers = db.users.map(({ passwordHash: _ph, ...u }) => u);
      return NextResponse.json({
        ok: true,
        users: safeUsers,
        activityLogs: db.activityLogs,
      });
    }

    // 9B. DELETE STAFF / ADMIN USER (SUPER ADMIN ONLY)
    if (action === 'delete_user') {
      if (!session.isSuperAdmin && session.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Only a Super Administrator can permanently remove staff accounts.' },
          { status: 403 }
        );
      }
      const { id } = payload as { id: string };
      if (id === 'usr-admin' || id === session.userId) {
        return NextResponse.json(
          { error: 'Cannot delete the primary Super Admin or your own currently active session.' },
          { status: 400 }
        );
      }
      const target = db.users.find((u) => u.id === id);
      db.users = db.users.filter((u) => u.id !== id);
      if (target) {
        appendActivityLog(db, session, {
          action: 'Removed Admin / Staff Account',
          targetType: 'user',
          targetId: target.id,
          targetTitle: `${target.name} (${target.email})`,
          statusChange: `${target.role} → Removed`,
        });
      }
      writeDb(db);
      const safeUsers = db.users.map(({ passwordHash: _ph, ...u }) => u);
      return NextResponse.json({
        ok: true,
        users: safeUsers,
        activityLogs: db.activityLogs,
      });
    }

    // 9C. SUPER ADMIN REVIEW OF OTHER ADMINS' ACTIVITY / WORK
    if (action === 'review_admin_activity') {
      if (!canReviewOtherAdmins(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Only Super Administrators and authorised reviewers can review admin activity.' },
          { status: 403 }
        );
      }
      const { logId, reviewStatus, reviewNote } = payload as {
        logId: string;
        reviewStatus: 'Pending Review' | 'Approved' | 'Needs Revision';
        reviewNote?: string;
      };
      if (!Array.isArray(db.activityLogs)) db.activityLogs = [];
      const logEntry = db.activityLogs.find((l) => l.id === logId);
      if (!logEntry) {
        return NextResponse.json({ error: 'Activity log entry not found.' }, { status: 404 });
      }
      logEntry.superAdminReviewStatus = reviewStatus;
      if (reviewNote !== undefined) logEntry.superAdminReviewNote = reviewNote;
      logEntry.reviewedBySuperAdmin = session.name;
      logEntry.reviewedAt = new Date().toISOString().slice(0, 10);

      writeDb(db);
      return NextResponse.json({
        ok: true,
        activityLogs: db.activityLogs,
      });
    }

    // 10. SITE SETTINGS
    if (action === 'save_settings') {
      if (!canPublishContent(session.role, session.permissions)) {
        return NextResponse.json(
          { error: 'Only Editors and Administrators can update site settings.' },
          { status: 403 }
        );
      }
      db.settings = {
        ...db.settings,
        ...payload,
      };

      appendActivityLog(db, session, {
        action: 'Updated Platform & Breaking News Settings',
        targetType: 'settings',
        targetTitle: db.settings.siteName,
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        settings: db.settings,
        activityLogs: db.activityLogs,
      });
    }

    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Server error processing editorial action.' },
      { status: 500 }
    );
  }
}
