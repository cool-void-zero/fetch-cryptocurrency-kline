import { StrictMode } from 'react';
import '../app/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App({ Component, pageProps }){
  return <StrictMode>
    <Component {...pageProps} />
</StrictMode>;
}

export default App;