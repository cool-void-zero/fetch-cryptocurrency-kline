import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

//  All the .js files inside pages folder will includes below css (link) and javascript (script)
export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
          crossOrigin="anonymous" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
          crossOrigin="anonymous" 
          strategy="afterInteractive"
        />
        <Script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.6.4.min.js"
          strategy="afterInteractive"
        />
      </body>
    </Html>
  );
}