# Backbone-kinship

A simple model for 1-1 and 1-N relations. No shared instances, clever data pooling or reversed relations. It's really just a way to expand nested data into models and collections.

Also, events are propagated from their relationships as `eventName:relationshipName’.

## Create a model with relations

``` javascript
var Fruits = Backbone.Collection.extend({});
var Robot = Backbone.Model.extend({});

var MyRelationalModel = Backbone.RelationalModel.extend({
  relations: {
    myFirstRelation: Fruits,
    myOtherRelation: Robot
  }
});

var myRelationalModelInstance = new MyRelationalModel({
  "myFirstRelation": [
    {
      "type": "banana",
      "eatenBy": "monkey"
    },
    {
      "type": "apple",
      "eatenBy": "horse"
    }
  ],
  "myOtherRelation": {
    "name": "Bender Rodriguez"
  }
});
```

You can then access the related models and collections by `get`ting them like so:
``` javascript
console.log(myRelationalModelInstance.get("myFirstRelation").at(0).get("type"));
>> "banana"

console.log(myRelationalModelInstance.get("myOtherRelation").get("name"));
>> "Bender Rodriguez"
```

... or alternatively:
``` javascript
console.log(myRelationalModelInstance.myOtherRelation.get("name"));
>> "Bender Rodriguez"
```

Triggering an `add` event on myFirstRelation will also trigger an event on myRelationalModelInstance:
``` javascript
myRelationalModelInstance.on("add", function(e) {
  console.log(e);
});
myRelationalModelInstance.get("myFirstRelation").add({
  type: "bamboo",
  eatenBy: "panda"
});
>> "add:myFirstRelation"
```
----
Backbone-kinship is released under the MIT license.
Contributors: https://github.com/Oktavilla/backbone-kinship/contributors
