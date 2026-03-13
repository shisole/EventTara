/**
 * Centralized confetti utility with lazy loading.
 *
 * Presets:
 *  - "burst"        — single upward burst (bookings, auth success)
 *  - "celebration"  — burst + side cannons for 2.5s (claims, welcome)
 *  - "token"        — gold-themed burst for token rewards
 */

type ConfettiPreset = "burst" | "celebration" | "token";

const COLORS_DEFAULT = ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"];
const COLORS_TOKEN = ["#F59E0B", "#FBBF24", "#D97706", "#FDE68A", "#a3e635"];

async function getConfetti() {
  const mod = await import("canvas-confetti");
  return mod.default;
}

export async function fireConfetti(preset: ConfettiPreset = "burst") {
  const confetti = await getConfetti();

  if (preset === "burst") {
    void confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: COLORS_DEFAULT,
    });
    return;
  }

  if (preset === "token") {
    void confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: COLORS_TOKEN,
    });

    const end = Date.now() + 1500;
    const frame = () => {
      void confetti({
        particleCount: 2,
        angle: 60,
        spread: 45,
        origin: { x: 0, y: 0.5 },
        colors: COLORS_TOKEN,
      });
      void confetti({
        particleCount: 2,
        angle: 120,
        spread: 45,
        origin: { x: 1, y: 0.5 },
        colors: COLORS_TOKEN,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return;
  }

  // "celebration" preset
  void confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.6 },
    colors: COLORS_DEFAULT,
  });

  const end = Date.now() + 2500;
  const frame = () => {
    void confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: COLORS_DEFAULT,
    });
    void confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: COLORS_DEFAULT,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
