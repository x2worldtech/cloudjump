import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import List "mo:base/List";
import Array "mo:base/Array";
import Int "mo:base/Int";

import AccessControl "authorization/access-control";

persistent actor {
    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

    var highScores = textMap.empty<Nat>();
    var userProgress = principalMap.empty<UserProgress>();
    var userProfiles = principalMap.empty<UserProfile>();

    // Global statistics variables
    var totalPlayers = 0;
    var totalJumps = 0;
    var totalGamesPlayed = 0;
    var totalHeightReached = 0;
    var globalStatsInitialized = false;

    // Map to track unique authenticated players (simulating a set)
    var uniquePlayers = principalMap.empty<()>();

    // Chat messages storage
    var chatMessages : List.List<ChatMessage> = List.nil<ChatMessage>();

    // Clan system
    var clans = textMap.empty<Clan>();
    var userClans = principalMap.empty<Text>();

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

    // Initialize access control - first caller becomes admin, increments player count
    // Only authenticated users can initialize
    public shared ({ caller }) func initializeAccessControl() : async () {
        // Anonymous users cannot initialize access control
        if (Principal.isAnonymous(caller)) {
            return; // Silently return without initializing
        };

        AccessControl.initialize(accessControlState, caller);

        // Set global stats as initialized
        globalStatsInitialized := true;

        // Only add to totalPlayers if the caller is not already in the map
        if (not principalMap.contains(uniquePlayers, caller)) {
            uniquePlayers := principalMap.put(uniquePlayers, caller, ());
            totalPlayers += 1;
        };

        // Set join date for new users
        switch (principalMap.get(userProfiles, caller)) {
            case null {
                let newProfile : UserProfile = {
                    name = "";
                    joinedAt = Time.now();
                };
                userProfiles := principalMap.put(userProfiles, caller, newProfile);
            };
            case (?profile) {
                if (profile.joinedAt == 0) {
                    let updatedProfile = {
                        profile with
                        joinedAt = Time.now();
                    };
                    userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
                };
            };
        };
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        // Admin-only check happens inside AccessControl.assignRole
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    // High scores can be viewed by anyone (including guests for leaderboard display)
    public query func getHighScores() : async [(Text, Nat)] {
        // No authorization check - public access for leaderboard display
        Iter.toArray(textMap.entries(highScores));
    };

    // Only authenticated users can submit scores
    public shared ({ caller }) func submitScore(playerName : Text, score : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can submit scores");
        };

        highScores := textMap.put(highScores, playerName, score);
    };

    // Only authenticated users can submit progress (height-based XP)
    public shared ({ caller }) func submitProgress(height : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can submit progress");
        };

        // Track unique authenticated players for totalPlayers count
        if (not principalMap.contains(uniquePlayers, caller)) {
            uniquePlayers := principalMap.put(uniquePlayers, caller, ());
            totalPlayers += 1;
        };

        let currentProgress = switch (principalMap.get(userProgress, caller)) {
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

        // Height directly determines XP gained (1 height unit = 1 XP)
        let newXp = currentProgress.xp + height;
        let newLevel = calculateLevel(newXp);
        let newHighestHeight = if (height > currentProgress.highestHeight) height else currentProgress.highestHeight;

        // Calculate Clouds based on cumulative height (1 Cloud per 2500 height points)
        let totalHeight = currentProgress.xp + height;
        let newClouds = totalHeight / 2500;

        // Calculate Prestige based on XP and level
        let newPrestige = calculatePrestige(newXp, newLevel);

        let updatedProgress = {
            xp = newXp;
            level = newLevel;
            highestHeight = newHighestHeight;
            clouds = newClouds;
            prestige = newPrestige;
        };

        userProgress := principalMap.put(userProgress, caller, updatedProgress);

        // Update clan height if user is in a clan
        switch (principalMap.get(userClans, caller)) {
            case null {};
            case (?clanName) {
                switch (textMap.get(clans, clanName)) {
                    case null {};
                    case (?clan) {
                        let updatedMembers = clan.members;
                        let updatedTotalHeight = calculateClanTotalHeight(updatedMembers);
                        let updatedClan = {
                            clan with
                            totalHeight = updatedTotalHeight;
                        };
                        clans := textMap.put(clans, clanName, updatedClan);
                    };
                };
            };
        };
    };

    // Only authenticated users can view their own progress
    public query ({ caller }) func getCallerProgress() : async ?UserProgress {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view progress");
        };

        principalMap.get(userProgress, caller);
    };

    // Users can view their own progress, admins can view any user's progress
    public query ({ caller }) func getUserProgress(user : Principal) : async ?UserProgress {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own progress or must be admin");
        };

        principalMap.get(userProgress, user);
    };

    // Only authenticated users can view their own profile
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view profiles");
        };

        principalMap.get(userProfiles, caller);
    };

    // Only authenticated users can save their profile
    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save profiles");
        };

        // Track unique authenticated players for totalPlayers count
        if (not principalMap.contains(uniquePlayers, caller)) {
            uniquePlayers := principalMap.put(uniquePlayers, caller, ());
            totalPlayers += 1;
        };

        // Set join date if not already set
        let profileWithJoinDate = if (profile.joinedAt == 0) {
            { profile with joinedAt = Time.now() };
        } else {
            profile;
        };

        userProfiles := principalMap.put(userProfiles, caller, profileWithJoinDate);
    };

    // Authenticated users can view any user's profile (for Player Stats Modal)
    // This is used in Chat, Clan, and Leaderboard modals to display player information
    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view profiles");
        };

        principalMap.get(userProfiles, user);
    };

    // Global statistics methods

    // Batch update global statistics - called at the end of each game session
    // Only authenticated users can update global statistics to prevent abuse
    public shared ({ caller }) func updateGlobalStatistics(jumps : Nat, games : Nat, height : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update global statistics");
        };

        totalJumps += jumps;
        totalGamesPlayed += games;
        totalHeightReached += height;
        globalStatsInitialized := true;
    };

    // Get global statistics - public read access for display on home page
    // Accessible by everyone including guests
    // Returns default values if not initialized to prevent blocking the UI
    public query func getGlobalStatistics() : async GlobalStatistics {
        // No authorization check - public statistics visible to everyone including guests

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
            Debug.trap("Unauthorized: Only authenticated users can send chat messages");
        };

        let message : ChatMessage = {
            sender = caller;
            content;
            timestamp = Time.now();
        };

        chatMessages := List.push(message, chatMessages);

        if (List.size(chatMessages) > 50) {
            chatMessages := List.take(chatMessages, 50);
        };
    };

    // Get recent chat messages - only authenticated users can view messages
    public query ({ caller }) func getRecentChatMessages() : async [ChatMessage] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view chat messages");
        };

        let messagesArray = List.toArray(chatMessages);
        Array.reverse(messagesArray);
    };

    // Clan System

    // Create a new clan - only authenticated users can create clans
    public shared ({ caller }) func createClan(clanName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can create clans");
        };

        if (textMap.contains(clans, clanName)) {
            Debug.trap("Clan name already exists");
        };

        if (principalMap.contains(userClans, caller)) {
            Debug.trap("User is already in a clan");
        };

        let newClan : Clan = {
            name = clanName;
            owner = caller;
            members = [caller];
            totalHeight = 0;
        };

        clans := textMap.put(clans, clanName, newClan);
        userClans := principalMap.put(userClans, caller, clanName);
    };

    // Join an existing clan - only authenticated users can join clans
    public shared ({ caller }) func joinClan(clanName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can join clans");
        };

        if (principalMap.contains(userClans, caller)) {
            Debug.trap("User is already in a clan");
        };

        switch (textMap.get(clans, clanName)) {
            case null {
                Debug.trap("Clan not found");
            };
            case (?clan) {
                if (clan.members.size() >= 50) {
                    Debug.trap("Clan is full");
                };

                let updatedMembers = Array.append(clan.members, [caller]);
                let updatedClan = {
                    clan with
                    members = updatedMembers;
                };

                clans := textMap.put(clans, clanName, updatedClan);
                userClans := principalMap.put(userClans, caller, clanName);
            };
        };
    };

    // Leave a clan - only authenticated users can leave clans
    public shared ({ caller }) func leaveClan() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can leave clans");
        };

        switch (principalMap.get(userClans, caller)) {
            case null {
                Debug.trap("User is not in a clan");
            };
            case (?clanName) {
                switch (textMap.get(clans, clanName)) {
                    case null {
                        Debug.trap("Clan not found");
                    };
                    case (?clan) {
                        let updatedMembers = Array.filter<Principal>(
                            clan.members,
                            func(member) { member != caller },
                        );

                        if (updatedMembers.size() == 0) {
                            clans := textMap.delete(clans, clanName);
                        } else {
                            let updatedClan = {
                                clan with
                                members = updatedMembers;
                            };
                            clans := textMap.put(clans, clanName, updatedClan);
                        };

                        userClans := principalMap.delete(userClans, caller);
                    };
                };
            };
        };
    };

    // Get clan info - only authenticated users can view clan information
    // Clan features are "Authenticated Users Only" per specification
    public query ({ caller }) func getClanInfo(clanName : Text) : async ?Clan {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view clan information");
        };

        textMap.get(clans, clanName);
    };

    // Get user's clan info - only authenticated users can view their own clan
    public query ({ caller }) func getCallerClanInfo() : async ?Clan {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view clan info");
        };

        switch (principalMap.get(userClans, caller)) {
            case null { null };
            case (?clanName) {
                textMap.get(clans, clanName);
            };
        };
    };

    // Get global clan leaderboard - only authenticated users can view
    // Clan features are "Authenticated Users Only" per specification
    public query ({ caller }) func getClanLeaderboard() : async [Clan] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view clan leaderboard");
        };

        let clansArray = Iter.toArray(textMap.vals(clans));
        Array.sort<Clan>(
            clansArray,
            func(a, b) {
                if (a.totalHeight > b.totalHeight) { #less } else if (a.totalHeight < b.totalHeight) {
                    #greater;
                } else { #equal };
            },
        );
    };

    // Helper function to calculate total height of clan members
    func calculateClanTotalHeight(members : [Principal]) : Nat {
        var totalHeight = 0;
        for (member in members.vals()) {
            switch (principalMap.get(userProgress, member)) {
                case null {};
                case (?progress) {
                    totalHeight += progress.highestHeight;
                };
            };
        };
        totalHeight;
    };

    // Global Leaderboard - Public Access
    // Per specification: "Global leaderboard displays all Internet Identity users...
    // visible across all canister instances" - accessible to everyone including guests
    public query func getGlobalLeaderboard() : async [LeaderboardEntry] {
        // No authorization check - public access for global leaderboard display

        let progressEntries = Iter.toArray(principalMap.entries(userProgress));

        let leaderboardEntries = Array.map<(Principal, UserProgress), LeaderboardEntry>(
            progressEntries,
            func((principal, progress)) {
                {
                    principal;
                    highestScore = progress.highestHeight;
                    level = progress.level;
                    prestige = progress.prestige;
                };
            },
        );

        Array.sort<LeaderboardEntry>(
            leaderboardEntries,
            func(a, b) {
                if (a.highestScore > b.highestScore) { #less } else if (a.highestScore < b.highestScore) {
                    #greater;
                } else { #equal };
            },
        );
    };

    // Player Statistics - Only authenticated users can view player stats
    // This is accessed from Chat, Clan, and Leaderboard modals which are all authenticated-only
    // Returns combined progress and profile data including join date
    public query ({ caller }) func getPlayerStats(principal : Principal) : async ?PlayerStats {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view player statistics");
        };

        let progress = principalMap.get(userProgress, principal);
        let profile = principalMap.get(userProfiles, principal);

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
