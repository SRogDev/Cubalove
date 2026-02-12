"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  RotateCcw,
  CheckCircle,
  XCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import {
  suspendUser,
  blockUser,
  reactivateUser,
  getReportsForUser,
  updateReportStatus,
} from "../actions";
import { getAge } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/constants/subscription";
import type { UserProfile, ReportReason, ReportStatus } from "@/lib/types";

interface ReportItem {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
}

interface ModerationUserItemProps {
  user: UserProfile;
  reportCount: number;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  action_taken: "Acción tomada",
  dismissed: "Descartado",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "bg-warning/10 text-warning",
  reviewed: "bg-info/10 text-info",
  action_taken: "bg-success/10 text-success",
  dismissed: "bg-muted text-muted-foreground",
};

export const ModerationUserItem = ({
  user,
  reportCount,
}: ModerationUserItemProps) => {
  const [viewProfile, setViewProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(user.status);

  // Report details state
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const age = getAge(user.date_of_birth);

  const handleAction = async (
    action: "suspend" | "block" | "reactivate"
  ) => {
    setLoading(true);
    setActionMessage(null);

    let result;
    if (action === "suspend") {
      result = await suspendUser(user.user_id);
      if (result.success) setCurrentStatus("suspended");
    } else if (action === "block") {
      result = await blockUser(user.user_id);
      if (result.success) setCurrentStatus("blocked");
    } else {
      result = await reactivateUser(user.user_id);
      if (result.success) setCurrentStatus("active");
    }

    setActionMessage(result.message || result.error || null);
    setLoading(false);
  };

  const toggleReports = async () => {
    if (showReports) {
      setShowReports(false);
      return;
    }

    setReportsLoading(true);
    setShowReports(true);
    const result = await getReportsForUser(user.user_id);

    if (result.reports) {
      setReports(result.reports as ReportItem[]);
    }
    setReportsLoading(false);
  };

  const handleReportAction = async (
    reportId: string,
    status: "action_taken" | "dismissed"
  ) => {
    setUpdatingReportId(reportId);
    const result = await updateReportStatus(reportId, status);
    if (result.success) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    }
    setUpdatingReportId(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="flex items-center gap-3 p-4">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => setViewProfile(true)}
            className="relative shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 border-border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Ver perfil de ${user.display_name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.photos[0]?.url}
              alt={user.display_name}
              className="h-full w-full object-cover"
              width={48}
              height={48}
            />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm truncate">
                {user.display_name}, {age}
              </span>

              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  currentStatus === "active" && "bg-success/10 text-success",
                  currentStatus === "suspended" &&
                    "bg-warning/10 text-warning",
                  currentStatus === "blocked" &&
                    "bg-destructive/10 text-destructive"
                )}
              >
                {currentStatus === "active" && "Activo"}
                {currentStatus === "suspended" && "Suspendido"}
                {currentStatus === "blocked" && "Bloqueado"}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              {user.location && (
                <span className="text-xs text-muted-foreground truncate">
                  {user.location.city}
                </span>
              )}
              {reportCount > 0 && (
                <button
                  type="button"
                  onClick={toggleReports}
                  className="flex items-center gap-1 text-xs text-destructive font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={`Ver ${reportCount} reportes`}
                  aria-expanded={showReports}
                >
                  <AlertTriangle size={12} />
                  {reportCount} reportes
                  {showReports ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewProfile(true)}
              className="h-8 w-8 p-0 rounded-lg"
              aria-label="Ver perfil"
            >
              <Eye size={16} />
            </Button>

            {currentStatus === "active" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction("suspend")}
                  disabled={loading}
                  className="h-8 px-2 rounded-lg text-warning hover:text-warning hover:bg-warning/10 text-xs"
                  aria-label="Suspender 3 días"
                >
                  <Clock size={14} className="mr-1" />
                  3d
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction("block")}
                  disabled={loading}
                  className="h-8 px-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  aria-label="Bloquear permanente"
                >
                  <Ban size={14} className="mr-1" />
                  Ban
                </Button>
              </>
            )}

            {(currentStatus === "suspended" ||
              currentStatus === "blocked") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("reactivate")}
                disabled={loading}
                className="h-8 px-2 rounded-lg text-success hover:text-success hover:bg-success/10 text-xs"
                aria-label="Reactivar usuario"
              >
                <RotateCcw size={14} className="mr-1" />
                Reactivar
              </Button>
            )}
          </div>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <p className="text-xs text-muted-foreground px-4 pb-3 pl-[76px]">
            {actionMessage}
          </p>
        )}

        {/* Report details panel */}
        {showReports && (
          <div className="border-t border-border/50 px-4 py-3">
            {reportsLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Historial de reportes
                </h4>
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl bg-muted/40 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {REPORT_REASONS[report.reason] ?? report.reason}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              STATUS_COLORS[report.status]
                            )}
                          >
                            {STATUS_LABELS[report.status]}
                          </span>
                        </div>
                        {report.details && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {report.details}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Reportado por{" "}
                          <span className="font-medium">
                            {report.reporter_name}
                          </span>{" "}
                          &middot;{" "}
                          {new Date(report.created_at).toLocaleDateString(
                            "es",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      {/* Report actions */}
                      {report.status === "pending" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleReportAction(report.id, "action_taken")
                            }
                            disabled={updatingReportId === report.id}
                            className="h-7 w-7 p-0 rounded-md text-success hover:text-success hover:bg-success/10"
                            aria-label="Marcar acción tomada"
                          >
                            <CheckCircle size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleReportAction(report.id, "dismissed")
                            }
                            disabled={updatingReportId === report.id}
                            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label="Descartar reporte"
                          >
                            <XCircle size={14} />
                          </Button>
                        </div>
                      )}

                      {report.status !== "pending" && (
                        <FileCheck
                          size={14}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No se encontraron reportes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Profile modal */}
      {viewProfile && (
        <FullSwipeCard
          profile={user}
          open={viewProfile}
          onClose={() => setViewProfile(false)}
        />
      )}
    </>
  );
};
