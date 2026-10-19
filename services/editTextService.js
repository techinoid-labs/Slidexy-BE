const { textGenModel, qualityGenModel } = require("../utils/geminiModels");

// Quality tier: this service produces in-editor AI text rewriting, i.e. copy the user reads.
// The cheap model agrees with a detailed prompt and then ignores it.

const promptMap = {
  longer: ({ title, bullets }) =>
    `Improve the following slide content by adding meaningful detail while keeping it concise. Each version should be suitable for a PowerPoint-style slide (920x420px). Limit the total characters to 250. Format as "title" and 2–4 clear bullet points. Return 3 improved versions as a JSON array of objects. Example: [{"title": "New Title 1", "bullets": ["Bullet A1", "Bullet B1"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  shorter: ({ title, bullets }) =>
    `Rewrite the following slide to be more concise and punchy. Each version must fit a PowerPoint-style slide (920x420px) and stay under 250 characters total. Format using a short title and 2–4 succinct bullet points. Return 3 shorter versions as a JSON array. Example: [{"title": "Short Title 1", "bullets": ["Concise A", "Concise B"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  rewriteSlide: ({ title, bullets }) =>
    `Expand the following slide with clearer and more useful content, but keep it brief enough for a PowerPoint-style layout (920x420px). Total content should be under 250 characters. Use a strong title and 2–4 impactful bullet points. Return 3 versions in JSON. Example: [{"title": "Elaborated Title", "bullets": ["Detail A", "Detail B"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  bulletsFormat: ({ title, bullets }) =>
    `Simplify the following title and bullet points into plain, easy-to-understand English. Keep each version suitable for a slide of 920x420px with under 250 characters total. Use 1 title and 2–4 simplified bullet points. Return 3 JSON-formatted versions. Example: [{"title": "Simple Title", "bullets": ["Easy A", "Easy B"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  listFormat: ({ title, bullets }) =>
    `Rewrite the following slide to sound more professional and polished. The output should fit well on a 920x420px slide and stay under 250 characters. Use a formal title and 2–4 bullet points. Return 3 JSON-formatted versions. Example: [{"title": "Professional Title", "bullets": ["Formal A", "Formal B"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  regenerateImages: ({ title, bullets }) =>
    `Summarize the following slide into 3 creative ideas for image generation. Each idea should represent a distinct concept suitable for a slide (920x420px) and under 250 characters. Return them as a JSON array of objects with "title" (description) and "bullets" (details or empty array). Example: [{"title": "City skyline at sunset", "bullets": []}, {"title": "Team collaboration", "bullets": ["Innovation", "Brainstorming"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,

  custom: ({ title, bullets, customPrompt }) =>
    `${customPrompt}\n\nFormat the response to fit a PowerPoint-style slide layout (920x420px) with max 250 characters. Use 1 short title and 2–4 brief bullet points. Return 3 JSON-formatted versions. Example: [{"title": "Custom Title", "bullets": ["Custom A", "Custom B"]}, ...]\n\nTitle:\n"${title}"\n\nBullet Points:\n${bullets
      .map((b, i) => `${i + 1}. ${b}`)
      .join("\n")}`,
};


async function generateTextEdits({
  title,
  bullets,
  action,
  customPrompt = "",
}) {
  let prompt;

  if (action === "custom") {
    if (!customPrompt.trim()) {
      console.warn(
        "Custom prompt action requested without a customPrompt value."
      );
      // This error will be caught by the API route and sent to the frontend
      throw new Error("Custom prompt is required for the 'custom' action.");
    }
    prompt = promptMap["custom"]({ title, bullets, customPrompt });
  } else {
    const buildPrompt = promptMap[action];
    if (!buildPrompt) {
      console.error(`Invalid action type: ${action}`);
      throw new Error("Invalid action type.");
    }
    prompt = buildPrompt({ title, bullets });
  }

  console.log(`Sending prompt for action '${action}':\n`, prompt); // Log the actual prompt being sent

  let result;
  try {
    result = await qualityGenModel.generateContent(prompt);
  } catch (apiError) {
    console.error(`Error from Gemini API for action '${action}':`, apiError);
    throw new Error("Failed to get response from AI model.");
  }

  const output = result.response.text(); // Await is not needed here as text() returns a Promise

  // You need to await the text() method as it returns a Promise
  let rawOutputText;
  try {
    rawOutputText = await output;
  } catch (textError) {
    console.error(
      `Error reading response text for action '${action}':`,
      textError
    );
    throw new Error("Failed to read AI response text.");
  }

  console.log(`Raw AI output for action '${action}':\n`, rawOutputText); // Log the raw output

  let suggestions = [];
  try {
    // Attempt to parse the entire output as a JSON array first
    if (rawOutputText.startsWith("[") && rawOutputText.endsWith("]")) {
      try {
        const parsedArray = JSON.parse(rawOutputText);
        if (Array.isArray(parsedArray)) {
          suggestions = parsedArray.filter(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              "title" in item &&
              "bullets" in item
          );
          console.log(
            `Successfully parsed as JSON array for action '${action}'.`
          );
        }
      } catch (e) {
        // Fallback to regex if direct array parsing fails
        console.warn(
          `Direct JSON array parsing failed for action '${action}', attempting regex. Error: ${e.message}`
        );
      }
    }

    // If direct array parsing didn't yield suggestions, or if output isn't a direct array,
    // use regex to find individual JSON objects.
    if (suggestions.length === 0) {
      const jsonMatches = rawOutputText.match(/\{[\s\S]*?\}/g);
      if (jsonMatches) {
        jsonMatches.forEach((block) => {
          try {
            const parsedBlock = JSON.parse(block);
            // Basic validation to ensure it has title and bullets
            if (
              parsedBlock &&
              typeof parsedBlock === "object" &&
              "title" in parsedBlock &&
              "bullets" in parsedBlock &&
              Array.isArray(parsedBlock.bullets)
            ) {
              suggestions.push(parsedBlock);
            } else {
              console.warn(
                `Skipping malformed or incomplete JSON block for action '${action}':`,
                block
              );
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse individual JSON block for action '${action}':`,
              block,
              parseError.message
            );
          }
        });
        console.log(
          `Found ${suggestions.length} suggestions via regex for action '${action}'.`
        );
      } else {
        console.warn(
          `No JSON objects found in AI response for action '${action}'.`
        );
      }
    }

    if (suggestions.length === 0) {
      console.warn(
        `No valid suggestions extracted for action '${action}'. Check AI output format.`
      );
    }

    return suggestions;
  } catch (err) {
    console.error(
      `Critical parsing error for action '${action}'. Raw Output:\n`,
      rawOutputText,
      err
    );
    throw new Error("Failed to parse suggestions from AI response.");
  }
}

module.exports = {
  generateTextEdits,
};
