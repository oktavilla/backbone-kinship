# backbone-kinship

A simple model for 1-N and 1-1 relations.

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
      "eatenBy": "horse
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
