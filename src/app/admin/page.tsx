import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentSession, canManageUsers, canReviewOtherAdmins } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Editorial Dashboard — D2J Media Hub',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/admin/login');
  }

  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash: _ph, ...u }) => u);
  const canSeeUsers =
    canManageUsers(session.role, session.permissions) ||
    canReviewOtherAdmins(session.role, session.permissions);

  return (
    <AdminDashboardClient
      session={session}
      initialArticles={db.articles}
      initialCategories={db.categories}
      initialAuthors={db.authors}
      initialOpportunities={db.opportunities}
      initialScholarQuestions={db.scholarQuestions}
      initialStorySubmissions={db.storySubmissions}
      initialContactSubmissions={db.contactSubmissions}
      initialMedia={db.media}
      initialUsers={canSeeUsers ? safeUsers : []}
      initialActivityLogs={
        canReviewOtherAdmins(session.role, session.permissions)
          ? db.activityLogs || []
          : (db.activityLogs || []).filter((l) => l.actorId === session.userId)
      }
      initialSettings={db.settings}
    />
  );
}
