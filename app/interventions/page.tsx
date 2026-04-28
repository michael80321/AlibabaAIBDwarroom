import { prisma } from '@/lib/prisma';
import InterventionsClient from './InterventionsClient';

export const dynamic = 'force-dynamic';

export default async function InterventionsPage() {
  const [pending, resolved] = await Promise.all([
    prisma.interventionItem.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'desc' },
    }),
    prisma.interventionItem.findMany({
      where: { status: { not: 'pending' } },
      orderBy: { resolved_at: 'desc' },
      take: 20,
    }),
  ]);

  return <InterventionsClient pending={pending} resolved={resolved} />;
}
