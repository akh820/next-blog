'use client';

{
  /* <script src="https://giscus.app/client.js"
        data-repo="akh820/next-blog"
        data-repo-id="R_kgDOPtxu4g"
        data-category="Announcements"
        data-category-id="DIC_kwDOPtxu4s4CwgIC"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="ko"
        crossorigin="anonymous"
        async>
</script> */
}

import Giscus from '@giscus/react';

export default function GiscusComments() {
  return (
    <Giscus
      repo="akh820/next-blog"
      repoId="R_kgDOPtxu4g"
      category="Announcements"
      categoryId="DIC_kwDOPtxu4s4CwgIC"
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="ko"
    />
  );
}
