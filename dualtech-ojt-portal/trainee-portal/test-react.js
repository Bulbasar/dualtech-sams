const React = require('react'); const ReactDOMServer = require('react-dom/server'); try { ReactDOMServer.renderToString(React.createElement(History)); } catch(e) { console.log(e.toString()); }
