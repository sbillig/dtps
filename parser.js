
var parse = function(buf) {
  var C = function(s) { return s.charCodeAt(0); }
    , S = function(n) { return String.fromCharCode(n); }
    , at = 0
    , ch = C(' ')
    , value

    , error = function (m) {
        throw {
          name:    'SyntaxError'
        , message: m
        , at:      at
        , text:    buf
        };
      }

    , next = function(c) {
        ch = buf[at++];
        return ch;
      }

    , white = function() {
        while (ch && ch <= C(' '))
          next();
      }

    , m = function(c) {

        if (c && C(c) !== ch) {
          error("Expected '"+c+"' instead of '"+S(ch)+"' at pos: "+at);
        }
        next();
      }

    , string = function() {

        var start = at;

        while (next()) {
          if (ch === C('"')) {
            next();
            return buf.toString('ascii', start, at-2);
          }
          if (ch === C('\\')) {
            break;
            // TODO: escapes
          }
        }
      }

    , number = function() {

        var start = at;

        if (ch === C('-')) {
          next();
        }
        while (ch >= C('0') && ch <= C('9')) {
          next();
        }
        if (ch === C('.')) {
          while (next() && ch >= C('0') && ch <= C('9')) {}
        }
        if (ch === C('e') || ch === C('E')) {
          next();
          if (ch === C('-') || ch === C('+')) {
            next();
          }
          while (ch >= C('0') && ch <= C('9')) {
            next();
          }
        }

        var num = +buf.toString('ascii', start-1, at-1);
        if (!isFinite(num)) {
          error("Bad number");
        }
        return num;
      }

    , array = function() {
        m('A');m('R');m('R');m('A');m('Y');
        white();
        m('{');

        var out = [];

        if (ch == C('}')) {
          next();
          return out;
        }
        while (ch) {
          out.push(value());
          white();
          if (ch == C('}')) {
            next();
            return out;
          }
          m(',');
          white();
        }
        return out;
      }
    , field = function() {
        var start = at;
        while (next() && ch != C(',') && ch != C(' ') && ch != C('}')) {
        }
        return buf.toString('ascii', start-1, at-1);
      }
    , dict = function() {
        var key
          , out = {};

        m('N');m('A');m('M');m('E');m('D');
        m('A');m('R');m('R');m('A');m('Y');
        white();
        m('{');

        if (ch == C('}')) {
          next();
          return out;
        }
        while (ch) {
          m('{');white();
          key = field();
          white(); m(',');
          out[key] = value();
          white(); m('}'); white();

          if (ch == C('}')) {
            next();
            return out;
          }
          m(',');
          white();
        }
        return error('Bad NA');
      };

    value = function() {
      white();

      switch (ch) {
      case C('A'):
        return array();
      case C('N'):
        return dict();
      default:
        if (ch >= C('0') && ch <= C('9') || ch === C('-'))
          return number();
        if (ch === C('"'))
          return string();
        return field();
      }
    };

  return value();
}

exports.parse = parse;