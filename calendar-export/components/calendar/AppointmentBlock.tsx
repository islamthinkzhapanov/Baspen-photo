"use client";

import { cn, formatCurrency } from "@/lib/utils";
import type { Appointment } from "@/hooks/useAppointments";

function KaspiIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 23 24" fill="#F14635" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.0373 12.8635C14.0956 13.1951 14.3739 14.4659 14.5402 15.6487L14.568 15.8504L14.5869 15.9877L14.6871 16.6838C14.8832 18.0128 15.2923 20.7716 15.2923 22.2112C15.2923 22.571 15.2619 22.8472 15.2065 22.9989C15.1142 23.2327 14.8451 23.4572 14.4735 23.6442C13.5744 23.8751 12.6346 24 11.6666 24C11.5641 24 11.4633 23.9948 11.3621 23.9917C10.9709 23.8757 10.6768 23.6821 10.5211 23.4176C10.0511 22.6192 10.0228 20.8402 10.0133 18.7614L10.0123 18.5203L10.0084 17.8972C9.99314 15.6964 9.97999 13.7989 10.7462 13.118C11.043 12.8561 11.4647 12.7694 12.0373 12.8635ZM7.54953 17.6549C7.99559 17.6287 8.28244 19.9181 8.34009 21.6541C8.38048 22.8627 8.25887 23.3599 8.06466 23.5384C7.8448 23.4618 7.62874 23.3789 7.41585 23.2889C7.27382 23.0196 7.16527 22.596 7.09631 22.0412C6.88575 20.2975 7.06865 17.6856 7.54953 17.6549ZM18.7322 21.0761C18.7044 21.2351 18.6651 21.3579 18.6168 21.4616C18.2354 21.7809 17.8346 22.0741 17.4151 22.3379C17.2815 22.3613 17.1628 22.345 17.1048 22.2427C16.5489 21.2234 16.3402 18.0256 16.8782 17.7473C17.5796 17.3938 18.8362 20.5232 18.7322 21.0761ZM11.5006 0C17.7635 0 22.8567 5.17546 22.9971 11.6155L23 11.8381V11.941C22.9885 14.85 21.9626 17.5114 20.2723 19.5714C20.211 19.5393 20.0992 19.4342 19.8966 19.118C19.6869 18.8 17.8788 15.8965 17.8788 12.5686C17.8788 11.9155 18.781 10.8953 19.5793 9.99975C20.1761 9.32588 20.7414 8.69025 20.9495 8.19068C21.2147 7.54605 21.0292 7.09594 20.7358 6.94337C20.4702 6.80777 20.0715 6.90668 19.7917 7.42523C19.3326 8.26447 19.1854 8.4213 18.5157 8.98283C17.8567 9.54405 16.809 10.109 16.809 9.3777C16.809 8.98283 17.3925 8.08853 17.6808 7.46168C17.9752 6.82783 17.6579 6.36897 17.05 6.36897C15.8562 6.36897 15.0638 7.95578 15.0638 8.50553C15.0638 9.05483 15.3192 9.13305 15.3192 9.77273C15.3192 10.4172 14.0094 11.2531 12.7756 11.2531C11.5877 11.2531 10.8988 11.0023 10.6134 10.2955L10.577 10.1963L10.4945 9.94155C10.2018 9.04897 9.99185 8.40165 9.62636 7.72515C9.4323 7.3674 9.13287 7.11939 8.8739 6.90117C8.53544 6.62684 8.35985 6.37426 8.3232 6.18588C8.28942 5.99899 8.27123 5.64678 8.84983 4.83487C9.4272 4.0276 9.50813 3.41775 9.21919 3.10307C9.11447 2.99113 8.93593 2.9194 8.70665 2.9194C8.30113 2.9194 7.73763 3.14362 7.15692 3.75949C6.2542 4.7247 6.76668 5.64112 6.76668 6.04341C6.76668 6.44544 6.6013 6.67285 6.05957 7.2198C5.51388 7.76918 5.32554 8.24017 5.26313 10.1332C5.23922 11.1085 5.0746 11.67 4.92682 12.1679C4.79913 12.6042 4.68169 13.0145 4.67535 13.6072C4.66523 14.264 4.77001 14.6873 4.89229 15.1757C5.01234 15.6272 5.13985 16.1444 5.22154 17.0097C5.35147 18.3491 5.3063 19.4806 5.07006 20.637L5.00701 20.9267L4.99228 21.01C4.9439 21.2132 4.88639 21.4601 4.80866 21.5525C1.89805 19.3953 0 15.8722 0 11.8898C0 5.32382 5.14876 0 11.5006 0Z" />
    </svg>
  );
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100",
  completed: "bg-green-50 border-green-300 text-green-900 hover:bg-green-100",
  no_show: "bg-red-50 border-red-300 text-red-900 hover:bg-red-100",
  awaiting_payment: "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100",
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-blue-400",
  completed: "bg-green-500",
  no_show: "bg-red-400",
  awaiting_payment: "bg-amber-400",
};

const STATUS_TAG: Record<string, { label: string; classes: string }> = {
  scheduled: { label: "Запланирована", classes: "bg-blue-100 text-blue-600" },
  completed:  { label: "Выполнено",    classes: "bg-green-100 text-green-700"   },
  no_show:    { label: "Не явился",    classes: "bg-red-100 text-red-600"       },
  awaiting_payment: { label: "Ждём предоплату", classes: "bg-amber-100 text-amber-700" },
};

interface AppointmentBlockProps {
  appointment: Appointment;
  top: number;
  height: number;
  /** Use compact rendering (smaller text, abbreviated services) for mobile */
  compact?: boolean;
  onClick: () => void;
  onDragStart?: (apptId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  /** Disable pointer events so drag events pass through to the parent column */
  suppressPointerEvents?: boolean;
}

export function AppointmentBlock({
  appointment,
  top,
  height,
  compact,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  suppressPointerEvents,
}: AppointmentBlockProps) {
  const { status, client, services, kaspiPending } = appointment;

  const isWaitingFinalPayment = status === "scheduled" && kaspiPending;
  const styleClasses = isWaitingFinalPayment
    ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
    : (STATUS_STYLES[status] ?? STATUS_STYLES.scheduled);
  const dotClass = isWaitingFinalPayment
    ? "bg-amber-400"
    : (STATUS_DOT[status] ?? STATUS_DOT.scheduled);
  const tag = isWaitingFinalPayment
    ? { label: "Ждём оплату", classes: "bg-amber-100 text-amber-700" }
    : STATUS_TAG[status];

  const clientName = client?.fullName ?? "Без клиента";

  // Compact service label: "Стрижка +2" or just "Стрижка"
  const compactServiceLabel = services.length > 1
    ? `${services[0].name} +${services.length - 1}`
    : services[0]?.name ?? "";
  const fullServiceNames = services.map((s) => s.name).join(", ");

  const isVeryCompact = height < 40;
  const isCompactBlock = height < 56;

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", appointment.id);
        onDragStart?.(appointment.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute left-0.5 right-0.5 border text-left transition-colors cursor-grab active:cursor-grabbing overflow-hidden z-10",
        compact ? "pl-[14px] pr-1 py-0.5" : "pl-[14px] pr-1.5 py-1",
        isDragging && "opacity-40",
        styleClasses
      )}
      style={{ top, height: Math.max(height, 24), borderRadius: 4, pointerEvents: suppressPointerEvents ? "none" : undefined }}
    >
      {isVeryCompact ? (
        /* Very small blocks: just dot + service name */
        <span className="flex items-center gap-1 truncate text-[10px] sm:text-xs font-medium leading-none">
          <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", dotClass)} />
                    <span className="truncate">{compact ? compactServiceLabel : fullServiceNames}</span>
        </span>
      ) : isCompactBlock ? (
        /* Compact blocks: dot + service + client on one line */
        <span className="flex items-center gap-1 truncate text-[10px] sm:text-xs font-medium leading-none">
          <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", dotClass)} />
                    <span className="truncate">{compact ? compactServiceLabel : fullServiceNames}</span>
        </span>
      ) : (
        /* Standard blocks: multi-line */
        <>
          <div className="flex items-center gap-1 mb-0.5">
            <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", dotClass)} />
                        <span className="text-[10px] sm:text-xs font-semibold leading-tight truncate flex-1 min-w-0">
              {compact ? compactServiceLabel : fullServiceNames}
            </span>
            {tag && (
              <span className={cn(
                "shrink-0 px-1.5 py-px rounded text-[9px] sm:text-[10px] font-medium leading-tight",
                tag.classes
              )}>
                {tag.label}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="text-[10px] sm:text-xs leading-tight opacity-75 truncate flex items-center gap-1">
              {kaspiPending && <KaspiIcon className="shrink-0" />}
              {clientName}
            </div>
            <div className="text-[10px] sm:text-xs leading-tight opacity-75 shrink-0 font-medium">
              {formatCurrency(Number(appointment.totalPrice))}
            </div>
          </div>
          {height >= 80 && !compact && (
            <div className="text-xs leading-tight opacity-60 mt-0.5">
              {appointment.startTime} – {appointment.endTime}
            </div>
          )}
          {height >= 80 && compact && (
            <div className="text-[10px] leading-tight opacity-60 mt-0.5 hidden sm:block">
              {appointment.startTime} – {appointment.endTime}
            </div>
          )}
        </>
      )}
    </button>
  );
}
