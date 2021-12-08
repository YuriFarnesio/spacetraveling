import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [hasMorePosts, setHasMorePosts] = useState(!!postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    const loadMorePostsResponse: ApiSearchResponse = await (
      await fetch(nextPage)
    ).json();

    setPosts([...posts, ...loadMorePostsResponse.results]);
    setNextPage(loadMorePostsResponse.next_page);
    setHasMorePosts(!!loadMorePostsResponse.next_page);
  };

  return (
    <>
      <Head>
        <title>Início | spacetraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={styles.content}>
          <div className={styles.posts}>
            {
              posts.map(post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
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
                    </div>
                  </a>
                </Link>
              ))
            }
          </div>

          {!!hasMorePosts && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  });

  return {
    props: {
      postsPagination: postsResponse
    }
  };
};
