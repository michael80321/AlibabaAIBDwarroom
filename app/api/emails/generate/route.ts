export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOutreachEmail, type EmailScenario } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { customerIds, scenario, incidentVendor } = await req.json() as {
      customerIds: string[];
      scenario: EmailScenario;
      incidentVendor?: string;
    };

    if (!customerIds?.length) {
      return NextResponse.json({ error: 'No customers selected' }, { status: 400 });
    }
    if (customerIds.length > 5) {
      return NextResponse.json({ error: 'Max 5 customers at once' }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: {
        contacts: {
          where: { influence: { in: ['decision_maker', 'champion'] } },
          take: 1,
          orderBy: { influence: 'asc' },
        },
      },
    });

    // Generate emails in parallel
    const results = await Promise.all(
      customers.map(async (customer) => {
        const primaryContact = customer.contacts[0] || null;
        const result = await generateOutreachEmail(
          customer,
          {
            name: primaryContact?.name,
            title: primaryContact?.title ?? undefined,
            email: primaryContact?.email ?? undefined,
          },
          scenario,
          incidentVendor
        );
        return {
          customerId: customer.id,
          companyName: customer.company_name,
          contact: primaryContact
            ? {
                name: primaryContact.name,
                title: primaryContact.title,
                email: primaryContact.email,
              }
            : null,
          email: result,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
