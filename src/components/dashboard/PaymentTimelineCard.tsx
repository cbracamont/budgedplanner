import { useMemo } from "react";
import { add, format, isSameDay, startOfWeek } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="text-subtitle flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="transition-transform active:scale-95"
            onClick={onPrevWeek}
            disabled={weekOffset === 0 && new Date().getDay() === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            {labels.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="transition-transform active:scale-95"
            onClick={onNextWeek}
          >
            {labels.next}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <p className="text-body text-center text-muted-foreground py-8">{labels.empty}</p>
        ) : (
          <>
            <div className="text-center pb-2">
              <h4 className="text-label text-muted-foreground">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </h4>
            </div>
            <div className="relative space-y-3">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, today);
                const isPaid = event.payment_status === "paid";
                const isIncome = event.type === "income";
                const DirectionIcon = isIncome ? ArrowUpRight : ArrowDownRight;

                return (
                  <div key={event.id} className="relative pl-8">
                    <div
                      className={`absolute left-[-10px] top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${isIncome ? "bg-success" : "bg-destructive"} ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                      aria-hidden="true"
                    />
                    <div
                      className={`rounded-lg border p-3 transition-shadow duration-200 hover:shadow-soft w-full ${isToday ? "border-primary bg-primary/5" : "bg-card"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-body font-medium">{event.name}</span>
                            {isPaid && (
                              <Badge variant="outline" className="text-xs gap-1 border-success text-success">
                                <Check className="h-3 w-3" aria-hidden="true" />
                                {labels.paid}
                              </Badge>
                            )}
                            {isToday && (
                              <Badge variant="secondary" className="text-xs">
                                {labels.today}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                            <span>{format(eventDate, "EEE, MMM d")}</span>
                            <span aria-hidden="true">•</span>
                            <span className="capitalize">{event.type}</span>
                            {event.recurring && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span>{labels.recurring}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-right font-semibold tabular-nums ${isIncome ? "text-success" : "text-destructive"}`}
                        >
                          <DirectionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {isIncome ? "+" : "-"}
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
