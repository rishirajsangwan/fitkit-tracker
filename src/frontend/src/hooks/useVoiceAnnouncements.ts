import { useEffect, useRef } from "react";

/**
 * Announces every completed kilometre via the Web Speech API.
 *
 * @param distanceKm  Current ride distance in kilometres.
 * @param isRiding    Whether a ride is currently active.
 * @param isPaused    Whether the active ride is paused.
 */
export function useVoiceAnnouncements(
  distanceKm: number,
  isRiding: boolean,
  isPaused: boolean,
) {
  const lastAnnouncedKmRef = useRef(0);

  useEffect(() => {
    // Gracefully handle browsers without speech synthesis support
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any pending speech when ride stops or pauses
    if (!isRiding || isPaused) {
      window.speechSynthesis.cancel();
      return;
    }

    const completedKm = Math.floor(distanceKm);

    // Only announce when we cross a new full kilometre threshold
    if (completedKm > 0 && completedKm > lastAnnouncedKmRef.current) {
      const utterance = new SpeechSynthesisUtterance(
        `${completedKm} kilometre${completedKm === 1 ? "" : "s"} completed`,
      );
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
      lastAnnouncedKmRef.current = completedKm;
    }
  }, [distanceKm, isRiding, isPaused]);

  // Reset the ref when a new ride starts (distance drops back near 0)
  useEffect(() => {
    if (!isRiding) {
      lastAnnouncedKmRef.current = 0;
    }
  }, [isRiding]);
}
