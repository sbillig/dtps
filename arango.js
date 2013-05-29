"use strict";

var _ = require('underscore');
var arango = require('arango.client');
var Join = require('join');
var async = require('async');

// TODO: db.collection.create(undefined, cb), etc
//  fail silently

var db = new arango.Connection({name:'tdocs'});
function withCollections() {
  var args = _(arguments).toArray();
  var cb = args.pop();
  var names = _(args).pluck('name');

  var join = Join.create();

  for (var i = 0; i < args.length; i++) {
    let coll = args[i];
    let j = join.add();
    db.collection.get(coll.name, function(err, res) {
      if (!err) j();
      else
        db.collection.create(coll, function(err, res) {
          if (err)
            console.log('failed to create: ', err);
          else
            console.log('created: ', res);
          j();
        });
    });
  }
  join.when(function() {
    var failure = _(arguments).find(function(r) { return r.length && r[0]; });
    if (failure) {
      throw(failure[0]);
    }
    cb.apply(undefined, _(names).map(db.use.bind(db)));
  });
}

withCollections({name:'tdocs'}, {name:'tedges', type:3}, function(docc, edgec) {
  function doc(d) {
    return _.partial(docc.document.create, d);
  }

  function edge(a, b, d) {
    // db.edge.create expects an _id string for the 'from' and 'to' params
    if (a.hasOwnProperty('_id'))
      a = a._id;
    if (b.hasOwnProperty('_id'))
      b = b._id;

    // NOTE: the nodejs arango client allows edges to be created
    //  in document collections.  arangosh does not.
    return _.partial(edgec.edge.create, a, b, d);
  }

  var people = {
    Sue:   doc({name:'Sue', age:22}),
    Bob:   doc({name:'Bob', age:33}),
    Steve: doc({name:'Steve', age:44}),
    Mary:  doc({name:'Mary', age:55}),
  };

  async.parallel(people, function(err, n) {
    if (err) throw(err);
    console.log('n: ', n);

    var edges = [
      edge(n.Sue,   n.Bob,   {'$label':'knows'}),
      edge(n.Bob,   n.Steve, {'$label':'knows'}),
      edge(n.Steve, n.Mary,  {'$label':'knows'}),
      edge(n.Sue,   n.Mary,  {'$label':'knows'}),
    ];
    async.parallel(edges, errorHandler);
  });

});

function errorHandler(err, res) {
  if (err) throw(err);
}


/*


db._query('for t in traversal_tree(tdocs, tedges, "tdocs/138266183", "outbound", "knows", {}) return t').toArray()
db._query('for t in traversal(tdocs, tedges, "tdocs/138266183", "outbound", {}) return t').toArray()

*/
