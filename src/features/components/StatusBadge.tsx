import { STATUS_META } from "@/lib/transaction/helpers";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    colour: "text-stone-500",
    bg: "bg-stone-100",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.colour}`}
    >
      {meta.label}
    </span>
  );
}
