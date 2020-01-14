/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/setProductPriceLevelType.js')
 */

function initialize() {
  print("Adding price level type into products collection");

  db.categories.find({}, {_id: 1, priceLevelType: 1}).forEach(function(x){
    db.products.update({ categoryId: x._id}, {$set: { priceLevelType: x.priceLevelType}}, { multi: true });
  })
  print(`  ${db.products.find({"priceLevelType": "manual"}).count()} Products updated with price level type`);

  print("Updating products with specific ids to \'manual\' regardless of whatever in it\'s parent category'");
  db.products.update({
    _id: {
      $in: [
        "Y69mpKnjOzhE8zUrh",
        "BjUw3ec6cZPIP4hBq",
        "fcGRddrje3zergfsi",
        "qiZyyuwLtEiEOduUF",
        "QMuIGdlylxwV0Sl2f",
        "IBWSalS3UI4t0RGON"
      ]
    }
  }, {
    $set: {
      priceLevelType: "manual"
    }
  }, {
    multi: true
  });

}

initialize();