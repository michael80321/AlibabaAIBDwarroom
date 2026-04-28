import { prisma } from '@/lib/prisma';
import OutreachReviewClient from './OutreachReviewClient';

export const dynamic = 'force-dynamic';

export default async function OutreachReviewPage() {
  const drafts = await prisma.outreachRecord.findMany({
    where: { status: { in: ['draft', 'approved'] } },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return <OutreachReviewClient drafts={drafts} />;
}
