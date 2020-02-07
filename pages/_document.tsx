import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, user-scalable=no"
          />
          <link rel="stylesheet" href="assets/css/main.css" />
          <noscript>
            <link rel="stylesheet" href="assets/css/noscript.css" />
          </noscript>
        </Head>
        <body className="is-preload">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
