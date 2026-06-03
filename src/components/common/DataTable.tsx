import React, { ReactNode, useState } from 'react';
import { EmptyState } from './EmptyState';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  headers: string[];
  items: T[];
  renderRow: (item: T, index: number) => ReactNode;
  renderMobileCard?: (item: T, index: number) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}

export function DataTable<T>({
  headers,
  items,
  renderRow,
  renderMobileCard,
  emptyTitle = 'No hay información disponible',
  emptyDescription = 'Cree una nueva entrada para empezar a recopilar estadísticas.',
  pageSize = 5,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  // Frontend Pagination Simulation
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Table for Desktop / Large views */}
      <div className="hidden md:block w-full overflow-hidden bg-surface-lowest border border-[#EEFFCD] rounded-xl shadow-[0px_4px_20px_rgba(30,41,59,0.05)]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#E8F7DA] border-b border-outline-variant">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-xs font-bold text-on-secondary-container uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {paginatedItems.map((item, index) => renderRow(item, startIndex + index))}
          </tbody>
        </table>
      </div>

      {/* Card stack layout for Mobile / touch-first screens */}
      {renderMobileCard && (
        <div className="md:hidden space-y-4">
          {paginatedItems.map((item, index) => renderMobileCard(item, startIndex + index))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-surface-lowest px-6 py-4 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)]">
          <span className="text-sm font-semibold text-on-surface-variant">
            Página <strong className="text-on-surface">{currentPage}</strong> de{' '}
            <strong className="text-on-surface">{totalPages}</strong> ({items.length} elementos)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
