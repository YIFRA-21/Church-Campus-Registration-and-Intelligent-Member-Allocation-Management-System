import React from "react";
import { MemberStatus } from "../../types/member";

interface MemberStatusBadgeProps {
  status: MemberStatus;
  showIcon?: boolean;
}

export const MemberStatusBadge: React.FC<MemberStatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="cortex-badge cortex-badge--active">
          <span className="badge-radar-dot"></span>
          {showIcon && <i className="bi bi-check-circle-fill me-1"></i>}
          Active
        </span>
      );
    case "INACTIVE":
      return (
        <span className="cortex-badge cortex-badge--inactive">
          <span className="badge-radar-dot"></span>
          {showIcon && <i className="bi bi-clock-history me-1"></i>}
          Inactive
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="cortex-badge cortex-badge--suspended">
          <span className="badge-radar-dot"></span>
          {showIcon && <i className="bi bi-exclamation-triangle-fill me-1"></i>}
          Suspended
        </span>
      );
    case "ON_HOLD":
      return (
        <span className="cortex-badge cortex-badge--lead">
          <span className="badge-radar-dot"></span>
          {showIcon && <i className="bi bi-pause-circle-fill me-1"></i>}
          On Hold
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="cortex-badge cortex-badge--archived">
          <span className="badge-radar-dot"></span>
          {showIcon && <i className="bi bi-archive-fill me-1"></i>}
          Archived
        </span>
      );
    default:
      return <span className="badge bg-secondary">{status}</span>;
  }
};
