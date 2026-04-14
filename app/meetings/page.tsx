export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import MeetingNoteForm from '@/components/MeetingNoteForm';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

async function getMeetingsData() {
  const [customers, meetings] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, company_name: true },
      where: { priority_label: { not: 'Dead' } },
      orderBy: { priority_score: 'desc' },
    }),
    prisma.meetingNote.findMany({
      include: {
        customer: { select: { id: true, company_name: true } },
      },
      orderBy: { meeting_date: 'desc' },
      take: 20,
    }),
  ]);

  // Group meetings by customer
  const grouped = meetings.reduce(
    (acc, m) => {
      const key = m.customer.id;
      if (!acc[key]) acc[key] = { customer: m.customer, notes: [] };
      acc[key].notes.push(m);
      return acc;
    },
    {} as Record<string, { customer: { id: string; company_name: string }; notes: typeof meetings }>
  );

  return { customers, grouped };
}

export default async function MeetingsPage() {
  const { customers, grouped } = await getMeetingsData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">📝 會議記錄 AI 整理</h1>
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2">
          <p className="text-amber-300 text-sm">
            每次會議後立即貼上記錄，AI 會提取痛點、決策人、下一步，並生成更新後的話術
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">輸入會議記錄</h2>
          <MeetingNoteForm customers={customers} />
        </div>

        {/* History */}
        <div className="col-span-2">
          <h2 className="text-white font-bold text-lg mb-4">歷史記錄</h2>
          <div className="space-y-4">
            {Object.values(grouped).map(({ customer, notes }) => (
              <div key={customer.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-3">{customer.company_name}</p>
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-2 border-gray-700 pl-3">
                      <p className="text-gray-500 text-xs">
                        {format(new Date(note.meeting_date), 'yyyy/MM/dd', { locale: zhTW })}
                      </p>
                      {note.summary && (
                        <p className="text-gray-300 text-xs line-clamp-2 mt-0.5">
                          {note.summary.split('\n')[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">
                還沒有會議記錄
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
