import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  Table as TableIcon,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { UIStateSwitcher, type UIStateType } from '@/components/ui/UIStateSwitcher';
import { Button } from '@/components/ui/Button';
import { timeAgo, formatCurrency, formatDate } from '@/utils/format';
import { useStore } from '@/hooks/useStore';
import { useTableState } from '@/hooks/useTableState';

export default function Orders() {
  const navigate = useNavigate();
  const orders = useStore((s) => s.getOrders());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [simulatedState, setSimulatedState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'Review', label: 'Review' },
    { value: 'Design', label: 'Design' },
    { value: 'Production', label: 'Production' },
    { value: 'Quality Check', label: 'Quality Check' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const {
    searchTerm,
    setSearchTerm,
    filterValue: statusFilter,
    setFilterValue: setStatusFilter,
    sortField,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    totalItems,
  } = useTableState({
    data: orders || [],
    searchFields: ['orderNumber', 'patientName', 'doctorName', 'clinicName'],
    itemsPerPage: 12,
    initialSortField: 'updatedAt',
    initialSortDirection: 'desc',
    filterField: 'status'
  });

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage dental restoration cases ({totalItems} total) • Zero horizontal scrolling
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon size={16} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button 
            onClick={() => navigate('/orders/create')} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="w-full sm:w-1/2">
          <SearchInput
            placeholder="Search by order #, patient, doctor, clinic..."
            value={searchTerm}
            onChange={(val: any) => setSearchTerm(typeof val === 'string' ? val : val?.target?.value || '')}
          />
        </div>
        <div className="w-full sm:w-1/3 sm:max-w-xs">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(typeof val === 'string' ? val : val?.target?.value || '')}
          />
        </div>
      </div>

      {/* State Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <UIStateSwitcher state={simulatedState} onChange={setSimulatedState} label="Simulate Orders View State" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          Use the buttons to preview <b>Loading</b>, <b>Empty</b>, or <b>Error</b> states in real-time
        </span>
      </div>

      {/* Conditional State Rendering */}
      {simulatedState === 'loading' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <LoadingState 
            text="Synchronizing Dental Lab Orders..." 
            subtitle="Fetching high-resolution STL files and milling queues from cloud PACS"
          />
        </div>
      ) : simulatedState === 'error' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ErrorState
            title="Failed to Load Dental Orders"
            message="Server timeout while querying order inventory from EU-Central PACS node (HTTP 503)."
            code="ERR_ORDERS_FETCH_TIMEOUT_503"
            onRetry={() => setSimulatedState('normal')}
          />
        </div>
      ) : simulatedState === 'empty' || paginatedData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <EmptyState 
            title="No Dental Orders Found" 
            description="There are currently no active or historical orders matching your filter criteria."
            suggestion="Try clearing your search filters or create a new dental order deliverable."
            action={
              <Button 
                variant="primary" 
                onClick={() => { setSimulatedState('normal'); navigate('/orders/create'); }}
                className="cursor-pointer"
              >
                Create New Dental Order
              </Button>
            }
          />
        </div>
      ) : viewMode === 'cards' ? (
        /* MODE 1: Responsive Card Grid (Zero Horizontal Scroll!) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((order: any) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                    {order.orderNumber}
                  </span>
                  <PriorityBadge priority={order.priority} />
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {order.patientName}
                </h3>
                
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {order.restoration || order.restorationType} • {order.arch} ({order.units || 1} unit)
                </p>

                <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <div className="truncate">{order.doctorName}</div>
                  <div className="truncate text-gray-500 dark:text-gray-400 font-medium">{order.clinicName}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Amount</div>
                  <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <div className="text-[10px] text-gray-400 mt-1">Due: {formatDate(order.dueDate)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE 2: Responsive Adaptive Table */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs text-left text-gray-500 dark:text-gray-400">
              <thead className="text-[11px] uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Doctor & Clinic</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Restoration</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Priority</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedData.map((order: any) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {order.patientName}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-gray-800 dark:text-gray-200">{order.doctorName?.replace('Dr. ', '')}</div>
                      <div className="text-[10px] text-gray-400">{order.clinicName}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {order.restoration || order.restorationType} ({order.units || 1}u)
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(order.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalItems > 12 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
          <span>
            Showing {Math.min((currentPage - 1) * 12 + 1, totalItems)} to {Math.min(currentPage * 12, totalItems)} of {totalItems} orders
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
