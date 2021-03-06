import React, { Component } from 'react'
import classNames from 'classnames'
import '../assets/demoBlock.scss'
import striptags from '../util/strip-tags'
import createStyle from '../util/createStyle'
import PropTypes from 'prop-types'
import Prism from 'prismjs'
import 'prismjs/components/prism-jsx.js'

export default class DemoBlock extends Component {
  static defaultProps = {
    jsfiddle: {},
    desc: '',
    code: '',
    lang: '',
    jsResources: '',
    cssResources: '',
    bootCode: '',
    scrollParentSelector: '.section'
  }

  static propsTypes = {
    jsfiddle: PropTypes.object,
    desc: PropTypes.string,
    code: PropTypes.string,
    lang: PropTypes.string,
    jsResources: PropTypes.string,
    cssResources: PropTypes.string,
    bootCode: PropTypes.string,
    scrollParentSelector: PropTypes.string
  }

  constructor(props) {
    super(props)

    this.state = {
      hovering: false,
      controlText: 'Expand',
      codeAreaHeight: 0,
      fixedControl: false,
      demoControlStyle: {}
    }

    this.isExpanded = false

    const { style } = props.jsfiddle;
    createStyle(style);

    const hljx = Prism.highlight(
      striptags.fetch(
        this.props.code,
        'script'
      ).replace(/\/\*.*\*\/\s*/g, ''),
      Prism.languages[this.props.lang] || Prism.languages.markup)

    const hlcss = Prism.highlight(
      style,
      Prism.languages.css || Prism.languages.markup)

    this.state.codePrismed = hlcss ? `<pre data-lang="css">
      <code class="lang-css">${hlcss}</code>
    </pre>` : '';

    this.state.codePrismed +=
      `<pre data-lang="${this.props.lang}">
        <code class="lang-${this.props.lang}">${hljx}</code>
      </pre>`;
  }

  componentDidMount() {
    if (this.codeArea.getElementsByClassName('description').length > 0) {
      this.codeAreaHeight =
        Math.max(this.codeArea.getElementsByClassName('description')[0].clientHeight,
          this.codeArea.getElementsByClassName('highlight')[0].clientHeight)
    } else {
      this.codeAreaHeight = this.codeArea.getElementsByClassName('highlight')[0].clientHeight
    }
  }

  onMouseEnter = _ => {
    this.setState({
      hovering: true
    })
  }

  onMouseLeave = _ => {
    this.setState({
      hovering: false
    })
  }

  toggleDetail = _ => {
    this.isExpanded = !this.isExpanded

    if (this.isExpanded) {
      this.setState({
        codeAreaHeight: `${this.codeAreaHeight}px`,
        controlText: 'Hide'
      })

      setTimeout(() => {
        this.scrollParent = document.querySelector(this.props.scrollParentSelector) || window;
        this.scrollParent && this.scrollParent.addEventListener('scroll', this.scrollHandler);
        this.scrollHandler();
      }, 200)
    } else {
      this.setState({
        codeAreaHeight: 0,
        controlText: 'Expand',
        fixedControl: false
      })

      this.removeScrollHandler()
      const { top, bottom, left, right } = this.codeArea.getBoundingClientRect()

      this.setState({
        demoControlStyle: {
          left: '0',
          width: 'auto'
        }
      })
    }
  }

  scrollHandler = () => {
    const { top, bottom, left, right } = this.codeArea.getBoundingClientRect()
    this.setState({
      fixedControl: bottom > document.documentElement.clientHeight && top + 36
        <= document.documentElement.clientHeight
    })

    this.setState({
      demoControlStyle: {
        left: this.state.fixedControl ? `${ left }px` : '0',
        width: this.state.fixedControl ? `${ right - left }px` : 'auto'
      }
    })
  }

  removeScrollHandler = () => {
    this.scrollParent && this.scrollParent.removeEventListener('scroll', this.scrollHandler)
  }

  goJsfiddle = _ => {
    const { script, html, style } = this.props.jsfiddle;
    let ComponentName = script.match(/export default class (.*) extends/)[1]

    let jsTpl = this.props.bootCode + '\n' + (script || '').replace(/export default/, '').trim()
    let htmlTpl = `${this.props.jsResources || ''}\n<div id="app">\n${html.trim()}\n</div>`
    let cssTpl = `${this.props.cssResources || ''}\n${(style || '').trim()}\n`;

    if (jsTpl) {
      jsTpl = `${jsTpl}\nReactDOM.render(<${ComponentName} \/>, document.getElementById("app"))`
    }

    const data = {
      js: jsTpl,
      css: cssTpl,
      html: htmlTpl,
      panel_js: 3,
      panel_css: 1
    };
    const form = document.getElementById('fiddle-form') || document.createElement('form')
    form.innerHTML = ''
    const node = document.createElement('textarea')

    form.method = 'post'
    form.action = 'https://jsfiddle.net/api/post/library/pure/'
    form.target = '_blank'

    for (let name in data) {
      node.name = name
      node.value = data[name].toString()
      form.appendChild(node.cloneNode())
    }
    form.setAttribute('id', 'fiddle-form')
    form.style.display = 'none'
    document.body.appendChild(form)

    form.submit()
  }

  render() {
    let hoverClass = classNames({
      'demo-block': true,
      'hover': this.state.hovering
    })

    let demoControlClass = classNames({
      'demo-block-control': true,
      'is-fixed': this.state.fixedControl
    })

    return (
      <div
        className={ hoverClass }
        onMouseEnter={ this.onMouseEnter }
        onMouseLeave={ this.onMouseLeave } >
        <div className="source">
          { this.props.children }
        </div>
        <div className="meta" ref={codeArea => this.codeArea = codeArea} style={{height: this.state.codeAreaHeight}}>
          <div className="description">
            <div dangerouslySetInnerHTML={ {__html: this.props.desc} } />
            <button className='go' type="primary" onClick={this.goJsfiddle}>Try in Jsfiddle!</button>
          </div>
          <div className="highlight" dangerouslySetInnerHTML={ {__html: this.state.codePrismed} } />
        </div>
        <div className={ demoControlClass }
          style={ this.state.demoControlStyle }
          ref={ control => this.control = control}
          onClick={this.toggleDetail}>
          <div className="arrow-slide" />
          <div className="text-slide">
            <span>{ this.state.controlText }</span>
          </div>
        </div>
      </div>
    )
  }

  componentWillUnmount() {
    this.removeScrollHandler()
  }
}
