import { useState } from "react";
import { useStation, type EmailAlert } from "@/lib/station-context";
import { ChromeButton, GhostButton, Tag, Lamp } from "@/components/control";
import { Mail, AlertTriangle, CheckCircle2, X, Edit2 } from "lucide-react";

export function EmailInboxModal() {
  const {
    isInboxOpen,
    setIsInboxOpen,
    notifications,
    userProfile,
    updateUserEmail,
    markAsRead,
    rescheduleTask,
    unreadCount,
  } = useStation();

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(() =>
    notifications.length > 0 ? notifications[0].id : null,
  );

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(userProfile.email);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);

  if (!isInboxOpen) return null;

  const activeAlert = notifications.find((n) => n.id === selectedAlertId) || notifications[0];

  const handleSelectEmail = (alert: EmailAlert) => {
    setSelectedAlertId(alert.id);
    markAsRead(alert.id);
    setRescheduleSuccess(null);
  };

  const handleSaveEmail = () => {
    if (emailInput.trim()) {
      updateUserEmail(emailInput.trim());
      setIsEditingEmail(false);
    }
  };

  const handleConfirmReschedule = (taskId: string, slotId: string, slotLabel: string) => {
    rescheduleTask(taskId, slotId);

    setRescheduleSuccess(`Maintenance task rescheduled to ${slotLabel}. Master dispatch updated!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
      <div className="relative flex h-[96vh] w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-ink2 shadow-2xl sm:h-[90vh]">
        {/* Top Bar */}
        <div className="flex min-w-0 flex-col gap-3 border-b border-line bg-ink px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-signal/20 text-signal sm:size-9">
              <Mail className="size-4 sm:size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 break-words font-display text-sm font-semibold tracking-wide text-cream sm:text-base">
                  Section Engineer Official Dispatch Mailbox
                </span>

                {unreadCount > 0 ? <Tag tone="danger">{unreadCount} New</Tag> : null}
              </div>

              <div className="mt-1.5 flex min-w-0 flex-col gap-1 text-[11px] text-steel sm:flex-row sm:items-center sm:gap-2">
                <span className="shrink-0">Account:</span>

                {isEditingEmail ? (
                  <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="h-8 min-w-0 w-full rounded border border-line bg-ink px-2 text-xs text-cream outline-none focus:border-signal sm:w-64"
                    />

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={handleSaveEmail}
                        className="rounded bg-signal px-2.5 py-1.5 text-xs font-semibold text-ink"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setIsEditingEmail(false)}
                        className="rounded px-2.5 py-1.5 text-xs text-steel transition hover:bg-ink3 hover:text-cream"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 break-all text-signal">{userProfile.email}</span>

                    <button
                      onClick={() => {
                        setEmailInput(userProfile.email);
                        setIsEditingEmail(true);
                      }}
                      className="shrink-0 text-steel transition hover:text-cream"
                      title="Change user email"
                    >
                      <Edit2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsInboxOpen(false)}
            className="absolute right-2 top-2 rounded-lg p-2 text-steel transition hover:bg-ink3 hover:text-cream sm:static"
            aria-label="Close inbox"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mailbox Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
          {/* Email List */}
          <div className="min-h-0 min-w-0 overflow-y-auto border-b border-line bg-ink3/30 md:col-span-4 md:border-b-0 md:border-r">
            <div className="sticky top-0 z-10 border-b border-line/60 bg-ink3/95 p-3 backdrop-blur">
              <span className="label-mono">Incoming Railway AI Dispatches</span>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-steel">
                Inbox is clear. No alerts dispatched.
              </div>
            ) : (
              <div className="divide-y divide-line/40">
                {notifications.map((n) => {
                  const isSelected = n.id === activeAlert?.id;

                  const isDelay = n.type === "DELAY_DISRUPTION";

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleSelectEmail(n)}
                      className={`flex w-full min-w-0 flex-col gap-1.5 p-3 text-left transition sm:p-4 ${
                        isSelected ? "border-l-2 border-l-signal bg-signal/10" : "hover:bg-ink3/60"
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {!n.isRead ? (
                            <span className="size-2 shrink-0 animate-pulse rounded-full bg-signal" />
                          ) : null}

                          <span
                            className={`min-w-0 break-words text-[10px] font-semibold uppercase ${
                              isDelay ? "text-danger" : "text-clear"
                            }`}
                          >
                            {isDelay ? "URGENT ALERT" : "SYSTEM NOTICE"}
                          </span>
                        </div>

                        <span className="shrink-0 text-[10px] text-steel">{n.timestamp}</span>
                      </div>

                      <div className="line-clamp-2 break-words font-display text-sm font-medium leading-snug text-cream">
                        {n.subject}
                      </div>

                      <div className="line-clamp-1 break-words text-[11px] text-steel">
                        Task: {n.taskTitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Reading View */}
          <div className="min-h-0 min-w-0 overflow-y-auto bg-ink2 p-3 sm:p-5 md:col-span-8 md:p-6">
            {activeAlert ? (
              <div className="min-w-0 space-y-4 sm:space-y-6">
                {/* Email Header */}
                <div className="min-w-0 rounded-lg border border-line bg-ink p-3 sm:p-4">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words font-display text-base font-semibold uppercase leading-snug text-cream sm:text-lg">
                        {activeAlert.subject}
                      </h2>

                      <div className="mt-2 space-y-1 text-xs text-steel">
                        <div className="break-words">
                          <span className="text-steel/70">From:</span> {activeAlert.sender}
                        </div>

                        <div className="break-all">
                          <span className="text-steel/70">To:</span> {activeAlert.toEmail}
                        </div>

                        <div className="break-words">
                          <span className="text-steel/70">Time:</span> {activeAlert.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="self-start">
                      <Tag tone={activeAlert.type === "DELAY_DISRUPTION" ? "danger" : "clear"}>
                        {activeAlert.type === "DELAY_DISRUPTION"
                          ? "Action Required"
                          : "Informational"}
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Delay Disruption Body */}
                {activeAlert.type === "DELAY_DISRUPTION" ? (
                  <div className="min-w-0 space-y-4 sm:space-y-5">
                    {/* Conflict Explanation */}
                    <div className="min-w-0 rounded-lg border border-danger/40 bg-danger/10 p-3 sm:p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />

                        <div className="min-w-0 space-y-1.5">
                          <h3 className="break-words font-display text-sm font-semibold uppercase tracking-wide text-danger">
                            Live Train Delay Causing Block Collision
                          </h3>

                          <p className="break-words text-xs leading-relaxed text-cream/90">
                            Telemetry indicates that{" "}
                            <span className="font-semibold text-danger">
                              {activeAlert.conflictingTrain}
                            </span>{" "}
                            is currently running{" "}
                            <span className="font-bold text-danger underline">
                              +{activeAlert.delayMinutes} minutes late
                            </span>{" "}
                            due to upstream regulation. Its revised passage time overlaps with your
                            scheduled maintenance block window (
                            <span className="text-cream">{activeAlert.disruptedWindow}</span>
                            ).
                          </p>

                          <div className="break-words pt-1 text-[11px] leading-relaxed text-steel">
                            Operational Directive: The line cannot be closed at the original time
                            without detaining passenger express traffic. AI has recomputed
                            conflict-free alternate slots below.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reschedule Success */}
                    {rescheduleSuccess ? (
                      <div className="flex min-w-0 items-start gap-3 rounded-lg border border-clear/40 bg-clear/15 p-3 sm:p-4">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-clear" />

                        <span className="min-w-0 break-words text-xs font-semibold leading-relaxed text-clear">
                          {rescheduleSuccess}
                        </span>
                      </div>
                    ) : null}

                    {/* Alternative Timings */}
                    <div className="min-w-0 space-y-3">
                      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 break-words label-mono text-cream">
                          AI-Calculated Clean Alternative Timings:
                        </span>

                        <span className="shrink-0 text-[10px] text-steel">
                          Zero Passenger Conflicts
                        </span>
                      </div>

                      <div className="grid min-w-0 gap-3">
                        {activeAlert.alternativeSlots?.map((slot, idx) => (
                          <div
                            key={slot.slotId}
                            className="min-w-0 rounded-lg border border-line bg-ink p-3 transition hover:border-signal/70 sm:p-4"
                          >
                            <div className="flex min-w-0 flex-col gap-3">
                              <div className="min-w-0">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span className="min-w-0 break-words font-display text-base font-semibold text-cream">
                                    {slot.label}
                                  </span>

                                  <Tag tone={idx === 0 ? "clear" : "steel"}>
                                    {idx === 0 ? "AI Recommended" : "Backup Slot"}
                                  </Tag>
                                </div>

                                <p className="mt-1 break-words text-xs leading-relaxed text-steel">
                                  {slot.note}
                                </p>
                              </div>

                              <ChromeButton
                                onClick={() =>
                                  handleConfirmReschedule(
                                    activeAlert.taskId,
                                    slot.slotId,
                                    slot.label,
                                  )
                                }
                                className="w-full shrink-0 px-4 py-2 text-xs font-display uppercase tracking-wider sm:w-auto sm:self-start"
                              >
                                Select This Timing
                              </ChromeButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard / Confirmed Email Body */
                  <div className="min-w-0 space-y-4">
                    <div className="min-w-0 rounded-lg border border-clear/30 bg-clear/10 p-3 sm:p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-clear" />

                        <div className="min-w-0">
                          <div className="break-words font-display text-sm font-semibold uppercase text-clear">
                            {activeAlert.taskTitle}
                          </div>

                          <div className="mt-0.5 break-words text-xs leading-relaxed text-cream">
                            Confirmed Window: {activeAlert.resolvedWindow}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-2 rounded-lg border border-line bg-ink p-3 text-xs leading-relaxed text-steel sm:p-4">
                      <p>
                        The Indian Railways Autonomous Block Planner has registered and synchronized
                        this possession request across Engineering (P-Way), Signal &amp;
                        Telecommunication (S&amp;T), and TRD (OHE Electrical).
                      </p>

                      <p>Status: Integrated into Divisional Master Shadow Block Schedule.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center text-center text-xs text-steel">
                Select a message from the left to read.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
