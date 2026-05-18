// Migration from the old (pre-2.5.0) mo:core/Map B-tree layout
// to the new mo:core/Map 2.5.0 layout, plus the chatMessages chunked
// list layout to the new core List layout.
//
// The "old" types here mirror exactly what's recorded in
// `.old/src/backend/dist/backend.most` for the deployed canister.
// We can't import the old core/Map module (it no longer exists in
// 2.5.0), so we re-declare the structural shape and iterate it
// manually, then re-insert each entry into a freshly created Map
// of the new type.

import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {

  // ---------------------------------------------------------------
  // Old layout structural types (from .old/backend.most)
  // ---------------------------------------------------------------

  type OldData<K, V> = { var count : Nat; kvs : [var ?(K, V)] };

  type OldNode<K, V> = {
    #internal : { children : [var ?OldNode<K, V>]; data : OldData<K, V> };
    #leaf : { data : OldData<K, V> };
  };

  type OldMap<K, V> = { var root : OldNode<K, V>; var size : Nat };

  type OldChatBlockList<T> = {
    var blockIndex : Nat;
    var blocks : [var [var ?T]];
    var elementIndex : Nat;
  };

  // ---------------------------------------------------------------
  // App-level record types (must match main.mo exactly)
  // ---------------------------------------------------------------

  type UserProgress = {
    xp : Nat;
    level : Nat;
    highestHeight : Nat;
    clouds : Nat;
    prestige : Nat;
  };

  type UserProfile = { name : Text; joinedAt : Int };

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

  // ---------------------------------------------------------------
  // In-order iteration over the old B-tree, calling `f` on each
  // key-value pair.
  // ---------------------------------------------------------------

  func iterOldMap<K, V>(m : OldMap<K, V>, f : (K, V) -> ()) {
    visit<K, V>(m.root, f);
  };

  func visit<K, V>(n : OldNode<K, V>, f : (K, V) -> ()) {
    switch (n) {
      case (#leaf leaf) {
        visitData<K, V>(leaf.data, f);
      };
      case (#internal node) {
        // For a B-tree with n entries, there are n+1 children. We
        // interleave children[i], data[i], ..., data[n-1], children[n].
        let count = node.data.count;
        var i = 0;
        while (i < count) {
          switch (node.children[i]) {
            case (?c) { visit<K, V>(c, f) };
            case null {};
          };
          switch (node.data.kvs[i]) {
            case (?(k, v)) { f(k, v) };
            case null {};
          };
          i += 1;
        };
        // Trailing child after the last data entry
        if (node.children.size() > count) {
          switch (node.children[count]) {
            case (?c) { visit<K, V>(c, f) };
            case null {};
          };
        };
      };
    };
  };

  func visitData<K, V>(d : OldData<K, V>, f : (K, V) -> ()) {
    let count = d.count;
    var i = 0;
    while (i < count) {
      switch (d.kvs[i]) {
        case (?(k, v)) { f(k, v) };
        case null {};
      };
      i += 1;
    };
  };

  // ---------------------------------------------------------------
  // Per-key-type migration helpers (needed because Map.add requires
  // a concrete compare function).
  // ---------------------------------------------------------------

  func migrateTextMap<V>(old : OldMap<Text, V>) : Map.Map<Text, V> {
    let m = Map.empty<Text, V>();
    iterOldMap<Text, V>(old, func(k, v) { Map.add(m, Text.compare, k, v) });
    m;
  };

  func migratePrincipalMap<V>(old : OldMap<Principal, V>) : Map.Map<Principal, V> {
    let m = Map.empty<Principal, V>();
    iterOldMap<Principal, V>(old, func(k, v) { Map.add(m, Principal.compare, k, v) });
    m;
  };

  func migrateChatList(old : OldChatBlockList<ChatMessage>) : List.List<ChatMessage> {
    let l = List.empty<ChatMessage>();
    var b = 0;
    while (b < old.blockIndex) {
      let block = old.blocks[b];
      var i = 0;
      while (i < block.size()) {
        switch (block[i]) {
          case (?msg) { List.add(l, msg) };
          case null {};
        };
        i += 1;
      };
      b += 1;
    };
    // The last (partially filled) block
    if (old.blockIndex < old.blocks.size()) {
      let lastBlock = old.blocks[old.blockIndex];
      var i = 0;
      while (i < old.elementIndex and i < lastBlock.size()) {
        switch (lastBlock[i]) {
          case (?msg) { List.add(l, msg) };
          case null {};
        };
        i += 1;
      };
    };
    l;
  };

  // Deployed shape: `{var adminAssigned : Bool; userRoles : OldMap<Principal, AccessControl.UserRole>}`
  // The deployed canister stored `userRoles` as immutable, and the
  // current library type also expects it immutable.
  type OldAccessControlState = {
    var adminAssigned : Bool;
    userRoles : OldMap<Principal, AccessControl.UserRole>;
  };

  func migrateAccessControlState(old : OldAccessControlState) : AccessControl.AccessControlState {
    {
      var adminAssigned = old.adminAssigned;
      userRoles = migratePrincipalMap<AccessControl.UserRole>(old.userRoles);
    };
  };

  // ---------------------------------------------------------------
  // Old/new actor shapes used by `(with migration = run)`.
  // ---------------------------------------------------------------

  type OldActor = {
    var highScores : OldMap<Text, Nat>;
    var userProgress : OldMap<Principal, UserProgress>;
    var userProfiles : OldMap<Principal, UserProfile>;
    var uniquePlayers : OldMap<Principal, ()>;
    var chatMessages : OldChatBlockList<ChatMessage>;
    var clans : OldMap<Text, Clan>;
    var userClans : OldMap<Principal, Text>;
    accessControlState : OldAccessControlState;
  };

  type NewActor = {
    var highScores : Map.Map<Text, Nat>;
    var userProgress : Map.Map<Principal, UserProgress>;
    var userProfiles : Map.Map<Principal, UserProfile>;
    var uniquePlayers : Map.Map<Principal, ()>;
    var chatMessages : List.List<ChatMessage>;
    var clans : Map.Map<Text, Clan>;
    var userClans : Map.Map<Principal, Text>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    {
      var highScores = migrateTextMap<Nat>(old.highScores);
      var userProgress = migratePrincipalMap<UserProgress>(old.userProgress);
      var userProfiles = migratePrincipalMap<UserProfile>(old.userProfiles);
      var uniquePlayers = migratePrincipalMap<()>(old.uniquePlayers);
      var chatMessages = migrateChatList(old.chatMessages);
      var clans = migrateTextMap<Clan>(old.clans);
      var userClans = migratePrincipalMap<Text>(old.userClans);
      accessControlState = migrateAccessControlState(old.accessControlState);
    };
  };
};
