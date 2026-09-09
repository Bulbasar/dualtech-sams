const React = require('react'); const ReactDOMServer = require('react-dom/server'); try { ReactDOMServer.renderToString(React.createElement(global.History)); } catch(e) { console.log(e.toString()); }
