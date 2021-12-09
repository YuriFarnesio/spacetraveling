import React, { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
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
  preview: boolean;
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function Post({ post, preview, nextPost, prevPost }: PostProps) {
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

  const isPostEdited = post.last_publication_date && post.last_publication_date !== post.first_publication_date;

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

          {isPostEdited && (
            <span>
              * editado em {format(
                new Date(post.last_publication_date),
                "dd MMM yyyy', às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            </span>
          )}

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


        <footer className={`${commonStyles.container} ${styles.footer}`}>
          <div className={styles.navigation}>
            <div>
              {prevPost && (
                <Link href={`/post/${prevPost.uid}`}>
                  <a className={styles.previous}>
                    <span>{prevPost.data.title}</span>
                    Post anterior
                  </a>
                </Link>
              )}
            </div>
            <div>
              {nextPost && (
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={styles.next}>
                    <span>{nextPost.data.title}</span>
                    Próximo post
                  </a>
                </Link>
              )}
            </div>
          </div>

          {!preview && (<Comments />)}

          {preview && (
            <aside className={commonStyles.exitPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </footer>
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

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null
  });

  if (!response) {
    return {
      notFound: true,
    };
  };

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];

  return {
    props: {
      post: response,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
