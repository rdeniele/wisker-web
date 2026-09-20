import type { IconType } from "react-icons";
import {
  LuLayoutDashboard,
  LuLibrary,
  LuMessageCircleHeart,
  LuSparkles,
} from "react-icons/lu";
import { SHOW_SUBSCRIPTION_UI } from "@/lib/subscription-ui-visibility";

export interface NavItem {
  name: string;
  /** Short label for the bottom navigation. */
  short: string;
  href: string;
  icon: IconType;
  isActive: (pathname: string) => boolean;
}

const ALL_ITEMS: (NavItem & { subscriptionOnly?: boolean })[] = [
  {
    name: "Dashboard",
    short: "Home",
    href: "/dashboard",
    icon: LuLayoutDashboard,
    isActive: (p) => p === "/dashboard",
  },
  {
    name: "Subjects",
    short: "Subjects",
    href: "/subjects",
    icon: LuLibrary,
    isActive: (p) => p.startsWith("/subjects"),
  },
  {
    name: "Feedback",
    short: "Feedback",
    href: "/feedback",
    icon: LuMessageCircleHeart,
    isActive: (p) => p.startsWith("/feedback"),
  },
  {
    name: "Upgrade",
    short: "Upgrade",
    href: "/upgrade",
    icon: LuSparkles,
    subscriptionOnly: true,
    isActive: (p) => p.startsWith("/upgrade"),
  },
];

/** Primary destinations, with the Upgrade link hidden when subscriptions are off. */
export const NAV_ITEMS: NavItem[] = ALL_ITEMS.filter(
  (i) => SHOW_SUBSCRIPTION_UI || !i.subscriptionOnly,
);
