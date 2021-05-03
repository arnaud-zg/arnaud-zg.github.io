import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import classNames from 'classnames';
import data from '../features/common/data.json';

const { appLanguage } = data;

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html dir="ltr" lang={appLanguage}>
        <Head />
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
