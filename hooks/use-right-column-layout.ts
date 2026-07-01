"use client";

import { useEffect, useState, type RefObject } from "react";

const LARGE_SCREEN_QUERY = "(min-width: 1024px)";
const RIGHT_COLUMN_CHROME_PX = 80;

export function useRightColumnLayout(
  leftColumnRef: RefObject<HTMLElement | null>,
  isActive: boolean
) {
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | undefined>();

  useEffect(() => {
    const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    const updateScreenSize = () => {
      setIsLargeScreen(mediaQuery.matches);
    };

    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);

    return () => {
      mediaQuery.removeEventListener("change", updateScreenSize);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const updateHeight = () => {
      if (leftColumnRef.current) {
        setLeftColumnHeight(leftColumnRef.current.offsetHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const resizeObserver = new ResizeObserver(updateHeight);
    if (leftColumnRef.current) {
      resizeObserver.observe(leftColumnRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, [leftColumnRef, isActive]);

  const rightColumnHeight =
    isLargeScreen && leftColumnHeight ? leftColumnHeight : undefined;

  const hourlyMaxHeight =
    rightColumnHeight !== undefined
      ? rightColumnHeight - RIGHT_COLUMN_CHROME_PX
      : undefined;

  return {
    isLargeScreen,
    rightColumnHeight,
    hourlyMaxHeight,
  };
}
