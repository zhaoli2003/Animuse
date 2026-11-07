"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useContext, useLayoutEffect, useRef } from "react";

import { LogoTransitionContext } from "@/components/common/logo-transition-provider";
import { cn } from "@/lib/utils";

export function SiteLogo({ className, navigation = false }: { className?: string; navigation?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const transition = useContext(LogoTransitionContext);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!navigation || !el || !transition) return;
    return transition.register(el, pathname);
  }, [navigation, transition, pathname]);

  return (
    <Image
      ref={ref}
      src="/animuse-logo.svg"
      alt="Animuse"
      width={640}
      height={160}
      priority
      data-site-logo={navigation ? "navigation" : undefined}
      className={cn("h-[25px] w-auto invert dark:invert-0", className)}
    />
  );
}
