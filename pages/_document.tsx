import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import classNames from 'classnames';
import { appLanguage } from '../features/common/data.json';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html dir="ltr" lang={appLanguage}>
        <Head>
          <link rel="stylesheet" href="assets/css/main.css" />
          <noscript>
            <link rel="stylesheet" href="assets/css/noscript.css" />
          </noscript>
        </Head>
        <body
          className={classNames(
            'bg-white',
            'font-light',
            'font-sans',
            'overflow-hidden',
            'text-base',
            'text-white'
          )}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
