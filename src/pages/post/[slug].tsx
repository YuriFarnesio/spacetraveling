import React, { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Carregando | spacetraveling</title>
        </Head>

        <Header />

        <main className={commonStyles.container}>
          Carregando...
        </main>
      </>
    )
  }

  const estimatedReadTime = useMemo(() => {
    if (router.isFallback) return 0;

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce((summedContents, currentContent) => {
      const headingWords = currentContent.heading.split(/\s/g).length;

      const bodyWords = currentContent.body.reduce((summedBodies, currentBody) => {
        const textWords = currentBody.text.split(/\s/g).length;

        return summedBodies + textWords;
      }, 0);

      return summedContents + headingWords + bodyWords;
    }, 0);

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
        <meta name="description" content={post.data.title} />
      </Head>

      <Header />

      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>

        <article className={`${commonStyles.container} ${styles.post}`}>
          <h1>{post.data.title}</h1>

          <div>
            <time>
              <FiCalendar />
              {format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              )}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <time>
              <FiClock />
              {estimatedReadTime} min
            </time>
          </div>

          {post.data.content.map(post => (
            <section key={post.heading} className={styles.postContent}>
              <h1>{post.heading}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(post.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title']
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      notFound: true,
    };
  };

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
