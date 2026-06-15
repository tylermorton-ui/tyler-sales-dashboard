import { format, isToday, isTomorrow } from 'date-fns';

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: number;
};

function dateLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE MMM d');
}

function timeStr(iso: string) {
  if (iso.length === 10) return 'All day';
  return format(new Date(iso), 'h:mm a');
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-[72px] shrink-0 text-right">
        <p className="text-xs font-medium text-gray-500">{dateLabel(event.start)}</p>
        <p className="text-xs text-gray-400">{timeStr(event.start)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{event.summary}</p>
        {event.attendees > 0 && (
          <p className="text-xs text-gray-400">
            {event.attendees} attendee{event.attendees !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

type Props = {
  past: CalendarEvent[];
  upcoming: CalendarEvent[];
};

export default function CalendarFeed({ past, upcoming }: Props) {
  return (
    <div className="space-y-4 overflow-y-auto max-h-[340px]">
      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            This Week
          </h3>
          {past.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Upcoming
          </h3>
          {upcoming.slice(0, 10).map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
      {!past.length && !upcoming.length && (
        <p className="text-sm text-gray-400 text-center py-8">No events found</p>
      )}
    </div>
  );
}
