import React from "react";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatusTimelineProps {
  createdAt: string | Date;
  claimedAt?: string | Date;
  pickedUpAt?: string | Date;
  completedAt?: string | Date;
  expiredAt?: string | Date;
  currentStatus: "available" | "claimed" | "completed" | "expired";
}

const steps = [
  { key: "posted", label: "Posted" },
  { key: "claimed", label: "Claimed" },
  { key: "pickedUp", label: "Picked Up" },
  { key: "completed", label: "Completed" },
  { key: "expired", label: "Expired" },
];

function formatDate(date?: string | Date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  createdAt,
  claimedAt,
  pickedUpAt,
  completedAt,
  expiredAt,
  currentStatus,
}) => {
  // Determine which steps are complete/active
  const statusOrder = ["available", "claimed", "completed", "expired"];
  const currentIdx = statusOrder.indexOf(currentStatus);

  const timeline = [
    { label: "Posted", date: createdAt, done: true, active: currentIdx === 0 },
    { label: "Claimed", date: claimedAt, done: currentIdx >= 1, active: currentIdx === 1 },
    { label: "Picked Up", date: pickedUpAt || completedAt, done: currentIdx >= 2, active: currentIdx === 2 },
    { label: "Completed", date: completedAt, done: currentIdx === 2 || currentIdx === 3, active: currentIdx === 3 },
    { label: "Expired", date: expiredAt, done: currentStatus === "expired", active: currentStatus === "expired" },
  ];

  return (
    <div className="flex flex-row items-center gap-4 w-full my-4">
      {timeline.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${
              step.done ? (step.active ? "border-blue-500 bg-blue-100" : "border-green-500 bg-green-100") : "border-gray-300 bg-white"
            }`}>
              {step.done ? (
                step.active ? <Clock className="text-blue-500 w-5 h-5" /> : <CheckCircle className="text-green-500 w-5 h-5" />
              ) : (
                <AlertTriangle className="text-gray-300 w-5 h-5" />
              )}
            </div>
            <span className={`text-xs mt-1 ${step.active ? "text-blue-600 font-semibold" : "text-gray-600"}`}>{step.label}</span>
            {step.date && <span className="text-[10px] text-gray-400">{formatDate(step.date)}</span>}
          </div>
          {idx < timeline.length - 1 && (
            <div className={`flex-1 h-1 ${timeline[idx + 1].done ? "bg-green-400" : "bg-gray-200"}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}; 