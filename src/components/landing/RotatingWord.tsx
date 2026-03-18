"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WORDS = ["Tara", "Let's Go", "Lakat Ta", "Auf geht's", "가자", "行こう"];
const TYPE_SPEED = 100; // ms per character typing
const DELETE_SPEED = 60; // ms per character deleting
const MIN_PAUSE = 2000; // minimum hold time for long words
const MAX_PAUSE = 3000; // hold time for short words (≤3 chars)
const PAUSE_AFTER_DELETE = 400; // ms pause before typing next word

/** Shorter words get more hold time so they don't flash by */
function getPause(word: string): number {
  if (word.length <= 3) return MAX_PAUSE;
  if (word.length <= 5) return 2500;
  return MIN_PAUSE;
}

export default function RotatingWord() {
  const [displayed, setDisplayed] = useState(WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const wordIndex = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const tick = useCallback(() => {
    const currentWord = WORDS[wordIndex.current];

    if (isDeleting) {
      // Deleting
      timeoutRef.current =
        displayed.length > 0
          ? setTimeout(() => {
              setDisplayed(displayed.slice(0, -1));
            }, DELETE_SPEED)
          : (() => {
              wordIndex.current = (wordIndex.current + 1) % WORDS.length;
              setIsDeleting(false);
              return setTimeout(() => {
                setDisplayed(WORDS[wordIndex.current].slice(0, 1));
              }, PAUSE_AFTER_DELETE);
            })();
    } else {
      // Typing forward
      timeoutRef.current =
        displayed.length < currentWord.length
          ? setTimeout(() => {
              setDisplayed(currentWord.slice(0, displayed.length + 1));
            }, TYPE_SPEED)
          : setTimeout(() => {
              setIsDeleting(true);
            }, getPause(currentWord));
    }
  }, [displayed, isDeleting]);

  useEffect(() => {
    tick();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick]);

  return (
    <span className="text-lime-500">
      {displayed}
      <span
        className="inline-block w-[3px] h-[0.75em] bg-lime-500 ml-0.5 align-baseline"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </span>
  );
}
