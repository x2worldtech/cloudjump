import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

import AccessControl "mo:caffeineai-authorization/access-control";
import Migration "migration";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";

(with migration = Migration.run)
actor {

    var highScores = Map.empty<Text, Nat>();
    var userProgress = Map.empty<Principal, UserProgress>();
    var userProfiles = Map.empty<Principal, UserProfile>();

    // Global statistics variables
    var totalPlayers = 0;
    var totalJumps = 0;
    var totalGamesPlayed = 0;
    var totalHeightReached = 0;
    var globalStatsInitialized = false;

    // Track unique authenticated players
    var uniquePlayers = Map.empty<Principal, ()>();

    // Chat messages storage
    var chatMessages = List.empty<ChatMessage>();

    // Clan system
    var clans = Map.empty<Text, Clan>();
    var userClans = Map.empty<Principal, Text>();

    type UserProgress = {
        xp : Nat;
        level : Nat;
        highestHeight : Nat;
        clouds : Nat;
        prestige : Nat;
    };

    type UserProfile = {
        name : Text;
        joinedAt : Int;
    };

    type GlobalStatistics = {
        totalPlayers : Nat;
        totalJumps : Nat;
        totalGamesPlayed : Nat;
        totalHeightReached : Nat;
    };

    type ChatMessage = {
        sender : Principal;
        content : Text;
        timestamp : Int;
    };

    type Clan = {
        name : Text;
        owner : Principal;
        members : [Principal];
        totalHeight : Nat;
    };

    type LeaderboardEntry = {
        principal : Principal;
        highestScore : Nat;
        level : Nat;
        prestige : Nat;
    };

    type PlayerStats = {
        principal : Principal;
        xp : Nat;
        level : Nat;
        highestHeight : Nat;
        clouds : Nat;
        prestige : Nat;
        joinedAt : Int;
    };

    let accessControlState = AccessControl.initState();
    include MixinAuthorization(accessControlState);

    // Initialize access control - first caller becomes admin
    // Only authenticated users can initialize
    public shared ({ caller }) func initializeAccessControl() : async () {
        if (caller.isAnonymous()) {
            return;
        };

        AccessControl.initialize(accessControlState, caller);

        globalStatsInitialized := true;

        if (not uniquePlayers.containsKey(caller)) {
            uniquePlayers.add(caller, ());
            totalPlayers += 1;
        };

        switch (userProfiles.get(caller)) {
            case null {
                let newProfile : UserProfile = {
                    name = "";
                    joinedAt = Time.now();
                };
                userProfiles.add(caller, newProfile);
            };
            case (?profile) {
                if (profile.joinedAt == 0) {
                    let updatedProfile = {
                        profile with
                        joinedAt = Time.now();
                    };
                    userProfiles.add(caller, updatedProfile);
                };
            };
        };
    };

    // High scores can be viewed by anyone (including guests for leaderboard display)
    public query func getHighScores() : async [(Text, Nat)] {
        highScores.toArray();
    };

    // Only authenticated users can submit scores
    public shared ({ caller }) func submitScore(playerName : Text, score : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can submit scores");
        };

        highScores.add(playerName, score);
    };

    // Only authenticated users can submit progress (height-based XP)
    public shared ({ caller }) func submitProgress(height : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can submit progress");
        };

        if (not uniquePlayers.containsKey(caller)) {
            uniquePlayers.add(caller, ());
            totalPlayers += 1;
        };

        let currentProgress = switch (userProgress.get(caller)) {
            case null {
                {
                    xp = 0;
                    level = 1;
                    highestHeight = 0;
                    clouds = 0;
                    prestige = 0;
                };
            };
            case (?progress) { progress };
        };

        let newXp = currentProgress.xp + height;
        let newLevel = calculateLevel(newXp);
        let newHighestHeight = if (height > currentProgress.highestHeight) height else currentProgress.highestHeight;

        let totalHeight = currentProgress.xp + height;
        let newClouds = totalHeight / 2500;

        let newPrestige = calculatePrestige(newXp, newLevel);

        let updatedProgress = {
            xp = newXp;
            level = newLevel;
            highestHeight = newHighestHeight;
            clouds = newClouds;
            prestige = newPrestige;
        };

        userProgress.add(caller, updatedProgress);

        // Update clan height if user is in a clan
        switch (userClans.get(caller)) {
            case null {};
            case (?clanName) {
                switch (clans.get(clanName)) {
                    case null {};
                    case (?clan) {
                        let updatedTotalHeight = calculateClanTotalHeight(clan.members);
                        let updatedClan = {
                            clan with
                            totalHeight = updatedTotalHeight;
                        };
                        clans.add(clanName, updatedClan);
                    };
                };
            };
        };
    };

    // Only authenticated users can view their own progress
    public query ({ caller }) func getCallerProgress() : async ?UserProgress {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view progress");
        };

        userProgress.get(caller);
    };

    // Users can view their own progress, admins can view any user's progress
    public query ({ caller }) func getUserProgress(user : Principal) : async ?UserProgress {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Can only view your own progress or must be admin");
        };

        userProgress.get(user);
    };

    // Only authenticated users can view their own profile
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view profiles");
        };

        userProfiles.get(caller);
    };

    // Only authenticated users can save their profile
    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can save profiles");
        };

        if (not uniquePlayers.containsKey(caller)) {
            uniquePlayers.add(caller, ());
            totalPlayers += 1;
        };

        let profileWithJoinDate = if (profile.joinedAt == 0) {
            { profile with joinedAt = Time.now() };
        } else {
            profile;
        };

        userProfiles.add(caller, profileWithJoinDate);
    };

    // Authenticated users can view any user's profile (for Player Stats Modal)
    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view profiles");
        };

        userProfiles.get(user);
    };

    // Batch update global statistics - called at the end of each game session
    public shared ({ caller }) func updateGlobalStatistics(jumps : Nat, games : Nat, height : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can update global statistics");
        };

        totalJumps += jumps;
        totalGamesPlayed += games;
        totalHeightReached += height;
        globalStatsInitialized := true;
    };

    // Get global statistics - public read access for display on home page
    public query func getGlobalStatistics() : async GlobalStatistics {
        {
            totalPlayers;
            totalJumps;
            totalGamesPlayed;
            totalHeightReached;
        };
    };

    // Calculate level based on XP thresholds
    func calculateLevel(xp : Nat) : Nat {
        let xpThresholds : [Nat] = [
            0, 2000, 4500, 7500, 11000, 15000, 19500, 24500, 30000, 36000, 42500, 49500, 57000, 65000, 73500, 82500, 92000, 102000, 112500, 123500, 135000, 147000, 159500, 172500, 186000, 200000, 214500, 229500, 245000, 261000, 277500, 294500, 312000, 330000, 348500, 367500, 387000, 407000, 427500, 448500, 470000, 492000, 514500, 537500, 561000, 585000, 609500, 634500, 660000, 686000, 712500, 739500, 767000, 795000, 823500, 852500, 882000, 912000, 942500, 973500, 1005000, 1037000, 1069500, 1102500, 1136000, 1170000, 1204500, 1239500, 1275000, 1311000, 1347500, 1384500, 1422000, 1460000, 1498500, 1537500, 1577000, 1617000, 1657500, 1698500, 1740000, 1782000, 1824500, 1867500, 1911000, 1955000, 2000000, 2200000, 2400000, 2600000, 2800000, 3000000, 3200000, 3400000, 3600000, 3800000, 4000000,
        ];

        var level = 1;
        var i = 1;

        while (i < xpThresholds.size() and xp >= xpThresholds[i]) {
            level += 1;
            i += 1;
        };

        level;
    };

    // Calculate prestige based on XP and level
    func calculatePrestige(xp : Nat, level : Nat) : Nat {
        if (level < 100) return 0;

        let prestigeThresholds : [Nat] = [
            2000000,
            5000000,
            10000000,
            25000000,
            50000000,
            100000000,
            250000000,
            500000000,
            1000000000,
        ];

        var prestigeLevel = 1;
        var i = 0;

        while (i < prestigeThresholds.size() and xp >= prestigeThresholds[i]) {
            prestigeLevel += 1;
            i += 1;
        };

        if (prestigeLevel > 10) prestigeLevel := 10;

        prestigeLevel;
    };

    // Global Chat System

    // Send a chat message - only authenticated users can send messages
    public shared ({ caller }) func sendChatMessage(content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can send chat messages");
        };

        let message : ChatMessage = {
            sender = caller;
            content;
            timestamp = Time.now();
        };

        chatMessages.add(message);

        // Keep only last 50 messages
        if (chatMessages.size() > 50) {
            chatMessages.truncate(50);
        };
    };

    // Get recent chat messages - only authenticated users can view messages
    public query ({ caller }) func getRecentChatMessages() : async [ChatMessage] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view chat messages");
        };

        chatMessages.reverse().toArray();
    };

    // Clan System

    // Create a new clan - only authenticated users can create clans
    public shared ({ caller }) func createClan(clanName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can create clans");
        };

        if (clans.containsKey(clanName)) {
            Runtime.trap("Clan name already exists");
        };

        if (userClans.containsKey(caller)) {
            Runtime.trap("User is already in a clan");
        };

        let newClan : Clan = {
            name = clanName;
            owner = caller;
            members = [caller];
            totalHeight = 0;
        };

        clans.add(clanName, newClan);
        userClans.add(caller, clanName);
    };

    // Join an existing clan - only authenticated users can join clans
    public shared ({ caller }) func joinClan(clanName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can join clans");
        };

        if (userClans.containsKey(caller)) {
            Runtime.trap("User is already in a clan");
        };

        switch (clans.get(clanName)) {
            case null {
                Runtime.trap("Clan not found");
            };
            case (?clan) {
                if (clan.members.size() >= 50) {
                    Runtime.trap("Clan is full");
                };

                let updatedMembers = clan.members.concat([caller]);
                let updatedClan = {
                    clan with
                    members = updatedMembers;
                };

                clans.add(clanName, updatedClan);
                userClans.add(caller, clanName);
            };
        };
    };

    // Leave a clan - only authenticated users can leave clans
    public shared ({ caller }) func leaveClan() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can leave clans");
        };

        switch (userClans.get(caller)) {
            case null {
                Runtime.trap("User is not in a clan");
            };
            case (?clanName) {
                switch (clans.get(clanName)) {
                    case null {
                        Runtime.trap("Clan not found");
                    };
                    case (?clan) {
                        let updatedMembers = clan.members.filter(
                            func(member : Principal) : Bool { member != caller }
                        );

                        if (updatedMembers.size() == 0) {
                            clans.remove(clanName);
                        } else {
                            let updatedClan = {
                                clan with
                                members = updatedMembers;
                            };
                            clans.add(clanName, updatedClan);
                        };

                        userClans.remove(caller);
                    };
                };
            };
        };
    };

    // Get clan info - only authenticated users can view clan information
    public query ({ caller }) func getClanInfo(clanName : Text) : async ?Clan {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view clan information");
        };

        clans.get(clanName);
    };

    // Get user's clan info - only authenticated users can view their own clan
    public query ({ caller }) func getCallerClanInfo() : async ?Clan {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view clan info");
        };

        switch (userClans.get(caller)) {
            case null { null };
            case (?clanName) {
                clans.get(clanName);
            };
        };
    };

    // Get global clan leaderboard - only authenticated users can view
    public query ({ caller }) func getClanLeaderboard() : async [Clan] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view clan leaderboard");
        };

        let clansArray = clans.values().toArray();
        clansArray.sort(
            func(a : Clan, b : Clan) : { #less; #equal; #greater } {
                if (a.totalHeight > b.totalHeight) { #less } else if (a.totalHeight < b.totalHeight) {
                    #greater;
                } else { #equal };
            }
        );
    };

    // Helper function to calculate total height of clan members
    func calculateClanTotalHeight(members : [Principal]) : Nat {
        var totalHeight = 0;
        for (member in members.values()) {
            switch (userProgress.get(member)) {
                case null {};
                case (?progress) {
                    totalHeight += progress.highestHeight;
                };
            };
        };
        totalHeight;
    };

    // Global Leaderboard - Public Access
    public query func getGlobalLeaderboard() : async [LeaderboardEntry] {
        let progressEntries = userProgress.entries().toArray();

        let leaderboardEntries = progressEntries.map(
            func((principal, progress)) {
                {
                    principal;
                    highestScore = progress.highestHeight;
                    level = progress.level;
                    prestige = progress.prestige;
                };
            }
        );

        leaderboardEntries.sort(
            func(a : LeaderboardEntry, b : LeaderboardEntry) : { #less; #equal; #greater } {
                if (a.highestScore > b.highestScore) { #less } else if (a.highestScore < b.highestScore) {
                    #greater;
                } else { #equal };
            }
        );
    };

    // Player Statistics - Only authenticated users can view player stats
    public query ({ caller }) func getPlayerStats(principal : Principal) : async ?PlayerStats {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can view player statistics");
        };

        let progress = userProgress.get(principal);
        let profile = userProfiles.get(principal);

        switch (progress, profile) {
            case (?prog, ?prof) {
                ?{
                    principal;
                    xp = prog.xp;
                    level = prog.level;
                    highestHeight = prog.highestHeight;
                    clouds = prog.clouds;
                    prestige = prog.prestige;
                    joinedAt = prof.joinedAt;
                };
            };
            case (?prog, null) {
                ?{
                    principal;
                    xp = prog.xp;
                    level = prog.level;
                    highestHeight = prog.highestHeight;
                    clouds = prog.clouds;
                    prestige = prog.prestige;
                    joinedAt = 0;
                };
            };
            case (null, ?prof) {
                ?{
                    principal;
                    xp = 0;
                    level = 1;
                    highestHeight = 0;
                    clouds = 0;
                    prestige = 0;
                    joinedAt = prof.joinedAt;
                };
            };
            case (null, null) {
                null;
            };
        };
    };
};
