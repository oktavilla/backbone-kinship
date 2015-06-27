/**
* A simple model for 1-N and 1-1 relations.
* Relations are set up like
* relations: {
*   my-first-relation: MyCollection,
*   my-other-relation: MyModel
* }
* After that the related collection/model instances are available both directly on the
* model (Model.my-first-relation) and by using Model.get (Model.get("my-first-relation")).
* Note that model relations are undefined until they have been assigned a value.
*/
(function(root, factory) {
  "use strict";
	// First AMD
	if (typeof define === "function" && define.amd) {
		define(["exports", "backbone", "underscore"], factory);
	}
	// Next for Node.js or CommonJS.
	else if (typeof exports !== "undefined") {
		factory(exports, require("backbone"), require("underscore"));
	}
	// And as a browser global. Using `root` as it references `window`.
	else {
		factory(root, root.Backbone, root._);
	}
} (this, function (exports, Backbone, _) {
  Backbone.RelationalModel = Backbone.Model.extend({
    relations: {},

    get: function (key) {
      return this.relations[key] ? this[key] : Backbone.Model.prototype.get.call(this, key);
    },

    set: function (key, value, options) {
      var returnValue;
      // Handling the two function signatures, either key-value or attribute object
      if (_.isObject(key)) {
        attributes = key;
        options = value;
      } else {
        (attributes = {})[key] = value;
      }
      // Checking if any relations are among the attributes
      _.each(this.relations, function (constructor, name) {
        var object;
        // Setting up relational functionality for this attribute (if it's not already done)
        if (!this[name]) {
          object = new constructor();
          // Only collections can be set up without data
          if (typeof attributes[name] !== "undefined" || object instanceof Backbone.Collection) {
            this[name] = object;
            // Setting up getter and setter for this attribute (so that it can be expanded)
            defineRelatedAttribute(this, name, object);
            // Setting up dispatcher for relational events
            delegateEvents(object, this, name);
          }
        }
        if (name in attributes) {
          // "Propagating" set options
          this[name]._setOptions = options;
        }
      }, this);
      // Letting Backbone do its real set magic
      returnValue = Backbone.Model.prototype.set.call(this, key, value, options);
      // Unsetting means that all attributes get wiped, including our attribute
      // relations, so we handle that.
      if (options && options.unset) {
        _.each(this.relations, function (constructor, name) {
          if (name in attributes && this[name]) {
            if (this[name] instanceof Backbone.Collection) {
              // Reconnecting unset collections (since an unset collection attribute is just an empty collection)
              defineRelatedAttribute(this, name, this[name]);
            } else {
              // Removing others unset relations
              delete this[name];
            }
          }
        }, this);
      }
      return returnValue;
    }
  });

  /**
  * Connects a model attribute to a related model or collection
  * @param model The model to add the connection to
  * @param name The name of attribute
  * @param object The backbone object to connect
  */
  function defineRelatedAttribute(model, name, object) {
    Object.defineProperty(model.attributes, name, {
      configurable: true,
      enumerable: true,
      get: function () {
        return object.toJSON();
      },
      set: function (value) {
        var options = object._setOptions;
        var method = options && options.reset && object.reset ? "reset" : "set";
        delete object._setOptions;
        return object[method](value, options);
      }
    });
  }

  /**
  * Delegates all events from one entity to another, on the format
  * eventName:fromName.
  * @param from The entity that emits the event
  * @param to The entity that should receive the event
  * @param fromName Display name to use for showing where this event originated
  */
  function delegateEvents(from, to, fromName) {
    from.bind("all", function () {
      var args = _.toArray(arguments); // Cloning
      var eventName = args[0];
      args[0] = eventName + ":" + fromName;
      to.trigger.apply(to, args);
    });
  }
}));
