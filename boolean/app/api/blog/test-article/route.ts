import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function GET() {
  try {
    // Check if the test article already exists
    const testArticleQuery = await db!.collection('articles')
      .where('slug', '==', 'getting-started-with-webrend')
      .limit(1)
      .get();
    
    if (!testArticleQuery.empty) {
      return NextResponse.json({
        success: true,
        message: 'Test article already exists',
        articleId: testArticleQuery.docs[0].id,
        slug: 'getting-started-with-webrend'
      });
    }
    
    // Create the test article in Firestore
    const testArticle = {
      title: 'Getting Started with WebRend',
      description: 'Learn the basics of using WebRend for web development and design projects',
      publishedAt: new Date(),
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      category: 'Tutorials',
      readTime: 5,
      slug: 'getting-started-with-webrend',
      sourceUrl: 'https://webrend.com',
      content: `
## Introduction

WebRend is a powerful platform for web developers and designers looking to create stunning, performant websites with ease. In this article, we'll explore the basics of WebRend and how to get started with your first project.

### What is WebRend?

WebRend combines modern web technologies with an intuitive interface to streamline the web development process. Whether you're a seasoned developer or just starting out, WebRend provides the tools you need to bring your web projects to life.

## Getting Started

To begin using WebRend, you'll need to set up your development environment. Here's a step-by-step guide to help you get started:

1. **Install Dependencies**

   Make sure you have Node.js (v14 or higher) installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

   \`\`\`bash
   # Check your Node.js version
   node -v
   \`\`\`

2. **Create a New Project**

   Use the WebRend CLI to create a new project:

   \`\`\`bash
   npx create-webrend-app my-first-project
   cd my-first-project
   \`\`\`

3. **Start the Development Server**

   \`\`\`bash
   npm run dev
   \`\`\`

   This will start the development server, typically on http://localhost:3000.

## Key Features

WebRend comes with a variety of features that make web development more efficient and enjoyable:

### Component-Based Architecture

Build reusable components that can be combined to create complex interfaces. This modular approach speeds up development and makes your code more maintainable.

### Responsive Design Tools

WebRend includes tools for creating layouts that work beautifully across all device sizes. The built-in grid system and breakpoint utilities make responsive design straightforward.

### Performance Optimization

Performance is critical for modern web applications. WebRend includes built-in optimization for images, code splitting, and lazy loading to ensure your site loads quickly.

## Advanced Techniques

Once you're comfortable with the basics, you can explore advanced techniques such as:

### Custom Animations

Create stunning animations with WebRend's animation API:

\`\`\`javascript
import { animate } from '@webrend/animations';

// Create a fade-in animation
animate('#my-element', {
  opacity: [0, 1],
  duration: 0.5,
  easing: 'ease-in-out'
});
\`\`\`

### State Management

For complex applications, WebRend provides an integrated state management solution:

\`\`\`javascript
import { createStore } from '@webrend/store';

const store = createStore({
  initialState: {
    counter: 0
  },
  reducers: {
    increment: state => ({ counter: state.counter + 1 }),
    decrement: state => ({ counter: state.counter - 1 })
  }
});
\`\`\`

## Best Practices

To get the most out of WebRend, follow these best practices:

1. **Organize Components Logically**
   
   Structure your components in a way that makes sense for your project. Consider grouping by feature or by page.

2. **Optimize Images**
   
   Use WebRend's image optimization tools to ensure fast load times without sacrificing quality.

3. **Use Semantic HTML**
   
   WebRend encourages the use of semantic HTML, which improves accessibility and SEO.

4. **Test Across Devices**
   
   Regularly test your project on different devices and browsers to ensure a consistent experience.

## Conclusion

WebRend provides a powerful yet approachable platform for modern web development. By following the steps and best practices outlined in this article, you'll be well on your way to creating beautiful, efficient web experiences.

Ready to take your skills further? Explore our documentation and tutorials to learn about more advanced features and techniques. Happy coding!
      `
    };
    
    // Add to Firestore
    const docRef = await db!.collection('articles').add(testArticle);
    
    return NextResponse.json({
      success: true,
      message: 'Test article created successfully',
      articleId: docRef.id,
      slug: 'getting-started-with-webrend'
    });
    
  } catch (error) {
    console.error('Error creating test article:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create test article',
      error: String(error)
    }, { status: 500 });
  }
} 