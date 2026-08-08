import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the 4 key metric cards + the compact status strip. */
export const SummaryCardsSkeleton = () => (
  <div className="space-y-6" aria-busy="true">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  </div>
);

/** Skeleton for the donut chart section. */
export const ChartCardSkeleton = () => (
  <Card aria-busy="true">
    <CardHeader className="space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56" />
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center">
          <Skeleton className="h-56 w-56 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

/** Skeleton for list/timeline style cards. */
export const ListCardSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <Card aria-busy="true">
    <CardHeader>
      <Skeleton className="h-5 w-48" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </CardContent>
  </Card>
);
