import { useMemo } from "react";
import { add, format, isSameDay, startOfWeek } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/i18n";
import type { CalendarEvent } from "@/lib/calendarEvents";

interface PaymentTimelineCardProps {
  title: string;
  events: CalendarEvent[];
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  labels: {
    previous: string;
    next: string;
    empty: string;
    paid: string;
    today: string;
    recurring: string;
  };
}

export const PaymentTimelineCard = ({
  title,
  events,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  labels,
}: PaymentTimelineCardProps) => {
  const today = new Date();

  const { weekStart, weekEnd, upcomingEvents } = useMemo(() => {
    const weekStart = add(startOfWeek(today, { weekStartsOn: 0 }), { weeks: weekOffset });
    const weekEnd = add(weekStart, { days: 6 });
    const upcomingEvents = events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= weekStart && eventDate <= weekEnd && e.type !== "variable";
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { weekStart, weekEnd, upcomingEvents };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, weekOffset]);

  return (
    <Card className="rounded-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevWeek}
            disabled={weekOffset === 0 && new Date().getDay() === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {labels.previous}
          </Button>
          <Button variant="outline" size="sm" onClick={onNextWeek}>
            {labels.next}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{labels.empty}</p>
        ) : (
          <>
            <div className="text-center pb-4">
              <h4 className="font-semibold text-sm text-muted-foreground">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </h4>
            </div>
            <div className="relative space-y-4">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted opacity-60" />
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, today);
                const isPaid = event.payment_status === "paid";

                return (
                  <div key={event.id} className="relative pl-8 opacity-100">
                    <div
                      className={`absolute left-[-10px] top-2 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center transition-all duration-300 ${event.type === "income" ? "bg-green-500" : event.type === "debt" ? "bg-red-500" : event.type === "fixed" ? "bg-orange-500" : "bg-blue-500"} ${isPaid ? "scale-110 shadow-lg" : isToday ? "ring-4 ring-primary ring-offset-2" : ""}`}
                    />
                    <div
                      className={`rounded-lg border p-3 transition-all hover:shadow-md w-full ${isPaid ? "border-green-500 bg-green-50/50" : isToday ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "bg-card"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{event.name}</span>
                            {isPaid && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                {labels.paid}
                              </Badge>
                            )}
                            {isToday && (
                              <Badge variant="secondary" className="text-xs">
                                {labels.today}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(eventDate, "EEE, MMM d")}</span>
                            <span>•</span>
                            <span className="capitalize">{event.type}</span>
                            {event.recurring && (
                              <>
                                <span>•</span>
                                <span className="italic">{labels.recurring}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div
                          className={`text-right font-semibold ${event.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {event.type === "income" ? "+" : "-"}
                          {formatCurrency(event.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
