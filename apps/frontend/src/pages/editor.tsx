import dynamic from 'next/dynamic';
import Head from 'next/head';

const EditorPage = dynamic(() => import('../components/pages/EditorPage'), {
  ssr: false,
});

export default function Editor() {
  return (
    <>
      <Head>
        <title>Editor - Flowdyno AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <EditorPage />
    </>
  );
}
