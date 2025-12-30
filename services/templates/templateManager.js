/**
 * Template Manager
 * Handles genre detection and template selection strategies
 */
const saasTemplate = require('./saasTemplate');
const minimalTemplate = require('./minimalTemplate');
const corporateTemplate = require('./corporateTemplate');
const medicalTemplate = require('./medicalTemplate');
const hospitalityTemplate = require('./hospitalityTemplate');
const portfolioTemplate = require('./portfolioTemplate');

/**
 * Detect the likely genre of a website based on its content
 * @param {Object} websiteData - Extracted website data
 * @returns {string} One of: 'saas', 'minimal', 'corporate', 'medical'
 */
function detectGenre(websiteData) {
    const text = (
        websiteData.topic + " " +
        (websiteData.description || "") + " " +
        (websiteData.valueProposition || "") + " " +
        (websiteData.sections || []).map(s => s.title + " " + s.description).join(" ")
    ).toLowerCase();

    // Keywords for scoring
    const scores = {
        saas: 0,
        software_product: 0,
        minimal: 0,
        corporate: 0,
        medical: 0,
        hospitality: 0,
        portfolio: 0
    };

    const keywords = {
        saas: [
            'github', 'npm', 'cli', 'bash', 'terminal', 'compiler', 'syntax', 'repo', 'commit', 'branch', 'stack', 'open source', 'linux', 'programming', 'cloud', 'deploy', 'infrastructure', 'platform', 'serverless', 'function',
            'api', 'sdk', 'database', 'backend', 'frontend', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'runtime', 'framework', 'library', 'code', 'debugging', 'testing', 'monitoring', 'observability', 'logs', 'metrics', 'autoscaling'
        ],
        software_product: [
            'download', 'install', 'version', 'release notes', 'documentation', 'pricing', 'features', 'integrations', 'login', 'sign up', 'get started', 'demo', 'trial', 'software', 'app', 'desktop', 'mobile', 'web', 'dashboard', 'analytics', 'management', 'tool', 'solution', 'automation', 'productivity', 'collaboration', 'security', 'enterprise', 'roadmap', 'changelog'
        ],
        minimal: [
            'design', 'art', 'creative', 'studio', 'photography', 'gallery', 'architect', 'minimal', 'pure', 'work', 'general', 'website', 'universal', 'simple', 'clean', 'modern', 'elegant', 'visual', 'concept', 'whitespace', 'typography'
        ],
        corporate: [
            'services', 'consulting', 'business', 'firm', 'agency', 'solutions', 'about us', 'contact us', 'team', 'mission', 'trust', 'finance', 'payment', 'billing', 'global', 'enterprise', 'partners', 'investors', 'careers', 'sustainability', 'governance', 'leadership', 'strategy', 'clients', 'history', 'values', 'excellence', 'innovation', 'industry', 'sectors',
            'revenue', 'commerce', 'economic', 'banking', 'processing', 'merchant', 'currency', 'infrastructure', 'financial'
        ],
        medical: [
            'healthcare', 'clinic', 'doctor', 'medical', 'patient', 'hospital', 'care', 'appointment', 'treatment', 'health', 'wellness', 'diagnostic', 'imaging', 'radiology', 'lab', 'pathology', 'test', 'mri', 'surgery', 'pharmacy', 'prescription', 'insurance', 'emergency', 'pediatric', 'cardiology', 'dermatology', 'physician', 'medicine', 'recovery', 'telehealth', 'dental', 'vision'
        ],
        hospitality: [
            'restaurant', 'cafe', 'coffee', 'dining', 'food', 'delivery', 'hotel', 'booking', 'chef', 'kitchen', 'stay', 'resort', 'menu', 'tasting', 'wine', 'bar', 'grill', 'bistro', 'eatery', 'luxury', 'suite', 'spa', 'pool', 'concierge', 'vacation', 'travel', 'experience', 'ballroom', 'reservation', 'book now', 'check-in', 'guest', 'amenities', 'accommodation', 'rooms'
        ],
        portfolio: [
            'portfolio', 'developer', 'engineer', 'resume', 'cv', 'projects', 'work', 'me', 'personal', 'creative', 'designer', 'profile', 'bio', 'ui', 'ux', 'interaction', 'art director', 'illustrator', 'design', 'art', 'skills', 'experience', 'education', 'contact', 'hire', 'freelance', 'case studies', 'about me', 'social', 'github', 'linkedin'
        ]
    };

    // Calculate scores
    const topicLower = websiteData.topic.toLowerCase();

    Object.keys(keywords).forEach(genre => {
        keywords[genre].forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');

            // Strong signal: Keyword in Title/Topic
            if (regex.test(topicLower)) scores[genre] += 3;

            // Standard signal: Keyword in content
            if (regex.test(text)) scores[genre]++;
        });
    });

    // Default to 'minimal' (Universal) if ambiguous or tied
    console.log("\n📊 GENRE SCORES:", JSON.stringify(scores, null, 2));
    const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    // Low confidence check - if very few keywords found, default to 'minimal'
    if (scores[winner] < 1) {
        console.log("   ⚠️ Low confidence (<1), defaulting to MINIMAL");
        return 'minimal';
    }

    return winner;
}

/**
 * Get the generator functions for a specific genre
 * @param {string} genre 
 * @returns {Object} { generateHTML, generateCSS }
 */
function getTemplate(genre) {
    switch (genre) {
        case 'minimal':
            return minimalTemplate;
        case 'software_product':
        case 'corporate':
            return corporateTemplate;
        case 'medical':
            return medicalTemplate;
        case 'hospitality':
            return hospitalityTemplate;
        case 'portfolio':
            return portfolioTemplate;
        case 'saas':
            return saasTemplate;
        default:
            return minimalTemplate;
    }
}

module.exports = {
    detectGenre,
    getTemplate
};
