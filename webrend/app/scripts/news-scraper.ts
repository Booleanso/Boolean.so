import OpenAI from 'openai';
import { db } from '../lib/firebase-admin';
import fetch from 'node-fetch';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
  content?: string;
}

interface GeneratedArticle {
  title: string;
  description: string;
  content: string;
  publishedAt: Date;
  imageUrl?: string;
  category: string;
  readTime: number;
  sourceUrl: string;
  slug: string;
}

/**
 * Fetches recent tech news articles from News API
 */
async function fetchNews(category = 'technology', country = 'us', pageSize = 5): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${NEWS_API_URL}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`News API returned status: ${response.status}`);
    }
    
    const data = await response.json() as { articles: NewsArticle[] };
    return data.articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

/**
 * Generate a slug from the title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generates a full article using OpenAI based on the news piece
 */
async function generateArticleWithAI(newsArticle: NewsArticle): Promise<GeneratedArticle | null> {
  try {
    // Determine a relevant category based on the content
    const categoryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a content categorizer. Based on the article title and description, assign one of these categories: 'Development', 'Design', 'Tech News', 'Tutorials', 'Industry', 'AI', 'Web3', or 'Tools'."
        },
        {
          role: "user", 
          content: `Title: ${newsArticle.title}\nDescription: ${newsArticle.description}`
        }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });
    
    const category = categoryResponse.choices[0]?.message.content?.trim() || 'Tech News';
    
    // Generate the full article content
    const contentResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: `You are a professional tech writer creating a blog post for WebRend. 
          Write an informative, engaging, and well-structured article based on the news headline and description provided.
          Format your response in Markdown. Include headings, subheadings, and paragraphs.
          The article should be comprehensive (1000-1500 words) and include:
          - A clear introduction explaining the significance of the topic
          - Several sections of informative content that expand on the topic
          - Technical details and explanations where appropriate
          - Practical implications for web developers or designers
          - A conclusion with future outlook or recommendations
          Don't include a title in your response.`
        },
        {
          role: "user", 
          content: `Write an article based on this news:
          Title: ${newsArticle.title}
          Description: ${newsArticle.description}
          Source: ${newsArticle.source.name}
          URL: ${newsArticle.url}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const content = contentResponse.choices[0]?.message.content?.trim() || '';
    
    // Choose a random read time between 5-15 minutes
    const readTime = Math.floor(Math.random() * 10) + 5;
    
    // Get a relevant unsplash image
    const imageSearchTerm = encodeURIComponent(category.toLowerCase());
    const imageUrl = `https://source.unsplash.com/random/1200x630/?${imageSearchTerm},technology`;
    
    return {
      title: newsArticle.title,
      description: newsArticle.description || 'Read the latest tech insights and news on WebRend.',
      content,
      publishedAt: new Date(newsArticle.publishedAt),
      imageUrl,
      category,
      readTime,
      sourceUrl: newsArticle.url,
      slug: generateSlug(newsArticle.title)
    };
  } catch (error) {
    console.error('Error generating article with AI:', error);
    return null;
  }
}

/**
 * Saves the generated article to Firebase
 */
async function saveArticleToFirebase(article: GeneratedArticle): Promise<string> {
  try {
    // Check if article with this slug already exists to avoid duplicates
    const existingArticles = await db
      .collection('articles')
      .where('slug', '==', article.slug)
      .limit(1)
      .get();
    
    if (!existingArticles.empty) {
      console.log(`Article with slug "${article.slug}" already exists. Skipping.`);
      return existingArticles.docs[0].id;
    }
    
    // Add new article
    const docRef = await db.collection('articles').add(article);
    console.log(`Article saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving article to Firebase:', error);
    throw error;
  }
}

/**
 * Main function to run the news scraper and article generator
 */
export async function runNewsScraperAndGenerator() {
  console.log('Starting news scraper and article generator...');
  
  try {
    // Fetch recent tech news
    const newsArticles = await fetchNews();
    console.log(`Fetched ${newsArticles.length} news articles`);
    
    // Process each article
    for (const newsArticle of newsArticles) {
      console.log(`Processing: ${newsArticle.title}`);
      
      // Generate an article with AI
      const generatedArticle = await generateArticleWithAI(newsArticle);
      
      if (generatedArticle) {
        // Save to Firebase
        await saveArticleToFirebase(generatedArticle);
        console.log(`Successfully processed and saved article: ${generatedArticle.title}`);
      }
    }
    
    console.log('News scraper and article generator completed successfully');
  } catch (error) {
    console.error('Error in news scraper and article generator:', error);
  }
}

// Allow direct execution of this script
if (require.main === module) {
  runNewsScraperAndGenerator().then(() => {
    console.log('Script execution completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
} 