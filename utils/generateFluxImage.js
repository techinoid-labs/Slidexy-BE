import { fal } from "@fal-ai/client";

fal.config({
    credentials: process.env.FAL_KEY,
});

export async function generateFluxImage({ prompt, artStyle, artPalette }) {
    try {
        const fluxPrompt = `
${prompt}
Style: ${artStyle || "modern presentation illustration"}
Color palette: ${artPalette || "clean, professional"}
High quality, 16:9, presentation background, no text
`;

        console.log("Sending Flux request with prompt:", fluxPrompt);

        const result = await fal.subscribe("fal-ai/flux-1/schnell", {
            input: {
                prompt: fluxPrompt
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        // console.log("Flux result:", result.data);
        // console.log("Flux RequestId:", result.requestId);

        const imageUrl = result.data?.images?.[0]?.url || null;
        if (!imageUrl) throw new Error("Flux returned no image URL");

        return {
            image_url: imageUrl,
            raw: result.data,
        };
    } catch (err) {
        console.error("Flux generation failed:", err.message || err);
        return null;
    }
}
