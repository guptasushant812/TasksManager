const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://guptasushant812_db_user:3RUtrBrm6ihjc5Fz@tasksmanagerdb.ugak03t.mongodb.net/taskmanager?appName=TasksManagerDB').then(async () => {
  const db = mongoose.connection.useDb('taskmanager');
  const FollowUp = db.collection('followups');
  const count = await FollowUp.countDocuments();
  const docs = await FollowUp.find({}).sort({_id:-1}).limit(2).toArray();
  console.log('Total followups:', count);
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
});
