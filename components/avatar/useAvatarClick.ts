"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** What tapping a picture does: open that player's/team's page, blow the picture up, or nothing. */
export type AvatarAction = "navigate" | "zoom" | "none";

/**
 * Click handling shared by player avatars and team logos. Pictures often sit
 * inside a row that's already a link, so the click is stopped here and never
 * reaches it.
 */
export function useAvatarClick(action: AvatarAction, href: string) {
  const router = useRouter();
  const [zoomed, setZoomed] = useState(false);
  if (action === "none") return { zoomed: false, close: () => {}, props: {} };

  const activate = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === "zoom") setZoomed(true);
    else router.push(href);
  };
  return {
    zoomed,
    close: () => setZoomed(false),
    props: {
      role: action === "zoom" ? "button" : "link",
      tabIndex: 0,
      onClick: activate,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") activate(e);
      },
      className: "cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    },
  };
}
