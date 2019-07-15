"use strict";
var assert = require("assert");
var Backbone = require("backbone");
var BackboneDespotism = require("../../backbone-kinship.js");

describe("Backbone Kinship", function() {
  var Fruit = Backbone.Model.extend({});
  var Fruits = Backbone.Collection.extend({
    model: Fruit
  });
  var Robot = Backbone.Model.extend({});

  var Model = Backbone.RelationalModel.extend({
    relations: {
      fruits: Fruits,
      robot: Robot
    }
  });

  it("Instantiates relations", function() {
    var model = new Model({
      "fruits": [
        {
          "type": "banana",
          "eatenBy": "monkey"
        },
        {
          "type": "apple",
          "eatenBy": "horse"
        }
      ],
      "robot": {
        "name": "Bender Rodriguez"
      }
    });
    assert.equal(model.fruits.length, 2, "Incorrect amount of models in collection");
    assert.equal(model.fruits.at(0).get("type"), "banana", "Related collection set incorrectly");
    assert.equal(model.robot.get("name"), "Bender Rodriguez", "Related model set incorrectly");
  });

  describe("Events are propagated", function() {
    var eventTriggered;
    var modelData = {
      "fruits": [
        {
          "type": "banana"
        }
      ],
      "robot": {
        "name": "Bender Rodriguez"
      }
    };

    beforeEach(function() {
      eventTriggered = false;
    });

    it("Triggers change for model relationship", function() {
      var model = new Model(modelData);
      model.on("change", function() { eventTriggered = true; });
      model.robot.set("name", "Bending Unit 22");
      assert.equal(eventTriggered, true);
    });

    it("Triggers change for collection relationship", function() {
      var model = new Model(modelData);
      model.on("change", function() { eventTriggered = true; });
      model.fruits.at(0).set("type", "orange");
      assert.equal(eventTriggered, true);
    });

    it("Triggers add for collection relationship", function() {
      var model = new Model(modelData);
      model.on("add:fruits", function() { eventTriggered = true; });
      model.fruits.add(new Fruit({
        "type": "orange"
      }));
      assert.equal(eventTriggered, true);
    });

    it("Triggers remove for collection relationship", function() {
      var model = new Model(modelData);
      model.on("remove:fruits", function() { eventTriggered = true; });
      model.fruits.pop();
      assert.equal(eventTriggered, true);
    });
  });
});
