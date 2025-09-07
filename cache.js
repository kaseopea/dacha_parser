const userCache = require("./src/lib/cache/user-cache");

const main = async () => {
  userCache.addUserStrings("user123", ["apple", "banana", "cherry"]);
  userCache.addUserStrings("user123", "apple"); // Duplicate - won't be added
  userCache.addUserStrings("user123", "date"); // New string

  // User 2 adds strings
  userCache.addUserStrings("user456", ["xbox", "playstation", "nintendo"]);
  userCache.addUserStrings("user456", "xbox"); // Duplicate
  userCache.addUserStrings("user456", "pc"); // New string

  // Get user-specific data
  console.log("User 123 strings:", userCache.getUserStrings("user123"));
  console.log("User 456 strings:", userCache.getUserStrings("user456"));

  // Check if users have specific strings
  console.log(
    'User 123 has "apple":',
    userCache.userHasString("user123", "apple"),
  );
  console.log(
    'User 456 has "apple":',
    userCache.userHasString("user456", "apple"),
  );

  // Get user statistics
  console.log("User 123 stats:", userCache.getUserStats("user123"));
  console.log("User 456 stats:", userCache.getUserStats("user456"));

  // Get global statistics
  console.log("Global stats:", userCache.getGlobalStats());

  // Get all user IDs
  console.log("All user IDs:", userCache.getAllUserIds());

  // Clear specific user data
  userCache.clearUserData("user123");
  console.log("After clearing user123:", userCache.getUserStats("user123"));
};

main();
