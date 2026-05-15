// 7 tools as specified in requirements
export const TOOL_META = [
  {
    id: 'repurpose',
    label: 'Repurpose Content',
    icon: '♻️',
    description: 'Transform existing content for Instagram',
    placeholder: 'Paste the content you want to repurpose (blog, video script, etc.)…',
    inputType: 'textarea',
  },
  {
    id: 'viral-ideas',
    label: 'Viral Post Ideas',
    icon: '🔥',
    description: 'Generate trending post ideas for your niche',
    placeholder: 'Describe your niche and target audience…',
    inputType: 'textarea',
  },
  {
    id: 'caption',
    label: 'Instagram Captions',
    icon: '✍️',
    description: 'Write engaging captions that drive action',
    placeholder: 'Describe your post or paste a topic…',
    inputType: 'textarea',
  },
  {
    id: 'hashtags',
    label: 'Hashtag Groups',
    icon: '#️⃣',
    description: 'Find high-reach hashtag sets for your posts',
    placeholder: 'Describe your content, niche or paste your caption…',
    inputType: 'textarea',
  },
  {
    id: 'reel-framework',
    label: 'Reel Framework',
    icon: '🎬',
    description: 'Script a viral Reel from hook to CTA',
    placeholder: 'What is your Reel about? What do you want to teach or show?',
    inputType: 'textarea',
  },
  {
    id: 'trend-analysis',
    label: 'Trend Analysis',
    icon: '📈',
    description: 'Analyse trends and create timely content',
    placeholder: 'Describe your niche and current industry trends you want to leverage…',
    inputType: 'textarea',
  },
  {
    id: 'create-post',
    label: 'Create Full Post',
    icon: '🚀',
    description: 'Caption + hashtags + AI-generated image',
    placeholder: 'Describe the post you want to create…',
    inputType: 'textarea',
  },
  {
    id: 'custom',
    label: 'Custom Prompt',
    icon: '✨',
    description: 'Free-form AI content creation',
    placeholder: 'Tell the AI exactly what you need…',
    inputType: 'textarea',
  },
] as const;

export type ToolId = typeof TOOL_META[number]['id'];

export const CUSTOM_TEMPLATES = [
  { id: 'product-launch',  label: 'Product launch',      content: 'Create an exciting product launch announcement for {product name}. Include benefits, a special launch offer, and a clear CTA.' },
  { id: 'behind-scenes',   label: 'Behind the scenes',   content: 'Write a behind-the-scenes post showing our process for {activity}. Make it authentic and engaging.' },
  { id: 'testimonial',     label: 'Client testimonial',  content: 'Create a post featuring this client testimonial: "{paste testimonial}". Make it compelling with a CTA.' },
  { id: 'tips-list',       label: 'Tips list',           content: 'Write a "Top 5 tips for {topic}" post that provides genuine value to {target audience}.' },
  { id: 'question',        label: 'Engagement question', content: 'Create an engagement-boosting question post about {topic} that gets our audience commenting.' },
  { id: 'sale-promo',      label: 'Sale promotion',     content: 'Write a promo post for a {discount}% off sale on {product}. Include urgency and a strong CTA.' },
];

export const POST_STYLES = [
  { value: 'professional',  label: 'Professional & Authoritative' },
  { value: 'casual',        label: 'Casual & Friendly' },
  { value: 'inspirational', label: 'Inspirational & Motivating' },
  { value: 'educational',   label: 'Educational & Informative' },
  { value: 'humorous',      label: 'Humorous & Playful' },
  { value: 'luxury',        label: 'Luxury & Premium' },
  { value: 'storytelling',  label: 'Story-driven & Personal' },
  { value: 'bold',          label: 'Bold & Provocative' },
];

export const IMG_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'cinematic',      label: 'Cinematic Film' },
  { value: 'minimalist',     label: 'Minimalist & Clean' },
  { value: 'vibrant',        label: 'Vibrant & Colorful' },
  { value: 'dark-moody',     label: 'Dark & Moody' },
  { value: 'flat-design',    label: 'Flat Design / Illustration' },
  { value: '3d-render',      label: '3D Render' },
  { value: 'watercolor',     label: 'Watercolor Art' },
];

export const BOTTLENECK_OPTIONS = [
  { value: 'awareness',   label: 'Low Awareness (not enough people know me)' },
  { value: 'engagement',  label: 'Low Engagement (people see but don\'t interact)' },
  { value: 'followers',   label: 'Not Growing Followers' },
  { value: 'leads',       label: 'Not Getting Enough Leads / DMs' },
  { value: 'sales',       label: 'Leads Not Converting to Sales' },
  { value: 'retention',   label: 'Losing Followers / Low Retention' },
];

export const FREQ_OPTIONS = [
  { value: 'daily',     label: 'Daily (7x/week)' },
  { value: '5-6x',      label: '5–6× per week' },
  { value: '3-4x',      label: '3–4× per week' },
  { value: '1-2x',      label: '1–2× per week' },
  { value: 'sporadic',  label: 'Sporadic / Inconsistent' },
];

export const GOAL_OPTIONS = [
  { value: 'grow-followers',      label: 'Grow Followers' },
  { value: 'increase-engagement', label: 'Increase Engagement' },
  { value: 'generate-leads',      label: 'Generate Leads' },
  { value: 'drive-sales',         label: 'Drive Direct Sales' },
  { value: 'build-brand',         label: 'Build Brand Authority' },
  { value: 'grow-email-list',     label: 'Grow Email List' },
];
