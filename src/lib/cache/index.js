const NodeCache = require("node-cache");

class IDSCache {
  constructor() {
    // Create cache with 24-hour TTL and automatic check every hour
    this.cache = new NodeCache({
      stdTTL: 86400, // 24 hours in seconds
      checkperiod: 3600, // Check every hour
    });

    this.todayKey = this.getTodayKey();
    this.initializeCache();
  }

  // Generate cache key based on current date (YYYY-MM-DD format)
  getTodayKey() {
    const today = new Date();
    return `ids_${today.toISOString().split("T")[0]}`;
  }

  // Check if we need to switch to a new day and clear old data
  initializeCache() {
    const currentTodayKey = this.getTodayKey();

    if (currentTodayKey !== this.todayKey) {
      // New day - clear all keys except today's
      this.clearOldDates();
      this.todayKey = currentTodayKey;
    }
  }

  // Add unique strings to today's cache
  addCache(strings) {
    this.initializeCache(); // Check if day changed

    if (!Array.isArray(strings)) {
      strings = [strings];
    }

    const currentStrings = this.getCache();
    const uniqueNewStrings = strings.filter(
      (str) => str && typeof str === "string" && !currentStrings.includes(str),
    );

    if (uniqueNewStrings.length > 0) {
      const updatedStrings = [...currentStrings, ...uniqueNewStrings];
      this.cache.set(this.todayKey, updatedStrings);
      return uniqueNewStrings.length;
    }

    return 0;
  }

  // Get all strings for today
  getCache() {
    this.initializeCache(); // Check if day changed
    return this.cache.get(this.todayKey) || [];
  }

  // Check if a string exists in today's cache
  hasString(string) {
    this.initializeCache(); // Check if day changed
    const todayStrings = this.getCache();
    return todayStrings.includes(string);
  }

  // Clear all cache entries except today's
  clearOldDates() {
    const keys = this.cache.keys();
    const currentKey = this.getTodayKey();

    keys.forEach((key) => {
      if (key !== currentKey) {
        this.cache.del(key);
      }
    });
  }

  // Get cache statistics
  getStats() {
    return {
      today: this.todayKey,
      stringCount: this.getCache().length,
      cacheSize: this.cache.keys().length,
      cacheStats: this.cache.getStats(),
    };
  }

  // Manual cleanup (optional - automatic should handle it)
  clearAllNow() {
    const keys = this.cache.keys();
    keys.forEach((key) => {
      this.cache.del(key);
    });
  }
}

// Usage example
module.exports = IDSCache;
