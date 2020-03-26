var objectMapper = require('object-mapper');

var map = {
  "foo": [
    {
      key: "foo",
      transform: function (value) { 
        return value + "_foo";
      }
    },
    {
      key: "baz",
      transform: function (value) {
        return value + "_baz";
      }
    }
  ],
  "sku": "baz.cool",
};

var src = {
	foo: 'blah',
    bar: 'something',
    baz: {
        cool: [
            'beans',
            'rice'
        ]
    }
};

var src = {
    "sku": "12345",
    "upc": "99999912345X",
    "title": "Test Item",
    "description": "Description of test item",
    "length": 5,
    "width": 2,
    "height": 8,
    "inventory": {
      "onHandQty": 12
    }
  };
  
  var map = {
    "sku": "Envelope.Request.Item.SKU",
    "upc": "Envelope.Request.Item.UPC",
    "title": "Envelope.Request.Item.ShortTitle",
    "description": "Envelope.Request.Item.ShortDescription",
    "length": "Envelope.Request.Item.Dimensions.Length",
    "width": "Envelope.Request.Item.Dimensions.Width",
    "height": "Envelope.Request.Item.Dimensions.Height",
    "inventory.onHandQty": "Envelope.Request.Item.Inventory"
  };
  
  
var dest = objectMapper(src, map);
console.log(JSON.stringify(dest, null, 4));