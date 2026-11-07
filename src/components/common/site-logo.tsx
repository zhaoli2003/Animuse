"use client";
import { routePath } from "@/lib/route-path";
import { publicPath } from "@/lib/site-url";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useContext, useLayoutEffect, useRef } from "react";

import { LogoTransitionContext } from "@/components/common/logo-transition-provider";
import { useHydratedTheme } from "@/hooks/use-hydrated-theme";
import { cn } from "@/lib/utils";

export function SiteLogo({ className, navigation = false, appearance }: {
  className?: string;
  navigation?: boolean;
  appearance?: "light" | "dark";
}) {
  const ref = useRef<HTMLImageElement>(null);
  const transition = useContext(LogoTransitionContext);
  const pathname = routePath(usePathname());
  const resolvedTheme = useHydratedTheme();
  const logoTheme = appearance ?? resolvedTheme;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!navigation || !el || !transition) return;
    return transition.register(el, pathname);
  }, [navigation, transition, pathname]);

  return (
    <Image
      ref={ref}
      src={publicPath(logoTheme === "dark" ? "/animuse-logo-dark.svg?v=glass-v1" : "/animuse-logo.svg?v=glass-v1")}
      alt="Animuse"
      width={832}
      height={160}
      priority
      data-site-logo={navigation ? "navigation" : undefined}
      className={cn("h-[25px] w-auto", className)}
    />
  );
}
