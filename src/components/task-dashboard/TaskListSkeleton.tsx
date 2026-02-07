import { Skeleton } from '@/components/ui/skeleton';

interface TaskListSkeletonProps {
  count?: number;
}

export const TaskListSkeleton = ({ count = 5 }: TaskListSkeletonProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="h-5 w-5 rounded mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
