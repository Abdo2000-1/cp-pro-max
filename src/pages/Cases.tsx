import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, LayoutGrid, List, FileText, ChevronRight, LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { timeAgo, formatCurrency } from '@/utils/format';
import { api } from '@/services/api';
import { useFetch } from '@/hooks/useFetch';
import { useTableState } from '@/hooks/useTableState';

import { useStore } from '@/hooks/useStore';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Closed', label: 'Closed' }
];

export default function Cases() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatedState, setSimulatedState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');
  
  const cases = useStore(s => s.getCases());
  const { currentPage, setCurrentPage } = useTableState();
  
  const filteredCases = cases.filter((c: any) => {
    const pName = c.patientName || c.patient?.name || '';
    const dName = c.doctorName || c.doctor?.name || '';
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedCases = filteredCases.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cases</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all {cases.length} cases
          </p>
        </div>
        <Button onClick={() => navigate('/orders/create')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput 
            value={searchTerm} 
            onChange={(val: any) => setSearchTerm(typeof val === 'string' ? val : val?.target?.value || '')} 
            placeholder="Search cases, patients, doctors..."
            className="max-w-md"
          />
          <Select 
            options={STATUS_OPTIONS} 
            value={statusFilter} 
            onChange={(val: any) => setStatusFilter(typeof val === 'string' ? val : val?.target?.value || '')} 
            className="w-40"
          />
        </div>
        
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-gray-50 dark:bg-gray-900 self-start sm:self-auto">
          <button 
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>


      {simulatedState === 'loading' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <LoadingState 
            text="Loading Clinical Cases Database..." 
            subtitle="Querying treatment plans, 3D anatomical charts, and doctor approvals"
          />
        </div>
      ) : simulatedState === 'error' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ErrorState
            title="Failed to Load Cases"
            message="Secure DICOM/Case Gateway encountered an unexpected socket termination (503)."
            code="ERR_CASES_SOCKET_DISCONNECT_503"
            onRetry={() => setSimulatedState('normal')}
          />
        </div>
      ) : simulatedState === 'empty' || filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <EmptyState 
            title="No Clinical Cases Found" 
            description="There are currently no active clinical cases matching your filter criteria."
            action={
              <Button 
                variant="primary" 
                onClick={() => { setSimulatedState('normal'); navigate('/orders/create'); }}
                className="cursor-pointer"
              >
                Create New Dental Case
              </Button>
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm text-gray-500 dark:text-gray-400 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Case #</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Patient / Doctor</th>
                  <th className="hidden md:table-cell px-4 py-3">Clinic</th>
                  <th className="hidden lg:table-cell px-4 py-3">Stats</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden sm:table-cell px-4 py-3">Priority</th>
                  <th className="hidden xl:table-cell px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCases.map((c: any) => (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">{c.title}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-[130px]">{c.patientName || c.patient?.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[130px]">{c.doctorName || c.doctor?.name}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-600 dark:text-gray-300">{c.clinicName || c.clinic?.name}</td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <div className="text-xs flex flex-col gap-1">
                        <span className="flex items-center gap-1"><LayoutTemplate className="w-3 h-3"/> {c.ordersCount || 0} Orders</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {c.filesCount || 0} Files</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="hidden sm:table-cell px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="hidden xl:table-cell px-4 py-3 whitespace-nowrap">{timeAgo(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCases.map((c: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{c.caseNumber}</span>
                <StatusBadge status={c.status} />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{c.title}</h3>
              
              <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Patient:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{c.patientName || c.patient?.name || 'Default Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Doctor:</span>
                  <span>{c.doctorName || c.doctor?.name || 'Dr. Allison Park'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clinic:</span>
                  <span>{c.clinicName || c.clinic?.name || 'Bright Smile Dental'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                <PriorityBadge priority={c.priority} />
                <span className="text-gray-400 flex items-center">
                  Updated {timeAgo(c.updatedAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredCases.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filteredCases.length / 10)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
