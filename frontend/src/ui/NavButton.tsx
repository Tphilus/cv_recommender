interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;     // sidebar is collapsed (icon-only mode)
  onClick?: () => void;
  title?: string;
}

export default function NavButton({ icon, label, active = false, collapsed = false, onClick, title }: NavButtonProps) {
  const base = [
    "flex items-center gap-3 rounded-full transition-all duration-200 cursor-pointer",
    collapsed ? "h-10 w-10 justify-center" : "w-full px-4 py-2.5",
  ].join(" ");

  const style = active
    ? `${base} bg-accent text-foreground font-medium`
    : `${base} text-muted-foreground hover:bg-accent/60 hover:text-foreground`;

  return (
    <button onClick={onClick} className={style} title={title ?? label}>
      <span className="flex-none">{icon}</span>
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}
