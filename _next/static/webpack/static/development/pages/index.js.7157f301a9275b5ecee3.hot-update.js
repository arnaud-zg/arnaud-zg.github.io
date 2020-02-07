webpackHotUpdate("static/development/pages/index.js",{

/***/ "./pages/index.tsx":
/*!*************************!*\
  !*** ./pages/index.tsx ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _features_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../features/common */ "./features/common/index.ts");
/* harmony import */ var _features_presentation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../features/presentation */ "./features/presentation/index.ts");
/* harmony import */ var _features_common_Layout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../features/common/Layout */ "./features/common/Layout.tsx");
var _jsxFileName = "/home/arnaud-zg/Workspace/Personals/arnaud-zg.github.io/pages/index.tsx";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;





function HomePage() {
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(function () {
    window.onload = function () {
      document.body.classList.remove('is-preload');
    };

    window.ontouchmove = function () {
      return false;
    };

    window.onorientationchange = function () {
      document.body.scrollTop = 0;
    };
  });
  return __jsx(_features_common_Layout__WEBPACK_IMPORTED_MODULE_3__["Layout"], {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20
    },
    __self: this
  }, __jsx(_features_common__WEBPACK_IMPORTED_MODULE_1__["Background"], {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 21
    },
    __self: this
  }), __jsx(_features_common__WEBPACK_IMPORTED_MODULE_1__["Overlay"], {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22
    },
    __self: this
  }), __jsx("div", {
    id: "main",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23
    },
    __self: this
  }, __jsx("header", {
    id: "header",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 24
    },
    __self: this
  }, __jsx(_features_presentation__WEBPACK_IMPORTED_MODULE_2__["Presentation"], {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25
    },
    __self: this
  })), __jsx("footer", {
    id: "footer",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28
    },
    __self: this
  }, __jsx("span", {
    className: "copyright",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29
    },
    __self: this
  }, "\xA9 Arnaud Zheng | Design:", ' ', __jsx("a", {
    href: "http://html5up.net",
    target: "_blank",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31
    },
    __self: this
  }, "HTML5 UP")))));
}

/* harmony default export */ __webpack_exports__["default"] = (HomePage);

/***/ })

})
//# sourceMappingURL=index.js.7157f301a9275b5ecee3.hot-update.js.map