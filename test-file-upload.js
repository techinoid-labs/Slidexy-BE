require("dotenv").config();
const { generateSlideText } = require("./services/generateSlideText");

async function testFileUpload() {
    console.log("🚀 Testing File Upload Integration...");

    // Mock file data (an image or PDF in real usage)
    const fileData = {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", // 1x1 red dot base64
        mimeType: "image/png"
    };

    const meta = { goal: "Test File Upload", tone: "Professional" };
    const slideCount = 1;

    try {
        console.log("Calling generateSlideText with mock file data...");
        const slides = await generateSlideText(
            "Topic: File Upload Test",
            meta,
            slideCount,
            (curr, total) => console.log(`Progress: ${curr}/${total}`),
            fileData
        );

        console.log("✅ Slides generated successfully!");
        console.log("Generated Slides Structure:", JSON.stringify(slides, null, 2));

        if (slides.length === slideCount) {
            console.log("✨ Test passed: Correct number of slides generated.");
        } else {
            console.error("❌ Test failed: Unexpected slide count.");
        }
    } catch (error) {
        console.error("❌ Test failed with error:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testFileUpload();
