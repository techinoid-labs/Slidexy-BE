require("dotenv").config();
const { generateSlideText } = require("./services/generateSlideText");
const crypto = require("crypto");

// Mock sanitizeSlides from slideController.js
function sanitizeSlides(slides) {
    const validElementTypes = [
        'bullet_point', 'quote', 'author', 'context',
        'stat', 'description', 'left_bullet', 'right_bullet', 'cta'
    ];

    return slides.map((slide, index) => {
        const sanitizedSlide = {
            layout_type: slide.layout_type || 'content-right-image',
            elements: [],
            quote: slide.quote,
            author: slide.author,
            content_metadata: slide.content_metadata || {}
        };

        if (Array.isArray(slide.elements)) {
            sanitizedSlide.elements = slide.elements
                .filter(element => element.text && element.element_type)
                .map(element => {
                    let elementType = element.element_type.toLowerCase().trim();
                    const typeMapping = { 'text': 'description', 'paragraph': 'description' };
                    if (typeMapping[elementType]) elementType = typeMapping[elementType];
                    return {
                        id: element.id || "test-id",
                        element_id: element.element_id || "test-el-id",
                        element_type: elementType,
                        text: element.text.trim()
                    };
                });
        }

        // SELF-HEALING
        if (slide.layout_type === 'quote-slide' && sanitizedSlide.elements.length === 0) {
            const qText = slide.quote || (slide.content_metadata && slide.content_metadata.quote);
            const aText = slide.author || (slide.content_metadata && slide.content_metadata.author);

            if (qText) {
                sanitizedSlide.elements.push({
                    element_type: 'quote',
                    text: String(qText).trim()
                });
            }
            if (aText) {
                sanitizedSlide.elements.push({
                    element_type: 'author',
                    text: String(aText).trim()
                });
            }
        }

        return sanitizedSlide;
    });
}

async function runTest() {
    console.log("Generating slides for 7 slides...");
    const rawText = "Introduction to UX/UI guidelines. It's very important for business.";
    const meta = { goal: "Inform", tone: "Professional", audience: "Designers" };

    try {
        const slides = await generateSlideText(rawText, meta, 7);
        console.log("Total slides generated:", slides.length);

        const quoteSlide = slides.find(s => s.layout_type === "quote-slide");
        if (!quoteSlide) {
            console.error("Quote slide NOT found in 7-slide structure!");
            return;
        }

        console.log("Quote slide BEFORE sanitization:", JSON.stringify({
            layout_type: quoteSlide.layout_type,
            elements: quoteSlide.elements,
            quote: quoteSlide.quote
        }, null, 2));

        const sanitized = sanitizeSlides(slides);
        const sanitizedQuoteSlide = sanitized.find(s => s.layout_type === "quote-slide");

        console.log("Quote slide AFTER sanitization:", JSON.stringify({
            layout_type: sanitizedQuoteSlide.layout_type,
            elements: sanitizedQuoteSlide.elements,
            quote: sanitizedQuoteSlide.quote
        }, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTest();
