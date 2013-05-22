
var Base = {
  _name: 'Base',

  toString: function() {
    var c = this;
    var out = this._name;
    while ((c = c.sup())) {
      out += ' > ' + c._name;
    }
    return out;
  },

  sup: function() {
    if (this.__proto__.hasOwnProperty('_name'))
      return this.__proto__;
    return null;
  },

  subtype: function(name, params) {

    var c = function() {
      var tt = arguments.callee,
          args = [].slice.call(arguments);
      args.shift(); // Drop 'name' argument

      if (args.length > tt._params.length)
        throw tt._name+' takes '+tt._params.length+' type parameters. '+
        'Received '+args.length+'.';

      // TODO: compare params to tt._params
      if (tt._params.length == 0)
        return c;
      return tt.spec(args);
    };

    c._params = params || [];
    c._name = name;
    c.__proto__ = this;
    return c;
  },
  instance: function(kv) {
    return {msg:'i am a '+this._name};
  },
  spec: function(params) {
    // var pns = params.map(function(x) {return x._name;});
    // var c = this.subtype(this._name+'('+pns.join(', ')+')', 0);
    // c._boundParams = params;
    // return c;
    return this;
  },

  isSubtypeOf: function(t) {
    var c = this;
    while ((c = c.sup())) {
      if (c._name === t._name)
        return true;
    }
    return false;
  },
};

var Fn = Base.subtype('Fn');
Fn.instance = function(inArgs, outArgs) {
  return {msg: 'i am a function!'};
};

var TypeVar = Base.subtype('TypeVar'),
    A = TypeVar.subtype('A');

var File = Base.subtype('File'),
    ZipFile = File.subtype('ZipFile', File);

// unzip = Fn.instance({in:ZipOf(A)}, {out:SetOf(B)})
// pmap  = Fn.instance({f:Fn, xs:SetOf(A)}, function(){..})
// pmap.onBind('f', function(self?) {...})

// File = Base.subtype('File').fields({name:String, size:Int})
