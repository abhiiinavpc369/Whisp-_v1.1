const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const User = require('./models/User');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)

.then(() => console.log('Connected to seed')).catch(err => console.error(err));

const seedUsers = async () => {

  try {

    await User.deleteMany({}); // Clear existing users

    const users = [

      { userId: 'abhinavji', username: 'AbhinavJi', password: '1234' },

      { userId: 'shuklaji', username: 'ShuklaJi', password: '1234' },

      { userId: 'unknownmake', username: 'UnknownMake', password: '1234' }

    ];

    for (const userData of users) {

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = new User({

        ...userData,

        password: hashedPassword,

        profilePicture: '',

        bio: 'Default bio',

        status: 'Chilling',

        friends: []

      });

      await user.save();

      console.log(`User ${userData.userId} created`);

    }

    console.log('Users seeded successfully');

  } catch (err) {

    console.error('Error seeding users:', err);

  } finally {

    mongoose.connection.close();

  }

};

seedUsers();