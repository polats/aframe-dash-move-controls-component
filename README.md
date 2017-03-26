## aframe-dash-move-controls-component

[![Version](http://img.shields.io/npm/v/aframe-dash-move-controls-component.svg?style=flat-square)](https://npmjs.org/package/aframe-dash-move-controls-component)
[![License](http://img.shields.io/npm/l/aframe-dash-move-controls-component.svg?style=flat-square)](https://npmjs.org/package/aframe-dash-move-controls-component)

Point at a location in an A-Frame scene and move an attached entity towards it

For [A-Frame](https://aframe.io).

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|          |             |               |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.4.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-dash-move-controls-component/dist/aframe-dash-move-controls-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity dash-move-controls="foo: bar"></a-entity>
  </a-scene>
</body>
```

<!-- If component is accepted to the Registry, uncomment this. -->
<!--
Or with [angle](https://npmjs.com/package/angle/), you can install the proper
version of the component straight into your HTML file, respective to your
version of A-Frame:

```sh
angle install aframe-dash-move-controls-component
```
-->

#### npm

Install via npm:

```bash
npm install aframe-dash-move-controls-component
```

Then require and use.

```js
require('aframe');
require('aframe-dash-move-controls-component');
```
