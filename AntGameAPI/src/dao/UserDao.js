const { TryParseObjectID } = require("./helpers");
const Connection = require("./MongoClient");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

// const isUserBanned = async id => {
//   const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

//   const collection = await getCollection("users");
//   const result = await collection.findOne({ _id: userObjectID }, { projection: { banned: 1 } });

//   if (!result) return true;
//   return result.banned;
// };

// const isUserAdmin = async id => {
//   const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

//   const collection = await getCollection("users");
//   const result = await collection.findOne({ _id: userObjectID }, { projection: { admin: 1 } });

//   if (!result) return false;
//   return result.admin;
// };

// const getUsernameByID = async id => {
//   const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

//   const collection = await getCollection("users");
//   const result = await collection.findOne({ _id: userObjectID }, { projection: { username: 1 } });
//   return result.username;
// };

const shouldShowUserOnLeaderboard = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID },
    { projection: { showOnLeaderboard: 1 } }
  );

  if (result.showOnLeaderboard === true) return true;
  return false;
};

const getUserBadgesByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne({ _id: userObjectID }, { projection: { badges: 1 } });
  if (!result || !result.badges) return [];
  else
    return result.badges.map(badge => {
      return {
        name: badge.name,
        color: badge.color,
        icon: badge.icon,
        backgroundColor: badge.backgroundColor,
        value: badge.value,
      };
    });
};

const getUserDetailsByUsername = async username => {
  const collection = await getCollection("users");
  const result = await collection.findOne(
    { username_lower: username },
    { projection: { _id: 1, username: 1, "registrationData.date": 1, badges: 1 } }
  );

  if (!result) return null;
  const toReturn = {
    _id: result._id,
    username: result.username,
    badges: result.badges,
  };
  if (result.registrationData) toReturn.joinDate = result.registrationData.date;
  else toReturn.joinDate = false;
  return toReturn;
};

const addBadgeToUser = async (userID, badgeData) => {
  const userObjectID = TryParseObjectID(userID, "UserID", "UserDao");

  const collection = await getCollection("users");
  await collection.updateOne(
    { _id: userObjectID },
    {
      $push: {
        badges: {
          ...badgeData,
        },
      },
    }
  );
};

module.exports = {
  isUserBanned,
  isUserAdmin,
  getUsernameByID,
  shouldShowUserOnLeaderboard,
  getUserBadgesByID,
  addBadgeToUser,
  getUserDetailsByUsername,
};
