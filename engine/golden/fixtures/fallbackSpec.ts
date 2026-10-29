/**
 * Test-only deterministic DeckSpec fixture.
 * NOT used by generateKitV1 — runtime requires an LLM.
 */
import { DeckSpec, DeckType } from "../../types";

export function fallbackSpec(prompt: string, deckType: DeckType): DeckSpec {
  const dark = /bold|dark|night|garage|racing/i.test(prompt);
  const warm = /clinic|dental|warm|care|human/i.test(prompt);
  const palette = dark ? "ink-night" : warm ? "ivory-warm" : "paper-blue";
  const typePair = dark ? "classic-georgia" : warm ? "editorial-cambria" : "tech-verdana";
  const sequences: Record<string, string[]> = {
    Pitch: ["cover", "problem", "solution", "how-it-works", "feature", "stats", "testimonial", "closing"],
    Overview: ["cover", "agenda", "feature", "how-it-works", "team", "stats", "closing"],
    Report: ["cover", "agenda", "problem", "stats", "solution", "feature", "closing"],
    Proposal: ["cover", "problem", "solution", "feature", "stats", "team", "closing"],
  };
  const roles = sequences[deckType] || sequences.Pitch;
  const topic = String(prompt || "Brand").slice(0, 40);
  return {
    style: {
      palette,
      typePair,
      imageTreatment: dark ? "duotone" : "full-bleed",
      motif: "bar-accent",
    },
    slides: roles.map((role) => {
      const slide: any = {
        role,
        title: role === "cover" ? topic.split(/\s+/).slice(0, 4).join(" ") : role.replace(/-/g, " "),
        body: ["Clear value", "Trusted delivery", "Measurable outcomes"].slice(0, role === "feature" ? 3 : 2),
      };
      if (role === "stats") {
        slide.stat = "98%";
        slide.caption = "client retention";
        slide.body = ["4.9", "120+"];
      }
      slide.photoQuery = topic + " " + role;
      slide.photoOrientation = role === "team" || role === "testimonial" ? "portrait" : "landscape";
      return slide;
    }),
  };
}

module.exports = { fallbackSpec };
