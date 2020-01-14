Meteor.methods({
  connectDB: function(dataUrl) {
    conn = new MongoInternals.RemoteCollectionDriver(dataUrl);
    return conn;
  }
})