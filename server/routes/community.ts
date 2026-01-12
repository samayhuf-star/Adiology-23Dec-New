import { Hono } from 'hono';
import crypto from 'crypto';

const community = new Hono();

const DISCOURSE_URL = process.env.DISCOURSE_URL || 'https://community.adiology.io';
const DISCOURSE_API_KEY = process.env.DISCOURSE_API_KEY || '';
const DISCOURSE_SSO_SECRET = process.env.DISCOURSE_SSO_SECRET || '';
const DISCOURSE_CATEGORY_ID = process.env.DISCOURSE_CATEGORY_ID || '5';

interface DiscourseUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

function generateSSOPayload(user: DiscourseUser, nonce: string): string {
  const payload = {
    nonce,
    email: user.email,
    external_id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'),
    avatar_url: user.avatarUrl,
    suppress_welcome_message: true,
  };

  const payloadString = new URLSearchParams(payload as any).toString();
  const base64Payload = Buffer.from(payloadString).toString('base64');
  const signature = crypto
    .createHmac('sha256', DISCOURSE_SSO_SECRET)
    .update(base64Payload)
    .digest('hex');

  return `${DISCOURSE_URL}/session/sso_login?sso=${encodeURIComponent(base64Payload)}&sig=${signature}`;
}

community.post('/sso', async (c) => {
  try {
    const { user, returnUrl } = await c.req.json();
    
    if (!user?.id || !user?.email) {
      return c.json({ error: 'User data required' }, 400);
    }

    if (!DISCOURSE_SSO_SECRET) {
      return c.json({ error: 'SSO not configured' }, 500);
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    
    const ssoUrl = generateSSOPayload({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      username: user.username,
      avatarUrl: user.avatarUrl,
    }, nonce);

    return c.json({ ssoUrl });
  } catch (error) {
    console.error('SSO error:', error);
    return c.json({ error: 'Failed to generate SSO URL' }, 500);
  }
});

community.get('/topics', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const category = c.req.query('category');
    
    let url = `${DISCOURSE_URL}/latest.json?per_page=${limit}`;
    if (category) {
      url = `${DISCOURSE_URL}/c/${category}.json?per_page=${limit}`;
    }

    const response = await fetch(url, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (!DISCOURSE_API_KEY) {
        return c.json({ 
          topics: getMockTopics(),
          users: [],
          mock: true 
        });
      }
      throw new Error(`Discourse API error: ${response.status}`);
    }

    const data = await response.json();
    
    const topics = data.topic_list?.topics?.slice(0, limit).map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      excerpt: topic.excerpt || '',
      postsCount: topic.posts_count,
      replyCount: topic.reply_count,
      views: topic.views,
      likeCount: topic.like_count,
      createdAt: topic.created_at,
      lastPostedAt: topic.last_posted_at,
      categoryId: topic.category_id,
      pinned: topic.pinned,
      closed: topic.closed,
      author: data.users?.find((u: any) => u.id === topic.posters?.[0]?.user_id),
    })) || [];

    return c.json({ topics, users: data.users || [] });
  } catch (error) {
    console.error('Topics fetch error:', error);
    return c.json({ 
      topics: getMockTopics(),
      users: [],
      mock: true 
    });
  }
});

community.get('/topics/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const response = await fetch(`${DISCOURSE_URL}/t/${id}.json`, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Discourse API error: ${response.status}`);
    }

    const topic = await response.json();
    
    return c.json({
      id: topic.id,
      title: topic.title,
      posts: topic.post_stream?.posts?.map((post: any) => ({
        id: post.id,
        content: post.cooked,
        rawContent: post.raw,
        createdAt: post.created_at,
        author: {
          id: post.user_id,
          username: post.username,
          name: post.name,
          avatarUrl: post.avatar_template ? 
            `${DISCOURSE_URL}${post.avatar_template.replace('{size}', '45')}` : null,
        },
        likeCount: post.like_count,
        replyCount: post.reply_count,
      })) || [],
    });
  } catch (error) {
    console.error('Topic fetch error:', error);
    return c.json({ error: 'Failed to fetch topic' }, 500);
  }
});

community.post('/posts', async (c) => {
  try {
    const { title, content, categoryId, userId, userEmail } = await c.req.json();
    
    if (!title || !content) {
      return c.json({ error: 'Title and content required' }, 400);
    }

    if (!DISCOURSE_API_KEY) {
      return c.json({ 
        success: true, 
        mock: true,
        message: 'Post would be created (Discourse not configured)'
      });
    }

    const response = await fetch(`${DISCOURSE_URL}/posts.json`, {
      method: 'POST',
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': userEmail?.split('@')[0] || 'system',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        raw: content,
        category: categoryId || DISCOURSE_CATEGORY_ID,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discourse API error: ${error}`);
    }

    const post = await response.json();
    
    return c.json({
      success: true,
      topicId: post.topic_id,
      postId: post.id,
      topicUrl: `${DISCOURSE_URL}/t/${post.topic_slug}/${post.topic_id}`,
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

community.get('/categories', async (c) => {
  try {
    const response = await fetch(`${DISCOURSE_URL}/categories.json`, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return c.json({ categories: getMockCategories() });
    }

    const data = await response.json();
    
    const categories = data.category_list?.categories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      description: cat.description_text,
      topicCount: cat.topic_count,
    })) || [];

    return c.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return c.json({ categories: getMockCategories() });
  }
});

function getMockTopics() {
  return [
    {
      id: 1,
      title: 'Welcome to the Adiology Community!',
      slug: 'welcome-to-adiology',
      excerpt: 'Introduce yourself and share your Google Ads experience...',
      postsCount: 12,
      replyCount: 11,
      views: 245,
      likeCount: 18,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastPostedAt: new Date(Date.now() - 3600000).toISOString(),
      categoryId: 5,
      pinned: true,
      closed: false,
      author: { id: 1, username: 'samay', name: 'Samay Vashisht' },
    },
    {
      id: 2,
      title: 'Best practices for SKAG campaigns in 2024',
      slug: 'skag-best-practices-2024',
      excerpt: 'Let\'s discuss the most effective SKAG strategies...',
      postsCount: 8,
      replyCount: 7,
      views: 189,
      likeCount: 15,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastPostedAt: new Date(Date.now() - 7200000).toISOString(),
      categoryId: 5,
      pinned: false,
      closed: false,
      author: { id: 2, username: 'sarah_ppc', name: 'Sarah Chen' },
    },
    {
      id: 3,
      title: 'How to reduce CPA with negative keywords',
      slug: 'reduce-cpa-negative-keywords',
      excerpt: 'I\'ve been experimenting with negative keyword strategies...',
      postsCount: 15,
      replyCount: 14,
      views: 312,
      likeCount: 24,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastPostedAt: new Date(Date.now() - 14400000).toISOString(),
      categoryId: 5,
      pinned: false,
      closed: false,
      author: { id: 3, username: 'mike_ads', name: 'Mike Rodriguez' },
    },
  ];
}

function getMockCategories() {
  return [
    { id: 5, name: 'General', slug: 'general', color: '8B5CF6', description: 'General discussions', topicCount: 45 },
    { id: 6, name: 'Campaign Strategies', slug: 'strategies', color: '10B981', description: 'Share your strategies', topicCount: 32 },
    { id: 7, name: 'Tips & Tricks', slug: 'tips', color: 'F59E0B', description: 'Quick tips for better ads', topicCount: 28 },
    { id: 8, name: 'Feature Requests', slug: 'features', color: '3B82F6', description: 'Suggest new features', topicCount: 15 },
  ];
}

export { community };
