/**
 * Each idea decides the cover, the colors, the fonts, and the sample title.
 * Photos are from Unsplash, which this project already uses. We do not
 * pull images from random websites.
 */

const IDEAS = [
  {
    id: "nature",
    name: "Nature",
    title: "Nature",
    subtitle: "A quiet study of the land",
    cover: "photo",
    photo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
    fonts: { display: "Libre Baskerville", text: "Source Sans 3" },
    palette: {
      name: "Nature",
      bg: "#F3F6F1",
      surface: "#E4EBDF",
      card: "#FFFFFF",
      ink: "#142116",
      muted: "#4E5C50",
      rule: "#C9D4C6",
      accent: "#1F6B3A",
      accent2: "#8C5A2B",
      onAccent: "#F4F1EA",
    },
  },
  {
    id: "website",
    name: "Website",
    title: "Ecosystems",
    subtitle: "The web of the product",
    cover: "browser",
    photo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    fonts: { display: "Outfit", text: "Figtree" },
    palette: {
      name: "Website",
      bg: "#F4F7F8",
      surface: "#E6EEEF",
      card: "#FFFFFF",
      ink: "#122026",
      muted: "#4C626A",
      rule: "#D0DEE2",
      accent: "#0E4D6C",
      accent2: "#C46B2F",
      onAccent: "#F4F7F8",
    },
  },
  {
    id: "pitch",
    name: "Pitch",
    title: "PITCH",
    subtitle: "A case for the work",
    cover: "type",
    photo: "",
    fonts: { display: "Familjen Grotesk", text: "Outfit" },
    palette: {
      name: "Pitch",
      bg: "#7A1020",
      surface: "#8E1A2C",
      card: "#9A2436",
      ink: "#FFF6F4",
      muted: "#F0C9C4",
      rule: "#C45A68",
      accent: "#F4F1EA",
      accent2: "#E2B15A",
      onAccent: "#7A1020",
    },
  },
];

module.exports = { IDEAS };
