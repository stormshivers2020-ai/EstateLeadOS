import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { cn } from "@/lib/utils/cn";
import { Sparkles } from "lucide-react";

interface NovaLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-8 w-8", iconInner: "h-4 w-4", title: "text-sm", sub: "text-[10px]" },
  md: { icon: "h-10 w-10", iconInner: "h-5 w-5", title: "text-base", sub: "text-xs" },
  lg: { icon: "h-12 w-12", iconInner: "h-6 w-6", title: "text-xl", sub: "text-sm" },
};

export function NovaLogo({ size = "md", showTagline = true, iconOnly = false, className }: NovaLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-[var(--nova-gold-muted)] bg-gradient-to-br from-[#1a1510] via-[#111318] to-[#0b0d10] shadow-[0_0_20px_rgba(214,168,79,0.12)]",
          s.icon
        )}
      >
        <Sparkles className={cn("text-[var(--nova-gold)]", s.iconInner)} />
      </div>
      {!iconOnly && (
        <div className="min-w-0">
          <p className={cn("font-bold tracking-tight text-[var(--nova-text-primary)]", s.title)}>{APP_NAME}</p>
          {showTagline && (
            <p className={cn("text-[var(--nova-text-muted)]", s.sub)}>
              Powered by <span className="text-[var(--nova-gold-soft)]">{POWERED_BY}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
