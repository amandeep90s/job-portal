import { SearchCodeIcon } from "lucide-react";

import { env } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Logo = ({ className, textClassName }: { className?: string; textClassName?: string }) => {
  return (
    <div className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
      <SearchCodeIcon className={cn("h-6 w-auto", className)} />
      <span className={cn("text-xl font-medium", textClassName)}>{env.APP_NAME}</span>
    </div>
  );
};

export const LogoIcon = ({ className }: { className?: string }) => {
  return <SearchCodeIcon className={cn("text-primary hover:text-primary/80 size-6 transition-colors", className)} />;
};
