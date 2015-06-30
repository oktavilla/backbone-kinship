/**
* A simple model for 1-N and 1-1 relations.
* Relations are set up like
* relations: {
*   my-first-relation: MyCollection,
*   my-other-relation: MyModel
* }
* After that the related collection/model instances are available both directly on the
* model (Model.my-first-relation) and by using Model.get (Model.get("my-first-relation")).
* Note that relations are undefined until they have been assigned a value.
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
} (this, function(exports, Backbone, _) {

  // Temporary data per model
  var settingData = {};
  
  Backbone.RelationalModel = Backbone.Model.extend({
    relations: {},
    
    /**
    * Overrides standard Backbone functionality
    */
    get: function(key) {
      return this.relations[key] ? this[key] : Backbone.Model.prototype.get.call(this, key);
    },

    /**
    * Overrides standard Backbone functionality
    */
    set: function(key, value, options) {
      var changeWasTriggered = false;
      var attributes, isCloned, delayedEvents;
      // Initializing setting
      isSetting(this, true);
      // Handling the two function signatures, either key-value or attribute object
      if (_.isObject(key)) {
        attributes = key;
        options = value;
      } else {
        (attributes = {})[key] = value;
      }
      // Initializing relational functionality (if it's not already done)
      if (!this._attributes) {
        // Setting up internal getter and setter for attributes to keep it clean
        // from the actual releated models and collections
        this._attributes = _.clone(this.attributes);
        Object.defineProperty(this, "attributes", {
          configurable: true,
          enumerable: true,
          get: function () {
            return getAttributes(this);
          },
          set: function(value) {
            return setAttributes(this, value);
          }
        });
      }
      // Checking if any relations are among the attributes
      _.each(this.relations, function(constructor, name) {
        var setMethod = "set";
        var entity;
        // Making sure that this relation is set up
        if (!this[name]) {
          // Setting up new relation
          entity = new constructor();
          // Only collections can be set up without data
          if (typeof attributes[name] !== "undefined" || entity instanceof Backbone.Collection) {
            this[name] = entity;
            // Setting up dispatcher for relational events, for example that "add" on a relation called "collection" would trigger the event "collection:add" on this model
            delegateEvents(this[name], this, name);
          }
        }
        // Checking if there is data for this relation
        if (typeof attributes[name] !== "undefined") {
          // Switching to reset if required (and possible)
          if (options && options.reset && this[name].reset) {
            setMethod = "reset";
          }
          // Handling both key-value and attribute signatures
          if (_.isObject(attributes[name])) {
            this[name][setMethod](attributes[name], options);
          } else {
            this[name][setMethod](attributes[name], attributes[name].value, options);
          }
          // Removing relational data so it isn't also set on the model
          if (key[name]) {
             // Cloning to avoid affecting other users of this object (but we don't want to clone it more than once because performace)
            if (!isCloned) {
              key = _.clone(key);
              isCloned = true;
            }
            delete key[name]; // Deleting from attribute object
          } else {
            key = null;
          }
        }
      }, this);
      // Setting standard attributes the normal way
      if (key) {
        // Listening for change events from the attributes
        this.on("change", function () { changeWasTriggered = true; }, "relational");
        Backbone.Model.prototype.set.call(this, key, value, options);
        this.off("change", null, "relational");
      }
      // Triggering delayed events from the relations
      delayedEvents = getDelayedEvents(this);
      if (delayedEvents) {
        for (var i = 0, ln = delayedEvents.length; i < ln; i++) {
          this.trigger.apply(this, delayedEvents[i]);
        }
        // No change event from the standard attributes - let's trigger one ourselves
        if (!changeWasTriggered) {
          this.trigger("change", [this]);
        }
      }
      // Cleaning up
      clearSettingData(this);
      return this;
    }
  });
  
  /**
  * Returns kinship data for a model
  * @param model A Backbone-kinship model
  * @param key The key where the data is stored
  * @return Stored data
  */
  function getSettingData(model, key) {
    return settingData[model.cid] ? settingData[model.cid][key] : null;
  }
  
  /**
  * Stores kinship data for a model
  * @param model A Backbone-kinship model
  * @param key The key to store data at
  * @param value The data to store
  */
  function setSettingData(model, key, value) {
    if (!settingData[model.cid]) {
      settingData[model.cid] = {};
    }
    settingData[model.cid][key] = value;
  }
  
  /**
  * Clears kinship data
  * @param model A Backbone-kinship model
  */
  function clearSettingData(model) {
    delete settingData[model.cid];
  }

  /**
  * Returns all attributes for a model
  * Relational attributes will be JSONified
  * @param model A Backbone-kinship model
  * @return Model attributes
  */
  function getAttributes(model) {
    var attributes = model._attributes;
    // Adding expanded json data from all relations
    _.each(model.relations, function(constructor, name) {
      if (model[name]) {
        attributes[name] = model[name].toJSON();
      }
    });
    return attributes;
  }
  
  /**
  * Sets attributes to a model
  * @param model A Backbone-kinship model
  * @param value The value to set
  */
  function setAttributes(model, value) {
    model._attributes = value;
  }
  
  /**
  * Adds a delayed event to a model
  * @param model A Backbone-kinship model
  * @param args Event arguments
  */
  function addDelayedEvent(model, args) {
    var delayedEvents = getSettingData(model, "delayedEvents") || {};
    delayedEvents[args[0]] = args; // Storing them this way to avoid duplicates
    setSettingData(model, "delayedEvents", delayedEvents);
  }
  
  /**
  * Returns all delayed events for a model
  * @param model A Backbone-kinship model
  * @return An array of event arguments
  */
  function getDelayedEvents(model) {
    return _.values(getSettingData(model, "delayedEvents") || {});
  }
  
  /**
  * Either returns or sets whether a model is setting data or not
  * @param model A Backbone-kinshop model
  * @param value If the model is setting or not (optional)
  * @return True or false
  */
  function isSetting(model, value) {
    if (typeof value !== "undefined") {
      setSettingData(model, "isSetting", value);
    }
    return !!getSettingData(model, "isSetting");
  }
  
  /*
  * Delegates all events from one entity to another, on the format
  * eventName:fromName. A "change" event will also be triggered for "add", "remove",
  * "change" and "reset" events.
  * @param relation The entity that emits the event
  * @param model The entity that should receive the event
  * @param relationName Display name to use to show where this event originated
  */
  function delegateEvents(relation, model, relationName) {
    relation.bind("all", function () {
      var args = _.toArray(arguments); // Cloning
      var eventName = args[0];
      var colonIndex = eventName.indexOf(":");
      var eventType = colonIndex >= 0 ? eventName.substring(0, colonIndex) : eventName;
      args[0] = eventName + ":" + relationName;
      // Triggering events (change events are handled below)
      if (eventType !== "change") {
        model.trigger.apply(model, args);
      }
      // Triggering change events on the model
      if (eventType === "change" || eventType === "update" || eventType === "reset") {
        args[0] = "change:" + relationName;
        args[1] = model; // Change events are triggered on model
        if (isSetting(model)) {
          // Delaying change events until _all_ model changes have been made
          addDelayedEvent(model, args);
        } else {
          // We should be done - triggering right away
          model.trigger.apply(model, args);
          // Since we're not relying on the model to handle this we have to trigger our own change event
          model.trigger("change", [model]);
        }
      }
    });
  }
}));
