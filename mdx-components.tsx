import type { MDXComponents } from 'mdx/types';

//@next/mdx를 사용하기 위한 필수 파일
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
