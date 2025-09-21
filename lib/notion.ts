import { Client } from '@notionhq/client';
import type { Post, TagFilterItem } from '@/types/blog';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getTags = async (): Promise<TagFilterItem[]> => {
  const posts = await getPublishedPosts();

  const tagCount = posts.reduce(
    (acc, post) => {
      post.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const tags: TagFilterItem[] = Object.entries(tagCount).map(([name, count]) => ({
    id: name,
    name,
    count,
  }));

  tags.unshift({
    id: 'all',
    name: '전체',
    count: posts.length,
  });

  const [allTag, ...restTags] = tags;
  const sortedTags = restTags.sort((a, b) => a.name.localeCompare(b.name));

  return [allTag, ...sortedTags];
};

export const getPublishedPosts = async (tag?: string): Promise<Post[]> => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
        ...(tag && tag !== '전체'
          ? [
              {
                property: 'Tags',
                multi_select: {
                  contains: tag,
                },
              },
            ]
          : []),
      ],
    },
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
  });

  return response.results
    .filter((page: any): page is PageObjectResponse => 'properties' in page)
    .map((page: PageObjectResponse) => {
      const { properties } = page;

      const getCoverImage = (cover: PageObjectResponse['cover']) => {
        if (!cover) return '';

        switch (cover.type) {
          case 'external':
            return cover.external.url;
          case 'file':
            return cover.file.url;
          default:
            return '';
        }
      };

      return {
        id: page.id,
        title:
          properties.Title.type === 'title' ? (properties.Title.title[0]?.plain_text ?? '') : '',
        description:
          properties.Description.type === 'rich_text'
            ? (properties.Description.rich_text[0]?.plain_text ?? '')
            : '',
        coverImage: getCoverImage(page.cover),
        tags:
          properties.Tags.type === 'multi_select'
            ? properties.Tags.multi_select.map((tag: any) => tag.name)
            : [],
        author:
          properties.Author.type === 'people'
            ? ((properties.Author.people[0] as any)?.name ?? '')
            : '',
        date: properties.Date.type === 'date' ? (properties.Date.date?.start ?? '') : '',
        modifiedDate: page.last_edited_time,
        slug:
          properties.Slug.type === 'rich_text'
            ? (properties.Slug.rich_text[0]?.plain_text ?? page.id)
            : page.id,
      };
    });
};
