import Head from 'next/head';
import Home from './Home';

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>FlowDyno - AI-Powered Dynamic Architecture Diagrams</title>
        <meta
          name="description"
          content="Generate, animate, and export professional system architecture diagrams in seconds with AI. 500+ tech icons, auto-animation, and multi-format export."
        />
      </Head>
      <Home />
    </>
  );
}
