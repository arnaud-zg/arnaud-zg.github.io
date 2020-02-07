webpackHotUpdate("static/development/pages/index.js",{

/***/ "./features/common/Footer.tsx":
/*!************************************!*\
  !*** ./features/common/Footer.tsx ***!
  \************************************/
/*! exports provided: Footer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Footer", function() { return Footer; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _data_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./data.json */ "./features/common/data.json");
var _data_json__WEBPACK_IMPORTED_MODULE_1___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./data.json */ "./features/common/data.json", 1);
var _jsxFileName = "/home/arnaud-zg/Workspace/Personals/arnaud-zg.github.io/features/common/Footer.tsx";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


var footerList = [{
  label: "\xA9 ".concat(_data_json__WEBPACK_IMPORTED_MODULE_1__["userName"])
}, {
  prefix: 'Design: ',
  label: 'HTML5 UP',
  href: 'http://html5up.net',
  target: '_blank'
}];
var Footer = function Footer() {
  return __jsx("footer", {
    id: "footer",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 17
    },
    __self: this
  }, __jsx("span", {
    className: "copyright",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 18
    },
    __self: this
  }, footerList.map(function (_ref) {
    var _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === void 0 ? '' : _ref$prefix,
        label = _ref.label,
        href = _ref.href,
        target = _ref.target;
    return "".concat(prefix).concat(label);
  }).join(' | ')));
};

/***/ })

})
//# sourceMappingURL=index.js.fbfeaa09c722f26e7d9d.hot-update.js.map