'use client';
import TaskScopeNav from '@/components/tasks/TaskScopeNav';
import { TaskFilters } from '@/types/task';

interface DashboardScopeBarProps {
  filters: TaskFilters;
  onFiltersChange: (partial: Partial<TaskFilters>) => void;
  availableYears: number[];
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

export default function DashboardScopeBar({
  filters,
  onFiltersChange,
  availableYears,
  onRefresh,
  isRefreshing,
}: DashboardScopeBarProps) {
  return (
    <TaskScopeNav
      filters={filters}
      onFiltersChange={onFiltersChange}
      availableYears={availableYears}
      entityName="tasks"
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
