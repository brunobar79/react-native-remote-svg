// @flow

import React, { Component } from 'react';
import { View, Platform } from 'react-native';
import { WebView }  from 'react-native-webview';


const firstHtml =
  '<html><head><style>html, body { margin:0; padding:0; overflow:hidden; background-color: transparent; } svg { position:fixed; top:0; left:0; height:100%; width:100% }</style></head><body>';
const lastHtml = '</body></html>';

class SvgImage extends Component {
  state = { fetchingUrl: null, svgContent: null };
  componentDidMount() {
	this.doFetch(this.props);
	this.mounted = true;
  }

  componentWillReceiveProps(nextProps) {
    const prevUri = this.props.source && this.props.source.uri;
    const nextUri = nextProps.source && nextProps.source.uri;

    if (nextUri && prevUri !== nextUri) {
      this.doFetch(nextProps);
    }
  }

  componentWillUnmount(){
	  this.mounted = false;
  }

  doFetch = async props => {
    let uri = props.source && props.source.uri;
    if (uri) {
      props.onLoadStart && props.onLoadStart();
      if (uri.match(/^data:image\/svg/)) {
        const index = uri.indexOf('<svg');
        this.mounted && this.setState({ fetchingUrl: uri, svgContent: uri.slice(index) });
      } else {
        try {
          const res = await fetch(uri);
          const text = await res.text();
          this.mounted && this.setState({ fetchingUrl: uri, svgContent: text });
        } catch (err) {
          console.error('got error', err);
        }
      }
      this.mounted && props.onLoadEnd && props.onLoadEnd();
    }
  };
  render() {
    const props = this.props;
    const { svgContent } = this.state;

	if (svgContent) {

    let html
    if (svgContent.includes('viewBox')){
      html = `${firstHtml}${svgContent}${lastHtml}`;
    } else {
      const svgRegex = RegExp('(<svg)([^<]*|[^>]*)')
      const svg = svgRegex.exec(svgContent)[0]
      const regex = new RegExp('[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2', 'ig');
      const attributes = {}
      while ((match = regex.exec(svg))) {
        attributes[match[1]] = match[3];
      }
      html = `${firstHtml}${svgContent.substr(0,5) + `viewBox="0 0 ${attributes.width} ${attributes.height}"` + svgContent.substr(5)}${lastHtml}`;
    }
	  return (
        <View pointerEvents="none" style={[props.style, props.containerStyle]}>
          <WebView
            originWhitelist={['*']}
            scalesPageToFit={true}
            style={[
              {
                width: 200,
                height: 100,
                backgroundColor: 'transparent',
              },
              props.style,
            ]}
            scrollEnabled={false}
            source={{
              html: Platform.OS === 'ios' ? html : encodeURIComponent(html),
            }}
          />
        </View>
      );
    } else {
      return (
        <View
          pointerEvents="none"
          style={[props.containerStyle, props.style]}
        />
      );
    }
  }
}
export default SvgImage;
