import React, { useEffect } from 'react';

import styles from './comments.module.scss';

export default function Comments() {
  useEffect(() => {
    const commentsBox = document.getElementById('commentsBox');

    if (!commentsBox) {
      return;
    };

    const utterances = document.getElementsByClassName('utterances')[0];

    if (utterances) {
      utterances.remove();
    };

    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('repo', 'YuriFarnesio/spacetraveling');
    scriptEl.setAttribute('issue-term', 'title');
    scriptEl.setAttribute('label', 'blog-comment');
    scriptEl.setAttribute('theme', 'github-dark');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', true);

    commentsBox.appendChild(scriptEl);
  });

  return (
    <div id="commentsBox" className={styles.commentBox}></div>
  );
}