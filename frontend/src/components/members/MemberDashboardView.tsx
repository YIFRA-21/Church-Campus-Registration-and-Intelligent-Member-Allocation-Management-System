import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Member, MemberDashboardSummary } from "../../types/member";

interface MemberDashboardViewProps {
  summary: MemberDashboardSummary | null;
  recentMembers: Member[];
  loading: boolean;
  onViewMember: (member: Member) => void;
  onOpenRegister: () => void;
}

// Sample Sparkline Wave Points
const SPARKLINE_DATA_1 = [{ v: 20 }, { v: 45 }, { v: 30 }, { v: 60 }, { v: 40 }, { v: 75 }, { v: 65 }, { v: 90 }];
const SPARKLINE_DATA_2 = [{ v: 15 }, { v: 35 }, { v: 25 }, { v: 50 }, { v: 45 }, { v: 70 }, { v: 60 }, { v: 85 }];
const SPARKLINE_DATA_3 = [{ v: 70 }, { v: 75 }, { v: 80 }, { v: 85 }, { v: 88 }, { v: 92 }, { v: 90 }, { v: 95 }];
const SPARKLINE_DATA_4 = [{ v: 10 }, { v: 25 }, { v: 40 }, { v: 35 }, { v: 55 }, { v: 65 }, { v: 70 }, { v: 80 }];

// Multi-layered Area Wave Registration Trend Data
const GROWTH_TREND_DATA = [
  { month: "Jan", newRegistrations: 45, activeFellowship: 120 },
  { month: "Feb", newRegistrations: 68, activeFellowship: 165 },
  { month: "Mar", newRegistrations: 92, activeFellowship: 230 },
  { month: "Apr", newRegistrations: 84, activeFellowship: 290 },
  { month: "May", newRegistrations: 115, activeFellowship: 375 },
  { month: "Jun", newRegistrations: 140, activeFellowship: 460 },
  { month: "Jul", newRegistrations: 165, activeFellowship: 540 },
  { month: "Aug", newRegistrations: 195, activeFellowship: 680 },
  { month: "Sep", newRegistrations: 230, activeFellowship: 810 },
];

const DONUT_COLORS = ["#8B5CF6", "#06B6D4", "#3B82F6", "#10B981", "#F59E0B"];

export const MemberDashboardView: React.FC<MemberDashboardViewProps> = ({
  summary,
  recentMembers,
  loading,
  onViewMember,
  onOpenRegister,
}) => {
  // Category Donut Data
  const donutData = useMemo(() => {
    if (!summary?.categoryDistribution) {
      return [
        { name: "Students", value: 65 },
        { name: "Youth", value: 20 },
        { name: "Servants", value: 10 },
        { name: "Others", value: 5 },
      ];
    }
    return Object.entries(summary.categoryDistribution).map(([name, value]) => ({
      name,
      value: value || 1,
    }));
  }, [summary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-fluid px-0"
    >
      {/* =========================================================================
          1. TOP SUMMARY KPI CARDS (Matching Reference Image Top Row)
         ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Registered Members */}
        <div className="col-12 col-sm-6 col-xl-3">
          <motion.div whileHover={{ y: -4 }} className="cortex-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Members</span>
              <i className="bi bi-people-fill kpi-icon"></i>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value">{loading ? "..." : summary?.totalMembers ?? 0}</span>
              <span className="kpi-trend-pill">
                <i className="bi bi-arrow-up-short"></i>+12.4%
              </span>
            </div>
            <div className="kpi-sparkline-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA_1}>
                  <defs>
                    <linearGradient id="spark1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#spark1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Card 2: Active Fellowship */}
        <div className="col-12 col-sm-6 col-xl-3">
          <motion.div whileHover={{ y: -4 }} className="cortex-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Active Fellowship</span>
              <i className="bi bi-check-circle-fill kpi-icon text-success"></i>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-success">{loading ? "..." : summary?.activeMembers ?? 0}</span>
              <span className="kpi-trend-pill">
                <i className="bi bi-arrow-up-short"></i>+8.1%
              </span>
            </div>
            <div className="kpi-sparkline-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA_2}>
                  <defs>
                    <linearGradient id="spark2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#spark2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Card 3: Data Quality & Completeness */}
        <div className="col-12 col-sm-6 col-xl-3">
          <motion.div whileHover={{ y: -4 }} className="cortex-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Profile Quality</span>
              <i className="bi bi-shield-check kpi-icon text-info"></i>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-info">{loading ? "..." : `${summary?.completenessRate ?? 95}%`}</span>
              <span className="kpi-trend-pill trend-neutral">on track</span>
            </div>
            <div className="kpi-sparkline-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA_3}>
                  <defs>
                    <linearGradient id="spark3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fill="url(#spark3)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Card 4: Campus Students */}
        <div className="col-12 col-sm-6 col-xl-3">
          <motion.div whileHover={{ y: -4 }} className="cortex-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Campus Students</span>
              <i className="bi bi-mortarboard-fill kpi-icon text-purple"></i>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-purple">{loading ? "..." : summary?.categoryDistribution?.STUDENT ?? 0}</span>
              <span className="kpi-trend-pill">
                <i className="bi bi-arrow-up-short"></i>+5.7%
              </span>
            </div>
            <div className="kpi-sparkline-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA_4}>
                  <defs>
                    <linearGradient id="spark4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#spark4)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      {/* =========================================================================
          2. MIDDLE SECTION: ANALYTICS + CRM SIDEBAR + UPCOMING TASKS (CORTEX GRID)
         ========================================================================= */}
      <div className="row g-3">
        {/* Left Column (col-12 col-xl-5): Analytics Section (Area Chart + Donut) */}
        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column gap-3">
            {/* Area Chart: Monthly Member Growth */}
            <div className="cortex-card">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  <i className="bi bi-activity"></i> Member Growth Curve
                </h3>
                <span className="card-subtitle">Monthly Registration Dynamics</span>
              </div>
              <div style={{ height: "190px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={GROWTH_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="waveBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="waveViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1220",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="natural"
                      dataKey="activeFellowship"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      fill="url(#waveViolet)"
                    />
                    <Area
                      type="natural"
                      dataKey="newRegistrations"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fill="url(#waveBlue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Demographic Breakdown */}
            <div className="cortex-card">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  <i className="bi bi-pie-chart-fill"></i> Fellowship Breakdown
                </h3>
                <span className="card-subtitle">Category Distribution</span>
              </div>
              <div className="d-flex align-items-center justify-content-center" style={{ height: "160px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1220",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column (col-12 col-xl-4): CRM Sidebar (Key Accounts + Pipeline Stages) */}
        <div className="col-12 col-xl-4">
          <div className="d-flex flex-column gap-3">
            {/* Key Accounts / Fellowship Leaders */}
            <div className="cortex-card">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  <i className="bi bi-person-badge-fill"></i> Key Fellowship Leaders
                </h3>
                <span className="card-subtitle">Active Representatives</span>
              </div>
              <div className="cortex-crm-list">
                {recentMembers.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="crm-account-item cursor-pointer"
                    onClick={() => onViewMember(m)}
                  >
                    <div className="account-info">
                      <div className="account-avatar">
                        {m.firstName.charAt(0)}
                        {m.lastName.charAt(0)}
                      </div>
                      <div className="account-details">
                        <div className="account-name">{m.fullName}</div>
                        <div className="account-sub">
                          {m.academicDepartment || "Campus Fellowship"} · {m.memberId}
                        </div>
                      </div>
                    </div>
                    <span className={`cortex-badge ${m.status === "ACTIVE" ? "cortex-badge--active" : "cortex-badge--lead"}`}>
                      <span className="badge-radar-dot"></span>
                      {m.spiritualStatus === "DEACON" ? "Deacon" : m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ministry Pipeline Stages */}
            <div className="cortex-card">
              <div className="card-title-wrap">
                <h3 className="card-title">
                  <i className="bi bi-diagram-3-fill"></i> Ministry Stages
                </h3>
                <span className="card-subtitle">Fellowship Engagement</span>
              </div>
              <div className="cortex-pipeline">
                <div className="pipeline-stage-item">
                  <div className="stage-header">
                    <span className="stage-name">Choir & Liturgical Hymns</span>
                    <span className="stage-count">38% (380)</span>
                  </div>
                  <div className="stage-bar-bg">
                    <div className="stage-bar-fill stage-bar-fill--blue" style={{ width: "38%" }}></div>
                  </div>
                </div>

                <div className="pipeline-stage-item">
                  <div className="stage-header">
                    <span className="stage-name">Sunday School Instruction</span>
                    <span className="stage-count">28% (280)</span>
                  </div>
                  <div className="stage-bar-bg">
                    <div className="stage-bar-fill stage-bar-fill--violet" style={{ width: "28%" }}></div>
                  </div>
                </div>

                <div className="pipeline-stage-item">
                  <div className="stage-header">
                    <span className="stage-name">Charity, Relief & Welfare</span>
                    <span className="stage-count">20% (200)</span>
                  </div>
                  <div className="stage-bar-bg">
                    <div className="stage-bar-fill stage-bar-fill--cyan" style={{ width: "20%" }}></div>
                  </div>
                </div>

                <div className="pipeline-stage-item">
                  <div className="stage-header">
                    <span className="stage-name">Theological Study & Research</span>
                    <span className="stage-count">14% (140)</span>
                  </div>
                  <div className="stage-bar-bg">
                    <div className="stage-bar-fill stage-bar-fill--emerald" style={{ width: "14%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (col-12 col-xl-3): Action Tasks & Verification Log */}
        <div className="col-12 col-xl-3">
          <div className="cortex-card h-100">
            <div className="card-title-wrap">
              <h3 className="card-title">
                <i className="bi bi-calendar-check"></i> Operational Tasks
              </h3>
              <span className="card-subtitle">4 Pending</span>
            </div>

            <div className="cortex-tasks-list">
              <div className="task-item">
                <i className="bi bi-check-square-fill task-check"></i>
                <div className="task-content">
                  <div className="task-title">Review Staged Import Batch</div>
                  <div className="task-meta">
                    <span className="meta-date">
                      <i className="bi bi-calendar3"></i> Today
                    </span>
                    <span className="meta-priority">High Priority</span>
                  </div>
                </div>
              </div>

              <div className="task-item">
                <i className="bi bi-square task-check text-muted"></i>
                <div className="task-content">
                  <div className="task-title">Verify Baptismal Credentials</div>
                  <div className="task-meta">
                    <span className="meta-date">
                      <i className="bi bi-calendar3"></i> Tomorrow
                    </span>
                    <span className="text-secondary">Medium</span>
                  </div>
                </div>
              </div>

              <div className="task-item">
                <i className="bi bi-square task-check text-muted"></i>
                <div className="task-content">
                  <div className="task-title">Sync Academic Department Quotas</div>
                  <div className="task-meta">
                    <span className="meta-date">
                      <i className="bi bi-calendar3"></i> Sep 24
                    </span>
                    <span className="text-secondary">Review</span>
                  </div>
                </div>
              </div>

              <div className="task-item">
                <i className="bi bi-square task-check text-muted"></i>
                <div className="task-content">
                  <div className="task-title">Module 7 Allocation Readiness Check</div>
                  <div className="task-meta">
                    <span className="meta-date">
                      <i className="bi bi-calendar3"></i> Sep 28
                    </span>
                    <span className="meta-priority">Critical</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
              <button
                onClick={onOpenRegister}
                className="cortex-btn cortex-btn--primary w-100"
              >
                <i className="bi bi-person-plus-fill"></i> Register New Member
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
