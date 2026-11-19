import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SecondaryButton } from "./Buttons";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="cimas-pagination">
      <div className="text-xs text-slate-400">
        Showing <span className="font-semibold text-white">{startItem}</span> to{" "}
        <span className="font-semibold text-white">{endItem}</span> of{" "}
        <span className="font-semibold text-white">{totalItems}</span> results
      </div>

      <div className="cimas-pagination__controls">
        <SecondaryButton
          size="sm"
          icon={ChevronLeft}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </SecondaryButton>

        <span className="text-xs font-semibold px-2 text-slate-300">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <SecondaryButton
          size="sm"
          icon={ChevronRight}
          iconPosition="right"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </SecondaryButton>
      </div>
    </div>
  );
};
