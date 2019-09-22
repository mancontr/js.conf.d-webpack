# js.conf.d-webpack

A webpack plugin for configuration management, based on [js.conf.d](https://github.com/mancontr/js.conf.d).

## Usage

To use js.conf.d-webpack, you need to add it to your webpack config:

```js
const JsconfdPlugin = require('js.conf.d-webpack')

const config = {
  // ...
  plugins: [
    // ...
    new JsconfdPlugin({
      folders: ['/etc/my-config', '~/.my-config', './config']
    })
  ]
}
```

Once added, to access the config from your application just do:

```js
import config from '#js.conf.d'
```

The plugin will replace that special path with the aggregated config.
