/**
 * JSON contract for a future vision-language slide critique.
 * The mock does not read the image or make an API request.
 */
export interface SlideCritique {
  /** Overall visual quality, from 0 (poor) to 100 (excellent). */
  score: number;
  /** Human-readable observations about the slide. */
  issues: string[];
  /** Actionable layout or styling changes addressing the issues. */
  fixes: string[];
}

/** Async boundary ready for a future VLM API implementation. */
export async function critiqueSlide(imagePath: string): Promise<SlideCritique> {
  // Retain the input contract until the image is passed to the real API.
  void imagePath;
  return {
    score: 82,
    issues: [
      "The caption has insufficient contrast against the background.",
      "The title and supporting copy are too close together.",
    ],
    fixes: [
      "Increase caption contrast with a stronger background wash.",
      "Increase the vertical gap between the title and supporting copy.",
    ],
  };
}
