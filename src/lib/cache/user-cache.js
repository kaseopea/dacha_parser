const NodeCache = require("node-cache");

class UserCache {
  constructor() {
    if (UserCache.instance) {
      return UserCache.instance;
    }
    // Create main cache with 24-hour TTL and automatic check every hour
    this.cache = new NodeCache({
      stdTTL: 86400, // 24 hours in seconds
      checkperiod: 86400, // Check every hour
    });
    UserCache.instance = this;
  }

  // Generate cache key for a specific user and date
  getUserDateKey(userId, date = null) {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split("T")[0];
    return `user_${userId}_${dateStr}`;
  }

  // Get today's key for a user
  getUserTodayKey(userId) {
    return this.getUserDateKey(userId);
  }

  // Check if we need to switch to a new day for a user
  initializeUserCache(userId) {
    const currentKey = this.getUserTodayKey(userId);
    const userKeys = this.getUserKeys(userId);

    // Check if any keys exist for this user that aren't today's key
    const oldKeys = userKeys.filter((key) => key !== currentKey);

    if (oldKeys.length > 0) {
      // Clear old dates for this user
      this.cache.del(oldKeys);
    }

    return currentKey;
  }

  // Get all cache keys for a specific user
  getUserKeys(userId) {
    const allKeys = this.cache.keys();
    return allKeys.filter((key) => key.startsWith(`user_${userId}_`));
  }

  // Add unique strings to today's cache for a specific user
  addUserStrings(userId, strings) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userKey = this.initializeUserCache(userId);

    if (!Array.isArray(strings)) {
      strings = [strings];
    }

    const currentStrings = this.getUserStrings(userId) || [];
    const uniqueNewStrings = strings.filter(
      (str) => str && typeof str === "string" && !currentStrings.includes(str),
    );

    if (uniqueNewStrings.length > 0) {
      const updatedStrings = [...currentStrings, ...uniqueNewStrings];
      this.cache.set(userKey, updatedStrings);
      return uniqueNewStrings.length;
    }

    return 0;
  }

  // Get all strings for today for a specific user
  getUserStrings(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userKey = this.getUserTodayKey(userId);
    return this.cache.get(userKey) || [];
  }

  // Check if a string exists in today's cache for a specific user
  userHasString(userId, string) {
    const userStrings = this.getUserStrings(userId);
    return userStrings.includes(string);
  }

  // Get strings for a specific user and date (for debugging/history)
  getUserStringsByDate(userId, dateString) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const date = new Date(dateString);
      const userKey = this.getUserDateKey(userId, date);
      return this.cache.get(userKey) || [];
    } catch (error) {
      throw new Error("Invalid date format");
    }
  }

  // Clear all cache entries for a specific user
  clearUserData(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userKeys = this.getUserKeys(userId);
    this.cache.del(userKeys);
    return userKeys.length;
  }

  // Clear old dates for all users (maintenance)
  cleanupAllUsers() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const allKeys = this.cache.keys();

    const oldKeys = allKeys.filter((key) => {
      // Extract date from key (user_123_2023-12-25)
      const keyParts = key.split("_");
      if (keyParts.length >= 3) {
        const keyDate = keyParts.slice(2).join("_"); // Handle dates with underscores
        return keyDate !== todayStr;
      }
      return false;
    });

    if (oldKeys.length > 0) {
      this.cache.del(oldKeys);
    }

    return oldKeys.length;
  }

  // Get cache statistics for a specific user
  getUserStats(userId) {
    const userKeys = this.getUserKeys(userId);
    const todayStrings = this.getUserStrings(userId);

    return {
      userId: userId,
      todayKey: this.getUserTodayKey(userId),
      todayStringCount: todayStrings.length,
      totalCacheEntries: userKeys.length,
      allUserKeys: userKeys,
    };
  }

  // Get global cache statistics
  getGlobalStats() {
    const allKeys = this.cache.keys();
    const userMap = new Map();

    // Count entries per user
    allKeys.forEach((key) => {
      const parts = key.split("_");
      if (parts.length >= 2) {
        const userId = parts[1];
        userMap.set(userId, (userMap.get(userId) || 0) + 1);
      }
    });

    return {
      totalEntries: allKeys.length,
      totalUsers: userMap.size,
      entriesPerUser: Object.fromEntries(userMap),
      cacheStats: this.cache.getStats(),
    };
  }

  // Get all user IDs currently in cache
  getAllUserIds() {
    const allKeys = this.cache.keys();
    const userIds = new Set();

    allKeys.forEach((key) => {
      const parts = key.split("_");
      if (parts.length >= 2) {
        userIds.add(parts[1]);
      }
    });

    return Array.from(userIds);
  }
}

const userCache = new UserCache();
Object.freeze(userCache);

module.exports = userCache;
